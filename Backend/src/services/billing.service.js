const ApiError = require('../helpers/ApiError');
const SaleBill = require('../models/billing/SaleBill');
const SaleItem = require('../models/billing/SaleItem');
const InventoryPiece = require('../models/InventoryPiece');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const Payment = require('../models/payments/Payment');
const PaymentTransaction = require('../models/payments/PaymentTransaction');
const Customer = require('../models/crm/Customer');
const CustomerLedger = require('../models/ledger/CustomerLedger');
const LoyaltyService = require('./loyalty.service');
const { INVENTORY_STATUS, LIFECYCLE_EVENT, BILL_STATUS, PAYMENT_MODE, LEDGER_TYPE } = require('../constants/status');
const { formatExportData } = require('../helpers/export.helper');

class BillingService {
  /**
   * Create Retail Checkout Sale Bill with Auto Customer creation option
   */
  static async createSaleBill(billData, userId, tenantId) {
    let customer = null;
    if (billData.customerId && billData.customerId !== 'c-walkin') {
      customer = await Customer.findOne({ _id: billData.customerId, tenantId });
    } else if (billData.customerPhone && billData.customerPhone !== 'N/A' && billData.customerPhone !== '') {
      customer = await Customer.findOne({ phone: billData.customerPhone, tenantId });
      if (!customer) {
        customer = await Customer.create({
          tenantId,
          name: billData.customerName || 'Walk-in Customer',
          phone: billData.customerPhone,
          createdBy: userId
        });
      }
    }


    // customer will simply remain null for true walk-ins.

    let subTotal = 0;
    let totalDiscount = 0;
    const validatedPieces = [];
    const Product = require('../models/Product');
    const Firm = require('../models/masters/Firm');
    const Warehouse = require('../models/masters/Warehouse');

    const rawItems = (Array.isArray(billData.barcodes) && billData.barcodes.length > 0)
      ? billData.barcodes
      : (Array.isArray(billData.items) && billData.items.length > 0 ? billData.items : []);

    if (rawItems.length === 0) {
      rawItems.push({
        barcode: `BC-${Date.now()}`,
        sellingPrice: Number(billData.grandTotal || billData.subTotal || 100),
        discountAmount: Number(billData.discountAmount || 0)
      });
    }

    let firmId = (typeof billData.firmId === 'string' && billData.firmId.length === 24) ? billData.firmId : null;
    if (!firmId) {
      const defaultFirm = await Firm.findOne({ isDeleted: false });
      firmId = defaultFirm ? defaultFirm._id : null;
    }

    let warehouseId = (typeof billData.warehouseId === 'string' && billData.warehouseId.length === 24) ? billData.warehouseId : null;
    if (!warehouseId) {
      const defaultWh = await Warehouse.findOne({ isDeleted: false });
      warehouseId = defaultWh ? defaultWh._id : null;
    }

    let defaultPrd = await Product.findOne({ isDeleted: false });

    // 1. Validate all scanned barcodes (resolving existing AVAILABLE inventory pieces first)
    for (const item of rawItems) {
      const itemBarcode = item.barcode || item.itemCode || item.uniqueCode;
      const targetProductId = (typeof item.productId === 'string' && item.productId.length === 24)
        ? item.productId
        : null;

      let piece = null;

      // 1.1 Try finding an AVAILABLE InventoryPiece matching exact barcode or uniqueCode
      if (itemBarcode) {
        piece = await InventoryPiece.findOne({
          tenantId,
          barcode: itemBarcode,
          status: INVENTORY_STATUS.AVAILABLE,
          isDeleted: false
        });

        if (!piece) {
          piece = await InventoryPiece.findOne({
            tenantId,
            uniqueCode: itemBarcode,
            status: INVENTORY_STATUS.AVAILABLE,
            isDeleted: false
          });
        }
      }

      // 1.2 If not found by exact barcode, find the oldest AVAILABLE InventoryPiece for this productId!
      if (!piece && targetProductId) {
        piece = await InventoryPiece.findOne({
          tenantId,
          productId: targetProductId,
          status: INVENTORY_STATUS.AVAILABLE,
          isDeleted: false
        }).sort({ createdAt: 1 });
      }

      // 1.3 If still not found, search Product master by itemCode/barcode to find Product ID & its AVAILABLE piece
      if (!piece && itemBarcode) {
        const matchingProduct = await Product.findOne({
          tenantId,
          isDeleted: false,
          $or: [
            { itemCode: itemBarcode },
            { barcode: itemBarcode },
            { designNo: itemBarcode }
          ]
        });

        if (matchingProduct) {
          piece = await InventoryPiece.findOne({
            tenantId,
            productId: matchingProduct._id,
            status: INVENTORY_STATUS.AVAILABLE,
            isDeleted: false
          }).sort({ createdAt: 1 });
        }
      }

      // 1.4 Fallback: Any piece matching barcode/uniqueCode even if not marked AVAILABLE
      if (!piece && itemBarcode) {
        piece = await InventoryPiece.findOne({
          tenantId,
          isDeleted: false,
          $or: [{ barcode: itemBarcode }, { uniqueCode: itemBarcode }]
        });
      }

      // 1.5 Final Fallback: Auto-create piece ONLY if no piece or product inventory exists at all
      if (!piece) {
        const fallbackBarcode = itemBarcode || `BC-${Date.now()}`;
        const prd = targetProductId
          ? await Product.findOne({ _id: targetProductId, tenantId })
          : await Product.findOne({
            tenantId,
            $or: [
              { barcode: fallbackBarcode },
              { itemCode: fallbackBarcode }
            ]
          }) || defaultPrd;

        piece = await InventoryPiece.create({
          tenantId,
          productId: prd ? prd._id : undefined,
          firmId: firmId || undefined,
          warehouseId: warehouseId || undefined,
          barcode: fallbackBarcode,
          uniqueCode: fallbackBarcode,
          ipn: prd?.ipn || `IPN-${Date.now()}`,
          mrp: item.sellingPrice || item.price || prd?.sellingPrice || prd?.mrp || 100,
          purchaseRate: prd?.purchasePrice || 0,
          status: INVENTORY_STATUS.AVAILABLE,
          size: item.size || 'FS',
          primaryColor: item.color || 'Standard',
          createdBy: userId
        });
      }

      // Ensure piece is linked to a Product document
      if (!piece.productId) {
        const prd = targetProductId
          ? await Product.findOne({ _id: targetProductId, tenantId })
          : await Product.findOne({
            tenantId,
            $or: [
              { barcode: itemBarcode },
              { itemCode: itemBarcode },
              { uniqueCode: itemBarcode }
            ]
          }) || defaultPrd;
        if (prd) {
          piece.productId = prd._id;
          await piece.save();
        }
      }

      const sellingPrice = item.sellingPrice || piece.mrp || 0;
      const discount = item.discountAmount || 0;
      const finalPrice = Math.max(0, sellingPrice - discount);

      subTotal += sellingPrice;
      totalDiscount += discount;

      validatedPieces.push({
        piece,
        cartItemId: item.cartItemId,
        sellingPrice,
        discountAmount: discount,
        finalPrice
      });
    }

    let grandTotal = Math.max(0, subTotal - totalDiscount);

    let manualDiscountAmount = 0;
    let manualChargeAmount = 0;
    let manualAdjustmentReason = '';

    if (billData.billAdjustment && billData.billAdjustment.amount > 0) {
      if (billData.billAdjustment.operation === 'Discount') {
        manualDiscountAmount = Number(billData.billAdjustment.amount);
        grandTotal = Math.max(0, grandTotal - manualDiscountAmount);
      } else if (billData.billAdjustment.operation === 'Charge') {
        manualChargeAmount = Number(billData.billAdjustment.amount);
        grandTotal += manualChargeAmount;
      }
      manualAdjustmentReason = billData.billAdjustment.reason || '';
    }

    let totalPaid = 0;
    let dueAmount = 0;

    if (billData.paymentTransactions && billData.paymentTransactions.length) {
      billData.paymentTransactions.forEach(tx => {
        if (tx.mode !== PAYMENT_MODE.DUE) {
          totalPaid += Number(tx.amount || 0);
        }
      });
    }

    if (totalPaid < grandTotal) {
      dueAmount = grandTotal - totalPaid;
    }

    const billStatus = billData.isHold
      ? BILL_STATUS.PENDING
      : (dueAmount > 0 ? BILL_STATUS.PARTIALLY_PAID : BILL_STATUS.COMPLETED);

    let salesmanId = (typeof billData.salesmanId === 'string' && billData.salesmanId.length === 24) ? billData.salesmanId : null;

    // 2. Create Sale Bill
    const saleBill = await SaleBill.create({
      tenantId,
      billNo: billData.billNo || `BILL-${Date.now()}`,
      billDate: billData.billDate || new Date(),
      customerId: customer ? customer._id : undefined,
      firmId,
      warehouseId,
      salesmanId,
      subTotal,
      discountAmount: totalDiscount,
      manualDiscountAmount,
      manualChargeAmount,
      manualAdjustmentReason,
      grandTotal,
      paidAmount: totalPaid,
      dueAmount,
      advanceApplied: Number(billData.advanceApplied || 0),
      paymentMethod: billData.paymentMethod || (billData.paymentTransactions && billData.paymentTransactions.length > 0 ? billData.paymentTransactions.map(t => t.mode).join(' + ') : (dueAmount > 0 ? "Credit" : "Cash")),
      status: billStatus,
      remarks: billData.remarks,
      isHold: Boolean(billData.isHold),
      createdBy: userId
    });

    // 3. Create SaleItems & update piece status if not hold
    const createdSaleItems = [];

    for (const val of validatedPieces) {
      const saleItem = await SaleItem.create({
        tenantId,
        saleBillId: saleBill._id,
        inventoryPieceId: val.piece._id,
        barcode: val.piece.barcode,
        uniqueCode: val.piece.uniqueCode || val.piece.barcode,
        mrp: val.piece.mrp,
        sellingPrice: val.sellingPrice,
        discountAmount: val.discountAmount,
        finalPrice: val.finalPrice,
        createdBy: userId
      });

      if (!billData.isHold) {
        val.piece.status = INVENTORY_STATUS.SOLD;
        val.piece.sold = true;
        val.piece.currentLocation = 'CUSTOMER';
        val.piece.updatedBy = userId;
        await val.piece.save();

        // 3.1 Synchronize Product stock & available quantity in MongoDB
        if (val.piece.productId) {
          await Product.updateOne(
            { _id: val.piece.productId },
            {
              $inc: {
                stock: -1,
                availableStock: -1,
                soldQuantity: 1
              }
            }
          );
        }

        await InventoryLifecycle.create({
          tenantId,
          inventoryPieceId: val.piece._id,
          barcode: val.piece.barcode,
          eventType: LIFECYCLE_EVENT.SALE,
          fromLocation: 'WAREHOUSE',
          toLocation: 'CUSTOMER',
          referenceId: saleBill._id,
          referenceModel: 'SaleBill',
          performedBy: userId,
          notes: `Sold in Bill No: ${saleBill.billNo}`
        });
      }

      createdSaleItems.push(saleItem);
    }

    // 4. Record Payments if completed/partially paid
    let payment = null;
    if (!billData.isHold && billData.paymentTransactions && billData.paymentTransactions.length) {
      let totalAdvanceApplied = 0;
      let totalPointsRedeemed = 0;

      for (const tx of billData.paymentTransactions) {
        const mode = String(tx.mode || '').toUpperCase();
        if (mode === 'ADVANCE') {
          totalAdvanceApplied += Number(tx.amount || 0);
        } else if (mode === 'POINTS' || mode === 'POINTS_REDEEM') {
          totalPointsRedeemed += Number(tx.amount || 0);
        }
      }

      payment = await Payment.create({
        tenantId,
        saleBillId: saleBill._id,
        customerId: customer ? customer._id : undefined,
        receiptNo: `PAY-${saleBill.billNo}`,
        totalAmount: totalPaid,
        advanceApplied: totalAdvanceApplied,
        createdBy: userId
      });

      for (const tx of billData.paymentTransactions) {
        await PaymentTransaction.create({
          tenantId,
          paymentId: payment._id,
          mode: tx.mode,
          amount: tx.amount,
          referenceNo: tx.referenceNo,
          notes: tx.notes,
          createdBy: userId
        });
      }

      if (totalAdvanceApplied > 0 && customer) {
        customer.walletAdvance = Math.max(0, (customer.walletAdvance || 0) - totalAdvanceApplied);
        customer.prepaidAdvance = Math.max(0, (customer.prepaidAdvance || 0) - totalAdvanceApplied);
        customer.advanceHistory = customer.advanceHistory || [];
        customer.advanceHistory.push({
          amount: -totalAdvanceApplied,
          reason: `Advance applied to Bill ${saleBill.billNo}`,
          date: new Date()
        });
        await customer.save();
      }

      if (totalPointsRedeemed > 0 && customer) {
        customer.loyaltyPoints = Math.max(0, (customer.loyaltyPoints || 0) - totalPointsRedeemed);
        await customer.save();
      }

      // Ledger entry
      if (dueAmount > 0) {
        if (!customer) throw new ApiError(400, 'Customer details are required for bills with due amounts.');
        customer.dueBalance += dueAmount;
        await customer.save();

        await CustomerLedger.create({
          tenantId,
          customerId: customer._id,
          type: LEDGER_TYPE.DUE,
          amount: dueAmount,
          balanceAfter: customer.dueBalance,
          referenceBillId: saleBill._id,
          remarks: `Due created for Bill No: ${saleBill.billNo}`,
          createdBy: userId
        });
      } else if (customer) {
        await CustomerLedger.create({
          tenantId,
          customerId: customer._id,
          type: LEDGER_TYPE.PAYMENT,
          amount: totalPaid,
          balanceAfter: customer.dueBalance,
          referenceBillId: saleBill._id,
          remarks: `Full Payment received for Bill No: ${saleBill.billNo}`,
          createdBy: userId
        });
      }
    }

    // 4b. Earn Loyalty Points for the customer based on their purchase
    if (customer && !billData.isHold) {
      try {
        // Fetch loyalty settings (stored as a simple JSON config in a well-known Customer doc or env)
        // Default: 1 point per ₹20 spent. rupeesPerPoint can be overridden by stored settings.
        let rupeesPerPoint = 20;
        let loyaltyEnabled = true;
        try {
          const TenantSettings = require('../models/masters/TenantSettings');
          const settings = await TenantSettings.findOne({ tenantId, key: 'loyalty_settings' });
          if (settings && settings.value) {
            loyaltyEnabled = settings.value.enabled !== false;
            rupeesPerPoint = Number(settings.value.rupeesPerPoint) || 20;
          }
        } catch (_) {
          // TenantSettings model may not exist yet — use defaults silently
        }

        if (loyaltyEnabled && rupeesPerPoint > 0) {
          const grandTotalForPoints = grandTotal; // Use the service-computed grandTotal, not billData.grandTotal
          const pointsEarned = Math.floor(grandTotalForPoints / rupeesPerPoint);
          if (pointsEarned > 0) {
            customer.loyaltyPoints = (customer.loyaltyPoints || 0) + pointsEarned;
            await customer.save();
            await CustomerLedger.create({
              tenantId,
              customerId: customer._id,
              type: LEDGER_TYPE.LOYALTY,
              amount: pointsEarned,
              balanceAfter: customer.loyaltyPoints,
              referenceBillId: saleBill._id,
              remarks: `Earned ${pointsEarned} loyalty points on Bill ${saleBill.billNo} (₹${grandTotalForPoints} / ₹${rupeesPerPoint} per point)`,
              createdBy: userId
            });
          }
        }
      } catch (loyaltyErr) {
        // Non-fatal: loyalty point earning should never block a bill from being created
        console.error('[BillingService] Failed to earn loyalty points:', loyaltyErr.message);
      }
    }

    // 5. Generate Alteration Bill if requested
    let alteration = null;
    if (billData.alterations && billData.alterations.length > 0) {
      const Alteration = require('../models/alteration/Alteration');
      const AlterationItem = require('../models/alteration/AlterationItem');
      const { ALTERATION_STATUS } = require('../constants/status');

      // Take details from the first alteration request for the header
      const altReq = billData.alterations[0];
      
      alteration = await Alteration.create({
        tenantId,
        alterationNo: `ALT-${saleBill.billNo.split('-')[1] || Date.now()}`,
        saleBillId: saleBill._id,
        customerId: customer ? customer._id : undefined,
        expectedDeliveryDate: altReq.expectedDeliveryDate,
        tailorName: altReq.tailorName || 'Default Tailor',
        priority: altReq.priority || 'Normal',
        trialDate: altReq.trialDate,
        totalCharges: billData.alterations.reduce((sum, a) => sum + (Number(a.charge) || 0), 0),
        status: ALTERATION_STATUS.RECEIVED,
        remarks: altReq.remarks,
        createdBy: userId
      });

      for (const altReqItem of billData.alterations) {
        // Find matching piece from validatedPieces
        const matchingVal = validatedPieces.find(v => 
          (altReqItem.cartItemId && v.cartItemId === altReqItem.cartItemId) ||
          v.piece.barcode === altReqItem.barcode || 
          v.piece.uniqueCode === altReqItem.barcode || 
          v.piece.itemCode === altReqItem.barcode
        );
        
        if (matchingVal) {
          await AlterationItem.create({
            tenantId,
            alterationId: alteration._id,
            inventoryPieceId: matchingVal.piece._id,
            pieceName: matchingVal.piece.product?.name || 'Altered Item',
            instructions: altReqItem.instructions,
            charge: altReqItem.charge || 0,
            alterationDetails: altReqItem.alterationDetails || [],
            measurements: altReqItem.measurements || {},
            createdBy: userId
          });

          // Also update inventory piece to show it's altered/at tailor
          matchingVal.piece.altered = true;
          matchingVal.piece.currentLocation = 'TAILOR_SHOP';
          await matchingVal.piece.save();
        }
      }
    }

    return {
      saleBill,
      customer,
      saleItemsCount: createdSaleItems.length,
      payment,
      alteration
    };
  }

  /**
   * Get Hold Bills
   */
  static async getHoldBills(tenantId) {
    return SaleBill.find({ tenantId, isHold: true, status: BILL_STATUS.PENDING, isDeleted: false })
      .populate('customerId salesmanId')
      .sort({ createdAt: -1 });
  }

  /**
   * Retrieve & Complete Hold Bill
   */
  static async retrieveHoldBill(billId, paymentData, userId, tenantId) {
    const bill = await SaleBill.findOne({ _id: billId, tenantId, isHold: true });
    if (!bill) throw new ApiError(404, 'Hold bill not found.');

    bill.isHold = false;
    bill.status = BILL_STATUS.COMPLETED;
    bill.updatedBy = userId;
    await bill.save();

    // Mark inventory pieces as SOLD
    const saleItems = await SaleItem.find({ saleBillId: billId, tenantId });
    for (const item of saleItems) {
      const piece = await InventoryPiece.findById(item.inventoryPieceId);
      if (piece) {
        piece.status = INVENTORY_STATUS.SOLD;
        piece.sold = true;
        piece.currentLocation = 'CUSTOMER';
        await piece.save();

        await InventoryLifecycle.create({
          tenantId,
          inventoryPieceId: piece._id,
          barcode: piece.barcode,
          eventType: LIFECYCLE_EVENT.SALE,
          fromLocation: 'WAREHOUSE',
          toLocation: 'CUSTOMER',
          referenceId: bill._id,
          referenceModel: 'SaleBill',
          performedBy: userId,
          notes: `Hold bill retrieved and completed: ${bill.billNo}`
        });
      }
    }

    return bill;
  }

  static async getSaleBills(query = {}, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (query.status) filter.status = query.status;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.salesmanId) filter.salesmanId = query.salesmanId;
    if (query.search) {
      filter.billNo = new RegExp(query.search, 'i');
    }
    if (query.startDate && query.endDate) {
      filter.billDate = { $gte: new Date(query.startDate), $lte: new Date(query.endDate) };
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const bills = await SaleBill.find(filter)
      .populate('customerId firmId warehouseId salesmanId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SaleBill.countDocuments(filter);

    // Enrich bills with SaleItems & uniqueCode tracking info
    const billIds = bills.map(b => b._id);
    const allSaleItems = await SaleItem.find({ saleBillId: { $in: billIds }, tenantId })
      .populate({
        path: 'inventoryPieceId',
        populate: { path: 'productId' }
      });

    const itemsByBill = new Map();
    allSaleItems.forEach(item => {
      const bId = item.saleBillId.toString();
      if (!itemsByBill.has(bId)) itemsByBill.set(bId, []);
      const piece = item.inventoryPieceId || {};
      const product = piece.productId || {};
      itemsByBill.get(bId).push({
        _id: item._id,
        inventoryPieceId: piece._id || item.inventoryPieceId,
        barcode: item.barcode || piece.barcode || '',
        uniqueCode: item.uniqueCode || piece.uniqueCode || piece.barcode || '',
        name: product.itemName || product.name || 'Garment Item',
        itemName: product.itemName || product.name || 'Garment Item',
        size: piece.size || product.size || 'FS',
        color: piece.primaryColor || product.color || 'Standard',
        mrp: item.mrp || 0,
        price: item.sellingPrice || 0,
        sellingPrice: item.sellingPrice || 0,
        discountAmount: item.discountAmount || 0,
        finalPrice: item.finalPrice || 0,
        quantity: 1
      });
    });

    // Fetch Payment and PaymentTransaction details for all bills to determine true paymentMethod
    const payments = billIds.length > 0 ? await Payment.find({ saleBillId: { $in: billIds }, tenantId }) : [];
    const paymentIds = payments.map(p => p._id);
    const transactions = paymentIds.length > 0 ? await PaymentTransaction.find({ paymentId: { $in: paymentIds }, tenantId }) : [];

    const paymentByBill = new Map();
    payments.forEach(p => {
      const bId = p.saleBillId.toString();
      const txs = transactions.filter(t => t.paymentId.toString() === p._id.toString());
      if (txs.length > 0) {
        const modeStr = txs.map(t => t.mode).join(' + ');
        paymentByBill.set(bId, { modeStr, txs, advanceApplied: p.advanceApplied });
      }
    });

    // Fetch Alterations for all bills
    const Alteration = require('../models/alteration/Alteration');
    const AlterationItem = require('../models/alteration/AlterationItem');
    const alterations = billIds.length > 0 ? await Alteration.find({ saleBillId: { $in: billIds }, tenantId }) : [];
    const alterationIds = alterations.map(a => a._id);
    const alterationItems = alterationIds.length > 0 ? await AlterationItem.find({ alterationId: { $in: alterationIds }, tenantId }) : [];

    const alterationByBill = new Map();
    alterations.forEach(alt => {
      const bId = alt.saleBillId.toString();
      const items = alterationItems.filter(ai => ai.alterationId.toString() === alt._id.toString());
      alterationByBill.set(bId, { alt, items });
    });

    const enrichedBills = bills.map(b => {
      const bObj = b.toObject();
      const bIdStr = b._id.toString();
      const pInfo = paymentByBill.get(bIdStr);
      let computedMode = bObj.paymentMethod;
      if (pInfo && pInfo.modeStr) {
        computedMode = pInfo.modeStr;
      } else if (bObj.advanceApplied > 0) {
        computedMode = `ADVANCE + ${bObj.paymentMethod || 'CASH'}`;
      }

      const altInfo = alterationByBill.get(bIdStr);
      let billItems = itemsByBill.get(bIdStr) || bObj.items || [];

      if (altInfo) {
        billItems = billItems.map(item => {
          const altItem = altInfo.items.find(ai => ai.inventoryPieceId.toString() === item.inventoryPieceId?.toString());
          if (altItem) {
            return {
              ...item,
              hasAlteration: true,
              alterationRecord: {
                tailorName: altInfo.alt.tailorName,
                deliveryDate: altInfo.alt.expectedDeliveryDate ? altInfo.alt.expectedDeliveryDate.toISOString().split('T')[0] : '',
                trialDate: altInfo.alt.trialDate ? altInfo.alt.trialDate.toISOString().split('T')[0] : '',
                priority: altInfo.alt.priority || 'Normal',
                alterationDetails: altItem.alterationDetails && altItem.alterationDetails.length > 0 ? altItem.alterationDetails : (altItem.instructions ? altItem.instructions.split(',') : []),
                measurements: altItem.measurements || {},
                specialInstructions: altInfo.alt.remarks
              }
            };
          }
          return item;
        });
      }

      return {
        ...bObj,
        paymentMethod: computedMode || (bObj.dueAmount > 0 ? "Credit" : "Cash"),
        paymentTransactions: pInfo?.txs || bObj.paymentTransactions,
        items: billItems
      };
    });

    return {
      bills: enrichedBills,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getSaleBillById(id, tenantId) {
    const bill = await SaleBill.findOne({ _id: id, tenantId, isDeleted: false })
      .populate('customerId firmId warehouseId salesmanId');
    if (!bill) throw new ApiError(404, 'Sale Bill not found.');

    const items = await SaleItem.find({ saleBillId: id, tenantId })
      .populate({
        path: 'inventoryPieceId',
        populate: { path: 'productId' }
      });

    const payments = await Payment.find({ saleBillId: id, tenantId });
    const paymentIds = payments.map(p => p._id);
    const transactions = paymentIds.length > 0 ? await PaymentTransaction.find({ paymentId: { $in: paymentIds }, tenantId }) : [];

    const advanceApplied = payments.reduce((acc, p) => acc + (p.advanceApplied || 0), 0) || (bill.advanceApplied || 0);
    const previouslyPaidAmount = transactions
      .filter(tx => tx.mode !== PAYMENT_MODE.DUE && tx.mode !== PAYMENT_MODE.ADVANCE && tx.mode !== 'Advance')
      .reduce((acc, tx) => acc + (tx.amount || 0), 0);

    const remainingAmount = Math.max(0, bill.grandTotal - advanceApplied - previouslyPaidAmount);

    return { bill, items, payment: payments[0] || null, payments, transactions, previouslyPaidAmount, advanceApplied, remainingAmount };
  }

  static async getBillPayments(billId, tenantId) {
    const saleBill = await SaleBill.findOne({ _id: billId, tenantId, isDeleted: false })
      .populate('customerId firmId warehouseId salesmanId');
    if (!saleBill) throw new ApiError(404, 'Sale Bill not found.');

    const payments = await Payment.find({ saleBillId: billId, tenantId }).sort({ createdAt: 1 });
    const paymentIds = payments.map(p => p._id);
    const transactions = paymentIds.length > 0
      ? await PaymentTransaction.find({ paymentId: { $in: paymentIds }, tenantId }).sort({ createdAt: 1 })
      : [];

    const advanceApplied = payments.reduce((acc, p) => acc + (p.advanceApplied || 0), 0) || (saleBill.advanceApplied || 0);
    const previouslyPaidAmount = transactions
      .filter(tx => tx.mode !== PAYMENT_MODE.DUE && tx.mode !== PAYMENT_MODE.ADVANCE && tx.mode !== 'Advance')
      .reduce((acc, tx) => acc + (tx.amount || 0), 0);

    const remainingAmount = Math.max(0, saleBill.grandTotal - advanceApplied - previouslyPaidAmount);

    return {
      saleBill,
      payments,
      transactions,
      previouslyPaidAmount,
      advanceApplied,
      remainingAmount
    };
  }

  static async recordBillPayment(billId, paymentData, userId, tenantId) {
    const saleBill = await SaleBill.findOne({ _id: billId, tenantId, isDeleted: false });
    if (!saleBill) throw new ApiError(404, 'Sale Bill not found.');

    const customer = await Customer.findOne({ _id: saleBill.customerId, tenantId });

    const rawTxs = paymentData.paymentTransactions || [];
    if (!rawTxs.length && !(paymentData.advanceApplied > 0)) {
      throw new ApiError(400, 'Payment transactions or advance allocation required.');
    }

    let newPaid = 0;
    let newAdvance = Number(paymentData.advanceApplied || 0);

    rawTxs.forEach(tx => {
      if (tx.mode === PAYMENT_MODE.ADVANCE || tx.mode === 'Advance') {
        newAdvance += Number(tx.amount || 0);
      } else if (tx.mode !== PAYMENT_MODE.DUE) {
        newPaid += Number(tx.amount || 0);
      }
    });

    // 1. Create Payment master
    const receiptNo = paymentData.receiptNo || `PAY-${saleBill.billNo}-${Date.now().toString().slice(-4)}`;
    const payment = await Payment.create({
      tenantId,
      saleBillId: saleBill._id,
      customerId: saleBill.customerId,
      receiptNo,
      totalAmount: newPaid,
      advanceApplied: newAdvance,
      remarks: paymentData.remarks || `Payment for Bill No: ${saleBill.billNo}`,
      createdBy: userId
    });

    // 2. Create PaymentTransaction records
    const createdTxs = [];
    for (const tx of rawTxs) {
      if (tx.amount > 0) {
        const txDoc = await PaymentTransaction.create({
          tenantId,
          paymentId: payment._id,
          mode: tx.mode,
          amount: tx.amount,
          referenceNo: tx.referenceNo || paymentData.referenceNo,
          notes: tx.notes || paymentData.remarks,
          createdBy: userId
        });
        createdTxs.push(txDoc);
      }
    }

    // 3. Recalculate totals across ALL payments
    const allPayments = await Payment.find({ saleBillId: billId, tenantId });
    const allPaymentIds = allPayments.map(p => p._id);
    const allTxs = await PaymentTransaction.find({ paymentId: { $in: allPaymentIds }, tenantId });

    const totalAdvanceSoFar = allPayments.reduce((acc, p) => acc + (p.advanceApplied || 0), 0);
    const totalPaidSoFar = allTxs
      .filter(tx => tx.mode !== PAYMENT_MODE.DUE && tx.mode !== PAYMENT_MODE.ADVANCE && tx.mode !== 'Advance')
      .reduce((acc, tx) => acc + (tx.amount || 0), 0);

    const dueAmount = Math.max(0, saleBill.grandTotal - totalPaidSoFar - totalAdvanceSoFar);
    const status = dueAmount === 0 ? BILL_STATUS.COMPLETED : BILL_STATUS.PARTIALLY_PAID;

    saleBill.paidAmount = totalPaidSoFar;
    saleBill.advanceApplied = totalAdvanceSoFar;
    saleBill.dueAmount = dueAmount;
    saleBill.status = status;
    saleBill.updatedBy = userId;
    await saleBill.save();

    // 4. Update Customer Advance Balance if newAdvance applied
    if (newAdvance > 0 && customer) {
      customer.walletAdvance = Math.max(0, (customer.walletAdvance || 0) - newAdvance);
      customer.prepaidAdvance = Math.max(0, (customer.prepaidAdvance || 0) - newAdvance);
      customer.advanceHistory = customer.advanceHistory || [];
      customer.advanceHistory.push({
        amount: -newAdvance,
        reason: `Advance applied to Bill ${saleBill.billNo}`,
        date: new Date()
      });
      await customer.save();
    }

    // 5. Update Customer Ledger
    if (customer && (newPaid > 0 || newAdvance > 0)) {
      customer.dueBalance = Math.max(0, customer.dueBalance - newPaid);
      await customer.save();

      await CustomerLedger.create({
        tenantId,
        customerId: customer._id,
        type: LEDGER_TYPE.PAYMENT,
        amount: newPaid + newAdvance,
        balanceAfter: customer.dueBalance,
        referenceBillId: saleBill._id,
        remarks: `Payment of ₹${newPaid + newAdvance} received for Bill ${saleBill.billNo}`,
        createdBy: userId
      });
    }

    return {
      saleBill,
      payment,
      transactions: createdTxs,
      previouslyPaidAmount: totalPaidSoFar,
      advanceApplied: totalAdvanceSoFar,
      remainingAmount: dueAmount
    };
  }

  /**
   * Cancel Sale Bill
   */
  static async cancelSaleBill(billId, userId, tenantId) {
    const bill = await SaleBill.findOne({ _id: billId, tenantId });
    if (!bill) throw new ApiError(404, 'Sale Bill not found.');

    if (bill.status === BILL_STATUS.CANCELLED) {
      throw new ApiError(400, 'Sale bill is already cancelled.');
    }

    bill.status = BILL_STATUS.CANCELLED;
    bill.updatedBy = userId;
    await bill.save();

    // Revert inventory pieces back to AVAILABLE
    const saleItems = await SaleItem.find({ saleBillId: billId, tenantId });
    for (const item of saleItems) {
      const piece = await InventoryPiece.findById(item.inventoryPieceId);
      if (piece) {
        piece.status = INVENTORY_STATUS.AVAILABLE;
        piece.sold = false;
        piece.currentLocation = 'WAREHOUSE';
        piece.updatedBy = userId;
        await piece.save();

        await InventoryLifecycle.create({
          tenantId,
          inventoryPieceId: piece._id,
          barcode: piece.barcode,
          eventType: LIFECYCLE_EVENT.STOCK_ADJUSTMENT,
          fromLocation: 'CUSTOMER',
          toLocation: 'WAREHOUSE',
          referenceId: bill._id,
          referenceModel: 'SaleBill',
          performedBy: userId,
          notes: `Bill Cancelled: ${bill.billNo}`
        });
      }
    }

    return bill;
  }

  /**
   * Delete Sale Bill (Hard Delete)
   */
  static async deleteSaleBill(billId, userId, tenantId) {
    const bill = await SaleBill.findOne({ _id: billId, tenantId });
    if (!bill) throw new ApiError(404, 'Sale Bill not found.');

    // If not already cancelled, revert inventory pieces back to AVAILABLE
    if (bill.status !== BILL_STATUS.CANCELLED) {
      const saleItems = await SaleItem.find({ saleBillId: billId, tenantId });
      for (const item of saleItems) {
        const piece = await InventoryPiece.findById(item.inventoryPieceId);
        if (piece) {
          piece.status = INVENTORY_STATUS.AVAILABLE;
          piece.sold = false;
          piece.currentLocation = 'WAREHOUSE';
          piece.updatedBy = userId;
          await piece.save();
        }
      }
    }

    // Delete associated items
    await SaleItem.deleteMany({ saleBillId: billId, tenantId });
    // Delete the bill itself
    await SaleBill.deleteOne({ _id: billId, tenantId });

    return { success: true, message: 'Sale Bill deleted successfully.' };
  }

  static async getReprintPayload(billId, tenantId) {
    return this.getSaleBillById(billId, tenantId);
  }

  static async exportSaleBills(query = {}, tenantId, format = 'csv') {
    const { bills } = await this.getSaleBills({ ...query, limit: 10000 }, tenantId);
    const exportData = bills.map(b => ({
      BillNo: b.billNo,
      BillDate: b.billDate,
      Customer: b.customerId?.name || '',
      CustomerPhone: b.customerId?.phone || '',
      GrandTotal: b.grandTotal,
      PaidAmount: b.paidAmount,
      DueAmount: b.dueAmount,
      Status: b.status,
      CreatedAt: b.createdAt
    }));
    return formatExportData(exportData, format);
  }
}

module.exports = BillingService;

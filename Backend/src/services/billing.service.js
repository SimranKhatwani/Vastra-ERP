const ApiError = require('../helpers/ApiError');
const SaleBill = require('../models/billing/SaleBill');
const SaleItem = require('../models/billing/SaleItem');
const InventoryPiece = require('../models/InventoryPiece');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const Payment = require('../models/payments/Payment');
const PaymentTransaction = require('../models/payments/PaymentTransaction');
const Customer = require('../models/crm/Customer');
const CustomerLedger = require('../models/ledger/CustomerLedger');
const { INVENTORY_STATUS, LIFECYCLE_EVENT, BILL_STATUS, PAYMENT_MODE, LEDGER_TYPE } = require('../constants/status');
const { formatExportData } = require('../helpers/export.helper');

class BillingService {
  /**
   * Create Retail Checkout Sale Bill with Auto Customer creation option
   */
  static async createSaleBill(billData, userId, tenantId) {
    let customer = null;
    if (billData.customerId) {
      customer = await Customer.findOne({ _id: billData.customerId, tenantId });
    } else if (billData.customerPhone) {
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

    if (!customer) {
      // Default cash walk-in customer
      customer = await Customer.findOne({ tenantId, phone: '9999999999' });
      if (!customer) {
        customer = await Customer.create({
          tenantId,
          name: 'Walk-in Customer',
          phone: '9999999999',
          createdBy: userId
        });
      }
    }

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

    // 1. Validate all scanned barcodes (with auto fallback and on-the-fly piece generation)
    for (const item of rawItems) {
      const itemBarcode = item.barcode || item.itemCode || item.uniqueCode || `BC-${Date.now()}`;
      let piece = await InventoryPiece.findOne({
        barcode: itemBarcode,
        isDeleted: false
      });

      if (!piece) {
        piece = await InventoryPiece.findOne({
          uniqueCode: itemBarcode,
          isDeleted: false
        });
      }

      if (!piece) {
        // Auto-create an InventoryPiece on the fly for POS checkout if not pre-registered
        const prd = await Product.findOne({
          $or: [
            { barcode: itemBarcode },
            { itemCode: itemBarcode },
            { _id: (typeof item.productId === 'string' && item.productId.length === 24) ? item.productId : null }
          ]
        }) || defaultPrd;

        piece = await InventoryPiece.create({
          tenantId,
          productId: prd ? prd._id : undefined,
          firmId: firmId || undefined,
          warehouseId: warehouseId || undefined,
          barcode: itemBarcode,
          uniqueCode: itemBarcode,
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
        const prd = await Product.findOne({
          $or: [
            { barcode: itemBarcode },
            { itemCode: itemBarcode },
            { uniqueCode: itemBarcode },
            { _id: (typeof item.productId === 'string' && item.productId.length === 24) ? item.productId : null }
          ]
        }) || defaultPrd;
        if (prd) {
          piece.productId = prd._id;
          await piece.save();
        }
      }

      if (piece.status !== INVENTORY_STATUS.AVAILABLE && !billData.isHold) {
        piece.status = INVENTORY_STATUS.AVAILABLE;
        await piece.save();
      }

      const sellingPrice = item.sellingPrice || piece.mrp || 0;
      const discount = item.discountAmount || 0;
      const finalPrice = Math.max(0, sellingPrice - discount);

      subTotal += sellingPrice;
      totalDiscount += discount;

      validatedPieces.push({
        piece,
        sellingPrice,
        discountAmount: discount,
        finalPrice
      });
    }

    const grandTotal = Math.max(0, subTotal - totalDiscount);

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
      customerId: customer._id,
      firmId,
      warehouseId,
      salesmanId,
      subTotal,
      discountAmount: totalDiscount,
      grandTotal,
      paidAmount: totalPaid,
      dueAmount,
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
      payment = await Payment.create({
        tenantId,
        saleBillId: saleBill._id,
        customerId: customer._id,
        receiptNo: `PAY-${saleBill.billNo}`,
        totalAmount: totalPaid,
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

      // Ledger entry
      if (dueAmount > 0) {
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
      } else {
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

    return {
      saleBill,
      customer,
      saleItemsCount: createdSaleItems.length,
      payment
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

    const enrichedBills = bills.map(b => {
      const bObj = b.toObject();
      return {
        ...bObj,
        items: itemsByBill.get(b._id.toString()) || bObj.items || []
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

    const payment = await Payment.findOne({ saleBillId: id, tenantId });
    const transactions = payment ? await PaymentTransaction.find({ paymentId: payment._id, tenantId }) : [];

    return { bill, items, payment, transactions };
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

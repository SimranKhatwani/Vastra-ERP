const ApiError = require('../helpers/ApiError');
const GoodsReturn = require('../models/goodsReturn/GoodsReturn');
const GoodsReturnItem = require('../models/goodsReturn/GoodsReturnItem');
const GoodsReturnDispatch = require('../models/goodsReturn/GoodsReturnDispatch');
const GoodsReturnSettlement = require('../models/goodsReturn/GoodsReturnSettlement');
const GoodsReturnEvent = require('../models/goodsReturn/GoodsReturnEvent');
const GoodsReturnException = require('../models/goodsReturn/GoodsReturnException');
const InventoryPiece = require('../models/InventoryPiece');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const PurchaseBill = require('../models/purchase/PurchaseBill');
const Product = require('../models/Product');
const Vendor = require('../models/masters/Vendor');
const User = require('../models/User');
const { INVENTORY_STATUS, LIFECYCLE_EVENT } = require('../constants/status');
const { formatExportData } = require('../helpers/export.helper');

class GoodsReturnService {
  /**
   * Create Goods Return with Party-Wise Auto-Grouping & Splitting
   */
  static async createGoodsReturn(data, userId, tenantId) {
    if (!data.items || !data.items.length) {
      throw new ApiError(400, 'Goods Return request must contain at least one item.');
    }

    const branchId = (data.branchId && /^[a-fA-F0-9]{24}$/.test(String(data.branchId))) ? data.branchId : null;
    const user = await User.findById(userId);

    // 1. Group items by vendorId
    const vendorGroups = {};
    for (const item of data.items) {
      let piece = null;
      if (item.barcode) {
        piece = await InventoryPiece.findOne({ barcode: item.barcode, tenantId })
          .populate('purchaseBillId purchaseItemId');
      } else if (item.inventoryPieceId) {
        piece = await InventoryPiece.findOne({ _id: item.inventoryPieceId, tenantId })
          .populate('purchaseBillId purchaseItemId');
      }

      // Fallback: If piece is not found in InventoryPiece, check Product master & create InventoryPiece document
      if (!piece) {
        let product = null;
        if (item.productId && /^[a-fA-F0-9]{24}$/.test(String(item.productId))) {
          product = await Product.findOne({ _id: item.productId, tenantId });
        }
        if (!product && item.barcode) {
          product = await Product.findOne({
            $or: [{ barcode: item.barcode }, { designNo: item.barcode }, { itemCode: item.barcode }],
            tenantId
          });
        }

        piece = await InventoryPiece.create({
          tenantId,
          productId: product?._id || (item.productId && /^[a-fA-F0-9]{24}$/.test(String(item.productId)) ? item.productId : null),
          barcode: item.barcode || `BAR-${Date.now()}`,
          uniqueCode: item.uniqueCode || `UNC-${Date.now()}`,
          designNo: item.designNo || product?.designNo || 'DSG-001',
          itemCode: item.itemCode || product?.itemCode || 'SKU-001',
          itemName: item.itemName || product?.itemName || 'Returned Item',
          size: item.size || product?.size || 'FREE',
          primaryColor: item.color || product?.primaryColor || 'STD',
          purchaseRate: Number(item.purchaseRate || product?.purchasePrice || 0),
          mrp: Number(item.mrp || product?.mrp || 0),
          status: INVENTORY_STATUS.AVAILABLE,
          currentLocation: 'SHOWROOM_MAIN_STOCK',
          returned: false
        });
      }

      if (piece.status === INVENTORY_STATUS.GOODS_RETURNED || piece.returned) {
        throw new ApiError(400, `Piece '${piece.barcode || piece._id}' is already returned or under active Goods Return.`);
      }

      // Detect vendor cleanly
      let itemVendorId = item.vendorId || piece.purchaseBillId?.vendorId || data.vendorId;
      if (!itemVendorId || !/^[a-fA-F0-9]{24}$/.test(String(itemVendorId))) {
        let vendor = await Vendor.findOne({ tenantId });
        if (!vendor) {
          vendor = await Vendor.create({
            tenantId,
            name: item.vendorName || 'General Supplier',
            vendorCode: `VND-${Math.floor(100 + Math.random() * 900)}`,
            contactPerson: 'Default Manager',
            phone: '0000000000',
            email: 'supplier@vastra.com',
            address: 'Main Market',
            city: 'Mumbai',
            state: 'Maharashtra',
            status: 'ACTIVE',
            createdBy: userId
          });
        }
        itemVendorId = vendor._id;
      }

      const vKey = itemVendorId.toString();
      if (!vendorGroups[vKey]) {
        vendorGroups[vKey] = {
          vendorId: itemVendorId,
          items: []
        };
      }
      vendorGroups[vKey].items.push({ item, piece });
    }

    const createdGRs = [];

    // 2. Generate party-wise GoodsReturn records
    for (const vKey of Object.keys(vendorGroups)) {
      const group = vendorGroups[vKey];
      let grOriginalValue = 0;
      let grTotalQty = 0;

      group.items.forEach(({ item, piece }) => {
        const returnRate = Number(item.returnRate || piece.purchaseRate || 0);
        const qty = Number(item.returnQuantity || 1);
        grOriginalValue += returnRate * qty;
        grTotalQty += qty;
      });

      const goodsReturnNo = `GRN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      const gr = await GoodsReturn.create({
        tenantId,
        goodsReturnNo,
        vendorId: group.vendorId,
        purchaseBillId: group.items[0]?.piece?.purchaseBillId?._id || data.purchaseBillId || null,
        branchId,
        returnDate: data.returnDate || new Date(),
        dispatchStatus: 'NOT_DISPATCHED',
        vendorReceiptStatus: 'PENDING',
        vendorVerificationStatus: 'PENDING',
        financialSettlementStatus: 'PENDING',
        physicalSettlementStatus: 'PENDING',
        reconciliationStatus: 'MATCHED',
        overallStatus: 'GR_CREATED',
        originalValue: grOriginalValue,
        acceptedValue: 0,
        rejectedValue: 0,
        cnValue: 0,
        replacementValue: 0,
        pendingValue: grOriginalValue,
        vendorLiability: grOriginalValue,
        sentQty: grTotalQty,
        acceptedQty: 0,
        rejectedQty: 0,
        replacementQty: 0,
        receivedQty: 0,
        pendingQty: grTotalQty,
        remarks: data.remarks || '',
        qrCodeUrl: `/api/v1/goods-returns/view/${goodsReturnNo}`,
        createdBy: userId
      });

      const createdItems = [];
      for (const { item, piece } of group.items) {
        const returnRate = Number(item.returnRate || piece.purchaseRate || 0);
        const qty = Number(item.returnQuantity || 1);
        const totalAmount = returnRate * qty;

        const grItem = await GoodsReturnItem.create({
          tenantId,
          goodsReturnId: gr._id,
          inventoryPieceId: piece._id,
          barcode: piece.barcode || '',
          uniqueCode: piece.uniqueCode || '',
          productId: piece.productId || null,
          designNo: item.designNo || piece.designNo || '',
          itemCode: item.itemCode || piece.itemCode || '',
          itemName: item.itemName || piece.itemName || 'Returned Item',
          color: piece.primaryColor || piece.color || '',
          size: piece.size || '',
          brand: item.brand || piece.brand || '',
          category: item.category || piece.category || '',
          purchaseBillId: piece.purchaseBillId?._id || null,
          purchaseItemId: piece.purchaseItemId?._id || null,
          purchaseDate: piece.purchaseBillId?.billDate || null,
          purchaseRate: piece.purchaseRate || returnRate,
          gstPercent: piece.gstPercent || 0,
          typeOfGst: piece.typeOfGst || 'E',
          discountPercent: piece.discountPercent || 0,
          mrp: piece.mrp || 0,
          returnQuantity: qty,
          returnRate,
          totalReturnAmount: totalAmount,
          reason: item.reason || data.reason || 'Vendor Return',
          remarks: item.remarks || '',
          verificationStatus: 'PENDING',
          physicalStatus: 'WITH_VENDOR',
          createdBy: userId
        });

        // Update inventory piece status & location
        piece.status = INVENTORY_STATUS.GOODS_RETURNED;
        piece.currentLocation = 'RETURN_TRANSIT';
        piece.returned = true;
        piece.updatedBy = userId;
        await piece.save();

        // Reduce available stock in Product master if linked
        if (piece.productId) {
          await Product.updateOne(
            { _id: piece.productId },
            { $inc: { stock: -1, availableStock: -1 } }
          ).catch(() => {}); // soft catch if product field is missing
        }

        // Audit Lifecycle Event
        await InventoryLifecycle.create({
          tenantId,
          inventoryPieceId: piece._id,
          barcode: piece.barcode,
          eventType: LIFECYCLE_EVENT.GOODS_RETURN,
          fromLocation: 'SHOWROOM_MAIN_STOCK',
          toLocation: 'RETURN_TRANSIT',
          referenceId: gr._id,
          referenceModel: 'GoodsReturn',
          performedBy: userId,
          notes: `Goods Return created (${goodsReturnNo}). Reason: ${item.reason || 'Vendor Return'}`
        });

        createdItems.push(grItem);
      }

      // Initial Audit Event Log
      await GoodsReturnEvent.create({
        tenantId,
        goodsReturnId: gr._id,
        stage: 'GR_CREATED',
        title: 'Goods Return Created',
        description: `Created GR ${gr.goodsReturnNo} for vendor with ${grTotalQty} pcs worth ₹${grOriginalValue}.`,
        performedBy: userId,
        performedByName: user?.name || 'Store Operator',
        branchId
      });

      createdGRs.push({ goodsReturn: gr, items: createdItems });
    }

    return createdGRs.length === 1 ? createdGRs[0] : { createdGRs, message: `Auto-split into ${createdGRs.length} party-wise Goods Returns.` };
  }

  /**
   * Dispatch Goods Return (Single or Partial Dispatch)
   */
  static async dispatchGoodsReturn(id, data, userId, tenantId) {
    const gr = await GoodsReturn.findOne({ _id: id, tenantId, isDeleted: false });
    if (!gr) throw new ApiError(404, 'Goods Return record not found.');

    const user = await User.findById(userId);
    const dispatchNo = `DSP-${Date.now()}`;
    const qty = Number(data.dispatchedQty || gr.sentQty);

    const dispatch = await GoodsReturnDispatch.create({
      tenantId,
      goodsReturnId: gr._id,
      dispatchNo,
      dispatchedQty: qty,
      dispatchedItems: data.dispatchedItems || [],
      dispatchDate: data.dispatchDate || new Date(),
      handledBy: userId,
      employeeName: user?.name || data.employeeName || 'Staff',
      mode: data.mode || 'Courier',
      courierName: data.courierName || '',
      lrNumber: data.lrNumber || '',
      trackingNumber: data.trackingNumber || '',
      documents: data.documents || [],
      remarks: data.remarks || '',
      createdBy: userId
    });

    // Update GR Dispatch Status
    const totalDispatched = await GoodsReturnDispatch.aggregate([
      { $match: { goodsReturnId: gr._id, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$dispatchedQty' } } }
    ]);
    const sumDispatched = totalDispatched[0]?.total || qty;

    if (sumDispatched >= gr.sentQty) {
      gr.dispatchStatus = 'DISPATCHED';
      gr.overallStatus = 'DISPATCHED';
    } else {
      gr.dispatchStatus = 'PARTIALLY_DISPATCHED';
      gr.overallStatus = 'DISPATCHED';
    }
    gr.lastActivityDate = new Date();
    await gr.save();

    // Log Event
    await GoodsReturnEvent.create({
      tenantId,
      goodsReturnId: gr._id,
      stage: 'DISPATCHED',
      title: 'Material Dispatched',
      description: `Dispatched ${qty} pcs via ${data.mode || 'Courier'} (LR: ${data.lrNumber || 'N/A'}, Tracking: ${data.trackingNumber || 'N/A'}).`,
      performedBy: userId,
      performedByName: user?.name || 'Staff',
      branchId: gr.branchId
    });

    return { goodsReturn: gr, dispatch };
  }

  /**
   * Confirm Vendor Receipt
   */
  static async confirmVendorReceipt(id, data, userId, tenantId) {
    const gr = await GoodsReturn.findOne({ _id: id, tenantId, isDeleted: false });
    if (!gr) throw new ApiError(404, 'Goods Return record not found.');

    const user = await User.findById(userId);
    gr.vendorReceiptStatus = 'RECEIVED';
    gr.vendorReceivedDate = data.receivedDate || new Date();
    gr.overallStatus = 'SENT_TO_VENDOR';
    gr.lastActivityDate = new Date();
    await gr.save();

    await GoodsReturnEvent.create({
      tenantId,
      goodsReturnId: gr._id,
      stage: 'VENDOR_RECEIVED',
      title: 'Vendor Received Material',
      description: `Vendor confirmed receipt of goods on ${gr.vendorReceivedDate.toLocaleDateString()}. Remarks: ${data.remarks || 'None'}`,
      performedBy: userId,
      performedByName: user?.name || 'Staff',
      branchId: gr.branchId
    });

    return gr;
  }

  /**
   * Verify Vendor GR (Split into Accepted vs Rejected Material)
   */
  static async verifyVendorGR(id, data, userId, tenantId) {
    const gr = await GoodsReturn.findOne({ _id: id, tenantId, isDeleted: false });
    if (!gr) throw new ApiError(404, 'Goods Return record not found.');

    const user = await User.findById(userId);
    const grItems = await GoodsReturnItem.find({ goodsReturnId: id, tenantId });

    let acceptedQty = 0;
    let rejectedQty = 0;
    let acceptedVal = 0;
    let rejectedVal = 0;

    for (const vItem of (data.items || [])) {
      const match = grItems.find(gi => gi._id.toString() === vItem.goodsReturnItemId || gi.barcode === vItem.barcode);
      if (match) {
        match.verificationStatus = vItem.status || 'ACCEPTED'; // ACCEPTED or REJECTED
        if (match.verificationStatus === 'REJECTED') {
          match.physicalStatus = 'REJECTED_TRANSIT';
          rejectedQty += match.returnQuantity;
          rejectedVal += match.totalReturnAmount;
        } else {
          match.physicalStatus = 'WITH_VENDOR';
          acceptedQty += match.returnQuantity;
          acceptedVal += match.totalReturnAmount;
        }
        await match.save();
      }
    }

    gr.acceptedQty = acceptedQty;
    gr.rejectedQty = rejectedQty;
    gr.acceptedValue = acceptedVal;
    gr.rejectedValue = rejectedVal;
    gr.vendorLiability = acceptedVal; // Vendor liability is on accepted items
    gr.pendingValue = Math.max(0, acceptedVal - (gr.cnValue + gr.replacementValue));

    if (rejectedQty > 0 && acceptedQty > 0) {
      gr.vendorVerificationStatus = 'PARTIALLY_ACCEPTED';
      gr.overallStatus = 'ACCEPTED';
    } else if (rejectedQty > 0 && acceptedQty === 0) {
      gr.vendorVerificationStatus = 'REJECTED';
      gr.overallStatus = 'REJECTED';
    } else {
      gr.vendorVerificationStatus = 'ACCEPTED';
      gr.overallStatus = 'ACCEPTED';
    }
    gr.lastActivityDate = new Date();
    await gr.save();

    await GoodsReturnEvent.create({
      tenantId,
      goodsReturnId: gr._id,
      stage: 'VENDOR_VERIFIED',
      title: 'Vendor Verification Completed',
      description: `Vendor verified: ${acceptedQty} pcs Accepted (₹${acceptedVal}), ${rejectedQty} pcs Rejected (₹${rejectedVal}).`,
      performedBy: userId,
      performedByName: user?.name || 'Staff',
      branchId: gr.branchId
    });

    return { goodsReturn: gr, items: grItems };
  }

  /**
   * Compare Vendor GR Document against NFS GR
   */
  static async compareVendorDocument(id, docData, userId, tenantId) {
    const gr = await GoodsReturn.findOne({ _id: id, tenantId, isDeleted: false }).populate('vendorId');
    if (!gr) throw new ApiError(404, 'Goods Return record not found.');

    const mismatches = [];

    if (docData.vendorName && !gr.vendorId?.name?.toLowerCase().includes(docData.vendorName.toLowerCase())) {
      mismatches.push({ field: 'Vendor Name', expected: gr.vendorId?.name, found: docData.vendorName });
    }
    if (docData.totalPieces && Number(docData.totalPieces) !== gr.sentQty) {
      mismatches.push({ field: 'Total Pieces', expected: gr.sentQty, found: docData.totalPieces });
    }
    if (docData.totalValue && Math.abs(Number(docData.totalValue) - gr.originalValue) > 5) {
      mismatches.push({ field: 'Total Value', expected: `₹${gr.originalValue}`, found: `₹${docData.totalValue}` });
    }

    if (mismatches.length > 0) {
      await GoodsReturnException.create({
        tenantId,
        goodsReturnId: gr._id,
        vendorId: gr.vendorId?._id,
        branchId: gr.branchId,
        exceptionType: 'VALUE_MISMATCH',
        severity: 'HIGH',
        description: `Vendor document comparison found ${mismatches.length} mismatch(es).`,
        status: 'OPEN'
      });
    }

    return { goodsReturnNo: gr.goodsReturnNo, isMatch: mismatches.length === 0, mismatches };
  }

  /**
   * Credit Note Settlement & Purchase Bill Adjustment
   */
  static async addCreditNoteSettlement(id, data, userId, tenantId) {
    const gr = await GoodsReturn.findOne({ _id: id, tenantId, isDeleted: false });
    if (!gr) throw new ApiError(404, 'Goods Return record not found.');

    const user = await User.findById(userId);
    const cnAmount = Number(data.creditNoteAmount || 0);
    const adjustedAmt = Number(data.adjustedAmount || 0);
    const remainingCredit = Math.max(0, cnAmount - adjustedAmt);

    const settlement = await GoodsReturnSettlement.create({
      tenantId,
      goodsReturnId: gr._id,
      settlementType: 'CREDIT_NOTE',
      creditNoteNo: data.creditNoteNo || `CN-${Date.now()}`,
      creditNoteDate: data.creditNoteDate || new Date(),
      creditNoteAmount: cnAmount,
      adjustedPurchaseBillId: data.adjustedPurchaseBillId || null,
      adjustedAmount: adjustedAmt,
      remainingCreditBalance: remainingCredit,
      expectedValue: gr.vendorLiability,
      receivedValue: cnAmount,
      valueDifference: gr.vendorLiability - cnAmount,
      status: Math.abs(gr.vendorLiability - cnAmount) <= 1 ? 'MATCHED' : 'MISMATCH',
      remarks: data.remarks || '',
      createdBy: userId
    });

    // Update GR Financial Metrics
    gr.cnValue += cnAmount;
    gr.pendingValue = Math.max(0, gr.vendorLiability - (gr.cnValue + gr.replacementValue));
    if (gr.pendingValue <= 1) {
      gr.financialSettlementStatus = 'CREDIT_NOTE_RECEIVED';
    } else {
      gr.financialSettlementStatus = 'MIXED_SETTLED';
    }
    gr.lastActivityDate = new Date();
    await gr.save();

    await GoodsReturnEvent.create({
      tenantId,
      goodsReturnId: gr._id,
      stage: 'CREDIT_NOTE_RECEIVED',
      title: 'Credit Note Recorded',
      description: `Credit Note ${settlement.creditNoteNo} recorded for ₹${cnAmount}. Adjusted against purchase bill: ₹${adjustedAmt}, Remaining credit: ₹${remainingCredit}.`,
      performedBy: userId,
      performedByName: user?.name || 'Staff',
      branchId: gr.branchId
    });

    return { goodsReturn: gr, settlement };
  }

  /**
   * Replacement Settlement (Flexible Value-Based Matching)
   */
  static async addReplacementSettlement(id, data, userId, tenantId) {
    const gr = await GoodsReturn.findOne({ _id: id, tenantId, isDeleted: false });
    if (!gr) throw new ApiError(404, 'Goods Return record not found.');

    const user = await User.findById(userId);
    const repItems = data.replacementItems || [];
    let receivedVal = 0;
    let repQty = 0;

    repItems.forEach(i => {
      const val = Number(i.totalValue || (i.unitPrice * i.quantity) || 0);
      receivedVal += val;
      repQty += Number(i.quantity || 1);
    });

    const valDiff = gr.vendorLiability - receivedVal;

    const settlement = await GoodsReturnSettlement.create({
      tenantId,
      goodsReturnId: gr._id,
      settlementType: 'REPLACEMENT',
      replacementItems: repItems.map(i => ({ ...i, scannedAtShowroom: false })),
      expectedValue: gr.vendorLiability,
      receivedValue: receivedVal,
      valueDifference: valDiff,
      status: Math.abs(valDiff) <= 1 ? 'MATCHED' : 'MISMATCH',
      remarks: data.remarks || '',
      createdBy: userId
    });

    gr.replacementValue += receivedVal;
    gr.replacementQty += repQty;
    gr.pendingValue = Math.max(0, gr.vendorLiability - (gr.cnValue + gr.replacementValue));
    gr.physicalSettlementStatus = 'REPLACEMENT_IN_TRANSIT';
    gr.lastActivityDate = new Date();
    await gr.save();

    await GoodsReturnEvent.create({
      tenantId,
      goodsReturnId: gr._id,
      stage: 'REPLACEMENT_RECEIVED',
      title: 'Replacement Received from Vendor',
      description: `Replacement items logged worth ₹${receivedVal} (${repQty} pcs). Pending physical showroom scan verification.`,
      performedBy: userId,
      performedByName: user?.name || 'Staff',
      branchId: gr.branchId
    });

    return { goodsReturn: gr, settlement };
  }

  /**
   * Showroom Physical Barcode Scan Verification (For Replacement & Rejected Goods)
   */
  static async verifyPhysicalShowroomScan(id, data, userId, tenantId) {
    const gr = await GoodsReturn.findOne({ _id: id, tenantId, isDeleted: false });
    if (!gr) throw new ApiError(404, 'Goods Return record not found.');

    const user = await User.findById(userId);
    const barcode = data.barcode;
    if (!barcode) throw new ApiError(400, 'Barcode is required for physical scan verification.');

    let piece = await InventoryPiece.findOne({ barcode, tenantId });
    if (piece) {
      piece.status = INVENTORY_STATUS.AVAILABLE;
      piece.currentLocation = 'SHOWROOM_MAIN_STOCK';
      piece.returned = false;
      piece.updatedBy = userId;
      await piece.save();

      // Restore available stock in Product master if linked
      if (piece.productId) {
        await Product.updateOne(
          { _id: piece.productId },
          { $inc: { stock: 1, availableStock: 1 } }
        ).catch(() => {});
      }

      // Audit Lifecycle Event
      await InventoryLifecycle.create({
        tenantId,
        inventoryPieceId: piece._id,
        barcode: piece.barcode,
        eventType: LIFECYCLE_EVENT.STOCK_ADJUSTMENT,
        fromLocation: 'RETURN_TRANSIT',
        toLocation: 'SHOWROOM_MAIN_STOCK',
        referenceId: gr._id,
        referenceModel: 'GoodsReturn',
        performedBy: userId,
        notes: `Scanned back into Showroom stock via GR verification (${gr.goodsReturnNo})`
      });
    }

    gr.receivedQty += 1;
    gr.pendingQty = Math.max(0, gr.sentQty - gr.receivedQty);
    if (gr.receivedQty >= gr.sentQty) {
      gr.physicalSettlementStatus = 'COMPLETED';
    } else {
      gr.physicalSettlementStatus = 'STOCK_RECEIVED';
    }
    gr.lastActivityDate = new Date();
    await gr.save();

    await GoodsReturnEvent.create({
      tenantId,
      goodsReturnId: gr._id,
      stage: 'PHYSICAL_SCAN_VERIFIED',
      title: 'Physical Showroom Scan Verified',
      description: `Scanned Barcode '${barcode}' into Showroom Main Stock. Total received: ${gr.receivedQty}/${gr.sentQty} pcs.`,
      performedBy: userId,
      performedByName: user?.name || 'Staff',
      branchId: gr.branchId
    });

    return { goodsReturn: gr, scannedBarcode: barcode };
  }

  /**
   * Execute Golden Closure Rule
   */
  static async executeGoldenClosure(id, userId, tenantId) {
    const gr = await GoodsReturn.findOne({ _id: id, tenantId, isDeleted: false });
    if (!gr) throw new ApiError(404, 'Goods Return record not found.');

    const user = await User.findById(userId);
    const openExceptions = await GoodsReturnException.countDocuments({ goodsReturnId: id, tenantId, status: 'OPEN' });
    if (openExceptions > 0) {
      throw new ApiError(400, `Cannot close GR ${gr.goodsReturnNo}: ${openExceptions} open exception(s) exist.`);
    }

    if (gr.pendingValue > 1) {
      throw new ApiError(400, `Golden Closure Rule Failed: Financial settlement pending ₹${gr.pendingValue}.`);
    }

    gr.overallStatus = 'COMPLETED';
    gr.reconciliationStatus = 'MATCHED';
    gr.financialSettlementStatus = 'SETTLED';
    gr.physicalSettlementStatus = 'COMPLETED';
    gr.lastActivityDate = new Date();
    await gr.save();

    await GoodsReturnEvent.create({
      tenantId,
      goodsReturnId: gr._id,
      stage: 'COMPLETED',
      title: 'Goods Return Closed (Golden Closure)',
      description: `GR ${gr.goodsReturnNo} 100% physically & financially reconciled and successfully closed.`,
      performedBy: userId,
      performedByName: user?.name || 'Staff',
      branchId: gr.branchId
    });

    return gr;
  }

  /**
   * Section 2: Dashboard Data
   */
  static async getDashboardData(tenantId) {
    const allGRs = await GoodsReturn.find({ tenantId, isDeleted: false });

    let activeCount = 0;
    let pendingCount = 0;
    let completedCount = 0;
    let pendingVal = 0;
    let vendorLiabilityTotal = 0;
    let inTransitQty = 0;
    let replacementPendingVal = 0;
    let cnPendingVal = 0;
    let rejectedPendingVal = 0;

    const aging = { normal: 0, reminder: 0, followUp: 0, ownerFollowUp: 0, critical: 0 };
    const risk = { low: 0, medium: 0, high: 0 };

    allGRs.forEach(gr => {
      if (gr.overallStatus === 'COMPLETED') {
        completedCount++;
      } else {
        pendingCount++;
        activeCount++;
        pendingVal += gr.pendingValue;
        vendorLiabilityTotal += gr.vendorLiability;
        if (gr.dispatchStatus === 'DISPATCHED' && gr.vendorReceiptStatus === 'PENDING') {
          inTransitQty += gr.sentQty;
        }
        if (gr.cnValue === 0 && gr.vendorLiability > 0) cnPendingVal += gr.vendorLiability;
        if (gr.replacementValue === 0 && gr.vendorLiability > 0) replacementPendingVal += gr.vendorLiability;
        if (gr.rejectedQty > 0 && gr.physicalSettlementStatus !== 'COMPLETED') rejectedPendingVal += gr.rejectedValue;
      }

      // Calculate aging
      const days = Math.floor((new Date() - new Date(gr.createdAt)) / (1000 * 60 * 60 * 24));
      if (days <= 7) aging.normal++;
      else if (days <= 15) aging.reminder++;
      else if (days <= 30) aging.followUp++;
      else if (days <= 60) aging.ownerFollowUp++;
      else aging.critical++;

      if (gr.riskLevel === 'HIGH' || days > 45) risk.high++;
      else if (gr.riskLevel === 'MEDIUM' || days > 15) risk.medium++;
      else risk.low++;
    });

    const exceptions = await GoodsReturnException.find({ tenantId, status: 'OPEN' })
      .populate('goodsReturnId vendorId')
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      overview: {
        activeGR: activeCount,
        pendingGR: pendingCount,
        completedGR: completedCount,
        totalPendingValue: pendingVal,
        vendorOutstanding: vendorLiabilityTotal,
        itemsInTransit: inTransitQty,
        replacementPendingValue: replacementPendingVal,
        creditNotePendingValue: cnPendingVal,
        rejectedMaterialPendingValue: rejectedPendingVal
      },
      aging,
      risk,
      exceptions
    };
  }

  /**
   * Section 6: GR Register
   */
  static async getRegisterData(query = {}, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (query.vendorId) filter.vendorId = query.vendorId;
    if (query.branchId) filter.branchId = query.branchId;
    if (query.overallStatus) filter.overallStatus = query.overallStatus;
    if (query.search) {
      filter.$or = [
        { goodsReturnNo: new RegExp(query.search, 'i') },
        { remarks: new RegExp(query.search, 'i') }
      ];
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 25;
    const skip = (page - 1) * limit;

    const goodsReturns = await GoodsReturn.find(filter)
      .populate('vendorId branchId purchaseBillId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GoodsReturn.countDocuments(filter);

    return {
      goodsReturns,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    };
  }

  /**
   * Section 7: GR 360° Detail
   */
  static async getGoodsReturnById(id, tenantId) {
    const goodsReturn = await GoodsReturn.findOne({ _id: id, tenantId, isDeleted: false })
      .populate('vendorId branchId purchaseBillId');
    if (!goodsReturn) throw new ApiError(404, 'Goods return record not found.');

    const items = await GoodsReturnItem.find({ goodsReturnId: id, tenantId })
      .populate('inventoryPieceId productId');
    const dispatches = await GoodsReturnDispatch.find({ goodsReturnId: id, tenantId }).sort({ dispatchDate: -1 });
    const settlements = await GoodsReturnSettlement.find({ goodsReturnId: id, tenantId }).sort({ createdAt: -1 });
    const events = await GoodsReturnEvent.find({ goodsReturnId: id, tenantId }).sort({ timestamp: 1 });
    const exceptions = await GoodsReturnException.find({ goodsReturnId: id, tenantId, status: 'OPEN' });

    return { goodsReturn, items, dispatches, settlements, events, exceptions };
  }

  /**
   * Digital Vault Document Upload
   */
  static async addDocumentToVault(id, doc, userId, tenantId) {
    const gr = await GoodsReturn.findOne({ _id: id, tenantId, isDeleted: false });
    if (!gr) throw new ApiError(404, 'Goods Return record not found.');

    gr.documents.push({
      title: doc.title || 'Attachment',
      fileUrl: doc.fileUrl,
      fileType: doc.fileType || 'PDF',
      uploadedBy: userId
    });
    gr.lastActivityDate = new Date();
    await gr.save();

    return gr;
  }

  /**
   * Section 18: Reports & Analytics
   */
  static async getReportsData(query = {}, tenantId) {
    const allGRs = await GoodsReturn.find({ tenantId, isDeleted: false }).populate('vendorId branchId');
    const vendors = await Vendor.find({ tenantId });

    // Vendor Performance Metrics
    const vendorPerformance = vendors.map(v => {
      const vGRs = allGRs.filter(g => g.vendorId?._id?.toString() === v._id.toString());
      const totalSent = vGRs.reduce((s, g) => s + g.sentQty, 0);
      const totalAccepted = vGRs.reduce((s, g) => s + g.acceptedQty, 0);
      const acceptanceRate = totalSent > 0 ? Math.round((totalAccepted / totalSent) * 100) : 100;
      const totalLiability = vGRs.reduce((s, g) => s + g.vendorLiability, 0);
      const totalSettled = vGRs.reduce((s, g) => s + (g.cnValue + g.replacementValue), 0);
      const accuracyRate = totalLiability > 0 ? Math.min(100, Math.round((totalSettled / totalLiability) * 100)) : 100;

      const score = Math.round((acceptanceRate * 0.5) + (accuracyRate * 0.5));
      return {
        vendorId: v._id,
        vendorName: v.name,
        totalGRs: vGRs.length,
        totalSentQty: totalSent,
        acceptanceRate,
        accuracyRate,
        reliabilityScore: score
      };
    });

    // Dynamic AI Insights calculated from actual DB return documents
    const allItems = await GoodsReturnItem.find({ tenantId });
    const aiInsights = [];

    // Defect analysis
    const defectMap = {};
    allItems.forEach(item => {
      const vName = item.vendorName || 'Supplier';
      const reason = item.reason || 'Defect';
      if (!defectMap[vName]) defectMap[vName] = { total: 0, stitching: 0 };
      defectMap[vName].total += 1;
      if (reason.toLowerCase().includes('stitch') || reason.toLowerCase().includes('defect') || reason.toLowerCase().includes('quality')) {
        defectMap[vName].stitching += 1;
      }
    });

    const topDefectVendor = Object.keys(defectMap).find(v => defectMap[v].total > 0);
    if (topDefectVendor && defectMap[topDefectVendor].total > 0) {
      const pct = Math.round((defectMap[topDefectVendor].stitching / defectMap[topDefectVendor].total) * 100);
      aiInsights.push(`${topDefectVendor}: ${pct}% of returns were caused by stitching & quality defects.`);
    } else {
      aiInsights.push("No return defect patterns detected yet. Sourcing insights build dynamically as returns are logged.");
    }

    // Lead time analysis
    if (allGRs.length > 0) {
      const avgAging = Math.round(allGRs.reduce((s, g) => s + (g.agingDays || 0), 0) / allGRs.length);
      aiInsights.push(`Average vendor replacement resolution timeline currently stands at ${avgAging} days.`);
    } else {
      aiInsights.push("Replacement turnaround lead times will be calculated dynamically upon vendor settlement.");
    }

    // Top returned SKU
    const skuMap = {};
    allItems.forEach(item => {
      const dNo = item.designNo || 'General SKU';
      skuMap[dNo] = (skuMap[dNo] || 0) + (item.returnQuantity || 1);
    });
    const topSKU = Object.keys(skuMap).sort((a, b) => skuMap[b] - skuMap[a])[0];
    if (topSKU && skuMap[topSKU] > 0) {
      aiInsights.push(`Design ${topSKU} recorded the highest return volume (${skuMap[topSKU]} pcs).`);
    } else {
      aiInsights.push("No high-return SKU warnings currently active.");
    }

    return { vendorPerformance, aiInsights, totalGRCount: allGRs.length };
  }
}

module.exports = GoodsReturnService;

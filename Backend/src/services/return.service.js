const ApiError = require('../helpers/ApiError');
const Return = require('../models/return/Return');
const ReturnItem = require('../models/return/ReturnItem');
const SaleBill = require('../models/billing/SaleBill');
const SaleItem = require('../models/billing/SaleItem');
const InventoryPiece = require('../models/InventoryPiece');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const Customer = require('../models/crm/Customer');
const CustomerLedger = require('../models/ledger/CustomerLedger');
const { INVENTORY_STATUS, LIFECYCLE_EVENT, LEDGER_TYPE } = require('../constants/status');
const { formatExportData } = require('../helpers/export.helper');

class ReturnService {
  /**
   * Return Validation Engine
   * Validates if piece can be returned based on barcode/uniqueCode, sale bill match, alteration status, discount rules.
   */
  static async validateReturn(barcode, uniqueCode, saleBillNo, tenantId) {
    const pieceQuery = { tenantId, isDeleted: false };
    if (barcode) pieceQuery.barcode = barcode;
    if (uniqueCode) pieceQuery.uniqueCode = uniqueCode;

    const piece = await InventoryPiece.findOne(pieceQuery).populate('productId');
    if (!piece) {
      return { valid: false, reason: 'Inventory piece not found.' };
    }

    if (!piece.sold) {
      return { valid: false, reason: 'Piece has not been marked as sold.' };
    }

    if (piece.altered) {
      return { valid: false, reason: 'Altered items are non-returnable as per store policy.' };
    }

    if (saleBillNo) {
      const saleBill = await SaleBill.findOne({ billNo: saleBillNo, tenantId });
      if (!saleBill) {
        return { valid: false, reason: 'Sale Bill not found.' };
      }
      const saleItem = await SaleItem.findOne({ saleBillId: saleBill._id, inventoryPieceId: piece._id, tenantId });
      if (!saleItem) {
        return { valid: false, reason: 'Item was not purchased under this Sale Bill.' };
      }

      return {
        valid: true,
        piece,
        saleBill,
        saleItem,
        refundableAmount: saleItem.finalPrice
      };
    }

    return {
      valid: true,
      piece,
      refundableAmount: piece.mrp
    };
  }

  static async createReturn(returnData, userId, tenantId) {
    let refundAmount = 0;

    if (!returnData.items || !returnData.items.length) {
      throw new ApiError(400, 'Return request must contain at least one item.');
    }

    for (const item of returnData.items) {
      const validation = await this.validateReturn(item.barcode, item.uniqueCode, returnData.saleBillNo, tenantId);
      if (!validation.valid && !returnData.forceApprove) {
        throw new ApiError(400, `Return validation failed for ${item.barcode}: ${validation.reason}`);
      }
      refundAmount += Number(item.refundRate || validation.refundableAmount || 0);
    }

    const returnDoc = await Return.create({
      tenantId,
      returnNo: returnData.returnNo || `RET-${Date.now()}`,
      saleBillId: returnData.saleBillId,
      saleBillNo: returnData.saleBillNo,
      customerId: returnData.customerId,
      refundAmount,
      refundMode: returnData.refundMode || 'CREDIT_NOTE',
      reason: returnData.reason,
      status: 'APPROVED',
      createdBy: userId
    });

    for (const item of returnData.items) {
      const piece = await InventoryPiece.findOne({ barcode: item.barcode, tenantId });
      if (!piece) {
        throw new ApiError(404, `Barcode '${item.barcode}' not found.`);
      }

      await ReturnItem.create({
        tenantId,
        returnId: returnDoc._id,
        inventoryPieceId: piece._id,
        refundRate: item.refundRate || piece.mrp,
        condition: item.condition || 'RESELLABLE',
        createdBy: userId
      });

      const newStatus = item.condition === 'RESELLABLE' ? INVENTORY_STATUS.AVAILABLE : INVENTORY_STATUS.DAMAGED;
      piece.status = newStatus;
      piece.returned = true;
      piece.sold = false;
      piece.currentLocation = 'WAREHOUSE';
      piece.updatedBy = userId;
      await piece.save();

      // Synchronize Product master stock in MongoDB
      if (piece.productId && item.condition === 'RESELLABLE') {
        const Product = require('../models/Product');
        await Product.updateOne(
          { _id: piece.productId },
          {
            $inc: {
              stock: 1,
              availableStock: 1,
              soldQuantity: -1
            }
          }
        );
      }

      await InventoryLifecycle.create({
        tenantId,
        inventoryPieceId: piece._id,
        barcode: piece.barcode,
        eventType: LIFECYCLE_EVENT.RETURN,
        fromLocation: 'CUSTOMER',
        toLocation: 'WAREHOUSE',
        referenceId: returnDoc._id,
        referenceModel: 'Return',
        performedBy: userId,
        notes: `Returned: ${returnData.reason || 'Customer Return'}`
      });
    }

    if (returnData.customerId && returnData.refundMode === 'ADD_TO_ADVANCE') {
      const customer = await Customer.findOne({ _id: returnData.customerId, tenantId });
      if (customer) {
        customer.walletAdvance = (customer.walletAdvance || 0) + refundAmount;
        customer.advanceBalance = (customer.advanceBalance || 0) + refundAmount; // Sync legacy field
        
        if (!customer.advanceHistory) customer.advanceHistory = [];
        customer.advanceHistory.push({
          amount: refundAmount,
          reason: `Added from Return No: ${returnDoc.returnNo}`,
          date: new Date()
        });
        
        await customer.save();

        await CustomerLedger.create({
          tenantId,
          customerId: customer._id,
          type: LEDGER_TYPE.REFUND,
          amount: refundAmount,
          balanceAfter: customer.walletAdvance,
          remarks: `Added to Wallet Advance for Return No: ${returnDoc.returnNo}`,
          createdBy: userId
        });
      }
    }

    if (returnData.saleBillId) {
      const saleBill = await SaleBill.findOne({ _id: returnData.saleBillId, tenantId });
      if (saleBill) {
        saleBill.hasReturn = true;
        saleBill.returnedAmount = (saleBill.returnedAmount || 0) + refundAmount;
        
        let allReturned = true;
        for (const item of returnData.items) {
          const piece = await InventoryPiece.findOne({ barcode: item.barcode, tenantId });
          if (piece) {
            const saleItem = await SaleItem.findOne({ saleBillId: saleBill._id, inventoryPieceId: piece._id, tenantId });
            if (saleItem) {
              saleItem.isReturned = true;
              saleItem.returnReason = returnData.reason;
              saleItem.returnedAt = new Date();
              await saleItem.save();
            }
          }
        }
        
        const allSaleItems = await SaleItem.find({ saleBillId: saleBill._id, tenantId });
        allReturned = allSaleItems.length > 0 && allSaleItems.every(si => si.isReturned);
        saleBill.status = allReturned ? 'RETURNED' : 'PARTIALLY_RETURNED';
        await saleBill.save();
      }
    }

    return returnDoc;
  }

  static async getReturns(query = {}, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (query.customerId) filter.customerId = query.customerId;
    if (query.search) filter.returnNo = new RegExp(query.search, 'i');

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const returns = await Return.find(filter)
      .populate('saleBillId customerId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Return.countDocuments(filter);

    return {
      returns,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getReturnById(returnId, tenantId) {
    const returnDoc = await Return.findOne({ _id: returnId, tenantId, isDeleted: false })
      .populate('saleBillId customerId');
    if (!returnDoc) throw new ApiError(404, 'Return record not found.');

    const items = await ReturnItem.find({ returnId, tenantId }).populate('inventoryPieceId');
    return { returnDoc, items };
  }

  static async exportReturns(query = {}, tenantId, format = 'csv') {
    const { returns } = await this.getReturns({ ...query, limit: 10000 }, tenantId);
    const exportData = returns.map(r => ({
      ReturnNo: r.returnNo,
      Customer: r.customerId?.name || '',
      RefundAmount: r.refundAmount,
      RefundMode: r.refundMode,
      Reason: r.reason,
      CreatedAt: r.createdAt
    }));
    return formatExportData(exportData, format);
  }
}

module.exports = ReturnService;

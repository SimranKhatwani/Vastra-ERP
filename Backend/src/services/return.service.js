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
  static async validateReturn(barcode, uniqueCode, saleBillNo, tenantId, inventoryPieceId) {
    const mongoose = require('mongoose');
    const pieceQuery = { tenantId, isDeleted: false };
    if (inventoryPieceId && mongoose.Types.ObjectId.isValid(inventoryPieceId)) {
      pieceQuery._id = inventoryPieceId;
    } else {
      const code = String(barcode || uniqueCode || '').trim();
      if (code) {
        const cleanCode = code.replace(/^UC-/i, '');
        pieceQuery.$or = [
          { barcode: code },
          { uniqueCode: code },
          { barcode: cleanCode },
          { uniqueCode: cleanCode },
          { barcode: `UC-${cleanCode}` },
          { uniqueCode: `UC-${cleanCode}` }
        ];
      }
    }

    let piece = (pieceQuery._id || pieceQuery.$or) ? await InventoryPiece.findOne(pieceQuery).populate('productId') : null;

    if (saleBillNo) {
      const saleBill = await SaleBill.findOne({ billNo: saleBillNo, tenantId });
      if (!saleBill) {
        return { valid: false, reason: 'Sale Bill not found.' };
      }

      let saleItem = null;
      if (piece) {
        saleItem = await SaleItem.findOne({ saleBillId: saleBill._id, inventoryPieceId: piece._id, tenantId });
      }

      if (!saleItem) {
        const code = String(barcode || uniqueCode || '').trim();
        const cleanCode = code.replace(/^UC-/i, '');
        saleItem = await SaleItem.findOne({
          saleBillId: saleBill._id,
          tenantId,
          $or: [
            { barcode: code },
            { uniqueCode: code },
            { barcode: cleanCode },
            { uniqueCode: cleanCode },
            { barcode: `UC-${cleanCode}` },
            { uniqueCode: `UC-${cleanCode}` }
          ]
        }).populate('inventoryPieceId');
        if (saleItem && saleItem.inventoryPieceId) {
          piece = saleItem.inventoryPieceId;
        }
      }

      if (saleItem) {
        if (saleItem.isReturned) {
          return { valid: false, reason: 'This item has already been returned.', isAlreadyReturned: true, saleBill, saleItem, piece };
        }
        if (saleItem.isExchanged) {
          return { valid: false, reason: 'This item has already been exchanged.', isAlreadyExchanged: true, saleBill, saleItem, piece };
        }
      }

      return {
        valid: true,
        piece: piece || null,
        saleBill,
        saleItem,
        refundableAmount: saleItem?.finalPrice || piece?.mrp || 0
      };
    }

    if (piece) {
      if (piece.status === INVENTORY_STATUS.RETURNED || piece.returned) {
        return { valid: false, reason: 'This item has already been returned.', isAlreadyReturned: true, piece };
      }
      if (piece.altered) {
        return { valid: false, reason: 'Altered items are non-returnable as per store policy.' };
      }
      return {
        valid: true,
        piece,
        refundableAmount: piece.mrp
      };
    }

    return {
      valid: true,
      piece: null,
      refundableAmount: 0
    };
  }

  static async createReturn(returnData, userId, tenantId) {
    const mongoose = require('mongoose');
    let refundAmount = 0;

    if (!returnData.items || !returnData.items.length) {
      throw new ApiError(400, 'Return request must contain at least one item.');
    }

    for (const item of returnData.items) {
      const validation = await this.validateReturn(item.barcode, item.uniqueCode, returnData.saleBillNo, tenantId, item.inventoryPieceId);
      if (!validation.valid && !returnData.forceApprove) {
        throw new ApiError(400, `Return validation failed for ${item.barcode}: ${validation.reason}`);
      }
      refundAmount += Number(item.refundRate || validation.refundableAmount || 0);
    }

    let validSaleBillId = null;
    if (returnData.saleBillId && mongoose.Types.ObjectId.isValid(returnData.saleBillId)) {
      validSaleBillId = returnData.saleBillId;
    } else if (returnData.saleBillNo) {
      const sb = await SaleBill.findOne({ billNo: returnData.saleBillNo, tenantId });
      if (sb) validSaleBillId = sb._id;
    }

    let validCustomerId = null;
    if (returnData.customerId && mongoose.Types.ObjectId.isValid(returnData.customerId)) {
      validCustomerId = returnData.customerId;
    } else if (returnData.customerId) {
      const cust = await Customer.findOne({ $or: [{ customerId: returnData.customerId }, { phone: returnData.customerId }], tenantId });
      if (cust) validCustomerId = cust._id;
    }

    const returnDoc = await Return.create({
      tenantId,
      returnNo: returnData.returnNo || `RET-${Date.now()}`,
      saleBillId: validSaleBillId,
      saleBillNo: returnData.saleBillNo,
      customerId: validCustomerId,
      refundAmount,
      refundMode: returnData.refundMode || 'CREDIT_NOTE',
      reason: returnData.reason,
      status: 'APPROVED',
      createdBy: userId
    });

    for (const item of returnData.items) {
      let piece = null;
      if (item.inventoryPieceId && mongoose.Types.ObjectId.isValid(item.inventoryPieceId)) {
        piece = await InventoryPiece.findOne({ _id: item.inventoryPieceId, tenantId });
      }

      if (!piece && (item.barcode || item.uniqueCode)) {
        const rawCode = String(item.barcode || item.uniqueCode).trim();
        const cleanCode = rawCode.replace(/^UC-/i, '');
        piece = await InventoryPiece.findOne({
          tenantId,
          $or: [
            { barcode: rawCode },
            { uniqueCode: rawCode },
            { barcode: cleanCode },
            { uniqueCode: cleanCode },
            { barcode: `UC-${cleanCode}` },
            { uniqueCode: `UC-${cleanCode}` }
          ]
        });
      }

      if (!piece && validSaleBillId) {
        const code = String(item.barcode || item.uniqueCode || '').trim();
        const cleanCode = code.replace(/^UC-/i, '');
        const saleItem = await SaleItem.findOne({
          saleBillId: validSaleBillId,
          tenantId,
          $or: [
            { barcode: code },
            { uniqueCode: code },
            { barcode: cleanCode },
            { uniqueCode: cleanCode },
            { barcode: `UC-${cleanCode}` },
            { uniqueCode: `UC-${cleanCode}` }
          ]
        }).populate('inventoryPieceId');
        if (saleItem && saleItem.inventoryPieceId) {
          piece = saleItem.inventoryPieceId;
        }
      }

      const invPieceIdToUse = piece ? piece._id : (item.inventoryPieceId && mongoose.Types.ObjectId.isValid(item.inventoryPieceId) ? item.inventoryPieceId : null);

      await ReturnItem.create({
        tenantId,
        returnId: returnDoc._id,
        inventoryPieceId: invPieceIdToUse,
        refundRate: item.refundRate || (piece ? piece.mrp : 0),
        condition: item.condition || 'RESELLABLE',
        createdBy: userId
      });

      if (piece) {
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
    }

    // Update SaleBill and SaleItem if matched
    if (validSaleBillId) {
      await SaleBill.updateOne(
        { _id: validSaleBillId, tenantId },
        {
          $set: { hasReturn: true },
          $inc: { returnedAmount: refundAmount }
        }
      );
      for (const item of returnData.items) {
        const code = String(item.barcode || item.uniqueCode || '').trim();
        const cleanCode = code.replace(/^UC-/i, '');
        if (code) {
          await SaleItem.updateMany(
            {
              saleBillId: validSaleBillId,
              tenantId,
              $or: [
                { barcode: code },
                { uniqueCode: code },
                { barcode: cleanCode },
                { uniqueCode: cleanCode },
                { barcode: `UC-${cleanCode}` },
                { uniqueCode: `UC-${cleanCode}` }
              ]
            },
            {
              $set: {
                isReturned: true,
                returnReason: returnData.reason || 'Customer Return',
                returnedAt: new Date()
              }
            }
          );
        }
      }
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
          let query = { tenantId };
          if (item.inventoryPieceId) {
            query._id = item.inventoryPieceId;
          } else if (item.barcode) {
            query.$or = [{ barcode: item.barcode }, { uniqueCode: item.barcode }];
          }
          const piece = await InventoryPiece.findOne(query);
          
          const invPieceIdToUse = item.inventoryPieceId || (piece ? piece._id : null);
          if (invPieceIdToUse) {
            const saleItem = await SaleItem.findOne({ saleBillId: saleBill._id, inventoryPieceId: invPieceIdToUse, tenantId });
            if (saleItem) {
              saleItem.isReturned = true;
              saleItem.returnReason = returnData.reason;
              saleItem.returnedAt = new Date();
              await saleItem.save();
            }
          }
          
          const remainingUnreturned = await SaleItem.countDocuments({ saleBillId: saleBill._id, isReturned: false, tenantId });
          if (remainingUnreturned > 0) {
            allReturned = false;
          }
        }
        
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

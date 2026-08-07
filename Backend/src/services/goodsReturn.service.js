const ApiError = require('../helpers/ApiError');
const GoodsReturn = require('../models/goodsReturn/GoodsReturn');
const GoodsReturnItem = require('../models/goodsReturn/GoodsReturnItem');
const InventoryPiece = require('../models/InventoryPiece');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const { INVENTORY_STATUS, LIFECYCLE_EVENT } = require('../constants/status');
const { formatExportData } = require('../helpers/export.helper');

class GoodsReturnService {
  static async createGoodsReturn(data, userId, tenantId) {
    let totalAmount = 0;

    if (!data.items || !data.items.length) {
      throw new ApiError(400, 'Goods Return request must contain at least one item.');
    }

    data.items.forEach(item => {
      totalAmount += Number(item.returnRate || 0);
    });

    const goodsReturn = await GoodsReturn.create({
      tenantId,
      goodsReturnNo: data.goodsReturnNo || `GRN-${Date.now()}`,
      vendorId: data.vendorId,
      purchaseBillId: data.purchaseBillId || null,
      totalAmount,
      remarks: data.remarks,
      createdBy: userId
    });

    const createdItems = [];

    for (const item of data.items) {
      const piece = await InventoryPiece.findOne({ barcode: item.barcode, tenantId });
      if (!piece) {
        throw new ApiError(404, `Barcode '${item.barcode}' not found.`);
      }

      const grItem = await GoodsReturnItem.create({
        tenantId,
        goodsReturnId: goodsReturn._id,
        inventoryPieceId: piece._id,
        returnRate: item.returnRate || piece.purchaseRate,
        reason: item.reason || 'Vendor Return',
        createdBy: userId
      });

      piece.status = INVENTORY_STATUS.GOODS_RETURNED;
      piece.currentLocation = 'RETURNED_TO_VENDOR';
      piece.updatedBy = userId;
      await piece.save();

      await InventoryLifecycle.create({
        tenantId,
        inventoryPieceId: piece._id,
        barcode: piece.barcode,
        eventType: LIFECYCLE_EVENT.GOODS_RETURN,
        fromLocation: 'WAREHOUSE',
        toLocation: 'VENDOR',
        referenceId: goodsReturn._id,
        referenceModel: 'GoodsReturn',
        performedBy: userId,
        notes: `Returned to Vendor. Reason: ${item.reason || 'Goods Return'}`
      });

      createdItems.push(grItem);
    }

    return { goodsReturn, items: createdItems };
  }

  static async getGoodsReturns(query = {}, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (query.vendorId) filter.vendorId = query.vendorId;
    if (query.search) filter.goodsReturnNo = new RegExp(query.search, 'i');

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const goodsReturns = await GoodsReturn.find(filter)
      .populate('vendorId purchaseBillId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GoodsReturn.countDocuments(filter);

    return {
      goodsReturns,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getGoodsReturnById(id, tenantId) {
    const goodsReturn = await GoodsReturn.findOne({ _id: id, tenantId, isDeleted: false })
      .populate('vendorId purchaseBillId');
    if (!goodsReturn) throw new ApiError(404, 'Goods return record not found.');

    const items = await GoodsReturnItem.find({ goodsReturnId: id, tenantId })
      .populate('inventoryPieceId');

    return { goodsReturn, items };
  }

  static async exportGoodsReturns(query = {}, tenantId, format = 'csv') {
    const { goodsReturns } = await this.getGoodsReturns({ ...query, limit: 10000 }, tenantId);
    const exportData = goodsReturns.map(gr => ({
      GoodsReturnNo: gr.goodsReturnNo,
      Vendor: gr.vendorId?.name || '',
      TotalAmount: gr.totalAmount,
      Remarks: gr.remarks || '',
      CreatedAt: gr.createdAt
    }));
    return formatExportData(exportData, format);
  }
}

module.exports = GoodsReturnService;

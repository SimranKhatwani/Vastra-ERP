const ApiError = require('../helpers/ApiError');
const Exchange = require('../models/exchange/Exchange');
const InventoryPiece = require('../models/InventoryPiece');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const { INVENTORY_STATUS, LIFECYCLE_EVENT } = require('../constants/status');
const { formatExportData } = require('../helpers/export.helper');

class ExchangeService {
  static async createExchange(exchangeData, userId, tenantId) {
    const returnedPiece = await InventoryPiece.findOne({ barcode: exchangeData.returnedBarcode, tenantId });
    if (!returnedPiece) {
      throw new ApiError(404, `Returned item with barcode '${exchangeData.returnedBarcode}' not found.`);
    }

    const newPiece = await InventoryPiece.findOne({ barcode: exchangeData.newBarcode, tenantId });
    if (!newPiece) {
      throw new ApiError(404, `New item with barcode '${exchangeData.newBarcode}' not found.`);
    }

    if (newPiece.status !== INVENTORY_STATUS.AVAILABLE) {
      throw new ApiError(400, `New item '${exchangeData.newBarcode}' is not available for sale.`);
    }

    const returnedValue = exchangeData.returnedValue || returnedPiece.mrp;
    const newItemValue = exchangeData.newItemValue || newPiece.mrp;
    const netDifference = newItemValue - returnedValue;

    const exchange = await Exchange.create({
      tenantId,
      exchangeNo: exchangeData.exchangeNo || `EXC-${Date.now()}`,
      originalBillId: exchangeData.originalBillId,
      customerId: exchangeData.customerId,
      returnedValue,
      newItemValue,
      netDifference,
      remarks: exchangeData.remarks,
      createdBy: userId
    });

    // Update returned piece status
    returnedPiece.status = INVENTORY_STATUS.AVAILABLE;
    returnedPiece.sold = false;
    returnedPiece.returned = true;
    await returnedPiece.save();

    await InventoryLifecycle.create({
      tenantId,
      inventoryPieceId: returnedPiece._id,
      barcode: returnedPiece.barcode,
      eventType: LIFECYCLE_EVENT.EXCHANGE,
      fromLocation: 'CUSTOMER',
      toLocation: 'WAREHOUSE',
      referenceId: exchange._id,
      referenceModel: 'Exchange',
      performedBy: userId,
      notes: `Exchanged in return for barcode ${newPiece.barcode}`
    });

    // Update new piece status
    newPiece.status = INVENTORY_STATUS.SOLD;
    newPiece.sold = true;
    await newPiece.save();

    await InventoryLifecycle.create({
      tenantId,
      inventoryPieceId: newPiece._id,
      barcode: newPiece.barcode,
      eventType: LIFECYCLE_EVENT.EXCHANGE,
      fromLocation: 'WAREHOUSE',
      toLocation: 'CUSTOMER',
      referenceId: exchange._id,
      referenceModel: 'Exchange',
      performedBy: userId,
      notes: `Issued in exchange for barcode ${returnedPiece.barcode}`
    });

    return {
      exchange,
      netDifference,
      action: netDifference > 0 ? `Customer pays ${netDifference}` : netDifference < 0 ? `Refund customer ${Math.abs(netDifference)}` : 'Equal exchange'
    };
  }

  static async getExchanges(query = {}, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (query.customerId) filter.customerId = query.customerId;
    if (query.search) filter.exchangeNo = new RegExp(query.search, 'i');

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const exchanges = await Exchange.find(filter)
      .populate('originalBillId customerId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Exchange.countDocuments(filter);

    return {
      exchanges,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getExchangeById(exchangeId, tenantId) {
    const exchange = await Exchange.findOne({ _id: exchangeId, tenantId, isDeleted: false })
      .populate('originalBillId customerId');
    if (!exchange) throw new ApiError(404, 'Exchange record not found.');
    return exchange;
  }

  static async exportExchanges(query = {}, tenantId, format = 'csv') {
    const { exchanges } = await this.getExchanges({ ...query, limit: 10000 }, tenantId);
    const exportData = exchanges.map(e => ({
      ExchangeNo: e.exchangeNo,
      Customer: e.customerId?.name || '',
      ReturnedValue: e.returnedValue,
      NewItemValue: e.newItemValue,
      NetDifference: e.netDifference,
      CreatedAt: e.createdAt
    }));
    return formatExportData(exportData, format);
  }
}

module.exports = ExchangeService;

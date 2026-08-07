const mongoose = require('mongoose');
const ApiError = require('../helpers/ApiError');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const InventoryPiece = require('../models/InventoryPiece');

class InventoryLifecycleService {
  /**
   * Get all lifecycle events with pagination and filters
   */
  static async getAllLifecycleEvents(query = {}, tenantId) {
    const filter = { tenantId: new mongoose.Types.ObjectId(tenantId) };

    if (query.eventType) filter.eventType = query.eventType;
    if (query.barcode) filter.barcode = new RegExp(query.barcode, 'i');
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const events = await InventoryLifecycle.find(filter)
      .populate('performedBy', 'name email')
      .populate('inventoryPieceId', 'barcode uniqueCode status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InventoryLifecycle.countDocuments(filter);

    return {
      events,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    };
  }

  /**
   * Get lifecycle events by unique code
   */
  static async getLifecycleByUniqueCode(code, tenantId) {
    // First find the inventory piece by unique code
    const piece = await InventoryPiece.findOne({
      uniqueCode: code,
      tenantId,
      isDeleted: false
    });

    if (!piece) {
      throw new ApiError(404, `Inventory piece with unique code '${code}' not found.`);
    }

    const history = await InventoryLifecycle.find({
      barcode: piece.barcode,
      tenantId
    })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });

    return { piece, history };
  }
  /**
   * Get lifecycle event by ID
   */
  static async getLifecycleById(id, tenantId) {
    const event = await InventoryLifecycle.findOne({ _id: id, tenantId })
      .populate('performedBy', 'name email')
      .populate('inventoryPieceId', 'barcode uniqueCode status');

    if (!event) {
      throw new ApiError(404, `Lifecycle event not found.`);
    }

    return event;
  }
}

module.exports = InventoryLifecycleService;

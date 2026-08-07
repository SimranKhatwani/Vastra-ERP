const ApiError = require('../helpers/ApiError');
const InventoryPiece = require('../models/InventoryPiece');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const Product = require('../models/Product');
const { INVENTORY_STATUS, LIFECYCLE_EVENT } = require('../constants/status');
const { formatExportData } = require('../helpers/export.helper');

class InventoryService {
  /**
   * Create single Inventory Piece manually
   */
  static async createPiece(data, userId, tenantId) {
    const existing = await InventoryPiece.findOne({ barcode: data.barcode, tenantId });
    if (existing) {
      throw new ApiError(400, `Inventory piece with barcode '${data.barcode}' already exists.`);
    }

    const piece = await InventoryPiece.create({
      ...data,
      tenantId,
      createdBy: userId
    });

    await InventoryLifecycle.create({
      tenantId,
      inventoryPieceId: piece._id,
      barcode: piece.barcode,
      eventType: LIFECYCLE_EVENT.PURCHASE,
      toLocation: `Warehouse:${piece.warehouseId}`,
      performedBy: userId,
      notes: 'Manual Inventory Piece Creation'
    });

    return piece;
  }

  /**
   * Scan / Lookup Inventory Piece by Barcode
   */
  static async getPieceByBarcode(barcode, tenantId) {
    const piece = await InventoryPiece.findOne({ barcode, tenantId, isDeleted: false })
      .populate({
        path: 'productId',
        populate: { path: 'brandId categoryId gstId hsnId' }
      })
      .populate('warehouseId firmId');

    if (!piece) {
      throw new ApiError(404, `Inventory piece with barcode '${barcode}' not found.`);
    }

    return piece;
  }

  /**
   * Search inventory by Design No or Item Code
   */
  static async searchInventory(query = {}, tenantId) {
    const productFilter = { tenantId, isDeleted: false };
    if (query.designNo) productFilter.designNo = new RegExp(query.designNo, 'i');
    if (query.itemCode) productFilter.itemCode = new RegExp(query.itemCode, 'i');
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      productFilter.$or = [
        { designNo: searchRegex },
        { itemCode: searchRegex },
        { itemName: searchRegex }
      ];
    }

    const matchingProducts = await Product.find(productFilter).select('_id');
    const productIds = matchingProducts.map(p => p._id);

    const filter = { tenantId, isDeleted: false, productId: { $in: productIds } };
    if (query.status) filter.status = query.status;
    if (query.warehouseId) filter.warehouseId = query.warehouseId;
    if (query.firmId) filter.firmId = query.firmId;
    if (query.rack) filter.rack = query.rack;

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const pieces = await InventoryPiece.find(filter)
      .populate('productId warehouseId firmId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InventoryPiece.countDocuments(filter);

    return {
      pieces,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get all inventory pieces with filters
   */
  static async getInventoryPieces(query = {}, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (query.status) filter.status = query.status;
    if (query.warehouseId) filter.warehouseId = query.warehouseId;
    if (query.firmId) filter.firmId = query.firmId;
    if (query.productId) filter.productId = query.productId;
    if (query.rack) filter.rack = query.rack;
    if (query.search) {
      filter.$or = [
        { barcode: new RegExp(query.search, 'i') },
        { uniqueCode: new RegExp(query.search, 'i') },
        { ipn: new RegExp(query.search, 'i') }
      ];
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const pieces = await InventoryPiece.find(filter)
      .populate('productId warehouseId firmId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InventoryPiece.countDocuments(filter);

    return {
      pieces,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Reserve Inventory Piece
   */
  static async reservePiece(barcode, userId, tenantId) {
    const piece = await InventoryPiece.findOne({ barcode, tenantId, isDeleted: false });
    if (!piece) throw new ApiError(404, `Barcode '${barcode}' not found.`);

    if (piece.status !== INVENTORY_STATUS.AVAILABLE) {
      throw new ApiError(400, `Piece ${barcode} is currently ${piece.status} and cannot be reserved.`);
    }

    piece.status = INVENTORY_STATUS.RESERVED;
    piece.reserved = true;
    await piece.save();

    await InventoryLifecycle.create({
      tenantId,
      inventoryPieceId: piece._id,
      barcode: piece.barcode,
      eventType: LIFECYCLE_EVENT.STOCK_ADJUSTMENT,
      performedBy: userId,
      notes: 'Inventory piece reserved'
    });

    return piece;
  }

  /**
   * Release Reservation
   */
  static async releaseReservation(barcode, userId, tenantId) {
    const piece = await InventoryPiece.findOne({ barcode, tenantId, isDeleted: false });
    if (!piece) throw new ApiError(404, `Barcode '${barcode}' not found.`);

    if (piece.status !== INVENTORY_STATUS.RESERVED) {
      throw new ApiError(400, `Piece ${barcode} is not reserved.`);
    }

    piece.status = INVENTORY_STATUS.AVAILABLE;
    piece.reserved = false;
    await piece.save();

    await InventoryLifecycle.create({
      tenantId,
      inventoryPieceId: piece._id,
      barcode: piece.barcode,
      eventType: LIFECYCLE_EVENT.STOCK_ADJUSTMENT,
      performedBy: userId,
      notes: 'Inventory piece reservation released'
    });

    return piece;
  }

  /**
   * Stock Transfer between Warehouses
   */
  static async transferStock(barcodes = [], targetWarehouseId, userId, tenantId) {
    const pieces = await InventoryPiece.find({ barcode: { $in: barcodes }, tenantId, isDeleted: false });

    if (pieces.length === 0) {
      throw new ApiError(404, 'No matching inventory pieces found.');
    }

    const updatedPieces = [];
    for (const piece of pieces) {
      const fromWarehouse = piece.warehouseId?.toString() || 'Unknown';
      piece.warehouseId = targetWarehouseId;
      piece.updatedBy = userId;
      await piece.save();

      await InventoryLifecycle.create({
        tenantId,
        inventoryPieceId: piece._id,
        barcode: piece.barcode,
        eventType: LIFECYCLE_EVENT.STOCK_TRANSFER,
        fromLocation: `Warehouse:${fromWarehouse}`,
        toLocation: `Warehouse:${targetWarehouseId}`,
        performedBy: userId,
        notes: `Transferred to warehouse ${targetWarehouseId}`
      });

      updatedPieces.push(piece);
    }

    return {
      transferredCount: updatedPieces.length,
      pieces: updatedPieces
    };
  }

  /**
   * Manual Stock Adjustment
   */
  static async adjustStock(barcode, newStatus, reason, userId, tenantId) {
    const piece = await InventoryPiece.findOne({ barcode, tenantId, isDeleted: false });
    if (!piece) {
      throw new ApiError(404, `Barcode '${barcode}' not found.`);
    }

    const oldStatus = piece.status;
    piece.status = newStatus;
    piece.updatedBy = userId;
    await piece.save();

    await InventoryLifecycle.create({
      tenantId,
      inventoryPieceId: piece._id,
      barcode: piece.barcode,
      eventType: LIFECYCLE_EVENT.STOCK_ADJUSTMENT,
      performedBy: userId,
      notes: `Status changed from ${oldStatus} to ${newStatus}. Reason: ${reason}`
    });

    return piece;
  }

  /**
   * Stock Status Breakdown (Rack wise, Warehouse wise, Firm wise, Low stock)
   */
  static async getStockSummary(tenantId, type = 'warehouse') {
    let groupBy = '$warehouseId';
    if (type === 'firm') groupBy = '$firmId';
    if (type === 'rack') groupBy = '$rack';
    if (type === 'product') groupBy = '$productId';

    const aggregation = await InventoryPiece.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), isDeleted: false } },
      {
        $group: {
          _id: groupBy,
          totalPieces: { $sum: 1 },
          availablePieces: {
            $sum: { $cond: [{ $eq: ['$status', INVENTORY_STATUS.AVAILABLE] }, 1, 0] }
          },
          soldPieces: {
            $sum: { $cond: [{ $eq: ['$status', INVENTORY_STATUS.SOLD] }, 1, 0] }
          },
          reservedPieces: {
            $sum: { $cond: [{ $eq: ['$status', INVENTORY_STATUS.RESERVED] }, 1, 0] }
          },
          totalMRPValue: { $sum: '$mrp' }
        }
      }
    ]);

    return aggregation;
  }

  static async getLowStockProducts(tenantId, threshold = 5) {
    const lowStock = await InventoryPiece.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), status: INVENTORY_STATUS.AVAILABLE, isDeleted: false } },
      { $group: { _id: '$productId', count: { $sum: 1 } } },
      { $match: { count: { $lte: parseInt(threshold) } } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    return lowStock;
  }

  /**
   * Get Lifecycle History of an Inventory Piece
   */
  static async getPieceLifecycle(barcode, tenantId) {
    const history = await InventoryLifecycle.find({ barcode, tenantId })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });

    return history;
  }

  /**
   * Get Inventory Piece by MongoDB ID
   */
  static async getPieceById(id, tenantId) {
    const piece = await InventoryPiece.findOne({ _id: id, tenantId, isDeleted: false })
      .populate({
        path: 'productId',
        populate: { path: 'brandId categoryId gstId hsnId' }
      })
      .populate('warehouseId firmId');

    if (!piece) {
      throw new ApiError(404, `Inventory piece with id '${id}' not found.`);
    }

    return piece;
  }

  /**
   * Get Inventory Piece by IPN (Item Piece Number)
   */
  static async getPieceByIpn(ipn, tenantId) {
    const piece = await InventoryPiece.findOne({ ipn, tenantId, isDeleted: false })
      .populate({
        path: 'productId',
        populate: { path: 'brandId categoryId gstId hsnId' }
      })
      .populate('warehouseId firmId');

    if (!piece) {
      throw new ApiError(404, `Inventory piece with IPN '${ipn}' not found.`);
    }

    return piece;
  }

  /**
   * Get Inventory Piece by Unique Code
   */
  static async getPieceByUniqueCode(uniqueCode, tenantId) {
    const piece = await InventoryPiece.findOne({ uniqueCode, tenantId, isDeleted: false })
      .populate({
        path: 'productId',
        populate: { path: 'brandId categoryId gstId hsnId' }
      })
      .populate('warehouseId firmId');

    if (!piece) {
      throw new ApiError(404, `Inventory piece with unique code '${uniqueCode}' not found.`);
    }

    return piece;
  }

  /**
   * Get Inventory Pieces by Design Number
   */
  static async getPiecesByDesign(designNo, tenantId) {
    const products = await Product.find({ designNo: new RegExp(designNo, 'i'), tenantId, isDeleted: false }).select('_id');
    const productIds = products.map(p => p._id);

    const pieces = await InventoryPiece.find({ productId: { $in: productIds }, tenantId, isDeleted: false })
      .populate('productId warehouseId firmId')
      .sort({ createdAt: -1 });

    return pieces;
  }

  /**
   * Get Inventory Pieces by Item Code
   */
  static async getPiecesByItemCode(itemCode, tenantId) {
    const products = await Product.find({ itemCode: new RegExp(itemCode, 'i'), tenantId, isDeleted: false }).select('_id');
    const productIds = products.map(p => p._id);

    const pieces = await InventoryPiece.find({ productId: { $in: productIds }, tenantId, isDeleted: false })
      .populate('productId warehouseId firmId')
      .sort({ createdAt: -1 });

    return pieces;
  }

  /**
   * Get Inventory Pieces by Status
   */
  static async getPiecesByStatus(status, tenantId) {
    const pieces = await InventoryPiece.find({ status, tenantId, isDeleted: false })
      .populate('productId warehouseId firmId')
      .sort({ createdAt: -1 });

    return pieces;
  }

  /**
   * Get Inventory Pieces by Warehouse
   */
  static async getPiecesByWarehouse(warehouseId, tenantId) {
    const pieces = await InventoryPiece.find({ warehouseId, tenantId, isDeleted: false })
      .populate('productId warehouseId firmId')
      .sort({ createdAt: -1 });

    return pieces;
  }

  /**
   * Get Inventory Pieces by Firm
   */
  static async getPiecesByFirm(firmId, tenantId) {
    const pieces = await InventoryPiece.find({ firmId, tenantId, isDeleted: false })
      .populate('productId warehouseId firmId')
      .sort({ createdAt: -1 });

    return pieces;
  }

  /**
   * Get All Available Inventory Pieces
   */
  static async getAvailablePieces(tenantId) {
    const pieces = await InventoryPiece.find({ status: INVENTORY_STATUS.AVAILABLE, tenantId, isDeleted: false })
      .populate('productId warehouseId firmId')
      .sort({ createdAt: -1 });

    return pieces;
  }
}

module.exports = InventoryService;

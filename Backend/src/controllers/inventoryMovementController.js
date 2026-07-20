const InventoryMovement = require('../models/inventoryMovementModel');

// POST /api/inventory-movements
exports.createInventoryMovement = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const Product = require('../models/productModel');
    const {
      productId,
      movementType,
      activity,
      quantity,
      warehouseId,
      warehouseName,
      sourceLocation,
      destinationLocation,
      batchId,
      referenceType,
      referenceId,
      referenceNumber,
      remarks,
      performedBy
    } = req.body;

    const product = await Product.findOne({ _id: productId, tenantId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const inventoryMovementService = require('../services/inventoryMovementService');
    const movement = await inventoryMovementService.createMovement(tenantId, {
      product,
      movementType,
      activity,
      quantity,
      warehouseId,
      warehouseName,
      sourceLocation,
      destinationLocation,
      batchId,
      referenceType,
      referenceId,
      referenceNumber,
      performedBy: performedBy || req.user.name,
      remarks
    });

    res.status(201).json({ success: true, data: movement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unified Filter & Pagination Endpoint
exports.getInventoryMovements = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      search = '',
      movementType,
      activity,
      productId,
      warehouseId,
      batchId,
      sku,
      barcode,
      referenceNumber,
      performedBy,
      startDate,
      endDate
    } = req.query;

    const query = { tenantId };

    // Search filter (searches product name, sku, barcode, referenceNumber, remarks)
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } },
        { performedBy: { $regex: search, $options: 'i' } }
      ];
    }

    // Direct filters
    if (movementType) query.movementType = movementType;
    if (activity) query.activity = activity;
    if (productId) query.productId = productId;
    if (warehouseId) query.warehouseId = warehouseId;
    if (batchId) query.batchId = batchId;
    if (sku) query.sku = sku;
    if (barcode) query.barcode = barcode;
    if (referenceNumber) query.referenceNumber = referenceNumber;
    if (performedBy) query.performedBy = performedBy;

    // Date Range filters
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const movements = await InventoryMovement.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await InventoryMovement.countDocuments(query);

    res.status(200).json({
      success: true,
      count: movements.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      data: movements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /inventory-movements/:id
exports.getInventoryMovementById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const movement = await InventoryMovement.findOne({ _id: req.params.id, tenantId });
    if (!movement) {
      return res.status(404).json({ success: false, message: 'Movement record not found' });
    }
    res.status(200).json({ success: true, data: movement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /inventory-movements/filter (Wrapper or distinct endpoint)
exports.filterMovements = async (req, res) => {
  return exports.getInventoryMovements(req, res);
};

// GET /inventory-movements/product/:productId
exports.getMovementsByProduct = async (req, res) => {
  req.query.productId = req.params.productId;
  return exports.getInventoryMovements(req, res);
};

// GET /inventory-movements/warehouse/:warehouseId
exports.getMovementsByWarehouse = async (req, res) => {
  req.query.warehouseId = req.params.warehouseId;
  return exports.getInventoryMovements(req, res);
};

// GET /inventory-movements/batch/:batchId
exports.getMovementsByBatch = async (req, res) => {
  req.query.batchId = req.params.batchId;
  return exports.getInventoryMovements(req, res);
};

// GET /inventory-movements/date-range
exports.getMovementsByDateRange = async (req, res) => {
  const { start, end } = req.query;
  req.query.startDate = start;
  req.query.endDate = end;
  return exports.getInventoryMovements(req, res);
};

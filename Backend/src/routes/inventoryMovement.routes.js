const express = require('express');
const mongoose = require('mongoose');
const InventoryMovement = require('../models/InventoryMovement');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const User = require('../models/User');
const Product = require('../models/Product');
const InventoryPiece = require('../models/InventoryPiece');
const { authenticate } = require('../middlewares/auth.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const asyncHandler = require('../helpers/asyncHandler');

const router = express.Router();

router.use(authenticate, tenantContext);

// GET /api/inventory-movements (Real dynamic data only, zero fake seed)
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    search = '',
    movementType = '',
    activity = '',
    warehouseId = '',
    productId = ''
  } = req.query;

  const p = Math.max(1, parseInt(page));
  const l = Math.max(1, parseInt(limit));
  const skip = (p - 1) * l;

  // 1. Build filter for manual InventoryMovement records
  const imFilter = {};
  if (req.tenantId) imFilter.tenantId = req.tenantId;
  if (movementType) imFilter.movementType = movementType;
  if (activity) imFilter.activity = activity;
  if (warehouseId) imFilter.warehouseId = warehouseId;
  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    imFilter.productId = productId;
  }
  if (search && search.trim()) {
    const s = search.trim();
    imFilter.$or = [
      { productName: new RegExp(s, 'i') },
      { productCode: new RegExp(s, 'i') },
      { referenceNumber: new RegExp(s, 'i') },
      { remarks: new RegExp(s, 'i') },
      { performedBy: new RegExp(s, 'i') }
    ];
  }

  // 2. Build filter for real InventoryLifecycle events
  const lcFilter = {};
  if (req.tenantId) lcFilter.tenantId = req.tenantId;
  if (movementType) {
    if (movementType === 'INBOUND') lcFilter.eventType = { $in: ['PURCHASE', 'RETURN_RECEIVED', 'OPENING_STOCK', 'IMPORT'] };
    else if (movementType === 'OUTBOUND') lcFilter.eventType = { $in: ['SALE', 'GOODS_RETURN', 'DAMAGE', 'LOSS'] };
    else if (movementType === 'TRANSFER') lcFilter.eventType = 'TRANSFER';
  }
  if (activity) {
    const actMap = {
      'PURCHASE_RECEIVED': ['PURCHASE', 'IMPORT'],
      'POS_SALE': ['SALE'],
      'STOCK_TRANSFER': ['TRANSFER'],
      'RETURN': ['RETURN_RECEIVED'],
      'ADJUSTMENT': ['ADJUSTMENT'],
      'OPENING_STOCK': ['OPENING_STOCK', 'IMPORT']
    };
    if (actMap[activity]) lcFilter.eventType = { $in: actMap[activity] };
  }
  if (search && search.trim()) {
    const s = search.trim();
    lcFilter.$or = [
      { barcode: new RegExp(s, 'i') },
      { fromLocation: new RegExp(s, 'i') },
      { toLocation: new RegExp(s, 'i') },
      { notes: new RegExp(s, 'i') }
    ];
  }

  const [imCount, lcCount] = await Promise.all([
    InventoryMovement.countDocuments(imFilter),
    InventoryLifecycle.countDocuments(lcFilter)
  ]);

  const total = imCount + lcCount;

  // Query actual real records from database
  const [manualMovements, lifecycleEvents] = await Promise.all([
    InventoryMovement.find(imFilter).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
    InventoryLifecycle.find(lcFilter)
      .populate({ path: 'inventoryPieceId', populate: { path: 'productId' } })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean()
  ]);

  // Normalize real lifecycle events into expected table display format
  const mappedLifecycles = lifecycleEvents.map(lc => {
    const piece = lc.inventoryPieceId || {};
    const prod = piece.productId || {};
    const ev = lc.eventType || 'PURCHASE';

    const isOutbound = ['SALE', 'GOODS_RETURN', 'DAMAGE', 'LOSS'].includes(ev);
    const isTransfer = ev === 'TRANSFER';
    const type = isOutbound ? 'OUTBOUND' : (isTransfer ? 'TRANSFER' : 'INBOUND');

    return {
      _id: lc._id,
      createdAt: lc.createdAt,
      productName: prod.itemName || prod.name || (lc.notes?.includes('Excel Import') ? `Imported Fabric Lot` : 'Garment Item'),
      productCode: lc.barcode || piece.uniqueCode || piece.barcode || prod.itemCode || prod.sku || 'N/A',
      movementType: type,
      activity: ev === 'PURCHASE' ? 'PURCHASE_RECEIVED' : (ev === 'SALE' ? 'POS_SALE' : (ev === 'TRANSFER' ? 'STOCK_TRANSFER' : ev)),
      quantity: 1,
      previousStock: isOutbound ? 'In Stock' : 'Vendor Transit',
      newStock: isOutbound ? 'Dispatched' : (lc.toLocation?.replace('Warehouse:', '') || 'Store Premises'),
      referenceType: lc.referenceModel || 'PURCHASE_BILL',
      referenceNumber: lc.referenceId ? String(lc.referenceId).slice(-8).toUpperCase() : (lc.notes || '-'),
      performedBy: lc.performedBy?.name || 'Authorized Staff',
      remarks: lc.fromLocation ? `${lc.fromLocation} → ${lc.toLocation || 'Depot'}` : (lc.notes || 'Movement logged')
    };
  });

  const combined = [...manualMovements, ...mappedLifecycles].slice(0, l);

  return res.status(200).json({
    statusCode: 200,
    success: true,
    data: combined,
    total,
    page: p,
    limit: l,
    pages: Math.ceil(total / l) || 1,
    message: 'Real inventory movements retrieved successfully.'
  });
}));

// POST /api/inventory-movements (Record real manual adjustment or transfer)
router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const newMovement = await InventoryMovement.create({
    tenantId: req.tenantId,
    productId: body.productId || null,
    productName: body.productName || 'Garment Item',
    productCode: body.productCode || body.sku || '',
    movementType: body.movementType || 'INBOUND',
    activity: body.activity || 'ADJUSTMENT',
    quantity: Number(body.quantity || 0),
    previousStock: Number(body.previousStock || 0),
    newStock: Number(body.newStock || 0),
    referenceType: body.referenceType || 'MANUAL_CORRECTION',
    referenceNumber: body.referenceNumber || `CORR-${Date.now().toString().slice(-6)}`,
    performedBy: body.performedBy || req.user?.name || 'Admin',
    warehouseId: body.warehouseId || null,
    warehouseName: body.warehouseName || '',
    remarks: body.remarks || 'Stock correction recorded.'
  });

  return res.status(201).json({
    statusCode: 201,
    success: true,
    data: newMovement,
    message: 'Inventory movement logged successfully.'
  });
}));

module.exports = router;

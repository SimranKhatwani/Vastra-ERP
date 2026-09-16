const express = require('express');
const Batch = require('../models/Batch');
const Product = require('../models/Product');
const { authenticate } = require('../middlewares/auth.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const asyncHandler = require('../helpers/asyncHandler');

const router = express.Router();

router.use(authenticate, tenantContext);

// GET /api/batches
router.get('/', asyncHandler(async (req, res) => {
  const { search = '', status = '' } = req.query;

  const filter = {};
  if (req.tenantId) filter.tenantId = req.tenantId;
  if (status) filter.status = status;
  if (search && search.trim()) {
    filter.$or = [
      { batchNo: new RegExp(search.trim(), 'i') },
      { notes: new RegExp(search.trim(), 'i') }
    ];
  }

  let batches = await Batch.find(filter)
    .populate('productId', 'itemName name itemCode sku primaryColor size')
    .populate('warehouseId', 'name location')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({
    statusCode: 200,
    success: true,
    data: batches,
    message: 'Batches fetched successfully.'
  });
}));

// POST /api/batches
router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const newBatch = await Batch.create({
    tenantId: req.tenantId,
    batchNo: body.batchNo || `BATCH-${Date.now().toString().slice(-6)}`,
    productId: body.productId || null,
    initialQty: Number(body.initialQty || body.quantity || 0),
    availableQty: Number(body.availableQty || body.initialQty || 0),
    reservedQty: Number(body.reservedQty || 0),
    mfgDate: body.mfgDate ? new Date(body.mfgDate) : null,
    expDate: body.expDate ? new Date(body.expDate) : null,
    warehouseId: body.warehouseId || null,
    status: body.status || 'Active',
    qcPassed: body.qcPassed !== undefined ? body.qcPassed : true,
    notes: body.notes || ''
  });

  const populated = await Batch.findById(newBatch._id)
    .populate('productId', 'itemName name itemCode sku')
    .populate('warehouseId', 'name')
    .lean();

  return res.status(201).json({
    statusCode: 201,
    success: true,
    data: populated,
    message: 'Batch created successfully.'
  });
}));

// PUT /api/batches/:id
router.put('/:id', asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) {
    return res.status(404).json({ success: false, message: 'Batch not found.' });
  }

  Object.assign(batch, req.body);
  await batch.save();

  const populated = await Batch.findById(batch._id)
    .populate('productId', 'itemName name itemCode sku')
    .populate('warehouseId', 'name')
    .lean();

  return res.status(200).json({
    statusCode: 200,
    success: true,
    data: populated,
    message: 'Batch updated successfully.'
  });
}));

module.exports = router;

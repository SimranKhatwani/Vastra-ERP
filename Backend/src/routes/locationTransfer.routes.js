const express = require('express');
const LocationTransfer = require('../models/LocationTransfer');
const Product = require('../models/Product');
const { authenticate } = require('../middlewares/auth.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const asyncHandler = require('../helpers/asyncHandler');

const router = express.Router();

router.use(authenticate, tenantContext);

// GET /api/location-transfers
router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.tenantId) filter.tenantId = req.tenantId;

  let transfers = await LocationTransfer.find(filter)
    .populate('productId', 'itemName name itemCode sku primaryColor')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({
    statusCode: 200,
    success: true,
    data: transfers,
    message: 'Location transfers retrieved successfully.'
  });
}));

// POST /api/location-transfers
router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  let prodName = '';
  let prodSku = '';

  if (body.productId) {
    const prod = await Product.findById(body.productId).lean();
    if (prod) {
      prodName = prod.itemName || prod.name || '';
      prodSku = prod.itemCode || prod.sku || '';
    }
  }

  const newTransfer = await LocationTransfer.create({
    tenantId: req.tenantId,
    transferNo: `TRF-${Date.now().toString().slice(-6)}`,
    sourceLocationId: body.sourceLocationId || '',
    sourceLocationName: body.sourceLocationName || 'Warehouse A',
    destinationLocationId: body.destinationLocationId || '',
    destinationLocationName: body.destinationLocationName || 'Warehouse B',
    productId: body.productId || null,
    productName: prodName || body.productName || 'Garment Item',
    productSku: prodSku || body.productSku || '',
    quantity: Number(body.quantity || 0),
    status: body.status || 'In Transit',
    remarks: body.remarks || '',
    initiatedBy: req.user?.name || 'Admin',
    dispatchedAt: new Date()
  });

  const populated = await LocationTransfer.findById(newTransfer._id)
    .populate('productId', 'itemName name itemCode sku')
    .lean();

  return res.status(201).json({
    statusCode: 201,
    success: true,
    data: populated,
    message: 'Location transfer created successfully.'
  });
}));

// PUT or PATCH /api/location-transfers/:id/status
const updateStatusHandler = asyncHandler(async (req, res) => {
  const transfer = await LocationTransfer.findById(req.params.id);
  if (!transfer) {
    return res.status(404).json({ success: false, message: 'Transfer not found.' });
  }

  if (req.body.status) {
    transfer.status = req.body.status;
    if (req.body.status === 'Received') {
      transfer.receivedAt = new Date();
    }
  }

  await transfer.save();

  const populated = await LocationTransfer.findById(transfer._id)
    .populate('productId', 'itemName name itemCode sku')
    .lean();

  return res.status(200).json({
    statusCode: 200,
    success: true,
    data: populated,
    message: 'Transfer status updated successfully.'
  });
});

router.put('/:id/status', updateStatusHandler);
router.patch('/:id/status', updateStatusHandler);
router.put('/:id', updateStatusHandler);

module.exports = router;

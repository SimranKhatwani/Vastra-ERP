const LocationTransfer = require('../models/locationTransferModel');
const Product = require('../models/productModel');
const inventoryMovementService = require('../services/inventoryMovementService');

// GET /api/location-transfers
exports.getTransfers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let transfers = await LocationTransfer.find({ tenantId })
      .populate('productId')
      .sort('-createdAt');

    // Auto-seed if empty
    if (transfers.length === 0) {
      const dbProducts = await Product.find({ tenantId });
      if (dbProducts.length > 0) {
        const sampleTransfers = [
          {
            tenantId,
            transferNo: 'TR-2026-1001',
            sourceLocationId: 'w-1',
            sourceLocationName: 'Bandra Central Warehouse',
            destinationLocationId: 'w-2',
            destinationLocationName: 'Colaba Retail Godown',
            productId: dbProducts[0]._id,
            productName: dbProducts[0].name,
            quantity: 20,
            status: 'Completed',
            date: new Date(Date.now() - 48 * 3600 * 1000),
            remarks: 'Stock replenishment for weekend POS demand'
          },
          {
            tenantId,
            transferNo: 'TR-2026-1002',
            sourceLocationId: 'w-1',
            sourceLocationName: 'Bandra Central Warehouse',
            destinationLocationId: 'w-3',
            destinationLocationName: 'Thane Logistics Depot',
            productId: dbProducts[1] ? dbProducts[1]._id : dbProducts[0]._id,
            productName: dbProducts[1] ? dbProducts[1].name : dbProducts[0].name,
            quantity: 50,
            status: 'In Transit',
            date: new Date(Date.now() - 6 * 3600 * 1000),
            remarks: 'Inter-warehouse stock balancing'
          }
        ];
        await LocationTransfer.insertMany(sampleTransfers);
        transfers = await LocationTransfer.find({ tenantId })
          .populate('productId')
          .sort('-createdAt');
      }
    }

    res.status(200).json({ success: true, count: transfers.length, data: transfers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/location-transfers
exports.createTransfer = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      sourceLocationId,
      sourceLocationName,
      destinationLocationId,
      destinationLocationName,
      productId,
      quantity,
      remarks
    } = req.body;

    const product = await Product.findOne({ _id: productId, tenantId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const transferNo = `TR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const transfer = new LocationTransfer({
      tenantId,
      transferNo,
      sourceLocationId,
      sourceLocationName,
      destinationLocationId,
      destinationLocationName,
      productId,
      productName: product.name,
      quantity,
      status: 'Requested',
      remarks
    });

    await transfer.save();
    const populated = await LocationTransfer.findById(transfer._id).populate('productId');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/location-transfers/:id/status
exports.updateTransferStatus = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status } = req.body;

    const transfer = await LocationTransfer.findOne({ _id: req.params.id, tenantId }).populate('productId');
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    const prevStatus = transfer.status;
    transfer.status = status;
    await transfer.save();

    const product = await Product.findOne({ _id: transfer.productId, tenantId });
    if (product) {
      const operator = req.user ? req.user.name : 'System Dispatcher';
      
      // --- FORWARD TRANSITIONS ---
      // Reduce stock at source when Dispatched
      if (status === 'Dispatched' && prevStatus !== 'Dispatched') {
        product.openingStock = Math.max(0, (product.openingStock || 0) - transfer.quantity);
        await product.save();

        await inventoryMovementService.createMovement(tenantId, {
          product,
          movementType: 'OUTBOUND',
          activity: 'STOCK_TRANSFER',
          quantity: transfer.quantity,
          referenceType: 'Transfer',
          referenceId: transfer._id.toString(),
          referenceNumber: transfer.transferNo,
          performedBy: operator,
          remarks: `Transfer Dispatched: OUTBOUND from ${transfer.sourceLocationName}`
        });
      }

      // Increase stock at destination when Completed
      if (status === 'Completed' && prevStatus !== 'Completed') {
        product.openingStock = (product.openingStock || 0) + transfer.quantity;
        await product.save();

        await inventoryMovementService.createMovement(tenantId, {
          product,
          movementType: 'INBOUND',
          activity: 'STOCK_TRANSFER',
          quantity: transfer.quantity,
          referenceType: 'Transfer',
          referenceId: transfer._id.toString(),
          referenceNumber: transfer.transferNo,
          performedBy: operator,
          remarks: `Transfer Completed: INBOUND to ${transfer.destinationLocationName}`
        });
      }

      // --- BACKWARD/ROLLBACK TRANSITIONS ---
      // If moving away from Completed, reverse the INBOUND stock addition
      if (status !== 'Completed' && prevStatus === 'Completed') {
        product.openingStock = Math.max(0, (product.openingStock || 0) - transfer.quantity);
        await product.save();

        await inventoryMovementService.createMovement(tenantId, {
          product,
          movementType: 'OUTBOUND',
          activity: 'STOCK_TRANSFER_ROLLBACK',
          quantity: transfer.quantity,
          referenceType: 'Transfer Rollback',
          referenceId: transfer._id.toString(),
          referenceNumber: transfer.transferNo,
          performedBy: operator,
          remarks: `Transfer Rolled Back: OUTBOUND subtraction from ${transfer.destinationLocationName}`
        });
      }

      // If moving back to Requested or Approved from a status where stock was already deducted
      const isBeforeDispatched = ['Requested', 'Approved'].includes(status);
      const wasDispatchedOrLater = ['Dispatched', 'In Transit', 'Received', 'Completed'].includes(prevStatus);
      if (isBeforeDispatched && wasDispatchedOrLater) {
        product.openingStock = (product.openingStock || 0) + transfer.quantity;
        await product.save();

        await inventoryMovementService.createMovement(tenantId, {
          product,
          movementType: 'INBOUND',
          activity: 'STOCK_TRANSFER_ROLLBACK',
          quantity: transfer.quantity,
          referenceType: 'Transfer Rollback',
          referenceId: transfer._id.toString(),
          referenceNumber: transfer.transferNo,
          performedBy: operator,
          remarks: `Transfer Cancelled: INBOUND addition back to ${transfer.sourceLocationName}`
        });
      }
    }

    res.status(200).json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

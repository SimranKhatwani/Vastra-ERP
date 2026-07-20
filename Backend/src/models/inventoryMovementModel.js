const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    movementType: {
      type: String,
      enum: ['INBOUND', 'OUTBOUND', 'TRANSFER'],
      required: true,
      index: true,
    },
    activity: {
      type: String,
      required: true, // PURCHASE_RECEIVED, POS_SALE, STOCK_TRANSFER, MATERIAL_ISSUE, RETURN, ADJUSTMENT, etc.
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productCode: {
      type: String,
    },
    sku: {
      type: String,
    },
    barcode: {
      type: String,
    },
    variantId: {
      type: String,
    },
    batchId: {
      type: String,
      index: true,
    },
    warehouseId: {
      type: String,
      index: true,
    },
    warehouseName: {
      type: String,
    },
    sourceLocation: {
      type: String,
    },
    destinationLocation: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    referenceType: {
      type: String, // Purchase Order, Invoice, Job Card, Transfer
    },
    referenceId: {
      type: String,
    },
    referenceNumber: {
      type: String,
      index: true,
    },
    performedBy: {
      type: String,
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Apply compound or additional indexes as specified
inventoryMovementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);

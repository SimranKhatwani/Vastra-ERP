const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    warehouseId: {
      type: String, // 'w-1', 'w-2', 'w-3' etc
      required: true,
      index: true,
    },
    warehouseName: {
      type: String,
      required: true,
    },
    availableQty: {
      type: Number,
      default: 0,
      min: [0, 'Available stock cannot be negative'],
    },
    reservedQty: {
      type: Number,
      default: 0,
      min: [0, 'Reserved stock cannot be negative'],
    },
    transitQty: {
      type: Number,
      default: 0,
      min: [0, 'Transit stock cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure uniqueness of product per warehouse per tenant
inventorySchema.index({ tenantId: 1, productId: 1, warehouseId: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);

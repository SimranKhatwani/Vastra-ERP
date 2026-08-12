const mongoose = require('mongoose');
const baseSchemaPlugin = require('./plugins/baseSchema');
const { INVENTORY_STATUS } = require('../constants/status');

/**
 * InventoryPiece
 * CRITICAL RULE: One Barcode = One Inventory Document
 */

const inventoryPieceSchema = new mongoose.Schema({
  importBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'PTImportHistory' },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  purchaseBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseBill'
  },
  purchaseItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseItem'
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: false
  },
  firmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: false
  },
  barcode: {
    type: String,
    required: true,
    trim: true
  },
  uniqueCode: {
    type: String,
    required: true,
    trim: true
  },
  batch: {
    type: String,
    trim: true
  },
  ipn: { // Item Piece Number
    type: String,
    trim: true
  },
  primaryColor: {
    type: String,
    trim: true
  },
  secondaryColor: {
    type: String,
    trim: true
  },
  size: {
    type: String,
    required: true,
    trim: true
  },
  purchaseRate: {
    type: Number,
    required: true,
    min: 0
  },
  wspAfterGST: {
    type: Number,
    min: 0
  },
  mrp: {
    type: Number,
    required: true,
    min: 0
  },
  rack: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(INVENTORY_STATUS),
    default: INVENTORY_STATUS.AVAILABLE,
    index: true
  },
  currentLocation: {
    type: String,
    default: 'WAREHOUSE'
  },
  sold: {
    type: Boolean,
    default: false
  },
  reserved: {
    type: Boolean,
    default: false
  },
  altered: {
    type: Boolean,
    default: false
  },
  returned: {
    type: Boolean,
    default: false
  }
});

inventoryPieceSchema.index({ tenantId: 1, barcode: 1 }, { unique: true });
inventoryPieceSchema.index({ tenantId: 1, uniqueCode: 1 });
inventoryPieceSchema.index({ tenantId: 1, productId: 1, status: 1 });
inventoryPieceSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('InventoryPiece', inventoryPieceSchema);

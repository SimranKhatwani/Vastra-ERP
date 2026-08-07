const mongoose = require('mongoose');
const baseSchemaPlugin = require('./plugins/baseSchema');
const { LIFECYCLE_EVENT } = require('../constants/status');

/**
 * InventoryLifecycle
 * Every inventory movement creates an event.
 */
const inventoryLifecycleSchema = new mongoose.Schema({
  inventoryPieceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryPiece',
    required: true
  },
  barcode: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    enum: Object.values(LIFECYCLE_EVENT),
    required: true
  },
  fromLocation: String,
  toLocation: String,
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['PurchaseBill', 'SaleBill', 'Alteration', 'Return', 'Exchange', 'GoodsReturn', 'User']
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
});

inventoryLifecycleSchema.index({ tenantId: 1, inventoryPieceId: 1 });
inventoryLifecycleSchema.index({ tenantId: 1, barcode: 1 });
inventoryLifecycleSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('InventoryLifecycle', inventoryLifecycleSchema);

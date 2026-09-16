const mongoose = require('mongoose');
const baseSchemaPlugin = require('./plugins/baseSchema');

const inventoryMovementSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, default: 'Garment Item' },
  productCode: { type: String, default: '' },
  movementType: { type: String, enum: ['INBOUND', 'OUTBOUND', 'TRANSFER'], default: 'INBOUND' },
  activity: { type: String, default: 'ADJUSTMENT' },
  quantity: { type: Number, default: 0 },
  previousStock: { type: Number, default: 0 },
  newStock: { type: Number, default: 0 },
  referenceType: { type: String, default: 'MANUAL_CORRECTION' },
  referenceNumber: { type: String, default: '' },
  performedBy: { type: String, default: 'Admin' },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  warehouseName: { type: String, default: '' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

inventoryMovementSchema.plugin(baseSchemaPlugin);
module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);

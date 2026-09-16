const mongoose = require('mongoose');
const baseSchemaPlugin = require('./plugins/baseSchema');

const batchSchema = new mongoose.Schema({
  batchNo: { type: String, required: true, trim: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  initialQty: { type: Number, default: 0 },
  availableQty: { type: Number, default: 0 },
  reservedQty: { type: Number, default: 0 },
  mfgDate: { type: Date },
  expDate: { type: Date },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  status: { type: String, default: 'Active' },
  qcPassed: { type: Boolean, default: true },
  notes: { type: String, default: '' }
}, { timestamps: true });

batchSchema.plugin(baseSchemaPlugin);
module.exports = mongoose.model('Batch', batchSchema);

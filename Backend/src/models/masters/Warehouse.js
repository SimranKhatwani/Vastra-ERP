const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  address: String,
  city: String,
  state: String,
  pincode: String,
  phone: String,
  isDefault: { type: Boolean, default: false }
});

warehouseSchema.index({ tenantId: 1, name: 1 }, { unique: true });
warehouseSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Warehouse', warehouseSchema);

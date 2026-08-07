const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const rackSchema = new mongoose.Schema({
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  rackName: { type: String, required: true, trim: true },
  capacity: Number
});

rackSchema.index({ tenantId: 1, warehouseId: 1, rackName: 1 }, { unique: true });
rackSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Rack', rackSchema);

const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const hsnSchema = new mongoose.Schema({
  hsnCode: { type: String, required: true, trim: true },
  description: { type: String, trim: true }
});

hsnSchema.index({ tenantId: 1, hsnCode: 1 }, { unique: true });
hsnSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('HSN', hsnSchema);

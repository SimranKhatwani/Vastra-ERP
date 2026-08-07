const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  description: { type: String, trim: true }
});

brandSchema.index({ tenantId: 1, name: 1 }, { unique: true });
brandSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Brand', brandSchema);

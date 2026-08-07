const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const sizeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  standardSize: { type: String, trim: true } // S, M, L, XL, 32, 34, etc.
});

sizeSchema.index({ tenantId: 1, name: 1 }, { unique: true });
sizeSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Size', sizeSchema);

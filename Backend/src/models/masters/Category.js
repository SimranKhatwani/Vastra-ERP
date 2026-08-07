const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  description: { type: String, trim: true }
});

categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });
categorySchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Category', categorySchema);

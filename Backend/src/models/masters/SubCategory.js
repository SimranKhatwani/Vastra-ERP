const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const subCategorySchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true }
});

subCategorySchema.index({ tenantId: 1, categoryId: 1, name: 1 }, { unique: true });
subCategorySchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('SubCategory', subCategorySchema);

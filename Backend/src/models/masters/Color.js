const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  hexCode: { type: String, trim: true }
});

colorSchema.index({ tenantId: 1, name: 1 }, { unique: true });
colorSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Color', colorSchema);

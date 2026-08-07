const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const salesmanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: String,
  code: String,
  commissionPercentage: { type: Number, default: 0 }
});

salesmanSchema.index({ tenantId: 1, phone: 1 });
salesmanSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Salesman', salesmanSchema);

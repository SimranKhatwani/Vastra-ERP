const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const customerBusinessSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  companyName: { type: String, required: true, trim: true },
  gstin: { type: String, uppercase: true, trim: true },
  pan: { type: String, uppercase: true, trim: true }
});

customerBusinessSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('CustomerBusiness', customerBusinessSchema);

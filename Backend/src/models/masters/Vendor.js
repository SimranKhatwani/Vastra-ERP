const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  companyName: { type: String, trim: true },
  phone: { type: String, default: 'N/A', trim: true },
  email: String,
  gstin: { type: String, uppercase: true, trim: true },
  address: String,
  city: String,
  state: String,
  openingBalance: { type: Number, default: 0 }
});

vendorSchema.index({ tenantId: 1, phone: 1 });
vendorSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Vendor', vendorSchema);

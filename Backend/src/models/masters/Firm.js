const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const firmSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  gstin: { type: String, uppercase: true, trim: true },
  pan: { type: String, uppercase: true, trim: true },
  email: String,
  phone: String,
  address: String,
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branch: String
  }
});

firmSchema.index({ tenantId: 1, name: 1 }, { unique: true });
firmSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Firm', firmSchema);

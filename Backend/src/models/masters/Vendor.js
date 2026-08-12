const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');


const vendorSchema = new mongoose.Schema({
  importBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'PTImportHistory' },
  name: { type: String, required: true, trim: true },
  companyName: { type: String, trim: true },
  phone: { type: String, default: 'N/A', trim: true },
  email: String,
  gstin: { type: String, uppercase: true, trim: true },
  address: String,
  city: String,
  state: String,
  pincode: String,
  panNumber: { type: String, uppercase: true, trim: true },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branchName: String,
    upiId: String
  },
  openingBalance: { type: Number, default: 0 }
});

vendorSchema.index({ tenantId: 1, phone: 1 });
vendorSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Vendor', vendorSchema);

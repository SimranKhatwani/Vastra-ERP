const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const vendorSchema = new mongoose.Schema({
  importBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'PTImportHistory' },
  vendorCode: { type: String, trim: true },
  name: { type: String, required: true, trim: true },
  companyName: { type: String, trim: true },
  brand: { type: String, trim: true },
  brandNames: [{ type: String, trim: true }],
  phone: { type: String, trim: true },
  landline: { type: String, trim: true },
  email: String,
  website: { type: String, trim: true },
  gstin: { type: String, uppercase: true, trim: true },
  address: String,
  city: String,
  state: String,
  stateCode: String,
  pincode: String,
  panNumber: { type: String, uppercase: true, trim: true },
  cin: { type: String, trim: true },
  udyamNo: { type: String, trim: true },
  contacts: {
    salesContact: String,
    accountsContact: String,
    dispatchContact: String,
    appointmentContact: String,
    landlineContact: String
  },
  emails: {
    primaryEmail: String,
    accountsEmail: String,
    dispatchEmail: String,
    website: String
  },
  transport: String,
  station: String,
  paymentTerms: { type: String, trim: true },
  creditDays: { type: Number },
  creditLimit: { type: Number },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branchName: String,
    upiId: String
  },
  openingBalance: { type: Number, default: 0 },
  vendorDataRow: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { strict: false });

vendorSchema.index({ tenantId: 1, phone: 1 });

vendorSchema.pre('save', async function(next) {
  if (!this.vendorCode) {
    const doc = this;
    const count = await mongoose.model('Vendor').countDocuments({ tenantId: doc.tenantId });
    doc.vendorCode = `VND-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

vendorSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Vendor', vendorSchema);

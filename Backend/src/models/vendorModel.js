const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    vendorCode: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a vendor name'],
      trim: true,
    },
    businessName: {
      type: String,
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
    },
    panNumber: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please add a mobile number'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' },
    pinCode: { type: String },
    bankDetails: {
      bankName: { type: String },
      accountNo: { type: String },
      ifscCode: { type: String },
      branch: { type: String }
    },
    upiId: { type: String },
    paymentTerms: { type: String, default: 'Net 30' },
    creditDays: { type: Number, default: 30 },
    creditLimit: { type: Number, default: 100000 },
    openingBalance: { type: Number, default: 0 },
    currentOutstanding: { type: Number, default: 0 },
    category: { type: String, default: 'General' },
    brandsSupplied: [{ type: String }],
    productsSupplied: [{ type: String }],
    isPreferred: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastPurchaseDate: { type: Date },
    remarks: { type: String },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
  }
);

// Auto-generate vendor code before validation if not present
vendorSchema.pre('validate', function () {
  if (!this.vendorCode) {
    this.vendorCode = `VND-${Date.now().toString().substring(7)}-${Math.floor(10 + Math.random() * 90)}`;
  }
});

vendorSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
vendorSchema.index({ tenantId: 1, vendorCode: 1 }, { unique: true });

module.exports = mongoose.model('Vendor', vendorSchema);

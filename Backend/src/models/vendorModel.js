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
    logoUrl: { type: String, default: '' },
    gstin: {
      type: String,
      trim: true,
    },
    panNumber: {
      type: String,
      trim: true,
    },
    businessType: { type: String, default: 'Manufacturer' }, // Manufacturer, Wholesaler, Trader, Distributor, Fabric Supplier
    category: { type: String, default: 'Fabric & Materials' },
    rating: { type: Number, default: 4.5, min: 1, max: 5 },
    qualityRemarks: { type: String, default: 'High quality supplier with timely delivery.' },
    preferredContactPerson: { type: String, default: '' },
    preferredCallingTime: { type: String, default: '10:00 AM - 06:00 PM' },
    
    // Contact Information Breakdown
    phone: {
      type: String,
      required: [true, 'Please add a mobile number'],
      trim: true,
    },
    secondaryPhone: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    secondaryWhatsapp: { type: String, default: '' },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    accountsEmail: { type: String, lowercase: true, trim: true, default: '' },
    salesEmail: { type: String, lowercase: true, trim: true, default: '' },
    landline: { type: String, default: '' },
    website: { type: String, default: '' },

    // Contact Persons by Department
    contactPersons: {
      sales: { name: String, phone: String, email: String },
      accounts: { name: String, phone: String, email: String },
      dispatch: { name: String, phone: String, email: String },
      support: { name: String, phone: String, email: String },
      owner: { name: String, phone: String, email: String }
    },

    // Address Breakdown
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' },
    pinCode: { type: String },
    addresses: {
      office: { street: String, city: String, state: String, pinCode: String, googleMapsUrl: String },
      factory: { street: String, city: String, state: String, pinCode: String, googleMapsUrl: String },
      warehouse: { street: String, city: String, state: String, pinCode: String, googleMapsUrl: String },
      pickup: { street: String, city: String, state: String, pinCode: String, googleMapsUrl: String }
    },

    // Banking & Financial Terms
    bankDetails: {
      bankName: { type: String },
      accountHolder: { type: String },
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
    lastPaymentDate: { type: Date },

    brandsSupplied: [{ type: String }],
    productsSupplied: [{ type: String }],
    isPreferred: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastPurchaseDate: { type: Date },
    remarks: { type: String },
    internalNotes: { type: String, default: '' },

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

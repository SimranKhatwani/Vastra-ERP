const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a supplier name'],
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please add a mobile number'],
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
    },
    outstandingBalance: {
      type: Number, // Amount the tenant owes to the supplier
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure phone is unique per tenant
supplierSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Supplier', supplierSchema);

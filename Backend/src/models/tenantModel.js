const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: [true, 'Please add a business name'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Please add a business email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Please add a business phone number'],
      match: [/^\d{10}$/, 'Phone number must be exactly 10 digits'],
    },
    aadhaarNumber: {
      type: String,
      required: [true, 'Please add an Aadhaar number'],
      match: [/^\d{12}$/, 'Aadhaar number must be exactly 12 digits'],
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
    },
    plan: {
      type: String,
      enum: ['Starter', 'Professional', 'Enterprise', 'Trial'],
      default: 'Trial',
    },
    planExpiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tenant', tenantSchema);

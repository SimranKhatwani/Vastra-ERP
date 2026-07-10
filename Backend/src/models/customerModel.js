const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a customer name'],
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
    birthday: {
      type: Date,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    totalInvoices: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
      default: 'Bronze',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure phone is unique per tenant
customerSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

// Pre-save hook to calculate tier based on totalSpent
customerSchema.pre('save', function () {
  if (this.totalSpent > 50000) {
    this.tier = 'Platinum';
  } else if (this.totalSpent > 25000) {
    this.tier = 'Gold';
  } else if (this.totalSpent > 10000) {
    this.tier = 'Silver';
  } else {
    this.tier = 'Bronze';
  }
});

module.exports = mongoose.model('Customer', customerSchema);

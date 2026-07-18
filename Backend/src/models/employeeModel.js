const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please add an employee name'],
      trim: true,
    },
    role: {
      type: String,
      required: true,
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
    salary: {
      type: Number,
      required: true,
    },
    shift: {
      type: String,
      enum: ['Morning', 'Evening', 'Full-Day'],
      default: 'Full-Day',
    },
    commissionEarned: {
      type: Number,
      default: 0,
    },
    commissionSummary: {
      today: { type: Number, default: 0 },
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 },
      yearly: { type: Number, default: 0 },
      lifetime: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      paid: { type: Number, default: 0 },
      lastCommissionDate: { type: Date },
      totalProductsSold: { type: Number, default: 0 }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    attendanceStatus: {
      type: String,
      enum: ['Present', 'Absent', 'On Leave'],
      default: 'Present',
    },
    currentWorkload: {
      type: Number,
      default: 0,
    },
    maxCapacity: {
      type: Number,
      default: 10,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    encryptedPassword: {
      type: String,
      select: true, // Need this for the admin view
    },
    businessCode: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// Ensure phone is unique per tenant
employeeSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Employee', employeeSchema);

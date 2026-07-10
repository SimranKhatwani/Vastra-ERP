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
      enum: ['Admin', 'Manager', 'Cashier', 'Salesperson', 'Tailor'],
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
employeeSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Employee', employeeSchema);

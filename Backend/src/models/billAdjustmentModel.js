const mongoose = require('mongoose');

const billAdjustmentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    billNumber: {
      type: String,
      required: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
    },
    originalAmount: {
      type: Number,
      required: true,
    },
    adjustmentType: {
      type: String,
      enum: ['Amount', 'Percentage'],
      required: true,
    },
    operation: {
      type: String,
      enum: ['Discount', 'Charge'],
      required: true,
    },
    adjustmentValue: {
      type: Number,
      required: true,
    },
    calculatedAdjustmentAmount: {
      type: Number,
      required: true,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
    },
    employeeId: {
      type: String,
    },
    employeeName: {
      type: String,
    },
    branchId: {
      type: String,
    },
    dateTime: {
      type: Date,
      default: Date.now,
    },
    ownerApprovalStatus: {
      type: String,
      enum: ['None', 'Pending', 'Approved'],
      default: 'None',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BillAdjustment', billAdjustmentSchema);

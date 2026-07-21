const mongoose = require('mongoose');

const discountApprovalSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    invoiceNo: {
      type: String,
      default: 'PENDING',
    },
    originalBillAmount: {
      type: Number,
      required: true,
    },
    requestedDiscount: {
      type: Number,
      required: true,
    },
    discountType: {
      type: String,
      enum: ['Flat', 'Percentage'],
      default: 'Flat',
    },
    requestedBy: {
      type: String,
      required: true,
    },
    approvedBy: {
      type: String,
    },
    reason: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    }
  },
  {
    timestamps: true,
  }
);

discountApprovalSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('DiscountApproval', discountApprovalSchema);

const mongoose = require('mongoose');

const financialAuditLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true, // e.g. 'Expense Created', 'Receipt Issued', 'Payment Recorded', 'Income Logged'
    },
    module: {
      type: String,
      required: true, // e.g. 'Financial & Accounts', 'Billing', 'Purchase', etc.
      default: 'Financial & Accounts',
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    referenceNo: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    performedBy: {
      type: String,
      default: 'System Admin',
    },
    details: {
      type: String,
      trim: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

financialAuditLogSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('FinancialAuditLog', financialAuditLogSchema);

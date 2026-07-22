const mongoose = require('mongoose');

const cashBankEntrySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    entryNo: {
      type: String,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Cash', 'Bank'],
      required: true,
    },
    direction: {
      type: String,
      enum: ['In', 'Out'],
      required: true,
    },
    source: {
      type: String,
      required: true, // e.g. 'Opening Balance', 'Deposit', 'Withdrawal', 'Petty Cash Adjustment'
    },
    bankAccountName: {
      type: String,
      trim: true, // e.g. 'HDFC Bank - Main', 'ICICI - Retail', etc.
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    referenceType: {
      type: String,
      default: 'Manual',
    },
    referenceNo: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: String,
      default: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

cashBankEntrySchema.pre('validate', function () {
  if (!this.entryNo) {
    this.entryNo = `CB-${Date.now().toString().substring(5)}-${Math.floor(10 + Math.random() * 90)}`;
  }
});

cashBankEntrySchema.index({ tenantId: 1, entryNo: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('CashBankEntry', cashBankEntrySchema);

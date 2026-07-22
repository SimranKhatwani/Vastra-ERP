const mongoose = require('mongoose');

const financialPaymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    paymentNo: {
      type: String,
      trim: true,
      index: true,
    },
    beneficiaryType: {
      type: String,
      enum: ['Vendor', 'Employee', 'Other'],
      required: true,
    },
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    beneficiaryName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Vendor Payment', 'Salary', 'Expense Payment', 'Refund', 'Other'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'NEFT', 'RTGS', 'IMPS', 'Card', 'Other'],
      required: true,
      default: 'Cash',
    },
    referenceNo: {
      type: String,
      trim: true,
    },
    bankAccountName: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Completed', 'Failed'],
      default: 'Completed',
    },
    remarks: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: String,
      default: 'Admin',
    },
    // Link to source document
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    referenceType: {
      type: String,
      enum: ['VendorPayment', 'Expense', 'Invoice', 'Manual', 'Other'],
      default: 'Manual',
    },
  },
  {
    timestamps: true,
  }
);

financialPaymentSchema.pre('validate', function () {
  if (!this.paymentNo) {
    this.paymentNo = `FPAY-${Date.now().toString().substring(5)}-${Math.floor(10 + Math.random() * 90)}`;
  }
});

financialPaymentSchema.index({ tenantId: 1, paymentNo: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('FinancialPayment', financialPaymentSchema);

const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    receiptNo: {
      type: String,
      trim: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      trim: true,
      default: 'Walk-in Customer',
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    invoiceRef: {
      type: String,
      trim: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Wallet', 'Other'],
      required: true,
      default: 'Cash',
    },
    bankAccountName: {
      type: String,
      trim: true,
    },
    referenceNo: {
      type: String,
      trim: true,
    },
    receivedBy: {
      type: String,
      default: 'Admin',
    },
    remarks: {
      type: String,
      trim: true,
    },
    isAdvance: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

receiptSchema.pre('validate', function () {
  if (!this.receiptNo) {
    this.receiptNo = `REC-${Date.now().toString().substring(5)}-${Math.floor(10 + Math.random() * 90)}`;
  }
});

receiptSchema.index({ tenantId: 1, receiptNo: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Receipt', receiptSchema);

const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    incomeNo: {
      type: String,
      trim: true,
      index: true,
    },
    source: {
      type: String,
      enum: [
        'Retail Sales', 'Wholesale Sales', 'Stitching Charges',
        'Alteration Charges', 'Delivery Charges', 'Service Charges',
        'Commission Income', 'Other Income',
      ],
      required: true,
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
    paymentMode: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Wallet', 'Other'],
      default: 'Cash',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      trim: true,
      default: 'Walk-in',
    },
    // Links to source document (invoice, etc.)
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    referenceType: {
      type: String,
      enum: ['Invoice', 'Manual', 'BillingSales', 'Other'],
      default: 'Manual',
    },
    referenceNo: {
      type: String,
      trim: true,
    },
    description: {
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

incomeSchema.pre('validate', function () {
  if (!this.incomeNo) {
    this.incomeNo = `INC-${Date.now().toString().substring(5)}-${Math.floor(10 + Math.random() * 90)}`;
  }
});

incomeSchema.index({ tenantId: 1, incomeNo: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Income', incomeSchema);

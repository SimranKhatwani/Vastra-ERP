const mongoose = require('mongoose');

const vendorPaymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    purchaseInvoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseInvoice',
      index: true,
    },
    paymentNo: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMode: {
      type: String,
      required: true,
      enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Credit Card', 'Other'],
      default: 'Cash',
    },
    referenceNo: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    paidBy: {
      type: String,
      default: 'System Admin',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate payment number before validation if not present
vendorPaymentSchema.pre('validate', function () {
  if (!this.paymentNo) {
    this.paymentNo = `PAY-${Date.now().toString().substring(6)}-${Math.floor(10 + Math.random() * 90)}`;
  }
});

vendorPaymentSchema.index({ tenantId: 1, paymentNo: 1 }, { unique: true });

module.exports = mongoose.model('VendorPayment', vendorPaymentSchema);

const mongoose = require('mongoose');

const purchaseInvoiceItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  taxPercent: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const purchaseInvoiceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    invoiceNo: {
      type: String,
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    vendorName: {
      type: String,
      required: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    referenceNo: {
      type: String,
    },
    items: [purchaseInvoiceItemSchema],
    subTotal: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    freight: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentTerms: { type: String, default: 'Net 30' },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Partial', 'Unpaid'],
      default: 'Unpaid',
    },
    amountPaid: { type: Number, default: 0 },
    outstandingAmount: { type: Number, default: 0 },
    remarks: { type: String },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
  }
);

purchaseInvoiceSchema.pre('validate', function () {
  this.outstandingAmount = Math.max(0, this.grandTotal - this.amountPaid);
  if (this.amountPaid >= this.grandTotal) {
    this.paymentStatus = 'Paid';
  } else {
    this.paymentStatus = this.amountPaid > 0 ? 'Partial' : 'Unpaid';
  }

  if (!this.dueDate) {
    const invDate = this.invoiceDate || new Date();
    const due = new Date(invDate);
    due.setDate(due.getDate() + 30);
    this.dueDate = due;
  }
});

purchaseInvoiceSchema.index({ tenantId: 1, invoiceNo: 1 }, { unique: true });

module.exports = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema);

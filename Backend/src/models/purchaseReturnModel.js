const mongoose = require('mongoose');

const purchaseReturnSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    returnNo: {
      type: String,
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    vendorName: {
      type: String,
      required: true,
    },
    invoiceRef: {
      type: String,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true },
    reason: { type: String },
    actionRequired: {
      type: String,
      enum: ['Replacement', 'Refund'],
      default: 'Refund',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Completed'],
      default: 'Pending',
    },
    remarks: { type: String }
  },
  {
    timestamps: true,
  }
);

purchaseReturnSchema.pre('validate', function () {
  if (!this.returnNo) {
    this.returnNo = `PRT-${Date.now().toString().substring(6)}-${Math.floor(10 + Math.random() * 90)}`;
  }
});

purchaseReturnSchema.index({ tenantId: 1, returnNo: 1 }, { unique: true });

module.exports = mongoose.model('PurchaseReturn', purchaseReturnSchema);

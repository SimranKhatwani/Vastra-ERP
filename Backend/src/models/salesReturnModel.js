const mongoose = require('mongoose');

const salesReturnSchema = new mongoose.Schema(
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
    invoiceNo: {
      type: String,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
    },
    items: [
      {
        productId: { type: String },
        name: { type: String, required: true },
        sku: { type: String },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        costPrice: { type: Number, default: 0 },
        total: { type: Number, required: true },
      },
    ],
    totalReturnAmount: {
      type: Number,
      required: true,
    },
    reason: { type: String },
    refundMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Store Credit'],
      default: 'Cash',
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Completed',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

salesReturnSchema.pre('validate', function () {
  if (!this.returnNo) {
    this.returnNo = `SRT-${Date.now().toString().substring(6)}-${Math.floor(10 + Math.random() * 90)}`;
  }
});

salesReturnSchema.index({ tenantId: 1, returnNo: 1 }, { unique: true });

module.exports = mongoose.model('SalesReturn', salesReturnSchema);

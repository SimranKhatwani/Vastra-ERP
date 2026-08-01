const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    returnId: {
      type: String,
      required: true,
      unique: true,
    },
    originalInvoiceNumber: {
      type: String,
      required: true,
    },
    originalBillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    barcode: {
      type: String,
    },
    itemName: {
      type: String,
      required: true,
    },
    designNumber: {
      type: String,
    },
    itemCode: {
      type: String,
    },
    size: {
      type: String,
    },
    colour: {
      type: String,
    },
    quantityReturned: {
      type: Number,
      required: true,
      min: 1,
    },
    returnAmount: {
      type: Number,
      required: true,
    },
    returnType: {
      type: String,
      enum: ['Return', 'Exchange'],
      required: true,
    },
    returnReason: {
      type: String,
      default: 'Customer Choice',
    },
    processedBy: {
      type: String,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Or Employee depending on auth logic
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
      default: 'Completed',
    },
    isDefective: {
      type: Boolean,
      default: false,
    },
    refundMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Store Credit', 'None'],
      default: 'Cash',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

returnSchema.pre('validate', function () {
  if (!this.returnId) {
    this.returnId = `RET-${Date.now().toString().substring(6)}-${Math.floor(100 + Math.random() * 900)}`;
  }
});

returnSchema.index({ tenantId: 1, returnId: 1 });
returnSchema.index({ tenantId: 1, originalInvoiceNumber: 1 });
returnSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('Return', returnSchema);

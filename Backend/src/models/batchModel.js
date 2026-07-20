const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    batchNo: {
      type: String,
      required: [true, 'Please add a batch or lot number'],
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      index: true,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      index: true,
    },
    purchaseInvoiceNo: {
      type: String,
    },
    warehouseId: {
      type: String,
      index: true,
      default: 'w-1',
    },
    rack: {
      type: String,
      default: 'RCK-A',
    },
    shelf: {
      type: String,
      default: 'SHLF-1',
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: String,
      default: 'System Admin',
    },
    purchaseQty: {
      type: Number,
      required: true,
      default: 0,
    },
    availableQty: {
      type: Number,
      required: true,
      default: 0,
    },
    reservedQty: {
      type: Number,
      default: 0,
    },
    soldQty: {
      type: Number,
      default: 0,
    },
    returnedQty: {
      type: Number,
      default: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
    },
    mrp: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0, // e.g. 5 for 5% discount
    },
    gst: {
      type: Number,
      default: 12, // e.g. 12% GST
    },
    status: {
      type: String,
      enum: ['Created', 'Received', 'QC', 'Available', 'Reserved', 'Sold', 'Closed'],
      default: 'Available',
      index: true,
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Batch', batchSchema);

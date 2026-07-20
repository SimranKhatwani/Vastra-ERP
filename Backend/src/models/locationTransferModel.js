const mongoose = require('mongoose');

const locationTransferSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    transferNo: {
      type: String,
      required: true,
      index: true,
    },
    sourceLocationId: {
      type: String,
      required: true,
      index: true,
    },
    sourceLocationName: {
      type: String,
      required: true,
    },
    destinationLocationId: {
      type: String,
      required: true,
      index: true,
    },
    destinationLocationName: {
      type: String,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Dispatched', 'In Transit', 'Received', 'Completed'],
      default: 'Requested',
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
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

module.exports = mongoose.model('LocationTransfer', locationTransferSchema);

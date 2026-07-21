const mongoose = require('mongoose');

const grnItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
  color: { type: String },
  size: { type: String },
  batchNo: { type: String },
  receivedQty: { type: Number, required: true },
  acceptedQty: { type: Number, required: true },
  rejectedQty: { type: Number, default: 0 },
  damagedQty: { type: Number, default: 0 }
});

const grnSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    grnNo: {
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
    referenceNo: {
      type: String,
    },
    receiveDate: {
      type: Date,
      default: Date.now,
    },
    warehouseId: {
      type: String,
      default: 'w-1',
    },
    rackLocation: {
      type: String,
    },
    items: [grnItemSchema],
    remarks: {
      type: String,
    },
    receivedBy: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

grnSchema.pre('validate', function () {
  if (!this.grnNo) {
    this.grnNo = `GRN-${Date.now().toString().substring(6)}-${Math.floor(10 + Math.random() * 90)}`;
  }
});

grnSchema.index({ tenantId: 1, grnNo: 1 }, { unique: true });

module.exports = mongoose.model('GRN', grnSchema);

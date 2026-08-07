const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const purchaseBillSchema = new mongoose.Schema({
  billNo: {
    type: String,
    required: true,
    trim: true
  },
  billDate: {
    type: Date,
    default: Date.now
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  firmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  gst: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['DRAFT', 'APPROVED', 'RECEIVED', 'CANCELLED'],
    default: 'APPROVED'
  },
  remarks: String
});

purchaseBillSchema.index({ tenantId: 1, billNo: 1 }, { unique: true });
purchaseBillSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('PurchaseBill', purchaseBillSchema);

const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');
const { BILL_STATUS } = require('../../constants/status');

const saleBillSchema = new mongoose.Schema({
  billNo: {
    type: String,
    required: true,
    trim: true
  },
  billDate: {
    type: Date,
    default: Date.now
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
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
  salesmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salesman'
  },
  subTotal: {
    type: Number,
    required: true,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    default: 0
  },
  advanceApplied: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: Object.values(BILL_STATUS),
    default: BILL_STATUS.COMPLETED
  },
  remarks: String
});

saleBillSchema.index({ tenantId: 1, billNo: 1 }, { unique: true });
saleBillSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('SaleBill', saleBillSchema);

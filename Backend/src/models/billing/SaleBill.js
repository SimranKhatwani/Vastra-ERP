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
    ref: 'Customer'
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
  manualDiscountAmount: {
    type: Number,
    default: 0
  },
  manualChargeAmount: {
    type: Number,
    default: 0
  },
  manualAdjustmentReason: {
    type: String
  },
  hasReturn: {
    type: Boolean,
    default: false
  },
  returnedAmount: {
    type: Number,
    default: 0
  },
  hasExchange: {
    type: Boolean,
    default: false
  },
  exchangedAmount: {
    type: Number,
    default: 0
  },
  exchangeSlip: {
    type: String
  },
  status: {
    type: String,
    enum: Object.values(BILL_STATUS),
    default: BILL_STATUS.COMPLETED
  },
  paymentMethod: {
    type: String,
    default: 'Cash'
  },
  isCommissionPaid: {
    type: Boolean,
    default: false
  },
  commissionPercentage: {
    type: Number,
    default: 0
  },
  commissionAmount: {
    type: Number,
    default: 0
  },
  commissionPaidAmount: {
    type: Number,
    default: 0
  },
  remarks: String
});

saleBillSchema.index({ tenantId: 1, billNo: 1 }, { unique: true });
saleBillSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('SaleBill', saleBillSchema);

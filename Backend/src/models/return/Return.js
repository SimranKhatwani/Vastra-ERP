const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const returnSchema = new mongoose.Schema({
  returnNo: {
    type: String,
    required: true,
    trim: true
  },
  saleBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleBill',
    required: true
  },
  saleBillNo: {
    type: String
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  refundAmount: {
    type: Number,
    required: true,
    min: 0
  },
  refundMode: {
    type: String,
    enum: ['CASH', 'CREDIT_NOTE', 'BANK', 'LOYALTY_POINTS', 'ADD_TO_ADVANCE', 'DIRECT_REFUND'],
    default: 'CREDIT_NOTE'
  },
  reason: String,
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'APPROVED'
  }
});

returnSchema.index({ tenantId: 1, returnNo: 1 }, { unique: true });
returnSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Return', returnSchema);

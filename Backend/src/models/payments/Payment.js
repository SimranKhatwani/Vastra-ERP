const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const paymentSchema = new mongoose.Schema({
  saleBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleBill'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  receiptNo: {
    type: String,
    required: true,
    trim: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  advanceApplied: {
    type: Number,
    default: 0
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  remarks: String
});

paymentSchema.index({ tenantId: 1, receiptNo: 1 }, { unique: true });
paymentSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Payment', paymentSchema);

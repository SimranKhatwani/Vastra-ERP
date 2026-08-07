const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');
const { PAYMENT_MODE } = require('../../constants/status');

const paymentTransactionSchema = new mongoose.Schema({
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  mode: {
    type: String,
    enum: Object.values(PAYMENT_MODE),
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  referenceNo: {
    type: String,
    trim: true
  },
  notes: String
});

paymentTransactionSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);

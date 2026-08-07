const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const exchangeSchema = new mongoose.Schema({
  exchangeNo: {
    type: String,
    required: true,
    trim: true
  },
  originalBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleBill',
    required: true
  },
  newBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleBill',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  returnedValue: {
    type: Number,
    required: true
  },
  newItemValue: {
    type: Number,
    required: true
  },
  netDifference: {
    type: Number,
    required: true
  }, // Positive = Customer pays extra, Negative = Refund/Credit Note
  status: {
    type: String,
    enum: ['COMPLETED', 'CANCELLED'],
    default: 'COMPLETED'
  }
});

exchangeSchema.index({ tenantId: 1, exchangeNo: 1 }, { unique: true });
exchangeSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Exchange', exchangeSchema);

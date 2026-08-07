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
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  refundAmount: {
    type: Number,
    required: true,
    min: 0
  },
  refundMode: {
    type: String,
    enum: ['CASH', 'CREDIT_NOTE', 'BANK', 'LOYALTY_POINTS'],
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

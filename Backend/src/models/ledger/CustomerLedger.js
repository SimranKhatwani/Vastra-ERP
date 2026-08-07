const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');
const { LEDGER_TYPE } = require('../../constants/status');

const customerLedgerSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  type: {
    type: String,
    enum: Object.values(LEDGER_TYPE),
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  referenceBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleBill'
  },
  remarks: String
});

customerLedgerSchema.index({ tenantId: 1, customerId: 1 });
customerLedgerSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('CustomerLedger', customerLedgerSchema);

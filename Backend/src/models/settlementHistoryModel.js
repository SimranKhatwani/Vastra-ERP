const mongoose = require('mongoose');

const settlementHistorySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  date: { type: String, required: true },
  type: { type: String, required: true },
  recipient: { type: String, required: true },
  referenceNo: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, default: 'Completed' },
  processedBy: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('SettlementHistory', settlementHistorySchema);

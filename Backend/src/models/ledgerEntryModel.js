const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: { type: String, enum: ['LoyaltyRedeemed', 'AdvanceUsed', 'AdvanceAdded', 'Refund', 'DuePayment', 'ManualAdjustment'], required: true },
  amount: { type: Number, required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

ledgerEntrySchema.index({ tenantId: 1, customerId: 1, createdAt: -1 });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);

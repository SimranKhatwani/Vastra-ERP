const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  breakdown: {
    cash: { type: Number, default: 0 },
    card: { type: Number, default: 0 },
    upi: { type: Number, default: 0 },
    cheque: { type: Number, default: 0 },
    due: { type: Number, default: 0 }
  },
  loyaltyPointsUsed: { type: Number, default: 0 },
  advanceUsed: { type: Number, default: 0 },
  overpayment: { type: Number, default: 0 },
  totalPaid: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Paid', 'Partial', 'Unpaid', 'SavedAsAdvance'], default: 'Paid' },
  createdAt: { type: Date, default: Date.now }
});

paymentSchema.index({ tenantId: 1, invoiceId: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);

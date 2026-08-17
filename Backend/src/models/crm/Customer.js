const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  customerId: { type: String, trim: true },
  phone: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
  anniversary: Date,
  gstin: { type: String, uppercase: true, trim: true, default: '' },
  loyaltyPoints: { type: Number, default: 0 },
  dueBalance: { type: Number, default: 0 },
  advanceBalance: { type: Number, default: 0 },
  walletAdvance: { type: Number, default: 0 },
  prepaidAdvance: { type: Number, default: 0 },
  advanceHistory: [
    {
      amount: { type: Number, default: 0 },
      reason: { type: String, default: '' },
      date: { type: Date, default: Date.now }
    }
  ]
});

customerSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
customerSchema.index(
  { tenantId: 1, customerId: 1 }, 
  { unique: true, partialFilterExpression: { customerId: { $exists: true, $type: "string" } } }
);
customerSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Customer', customerSchema);

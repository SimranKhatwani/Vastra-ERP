const mongoose = require('mongoose');

const influencerSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  platform: { type: String, required: true },
  handle: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  referralCode: { type: String },
  commissionType: { type: String, default: 'Percentage' },
  commissionValue: { type: Number, default: 0 },
  duration: { type: String },
  status: { type: String, default: 'Active' },
  followers: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },
  promoCodeUsage: { type: Number, default: 0 },
  ordersGenerated: { type: Number, default: 0 },
  revenueGenerated: { type: Number, default: 0 },
  commissionEarned: { type: Number, default: 0 },
  commissionPending: { type: Number, default: 0 },
  commissionPaid: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Influencer', influencerSchema);

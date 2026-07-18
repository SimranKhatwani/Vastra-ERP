const mongoose = require('mongoose');

const loyaltySettingsSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    rupeesPerPoint: {
      type: Number,
      default: 20, // e.g. 100 rupees = 5 points => 100 / 5 = 20
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LoyaltySettings', loyaltySettingsSchema);

const mongoose = require('mongoose');

const commissionSettingsSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    salespersonPercentage: {
      type: Number,
      default: 1.5,
    },
    workerPercentage: {
      type: Number,
      default: 0.5,
    },
    calculationBasis: {
      type: String,
      enum: ['Selling Price', 'Net Selling Price', 'After Discount', 'Before GST'],
      default: 'Net Selling Price',
    },
    roundOffSettings: {
      type: String,
      enum: ['None', 'Round to Nearest', 'Ceil', 'Floor'],
      default: 'None',
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommissionSettings', commissionSettingsSchema);

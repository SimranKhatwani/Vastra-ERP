const mongoose = require('mongoose');

const discountRuleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    offerName: {
      type: String,
      required: true,
    },
    offerType: {
      type: String,
      enum: ['Automatic', 'Coupon', 'ManualOverride'],
      required: true,
    },
    minBillAmount: {
      type: Number,
      default: 0,
    },
    maxBillAmount: {
      type: Number,
    },
    discountType: {
      type: String,
      enum: ['Flat', 'Percentage'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    maxDiscount: {
      type: Number,
    },
    applicableProducts: [{
      type: String,
    }],
    applicableCategories: [{
      type: String,
    }],
    applicableBrands: [{
      type: String,
    }],
    customerType: {
      type: String,
      default: 'All', // e.g. 'All', 'Loyalty', 'VIP'
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    priority: {
      type: Number,
      default: 1,
    },
    stackable: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    }
  },
  {
    timestamps: true,
  }
);

discountRuleSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('DiscountRule', discountRuleSchema);

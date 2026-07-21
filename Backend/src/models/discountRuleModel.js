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
    description: {
      type: String,
    },
    offerType: {
      type: String,
      enum: [
        'Automatic',
        'Coupon',
        'ManualOverride',
        'Product',
        'Category',
        'Brand',
        'Quantity',
        'Combo',
        'BuyXGetY',
        'LoyaltyRule'
      ],
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
    // Combo specific settings
    comboProducts: [{
      productId: String,
      quantity: Number
    }],
    // Buy X Get Y settings
    buyProductId: {
      type: String,
    },
    buyQuantity: {
      type: Number,
      default: 1,
    },
    getProductId: {
      type: String,
    },
    getQuantity: {
      type: Number,
      default: 1,
    },
    getDiscountPercent: {
      type: Number,
      default: 100, // 100% means free
    },
    // Loyalty settings
    requiredLoyaltyPoints: {
      type: Number,
    },
    maxRedemption: {
      type: Number,
    },
    customerType: {
      type: String,
      default: 'All',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    applicableStores: [{
      type: String,
    }],
    applicableWarehouses: [{
      type: String,
    }],
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
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active',
    },
    createdBy: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

discountRuleSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('DiscountRule', discountRuleSchema);

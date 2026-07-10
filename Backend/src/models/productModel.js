const mongoose = require('mongoose');

// Subdocument schema for Garment Variations (Color & Size tracking)
const variantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: [true, 'Please add a SKU for this variant'],
    trim: true,
  },
  color: {
    type: String,
    required: [true, 'Please specify a color'],
    trim: true,
  },
  size: {
    type: String,
    required: [true, 'Please specify a size (e.g. M, L, XL)'],
    trim: true,
  },
  stockQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock cannot be negative'],
  },
  additionalPrice: {
    type: Number,
    default: 0, // e.g. XXL size might cost +50
  },
});

const productSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    description: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    basePrice: {
      type: Number,
      required: [true, 'Please specify a base selling price'],
      min: [0, 'Price cannot be negative'],
    },
    taxRate: {
      type: Number,
      default: 0, // Percentage, e.g. 18 for 18% GST
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    variants: [variantSchema],
  },
  {
    timestamps: true,
  }
);

// Ensure that a product name is unique within a specific tenant's business
productSchema.index({ tenantId: 1, name: 1 }, { unique: true });

// Ensure variant SKUs are unique per tenant (A SKU should never repeat across the entire business)
productSchema.index({ tenantId: 1, 'variants.sku': 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);

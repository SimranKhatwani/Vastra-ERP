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
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    basePrice: {
      type: Number,
    },
    sellingPrice: {
      type: Number,
      default: 0,
    },
    purchasePrice: {
      type: Number,
      default: 0,
    },
    mrp: {
      type: Number,
      default: 0,
    },
    sku: { type: String },
    barcode: { type: String },
    color: { type: String },
    size: { type: String },
    taxRate: {
      type: Number,
      default: 0, // Percentage, e.g. 18 for 18% GST
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    minStockAlert: {
      type: Number,
      default: 10,
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'In Stock',
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
productSchema.index({ tenantId: 1, 'variants.sku': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Product', productSchema);

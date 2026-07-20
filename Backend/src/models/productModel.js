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
    productCode: { type: String, index: true },
    barcode: { type: String },
    color: { type: String },
    size: { type: String },
    taxRate: {
      type: Number,
      default: 0, // Percentage, e.g. 18 for 18% GST
    },
    fabricCode: { type: String },
    gsm: { type: String },
    width: { type: String },
    uom: { type: String },
    isActive: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    openingStock: {
      type: Number,
      default: 0,
      min: [0, 'Opening stock cannot be negative'],
    },
    purchasedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    soldQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    threshold: {
      type: Number,
      default: 0,
    },
    stockPercentage: {
      type: Number,
      default: 0,
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
productSchema.index(
  { tenantId: 1, 'variants.sku': 1 }, 
  { unique: true, partialFilterExpression: { 'variants.sku': { $exists: true, $type: 'string' } } }
);

// Pre-save hook to generate unique productCode if not present
productSchema.pre('save', function () {
  if (!this.productCode) {
    this.productCode = 'PRD-' + this._id.toString().substring(18).toUpperCase();
  }
});

module.exports = mongoose.model('Product', productSchema);

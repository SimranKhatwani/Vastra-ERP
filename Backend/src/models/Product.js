const mongoose = require('mongoose');
const baseSchemaPlugin = require('./plugins/baseSchema');

/**
 * Product is MASTER only.
 * DO NOT STORE STOCK HERE.
 */

const productSchema = new mongoose.Schema({
  importBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'PTImportHistory' },
  itemCode: {
    type: String,
    required: true,
    trim: true
  },
  designNo: {
    type: String,
    required: true,
    trim: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  subItem: {
    type: String,
    trim: true
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
  },
  firmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm'
  },
  firmName: {
    type: String,
    trim: true,
    default: ''
  },
  barcode: {
    type: String,
    trim: true,
    default: ''
  },
  primaryColor: {
    type: String,
    trim: true,
    default: ''
  },
  color: {
    type: String,
    trim: true,
    default: ''
  },
  secondaryColor: {
    type: String,
    trim: true,
    default: ''
  },
  size: {
    type: String,
    trim: true,
    default: ''
  },
  gender: {
    type: String,
    enum: ['MEN', 'WOMEN', 'KIDS', 'UNISEX'],
    default: 'UNISEX'
  },
  topBottomSet: {
    type: String,
    enum: ['TOP', 'BOTTOM', 'SET', 'ACCESSORY', 'OTHER'],
    default: 'TOP'
  },
  description: String,
  batch: {
    type: String,
    trim: true,
    default: ''
  },
  hsnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HSN'
  },
  gstId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GST'
  },
  imageUrl: {
    type: String,
    trim: true
  },
  defaultMRP: {
    type: Number,
    required: true,
    min: 0
  },
  purchaseRate: {
    type: Number,
    default: 0,
    min: 0
  },
  wspAfterGST: {
    type: Number,
    default: 0,
    min: 0
  },

  typeOfGst: {
    type: String,
    enum: ['I', 'E'],
    default: 'E'
  },
  gstStatus: {
    type: String,
    trim: true,
    default: ''
  },
  discountStatus: {
    type: String,
    enum: ['B', 'A', 'N'],
    default: 'N'
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

productSchema.index({ tenantId: 1, itemCode: 1 });
productSchema.index({ tenantId: 1, designNo: 1 });
productSchema.index({ tenantId: 1, barcode: 1 });
productSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Product', productSchema);

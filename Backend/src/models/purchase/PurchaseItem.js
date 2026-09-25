const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');


const purchaseItemSchema = new mongoose.Schema({
  importBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'PTImportHistory' },
  purchaseBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseBill',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  qty: {
    type: Number,
    required: true,
    min: 1
  },
  purchaseRate: {
    type: Number,
    required: true,
    min: 0
  },
  mrp: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  gstOnSalePrice: {
    type: Number,
    default: 5,
    min: 0
  },
  size: {
    type: String,
    required: true
  },
  color: String,
  rack: String,
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
  lineTotal: {
    type: Number,
    required: true
  }
});

purchaseItemSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('PurchaseItem', purchaseItemSchema);

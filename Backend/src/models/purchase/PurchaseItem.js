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
  size: {
    type: String,
    required: true
  },
  color: String,
  rack: String,
  lineTotal: {
    type: Number,
    required: true
  }
});

purchaseItemSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('PurchaseItem', purchaseItemSchema);

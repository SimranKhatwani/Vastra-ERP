const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

/**
 * SaleItem
 * CRITICAL RULE: One Sale Item references ONE InventoryPiece (NOT Product)
 */
const saleItemSchema = new mongoose.Schema({
  saleBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleBill',
    required: true
  },
  inventoryPieceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryPiece',
    required: true
  },
  barcode: {
    type: String,
    required: true
  },
  uniqueCode: {
    type: String,
    trim: true
  },
  mrp: {
    type: Number,
    required: true
  },
  sellingPrice: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  finalPrice: {
    type: Number,
    required: true
  },
  isReturned: {
    type: Boolean,
    default: false
  },
  returnReason: {
    type: String
  },
  returnedAt: {
    type: Date
  },
  isExchanged: {
    type: Boolean,
    default: false
  },
  exchangedFor: {
    type: String
  },
  exchangeReason: {
    type: String
  },
  exchangedAt: {
    type: Date
  }
});

saleItemSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('SaleItem', saleItemSchema);

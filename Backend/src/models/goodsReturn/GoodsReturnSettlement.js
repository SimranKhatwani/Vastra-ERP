const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const goodsReturnSettlementSchema = new mongoose.Schema({
  goodsReturnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoodsReturn',
    required: true
  },
  settlementType: {
    type: String,
    enum: ['CREDIT_NOTE', 'REPLACEMENT'],
    required: true
  },
  // Credit Note Details
  creditNoteNo: String,
  creditNoteDate: Date,
  creditNoteAmount: { type: Number, default: 0 },
  adjustedPurchaseBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill' },
  adjustedAmount: { type: Number, default: 0 },
  remainingCreditBalance: { type: Number, default: 0 },
  // Replacement Details (Value-Based Matching)
  replacementItems: [{
    barcode: String,
    designNo: String,
    itemName: String,
    size: String,
    color: String,
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    inventoryPieceId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryPiece' },
    scannedAtShowroom: { type: Boolean, default: false }
  }],
  expectedValue: { type: Number, default: 0 },
  receivedValue: { type: Number, default: 0 },
  valueDifference: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['PENDING', 'MATCHED', 'MISMATCH', 'COMPLETED'],
    default: 'PENDING'
  },
  remarks: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

goodsReturnSettlementSchema.index({ tenantId: 1, goodsReturnId: 1 });
goodsReturnSettlementSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('GoodsReturnSettlement', goodsReturnSettlementSchema);

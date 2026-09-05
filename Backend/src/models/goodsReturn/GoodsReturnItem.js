const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const goodsReturnItemSchema = new mongoose.Schema({
  goodsReturnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoodsReturn',
    required: true
  },
  inventoryPieceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryPiece',
    required: true
  },
  // Piece Metadata Snapshot
  barcode: { type: String, default: '' },
  uniqueCode: { type: String, default: '' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  designNo: { type: String, default: '' },
  itemCode: { type: String, default: '' },
  itemName: { type: String, default: '' },
  color: { type: String, default: '' },
  size: { type: String, default: '' },
  brand: { type: String, default: '' },
  category: { type: String, default: '' },
  // Purchase Metadata Snapshot
  purchaseBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill' },
  purchaseItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseItem' },
  purchaseDate: { type: Date },
  purchaseRate: { type: Number, required: true, min: 0 },
  gstPercent: { type: Number, default: 0 },
  typeOfGst: { type: String, enum: ['I', 'E'], default: 'E' },
  discountPercent: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  // Return Metrics
  returnQuantity: { type: Number, default: 1, min: 1 },
  returnRate: { type: Number, required: true, min: 0 },
  returnGstAmount: { type: Number, default: 0 },
  returnDiscountAmount: { type: Number, default: 0 },
  totalReturnAmount: { type: Number, required: true, min: 0 },
  reason: { type: String, default: 'Vendor Return' },
  remarks: String,
  // Verification & Physical Tracking
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  },
  physicalStatus: {
    type: String,
    enum: ['WITH_VENDOR', 'REJECTED_TRANSIT', 'REPLACEMENT_TRANSIT', 'RESTOCKED_IN_SHOWROOM', 'COMPLETED'],
    default: 'WITH_VENDOR'
  }
});

goodsReturnItemSchema.index({ tenantId: 1, goodsReturnId: 1 });
goodsReturnItemSchema.index({ tenantId: 1, inventoryPieceId: 1 });
goodsReturnItemSchema.index({ tenantId: 1, barcode: 1 });
goodsReturnItemSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('GoodsReturnItem', goodsReturnItemSchema);

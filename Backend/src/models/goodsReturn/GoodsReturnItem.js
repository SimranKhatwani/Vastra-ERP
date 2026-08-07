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
  returnRate: {
    type: Number,
    required: true
  },
  reason: String
});

goodsReturnItemSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('GoodsReturnItem', goodsReturnItemSchema);

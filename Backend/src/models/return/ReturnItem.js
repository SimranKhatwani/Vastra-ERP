const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const returnItemSchema = new mongoose.Schema({
  returnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Return',
    required: true
  },
  inventoryPieceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryPiece',
    required: true
  },
  refundRate: {
    type: Number,
    required: true
  },
  condition: {
    type: String,
    enum: ['RESELLABLE', 'DAMAGED', 'DEFECTIVE'],
    default: 'RESELLABLE'
  }
});

returnItemSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('ReturnItem', returnItemSchema);

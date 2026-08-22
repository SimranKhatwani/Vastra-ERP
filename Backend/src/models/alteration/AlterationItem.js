const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const alterationItemSchema = new mongoose.Schema({
  alterationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alteration',
    required: true
  },
  inventoryPieceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryPiece',
    required: false
  },
  pieceName: String,
  productName: String,
  barcode: String,
  uniqueCode: String,
  sku: String,
  size: String,
  color: String,
  instructions: {
    type: String,
    default: 'Standard Fit'
  },
  charge: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: 'PENDING'
  },
  alterationDetails: [String],
  measurements: mongoose.Schema.Types.Mixed
});

alterationItemSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('AlterationItem', alterationItemSchema);

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
    required: true
  },
  instructions: {
    type: String,
    required: true
  },
  charge: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
    default: 'PENDING'
  }
});

alterationItemSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('AlterationItem', alterationItemSchema);

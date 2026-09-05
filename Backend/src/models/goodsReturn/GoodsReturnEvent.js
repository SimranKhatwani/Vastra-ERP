const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const goodsReturnEventSchema = new mongoose.Schema({
  goodsReturnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoodsReturn',
    required: true
  },
  stage: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedByName: String,
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  metadata: mongoose.Schema.Types.Mixed,
  documents: [{
    title: String,
    fileUrl: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

goodsReturnEventSchema.index({ tenantId: 1, goodsReturnId: 1 });
goodsReturnEventSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('GoodsReturnEvent', goodsReturnEventSchema);

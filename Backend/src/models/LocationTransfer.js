const mongoose = require('mongoose');
const baseSchemaPlugin = require('./plugins/baseSchema');

const locationTransferSchema = new mongoose.Schema({
  transferNo: { type: String, default: '' },
  sourceLocationId: { type: String, default: '' },
  sourceLocationName: { type: String, default: '' },
  destinationLocationId: { type: String, default: '' },
  destinationLocationName: { type: String, default: '' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, default: '' },
  productSku: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
  status: { type: String, enum: ['Requested', 'Approved', 'Dispatched', 'In Transit', 'Received', 'Cancelled'], default: 'In Transit' },
  remarks: { type: String, default: '' },
  initiatedBy: { type: String, default: 'Admin' },
  dispatchedAt: { type: Date },
  receivedAt: { type: Date }
}, { timestamps: true });

locationTransferSchema.plugin(baseSchemaPlugin);
module.exports = mongoose.model('LocationTransfer', locationTransferSchema);

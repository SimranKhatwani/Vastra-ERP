const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const goodsReturnDispatchSchema = new mongoose.Schema({
  goodsReturnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoodsReturn',
    required: true
  },
  dispatchNo: {
    type: String,
    required: true
  },
  dispatchedQty: {
    type: Number,
    required: true,
    min: 1
  },
  dispatchedItems: [{
    goodsReturnItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'GoodsReturnItem' },
    barcode: String,
    designNo: String,
    itemName: String,
    qty: Number
  }],
  dispatchDate: {
    type: Date,
    default: Date.now
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  employeeName: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    enum: ['Hand Delivery', 'Courier', 'Transport', 'Company Vehicle'],
    default: 'Courier'
  },
  courierName: String,
  lrNumber: String,
  trackingNumber: String,
  documents: [{
    title: String,
    fileUrl: String
  }],
  remarks: String
});

goodsReturnDispatchSchema.index({ tenantId: 1, goodsReturnId: 1 });
goodsReturnDispatchSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('GoodsReturnDispatch', goodsReturnDispatchSchema);

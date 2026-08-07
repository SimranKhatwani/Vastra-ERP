const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const goodsReturnSchema = new mongoose.Schema({
  goodsReturnNo: {
    type: String,
    required: true,
    trim: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  purchaseBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseBill'
  },
  returnDate: {
    type: Date,
    default: Date.now
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'APPROVED', 'DISPATCHED', 'CANCELLED'],
    default: 'APPROVED'
  },
  remarks: String
});

goodsReturnSchema.index({ tenantId: 1, goodsReturnNo: 1 }, { unique: true });
goodsReturnSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('GoodsReturn', goodsReturnSchema);

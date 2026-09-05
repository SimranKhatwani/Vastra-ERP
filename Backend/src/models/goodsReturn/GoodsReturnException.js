const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const goodsReturnExceptionSchema = new mongoose.Schema({
  goodsReturnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoodsReturn',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  exceptionType: {
    type: String,
    enum: [
      'CN_AMOUNT_MISMATCH',
      'REPLACEMENT_VALUE_MISMATCH',
      'MISSING_PIECES',
      'REJECTED_NOT_RECEIVED',
      'LONG_PENDING',
      'FINANCIAL_DIFFERENCE',
      'QUANTITY_MISMATCH',
      'DUPLICATE_SETTLEMENT'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['HIGH', 'CRITICAL'],
    default: 'HIGH'
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['OPEN', 'RESOLVED'],
    default: 'OPEN'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionNotes: String,
  resolvedAt: Date
});

goodsReturnExceptionSchema.index({ tenantId: 1, goodsReturnId: 1 });
goodsReturnExceptionSchema.index({ tenantId: 1, status: 1 });
goodsReturnExceptionSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('GoodsReturnException', goodsReturnExceptionSchema);

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
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  returnDate: {
    type: Date,
    default: Date.now
  },
  // Workflow Status Dimensions
  dispatchStatus: {
    type: String,
    enum: ['NOT_DISPATCHED', 'PARTIALLY_DISPATCHED', 'DISPATCHED'],
    default: 'NOT_DISPATCHED'
  },
  vendorReceiptStatus: {
    type: String,
    enum: ['PENDING', 'RECEIVED', 'OVERDUE'],
    default: 'PENDING'
  },
  vendorVerificationStatus: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'PARTIALLY_ACCEPTED'],
    default: 'PENDING'
  },
  financialSettlementStatus: {
    type: String,
    enum: ['PENDING', 'CREDIT_NOTE_RECEIVED', 'REPLACEMENT_RECEIVED', 'MIXED_SETTLED', 'SETTLED'],
    default: 'PENDING'
  },
  physicalSettlementStatus: {
    type: String,
    enum: ['PENDING', 'REPLACEMENT_IN_TRANSIT', 'REJECTED_IN_TRANSIT', 'STOCK_RECEIVED', 'COMPLETED'],
    default: 'PENDING'
  },
  reconciliationStatus: {
    type: String,
    enum: ['MATCHED', 'QUANTITY_MISMATCH', 'VALUE_MISMATCH', 'EXCEPTION'],
    default: 'MATCHED'
  },
  overallStatus: {
    type: String,
    enum: ['GR_CREATED', 'DISPATCHED', 'SENT_TO_VENDOR', 'VENDOR_RECEIVED', 'ACCEPTED', 'REJECTED', 'PARTIALLY_SETTLED', 'COMPLETED', 'CANCELLED'],
    default: 'GR_CREATED'
  },
  // Financial Reconciliation
  originalValue: { type: Number, default: 0 },
  acceptedValue: { type: Number, default: 0 },
  rejectedValue: { type: Number, default: 0 },
  cnValue: { type: Number, default: 0 },
  replacementValue: { type: Number, default: 0 },
  pendingValue: { type: Number, default: 0 },
  vendorLiability: { type: Number, default: 0 },
  // Quantity Reconciliation
  sentQty: { type: Number, default: 0 },
  acceptedQty: { type: Number, default: 0 },
  rejectedQty: { type: Number, default: 0 },
  replacementQty: { type: Number, default: 0 },
  receivedQty: { type: Number, default: 0 },
  pendingQty: { type: Number, default: 0 },
  // Aging & Risk
  vendorReceivedDate: { type: Date },
  lastActivityDate: { type: Date, default: Date.now },
  agingDays: { type: Number, default: 0 },
  agingCategory: {
    type: String,
    enum: ['NORMAL', 'REMINDER', 'FOLLOW_UP', 'OWNER_FOLLOW_UP', 'CRITICAL'],
    default: 'NORMAL'
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW'
  },
  // Digital Vault & QR
  documents: [{
    title: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  qrCodeUrl: { type: String, default: '' },
  remarks: String
});

goodsReturnSchema.index({ tenantId: 1, goodsReturnNo: 1 }, { unique: true });
goodsReturnSchema.index({ tenantId: 1, vendorId: 1 });
goodsReturnSchema.index({ tenantId: 1, overallStatus: 1 });
goodsReturnSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('GoodsReturn', goodsReturnSchema);

const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const pssmSchema = new mongoose.Schema({
  pssmNo: {
    type: String,
    required: true,
    trim: true
  },
  saleBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleBill'
  },
  billNo: String,
  billBarcode: String,
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  customerName: String,
  customerPhone: String,
  alternatePhone: { type: String, trim: true, default: '' },
  whatsappNumber: { type: String, trim: true, default: '' },
  specialInstructions: { type: String, trim: true, default: '' },
  inseamBookCode: String,
  salesmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salesman'
  },
  salesmanName: String,
  customerWaitingOption: {
    type: String,
    enum: ['Waiting in Store', 'Will Come Later', 'Home Delivery Required'],
    default: 'Will Come Later'
  },
  serviceType: {
    type: String,
    default: 'Alteration'
  },
  gender: {
    type: String,
    enum: ['Gents', 'Ladies', 'Unisex'],
    default: 'Gents'
  },
  sourceType: {
    type: String,
    enum: ['SHOWROOM_PURCHASE', 'CUSTOMER_OWN_GARMENT'],
    default: 'SHOWROOM_PURCHASE'
  },
  expectedDeliveryDate: Date,
  status: {
    type: String,
    default: 'PENDING_ASSIGNMENT' // 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'IN_PROGRESS' | 'PARTIALLY_READY' | 'READY_FOR_DELIVERY' | 'CLOSED'
  },
  tailorName: String,
  vendorName: String,
  totalCharges: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    default: 'NORMAL' // 'HIGH' | 'NORMAL' | 'DELIVERY'
  },
  allowWhatsApp: {
    type: Boolean,
    default: true
  },
  reassignedFromSalesmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salesman'
  },
  reassignedFromSalesmanName: String,
  reassignedReason: String,
  reassignedAt: Date,
  trialRequired: {
    type: Boolean,
    default: false
  },
  trialDate: Date,
  fittingResult: String,
  requiredChanges: String,
  reAlterationRequired: {
    type: Boolean,
    default: false
  },
  remarks: String
});

pssmSchema.index({ tenantId: 1, pssmNo: 1 }, { unique: true });
pssmSchema.index({ tenantId: 1, billBarcode: 1 });
pssmSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('PSSM', pssmSchema);

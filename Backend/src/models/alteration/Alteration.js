const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');
const { ALTERATION_STATUS } = require('../../constants/status');

const alterationSchema = new mongoose.Schema({
  alterationNo: {
    type: String,
    required: true,
    trim: true
  },
  saleBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleBill'
  },
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
  garmentDescription: String,
  fabricDetails: String,
  expectedDeliveryDate: Date,
  status: {
    type: String,
    enum: Object.values(ALTERATION_STATUS),
    default: ALTERATION_STATUS.RECEIVED
  },
  tailorName: String,
  totalCharges: {
    type: Number,
    default: 0
  },
  commissionPaidAmount: {
    type: Number,
    default: 0
  },
  isCommissionPaid: {
    type: Boolean,
    default: false
  },
  commissionPercentage: {
    type: Number,
    default: 0
  },
  commissionAmount: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    default: 'Normal'
  },
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

alterationSchema.index({ tenantId: 1, alterationNo: 1 }, { unique: true });
alterationSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Alteration', alterationSchema);

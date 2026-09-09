const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');
const { TAILORING_JOB_STATUS } = require('../../constants/status');

const tailoringJobSchema = new mongoose.Schema({
  tailorInvoiceNo: { type: String, required: true, unique: true, index: true },
  jobDate: { type: Date, default: Date.now },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String },
  mobileNumber: { type: String },
  category: { type: String, enum: ['Gents', 'Ladies', 'Unisex'], default: 'Gents' },
  garmentService: { type: String },
  pssmId: { type: mongoose.Schema.Types.ObjectId, ref: 'PSSM', required: true, index: true },
  pssmItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'PSSMItem', required: true },
  saleBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleBill', index: true },
  billNo: { type: String },
  uniqueCode: { type: String },
  measurement: { type: mongoose.Schema.Types.Mixed },
  specialInstructions: { type: String },
  tailoringCharges: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  expectedDeliveryDate: { type: Date },
  currentStatus: { type: String, enum: Object.values(TAILORING_JOB_STATUS), default: TAILORING_JOB_STATUS.PENDING }
}, {
  timestamps: true
});

// Ensure a PSSMItem only has one TailoringJob per tenant
tailoringJobSchema.index({ tenantId: 1, pssmItemId: 1 }, { unique: true });

tailoringJobSchema.plugin(baseSchemaPlugin);

const TailoringJob = mongoose.model('TailoringJob', tailoringJobSchema);
module.exports = TailoringJob;

const mongoose = require('mongoose');
const baseSchemaPlugin = require('./plugins/baseSchema');
const { TENANT_STATUS } = require('../constants/status');

const tenantSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  gstin: {
    type: String,
    trim: true,
    uppercase: true
  },
  status: {
    type: String,
    enum: Object.values(TENANT_STATUS),
    default: TENANT_STATUS.ACTIVE
  },
  subscription: {
    planName: { type: String, default: 'STANDARD' },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    maxUsers: { type: Number, default: 10 },
    maxWarehouses: { type: Number, default: 3 }
  }
});

tenantSchema.plugin(baseSchemaPlugin, { tenantRequired: false });

module.exports = mongoose.model('Tenant', tenantSchema);

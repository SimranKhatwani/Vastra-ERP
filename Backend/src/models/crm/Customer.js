const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
  dob: Date,
  anniversary: Date,
  loyaltyPoints: { type: Number, default: 0 },
  dueBalance: { type: Number, default: 0 },
  advanceBalance: { type: Number, default: 0 }
});

customerSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
customerSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Customer', customerSchema);

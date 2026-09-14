const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const salesmanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: String,
  code: String,
  designation: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  age: { type: Number },
  address: { type: String, trim: true, default: '' },
  commissionPercentage: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAbsent: { type: Boolean, default: false },
  delegatedTo: { type: String, default: null }
});

salesmanSchema.index({ tenantId: 1, phone: 1 });
salesmanSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Salesman', salesmanSchema);


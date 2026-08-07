const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const customerAddressSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  addressType: { type: String, enum: ['HOME', 'WORK', 'BILLING', 'SHIPPING'], default: 'HOME' },
  street: String,
  city: String,
  state: String,
  pincode: String,
  isDefault: { type: Boolean, default: true }
});

customerAddressSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('CustomerAddress', customerAddressSchema);

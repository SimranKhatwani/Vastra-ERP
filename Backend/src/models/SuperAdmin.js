const mongoose = require('mongoose');
const baseSchemaPlugin = require('./plugins/baseSchema');

const superAdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

superAdminSchema.plugin(baseSchemaPlugin, { tenantRequired: false });

module.exports = mongoose.model('SuperAdmin', superAdminSchema);

const mongoose = require('mongoose');
const baseSchemaPlugin = require('./plugins/baseSchema');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
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
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  assignedWarehouses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  }],
  isTenantOwner: {
    type: Boolean,
    default: false
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  lastLogin: Date
});

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('User', userSchema);

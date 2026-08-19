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
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  plainPassword: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true,
    default: ''
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  age: {
    type: Number
  },
  address: {
    type: String,
    trim: true,
    default: ''
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

userSchema.index({ tenantId: 1, email: 1 }, { unique: true, sparse: true });
userSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('User', userSchema);

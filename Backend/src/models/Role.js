const mongoose = require('mongoose');
const baseSchemaPlugin = require('./plugins/baseSchema');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: String,
    required: true
  }],
  isSystemRole: {
    type: Boolean,
    default: false
  }
});

roleSchema.index({ tenantId: 1, name: 1 }, { unique: true });
roleSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Role', roleSchema);

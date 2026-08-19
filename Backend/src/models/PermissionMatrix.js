const mongoose = require('mongoose');

const permissionMatrixSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  roleName: {
    type: String,
    required: true
  },
  allowedModules: [{
    type: String
  }],
  moduleAccessLevels: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tabPermissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

permissionMatrixSchema.index({ tenantId: 1, roleName: 1 }, { unique: true });

module.exports = mongoose.model('PermissionMatrix', permissionMatrixSchema);

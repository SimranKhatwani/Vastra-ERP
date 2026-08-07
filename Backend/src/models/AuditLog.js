const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userName: String,
  userEmail: String,
  action: {
    type: String,
    required: true
  }, // e.g. LOGIN, LOGOUT, DELETE_PRODUCT, APPROVE_PURCHASE, OWNER_LOGIN, PERMISSION_CHANGE
  module: {
    type: String,
    required: true
  },
  method: String,
  endpoint: String,
  ipAddress: String,
  userAgent: String,
  details: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

auditLogSchema.index({ tenantId: 1, action: 1 });
auditLogSchema.index({ tenantId: 1, userId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

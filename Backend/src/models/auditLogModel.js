const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  timestamp: { type: String, required: true },
  user: { type: String, required: true },
  action: { type: String, required: true },
  module: { type: String, required: true },
  details: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);

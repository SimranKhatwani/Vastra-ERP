const mongoose = require('mongoose');

const sessionAuditSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
    },
    loginTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    logoutTime: {
      type: Date,
    },
    logoutReason: {
      type: String,
      enum: ['Manual Logout', 'Session Timeout', 'Token Expired', 'Force Logout', 'Active'],
      default: 'Active',
    },
    ipAddress: {
      type: String,
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    device: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SessionAudit', sessionAuditSchema);

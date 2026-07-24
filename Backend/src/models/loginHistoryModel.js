const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    loginId: {
      type: String,
      required: true,
    },
    employeeId: {
      type: String,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'Staff',
    },
    department: {
      type: String,
      default: 'General',
    },
    branch: {
      type: String,
      default: 'Main Store',
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
    logoutTime: {
      type: Date,
    },
    sessionDuration: {
      type: String,
      default: 'Active Now',
    },
    device: {
      type: String,
      default: 'Desktop',
    },
    browser: {
      type: String,
      default: 'Chrome',
    },
    operatingSystem: {
      type: String,
      default: 'Windows',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    status: {
      type: String,
      enum: ['Online', 'Logged Out', 'Session Expired', 'Force Logged Out', 'Failed Login', 'Locked'],
      default: 'Online',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LoginHistory', loginHistorySchema);

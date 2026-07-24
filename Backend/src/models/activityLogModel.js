const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    activityId: {
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
    module: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    recordId: {
      type: String,
    },
    recordName: {
      type: String,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['Success', 'Failed', 'Warning'],
      default: 'Success',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    device: {
      type: String,
      default: 'Desktop',
    },
    browser: {
      type: String,
      default: 'Chrome',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);

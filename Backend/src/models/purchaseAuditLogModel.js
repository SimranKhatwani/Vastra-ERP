const mongoose = require('mongoose');

const purchaseAuditLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    userName: { type: String, required: true },
    employeeId: { type: String },
    role: { type: String, required: true },
    itemViewed: { type: String },
    action: { type: String, default: 'View Purchase Details' },
    date: { type: String }, // e.g. YYYY-MM-DD
    time: { type: String }, // e.g. HH:MM:SS AM/PM
    device: { type: String },
    browser: { type: String },
    ipAddress: { type: String },
    details: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PurchaseAuditLog', purchaseAuditLogSchema);

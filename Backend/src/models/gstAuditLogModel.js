const mongoose = require('mongoose');

const gstAuditLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    invoiceNo: {
      type: String,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    originalGst: {
      type: Number,
      required: true,
    },
    modifiedGst: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    performedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GstAuditLog', gstAuditLogSchema);

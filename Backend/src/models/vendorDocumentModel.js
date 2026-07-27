const mongoose = require('mongoose');

const vendorDocumentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    documentType: {
      type: String,
      enum: [
        'GST Certificate',
        'Cancelled Cheque',
        'Purchase Agreement',
        'Rate List',
        'Catalogue',
        'Invoice',
        'Debit Note',
        'Credit Note',
        'LR Copy',
        'Other'
      ],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: String,
      default: '1.2 MB',
    },
    uploadedBy: {
      type: String,
      default: 'Admin',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

vendorDocumentSchema.index({ tenantId: 1, vendorId: 1, createdAt: -1 });

module.exports = mongoose.model('VendorDocument', vendorDocumentSchema);

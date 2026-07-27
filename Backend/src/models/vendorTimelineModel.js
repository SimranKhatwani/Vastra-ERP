const mongoose = require('mongoose');

const vendorTimelineSchema = new mongoose.Schema(
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
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    employeeName: {
      type: String,
      default: 'System Admin',
    },
    activityType: {
      type: String,
      required: true,
      enum: [
        'Call',
        'WhatsApp Message',
        'Email',
        'Purchase Order Shared',
        'Goods Return Shared',
        'Payment Advice Shared',
        'Outstanding Statement Shared',
        'Purchase Statement Shared',
        'Debit Note Shared',
        'Credit Note Shared',
        'Rate Enquiry Shared',
        'Product Images Shared',
        'Agreement Shared',
        'Internal Note Added',
        'Document Uploaded',
        'Follow-up Created',
        'Follow-up Completed'
      ],
    },
    documentId: {
      type: String,
      default: '',
    },
    documentNumber: {
      type: String,
      default: '',
    },
    channel: {
      type: String,
      enum: ['Call', 'WhatsApp', 'Email', 'System', 'In-Person'],
      default: 'System',
    },
    remarks: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'Completed',
    },
  },
  {
    timestamps: true,
  }
);

vendorTimelineSchema.index({ tenantId: 1, vendorId: 1, createdAt: -1 });

module.exports = mongoose.model('VendorTimeline', vendorTimelineSchema);

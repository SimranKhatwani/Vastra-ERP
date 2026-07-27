const mongoose = require('mongoose');

const vendorFollowUpSchema = new mongoose.Schema(
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
    followUpType: {
      type: String,
      enum: [
        'Pending Vendor Call',
        'Pending Goods Return',
        'Replacement Follow-up',
        'Credit Note Pending',
        'Payment Follow-up',
        'Dispatch Follow-up',
        'Rate Negotiation',
        'Other'
      ],
      default: 'Pending Vendor Call',
    },
    expectedDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    assignedEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    assignedEmployeeName: {
      type: String,
      default: 'Unassigned',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

vendorFollowUpSchema.index({ tenantId: 1, vendorId: 1, expectedDate: 1 });

module.exports = mongoose.model('VendorFollowUp', vendorFollowUpSchema);

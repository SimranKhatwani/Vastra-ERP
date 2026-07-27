const mongoose = require('mongoose');

const vendorNoteSchema = new mongoose.Schema(
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
      default: 'Admin',
    },
    content: {
      type: String,
      required: true,
    },
    noteType: {
      type: String,
      enum: ['Internal Note', 'Private Note', 'Pinned Note', 'Reminder Note'],
      default: 'Internal Note',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    mentionedEmployees: [{ type: String }],
    attachments: [
      {
        name: String,
        url: String,
      }
    ],
  },
  {
    timestamps: true,
  }
);

vendorNoteSchema.index({ tenantId: 1, vendorId: 1, createdAt: -1 });

module.exports = mongoose.model('VendorNote', vendorNoteSchema);

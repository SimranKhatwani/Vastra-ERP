const mongoose = require('mongoose');

const alterationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    alterationId: {
      type: String,
    },
    invoiceId: {
      type: String,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    customerId: {
      type: String,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
    },
    barcode: {
      type: String,
    },
    size: {
      type: String,
    },
    color: {
      type: String,
    },
    salespersonId: {
      type: String,
    },
    salespersonName: {
      type: String,
    },
    workerId: {
      type: String,
    },
    workerName: {
      type: String,
    },
    tailorId: {
      type: String,
    },
    tailorName: {
      type: String,
    },
    measurements: {
      type: Object,
      default: {},
    },
    alterationDetails: [
      {
        type: String,
      },
    ],
    customAlterationText: {
      type: String,
    },
    specialInstructions: {
      type: String,
    },
    deliveryDate: {
      type: String,
    },
    deliveryTime: {
      type: String,
    },
    trialDate: {
      type: String,
    },
    priority: {
      type: String,
      enum: ['Normal', 'Urgent', 'Express'],
      default: 'Normal',
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Assigned',
        'In Progress',
        'Ready for Trial',
        'Ready for Delivery',
        'Delivered',
        'Flagged for Review',
        'Cancelled',
      ],
      default: 'Pending',
    },
    createdBy: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alteration', alterationSchema);

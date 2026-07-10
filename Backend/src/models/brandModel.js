const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a brand name'],
      trim: true,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure that a brand name is unique within a specific tenant's business
brandSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Brand', brandSchema);

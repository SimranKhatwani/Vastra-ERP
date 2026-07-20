const mongoose = require('mongoose');

const taxConfigSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
      unique: true,
    },
    cgstRate: {
      type: Number,
      default: 5,
    },
    sgstRate: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TaxConfig', taxConfigSchema);

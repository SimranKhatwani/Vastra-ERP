const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: [true, 'Please add a business name'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Please add a business email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phone: {
      type: String,
    },
    plan: {
      type: String,
      enum: ['Starter', 'Professional', 'Enterprise', 'Trial'],
      default: 'Trial',
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tenant', tenantSchema);

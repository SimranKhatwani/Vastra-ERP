const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    expenseNo: {
      type: String,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'Rent', 'Utilities', 'Salary', 'Maintenance', 'Logistics',
        'Tax', 'Marketing', 'Miscellaneous', 'Electricity', 'Internet',
        'Courier', 'Packaging', 'Repairs', 'Fuel',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    gst: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other'],
      required: true,
    },
    vendorName: {
      type: String,
      trim: true,
    },
    referenceNo: {
      type: String,
      trim: true,
    },
    bankAccountName: {
      type: String,
      trim: true,
    },
    attachment: {
      type: String,
    },
    remarks: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: String,
      default: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.pre('validate', function () {
  if (!this.expenseNo) {
    this.expenseNo = `EXP-${Date.now().toString().substring(5)}-${Math.floor(10 + Math.random() * 90)}`;
  }
});

expenseSchema.index({ tenantId: 1, expenseNo: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Expense', expenseSchema);

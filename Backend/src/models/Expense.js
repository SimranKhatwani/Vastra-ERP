const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  expenseNo: {
    type: String,
    trim: true
  },
  date: {
    type: String,
    required: true,
    default: () => new Date().toISOString().slice(0, 10)
  },
  category: {
    type: String,
    required: true,
    trim: true,
    default: 'Miscellaneous'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  paymentMethod: {
    type: String,
    default: 'UPI'
  },
  referenceNo: {
    type: String,
    trim: true
  },
  paidTo: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

ExpenseSchema.index({ tenantId: 1, date: -1 });
ExpenseSchema.index({ tenantId: 1, category: 1 });

module.exports = mongoose.model('Expense', ExpenseSchema);

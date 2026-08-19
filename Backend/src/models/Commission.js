const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  salesmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salesman',
    index: true
  },
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  employeeRole: {
    type: String,
    enum: ['Salesperson', 'Worker'],
    default: 'Salesperson',
    index: true
  },
  sourceType: {
    type: String,
    enum: ['SaleBill', 'Alteration', 'ManualAdjustment'],
    default: 'SaleBill',
    index: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  saleItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleItem'
  },
  invoiceNo: {
    type: String,
    trim: true
  },
  productName: {
    type: String,
    trim: true,
    default: 'Garment Item'
  },
  quantity: {
    type: Number,
    default: 1
  },
  netAmountBasis: {
    type: Number,
    required: true,
    default: 0
  },
  commissionPercentage: {
    type: Number,
    required: true,
    default: 0
  },
  commissionAmount: {
    type: Number,
    required: true,
    default: 0
  },
  commissionPaidAmount: {
    type: Number,
    default: 0
  },
  commissionPendingAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Partially Paid', 'Paid', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

commissionSchema.index({ tenantId: 1, employeeId: 1, date: -1 });

module.exports = mongoose.model('Commission', commissionSchema);

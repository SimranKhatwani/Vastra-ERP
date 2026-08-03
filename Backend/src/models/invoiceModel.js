const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  productId: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
  },
  size: {
    type: String,
  },
  color: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  gstPercent: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
  uniqueCode: {
    type: String,
    index: true,
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
  commissionPercentageSalesperson: {
    type: Number,
    default: 0,
  },
  commissionPercentageWorker: {
    type: Number,
    default: 0,
  },
  commissionAmountSalesperson: {
    type: Number,
    default: 0,
  },
  commissionAmountWorker: {
    type: Number,
    default: 0,
  },
  totalCommission: {
    type: Number,
    default: 0,
  },
  commissionStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Cancelled'],
    default: 'Pending',
  },
  hasAlteration: {
    type: Boolean,
    default: false,
  },
  alterationRecord: {
    type: mongoose.Schema.Types.Mixed,
  },
  isReturned: {
    type: Boolean,
    default: false,
  },
  returnReason: {
    type: String,
  },
  returnedAt: {
    type: Date,
  },
  isExchanged: {
    type: Boolean,
    default: false,
  },
  exchangedFor: {
    type: String,
  },
  exchangeReason: {
    type: String,
  }
});

const invoiceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    invoiceNo: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
    },
    customerPhone: {
      type: String,
    },
    employeeId: {
      type: String,
    },
    employeeName: {
      type: String,
    },
    salespersonName: {
      type: String,
    },
    assignedTailor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    items: [invoiceItemSchema],
    subTotal: {
      type: Number,
      required: true,
    },
    discountTotal: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },
    gstTotal: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    billAdjustment: {
      type: {
        type: String,
        enum: ['Amount', 'Percentage']
      },
      operation: {
        type: String,
        enum: ['Discount', 'Charge']
      },
      value: Number,
      amount: Number,
      reason: String,
      isApproved: Boolean
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Wallet', 'Credit', 'Split'],
      required: true,
    },
    invoiceType: {
      type: String,
      enum: ['Retail', 'Wholesale', 'B2B'],
      default: 'Retail',
    },
    isBillingSalesModule: {
      type: Boolean,
      default: false,
      index: true,
    },
    splitPayments: [{
      method: String,
      amount: Number,
    }],
    amountPaid: {
      type: Number,
      required: true,
    },
    advanceApplied: {
      type: Number,
      default: 0,
    },
    loyaltyPointsUsed: {
      type: Number,
      default: 0,
    },
    outstandingAmount: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: Date,
    },
    hasReturn: {
      type: Boolean,
      default: false,
    },
    returnedAmount: {
      type: Number,
      default: 0,
    },
    hasExchange: {
      type: Boolean,
      default: false,
    },
    exchangeSlip: {
      type: mongoose.Schema.Types.Mixed,
    },
    reminderHistory: [{
      sentAt: { type: Date, default: Date.now },
      mode: { type: String }, // WhatsApp, SMS, Email
      status: { type: String }, // Sent, Failed
      count: { type: Number, default: 1 }
    }],
    status: {
      type: String,
      enum: ['Paid', 'Partial', 'Unpaid', 'Completed', 'Partially Returned', 'Returned', 'Partially Exchanged', 'Exchanged', 'Cancelled'],
      default: 'Paid',
    },
    expectedDeliveryDate: {
      type: Date,
    },
    fulfillmentStatus: {
      type: String,
      enum: ['Pending', 'Ready For Collection', 'Delivered'],
      default: 'Pending',
    },
    whatsappStatus: {
      type: String,
      enum: ['Pending', 'Sent', 'Failed'],
      default: 'Pending',
    },
    sentAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    messageId: {
      type: String,
    },
    adjustmentType: {
      type: String,
      enum: ['Amount', 'Percentage', 'None'],
      default: 'None',
    },
    adjustmentOperation: {
      type: String,
      enum: ['Discount', 'Charge', 'None'],
      default: 'None',
    },
    adjustmentValue: {
      type: Number,
      default: 0,
    },
    adjustmentAmount: {
      type: Number,
      default: 0,
    },
    adjustmentReason: {
      type: String,
    },
    adjustmentApprovalStatus: {
      type: String,
      enum: ['None', 'Approved', 'Pending'],
      default: 'None',
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.pre('validate', async function () {
  if (!this.invoiceNo) {
    this.invoiceNo = `INV-${Date.now().toString().substring(5)}-${Math.floor(Math.random() * 1000)}`;
  }

  // Generate / verify uniqueCode for each item
  if (this.items && this.items.length > 0) {
    const Invoice = mongoose.model('Invoice');
    const prefixes = ["TRK", "ITM", "UC"];
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    const generateCode = () => {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      let randomPart = "";
      for (let i = 0; i < 8; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `${prefix}-${randomPart}`;
    };

    for (const item of this.items) {
      let code = item.uniqueCode;
      let isUnique = false;

      while (!isUnique) {
        if (!code) {
          code = generateCode();
        }
        // Check if this code exists in any invoice items
        const existing = await Invoice.findOne({ "items.uniqueCode": code });
        if (existing) {
          // Duplicate found, regenerate
          code = generateCode();
        } else {
          isUnique = true;
        }
      }
      item.uniqueCode = code;
    }
  }
  
  const customStatuses = ['Returned', 'Partially Returned', 'Exchanged', 'Partially Exchanged', 'Cancelled', 'Completed'];
  
  const effectivePaid = (this.amountPaid || 0) + (this.advanceApplied || 0) + (this.loyaltyPointsUsed || 0);

  if (!customStatuses.includes(this.status)) {
    if (effectivePaid < this.grandTotal) {
      this.status = effectivePaid > 0 ? 'Partial' : 'Unpaid';
    } else {
      this.status = 'Paid';
    }
  }

  // Automatically compute outstanding amount
  this.outstandingAmount = Math.max(0, this.grandTotal - effectivePaid);

  // Set default dueDate (30 days from invoice date) if not present
  if (!this.dueDate) {
    const invDate = this.date || new Date();
    const due = new Date(invDate);
    due.setDate(due.getDate() + 30);
    this.dueDate = due;
  }
});

invoiceSchema.index({ tenantId: 1, invoiceNo: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);

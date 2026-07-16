const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    // Can be an ObjectId string for catalog products or "custom-garment" for custom items
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
    type: Number, // Selling price at the time of sale
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
    type: Number, // (price - discount) * quantity
    required: true,
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
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
      // Optional for walk-ins
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
      // For commissions
    },
    employeeName: {
      type: String,
    },
    salespersonName: {
      type: String,
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
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Wallet', 'Credit', 'Split'],
      required: true,
    },
    splitPayments: [{
      method: String,
      amount: Number,
    }],
    amountPaid: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Paid', 'Partial', 'Unpaid'],
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
  },
  {
    timestamps: true,
  }
);

// Auto-generate invoice number before validation if not provided
invoiceSchema.pre('validate', function () {
  if (!this.invoiceNo) {
    this.invoiceNo = `INV-${Date.now().toString().substring(5)}-${Math.floor(Math.random() * 1000)}`;
  }
  
  if (this.amountPaid < this.grandTotal) {
    this.status = this.amountPaid > 0 ? 'Partial' : 'Unpaid';
  } else {
    this.status = 'Paid';
  }
});

invoiceSchema.index({ tenantId: 1, invoiceNo: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);

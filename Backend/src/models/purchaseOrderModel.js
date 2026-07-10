const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  purchasePrice: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number, // purchasePrice * quantity
    required: true,
  },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    poNo: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    items: [poItemSchema],
    subTotal: {
      type: Number,
      required: true,
    },
    gstTotal: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    outstandingPaid: {
      type: Number,
      default: 0, // How much has been paid upfront
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate PO number before validation if not provided
purchaseOrderSchema.pre('validate', function () {
  if (!this.poNo) {
    this.poNo = `PO-${Date.now().toString().substring(5)}-${Math.floor(Math.random() * 1000)}`;
  }
});

purchaseOrderSchema.index({ tenantId: 1, poNo: 1 }, { unique: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);

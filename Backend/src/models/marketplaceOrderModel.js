const mongoose = require('mongoose');

const marketplaceOrderSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  marketplace: { type: String, required: true },
  orderId: { type: String, required: true },
  invoiceNo: { type: String },
  customerName: { type: String },
  productName: { type: String },
  sellingPrice: { type: Number, required: true },
  commissionPercent: { type: Number, default: 0 },
  commissionAmount: { type: Number, default: 0 },
  shippingCharges: { type: Number, default: 0 },
  packagingCharges: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  netSettlement: { type: Number, required: true },
  orderStatus: { type: String, default: 'Delivered' },
  settlementStatus: { type: String, default: 'Pending' },
  settlementDate: { type: String },
  profit: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('MarketplaceOrder', marketplaceOrderSchema);

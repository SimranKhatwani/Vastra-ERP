const mongoose = require('mongoose');

const whatsappConfigSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      unique: true,
      index: true,
    },
    phoneNumberId: {
      type: String,
      trim: true,
    },
    accessToken: {
      type: String,
      trim: true,
    },
    businessAccountId: {
      type: String,
      trim: true,
    },
    webhookVerifyToken: {
      type: String,
      trim: true,
    },
    defaultTemplate: {
      type: String,
      trim: true,
      default: 'Hello {{CustomerName}}\n\nThank you for shopping with Vastra Garments.\n\nInvoice Number:\n{{InvoiceNo}}\n\nInvoice Date:\n{{Date}}\n\nTotal Amount:\n₹{{Amount}}\n\nPlease find your invoice attached.\n\nThank you for choosing Vastra Garments.',
    },
    autoSendEnabled: {
      type: Boolean,
      default: false,
    },
    templateName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WhatsAppConfig', whatsappConfigSchema);

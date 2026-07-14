const invoiceRepository = require('../repositories/invoiceRepository');
const customerRepository = require('../repositories/customerRepository');
const whatsappConfigRepository = require('../repositories/whatsappConfigRepository');
const { generateInvoicePDF } = require('./pdfService');
const {
  uploadInvoicePDF,
  sendWhatsAppInvoice,
  buildMessageText,
} = require('./whatsappService');

/**
 * Orchestrates the full WhatsApp invoice dispatch pipeline:
 *   1. Fetch invoice and related customer
 *   2. Fetch tenant WhatsApp config
 *   3. Validate WhatsApp number and auto-send setting
 *   4. Generate PDF
 *   5. Upload PDF to Meta media endpoint
 *   6. Send WhatsApp message
 *   7. Update invoice whatsappStatus in DB
 *
 * @param {string} invoiceId  - MongoDB _id of the Invoice
 * @param {string} tenantId   - Tenant ObjectId string
 * @returns {Promise<{ success: boolean, messageId?: string, reason?: string }>}
 */
const processWhatsAppDispatch = async (invoiceId, tenantId) => {
  let invoice;
  let customer;

  // ── Step 1: Load invoice ────────────────────────────────────────────
  try {
    invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) {
      return { success: false, reason: 'Invoice not found' };
    }
  } catch (err) {
    console.error('[invoiceService] Failed to load invoice:', err.message);
    return { success: false, reason: `DB error: ${err.message}` };
  }

  // ── Step 2: Load customer (if any) ────────────────────────────────
  if (invoice.customerId) {
    try {
      customer = await customerRepository.findById(invoice.customerId);
    } catch (err) {
      console.warn('[invoiceService] Customer lookup failed, continuing without:', err.message);
    }
  }

  // ── Step 3: Determine the recipient WhatsApp number ────────────────
  const whatsappNumber =
    (customer && customer.whatsappNumber) || invoice.customerPhone || null;

  if (!whatsappNumber) {
    const reason = 'No WhatsApp number available for this customer.';
    await invoiceRepository.updateWhatsAppStatus(invoiceId, {
      whatsappStatus: 'Failed',
      failureReason: reason,
    });
    return { success: false, reason };
  }

  // ── Step 4: Load WhatsApp configuration ────────────────────────────
  let config;
  try {
    config = await whatsappConfigRepository.findByTenantId(tenantId);
  } catch (err) {
    console.error('[invoiceService] Failed to load WhatsApp config:', err.message);
  }

  // Allow env-variable fallback so the system works even before admin configures settings
  const resolvedConfig = {
    phoneNumberId: (config && config.phoneNumberId) || process.env.WA_PHONE_NUMBER_ID,
    accessToken: (config && config.accessToken) || process.env.WA_ACCESS_TOKEN,
    businessAccountId: (config && config.businessAccountId) || process.env.WA_BUSINESS_ACCOUNT_ID,
    defaultTemplate:
      (config && config.defaultTemplate) ||
      process.env.WA_DEFAULT_TEMPLATE ||
      'Hello {{CustomerName}}\n\nThank you for shopping with Vastra Garments.\n\nInvoice Number:\n{{InvoiceNo}}\n\nInvoice Date:\n{{Date}}\n\nTotal Amount:\n₹{{Amount}}\n\nPlease find your invoice attached.\n\nThank you for choosing Vastra Garments.',
    autoSendEnabled: config ? config.autoSendEnabled : false,
    templateName: (config && config.templateName) || process.env.WA_TEMPLATE_NAME || null,
  };

  if (!resolvedConfig.phoneNumberId || !resolvedConfig.accessToken) {
    const reason = 'WhatsApp API credentials are not configured. Please visit Settings → WhatsApp Configuration.';
    await invoiceRepository.updateWhatsAppStatus(invoiceId, {
      whatsappStatus: 'Failed',
      failureReason: reason,
    });
    return { success: false, reason };
  }

  // ── Step 5: Generate PDF ────────────────────────────────────────────
  let pdfBuffer;
  try {
    pdfBuffer = await generateInvoicePDF(invoice, customer);
  } catch (err) {
    const reason = `PDF generation failed: ${err.message}`;
    console.error('[invoiceService]', reason);
    await invoiceRepository.updateWhatsAppStatus(invoiceId, {
      whatsappStatus: 'Failed',
      failureReason: reason,
    });
    return { success: false, reason };
  }

  // ── Step 6: Upload PDF to Meta media endpoint ──────────────────────
  let mediaId;
  try {
    mediaId = await uploadInvoicePDF(
      resolvedConfig,
      pdfBuffer,
      `Invoice_${invoice.invoiceNo}.pdf`
    );
  } catch (err) {
    const reason = `PDF upload to Meta failed: ${err.response?.data?.error?.message || err.message}`;
    console.error('[invoiceService]', reason);
    await invoiceRepository.updateWhatsAppStatus(invoiceId, {
      whatsappStatus: 'Failed',
      failureReason: reason,
    });
    return { success: false, reason };
  }

  // ── Step 7: Send WhatsApp message ──────────────────────────────────
  let messageId;
  try {
    const customerName = (customer && customer.name) || invoice.customerName || 'Valued Customer';
    const messageText = buildMessageText(resolvedConfig.defaultTemplate, invoice, customerName);

    messageId = await sendWhatsAppInvoice(
      resolvedConfig,
      whatsappNumber,
      mediaId,
      invoice,
      customerName,
      messageText
    );
  } catch (err) {
    const reason = `WhatsApp send failed: ${err.response?.data?.error?.message || err.message}`;
    console.error('[invoiceService]', reason);
    await invoiceRepository.updateWhatsAppStatus(invoiceId, {
      whatsappStatus: 'Failed',
      failureReason: reason,
    });
    return { success: false, reason };
  }

  // ── Step 8: Mark invoice as Sent ───────────────────────────────────
  try {
    await invoiceRepository.updateWhatsAppStatus(invoiceId, {
      whatsappStatus: 'Sent',
      sentAt: new Date(),
      messageId,
      failureReason: undefined,
    });
  } catch (err) {
    console.error('[invoiceService] Failed to update status after send:', err.message);
  }

  return { success: true, messageId };
};

module.exports = { processWhatsAppDispatch };

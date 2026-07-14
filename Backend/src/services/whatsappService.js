const axios = require('axios');
const FormData = require('form-data');

const GRAPH_API_VERSION = 'v20.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Builds the message text from admin-configured template.
 * Replaces {{CustomerName}}, {{InvoiceNo}}, {{Date}}, {{Amount}}
 */
const buildMessageText = (template, invoice, customerName) => {
  const dateStr = invoice.date
    ? new Date(invoice.date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return template
    .replace(/\{\{CustomerName\}\}/g, customerName || 'Valued Customer')
    .replace(/\{\{InvoiceNo\}\}/g, invoice.invoiceNo || '')
    .replace(/\{\{Date\}\}/g, dateStr)
    .replace(/\{\{Amount\}\}/g, (invoice.grandTotal || 0).toLocaleString('en-IN'));
};

/**
 * Normalise a phone number to E.164 format for WhatsApp.
 * Strips non-digits, prepends 91 if a 10-digit Indian number is detected.
 */
const normalisePhone = (raw) => {
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 13 && digits.startsWith('091')) return digits.substring(1);
  return digits;
};

/**
 * Uploads a PDF buffer to Meta's media endpoint and returns the media_id.
 * @param {Object} config - WhatsApp config with accessToken and phoneNumberId
 * @param {Buffer} pdfBuffer - The PDF Buffer
 * @param {string} fileName - Desired file name
 * @returns {Promise<string>} - media_id
 */
const uploadInvoicePDF = async (config, pdfBuffer, fileName) => {
  const form = new FormData();
  form.append('file', pdfBuffer, {
    filename: fileName || 'invoice.pdf',
    contentType: 'application/pdf',
  });
  form.append('type', 'application/pdf');
  form.append('messaging_product', 'whatsapp');

  const response = await axios.post(
    `${GRAPH_BASE}/${config.phoneNumberId}/media`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${config.accessToken}`,
      },
    }
  );

  return response.data.id; // media_id
};

/**
 * Sends a WhatsApp document message with the invoice PDF.
 * Uses a template message if templateName is configured, otherwise sends
 * a direct document message with a caption.
 *
 * @param {Object} config - WhatsApp config
 * @param {string} recipientPhone - E.164 formatted phone number
 * @param {string} mediaId - The uploaded PDF media_id
 * @param {Object} invoice - Invoice document
 * @param {string} customerName - Display name of the customer
 * @param {string} messageText - Pre-rendered message body text
 * @returns {Promise<string>} - WhatsApp message_id
 */
const sendWhatsAppInvoice = async (config, recipientPhone, mediaId, invoice, customerName, messageText) => {
  const to = normalisePhone(recipientPhone);

  let payload;

  if (config.templateName) {
    // ── Template message (requires Meta approval) ──────────────────────
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: config.templateName,
        language: { code: 'en_IN' },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'document',
                document: {
                  id: mediaId,
                  filename: `Invoice_${invoice.invoiceNo}.pdf`,
                },
              },
            ],
          },
          {
            type: 'body',
            parameters: [
              { type: 'text', text: customerName || 'Valued Customer' },
              { type: 'text', text: invoice.invoiceNo || '' },
              {
                type: 'text',
                text: (invoice.grandTotal || 0).toLocaleString('en-IN'),
              },
            ],
          },
        ],
      },
    };
  } else {
    // ── Direct document message (works within 24-hour window) ──────────
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: {
        id: mediaId,
        filename: `Invoice_${invoice.invoiceNo}.pdf`,
        caption: messageText,
      },
    };
  }

  const response = await axios.post(
    `${GRAPH_BASE}/${config.phoneNumberId}/messages`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // Meta returns: { messages: [{ id: "wamid.xxx" }] }
  const messages = response.data?.messages;
  if (messages && messages.length > 0) {
    return messages[0].id;
  }

  throw new Error('WhatsApp API did not return a message ID');
};

/**
 * Verifies the Meta webhook challenge (GET request).
 * @param {string} mode
 * @param {string} token
 * @param {string} challenge
 * @param {string} verifyToken - The token stored in our config
 * @returns {string|null} - Returns the challenge if valid, null otherwise
 */
const verifyWebhookChallenge = (mode, token, challenge, verifyToken) => {
  if (mode === 'subscribe' && token === verifyToken) {
    return challenge;
  }
  return null;
};

module.exports = {
  uploadInvoicePDF,
  sendWhatsAppInvoice,
  verifyWebhookChallenge,
  normalisePhone,
  buildMessageText,
};

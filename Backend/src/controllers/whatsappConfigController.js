const whatsappConfigRepository = require('../repositories/whatsappConfigRepository');
const { verifyWebhookChallenge } = require('../services/whatsappService');
const invoiceRepository = require('../repositories/invoiceRepository');

/**
 * GET /api/whatsapp-config
 * Returns the current tenant's WhatsApp configuration.
 * The accessToken is masked in the response for security.
 */
exports.getConfig = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const config = await whatsappConfigRepository.findByTenantId(tenantId);

    if (!config) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No WhatsApp configuration found. Please configure it below.',
      });
    }

    // Mask the access token — only reveal last 6 chars
    const safeConfig = {
      ...config.toObject(),
      accessToken: config.accessToken
        ? `${'•'.repeat(Math.max(0, config.accessToken.length - 6))}${config.accessToken.slice(-6)}`
        : '',
    };

    res.status(200).json({ success: true, data: safeConfig });
  } catch (error) {
    console.error('[whatsappConfigController.getConfig]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/whatsapp-config
 * Save or update the WhatsApp configuration for this tenant.
 * If the submitted accessToken still looks like a masked value (contains '•'), keep the existing one.
 */
exports.saveConfig = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      phoneNumberId,
      accessToken,
      businessAccountId,
      webhookVerifyToken,
      defaultTemplate,
      autoSendEnabled,
      templateName,
    } = req.body;

    // Build the update payload, only replacing accessToken if a real (unmasked) value is provided
    const updatePayload = {
      phoneNumberId,
      businessAccountId,
      webhookVerifyToken,
      defaultTemplate,
      autoSendEnabled,
      templateName,
    };

    if (accessToken && !accessToken.includes('•')) {
      updatePayload.accessToken = accessToken;
    }

    const saved = await whatsappConfigRepository.saveConfig(tenantId, updatePayload);

    // Return masked token
    const safeConfig = {
      ...saved.toObject(),
      accessToken: saved.accessToken
        ? `${'•'.repeat(Math.max(0, saved.accessToken.length - 6))}${saved.accessToken.slice(-6)}`
        : '',
    };

    res.status(200).json({
      success: true,
      message: 'WhatsApp configuration saved successfully.',
      data: safeConfig,
    });
  } catch (error) {
    console.error('[whatsappConfigController.saveConfig]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/whatsapp-config/webhook
 * Meta webhook verification challenge handler.
 */
exports.verifyWebhook = async (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Try tenant-specific verify token, fall back to env
    const tenantId = req.query.tenantId;
    let storedToken = process.env.WA_WEBHOOK_VERIFY_TOKEN || '';

    if (tenantId) {
      const config = await whatsappConfigRepository.findByTenantId(tenantId);
      if (config && config.webhookVerifyToken) storedToken = config.webhookVerifyToken;
    }

    const result = verifyWebhookChallenge(mode, token, challenge, storedToken);
    if (result !== null) {
      return res.status(200).send(result);
    }

    res.status(403).json({ success: false, message: 'Webhook verification failed' });
  } catch (error) {
    console.error('[whatsappConfigController.verifyWebhook]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/whatsapp-config/webhook
 * Handles incoming Meta webhook status updates (delivered, read, failed).
 * Updates the invoice's whatsappStatus automatically.
 */
exports.handleWebhookEvent = async (req, res) => {
  try {
    const body = req.body;

    // Meta always expects a 200 OK immediately
    res.status(200).send('EVENT_RECEIVED');

    if (body.object !== 'whatsapp_business_account') return;

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const statuses = change.value?.statuses || [];
        for (const status of statuses) {
          const { id: messageId, status: waStatus } = status;
          if (!messageId) continue;

          const invoice = await invoiceRepository.findByMessageId(messageId);
          if (!invoice) continue;

          if (waStatus === 'delivered' || waStatus === 'read') {
            await invoiceRepository.updateWhatsAppStatus(invoice._id, {
              whatsappStatus: 'Sent',
              sentAt: invoice.sentAt || new Date(),
            });
          } else if (waStatus === 'failed') {
            const errMsg = status.errors?.[0]?.title || 'Meta reported delivery failure';
            await invoiceRepository.updateWhatsAppStatus(invoice._id, {
              whatsappStatus: 'Failed',
              failureReason: errMsg,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('[whatsappConfigController.handleWebhookEvent]', error);
  }
};

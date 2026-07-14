const WhatsAppConfig = require('../models/whatsappConfigModel');

class WhatsAppConfigRepository {
  async findByTenantId(tenantId) {
    return await WhatsAppConfig.findOne({ tenantId });
  }

  async saveConfig(tenantId, configData) {
    return await WhatsAppConfig.findOneAndUpdate(
      { tenantId },
      { ...configData, tenantId },
      { new: true, upsert: true, runValidators: true }
    );
  }
}

module.exports = new WhatsAppConfigRepository();

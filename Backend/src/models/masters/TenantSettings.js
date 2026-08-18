const mongoose = require('mongoose');

/**
 * Generic key-value settings store scoped per tenant.
 * Each record is a named config blob: { tenantId, key, value: { ... } }
 */
const TenantSettingsSchema = new mongoose.Schema({
  tenantId:  { type: String, required: true },
  key:       { type: String, required: true },   // e.g. 'loyalty_settings'
  value:     { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

TenantSettingsSchema.index({ tenantId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('TenantSettings', TenantSettingsSchema);

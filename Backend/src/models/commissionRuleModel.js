const mongoose = require('mongoose');

const commissionRuleSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  ruleText: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('CommissionRule', commissionRuleSchema);

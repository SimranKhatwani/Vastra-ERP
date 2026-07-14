const MarketplaceOrder = require('../models/marketplaceOrderModel');
const Influencer = require('../models/influencerModel');
const CommissionRule = require('../models/commissionRuleModel');
const SettlementHistory = require('../models/settlementHistoryModel');
const AuditLog = require('../models/auditLogModel');

// 1. Marketplace Orders
exports.getMarketplaceOrders = async (req, res) => {
  try {
    const data = await MarketplaceOrder.find({ tenantId: req.user.tenantId }).sort('-createdAt');
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createMarketplaceOrder = async (req, res) => {
  try {
    const data = await MarketplaceOrder.create({ ...req.body, tenantId: req.user.tenantId });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMarketplaceOrder = async (req, res) => {
  try {
    await MarketplaceOrder.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Influencers
exports.getInfluencers = async (req, res) => {
  try {
    const data = await Influencer.find({ tenantId: req.user.tenantId }).sort('-createdAt');
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createInfluencer = async (req, res) => {
  try {
    const data = await Influencer.create({ ...req.body, tenantId: req.user.tenantId });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteInfluencer = async (req, res) => {
  try {
    await Influencer.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Commission Rules
exports.getCommissionRules = async (req, res) => {
  try {
    const data = await CommissionRule.find({ tenantId: req.user.tenantId });
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCommissionRule = async (req, res) => {
  try {
    const data = await CommissionRule.create({ ...req.body, tenantId: req.user.tenantId });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Settlement History
exports.getSettlementHistory = async (req, res) => {
  try {
    const data = await SettlementHistory.find({ tenantId: req.user.tenantId }).sort('-createdAt');
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSettlementHistory = async (req, res) => {
  try {
    const data = await SettlementHistory.create({ ...req.body, tenantId: req.user.tenantId });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Audit Logs
exports.getAuditLogs = async (req, res) => {
  try {
    const data = await AuditLog.find({ tenantId: req.user.tenantId }).sort('-createdAt');
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAuditLog = async (req, res) => {
  try {
    const data = await AuditLog.create({ ...req.body, tenantId: req.user.tenantId });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

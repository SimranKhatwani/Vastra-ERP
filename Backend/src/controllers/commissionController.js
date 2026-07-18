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

// 6. Staff Commission Engine
const CommissionHistory = require('../models/commissionHistoryModel');
const CommissionSettings = require('../models/commissionSettingsModel');
const Employee = require('../models/employeeModel');

exports.getCommissionHistory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const history = await CommissionHistory.find({ tenantId }).sort('-createdAt').lean();
    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCommissionStats = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const history = await CommissionHistory.find({ tenantId }).lean();
    
    let totalToday = 0;
    history.forEach(h => {
      if (new Date(h.createdAt) >= today) {
        totalToday += h.commissionAmount;
      }
    });

    const breakdown = await CommissionHistory.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: "$employeeRole",
          totalCommission: { $sum: "$commissionAmount" },
          pendingCommission: {
            $sum: {
              $cond: [{ $eq: ["$status", "Pending"] }, "$commissionAmount", 0]
            }
          }
        }
      }
    ]);

    res.status(200).json({ 
      success: true, 
      data: {
        totalToday,
        breakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let settings = await CommissionSettings.findOne({ tenantId });
    if (!settings) {
      settings = await CommissionSettings.create({ tenantId });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let settings = await CommissionSettings.findOneAndUpdate(
      { tenantId },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

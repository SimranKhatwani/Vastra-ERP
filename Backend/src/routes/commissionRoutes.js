const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  getMarketplaceOrders, createMarketplaceOrder, deleteMarketplaceOrder,
  getInfluencers, createInfluencer, deleteInfluencer,
  getCommissionRules, createCommissionRule,
  getSettlementHistory, createSettlementHistory,
  getAuditLogs, createAuditLog
} = require('../controllers/commissionController');

const router = express.Router();

// Marketplace Orders
router.route('/marketplace')
  .get(protect, getMarketplaceOrders)
  .post(protect, createMarketplaceOrder);
router.route('/marketplace/:id')
  .delete(protect, deleteMarketplaceOrder);

// Influencers
router.route('/influencers')
  .get(protect, getInfluencers)
  .post(protect, createInfluencer);
router.route('/influencers/:id')
  .delete(protect, deleteInfluencer);

// Commission Rules
router.route('/rules')
  .get(protect, getCommissionRules)
  .post(protect, createCommissionRule);

// Settlement History
router.route('/settlements')
  .get(protect, getSettlementHistory)
  .post(protect, createSettlementHistory);

// Audit Logs
router.route('/audit')
  .get(protect, getAuditLogs)
  .post(protect, createAuditLog);

module.exports = router;

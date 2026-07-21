const express = require('express');
const {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  duplicateRule,
  archiveRule,
  toggleRuleStatus,
  requestApproval,
  approveRequest
} = require('../controllers/discountController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/rules', protect, getRules);
router.post('/rules', protect, createRule);
router.put('/rules/:id', protect, updateRule);
router.delete('/rules/:id', protect, deleteRule);

// Duplication & status toggles
router.post('/rules/:id/duplicate', protect, duplicateRule);
router.put('/rules/:id/archive', protect, archiveRule);
router.put('/rules/:id/toggle', protect, toggleRuleStatus);

// Overrides approvals
router.post('/request-approval', protect, requestApproval);
router.post('/approve', protect, approveRequest);

module.exports = router;

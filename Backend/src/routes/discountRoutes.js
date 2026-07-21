const express = require('express');
const { getRules, createRule, updateRule, deleteRule, requestApproval, approveRequest } = require('../controllers/discountController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Publicly read rules during checkout
router.get('/rules', protect, getRules);

// Create / Update / Delete Rules (Admin/Manager permissions checked inside controller role checks or here)
router.post('/rules', protect, createRule);
router.put('/rules/:id', protect, updateRule);
router.delete('/rules/:id', protect, deleteRule);

// Override Approvals
router.post('/request-approval', protect, requestApproval);
router.post('/approve', protect, approveRequest);

module.exports = router;

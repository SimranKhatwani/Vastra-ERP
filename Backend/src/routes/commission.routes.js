const express = require('express');
const CommissionController = require('../controllers/commission.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');

const router = express.Router();

router.use(authenticate, tenantContext);

router.get('/staff/history', CommissionController.getCommissionHistory);
router.put('/staff/pay/:employeeId', CommissionController.payStaffCommissions);

router.get('/staff/stats', CommissionController.getStaffStats);
router.get('/staff/settings', CommissionController.getCommissionSettings);
router.put('/staff/settings', CommissionController.updateCommissionSettings);
router.post('/staff/settings', CommissionController.updateCommissionSettings);

router.get('/marketplace', (req, res) => res.status(200).json({ success: true, data: [] }));
router.get('/influencers', (req, res) => res.status(200).json({ success: true, data: [] }));
router.get('/settlements', (req, res) => res.status(200).json({ success: true, data: [] }));
router.get('/audit', (req, res) => res.status(200).json({ success: true, data: [] }));

module.exports = router;

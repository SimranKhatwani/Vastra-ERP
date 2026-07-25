const express = require('express');
const router = express.Router();
const { getMorningActions, getStaffDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/morning-actions', protect, getMorningActions);
router.get('/staff-summary', protect, getStaffDashboardStats);

module.exports = router;

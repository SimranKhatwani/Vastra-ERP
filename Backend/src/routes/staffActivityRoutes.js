const express = require('express');
const router = express.Router();
const staffActivityController = require('../controllers/staffActivityController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All staff activity routes require authentication and Admin / Owner authorization
router.use(protect);
router.use(authorize('admin', 'businessadmin', 'superadmin', 'owner'));

router.get('/activity-logs', staffActivityController.getActivityLogs);
router.get('/activity-logs/:id', staffActivityController.getActivityLogById);

router.get('/login-history', staffActivityController.getLoginHistory);
router.get('/login-history/:id', staffActivityController.getLoginHistoryById);

router.post('/force-logout/:employeeId', staffActivityController.forceLogoutUser);
router.post('/toggle-lock/:employeeId', staffActivityController.toggleLockAccount);

module.exports = router;

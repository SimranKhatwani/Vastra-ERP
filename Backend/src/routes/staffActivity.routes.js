const express = require('express');
const StaffActivityController = require('../controllers/staffActivity.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');

const router = express.Router();

router.use(authenticate, tenantContext);

// Activity Logs (audit trail)
router.get('/activity-logs', StaffActivityController.getActivityLogs);

// Login History
router.get('/login-history', StaffActivityController.getLoginHistory);

// Admin Actions
router.post('/force-logout/:employeeId', StaffActivityController.forceLogout);
router.post('/toggle-lock/:employeeId', StaffActivityController.toggleLock);

module.exports = router;

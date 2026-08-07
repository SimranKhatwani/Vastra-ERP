const express = require('express');
const LoyaltyController = require('../controllers/loyalty.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/earn', authorize(PERMISSIONS.CRM_UPDATE), auditLog('LOYALTY_EARN', 'loyalty'), LoyaltyController.earnPoints);
router.post('/redeem', authorize(PERMISSIONS.CRM_UPDATE), auditLog('LOYALTY_REDEEM', 'loyalty'), LoyaltyController.redeemPoints);
router.get('/history/:customerId', authorize(PERMISSIONS.CRM_READ), LoyaltyController.getHistory);

module.exports = router;

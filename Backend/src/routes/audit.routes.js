const express = require('express');
const AuditController = require('../controllers/audit.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate);

router.post('/track', AuditController.trackAuditLog);
router.get('/', authorize([PERMISSIONS.AUDIT_READ, 'tenant.read']), AuditController.getAuditLogs);

module.exports = router;

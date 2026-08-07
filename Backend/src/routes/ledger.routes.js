const express = require('express');
const LedgerController = require('../controllers/ledger.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.get('/customer/:customerId', authorize(PERMISSIONS.LEDGER_READ), LedgerController.getCustomerLedger);
router.get('/customer/:customerId/export', authorize(PERMISSIONS.LEDGER_READ), LedgerController.exportLedger);
router.post('/adjust', authorize(PERMISSIONS.LEDGER_ADJUST), auditLog('LEDGER_ADJUSTMENT', 'ledger'), LedgerController.recordAdjustment);

module.exports = router;

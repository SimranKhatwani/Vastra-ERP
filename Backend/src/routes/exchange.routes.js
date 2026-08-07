const express = require('express');
const ExchangeController = require('../controllers/exchange.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.EXCHANGE_CREATE), auditLog('CREATE_EXCHANGE', 'exchanges'), ExchangeController.createExchange);
router.get('/', authorize(PERMISSIONS.EXCHANGE_READ), ExchangeController.getExchanges);
router.get('/export', authorize(PERMISSIONS.EXCHANGE_READ), ExchangeController.exportExchanges);
router.get('/:id', authorize(PERMISSIONS.EXCHANGE_READ), ExchangeController.getExchangeById);

module.exports = router;

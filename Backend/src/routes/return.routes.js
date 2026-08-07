const express = require('express');
const ReturnController = require('../controllers/return.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/validate', authorize(PERMISSIONS.RETURN_READ), ReturnController.validateReturn);
router.post('/', authorize(PERMISSIONS.RETURN_CREATE), auditLog('CREATE_RETURN', 'returns'), ReturnController.createReturn);
router.get('/', authorize(PERMISSIONS.RETURN_READ), ReturnController.getReturns);
router.get('/export', authorize(PERMISSIONS.RETURN_READ), ReturnController.exportReturns);
router.get('/:id', authorize(PERMISSIONS.RETURN_READ), ReturnController.getReturnById);

module.exports = router;

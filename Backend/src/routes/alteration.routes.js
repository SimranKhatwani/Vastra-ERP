const express = require('express');
const AlterationController = require('../controllers/alteration.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.ALTERATION_CREATE), auditLog('CREATE_ALTERATION', 'alterations'), AlterationController.createAlteration);
router.get('/', authorize(PERMISSIONS.ALTERATION_READ), AlterationController.getAlterations);
router.get('/pending-items', authorize(PERMISSIONS.ALTERATION_READ), AlterationController.getPendingItems);
router.get('/dashboard', authorize(PERMISSIONS.ALTERATION_READ), AlterationController.getDashboard);
router.get('/:id', authorize(PERMISSIONS.ALTERATION_READ), AlterationController.getAlterationById);
router.patch('/:id/status', authorize(PERMISSIONS.ALTERATION_UPDATE), auditLog('UPDATE_ALTERATION_STATUS', 'alterations'), AlterationController.updateStatus);

module.exports = router;

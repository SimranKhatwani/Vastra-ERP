const express = require('express');
const FirmController = require('../controllers/firm.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.FIRM_CREATE), auditLog('CREATE_FIRM', 'firms'), FirmController.createFirm);
router.get('/', authorize(PERMISSIONS.FIRM_READ), FirmController.getFirms);
router.get('/:id', authorize(PERMISSIONS.FIRM_READ), FirmController.getFirmById);
router.put('/:id', authorize(PERMISSIONS.FIRM_UPDATE), auditLog('UPDATE_FIRM', 'firms'), FirmController.updateFirm);
router.delete('/:id', authorize(PERMISSIONS.FIRM_DELETE), auditLog('DELETE_FIRM', 'firms'), FirmController.deleteFirm);

module.exports = router;

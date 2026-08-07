const express = require('express');
const MasterController = require('../controllers/master.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/:type', authorize(PERMISSIONS.MASTER_CREATE), auditLog('CREATE_MASTER', 'masters'), MasterController.createMaster);
router.get('/:type', authorize(PERMISSIONS.MASTER_READ), MasterController.getMasters);
router.get('/:type/export', authorize(PERMISSIONS.MASTER_READ), MasterController.exportMasters);
router.get('/:type/:id', authorize(PERMISSIONS.MASTER_READ), MasterController.getMasterById);
router.put('/:type/:id', authorize(PERMISSIONS.MASTER_UPDATE), auditLog('UPDATE_MASTER', 'masters'), MasterController.updateMaster);
router.delete('/:type/:id', authorize(PERMISSIONS.MASTER_DELETE), auditLog('DELETE_MASTER', 'masters'), MasterController.deleteMaster);
router.post('/:type/:id/restore', authorize(PERMISSIONS.MASTER_UPDATE), auditLog('RESTORE_MASTER', 'masters'), MasterController.restoreMaster);
router.post('/:type/bulk-delete', authorize(PERMISSIONS.MASTER_DELETE), auditLog('BULK_DELETE_MASTERS', 'masters'), MasterController.bulkDeleteMasters);
router.post('/:type/bulk-status', authorize(PERMISSIONS.MASTER_UPDATE), auditLog('BULK_STATUS_MASTERS', 'masters'), MasterController.bulkUpdateStatus);

module.exports = router;

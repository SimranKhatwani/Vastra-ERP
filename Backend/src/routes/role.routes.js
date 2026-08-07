const express = require('express');
const RoleController = require('../controllers/role.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.ROLE_CREATE), auditLog('CREATE_ROLE', 'roles'), RoleController.createRole);
router.get('/', authorize(PERMISSIONS.ROLE_READ), RoleController.getRoles);
router.get('/permission-matrix', authorize(PERMISSIONS.ROLE_READ), RoleController.getPermissionMatrix);
router.get('/:id', authorize(PERMISSIONS.ROLE_READ), RoleController.getRoleById);
router.put('/:id', authorize(PERMISSIONS.ROLE_UPDATE), auditLog('UPDATE_ROLE', 'roles'), RoleController.updateRole);
router.delete('/:id', authorize(PERMISSIONS.ROLE_DELETE), auditLog('DELETE_ROLE', 'roles'), RoleController.deleteRole);
router.post('/:id/restore', authorize(PERMISSIONS.ROLE_UPDATE), auditLog('RESTORE_ROLE', 'roles'), RoleController.restoreRole);
router.post('/:id/assign-permissions', authorize(PERMISSIONS.ROLE_UPDATE), auditLog('ASSIGN_ROLE_PERMISSIONS', 'roles'), RoleController.assignPermissions);
router.post('/:id/clone', authorize(PERMISSIONS.ROLE_CREATE), auditLog('CLONE_ROLE', 'roles'), RoleController.cloneRole);

module.exports = router;

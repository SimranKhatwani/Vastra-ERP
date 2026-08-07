const express = require('express');
const UserController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.USER_CREATE), auditLog('CREATE_USER', 'users'), UserController.createUser);
router.get('/', authorize(PERMISSIONS.USER_READ), UserController.getUsers);
router.get('/export', authorize(PERMISSIONS.USER_READ), UserController.exportUsers);
router.get('/:id', authorize(PERMISSIONS.USER_READ), UserController.getUserById);
router.put('/:id', authorize(PERMISSIONS.USER_UPDATE), auditLog('UPDATE_USER', 'users'), UserController.updateUser);
router.delete('/:id', authorize(PERMISSIONS.USER_DELETE), auditLog('DELETE_USER', 'users'), UserController.deleteUser);
router.post('/:id/restore', authorize(PERMISSIONS.USER_UPDATE), auditLog('RESTORE_USER', 'users'), UserController.restoreUser);
router.post('/:id/assign-role', authorize(PERMISSIONS.USER_UPDATE), auditLog('ASSIGN_ROLE', 'users'), UserController.assignRole);
router.post('/:id/reset-password', authorize(PERMISSIONS.USER_UPDATE), auditLog('RESET_USER_PASSWORD', 'users'), UserController.resetUserPassword);
router.patch('/:id/status', authorize(PERMISSIONS.USER_UPDATE), auditLog('STATUS_CHANGE_USER', 'users'), UserController.changeUserStatus);
router.post('/bulk-delete', authorize(PERMISSIONS.USER_DELETE), auditLog('BULK_DELETE_USERS', 'users'), UserController.bulkDeleteUsers);
router.post('/bulk-status', authorize(PERMISSIONS.USER_UPDATE), auditLog('BULK_STATUS_USERS', 'users'), UserController.bulkUpdateStatus);

module.exports = router;

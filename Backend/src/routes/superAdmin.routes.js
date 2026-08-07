const express = require('express');
const SuperAdminController = require('../controllers/superAdmin.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/tenants', authorize('tenant.create'), auditLog('CREATE_TENANT', 'superadmin'), SuperAdminController.createTenant);
router.get('/tenants', authorize('tenant.read'), SuperAdminController.getAllTenants);
router.get('/tenants/:tenantId', authorize('tenant.read'), SuperAdminController.getTenantById);
router.put('/tenants/:tenantId', authorize('tenant.update'), auditLog('UPDATE_TENANT', 'superadmin'), SuperAdminController.updateTenant);
router.post('/tenants/:tenantId/suspend', authorize('tenant.suspend'), auditLog('SUSPEND_TENANT', 'superadmin'), SuperAdminController.suspendTenant);
router.post('/tenants/:tenantId/activate', authorize('tenant.update'), auditLog('ACTIVATE_TENANT', 'superadmin'), SuperAdminController.activateTenant);
router.patch('/tenants/:tenantId/subscription', authorize('tenant.update'), auditLog('UPDATE_SUBSCRIPTION', 'superadmin'), SuperAdminController.updateSubscription);
router.delete('/tenants/:tenantId', authorize('tenant.delete'), auditLog('DELETE_TENANT', 'superadmin'), SuperAdminController.deleteTenant);
router.get('/dashboard', authorize('tenant.read'), SuperAdminController.getDashboard);

module.exports = router;

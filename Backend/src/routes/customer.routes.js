const express = require('express');
const CustomerController = require('../controllers/customer.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.CRM_CREATE), auditLog('CREATE_CUSTOMER', 'crm'), CustomerController.createCustomer);
router.get('/', authorize(PERMISSIONS.CRM_READ), CustomerController.getCustomers);
router.get('/export', authorize(PERMISSIONS.CRM_READ), CustomerController.exportCustomers);

// Mock endpoints for loyalty-settings
router.get('/loyalty-settings', (req, res) => res.status(200).json({ success: true, data: { enabled: true, rupeesPerPoint: 20 } }));
router.put('/loyalty-settings', (req, res) => res.status(200).json({ success: true, data: req.body }));

router.get('/:id', authorize(PERMISSIONS.CRM_READ), CustomerController.getCustomerById);
router.get('/:id/history', authorize(PERMISSIONS.CRM_READ), CustomerController.getPurchaseHistory);
router.put('/:id', authorize(PERMISSIONS.CRM_UPDATE), auditLog('UPDATE_CUSTOMER', 'crm'), CustomerController.updateCustomer);
router.delete('/:id', authorize(PERMISSIONS.CRM_DELETE), auditLog('DELETE_CUSTOMER', 'crm'), CustomerController.deleteCustomer);
router.post('/:id/restore', authorize(PERMISSIONS.CRM_UPDATE), auditLog('RESTORE_CUSTOMER', 'crm'), CustomerController.restoreCustomer);
router.post('/bulk-delete', authorize(PERMISSIONS.CRM_DELETE), auditLog('BULK_DELETE_CUSTOMERS', 'crm'), CustomerController.bulkDeleteCustomers);

module.exports = router;

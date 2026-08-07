const express = require('express');
const VendorController = require('../controllers/vendor.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.VENDOR_CREATE), auditLog('CREATE_VENDOR', 'vendors'), VendorController.createVendor);
router.get('/', authorize(PERMISSIONS.VENDOR_READ), VendorController.getVendors);
router.get('/:id', authorize(PERMISSIONS.VENDOR_READ), VendorController.getVendorById);
router.put('/:id', authorize(PERMISSIONS.VENDOR_UPDATE), auditLog('UPDATE_VENDOR', 'vendors'), VendorController.updateVendor);
router.delete('/:id', authorize(PERMISSIONS.VENDOR_DELETE), auditLog('DELETE_VENDOR', 'vendors'), VendorController.deleteVendor);

module.exports = router;

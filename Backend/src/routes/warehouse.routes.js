const express = require('express');
const WarehouseController = require('../controllers/warehouse.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.WAREHOUSE_CREATE), auditLog('CREATE_WAREHOUSE', 'warehouses'), WarehouseController.createWarehouse);
router.get('/', authorize(PERMISSIONS.WAREHOUSE_READ), WarehouseController.getWarehouses);
router.get('/:id', authorize(PERMISSIONS.WAREHOUSE_READ), WarehouseController.getWarehouseById);
router.put('/:id', authorize(PERMISSIONS.WAREHOUSE_UPDATE), auditLog('UPDATE_WAREHOUSE', 'warehouses'), WarehouseController.updateWarehouse);
router.delete('/:id', authorize(PERMISSIONS.WAREHOUSE_DELETE), auditLog('DELETE_WAREHOUSE', 'warehouses'), WarehouseController.deleteWarehouse);

module.exports = router;

const express = require('express');
const InventoryLifecycleController = require('../controllers/inventoryLifecycle.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.get('/', authorize(PERMISSIONS.INVENTORY_READ), InventoryLifecycleController.getAllLifecycleEvents);
router.get('/unique-code/:code', authorize(PERMISSIONS.INVENTORY_READ), InventoryLifecycleController.getLifecycleByUniqueCode);
router.get('/:id', authorize(PERMISSIONS.INVENTORY_READ), InventoryLifecycleController.getLifecycleById);

module.exports = router;

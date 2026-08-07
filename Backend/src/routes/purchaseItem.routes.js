const express = require('express');
const PurchaseItemController = require('../controllers/purchaseItem.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.PURCHASE_CREATE), auditLog('CREATE_PURCHASE_ITEM', 'purchase_items'), PurchaseItemController.createPurchaseItem);
router.get('/:id', authorize(PERMISSIONS.PURCHASE_READ), PurchaseItemController.getPurchaseItemById);
router.put('/:id', authorize(PERMISSIONS.PURCHASE_CREATE), auditLog('UPDATE_PURCHASE_ITEM', 'purchase_items'), PurchaseItemController.updatePurchaseItem);
router.delete('/:id', authorize(PERMISSIONS.PURCHASE_CANCEL), auditLog('DELETE_PURCHASE_ITEM', 'purchase_items'), PurchaseItemController.deletePurchaseItem);

module.exports = router;

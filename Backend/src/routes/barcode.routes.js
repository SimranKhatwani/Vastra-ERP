const express = require('express');
const BarcodeController = require('../controllers/barcode.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.get('/print/batch/:billId', authorize(PERMISSIONS.INVENTORY_READ), BarcodeController.printBatchLabels);
router.get('/print/:barcode', authorize(PERMISSIONS.INVENTORY_READ), BarcodeController.printBarcode);
router.get('/:barcode', authorize(PERMISSIONS.INVENTORY_READ), BarcodeController.getBarcodeData);

module.exports = router;

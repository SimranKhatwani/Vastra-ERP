const express = require('express');
const SearchController = require('../controllers/search.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.get('/barcode/:barcode', authorize(PERMISSIONS.INVENTORY_READ), SearchController.searchByBarcode);
router.get('/design/:designNo', authorize(PERMISSIONS.INVENTORY_READ), SearchController.searchByDesignNo);
router.get('/item-code/:itemCode', authorize(PERMISSIONS.INVENTORY_READ), SearchController.searchByItemCode);
router.get('/ipn/:ipn', authorize(PERMISSIONS.INVENTORY_READ), SearchController.searchByIpn);
router.get('/vendor/:vendorId', authorize(PERMISSIONS.PURCHASE_READ), SearchController.searchByVendor);
router.get('/bill/:billNo', authorize(PERMISSIONS.PURCHASE_READ), SearchController.searchByBillNo);

module.exports = router;

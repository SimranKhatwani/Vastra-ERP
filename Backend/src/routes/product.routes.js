const express = require('express');
const ProductController = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { validate } = require('../middlewares/validator.middleware');
const { createProductSchema } = require('../validators/product.validator');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.PRODUCT_CREATE), validate(createProductSchema), auditLog('CREATE_PRODUCT', 'products'), ProductController.createProduct);
router.get('/', authorize(PERMISSIONS.PRODUCT_READ), ProductController.getProducts);
router.get('/search-billing', authorize(PERMISSIONS.PRODUCT_READ), ProductController.searchBilling);
router.get('/export', authorize(PERMISSIONS.PRODUCT_READ), ProductController.exportProducts);
router.get('/design/:designNo', authorize(PERMISSIONS.PRODUCT_READ), ProductController.getByDesignNo);
router.get('/item-code/:itemCode', authorize(PERMISSIONS.PRODUCT_READ), ProductController.getByItemCode);
router.get('/:id', authorize(PERMISSIONS.PRODUCT_READ), ProductController.getProductById);
router.put('/:id', authorize(PERMISSIONS.PRODUCT_UPDATE), auditLog('UPDATE_PRODUCT', 'products'), ProductController.updateProduct);
router.delete('/:id', authorize(PERMISSIONS.PRODUCT_DELETE), auditLog('DELETE_PRODUCT', 'products'), ProductController.deleteProduct);
router.post('/:id/restore', authorize(PERMISSIONS.PRODUCT_UPDATE), auditLog('RESTORE_PRODUCT', 'products'), ProductController.restoreProduct);
router.post('/bulk-delete', authorize(PERMISSIONS.PRODUCT_DELETE), auditLog('BULK_DELETE_PRODUCTS', 'products'), ProductController.bulkDeleteProducts);
router.post('/bulk-status', authorize(PERMISSIONS.PRODUCT_UPDATE), auditLog('BULK_STATUS_PRODUCTS', 'products'), ProductController.bulkUpdateStatus);

module.exports = router;

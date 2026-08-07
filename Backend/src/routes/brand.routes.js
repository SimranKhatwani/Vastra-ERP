const express = require('express');
const BrandController = require('../controllers/brand.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.BRAND_CREATE), auditLog('CREATE_BRAND', 'brands'), BrandController.createBrand);
router.get('/', authorize(PERMISSIONS.BRAND_READ), BrandController.getBrands);
router.get('/:id', authorize(PERMISSIONS.BRAND_READ), BrandController.getBrandById);
router.put('/:id', authorize(PERMISSIONS.BRAND_UPDATE), auditLog('UPDATE_BRAND', 'brands'), BrandController.updateBrand);
router.delete('/:id', authorize(PERMISSIONS.BRAND_DELETE), auditLog('DELETE_BRAND', 'brands'), BrandController.deleteBrand);

module.exports = router;

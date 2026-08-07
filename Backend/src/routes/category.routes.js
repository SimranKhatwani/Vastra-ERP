const express = require('express');
const CategoryController = require('../controllers/category.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.CATEGORY_CREATE), auditLog('CREATE_CATEGORY', 'categories'), CategoryController.createCategory);
router.get('/', authorize(PERMISSIONS.CATEGORY_READ), CategoryController.getCategories);
router.get('/:id', authorize(PERMISSIONS.CATEGORY_READ), CategoryController.getCategoryById);
router.put('/:id', authorize(PERMISSIONS.CATEGORY_UPDATE), auditLog('UPDATE_CATEGORY', 'categories'), CategoryController.updateCategory);
router.delete('/:id', authorize(PERMISSIONS.CATEGORY_DELETE), auditLog('DELETE_CATEGORY', 'categories'), CategoryController.deleteCategory);

module.exports = router;

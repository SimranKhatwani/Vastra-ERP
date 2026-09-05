const express = require('express');
const GoodsReturnController = require('../controllers/goodsReturn.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

// Dashboard & Register
router.get('/dashboard', authorize(PERMISSIONS.GOODS_RETURN_READ), GoodsReturnController.getDashboardData);
router.get('/register', authorize(PERMISSIONS.GOODS_RETURN_READ), GoodsReturnController.getRegisterData);
router.get('/reports', authorize(PERMISSIONS.GOODS_RETURN_READ), GoodsReturnController.getReportsData);

// Core Creation & Retrieval
router.get('/', authorize(PERMISSIONS.GOODS_RETURN_READ), GoodsReturnController.getRegisterData);
router.post('/', authorize(PERMISSIONS.GOODS_RETURN_CREATE), auditLog('CREATE_GOODS_RETURN', 'goods_return'), GoodsReturnController.createGoodsReturn);

// GR 360° Workflows
router.get('/:id', authorize(PERMISSIONS.GOODS_RETURN_READ), GoodsReturnController.getGoodsReturnById);
router.post('/:id/dispatch', authorize(PERMISSIONS.GOODS_RETURN_UPDATE), auditLog('DISPATCH_GOODS_RETURN', 'goods_return'), GoodsReturnController.dispatchGoodsReturn);
router.post('/:id/vendor-receipt', authorize(PERMISSIONS.GOODS_RETURN_UPDATE), GoodsReturnController.confirmVendorReceipt);
router.post('/:id/verify-vendor', authorize(PERMISSIONS.GOODS_RETURN_UPDATE), auditLog('VERIFY_VENDOR_GR', 'goods_return'), GoodsReturnController.verifyVendorGR);
router.post('/:id/compare-doc', authorize(PERMISSIONS.GOODS_RETURN_READ), GoodsReturnController.compareVendorDocument);
router.post('/:id/credit-note', authorize(PERMISSIONS.GOODS_RETURN_UPDATE), auditLog('ADD_CREDIT_NOTE', 'goods_return'), GoodsReturnController.addCreditNoteSettlement);
router.post('/:id/replacement', authorize(PERMISSIONS.GOODS_RETURN_UPDATE), auditLog('ADD_REPLACEMENT', 'goods_return'), GoodsReturnController.addReplacementSettlement);
router.post('/:id/physical-scan', authorize(PERMISSIONS.GOODS_RETURN_UPDATE), auditLog('PHYSICAL_SCAN_VERIFY', 'goods_return'), GoodsReturnController.verifyPhysicalShowroomScan);
router.post('/:id/close', authorize(PERMISSIONS.GOODS_RETURN_UPDATE), auditLog('GOLDEN_CLOSURE_GR', 'goods_return'), GoodsReturnController.executeGoldenClosure);
router.post('/:id/documents', authorize(PERMISSIONS.GOODS_RETURN_UPDATE), GoodsReturnController.addDocumentToVault);

module.exports = router;

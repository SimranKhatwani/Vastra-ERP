const express = require('express');
const GoodsReturnController = require('../controllers/goodsReturn.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.GOODS_RETURN_CREATE), auditLog('CREATE_GOODS_RETURN', 'goods_return'), GoodsReturnController.createGoodsReturn);
router.get('/', authorize(PERMISSIONS.GOODS_RETURN_READ), GoodsReturnController.getGoodsReturns);
router.get('/export', authorize(PERMISSIONS.GOODS_RETURN_READ), GoodsReturnController.exportGoodsReturns);
router.get('/:id', authorize(PERMISSIONS.GOODS_RETURN_READ), GoodsReturnController.getGoodsReturnById);

module.exports = router;

const express = require('express');
const ReportController = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.get('/sales', authorize(PERMISSIONS.REPORTS_SALES), ReportController.getSalesReport);
router.get('/purchase', authorize(PERMISSIONS.REPORTS_PURCHASE), ReportController.getPurchaseReport);
router.get('/inventory', authorize(PERMISSIONS.REPORTS_INVENTORY), ReportController.getStockReport);
router.get('/gst', authorize(PERMISSIONS.REPORTS_GST), ReportController.getGSTReport);
router.get('/customer', authorize(PERMISSIONS.CRM_READ), ReportController.getCustomerReport);
router.get('/payment', authorize(PERMISSIONS.PAYMENT_READ), ReportController.getPaymentReport);
router.get('/alteration', authorize(PERMISSIONS.ALTERATION_READ), ReportController.getAlterationReport);
router.get('/return', authorize(PERMISSIONS.RETURN_READ), ReportController.getReturnReport);
router.get('/manual-adjustments', authorize(PERMISSIONS.REPORTS_SALES), ReportController.getManualAdjustmentsReport);
module.exports = router;

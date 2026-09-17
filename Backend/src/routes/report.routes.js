const express = require('express');
const ReportController = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

// Enterprise BI Analytics Dashboard
router.get('/dashboard', authorize(PERMISSIONS.REPORTS_SALES), ReportController.getDashboardAnalytics);

// Sales & Purchase
router.get('/sales_summary', authorize(PERMISSIONS.REPORTS_SALES), ReportController.getSalesReport);
router.get('/sales', authorize(PERMISSIONS.REPORTS_SALES), ReportController.getSalesReport);
router.get('/purchase', authorize(PERMISSIONS.REPORTS_PURCHASE), ReportController.getPurchaseReport);
router.get('/vendor', authorize(PERMISSIONS.VENDOR_READ), ReportController.getVendorReport);
router.get('/gst', authorize(PERMISSIONS.REPORTS_GST), ReportController.getGSTReport);
router.get('/customer', authorize(PERMISSIONS.CRM_READ), ReportController.getCustomerReport);
router.get('/payment', authorize(PERMISSIONS.PAYMENT_READ), ReportController.getPaymentReport);
router.get('/manual-adjustments', authorize(PERMISSIONS.REPORTS_SALES), ReportController.getManualAdjustmentsReport);

// Inventory Analytics
router.get('/inventory_summary', authorize(PERMISSIONS.REPORTS_INVENTORY), ReportController.getStockReport);
router.get('/inventory', authorize(PERMISSIONS.REPORTS_INVENTORY), ReportController.getStockReport);
router.get('/stock_aging', authorize(PERMISSIONS.REPORTS_INVENTORY), ReportController.getStockAgingReport);
router.get('/fast_moving', authorize(PERMISSIONS.REPORTS_INVENTORY), ReportController.getFastMovingReport);
router.get('/slow_moving', authorize(PERMISSIONS.REPORTS_INVENTORY), ReportController.getSlowMovingReport);

// People Analytics
router.get('/performance', authorize(PERMISSIONS.USER_READ), ReportController.getEmployeePerformanceReport);
router.get('/attendance', authorize(PERMISSIONS.USER_READ), ReportController.getAttendanceReport);

// Financial Analytics
router.get('/financial_summary', authorize(PERMISSIONS.REPORTS_SALES), ReportController.getFinancialSummaryReport);
router.get('/financial', authorize(PERMISSIONS.REPORTS_SALES), ReportController.getFinancialSummaryReport);
router.get('/expenses', authorize(PERMISSIONS.REPORTS_SALES), ReportController.getExpensesReport);

// Tailoring & Alterations
router.get('/alteration', authorize(PERMISSIONS.ALTERATION_READ), ReportController.getAlterationReport);
router.get('/tailoring', authorize(PERMISSIONS.ALTERATION_READ), ReportController.getTailoringReport);
router.get('/return', authorize(PERMISSIONS.RETURN_READ), ReportController.getReturnReport);

module.exports = router;

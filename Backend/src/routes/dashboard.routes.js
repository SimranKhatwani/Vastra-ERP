const express = require('express');
const DashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.get('/', authorize(PERMISSIONS.OWNER_DASHBOARD), DashboardController.getOwnerDashboard);
router.get('/inventory-summary', authorize(PERMISSIONS.OWNER_DASHBOARD), DashboardController.getInventorySummary);
router.get('/purchase-summary', authorize(PERMISSIONS.OWNER_DASHBOARD), DashboardController.getPurchaseSummary);
router.get('/stock-by-brand', authorize(PERMISSIONS.OWNER_DASHBOARD), DashboardController.getStockByBrand);
router.get('/stock-by-category', authorize(PERMISSIONS.OWNER_DASHBOARD), DashboardController.getStockByCategory);
router.get('/stock-by-firm', authorize(PERMISSIONS.OWNER_DASHBOARD), DashboardController.getStockByFirm);
router.get('/low-stock', authorize(PERMISSIONS.OWNER_DASHBOARD), DashboardController.getLowStock);
router.get('/staff-summary', DashboardController.getStaffSummary);
router.get('/morning-actions', (req, res) => res.status(200).json({ success: true, data: [] })); // Mock morning actions
module.exports = router;

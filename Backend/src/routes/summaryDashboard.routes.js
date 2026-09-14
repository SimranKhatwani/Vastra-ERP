const express = require('express');
const SummaryDashboardController = require('../controllers/summaryDashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.get('/overview', SummaryDashboardController.getOverviewSummary);
router.get('/operations', SummaryDashboardController.getOperationsDashboard);
router.get('/salesman', SummaryDashboardController.getSalesmanDashboard);
router.post('/salesman/absent-toggle', SummaryDashboardController.toggleAbsentSalesman);
router.get('/customer', SummaryDashboardController.getCustomerDashboard);
router.get('/management', SummaryDashboardController.getManagementDashboard);

module.exports = router;

const express = require('express');
const {
  getBIDashboard,
  getSalesAnalytics,
  getInventoryAnalytics,
  getPeopleAnalytics,
  getFinancialAnalytics,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();
const allowedRoles = ['BusinessAdmin', 'Admin', 'SuperAdmin', 'Manager', 'Accounts Manager', 'Owner', 'Sales Manager', 'Inventory Manager', 'HR'];

router.get('/dashboard', protect, authorize(...allowedRoles), getBIDashboard);
router.get('/sales', protect, authorize(...allowedRoles), getSalesAnalytics);
router.get('/inventory', protect, authorize(...allowedRoles), getInventoryAnalytics);
router.get('/people', protect, authorize(...allowedRoles), getPeopleAnalytics);
router.get('/financial', protect, authorize(...allowedRoles), getFinancialAnalytics);

module.exports = router;

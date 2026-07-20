const express = require('express');
const {
  getOpeningStockList,
  saveOpeningStock,
  editOpeningStock,
  savePurchaseEntry,
  getSalesDeductions,
  saveAdjustment,
  getReturns,
  saveReturn,
  getAuditReport
} = require('../controllers/stockManagementController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Opening Stock Routes
router.route('/opening')
  .get(protect, getOpeningStockList)
  .post(protect, saveOpeningStock);

router.route('/opening/:productId')
  .put(protect, editOpeningStock);

// Purchase Entry
router.route('/purchase-entry')
  .post(protect, savePurchaseEntry);

// Sales Deductions (POS Checkouts)
router.route('/sales-deductions')
  .get(protect, getSalesDeductions);

// Stock Adjustments
router.route('/adjustments')
  .post(protect, saveAdjustment);

// Returns
router.route('/returns')
  .get(protect, getReturns)
  .post(protect, saveReturn);

// Reports
router.route('/reports/:reportType')
  .get(protect, getAuditReport);

module.exports = router;

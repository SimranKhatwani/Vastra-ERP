const express = require('express');
const {
  getDashboardSummary,
  getCustomerLedger,
  getVendorLedger,
  getCashBook,
  getBankBook,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getIncomes,
  createIncome,
  deleteIncome,
  getPayments,
  createPayment,
  updatePaymentStatus,
  getReceipts,
  createReceipt,
  getProfitLoss,
  createCashBankAdjustment,
} = require('../controllers/financialController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

const allowedRoles = ['BusinessAdmin', 'Admin', 'SuperAdmin', 'Manager', 'Accounts Manager', 'Cashier'];

// 1. Dashboard
router.get('/dashboard', protect, getDashboardSummary);

// 2. Customer Ledger
router.get('/customer-ledger', protect, getCustomerLedger);

// 3. Vendor Ledger
router.get('/vendor-ledger', protect, getVendorLedger);

// 4. Cash Book
router.get('/cash-book', protect, getCashBook);

// 5. Bank Book
router.get('/bank-book', protect, getBankBook);

// 6. Expense Management
router.route('/expenses')
  .get(protect, getExpenses)
  .post(protect, authorize(...allowedRoles), createExpense);

router.route('/expenses/:id')
  .put(protect, authorize(...allowedRoles), updateExpense)
  .delete(protect, authorize(...allowedRoles), deleteExpense);

// 7. Income Management
router.route('/incomes')
  .get(protect, getIncomes)
  .post(protect, authorize(...allowedRoles), createIncome);

router.delete('/incomes/:id', protect, authorize(...allowedRoles), deleteIncome);

// 8. Payment Tracking
router.route('/payments')
  .get(protect, getPayments)
  .post(protect, authorize(...allowedRoles), createPayment);

router.put('/payments/:id/status', protect, authorize(...allowedRoles), updatePaymentStatus);

// 9. Receipt Management
router.route('/receipts')
  .get(protect, getReceipts)
  .post(protect, authorize(...allowedRoles), createReceipt);

// 10. Profit & Loss Reports
router.get('/profit-loss', protect, getProfitLoss);

// Manual Cash/Bank Adjustments
router.post('/cash-bank-adjustment', protect, authorize(...allowedRoles), createCashBankAdjustment);

module.exports = router;

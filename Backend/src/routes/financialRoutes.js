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
  .post(protect, authorize('Admin', 'Accounts Manager'), createExpense);

router.route('/expenses/:id')
  .put(protect, authorize('Admin', 'Accounts Manager'), updateExpense)
  .delete(protect, authorize('Admin', 'Accounts Manager'), deleteExpense);

// 7. Income Management
router.route('/incomes')
  .get(protect, getIncomes)
  .post(protect, authorize('Admin', 'Accounts Manager'), createIncome);

router.delete('/incomes/:id', protect, authorize('Admin', 'Accounts Manager'), deleteIncome);

// 8. Payment Tracking
router.route('/payments')
  .get(protect, getPayments)
  .post(protect, authorize('Admin', 'Accounts Manager', 'Cashier'), createPayment);

router.put('/payments/:id/status', protect, authorize('Admin', 'Accounts Manager'), updatePaymentStatus);

// 9. Receipt Management
router.route('/receipts')
  .get(protect, getReceipts)
  .post(protect, authorize('Admin', 'Accounts Manager', 'Cashier'), createReceipt);

// 10. Profit & Loss Reports
router.get('/profit-loss', protect, getProfitLoss);

// Manual Cash/Bank Adjustments
router.post('/cash-bank-adjustment', protect, authorize('Admin', 'Accounts Manager'), createCashBankAdjustment);

module.exports = router;

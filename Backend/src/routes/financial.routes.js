const express = require('express');
const FinancialController = require('../controllers/financial.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');

const router = express.Router();

router.use(authenticate, tenantContext);

router.get('/dashboard', FinancialController.getDashboard);
router.get('/customer-ledger', FinancialController.getCustomerLedger);
router.get('/vendor-ledger', FinancialController.getVendorLedger);
router.get('/cash-book', FinancialController.getCashBook);
router.get('/bank-book', FinancialController.getBankBook);
router.get('/profit-loss', FinancialController.getProfitLoss);

router.get('/expenses', FinancialController.getExpenses);
router.post('/expenses', FinancialController.createExpense);

router.get('/incomes', FinancialController.getIncomes);
router.post('/incomes', FinancialController.createIncome);

router.get('/payments', FinancialController.getPayments);
router.post('/payments', FinancialController.createPayment);

router.get('/receipts', FinancialController.getReceipts);
router.post('/receipts', FinancialController.createReceipt);

router.post('/cash-bank-adjustment', FinancialController.cashBankAdjustment);

module.exports = router;

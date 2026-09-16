const express = require('express');
const ExpenseController = require('../controllers/expense.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');

const router = express.Router();

router.use(authenticate, tenantContext);

router.get('/', ExpenseController.getExpenses);
router.post('/', ExpenseController.createExpense);
router.delete('/:id', ExpenseController.deleteExpense);

module.exports = router;

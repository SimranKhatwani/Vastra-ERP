const express = require('express');
const { createExpense, getExpenses, deleteExpense, updateExpense } = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createExpense)
  .get(protect, getExpenses);

router.route('/:id')
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

module.exports = router;

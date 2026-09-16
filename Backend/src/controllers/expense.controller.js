const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const ExpenseService = require('../services/expense.service');

class ExpenseController {
  static getExpenses = asyncHandler(async (req, res) => {
    const expenses = await ExpenseService.getAllExpenses(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, expenses, 'Expenses retrieved successfully.'));
  });

  static createExpense = asyncHandler(async (req, res) => {
    const expense = await ExpenseService.createExpense(req.body, req.user?.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, expense, 'Expense recorded successfully.'));
  });

  static deleteExpense = asyncHandler(async (req, res) => {
    const expense = await ExpenseService.deleteExpense(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, expense, 'Expense deleted successfully.'));
  });
}

module.exports = ExpenseController;

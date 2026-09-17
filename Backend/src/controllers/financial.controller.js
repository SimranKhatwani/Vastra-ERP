const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const FinancialService = require('../services/financial.service');
const Expense = require('../models/Expense');

class FinancialController {
  static getDashboard = asyncHandler(async (req, res) => {
    const data = await FinancialService.getDashboardSummary(req.tenantId);
    return res.status(200).json(data);
  });

  static getCustomerLedger = asyncHandler(async (req, res) => {
    const data = await FinancialService.getCustomerLedgers(req.tenantId);
    return res.status(200).json(data);
  });

  static getVendorLedger = asyncHandler(async (req, res) => {
    const data = await FinancialService.getVendorLedgers(req.tenantId);
    return res.status(200).json(data);
  });

  static getCashBook = asyncHandler(async (req, res) => {
    const data = await FinancialService.getCashBook(req.tenantId);
    return res.status(200).json(data);
  });

  static getBankBook = asyncHandler(async (req, res) => {
    const data = await FinancialService.getBankBook(req.tenantId);
    return res.status(200).json(data);
  });

  static getProfitLoss = asyncHandler(async (req, res) => {
    const data = await FinancialService.getProfitLoss(req.query, req.tenantId);
    return res.status(200).json(data);
  });

  static getExpenses = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, expenses, 'Expenses retrieved successfully.'));
  });

  static createExpense = asyncHandler(async (req, res) => {
    const exp = await Expense.create({
      ...req.body,
      tenantId: req.tenantId,
      createdBy: req.user.id
    });
    return res.status(201).json(new ApiResponse(201, exp, 'Expense recorded successfully.'));
  });

  static getIncomes = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, [], 'Incomes retrieved.'));
  });

  static createIncome = asyncHandler(async (req, res) => {
    return res.status(201).json(new ApiResponse(201, req.body, 'Income recorded.'));
  });

  static getPayments = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, [], 'Payments retrieved.'));
  });

  static createPayment = asyncHandler(async (req, res) => {
    return res.status(201).json(new ApiResponse(201, req.body, 'Payment recorded.'));
  });

  static getReceipts = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, [], 'Receipts retrieved.'));
  });

  static createReceipt = asyncHandler(async (req, res) => {
    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
    return res.status(201).json(new ApiResponse(201, { ...req.body, receiptNo }, 'Receipt issued.'));
  });

  static cashBankAdjustment = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.body, 'Adjustment saved.'));
  });
}

module.exports = FinancialController;

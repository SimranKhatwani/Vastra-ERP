const Expense = require('../models/Expense');
const ApiError = require('../helpers/ApiError');

class ExpenseService {
  static async getAllExpenses(query = {}, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (query.category && query.category !== 'All') {
      filter.category = query.category;
    }
    if (query.startDate && query.endDate) {
      filter.date = { $gte: query.startDate, $lte: query.endDate };
    }
    return await Expense.find(filter).sort({ createdAt: -1 }).lean();
  }

  static async createExpense(data, userId, tenantId) {
    if (!data.amount || Number(data.amount) <= 0) {
      throw new ApiError(400, 'A valid positive expense amount is required.');
    }
    const count = await Expense.countDocuments({ tenantId });
    const expenseNo = data.expenseNo || `EXP-${String(count + 1).padStart(4, '0')}`;

    const expense = await Expense.create({
      tenantId,
      expenseNo,
      date: data.date || new Date().toISOString().slice(0, 10),
      category: data.category || 'Miscellaneous',
      amount: Number(data.amount),
      description: data.description || '',
      paymentMethod: data.paymentMethod || 'UPI',
      referenceNo: data.referenceNo || '',
      paidTo: data.paidTo || '',
      createdBy: userId
    });

    return expense;
  }

  static async deleteExpense(id, tenantId) {
    const expense = await Expense.findOne({ _id: id, tenantId });
    if (!expense) throw new ApiError(404, 'Expense not found.');
    expense.isDeleted = true;
    await expense.save();
    return expense;
  }
}

module.exports = ExpenseService;

const Expense = require('../models/expenseModel');

exports.createExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const expense = await Expense.create({
      ...req.body,
      tenantId
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const expenses = await Expense.find({ tenantId }).sort('-date');
      
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const expense = await Expense.findOne({ _id: req.params.id, tenantId });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await expense.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let expense = await Expense.findOne({ _id: req.params.id, tenantId });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};;

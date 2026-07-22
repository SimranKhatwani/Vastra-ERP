const mongoose = require('mongoose');
const Expense = require('../models/expenseModel');
const Income = require('../models/incomeModel');
const Receipt = require('../models/receiptModel');
const FinancialPayment = require('../models/financialPaymentModel');
const CashBankEntry = require('../models/cashBankEntryModel');
const FinancialAuditLog = require('../models/financialAuditLogModel');
const Invoice = require('../models/invoiceModel');
const PurchaseInvoice = require('../models/purchaseInvoiceModel');
const VendorOutstanding = require('../models/vendorOutstandingModel');
const VendorPayment = require('../models/vendorPaymentModel');
const Customer = require('../models/customerModel');
const Vendor = require('../models/vendorModel');

// Helper to log audit actions
const logFinancialAudit = async (tenantId, action, referenceNo, amount, performedBy, details, referenceId = null) => {
  try {
    await FinancialAuditLog.create({
      tenantId,
      action,
      referenceNo,
      amount,
      performedBy: performedBy || 'System Admin',
      details,
      referenceId,
    });
  } catch (err) {
    console.error('Failed to log financial audit:', err.message);
  }
};

// ==============================================================================
// 1. FINANCIAL SUMMARY DASHBOARD
// ==============================================================================
exports.getDashboardSummary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 1. Invoices (Sales, Receipts, Receivables)
    const invoices = await Invoice.find({ tenantId });
    const todaySales = invoices
      .filter((inv) => new Date(inv.date || inv.createdAt) >= startOfToday)
      .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    const monthlySales = invoices
      .filter((inv) => new Date(inv.date || inv.createdAt) >= startOfMonth)
      .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    const totalReceivables = invoices
      .filter((inv) => inv.status !== 'Paid')
      .reduce((sum, inv) => sum + (inv.outstandingAmount || 0), 0);

    // 2. Purchase Invoices (Purchases, Payables)
    const purchaseInvoices = await PurchaseInvoice.find({ tenantId });
    const todayPurchase = purchaseInvoices
      .filter((inv) => new Date(inv.invoiceDate || inv.createdAt) >= startOfToday)
      .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    const monthlyPurchase = purchaseInvoices
      .filter((inv) => new Date(inv.invoiceDate || inv.createdAt) >= startOfMonth)
      .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    const totalPayables = purchaseInvoices
      .filter((inv) => inv.paymentStatus !== 'Paid')
      .reduce((sum, inv) => sum + (inv.outstandingAmount || 0), 0);

    // 3. Expenses
    const expenses = await Expense.find({ tenantId });
    const totalExpensesVal = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const monthlyExpensesVal = expenses
      .filter((exp) => new Date(exp.date || exp.createdAt) >= startOfMonth)
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // 4. Incomes (Manual Incomes + Sales)
    const manualIncomes = await Income.find({ tenantId });
    const manualIncomeTotal = manualIncomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
    const totalIncomeVal = monthlySales + manualIncomeTotal;

    // 5. Net Profit
    const netProfitVal = totalIncomeVal - (monthlyPurchase + monthlyExpensesVal);
    const monthlyProfitVal = monthlySales - (monthlyPurchase + monthlyExpensesVal);

    // 6. Cash & Bank Balances (aggregated from payments, receipts, sales, expenses, cash bank entries)
    const cashBankEntries = await CashBankEntry.find({ tenantId });
    const receipts = await Receipt.find({ tenantId });
    const payments = await FinancialPayment.find({ tenantId });
    const vendorPayments = await VendorPayment.find({ tenantId });

    let cashBalance = 0;
    let bankBalance = 0;

    // Direct Cash/Bank entries
    cashBankEntries.forEach((entry) => {
      if (entry.type === 'Cash') {
        cashBalance += entry.direction === 'In' ? entry.amount : -entry.amount;
      } else {
        bankBalance += entry.direction === 'In' ? entry.amount : -entry.amount;
      }
    });

    // Invoices Paid
    invoices.forEach((inv) => {
      const paid = inv.amountPaid || 0;
      if (paid > 0) {
        if (inv.paymentMethod === 'Cash') cashBalance += paid;
        else bankBalance += paid;
      }
    });

    // Receipts
    receipts.forEach((rec) => {
      if (rec.paymentMode === 'Cash') cashBalance += rec.amount;
      else bankBalance += rec.amount;
    });

    // Manual Incomes
    manualIncomes.forEach((inc) => {
      if (!inc.referenceId) {
        if (inc.paymentMode === 'Cash') cashBalance += inc.amount;
        else bankBalance += inc.amount;
      }
    });

    // Expenses
    expenses.forEach((exp) => {
      if (exp.paymentMethod === 'Cash') cashBalance -= exp.amount;
      else bankBalance -= exp.amount;
    });

    // Payments
    payments.forEach((pay) => {
      if (pay.paymentMode === 'Cash') cashBalance -= pay.amount;
      else bankBalance -= pay.amount;
    });

    // Vendor Payments (if not already in FinancialPayment)
    vendorPayments.forEach((vpay) => {
      if (vpay.paymentMode === 'Cash') cashBalance -= vpay.amount;
      else bankBalance -= vpay.amount;
    });

    // Customer & Vendor Outstanding totals from master collections
    const customers = await Customer.find({ tenantId });
    const customerOutstandingTotal = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0) || totalReceivables;

    const vendors = await Vendor.find({ tenantId });
    const vendorOutstandingTotal = vendors.reduce((sum, v) => sum + (v.currentOutstanding || 0), 0) || totalPayables;

    // Charts & Recent Activity feeds
    const recentSales = invoices.slice(-5).reverse();
    const recentPurchases = purchaseInvoices.slice(-5).reverse();
    const recentExpenses = expenses.slice(-5).reverse();
    const recentReceipts = receipts.slice(-5).reverse();
    const recentPayments = payments.slice(-5).reverse();

    res.status(200).json({
      success: true,
      kpis: {
        todaySales,
        todayPurchase,
        totalIncome: totalIncomeVal,
        totalExpenses: totalExpensesVal,
        netProfit: netProfitVal,
        cashBalance: Math.max(0, cashBalance),
        bankBalance: Math.max(0, bankBalance),
        outstandingReceivables: totalReceivables,
        outstandingPayables: totalPayables,
        customerOutstanding: customerOutstandingTotal,
        vendorOutstanding: vendorOutstandingTotal,
        monthlyRevenue: monthlySales,
        monthlyExpenses: monthlyExpensesVal,
        monthlyProfit: monthlyProfitVal,
      },
      recent: {
        sales: recentSales,
        purchases: recentPurchases,
        expenses: recentExpenses,
        receipts: recentReceipts,
        payments: recentPayments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 2. CUSTOMER LEDGER
// ==============================================================================
exports.getCustomerLedger = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { customerId, search } = req.query;

    let customerFilter = { tenantId };
    if (customerId) customerFilter._id = customerId;

    const customers = await Customer.find(customerFilter);
    const invoices = await Invoice.find({ tenantId }).sort('date');
    const receipts = await Receipt.find({ tenantId }).sort('date');

    const ledgers = [];

    for (const cust of customers) {
      const custInvoices = invoices.filter(
        (inv) => inv.customerId && inv.customerId.toString() === cust._id.toString()
      );
      const custReceipts = receipts.filter(
        (rec) => rec.customerId && rec.customerId.toString() === cust._id.toString()
      );

      // Merge into chronological entries
      const entries = [];
      custInvoices.forEach((inv) => {
        entries.push({
          date: inv.date || inv.createdAt,
          type: 'Invoice',
          refNo: inv.invoiceNo,
          debit: inv.grandTotal,
          credit: inv.amountPaid, // paid at billing
          remarks: `Sale Invoice (${inv.invoiceType || 'Retail'})`,
        });
      });

      custReceipts.forEach((rec) => {
        entries.push({
          date: rec.date || rec.createdAt,
          type: 'Receipt',
          refNo: rec.receiptNo,
          debit: 0,
          credit: rec.amount,
          remarks: rec.remarks || `Receipt ref: ${rec.invoiceRef || 'General'}`,
        });
      });

      entries.sort((a, b) => new Date(a.date) - new Date(b.date));

      let runningBalance = 0;
      const calculatedEntries = entries.map((entry) => {
        runningBalance += entry.debit - entry.credit;
        return {
          ...entry,
          runningBalance,
        };
      });

      if (
        !search ||
        cust.name.toLowerCase().includes(search.toLowerCase()) ||
        (cust.phone && cust.phone.includes(search))
      ) {
        ledgers.push({
          customer: {
            id: cust._id,
            name: cust.name,
            phone: cust.phone,
            email: cust.email,
            outstandingBalance: cust.outstandingBalance || Math.max(0, runningBalance),
          },
          entries: calculatedEntries,
          totalDebit: entries.reduce((s, e) => s + e.debit, 0),
          totalCredit: entries.reduce((s, e) => s + e.credit, 0),
          closingBalance: runningBalance,
        });
      }
    }

    res.status(200).json({ success: true, data: ledgers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 3. VENDOR LEDGER
// ==============================================================================
exports.getVendorLedger = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { vendorId, search } = req.query;

    let vendorFilter = { tenantId };
    if (vendorId) vendorFilter._id = vendorId;

    const vendors = await Vendor.find(vendorFilter);
    const purchaseInvoices = await PurchaseInvoice.find({ tenantId }).sort('invoiceDate');
    const vendorPayments = await VendorPayment.find({ tenantId }).sort('paymentDate');
    const financialPayments = await FinancialPayment.find({ tenantId, category: 'Vendor Payment' }).sort('date');

    const ledgers = [];

    for (const vend of vendors) {
      const vInvoices = purchaseInvoices.filter(
        (inv) => inv.vendorId && inv.vendorId.toString() === vend._id.toString()
      );
      const vPayments = vendorPayments.filter(
        (p) => p.vendorId && p.vendorId.toString() === vend._id.toString()
      );
      const fPayments = financialPayments.filter(
        (p) => p.beneficiaryId && p.beneficiaryId.toString() === vend._id.toString()
      );

      const entries = [];
      vInvoices.forEach((inv) => {
        entries.push({
          date: inv.invoiceDate || inv.createdAt,
          type: 'Purchase Invoice',
          refNo: inv.invoiceNo,
          credit: inv.grandTotal, // Vendor ledger: Purchases credit vendor account
          debit: inv.amountPaid,   // Advance/Immediate payment debits account
          remarks: inv.remarks || `Purchase Bill`,
        });
      });

      vPayments.forEach((p) => {
        entries.push({
          date: p.paymentDate || p.createdAt,
          type: 'Payment',
          refNo: p.paymentNo,
          credit: 0,
          debit: p.amount,
          remarks: p.remarks || `Payment via ${p.paymentMode}`,
        });
      });

      fPayments.forEach((p) => {
        entries.push({
          date: p.date || p.createdAt,
          type: 'Financial Payment',
          refNo: p.paymentNo,
          credit: 0,
          debit: p.amount,
          remarks: p.remarks || `Payout via ${p.paymentMode}`,
        });
      });

      entries.sort((a, b) => new Date(a.date) - new Date(b.date));

      let runningBalance = 0;
      const calculatedEntries = entries.map((entry) => {
        runningBalance += entry.credit - entry.debit;
        return {
          ...entry,
          runningBalance,
        };
      });

      if (
        !search ||
        vend.name.toLowerCase().includes(search.toLowerCase()) ||
        (vend.phone && vend.phone.includes(search))
      ) {
        ledgers.push({
          vendor: {
            id: vend._id,
            name: vend.name,
            phone: vend.phone,
            gstin: vend.gstin,
            outstandingBalance: vend.currentOutstanding || Math.max(0, runningBalance),
          },
          entries: calculatedEntries,
          totalCredit: entries.reduce((s, e) => s + e.credit, 0),
          totalDebit: entries.reduce((s, e) => s + e.debit, 0),
          closingBalance: runningBalance,
        });
      }
    }

    res.status(200).json({ success: true, data: ledgers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 4. CASH BOOK
// ==============================================================================
exports.getCashBook = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate } = req.query;

    const invoices = await Invoice.find({ tenantId });
    const receipts = await Receipt.find({ tenantId });
    const incomes = await Income.find({ tenantId });
    const expenses = await Expense.find({ tenantId });
    const payments = await FinancialPayment.find({ tenantId });
    const vendorPayments = await VendorPayment.find({ tenantId });
    const manualEntries = await CashBankEntry.find({ tenantId, type: 'Cash' });

    const cashBookEntries = [];

    // Cash In: Invoices paid in Cash
    invoices.forEach((inv) => {
      if (inv.paymentMethod === 'Cash' && inv.amountPaid > 0) {
        cashBookEntries.push({
          date: inv.date || inv.createdAt,
          refNo: inv.invoiceNo,
          category: 'Retail/Wholesale Sales',
          type: 'Cash In',
          amount: inv.amountPaid,
          description: `Sale to ${inv.customerName}`,
        });
      }
    });

    // Cash In: Receipts
    receipts.forEach((rec) => {
      if (rec.paymentMode === 'Cash') {
        cashBookEntries.push({
          date: rec.date || rec.createdAt,
          refNo: rec.receiptNo,
          category: 'Customer Receipt',
          type: 'Cash In',
          amount: rec.amount,
          description: `Receipt from ${rec.customerName}`,
        });
      }
    });

    // Cash In: Manual Incomes
    incomes.forEach((inc) => {
      if (inc.paymentMode === 'Cash' && !inc.referenceId) {
        cashBookEntries.push({
          date: inc.date || inc.createdAt,
          refNo: inc.incomeNo,
          category: inc.source,
          type: 'Cash In',
          amount: inc.amount,
          description: inc.description || `Income from ${inc.source}`,
        });
      }
    });

    // Cash Out: Expenses
    expenses.forEach((exp) => {
      if (exp.paymentMethod === 'Cash') {
        cashBookEntries.push({
          date: exp.date || exp.createdAt,
          refNo: exp.expenseNo || 'EXP',
          category: exp.category,
          type: 'Cash Out',
          amount: exp.amount,
          description: exp.description || `Expense: ${exp.category}`,
        });
      }
    });

    // Cash Out: Financial Payments
    payments.forEach((pay) => {
      if (pay.paymentMode === 'Cash') {
        cashBookEntries.push({
          date: pay.date || pay.createdAt,
          refNo: pay.paymentNo,
          category: pay.category,
          type: 'Cash Out',
          amount: pay.amount,
          description: `Paid to ${pay.beneficiaryName}`,
        });
      }
    });

    // Cash Out: Vendor Payments
    vendorPayments.forEach((vpay) => {
      if (vpay.paymentMode === 'Cash') {
        cashBookEntries.push({
          date: vpay.paymentDate || vpay.createdAt,
          refNo: vpay.paymentNo,
          category: 'Vendor Payment',
          type: 'Cash Out',
          amount: vpay.amount,
          description: vpay.remarks || 'Vendor payout',
        });
      }
    });

    // Manual Cash Adjustments
    manualEntries.forEach((entry) => {
      cashBookEntries.push({
        date: entry.date || entry.createdAt,
        refNo: entry.entryNo,
        category: entry.source,
        type: entry.direction === 'In' ? 'Cash In' : 'Cash Out',
        amount: entry.amount,
        description: entry.remarks || entry.source,
      });
    });

    // Sort chronologically
    cashBookEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter by date range if provided
    let filtered = cashBookEntries;
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      filtered = cashBookEntries.filter((item) => {
        const d = new Date(item.date);
        return d >= s && d <= e;
      });
    }

    let runningBalance = 0;
    const itemsWithBalance = filtered.map((item) => {
      if (item.type === 'Cash In') runningBalance += item.amount;
      else runningBalance -= item.amount;

      return {
        ...item,
        runningBalance,
      };
    });

    const totalCashIn = filtered
      .filter((i) => i.type === 'Cash In')
      .reduce((sum, i) => sum + i.amount, 0);
    const totalCashOut = filtered
      .filter((i) => i.type === 'Cash Out')
      .reduce((sum, i) => sum + i.amount, 0);

    res.status(200).json({
      success: true,
      summary: {
        totalCashIn,
        totalCashOut,
        closingBalance: Math.max(0, runningBalance),
      },
      data: itemsWithBalance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 5. BANK BOOK
// ==============================================================================
exports.getBankBook = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const invoices = await Invoice.find({ tenantId });
    const receipts = await Receipt.find({ tenantId });
    const expenses = await Expense.find({ tenantId });
    const payments = await FinancialPayment.find({ tenantId });
    const vendorPayments = await VendorPayment.find({ tenantId });
    const manualEntries = await CashBankEntry.find({ tenantId, type: 'Bank' });

    const bankEntries = [];

    // Bank In: Non-Cash Invoices
    invoices.forEach((inv) => {
      if (inv.paymentMethod !== 'Cash' && inv.amountPaid > 0) {
        bankEntries.push({
          date: inv.date || inv.createdAt,
          refNo: inv.invoiceNo,
          bankAccountName: 'Main Store Account',
          type: 'Deposit',
          mode: inv.paymentMethod,
          amount: inv.amountPaid,
          party: inv.customerName,
          remarks: `Sales settlement via ${inv.paymentMethod}`,
        });
      }
    });

    // Bank In: Receipts
    receipts.forEach((rec) => {
      if (rec.paymentMode !== 'Cash') {
        bankEntries.push({
          date: rec.date || rec.createdAt,
          refNo: rec.receiptNo,
          bankAccountName: rec.bankAccountName || 'HDFC Bank Main',
          type: 'Deposit',
          mode: rec.paymentMode,
          amount: rec.amount,
          party: rec.customerName,
          remarks: rec.remarks || `Customer Receipt`,
        });
      }
    });

    // Bank Out: Expenses
    expenses.forEach((exp) => {
      if (exp.paymentMethod !== 'Cash') {
        bankEntries.push({
          date: exp.date || exp.createdAt,
          refNo: exp.expenseNo || 'EXP',
          bankAccountName: exp.bankAccountName || 'HDFC Bank Main',
          type: 'Withdrawal',
          mode: exp.paymentMethod,
          amount: exp.amount,
          party: exp.vendorName || exp.category,
          remarks: exp.description || `Expense payout`,
        });
      }
    });

    // Bank Out: Financial Payments
    payments.forEach((pay) => {
      if (pay.paymentMode !== 'Cash') {
        bankEntries.push({
          date: pay.date || pay.createdAt,
          refNo: pay.paymentNo,
          bankAccountName: pay.bankAccountName || 'HDFC Bank Main',
          type: 'Withdrawal',
          mode: pay.paymentMode,
          amount: pay.amount,
          party: pay.beneficiaryName,
          remarks: pay.remarks || `Disbursement`,
        });
      }
    });

    // Bank Out: Vendor Payments
    vendorPayments.forEach((vpay) => {
      if (vpay.paymentMode !== 'Cash') {
        bankEntries.push({
          date: vpay.paymentDate || vpay.createdAt,
          refNo: vpay.paymentNo,
          bankAccountName: 'HDFC Bank Main',
          type: 'Withdrawal',
          mode: vpay.paymentMode,
          amount: vpay.amount,
          party: 'Vendor Payout',
          remarks: vpay.remarks || `Vendor Settlement`,
        });
      }
    });

    // Manual Bank Adjustments
    manualEntries.forEach((entry) => {
      bankEntries.push({
        date: entry.date || entry.createdAt,
        refNo: entry.entryNo,
        bankAccountName: entry.bankAccountName || 'HDFC Bank Main',
        type: entry.direction === 'In' ? 'Deposit' : 'Withdrawal',
        mode: 'Online',
        amount: entry.amount,
        party: entry.source,
        remarks: entry.remarks || entry.source,
      });
    });

    bankEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    const itemsWithBalance = bankEntries.map((item) => {
      if (item.type === 'Deposit') runningBalance += item.amount;
      else runningBalance -= item.amount;

      return {
        ...item,
        runningBalance,
      };
    });

    const totalDeposits = bankEntries
      .filter((i) => i.type === 'Deposit')
      .reduce((sum, i) => sum + i.amount, 0);
    const totalWithdrawals = bankEntries
      .filter((i) => i.type === 'Withdrawal')
      .reduce((sum, i) => sum + i.amount, 0);

    res.status(200).json({
      success: true,
      summary: {
        totalDeposits,
        totalWithdrawals,
        closingBalance: Math.max(0, runningBalance),
      },
      data: itemsWithBalance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 6. EXPENSE MANAGEMENT
// ==============================================================================
exports.getExpenses = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const expenses = await Expense.find({ tenantId }).sort('-date');
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const expense = await Expense.create({
      ...req.body,
      tenantId,
      recordedBy: req.user.name || 'Admin',
    });

    await logFinancialAudit(
      tenantId,
      'Expense Created',
      expense.expenseNo,
      expense.amount,
      req.user.name,
      `Category: ${expense.category}, Mode: ${expense.paymentMethod}`,
      expense._id
    );

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    await logFinancialAudit(
      tenantId,
      'Expense Updated',
      expense.expenseNo,
      expense.amount,
      req.user.name,
      `Updated expense record`,
      expense._id
    );

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    await logFinancialAudit(
      tenantId,
      'Expense Deleted',
      expense.expenseNo,
      expense.amount,
      req.user.name,
      `Removed expense record`,
      expense._id
    );

    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 7. INCOME MANAGEMENT
// ==============================================================================
exports.getIncomes = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const manualIncomes = await Income.find({ tenantId }).sort('-date');

    // Aggregate sales incomes from Invoice collection as well
    const invoices = await Invoice.find({ tenantId, status: 'Paid' }).sort('-date');
    const autoIncomes = invoices.map((inv) => ({
      _id: inv._id,
      incomeNo: `INC-${inv.invoiceNo}`,
      source: inv.invoiceType === 'Wholesale' ? 'Wholesale Sales' : 'Retail Sales',
      amount: inv.grandTotal,
      date: inv.date || inv.createdAt,
      paymentMode: inv.paymentMethod,
      customerName: inv.customerName,
      referenceNo: inv.invoiceNo,
      isAuto: true,
    }));

    const combined = [...manualIncomes.map((i) => i.toObject()), ...autoIncomes].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.status(200).json({ success: true, data: combined });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createIncome = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const income = await Income.create({
      ...req.body,
      tenantId,
      recordedBy: req.user.name || 'Admin',
    });

    await logFinancialAudit(
      tenantId,
      'Income Created',
      income.incomeNo,
      income.amount,
      req.user.name,
      `Source: ${income.source}, Mode: ${income.paymentMode}`,
      income._id
    );

    res.status(201).json({ success: true, data: income });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const income = await Income.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!income) return res.status(404).json({ success: false, message: 'Income record not found' });

    res.status(200).json({ success: true, message: 'Income record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 8. PAYMENT TRACKING
// ==============================================================================
exports.getPayments = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const financialPayments = await FinancialPayment.find({ tenantId }).sort('-date');
    const vendorPayments = await VendorPayment.find({ tenantId }).sort('-paymentDate');

    // Normalize vendor payments
    const normVendorPayments = vendorPayments.map((vp) => ({
      _id: vp._id,
      paymentNo: vp.paymentNo,
      beneficiaryType: 'Vendor',
      beneficiaryName: 'Vendor Payout',
      category: 'Vendor Payment',
      amount: vp.amount,
      paymentMode: vp.paymentMode,
      referenceNo: vp.referenceNo || '',
      date: vp.paymentDate || vp.createdAt,
      status: 'Completed',
      remarks: vp.remarks || 'Settlement',
    }));

    const combined = [
      ...financialPayments.map((fp) => fp.toObject()),
      ...normVendorPayments,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ success: true, data: combined });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const payment = await FinancialPayment.create({
      ...req.body,
      tenantId,
      recordedBy: req.user.name || 'Admin',
    });

    await logFinancialAudit(
      tenantId,
      'Payment Recorded',
      payment.paymentNo,
      payment.amount,
      req.user.name,
      `To: ${payment.beneficiaryName}, Category: ${payment.category}`,
      payment._id
    );

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status } = req.body;

    const payment = await FinancialPayment.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { status },
      { new: true }
    );
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 9. RECEIPT MANAGEMENT
// ==============================================================================
exports.getReceipts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const receipts = await Receipt.find({ tenantId }).sort('-date');
    res.status(200).json({ success: true, data: receipts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createReceipt = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tenantId = req.user.tenantId;
    const { customerId, invoiceRef, amount, paymentMode, remarks, isAdvance } = req.body;

    let customerName = 'Walk-in Customer';
    if (customerId) {
      const cust = await Customer.findOne({ _id: customerId, tenantId }).session(session);
      if (cust) {
        customerName = cust.name;
        // Deduct customer outstanding balance
        cust.outstandingBalance = Math.max(0, (cust.outstandingBalance || 0) - amount);
        await cust.save({ session });
      }
    }

    // If invoiceRef is provided, update Invoice status
    if (invoiceRef) {
      const inv = await Invoice.findOne({ invoiceNo: invoiceRef, tenantId }).session(session);
      if (inv) {
        inv.amountPaid = (inv.amountPaid || 0) + amount;
        inv.outstandingAmount = Math.max(0, inv.grandTotal - inv.amountPaid);
        inv.status = inv.outstandingAmount === 0 ? 'Paid' : 'Partial';
        await inv.save({ session });
      }
    }

    const receipt = new Receipt({
      ...req.body,
      tenantId,
      customerName,
      receivedBy: req.user.name || 'Admin',
    });

    await receipt.save({ session });

    await logFinancialAudit(
      tenantId,
      'Receipt Issued',
      receipt.receiptNo,
      receipt.amount,
      req.user.name,
      `From: ${customerName}, Inv Ref: ${invoiceRef || 'N/A'}`,
      receipt._id
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, data: receipt });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 10. PROFIT & LOSS REPORTS
// ==============================================================================
exports.getProfitLoss = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate } = req.query;

    let dateFilter = { tenantId };
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { $gte: s, $lte: e };
    }

    const invoices = await Invoice.find(dateFilter);
    const purchaseInvoices = await PurchaseInvoice.find(dateFilter);
    const expenses = await Expense.find(dateFilter);
    const manualIncomes = await Income.find(dateFilter);

    // Revenue
    const totalSalesRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const manualIncomeTotal = manualIncomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
    const totalRevenue = totalSalesRevenue + manualIncomeTotal;

    // Cost of Goods Purchased
    const costOfPurchases = purchaseInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    // Direct & Operating Expenses
    const categoryExpenses = {};
    expenses.forEach((exp) => {
      categoryExpenses[exp.category] = (categoryExpenses[exp.category] || 0) + exp.amount;
    });

    const totalBusinessExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculations
    const grossProfit = totalRevenue - costOfPurchases;
    const netProfit = grossProfit - totalBusinessExpenses;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalSalesRevenue,
          manualIncomeTotal,
          costOfPurchases,
          grossProfit,
          totalBusinessExpenses,
          netProfit,
        },
        expenseBreakdown: categoryExpenses,
        invoiceCount: invoices.length,
        purchaseCount: purchaseInvoices.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cash/Bank manual entry helper
exports.createCashBankAdjustment = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const entry = await CashBankEntry.create({
      ...req.body,
      tenantId,
      recordedBy: req.user.name || 'Admin',
    });

    await logFinancialAudit(
      tenantId,
      'Cash/Bank Adjustment',
      entry.entryNo,
      entry.amount,
      req.user.name,
      `Type: ${entry.type}, Direction: ${entry.direction}, Source: ${entry.source}`,
      entry._id
    );

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

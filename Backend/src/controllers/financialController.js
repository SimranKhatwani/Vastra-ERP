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
const Employee = require('../models/employeeModel');
const Product = require('../models/productModel');
const PurchaseReturn = require('../models/purchaseReturnModel');
const SalesReturn = require('../models/salesReturnModel');

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

    // 1. Invoices (Sales, Receipts, Receivables, Sales Returns)
    const invoices = await Invoice.find({ tenantId });
    
    let grossTodaySales = 0;
    let todaySalesReturns = 0;
    let grossMonthlySales = 0;
    let monthlySalesReturns = 0;
    let totalSalesReturns = 0;

    invoices.forEach((inv) => {
      const invDate = new Date(inv.date || inv.createdAt);
      const total = inv.grandTotal || 0;
      let retAmt = inv.returnedAmount || 0;
      if (!retAmt && inv.items) {
        retAmt = inv.items.filter(i => i.isReturned).reduce((sum, i) => sum + (i.totalPrice || (i.price * (i.quantity || 1))), 0);
      }
      totalSalesReturns += retAmt;

      if (invDate >= startOfToday) {
        grossTodaySales += total;
        todaySalesReturns += retAmt;
      }
      if (invDate >= startOfMonth) {
        grossMonthlySales += total;
        monthlySalesReturns += retAmt;
      }
    });

    const todaySales = Math.max(0, grossTodaySales - todaySalesReturns);
    const monthlySales = Math.max(0, grossMonthlySales - monthlySalesReturns);

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

    // 3. Expenses & Payroll
    const expenses = await Expense.find({ tenantId });
    const paidEmployees = await Employee.find({ tenantId, salaryCycle: 'Paid' });

    let totalExpensesVal = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    let monthlyExpensesVal = expenses
      .filter((exp) => new Date(exp.date || exp.createdAt) >= startOfMonth)
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    paidEmployees.forEach((emp) => {
      totalExpensesVal += (emp.salary || 0);
      if (new Date(emp.updatedAt || emp.createdAt) >= startOfMonth) {
        monthlyExpensesVal += (emp.salary || 0);
      }
    });

    // 4. Incomes (Manual Incomes + Net Sales)
    const manualIncomes = await Income.find({ tenantId });
    const manualIncomeTotal = manualIncomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
    const totalIncomeVal = monthlySales + manualIncomeTotal;

    // 5. Net Profit
    const netProfitVal = totalIncomeVal - (monthlyPurchase + monthlyExpensesVal);
    const monthlyProfitVal = monthlySales - (monthlyPurchase + monthlyExpensesVal);

    // 6. Cash & Bank Balances (aggregated from payments, receipts, sales, expenses, cash bank entries, payroll)
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

    // Financial Payments
    payments.forEach((pay) => {
      if (pay.paymentMode === 'Cash') cashBalance -= pay.amount;
      else bankBalance -= pay.amount;
    });

    // Vendor Payments (if not already in FinancialPayment)
    vendorPayments.forEach((vpay) => {
      if (vpay.paymentMode === 'Cash') cashBalance -= vpay.amount;
      else bankBalance -= vpay.amount;
    });

    // Paid Employee Salaries
    const fpEmpIds = new Set(
      payments
        .filter((fp) => fp.category === 'Salary' && fp.beneficiaryId)
        .map((fp) => fp.beneficiaryId.toString())
    );

    paidEmployees.forEach((emp) => {
      if (!fpEmpIds.has(emp._id.toString())) {
        bankBalance -= (emp.salary || 0);
      }
    });

    // Customer & Vendor Outstanding totals from master collections
    const customers = await Customer.find({ tenantId });
    const customerOutstandingTotal = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0) || totalReceivables;

    const vendors = await Vendor.find({ tenantId });
    const vendorOutstandingTotal = vendors.reduce((sum, v) => sum + (v.currentOutstanding || 0), 0) || totalPayables;

    // Unified Outgoing Payments Feed for Dashboard
    const normVendorPayments = vendorPayments.map((vp) => ({
      _id: vp._id,
      paymentNo: vp.paymentNo,
      beneficiaryName: 'Vendor Payout',
      category: 'Vendor Payment',
      amount: vp.amount,
      paymentMode: vp.paymentMode,
      date: vp.paymentDate || vp.createdAt,
    }));

    const normExpenses = expenses.map((exp) => ({
      _id: exp._id,
      paymentNo: exp.expenseNo || `EXP-${exp._id}`,
      beneficiaryName: exp.vendorName || exp.category,
      category: 'Expense Payment',
      amount: exp.amount,
      paymentMode: exp.paymentMethod || 'Cash',
      date: exp.date || exp.createdAt,
    }));

    const normSalaries = paidEmployees
      .filter((emp) => !fpEmpIds.has(emp._id.toString()))
      .map((emp) => ({
        _id: emp._id,
        paymentNo: `FPAY-SAL-${emp._id.toString().substring(18)}`,
        beneficiaryName: emp.name,
        category: 'Salary',
        amount: emp.salary || 0,
        paymentMode: 'Bank Transfer',
        date: emp.updatedAt || emp.createdAt,
      }));

    const allPaymentsUnified = [
      ...payments.map((fp) => fp.toObject()),
      ...normVendorPayments,
      ...normExpenses,
      ...normSalaries,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Charts & Recent Activity feeds
    const recentSales = invoices.slice(-5).reverse();
    const recentPurchases = purchaseInvoices.slice(-5).reverse();
    const recentExpenses = expenses.slice(-5).reverse();
    const recentReceipts = receipts.slice(-5).reverse();
    const recentPayments = allPaymentsUnified.slice(0, 5);

    res.status(200).json({
      success: true,
      kpis: {
        todaySales,
        grossTodaySales,
        todaySalesReturns,
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
        grossMonthlySales,
        monthlySalesReturns,
        totalSalesReturns,
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
    const amountVal = Number(req.body.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      return res.status(400).json({ success: false, message: 'Valid expense amount (> 0) is required' });
    }
    const expense = await Expense.create({
      ...req.body,
      amount: amountVal,
      gst: Number(req.body.gst) || 0,
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
    const invoices = await Invoice.find({ tenantId, amountPaid: { $gt: 0 } }).sort('-date');
    const receipts = await Receipt.find({ tenantId }).sort('-date');

    // Aggregate sales incomes from Invoice collection
    const autoIncomes = invoices.map((inv) => ({
      _id: inv._id,
      incomeNo: `INC-${inv.invoiceNo}`,
      source: inv.invoiceType === 'Wholesale' ? 'Wholesale Sales' : 'Retail Sales',
      amount: inv.amountPaid || inv.grandTotal,
      date: inv.date || inv.createdAt,
      paymentMode: inv.paymentMethod || 'Cash',
      customerName: inv.customerName || 'Walk-in Customer',
      referenceNo: inv.invoiceNo,
      isAuto: true,
    }));

    // Aggregate customer receipts
    const receiptIncomes = receipts.map((rec) => ({
      _id: rec._id,
      incomeNo: rec.receiptNo,
      source: rec.isAdvance ? 'Advance Receipt' : 'Customer Receipt',
      amount: rec.amount,
      date: rec.date || rec.createdAt,
      paymentMode: rec.paymentMode || 'Cash',
      customerName: rec.customerName || 'Customer',
      referenceNo: rec.invoiceRef || rec.referenceNo || 'N/A',
      isAuto: true,
    }));

    const combined = [
      ...manualIncomes.map((i) => i.toObject()),
      ...autoIncomes,
      ...receiptIncomes,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ success: true, data: combined });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createIncome = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const amountVal = Number(req.body.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      return res.status(400).json({ success: false, message: 'Valid income amount (> 0) is required' });
    }
    const income = await Income.create({
      ...req.body,
      amount: amountVal,
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
    const expenses = await Expense.find({ tenantId }).sort('-date');
    const paidEmployees = await Employee.find({ tenantId, salaryCycle: 'Paid' }).sort('-updatedAt');

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

    // Normalize expense payouts
    const normExpenses = expenses.map((exp) => ({
      _id: exp._id,
      paymentNo: exp.expenseNo || `EXP-${exp._id}`,
      beneficiaryType: 'Other',
      beneficiaryName: exp.vendorName || exp.category,
      category: 'Expense Payment',
      amount: exp.amount,
      paymentMode: exp.paymentMethod || 'Cash',
      referenceNo: exp.referenceNo || '',
      date: exp.date || exp.createdAt,
      status: 'Completed',
      remarks: exp.description || `Expense: ${exp.category}`,
    }));

    // Normalize paid employee salaries (only if not already created in FinancialPayment)
    const fpEmpIds = new Set(
      financialPayments
        .filter((fp) => fp.category === 'Salary' && fp.beneficiaryId)
        .map((fp) => fp.beneficiaryId.toString())
    );

    const normSalaries = paidEmployees
      .filter((emp) => !fpEmpIds.has(emp._id.toString()))
      .map((emp) => ({
        _id: emp._id,
        paymentNo: `FPAY-SAL-${emp._id.toString().substring(18)}`,
        beneficiaryType: 'Employee',
        beneficiaryName: emp.name,
        category: 'Salary',
        amount: emp.salary || 0,
        paymentMode: 'Bank Transfer',
        referenceNo: emp.disbursedDate || '',
        date: emp.updatedAt || emp.createdAt,
        status: 'Completed',
        remarks: `HR Payroll Salary Disbursed (${emp.role})`,
      }));

    const combined = [
      ...financialPayments.map((fp) => fp.toObject()),
      ...normVendorPayments,
      ...normExpenses,
      ...normSalaries,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ success: true, data: combined });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const amountVal = Number(req.body.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount (> 0) is required' });
    }
    const bType = req.body.beneficiaryType || (req.body.category === 'Salary' ? 'Employee' : req.body.category === 'Vendor Payment' ? 'Vendor' : 'Other');

    const payment = await FinancialPayment.create({
      ...req.body,
      amount: amountVal,
      beneficiaryType: bType,
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
// 10. PROFIT & LOSS REPORTS (LIVE AUTOMATED AGGREGATION)
// ==============================================================================
exports.getProfitLoss = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { preset, startDate, endDate } = req.query;

    let startFilter = null;
    let endFilter = new Date();

    if (preset === 'today') {
      startFilter = new Date();
      startFilter.setHours(0, 0, 0, 0);
    } else if (preset === 'yesterday') {
      startFilter = new Date();
      startFilter.setDate(startFilter.getDate() - 1);
      startFilter.setHours(0, 0, 0, 0);
      endFilter = new Date();
      endFilter.setDate(endFilter.getDate() - 1);
      endFilter.setHours(23, 59, 59, 999);
    } else if (preset === 'week') {
      startFilter = new Date();
      const day = startFilter.getDay();
      const diff = startFilter.getDate() - day + (day === 0 ? -6 : 1);
      startFilter.setDate(diff);
      startFilter.setHours(0, 0, 0, 0);
    } else if (preset === 'month') {
      startFilter = new Date();
      startFilter.setDate(1);
      startFilter.setHours(0, 0, 0, 0);
    } else if (preset === 'quarter') {
      startFilter = new Date();
      const currentMonth = startFilter.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      startFilter.setMonth(quarterStartMonth, 1);
      startFilter.setHours(0, 0, 0, 0);
    } else if (preset === 'year') {
      startFilter = new Date();
      startFilter.setMonth(0, 1);
      startFilter.setHours(0, 0, 0, 0);
    } else if (startDate && endDate) {
      startFilter = new Date(startDate);
      endFilter = new Date(endDate);
      endFilter.setHours(23, 59, 59, 999);
    }

    // Product Cost Lookup Map
    const products = await Product.find({ tenantId }).lean();
    const productCostMap = {};
    products.forEach((p) => {
      const cost = p.purchasePrice || p.costPrice || p.basePrice || (p.sellingPrice ? p.sellingPrice * 0.7 : 0);
      productCostMap[p._id.toString()] = cost;
      if (p.productCode) productCostMap[p.productCode] = cost;
      if (p.sku) productCostMap[p.sku] = cost;
      if (p.name) productCostMap[p.name.toLowerCase().trim()] = cost;
    });

    // Date Filter Object
    const dateQuery = { tenantId };
    if (startFilter) {
      dateQuery.createdAt = { $gte: startFilter, $lte: endFilter };
    }

    // 1. Fetch Collections
    const invoices = await Invoice.find(dateQuery).lean();
    const salesReturns = await SalesReturn.find(dateQuery).lean();
    const purchaseReturns = await PurchaseReturn.find(dateQuery).lean();
    const expenses = await Expense.find(dateQuery).lean();
    const incomes = await Income.find(dateQuery).lean();
    const paidEmployees = await Employee.find({ tenantId, salaryCycle: 'Paid' }).lean();

    // Calculate Today, Monthly, Yearly Profit benchmarks for KPI comparison
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
    const startMonth = new Date(); startMonth.setDate(1); startMonth.setHours(0, 0, 0, 0);
    const startYear = new Date(); startYear.setMonth(0, 1); startYear.setHours(0, 0, 0, 0);

    const allInvoices = await Invoice.find({ tenantId }).lean();
    const allExpenses = await Expense.find({ tenantId }).lean();
    const allIncomes = await Income.find({ tenantId }).lean();

    const calcNetProfitForRange = (sDate) => {
      const filteredInv = allInvoices.filter(i => new Date(i.date || i.createdAt) >= sDate);
      let sRev = filteredInv.reduce((s, i) => s + (i.grandTotal || 0), 0);
      let sCogs = 0;
      filteredInv.forEach(inv => {
        (inv.items || []).forEach(item => {
          const pCost = item.productId ? (productCostMap[item.productId] || productCostMap[item.name?.toLowerCase().trim()] || 0) : 0;
          sCogs += pCost * (item.quantity || 1);
        });
      });
      const fInc = allIncomes.filter(inc => new Date(inc.date || inc.createdAt) >= sDate).reduce((s, i) => s + i.amount, 0);
      const fExp = allExpenses.filter(exp => new Date(exp.date || exp.createdAt) >= sDate).reduce((s, e) => s + e.amount, 0);
      return (sRev - sCogs) + fInc - fExp;
    };

    const todayProfit = calcNetProfitForRange(startToday);
    const monthlyProfit = calcNetProfitForRange(startMonth);
    const yearlyProfit = calcNetProfitForRange(startYear);

    // 2. Compute Total Sales & Item COGS
    let totalSalesGross = 0;
    let totalCOGSGross = 0;
    const reportRows = [];
    const productProfitStats = {};
    const categoryProfitStats = {};

    invoices.forEach((inv) => {
      const invSales = inv.grandTotal || inv.subTotal || 0;
      totalSalesGross += invSales;

      let invCOGS = 0;
      (inv.items || []).forEach((item) => {
        const qty = item.quantity || 1;
        const pCost = item.productId
          ? (productCostMap[item.productId] || productCostMap[item.name?.toLowerCase()?.trim()] || 0)
          : (productCostMap[item.name?.toLowerCase()?.trim()] || (item.price ? item.price * 0.7 : 0));
        
        const itemCOGS = pCost * qty;
        invCOGS += itemCOGS;

        // Product stats
        const pName = item.name || 'General Item';
        if (!productProfitStats[pName]) {
          productProfitStats[pName] = { name: pName, sales: 0, cost: 0, profit: 0, qty: 0 };
        }
        productProfitStats[pName].sales += (item.totalPrice || (item.price * qty));
        productProfitStats[pName].cost += itemCOGS;
        productProfitStats[pName].profit += ((item.totalPrice || (item.price * qty)) - itemCOGS);
        productProfitStats[pName].qty += qty;

        // Category stats
        const catName = item.category || 'General';
        if (!categoryProfitStats[catName]) {
          categoryProfitStats[catName] = { name: catName, sales: 0, cost: 0, profit: 0 };
        }
        categoryProfitStats[catName].sales += (item.totalPrice || (item.price * qty));
        categoryProfitStats[catName].cost += itemCOGS;
        categoryProfitStats[catName].profit += ((item.totalPrice || (item.price * qty)) - itemCOGS);
      });

      totalCOGSGross += invCOGS;

      const invGrossProfit = invSales - invCOGS;
      reportRows.push({
        date: inv.date || inv.createdAt,
        invoiceNo: inv.invoiceNo,
        customerName: inv.customerName || 'Walk-in Customer',
        salesAmount: invSales,
        costAmount: invCOGS,
        grossProfit: invGrossProfit,
        expenseAllocation: 0, // Computed after total expenses
        netProfit: invGrossProfit,
        status: invGrossProfit >= 0 ? 'PROFIT' : 'LOSS',
        type: 'Sale',
      });
    });

    // 3. Sales Returns adjustment
    let totalSalesReturnsAmount = 0;
    let returnedCOGSAmount = 0;

    salesReturns.forEach((sr) => {
      const retAmt = sr.totalReturnAmount || 0;
      totalSalesReturnsAmount += retAmt;

      let retCost = 0;
      (sr.items || []).forEach((item) => {
        const qty = item.quantity || 1;
        const pCost = item.costPrice || (item.productId ? (productCostMap[item.productId] || 0) : 0);
        retCost += pCost * qty;
      });

      returnedCOGSAmount += retCost;
    });

    // 4. Purchase Returns adjustment
    let totalPurchaseReturnsAmount = 0;
    purchaseReturns.forEach((pr) => {
      const qty = pr.quantity || 1;
      const pCost = pr.productId ? (productCostMap[pr.productId.toString()] || 0) : 0;
      totalPurchaseReturnsAmount += (pCost * qty);
    });

    // Net Sales & Net COGS
    const totalSales = Math.max(0, totalSalesGross - totalSalesReturnsAmount);
    const totalCOGS = Math.max(0, totalCOGSGross - returnedCOGSAmount - totalPurchaseReturnsAmount);
    const grossProfit = totalSales - totalCOGS;

    // 5. Other Income Calculation
    const incomeBreakdown = {};
    let totalOtherIncome = 0;

    incomes.forEach((inc) => {
      totalOtherIncome += inc.amount;
      const src = inc.source || 'Other Income';
      incomeBreakdown[src] = (incomeBreakdown[src] || 0) + inc.amount;
    });

    // 6. Total Expenses & Breakdown
    const expenseBreakdown = {};
    let totalExpensesVal = 0;

    expenses.forEach((exp) => {
      totalExpensesVal += exp.amount;
      const cat = exp.category || 'Miscellaneous';
      expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + exp.amount;
    });

    // Payroll Salaries
    paidEmployees.forEach((emp) => {
      const sal = emp.salary || 0;
      if (sal > 0) {
        totalExpensesVal += sal;
        expenseBreakdown['Salary'] = (expenseBreakdown['Salary'] || 0) + sal;
      }
    });

    // 7. Net Profit & Margin
    const netProfit = grossProfit + totalOtherIncome - totalExpensesVal;
    const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(2) : '0.00';
    const overallStatus = netProfit < 0 ? 'LOSS' : 'PROFIT';

    // Update pro-rated expense allocation in report table rows
    reportRows.forEach((row) => {
      const proRatedExp = totalSalesGross > 0 ? (row.salesAmount / totalSalesGross) * totalExpensesVal : 0;
      row.expenseAllocation = Number(proRatedExp.toFixed(2));
      row.netProfit = Number((row.grossProfit - proRatedExp).toFixed(2));
      row.status = row.netProfit >= 0 ? 'PROFIT' : 'LOSS';
    });

    // Product Profitability rankings
    const productStatsArr = Object.values(productProfitStats);
    const topProfitableProducts = [...productStatsArr].sort((a, b) => b.profit - a.profit).slice(0, 5);
    const leastProfitableProducts = [...productStatsArr].sort((a, b) => a.profit - b.profit).slice(0, 5);
    const topCategoriesByProfit = Object.values(categoryProfitStats).sort((a, b) => b.profit - a.profit);

    // Monthly Trend Chart (Last 6 Months)
    const monthlyTrendMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyTrendMap[label] = { month: label, sales: 0, cogs: 0, expenses: 0, profit: 0 };
    }

    allInvoices.forEach((inv) => {
      const invDate = new Date(inv.date || inv.createdAt);
      const label = invDate.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyTrendMap[label]) {
        monthlyTrendMap[label].sales += (inv.grandTotal || 0);
        let c = 0;
        (inv.items || []).forEach((item) => {
          c += (productCostMap[item.productId] || (item.price ? item.price * 0.7 : 0)) * (item.quantity || 1);
        });
        monthlyTrendMap[label].cogs += c;
      }
    });

    allExpenses.forEach((exp) => {
      const expDate = new Date(exp.date || exp.createdAt);
      const label = expDate.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyTrendMap[label]) {
        monthlyTrendMap[label].expenses += exp.amount;
      }
    });

    Object.keys(monthlyTrendMap).forEach((m) => {
      const t = monthlyTrendMap[m];
      t.profit = (t.sales - t.cogs) - t.expenses;
    });

    res.status(200).json({
      success: true,
      kpis: {
        totalSales,
        cogs: totalCOGS,
        grossProfit,
        otherIncome: totalOtherIncome,
        totalExpenses: totalExpensesVal,
        netProfit,
        profitMargin,
        status: overallStatus,
        todayProfit,
        monthlyProfit,
        yearlyProfit,
        salesReturnsAmount: totalSalesReturnsAmount,
        purchaseReturnsAmount: totalPurchaseReturnsAmount,
      },
      charts: {
        monthlyTrend: Object.values(monthlyTrendMap),
        expenseBreakdown: Object.keys(expenseBreakdown).map((k) => ({ name: k, value: expenseBreakdown[k] })),
        incomeBreakdown: Object.keys(incomeBreakdown).map((k) => ({ name: k, value: incomeBreakdown[k] })),
        topProducts: topProfitableProducts,
        leastProducts: leastProfitableProducts,
        topCategories: topCategoriesByProfit,
      },
      reportTable: reportRows.slice(0, 100),
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

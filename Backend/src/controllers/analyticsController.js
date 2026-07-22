const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Invoice = require('../models/invoiceModel');
const PurchaseInvoice = require('../models/purchaseInvoiceModel');
const Expense = require('../models/expenseModel');
const Income = require('../models/incomeModel');
const Customer = require('../models/customerModel');
const Vendor = require('../models/vendorModel');
const Employee = require('../models/employeeModel');
const AttendanceRecord = require('../models/attendanceRecordModel');
const SalesReturn = require('../models/salesReturnModel');
const PurchaseReturn = require('../models/purchaseReturnModel');
const FinancialPayment = require('../models/financialPaymentModel');
const VendorPayment = require('../models/vendorPaymentModel');
const Receipt = require('../models/receiptModel');
const CashBankEntry = require('../models/cashBankEntryModel');

// ==============================================================================
// 1. BUSINESS PERFORMANCE DASHBOARD (BI ENTERPRISE SUMMARY)
// ==============================================================================
exports.getBIDashboard = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Product Cost Lookup Map
    const products = await Product.find({ tenantId }).lean();
    const productCostMap = {};
    let lowStockCount = 0;
    let inventoryValue = 0;

    products.forEach((p) => {
      const cost = p.purchasePrice || p.costPrice || p.basePrice || (p.sellingPrice ? p.sellingPrice * 0.7 : 0);
      productCostMap[p._id.toString()] = cost;
      if (p.productCode) productCostMap[p.productCode] = cost;
      if (p.sku) productCostMap[p.sku] = cost;
      if (p.name) productCostMap[p.name.toLowerCase().trim()] = cost;

      inventoryValue += cost * (p.stock || 0);
      if ((p.stock || 0) <= (p.threshold || 10)) {
        lowStockCount++;
      }
    });

    // Invoices & Sales
    const invoices = await Invoice.find({ tenantId }).lean();
    let todaySales = 0;
    let monthlySales = 0;
    let totalReceivables = 0;
    let totalSalesRevenue = 0;
    const categorySales = {};
    const paymentModes = {};

    invoices.forEach((inv) => {
      const invDate = new Date(inv.date || inv.createdAt);
      const total = inv.grandTotal || 0;
      totalSalesRevenue += total;

      if (invDate >= startOfToday) todaySales += total;
      if (invDate >= startOfMonth) monthlySales += total;
      if (inv.status !== 'Paid') totalReceivables += (inv.outstandingAmount || 0);

      const pm = inv.paymentMethod || 'Cash';
      paymentModes[pm] = (paymentModes[pm] || 0) + total;

      (inv.items || []).forEach((item) => {
        const cat = item.category || 'General';
        categorySales[cat] = (categorySales[cat] || 0) + (item.totalPrice || (item.price * (item.quantity || 1)));
      });
    });

    // Purchase Invoices
    const purchases = await PurchaseInvoice.find({ tenantId }).lean();
    let todayPurchase = 0;
    let monthlyPurchase = 0;
    let totalPayables = 0;

    purchases.forEach((po) => {
      const pDate = new Date(po.invoiceDate || po.createdAt);
      const total = po.grandTotal || 0;
      if (pDate >= startOfToday) todayPurchase += total;
      if (pDate >= startOfMonth) monthlyPurchase += total;
      if (po.paymentStatus !== 'Paid') totalPayables += (po.outstandingAmount || 0);
    });

    // Expenses & Income
    const expenses = await Expense.find({ tenantId }).lean();
    const incomes = await Income.find({ tenantId }).lean();
    const paidEmployees = await Employee.find({ tenantId, salaryCycle: 'Paid' }).lean();

    let totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    let monthlyExpenses = expenses
      .filter((e) => new Date(e.date || e.createdAt) >= startOfMonth)
      .reduce((s, e) => s + (e.amount || 0), 0);

    paidEmployees.forEach((emp) => {
      const sal = emp.salary || 0;
      totalExpenses += sal;
      if (new Date(emp.updatedAt || emp.createdAt) >= startOfMonth) {
        monthlyExpenses += sal;
      }
    });

    let totalOtherIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
    let totalRevenue = monthlySales + totalOtherIncome;

    // COGS & Gross/Net Profit
    let totalCOGS = 0;
    let todayCOGS = 0;

    invoices.forEach((inv) => {
      const invDate = new Date(inv.date || inv.createdAt);
      (inv.items || []).forEach((item) => {
        const qty = item.quantity || 1;
        const pCost = item.productId
          ? (productCostMap[item.productId] || productCostMap[item.name?.toLowerCase()?.trim()] || 0)
          : (productCostMap[item.name?.toLowerCase()?.trim()] || (item.price ? item.price * 0.7 : 0));
        
        const costVal = pCost * qty;
        totalCOGS += costVal;
        if (invDate >= startOfToday) todayCOGS += costVal;
      });
    });

    const grossProfit = totalSalesRevenue - totalCOGS;
    const netProfit = grossProfit + totalOtherIncome - totalExpenses;
    const todayProfit = todaySales - todayCOGS;

    // Active Counts
    const activeCustomersCount = await Customer.countDocuments({ tenantId });
    const activeVendorsCount = await Vendor.countDocuments({ tenantId });
    const activeEmployeesCount = await Employee.countDocuments({ tenantId });

    // Today Attendance %
    const todayAttendanceRecords = await AttendanceRecord.find({ tenantId, date: { $gte: startOfToday } });
    const presentCount = todayAttendanceRecords.filter((a) => a.status === 'Present' || a.status === 'Late').length;
    const attendancePercentage = activeEmployeesCount > 0 ? Number(((presentCount / activeEmployeesCount) * 100).toFixed(1)) : 0;

    // Product Velocity (Fast / Slow moving)
    const productVelocityMap = {};
    invoices.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const pName = item.name || 'General';
        productVelocityMap[pName] = (productVelocityMap[pName] || 0) + (item.quantity || 1);
      });
    });

    const sortedProducts = Object.entries(productVelocityMap).sort((a, b) => b[1] - a[1]);
    const fastMovingCount = sortedProducts.slice(0, 5).length;
    const slowMovingCount = Math.max(0, products.length - fastMovingCount);

    // Monthly Trend Chart Data (Last 12 Months)
    const monthlySalesTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });

      const monthInv = invoices.filter((inv) => {
        const date = new Date(inv.date || inv.createdAt);
        return date >= d && date < nextD;
      });

      const monthPur = purchases.filter((po) => {
        const date = new Date(po.invoiceDate || po.createdAt);
        return date >= d && date < nextD;
      });

      const monthExp = expenses.filter((e) => {
        const date = new Date(e.date || e.createdAt);
        return date >= d && date < nextD;
      });

      const salesVal = monthInv.reduce((s, i) => s + (i.grandTotal || 0), 0);
      const purVal = monthPur.reduce((s, p) => s + (p.grandTotal || 0), 0);
      const expVal = monthExp.reduce((s, e) => s + (e.amount || 0), 0);

      let monthCOGS = 0;
      monthInv.forEach((inv) => {
        (inv.items || []).forEach((item) => {
          monthCOGS += (productCostMap[item.productId] || (item.price ? item.price * 0.7 : 0)) * (item.quantity || 1);
        });
      });

      const profitVal = (salesVal - monthCOGS) - expVal;

      monthlySalesTrend.push({
        month: label,
        sales: salesVal,
        purchases: purVal,
        expenses: expVal,
        profit: profitVal,
      });
    }

    res.status(200).json({
      success: true,
      kpis: {
        todaySales,
        todayPurchase,
        todayProfit,
        monthlySales,
        monthlyPurchase,
        monthlyRevenue: totalRevenue,
        monthlyExpenses,
        grossProfit,
        netProfit,
        outstandingReceivables: totalReceivables,
        outstandingPayables: totalPayables,
        inventoryValue,
        activeCustomers: activeCustomersCount,
        activeVendors: activeVendorsCount,
        activeEmployees: activeEmployeesCount,
        attendancePercentage,
        lowStockProducts: lowStockCount,
        fastMovingProducts: fastMovingCount,
        slowMovingProducts: slowMovingCount,
      },
      charts: {
        monthlySalesTrend,
        categorySales: Object.keys(categorySales).map((k) => ({ name: k, value: categorySales[k] })),
        paymentModes: Object.keys(paymentModes).map((k) => ({ name: k, value: paymentModes[k] })),
        topProducts: sortedProducts.slice(0, 5).map(([name, qty]) => ({ name, qty })),
      },
      recentActivities: invoices.slice(-8).reverse(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 2. SALES ANALYTICS (SALES, PURCHASES, CUSTOMER, VENDOR, GST REPORTS)
// ==============================================================================
exports.getSalesAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { reportType, startDate, endDate } = req.query;

    let dateQuery = { tenantId };
    if (startDate && endDate) {
      dateQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') };
    }

    if (reportType === 'purchase') {
      const purchases = await PurchaseInvoice.find(dateQuery).sort('-createdAt').lean();
      const totalPurchases = purchases.reduce((s, p) => s + (p.grandTotal || 0), 0);
      const totalTax = purchases.reduce((s, p) => s + (p.taxTotal || 0), 0);
      return res.status(200).json({
        success: true,
        summary: { totalPurchases, totalTax, count: purchases.length },
        data: purchases,
      });
    }

    if (reportType === 'customer') {
      const customers = await Customer.find({ tenantId }).sort('-createdAt').lean();
      const totalReceivables = customers.reduce((s, c) => s + (c.outstandingBalance || 0), 0);
      return res.status(200).json({
        success: true,
        summary: { totalCustomers: customers.length, totalReceivables },
        data: customers,
      });
    }

    if (reportType === 'vendor') {
      const vendors = await Vendor.find({ tenantId }).sort('-createdAt').lean();
      const totalPayables = vendors.reduce((s, v) => s + (v.currentOutstanding || 0), 0);
      return res.status(200).json({
        success: true,
        summary: { totalVendors: vendors.length, totalPayables },
        data: vendors,
      });
    }

    if (reportType === 'gst') {
      const salesInvoices = await Invoice.find(dateQuery).lean();
      const purchaseInvoices = await PurchaseInvoice.find(dateQuery).lean();

      const outputGST = salesInvoices.reduce((s, i) => s + (i.gstTotal || 0), 0);
      const inputGST = purchaseInvoices.reduce((s, p) => s + (p.taxTotal || 0), 0);
      const netGSTLiability = outputGST - inputGST;

      return res.status(200).json({
        success: true,
        summary: { outputGST, inputGST, netGSTLiability },
        salesGST: salesInvoices,
        purchaseGST: purchaseInvoices,
      });
    }

    // Default: Sales Report
    const invoices = await Invoice.find(dateQuery).sort('-createdAt').lean();
    const totalSales = invoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const totalGST = invoices.reduce((s, i) => s + (i.gstTotal || 0), 0);

    res.status(200).json({
      success: true,
      summary: { totalSales, totalGST, invoiceCount: invoices.length },
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 3. INVENTORY ANALYTICS (INVENTORY, AGING, FAST & SLOW MOVING)
// ==============================================================================
exports.getInventoryAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { reportType } = req.query;

    const products = await Product.find({ tenantId }).sort('-createdAt').lean();
    const invoices = await Invoice.find({ tenantId }).lean();

    const productSalesMap = {};
    invoices.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const pName = item.name || 'General';
        if (!productSalesMap[pName]) productSalesMap[pName] = { qty: 0, revenue: 0 };
        productSalesMap[pName].qty += (item.quantity || 1);
        productSalesMap[pName].revenue += (item.totalPrice || (item.price * (item.quantity || 1)));
      });
    });

    const categoryBreakdown = {};
    const brandBreakdown = {};
    let totalStockValuation = 0;
    let totalStockItems = 0;

    const formattedProducts = products.map((p) => {
      const cost = p.purchasePrice || p.costPrice || p.basePrice || (p.sellingPrice ? p.sellingPrice * 0.7 : 0);
      const val = cost * (p.stock || 0);
      totalStockValuation += val;
      totalStockItems += (p.stock || 0);

      categoryBreakdown[p.category || 'General'] = (categoryBreakdown[p.category || 'General'] || 0) + val;
      brandBreakdown[p.brand || 'Generic'] = (brandBreakdown[p.brand || 'Generic'] || 0) + val;

      const salesInfo = productSalesMap[p.name] || { qty: 0, revenue: 0 };
      return {
        ...p,
        costPrice: cost,
        valuation: val,
        soldQty: salesInfo.qty,
        salesRevenue: salesInfo.revenue,
      };
    });

    if (reportType === 'fast_moving') {
      const fastList = [...formattedProducts].sort((a, b) => b.soldQty - a.soldQty).slice(0, 20);
      return res.status(200).json({
        success: true,
        summary: { count: fastList.length },
        data: fastList,
      });
    }

    if (reportType === 'slow_moving') {
      const slowList = [...formattedProducts].sort((a, b) => a.soldQty - b.soldQty).slice(0, 20);
      return res.status(200).json({
        success: true,
        summary: { count: slowList.length },
        data: slowList,
      });
    }

    if (reportType === 'stock_aging') {
      const now = new Date();
      const agedOver90 = formattedProducts.filter((p) => (now - new Date(p.createdAt)) / (1000 * 60 * 60 * 24) > 90);
      const agedOver60 = formattedProducts.filter((p) => (now - new Date(p.createdAt)) / (1000 * 60 * 60 * 24) > 60);
      return res.status(200).json({
        success: true,
        summary: { over90Count: agedOver90.length, over60Count: agedOver60.length },
        data: formattedProducts,
      });
    }

    // Default: Main Inventory Report
    res.status(200).json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalStockItems,
        totalStockValuation,
      },
      categoryBreakdown: Object.keys(categoryBreakdown).map((k) => ({ name: k, value: categoryBreakdown[k] })),
      brandBreakdown: Object.keys(brandBreakdown).map((k) => ({ name: k, value: brandBreakdown[k] })),
      data: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 4. PEOPLE ANALYTICS (EMPLOYEES, ATTENDANCE, PERFORMANCE, COMMISSIONS, PAYROLL)
// ==============================================================================
exports.getPeopleAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { reportType } = req.query;

    const employees = await Employee.find({ tenantId }).lean();
    const attendanceRecords = await AttendanceRecord.find({ tenantId }).sort('-date').lean();
    const invoices = await Invoice.find({ tenantId }).lean();

    const empPerformanceMap = {};
    employees.forEach((emp) => {
      empPerformanceMap[emp.name] = { salesTotal: 0, invoiceCount: 0 };
    });

    invoices.forEach((inv) => {
      const empName = inv.salespersonName || inv.employeeName;
      if (empName && empPerformanceMap[empName]) {
        empPerformanceMap[empName].salesTotal += (inv.grandTotal || 0);
        empPerformanceMap[empName].invoiceCount++;
      }
    });

    const formattedEmployees = employees.map((emp) => {
      const perf = empPerformanceMap[emp.name] || { salesTotal: 0, invoiceCount: 0 };
      return {
        ...emp,
        generatedRevenue: perf.salesTotal,
        invoicesHandled: perf.invoiceCount,
      };
    });

    if (reportType === 'attendance') {
      const presentCount = attendanceRecords.filter((a) => a.status === 'Present' || a.status === 'Late').length;
      const totalRecords = attendanceRecords.length || 1;
      const attendancePct = Number(((presentCount / totalRecords) * 100).toFixed(1));

      return res.status(200).json({
        success: true,
        summary: { totalRecords, presentCount, attendancePct },
        data: attendanceRecords,
      });
    }

    // Default: Employee Performance & Payroll Summary
    const totalPayroll = employees.reduce((s, e) => s + (e.salary || 0), 0);
    const paidPayroll = employees.filter((e) => e.salaryCycle === 'Paid').reduce((s, e) => s + (e.salary || 0), 0);

    res.status(200).json({
      success: true,
      summary: {
        totalEmployees: employees.length,
        totalPayroll,
        paidPayroll,
        unpaidPayroll: totalPayroll - paidPayroll,
      },
      data: formattedEmployees,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// 5. FINANCIAL ANALYTICS (STATEMENT, CASH FLOW, LEDGERS, CASH/BANK)
// ==============================================================================
exports.getFinancialAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const invoices = await Invoice.find({ tenantId }).lean();
    const purchases = await PurchaseInvoice.find({ tenantId }).lean();
    const expenses = await Expense.find({ tenantId }).lean();
    const incomes = await Income.find({ tenantId }).lean();
    const receipts = await Receipt.find({ tenantId }).lean();
    const payments = await FinancialPayment.find({ tenantId }).lean();
    const vendorPayments = await VendorPayment.find({ tenantId }).lean();
    const cashBankEntries = await CashBankEntry.find({ tenantId }).lean();

    const totalSales = invoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const totalPurchases = purchases.reduce((s, p) => s + (p.grandTotal || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalIncomes = incomes.reduce((s, i) => s + (i.amount || 0), 0);
    const totalReceipts = receipts.reduce((s, r) => s + (r.amount || 0), 0);
    const totalPayments = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalVendorPayments = vendorPayments.reduce((s, v) => s + (v.amount || 0), 0);

    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit + totalIncomes - totalExpenses;

    res.status(200).json({
      success: true,
      summary: {
        totalSales,
        totalPurchases,
        totalExpenses,
        totalIncomes,
        totalReceipts,
        totalPayments,
        totalVendorPayments,
        grossProfit,
        netProfit,
        cashBankCount: cashBankEntries.length,
      },
      expenses,
      incomes,
      receipts,
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

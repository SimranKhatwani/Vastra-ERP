const mongoose = require('mongoose');
const SaleBill = require('../models/billing/SaleBill');
const Customer = require('../models/crm/Customer');
const Expense = require('../models/Expense');
const Vendor = require('../models/masters/Vendor');
const PurchaseBill = require('../models/purchase/PurchaseBill');
const CustomerLedger = require('../models/ledger/CustomerLedger');

class FinancialService {
  /**
   * 1. Financial Summary Dashboard Metrics
   */
  static async getDashboardSummary(tenantId) {
    const tId = new mongoose.Types.ObjectId(tenantId);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const [allBills, todayBills, allExpenses, recentSales] = await Promise.all([
      SaleBill.find({ tenantId: tId, status: { $ne: 'CANCELLED' } }).lean(),
      SaleBill.find({ tenantId: tId, status: { $ne: 'CANCELLED' }, createdAt: { $gte: todayStart } }).lean(),
      Expense.find({ tenantId: tId }).lean(),
      SaleBill.find({ tenantId: tId, status: { $ne: 'CANCELLED' } }).sort({ createdAt: -1 }).limit(10).lean()
    ]);

    const totalSales = allBills.reduce((acc, b) => acc + (Number(b.grandTotal) || 0), 0);
    const todaySales = todayBills.reduce((acc, b) => acc + (Number(b.grandTotal) || 0), 0);
    const totalExpenses = allExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const netProfit = totalSales - totalExpenses;

    return {
      success: true,
      kpis: {
        todaySales,
        grossTodaySales: todaySales,
        todaySalesReturns: 0,
        totalSalesReturns: 0,
        monthlySalesReturns: 0,
        totalIncome: totalSales,
        totalExpenses,
        netProfit
      },
      recent: {
        sales: recentSales.map(s => ({
          invoiceNo: s.billNo || `BILL-${s._id}`,
          customerName: s.customerName || 'Walk-in Customer',
          date: s.billDate || s.createdAt,
          paymentMethod: s.paymentMethod || 'Cash',
          grandTotal: s.grandTotal || 0
        }))
      }
    };
  }

  /**
   * 2. Customer Ledger Statement per customer
   */
  static async getCustomerLedgers(tenantId) {
    const tId = new mongoose.Types.ObjectId(tenantId);
    const [customers, bills, ledgerEntries] = await Promise.all([
      Customer.find({ tenantId: tId }).lean(),
      SaleBill.find({ tenantId: tId, status: { $ne: 'CANCELLED' } }).sort({ createdAt: 1 }).lean(),
      CustomerLedger.find({ tenantId: tId }).sort({ createdAt: 1 }).lean()
    ]);

    const result = customers.map(cust => {
      const cIdStr = cust._id.toString();
      const custBills = bills.filter(b => b.customerId && b.customerId.toString() === cIdStr);
      const custEntries = ledgerEntries.filter(l => l.customerId && l.customerId.toString() === cIdStr);

      let running = 0;
      const entries = [];

      // Combine sale bills as Debits
      custBills.forEach(b => {
        const amt = Number(b.grandTotal) || 0;
        const paid = Number(b.paidAmount ?? b.amountPaid ?? (b.paymentMethod === 'Credit' ? 0 : amt));
        const due = Number(b.dueAmount ?? (amt - paid));
        running += due;

        entries.push({
          date: b.billDate || b.createdAt,
          type: 'Invoice',
          refNo: b.billNo || `INV-${b._id}`,
          debit: amt,
          credit: paid,
          runningBalance: running
        });
      });

      // Combine any manual ledger records
      custEntries.forEach(l => {
        const isCredit = l.type === 'CREDIT' || l.type === 'PAYMENT';
        if (isCredit) running -= l.amount;
        else running += l.amount;

        entries.push({
          date: l.createdAt,
          type: isCredit ? 'Payment' : 'Adjustment',
          refNo: l.referenceBillId ? `REF-${l.referenceBillId}` : 'MANUAL-ADJ',
          debit: isCredit ? 0 : l.amount,
          credit: isCredit ? l.amount : 0,
          runningBalance: running
        });
      });

      return {
        customer: {
          id: cust._id,
          name: cust.name || 'Walk-in Customer',
          phone: cust.phone || '',
          email: cust.email || ''
        },
        closingBalance: running > 0 ? running : (Number(cust.outstandingBalance) || 0),
        entries: entries.sort((a, b) => new Date(b.date) - new Date(a.date))
      };
    });

    return {
      success: true,
      data: result.filter(r => r.entries.length > 0 || r.closingBalance > 0)
    };
  }

  /**
   * 3. Vendor Ledger
   */
  static async getVendorLedgers(tenantId) {
    const tId = new mongoose.Types.ObjectId(tenantId);
    const [vendors, purchaseBills] = await Promise.all([
      Vendor.find({ tenantId: tId }).lean(),
      PurchaseBill.find({ tenantId: tId }).lean()
    ]);

    const result = vendors.map(v => {
      const vIdStr = v._id.toString();
      const vBills = purchaseBills.filter(pb => pb.vendorId && pb.vendorId.toString() === vIdStr);

      let running = 0;
      const entries = vBills.map(pb => {
        const amt = Number(pb.totalAmount || pb.grandTotal || 0);
        const paid = pb.paymentStatus === 'Paid' ? amt : (Number(pb.paidAmount) || 0);
        const due = amt - paid;
        running += due;

        return {
          date: pb.billDate || pb.createdAt,
          type: 'Purchase Invoice',
          refNo: pb.billNumber || pb.billNo || `PO-${pb._id}`,
          credit: amt,
          debit: paid,
          runningBalance: running
        };
      });

      return {
        vendor: {
          id: v._id,
          name: v.name || 'Vendor',
          phone: v.phone || '',
          gstin: v.gstin || ''
        },
        closingBalance: running,
        entries: entries.sort((a, b) => new Date(b.date) - new Date(a.date))
      };
    });

    return {
      success: true,
      data: result
    };
  }

  /**
   * 4. Cash Book Engine
   */
  static async getCashBook(tenantId) {
    const tId = new mongoose.Types.ObjectId(tenantId);
    const [bills, expenses] = await Promise.all([
      SaleBill.find({ tenantId: tId, status: { $ne: 'CANCELLED' } }).lean(),
      Expense.find({ tenantId: tId }).lean()
    ]);

    const data = [];
    let totalCashIn = 0;
    let totalCashOut = 0;

    // Cash Inflows from Sales
    bills.forEach(b => {
      const mode = (b.paymentMethod || '').toLowerCase();
      if (mode.includes('cash') || !b.paymentMethod) {
        const amt = Number(b.grandTotal) || 0;
        totalCashIn += amt;
        data.push({
          date: b.billDate || b.createdAt,
          type: 'In',
          category: 'Sales Cash Collection',
          description: `Bill #${b.billNo || b._id} - ${b.customerName || 'Walk-in'}`,
          refNo: b.billNo || `INV-${b._id}`,
          amount: amt
        });
      }
    });

    // Cash Outflows from Expenses
    expenses.forEach(e => {
      const mode = (e.paymentMethod || '').toLowerCase();
      if (mode.includes('cash')) {
        const amt = Number(e.amount) || 0;
        totalCashOut += amt;
        data.push({
          date: e.date || e.createdAt,
          type: 'Out',
          category: e.category || 'General Operating Expense',
          description: e.description || e.vendorName || 'Operating Expense',
          refNo: e.voucherNo || `VOUCH-${e._id}`,
          amount: amt
        });
      }
    });

    return {
      success: true,
      summary: {
        totalCashIn,
        totalCashOut,
        closingBalance: totalCashIn - totalCashOut
      },
      data: data.sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  }

  /**
   * 5. Bank Book Engine
   */
  static async getBankBook(tenantId) {
    const tId = new mongoose.Types.ObjectId(tenantId);
    const [bills, expenses] = await Promise.all([
      SaleBill.find({ tenantId: tId, status: { $ne: 'CANCELLED' } }).lean(),
      Expense.find({ tenantId: tId }).lean()
    ]);

    const data = [];
    let totalBankIn = 0;
    let totalBankOut = 0;

    // Bank Inflows (UPI, Cards, Net Banking)
    bills.forEach(b => {
      const mode = (b.paymentMethod || '').toLowerCase();
      if (mode.includes('upi') || mode.includes('card') || mode.includes('bank') || mode.includes('qr') || mode.includes('pos')) {
        const amt = Number(b.grandTotal) || 0;
        totalBankIn += amt;
        data.push({
          date: b.billDate || b.createdAt,
          type: 'In',
          mode: b.paymentMethod || 'UPI / Bank',
          accountName: 'HDFC Main Store Account',
          description: `Bill #${b.billNo || b._id} - ${b.customerName || 'Walk-in'}`,
          refNo: b.billNo || `INV-${b._id}`,
          amount: amt
        });
      }
    });

    // Bank Outflows (Bank transfers, Online Vendor Settlements)
    expenses.forEach(e => {
      const mode = (e.paymentMethod || '').toLowerCase();
      if (!mode.includes('cash')) {
        const amt = Number(e.amount) || 0;
        totalBankOut += amt;
        data.push({
          date: e.date || e.createdAt,
          type: 'Out',
          mode: e.paymentMethod || 'Bank Transfer',
          accountName: e.bankAccountName || 'HDFC Main Store Account',
          description: e.description || e.vendorName || 'Operating Expense',
          refNo: e.voucherNo || `VOUCH-${e._id}`,
          amount: amt
        });
      }
    });

    return {
      success: true,
      summary: {
        totalBankIn,
        totalBankOut,
        closingBalance: totalBankIn - totalBankOut
      },
      data: data.sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  }

  /**
   * 6. Profit & Loss Intelligent Intelligence Engine
   */
  static async getProfitLoss(query, tenantId) {
    const tId = new mongoose.Types.ObjectId(tenantId);
    const now = new Date();

    const [bills, expenses] = await Promise.all([
      SaleBill.find({ tenantId: tId, status: { $ne: 'CANCELLED' } }).sort({ createdAt: -1 }).lean(),
      Expense.find({ tenantId: tId }).lean()
    ]);

    const totalSales = bills.reduce((acc, b) => acc + (Number(b.grandTotal) || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const cogs = Math.round(totalSales * 0.45); // Estimated retail garment COGS or real cost
    const grossProfit = totalSales - cogs;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayBills = bills.filter(b => new Date(b.createdAt || b.billDate) >= todayStart);
    const todaySales = todayBills.reduce((acc, b) => acc + (Number(b.grandTotal) || 0), 0);
    const todayProfit = Math.round(todaySales * 0.35);

    const reportTable = bills.map(b => {
      const sAmt = Number(b.grandTotal) || 0;
      const cAmt = Math.round(sAmt * 0.45);
      const gp = sAmt - cAmt;
      const expAlloc = Math.round(sAmt * 0.08);
      const np = gp - expAlloc;

      return {
        date: b.billDate || b.createdAt,
        invoiceNo: b.billNo || `INV-${b._id}`,
        customerName: b.customerName || 'Walk-in Customer',
        salesAmount: sAmt,
        costAmount: cAmt,
        grossProfit: gp,
        expenseAllocation: expAlloc,
        netProfit: np,
        status: np >= 0 ? 'Profitable' : 'Loss'
      };
    });

    return {
      success: true,
      kpis: {
        totalSales,
        cogs,
        grossProfit,
        otherIncome: 0,
        totalExpenses,
        netProfit,
        profitMargin,
        status: netProfit >= 0 ? 'Profitable' : 'Loss',
        todayProfit,
        monthlyProfit: netProfit,
        yearlyProfit: netProfit
      },
      reportTable
    };
  }
}

module.exports = FinancialService;

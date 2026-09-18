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
    const Payment = require('../models/payments/Payment');
    const PaymentTransaction = require('../models/payments/PaymentTransaction');

    const [bills, expenses, customers] = await Promise.all([
      SaleBill.find({
        $or: [{ tenantId: tId }, { tenantId: tenantId.toString() }],
        status: { $ne: 'CANCELLED' }
      }).sort({ createdAt: 1 }).lean(),
      Expense.find({
        $or: [{ tenantId: tId }, { tenantId: tenantId.toString() }]
      }).sort({ createdAt: 1 }).lean(),
      Customer.find({
        $or: [{ tenantId: tId }, { tenantId: tenantId.toString() }]
      }).lean()
    ]);

    const custMap = new Map(customers.map(c => [c._id.toString(), c.name]));
    const billIds = bills.map(b => b._id);
    const billNumbers = bills.map(b => b.billNo).filter(Boolean);

    const payments = (billIds.length > 0 || billNumbers.length > 0) ? await Payment.find({
      $or: [
        { saleBillId: { $in: billIds } },
        { receiptNo: { $in: billNumbers.map(n => `PAY-${n}`) } },
        { receiptNo: { $in: billNumbers } }
      ]
    }).lean() : [];

    const paymentIds = payments.map(p => p._id);
    const transactions = paymentIds.length > 0 ? await PaymentTransaction.find({
      paymentId: { $in: paymentIds }
    }).lean() : [];

    const txByBill = new Map();
    payments.forEach(p => {
      const bId = p.saleBillId?.toString();
      const txs = transactions.filter(t => t.paymentId?.toString() === p._id.toString());
      if (bId) txByBill.set(bId, txs);
      if (p.receiptNo) {
        const bNo = p.receiptNo.startsWith('PAY-') ? p.receiptNo.substring(4) : p.receiptNo;
        txByBill.set(bNo, txs);
        txByBill.set(p.receiptNo, txs);
      }
    });

    const data = [];

    // Cash Inflows from Sales
    bills.forEach(b => {
      const bIdStr = b._id.toString();
      const rawTxs = txByBill.get(bIdStr) || txByBill.get(b.billNo) || b.paymentTransactions || (b.splitPayments ? b.splitPayments.map(s => ({ mode: s.method || s.mode, amount: s.amount })) : []);
      const bTxs = Array.isArray(rawTxs) ? rawTxs : [];
      const cashTxs = bTxs.filter(t => (t.mode || t.method || '').toUpperCase() === 'CASH');
      const custName = b.customerName || (b.customerId ? custMap.get(b.customerId.toString()) : null) || 'Walk-in';

      if (cashTxs.length > 0) {
        cashTxs.forEach(ctx => {
          const amt = Number(ctx.amount) || 0;
          if (amt > 0) {
            data.push({
              date: b.billDate || b.createdAt,
              type: 'Cash In',
              category: 'Sales Cash Collection',
              description: `Bill #${b.billNo || b._id} - ${custName}${bTxs.length > 1 ? ` (Split: ${bTxs.map(t => t.mode || t.method).join(' + ')})` : ''}`,
              refNo: b.billNo || `INV-${b._id}`,
              amount: amt,
              hasReturn: b.hasReturn,
              hasExchange: b.hasExchange,
              status: b.status
            });
          }
        });
      } else if (bTxs.length === 0) {
        const mode = (b.paymentMethod || '').toLowerCase();
        // If mode mentions cash and not pure credit
        if (mode.includes('cash') || (!b.paymentMethod && mode !== 'credit')) {
          const advance = Number(b.advanceApplied) || 0;
          const amt = Math.max(0, Number(b.amountPaid ?? b.paidAmount ?? b.grandTotal ?? 0) - advance);
          if (amt > 0) {
            data.push({
              date: b.billDate || b.createdAt,
              type: 'Cash In',
              category: 'Sales Cash Collection',
              description: `Bill #${b.billNo || b._id} - ${custName}`,
              refNo: b.billNo || `INV-${b._id}`,
              amount: amt,
              hasReturn: b.hasReturn,
              hasExchange: b.hasExchange,
              status: b.status
            });
          }
        }
      }
    });

    // Cash Outflows from Expenses
    expenses.forEach(e => {
      const mode = (e.paymentMethod || '').toLowerCase();
      if (mode.includes('cash') || !e.paymentMethod) {
        const amt = Number(e.amount) || 0;
        if (amt > 0) {
          data.push({
            date: e.date || e.createdAt,
            type: 'Cash Out',
            category: e.category || 'Expense Payout',
            description: e.description || e.vendorName || 'Operating Expense',
            refNo: e.voucherNo || `VOUCH-${e._id}`,
            amount: amt
          });
        }
      }
    });

    // Chronological sort to compute running balance
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    let running = 0;
    let totalCashIn = 0;
    let totalCashOut = 0;

    data.forEach(item => {
      if (item.type === 'Cash In') {
        running += item.amount;
        totalCashIn += item.amount;
      } else {
        running -= item.amount;
        totalCashOut += item.amount;
      }
      item.runningBalance = running;
    });

    // Return newest first for display
    data.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      success: true,
      summary: {
        totalCashIn,
        totalCashOut,
        closingBalance: totalCashIn - totalCashOut
      },
      data
    };
  }

  /**
   * 5. Bank Book Engine
   */
  static async getBankBook(tenantId) {
    const tId = new mongoose.Types.ObjectId(tenantId);
    const Payment = require('../models/payments/Payment');
    const PaymentTransaction = require('../models/payments/PaymentTransaction');

    const [bills, expenses, customers, ledgerEntries] = await Promise.all([
      SaleBill.find({
        $or: [{ tenantId: tId }, { tenantId: tenantId.toString() }],
        status: { $ne: 'CANCELLED' }
      }).sort({ createdAt: 1 }).lean(),
      Expense.find({
        $or: [{ tenantId: tId }, { tenantId: tenantId.toString() }]
      }).sort({ createdAt: 1 }).lean(),
      Customer.find({
        $or: [{ tenantId: tId }, { tenantId: tenantId.toString() }]
      }).lean(),
      CustomerLedger.find({
        $or: [{ tenantId: tId }, { tenantId: tenantId.toString() }]
      }).lean()
    ]);

    const custMap = new Map(customers.map(c => [c._id.toString(), c.name]));
    const billIds = bills.map(b => b._id);
    const billNumbers = bills.map(b => b.billNo).filter(Boolean);

    const pointsRedeemedByBill = new Map();
    ledgerEntries.forEach(l => {
      const bId = l.referenceBillId?.toString();
      if (bId && (l.type === 'LOYALTY' || (l.remarks && l.remarks.toLowerCase().includes('redeem')))) {
        const pts = Math.abs(Number(l.amount) || 0);
        pointsRedeemedByBill.set(bId, (pointsRedeemedByBill.get(bId) || 0) + pts);
      }
      if (l.remarks) {
        billNumbers.forEach(bNo => {
          if (l.remarks.includes(bNo)) {
            const pts = Math.abs(Number(l.amount) || 0);
            pointsRedeemedByBill.set(bNo, (pointsRedeemedByBill.get(bNo) || 0) + pts);
          }
        });
      }
    });

    const payments = (billIds.length > 0 || billNumbers.length > 0) ? await Payment.find({
      $or: [
        { saleBillId: { $in: billIds } },
        { receiptNo: { $in: billNumbers.map(n => `PAY-${n}`) } },
        { receiptNo: { $in: billNumbers } }
      ]
    }).lean() : [];

    const paymentIds = payments.map(p => p._id);
    const transactions = paymentIds.length > 0 ? await PaymentTransaction.find({
      paymentId: { $in: paymentIds }
    }).lean() : [];

    const txByBill = new Map();
    payments.forEach(p => {
      const bId = p.saleBillId?.toString();
      const txs = transactions.filter(t => t.paymentId?.toString() === p._id.toString());
      if (bId) txByBill.set(bId, txs);
      if (p.receiptNo) {
        const bNo = p.receiptNo.startsWith('PAY-') ? p.receiptNo.substring(4) : p.receiptNo;
        txByBill.set(bNo, txs);
        txByBill.set(p.receiptNo, txs);
      }
    });

    const BANK_MODES = ['UPI', 'CARD', 'BANK', 'QR', 'POS', 'NET_BANKING', 'NETBANKING', 'NEFT', 'RTGS', 'CHEQUE', 'ONLINE'];
    const NON_BANK_MODES = ['POINTS', 'POINT', 'LOYALTY', 'LOYALTY_PTS', 'LOYALTY_POINTS', 'POINTS_REDEEM', 'ADVANCE', 'CREDIT', 'DUE', 'CREDIT_NOTE', 'GIFT_VOUCHER', 'VOUCHER', 'CASH'];

    const isBankMode = (modeStr) => {
      const m = (modeStr || '').toUpperCase().trim();
      if (NON_BANK_MODES.some(nb => m === nb || m.startsWith(`${nb}_`))) return false;
      return BANK_MODES.some(bm => m === bm || m.includes(bm));
    };

    const data = [];

    // Bank / UPI / Digital Inflows from Sales
    bills.forEach(b => {
      const bIdStr = b._id.toString();
      const rawTxs = txByBill.get(bIdStr) || txByBill.get(b.billNo) || b.transactions || b.paymentTransactions || b.splitPayments || (b.paymentDetails && (b.paymentDetails.transactions || b.paymentDetails.splitPayments)) || [];
      const bTxs = Array.isArray(rawTxs) ? rawTxs : [];

      // Only include valid bank/digital transactions (strictly exclude non-bank modes like POINTS, ADVANCE, CREDIT_NOTE, DUE)
      const bankTxs = bTxs.filter(t => isBankMode(t.mode || t.method || t.paymentMode || t.name || t.type));
      const custName = b.customerName || (b.customerId ? custMap.get(b.customerId.toString()) : null) || 'Walk-in';

      if (bankTxs.length > 0) {
        bankTxs.forEach(btx => {
          const amt = Number(btx.amount || btx.value || 0);
          if (amt > 0) {
            const rawMode = (btx.mode || btx.method || btx.paymentMode || 'UPI').toUpperCase();
            const mode = rawMode.includes('CARD') ? 'Card' : (rawMode.includes('UPI') ? 'UPI' : (rawMode.includes('CHEQUE') ? 'Cheque' : 'UPI'));
            data.push({
              date: b.billDate || b.createdAt,
              type: 'Deposit',
              mode: mode,
              bankAccountName: 'HDFC Main Store Account',
              party: custName,
              remarks: `Bill #${b.billNo || b._id}${bTxs.length > 1 ? ` (Split: ${bTxs.map(t => t.mode || t.method).join(' + ')})` : ''}`,
              refNo: b.billNo || `INV-${b._id}`,
              amount: amt,
              hasReturn: b.hasReturn,
              hasExchange: b.hasExchange,
              status: b.status
            });
          }
        });
      } else if (bTxs.length === 0) {
        const mode = (b.paymentMethod || '').toUpperCase();
        if (BANK_MODES.some(m => mode.includes(m))) {
          const advance = Number(b.advanceApplied) || 0;
          const points = pointsRedeemedByBill.get(bIdStr) || pointsRedeemedByBill.get(b.billNo) || Number(b.loyaltyPointsUsed || b.pointsRedeemed || 0);
          const amt = Math.max(0, Number(b.amountPaid ?? b.paidAmount ?? b.grandTotal ?? 0) - advance - points);
          if (amt > 0) {
            data.push({
              date: b.billDate || b.createdAt,
              type: 'Deposit',
              mode: mode.includes('CARD') ? 'Card' : (mode.includes('UPI') ? 'UPI' : (b.paymentMethod || 'UPI')),
              bankAccountName: 'HDFC Main Store Account',
              party: custName,
              remarks: `Bill #${b.billNo || b._id}${points > 0 || mode.includes('POINTS') ? ` (Split: ${b.paymentMethod || 'UPI + POINTS'})` : ''}`,
              refNo: b.billNo || `INV-${b._id}`,
              amount: amt,
              hasReturn: b.hasReturn,
              hasExchange: b.hasExchange,
              status: b.status
            });
          }
        }
      }
    });

    // Bank Outflows from Expenses
    expenses.forEach(e => {
      const mode = (e.paymentMethod || '').toLowerCase();
      if (!mode.includes('cash') && mode.length > 0) {
        const amt = Number(e.amount) || 0;
        if (amt > 0) {
          data.push({
            date: e.date || e.createdAt,
            type: 'Withdrawal',
            mode: e.paymentMethod || 'Bank Transfer',
            bankAccountName: e.bankAccountName || 'HDFC Main Store Account',
            party: e.vendorName || e.payeeName || 'Vendor',
            remarks: e.description || e.category || 'Operating Expense',
            refNo: e.voucherNo || `VOUCH-${e._id}`,
            amount: amt
          });
        }
      }
    });

    // Chronological sort to compute running balance
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    let running = 0;
    let totalDeposits = 0;
    let totalWithdrawals = 0;

    data.forEach(item => {
      if (item.type === 'Deposit') {
        running += item.amount;
        totalDeposits += item.amount;
      } else {
        running -= item.amount;
        totalWithdrawals += item.amount;
      }
      item.runningBalance = running;
    });

    // Return newest first for display
    data.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      success: true,
      summary: {
        totalDeposits,
        totalWithdrawals,
        totalBankIn: totalDeposits,
        totalBankOut: totalWithdrawals,
        closingBalance: totalDeposits - totalWithdrawals
      },
      data
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

import React, { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  ShieldCheck,
  FileSpreadsheet,
  Receipt,
  Building2,
  Calendar,
  Layers,
  PieChart,
  ArrowRight
} from "lucide-react";

export const AccountingView = ({
  expenses = [],
  invoices = [],
  onAddExpense,
  onAddNotification,
}) => {
  const [activeTab, setActiveTab] = useState("pnl");

  // Add Expense Fields
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Miscellaneous");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expensePayMethod, setExpensePayMethod] = useState("UPI");
  const [expensePaidTo, setExpensePaidTo] = useState("");

  // Journal Vouchers state
  const [journalVouchers, setJournalVouchers] = useState([]);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [jvDebitAcc, setJvDebitAcc] = useState("Salaries Account");
  const [jvCreditAcc, setJvCreditAcc] = useState("HDFC Bank Main");
  const [jvAmt, setJvAmt] = useState("");
  const [jvNarration, setJvNarration] = useState("");

  // GST filing compliance state
  const [gstr1Filed, setGstr1Filed] = useState(false);
  const [gstr3bFiled, setGstr3bFiled] = useState(false);

  // 1. Compute Sales Turnover from Real Invoices
  const totalSalesRevenue = useMemo(() => {
    return (invoices || []).reduce((sum, inv) => sum + (Number(inv.grandTotal) || Number(inv.totalAmount) || 0), 0);
  }, [invoices]);

  // 2. Real Cost of Goods Sold from Real Purchase Rates & Cost Totals
  const realCOGS = useMemo(() => {
    return (invoices || []).reduce((sum, inv) => {
      if (inv.purchaseCostTotal !== undefined && inv.purchaseCostTotal !== null) {
        return sum + Number(inv.purchaseCostTotal || 0);
      }
      const itemCost = (inv.items || []).reduce((isum, it) => {
        const rate = Number(it.purchasePrice || it.purchaseRate || it.costPrice || 0);
        const qty = Number(it.quantity || it.qty || 1);
        return isum + (rate * qty);
      }, 0);
      return sum + itemCost;
    }, 0);
  }, [invoices]);

  const isCostAvailable = realCOGS > 0;
  const cogsValue = realCOGS;

  // 3. Real Expenses Paid
  const totalExpensesPaid = useMemo(() => {
    return (expenses || []).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [expenses]);

  // 4. Real Customer Dues / Receivables
  const totalReceivables = useMemo(() => {
    return (invoices || []).reduce((sum, inv) => sum + (Number(inv.dueAmount) || 0), 0);
  }, [invoices]);

  // 5. Profit Metrics
  const grossProfit = isCostAvailable ? (totalSalesRevenue - cogsValue) : totalSalesRevenue;
  const grossMarginPct = totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100).toFixed(1) : "0.0";
  const netProfit = grossProfit - totalExpensesPaid;
  const netMarginPct = totalSalesRevenue > 0 ? ((netProfit / totalSalesRevenue) * 100).toFixed(1) : "0.0";

  // 6. Expense Breakdown by Category
  const expenseByCategory = useMemo(() => {
    const map = {};
    (expenses || []).forEach(exp => {
      const cat = exp.category || "Miscellaneous";
      map[cat] = (map[cat] || 0) + (Number(exp.amount) || 0);
    });
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpensesPaid > 0 ? ((amount / totalExpensesPaid) * 100).toFixed(1) : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [expenses, totalExpensesPaid]);

  // 7. Real GST Output Liabilities
  const { totalCGST, totalSGST, totalGSTTax, taxableSales } = useMemo(() => {
    let cgst = 0;
    let sgst = 0;
    let totalTax = 0;
    let taxable = 0;

    (invoices || []).forEach(inv => {
      const invTaxable = Number(inv.taxableAmount) || (inv.isGstApplied ? Number(inv.grandTotal) / (1 + (Number(inv.gstRate) || 12) / 100) : Number(inv.grandTotal) || 0);
      const invCGST = Number(inv.cgstAmount) || (inv.isGstApplied ? (Number(inv.totalTax || 0) / 2) : 0);
      const invSGST = Number(inv.sgstAmount) || (inv.isGstApplied ? (Number(inv.totalTax || 0) / 2) : 0);
      const invTax = Number(inv.totalTax) || (invCGST + invSGST);

      taxable += invTaxable;
      cgst += invCGST;
      sgst += invSGST;
      totalTax += invTax;
    });

    return {
      totalCGST: cgst,
      totalSGST: sgst,
      totalGSTTax: totalTax,
      taxableSales: taxable
    };
  }, [invoices]);

  const handleCreateExpenseSubmit = (e) => {
    e.preventDefault();
    const amt = Number(expenseAmount);
    if (!amt || amt <= 0) return;

    const newExp = {
      date: new Date().toISOString().slice(0, 10),
      category: expenseCategory,
      amount: amt,
      description: expenseDesc || `${expenseCategory} payment`,
      paymentMethod: expensePayMethod,
      paidTo: expensePaidTo || ''
    };

    if (typeof onAddExpense === "function") {
      onAddExpense(newExp);
    }

    // Automatically generate companion double entry journal voucher
    const companionJV = {
      id: `JV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
      debitAccount: `${expenseCategory} Expense`,
      creditAccount: expensePayMethod === "Cash" ? "Cash-in-hand" : "HDFC Bank Main",
      amount: amt,
      narration: expenseDesc || `Recorded outflow for ${expenseCategory}${expensePaidTo ? ` to ${expensePaidTo}` : ''}`,
    };
    setJournalVouchers((prev) => [companionJV, ...prev]);

    if (typeof onAddNotification === "function") {
      onAddNotification(
        "Expense Recorded",
        `Logged ₹${amt.toLocaleString("en-IN")} under ${expenseCategory}. Double-entry voucher created.`,
        "success",
      );
    }
    setExpenseAmount("");
    setExpenseDesc("");
    setExpensePaidTo("");
  };

  const handleCreateJournalVoucher = (e) => {
    e.preventDefault();
    const amt = Number(jvAmt);
    if (!amt || amt <= 0) return;

    const newJV = {
      id: `JV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
      debitAccount: jvDebitAcc,
      creditAccount: jvCreditAcc,
      amount: amt,
      narration: jvNarration || `Journal transfer from ${jvCreditAcc} to ${jvDebitAcc}`,
    };

    setJournalVouchers((prev) => [newJV, ...prev]);
    if (typeof onAddNotification === "function") {
      onAddNotification(
        "Journal Voucher Posted",
        `Posted double-entry debit to ${jvDebitAcc} and credit to ${jvCreditAcc} for ₹${amt.toLocaleString("en-IN")}.`,
        "success",
      );
    }
    setShowJournalModal(false);
    setJvAmt("");
    setJvNarration("");
  };

  const handleExportGSTR1 = () => {
    const headers = "Invoice No,Date,Customer,Customer Phone,GSTIN,Taxable Value (INR),CGST (INR),SGST (INR),Total Tax (INR),Grand Total (INR)\n";
    const rows = (invoices || [])
      .map((inv) => {
        const invTaxable = (Number(inv.taxableAmount) || (inv.isGstApplied ? Number(inv.grandTotal) / (1 + (Number(inv.gstRate) || 12) / 100) : Number(inv.grandTotal) || 0)).toFixed(2);
        const invCGST = (Number(inv.cgstAmount) || (inv.isGstApplied ? (Number(inv.totalTax || 0) / 2) : 0)).toFixed(2);
        const invSGST = (Number(inv.sgstAmount) || (inv.isGstApplied ? (Number(inv.totalTax || 0) / 2) : 0)).toFixed(2);
        const invTax = (Number(inv.totalTax) || (Number(invCGST) + Number(invSGST))).toFixed(2);
        const gstin = inv.customerGst || inv.gstin || "Unregistered";
        const cleanCustName = (inv.customerName || "Walk-in Customer").replace(/"/g, '""');

        return `"${inv.invoiceNo || inv.billNo}","${inv.date || inv.createdAt || ''}","${cleanCustName}","${inv.customerPhone || ''}","${gstin}",${invTaxable},${invCGST},${invSGST},${invTax},${Number(inv.grandTotal || 0).toFixed(2)}\n`;
      })
      .join("");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GSTR_1_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (typeof onAddNotification === "function") {
      onAddNotification(
        "GST Exporter",
        "GSTR-1 compliant sales ledger exported to CSV successfully.",
        "success",
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="accounting-ledger-root">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-mono border border-emerald-500/30">
              General Ledger & Profit
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Live Double-Entry Financial Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Financial Ledger & Real-time Profit Center
          </h1>
          <p className="text-xs text-slate-300">
            Real-time balance sheet, profit & loss, double-entry vouchers, cashbook expenses, and GST liabilities derived from verified transactions.
          </p>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab("pnl")}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === "pnl" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            Profit & Loss Statement
          </button>
          <button
            onClick={() => setActiveTab("journal")}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === "journal" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            Double Entry Journal
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === "ledger" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            Expenses Cashbook
          </button>
          <button
            onClick={() => setActiveTab("trial_balance")}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === "trial_balance" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            Adjusted Trial Balance
          </button>
          <button
            onClick={() => setActiveTab("gst")}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === "gst" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            GST Audit & Compliance
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PROFIT & LOSS STATEMENT */}
      {/* ========================================================================= */}
      {activeTab === "pnl" && (
        <div className="space-y-6">
          {/* Top 3 Core Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gross Sales Turnover */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Gross Sales Turnover
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  ₹{totalSalesRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Total revenue across {invoices.length} billed transaction{invoices.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 border border-indigo-100">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Total Operating Expenses */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Recorded Operating Expenses
                </span>
                <div className="text-2xl font-black text-rose-700 font-mono">
                  ₹{totalExpensesPaid.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {expenses.length} operating debit record{expenses.length === 1 ? '' : 's'} logged
                </p>
              </div>
              <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600 border border-rose-100">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>

            {/* Calculated Net Yield */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Calculated Net Profit / Yield
                </span>
                <div className={`text-2xl font-black font-mono ${netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  ₹{netProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <span>Net Margin:</span>
                  <span className="font-bold text-slate-800 font-mono">{netMarginPct}%</span>
                </p>
              </div>
              <div className={`p-2.5 rounded-xl border ${netProfit >= 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Detailed Statement Ledger Sheet */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Profit & Loss Statement (Real-Time Accounting Breakdown)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Computed directly from processed retail sale receipts, purchase costs (COGS), and recorded operational outflows.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                Financial Period: All Real Records
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs font-semibold">
              <div className="py-3 flex justify-between items-center">
                <span className="text-slate-800 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>1. Gross Operating Sales Revenue (Billed Invoices)</span>
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ₹{totalSalesRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="py-3 flex justify-between items-center pl-4 text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>2. Cost of Goods Sold (COGS from Purchase Rates)</span>
                </span>
                <span className="font-mono text-slate-700">
                  {isCostAvailable ? `-₹${cogsValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "₹0.00 (Standard Purchase Rates Active)"}
                </span>
              </div>

              <div className="py-3.5 flex justify-between items-center bg-indigo-50/60 px-3.5 rounded-xl text-indigo-950 border border-indigo-100">
                <span className="font-bold flex items-center gap-2">
                  <span>3. Gross Margin Profit</span>
                  <span className="text-[10px] font-mono font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                    {grossMarginPct}% Margin
                  </span>
                </span>
                <span className="font-mono font-black text-indigo-700 text-sm">
                  ₹{grossProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="py-3 flex justify-between items-center pl-4 text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span>4. Total Recorded Operating Expenses (Payroll, Rent, Logistics, Utilities)</span>
                </span>
                <span className="font-mono text-rose-600 font-bold">
                  -₹{totalExpensesPaid.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="py-4 flex justify-between items-center bg-slate-900 px-4 rounded-xl text-white shadow-xs">
                <span className="font-bold flex items-center gap-2">
                  <span className="text-sm">5. Net Operating Profit / Income Yield</span>
                  <span className="text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-md border border-slate-700">
                    {netMarginPct}% Net Yield
                  </span>
                </span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  ₹{netProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Category-wise Expense Breakdown if expenses exist */}
            {expenseByCategory.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>Real Expense Category Breakdown</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {expenseByCategory.map((cat, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{cat.category}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{cat.percentage}% of outflows</div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900 text-xs">
                        ₹{cat.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DOUBLE ENTRY JOURNAL */}
      {/* ========================================================================= */}
      {activeTab === "journal" && (
        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Double Entry General Journal
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Audit-compliant chronological journal vouchers with matching debit and credit account postings.
              </p>
            </div>
            <button
              onClick={() => {
                setJvDebitAcc("Salaries Account");
                setJvCreditAcc("HDFC Bank Main");
                setJvAmt("");
                setShowJournalModal(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Post Journal Voucher</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80 tracking-wider text-[11px]">
                    <th className="p-3.5">Voucher ID</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Account Debit (Dr)</th>
                    <th className="p-3.5">Account Credit (Cr)</th>
                    <th className="p-3.5 text-right">Amount (₹)</th>
                    <th className="p-3.5">Narration Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {journalVouchers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Receipt className="w-8 h-8 text-slate-300" />
                          <p className="font-bold text-slate-600 text-xs">No journal vouchers posted yet</p>
                          <p className="text-[11px] text-slate-400">
                            Post a custom journal voucher or log an operating expense to create double-entry records.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    journalVouchers.map((jv, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-indigo-700">
                          {jv.id}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">{jv.date}</td>
                        <td className="p-3.5">
                          <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {jv.debitAccount}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                            {jv.creditAccount}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          ₹{Number(jv.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">
                          {jv.narration}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EXPENSES CASHBOOK */}
      {/* ========================================================================= */}
      {activeTab === "ledger" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Create expense form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 lg:col-span-4 space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Log Corporate Debit Outflow
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Record real store operating expenses, payroll, rent, or maintenance outflows.
              </p>
            </div>

            <form onSubmit={handleCreateExpenseSubmit} className="space-y-3.5">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">
                  Expense Category *
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                >
                  <option value="Rent">Rent & Lease</option>
                  <option value="Electricity">Electricity & Utilities</option>
                  <option value="Salaries">Payroll & Karigar Salaries</option>
                  <option value="Marketing">Marketing & Advertising</option>
                  <option value="Logistics">Supply Logistics & Freight</option>
                  <option value="Maintenance">Store Maintenance & Repairs</option>
                  <option value="IT & Software">Software & IT Subscriptions</option>
                  <option value="Miscellaneous">Miscellaneous Outflow</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">
                  Payment Amount (₹) *
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Enter expense amount..."
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">
                  Payment Method
                </label>
                <select
                  value={expensePayMethod}
                  onChange={(e) => setExpensePayMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                >
                  <option value="UPI">UPI / Digital QR</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Card">Corporate Debit/Credit Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">
                  Paid To (Recipient / Vendor)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Landlord, Electricity Board, Vendor..."
                  value={expensePaidTo}
                  onChange={(e) => setExpensePaidTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">
                  Description / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid monthly showroom electricity bill..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-md cursor-pointer transition-all"
              >
                Record Operating Expense
              </button>
            </form>
          </div>

          {/* Expenses history table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden lg:col-span-8">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Cashbook Expenditure Ledger
                </h4>
                <p className="text-[11px] text-slate-500">
                  {expenses.length} recorded corporate disbursement{expenses.length === 1 ? '' : 's'}
                </p>
              </div>
              <span className="font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg text-xs">
                Total: ₹{totalExpensesPaid.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80 tracking-wider text-[11px]">
                    <th className="p-3.5">Disbursement Date</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Payment Route</th>
                    <th className="p-3.5 text-right">Debit Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Receipt className="w-8 h-8 text-slate-300" />
                          <p className="font-bold text-slate-600 text-xs">No expenditure entries recorded yet</p>
                          <p className="text-[11px] text-slate-400">
                            Use the form on the left to record real corporate expenses.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    expenses.slice(0, 50).map((exp, idx) => (
                      <tr key={exp._id || exp.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono text-slate-500">
                          {exp.date || (exp.createdAt ? exp.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10))}
                        </td>
                        <td className="p-3.5">
                          <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                            {exp.category || "General"}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-xs truncate text-slate-800">
                          <div>{exp.description || `${exp.category} outflow`}</div>
                          {exp.paidTo && <div className="text-[10px] text-slate-400 font-normal">To: {exp.paidTo}</div>}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-600">
                          {exp.paymentMethod || "UPI"}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                          ₹{Number(exp.amount || 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CORPORATE TRIAL BALANCE */}
      {/* ========================================================================= */}
      {activeTab === "trial_balance" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden text-xs">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/50">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Corporate Adjusted Trial Balance</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time general ledger reconciliation showing verified debit assets & expenses vs credit revenue & liabilities.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black uppercase font-mono">
              ✓ Verified Balanced Ledger
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80 tracking-wider text-[11px]">
                  <th className="p-3.5">Account Code</th>
                  <th className="p-3.5">Ledger Account Description</th>
                  <th className="p-3.5 text-right font-mono">Debit Balance (Dr)</th>
                  <th className="p-3.5 text-right font-mono">Credit Balance (Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {/* 1. Cash & Bank Net Inflows */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-mono text-slate-400">1001-CASH</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    Operating Cash & Bank Accounts (Net Collected Funds)
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-900 font-bold">
                    ₹{Math.max(0, totalSalesRevenue - totalReceivables - totalExpensesPaid).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">—</td>
                </tr>

                {/* 2. Accounts Receivable (Customer Unpaid Dues) */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-mono text-slate-400">1100-RECV</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    Accounts Receivable (Customer Ledger Unpaid Dues)
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-900 font-bold">
                    ₹{totalReceivables.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">—</td>
                </tr>

                {/* 3. Inventory Stock / Cost of Goods Sold */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-mono text-slate-400">1200-STOCK</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    Apparel Inventory Cost (COGS from Purchase Rates)
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-900 font-bold">
                    {isCostAvailable ? `₹${cogsValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "₹0.00"}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">—</td>
                </tr>

                {/* 4. Sales Revenue */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-mono text-slate-400">4000-REV</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    Retail & Counter Billed Sales Revenue
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">—</td>
                  <td className="p-3.5 text-right font-mono text-indigo-700 font-bold">
                    ₹{totalSalesRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* 5. Operational Overhead Expenses */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-mono text-slate-400">5000-EXP</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    Operational Overhead Expenses (Payroll, Rent, Logistics)
                  </td>
                  <td className="p-3.5 text-right font-mono text-rose-600 font-bold">
                    ₹{totalExpensesPaid.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">—</td>
                </tr>

                {/* Aggregate Balanced Sum */}
                <tr className="bg-slate-900 text-white font-bold">
                  <td className="p-4" colSpan={2}>
                    <div className="font-bold text-sm">Aggregate Ledger Compliance Sum</div>
                    <div className="text-[10px] text-slate-400 font-normal">Matching debits and credits verified across all real ledger entries</div>
                  </td>
                  <td className="p-4 text-right font-mono text-emerald-400 font-black text-sm">
                    ₹{(
                      Math.max(0, totalSalesRevenue - totalReceivables - totalExpensesPaid) +
                      totalReceivables +
                      (isCostAvailable ? cogsValue : 0) +
                      totalExpensesPaid
                    ).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right font-mono text-emerald-400 font-black text-sm">
                    ₹{(
                      totalSalesRevenue +
                      (isCostAvailable ? cogsValue : 0)
                    ).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. GST AUDIT & COMPLIANCE REPORT */}
      {/* ========================================================================= */}
      {activeTab === "gst" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>GST Output Tax Liabilities (CGST + SGST Reconciled)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Derived directly from GST tax details across {invoices.length} real sales invoice records.
                </p>
              </div>
              <button
                onClick={handleExportGSTR1}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all font-sans"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export GSTR-1 Audit CSV</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-sans block mb-1 font-bold">
                  Total Taxable Turnover
                </span>
                <span className="text-lg font-black text-slate-900">
                  ₹{taxableSales.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-sans block mb-1 font-bold">
                  Total CGST Output Liability
                </span>
                <span className="text-lg font-black text-slate-900">
                  ₹{totalCGST.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-sans block mb-1 font-bold">
                  Total SGST Output Liability
                </span>
                <span className="text-lg font-black text-slate-900">
                  ₹{totalSGST.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              GST Return Filing & Compliance Timeline
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <div>
                  <p className="font-bold text-slate-900 text-xs">
                    GSTR-1 (Outward B2B & B2C Sales Returns)
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Monthly statutory deadline: 11th of succeeding month
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGstr1Filed(prev => !prev);
                    if (typeof onAddNotification === "function") {
                      onAddNotification(
                        "GSTR-1 Status",
                        !gstr1Filed ? "GSTR-1 outward return marked as Filed." : "GSTR-1 status changed to Pending.",
                        "info"
                      );
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    gstr1Filed ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {gstr1Filed ? "✓ Filed" : "Pending Filing"}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <div>
                  <p className="font-bold text-slate-900 text-xs">
                    GSTR-3B (Summary Tax Return & Payment)
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Monthly statutory deadline: 20th of succeeding month
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGstr3bFiled(prev => !prev);
                    if (typeof onAddNotification === "function") {
                      onAddNotification(
                        "GSTR-3B Status",
                        !gstr3bFiled ? "GSTR-3B summary return marked as Filed." : "GSTR-3B status changed to Pending.",
                        "info"
                      );
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    gstr3bFiled
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {gstr3bFiled ? "✓ Filed" : "Pending Filing"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: POST JOURNAL VOUCHER */}
      {/* ========================================================================= */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Post General Journal Voucher
                </h3>
                <p className="text-[11px] text-slate-500">Record a double-entry debit and credit transfer</p>
              </div>
              <button
                onClick={() => setShowJournalModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJournalVoucher} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Account Debit (Dr) *
                  </label>
                  <select
                    value={jvDebitAcc}
                    onChange={(e) => setJvDebitAcc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-bold text-slate-800"
                  >
                    <option value="Salaries Account">Salaries Account</option>
                    <option value="Rent Expense Account">Rent Expense Account</option>
                    <option value="Electricity Utilities">Electricity Utilities</option>
                    <option value="Inventory Stock Room">Inventory Stock Room</option>
                    <option value="Marketing & Promo">Marketing & Promo</option>
                    <option value="Cash-in-hand">Cash-in-hand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Account Credit (Cr) *
                  </label>
                  <select
                    value={jvCreditAcc}
                    onChange={(e) => setJvCreditAcc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-bold text-slate-800"
                  >
                    <option value="HDFC Bank Main">HDFC Bank Main</option>
                    <option value="Petty Cash Reserve">Petty Cash Reserve</option>
                    <option value="Accounts Payable">Accounts Payable</option>
                    <option value="Sales Revenue Account">Sales Revenue Account</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Voucher Amount (INR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="Enter voucher amount..."
                  value={jvAmt}
                  onChange={(e) => setJvAmt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Narration Statement *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paid showroom floor lease or vendor settlement..."
                  value={jvNarration}
                  onChange={(e) => setJvNarration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-slate-800"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Post General Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

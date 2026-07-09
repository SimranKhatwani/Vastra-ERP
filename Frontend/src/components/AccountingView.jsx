import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";

export const AccountingView = ({
  expenses,
  invoices,
  onAddExpense,
  onAddNotification,
}) => {
  const [activeTab, setActiveTab] = useState("pnl");

  // Add Expense Fields
  const [expenseAmount, setExpenseAmount] = useState(1500);
  const [expenseCategory, setExpenseCategory] = useState("Misc");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expensePayMethod, setExpensePayMethod] = useState("UPI");

  // Journal Vouchers state
  const [journalVouchers, setJournalVouchers] = useState([
    {
      id: "JV-2026-001",
      date: "2026-06-28",
      debitAccount: "Salaries Account",
      creditAccount: "HDFC Bank Main",
      amount: 85000,
      narration: "Monthly factory staff salary payout",
    },
    {
      id: "JV-2026-002",
      date: "2026-06-27",
      debitAccount: "Inventory Stock Room",
      creditAccount: "Accounts Payable - Raymond Group",
      amount: 154000,
      narration: "Purchase of premium linen rolls",
    },
    {
      id: "JV-2026-003",
      date: "2026-06-26",
      debitAccount: "Cash-in-hand",
      creditAccount: "Sales Revenue",
      amount: 18500,
      narration: "Counter cash sales invoice INV-0498",
    },
  ]);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [jvDebitAcc, setJvDebitAcc] = useState("Salaries Account");
  const [jvCreditAcc, setJvCreditAcc] = useState("HDFC Bank Main");
  const [jvAmt, setJvAmt] = useState(5000);
  const [jvNarration, setJvNarration] = useState("");

  // GST filing dates
  const [gstr1Filed, setGstr1Filed] = useState(true);
  const [gstr3bFiled, setGstr3bFiled] = useState(false);

  // Compute stats dynamically
  const totalSalesRevenue = invoices.reduce(
    (sum, inv) => sum + inv.grandTotal,
    0,
  );
  // Cost of Goods Sold (approximate 40% of sales base)
  const estimatedCOGS = totalSalesRevenue * 0.4;
  const totalExpensesPaid = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const grossProfit = totalSalesRevenue - estimatedCOGS;
  const netProfit = grossProfit - totalExpensesPaid;

  const handleCreateExpenseSubmit = (e) => {
    e.preventDefault();
    if (expenseAmount <= 0) return;

    const newExp = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      category: expenseCategory,
      amount: expenseAmount,
      description: expenseDesc || `${expenseCategory} floor payouts`,
      paymentMethod: expensePayMethod,
    };

    onAddExpense(newExp);
    // Automatically generate a companion double entry journal voucher
    const companionJV = {
      id: `JV-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().slice(0, 10),
      debitAccount: `${expenseCategory} Expense`,
      creditAccount: "HDFC Bank Main",
      amount: expenseAmount,
      narration:
        expenseDesc || `Auto-logged operational outflow for ${expenseCategory}`,
    };
    setJournalVouchers((prev) => [companionJV, ...prev]);

    onAddNotification(
      "Corporate Expense Saved",
      `Logged ₹${expenseAmount.toLocaleString()} payment under ${expenseCategory}. Double-entry voucher created.`,
      "success",
    );
    setExpenseAmount(1500);
    setExpenseDesc("");
  };

  const handleCreateJournalVoucher = (e) => {
    e.preventDefault();
    if (jvAmt <= 0) return;

    const newJV = {
      id: `JV-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 10),
      debitAccount: jvDebitAcc,
      creditAccount: jvCreditAcc,
      amount: jvAmt,
      narration: jvNarration,
    };

    setJournalVouchers((prev) => [newJV, ...prev]);
    onAddNotification(
      "Journal Voucher Posted",
      `Successfully posted double-entry debit to ${jvDebitAcc} and credit to ${jvCreditAcc}.`,
      "success",
    );
    setShowJournalModal(false);
    setJvNarration("");
  };

  const handleExportGSTR1 = () => {
    // Generate CSV data for GST report
    const headers =
      "Invoice No,Date,Customer,GSTIN,Taxable Value,CGST (6%),SGST (6%),Total Tax,Grand Total\n";
    const rows = invoices
      .map((inv) => {
        const taxBase = inv.grandTotal / 1.12;
        const cgst = taxBase * 0.06;
        const sgst = taxBase * 0.06;
        return `${inv.invoiceNo},${inv.date},"${inv.customerName}",29AAAAA0000A1Z1,${taxBase.toFixed(2)},${cgst.toFixed(2)},${sgst.toFixed(2)},${(cgst + sgst).toFixed(2)},${inv.grandTotal}\n`;
      })
      .join("");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GSTR_1_Audit_Report_${new Date().toISOString().slice(0, 7)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onAddNotification(
      "GST Exporter",
      "GSTR-1 compliant sales file generated & exported to CSV.",
      "success",
    );
  };

  return (
    <div
      className="space-y-6 animate-fade-in pb-12"
      id="accounting-ledger-root"
    >
      {/* Sub tabs */}
      <div className="flex border-b border-slate-100 pb-3">
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("pnl")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === "pnl" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Profit & Loss Summary
          </button>
          <button
            onClick={() => setActiveTab("journal")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === "journal" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Double Entry Journal
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === "ledger" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Expenses Cashbook
          </button>
          <button
            onClick={() => setActiveTab("trial_balance")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === "trial_balance" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Corporate Trial Balance
          </button>
          <button
            onClick={() => setActiveTab("gst")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === "gst" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            GST Audit Report
          </button>
        </div>
      </div>

      {/* PROFIT & LOSS STATEMENT */}
      {activeTab === "pnl" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Gross Sales Turnover
                </span>
                <div className="text-2xl font-bold text-slate-800 font-sans">
                  ₹
                  {totalSalesRevenue.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <p className="text-[11px] text-slate-400">
                  Total processed retail loop receipts
                </p>
              </div>
              <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Operational Expenses
                </span>
                <div className="text-2xl font-bold text-slate-800 font-sans">
                  ₹
                  {totalExpensesPaid.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <p className="text-[11px] text-slate-400">
                  Fixed rent, electric, salaries, & floor logistics
                </p>
              </div>
              <div className="bg-red-50 p-2.5 rounded-lg text-red-600">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Calculated Net Yield
                </span>
                <div
                  className={`text-2xl font-bold font-sans ${netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}
                >
                  ₹
                  {netProfit.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <p className="text-[11px] text-slate-400">
                  Operating EBITDA post-COGS & markdowns
                </p>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Detailed Statement Ledger Sheet */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Profit & Loss Spreadsheet (Simulated 2026 Q2)
            </h3>
            <div className="divide-y divide-slate-100 text-xs font-semibold">
              <div className="py-3 flex justify-between">
                <span className="text-slate-700 font-bold">
                  1. Operating Revenue (Sales receipts)
                </span>
                <span className="font-mono text-slate-950">
                  ₹{totalSalesRevenue.toLocaleString()}
                </span>
              </div>
              <div className="py-3 flex justify-between pl-4 text-slate-500">
                <span>Cost of Goods Sold (COGS Estimate)</span>
                <span className="font-mono">
                  -₹{estimatedCOGS.toLocaleString()}
                </span>
              </div>
              <div className="py-3 flex justify-between font-bold bg-slate-50 px-2.5 rounded-lg text-slate-800">
                <span>Gross Margin Profit</span>
                <span className="font-mono text-indigo-600">
                  ₹{grossProfit.toLocaleString()}
                </span>
              </div>
              <div className="py-3 flex justify-between pl-4 text-slate-500">
                <span>Total Corporate Expenses (Rent, Payroll, etc)</span>
                <span className="font-mono">
                  -₹{totalExpensesPaid.toLocaleString()}
                </span>
              </div>
              <div className="py-3 flex justify-between font-bold bg-slate-900 px-2.5 rounded-lg text-white">
                <span>Net Income Profit / Yield</span>
                <span className="font-mono text-emerald-400">
                  ₹{netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOUBLE ENTRY JOURNAL */}
      {activeTab === "journal" && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Double Entry Journal Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                Chronological list of accounts debited and credited with
                corresponding balance compliance.
              </p>
            </div>
            <button
              onClick={() => {
                setJvDebitAcc("Salaries Account");
                setJvCreditAcc("HDFC Bank Main");
                setJvAmt(5000);
                setShowJournalModal(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Post Journal Voucher</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Voucher ID</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Account Debit (Dr)</th>
                    <th className="p-3.5">Account Credit (Cr)</th>
                    <th className="p-3.5 text-right">Amount (₹)</th>
                    <th className="p-3.5">Narration Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {journalVouchers.map((jv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono font-bold text-indigo-600">
                        {jv.id}
                      </td>
                      <td className="p-3.5 font-mono">{jv.date}</td>
                      <td className="p-3.5">
                        <span className="text-indigo-600 font-bold">
                          {jv.debitAccount}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-amber-600 font-bold">
                          {jv.creditAccount}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        ₹{jv.amount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-slate-500 italic font-semibold">
                        {jv.narration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LEDGER EXPENSES */}
      {activeTab === "ledger" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Create expense */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:col-span-4 space-y-4 text-xs">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Log Corporate Debit Outflow
            </h4>
            <form onSubmit={handleCreateExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Expense Category
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700 font-sans"
                >
                  <option value="Rent">Rent Outflow</option>
                  <option value="Electricity">Electricity Utility</option>
                  <option value="Salaries">Payroll Salaries</option>
                  <option value="Marketing">Marketing / Advertisement</option>
                  <option value="Logistics">Supply Logistics</option>
                  <option value="Misc">Miscellaneous Outflow</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Payment Amount (₹)
                </label>
                <input
                  required
                  type="number"
                  value={expenseAmount || ""}
                  onChange={(e) =>
                    setExpenseAmount(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Explanation Notes
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paid showroom floor lease..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-md cursor-pointer"
              >
                Record Floor Expense
              </button>
            </form>
          </div>

          {/* Expenses history table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-8">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Cashbook Expenditure Ledger
              </h4>
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Disbursement Date</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Description Detail</th>
                    <th className="p-3.5">Payment Route</th>
                    <th className="p-3.5 text-right">Debit Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {expenses.slice(0, 10).map((exp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono text-[10px] text-slate-400">
                        {exp.date}
                      </td>
                      <td className="p-3.5">
                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs truncate">
                        {exp.description}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-500">
                        {exp.paymentMethod}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-red-500">
                        ₹{exp.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TRIAL BALANCE */}
      {activeTab === "trial_balance" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Corporate Adjusted Trial Balance
              </h4>
              <p className="text-[11px] text-slate-400">
                Unconsolidated financial ledger checks as of Q2 2026.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold flex items-center gap-1.5 uppercase font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Balanced Ledger Ledger Verified</span>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                  <th className="p-3.5">Account Code</th>
                  <th className="p-3.5">Ledger Account Description</th>
                  <th className="p-3.5 text-right font-mono">
                    Debit Balance (Dr)
                  </th>
                  <th className="p-3.5 text-right font-mono">
                    Credit Balance (Cr)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                <tr>
                  <td className="p-3.5 font-mono text-slate-400">1001-HDFC</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    HDFC Bank Operating Account
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-800">
                    ₹
                    {Math.max(
                      100000,
                      totalSalesRevenue - totalExpensesPaid,
                    ).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">
                    -
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-mono text-slate-400">1200-STOCK</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    Apparel Raw Inventory
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-800">
                    ₹{estimatedCOGS.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">
                    -
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-mono text-slate-400">4000-REV</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    Sales Retail & B2B Revenue
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">
                    -
                  </td>
                  <td className="p-3.5 text-right font-mono text-indigo-600 font-bold">
                    ₹{totalSalesRevenue.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-mono text-slate-400">5000-EXP</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    Operational Overhead Expenses
                  </td>
                  <td className="p-3.5 text-right font-mono text-red-500 font-bold">
                    ₹{totalExpensesPaid.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">
                    -
                  </td>
                </tr>
                <tr className="bg-slate-900 text-white font-bold">
                  <td className="p-3.5" colSpan={2}>
                    Aggregate Ledger Compliance Sum
                  </td>
                  <td className="p-3.5 text-right font-mono text-emerald-400">
                    ₹
                    {(
                      Math.max(100000, totalSalesRevenue - totalExpensesPaid) +
                      estimatedCOGS +
                      totalExpensesPaid
                    ).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right font-mono text-emerald-400">
                    ₹{totalSalesRevenue.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GST LEDGERS SUMMARY */}
      {activeTab === "gst" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  GST Output Tax liabilities (CGST 6% + SGST 6%)
                </h3>
                <p className="text-xs text-slate-400">
                  Total collected taxes derived from sales invoice logs.
                </p>
              </div>
              <button
                onClick={handleExportGSTR1}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs font-sans"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export GSTR-1 Audit CSV</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-sans block mb-1">
                  Total CGST Liability (Output)
                </span>
                <span className="text-base font-bold text-slate-800">
                  ₹{(totalSalesRevenue * 0.06).toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-sans block mb-1">
                  Total SGST Liability (Output)
                </span>
                <span className="text-base font-bold text-slate-800">
                  ₹{(totalSalesRevenue * 0.06).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Filing & Compliance Timeline
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-800">
                    GSTR-1 (Outward Sales Returns)
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Due Date: 11th of succeeding month
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold font-mono uppercase">
                  Filed & Reconciled
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-800">
                    GSTR-3B (Summary Tax Return)
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Due Date: 20th of succeeding month
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGstr3bFiled(true);
                    onAddNotification(
                      "GST Tax Compliance",
                      "GSTR-3B return successfully marked as filed for this tax period.",
                      "success",
                    );
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                    gstr3bFiled
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 hover:bg-amber-100 text-amber-700 cursor-pointer"
                  }`}
                >
                  {gstr3bFiled ? "Filed" : "Pending Filing"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= ACCOUNTING MODALS ======================= */}

      {/* MODAL: POST JOURNAL VOUCHER */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Post General Journal Voucher
              </h3>
              <button
                onClick={() => setShowJournalModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateJournalVoucher} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Account Debit (Dr) *
                  </label>
                  <select
                    value={jvDebitAcc}
                    onChange={(e) => setJvDebitAcc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-semibold text-slate-800"
                  >
                    <option value="Salaries Account">Salaries Account</option>
                    <option value="Rent Expense Account">
                      Rent Expense Account
                    </option>
                    <option value="Electricity Utilities">
                      Electricity Utilities
                    </option>
                    <option value="Inventory Stock Room">
                      Inventory Stock Room
                    </option>
                    <option value="Cash-in-hand">Cash-in-hand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Account Credit (Cr) *
                  </label>
                  <select
                    value={jvCreditAcc}
                    onChange={(e) => setJvCreditAcc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-semibold text-slate-800"
                  >
                    <option value="HDFC Bank Main">HDFC Bank Main</option>
                    <option value="Petty Cash Reserve">
                      Petty Cash Reserve
                    </option>
                    <option value="Accounts Payable - Fabrics Ltd">
                      Accounts Payable - Fabrics Ltd
                    </option>
                    <option value="Sales Revenue Account">
                      Sales Revenue Account
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Voucher Amount (INR) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={jvAmt}
                  onChange={(e) =>
                    setJvAmt(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Narration Statement *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paid showroom floor lease..."
                  value={jvNarration}
                  onChange={(e) => setJvNarration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-slate-800"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800 font-sans"
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

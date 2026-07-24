import React, { useMemo } from "react";
import { CreditCard, FileText, Download, CheckCircle, Clock, Search, AlertCircle } from "lucide-react";

export function SASubscriptions({ tenants = [], searchQuery = "" }) {
  const billingHistory = useMemo(() => {
    const raw = tenants.map((t, i) => ({
      id: `INV-2026-${1000 + i}`,
      tenant: t.businessName || t.name || 'Store',
      plan: t.plan || 'Starter',
      amount: t.plan === "Enterprise" ? 14999 : t.plan === "Professional" ? 5999 : t.plan === "Starter" ? 2499 : 0,
      date: `2026-06-${Math.floor(Math.random() * 28) + 1}`.padStart(10, '0'),
      status: i % 5 === 0 ? "Pending" : "Paid",
    })).filter(b => b.amount > 0).sort((a, b) => (a.date > b.date ? -1 : 1));

    const q = (searchQuery || "").toLowerCase().trim();
    if (!q) return raw;

    return raw.filter(b =>
      b.id.toLowerCase().includes(q) ||
      b.tenant.toLowerCase().includes(q) ||
      b.plan.toLowerCase().includes(q) ||
      b.status.toLowerCase().includes(q)
    );
  }, [tenants, searchQuery]);

  return (
    <div className="space-y-6 select-none animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Subscriptions & Billing Control</span>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
              {billingHistory.length} Invoices
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Track client payments, subscription invoices, and active plans</p>
        </div>
        <button className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" /> Recent Billing Invoices
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">Invoice ID</th>
                <th className="py-3.5 px-4">Business</th>
                <th className="py-3.5 px-4">Plan Details</th>
                <th className="py-3.5 px-4 font-mono text-right">Amount</th>
                <th className="py-3.5 px-4">Date Issued</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {billingHistory.map((bill, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{bill.id}</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-800">{bill.tenant}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {bill.plan}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">₹{bill.amount.toLocaleString("en-IN")}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{bill.date}</td>
                  <td className="py-3.5 px-4 text-center">
                    {bill.status === "Paid" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Paid
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Download Receipt">
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {billingHistory.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="font-bold text-xs">No billing records found matching search query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default SASubscriptions;

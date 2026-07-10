import React from "react";
import { CreditCard, FileText, Download, CheckCircle, Clock } from "lucide-react";

export function SASubscriptions({ tenants = [] }) {
  const billingHistory = tenants.map((t, i) => ({
    id: `INV-2026-${1000 + i}`,
    tenant: t.name,
    plan: t.plan,
    amount: t.plan === "Enterprise" ? 14999 : t.plan === "Professional" ? 5999 : t.plan === "Starter" ? 2499 : 0,
    date: `2026-06-${Math.floor(Math.random() * 28) + 1}`.padStart(10, '0'),
    status: i % 5 === 0 ? "Pending" : "Paid",
  })).filter(b => b.amount > 0).sort((a, b) => (a.date > b.date ? -1 : 1));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Subscriptions & Billing</h2>
          <p className="text-xs text-slate-500">Track client payments, invoices, and active plans.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" /> Recent Invoices
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-white text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="p-4">Invoice ID</th>
                <th className="p-4">Business</th>
                <th className="p-4">Plan Details</th>
                <th className="p-4 font-mono text-right">Amount</th>
                <th className="p-4">Date Issued</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {billingHistory.map((bill, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-800">{bill.id}</td>
                  <td className="p-4 font-semibold text-slate-700">{bill.tenant}</td>
                  <td className="p-4">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                      {bill.plan}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-slate-800">₹{bill.amount.toLocaleString()}</td>
                  <td className="p-4 font-mono text-slate-500">{bill.date}</td>
                  <td className="p-4 text-center">
                    {bill.status === "Paid" ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle className="w-3 h-3" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer">
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

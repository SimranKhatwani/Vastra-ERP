import React, { useState } from "react";
import { FileSpreadsheet, FileDown, Filter } from "lucide-react";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export const ReportsView = ({
  invoices,
  purchaseOrders,
  products,
  onAddNotification,
}) => {
  const [reportType, setReportType] = useState("sales");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // --- SALES DATA AGGREGATION ---
  const selectedInvoices = invoices.filter(
    (inv) => inv.date >= startDate && inv.date <= endDate,
  );
  
  const totalSales = selectedInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalGST = selectedInvoices.reduce((sum, inv) => sum + inv.gstTotal, 0);

  // 1. Timeline Data (Revenue by Date)
  const salesByDate = {};
  selectedInvoices.forEach(inv => {
    if (!salesByDate[inv.date]) salesByDate[inv.date] = 0;
    salesByDate[inv.date] += inv.grandTotal;
  });
  const timelineData = Object.keys(salesByDate).map(date => ({
    date,
    Revenue: salesByDate[date]
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  // 2. Payment Methods Data
  const paymentMethods = {};
  selectedInvoices.forEach(inv => {
    const pm = inv.paymentMethod || 'Unknown';
    if (!paymentMethods[pm]) paymentMethods[pm] = 0;
    paymentMethods[pm] += inv.grandTotal;
  });
  const paymentData = Object.keys(paymentMethods).map(name => ({
    name,
    value: paymentMethods[name]
  }));
  const PIE_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  // 3. GST & Base Value Data
  const gstByDate = {};
  selectedInvoices.forEach(inv => {
    if (!gstByDate[inv.date]) {
       gstByDate[inv.date] = { date: inv.date, BaseValue: 0, GSTCollected: 0 };
    }
    gstByDate[inv.date].BaseValue += inv.subTotal;
    gstByDate[inv.date].GSTCollected += inv.gstTotal;
  });
  const gstData = Object.values(gstByDate).sort((a, b) => new Date(a.date) - new Date(b.date));


  // --- PROCUREMENT DATA AGGREGATION ---
  const selectedPOs = purchaseOrders.filter(
    (po) => po.date >= startDate && po.date <= endDate,
  );
  const totalPOSpent = selectedPOs.reduce((sum, po) => sum + po.grandTotal, 0);


  // --- STOCK DATA AGGREGATION ---
  const totalItemsCount = products.reduce((sum, p) => sum + p.stock, 0);
  const cogsInventory = products.reduce(
    (sum, p) => sum + p.purchasePrice * p.stock,
    0,
  );


  // --- EXPORT SIMULATIONS ---
  const handleExportPDFSim = () => {
    onAddNotification(
      "PDF Printer Hub",
      "Preparing vector print engine layouts...",
      "info",
    );
    setTimeout(() => {
      onAddNotification(
        "PDF Download Complete",
        `Successfully downloaded vastra_erp_${reportType}_audit_${endDate}.pdf`,
        "success",
      );
    }, 1500);
  };

  const handleExportExcelSim = () => {
    onAddNotification(
      "Excel Ledger Exporter",
      "Formulating cell metadata & totals formulas...",
      "info",
    );
    setTimeout(() => {
      onAddNotification(
        "Excel Exported",
        `Downloaded vastra_erp_${reportType}_ledger_${endDate}.xlsx`,
        "success",
      );
    }, 1500);
  };

  // Custom Tooltip formatter for currency
  const formatCurrency = (value) => `₹${value.toLocaleString()}`;

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="reports-engine-root">
      {/* Selection Panel card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Bi-directional Filter Hub</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
          <div>
            <span className="text-slate-400 block mb-1.5">Scope / Sheet</span>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700"
            >
              <option value="sales">Sales & Billing Ledger</option>
              <option value="procurement">Procurements (PO) ledger</option>
              <option value="stock">Inventory Valuation Sheet</option>
            </select>
          </div>

          <div>
            <span className="text-slate-400 block mb-1.5">Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono"
            />
          </div>

          <div>
            <span className="text-slate-400 block mb-1.5">End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleExportPDFSim}
              className="w-full p-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-red-500" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleExportExcelSim}
              className="w-full p-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats & CHARTS specific to active report */}
      {reportType === "sales" && (
        <div className="space-y-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Cumulative Yield (Net)</span>
              <span className="text-2xl font-mono font-bold text-indigo-600">₹{totalSales.toLocaleString()}</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">GST Tax Collected</span>
              <span className="text-2xl font-mono font-bold text-emerald-600">₹{totalGST.toLocaleString()}</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Processed Invoices</span>
              <span className="text-2xl font-mono font-bold text-slate-700">{selectedInvoices.length} Bills</span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sales History Timeline */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">Revenue History</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="Revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">Payment Methods Breakdown</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GST vs Base Tax Analysis */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">GST Tax & Base Value Analysis</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gstData} margin={{ top: 10, right: 0, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}} />
                    <Bar dataKey="BaseValue" stackId="a" fill="#64748b" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="GSTCollected" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Raw Ledger Data Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Detailed Invoice Ledger
            </h4>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Pay Route</th>
                    <th className="p-3 text-right">Items Value</th>
                    <th className="p-3 text-right">Discount</th>
                    <th className="p-3 text-right">GST Taxes</th>
                    <th className="p-3 text-right">Total Billing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {selectedInvoices.slice(0, 15).map((inv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-indigo-600">
                        {inv.invoiceNo}
                      </td>
                      <td className="p-3">{inv.date}</td>
                      <td className="p-3 font-semibold text-slate-800">
                        {inv.customerName}
                      </td>
                      <td className="p-3 font-mono text-[10px] uppercase">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {inv.paymentMethod || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">
                        ₹{inv.subTotal.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-600">
                        -₹{inv.discountTotal.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-400">
                        ₹{inv.gstTotal.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        ₹{inv.grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {selectedInvoices.length === 0 && (
                     <tr>
                       <td colSpan="8" className="p-6 text-center text-slate-400">No invoices found for this date range.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === "procurement" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Procurement Orders Summary
              </h4>
              <p className="text-[11px] text-slate-400">
                Total procurement PO loops: {selectedPOs.length} rows
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Cumulative PO Cost Outflow
              </span>
              <span className="text-lg font-mono font-bold text-red-500">
                ₹{totalPOSpent.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                  <th className="p-3">PO No</th>
                  <th className="p-3">Date Raised</th>
                  <th className="p-3">Supplier Account</th>
                  <th className="p-3 text-right">Items Base</th>
                  <th className="p-3 text-right font-mono">GST avg</th>
                  <th className="p-3 text-right">Procured Cost</th>
                  <th className="p-3 text-center">Receipt Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {selectedPOs.slice(0, 10).map((po, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-indigo-600">
                      {po.poNo}
                    </td>
                    <td className="p-3">{po.date}</td>
                    <td className="p-3 font-semibold text-slate-800">
                      {po.supplierName}
                    </td>
                    <td className="p-3 text-right font-mono">
                      ₹{po.subTotal.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      ₹{po.gstTotal.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800">
                      ₹{po.grandTotal.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600">
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === "stock" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Live Warehouse Asset Valuation
              </h4>
              <p className="text-[11px] text-slate-400">
                Calculated inventory on floor:{" "}
                {totalItemsCount.toLocaleString()} items
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Active Book Cost Assets
              </span>
              <span className="text-lg font-mono font-bold text-indigo-600">
                ₹{cogsInventory.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                  <th className="p-3">Garment Style Description</th>
                  <th className="p-3">SKU style</th>
                  <th className="p-3 text-center font-mono">Stock Floor</th>
                  <th className="p-3 text-right">Unit Buy Cost</th>
                  <th className="p-3 text-right">Unit MRP</th>
                  <th className="p-3 text-right">Asset Cost Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {products.slice(0, 10).map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">
                      {p.name}
                    </td>
                    <td className="p-3 font-mono">{p.sku}</td>
                    <td className="p-3 text-center font-bold font-mono text-slate-900">
                      {p.stock}
                    </td>
                    <td className="p-3 text-right font-mono">
                      ₹{p.purchasePrice}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      ₹{p.mrp}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-indigo-600">
                      ₹{(p.purchasePrice * p.stock).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

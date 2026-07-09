import React, { useState } from "react";
import { FileSpreadsheet, FileDown, Filter } from "lucide-react";

export const ReportsView = ({
  invoices,
  purchaseOrders,
  products,
  onAddNotification,
}) => {
  const [reportType, setReportType] = useState("sales");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-06-28");

  // Sales aggregates
  const selectedInvoices = invoices.filter(
    (inv) => inv.date >= startDate && inv.date <= endDate,
  );
  const totalSales = selectedInvoices.reduce(
    (sum, inv) => sum + inv.grandTotal,
    0,
  );

  // Procurement aggregates
  const selectedPOs = purchaseOrders.filter(
    (po) => po.date >= startDate && po.date <= endDate,
  );
  const totalPOSpent = selectedPOs.reduce((sum, po) => sum + po.grandTotal, 0);

  // Stock aggregates
  const totalItemsCount = products.reduce((sum, p) => sum + p.stock, 0);
  const cogsInventory = products.reduce(
    (sum, p) => sum + p.purchasePrice * p.stock,
    0,
  );

  const handleExportPDFSim = () => {
    onAddNotification(
      "PDF Printer Hub",
      "Preparing vector print engine layouts...",
      "info",
    );
    onAddNotification(
      "PDF Download Complete",
      `Successfully downloaded threadflow_${reportType}_audit_${endDate}.pdf`,
      "success",
    );
  };

  const handleExportExcelSim = () => {
    onAddNotification(
      "Excel Ledger Exporter",
      "Formulating cell metadata & totals formulas...",
      "info",
    );
    onAddNotification(
      "Excel Exported",
      `Downloaded threadflow_${reportType}_ledger_${endDate}.xlsx`,
      "success",
    );
  };

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

      {/* KPI Stats specific to active report */}
      {reportType === "sales" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Queried Sales Ledger Sheets
              </h4>
              <p className="text-[11px] text-slate-400">
                Total processed turnback: {selectedInvoices.length} billing rows
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Cumulative Yield (Net)
              </span>
              <span className="text-lg font-mono font-bold text-indigo-600">
                ₹{totalSales.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Client</th>
                  <th className="p-3 text-right">Items Value</th>
                  <th className="p-3 text-right">Discount</th>
                  <th className="p-3 text-right">GST Taxes</th>
                  <th className="p-3 text-right">Total Billing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {selectedInvoices.slice(0, 10).map((inv, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-indigo-600">
                      {inv.invoiceNo}
                    </td>
                    <td className="p-3">{inv.date}</td>
                    <td className="p-3 font-semibold text-slate-800">
                      {inv.customerName}
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
              </tbody>
            </table>
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

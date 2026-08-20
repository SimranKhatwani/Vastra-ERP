import React, { useState, useEffect } from "react";
import api from '../api/axios';
import { Search, Filter, DollarSign, Users, CheckCircle, Percent, X, Calendar, FileText, Package, Edit3 } from "lucide-react";

export const StaffCommissionPanel = ({ role: initialRole, onAddNotification }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All"); // "All", "Salesperson", "Worker"
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Partial payment modal state
  const [payModalEmployee, setPayModalEmployee] = useState(null);
  const [payInputAmount, setPayInputAmount] = useState("");

  const fetchCommissions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/commissions/staff/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch commissions:", err);
      onAddNotification("Error fetching commissions", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/billing/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const invoice = res.data.data;
        const receiptDate = invoice.date ? new Date(invoice.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '-';
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Receipt ${invoice.invoiceNo}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; color: #000; padding: 20px; max-width: 380px; margin: 0 auto; }
              .text-center { text-align: center; }
              .header { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
              .details { font-size: 11px; line-height: 1.4; margin-bottom: 10px; }
              .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
              table { width: 100%; font-size: 11px; }
              th { text-align: left; }
              .text-right { text-align: right; }
              .totals { font-weight: bold; }
              .footer { font-size: 10px; margin-top: 20px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="text-center header">ZIVA FASHION BOUTIQUE</div>
            <div class="text-center details">104, Galleria Mall, Hiranandani Estate,<br>Bandra West, Mumbai - 400050<br>GSTIN: 27AABCV1942A1ZX</div>
            <div class="divider"></div>
            <div class="details">
              <b>Receipt No:</b> ${invoice.invoiceNo}<br>
              <b>Date:</b> ${receiptDate}<br>
              <b>Customer:</b> ${invoice.customerName} ${invoice.customerPhone ? "(" + invoice.customerPhone + ")" : ""}
            </div>
            <div class="divider"></div>
            <table>
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map((item) => `
                  <tr>
                    <td>${item.name} (${item.size}/${item.color})</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">₹${item.price}</td>
                    <td class="text-right">₹${item.totalPrice}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="divider"></div>
            <table>
              <tr>
                <td>Subtotal:</td>
                <td class="text-right">₹${invoice.subTotal}</td>
              </tr>
              ${invoice.discountTotal > 0 ? `
                <tr>
                  <td>Discount:</td>
                  <td class="text-right">-₹${invoice.discountTotal}</td>
                </tr>
              ` : ""}
              <tr>
                <td>GST CGST+SGST:</td>
                <td class="text-right">₹${invoice.gstTotal}</td>
              </tr>
              <tr class="totals">
                <td>Grand Total:</td>
                <td class="text-right">₹${invoice.grandTotal}</td>
              </tr>
            </table>
            <div class="divider"></div>
            <div class="details text-center">
              <b>Payment Mode:</b> ${invoice.paymentMethod}<br>
              <b>Status:</b> ${invoice.status.toUpperCase()}<br>
              Thank you for shopping with us!<br>
              Powered by GarmentFlow SaaS ERP
            </div>
          </body>
          </html>
        `;

        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("Failed to fetch invoice:", err);
      onAddNotification("Failed to open invoice", "error");
    }
  };

  const handleMarkPaid = async (empOrId) => {
    const employeeId = typeof empOrId === 'object' ? (empOrId.id || empOrId.name) : empOrId;
    const employeeRole = typeof empOrId === 'object' ? empOrId.role : undefined;
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/commissions/staff/pay/${employeeId}`, { employeeRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        onAddNotification("Commissions marked as fully paid", "success");
        fetchCommissions();
        window.dispatchEvent(new Event("commission.updated"));
      } else {
        onAddNotification(res.data?.message || "Failed to mark as paid", "danger");
      }
    } catch (err) {
      console.error(err);
      onAddNotification("An error occurred", "danger");
    }
  };

  const handleOpenPayModal = (emp) => {
    setPayModalEmployee(emp);
    setPayInputAmount(emp.paid.toFixed(2));
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!payModalEmployee) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/commissions/staff/pay/${payModalEmployee.id}`, {
        paidAmount: Number(payInputAmount),
        employeeRole: payModalEmployee.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        onAddNotification("Commission payment updated successfully!", "success");
        setPayModalEmployee(null);
        fetchCommissions();
        window.dispatchEvent(new Event("commission.updated"));
      } else {
        onAddNotification(res.data?.message || "Failed to update payment", "danger");
      }
    } catch (err) {
      console.error(err);
      onAddNotification("An error occurred", "danger");
    }
  };

  useEffect(() => {
    fetchCommissions();
    const handleUpdate = () => fetchCommissions();
    window.addEventListener('commission.updated', handleUpdate);
    return () => window.removeEventListener('commission.updated', handleUpdate);
  }, []);

  const groupedData = React.useMemo(() => {
    const map = {};
    history.forEach(h => {
      if (roleFilter !== "All" && h.employeeRole !== roleFilter) return;

      const nameKey = (h.employeeName || 'Unknown').toLowerCase().trim();
      const groupKey = `${nameKey}_${(h.employeeRole || 'worker').toLowerCase()}`;

      if (!map[groupKey]) {
        map[groupKey] = {
          id: h.employeeId,
          ids: [h.employeeId],
          userId: h.userId,
          name: h.employeeName,
          role: h.employeeRole,
          productsSold: 0,
          invoicesSet: new Set(),
          totalSales: 0,
          totalCommission: 0,
          pending: 0,
          paid: 0,
          percentage: h.commissionPercentage || 0
        };
      } else {
        if (!map[groupKey].ids.includes(h.employeeId)) {
          map[groupKey].ids.push(h.employeeId);
        }
        if (h.commissionPercentage && (!map[groupKey].percentage || map[groupKey].percentage === 0)) {
          map[groupKey].percentage = h.commissionPercentage;
        }
      }
      if (h.invoiceNo || h.saleBillId || h.alterationId) {
        map[groupKey].invoicesSet.add(h.invoiceNo || String(h.saleBillId || h.alterationId));
      }
      map[groupKey].productsSold += (h.quantity || 1);
      map[groupKey].totalSales += (h.netAmountBasis || 0);
      map[groupKey].totalCommission += (h.commissionAmount || 0);
      map[groupKey].pending += (h.commissionPendingAmount !== undefined ? h.commissionPendingAmount : (h.status === 'Pending' ? h.commissionAmount : 0));
      map[groupKey].paid += (h.commissionPaidAmount !== undefined ? h.commissionPaidAmount : (h.status === 'Paid' ? h.commissionAmount : 0));
    });

    return Object.values(map).map(e => ({
      ...e,
      billsCount: e.invoicesSet.size || 1
    }));
  }, [history, roleFilter]);

  const filteredData = groupedData.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="p-10 text-center text-slate-500 font-bold">Loading Commissions...</div>;

  return (
    <div className="space-y-6">
      {/* Inline Filter Controls & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80">
        {/* Role filter buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {["All", "Worker", "Tailor", "Salesperson", "Cashier"].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                roleFilter === r
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Main Aggregated Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-400 font-extrabold uppercase border-b border-slate-100">
                <th className="p-3.5">Employee Name</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5 text-right font-bold text-slate-700">Bills (Items)</th>
                <th className="p-3.5 text-right font-bold text-slate-700">Total Sales</th>
                <th className="p-3.5 text-center font-bold text-indigo-600">Commission %</th>
                <th className="p-3.5 text-right font-bold text-indigo-600">Total Commission</th>
                <th className="p-3.5 text-right font-bold text-orange-600">Pending</th>
                <th className="p-3.5 text-right font-bold text-emerald-600">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400 font-bold">No data found.</td>
                </tr>
              ) : (
                filteredData.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/40">
                    <td 
                      className="p-3.5 font-bold text-indigo-600 cursor-pointer hover:underline"
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      {emp.name}
                    </td>
                    <td className="p-3.5 font-medium text-slate-500">{emp.role}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                      <span className="text-indigo-600">{emp.billsCount} Bills</span>
                      <span className="block text-[10px] text-slate-400 font-normal font-sans">({emp.productsSold} items)</span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-700">₹{emp.totalSales.toLocaleString()}</td>
                    <td className="p-3.5 text-center font-bold text-indigo-600">{emp.percentage}%</td>
                    <td className="p-3.5 text-right font-mono font-bold text-indigo-600">₹{emp.totalCommission.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-orange-600">₹{emp.pending.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                      <div className="flex items-center justify-end gap-2.5">
                        {emp.pending > 0 && (
                          <input 
                            type="checkbox" 
                            className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            onChange={(e) => {
                              if(e.target.checked) handleMarkPaid(emp);
                            }}
                            title="Mark pending commissions as fully paid"
                          />
                        )}
                        <span>₹{emp.paid.toFixed(2)}</span>
                        <button
                          onClick={() => handleOpenPayModal(emp)}
                          className="p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-all cursor-pointer"
                          title="Record / Edit partial payment"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD / EDIT PAYMENT MODAL */}
      {payModalEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Record Commission Payment
              </h3>
              <button 
                onClick={() => setPayModalEmployee(null)}
                className="p-1 hover:bg-slate-200 text-slate-500 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSavePayment} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Employee Name</p>
                <p className="text-sm font-bold text-slate-800">{payModalEmployee.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">{payModalEmployee.role}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase">Total Earned</p>
                  <p className="text-xs font-bold text-slate-700">₹{payModalEmployee.totalCommission.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-extrabold text-emerald-500 uppercase">Paid</p>
                  <p className="text-xs font-bold text-emerald-600">₹{Number(payInputAmount || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-extrabold text-orange-500 uppercase">Pending</p>
                  <p className="text-xs font-bold text-orange-600">
                    ₹{Math.max(0, payModalEmployee.totalCommission - Number(payInputAmount || 0)).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Total Amount Paid (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  max={payModalEmployee.totalCommission}
                  value={payInputAmount}
                  onChange={(e) => setPayInputAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all text-slate-700"
                />
                <p className="text-[10px] text-slate-400">Enter partial or full payment amount. Remaining will be pending.</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalEmployee(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl text-xs hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED LEDGER MODAL */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  {selectedEmployee.name} - Detailed Ledger
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Complete breakdown of all items sold and commissions generated.
                </p>
              </div>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="p-2 hover:bg-slate-200 text-slate-500 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-400 font-extrabold uppercase border-b border-slate-100">
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Invoice No</th>
                        <th className="p-3.5">Product</th>
                        <th className="p-3.5 text-right">Qty</th>
                        <th className="p-3.5 text-right">Selling Price</th>
                        <th className="p-3.5 text-center">Comm %</th>
                        <th className="p-3.5 text-right">Comm Amount</th>
                        <th className="p-3.5 text-right text-emerald-600">Paid</th>
                        <th className="p-3.5 text-right text-orange-600">Pending</th>
                        <th className="p-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.filter(h => 
                        (h.employeeName && h.employeeName.toLowerCase().trim() === selectedEmployee.name.toLowerCase().trim()) ||
                        (selectedEmployee.ids && selectedEmployee.ids.includes(h.employeeId)) ||
                        (h.employeeId === selectedEmployee.id)
                      ).map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/50">
                          <td className="p-3.5 font-medium text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-indigo-600 whitespace-nowrap">
                            <div 
                              className="flex items-center gap-1.5 cursor-pointer hover:underline"
                              onClick={() => handleViewInvoice(item.invoiceId)}
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-400" />
                              {item.invoiceNo}
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-indigo-400" />
                              {item.productName}
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-700">{item.quantity}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-700">₹{item.netAmountBasis.toLocaleString()}</td>
                          <td className="p-3.5 text-center font-bold text-indigo-600 bg-indigo-50/50">{item.commissionPercentage}%</td>
                          <td className="p-3.5 text-right font-mono font-bold text-indigo-600">₹{item.commissionAmount.toFixed(2)}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-600">₹{(item.commissionPaidAmount || 0).toFixed(2)}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-orange-600">₹{(item.commissionPendingAmount || 0).toFixed(2)}</td>
                          <td className="p-3.5 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                              item.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                              item.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                              item.status === 'Partially Paid' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

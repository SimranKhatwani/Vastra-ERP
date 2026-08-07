import React, { useState, useEffect } from "react";
import api from '../api/axios';
import { Search, Filter, DollarSign, Users, CheckCircle, Percent, X, Calendar, FileText, Package } from "lucide-react";

export const StaffCommissionPanel = ({ role, onAddNotification }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchCommissions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/commissions/staff/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setHistory(res.data.data.filter(h => h.employeeRole === role));
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

  const handleMarkPaid = async (employeeId) => {
    try {
      const response = await fetch(`/api/commissions/staff/pay/${employeeId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = response.data;
      if (data.success) {
        onAddNotification("Commissions marked as paid", "success");
        fetchCommissions();
        window.dispatchEvent(new Event("commission.updated"));
      } else {
        onAddNotification(data.message || "Failed to mark as paid", "error");
      }
    } catch (err) {
      console.error(err);
      onAddNotification("An error occurred", "error");
    }
  };

  useEffect(() => {
    fetchCommissions();
    // Setup Socket.IO listener if needed, or rely on parent
    const handleUpdate = () => fetchCommissions();
    window.addEventListener('commission.updated', handleUpdate);
    return () => window.removeEventListener('commission.updated', handleUpdate);
  }, [role]);

  // Group by employee
  const groupedData = React.useMemo(() => {
    const map = {};
    history.forEach(h => {
      if (!map[h.employeeId]) {
        map[h.employeeId] = {
          id: h.employeeId,
          name: h.employeeName,
          role: h.employeeRole,
          productsSold: 0,
          totalSales: 0,
          totalCommission: 0,
          pending: 0,
          paid: 0,
          percentage: h.commissionPercentage
        };
      }
      map[h.employeeId].productsSold += h.quantity;
      map[h.employeeId].totalSales += h.netAmountBasis;
      map[h.employeeId].totalCommission += h.commissionAmount;
      if (h.status === 'Pending') map[h.employeeId].pending += h.commissionAmount;
      if (h.status === 'Paid') map[h.employeeId].paid += h.commissionAmount;
    });
    return Object.values(map);
  }, [history]);

  const filteredData = groupedData.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="p-10 text-center text-slate-500 font-bold">Loading {role} Commissions...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Search ${role}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-medium border border-slate-100 focus:border-indigo-500 rounded-xl outline-none transition-all text-slate-700"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-400 font-extrabold uppercase border-b border-slate-100">
                <th className="p-3.5">Employee Name</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5 text-right">Products Sold</th>
                <th className="p-3.5 text-right">Total Sales</th>
                <th className="p-3.5 text-center">Commission %</th>
                <th className="p-3.5 text-right">Total Commission</th>
                <th className="p-3.5 text-right text-orange-600">Pending</th>
                <th className="p-3.5 text-right text-emerald-600">Paid</th>
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
                      onClick={() => setSelectedEmployee(emp.id)}
                    >
                      {emp.name}
                    </td>
                    <td className="p-3.5 font-medium text-slate-500">{emp.role}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-700">{emp.productsSold}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-700">₹{emp.totalSales.toLocaleString()}</td>
                    <td className="p-3.5 text-center font-bold text-indigo-600">{emp.percentage}%</td>
                    <td className="p-3.5 text-right font-mono font-bold text-indigo-600">₹{emp.totalCommission.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-orange-600">₹{emp.pending.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                      <div className="flex items-center justify-end gap-2">
                        {emp.pending > 0 && (
                          <input 
                            type="checkbox" 
                            className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            onChange={(e) => {
                              if(e.target.checked) handleMarkPaid(emp.id);
                            }}
                            title="Mark pending commissions as paid"
                          />
                        )}
                        <span>₹{emp.paid.toFixed(2)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED LEDGER MODAL */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  {groupedData.find(e => e.id === selectedEmployee)?.name} - Detailed Ledger
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
                        <th className="p-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.filter(h => h.employeeId === selectedEmployee).map((item) => (
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
                          <td className="p-3.5 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                              item.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                              item.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
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

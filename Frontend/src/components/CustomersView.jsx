import api from '../api/axios';
import React, { useState, useEffect } from "react";
import { Gift, X, FileText, ExternalLink } from "lucide-react";

export const CustomersView = ({
  customers,
  invoices = [],
  onSettleCustomerBalance,
  onAddNotification,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [membershipFilter, setMembershipFilter] = useState("All");
  const [selectedCustomerId, setSelectedCustomerId] = useState("c-1");
  const [settleAmount, setSettleAmount] = useState(1000);
  const [activeTab, setActiveTab] = useState("directory");
  const [loyaltySettings, setLoyaltySettings] = useState({ enabled: true, rupeesPerPoint: 20 });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);

  useEffect(() => {
    const fetchLoyaltySettings = async () => {
      try {
        const res = await api.get(`/customers/loyalty-settings`);
        const data = res.data;
        if (data.success && data.data) {
          setLoyaltySettings({
            enabled: data.data.enabled,
            rupeesPerPoint: data.data.rupeesPerPoint || 20
          });
        }
      } catch (err) {
        console.error("Failed to load loyalty settings", err);
      }
    };
    fetchLoyaltySettings();
  }, []);

  const handleSaveLoyaltySettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put(`/customers/loyalty-settings`, loyaltySettings);
      const data = res.data;
      if (data.success) {
        onAddNotification("Settings Saved", "Loyalty configuration updated successfully.", "success");
      } else {
        onAddNotification("Error", data.message || "Failed to update settings", "error");
      }
    } catch (err) {
      onAddNotification("Error", "Network error occurred", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenInvoice = (invoice) => {
    try {
      const receiptDate = invoice.date
        ? new Date(invoice.date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
        : "-";
      const htmlContent = `<!DOCTYPE html><html><head><title>Receipt ${invoice.invoiceNo}</title><style>body{font-family:'Courier New',Courier,monospace;color:#000;padding:20px;max-width:380px;margin:0 auto}.text-center{text-align:center}.header{font-size:14px;font-weight:bold;margin-bottom:5px}.details{font-size:11px;line-height:1.4;margin-bottom:10px}.divider{border-bottom:1px dashed #000;margin:10px 0}table{width:100%;font-size:11px}th{text-align:left}.text-right{text-align:right}.totals{font-weight:bold}</style></head><body><div class="text-center header">GarmentFlow ERP</div><div class="divider"></div><div class="details"><b>Receipt No:</b> ${invoice.invoiceNo}<br><b>Date:</b> ${receiptDate}<br><b>Customer:</b> ${invoice.customerName || "-"} ${invoice.customerPhone ? "(" + invoice.customerPhone + ")" : ""}</div><div class="divider"></div><table><thead><tr><th>Item</th><th class="text-right">Qty</th><th class="text-right">Price</th><th class="text-right">Total</th></tr></thead><tbody>${(invoice.items || []).map(item => "<tr><td>" + (item.name||"") + "</td><td class=\"text-right\">" + item.quantity + "</td><td class=\"text-right\">&#8377;" + item.price + "</td><td class=\"text-right\">&#8377;" + item.totalPrice + "</td></tr>").join("")}</tbody></table><div class="divider"></div><table><tr><td>Grand Total:</td><td class="text-right"><b>&#8377;${invoice.grandTotal}</b></td></tr><tr><td>Payment:</td><td class="text-right">${invoice.paymentMethod || "-"}</td></tr></table><div class="divider"></div><div class="text-center" style="font-size:10px">Thank you for shopping with us!</div></body></html>`;
      const blob = new Blob([htmlContent], { type: "text/html" });
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (err) {
      console.error("Failed to open invoice", err);
      onAddNotification("Failed to open invoice", "error");
    }
  };

  // Birthday check
  const birthdayReminders = customers.filter((c) => {
    if (!c.birthday) return false;
    const d = new Date(c.birthday);
    const today = new Date();
    return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  });

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    return matchesSearch;
  });

  return (
    <>
      <div className="space-y-6 animate-fade-in pb-12" id="customers-crm-root">
        {/* Birthday Reminders Alert Bar */}
        {birthdayReminders.length > 0 && (
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">Birthday Reminders Today</h4>
                <p className="text-[11px] text-rose-700">Send personalized coupon campaigns to increase loyalty traffic.</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
              {birthdayReminders.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onAddNotification("SMS Gateway Campaign", `Sent birthday SMS to ${c.name} (${c.phone}).`, "success")}
                  className="bg-white hover:bg-slate-50 border border-pink-300 text-pink-700 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>Promo to {c.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("directory")}
            className={`py-2 px-4 text-xs font-bold transition-all ${activeTab === "directory" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
          >
            Customer Directory
          </button>
          <button
            onClick={() => setActiveTab("loyalty_config")}
            className={`py-2 px-4 text-xs font-bold transition-all ${activeTab === "loyalty_config" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
          >
            Loyalty Points Configuration
          </button>
        </div>

        {/* CUSTOMER DIRECTORY TAB */}
        {activeTab === "directory" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">CRM Customer Loyalty Directory</h4>
                <p className="text-[10px] text-slate-400">Active records in database: {customers.length}</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search phone or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Contact Detail</th>
                    <th className="p-3.5 text-center font-mono">Loyalty Points</th>
                    <th className="p-3.5 text-right">Outstanding Balance</th>
                    <th className="p-3.5 text-right">Cumulative Spending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {filteredCustomers.map((cust, idx) => {
                    const customerInvoices = invoices.filter(inv => {
                      const invCustId = (inv.customerId || "").toString();
                      const custId = (cust._id || cust.id || "").toString();
                      return invCustId && custId && invCustId === custId;
                    });
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 uppercase">
                              {cust.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <p
                              className="font-bold text-indigo-600 leading-tight cursor-pointer hover:underline"
                              onClick={() => setSelectedCustomerModal({ cust, customerInvoices })}
                            >
                              {cust.name}
                            </p>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <p>{cust.phone}</p>
                          <p className="text-[10px] text-slate-400">{cust.email}</p>
                        </td>
                        <td className="p-3.5 text-center font-bold font-mono text-violet-600">
                          {cust.loyaltyPoints || 0} LP
                        </td>
                        <td className={`p-3.5 text-right font-mono font-bold ${(cust.outstandingBalance || 0) > 0 ? "text-red-500" : "text-slate-400"}`}>
                          ₹{(cust.outstandingBalance || 0).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-800">
                          ₹{(cust.totalSpent || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 font-semibold">No customers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LOYALTY CONFIG TAB */}
        {activeTab === "loyalty_config" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-2xl mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800">Loyalty Points Configuration</h3>
              <p className="text-xs text-slate-500">Configure how customers earn loyalty points on their purchases.</p>
            </div>

            <form onSubmit={handleSaveLoyaltySettings} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <input
                  type="checkbox"
                  id="loyalty-enabled"
                  checked={loyaltySettings.enabled}
                  onChange={(e) => setLoyaltySettings({ ...loyaltySettings, enabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="loyalty-enabled" className="text-sm font-bold text-slate-700 cursor-pointer">
                  Enable Loyalty Program
                </label>
              </div>

              <div className={`space-y-4 ${!loyaltySettings.enabled ? "opacity-50 pointer-events-none" : ""}`}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Earning Rule</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-sm font-semibold text-slate-600">For every</span>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={loyaltySettings.rupeesPerPoint}
                        onChange={(e) => setLoyaltySettings({ ...loyaltySettings, rupeesPerPoint: parseInt(e.target.value) || 0 })}
                        className="w-24 pl-7 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-600">spent, customer earns <strong className="text-indigo-600">1 Point</strong></span>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs">
                  <h4 className="font-bold text-blue-800 mb-2">Example Calculation</h4>
                  <table className="w-full text-left max-w-xs text-slate-600">
                    <tbody>
                      {[100, 500, 1000, 5000].map(amt => (
                        <tr key={amt} className="border-b border-blue-100/50 last:border-0">
                          <td className="py-1">Bill Amount: ₹{amt.toLocaleString()}</td>
                          <td className="py-1 font-bold">{Math.floor(amt / (loyaltySettings.rupeesPerPoint || 1))} Points</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Customer Invoice History Modal */}
      {selectedCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">{selectedCustomerModal.cust.name}</h3>
                <p className="text-xs text-slate-500">{selectedCustomerModal.cust.phone} &bull; {selectedCustomerModal.customerInvoices.length} invoice(s)</p>
              </div>
              <button onClick={() => setSelectedCustomerModal(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 p-5 border-b border-slate-100">
              <div className="text-center">
                <p className="text-lg font-extrabold text-indigo-600">{selectedCustomerModal.cust.loyaltyPoints || 0}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Loyalty Points</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-extrabold text-slate-800">₹{(selectedCustomerModal.cust.totalSpent || 0).toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Spent</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-extrabold ${(selectedCustomerModal.cust.outstandingBalance || 0) > 0 ? "text-red-500" : "text-emerald-600"}`}>
                  ₹{(selectedCustomerModal.cust.outstandingBalance || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Outstanding</p>
              </div>
            </div>

            {/* Invoice list */}
            <div className="overflow-y-auto flex-1">
              {selectedCustomerModal.customerInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <FileText className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-semibold">No invoices found for this customer</p>
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-400 font-extrabold uppercase border-b border-slate-100">
                      <th className="p-3.5">Invoice No</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5 text-right">Amount</th>
                      <th className="p-3.5 text-center">Payment</th>
                      <th className="p-3.5 text-center">Open</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCustomerModal.customerInvoices.map((inv, i) => (
                      <tr
                        key={i}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                        onClick={() => handleOpenInvoice(inv)}
                      >
                        <td className="p-3.5 font-bold text-indigo-600 font-mono">{inv.invoiceNo}</td>
                        <td className="p-3.5 text-slate-500">{inv.date ? new Date(inv.date).toLocaleDateString("en-IN") : "-"}</td>
                        <td className="p-3.5 text-slate-700">{(inv.items || []).length} item(s)</td>
                        <td className="p-3.5 text-right font-bold font-mono text-slate-900">₹{(inv.grandTotal || 0).toLocaleString()}</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 uppercase">{inv.paymentMethod || "-"}</span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenInvoice(inv);
                            }}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                            title="Open Invoice"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

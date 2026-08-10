import api from '../api/axios';
import React, { useState, useEffect } from "react";
import { Gift, X, FileText, ExternalLink } from "lucide-react";

export const CustomersView = ({
  customers,
  invoices = [],
  onSettleCustomerBalance,
  onAddNotification,
  onUpdateCustomerPrepaidAdvance,
  onAddCustomer
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [membershipFilter, setMembershipFilter] = useState("All");
  const [selectedCustomerId, setSelectedCustomerId] = useState("c-1");
  const [settleAmount, setSettleAmount] = useState(1000);
  const [activeTab, setActiveTab] = useState("directory");
  const [loyaltySettings, setLoyaltySettings] = useState({ enabled: true, rupeesPerPoint: 20 });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);

  const [editPrepaidAmount, setEditPrepaidAmount] = useState("");
  const [editPrepaidReason, setEditPrepaidReason] = useState("");
  const [editPrepaidDate, setEditPrepaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [editGstin, setEditGstin] = useState("");
  const [isSavingPrepaid, setIsSavingPrepaid] = useState(false);

  // Add Customer Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: "", phone: "", email: "", dob: "", gstin: "" });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const handleCreateCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      onAddNotification("Required Fields Missing", "Please enter customer name and phone number.", "error");
      return;
    }
    if (newCustomerForm.phone.length !== 10) {
      onAddNotification("Invalid Mobile Number", "Mobile number must be exactly 10 digits.", "error");
      return;
    }
    setIsCreatingCustomer(true);
    try {
      if (onAddCustomer) {
        await onAddCustomer(newCustomerForm);
        onAddNotification("Customer Created", `${newCustomerForm.name} saved successfully.`, "success");
      } else {
        await api.post('/customers', newCustomerForm);
        onAddNotification("Customer Created", `${newCustomerForm.name} saved successfully.`, "success");
      }
      setShowAddCustomerModal(false);
      setNewCustomerForm({ name: "", phone: "", email: "", dob: "", gstin: "" });
    } catch (err) {
      console.error("Failed to create customer:", err);
      onAddNotification("Error", "Failed to create customer: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleSavePrepaidAdvance = async (cust) => {
    const custId = cust._id || cust.id || cust.phone;
    const amount = editPrepaidAmount !== "" ? Number(editPrepaidAmount) : (cust.prepaidAdvance || 0);
    if (isNaN(amount) || amount < 0) {
      onAddNotification("Invalid Amount", "Please enter a valid prepaid amount.", "error");
      return;
    }
    setIsSavingPrepaid(true);
    try {
      const history = cust.advanceHistory || [];
      const entryDate = editPrepaidDate ? new Date(editPrepaidDate) : new Date();
      const entryReason = editPrepaidReason.trim() ? editPrepaidReason.trim() : "Prepaid Advance Deposit";

      const updatedHistory = editPrepaidAmount !== "" ? [
        ...history,
        { amount: amount, reason: entryReason, date: entryDate }
      ] : history;

      const newWallet = editPrepaidAmount !== "" ? (cust.walletAdvance || 0) + (amount - (cust.prepaidAdvance || 0)) : (cust.walletAdvance || 0);

      const payload = {
        name: cust.name,
        phone: cust.phone,
        email: cust.email,
        gstin: editGstin,
        prepaidAdvance: amount,
        walletAdvance: Math.max(0, newWallet),
        advanceHistory: updatedHistory
      };

      let updatedCust = {
        ...cust,
        ...payload
      };

      try {
        const res = await api.put(`/customers/${custId}`, payload);
        if (res.data && res.data.data) {
          updatedCust = res.data.data;
        }
      } catch (networkErr) {
        console.warn("Backend API put error, applying local customer state sync:", networkErr);
      }

      onAddNotification("Customer Info Saved", `Customer profile updated for ${cust.name}`, "success");
      if (onUpdateCustomerPrepaidAdvance) {
        onUpdateCustomerPrepaidAdvance(custId, updatedCust);
      }
      setSelectedCustomerModal(prev => prev ? { ...prev, cust: { ...prev.cust, ...updatedCust } } : null);
      setEditPrepaidAmount("");
      setEditPrepaidReason("");
    } catch (err) {
      console.error("Failed to update customer details", err);
      onAddNotification("Error", "Error updating customer details", "error");
    } finally {
      setIsSavingPrepaid(false);
    }
  };

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
      const advAmt = invoice.advanceApplied || (invoice.splitPayments?.find(s => (s.method || s.mode || '').toUpperCase() === 'ADVANCE')?.amount || 0);
      const htmlContent = `<!DOCTYPE html><html><head><title>Receipt ${invoice.invoiceNo}</title><style>body{font-family:'Courier New',Courier,monospace;color:#000;padding:20px;max-width:380px;margin:0 auto}.text-center{text-align:center}.header{font-size:14px;font-weight:bold;margin-bottom:5px}.details{font-size:11px;line-height:1.4;margin-bottom:10px}.divider{border-bottom:1px dashed #000;margin:10px 0}table{width:100%;font-size:11px}th{text-align:left}.text-right{text-align:right}.totals{font-weight:bold}</style></head><body><div class="text-center header">GarmentFlow ERP</div><div class="divider"></div><div class="details"><b>Receipt No:</b> ${invoice.invoiceNo}<br><b>Date:</b> ${receiptDate}<br><b>Customer:</b> ${invoice.customerName || "-"} ${invoice.customerPhone ? "(" + invoice.customerPhone + ")" : ""}</div><div class="divider"></div><table><thead><tr><th>Item</th><th class="text-right">Qty</th><th class="text-right">Price</th><th class="text-right">Total</th></tr></thead><tbody>${(invoice.items || []).map(item => "<tr><td>" + (item.name||"") + "</td><td class=\"text-right\">" + item.quantity + "</td><td class=\"text-right\">&#8377;" + item.price + "</td><td class=\"text-right\">&#8377;" + item.totalPrice + "</td></tr>").join("")}</tbody></table><div class="divider"></div><table><tr><td>Grand Total:</td><td class="text-right"><b>&#8377;${invoice.grandTotal}</b></td></tr>${advAmt > 0 ? `<tr><td style="color:#047857;font-weight:bold;">Advance Applied:</td><td class="text-right" style="color:#047857;font-weight:bold;">-&#8377;${advAmt}</td></tr>` : ''}<tr><td>Payment Mode:</td><td class="text-right">${invoice.paymentMethod || "-"}</td></tr></table><div class="divider"></div><div class="text-center" style="font-size:10px">Thank you for shopping with us!</div></body></html>`;
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
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Search phone, name or GST..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                >
                  + Add Customer
                </button>
              </div>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Contact Detail</th>
                    <th className="p-3.5 font-mono">GST No.</th>
                    <th className="p-3.5 text-center font-mono">Loyalty Points</th>
                    <th className="p-3.5 text-right font-mono text-amber-600">Prepaid Advance</th>
                    <th className="p-3.5 text-right font-mono">Total Advance</th>
                    <th className="p-3.5 text-right">Outstanding Balance</th>
                    <th className="p-3.5 text-center">Manage Prepaid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {filteredCustomers.map((cust, idx) => {
                    const customerInvoices = invoices.filter(inv => {
                      const invCustId = (inv.customerId || "").toString();
                      const custId = (cust._id || cust.id || "").toString();
                      return invCustId && custId && invCustId === custId;
                    });
                    const prepaidFromHistory = (cust.advanceHistory || [])
                      .reduce((acc, h) => acc + (h.amount || 0), 0);
                    const prepaidAmt = cust.walletAdvance !== undefined ? cust.walletAdvance : (cust.prepaidAdvance !== undefined ? cust.prepaidAdvance : Math.max(0, prepaidFromHistory));
                    const dueAmt = cust.dueBalance !== undefined ? cust.dueBalance : (cust.outstandingBalance || 0);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 uppercase">
                              {cust.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                              <p
                                className="font-bold text-indigo-600 leading-tight cursor-pointer hover:underline"
                                onClick={() => {
                                  setSelectedCustomerModal({ cust, customerInvoices, tab: 'invoices' });
                                  setEditGstin(cust.gstin || cust.gstNo || "");
                                }}
                              >
                                {cust.name}
                              </p>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <p>{cust.phone}</p>
                          <p className="text-[10px] text-slate-400">{cust.email}</p>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-700 uppercase">
                          {cust.gstin || cust.gstNo || '-'}
                        </td>
                        <td className="p-3.5 text-center font-bold font-mono text-violet-600">
                          {cust.loyaltyPoints || 0} LP
                        </td>
                        <td className="p-3.5 text-right font-mono font-extrabold text-amber-600">
                          &#8377;{prepaidAmt.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                          &#8377;{prepaidAmt.toLocaleString('en-IN')}
                        </td>
                        <td className={`p-3.5 text-right font-mono font-bold ${dueAmt > 0 ? "text-red-500" : "text-slate-400"}`}>
                          &#8377;{dueAmt.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setSelectedCustomerModal({ cust, customerInvoices, tab: 'advance' })}
                            className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Edit Prepaid
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400 font-semibold">No customers found.</td>
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

            {/* Single Prepaid Value Header */}
            <div className="px-5 py-3 border-b border-indigo-100 bg-indigo-50/50 flex items-center justify-between">
              <span className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-indigo-600" /> Prepaid Value
              </span>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full font-mono">
                Current Prepaid: &#8377;{(selectedCustomerModal.cust.prepaidAdvance || 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Modal Body: Prepaid Value & Edit */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {(() => {
                const cust = selectedCustomerModal.cust;
                const history = cust.advanceHistory || [];

                return (
                  <>
                        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3.5 shadow-sm">
                          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                            <div>
                              <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                                <Gift className="w-4 h-4 text-amber-600" /> Edit Customer Prepaid Advance
                              </h4>
                              <p className="text-[11px] text-amber-700 font-medium">Update prepaid balance synced directly to Database & POS</p>
                            </div>
                            <span className="text-xs font-black text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full font-mono">
                              Current: &#8377;{(cust.prepaidAdvance || 0).toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Field 1: Enter Value */}
                            <div>
                              <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase tracking-wider">Enter Value (&#8377;)</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">&#8377;</span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={editPrepaidAmount}
                                  onChange={(e) => setEditPrepaidAmount(e.target.value)}
                                  className="w-full pl-6 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                />
                              </div>
                            </div>

                            {/* Field 2: Reason (Optional) */}
                            <div>
                              <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase tracking-wider">Reason (Optional)</label>
                              <input
                                type="text"
                                placeholder="e.g. Booking Advance"
                                value={editPrepaidReason}
                                onChange={(e) => setEditPrepaidReason(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                              />
                            </div>

                            {/* Field 3: Date */}
                            <div>
                              <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase tracking-wider">Date</label>
                              <input
                                type="date"
                                value={editPrepaidDate}
                                onChange={(e) => setEditPrepaidDate(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                          </div>

                          {/* Field 4: GST No. */}
                          <div className="pt-1">
                            <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase tracking-wider">GST No. (Optional)</label>
                            <input
                              type="text"
                              placeholder="e.g. 07ABCDE1234F1Z5"
                              value={editGstin}
                              onChange={(e) => setEditGstin(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleSavePrepaidAdvance(cust)}
                              disabled={isSavingPrepaid}
                              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                            >
                              {isSavingPrepaid ? "Saving..." : "Save Customer Info"}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Detailed Advance Ledger</h4>
                          {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <FileText className="w-8 h-8 mb-2 opacity-30" />
                              <p className="text-xs font-semibold">No transactions recorded yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                              {history.slice().reverse().map((entry, i) => (
                                <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                  <div>
                                    <p className="text-xs font-bold text-slate-700">{entry.reason}</p>
                                    <p className="text-[10px] text-slate-400">{new Date(entry.date).toLocaleString('en-IN')}</p>
                                  </div>
                                  <div className={`font-mono font-bold text-xs ${entry.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {entry.amount > 0 ? '+' : ''}&#8377;{Math.abs(entry.amount)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW CUSTOMER */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Add New Customer</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomerSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Phone (10 digits) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={newCustomerForm.phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewCustomerForm(prev => ({ ...prev, phone: digitsOnly }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold font-mono outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">GST No. (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 07ABCDE1234F1Z5"
                  value={newCustomerForm.gstin}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, gstin: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">DOB (Optional)</label>
                  <input
                    type="date"
                    value={newCustomerForm.dob}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCustomer}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition-colors cursor-pointer"
                >
                  {isCreatingCustomer ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

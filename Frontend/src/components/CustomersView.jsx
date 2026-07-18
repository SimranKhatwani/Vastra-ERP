import React, { useState, useEffect } from "react";
import { Gift } from "lucide-react";

export const CustomersView = ({
  customers,
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

  useEffect(() => {
    const fetchLoyaltySettings = async () => {
      try {
        const res = await fetch("/api/customers/loyalty-settings", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await res.json();
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
      const res = await fetch("/api/customers/loyalty-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(loyaltySettings),
      });
      const data = await res.json();
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

  // CRM birthday check
  const birthdayReminders = customers.filter((c) => {
    if (!c.birthday) return false;
    const parts = new Date(c.birthday).toISOString().split("T")[0].split("-");
    const today = new Date();
    return parseInt(parts[1]) === today.getMonth() + 1 && parseInt(parts[2]) === today.getDate();
  });

  const activeCustomer =
    customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    const matchesMembership =
      membershipFilter === "All" || (c.tier || c.membership) === membershipFilter;
    return matchesSearch && matchesMembership;
  });

  const handleSettleCustomerSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomerId || settleAmount <= 0) return;

    if (activeCustomer.outstandingBalance < settleAmount) {
      onAddNotification(
        "CRM Ledger Alert",
        "Settlement exceeds total outstanding customer debt.",
        "warning",
      );
      return;
    }

    onSettleCustomerBalance(selectedCustomerId, settleAmount);
    onAddNotification(
      "Debt Ledger Restored",
      `Processed credit settlement of ₹${settleAmount.toLocaleString()} for ${activeCustomer.name}. Outstanding debt reduced.`,
      "success",
    );
    setSettleAmount(1000);
  };

  const handleTriggerBirthdayPromo = (cust) => {
    onAddNotification(
      "SMS Gateway Campaign",
      `Sent birthday SMS/WhatsApp promotion with 25% discount code (HBDFLOW) to ${cust.name} (${cust.phone}).`,
      "success",
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="customers-crm-root">
      {/* Birthday Reminders Alert Bar */}
      {birthdayReminders.length > 0 && (
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                Birthday Reminders Today
              </h4>
              <p className="text-[11px] text-rose-700">
                Send personalized coupon campaigns to increase loyalty traffic.
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
            {birthdayReminders.map((c) => (
              <button
                key={c.id}
                onClick={() => handleTriggerBirthdayPromo(c)}
                className="bg-white hover:bg-slate-50 border border-pink-300 text-pink-700 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Promo to {c.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("directory")}
          className={`py-2 px-4 text-xs font-bold transition-all ${
            activeTab === "directory"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Customer Directory
        </button>
        <button
          onClick={() => setActiveTab("loyalty_config")}
          className={`py-2 px-4 text-xs font-bold transition-all ${
            activeTab === "loyalty_config"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Loyalty Points Configuration
        </button>
      </div>

      {activeTab === "directory" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main CRM Ledger Table (Full Width) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-12">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                CRM Customer Loyalty Directory
              </h4>
              <p className="text-[10px] text-slate-400">
                Active records in database: {customers.length}
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search phone or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <select
                value={membershipFilter}
                onChange={(e) => setMembershipFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5"
              >
                <option value="All">All Tiers</option>
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Bronze">Bronze</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Contact Detail</th>
                  <th className="p-3.5 text-center font-mono">
                    Loyalty Points
                  </th>
                  <th className="p-3.5 text-right">Outstanding Balance</th>
                  <th className="p-3.5 text-right">Cumulative Spending</th>
                  <th className="p-3.5 text-center">Birthday Reminder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {filteredCustomers.map((cust, idx) => {
                  const tierValue = cust.tier || cust.membership || "Bronze";
                  const isBdayToday = cust.birthday
                    ? (() => { const d = new Date(cust.birthday); const t = new Date(); return d.getMonth() === t.getMonth() && d.getDate() === t.getDate(); })()
                    : false;
                  const tierColor =
                    tierValue === "Platinum"
                      ? "bg-slate-950 text-amber-400"
                      : tierValue === "Gold"
                        ? "bg-amber-100 text-amber-800"
                        : tierValue === "Silver"
                          ? "bg-slate-200 text-slate-700"
                          : "bg-slate-100 text-slate-700";
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 uppercase">
                            {cust.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">
                              {cust.name}
                            </p>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${tierColor}`}
                            >
                              {tierValue}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <p>{cust.phone}</p>
                        <p className="text-[10px] text-slate-400">
                          {cust.email}
                        </p>
                      </td>
                      <td className="p-3.5 text-center font-bold font-mono text-violet-600">
                        {cust.loyaltyPoints} LP
                      </td>
                      <td
                        className={`p-3.5 text-right font-mono font-bold ${cust.outstandingBalance > 0 ? "text-red-500" : "text-slate-400"}`}
                      >
                        ₹{cust.outstandingBalance.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-800">
                        ₹{cust.totalSpent.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        {isBdayToday ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-100 text-pink-700 animate-pulse">
                            <Gift className="w-3 h-3" />
                            <span>TODAY</span>
                          </span>
                        ) : cust.birthday ? (
                          <span className="text-slate-400 font-mono text-[10px]">
                            {new Date(cust.birthday).toLocaleDateString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

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
                    <tr className="border-b border-blue-100/50">
                      <td className="py-1">Bill Amount: ₹100</td>
                      <td className="py-1 font-bold">{(100 / (loyaltySettings.rupeesPerPoint || 1)).toFixed(0)} Points</td>
                    </tr>
                    <tr className="border-b border-blue-100/50">
                      <td className="py-1">Bill Amount: ₹500</td>
                      <td className="py-1 font-bold">{(500 / (loyaltySettings.rupeesPerPoint || 1)).toFixed(0)} Points</td>
                    </tr>
                    <tr className="border-b border-blue-100/50">
                      <td className="py-1">Bill Amount: ₹1,000</td>
                      <td className="py-1 font-bold">{(1000 / (loyaltySettings.rupeesPerPoint || 1)).toFixed(0)} Points</td>
                    </tr>
                    <tr>
                      <td className="py-1">Bill Amount: ₹5,000</td>
                      <td className="py-1 font-bold">{(5000 / (loyaltySettings.rupeesPerPoint || 1)).toFixed(0)} Points</td>
                    </tr>
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
  );
};

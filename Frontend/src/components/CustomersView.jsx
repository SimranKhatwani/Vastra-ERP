import React, { useState } from "react";
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

  // CRM birthday check for Today (June 28, 2026)
  const birthdayReminders = customers.filter((c) => {
    const parts = c.birthday.split("-");
    return parts[1] === "06" && parts[2] === "28";
  });

  const activeCustomer =
    customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    const matchesMembership =
      membershipFilter === "All" || c.membership === membershipFilter;
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

      {/* Main CRM Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: CRM Controls & Settle Outstanding */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:col-span-4 space-y-4 text-xs">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Settle Credit Outstanding
          </h4>
          <form onSubmit={handleSettleCustomerSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Select Customer Debt Account
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  const matched = customers.find(
                    (c) => c.id === e.target.value,
                  );
                  if (matched) setSettleAmount(matched.outstandingBalance);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Outstanding: ₹{c.outstandingBalance})
                  </option>
                ))}
              </select>
            </div>

            {activeCustomer && (
              <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 border border-slate-100 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Membership Tier:</span>
                  <span className="text-indigo-600 font-bold uppercase">
                    {activeCustomer.membership}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Spent:</span>
                  <span>₹{activeCustomer.totalSpent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Outstanding Debt:</span>
                  <span className="text-red-500 font-bold">
                    ₹{activeCustomer.outstandingBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Payment Amount Settle (₹)
              </label>
              <input
                type="number"
                value={settleAmount || ""}
                onChange={(e) =>
                  setSettleAmount(Math.max(0, Number(e.target.value)))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-md"
            >
              Process Debt Settlement
            </button>
          </form>
        </div>

        {/* Right Column: CRM Ledger Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-8">
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
                {filteredCustomers.slice(0, 10).map((cust, idx) => {
                  const isBdayToday = cust.birthday.endsWith("06-28");
                  const tierColor =
                    cust.membership === "Platinum"
                      ? "bg-slate-950 text-amber-400"
                      : cust.membership === "Gold"
                        ? "bg-amber-100 text-amber-800"
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
                              {cust.membership}
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
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">
                            {cust.birthday}
                          </span>
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
    </div>
  );
};

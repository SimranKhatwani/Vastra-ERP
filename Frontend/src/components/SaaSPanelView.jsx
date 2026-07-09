import React, { useState } from "react";
import { Building2, Coins, LifeBuoy, Users, CheckCircle } from "lucide-react";

export const SaaSPanelView = ({
  tenants,
  supportTickets,
  onResolveTicket,
  onAddNotification,
}) => {
  const [activeTab, setActiveTab] = useState("companies");

  const handleResolveTicketSubmit = (ticketId) => {
    onResolveTicket(ticketId);
    onAddNotification(
      "SaaS Support Center",
      `Ticket Resolved: Notified tenant admins of ESC/POS drawer firmware resolution code.`,
      "success",
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="saas-panel-root">
      {/* SaaS Summary statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
        <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center border border-slate-800">
          <div>
            <span className="text-slate-400 uppercase block mb-1">
              Total SaaS Tenants
            </span>
            <span className="text-xl font-bold">
              {tenants.length} companies
            </span>
          </div>
          <Building2 className="w-5 h-5 text-indigo-400" />
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center border border-slate-800">
          <div>
            <span className="text-slate-400 uppercase block mb-1">
              Active Users
            </span>
            <span className="text-xl font-bold">
              {tenants.reduce((sum, t) => sum + t.activeUsers, 0)} users
            </span>
          </div>
          <Users className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center border border-slate-800">
          <div>
            <span className="text-slate-400 uppercase block mb-1">
              Platform MRR (June)
            </span>
            <span className="text-xl font-bold">₹12,45,000</span>
          </div>
          <Coins className="w-5 h-5 text-amber-400" />
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center border border-slate-800">
          <div>
            <span className="text-slate-400 uppercase block mb-1">
              Unresolved Tickets
            </span>
            <span className="text-xl font-bold text-rose-400">
              {supportTickets.filter((t) => t.status !== "Resolved").length}{" "}
              alerts
            </span>
          </div>
          <LifeBuoy className="w-5 h-5 text-rose-400 animate-pulse" />
        </div>
      </div>

      {/* Roster Controls tabs */}
      <div className="flex border-b border-slate-100 pb-3">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("companies")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "companies" ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            Tenant Enterprises
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "plans" ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            Subscription Pricing Grid
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "tickets" ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            Support Tickets Center
          </button>
        </div>
      </div>

      {/* COMPANiES / TENANTS */}
      {activeTab === "companies" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Registered Multitenant Company Spaces
            </h4>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                  <th className="p-3.5">Company Tenant Name</th>
                  <th className="p-3.5">Admin Email</th>
                  <th className="p-3.5">Assigned Plan</th>
                  <th className="p-3.5 text-center">Active Seats</th>
                  <th className="p-3.5 font-mono text-right">
                    API Calls (Month)
                  </th>
                  <th className="p-3.5 text-center">Billing Cycle</th>
                  <th className="p-3.5 text-center">Tenant Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {tenants.map((ten, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-800">
                      {ten.name}
                    </td>
                    <td className="p-3.5">{ten.email}</td>
                    <td className="p-3.5 font-mono">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                        {ten.plan}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold font-mono">
                      {ten.activeUsers} / 50
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                      {ten.apiCalls.toLocaleString()} calls
                    </td>
                    <td className="p-3.5 text-center">{ten.billingCycle}</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${ten.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
                      >
                        {ten.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PLANS PRICING GRID */}
      {activeTab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {[
            {
              name: "Free Trial",
              price: "₹0",
              cycle: "/14 days",
              storage: "200 MB",
              api: "1,000 requests",
              seats: "2 users",
              features: [
                "POS Billing",
                "HTML Receipt Downloads",
                "Local Persistence",
              ],
            },
            {
              name: "Starter",
              price: "₹2,499",
              cycle: "/month",
              storage: "2 GB",
              api: "50,000 requests",
              seats: "5 users",
              features: [
                "POS Billing",
                "HTML Receipt Downloads",
                "Custom Articulations",
                "CRM Loyalty Ledgers",
              ],
            },
            {
              name: "Professional",
              price: "₹5,999",
              cycle: "/month",
              storage: "10 GB",
              api: "2,50,000 requests",
              seats: "25 users",
              features: [
                "Everything in Starter",
                "Bulk Markdown Engines",
                "Corporate Cashbooks",
                "API keys developer tools",
              ],
            },
            {
              name: "Enterprise",
              price: "₹14,999",
              cycle: "/month",
              storage: "Unlimited",
              api: "Unlimited requests",
              seats: "100 users",
              features: [
                "Everything in Professional",
                "Custom Sync Channels",
                "Multi-Warehouse Transfers",
                "Biometric HR Clock IN",
                "Super Admin resolution matrices",
              ],
            },
          ].map((plan, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-500 font-bold block uppercase tracking-wide w-fit">
                  {plan.name}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-800 font-sans">
                    {plan.price}
                  </span>
                  <span className="text-slate-400">{plan.cycle}</span>
                </div>
                <div className="space-y-1 font-mono text-[10px] text-slate-500 border-t border-slate-100 pt-3">
                  <p>
                    Storage: <b>{plan.storage}</b>
                  </p>
                  <p>
                    API Limit: <b>{plan.api}</b>
                  </p>
                  <p>
                    User Seats: <b>{plan.seats}</b>
                  </p>
                </div>
              </div>

              <div className="space-y-1 border-t border-slate-100 pt-3">
                <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">
                  Included Features:
                </span>
                {plan.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 text-slate-600 font-semibold text-[10px]"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <button className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all text-[11px] cursor-pointer">
                Select Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TICKETS CENTER */}
      {activeTab === "tickets" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Multi-Tenant Support Queue
            </h4>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                  <th className="p-3.5">Client Tenant</th>
                  <th className="p-3.5">Ticket Subject Matter</th>
                  <th className="p-3.5 font-mono">Date Raised</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {supportTickets.map((tk, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-800">
                      {tk.tenantName}
                    </td>
                    <td className="p-3.5 max-w-sm truncate">{tk.subject}</td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {tk.date}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tk.priority === "Urgent" ? "bg-red-100 text-red-600" : tk.priority === "High" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {tk.priority}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${tk.status === "Resolved" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                      >
                        {tk.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {tk.status !== "Resolved" ? (
                        <button
                          onClick={() => handleResolveTicketSubmit(tk.id)}
                          className="text-indigo-600 hover:underline text-xs font-semibold cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">
                          ✓ Cleared
                        </span>
                      )}
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

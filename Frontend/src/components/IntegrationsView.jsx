import React, { useState } from "react";
import { Globe } from "lucide-react";

export const IntegrationsView = ({ onAddNotification }) => {
  const [integrations, setIntegrations] = useState([
    {
      id: "i-1",
      name: "Shopify Storefront Sync",
      type: "E-Commerce",
      logo: "S",
      connected: true,
      commission: 1.5,
      revenue: 350000,
      desc: "Sync custom physical inventories directly to Shopify storefront stock listings.",
    },
    {
      id: "i-2",
      name: "Razorpay Gateway",
      type: "Payments PG",
      logo: "R",
      connected: true,
      commission: 2.0,
      revenue: 120000,
      desc: "Accept direct credit cards, debit cards, UPI, and split net banking transfers in checkout lines.",
    },
    {
      id: "i-3",
      name: "Delhivery Shipping",
      type: "Logistics Courier",
      logo: "D",
      connected: false,
      commission: 0.5,
      revenue: 0,
      desc: "Automate tracking slips generation, forward bookings, and courier handovers.",
    },
    {
      id: "i-4",
      name: "Tally Accounting Sync",
      type: "Enterprise ERP",
      logo: "T",
      connected: false,
      commission: 1.0,
      revenue: 0,
      desc: "Reconcile day-end ledger cashbooks directly into corporate Tally books.",
    },
  ]);

  const toggleConnection = (id, name, currentState) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, connected: !item.connected } : item,
      ),
    );

    onAddNotification(
      "Integrations Controller",
      currentState
        ? `Severed active synchronization hooks for ${name}.`
        : `Established secure REST hooks for ${name}.`,
      currentState ? "warning" : "success",
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="integrations-root">
      {/* Overview */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Globe className="w-4 h-4 text-indigo-600" />
          <span>SaaS Extension Marketplace</span>
        </h3>
        <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
          Unlock commercial SaaS potentials by bridging your GarmentFlow ERP
          directly to global e-commerce systems, logistics couriers, and
          payments gateways.
        </p>
      </div>

      {/* Grid of integrations cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base font-mono">
                    {item.logo}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {item.name}
                    </h4>
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.2 rounded text-[9px] font-bold font-mono uppercase">
                      {item.type}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${item.connected ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"}`}
                >
                  {item.connected ? "Active Sync" : "Offline"}
                </span>
              </div>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                {item.desc}
              </p>
            </div>

            {/* Integration partner financial splits */}
            {item.connected && (
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Commission rate
                  </span>
                  <span className="font-bold text-slate-700">
                    {item.commission}% split
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Revenue routed
                  </span>
                  <span className="font-bold text-indigo-600">
                    ₹{item.revenue.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() =>
                toggleConnection(item.id, item.name, item.connected)
              }
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${item.connected ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-slate-900 text-white hover:bg-slate-800"}`}
            >
              {item.connected
                ? "Disconnect Sync Link"
                : "Connect ExtensionsREST"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

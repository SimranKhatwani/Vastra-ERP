import React, { useState } from "react";
import { Building, Database, Save, RefreshCw, Lock } from "lucide-react";

export const SettingsView = ({ onAddNotification }) => {
  const [activeTab, setActiveTab] = useState("profile");

  // Company details
  const [companyName, setCompanyName] = useState("Vastra ERP");
  const [companyAddress, setCompanyAddress] = useState(
    "202-205, Linking Road, Santacruz West, Mumbai, MH - 400054",
  );
  const [companyGstin, setCompanyGstin] = useState("27AAAAA1111A1Z1");
  const [companyContact, setCompanyContact] = useState("+91 98765 43210");

  // RBAC permissions state (fully interactive!)
  const [permissions, setPermissions] = useState([
    {
      role: "Super Admin",
      billing: true,
      stockAdjust: true,
      priceEdit: true,
      hrPayroll: true,
      apiDev: true,
    },
    {
      role: "Store Manager",
      billing: true,
      stockAdjust: true,
      priceEdit: true,
      hrPayroll: false,
      apiDev: false,
    },
    {
      role: "Salesperson",
      billing: true,
      stockAdjust: false,
      priceEdit: false,
      hrPayroll: false,
      apiDev: false,
    },
    {
      role: "Tailor Customizer",
      billing: false,
      stockAdjust: true,
      priceEdit: false,
      hrPayroll: false,
      apiDev: false,
    },
  ]);

  const togglePermission = (idx, field) => {
    setPermissions((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: !p[field] } : p)),
    );
    onAddNotification(
      "RBAC Matrix Changed",
      `Altered system clearance privileges for ${permissions[idx].role}.`,
      "warning",
    );
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    onAddNotification(
      "System Configuration",
      "Successfully updated corporate profile credentials across all outlets.",
      "success",
    );
  };

  const handleBackupDb = () => {
    onAddNotification(
      "Database Core Backup",
      "Dumping cloud tables schemas...",
      "info",
    );
    setTimeout(() => {
      onAddNotification(
        "Database Saved",
        "Backup vastra_erp_db_snap_20260628.sql compiled. Size: 418 MB.",
        "success",
      );
    }, 1000);
  };

  const handleRestoreDb = () => {
    onAddNotification(
      "Cloud Restore",
      "Verifying integrity of last storage snapshot...",
      "info",
    );
    setTimeout(() => {
      onAddNotification(
        "Database Restored",
        "Durable tables synced. Cleaned 0 invalid cache files.",
        "success",
      );
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="settings-root">
      {/* Sub tabs selectors */}
      <div className="flex border-b border-slate-100 pb-3">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "profile" ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            Company Profile & GSTIN
          </button>
          <button
            onClick={() => setActiveTab("rbac")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "rbac" ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            RBAC Clearance Matrix
          </button>
          <button
            onClick={() => setActiveTab("backups")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "backups" ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            Database Backups
          </button>
        </div>
      </div>

      {/* TAB: PROFILE */}
      {activeTab === "profile" && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 text-xs"
        >
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Corporate Identity Credentials</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Registered Company Name
              </label>
              <input
                required
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                National GSTIN Code *
              </label>
              <input
                required
                type="text"
                value={companyGstin}
                onChange={(e) => setCompanyGstin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-mono uppercase font-bold text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-semibold">
                HQ Address
              </label>
              <input
                required
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Billing Support Phone
              </label>
              <input
                required
                type="tel"
                pattern="\d{10}"
                maxLength={10}
                value={companyContact}
                onChange={(e) => setCompanyContact(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Currency Denomination
              </label>
              <select className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-bold text-slate-700">
                <option value="INR">INR (₹) - Indian Rupee</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Parameters</span>
          </button>
        </form>
      )}

      {/* TAB: RBAC CLEARANCES */}
      {activeTab === "rbac" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Role-Based Access Matrix (RBAC)
            </h4>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-md font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Durable Session Lockout Active</span>
            </span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left font-semibold">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                  <th className="p-3.5">System Staff Role</th>
                  <th className="p-3.5 text-center">POS Billing</th>
                  <th className="p-3.5 text-center">Stock Correction</th>
                  <th className="p-3.5 text-center">Price Override</th>
                  <th className="p-3.5 text-center">HR Payroll</th>
                  <th className="p-3.5 text-center">API Keys</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {permissions.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-800">{p.role}</td>

                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={p.billing}
                        onChange={() => togglePermission(idx, "billing")}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>

                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={p.stockAdjust}
                        onChange={() => togglePermission(idx, "stockAdjust")}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>

                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={p.priceEdit}
                        onChange={() => togglePermission(idx, "priceEdit")}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>

                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={p.hrPayroll}
                        onChange={() => togglePermission(idx, "hrPayroll")}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>

                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={p.apiDev}
                        onChange={() => togglePermission(idx, "apiDev")}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: BACKUPS */}
      {activeTab === "backups" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Encrypted Disaster Recovery Backup</span>
          </h4>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Download point-in-time binary dumps containing full customer CRM
            accounts, wholesale purchase pipelines, bespoke measurements
            databases, and billing transaction sequences to secure offline-ready
            archives.
          </p>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleBackupDb}
              className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Compile Live Backup Snap</span>
            </button>
            <button
              type="button"
              onClick={handleRestoreDb}
              className="border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
            >
              Restore Last Valid Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

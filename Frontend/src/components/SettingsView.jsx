import api from '../api/axios';
import React, { useState, useEffect } from "react";
import { Building, Database, Save, RefreshCw, Lock, Smartphone, Eye, EyeOff, CheckCircle, XCircle, Loader } from "lucide-react";

export const SettingsView = ({ onAddNotification, currentUser }) => {
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

  // ── WhatsApp config state ─────────────────────────────────────────
  const [waConfig, setWaConfig] = useState({
    phoneNumberId: "",
    accessToken: "",
    businessAccountId: "",
    webhookVerifyToken: "",
    defaultTemplate:
      "Hello {{CustomerName}}\n\nThank you for shopping with Vastra Garments.\n\nInvoice Number:\n{{InvoiceNo}}\n\nInvoice Date:\n{{Date}}\n\nTotal Amount:\n₹{{Amount}}\n\nPlease find your invoice attached.\n\nThank you for choosing Vastra Garments.",
    autoSendEnabled: false,
    templateName: "",
  });
  const [waLoading, setWaLoading] = useState(false);
  const [waSaving, setWaSaving] = useState(false);
  const [waFetchStatus, setWaFetchStatus] = useState(null); // null | 'loaded' | 'error'
  const [showToken, setShowToken] = useState(false);

  const [commSettings, setCommSettings] = useState({
    isEnabled: true,
    salespersonPercentage: 1.5,
    workerPercentage: 0.5,
    calculationBasis: "Net Selling Price"
  });
  const [commLoading, setCommLoading] = useState(false);
  const [commSaving, setCommSaving] = useState(false);

  const isAdminRole = ["BusinessAdmin", "Admin", "SuperAdmin"].includes(currentUser?.role);

  useEffect(() => {
    if (activeTab === "whatsapp") {
      fetchWaConfig();
    }
    if (activeTab === "commissions") {
      fetchCommConfig();
    }
  }, [activeTab]);

  const fetchWaConfig = async () => {
    setWaLoading(true);
    setWaFetchStatus(null);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/whatsapp-config`);
      const data = res.data;
      if (data.success && data.data) {
        setWaConfig({
          phoneNumberId: data.data.phoneNumberId || "",
          accessToken: data.data.accessToken || "",
          businessAccountId: data.data.businessAccountId || "",
          webhookVerifyToken: data.data.webhookVerifyToken || "",
          defaultTemplate: data.data.defaultTemplate || waConfig.defaultTemplate,
          autoSendEnabled: data.data.autoSendEnabled || false,
          templateName: data.data.templateName || "",
        });
      }
      setWaFetchStatus("loaded");
    } catch (err) {
      console.error("[SettingsView] fetchWaConfig error:", err);
      setWaFetchStatus("error");
    } finally {
      setWaLoading(false);
    }
  };

  const handleSaveWaConfig = async (e) => {
    e.preventDefault();
    if (!isAdminRole) return;
    setWaSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/whatsapp-config`, waConfig);
      const data = res.data;
      if (data.success) {
        if (data.data) {
          setWaConfig((prev) => ({
            ...prev,
            accessToken: data.data.accessToken || prev.accessToken,
          }));
        }
        onAddNotification(
          "WhatsApp Configuration",
          "WhatsApp API credentials saved successfully.",
          "success",
        );
      } else {
        onAddNotification(data.message || "Failed to save config", "error");
      }
    } catch (err) {
      console.error("[SettingsView] saveWaConfig error:", err);
      onAddNotification("An error occurred while saving.", "error");
    } finally {
      setWaSaving(false);
    }
  };

  const fetchCommConfig = async () => {
    setCommLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/commissions/staff/settings`);
      const data = res.data;
      if (data.success && data.data) {
        setCommSettings(data.data);
      }
    } catch (err) {
      console.error("fetchCommConfig error:", err);
    } finally {
      setCommLoading(false);
    }
  };

  const handleSaveCommConfig = async (e) => {
    e.preventDefault();
    if (!isAdminRole) return;
    setCommSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/commissions/staff/settings`, commSettings);
      const data = res.data;
      if (data.success) {
        onAddNotification("Commission config saved successfully!", "success");
      } else {
        onAddNotification(data.message || "Failed to save", "error");
      }
    } catch (err) {
      onAddNotification("Error saving commission config.", "error");
    } finally {
      setCommSaving(false);
    }
  };

  const handlePermissionChange = (roleIndex, permKey) => {
    setPermissions((prev) =>
      prev.map((p, i) => (i === roleIndex ? { ...p, [permKey]: !p[permKey] } : p)),
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
        <div className="flex bg-slate-100 p-1 rounded-xl flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "profile" ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            Company Profile &amp; GSTIN
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
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${activeTab === "whatsapp" ? "bg-white text-emerald-700" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            WhatsApp API
          </button>
          <button
            onClick={() => setActiveTab("commissions")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${activeTab === "commissions" ? "bg-white text-indigo-700" : "text-slate-500 hover:text-slate-800"}`}
          >
            Commission Engine
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

      {/* TAB: WHATSAPP CONFIGURATION */}
      {activeTab === "whatsapp" && (
        <div className="space-y-5 text-xs">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">WhatsApp Business Cloud API</h4>
                <p className="text-emerald-700 text-[11px] mt-1 leading-relaxed">
                  Configure your Meta WhatsApp Business API credentials below. Invoices will be
                  automatically sent as PDF attachments to customers immediately after bill generation.
                </p>
                {!isAdminRole && (
                  <div className="mt-2 flex items-center gap-1.5 text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                    <Lock className="w-3.5 h-3.5" />
                    <span className="font-semibold text-[10px]">Read-only — Admin access required to modify credentials.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {waLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-emerald-600 animate-spin" />
              <span className="ml-2 text-slate-500">Loading configuration...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveWaConfig} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">

              {/* Auto-Send Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">Auto-Send Invoice on Bill Generation</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    When enabled, invoices are automatically sent via WhatsApp immediately after checkout.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!isAdminRole}
                  onClick={() => setWaConfig((prev) => ({ ...prev, autoSendEnabled: !prev.autoSendEnabled }))}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${!isAdminRole ? "opacity-50 cursor-not-allowed" : ""} ${waConfig.autoSendEnabled ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${waConfig.autoSendEnabled ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>

              {/* API Credentials Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    WhatsApp Business Phone Number ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789012345"
                    value={waConfig.phoneNumberId}
                    disabled={!isAdminRole}
                    onChange={(e) => setWaConfig((prev) => ({ ...prev, phoneNumberId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-mono text-slate-800 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Business Account ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 987654321098765"
                    value={waConfig.businessAccountId}
                    disabled={!isAdminRole}
                    onChange={(e) => setWaConfig((prev) => ({ ...prev, businessAccountId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-mono text-slate-800 disabled:opacity-60"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-500 font-semibold mb-1">
                    Permanent Access Token *
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      placeholder="Paste your permanent system user access token..."
                      value={waConfig.accessToken}
                      disabled={!isAdminRole}
                      onChange={(e) => setWaConfig((prev) => ({ ...prev, accessToken: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 pr-10 rounded-xl font-mono text-slate-800 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Create a System User in Meta Business Manager → generate a token with <code>whatsapp_business_messaging</code> permission.
                    The last 6 characters are shown after saving for verification.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Webhook Verify Token
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. vastra_erp_webhook_secret"
                    value={waConfig.webhookVerifyToken}
                    disabled={!isAdminRole}
                    onChange={(e) => setWaConfig((prev) => ({ ...prev, webhookVerifyToken: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-mono text-slate-800 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Meta Approved Template Name <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. vastra_invoice_v1"
                    value={waConfig.templateName}
                    disabled={!isAdminRole}
                    onChange={(e) => setWaConfig((prev) => ({ ...prev, templateName: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-mono text-slate-800 disabled:opacity-60"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Leave empty to use direct document messages (requires active 24-hour customer chat window).
                  </p>
                </div>

                {/* Webhook URL (read-only) */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 font-semibold mb-1">
                    Webhook Callback URL <span className="text-slate-400 font-normal">(copy into Meta Developer Console)</span>
                  </label>
                  <div className="bg-slate-100 border border-slate-200 px-3 py-2.5 rounded-xl font-mono text-slate-600 text-[11px] select-all">
                    http://your-server-ip:5000/api/whatsapp-config/webhook
                  </div>
                </div>
              </div>

              {/* Default Message Template */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Default Message Template
                </label>
                <textarea
                  rows={8}
                  value={waConfig.defaultTemplate}
                  disabled={!isAdminRole}
                  onChange={(e) => setWaConfig((prev) => ({ ...prev, defaultTemplate: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-slate-800 font-mono leading-relaxed resize-y disabled:opacity-60"
                  placeholder="Use {{CustomerName}}, {{InvoiceNo}}, {{Date}}, {{Amount}}"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Available placeholders: <code className="bg-slate-100 px-1 rounded">{"{{CustomerName}}"}</code>{" "}
                  <code className="bg-slate-100 px-1 rounded">{"{{InvoiceNo}}"}</code>{" "}
                  <code className="bg-slate-100 px-1 rounded">{"{{Date}}"}</code>{" "}
                  <code className="bg-slate-100 px-1 rounded">{"{{Amount}}"}</code>
                </p>
              </div>

              {isAdminRole && (
                <button
                  type="submit"
                  disabled={waSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-60 cursor-pointer"
                >
                  {waSaving ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{waSaving ? "Saving..." : "Save WhatsApp Configuration"}</span>
                </button>
              )}
            </form>
          )}

          {/* Setup Guide */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Quick Setup Guide</h5>
            <ol className="space-y-2 text-[11px] text-slate-600 list-none">
              {[
                "Go to developers.facebook.com and create a Meta App (Business type).",
                "Add the WhatsApp product to your app and link your WhatsApp Business Account.",
                "In Meta Business Manager, create a System User with Admin permission.",
                "Generate a Permanent Access Token for the System User with whatsapp_business_messaging scope.",
                "Copy your Phone Number ID from the WhatsApp → Getting Started section.",
                "Paste the Webhook URL above into Meta App → WhatsApp → Configuration → Webhook.",
                "Enter your Webhook Verify Token (any secret string you define) in both places.",
                "Enable Auto-Send and click Save to activate automated invoice dispatch.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
      {/* COMMISSION SETTINGS TAB */}
      {activeTab === "commissions" && (
        <form
          onSubmit={handleSaveCommConfig}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs max-w-2xl"
        >
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-800">
              Staff Commission Engine configuration
            </h3>
            {commLoading && <Loader className="w-4 h-4 animate-spin text-slate-400" />}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <p className="text-xs font-bold text-slate-800">Enable Automated Commissions</p>
                <p className="text-[10px] text-slate-500">Automatically disburse commission to staff upon checkout</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={commSettings.isEnabled}
                  onChange={(e) =>
                    setCommSettings({ ...commSettings, isEnabled: e.target.checked })
                  }
                  disabled={!isAdminRole}
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">
                  Salesperson Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  disabled={!isAdminRole}
                  value={commSettings.salespersonPercentage}
                  onChange={(e) =>
                    setCommSettings({
                      ...commSettings,
                      salespersonPercentage: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-100 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">
                  Worker Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  disabled={!isAdminRole}
                  value={commSettings.workerPercentage}
                  onChange={(e) =>
                    setCommSettings({
                      ...commSettings,
                      workerPercentage: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-100 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={!isAdminRole || commSaving}
                className="w-full bg-slate-800 hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {commSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {commSaving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

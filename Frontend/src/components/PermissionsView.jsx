import api from '../api/axios';
import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Eye,
  Edit3,
  CheckCircle2,
  XCircle,
  Users,
  Sliders,
  RotateCcw,
  Save,
  Search,
  Scissors,
  DollarSign,
  ShoppingBag,
  Layers,
  Clock,
  BarChart3,
  Settings,
  Briefcase,
  Shield,
  User
} from "lucide-react";

export const PermissionsView = ({
  currentUser = {},
  onAddNotification,
  onPermissionsUpdated
}) => {
  // Roles Registry
  const rolesList = [
    { id: "admin", label: "Admin", badge: "Full System Access", color: "bg-purple-100 text-purple-800 border-purple-200" },
    { id: "worker", label: "Worker", badge: "Production & Floor Worker", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    { id: "cashier", label: "Cashier", badge: "POS Front Desk", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    { id: "salesperson", label: "Salesperson", badge: "Sales Portal", color: "bg-amber-100 text-amber-800 border-amber-200" },
    { id: "tailor", label: "Tailor", badge: "Garment Fitting", color: "bg-rose-100 text-rose-800 border-rose-200" },
    { id: "accountant", label: "Accountant", badge: "Financial Ledger", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  ];

  // Core Modules Registry
  const modulesRegistry = [
    { id: "dashboard", name: "Overview Dashboard", category: "Core Operations", icon: Layers, desc: "Main system metrics, sales widgets & operational overview" },
    { id: "billing", name: "POS Billing & Invoicing", category: "Sales & Billing", icon: ShoppingBag, desc: "POS cart checkout, barcode billing & receipt processing" },
    { id: "billing-sales", name: "Billing & Sales Management", category: "Sales & Billing", icon: ShoppingBag, desc: "Comprehensive billing records, invoice tracking & sales management" },
    { id: "articulation", name: "Tailoring & Alterations Studio", category: "Garment Fitting", icon: Scissors, desc: "Alteration job tickets, tailor tracking & pickup notifications" },
    { id: "products", name: "Products & Garment Catalog", category: "Inventory", icon: Layers, desc: "Garment product items, prices, MRP, sizes & categories" },
    { id: "inventory", name: "Inventory Stock Control", category: "Inventory", icon: Layers, desc: "Adjust stock levels, warehouse counts & low stock alerts" },
    { id: "purchase", name: "Purchase & Vendor Orders", category: "Procurement", icon: Briefcase, desc: "Supplier invoices, GRNs & vendor outstanding ledgers" },
    { id: "vendor-communication", name: "Vendor Communication Card", category: "Procurement", icon: Briefcase, desc: "Vendor relationship hub, documents, timeline & follow-ups" },
    { id: "financial-management", name: "Financial Analytics & Expenses", category: "Finance", icon: DollarSign, desc: "Revenue vs expenses, profit margins & financial ledgers" },
    { id: "customers", name: "CRM & Customer Directory", category: "CRM", icon: Users, desc: "Customer phone directory, credit balance & loyalty points" },
    { id: "employees", name: "Employee Directory & Roster", category: "HR & Payroll", icon: User, desc: "Staff profiles, commissions earned & payroll ledgers" },
    { id: "attendance-dashboard", name: "Attendance & Shift Records", category: "HR & Payroll", icon: Clock, desc: "Punch-in/out logs, shift turnout rate & manager review" },
    { id: "reports", name: "Reports & Business Intelligence", category: "Analytics", icon: BarChart3, desc: "Executive reports, exportable BI charts & audit logs" },
    { id: "permissions", name: "Permissions & Role Access", category: "System Admin", icon: ShieldCheck, desc: "Manage role-based permission matrices" },
    { id: "settings", name: "System & Store Configurations", category: "System Admin", icon: Settings, desc: "Store profile, tax rules & printer receipt settings" }
  ];

  // Sub-Tab & Feature Actions Granular Registry
  const granularPermissions = [
    // Tailoring Sub-Tabs
    { key: "articulation_dashboard", module: "articulation", category: "Tailoring Studio Tabs", label: "Alteration Dashboard Tab", desc: "View and filter active alteration tickets" },
    { key: "articulation_reports", module: "articulation", category: "Tailoring Studio Tabs", label: "Alteration Reports Tab", desc: "View BI analytics, delayed audit logs & category charts" },
    { key: "articulation_tracking", module: "articulation", category: "Tailoring Studio Tabs", label: "Employee Workload Tracking Tab", desc: "View tailor capacity & productivity cards" },
    { key: "whatsapp_send", module: "articulation", category: "Tailoring Studio Actions", label: "Send WhatsApp Notifications", desc: "Trigger customer WhatsApp alert modals" },

    // POS Billing Actions
    { key: "billing_new_bill", module: "billing", category: "POS Billing Toolbar", label: "NEW BILL Toolbar Tab", desc: "Create a fresh POS billing cart" },
    { key: "billing_prev_next", module: "billing", category: "POS Billing Toolbar", label: "PREVIOUS / NEXT BILL Navigation", desc: "Navigate past POS invoices" },
    { key: "billing_modify_bill", module: "billing", category: "POS Billing Toolbar", label: "MODIFY BILL Toolbar Tab", desc: "Modify or void existing POS invoices" },
    { key: "apply_discounts", module: "billing", category: "POS Billing Actions", label: "Apply Custom Discounts", desc: "Override price or apply manual coupon codes" },

    // Financials & Exporting Actions
    { key: "export_csv", module: "reports", category: "Export Actions", label: "Export CSV Reports", desc: "Export sales, financial, and alteration CSV files" },
  ];

  // Selected Role State
  const [selectedRole, setSelectedRole] = useState("manager");
  const [filterQuery, setFilterQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Permissions Matrix State from API / LocalStorage
  const [permissionMatrix, setPermissionMatrix] = useState({});
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Fetch permissions matrix directly from MongoDB API
  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/permissions`);
      const data = res.data;
      if (data.success && data.data) {
        setPermissionMatrix(data.data);
      }
    } catch (err) {
      console.warn("Backend permissions sync error:", err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const currentRoleKey = useMemo(() => selectedRole.toLowerCase(), [selectedRole]);

  // Active configuration for selected role
  const activeConfig = useMemo(() => {
    if (permissionMatrix[currentRoleKey]) {
      return permissionMatrix[currentRoleKey];
    }
    return {
      allowedModules: ["dashboard", "billing", "articulation", "products", "customers"],
      moduleAccessLevels: {},
      tabPermissions: {}
    };
  }, [permissionMatrix, currentRoleKey]);

  // Helper to resolve 3-level permission for a module
  // Returns: 'NO_ACCESS' | 'VIEW_ONLY' | 'FULL_CONTROL'
  const getModuleAccessLevel = (moduleId) => {
    const levelsMap = activeConfig.moduleAccessLevels || {};
    if (levelsMap[moduleId]) return levelsMap[moduleId];
    
    const allowed = (activeConfig.allowedModules || []).includes(moduleId);
    return allowed ? 'FULL_CONTROL' : 'NO_ACCESS';
  };

  // Helper to resolve 3-level permission for a sub-tab / action
  const getTabAccessLevel = (tabKey) => {
    const tabsMap = activeConfig.tabPermissions || {};
    const val = tabsMap[tabKey];
    if (val === 'VIEW_ONLY' || val === 'FULL_CONTROL' || val === 'NO_ACCESS') {
      return val;
    }
    if (val === true) return 'FULL_CONTROL';
    if (val === false) return 'NO_ACCESS';
    return 'NO_ACCESS';
  };

  // Update Module Access Level
  const setModuleAccessLevel = (moduleId, level) => {
    const currentModules = [...(activeConfig.allowedModules || [])];
    let updatedModules = currentModules;

    if (level === 'NO_ACCESS') {
      updatedModules = currentModules.filter(m => m !== moduleId);
    } else if (!currentModules.includes(moduleId)) {
      updatedModules.push(moduleId);
    }

    const currentLevels = { ...(activeConfig.moduleAccessLevels || {}) };
    currentLevels[moduleId] = level;

    setPermissionMatrix((prev) => ({
      ...prev,
      [currentRoleKey]: {
        ...prev[currentRoleKey],
        allowedModules: updatedModules,
        moduleAccessLevels: currentLevels,
        tabPermissions: activeConfig.tabPermissions || {}
      }
    }));
  };

  // Update Sub-Tab Access Level
  const setTabAccessLevel = (tabKey, level) => {
    const currentTabs = { ...(activeConfig.tabPermissions || {}) };
    currentTabs[tabKey] = level;

    setPermissionMatrix((prev) => ({
      ...prev,
      [currentRoleKey]: {
        ...prev[currentRoleKey],
        allowedModules: activeConfig.allowedModules || [],
        moduleAccessLevels: activeConfig.moduleAccessLevels || {},
        tabPermissions: currentTabs
      }
    }));
  };

  // Save Permissions to MongoDB API
  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    
    const roleConfig = permissionMatrix[currentRoleKey] || activeConfig;

    try {
      const token = localStorage.getItem("token");
      const bodyPayload = {
        role: currentRoleKey,
        employeeId: null,
        allowedModules: roleConfig.allowedModules || [],
        moduleAccessLevels: roleConfig.moduleAccessLevels || {},
        tabPermissions: roleConfig.tabPermissions || {}
      };

      const res = await api.put(`/permissions`, bodyPayload);
      const data = res.data;

      if (data.success) {
        await fetchPermissions();
        if (onAddNotification) {
          onAddNotification(
            "Permissions Saved to MongoDB",
            `Access matrix updated in database for role: ${selectedRole.toUpperCase()}.`,
            "success"
          );
        }
      } else {
        if (onAddNotification) {
          onAddNotification(
            "Save Failed",
            data.message || "Failed to update permissions in database.",
            "danger"
          );
        }
      }
    } catch (err) {
      console.error("Backend save failed:", err);
      if (onAddNotification) {
        onAddNotification(
          "Error",
          "Failed to save permissions to database.",
          "danger"
        );
      }
    } finally {
      window.dispatchEvent(new Event("vastra-permissions-updated"));
      if (onPermissionsUpdated) {
        onPermissionsUpdated();
      }
      setSavingPermissions(false);
    }
  };

  // Reset to Enterprise Default
  const handleResetDefaults = async () => {
    if (!window.confirm(`Reset access control form to enterprise default for ${selectedRole.toUpperCase()}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/permissions/reset`, { role: selectedRole });
      const data = res.data;
      if (data.success) {
        if (onAddNotification) {
          onAddNotification("Permissions Reset", `Restored enterprise defaults for ${selectedRole.toUpperCase()}.`, "info");
        }
        fetchPermissions();
      }
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  // Combine items into single compact Form Table list
  const combinedFormItems = useMemo(() => {
    const list = [];
    
    // Add Module rows
    modulesRegistry.forEach(m => {
      list.push({
        type: 'module',
        id: m.id,
        name: m.name,
        category: m.category,
        icon: m.icon,
        desc: m.desc,
        level: getModuleAccessLevel(m.id),
        setter: (lvl) => setModuleAccessLevel(m.id, lvl)
      });
    });

    // Add Sub-Tab rows
    granularPermissions.forEach(t => {
      list.push({
        type: 'subtab',
        id: t.key,
        name: t.label,
        category: t.category,
        icon: Sliders,
        desc: t.desc,
        level: getTabAccessLevel(t.key),
        setter: (lvl) => setTabAccessLevel(t.key, lvl)
      });
    });

    return list;
  }, [modulesRegistry, granularPermissions, activeConfig]);

  // Filtered form items based on search and category
  const filteredFormItems = useMemo(() => {
    return combinedFormItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
                            item.desc.toLowerCase().includes(filterQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(filterQuery.toLowerCase());
      
      if (categoryFilter === "All") return matchesSearch;
      if (categoryFilter === "Modules") return matchesSearch && item.type === "module";
      if (categoryFilter === "SubTabs") return matchesSearch && item.type === "subtab";
      return matchesSearch && item.category.toLowerCase().includes(categoryFilter.toLowerCase());
    });
  }, [combinedFormItems, filterQuery, categoryFilter]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 select-none" id="permissions-form-root">
      
      {/* ─── TOP HEADER ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
              <span>Permissions & Role Access Control</span>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                RBAC Matrix 3.0
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure 3-Level Access (No Access, View-Only, Full Control) for modules and sub-tabs in structured form format
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <button
            onClick={handleResetDefaults}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Defaults</span>
          </button>
          
          <button
            onClick={handleSavePermissions}
            disabled={savingPermissions}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {savingPermissions ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Permission Matrix</span>
          </button>
        </div>
      </div>

      {/* ─── ROLE SELECTOR BAR ─── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
          <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Select System Role to Configure</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
            Active Role: <u className="text-indigo-600">{selectedRole.toUpperCase()}</u>
          </span>
        </div>

        {/* ROLE SELECTION TABS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {rolesList.map((r) => {
            const isSelected = selectedRole.toLowerCase() === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${isSelected ? "bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs" : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70"}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-xs text-slate-900 uppercase">{r.label}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border self-start font-mono ${r.color}`}>
                  {r.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── FORM MATRIX SEARCH & CATEGORY FILTER ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search module, sub-tab, or feature permissions..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Modules", "SubTabs", "Garment Fitting", "Sales & Billing", "Finance", "HR & Payroll"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${categoryFilter === cat ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── PERMISSION FORM TABLE LAYOUT ─── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Form Header */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-wider">
              Access Form Matrix — {selectedRole.toUpperCase()}
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-400 font-bold">
            Showing {filteredFormItems.length} Permission Items
          </span>
        </div>

        {/* Responsive Form Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-2/5">Module / Sub-Tab Feature</th>
                <th className="py-3 px-4 w-1/5">Category</th>
                <th className="py-3 px-4 w-2/5 text-right sm:text-center">3-Level Access Form Selector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFormItems.map((item) => {
                const Icon = item.icon;
                const currentLevel = item.level; // 'NO_ACCESS' | 'VIEW_ONLY' | 'FULL_CONTROL'

                return (
                  <tr
                    key={`${item.type}-${item.id}`}
                    className={`hover:bg-slate-50/80 transition-colors ${item.type === 'module' ? 'bg-white' : 'bg-slate-50/30'}`}
                  >
                    {/* Item Name & Description */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${item.type === 'module' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{item.name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono border ${item.type === 'module' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {item.type === 'module' ? 'MODULE' : 'SUB-TAB / ACTION'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category Tag */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[11px] text-slate-500 uppercase">
                      {item.category}
                    </td>

                    {/* 3-Level Form Control Pill */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/90 gap-1">
                        
                        {/* 1. NO ACCESS */}
                        <button
                          onClick={() => item.setter('NO_ACCESS')}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase font-mono transition-all flex items-center gap-1 cursor-pointer ${currentLevel === 'NO_ACCESS' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                          title="Disallow and hide this module/sub-tab completely"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>No Access</span>
                        </button>

                        {/* 2. VIEW ONLY (READ ONLY) */}
                        <button
                          onClick={() => item.setter('VIEW_ONLY')}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase font-mono transition-all flex items-center gap-1 cursor-pointer ${currentLevel === 'VIEW_ONLY' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                          title="Allow user to VIEW content, but disallow editing or updating"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Only</span>
                        </button>

                        {/* 3. FULL CONTROL (VIEW & EDIT) */}
                        <button
                          onClick={() => item.setter('FULL_CONTROL')}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase font-mono transition-all flex items-center gap-1 cursor-pointer ${currentLevel === 'FULL_CONTROL' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                          title="Full access to view, edit, modify, and update"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Full Control</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
export default PermissionsView;

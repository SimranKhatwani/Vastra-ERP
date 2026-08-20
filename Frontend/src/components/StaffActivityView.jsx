import api from '../api/axios';
import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  ShieldCheck,
  Search,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Eye,
  X,
  Lock,
  Unlock,
  LogOut,
  Calendar,
  Clock,
  Filter,
  Monitor,
  Globe,
  Sliders,
  ShieldAlert,
  Layers,
  Building2,
  FileText,
  DollarSign,
  Package,
  ShoppingCart
} from "lucide-react";

export function StaffActivityView({ currentUser = {}, addToastNotification = () => { } }) {
  const [activeTab, setActiveTab] = useState("activity-logs"); // "activity-logs" | "login-history"
  const [loading, setLoading] = useState(false);

  // Activity Logs States
  const [activityLogs, setActivityLogs] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null); // Side Drawer
  const [actSearch, setActSearch] = useState("");
  const [actModule, setActModule] = useState("All");
  const [actAction, setActAction] = useState("All");
  const [actStatus, setActStatus] = useState("All");
  const [actStartDate, setActStartDate] = useState("");
  const [actEndDate, setActEndDate] = useState("");

  // Login History States
  const [loginHistory, setLoginHistory] = useState([]);
  const [logSearch, setLogSearch] = useState("");
  const [logRole, setLogRole] = useState("All");
  const [logStatus, setLogStatus] = useState("All");

  // Fetch Activity Logs from Backend API
  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (actSearch) queryParams.append("search", actSearch);
      if (actModule !== "All") queryParams.append("module", actModule);
      if (actAction !== "All") queryParams.append("action", actAction);
      if (actStatus !== "All") queryParams.append("status", actStatus);
      if (actStartDate) queryParams.append("startDate", actStartDate);
      if (actEndDate) queryParams.append("endDate", actEndDate);

      const res = await api.get(`/staff-activity/activity-logs?${queryParams.toString()}`);
      const data = res.data;
      if (data.success && data.data) {
        setActivityLogs(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Login History from Backend API
  const fetchLoginHistory = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (logSearch) queryParams.append("search", logSearch);
      if (logRole !== "All") queryParams.append("role", logRole);
      if (logStatus !== "All") queryParams.append("status", logStatus);

      const res = await api.get(`/staff-activity/login-history?${queryParams.toString()}`);
      const data = res.data;
      if (data.success && data.data) {
        setLoginHistory(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch login history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "activity-logs") {
      fetchActivityLogs();
    } else {
      fetchLoginHistory();
    }
  }, [activeTab, actModule, actAction, actStatus, actStartDate, actEndDate, logRole, logStatus]);

  // Admin Actions: Force Logout
  const handleForceLogout = async (employeeId, employeeName) => {
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {}
    const myId = String(storedUser?._id || storedUser?.id || currentUser?._id || currentUser?.id || '');
    const isSelf = myId && String(employeeId) === myId;

    if (isSelf) {
      if (!window.confirm(`Warning: You are about to force logout YOUR OWN active account. You will be immediately logged out and redirected to login. Continue?`)) return;
    } else {
      if (!window.confirm(`Are you sure you want to force logout ${employeeName}? This will immediately terminate all active sessions for this account across all devices.`)) return;
    }

    try {
      const res = await api.post(`/staff-activity/force-logout/${employeeId}`);
      const data = res.data;
      if (data.success) {
        if (isSelf) {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "/";
          return;
        }
        addToastNotification("Session Terminated", `Force logged out ${employeeName}`, "warning");
        fetchLoginHistory();
      } else {
        addToastNotification("Action Failed", data.message, "danger");
      }
    } catch (err) {
      if (isSelf) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/";
        return;
      }
      console.error(err);
      addToastNotification("Error", err.response?.data?.message || "Failed to force logout user", "danger");
    }
  };

  // Admin Actions: Toggle Account Lock
  const handleToggleLock = async (employeeId, employeeName) => {
    try {
      const res = await api.post(`/staff-activity/toggle-lock/${employeeId}`);
      const data = res.data;
      if (data.success) {
        addToastNotification("Account Status Updated", data.message, "success");
        fetchLoginHistory();
      } else {
        addToastNotification("Action Failed", data.message, "danger");
      }
    } catch (err) {
      addToastNotification("Error", "Failed to update user lock status", "danger");
    }
  };

  // Dynamic unique actions extracted from activityLogs
  const uniqueActions = useMemo(() => {
    const predefined = [
      "All Actions",
      "LOGIN",
      "LOGOUT",
      "CREATE_SALE_BILL",
      "UPDATE_ALTERATION_STATUS",
      "Purchase Module Opened",
      "Purchase History Viewed",
      "Purchase Details Viewed",
      "CREATE_EXCHANGE",
      "CREATE_RETURN",
      "STOCK_ADJUSTMENT",
      "PERMISSION_UPDATE",
      "CREATE_USER",
      "DELETE_USER",
      "PAY_STAFF_COMMISSIONS"
    ];
    const fromData = new Set(activityLogs.map(l => l.action).filter(Boolean));
    predefined.slice(1).forEach(a => fromData.add(a));
    return ["All Actions", ...Array.from(fromData)];
  }, [activityLogs]);

  // Export CSV Helper
  const handleExportCSV = (type) => {
    let rows = [];
    let filename = "";
    if (type === "activity") {
      filename = "System_Audit_Trail.csv";
      rows.push(["Activity ID", "Date", "Time", "Employee Name", "Role", "Module", "Action", "Record Target", "Status", "IP Address"]);
      activityLogs.forEach((log) => {
        const d = new Date(log.createdAt || Date.now());
        rows.push([
          log.activityId,
          d.toLocaleDateString(),
          d.toLocaleTimeString(),
          `"${log.employeeName || 'System'}"`,
          log.role || '-',
          log.module || '-',
          `"${log.action || ''}"`,
          `"${log.record || log.displayName || ""}"`,
          log.status || 'Success',
          log.ipAddress || '-'
        ]);
      });
    } else {
      filename = "User_Login_History.csv";
      rows.push(["Login ID", "Employee Name", "Role", "Login Time", "Logout Time", "Duration", "Device", "Browser", "IP Address", "Status"]);
      loginHistory.forEach((log) => {
        rows.push([
          log.loginId || log._id,
          `"${log.employeeName || ''}"`,
          log.role || '-',
          log.loginTime ? new Date(log.loginTime).toLocaleString() : "-",
          log.logoutTime ? new Date(log.logoutTime).toLocaleString() : "Active",
          log.sessionDuration || log.duration || "-",
          log.device || "-",
          log.browser || "-",
          log.ipAddress || "-",
          log.status || "-"
        ]);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToastNotification("Report Exported", `Downloaded ${filename}`, "success");
  };

  // Activity Logs KPI Calculations
  const actKpis = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogs = activityLogs.filter((l) => new Date(l.createdAt).toDateString() === today);
    return {
      today: todayLogs.length,
      week: activityLogs.length,
      month: activityLogs.length,
      billsToday: todayLogs.filter((l) => String(l.module).toLowerCase().includes("bill") || String(l.action).includes("SALE_BILL")).length,
      purchaseToday: todayLogs.filter((l) => String(l.module).toLowerCase().includes("purchase") || String(l.action).includes("Purchase")).length,
      loginsToday: todayLogs.filter((l) => String(l.action).toUpperCase().includes("LOGIN")).length,
      failed: activityLogs.filter((l) => l.status === "Failed").length,
      highRisk: activityLogs.filter((l) => l.status === "Warning" || String(l.action).toLowerCase().includes("delete")).length
    };
  }, [activityLogs]);

  // Login History KPI Calculations
  const logKpis = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogins = loginHistory.filter((l) => new Date(l.createdAt || l.loginTime).toDateString() === today);
    return {
      today: todayLogins.length,
      online: loginHistory.filter((l) => l.status === "Online" || l.status === "Active").length,
      loggedOut: loginHistory.filter((l) => l.status === "Logged Out").length,
      failed: loginHistory.filter((l) => l.status === "Failed" || l.status === "Failed Login").length,
      locked: loginHistory.filter((l) => l.status === "Locked").length
    };
  }, [loginHistory]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 select-none" id="staff-activity-root">
      {/* ─── TOP HEADER ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
              <span>Staff Activity & Audit Center</span>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                Unified Audit
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete real-time ledger of system actions, operational changes, login authentications, and session security.
            </p>
          </div>
        </div>

        {/* Tab Switcher Controls */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab("activity-logs")}
            className={`flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === "activity-logs"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            <Activity className="w-4 h-4" />
            System Audit Trail
          </button>
          <button
            onClick={() => setActiveTab("login-history")}
            className={`flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === "login-history"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            <Users className="w-4 h-4" />
            Login & Security
          </button>
        </div>
      </div>

      {/* ─── TAB 1: SYSTEM AUDIT TRAIL ─────────────────────────────────────── */}
      {activeTab === "activity-logs" && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Today Total</span>
              <span className="text-xl font-black text-slate-800">{actKpis.today}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Logs</span>
              <span className="text-xl font-black text-indigo-600">{actKpis.week}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Sales Generated</span>
              <span className="text-xl font-black text-emerald-600">{actKpis.billsToday}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Purchase Actions</span>
              <span className="text-xl font-black text-indigo-600">{actKpis.purchaseToday}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider block">Logins Today</span>
              <span className="text-xl font-black text-cyan-600">{actKpis.loginsToday}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Failed Actions</span>
              <span className="text-xl font-black text-rose-600">{actKpis.failed}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">High Risk / Deletes</span>
              <span className="text-xl font-black text-amber-600">{actKpis.highRisk}</span>
            </div>
          </div>

          {/* Filter & Action Toolbar */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="flex items-center gap-2 flex-1 min-w-[240px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Employee, Action, Record, Target, IP..."
                  value={actSearch}
                  onChange={(e) => setActSearch(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Action Filter Dropdown */}
                <select
                  value={actAction}
                  onChange={(e) => setActAction(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl focus:outline-none font-bold cursor-pointer max-w-[200px]"
                  title="Filter by specific action performed"
                >
                  {uniqueActions.map((actionName) => (
                    <option key={actionName} value={actionName === "All Actions" ? "All" : actionName}>
                      {actionName}
                    </option>
                  ))}
                </select>

                {/* Module Filter */}
                <select
                  value={actModule}
                  onChange={(e) => setActModule(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl focus:outline-none font-bold cursor-pointer"
                >
                  <option value="All">All Modules</option>
                  <option value="billing">Billing / POS</option>
                  <option value="purchase">Purchase & Suppliers</option>
                  <option value="products">Products Catalog</option>
                  <option value="articulation">Tailoring & Alterations</option>
                  <option value="inventory">Inventory Control</option>
                  <option value="auth">Authentication & Users</option>
                  <option value="permissions">Permissions</option>
                  <option value="commissions">Commissions</option>
                </select>

                {/* Status Filter */}
                <select
                  value={actStatus}
                  onChange={(e) => setActStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl focus:outline-none font-bold cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Success">Success</option>
                  <option value="Failed">Failed</option>
                  <option value="Warning">Warning</option>
                </select>

                {/* Refresh */}
                <button
                  onClick={fetchActivityLogs}
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200 cursor-pointer"
                  title="Refresh Audit Logs"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>

                {/* Export CSV */}
                <button
                  onClick={() => handleExportCSV("activity")}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-mono text-[10px] tracking-wider">
                    <th className="p-4 font-bold">Date & Time</th>
                    <th className="p-4 font-bold">Employee / User</th>
                    <th className="p-4 font-bold">Module</th>
                    <th className="p-4 font-bold">Action Performed</th>
                    <th className="p-4 font-bold">Record / Item Target</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">IP & Device</th>
                    <th className="p-4 font-bold text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        No audit records found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    activityLogs.map((log) => {
                      const d = new Date(log.createdAt);
                      const isPurchase = String(log.action).toLowerCase().includes("purchase") || String(log.module).toLowerCase().includes("purchase");
                      const isSale = String(log.action).includes("SALE_BILL") || String(log.action).includes("BILL");
                      const isAuth = String(log.action).includes("LOGIN") || String(log.action).includes("LOGOUT");

                      return (
                        <tr
                          key={log._id || log.activityId}
                          onClick={() => setSelectedActivity(log)}
                          className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                        >
                          <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                            {d.toLocaleDateString('en-IN')} {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 font-bold text-slate-900">
                            {log.employeeName || 'System'}
                            {log.employeeEmail && (
                              <span className="block text-[10px] text-slate-400 font-normal">{log.employeeEmail}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold capitalize border border-slate-200">
                              {log.module}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-[11px] ${
                              isPurchase ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                              isSale ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              isAuth ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                              'bg-slate-50 text-slate-800'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 font-medium truncate max-w-[200px]" title={log.record || log.displayName || ''}>
                            {log.record || log.displayName || log.item || '-'}
                          </td>
                          <td className="p-4">
                            {log.status === "Success" ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Success
                              </span>
                            ) : log.status === "Failed" ? (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-200">
                                <XCircle className="w-3 h-3" /> Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                                <AlertTriangle className="w-3 h-3" /> Warning
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-[11px] text-slate-500">
                            {log.ipAddress || '-'}
                            <span className="block text-[10px] text-slate-400 font-sans truncate max-w-[150px]">{log.deviceInfo || log.userAgent || '-'}</span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedActivity(log);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Inspect full audit record"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: USER LOGIN & SECURITY ─────────────────────────────────────── */}
      {activeTab === "login-history" && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Logins Today</span>
              <span className="text-2xl font-black text-slate-800">{logKpis.today}</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Online / Active Sessions</span>
              <span className="text-2xl font-black text-emerald-600">{logKpis.online}</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Failed Logins</span>
              <span className="text-2xl font-black text-rose-600">{logKpis.failed}</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Locked Accounts</span>
              <span className="text-2xl font-black text-amber-600">{logKpis.locked}</span>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[240px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Employee, Email, IP Address, Browser..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Role Filter */}
                <select
                  value={logRole}
                  onChange={(e) => setLogRole(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl focus:outline-none font-bold cursor-pointer"
                >
                  <option value="All">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Salesperson">Salesperson</option>
                  <option value="Tailor">Tailor</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Worker">Worker</option>
                </select>

                {/* Status Filter */}
                <select
                  value={logStatus}
                  onChange={(e) => setLogStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl focus:outline-none font-bold cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active / Online</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed Login</option>
                </select>

                {/* Refresh */}
                <button
                  onClick={fetchLoginHistory}
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200 cursor-pointer"
                  title="Refresh History"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>

                {/* Export CSV */}
                <button
                  onClick={() => handleExportCSV("login")}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Login History Data Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-mono text-[10px] tracking-wider">
                    <th className="p-4 font-bold">Employee</th>
                    <th className="p-4 font-bold">Role</th>
                    <th className="p-4 font-bold">Email</th>
                    <th className="p-4 font-bold">Login Timestamp</th>
                    <th className="p-4 font-bold">Device & Browser</th>
                    <th className="p-4 font-bold">IP Address</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Security Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {loginHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        No login history records found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    loginHistory.map((log) => {
                      const loginDt = log.createdAt ? new Date(log.createdAt) : null;
                      const isValidDate = loginDt && !isNaN(loginDt.getTime());
                      const empId = log.employeeId || (log.userId && (log.userId._id || log.userId));

                      return (
                        <tr key={log._id || log.loginId} className="hover:bg-slate-50/80 transition-all">
                          <td className="p-4 font-bold text-slate-900">
                            {log.employeeName || log.email || 'User'}
                            <span className="block text-[10px] text-slate-400 font-mono font-normal">
                              ID: {String(empId || 'N/A').slice(-6)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold capitalize border border-slate-200">
                              {log.role || 'Staff'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600">
                            {log.employeeEmail || log.email || '-'}
                          </td>
                          <td className="p-4 font-mono text-slate-600 whitespace-nowrap">
                            {isValidDate ? `${loginDt.toLocaleDateString('en-IN')} ${loginDt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : '-'}
                          </td>
                          <td className="p-4 text-slate-700">
                            {log.device || log.userAgent || 'Desktop'}
                            <span className="block text-[10px] text-slate-400">{log.browser}</span>
                          </td>
                          <td className="p-4 font-mono text-slate-500">{log.ipAddress || '-'}</td>
                          <td className="p-4">
                            {log.status === "Active" || log.status === "Online" ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Active Session
                              </span>
                            ) : log.status === "FAILED" || log.status === "Failed" ? (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-200">
                                <XCircle className="w-3 h-3" /> Failed Login
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-200">
                                <CheckCircle2 className="w-3 h-3" /> Success
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {empId && (
                                <>
                                  <button
                                    onClick={() => handleForceLogout(empId, log.employeeName || log.email)}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-xs"
                                    title="Force terminate all active sessions for this employee immediately"
                                  >
                                    <LogOut className="w-3 h-3" />
                                    Force Logout
                                  </button>
                                  <button
                                    onClick={() => handleToggleLock(empId, log.employeeName || log.email)}
                                    className={`p-1.5 rounded-lg transition-all border cursor-pointer ${
                                      log.isLocked
                                        ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                                        : "bg-slate-50 border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                                    }`}
                                    title={log.isLocked ? "Account is LOCKED (Forbidden to login) - Click to Unlock" : "Account is ACTIVE - Click to Freeze/Lock"}
                                  >
                                    {log.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SIDE DRAWER DETAIL INSPECTOR ─────────────────────────────────────── */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white border-l border-slate-200 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest font-bold block">Audit Detail Inspector</span>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  {selectedActivity.activityId || 'Record Details'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Employee Profile</span>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-900">{selectedActivity.employeeName || 'System'}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-700">{selectedActivity.employeeEmail || "N/A"}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Role / Module:</span>
                  <span className="capitalize font-medium">{selectedActivity.role || selectedActivity.module}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Action Payload</span>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Module:</span>
                  <span className="font-mono text-indigo-600 font-bold capitalize">{selectedActivity.module}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Action:</span>
                  <span className="font-bold text-slate-900">{selectedActivity.action}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Target Record / Item:</span>
                  <span className="font-mono text-slate-700 font-semibold">{selectedActivity.record || selectedActivity.displayName || selectedActivity.item || "N/A"}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600">{selectedActivity.status || 'Success'}</span>
                </div>
              </div>

              {selectedActivity.details && Object.keys(selectedActivity.details).length > 0 && (
                <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-2 overflow-x-auto">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block font-mono">Raw Event Details</span>
                  <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap">
                    {JSON.stringify(selectedActivity.details, null, 2)}
                  </pre>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-200/80 font-mono text-[11px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Device & Client Environment</span>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-500 font-sans">IP Address:</span>
                  <span>{selectedActivity.ipAddress || '-'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-500 font-sans">Device / Agent:</span>
                  <span className="truncate max-w-[220px]" title={selectedActivity.userAgent || selectedActivity.deviceInfo}>{selectedActivity.userAgent || selectedActivity.deviceInfo || '-'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-500 font-sans">Timestamp:</span>
                  <span>{new Date(selectedActivity.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

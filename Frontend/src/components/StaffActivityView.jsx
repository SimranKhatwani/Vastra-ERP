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
  FileText
} from "lucide-react";

export function StaffActivityView({ currentUser = {}, addToastNotification = () => {} }) {
  const [activeTab, setActiveTab] = useState("activity-logs"); // "activity-logs" | "login-history"
  const [loading, setLoading] = useState(false);

  // Activity Logs States
  const [activityLogs, setActivityLogs] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null); // Side Drawer
  const [actSearch, setActSearch] = useState("");
  const [actModule, setActModule] = useState("All");
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
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (actSearch) queryParams.append("search", actSearch);
      if (actModule !== "All") queryParams.append("module", actModule);
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
      const token = localStorage.getItem("token");
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
  }, [activeTab, actModule, actStatus, actStartDate, actEndDate, logRole, logStatus]);

  // Admin Actions: Force Logout
  const handleForceLogout = async (employeeId, employeeName) => {
    if (!window.confirm(`Are you sure you want to force logout ${employeeName}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/staff-activity/force-logout/${employeeId}`);
      const data = res.data;
      if (data.success) {
        addToastNotification("Session Terminated", `Force logged out ${employeeName}`, "warning");
        fetchLoginHistory();
      } else {
        addToastNotification("Action Failed", data.message, "danger");
      }
    } catch (err) {
      addToastNotification("Error", "Failed to force logout user", "danger");
    }
  };

  // Admin Actions: Lock / Unlock Account
  const handleToggleLock = async (employeeId, employeeName) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/staff-activity/toggle-lock/${employeeId}`);
      const data = res.data;
      if (data.success) {
        addToastNotification("Account Status Updated", data.message, "success");
        fetchLoginHistory();
      } else {
        addToastNotification("Action Failed", data.message, "danger");
      }
    } catch (err) {
      addToastNotification("Error", "Failed to toggle account lock", "danger");
    }
  };

  // Export CSV Helper
  const handleExportCSV = (type) => {
    let rows = [];
    let filename = "";
    if (type === "activity") {
      filename = "Staff_Activity_Logs.csv";
      rows.push(["Activity ID", "Date", "Time", "Employee Name", "Role", "Module", "Action", "Record", "Status", "IP Address"]);
      activityLogs.forEach((log) => {
        const d = new Date(log.createdAt || log.createdAt);
        rows.push([
          log.activityId,
          d.toLocaleDateString(),
          d.toLocaleTimeString(),
          `"${log.employeeName}"`,
          log.role,
          log.module,
          `"${log.action}"`,
          `"${log.recordName || log.recordId || ""}"`,
          log.status,
          log.ipAddress
        ]);
      });
    } else {
      filename = "User_Login_History.csv";
      rows.push(["Login ID", "Employee Name", "Role", "Login Time", "Logout Time", "Duration", "Device", "Browser", "IP Address", "Status"]);
      loginHistory.forEach((log) => {
        rows.push([
          log.loginId,
          `"${log.employeeName}"`,
          log.role,
          new Date(log.loginTime).toLocaleString(),
          log.logoutTime ? new Date(log.logoutTime).toLocaleString() : "Active",
          log.sessionDuration,
          log.device,
          log.browser,
          log.ipAddress,
          log.status
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
      billsToday: todayLogs.filter((l) => String(l.module).toLowerCase().includes("bill")).length,
      productsToday: todayLogs.filter((l) => String(l.module).toLowerCase().includes("product")).length,
      attendanceToday: todayLogs.filter((l) => String(l.module).toLowerCase().includes("attendance")).length,
      failed: activityLogs.filter((l) => l.status === "Failed").length,
      highRisk: activityLogs.filter((l) => l.status === "Warning" || String(l.action).toLowerCase().includes("delete")).length
    };
  }, [activityLogs]);

  // Login History KPI Calculations
  const logKpis = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogins = loginHistory.filter((l) => new Date(l.loginTime).toDateString() === today);
    return {
      today: todayLogins.length,
      online: loginHistory.filter((l) => l.status === "Online").length,
      loggedOut: loginHistory.filter((l) => l.status === "Logged Out").length,
      failed: loginHistory.filter((l) => l.status === "Failed Login").length,
      locked: loginHistory.filter((l) => l.status === "Locked").length,
      activeSessions: loginHistory.filter((l) => l.status === "Online").length
    };
  }, [loginHistory]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 select-none" id="staff-activity-root">
      {/* ─── TOP HEADER (MATCHING VASTRA ERP LIGHT SYSTEM) ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
              <span>Staff Activity & Audit Center</span>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                Audit Trail 3.0
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time MongoDB audit trail monitoring employee actions, login authentication histories, and session security.
            </p>
          </div>
        </div>

        {/* Tab Switcher Controls */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab("activity-logs")}
            className={`flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "activity-logs"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity className="w-4 h-4" />
            Activity Logs
          </button>
          <button
            onClick={() => setActiveTab("login-history")}
            className={`flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "login-history"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            User Login History
          </button>
        </div>
      </div>

      {/* ─── TAB 1: ACTIVITY LOGS ─────────────────────────────────────── */}
      {activeTab === "activity-logs" && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Today</span>
              <span className="text-xl font-black text-slate-800">{actKpis.today}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">This Week</span>
              <span className="text-xl font-black text-indigo-600">{actKpis.week}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">This Month</span>
              <span className="text-xl font-black text-slate-700">{actKpis.month}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Bills Today</span>
              <span className="text-xl font-black text-emerald-600">{actKpis.billsToday}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider block">Products Updated</span>
              <span className="text-xl font-black text-cyan-600">{actKpis.productsToday}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Attendance</span>
              <span className="text-xl font-black text-amber-600">{actKpis.attendanceToday}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Failed Actions</span>
              <span className="text-xl font-black text-rose-600">{actKpis.failed}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">High Risk</span>
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
                  placeholder="Search by Employee, Action, Activity ID, Module..."
                  value={actSearch}
                  onChange={(e) => setActSearch(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Module Filter */}
                <select
                  value={actModule}
                  onChange={(e) => setActModule(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl focus:outline-none font-bold cursor-pointer"
                >
                  <option value="All">All Modules</option>
                  <option value="billing">POS Billing</option>
                  <option value="products">Products Catalog</option>
                  <option value="articulation">Tailoring Studio</option>
                  <option value="inventory">Inventory Control</option>
                  <option value="purchase">Purchase Orders</option>
                  <option value="financial-management">Financials</option>
                  <option value="permissions">Permissions & Security</option>
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
                    <th className="p-4 font-bold">Employee</th>
                    <th className="p-4 font-bold">Role</th>
                    <th className="p-4 font-bold">Department</th>
                    <th className="p-4 font-bold">Module</th>
                    <th className="p-4 font-bold">Action Performed</th>
                    <th className="p-4 font-bold">Record Target</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">IP / Device</th>
                    <th className="p-4 font-bold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                        No activity log records found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    activityLogs.map((log) => {
                      const d = new Date(log.createdAt);
                      return (
                        <tr
                          key={log._id || log.activityId}
                          onClick={() => setSelectedActivity(log)}
                          className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                        >
                          <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                            {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 font-bold text-slate-900">
                            {log.employeeName}
                            <span className="block text-[10px] text-slate-400 font-mono font-normal">ID: {log.employeeId || 'N/A'}</span>
                          </td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold capitalize border border-slate-200">
                              {log.role}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600">{log.department || 'Retail'}</td>
                          <td className="p-4 font-mono text-indigo-600 font-bold capitalize">{log.module}</td>
                          <td className="p-4 font-bold text-slate-800">{log.action}</td>
                          <td className="p-4 text-slate-500 font-mono truncate max-w-[160px]">
                            {log.recordName || log.recordId || 'N/A'}
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
                            {log.ipAddress}
                            <span className="block text-[10px] text-slate-400 font-sans">{log.device}</span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedActivity(log);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white rounded-lg transition-all cursor-pointer"
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

      {/* ─── TAB 2: USER LOGIN HISTORY ─────────────────────────────────────── */}
      {activeTab === "login-history" && (
        <div className="space-y-6">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Logins Today</span>
              <span className="text-2xl font-black text-slate-800">{logKpis.today}</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Currently Online</span>
              <span className="text-2xl font-black text-emerald-600">{logKpis.online}</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Logged Out Users</span>
              <span className="text-2xl font-black text-slate-600">{logKpis.loggedOut}</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Failed Logins</span>
              <span className="text-2xl font-black text-rose-600">{logKpis.failed}</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Locked Accounts</span>
              <span className="text-2xl font-black text-amber-600">{logKpis.locked}</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center space-y-1 shadow-xs">
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Active Sessions</span>
              <span className="text-2xl font-black text-indigo-600">{logKpis.activeSessions}</span>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[240px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Employee, Role, Device, IP Address..."
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
                  <option value="Online">Online</option>
                  <option value="Logged Out">Logged Out</option>
                  <option value="Force Logged Out">Force Logged Out</option>
                  <option value="Failed Login">Failed Login</option>
                  <option value="Locked">Locked</option>
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
                    <th className="p-4 font-bold">Department & Branch</th>
                    <th className="p-4 font-bold">Login Time</th>
                    <th className="p-4 font-bold">Logout Time</th>
                    <th className="p-4 font-bold">Session Duration</th>
                    <th className="p-4 font-bold">Device & Browser</th>
                    <th className="p-4 font-bold">IP Address</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Admin Security Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {loginHistory.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                        No login history records found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    loginHistory.map((log) => {
                      const loginDt = new Date(log.loginTime);
                      const logoutDt = log.logoutTime ? new Date(log.logoutTime) : null;
                      return (
                        <tr key={log._id || log.loginId} className="hover:bg-slate-50/80 transition-all">
                          <td className="p-4 font-bold text-slate-900">
                            {log.employeeName}
                            <span className="block text-[10px] text-slate-400 font-mono font-normal">ID: {log.employeeId || 'N/A'}</span>
                          </td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold capitalize border border-slate-200">
                              {log.role}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600">
                            {log.department}
                            <span className="block text-[10px] text-slate-400">{log.branch}</span>
                          </td>
                          <td className="p-4 font-mono text-slate-600 whitespace-nowrap">
                            {loginDt.toLocaleDateString()} {loginDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                            {logoutDt ? `${logoutDt.toLocaleDateString()} ${logoutDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Still Active"}
                          </td>
                          <td className="p-4 font-mono text-indigo-600 font-bold">
                            {log.sessionDuration || "Active Now"}
                          </td>
                          <td className="p-4 text-slate-700">
                            {log.device}
                            <span className="block text-[10px] text-slate-400">{log.browser} ({log.operatingSystem})</span>
                          </td>
                          <td className="p-4 font-mono text-slate-500">{log.ipAddress}</td>
                          <td className="p-4">
                            {log.status === "Online" ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Online
                              </span>
                            ) : log.status === "Logged Out" ? (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-200">
                                Logged Out
                              </span>
                            ) : log.status === "Force Logged Out" ? (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                                Force Terminated
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-200">
                                {log.status}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {log.status === "Online" && (
                              <button
                                onClick={() => handleForceLogout(log.employeeId, log.employeeName)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Force Logout
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleLock(log.employeeId, log.employeeName)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Lock / Unlock
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

      {/* ─── SIDE DRAWER DETAIL INSPECTOR ─────────────────────────────────────── */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest font-bold block">Audit Detail Inspector</span>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  {selectedActivity.activityId}
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
                  <span className="font-bold text-slate-900">{selectedActivity.employeeName}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Employee ID:</span>
                  <span className="font-mono">{selectedActivity.employeeId || "N/A"}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Role & Department:</span>
                  <span className="capitalize font-medium">{selectedActivity.role} ({selectedActivity.department})</span>
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
                  <span className="text-slate-500">Record Target:</span>
                  <span className="font-mono text-slate-700 font-semibold">{selectedActivity.recordName || selectedActivity.recordId || "N/A"}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600">{selectedActivity.status}</span>
                </div>
              </div>

              {selectedActivity.oldValue && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Previous State (Old Value)</span>
                  <p className="font-mono text-slate-800 break-words text-[11px]">{String(selectedActivity.oldValue)}</p>
                </div>
              )}

              {selectedActivity.newValue && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">New State (New Value)</span>
                  <p className="font-mono text-slate-800 break-words text-[11px]">{String(selectedActivity.newValue)}</p>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-200/80 font-mono text-[11px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Device & Client Environment</span>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-500">IP Address:</span>
                  <span>{selectedActivity.ipAddress}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-500">Device Type:</span>
                  <span>{selectedActivity.device}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-500">Browser:</span>
                  <span>{selectedActivity.browser}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-500">Timestamp:</span>
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

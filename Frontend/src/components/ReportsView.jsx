import api from '../api/axios';
import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Users2,
  Building2,
  Calendar,
  Download,
  Printer,
  Filter,
  Search,
  RefreshCw,
  Layers,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  ChevronRight,
  X,
  CreditCard,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const API = "";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

export const ReportsView = ({ onAddNotification }) => {
  const [activeSection, setActiveSection] = useState("dashboard"); // 'dashboard', 'sales', 'inventory', 'people', 'financial'
  const [selectedReport, setSelectedReport] = useState(null); // Selected report inside section
  const [loading, setLoading] = useState(false);

  // Filter States
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [reportData, setReportData] = useState(null);

  // Fetch Business Performance Dashboard Data
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/analytics/dashboard`, { headers: getAuthHeaders() });
      const data = res.data;
      if (data.success) {
        setDashboardData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Section Specific Reports
  const loadSectionReport = async (section, reportType) => {
    setLoading(true);
    try {
      let endpoint = `${API}/analytics/${section}?reportType=${reportType || ""}`;
      if (dateRange.start && dateRange.end) {
        endpoint += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
      }
      const res = await fetch(endpoint, { headers: getAuthHeaders() });
      const data = res.data;
      if (data.success) {
        setReportData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeSection !== "dashboard") {
      const defaultRep = getDefaultReportForSection(activeSection);
      const repToLoad = selectedReport || defaultRep;
      if (!selectedReport) setSelectedReport(defaultRep);
      loadSectionReport(activeSection, repToLoad);
    }
  }, [activeSection, selectedReport, dateRange]);

  const fmt = (num) => Number(num || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

  // Colors
  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

  // Export CSV Handler
  const handleExportCSV = (filename, headers, rows) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c || ""}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpis = dashboardData?.kpis || {};
  const charts = dashboardData?.charts || {};

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Reports & Business Analytics
              </h1>
              <p className="text-xs font-medium text-slate-400">
                Enterprise Business Intelligence (BI) & Live Aggregated MongoDB Reporting
              </p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard Button (Shown when inside a section) */}
        {activeSection !== "dashboard" && (
          <button
            onClick={() => {
              setActiveSection("dashboard");
              setSelectedReport(null);
            }}
            className="flex items-center gap-2 bg-slate-900 text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
          >
            ← Back to Performance Dashboard
          </button>
        )}
      </div>

      {/* Top Module Section Tabs */}
      <div className="flex gap-1.5 bg-white p-2 rounded-2xl border border-slate-100 shadow-xs overflow-x-auto">
        {[
          { id: "dashboard", label: "Business Performance Dashboard", icon: BarChart3 },
          { id: "sales", label: "Sales & Purchase Analytics", icon: DollarSign },
          { id: "inventory", label: "Inventory Analytics", icon: Package },
          { id: "people", label: "People & HR Analytics", icon: Users },
          { id: "financial", label: "Financial Analytics & Expenses", icon: PieIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSection(tab.id);
                setSelectedReport(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. BUSINESS PERFORMANCE DASHBOARD (DEFAULT LANDING VIEW) */}
      {/* ========================================================================= */}
      {activeSection === "dashboard" && (
        <div className="space-y-6">
          {/* Section Summary Cards Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                id: "sales",
                title: "Sales Analytics",
                desc: "Sales, Purchases, Customers, Vendors & GST Audit",
                count: "5 Active Reports",
                icon: DollarSign,
                color: "bg-emerald-500",
              },
              {
                id: "inventory",
                title: "Inventory Analytics",
                desc: "Stock Aging, Fast/Slow Moving & Warehouse Breakdown",
                count: "4 Active Reports",
                icon: Package,
                color: "bg-blue-500",
              },
              {
                id: "people",
                title: "People Analytics",
                desc: "Salesperson Performance, Worker Attendance & Payroll",
                count: "2 Active Reports",
                icon: Users,
                color: "bg-purple-500",
              },
              {
                id: "financial",
                title: "Financial Analytics",
                desc: "Real-time Profit & Loss Statement, Cash/Bank Flow",
                count: "Executive Statement",
                icon: PieIcon,
                color: "bg-amber-500",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => {
                    setActiveSection(card.id);
                    setSelectedReport(null);
                  }}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-3 text-white rounded-2xl ${card.color} shadow-sm group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                      {card.count}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                      {card.title} <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enterprise KPI Cards Grid (19 KPIs) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Enterprise Key Performance Indicators (KPIs)
              </h2>
              <button
                onClick={loadDashboard}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Live Data
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <KPISmall label="Gross Sales" value={`₹${fmt(kpis.grossSales || kpis.monthlySales)}`} color="blue" icon={DollarSign} onClick={() => { setActiveSection("sales"); setSelectedReport("sales_summary"); loadSectionReport("sales", "sales_summary"); }} />
              <KPISmall label="Sales Returns (Refunds)" value={`₹${fmt(kpis.salesReturns || 0)}`} color="red" icon={ArrowDownRight} onClick={() => { setActiveSection("financial"); setSelectedReport("financial_summary"); loadSectionReport("financial", "financial_summary"); }} />
              <KPISmall label="Net Sales Revenue" value={`₹${fmt(kpis.netSales || kpis.monthlySales)}`} color="emerald" icon={DollarSign} onClick={() => { setActiveSection("sales"); setSelectedReport("sales_summary"); loadSectionReport("sales", "sales_summary"); }} />
              <KPISmall label="Return Rate (%)" value={`${kpis.returnPercentage || 0}%`} color="amber" icon={RefreshCw} onClick={() => { setActiveSection("sales"); setSelectedReport("sales_summary"); loadSectionReport("sales", "sales_summary"); }} />
              <KPISmall label="Total Exchanges" value={kpis.exchangeCount || 0} color="indigo" icon={RefreshCw} onClick={() => { setActiveSection("sales"); setSelectedReport("sales_summary"); loadSectionReport("sales", "sales_summary"); }} />
              <KPISmall label="Net Profit" value={`₹${fmt(kpis.netProfit)}`} color="emerald" icon={CheckCircle} onClick={() => { setActiveSection("financial"); setSelectedReport("financial_summary"); loadSectionReport("financial", "financial_summary"); }} />

              <KPISmall label="Today's Sales" value={`₹${fmt(kpis.todaySales)}`} color="emerald" icon={DollarSign} onClick={() => { setActiveSection("sales"); setSelectedReport("sales_summary"); loadSectionReport("sales", "sales_summary"); }} />
              <KPISmall label="Today's Purchase" value={`₹${fmt(kpis.todayPurchase)}`} color="blue" icon={ShoppingBag} onClick={() => { setActiveSection("sales"); setSelectedReport("purchase"); loadSectionReport("sales", "purchase"); }} />
              <KPISmall label="Today's Profit" value={`₹${fmt(kpis.todayProfit)}`} color="indigo" icon={TrendingUp} onClick={() => { setActiveSection("financial"); setSelectedReport("financial_summary"); loadSectionReport("financial", "financial_summary"); }} />
              <KPISmall label="Monthly Purchase" value={`₹${fmt(kpis.monthlyPurchase)}`} color="blue" icon={ShoppingBag} onClick={() => { setActiveSection("sales"); setSelectedReport("purchase"); loadSectionReport("sales", "purchase"); }} />
              <KPISmall label="Monthly Revenue" value={`₹${fmt(kpis.monthlyRevenue)}`} color="purple" icon={Wallet} onClick={() => { setActiveSection("financial"); setSelectedReport("financial_summary"); loadSectionReport("financial", "financial_summary"); }} />
              <KPISmall label="Monthly Expenses" value={`₹${fmt(kpis.monthlyExpenses)}`} color="red" icon={ArrowDownRight} onClick={() => { setActiveSection("financial"); setSelectedReport("expenses"); loadSectionReport("financial", "expenses"); }} />

              <KPISmall label="Outstanding Receivables" value={`₹${fmt(kpis.outstandingReceivables)}`} color="amber" icon={CreditCard} onClick={() => { setActiveSection("sales"); setSelectedReport("customer"); loadSectionReport("sales", "customer"); }} />
              <KPISmall label="Outstanding Payables" value={`₹${fmt(kpis.outstandingPayables)}`} color="red" icon={CreditCard} onClick={() => { setActiveSection("sales"); setSelectedReport("vendor"); loadSectionReport("sales", "vendor"); }} />
              <KPISmall label="Inventory Value" value={`₹${fmt(kpis.inventoryValue)}`} color="purple" icon={Package} onClick={() => { setActiveSection("inventory"); setSelectedReport("inventory_summary"); loadSectionReport("inventory", "inventory_summary"); }} />
              <KPISmall label="Active Customers" value={kpis.activeCustomers || 0} color="blue" icon={Users} onClick={() => { setActiveSection("sales"); setSelectedReport("customer"); loadSectionReport("sales", "customer"); }} />
              <KPISmall label="Active Vendors" value={kpis.activeVendors || 0} color="amber" icon={Building2} onClick={() => { setActiveSection("sales"); setSelectedReport("vendor"); loadSectionReport("sales", "vendor"); }} />
              <KPISmall label="Active Employees" value={kpis.activeEmployees || 0} color="indigo" icon={Users2} onClick={() => { setActiveSection("people"); setSelectedReport("performance"); loadSectionReport("people", "performance"); }} />
            </div>
          </div>

          {/* Enterprise BI Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Sales & Revenue Trend */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm uppercase">Revenue & Financial Performance Trend</h3>
                  <p className="text-xs text-slate-400">Monthly Sales vs Purchases vs Expenses vs Net Profit</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.monthlySalesTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip formatter={(val) => `₹${fmt(val)}`} />
                    <Legend />
                    <Area type="monotone" dataKey="sales" name="Sales Revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Sales Distribution */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm uppercase">Category Sales Distribution</h3>
                <p className="text-xs text-slate-400">Revenue split across garment categories</p>
              </div>
              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.categorySales || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(charts.categorySales || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => `₹${fmt(val)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Payment Mode Distribution & Top Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase">Payment Mode Distribution</h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.paymentModes || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val) => `₹${fmt(val)}`} />
                    <Bar dataKey="value" name="Amount (₹)" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activities Audit Feed */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase">Live System Transaction Feed</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(dashboardData?.recentActivities || []).map((act, i) => {
                  let retVal = act.returnedAmount || 0;
                  if (!retVal && act.items) {
                    retVal = act.items.filter(it => it.isReturned).reduce((sum, it) => sum + (it.totalPrice || (it.price * (it.quantity || 1))), 0);
                  }
                  const isRet = act.hasReturn || act.status === "Returned" || act.status === "Partially Returned" || retVal > 0;
                  const isEx = act.hasExchange || act.status === "Exchanged" || act.status === "Partially Exchanged";
                  const netVal = Math.max(0, (act.grandTotal || 0) - retVal);

                  return (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-mono font-bold text-slate-800">{act.invoiceNo || "Invoice Record"}</p>
                          {isRet && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                              ↩ RETURNED
                            </span>
                          )}
                          {isEx && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                              🔁 EXCHANGED
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{act.customerName || "Walk-in Customer"} | {fmtDate(act.date || act.createdAt)}</p>
                      </div>
                      <div className="text-right font-mono">
                        <p className={`font-bold ${isRet ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ₹{fmt(netVal)}
                        </p>
                        {retVal > 0 && (
                          <p className="text-[9px] text-slate-400 font-sans">
                            Gross: ₹{fmt(act.grandTotal)} (-₹{fmt(retVal)})
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!(dashboardData?.recentActivities || []).length && (
                  <p className="text-slate-400 text-center py-8 text-xs">No recent transactions recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTIONS 2, 3, 4, 5: DIRECT DATA & ANALYTICS VIEWER */}
      {/* ========================================================================= */}
      {activeSection !== "dashboard" && (
        <div className="space-y-6">
          {/* Sub-Report Type Selector Tabs */}
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center gap-2">
            {getSectionReportCards(activeSection).map((card) => {
              const isSelected = selectedReport === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => {
                    setSelectedReport(card.id);
                    loadSectionReport(activeSection, card.id);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {card.label}
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            {/* Report Actions & Filters Bar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                  {(selectedReport || activeSection).replace('_', ' ').toUpperCase()} REPORT & LIVE AUDIT
                </h3>
                <p className="text-xs text-slate-400">Live dynamic reporting & metrics powered by MongoDB Aggregations</p>
              </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  {/* Search Bar */}
                  <div className="relative flex-1 lg:w-60">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search record..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Date Pickers */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="date"
                      className="bg-transparent outline-none text-slate-700 font-bold"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="date"
                      className="bg-transparent outline-none text-slate-700 font-bold"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                  </div>

                  {/* Export Buttons */}
                  <button
                    onClick={() => {
                      const rows = (reportData?.data || []).map((r) => Object.values(r));
                      const headers = reportData?.data?.length ? Object.keys(reportData.data[0]) : ["No Data"];
                      handleExportCSV(selectedReport, headers, rows);
                    }}
                    className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Excel
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-slate-900 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print PDF
                  </button>
                </div>
              </div>

              {/* Summary KPIs */}
              {reportData?.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(reportData.summary).map(([k, v]) => (
                    <div key={k} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{k.replace(/([A-Z])/g, " $1")}</p>
                      <p className="text-sm font-black font-mono text-slate-800 mt-1">
                        {typeof v === "number" ? (k.toLowerCase().includes("count") || k.toLowerCase().includes("total") && !k.toLowerCase().includes("sales") && !k.toLowerCase().includes("purchases") && !k.toLowerCase().includes("gst") && !k.toLowerCase().includes("receivables") && !k.toLowerCase().includes("payables") ? v : `₹${fmt(v)}`) : v}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Data Table */}
              <div className="overflow-x-auto text-xs border border-slate-100 rounded-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                      {(reportData?.data?.length ? Object.keys(reportData.data[0]) : ["Status"]).slice(0, 8).map((h) => (
                        <th key={h} className="p-3">
                          {h.replace(/([A-Z])/g, " $1")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                    {(reportData?.data || [])
                      .filter((row) => {
                        if (!searchQuery) return true;
                        return JSON.stringify(row).toLowerCase().includes(searchQuery.toLowerCase());
                      })
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          {Object.entries(row).slice(0, 8).map(([key, val], colIdx) => {
                            const strVal = String(val ?? "");
                            if (strVal === "Returned" || strVal === "Partially Returned") {
                              return (
                                <td key={colIdx} className="p-3">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                                    ↩ {strVal}
                                  </span>
                                </td>
                              );
                            }
                            if (strVal === "Exchanged" || strVal === "Partially Exchanged") {
                              return (
                                <td key={colIdx} className="p-3">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    🔁 {strVal}
                                  </span>
                                </td>
                              );
                            }
                            if (key.toLowerCase().includes("sales") || key.toLowerCase().includes("amount") || key.toLowerCase().includes("price") || key.toLowerCase().includes("cogs")) {
                              return (
                                <td key={colIdx} className="p-3 font-mono font-bold text-slate-800">
                                  {typeof val === "number" ? `₹${fmt(val)}` : strVal}
                                </td>
                              );
                            }
                            return (
                              <td key={colIdx} className="p-3">
                                {typeof val === "object" ? JSON.stringify(val) : strVal}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    {!(reportData?.data || []).length && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No report records available for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {Boolean(reportData?.data?.length) && (
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span>
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, reportData.data.length)} to{" "}
                    {Math.min(currentPage * itemsPerPage, reportData.data.length)} of {reportData.data.length} records
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 disabled:opacity-50 font-bold"
                    >
                      Prev
                    </button>
                    <span className="font-bold px-2">{currentPage}</span>
                    <button
                      disabled={currentPage * itemsPerPage >= reportData.data.length}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 disabled:opacity-50 font-bold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>
      )}
    </div>
  );
};

// Helper to get Report Cards per Section
function getSectionReportCards(section) {
  switch (section) {
    case "sales":
      return [
        { id: "sales_summary", label: "Sales Reports", desc: "Detailed sales revenue by invoice, payment mode & customer" },
        { id: "purchase", label: "Purchase Reports", desc: "Vendor purchase invoices, tax & GRN breakdown" },
        { id: "customer", label: "Customer Reports", desc: "Customer lifetime spend & outstanding receivables" },
        { id: "vendor", label: "Vendor Reports", desc: "Vendor payout summary & current payables" },
        { id: "gst", label: "GST Audit Reports", desc: "Output GST vs Input GST Tax Liability statement" },
      ];
    case "inventory":
      return [
        { id: "inventory_summary", label: "Stock Valuation", desc: "Current stock quantities & inventory valuation" },
        { id: "stock_aging", label: "Stock Aging", desc: "Products aged >60 and >90 days in warehouse" },
        { id: "fast_moving", label: "Fast Moving", desc: "High velocity products ranked by sales turnover" },
        { id: "slow_moving", label: "Slow Moving", desc: "Low velocity products with minimal movement" },
      ];
    case "people":
      return [
        { id: "performance", label: "Employee Reports", desc: "Salesperson revenue generated & target completion" },
        { id: "attendance", label: "Attendance Reports", desc: "Attendance %, late entries & leave log" },
      ];
    case "financial":
      return [
        { id: "financial_summary", label: "Financial Statement", desc: "Profit & Loss, Cash Flow & Bank Ledger Summary" },
        { id: "expenses", label: "Expense Management", desc: "Categorized expenses, payouts & vendor expense log" },
      ];
    default:
      return [];
  }
}

function getDefaultReportForSection(section) {
  switch (section) {
    case "sales":
      return "sales_summary";
    case "inventory":
      return "inventory_summary";
    case "people":
      return "performance";
    case "financial":
      return "financial_summary";
    default:
      return "";
  }
}

// Helper KPI Small Card Component
function KPISmall({ label, value, color, icon: Icon, onClick }) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300",
    blue: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300",
    purple: "bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300",
    amber: "bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300",
    red: "bg-red-50 text-red-600 border-red-100 hover:border-red-300",
  };

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-2xl border ${colorMap[color] || colorMap.indigo} shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]`}
    >
      <div className="flex items-center justify-between text-[10px] font-bold uppercase opacity-80">
        <span>{label}</span>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <p className="text-sm font-black font-mono mt-1.5 text-slate-900">{value}</p>
    </div>
  );
}

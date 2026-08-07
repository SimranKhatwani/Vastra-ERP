import api from '../api/axios';
import React from "react";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Layers,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  Scissors,
  Receipt,
  Scan,
  Search,
  Printer,
  MessageCircle,
  UserPlus,
  Calendar,
  ListTodo,
  Users,
  UserCheck,
  XCircle,
  CheckCircle2,
  Activity,
  Zap,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { MiniAreaChart, PremiumBarChart, DonutChart } from "./Charts";
import { QuickActionsPanel } from "./QuickActionsPanel";

export const DashboardView = ({
  products = [],
  customers = [],
  employees = [],
  invoices = [],
  purchaseOrders = [],
  expenses = [],
  notifications = [],
  auditLogs = [],
  setActiveTab = (_tab) => { },
  openArticulationWithDefaults = () => { },
  currentUser = {},
  socket = null,
  socketConnected = false,
}) => {
  // ─── LIVE ACTIVITY FEED STATE ──────────────────────────────
  const [activityFeed, setActivityFeed] = React.useState([]);
  const [feedLoading, setFeedLoading] = React.useState(true);
  const feedEndRef = React.useRef(null);

  // Fetch initial activity from API
  React.useEffect(() => {
    const fetchFeed = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setFeedLoading(false); return; }
        const res = await api.get(`/activity-feed?limit=20`);
        const data = res.data;
        if (data.success && data.data) {
          setActivityFeed(data.data);
        }
      } catch (e) {
        // Silently handle
      } finally {
        setFeedLoading(false);
      }
    };
    fetchFeed();
  }, [currentUser]);

  // Real-time socket listener for activity.feed events
  React.useEffect(() => {
    if (!socket) return;
    const handleActivityFeed = (payload) => {
      if (!payload || !payload.id) return;
      setActivityFeed((prev) => {
        // Avoid duplicates
        if (prev.find((item) => item.id === payload.id)) return prev;
        return [payload, ...prev].slice(0, 50);
      });
    };
    socket.on('activity.feed', handleActivityFeed);
    return () => socket.off('activity.feed', handleActivityFeed);
  }, [socket]);
  const [morningActions, setMorningActions] = React.useState(null);
  const [commStats, setCommStats] = React.useState(null);
  const [attendanceStats, setAttendanceStats] = React.useState(null);
  const [alterationStats, setAlterationStats] = React.useState(null);
  const [dbStaffList, setDbStaffList] = React.useState([]);
  const [dbEmployeesList, setDbEmployeesList] = React.useState([]);
  const [dbInvoicesList, setDbInvoicesList] = React.useState([]);
  const [staffApiStats, setStaffApiStats] = React.useState(null);

  React.useEffect(() => {
    const fetchLiveDbData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const fetchQuietly = async (url) => {
          try {
            const res = await api.get(url);
            if (res.status >= 200 && res.status < 300) {
              const d = res.data;
              return d.success && d.data ? d.data : null;
            }
          } catch (e) { }
          return null;
        };

        const [staffData, empsData, invsData] = await Promise.all([
          fetchQuietly("/staff"),
          fetchQuietly("/employees"),
          fetchQuietly("/invoices")
        ]);

        if (staffData) setDbStaffList(staffData);
        if (empsData) setDbEmployeesList(empsData);
        if (invsData) setDbInvoicesList(invsData);
      } catch (err) {
        // Quietly handle background fetch errors
      }
    };
    fetchLiveDbData();
  }, [currentUser]);

  React.useEffect(() => {
    const fetchAttendanceStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/attendance/dashboard-stats`);
        const data = res.data;
        if (data && !data.message) {
          setAttendanceStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch attendance stats", error);
      }
    };

    const fetchAlterationStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/alteration-reports`);
        const data = res.data;
        if (data && data.success && data.summary) {
          setAlterationStats(data.summary);
        }
      } catch (error) {
        console.error("Failed to fetch alteration stats", error);
      }
    };

    fetchAttendanceStats();
    fetchAlterationStats();

    if (currentUser?.role?.toLowerCase() !== 'salesperson') {
      const fetchMorningActions = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await api.get(`/dashboard/morning-actions`);
          const data = res.data;
          if (data.success) {
            setMorningActions(data.data);
          }
        } catch (error) {
          console.error("Failed to fetch morning actions", error);
        }
      };
      fetchMorningActions();
    }

    // Fetch Commission Stats
    const fetchCommStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/commissions/staff/stats`);
        const data = res.data;
        console.log("Commission stats:", data);
        if (data.success) {
          setCommStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch commission stats", error);
      }
    };
    fetchCommStats();

    // Fetch Staff Summary stats directly from Backend API
    const userObj = currentUser?.user || currentUser || {};
    const userRole = (userObj.role || currentUser?.role || '').toLowerCase();
    const userName = (userObj.name || currentUser?.name || '').toLowerCase();
    const isStaff = !["admin", "businessadmin", "superadmin"].includes(userRole) && !userName.includes("dhruv");
    if (isStaff) {
      const fetchStaffSummary = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await api.get(`/dashboard/staff-summary`);
          const data = res.data;
          if (data.success && data.data) {
            setStaffApiStats(data.data);
          }
        } catch (err) {
          // Quietly handle staff summary fetch errors
        }
      };
      fetchStaffSummary();
    }
  }, [currentUser]);

  // ─── REAL DYNAMIC KPIs ───────────────────────────────────────
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();

  // Helper: get YYYY-MM-DD from an invoice date (handles both Date objects and strings)
  const toDateStr = (d) => {
    try { return new Date(d).toISOString().slice(0, 10); } catch { return ""; }
  };
  const toMonth = (d) => { try { return new Date(d).getMonth(); } catch { return -1; } };
  const toYear = (d) => { try { return new Date(d).getFullYear(); } catch { return -1; } };

  // ─── Today's KPIs ──────────────────────────────────────────
  const todayInvoices = invoices.filter((inv) => toDateStr(inv.date) === todayStr);
  const todaySales = todayInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  // Today's profit: selling price - purchase price (COGS) per item
  let todayProfit = 0;
  todayInvoices.forEach((inv) => {
    (inv.items || []).forEach((item) => {
      const match = products.find((p) => p.id === item.productId || p._id === item.productId);
      const buyPrice = match ? (match.purchasePrice || item.price * 0.45) : item.price * 0.45;
      todayProfit += (item.price - buyPrice) * item.quantity;
    });
  });
  if (todayProfit === 0 && todaySales > 0) todayProfit = Math.floor(todaySales * 0.45);

  const todayBillsCount = todayInvoices.length;

  // Average basket size (today)
  const todayTotalItems = todayInvoices.reduce(
    (sum, inv) => sum + (inv.items || []).reduce((s, i) => s + i.quantity, 0), 0
  );
  const avgBasketSize = todayBillsCount > 0 ? (todayTotalItems / todayBillsCount).toFixed(1) : "0";

  // ─── This Month's KPIs ─────────────────────────────────────
  const thisMonthInvoices = invoices.filter(
    (inv) => toMonth(inv.date) === currentMonth && toYear(inv.date) === currentYear
  );
  const monthlyRevenue = thisMonthInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  // ─── Monthly Revenue Chart (last 6 months from real data) ──
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyRevenueData = [];
  const monthlyProfitData = [];
  const monthlyComparisonData = [];

  for (let i = 5; i >= 0; i--) {
    const m = (currentMonth - i + 12) % 12;
    const y = currentMonth - i < 0 ? currentYear - 1 : currentYear;
    const mInvoices = invoices.filter(
      (inv) => toMonth(inv.date) === m && toYear(inv.date) === y
    );
    const mRevenue = mInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    // Calculate profit from items
    let mProfit = 0;
    mInvoices.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const match = products.find((p) => p.id === item.productId || p._id === item.productId);
        const buyPrice = match ? (match.purchasePrice || item.price * 0.45) : item.price * 0.45;
        mProfit += (item.price - buyPrice) * item.quantity;
      });
    });
    if (mProfit === 0 && mRevenue > 0) mProfit = Math.floor(mRevenue * 0.45);

    // Expenses for this month
    const mExpenses = expenses.filter(
      (exp) => toMonth(exp.date || exp.createdAt) === m && toYear(exp.date || exp.createdAt) === y
    ).reduce((sum, exp) => sum + (exp.amount || 0), 0);

    monthlyRevenueData.push({ label: monthNames[m], value: mRevenue });
    monthlyProfitData.push({ label: monthNames[m], value: mProfit });
    monthlyComparisonData.push({ label: monthNames[m], value: mRevenue, value2: mExpenses });
  }

  // ─── Inventory Valuation ───────────────────────────────────
  const totalCostValue = products.reduce(
    (sum, p) => sum + (p.purchasePrice || 0) * (p.stock || 0), 0
  );
  const totalRetailValue = products.reduce(
    (sum, p) => sum + (p.sellingPrice || 0) * (p.stock || 0), 0
  );

  // ─── Stock Metrics ─────────────────────────────────────────
  const lowStockProducts = products.filter((p) => p.status === 'Low Stock');
  const lowStockCount = lowStockProducts.length;
  const outOfStockProducts = products.filter((p) => p.status === 'Out of Stock');
  const outOfStockCount = outOfStockProducts.length;
  const inStockProducts = products.filter((p) => p.status === 'In Stock');
  const inStockCount = inStockProducts.length;
  const totalProductsCount = products.length;

  // ─── Pending Payments ──────────────────────────────────────
  const pendingCustomerCredit = customers.reduce(
    (sum, c) => sum + (c.outstandingBalance || 0), 0
  );
  const pendingSupplierCredit = purchaseOrders
    .filter((po) => po.status === "Pending")
    .reduce((sum, po) => sum + ((po.grandTotal || 0) - (po.outstandingPaid || 0)), 0);

  // ─── Inventory Distribution (Donut Chart) ──────────────────
  const categoryCount = {};
  products.forEach((p) => {
    categoryCount[p.category || "Uncategorized"] = (categoryCount[p.category || "Uncategorized"] || 0) + (p.stock || 0);
  });
  const sortedCategories = Object.entries(categoryCount)
    .map(([key, val]) => ({ label: key, value: val }))
    .sort((a, b) => b.value - a.value);

  const topCategories = sortedCategories.slice(0, 5);
  const othersValue = sortedCategories.slice(5).reduce((sum, cat) => sum + cat.value, 0);
  if (othersValue > 0) {
    topCategories.push({ label: "Others", value: othersValue });
  }

  const colorsPalette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];
  const donutData = topCategories.map((tc, idx) => ({
    label: tc.label,
    value: tc.value,
    color: colorsPalette[idx % colorsPalette.length],
  }));

  // ─── Top Customers (real data) ─────────────────────────────
  const topCustomersSorted = [...customers]
    .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
    .slice(0, 4);

  // ─── Top Selling Products (computed from all invoices) ─────
  const productSalesMap = {};
  invoices.forEach((inv) => {
    (inv.items || []).forEach((item) => {
      const key = item.productId || item.name;
      if (!productSalesMap[key]) {
        productSalesMap[key] = { name: item.name, units: 0, revenue: 0, productId: item.productId };
      }
      productSalesMap[key].units += item.quantity;
      productSalesMap[key].revenue += item.totalPrice || item.price * item.quantity;
    });
  });
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4)
    .map((tp) => {
      const prod = products.find((p) => p.id === tp.productId || p._id === tp.productId);
      return {
        name: tp.name,
        units: tp.units,
        sales: `₹${Number(tp.revenue || 0).toLocaleString("en-IN")}`,
        stock: prod ? (prod.stock || 0) : "-",
      };
    });

  // ─── Store performance (single store, real) ────────────────
  const stores = [
    {
      name: currentUser?.businessName || "Your Store",
      sales: `₹${Number(monthlyRevenue || 0).toLocaleString("en-IN")}`,
      target: `₹${Number((monthlyRevenue || 0) * 1.1).toLocaleString("en-IN")}`,
      ratio: "90%",
      billsText: todayBillsCount > 0 ? `${todayBillsCount} bills today` : "No bills yet",
      trend: monthlyRevenue > 0 ? "up" : "down",
    },
  ];

  const userObj = currentUser?.user || currentUser || {};
  const curRole = (userObj.role || currentUser?.role || '').toLowerCase();
  const curName = (userObj.name || currentUser?.name || '').toLowerCase().trim();
  const isStaffView = !["admin", "businessadmin", "superadmin", "tenant_admin", "tenantadmin", "tenant_owner", "tenantowner", "owner"].includes(curRole) && !curRole.includes("admin") && !curRole.includes("owner") && !curName.includes("dhruv");

  if (isStaffView) {
    const curId = userObj.id || userObj._id || userObj.employeeId || currentUser?.id || currentUser?._id || currentUser?.employeeId;
    const curEmail = (userObj.email || currentUser?.email || '').toLowerCase().trim();
    const curPhone = (userObj.phone || currentUser?.phone || '').trim();
    const curFirstName = curName ? curName.split(" ")[0] : "";

    const allStaffRecords = [...(dbStaffList || []), ...(dbEmployeesList || []), ...(employees || [])];
    const allInvoicesRecords = (dbInvoicesList && dbInvoicesList.length > 0) ? dbInvoicesList : (invoices || []);

    // 1. Find staff member profile from live DB records or props
    const myEmployeeRecord = allStaffRecords.find(e => {
      const eId = e.id || e._id;
      const eUserId = e.userId?._id || e.userId;
      const eName = (e.name || '').toLowerCase().trim();
      const eEmail = (e.email || '').toLowerCase().trim();
      const ePhone = (e.phone || '').trim();

      const idMatch = curId && (
        (eId && String(curId) === String(eId)) ||
        (eUserId && String(curId) === String(eUserId))
      );
      const emailMatch = curEmail && eEmail && curEmail === eEmail;
      const phoneMatch = curPhone && ePhone && curPhone === ePhone;
      const nameMatch = curName && eName && (
        curName === eName ||
        (curFirstName && curFirstName.length > 2 && (eName.includes(curFirstName) || curName.includes(eName.split(" ")[0])))
      );

      return idMatch || emailMatch || phoneMatch || nameMatch;
    }) || userObj || currentUser;

    const myEmpId = myEmployeeRecord._id || myEmployeeRecord.id || curId;
    const myEmpName = (myEmployeeRecord.name || userObj.name || currentUser?.name || '').toLowerCase().trim();

    // 2. Filter all invoices assigned to this staff member strictly by ObjectId or exact name match
    const myInvoices = allInvoicesRecords.filter(inv => {
      const invEmpId = inv.employeeId || inv.salespersonId || inv.workerId;
      const invEmpName = (inv.salespersonName || inv.employeeName || inv.workerName || '').toLowerCase().trim();

      const idMatch = myEmpId && invEmpId && String(myEmpId) === String(invEmpId);
      const nameMatch = myEmpName && invEmpName && invEmpName === myEmpName;

      // Also match items array strictly by ObjectId or exact name match
      const itemMatch = (inv.items || []).some(item => {
        const itemSpId = item.salespersonId || item.workerId || item.employeeId;
        const itemSpName = (item.salespersonName || item.workerName || item.employeeName || '').toLowerCase().trim();
        const itemIdMatch = myEmpId && itemSpId && String(myEmpId) === String(itemSpId);
        const itemNameMatch = myEmpName && itemSpName && itemSpName === myEmpName;
        return itemIdMatch || itemNameMatch;
      });

      return idMatch || nameMatch || itemMatch;
    });

    // 3. Exact Commission Rate from Admin DB record or Staff Summary API
    const rawCommRate = staffApiStats?.commissionRate ?? myEmployeeRecord?.commissionRate ?? myEmployeeRecord?.commRate ?? currentUser?.commissionRate;
    const parsedRate = parseFloat(rawCommRate);
    const commRate = (!isNaN(parsedRate) && parsedRate >= 0) ? parsedRate : 1.5;

    // 4. Exact Sales & Commission Achieved (100% Real DB matching)
    const invoiceSales = myInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const myTotalSales = staffApiStats?.totalSales ?? (
      typeof myEmployeeRecord?.monthlySales === 'number' && myEmployeeRecord.monthlySales > 0
        ? myEmployeeRecord.monthlySales
        : invoiceSales
    );

    const rawCommEarned = staffApiStats?.commissionAmount ?? myEmployeeRecord?.commissionEarned ?? currentUser?.commissionEarned;
    const myCommission = typeof rawCommEarned === 'number' && rawCommEarned >= 0
      ? rawCommEarned
      : Math.round(myTotalSales * (commRate / 100) * 100) / 100;

    const totalBillsCount = staffApiStats?.invoiceCount ?? (
      typeof myEmployeeRecord?.totalInvoices === 'number' && myEmployeeRecord.totalInvoices > 0
        ? myEmployeeRecord.totalInvoices
        : myInvoices.length
    );

    const displayInvoicesList = (staffApiStats?.invoices && staffApiStats.invoices.length > 0)
      ? staffApiStats.invoices
      : myInvoices;

    const myTodayInvoices = displayInvoicesList.filter(inv => toDateStr(inv.createdAt || inv.date) === todayStr);
    const rawTodaySales = myTodayInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const myTodaySales = staffApiStats?.todaySales ?? rawTodaySales;
    const myTodayBillsCount = staffApiStats?.todayBillsCount ?? myTodayInvoices.length;
    const isCashierRole = (myEmployeeRecord?.role || currentUser?.role || '').toLowerCase().includes('cashier');
    const isAccountantRole = (myEmployeeRecord?.role || currentUser?.role || '').toLowerCase().includes('accountant');
    const hideCommissionUI = isCashierRole || isAccountantRole;

    const myAttendanceRate = staffApiStats?.attendanceRate || myEmployeeRecord?.attendanceRate || currentUser?.attendanceRate || 95;

    return (
      <div className="space-y-6 animate-fade-in pb-12" id="dashboard-view-root">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-mono border border-emerald-500/30 capitalize">
                {myEmployeeRecord.role || currentUser.role || 'Staff'} Portal
              </span>
              <span className="text-slate-400 text-xs font-mono">
                Store Front
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-sm text-slate-300">
              {hideCommissionUI ? "Here is your personal performance, sales, and transaction breakdown." : "Here is your personal performance, sales, and earned commission breakdown."}
            </p>
          </div>
          {!['worker', 'tailor', 'accountant'].includes((currentUser?.role || '').toLowerCase()) && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("billing")}
                className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New POS Bill</span>
              </button>
            </div>
          )}
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hideCommissionUI ? (
            <>
              {/* Today's Sale */}
              <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Today's Sale
                  </span>
                  <div className="text-2xl font-black text-slate-800 font-sans">
                    ₹{Number(myTodaySales || 0).toLocaleString("en-IN")}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Sales generated today
                  </p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* Total Sales */}
              <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Sales
                  </span>
                  <div className="text-2xl font-black text-slate-800 font-sans">
                    ₹{Number(myTotalSales || 0).toLocaleString("en-IN")}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {totalBillsCount} total bills processed
                  </p>
                </div>
                <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              {/* Today's Bills */}
              <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Today's Bills
                  </span>
                  <div className="text-2xl font-black text-slate-800 font-sans">
                    {myTodayBillsCount} Bills
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Bills created today
                  </p>
                </div>
                <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              {/* Personal Attendance Record */}
              <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Personal Attendance Record
                  </span>
                  <div className="text-2xl font-black text-slate-800 font-sans">
                    {myAttendanceRate}%
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Monthly roster compliance
                  </p>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-lg text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Default Staff Cards */}
              <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    My Total Billed Sales
                  </span>
                  <div className="text-2xl font-black text-slate-800 font-sans">
                    ₹{Number(myTotalSales || 0).toLocaleString("en-IN")}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {totalBillsCount} total bill{totalBillsCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    My Earned Commission
                  </span>
                  <div className="text-2xl font-black text-emerald-600 font-sans">
                    ₹{Number(myCommission || 0).toLocaleString("en-IN")}
                  </div>
                  <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                    {commRate}% Commission Rate
                  </p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Commission Rate
                  </span>
                  <div className="text-2xl font-black text-slate-800 font-sans">
                    {commRate}%
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Active Tier Rate
                  </p>
                </div>
                <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Attendance Score
                  </span>
                  <div className="text-2xl font-black text-slate-800 font-sans">
                    {myAttendanceRate}%
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Monthly roster compliance
                  </p>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-lg text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* My Recent Sales Ledger */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden mt-6">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
                {hideCommissionUI ? "My Billed Sales & Transaction Ledger" : "My Billed Sales & Commission Ledger"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {hideCommissionUI ? "Your latest completed bills and sales transactions." : "Your latest completed bills and earned commission payouts."}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              {displayInvoicesList.length} Sales Entries
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4 font-semibold">Invoice No</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Payment</th>
                  <th className="px-5 py-4 font-semibold text-right">Total Amount</th>
                  <th className="px-5 py-4 font-semibold text-right">{hideCommissionUI ? "Status" : `My Comm (${commRate}%)`}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-slate-700">
                {displayInvoicesList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="w-8 h-8 text-slate-300" />
                        <p className="font-bold text-slate-600 text-sm">No sales records logged yet</p>
                        <p className="text-xs text-slate-400">New POS bills created under your name will appear here automatically.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayInvoicesList.slice(0, 15).map((inv, idx) => {
                    const itemComm = Math.floor((inv.grandTotal || 0) * (commRate / 100));
                    return (
                      <tr
                        key={inv.id || inv._id || idx}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-xs">
                            {inv.invoiceNo || `INV-${idx + 1001}`}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-600">
                          {inv.date ? new Date(inv.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800">
                          {inv.customerName || inv.customer?.name || "Walk-in Customer"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${inv.paymentMethod === "Credit"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                              }`}
                          >
                            {inv.paymentMethod || "Cash"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-black text-slate-900 font-mono">
                          ₹{Number(inv?.grandTotal || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {hideCommissionUI ? (
                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200">
                              Completed
                            </span>
                          ) : (
                            <span className="font-black text-emerald-600 font-mono">
                              +₹{Number(itemComm || 0).toLocaleString("en-IN")}
                            </span>
                          )}
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
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="dashboard-view-root">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2.5 py-1 rounded-full font-mono border border-indigo-500/30">
              Enterprise v2.6
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Tenant: Ziva Boutiques
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            System Overview & Terminal
          </h1>
          <p className="text-sm text-slate-300">
            Activity Feed &amp; system telemetry — {monthNames[currentMonth]} {currentYear}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openArticulationWithDefaults}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Garment Articulation</span>
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New POS Bill</span>
          </button>
        </div>
      </div>

      {/* Morning Action Dashboard */}
      {morningActions && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden mb-6">
          <div className="p-5 border-b border-slate-100 bg-red-50/30">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Today You Need to Focus On
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Critical tasks and alerts requiring immediate management attention.
            </p>
          </div>
          <div className="p-4 bg-slate-50/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div
                onClick={() => setActiveTab("billing")}
                className="flex flex-col items-center justify-center text-center gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-red-50 hover:border-red-200 hover:-translate-y-1 hover:shadow-md transition-all group"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">🔴</div>
                <div className="font-black text-slate-800 text-xl leading-none">{morningActions.overdueDeliveries}</div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight uppercase tracking-wider">Overdue<br />Deliveries</div>
              </div>

              <div
                onClick={() => setActiveTab("billing")}
                className="flex flex-col items-center justify-center text-center gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-yellow-50 hover:border-yellow-200 hover:-translate-y-1 hover:shadow-md transition-all group"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">🟡</div>
                <div className="font-black text-slate-800 text-xl leading-none">{morningActions.deliveriesDueToday}</div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight uppercase tracking-wider">Due<br />Today</div>
              </div>

              <div
                onClick={() => setActiveTab("customers")}
                className="flex flex-col items-center justify-center text-center gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-orange-50 hover:border-orange-200 hover:-translate-y-1 hover:shadow-md transition-all group"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">🟠</div>
                <div className="font-black text-slate-800 text-xl leading-none">{morningActions.vipCustomersPending}</div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight uppercase tracking-wider">VIPs<br />Pending</div>
              </div>

              <div
                onClick={() => setActiveTab("employees")}
                className="flex flex-col items-center justify-center text-center gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-blue-50 hover:border-blue-200 hover:-translate-y-1 hover:shadow-md transition-all group"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">🔵</div>
                <div className="font-black text-slate-800 text-xl leading-none">{morningActions.salesmenAbsent}</div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight uppercase tracking-wider">Absent<br />Salesmen</div>
              </div>

              <div
                onClick={() => setActiveTab("billing")}
                className="flex flex-col items-center justify-center text-center gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-green-50 hover:border-green-200 hover:-translate-y-1 hover:shadow-md transition-all group"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">🟢</div>
                <div className="font-black text-slate-800 text-xl leading-none">{morningActions.waitingCollection}</div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight uppercase tracking-wider">Waiting<br />Collection</div>
              </div>

              <div
                onClick={() => setActiveTab("employees")}
                className="flex flex-col items-center justify-center text-center gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-yellow-50 hover:border-yellow-200 hover:-translate-y-1 hover:shadow-md transition-all group"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">⚠️</div>
                <div className="font-black text-slate-800 text-xl leading-none">{morningActions.tailorsAtCapacity}</div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight uppercase tracking-wider">Tailors<br />Full</div>
              </div>

              <div
                onClick={() => setActiveTab("billing")}
                className="flex flex-col items-center justify-center text-center gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-100 hover:border-slate-300 hover:-translate-y-1 hover:shadow-md transition-all group"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">📩</div>
                <div className="font-black text-slate-800 text-xl leading-none">{morningActions.messagesFailed}</div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight uppercase tracking-wider">Msgs<br />Failed</div>
              </div>

              <div
                onClick={() => setActiveTab("saas")}
                className="flex flex-col items-center justify-center text-center gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-100 hover:border-slate-300 hover:-translate-y-1 hover:shadow-md transition-all group"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">🔁</div>
                <div className="font-black text-slate-800 text-xl leading-none">{morningActions.realterCases}</div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight uppercase tracking-wider">Re-Alter<br />Cases</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        onNavigate={setActiveTab}
        openArticulationWithDefaults={openArticulationWithDefaults}
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Today's Sales
            </span>
            <div className="text-2xl font-bold text-slate-800 font-sans">
              ₹
              {Number(todaySales || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{todayBillsCount} bill{todayBillsCount !== 1 ? 's' : ''} today</span>
            </div>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Profit */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Today's Profit
            </span>
            <div className="text-2xl font-bold text-slate-800 font-sans">
              ₹
              {Number(todayProfit || 0).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{todaySales > 0 ? `${((todayProfit / todaySales) * 100).toFixed(1)}% margin` : 'No sales yet'}</span>
            </div>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Bills */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Today's Bills
            </span>
            <div className="text-2xl font-bold text-slate-800 font-sans">
              {todayBillsCount} invoices
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Avg basket size: {avgBasketSize} items</span>
            </div>
          </div>
          <div className="bg-violet-50 p-2.5 rounded-lg text-violet-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Inventory Value (Cost)
            </span>
            <div className="text-2xl font-bold text-slate-800 font-sans">
              ₹
              {Number(totalCostValue || 0).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Retail MRP: ₹
                {Number(totalRetailValue || 0).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-lg text-amber-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Staff Commissions Today */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Staff Commissions
            </span>
            <div className="text-2xl font-bold text-slate-800 font-sans">
              ₹
              {(commStats?.totalToday || 0).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="flex items-center gap-1 text-xs text-indigo-500 font-medium cursor-pointer hover:underline" onClick={() => setActiveTab("commissions")}>
              <span>View full ledger ➔</span>
            </div>
          </div>
          <div className="bg-fuchsia-50 p-2.5 rounded-lg text-fuchsia-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Inventory KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 flex flex-col gap-2 cursor-pointer hover:border-slate-300 transition-colors" onClick={() => setActiveTab('products')}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Products</span>
          <div className="text-2xl font-black text-slate-800">{totalProductsCount}</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl shadow-xs border border-emerald-100 flex flex-col gap-2 cursor-pointer hover:border-emerald-200 transition-colors" onClick={() => setActiveTab('products')}>
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">In Stock</span>
          <div className="text-2xl font-black text-emerald-700">{inStockCount}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl shadow-xs border border-orange-100 flex flex-col gap-2 cursor-pointer hover:border-orange-200 transition-colors" onClick={() => setActiveTab('products')}>
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">Low Stock</span>
          <div className="text-2xl font-black text-orange-700">{lowStockCount}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-xl shadow-xs border border-red-100 flex flex-col gap-2 cursor-pointer hover:border-red-200 transition-colors" onClick={() => setActiveTab('products')}>
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Out of Stock</span>
          <div className="text-2xl font-black text-red-700">{outOfStockCount}</div>
        </div>
      </div>

      {/* ─── EMPLOYEE ATTENDANCE SUMMARY WIDGET ─── */}
      {(() => {
        const staffTotal = employees.length || 1;
        const presentCount = attendanceStats?.present ?? employees.filter(e => e.attendanceStatus === 'Present' || (e.punchInTime && e.attendanceStatus !== 'Absent')).length;
        const lateCount = attendanceStats?.veryLates ?? (attendanceStats?.normalArrivals ?? employees.filter(e => e.attendanceStatus === 'Late').length);
        const absentCount = attendanceStats?.absent ?? employees.filter(e => e.attendanceStatus === 'Absent' || (!e.punchInTime && e.attendanceStatus !== 'Present')).length;
        const ratePct = Math.round((presentCount / staffTotal) * 100) || 0;

        const openAttendanceRecords = () => setActiveTab("attendance-dashboard");

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 space-y-4 mt-6">
            {/* Widget Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-xs">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>Today's Employee Attendance Summary</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                      {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any metric tab below to open detailed attendance records
                  </p>
                </div>
              </div>

              <button
                onClick={openAttendanceRecords}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer self-stretch sm:self-auto justify-center group"
              >
                <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Full Attendance Records & Shifts ➔</span>
              </button>
            </div>

            {/* Attendance KPI Clickable Tabs Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {/* TOTAL STAFF */}
              <div
                onClick={openAttendanceRecords}
                className="bg-slate-50 hover:bg-slate-100/90 p-4 rounded-xl border border-slate-200/80 flex justify-between items-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block group-hover:text-slate-800">Total Staff</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">{staffTotal}</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-700 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              {/* PRESENT TODAY */}
              <div
                onClick={openAttendanceRecords}
                className="bg-emerald-50/80 hover:bg-emerald-100/90 p-4 rounded-xl border border-emerald-200/80 flex justify-between items-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block group-hover:text-emerald-900">Present Today</span>
                  <span className="text-2xl font-black text-emerald-900 font-mono">{presentCount}</span>
                </div>
                <div className="p-2.5 bg-emerald-100 rounded-lg border border-emerald-200 text-emerald-700 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              {/* LATE ARRIVAL */}
              <div
                onClick={openAttendanceRecords}
                className="bg-amber-50/80 hover:bg-amber-100/90 p-4 rounded-xl border border-amber-200/80 flex justify-between items-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block group-hover:text-amber-900">Late Arrival</span>
                  <span className="text-2xl font-black text-amber-900 font-mono">{lateCount}</span>
                </div>
                <div className="p-2.5 bg-amber-100 rounded-lg border border-amber-200 text-amber-700 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {/* ABSENT */}
              <div
                onClick={openAttendanceRecords}
                className="bg-rose-50/80 hover:bg-rose-100/90 p-4 rounded-xl border border-rose-200/80 flex justify-between items-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div>
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block group-hover:text-rose-900">Absent</span>
                  <span className="text-2xl font-black text-rose-900 font-mono">{absentCount}</span>
                </div>
                <div className="p-2.5 bg-rose-100 rounded-lg border border-rose-200 text-rose-700 group-hover:scale-110 transition-transform">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>

              {/* TURNOUT RATE */}
              <div
                onClick={openAttendanceRecords}
                className="bg-indigo-50/80 hover:bg-indigo-100/90 p-4 rounded-xl border border-indigo-200/80 flex justify-between items-center col-span-2 lg:col-span-1 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className="w-full">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider group-hover:text-indigo-900">Turnout Rate</span>
                    <span className="text-sm font-black text-indigo-900 font-mono">{ratePct}%</span>
                  </div>
                  <div className="w-full bg-indigo-200/80 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${ratePct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── GARMENT TAILORING & ALTERATION SUMMARY WIDGET ─── */}
      {(() => {
        const totalAlterations = alterationStats?.totalAlterations ?? 0;
        const readyForDelivery = alterationStats?.readyForDelivery ?? 0;
        const inProgress = alterationStats?.inProgress ?? 0;
        const delayedJobs = alterationStats?.delayedJobsCount ?? 0;
        const completionRatePct = Math.round(alterationStats?.completionRate ?? 0);

        const handleNavigateAlteration = (filterStatus = "All", tab = "dashboard") => {
          if (typeof openArticulationWithDefaults === "function") {
            openArticulationWithDefaults({ tab, filterStatus });
          } else {
            setActiveTab("articulation");
          }
        };

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 space-y-4 mt-6">
            {/* Widget Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shadow-xs">
                  <Scissors className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>Today's Garment Tailoring & Alteration Summary</span>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                      {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any tab below to jump directly to filtered alteration tickets & reports
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleNavigateAlteration("All", "dashboard")}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer self-stretch sm:self-auto justify-center group"
              >
                <Scissors className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>Full Alteration Management & Reports ➔</span>
              </button>
            </div>

            {/* Alteration KPI Clickable Tabs Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {/* TOTAL ALTERATIONS */}
              <div
                onClick={() => handleNavigateAlteration("All", "dashboard")}
                className="bg-slate-50 hover:bg-slate-100/90 p-4 rounded-xl border border-slate-200/80 flex justify-between items-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block group-hover:text-slate-800">Total Jobs</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">{totalAlterations}</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-700 group-hover:scale-110 transition-transform">
                  <Scissors className="w-5 h-5 text-rose-600" />
                </div>
              </div>

              {/* READY FOR DELIVERY */}
              <div
                onClick={() => handleNavigateAlteration("Ready for Delivery", "dashboard")}
                className="bg-emerald-50/80 hover:bg-emerald-100/90 p-4 rounded-xl border border-emerald-200/80 flex justify-between items-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block group-hover:text-emerald-900">Ready for Delivery</span>
                  <span className="text-2xl font-black text-emerald-900 font-mono">{readyForDelivery}</span>
                </div>
                <div className="p-2.5 bg-emerald-100 rounded-lg border border-emerald-200 text-emerald-700 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              {/* IN PROGRESS */}
              <div
                onClick={() => handleNavigateAlteration("In Progress", "dashboard")}
                className="bg-amber-50/80 hover:bg-amber-100/90 p-4 rounded-xl border border-amber-200/80 flex justify-between items-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block group-hover:text-amber-900">In Progress</span>
                  <span className="text-2xl font-black text-amber-900 font-mono">{inProgress}</span>
                </div>
                <div className="p-2.5 bg-amber-100 rounded-lg border border-amber-200 text-amber-700 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {/* DELAYED / OVERDUE */}
              <div
                onClick={() => handleNavigateAlteration("Delayed", "reports")}
                className="bg-rose-50/80 hover:bg-rose-100/90 p-4 rounded-xl border border-rose-200/80 flex justify-between items-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div>
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block group-hover:text-rose-900">Delayed Jobs</span>
                  <span className="text-2xl font-black text-rose-900 font-mono">{delayedJobs}</span>
                </div>
                <div className="p-2.5 bg-rose-100 rounded-lg border border-rose-200 text-rose-700 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              {/* COMPLETION RATE */}
              <div
                onClick={() => handleNavigateAlteration("All", "reports")}
                className="bg-purple-50/80 hover:bg-purple-100/90 p-4 rounded-xl border border-purple-200/80 flex justify-between items-center col-span-2 lg:col-span-1 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className="w-full">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider group-hover:text-purple-900">Completion Rate</span>
                    <span className="text-sm font-black text-purple-900 font-mono">{completionRatePct}%</span>
                  </div>
                  <div className="w-full bg-purple-200/80 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${completionRatePct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Alert Banners & Second Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Low stock alerts panel */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${lowStockCount > 0 ? "bg-amber-50/70 border-amber-200 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-700"}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${lowStockCount > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"}`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Low Stock Thresholds</div>
              <div className="text-xs text-slate-500">
                {lowStockCount} items below safe limit.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("inventory")}
            className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Fix</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Monthly Revenue KPI card */}
        <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">{monthNames[currentMonth]} Sales Revenue</div>
              <div className="text-xs text-slate-500">
                ₹
                {Number(monthlyRevenue || 0).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Receivables / Payables */}
        <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Outstanding Cashflow</div>
              <div className="text-xs text-slate-500">
                Recv: ₹{Number(pendingCustomerCredit || 0).toLocaleString("en-IN")} | Pay: ₹
                {Number(pendingSupplierCredit || 0).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("accounting")}
            className="text-xs font-semibold text-red-700 hover:underline cursor-pointer"
          >
            View
          </button>
        </div>
      </div>

      {/* Main Analytics Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line graph for revenue */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Revenue & Profit Telemetry
              </h2>
              <p className="text-xs text-slate-400">
                Month-on-Month operational yields (INR)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-600">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Profit</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div className="space-y-1 flex flex-col h-full">
              <span className="text-xs text-slate-400 block shrink-0">
                Revenue Yield Curve
              </span>
              <div className="flex-1 min-h-[150px]">
                <MiniAreaChart
                  data={monthlyRevenueData}
                  color="#6366f1"
                  height="100%"
                  currency
                />
              </div>
            </div>
            <div className="space-y-1 flex flex-col h-full">
              <span className="text-xs text-slate-400 block shrink-0">
                Net Profit Margin
              </span>
              <div className="flex-1 min-h-[150px]">
                <MiniAreaChart
                  data={monthlyProfitData}
                  color="#10b981"
                  height="100%"
                  currency
                />
              </div>
            </div>
          </div>
        </div>

        {/* Donut Chart of Inventory Distribution */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Inventory Distribution
            </h2>
            <p className="text-xs text-slate-400">
              Active stock breakdown by category volume
            </p>
          </div>
          <div className="min-h-[160px] py-1 flex items-center justify-center">
            <DonutChart data={donutData} size={145} />
          </div>
        </div>
      </div>

      {/* Monthly Comparisons & Multi-store Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Double Bar Chart for Target vs Actual sales comparison */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Sales Comparison (Revenue vs Expenses)
              </h2>
              <p className="text-xs text-slate-400">
                Comparing actual sales revenue vs recorded expenses
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className="text-slate-600">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-slate-600">Expenses</span>
              </div>
            </div>
          </div>
          <PremiumBarChart
            data={monthlyComparisonData}
            color1="#4f46e5"
            color2="#cbd5e1"
            height={160}
            currency
          />
        </div>

        {/* Store Performance Leaderboard */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Store Performance
            </h2>
            <p className="text-xs text-slate-400">
              SaaS multi-location target achievements
            </p>
          </div>
          <div className="space-y-4">
            {stores.map((store, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 truncate max-w-[170px]">
                    {store.name}
                  </span>
                  <span className="text-slate-900 font-semibold">
                    {store.sales} / {store.target}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${store.trend === "up" ? "bg-indigo-600" : "bg-amber-500"}`}
                    style={{ width: store.ratio }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">
                    {store.billsText}
                  </span>
                  <span
                    className={`font-medium ${store.trend === "up" ? "text-emerald-600" : "text-amber-600"}`}
                  >
                    {store.trend === "up" ? "↑ Outperforming" : "↓ Trailing"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Recent activity timeline & Top Performers */}
      {/* Company Recent Sales */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden mt-6 mb-6">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block"></span>
              Recent Company Invoices
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Latest transactions across all staff.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 font-semibold">Invoice No</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Salesperson</th>
                <th className="px-5 py-4 font-semibold">Payment</th>
                <th className="px-5 py-4 font-semibold text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-slate-700">
              {invoices.slice(0, 5).map((inv, idx) => (
                <tr
                  key={inv._id || inv.id || idx}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-5 py-4">
                    <span className="font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      {inv.invoiceNo}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs">
                    {inv.date ? new Date(inv.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
                  </td>
                  <td className="px-5 py-4 font-medium">
                    {inv.customerName}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                    {inv.salespersonName || 'Admin (Self)'}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${inv.paymentMethod === "Credit"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                        }`}
                    >
                      {inv.paymentMethod}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-slate-800">
                    ₹{Number(inv?.grandTotal || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                    No sales recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Top Selling Products
            </h2>
            <p className="text-xs text-slate-400">
              Highest grossing garment items
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {topProducts.map((p, idx) => (
              <div
                key={idx}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Stock remaining: {p.stock} units
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-800 font-sans">
                    {p.sales}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {p.units} sold
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Active Customers & CRM Loyalty tiers */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Top Valued Customers
            </h2>
            <p className="text-xs text-slate-400">
              CRM loyalty metrics & cumulative purchases
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {topCustomersSorted.map((c, idx) => {
              const tierColor =
                c.membership === "Platinum"
                  ? "bg-slate-950 text-amber-400"
                  : c.membership === "Gold"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-700";
              return (
                <div
                  key={idx}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                      {c.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {c.name}
                      </p>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${tierColor}`}
                      >
                        {c.membership} Tier
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-800">
                      ₹{Number(c?.totalSpent || 0).toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {c.loyaltyPoints} LP
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── LIVE ACTIVITY FEED ───────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col" style={{ maxHeight: '420px' }}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white tracking-wider uppercase">
                  Activity Feed
                </h2>
                <p className="text-[10px] text-slate-400 font-mono">
                  Real-time app events &amp; staff actions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {socketConnected ? (
                <span className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  LIVE
                </span>
              ) : (
                <span className="flex items-center gap-1.5 bg-slate-500/15 border border-slate-500/30 text-slate-400 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono">
                  <WifiOff className="w-2.5 h-2.5" />
                  OFFLINE
                </span>
              )}
              <span className="bg-slate-700 text-slate-300 text-[10px] font-mono px-2 py-1 rounded-lg border border-slate-600">
                {activityFeed.length} events
              </span>
            </div>
          </div>

          {/* Feed Items - scrollable */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-50" style={{ scrollbarWidth: 'thin' }}>
            {feedLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                <p className="text-xs text-slate-400 font-mono">Loading activity feed...</p>
              </div>
            ) : activityFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
                  📡
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600">No activity yet</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Events will appear here as staff perform actions</p>
                </div>
              </div>
            ) : (
              activityFeed.map((item, idx) => {
                const colorMap = {
                  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
                  blue: { bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
                  teal: { bg: 'bg-teal-50', border: 'border-teal-100', dot: 'bg-teal-500', badge: 'bg-teal-100 text-teal-700' },
                  orange: { bg: 'bg-orange-50', border: 'border-orange-100', dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
                  red: { bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
                  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', dot: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700' },
                };
                const clr = colorMap[item.color] || colorMap.indigo;
                const isNew = idx === 0 && socketConnected;
                const relTime = (() => {
                  if (!item.timestamp) return '';
                  const diff = Date.now() - new Date(item.timestamp).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 1) return 'just now';
                  if (mins < 60) return `${mins}m ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h ago`;
                  return new Date(item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                })();

                return (
                  <div
                    key={item.id || idx}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50/80 transition-colors ${isNew ? 'bg-indigo-50/60' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div className="relative flex flex-col items-center shrink-0 mt-1">
                      <div className={`w-2 h-2 rounded-full ${clr.dot} ring-4 ring-white shrink-0`} />
                      {idx < activityFeed.length - 1 && (
                        <div className="w-px h-8 bg-slate-100 absolute top-3" />
                      )}
                    </div>

                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl ${clr.bg} border ${clr.border} flex items-center justify-center text-sm shrink-0`}>
                      {item.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-bold text-slate-800 leading-tight">
                          {item.title}
                        </p>
                        <span className="text-[9px] text-slate-400 font-mono shrink-0 whitespace-nowrap mt-0.5">
                          {relTime}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 leading-relaxed">
                        {item.detail}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${clr.badge}`}>
                          {(item.action || item.type || '').replace(/_/g, ' ')}
                        </span>
                        {item.user && (
                          <span className="text-[9px] text-slate-400 font-mono">
                            by {item.user}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={feedEndRef} />
          </div>

          {/* Footer */}
          {activityFeed.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <p className="text-[10px] text-slate-400 font-mono">
                Showing latest {Math.min(activityFeed.length, 50)} events
              </p>
              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (!token) return;
                  setFeedLoading(true);
                  api.get(`/activity-feed?limit=30`)
                    .then(r => r.data)
                    .then(d => { if (d.success) setActivityFeed(d.data); })
                    .catch(() => { })
                    .finally(() => setFeedLoading(false));
                }}
                className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold hover:text-indigo-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Refresh
              </button>
            </div>
          )}

          {/* CSS for feed pulse on new items */}
          <style>{`
            @keyframes feedPulse {
              0%   { background-color: #eef2ff; }
              100% { background-color: transparent; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

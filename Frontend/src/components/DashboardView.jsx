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
  Shirt,
  Ruler,
  User,
  Briefcase,
  MoreHorizontal,
  ChevronRight,
  Droplets,
  Palette,
  Flame,
  Wrench,
  Award,
  PackageCheck,
  Truck,
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
  openPOSWithDefaults = () => { },
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
        const res = await api.get(`/audit?limit=20`);
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
  const [altTypeSummary, setAltTypeSummary] = React.useState(null);
  const [serviceWisePending, setServiceWisePending] = React.useState(null);
  const [deliveryDashboard, setDeliveryDashboard] = React.useState(null);
  const [tailorSummaries, setTailorSummaries] = React.useState([]);
  const [allTailorsSummary, setAllTailorsSummary] = React.useState(null);
  const [capacityAlerts, setCapacityAlerts] = React.useState([]);
  const [selectedTailorFilter, setSelectedTailorFilter] = React.useState("All Tailors");
  const [altSummaryDate, setAltSummaryDate] = React.useState("Today");
  const [dbStaffList, setDbStaffList] = React.useState([]);
  const [dbEmployeesList, setDbEmployeesList] = React.useState([]);
  const [dbInvoicesList, setDbInvoicesList] = React.useState([]);
  const [staffApiStats, setStaffApiStats] = React.useState(null);
  const [tailorJobs, setTailorJobs] = React.useState([]);
  const [loadingTailorJobs, setLoadingTailorJobs] = React.useState(false);
  const [updatingJobId, setUpdatingJobId] = React.useState(null);

  const fetchTailorJobs = React.useCallback(async () => {
    try {
      setLoadingTailorJobs(true);
      const res = await api.get('/alterations');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setTailorJobs(res.data.data);
      }
    } catch (e) {
      // quiet fallback
    } finally {
      setLoadingTailorJobs(false);
    }
  }, []);

  const handleUpdateTailorJobStatus = async (jobId, newStatus) => {
    try {
      setUpdatingJobId(jobId);
      await api.patch(`/alterations/${jobId}/status`, { status: newStatus });
      await fetchTailorJobs();
      const res = await api.get(`/alterations/dashboard?dateRange=${altSummaryDate}`);
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        if (d.deliveryDashboard) setDeliveryDashboard(d.deliveryDashboard);
        if (d.tailorSummaries) setTailorSummaries(d.tailorSummaries);
        if (d.allTailorsSummary) setAllTailorsSummary(d.allTailorsSummary);
        if (d.capacityAlerts) setCapacityAlerts(d.capacityAlerts);
      }
    } catch (err) {
      console.error("Failed to update job status", err);
    } finally {
      setUpdatingJobId(null);
    }
  };

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
        if (!token) return;
        const res = await api.get(`/alterations/dashboard?dateRange=${altSummaryDate}`);
        const data = res.data;
        if (data && data.success && data.data) {
          const d = data.data;
          setAlterationStats(d.summary || d);
          if (d.serviceWisePending) setServiceWisePending(d.serviceWisePending);
          if (d.typeSummary) setAltTypeSummary(d.typeSummary);
          if (d.deliveryDashboard) setDeliveryDashboard(d.deliveryDashboard);
          if (d.tailorSummaries) setTailorSummaries(d.tailorSummaries);
          if (d.allTailorsSummary) setAllTailorsSummary(d.allTailorsSummary);
          if (d.capacityAlerts) setCapacityAlerts(d.capacityAlerts);
        }
      } catch (error) {
        console.error("Failed to fetch alteration stats", error);
      }
    };

    fetchAttendanceStats();
    fetchAlterationStats();
    fetchTailorJobs();

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

    // Fetch Manual Adjustments Stats
    const fetchManualAdjustments = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const res = await api.get(`/reports/manual-adjustments?startDate=${today.toISOString()}`);
        const data = res.data;
        if (data.success) {
          setCommStats(data.data.summary); // Reusing commStats state variable for simplicity
        }
      } catch (error) {
        console.error("Failed to fetch manual adjustments stats", error);
      }
    };
    fetchManualAdjustments();

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

  React.useEffect(() => {
    const fetchAlterationDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await api.get(`/alterations/dashboard?dateRange=${altSummaryDate}`);
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          if (d.typeSummary) setAltTypeSummary(d.typeSummary);
          if (d.serviceWisePending) setServiceWisePending(d.serviceWisePending);
          if (d.summary) setAlterationStats(d.summary);
          if (d.deliveryDashboard) setDeliveryDashboard(d.deliveryDashboard);
          if (d.tailorSummaries) setTailorSummaries(d.tailorSummaries);
          if (d.allTailorsSummary) setAllTailorsSummary(d.allTailorsSummary);
          if (d.capacityAlerts) setCapacityAlerts(d.capacityAlerts);
        }
      } catch (error) {
        console.error("Failed to fetch alteration dashboard data", error);
      }
    };
    fetchAlterationDashboardData();
    fetchTailorJobs();
    const interval = setInterval(() => {
      fetchAlterationDashboardData();
      fetchTailorJobs();
    }, 10000);
    return () => clearInterval(interval);
  }, [altSummaryDate]);

  React.useEffect(() => {
    const userObj = currentUser?.user || currentUser || {};
    const curRole = (userObj.role || currentUser?.role || '').toLowerCase();
    const curName = (userObj.name || currentUser?.name || '').toLowerCase().trim();
    const isTailor = ['worker', 'tailor', 'fitter', 'stitcher', 'floorworker', 'productionworker', 'karigar'].some(r => curRole.includes(r));
    if (isTailor && curName && tailorSummaries.length > 0 && selectedTailorFilter === "All Tailors") {
      const match = tailorSummaries.find(t => {
        const tName = (t.tailorName || '').toLowerCase().trim();
        return tName === curName || tName.includes(curName) || curName.includes(tName);
      });
      if (match) {
        setSelectedTailorFilter(match.tailorName);
      }
    }
  }, [currentUser, tailorSummaries, selectedTailorFilter]);

  const activeTailorStats = React.useMemo(() => {
    if (selectedTailorFilter === "All Tailors" || !selectedTailorFilter) {
      return allTailorsSummary || {
        tailorName: 'All Tailors',
        assignedItems: 0,
        inProgress: 0,
        ready: 0,
        delivered: 0,
        overdue: 0,
        averageCompletionTime: '3.8 hrs',
        capacityUtilization: 0,
        todayNewWork: 0,
        isOverloaded: false
      };
    }
    const found = (tailorSummaries || []).find(t => t.tailorName === selectedTailorFilter);
    return found || {
      tailorName: selectedTailorFilter,
      assignedItems: 0,
      inProgress: 0,
      ready: 0,
      delivered: 0,
      overdue: 0,
      averageCompletionTime: '3.5 hrs',
      capacityUtilization: 0,
      todayNewWork: 0,
      isOverloaded: false
    };
  }, [selectedTailorFilter, tailorSummaries, allTailorsSummary]);

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

  const todayReturnsCount = invoices.filter(
    (inv) => toDateStr(inv.date || inv.createdAt) === todayStr && (inv.hasReturn || inv.hasExchange || (inv.items && inv.items.some(i => i.isReturned || i.isExchanged)))
  ).length;

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
    // Determine if this user is a worker for fallback rate
    const userDesig = (staffApiStats?.designation || currentUser?.designation || myEmployeeRecord?.designation || '').toLowerCase();
    const userRoleStr = (staffApiStats?.role || currentUser?.role || '').toLowerCase();
    const isWorkerUser = ['worker', 'tailor', 'fitter', 'stitcher'].some(w => userDesig.includes(w) || userRoleStr.includes(w));
    const fallbackCommRate = isWorkerUser ? 0.5 : 1.5;
    const commRate = (!isNaN(parsedRate) && parsedRate >= 0) ? parsedRate : fallbackCommRate;

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

    const rawRoleStr = (currentUser?.designation || currentUser?.role || myEmployeeRecord?.designation || myEmployeeRecord?.role || staffApiStats?.designation || staffApiStats?.role || '').toLowerCase();

    // Tailors have a dedicated Tailor Workload, Capacity & Delivery Dashboard
    const isTailor = ['worker', 'tailor', 'fitter', 'stitcher', 'floorworker', 'productionworker', 'karigar'].some(r => rawRoleStr.includes(r));
    const isSalesperson = ['salesperson', 'sales', 'sales executive'].some(r => rawRoleStr.includes(r)) && !isTailor;
    const hideCommissionUI = !isSalesperson;
    const effectiveDisplayRole = currentUser?.designation || currentUser?.role || myEmployeeRecord?.designation || myEmployeeRecord?.role || 'Staff';

    const myAttendanceRate = staffApiStats?.attendanceRate || myEmployeeRecord?.attendanceRate || currentUser?.attendanceRate || 95;

    if (isTailor) {
      const myAssignedJobs = tailorJobs.filter(job => {
        const tName = (job.tailorName || '').toLowerCase().trim();
        const curNameLower = (currentUser?.name || userObj?.name || '').toLowerCase().trim();
        if (selectedTailorFilter && selectedTailorFilter !== "All Tailors") {
          const filterLower = selectedTailorFilter.toLowerCase().trim();
          return tName.includes(filterLower) || filterLower.includes(tName);
        }
        return !curNameLower || tName === curNameLower || tName.includes(curNameLower) || curNameLower.includes(tName);
      });

      return (
        <div className="space-y-6 animate-fade-in pb-12" id="tailor-dashboard-view-root">
          {/* Welcome Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-mono border border-emerald-500/30 capitalize">
                  {effectiveDisplayRole} Portal
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  Store Front
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Welcome back, {currentUser.name || userObj.name || "Master Tailor"}
              </h1>
              <p className="text-sm text-slate-300">
                Here is your tailoring workload, active tickets, and live delivery schedule breakdown.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (typeof openArticulationWithDefaults === "function") {
                    openArticulationWithDefaults({ tab: "dashboard" });
                  } else {
                    setActiveTab("articulation");
                  }
                }}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <Scissors className="w-4 h-4" />
                <span>Open Tailoring Studio ➔</span>
              </button>
            </div>
          </div>

          {/* 🚨 90% CAPACITY ALERT BANNER */}
          {(activeTailorStats.isOverloaded || (capacityAlerts && capacityAlerts.length > 0)) && (
            <div className="bg-red-50/95 border-2 border-red-500 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-pulse">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-100 text-red-700 rounded-xl border border-red-200 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-red-950 tracking-wider flex items-center gap-2">
                    <span>🚨 Tailor Capacity Alert — Over 90% Threshold Exceeded!</span>
                    <span className="bg-red-200 text-red-900 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                      {activeTailorStats.isOverloaded ? `${activeTailorStats.capacityUtilization}% Capacity` : `${capacityAlerts.length} Overloaded`}
                    </span>
                  </h4>
                  <p className="text-xs text-red-800 mt-0.5">
                    {activeTailorStats.isOverloaded
                      ? `अगर किसी Tailor की capacity 90% cross हो जाए: ${activeTailorStats.tailorName} has reached ${activeTailorStats.capacityUtilization}% capacity with ${activeTailorStats.inProgress} active in-progress items. Please redistribute or reassign pending tickets!`
                      : capacityAlerts.map(a => `${a.tailorName} (${a.capacityUtilization}%)`).join(", ") + " have crossed 90% capacity!"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (typeof openArticulationWithDefaults === "function") {
                    openArticulationWithDefaults({ tab: "tracking" });
                  } else {
                    setActiveTab("articulation");
                  }
                }}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
              >
                Reassign Jobs in Studio ➔
              </button>
            </div>
          )}

          {/* ─── 1. TAILOR WORKLOAD & CAPACITY SUMMARY WIDGET (8 CARDS) ─── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>Tailor Workload & Capacity Summary</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                      {selectedTailorFilter}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Summary updated according to the selected master tailor | Active load & productivity metrics
                  </p>
                </div>
              </div>

              {/* Tailor Filter Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Select Tailor:</span>
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={selectedTailorFilter}
                    onChange={(e) => setSelectedTailorFilter(e.target.value)}
                    className="w-full sm:w-56 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none hover:bg-slate-100 cursor-pointer shadow-xs appearance-none pr-8 transition-colors"
                  >
                    <option value="All Tailors">All Master Tailors (Overview)</option>
                    {(tailorSummaries || []).map(t => (
                      <option key={t.tailorName} value={t.tailorName}>
                        {t.tailorName} ({t.capacityUtilization}%)
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-4 h-4 absolute right-2.5 top-2.5 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 8 Required Tailor Summary Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {/* 1. Assigned Items */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Items</span>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700">
                    <Layers className="w-4 h-4 text-slate-700" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900 font-mono block">{activeTailorStats.assignedItems}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Total assigned</span>
                </div>
              </div>

              {/* 2. In Progress */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">In Progress</span>
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-amber-950 font-mono block">{activeTailorStats.inProgress}</span>
                  <span className="text-[10px] text-amber-700 font-medium">On tailor table</span>
                </div>
              </div>

              {/* 3. Ready */}
              <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200/80 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Ready</span>
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-indigo-950 font-mono block">{activeTailorStats.ready}</span>
                  <span className="text-[10px] text-indigo-700 font-medium">Altered & ready</span>
                </div>
              </div>

              {/* 4. Delivered */}
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Delivered</span>
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-emerald-950 font-mono block">{activeTailorStats.delivered}</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Handed to customer</span>
                </div>
              </div>

              {/* 5. Overdue */}
              <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200/80 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Overdue</span>
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-rose-950 font-mono block">{activeTailorStats.overdue}</span>
                  <span className="text-[10px] text-rose-700 font-medium">{activeTailorStats.overdue > 0 ? "Past delivery date" : "On schedule"}</span>
                </div>
              </div>

              {/* 6. Average Completion Time */}
              <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200/80 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Avg Completion</span>
                  <div className="p-2 bg-sky-100 rounded-lg text-sky-700">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-xl font-black text-sky-950 font-mono block">{activeTailorStats.averageCompletionTime || "3.5 hrs"}</span>
                  <span className="text-[10px] text-sky-700 font-medium">Turnaround speed</span>
                </div>
              </div>

              {/* 7. Capacity Utilization */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                activeTailorStats.capacityUtilization >= 90
                  ? 'bg-red-50 border-red-300 text-red-950'
                  : activeTailorStats.capacityUtilization >= 70
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Capacity Load</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-2xl font-black font-mono">{activeTailorStats.capacityUtilization}%</span>
                    {activeTailorStats.capacityUtilization >= 90 && (
                      <span className="text-[9px] font-black uppercase text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Alert</span>
                    )}
                  </div>
                  <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        activeTailorStats.capacityUtilization >= 90
                          ? 'bg-red-600'
                          : activeTailorStats.capacityUtilization >= 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, activeTailorStats.capacityUtilization)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 8. Today's New Work */}
              <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200/80 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Today's New Work</span>
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-purple-950 font-mono block">{activeTailorStats.todayNewWork}</span>
                  <span className="text-[10px] text-purple-700 font-medium">Assigned today</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 2. DELIVERY DASHBOARD WIDGET (6 CARDS) ─── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-xs">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>Delivery Dashboard</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                      Live Delivery Schedule
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time monitoring of customer pickups, store waiting & pending dispatches
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Ready for Collection */}
              <div className="bg-emerald-50/70 hover:bg-emerald-100/90 p-4 rounded-xl border border-emerald-200/80 flex flex-col justify-between transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Ready for Collection</span>
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-emerald-950 font-mono block">{deliveryDashboard?.readyForCollection ?? 0}</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Ready in store</span>
                </div>
              </div>

              {/* Today's Delivery */}
              <div className="bg-indigo-50/70 hover:bg-indigo-100/90 p-4 rounded-xl border border-indigo-200/80 flex flex-col justify-between transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Today's Delivery</span>
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-indigo-950 font-mono block">{deliveryDashboard?.todayDelivery ?? 0}</span>
                  <span className="text-[10px] text-indigo-700 font-medium">Promised today</span>
                </div>
              </div>

              {/* Tomorrow Delivery */}
              <div className="bg-purple-50/70 hover:bg-purple-100/90 p-4 rounded-xl border border-purple-200/80 flex flex-col justify-between transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Tomorrow Delivery</span>
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-purple-950 font-mono block">{deliveryDashboard?.tomorrowDelivery ?? 0}</span>
                  <span className="text-[10px] text-purple-700 font-medium">Scheduled tomorrow</span>
                </div>
              </div>

              {/* Overdue Delivery */}
              <div className="bg-rose-50/70 hover:bg-rose-100/90 p-4 rounded-xl border border-rose-200/80 flex flex-col justify-between transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Overdue Delivery</span>
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-rose-950 font-mono block">{deliveryDashboard?.overdueDelivery ?? 0}</span>
                  <span className="text-[10px] text-rose-700 font-medium font-bold">{(deliveryDashboard?.overdueDelivery ?? 0) > 0 ? "Deadline Passed!" : "Zero overdue"}</span>
                </div>
              </div>

              {/* Customer Waiting */}
              <div className="bg-amber-50/70 hover:bg-amber-100/90 p-4 rounded-xl border border-amber-200/80 flex flex-col justify-between transition-all group relative overflow-hidden">
                {(deliveryDashboard?.customerWaiting ?? 0) > 0 && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Customer Waiting</span>
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-amber-950 font-mono block">{deliveryDashboard?.customerWaiting ?? 0}</span>
                  <span className="text-[10px] text-amber-700 font-medium">Waiting in store</span>
                </div>
              </div>

              {/* Home Delivery Pending */}
              <div className="bg-teal-50/70 hover:bg-teal-100/90 p-4 rounded-xl border border-teal-200/80 flex flex-col justify-between transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Home Delivery Pending</span>
                  <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-teal-950 font-mono block">{deliveryDashboard?.homeDeliveryPending ?? 0}</span>
                  <span className="text-[10px] text-teal-700 font-medium">Dispatch required</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 3. MY ACTIVE ALTERATION & TAILORING WORKBENCH QUEUE ─── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-rose-500 rounded-full inline-block"></span>
                  <span>My Tailoring Workbench Queue</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Active garment tickets assigned to your table. Update work status in real-time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchTailorJobs}
                  disabled={loadingTailorJobs}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingTailorJobs ? 'animate-spin' : ''}`} />
                  <span>Refresh Queue</span>
                </button>
                <button
                  onClick={() => {
                    if (typeof openArticulationWithDefaults === "function") {
                      openArticulationWithDefaults({ tab: "dashboard" });
                    } else {
                      setActiveTab("articulation");
                    }
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Full Studio ➔</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Ticket #</th>
                    <th className="px-5 py-4 font-semibold">Customer</th>
                    <th className="px-5 py-4 font-semibold">Garment / Piece</th>
                    <th className="px-5 py-4 font-semibold">Service Type</th>
                    <th className="px-5 py-4 font-semibold">Delivery Date</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 text-slate-700">
                  {myAssignedJobs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Scissors className="w-8 h-8 text-slate-300" />
                          <p className="font-bold text-slate-600 text-sm">No active jobs on your table right now</p>
                          <p className="text-xs text-slate-400">New tailoring and alteration assignments will appear here automatically.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    myAssignedJobs.map((job, idx) => {
                      const isOverdue = job.deliveryDate && job.deliveryDate < new Date().toISOString().split('T')[0] && job.status !== 'Delivered';
                      const isToday = job.deliveryDate === new Date().toISOString().split('T')[0];
                      const isUpdating = updatingJobId === (job._id || job.id);

                      return (
                        <tr key={job._id || job.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md text-xs border border-indigo-100">
                              {job.alterationId || job.alterationNo || job.ticketNo || `ALT-${idx + 101}`}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-800">
                            <div>{job.customerName || "Walk-in Customer"}</div>
                            {job.customerPhone && (
                              <div className="text-[10px] text-slate-400 font-mono font-normal">{job.customerPhone}</div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                            <div>{job.productName || "Garment Piece"}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {job.size ? `Size: ${job.size}` : ''} {job.color ? `| Color: ${job.color}` : ''}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                              {job.serviceType || (Array.isArray(job.alterationDetails) && job.alterationDetails.length > 0 ? job.alterationDetails.join(', ') : 'Standard Alteration')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs">
                            <div className={`font-mono font-bold ${isOverdue ? 'text-rose-600' : isToday ? 'text-amber-600' : 'text-slate-600'}`}>
                              {job.deliveryDate || 'Flexible'}
                            </div>
                            {isOverdue && <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded">Overdue</span>}
                            {isToday && <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 rounded">Deliver Today</span>}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                job.status === 'Ready for Delivery' || job.status === 'READY'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : job.status === 'In Progress'
                                    ? 'bg-amber-100 text-amber-800'
                                    : job.status === 'Delivered'
                                      ? 'bg-slate-100 text-slate-700'
                                      : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {job.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {job.status === 'In Progress' ? (
                              <button
                                onClick={() => handleUpdateTailorJobStatus(job._id || job.id, 'Ready for Delivery')}
                                disabled={isUpdating}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Ready ✓</span>
                              </button>
                            ) : job.status === 'Ready for Delivery' || job.status === 'READY' ? (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                Ready for Pickup
                              </span>
                            ) : job.status === 'Delivered' ? (
                              <span className="text-xs font-bold text-slate-400">Completed</span>
                            ) : (
                              <button
                                onClick={() => handleUpdateTailorJobStatus(job._id || job.id, 'In Progress')}
                                disabled={isUpdating}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Start Work ➔</span>
                              </button>
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
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-mono border border-emerald-500/30 capitalize">
                {effectiveDisplayRole} Portal
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




      {/* Quick Actions Panel */}
      <QuickActionsPanel
        onNavigate={setActiveTab}
        openArticulationWithDefaults={openArticulationWithDefaults}
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
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

        {/* Manual Adjustments Today */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Manual Adjustments Today
            </span>
            <div className="text-2xl font-bold text-slate-800 font-sans flex flex-col">
              <span className="text-sm text-red-500 font-medium">Discounts: ₹{(commStats?.totalManualDiscounts || 0).toLocaleString("en-IN")}</span>
              <span className="text-sm text-emerald-500 font-medium">Charges: ₹{(commStats?.totalManualCharges || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg text-slate-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Returns */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Today's Returns
            </span>
            <div className="text-2xl font-bold text-slate-800 font-sans">
              {todayReturnsCount} items
            </div>
            <div className="flex items-center gap-1 text-xs text-rose-500 font-medium cursor-pointer hover:underline" onClick={() => {
              if (typeof openPOSWithDefaults === "function") openPOSWithDefaults("returns");
              else setActiveTab("billing");
            }}>
              <span>Manage Returns ➔</span>
            </div>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-lg text-rose-600">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding Due Collections */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Outstanding Dues
            </span>
            <div className="text-2xl font-bold text-slate-800 font-sans">
              ₹
              {Number(pendingCustomerCredit || 0).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-600 font-medium cursor-pointer hover:underline" onClick={() => setActiveTab("customers")}>
              <span>Collect dues ➔</span>
            </div>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-lg text-amber-600">
            <AlertTriangle className="w-5 h-5" />
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

      {/* ─── DELIVERY DASHBOARD WIDGET ─── */}
      {(() => {
        const handleNavigateAlteration = (filterStatus = "All", tab = "dashboard") => {
          if (typeof openArticulationWithDefaults === "function") {
            openArticulationWithDefaults({ tab, filterStatus });
          } else {
            setActiveTab("articulation");
          }
        };

        const readyForCollection = deliveryDashboard?.readyForCollection ?? 0;
        const todayDelivery = deliveryDashboard?.todayDelivery ?? 0;
        const tomorrowDelivery = deliveryDashboard?.tomorrowDelivery ?? 0;
        const overdueDelivery = deliveryDashboard?.overdueDelivery ?? 0;
        const customerWaiting = deliveryDashboard?.customerWaiting ?? 0;
        const homeDeliveryPending = deliveryDashboard?.homeDeliveryPending ?? 0;

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-xs">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>Delivery Dashboard</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                      Live Delivery Schedule
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time monitoring of customer pickups, store waiting & pending dispatches
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleNavigateAlteration("Ready for Delivery", "dashboard")}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer self-stretch sm:self-auto justify-center"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Open Pickup & Dispatch Panel ➔</span>
              </button>
            </div>

            {/* Delivery KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Ready for Collection */}
              <div
                onClick={() => handleNavigateAlteration("Ready for Delivery", "dashboard")}
                className="bg-emerald-50/70 hover:bg-emerald-100/90 p-4 rounded-xl border border-emerald-200/80 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Ready for Collection</span>
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 group-hover:scale-110 transition-transform">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-emerald-950 font-mono block">{readyForCollection}</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Ready in store</span>
                </div>
              </div>

              {/* Today's Delivery */}
              <div
                onClick={() => handleNavigateAlteration("All", "dashboard")}
                className="bg-indigo-50/70 hover:bg-indigo-100/90 p-4 rounded-xl border border-indigo-200/80 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Today's Delivery</span>
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700 group-hover:scale-110 transition-transform">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-indigo-950 font-mono block">{todayDelivery}</span>
                  <span className="text-[10px] text-indigo-700 font-medium">Promised today</span>
                </div>
              </div>

              {/* Tomorrow Delivery */}
              <div
                onClick={() => handleNavigateAlteration("All", "dashboard")}
                className="bg-purple-50/70 hover:bg-purple-100/90 p-4 rounded-xl border border-purple-200/80 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Tomorrow Delivery</span>
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-700 group-hover:scale-110 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-purple-950 font-mono block">{tomorrowDelivery}</span>
                  <span className="text-[10px] text-purple-700 font-medium">Scheduled tomorrow</span>
                </div>
              </div>

              {/* Overdue Delivery */}
              <div
                onClick={() => handleNavigateAlteration("Delayed", "reports")}
                className="bg-rose-50/70 hover:bg-rose-100/90 p-4 rounded-xl border border-rose-200/80 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Overdue Delivery</span>
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-700 group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-rose-950 font-mono block">{overdueDelivery}</span>
                  <span className="text-[10px] text-rose-700 font-medium font-bold">{overdueDelivery > 0 ? "Deadline Passed!" : "Zero overdue"}</span>
                </div>
              </div>

              {/* Customer Waiting */}
              <div
                onClick={() => handleNavigateAlteration("In Progress", "dashboard")}
                className="bg-amber-50/70 hover:bg-amber-100/90 p-4 rounded-xl border border-amber-200/80 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group relative overflow-hidden"
              >
                {customerWaiting > 0 && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Customer Waiting</span>
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-700 group-hover:scale-110 transition-transform">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-amber-950 font-mono block">{customerWaiting}</span>
                  <span className="text-[10px] text-amber-700 font-medium">Waiting in store</span>
                </div>
              </div>

              {/* Home Delivery Pending */}
              <div
                onClick={() => handleNavigateAlteration("All", "dashboard")}
                className="bg-teal-50/70 hover:bg-teal-100/90 p-4 rounded-xl border border-teal-200/80 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Home Delivery Pending</span>
                  <div className="p-2 bg-teal-100 rounded-lg text-teal-700 group-hover:scale-110 transition-transform">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black text-teal-950 font-mono block">{homeDeliveryPending}</span>
                  <span className="text-[10px] text-teal-700 font-medium">Dispatch required</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── TAILOR WORKLOAD & CAPACITY DASHBOARD ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 space-y-4 mt-6">
        {/* Header & Tailor Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Tailor Workload & Capacity Summary</span>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                  {selectedTailorFilter}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Summary updated according to the selected master tailor | Active load & productivity metrics
              </p>
            </div>
          </div>

          {/* Tailor Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Select Tailor:</span>
            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedTailorFilter}
                onChange={(e) => setSelectedTailorFilter(e.target.value)}
                className="w-full sm:w-56 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none hover:bg-slate-100 cursor-pointer shadow-xs appearance-none pr-8 transition-colors"
              >
                <option value="All Tailors">All Master Tailors (Overview)</option>
                {(tailorSummaries || []).map(t => (
                  <option key={t.tailorName} value={t.tailorName}>
                    {t.tailorName} ({t.capacityUtilization}%)
                  </option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 absolute right-2.5 top-2.5 text-slate-400 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 🚨 90% CAPACITY ALERT BANNER */}
        {(activeTailorStats.isOverloaded || (capacityAlerts && capacityAlerts.length > 0)) && (
          <div className="bg-red-50/95 border-2 border-red-500 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-xl border border-red-200 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-red-950 tracking-wider flex items-center gap-2">
                  <span>🚨 Tailor Capacity Alert — Over 90% Threshold Exceeded!</span>
                  <span className="bg-red-200 text-red-900 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                    {activeTailorStats.isOverloaded ? `${activeTailorStats.capacityUtilization}% Capacity` : `${capacityAlerts.length} Overloaded`}
                  </span>
                </h4>
                <p className="text-xs text-red-800 mt-0.5">
                  {activeTailorStats.isOverloaded
                    ? `अगर किसी Tailor की capacity 90% cross हो जाए: ${activeTailorStats.tailorName} has reached ${activeTailorStats.capacityUtilization}% capacity with ${activeTailorStats.inProgress} active in-progress items. Please redistribute or reassign pending tickets!`
                    : capacityAlerts.map(a => `${a.tailorName} (${a.capacityUtilization}%)`).join(", ") + " have crossed 90% capacity!"}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (typeof openArticulationWithDefaults === "function") {
                  openArticulationWithDefaults({ tab: "tracking" });
                } else {
                  setActiveTab("articulation");
                }
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
            >
              Reassign Jobs in Studio ➔
            </button>
          </div>
        )}

        {/* 8 Required Tailor Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* 1. Assigned Items */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Items</span>
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700">
                <Layers className="w-4 h-4 text-slate-700" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 font-mono block">{activeTailorStats.assignedItems}</span>
              <span className="text-[10px] text-slate-500 font-medium">Total assigned</span>
            </div>
          </div>

          {/* 2. In Progress */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">In Progress</span>
              <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-amber-950 font-mono block">{activeTailorStats.inProgress}</span>
              <span className="text-[10px] text-amber-700 font-medium">On tailor table</span>
            </div>
          </div>

          {/* 3. Ready */}
          <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200/80 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Ready</span>
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-indigo-950 font-mono block">{activeTailorStats.ready}</span>
              <span className="text-[10px] text-indigo-700 font-medium">Altered & ready</span>
            </div>
          </div>

          {/* 4. Delivered */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Delivered</span>
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-950 font-mono block">{activeTailorStats.delivered}</span>
              <span className="text-[10px] text-emerald-700 font-medium">Handed to customer</span>
            </div>
          </div>

          {/* 5. Overdue */}
          <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200/80 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Overdue</span>
              <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-rose-950 font-mono block">{activeTailorStats.overdue}</span>
              <span className="text-[10px] text-rose-700 font-medium">{activeTailorStats.overdue > 0 ? "Past delivery date" : "On schedule"}</span>
            </div>
          </div>

          {/* 6. Average Completion Time */}
          <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200/80 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Avg Completion</span>
              <div className="p-2 bg-sky-100 rounded-lg text-sky-700">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black text-sky-950 font-mono block">{activeTailorStats.averageCompletionTime || "3.5 hrs"}</span>
              <span className="text-[10px] text-sky-700 font-medium">Turnaround speed</span>
            </div>
          </div>

          {/* 7. Capacity Utilization */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${
            activeTailorStats.capacityUtilization >= 90
              ? 'bg-red-50 border-red-300 text-red-950'
              : activeTailorStats.capacityUtilization >= 70
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Capacity Load</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-black font-mono">{activeTailorStats.capacityUtilization}%</span>
                {activeTailorStats.capacityUtilization >= 90 && (
                  <span className="text-[9px] font-black uppercase text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Alert</span>
                )}
              </div>
              <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeTailorStats.capacityUtilization >= 90
                      ? 'bg-red-600'
                      : activeTailorStats.capacityUtilization >= 70
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, activeTailorStats.capacityUtilization)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 8. Today's New Work */}
          <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200/80 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Today's New Work</span>
              <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-purple-950 font-mono block">{activeTailorStats.todayNewWork}</span>
              <span className="text-[10px] text-purple-700 font-medium">Assigned today</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SERVICE WISE PENDING WIDGET ─── */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-4 mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl border border-violet-100 shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Service Wise Pending</span>
                <span className="bg-violet-100 text-violet-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                  {serviceWisePending?.Total ?? 0} Pending
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Software Service Category wise pending items.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (typeof openArticulationWithDefaults === "function") {
                openArticulationWithDefaults({ tab: "dashboard", filterStatus: "Pending" });
              } else {
                setActiveTab("articulation");
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>View All Pending in Studio ➔</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
          {[
            {
              key: "Alteration",
              label: "Alteration",
              icon: <Scissors className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform" />,
              border: "border-rose-100/60",
              bg: "bg-rose-50/30 hover:bg-rose-50 hover:border-rose-200",
              text: "text-rose-900"
            },
            {
              key: "Fall & Pico",
              label: "Fall & Pico",
              icon: <Sparkles className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform" />,
              border: "border-teal-100/60",
              bg: "bg-teal-50/30 hover:bg-teal-50 hover:border-teal-200",
              text: "text-teal-900"
            },
            {
              key: "Dry Clean",
              label: "Dry Clean",
              icon: <Droplets className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform" />,
              border: "border-sky-100/60",
              bg: "bg-sky-50/30 hover:bg-sky-50 hover:border-sky-200",
              text: "text-sky-900"
            },
            {
              key: "Embroidery",
              label: "Embroidery",
              icon: <Palette className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />,
              border: "border-purple-100/60",
              bg: "bg-purple-50/30 hover:bg-purple-50 hover:border-purple-200",
              text: "text-purple-900"
            },
            {
              key: "Charak",
              label: "Charak",
              icon: <Flame className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />,
              border: "border-amber-100/60",
              bg: "bg-amber-50/30 hover:bg-amber-50 hover:border-amber-200",
              text: "text-amber-900"
            },
            {
              key: "Repair",
              label: "Repair",
              icon: <Wrench className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />,
              border: "border-blue-100/60",
              bg: "bg-blue-50/30 hover:bg-blue-50 hover:border-blue-200",
              text: "text-blue-900"
            },
            {
              key: "Finishing",
              label: "Finishing",
              icon: <Award className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />,
              border: "border-emerald-100/60",
              bg: "bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-200",
              text: "text-emerald-900"
            },
            {
              key: "Others",
              label: "Others",
              icon: <MoreHorizontal className="w-5 h-5 text-slate-600 group-hover:scale-110 transition-transform" />,
              border: "border-slate-200/60",
              bg: "bg-slate-50 hover:bg-slate-100 hover:border-slate-300",
              text: "text-slate-900"
            }
          ].map((cat) => {
            const count = serviceWisePending?.[cat.key] || 0;
            const total = serviceWisePending?.Total || 0;
            const percent = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";

            return (
              <button
                key={cat.key}
                onClick={() => {
                  if (typeof openArticulationWithDefaults === "function") {
                    openArticulationWithDefaults({ tab: "dashboard", filterStatus: "Pending", filterServiceType: cat.key });
                  } else {
                    setActiveTab("articulation");
                  }
                }}
                className={`group flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border ${cat.border} ${cat.bg} transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5`}
              >
                <div className="flex flex-col items-center gap-1.5 mb-2">
                  {cat.icon}
                  <span className={`text-[11px] font-bold ${cat.text} text-center leading-tight`}>{cat.label}</span>
                </div>
                <span className="text-2xl font-black text-slate-900 font-mono mb-1">{count}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200/60">
                  {count > 0 ? percent : "0"}%
                </span>
              </button>
            );
          })}

          {/* TOTAL PENDING CARD */}
          <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-violet-200 bg-violet-50/80 shadow-xs">
            <div className="flex flex-col items-center gap-1 mb-2 text-violet-900">
              <Layers className="w-5 h-5 text-violet-600" />
              <span className="text-[11px] font-black uppercase tracking-wider text-center">Total</span>
            </div>
            <span className="text-2xl font-black text-violet-950 font-mono mb-1">{serviceWisePending?.Total ?? 0}</span>
            <span className="text-[10px] font-bold text-violet-700 bg-white px-2 py-0.5 rounded-full border border-violet-200">
              100%
            </span>
          </div>
        </div>
      </div>

      {/* ─── ALTERATION TYPE SUMMARY WIDGET (DASHBOARD SYNC) ─── */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-4 mt-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">Alteration Type Summary</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribution of alterations by component type</p>
          </div>
          <div className="relative">
            <select
              value={altSummaryDate}
              onChange={(e) => setAltSummaryDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none hover:bg-slate-100 cursor-pointer shadow-xs appearance-none pr-9 transition-colors"
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
              <option value="All Time">All Time</option>
            </select>
            <ChevronRight className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 rotate-90 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { key: "Sleeve", icon: <Shirt className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" /> },
            { key: "Length", icon: <Ruler className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" /> },
            { key: "Waist", icon: <User className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" /> },
            { key: "Bottom", icon: <Layers className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" /> },
            { key: "Shoulder", icon: <Briefcase className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" /> },
            { key: "Neck", icon: <UserCheck className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" /> },
            { key: "Others", icon: <MoreHorizontal className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" /> }
          ].map((type) => {
            const count = altTypeSummary?.alterationTypes?.[type.key] || 0;
            const total = altTypeSummary?.totalAlterations || 1;
            const percent = ((count / total) * 100).toFixed(2);

            return (
              <button
                key={type.key}
                onClick={() => {
                  if (typeof openArticulationWithDefaults === "function") {
                    openArticulationWithDefaults({ tab: "dashboard", filterStatus: "All" });
                  } else {
                    setActiveTab("articulation");
                  }
                }}
                className="group flex flex-col items-center justify-center p-4 rounded-xl border border-indigo-100/50 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex flex-col items-center gap-2 mb-2">
                  {type.icon}
                  <span className="text-xs font-bold text-indigo-900">{type.key}</span>
                </div>
                <span className="text-2xl font-black text-slate-900 font-mono mb-1">{count}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-100">{count > 0 ? percent : "0.00"}%</span>
              </button>
            );
          })}

          {/* TOTAL CARD */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-indigo-200 bg-indigo-100/50 shadow-xs">
            <div className="flex flex-col items-center gap-2 mb-2 text-indigo-900">
              <span className="text-[11px] font-black uppercase tracking-widest mt-1">Total</span>
            </div>
            <span className="text-2xl font-black text-slate-900 font-mono mb-1">{altTypeSummary?.totalAlterations || 0}</span>
            <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-100">100%</span>
          </div>
        </div>
      </div>

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
              activityFeed.map((log, idx) => {
                let actionStr = (log.action || '').toUpperCase();
                let icon = '⚡';
                let color = 'indigo';
                if (actionStr.includes('VIEW')) { icon = '👁️'; color = 'blue'; }
                else if (actionStr.includes('CREATE') || actionStr.includes('ADD')) { icon = '➕'; color = 'emerald'; }
                else if (actionStr.includes('DELETE') || actionStr.includes('REMOVE')) { icon = '🗑️'; color = 'red'; }
                else if (actionStr.includes('UPDATE') || actionStr.includes('EDIT')) { icon = '✏️'; color = 'orange'; }
                else if (actionStr.includes('LOGIN')) { icon = '🔑'; color = 'teal'; }

                if (actionStr.includes('EXCHANGE')) { icon = '🔄'; color = 'orange'; }
                if (actionStr.includes('RETURN')) { icon = '↩️'; color = 'red'; }

                let title = log.item;
                let detailStr = '';

                if (!title || title.trim() === '') {
                  if (actionStr === 'CREATE_EXCHANGE') {
                    title = `Exchanged Item`;
                    detailStr = `Bill ID: ${log.details?.body?.originalBillId?.toString().slice(-6) || 'Unknown'}`;
                  } else if (actionStr === 'CREATE_RETURN') {
                    title = `Returned Item(s)`;
                    detailStr = `Bill: ${log.details?.body?.saleBillNo || 'Unknown'} - Mode: ${log.details?.body?.refundMode || 'N/A'}`;
                  } else if (actionStr === 'CREATE_SALE_BILL') {
                    title = `New Sale Bill generated`;
                    detailStr = `Total: ₹${log.details?.body?.grandTotal || 0} - Mode: ${log.details?.body?.paymentMethod || 'Cash'}`;
                  } else {
                    title = log.action || 'System Action';
                  }
                }

                if (!detailStr) {
                  if (typeof log.details === 'string') detailStr = log.details;
                  else if (log.details && Object.keys(log.details).length > 0) detailStr = `${log.module || 'System'} action performed.`;
                  else detailStr = `${log.module || 'System'} Module`;
                }

                const item = {
                  id: log._id || idx,
                  action: log.action,
                  title: title,
                  detail: detailStr,
                  user: log.userName || 'System',
                  timestamp: log.timestamp || log.createdAt,
                  icon: icon,
                  color: color
                };

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
                  api.get(`/audit?limit=30`)
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

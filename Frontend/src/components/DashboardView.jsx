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
  ListTodo
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
}) => {
  const [morningActions, setMorningActions] = React.useState(null);

  React.useEffect(() => {
    if (currentUser?.role?.toLowerCase() !== 'salesperson') {
      const fetchMorningActions = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("http://localhost:5000/api/dashboard/morning-actions", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setMorningActions(data.data);
          }
        } catch (error) {
          console.error("Failed to fetch morning actions", error);
        }
      };
      fetchMorningActions();
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

  // ─── Low Stock ─────────────────────────────────────────────
  const lowStockProducts = products.filter((p) => (p.stock || 0) <= (p.minStockAlert || 5));
  const lowStockCount = lowStockProducts.length;

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
        sales: `₹${tp.revenue.toLocaleString("en-IN")}`,
        stock: prod ? (prod.stock || 0) : "-",
      };
    });

  // ─── Store performance (single store, real) ────────────────
  const stores = [
    {
      name: currentUser?.businessName || "Your Store",
      sales: `₹${monthlyRevenue.toLocaleString("en-IN")}`,
      target: `₹${(monthlyRevenue * 1.1).toLocaleString("en-IN")}`,
      ratio: "90%",
      billsText: todayBillsCount > 0 ? `${todayBillsCount} bills today` : "No bills yet",
      trend: monthlyRevenue > 0 ? "up" : "down",
    },
  ];

  if (currentUser?.role?.toLowerCase() === 'salesperson') {
    // Dynamically calculate metrics
    const myEmployeeRecord = (employees || []).find(e => e.id === currentUser.id) || currentUser;
    const myInvoices = (invoices || []).filter(inv => inv.employeeId === currentUser.id);
    const myTotalSales = myInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
    const myCommission = myEmployeeRecord.commissionEarned || Math.floor(myTotalSales * 0.02);

    return (
      <div className="space-y-6 animate-fade-in pb-12" id="dashboard-view-root">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-mono border border-emerald-500/30">
                Sales Portal
              </span>
              <span className="text-slate-400 text-xs font-mono">
                Store Front
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-sm text-slate-300">
              Here is your personal performance overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("billing")}
              className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New POS Bill</span>
            </button>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                My Total Sales
              </span>
              <div className="text-2xl font-bold text-slate-800 font-sans">
                ₹{myTotalSales.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                My Commission Earned
              </span>
              <div className="text-2xl font-bold text-slate-800 font-sans">
                ₹{myCommission.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Attendance Rate
              </span>
              <div className="text-2xl font-bold text-slate-800 font-sans">
                {currentUser.attendanceRate || 100}%
              </div>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-lg text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* My Recent Sales */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden mt-6">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
                My Sales Records
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your latest approved commissions and billed invoices.
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
                  <th className="px-5 py-4 font-semibold">Payment</th>
                  <th className="px-5 py-4 font-semibold text-right">Total Amount</th>
                  <th className="px-5 py-4 font-semibold text-right">My Comm (2%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-slate-700">
                {myInvoices.slice(0, 10).map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        {inv.invoiceNo}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {inv.customerName}
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
                      ₹{inv.grandTotal.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-600">
                      +₹{Math.floor(inv.grandTotal * 0.02).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
                {myInvoices.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                      You haven't made any sales yet. Keep going!
                    </td>
                  </tr>
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
            Live operational data and billing pipelines — {monthNames[currentMonth]} {currentYear}.
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
      <QuickActionsPanel />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Today's Sales
            </span>
            <div className="text-2xl font-bold text-slate-800 font-sans">
              ₹
              {todaySales.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
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
              {todayProfit.toLocaleString("en-IN", {
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
              {totalCostValue.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Retail MRP: ₹
                {totalRetailValue.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-lg text-amber-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>


      {/* Alert Banners & Second Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {monthlyRevenue.toLocaleString("en-IN", {
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
                Recv: ₹{pendingCustomerCredit.toLocaleString("en-IN")} | Pay: ₹
                {pendingSupplierCredit.toLocaleString("en-IN")}
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
                    ₹{(inv.grandTotal || 0).toLocaleString("en-IN")}
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
                      ₹{c.totalSpent.toLocaleString("en-IN")}
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

        {/* Recent Audit Timeline / Operations Logs */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Live Operations Feed
            </h2>
            <p className="text-xs text-slate-400">
              Live ledger adjustments & team activity
            </p>
          </div>
          <div className="space-y-4">
            {auditLogs.slice(0, 4).map((log, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="relative flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-indigo-100 shrink-0 mt-1" />
                  {idx !== 3 && (
                    <div className="w-0.5 h-12 bg-slate-100 absolute top-3" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-800">
                      {log.employeeName}
                    </span>
                    <span className="text-[9px] bg-slate-100 px-1 rounded-sm text-slate-500 uppercase font-mono">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {log.details}
                  </p>
                  <span className="text-[9px] text-slate-400 font-mono block">
                    {log.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

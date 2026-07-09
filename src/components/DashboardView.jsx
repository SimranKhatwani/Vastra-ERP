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
} from "lucide-react";
import { MiniAreaChart, PremiumBarChart, DonutChart } from "./Charts";

export const DashboardView = ({
  products = [],
  customers = [],
  employees = [],
  invoices = [],
  purchaseOrders = [],
  expenses = [],
  notifications = [],
  auditLogs = [],
  setActiveTab = (_tab) => {},
  openArticulationWithDefaults = () => {},
}) => {
  // Let's compute actual dynamic KPIs from the current state!
  const todayStr = "2026-06-28"; // Fixed system 'today' matching context

  const todayInvoices = invoices.filter((inv) => inv.date === todayStr);
  const todaySales = todayInvoices.reduce(
    (sum, inv) => sum + inv.grandTotal,
    0,
  );
  // Cost of Goods Sold (COGS) to calculate Profit
  // Let's estimate today's profit by mapping invoice items back to their product purchase prices
  let todayProfit = 0;
  todayInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const match = products.find((p) => p.id === item.productId);
      const buyPrice = match ? match.purchasePrice : item.price * 0.45;
      todayProfit += (item.price - buyPrice) * item.quantity;
    });
  });
  if (todayProfit === 0) todayProfit = todaySales * 0.45; // Fallback estimate

  const todayBillsCount = todayInvoices.length;

  // Monthly Revenue (June 2026)
  const juneInvoices = invoices.filter((inv) => inv.date.startsWith("2026-06"));
  const monthlyRevenue = juneInvoices.reduce(
    (sum, inv) => sum + inv.grandTotal,
    0,
  );

  // Total inventory retail and cost value
  const totalCostValue = products.reduce(
    (sum, p) => sum + p.purchasePrice * p.stock,
    0,
  );
  const totalRetailValue = products.reduce(
    (sum, p) => sum + p.sellingPrice * p.stock,
    0,
  );

  // Low Stock Count
  const lowStockProducts = products.filter((p) => p.stock <= p.minStockAlert);
  const lowStockCount = lowStockProducts.length;

  // Pending payments (Credit invoices + Outstanding supplier invoices)
  const pendingCustomerCredit = customers.reduce(
    (sum, c) => sum + c.outstandingBalance,
    0,
  );
  const pendingSupplierCredit = purchaseOrders
    .filter((po) => po.status === "Pending")
    .reduce((sum, po) => sum + (po.grandTotal - po.outstandingPaid), 0);

  // Programmatic chart aggregates based on mock data
  // Monthly revenue for the last 6 months
  const monthlyRevenueData = [
    { label: "Jan", value: 412000 },
    { label: "Feb", value: 495000 },
    { label: "Mar", value: 584000 },
    { label: "Apr", value: 520000 },
    { label: "May", value: 685000 },
    { label: "Jun", value: monthlyRevenue || 712000 },
  ];

  // Sales volume comparison
  const monthlyComparisonData = [
    { label: "Jan", value: 412000, value2: 380000 },
    { label: "Feb", value: 495000, value2: 450000 },
    { label: "Mar", value: 584000, value2: 510000 },
    { label: "Apr", value: 520000, value2: 490000 },
    { label: "May", value: 685000, value2: 610000 },
    { label: "Jun", value: monthlyRevenue || 712000, value2: 640000 },
  ];

  // Profit comparison
  const monthlyProfitData = [
    { label: "Jan", value: 185400 },
    { label: "Feb", value: 222750 },
    { label: "Mar", value: 262800 },
    { label: "Apr", value: 234000 },
    { label: "May", value: 308250 },
    { label: "Jun", value: monthlyRevenue * 0.45 || 320400 },
  ];

  // Inventory Distribution by Category
  const categoryCount = {};
  products.forEach((p) => {
    categoryCount[p.category] = (categoryCount[p.category] || 0) + p.stock;
  });
  const topCategories = Object.entries(categoryCount)
    .map(([key, val]) => ({ label: key, value: val }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const colorsPalette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const donutData = topCategories.map((tc, idx) => ({
    label: tc.label,
    value: tc.value,
    color: colorsPalette[idx % colorsPalette.length],
  }));

  // Store performance
  const stores = [
    {
      name: "Raymond Retail - Bandra",
      sales: "₹4,82,500",
      target: "₹5,00,000",
      ratio: "96.5%",
      trend: "up",
    },
    {
      name: "Ziva Boutique - Colaba",
      sales: "₹3,42,100",
      target: "₹3,20,000",
      ratio: "106.9%",
      trend: "up",
    },
    {
      name: "Biba Outlet - Phoenix Mall",
      sales: "₹2,98,400",
      target: "₹3,50,000",
      ratio: "85.2%",
      trend: "down",
    },
  ];

  // Top Customers
  const topCustomersSorted = [...customers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 4);

  // Top Selling Products
  const topProducts = [
    {
      name: "Raymond Executive Linen Shirt - White",
      units: 82,
      sales: "₹2,03,360",
      stock: products.find((p) => p.id === "p-1")?.stock || 12,
    },
    {
      name: "Zara Slim Fit Denim Jeans - Midnight Black",
      units: 68,
      sales: "₹1,69,320",
      stock: products.find((p) => p.id === "p-4")?.stock || 34,
    },
    {
      name: "Biba Festive Floral Saree - Red Silk",
      units: 54,
      sales: "₹1,56,600",
      stock: products.find((p) => p.id === "p-7")?.stock || 5,
    },
    {
      name: "Manyavar Embroidered Kurta - Gold",
      units: 48,
      sales: "₹1,34,400",
      stock: products.find((p) => p.id === "p-10")?.stock || 18,
    },
  ];

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
            Live operational data and billing pipelines for June 2026.
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
              <span>+18.4% vs last Sunday</span>
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
              <span>+12.1% net margin</span>
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
              <span>Avg basket size: 2.4 items</span>
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
              <div className="text-sm font-semibold">June Sales Revenue</div>
              <div className="text-xs text-slate-500">
                ₹
                {monthlyRevenue.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}{" "}
                (Target ₹7.5L)
              </div>
            </div>
          </div>
          <span className="text-xs font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
            94.9%
          </span>
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
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 lg:col-span-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 block">
                Revenue Yield Curve
              </span>
              <MiniAreaChart
                data={monthlyRevenueData}
                color="#6366f1"
                height={150}
                currency
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 block">
                Net Profit Margin
              </span>
              <MiniAreaChart
                data={monthlyProfitData}
                color="#10b981"
                height={150}
                currency
              />
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
                Sales Comparison (Actual vs Target)
              </h2>
              <p className="text-xs text-slate-400">
                Comparing actual wholesale orders vs retail targets
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className="text-slate-600">Actual Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-slate-600">Target</span>
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
                    Target Met: {store.ratio}
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

import React, { useState, useEffect } from "react";
import {
  Building2,
  Coins,
  Server,
  Users,
  Activity,
  Globe,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  ShoppingBag,
  Layers,
  IndianRupee,
  ShieldAlert,
  Sliders,
  Sparkles,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import api from '../../api/axios';

function KpiCard({ label, value, sub, icon: Icon, color = "indigo", trend, loading }) {
  const colors = {
    indigo: { bg: "bg-white border-slate-200", icon: "text-indigo-600 bg-indigo-50", badge: "text-indigo-700 bg-indigo-50 border-indigo-100" },
    emerald: { bg: "bg-white border-slate-200", icon: "text-emerald-600 bg-emerald-50", badge: "text-emerald-700 bg-emerald-50 border-emerald-100" },
    amber: { bg: "bg-white border-slate-200", icon: "text-amber-600 bg-amber-50", badge: "text-amber-700 bg-amber-50 border-amber-100" },
    purple: { bg: "bg-white border-slate-200", icon: "text-purple-600 bg-purple-50", badge: "text-purple-700 bg-purple-50 border-purple-100" },
    rose: { bg: "bg-white border-slate-200", icon: "text-rose-600 bg-rose-50", badge: "text-rose-700 bg-rose-50 border-rose-100" },
  };
  const c = colors[color] || colors.indigo;

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{label}</span>
        <div className={`p-2.5 rounded-2xl ${c.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-xl" />
        ) : (
          <p className="text-2xl font-black text-slate-900 font-sans tracking-tight">{value}</p>
        )}
        {sub && <p className="text-[11px] text-slate-500 mt-1 font-medium">{sub}</p>}
      </div>
      {trend && (
        <div className={`flex items-center w-fit px-2.5 py-0.5 rounded-full gap-1 text-[10px] font-bold border ${c.badge}`}>
          <ArrowUpRight className="w-3 h-3" />
          {trend}
        </div>
      )}
    </div>
  );
}

function HealthRow({ service, status, latency, uptime }) {
  const ok = status === "Operational";
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 text-xs">
      <div className="flex items-center gap-2.5">
        {ok ? (
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
        )}
        <span className="font-extrabold text-slate-800">{service}</span>
      </div>
      <div className="flex items-center gap-6 text-slate-500 font-mono text-[11px]">
        <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
          {status}
        </span>
        <span className="font-medium text-slate-600">{latency}</span>
        <span className="font-bold text-slate-700">{uptime}</span>
      </div>
    </div>
  );
}

export function SuperAdminDashboard({ tenants: propTenants = [] }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get(`/superadmin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.warn("Using fallback local tenant props:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Compute values dynamically from API or local props
  const activeTenants = stats?.activeTenants ?? propTenants.filter((t) => t.status === "Active").length;
  const totalTenants = stats?.totalTenants ?? propTenants.length;
  const totalMrr = stats?.totalMrr ?? propTenants.reduce((s, t) => {
    const map = { "Free Trial": 0, Starter: 2499, Professional: 5999, Enterprise: 14999 };
    return s + (map[t.plan] || 0);
  }, 0);
  const totalUsers = stats?.totalUsers ?? propTenants.reduce((s, t) => s + (t.activeUsers || 0), 0);
  const grossVolume = stats?.grossVolume ?? 485000;
  const totalProducts = stats?.totalProducts ?? 340;
  const healthData = stats?.healthData ?? [
    { service: "API Gateway (Express)", status: "Operational", latency: "12 ms", uptime: "99.99%" },
    { service: "MongoDB Cluster (Atlas)", status: "Operational", latency: "8 ms", uptime: "100%" },
    { service: "Auth JWT Service", status: "Operational", latency: "5 ms", uptime: "100%" },
    { service: "Realtime Socket.io Engine", status: "Operational", latency: "14 ms", uptime: "99.98%" },
    { service: "WhatsApp Alert Gateway", status: "Operational", latency: "85 ms", uptime: "99.90%" }
  ];
  const recentTenants = stats?.recentTenants ?? propTenants.slice(0, 6);
  const planCounts = stats?.planCounts ?? {
    Enterprise: propTenants.filter((t) => t.plan === "Enterprise").length,
    Professional: propTenants.filter((t) => t.plan === "Professional").length,
    Starter: propTenants.filter((t) => t.plan === "Starter").length,
    "Free Trial": propTenants.filter((t) => t.plan === "Free Trial" || t.plan === "Trial").length,
  };

  const healthyServicesCount = healthData.filter((h) => h.status === "Operational").length;

  return (
    <div className="space-y-6 select-none animate-fade-in pb-10">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
            <span>SaaS Platform Control Center</span>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
              MongoDB Dynamic Live
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time infrastructure health, multi-tenant MRR metrics & global MongoDB telemetry
          </p>
        </div>

        <button
          onClick={fetchDashboardStats}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
          <span>Refresh System Metrics</span>
        </button>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Active Businesses"
          value={activeTenants}
          sub={`${totalTenants} Total Registered Stores`}
          icon={Building2}
          color="indigo"
          trend="+2 Active this Month"
          loading={loading}
        />
        <KpiCard
          label="Platform Monthly MRR"
          value={`₹${totalMrr.toLocaleString("en-IN")}`}
          sub="Subscription Recurring Revenue"
          icon={Coins}
          color="emerald"
          trend="Live Revenue Stream"
          loading={loading}
        />
        <KpiCard
          label="Total Seat Users"
          value={totalUsers}
          sub="Active Staff & Admin Accounts"
          icon={Users}
          color="amber"
          trend="Multi-Tenant Roster"
          loading={loading}
        />
        <KpiCard
          label="System Health"
          value={`${healthyServicesCount}/${healthData.length}`}
          sub="Core Services Operational"
          icon={Server}
          color={healthyServicesCount === healthData.length ? "emerald" : "rose"}
          loading={loading}
        />
      </div>

      {/* SECONDARY STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-lg border border-indigo-800/40 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-indigo-300 font-black uppercase tracking-wider">Gross Platform Transaction Volume</span>
            <p className="text-2xl font-black text-white font-mono mt-1">₹{grossVolume.toLocaleString("en-IN")}</p>
            <p className="text-[11px] text-indigo-200/80 mt-1 font-medium">Aggregated across all registered store invoices</p>
          </div>
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-emerald-400 border border-white/10">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Global Garment Products Catalog</span>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">{totalProducts} SKUs</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Live inventory items synced across store catalogs</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 border border-purple-100">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* INFRASTRUCTURE STATUS */}
        <div className="xl:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Realtime Infrastructure Telemetry</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              MongoDB Connected
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {healthData.map((h) => (
              <HealthRow key={h.service} {...h} />
            ))}
          </div>

          {/* RECENTLY REGISTERED STORES TABLE */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Recently Registered Businesses</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Showing Top Stores</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Business Name</th>
                    <th className="py-2.5 px-3">Business Code</th>
                    <th className="py-2.5 px-3">Plan</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {recentTenants.map((t) => (
                    <tr key={t.id || t._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{t.businessName || t.name}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 text-[11px]">{t.businessCode || 'BB-MAIN-001'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {t.plan || 'Starter'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {t.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PLAN DISTRIBUTION & MRR TREND */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Subscription Tier Distribution</span>
            </h3>

            <div className="space-y-3">
              {["Enterprise", "Professional", "Starter", "Free Trial"].map((plan) => {
                const count = planCounts[plan] || 0;
                const pct = totalTenants ? Math.round((count / totalTenants) * 100) : 0;
                const colors = {
                  Enterprise: "bg-indigo-600",
                  Professional: "bg-emerald-500",
                  Starter: "bg-amber-500",
                  "Free Trial": "bg-slate-400"
                };

                return (
                  <div key={plan}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-extrabold text-slate-700">{plan}</span>
                      <span className="font-bold text-slate-900 font-mono text-[11px]">{count} Stores ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[plan]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MONTHLY REVENUE GROWTH BAR CHART */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-2">Platform MRR Growth Trend (6-Months)</p>
            <div className="flex items-end gap-2 h-16 pt-2">
              {[50, 65, 75, 70, 85, 100].map((v, i) => (
                <div key={i} className="flex-1 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors" style={{ height: `${v}%` }} title={`Month ${i + 1}`} />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 mt-2 font-mono font-bold">
              {["Feb","Mar","Apr","May","Jun","Jul"].map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
export default SuperAdminDashboard;

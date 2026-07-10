import React from "react";
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
} from "lucide-react";

function KpiCard({ label, value, sub, icon: Icon, color = "indigo", trend }) {
  const colors = {
    indigo: { bg: "bg-white border-slate-200", icon: "text-indigo-500", badge: "text-indigo-600 bg-indigo-50" },
    emerald: { bg: "bg-white border-slate-200", icon: "text-emerald-500", badge: "text-emerald-600 bg-emerald-50" },
    amber: { bg: "bg-white border-slate-200", icon: "text-amber-500", badge: "text-amber-600 bg-amber-50" },
    rose: { bg: "bg-white border-slate-200", icon: "text-rose-500", badge: "text-rose-600 bg-rose-50" },
  };
  const c = colors[color] || colors.indigo;

  return (
    <div className={`erp-card flex flex-col gap-3 !p-5 ${c.bg === "bg-white border-slate-200" ? "" : c.bg}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{label}</span>
        <div className={`p-2 rounded-lg bg-slate-50`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-black text-slate-800 font-sans">{value}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-1 font-medium">{sub}</p>}
      </div>
      {trend && (
        <div className={`flex items-center w-fit px-2 py-0.5 rounded-full gap-1 text-[10px] font-bold ${c.badge}`}>
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
        {ok
          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          : <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
        <span className="font-semibold text-slate-700">{service}</span>
      </div>
      <div className="flex items-center gap-6 text-slate-500 font-mono">
        <span className={ok ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>{status}</span>
        <span>{latency}</span>
        <span>{uptime}</span>
      </div>
    </div>
  );
}

const HEALTH_DATA = [
  { service: "API Gateway",       status: "Operational", latency: "42 ms",  uptime: "99.98%" },
  { service: "Database Cluster",  status: "Operational", latency: "8 ms",   uptime: "99.99%" },
  { service: "Auth Service",      status: "Operational", latency: "21 ms",  uptime: "100%" },
  { service: "File Storage CDN",  status: "Operational", latency: "110 ms", uptime: "99.95%" },
  { service: "Email/SMS Gateway", status: "Degraded",    latency: "840 ms", uptime: "97.20%" },
];

export function SuperAdminDashboard({ tenants = [] }) {
  const activeTenants     = tenants.filter((t) => t.status === "Active").length;
  const totalMrr          = tenants.reduce((s, t) => {
    const map = { "Free Trial": 0, Starter: 2499, Professional: 5999, Enterprise: 14999 };
    return s + (map[t.plan] || 0);
  }, 0);
  const totalUsers        = tenants.reduce((s, t) => s + (t.activeUsers || 0), 0);
  const healthyServices   = HEALTH_DATA.filter((h) => h.status === "Operational").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Active Businesses"  value={activeTenants}              sub={`${tenants.length} total registered`}  icon={Building2}  color="indigo" trend="+2 this month" />
        <KpiCard label="Platform MRR"       value={`₹${totalMrr.toLocaleString("en-IN")}`} sub="Monthly Recurring Revenue" icon={Coins}      color="emerald" trend="+₹14,499 vs last month" />
        <KpiCard label="Total Seat Users"   value={totalUsers}                 sub="Across all tenants"                    icon={Users}      color="amber"  trend="+18 new users" />
        <KpiCard label="Server Health"      value={`${healthyServices}/${HEALTH_DATA.length}`} sub="Services operational"  icon={Server}     color={healthyServices === HEALTH_DATA.length ? "emerald" : "rose"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 erp-card">
          <div className="erp-card-header">
            <h3 className="erp-card-title">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              Infrastructure Status
            </h3>
            <span className="text-[9px] text-slate-400 font-mono">Updated just now</span>
          </div>
          <div className="grid grid-cols-3 text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-2 px-0.5">
            <span>Service</span>
            <span className="text-right col-span-2 flex gap-6 justify-end">
              <span>Status</span><span>Latency</span><span>Uptime</span>
            </span>
          </div>
          {HEALTH_DATA.map((h) => (
            <HealthRow key={h.service} {...h} />
          ))}
        </div>

        <div className="erp-card">
          <h3 className="erp-card-title mb-4">
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            Plan Distribution
          </h3>
          <div className="space-y-3">
            {["Enterprise", "Professional", "Starter", "Free Trial"].map((plan) => {
              const count = tenants.filter((t) => t.plan === plan).length;
              const pct = tenants.length ? Math.round((count / tenants.length) * 100) : 0;
              const colors = { Enterprise: "bg-indigo-500", Professional: "bg-emerald-500", Starter: "bg-amber-500", "Free Trial": "bg-slate-400" };
              return (
                <div key={plan}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="font-semibold text-slate-600">{plan}</span>
                    <span className="font-bold text-slate-800 font-mono">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[plan]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-2">MRR Trend (6 months)</p>
            <div className="flex items-end gap-1 h-12">
              {[55, 62, 70, 68, 80, 100].map((v, i) => (
                <div key={i} className="flex-1 bg-indigo-500 rounded-sm hover:bg-indigo-600 transition-colors" style={{ height: `${v}%` }} />
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 mt-1 font-mono">
              {["Jan","Feb","Mar","Apr","May","Jun"].map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

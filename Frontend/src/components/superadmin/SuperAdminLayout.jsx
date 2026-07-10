import React, { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Settings,
  Menu,
  X,
  Search,
  ChevronDown,
  LogOut,
  Bell,
  Shield,
  User,
  RefreshCw,
} from "lucide-react";
import { useLocation, useNavigate, Link, Routes, Route, Navigate } from "react-router-dom";
import { SuperAdminDashboard } from "./SADashboard";
import { SABusinesses } from "./SABusinesses";
import { SASubscriptions } from "./SASubscriptions";
import { SASettings } from "./SASettings";

const SA_MODULES = [
  { id: "dashboard",      path: "/super-admin/dashboard",    label: "Platform Dashboard",    icon: LayoutDashboard },
  { id: "businesses",     path: "/super-admin/businesses",   label: "Tenants / Businesses",  icon: Building2 },
  { id: "subscriptions",  path: "/super-admin/subscriptions",label: "Subscriptions & Billing", icon: CreditCard },
  { id: "settings",       path: "/super-admin/settings",     label: "System Settings",       icon: Settings },
];

export function SuperAdminLayout({ currentUser, onLogout, tenants = [] }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const getUserInitials = (name = "") =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "SA";

  const currentModule = SA_MODULES.find(m => location.pathname.includes(m.path)) || SA_MODULES[0];

  return (
    <div className="erp-page">
      {/* ── SIDEBAR ── */}
      <aside
        className={`erp-sidebar ${sidebarOpen ? "" : "erp-sidebar--collapsed items-center"}`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider leading-tight">
                  Threadflow
                </p>
                <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest">
                  Super Admin
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="icon-btn mx-auto"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {!sidebarOpen && (
            <div className="h-4" />
          )}
          {sidebarOpen && (
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block px-2 mb-2">
              Control Center
            </span>
          )}
          {SA_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = location.pathname.startsWith(mod.path);
            return (
              <Link
                key={mod.id}
                to={mod.path}
                title={mod.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                {sidebarOpen && <span className="truncate">{mod.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
              {getUserInitials(currentUser?.name)}
            </div>
            {sidebarOpen && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-800 truncate">{currentUser?.name}</p>
                  <p className="text-[8px] text-indigo-600 font-bold uppercase tracking-widest">Super Admin</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="erp-container">
        {/* TOP NAVBAR */}
        <header className="erp-navbar">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-slate-800 capitalize">
              {currentModule.label}
            </h2>
          </div>

          <div className="search-container w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tenants, invoices, settings…"
              className="search-input"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              System Online
            </div>
            <button className="icon-btn !p-2 !bg-slate-50 !border !border-slate-100">
              <Bell className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                  {getUserInitials(currentUser?.name)}
                </div>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-xs space-y-1">
                  <div className="p-2 border-b border-slate-100 space-y-0.5">
                    <p className="font-bold text-slate-800">{currentUser?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{currentUser?.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] bg-indigo-50 text-indigo-700 font-bold uppercase tracking-wider">
                      Super Admin
                    </span>
                  </div>
                  <button
                    onClick={() => { setProfileOpen(false); onLogout(); }}
                    className="w-full text-left p-2 text-red-600 hover:bg-red-50 rounded-xl font-bold cursor-pointer flex items-center gap-2 transition-colors mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="erp-main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard tenants={tenants} />} />
            <Route path="businesses" element={<SABusinesses tenants={tenants} />} />
            <Route path="subscriptions" element={<SASubscriptions tenants={tenants} />} />
            <Route path="settings" element={<SASettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

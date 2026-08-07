import api from '../api/axios';
import React from "react";
import { useNavigate } from "react-router-dom";

export function AdminLogin({ onLogin, addToastNotification }) {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white"
    >
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 p-8 rounded-3xl shadow-2xl max-w-lg w-full relative overflow-hidden space-y-6">
        <div className="text-center space-y-2">

          <h1 className="text-3xl font-black tracking-tight text-white font-inter">
            Super Admin Portal
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Restricted Access. Enter your admin credentials.
          </p>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.secretKey.value;

            console.log('[Auth Trace] Initiating SuperAdmin Login Request:', { email });

            try {
              // SuperAdmin authenticates via /auth/login without tenantCode
              const res = await api.post(`/auth/login`, { email, password });
              const data = res.data;

              console.log('[Auth Trace] SuperAdmin Response Received:', data);

              if (data.success && data.data) {
                const accessToken = data.data.accessToken;
                const superAdminUser = {
                  ...data.data.user,
                  id: data.data.user?.id || data.data.user?._id || "admin-0",
                  name: data.data.user?.name || "Super Admin",
                  email: data.data.user?.email || email,
                  role: "SuperAdmin",
                  status: "Active",
                  token: accessToken
                };

                console.log('[Auth Trace] Storing SuperAdmin token & updating session state:', { accessToken: accessToken ? 'PRESENT' : 'MISSING', user: superAdminUser });

                localStorage.setItem("token", accessToken);
                localStorage.setItem("user", JSON.stringify(superAdminUser));
                onLogin(superAdminUser);

                addToastNotification(
                  "System Access Granted",
                  "Authenticated as Super Administrator.",
                  "success"
                );
                navigate("/super-admin/dashboard", { replace: true });
              } else {
                console.warn('[Auth Trace] SuperAdmin Login Failed:', data.message);
                addToastNotification(
                  "Access Denied",
                  data.message || "wrong or invalid credential try another",
                  "danger"
                );
              }
            } catch (err) {
              console.error('[Auth Trace] SuperAdmin Login Error:', err?.response?.data || err.message);
              addToastNotification("Connection Error", err?.response?.data?.message || "Could not reach authentication server.", "danger");
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
              Admin Email
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue="superadmin@vastra.com"
              className="w-full text-xs bg-slate-900 border border-slate-700/50 rounded-xl px-4.5 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              placeholder="superadmin@vastra.com"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
              NSD Secret Key / Password
            </label>
            <input
              name="secretKey"
              type="password"
              required
              defaultValue="SuperAdmin@123456"
              className="w-full text-xs bg-slate-900 border border-slate-700/50 rounded-xl px-4.5 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              placeholder="Enter admin password"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer text-center uppercase tracking-wider mt-4"
          >
            Authorise Admin Access
          </button>
        </form>

        <p className="text-[10px] text-slate-500 text-center font-mono font-medium">
          Vastra ERP • Encryption AES-256 Enabled
        </p>
      </div>
    </div>
  );
}

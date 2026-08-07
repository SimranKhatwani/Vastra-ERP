import api from '../api/axios';
import React from "react";

export function UserLogin({ onLogin, addToastNotification, switchableEmployees, getUserInitials }) {
  return (
    <div
      className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative"
      id="vastra-login-root"
    >
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 p-10 rounded-3xl shadow-2xl max-w-lg w-full relative overflow-hidden space-y-8 z-10">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 items-center justify-center font-black text-white text-lg tracking-tighter mx-auto shadow-lg shadow-indigo-600/20">
            VE
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase font-sans">
            Vastra ERP Portal
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Sign in securely to access your workspace.
          </p>
        </div>

        {/* Credentials Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            const businessId = e.target.businessId.value.trim();

            console.log('[Auth Trace] Initiating Tenant Login Request:', { businessId, email });

            try {
              const res = await api.post(`/auth/login`, { businessId, tenantCode: businessId, email, password });
              const data = res.data;

              console.log('[Auth Trace] Login Response Received:', data);

              if (data.success && data.data) {
                const accessToken = data.data.accessToken;
                const authenticatedUser = {
                  ...data.data.user,
                  id: data.data.user?.id || data.data.user?._id,
                  status: "Active",
                  token: accessToken
                };

                console.log('[Auth Trace] Storing token & updating session state:', { accessToken: accessToken ? 'PRESENT' : 'MISSING', user: authenticatedUser });

                onLogin(authenticatedUser);
                addToastNotification(
                  "Session Initiated",
                  "Authenticated via standard user token.",
                  "success"
                );
              } else {
                console.warn('[Auth Trace] Login Failed:', data.message);
                addToastNotification(
                  "Access Denied",
                  data.message || "wrong or invalid credential try another",
                  "danger"
                );
              }
            } catch (err) {
              console.error('[Auth Trace] Login Error:', err?.response?.data || err.message);
              addToastNotification("Connection Error", err?.response?.data?.message || "Could not reach the authentication server.", "danger");
            }
          }}
          className="space-y-5"
        >
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
              Business ID
            </label>
            <input
              name="businessId"
              type="text"
              required
              className="w-full text-sm bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              placeholder="e.g. VASTRA-001"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full text-sm bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              placeholder="name@garmentflow.com"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
              Secure Access PIN / Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full text-sm bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer text-center uppercase tracking-wider mt-2"
          >
            Authorise &amp; Enter Portal
          </button>
        </form>

        {/* Footer */}
        <p className="text-[10px] text-slate-500 text-center font-mono font-medium pt-3 border-t border-slate-700/40">
          Vastra ERP &bull; Encryption AES-256 Enabled
        </p>
      </div>
    </div>
  );
}

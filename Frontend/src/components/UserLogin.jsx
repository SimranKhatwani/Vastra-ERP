import api from '../api/axios';
import React from "react";
import { ShieldCheck, Layers, Scissors, Receipt, Sparkles } from "lucide-react";
import { VastraLogo } from "./VastraLogo";

export function UserLogin({ onLogin, addToastNotification, switchableEmployees, getUserInitials }) {
  return (
    <div
      className="min-h-screen lg:h-screen w-screen overflow-x-hidden lg:overflow-hidden bg-slate-950 flex flex-col lg:flex-row text-slate-100 font-sans selection:bg-indigo-500 selection:text-white"
      id="vastra-login-root"
    >
      {/* ========================================================================= */}
      {/* LEFT COLUMN: HERO / FEATURE SHOWCASE & BRAND ADVERTISEMENT                */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:w-[54%] xl:w-[56%] h-full bg-slate-950 p-6 lg:p-8 xl:p-10 pb-8 flex-col justify-between border-r border-slate-800/80 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Content Area */}
        <div className="relative z-10 space-y-3 xl:space-y-4">
          {/* Brand header */}
          <div className="space-y-1">
            <VastraLogo className="h-8 xl:h-9 w-auto" theme="dark" />
            <p className="text-[9px] xl:text-[10px] text-indigo-400 font-bold uppercase tracking-widest pl-0.5">
              APPAREL RETAIL &amp; MANAGEMENT
            </p>
          </div>




          {/* Main Titles */}
          <div className="space-y-2 max-w-xl pt-6 xl:pt-8">
            <h1 className="text-2xl xl:text-3xl font-black text-white tracking-tight leading-tight">
              Streamlined Control for Apparel Manufacturing &amp; Fashion Retail Stores
            </h1>
            <p className="text-xs xl:text-sm text-slate-300 leading-normal font-normal">
              Complete end-to-end master data catalog, fabric inventory matrix, alteration lifecycle tracking, tailor workflows, and real-time financial valuation.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-3.5 xl:space-y-4 pt-1 xl:pt-2 max-w-xl xl:max-w-2xl">
            <div className="p-3 xl:p-3.5 rounded-2xl bg-slate-900/85 border border-slate-800/90 hover:border-slate-700 transition-all flex items-start gap-4 shadow-sm">
              <div className="p-3 xl:p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                <Layers className="w-5 h-5 xl:w-6 xl:h-6" />
              </div>
              <div>
                <h3 className="text-sm xl:text-base font-bold text-slate-100">
                  Real-Time Garment &amp; Fabric SKU Matrix
                </h3>
                <p className="text-xs xl:text-sm text-slate-300 mt-1 leading-relaxed">
                  Track size-color variants, barcode tags, reserved stock, and multi-rack warehouse inventory.
                </p>
              </div>
            </div>

            <div className="p-3 xl:p-3.5 rounded-2xl bg-slate-900/85 border border-slate-800/90 hover:border-slate-700 transition-all flex items-start gap-4 shadow-sm">
              <div className="p-3 xl:p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Receipt className="w-5 h-5 xl:w-6 xl:h-6" />
              </div>
              <div>
                <h3 className="text-sm xl:text-base font-bold text-slate-100">
                  Instant POS Billing &amp; QR Tracking
                </h3>
                <p className="text-xs xl:text-sm text-slate-300 mt-1 leading-relaxed">
                  High-speed barcode scanner checkout, automated GST ledgers, thermal printing, and digital invoices.
                </p>
              </div>
            </div>

            <div className="p-3 xl:p-3.5 rounded-2xl bg-slate-900/85 border border-slate-800/90 hover:border-slate-700 transition-all flex items-start gap-4 shadow-sm">
              <div className="p-3 xl:p-3.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                <Scissors className="w-5 h-5 xl:w-6 xl:h-6" />
              </div>
              <div>
                <h3 className="text-sm xl:text-base font-bold text-slate-100">
                  Alterations Studio &amp; Tailor Delivery Pipeline
                </h3>
                <p className="text-xs xl:text-sm text-slate-300 mt-1 leading-relaxed">
                  Full PSSM job cards, stage-wise alteration tracking, tailor commission ledgers, and deadline alerts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status bar */}
        <div className="pt-4 pb-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono relative z-10">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Enterprise Grade 256-bit Secure Authentication</span>
          </div>
          <span>v1.2.0 &bull; Production</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: LOGIN CREDENTIALS FORM                                      */}
      {/* ========================================================================= */}
      <div className="flex-1 h-full bg-slate-900 flex items-center justify-center p-6 lg:p-8 xl:p-12 overflow-y-auto relative">
        {/* Background glow on right */}
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md xl:max-w-lg bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 p-8 sm:p-10 xl:p-12 rounded-3xl shadow-2xl relative z-10 space-y-6 xl:space-y-7">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center pb-1">
              <VastraLogo className="h-9 sm:h-10 w-auto mx-auto" theme="dark" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
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

              try {
                const res = await api.post(`/auth/login`, { businessId, tenantCode: businessId, email, password });
                const data = res.data;

                if (data.success && data.data) {
                  const accessToken = data.data.accessToken;
                  const authenticatedUser = {
                    ...data.data.user,
                    id: data.data.user?.id || data.data.user?._id,
                    status: "Active",
                    token: accessToken
                  };

                  onLogin(authenticatedUser);
                  addToastNotification(
                    "Session Initiated",
                    "Authenticated via standard user token.",
                    "success"
                  );
                } else {
                  addToastNotification(
                    "Access Denied",
                    data.message || "wrong or invalid credential try another",
                    "danger"
                  );
                }
              } catch (err) {
                addToastNotification("Connection Error", err?.response?.data?.message || "Could not reach the authentication server.", "danger");
              }
            }}
            className="space-y-4 xl:space-y-5"
          >
            <div>
              <label className="block text-xs uppercase font-bold text-slate-300 mb-2 tracking-wider">
                Business ID
              </label>
              <input
                name="businessId"
                type="text"
                required
                className="w-full text-sm sm:text-base bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 sm:py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                placeholder="e.g. VASTRA-001"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-300 mb-2 tracking-wider">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full text-sm sm:text-base bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 sm:py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                placeholder="name@vastraerp.com"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-300 mb-2 tracking-wider">
                Secure Access PIN / Password
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full text-sm sm:text-base bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 sm:py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 sm:py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl text-sm sm:text-base transition-all shadow-lg shadow-indigo-600/25 cursor-pointer text-center uppercase tracking-wider mt-2"
            >
              Authorise &amp; Enter Portal
            </button>
          </form>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-700/40 text-center space-y-1">
            <p className="text-xs text-slate-500 font-mono font-medium">
              Vastra ERP &bull; Encryption AES-256 Enabled
            </p>
            <p className="text-sm xl:text-base text-slate-300 font-medium">
              Designed &amp; Developed by <span>💻</span>{' '}
              <a
                href="https://www.requingroup.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-indigo-300 underline font-semibold transition-colors"
              >
                Requin Solutions Pvt. Ltd
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

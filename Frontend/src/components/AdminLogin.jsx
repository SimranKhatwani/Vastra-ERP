import React from "react";

export function AdminLogin({ onLogin, addToastNotification }) {
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
            const secretKey = e.target.secretKey.value;
            
            try {
              const res = await fetch('http://localhost:5000/api/superadmin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, secretKey })
              });
              
              const data = await res.json();
              
              if (data.success) {
                onLogin({
                  id: "admin-0",
                  name: "Super Admin",
                  email: data.user.email,
                  role: "SuperAdmin", // Internal frontend state mapping
                  status: "Active",
                  token: data.token
                });
                addToastNotification(
                  "System Access Granted",
                  "Authenticated as Super Administrator.",
                  "success"
                );
                window.history.pushState({}, "", "/");
              } else {
                addToastNotification(
                  "Access Denied",
                  data.message || "wrong or invalid credential try another",
                  "danger"
                );
              }
            } catch (err) {
              addToastNotification("Connection Error", "Could not reach the authentication server.", "danger");
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
              className="w-full text-xs bg-slate-900 border border-slate-700/50 rounded-xl px-4.5 py-3 text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="admin@garmentflow.com"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
              NSD Secret Key
            </label>
            <input
              name="secretKey"
              type="password"
              required
              className="w-full text-xs bg-slate-900 border border-slate-700/50 rounded-xl px-4.5 py-3 text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="Enter secure key"
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

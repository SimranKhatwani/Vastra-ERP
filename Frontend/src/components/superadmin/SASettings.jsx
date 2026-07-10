import React from "react";
import { Settings, Shield, Globe, Key, AlertTriangle, Save } from "lucide-react";

export function SASettings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-800">System Configurations</h2>
        <p className="text-xs text-slate-500">Manage global platform settings and features.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Platform Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">New Signups</p>
                <p className="text-[10px] text-slate-500">Allow new tenants to register</p>
              </div>
              <div className="w-10 h-6 bg-indigo-600 rounded-full flex items-center p-1 cursor-pointer shadow-inner">
                <div className="w-4 h-4 bg-white rounded-full translate-x-4 shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Maintenance Mode</p>
                <p className="text-[10px] text-slate-500">Take platform offline for updates</p>
              </div>
              <div className="w-10 h-6 bg-slate-200 rounded-full flex items-center p-1 cursor-pointer shadow-inner">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Security & API */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Security & APIs</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Global API Key Master</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value="sk_live_xxxxxxxxxxxxxxxxxxxxxx" 
                  readOnly
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 w-full font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 p-2 rounded-lg transition-colors cursor-pointer">
                  <Key className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Rotate Keys</p>
                <p className="text-[10px] text-amber-600 mt-1">Rotating the master key will instantly invalidate all connected downstream microservices.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer">
          <Save className="w-4 h-4" /> Save Configurations
        </button>
      </div>
    </div>
  );
}

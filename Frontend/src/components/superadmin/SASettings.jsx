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
        <div className="erp-card space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h3 className="erp-card-title !text-sm">Platform Settings</h3>
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
        <div className="erp-card space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="erp-card-title !text-sm">Security & APIs</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Global API Key Master</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value="sk_live_xxxxxxxxxxxxxxxxxxxxxx" 
                  readOnly
                  className="input-field font-mono"
                />
                <button className="btn-secondary !p-2">
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
        <button className="btn-primary !px-5 !py-2.5">
          <Save className="w-4 h-4" /> Save Configurations
        </button>
      </div>
    </div>
  );
}

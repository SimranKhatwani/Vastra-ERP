import React, { useState, useMemo } from "react";
import { Settings, Shield, Globe, Key, AlertTriangle, Save, CheckCircle2 } from "lucide-react";

export function SASettings({ searchQuery = "" }) {
  const [newSignups, setNewSignups] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const matchesSearch = (text) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  return (
    <div className="space-y-6 max-w-4xl select-none animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>System Configurations</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage global SaaS platform toggles, security API keys, and operational modes</p>
        </div>

        {savedToast && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-2xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global Settings */}
        {matchesSearch("Platform Settings New Signups Maintenance Mode Global") && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Platform Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-slate-800">New Store Signups</p>
                  <p className="text-[10px] text-slate-500">Allow new tenants to register online</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewSignups(!newSignups)}
                  className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer ${newSignups ? "bg-indigo-600" : "bg-slate-300"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${newSignups ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-slate-800">Maintenance Mode</p>
                  <p className="text-[10px] text-slate-500 font-medium">Take platform offline for scheduled updates</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer ${maintenanceMode ? "bg-rose-600" : "bg-slate-300"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${maintenanceMode ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security & API */}
        {matchesSearch("Security API Master Key Rotation System") && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Security & Master APIs</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Global API Key Master</label>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    value="sk_live_xxxxxxxxxxxxxxxxxxxxxx" 
                    readOnly
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none"
                  />
                  <button className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer">
                    <Key className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Rotate Keys</p>
                  <p className="text-[10px] text-amber-700 mt-0.5 font-medium">Rotating the master key will instantly invalidate all connected downstream microservices.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Configurations</span>
        </button>
      </div>
    </div>
  );
}
export default SASettings;

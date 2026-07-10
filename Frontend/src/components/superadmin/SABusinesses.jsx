import React, { useState } from "react";
import { Search, MoreVertical, ShieldBan, CheckCircle, AlertCircle, Building2 } from "lucide-react";

export function SABusinesses({ tenants = [] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Registered Businesses</h2>
          <p className="text-xs text-slate-500">Manage all tenant workspaces and access levels.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-64 shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-slate-800 w-full placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-4">Business / Tenant</th>
                <th className="p-4">Contact Email</th>
                <th className="p-4 text-center">Seats</th>
                <th className="p-4">Plan</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {filteredTenants.map((tenant, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{tenant.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {tenant.name.substring(0, 3).toUpperCase()}-{1000 + idx}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500">{tenant.email}</td>
                  <td className="p-4 text-center font-mono text-slate-800">{tenant.activeUsers} <span className="text-slate-400">/ 50</span></td>
                  <td className="p-4">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {tenant.status === "Active" ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                        <ShieldBan className="w-3 h-3" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p>No businesses found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

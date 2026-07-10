import React, { useState, useEffect } from "react";
import { Search, MoreVertical, ShieldBan, CheckCircle, AlertCircle, Building2, Plus, Calendar, MapPin, IndianRupee, Edit } from "lucide-react";
import { RegisterBusinessModal } from "./RegisterBusinessModal";
import axios from "axios";
import moment from "moment";

export function SABusinesses() {
  const [tenants, setTenants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get("/api/super-admin/tenants", config);
      if (data.success) {
        setTenants(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleRegisterSuccess = () => {
    fetchTenants(); // Refresh the list
  };

  const tempToast = (title, msg, type) => {
    console.log(`[TOAST ${type}] ${title}: ${msg}`);
    if (type === "danger") alert(`Error: ${msg}`);
    if (type === "success") alert(`Success: ${msg}`);
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/super-admin/tenants/${id}/toggle-status`, {}, config);
      fetchTenants();
    } catch (err) {
      alert("Failed to toggle status: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredTenants = tenants.filter(t => 
    (t.businessName && t.businessName.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Registered Businesses</h2>
          <p className="text-xs text-slate-500">Manage tenant workspaces, payments, and access levels.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="erp-search-container w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="erp-search-input"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="erp-btn-primary"
          >
            <Plus className="w-4 h-4" /> Register Business
          </button>
        </div>
      </div>

      <div className="erp-table-container relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}
        
        {error && !loading && (
          <div className="p-4 bg-red-50 text-red-600 text-xs font-bold border-b border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Failed to load businesses: {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-4">Business / Tenant</th>
                <th className="p-4">Location</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Plan & Expiry (IST)</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {filteredTenants.map((tenant) => (
                <tr key={tenant._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{tenant.businessName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Aadhaar: {tenant.aadhaarNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[120px]">{tenant.address?.city}, {tenant.address?.state}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500">
                    <p className="font-bold text-slate-700">{tenant.adminName || 'Admin'}</p>
                    <p>{tenant.adminEmail}</p>
                    <p className="text-[10px]">{tenant.phone}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="erp-badge-primary">
                        {tenant.plan}
                      </span>
                      {tenant.planExpiryDate && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          <Calendar className="w-3 h-3" />
                          {moment(tenant.planExpiryDate).format('DD MMM YYYY')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {tenant.status === "Active" ? (
                      <span className="badge-success">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="badge-danger">
                        <ShieldBan className="w-3 h-3" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 relative group">
                       <button onClick={() => alert("Edit Modal Not implemented inline")} className="erp-icon-btn text-indigo-600 hover:bg-indigo-50" title="Edit Business">
                         <Edit className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleToggleStatus(tenant._id)} className="erp-icon-btn hover:text-red-600 hover:bg-red-50" title="Toggle Status">
                        {tenant.status === 'Active' ? <ShieldBan className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && !loading && (
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

      <RegisterBusinessModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRegisterSuccess={handleRegisterSuccess}
        addToastNotification={tempToast}
      />
    </div>
  );
}

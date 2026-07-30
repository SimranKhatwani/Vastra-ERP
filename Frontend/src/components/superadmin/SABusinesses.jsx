import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  ShieldBan,
  CheckCircle,
  AlertCircle,
  Building2,
  Plus,
  Calendar,
  MapPin,
  Edit,
  Save,
  X,
  User,
  Phone,
  Mail,
  ShieldCheck,
  RotateCcw,
  Sliders,
  CheckCircle2,
  XCircle,
  Briefcase
} from "lucide-react";
import { RegisterBusinessModal } from "./RegisterBusinessModal";
import api from '../../api/axios';
import moment from "moment";

export function SABusinesses({ searchQuery = "" }) {
  const [tenants, setTenants] = useState([]);
  const [localSearch, setLocalSearch] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editModalTenant, setEditModalTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    businessName: "",
    plan: "Starter",
    planExpiryDate: "",
    status: "Active",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    aadhaarNumber: "",
    city: "",
    state: ""
  });

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await api.get(`/superadmin/tenants`, config);
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

  // Update Status directly via API
  const handleUpdateStatus = async (tenantId, newStatus) => {
    setUpdatingId(tenantId);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await api.put(`/superadmin/tenants/${tenantId}`,
        { status: newStatus },
        config
      );
      if (data.success) {
        setTenants(prev => prev.map(t => t._id === tenantId ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Edit Modal for a tenant
  const handleOpenEdit = (tenant) => {
    setEditModalTenant(tenant);
    setEditForm({
      businessName: tenant.businessName || "",
      plan: tenant.plan || "Starter",
      planExpiryDate: tenant.planExpiryDate ? moment(tenant.planExpiryDate).format("YYYY-MM-DD") : "",
      status: tenant.status || "Active",
      adminName: tenant.adminName || tenant.name || "",
      adminEmail: tenant.adminEmail || tenant.email || "",
      adminPhone: tenant.phone || "",
      aadhaarNumber: tenant.aadhaarNumber || "",
      city: tenant.address?.city || "",
      state: tenant.address?.state || ""
    });
  };

  // Save Tenant Details
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModalTenant) return;

    setUpdatingId(editModalTenant._id);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        businessName: editForm.businessName,
        plan: editForm.plan,
        planExpiryDate: editForm.planExpiryDate ? new Date(editForm.planExpiryDate) : undefined,
        status: editForm.status,
        email: editForm.adminEmail,
        phone: editForm.adminPhone,
        aadhaarNumber: editForm.aadhaarNumber,
        address: {
          city: editForm.city,
          state: editForm.state
        }
      };

      const { data } = await api.put(`/superadmin/tenants/${editModalTenant._id}`,
        payload,
        config
      );

      if (data.success) {
        setEditModalTenant(null);
        fetchTenants();
      }
    } catch (err) {
      alert("Failed to save changes: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  // Combined filtering using both top navbar search & local search
  const filteredTenants = useMemo(() => {
    const query = (searchQuery || localSearch).toLowerCase().trim();
    if (!query) return tenants;

    return tenants.filter(t =>
      (t.businessName && t.businessName.toLowerCase().includes(query)) ||
      (t.businessCode && t.businessCode.toLowerCase().includes(query)) ||
      (t.email && t.email.toLowerCase().includes(query)) ||
      (t.adminEmail && t.adminEmail.toLowerCase().includes(query)) ||
      (t.adminName && t.adminName.toLowerCase().includes(query)) ||
      (t.phone && t.phone.toLowerCase().includes(query)) ||
      (t.plan && t.plan.toLowerCase().includes(query)) ||
      (t.status && t.status.toLowerCase().includes(query)) ||
      (t.address?.city && t.address.city.toLowerCase().includes(query)) ||
      (t.address?.state && t.address.state.toLowerCase().includes(query))
    );
  }, [tenants, searchQuery, localSearch]);

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* TOP CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Registered Businesses Management</span>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
              {filteredTenants.length} Stores
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage tenant store statuses, subscription plans, expiry dates, and administrative details
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100/90 focus-within:bg-white border border-slate-200/90 focus-within:border-indigo-500 rounded-2xl shadow-2xs focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search store name, code, email..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch("")}
                  className="p-0.5 hover:bg-slate-200/80 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer shrink-0"
                  title="Clear local search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register Business</span>
          </button>
        </div>
      </div>

      {/* TENANTS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && (
          <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
            <div className="w-6 h-6 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-xs font-bold font-mono">Loading MongoDB Businesses...</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-rose-50 text-rose-700 text-xs font-bold border-b border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Failed to load businesses: {error}
          </div>
        )}

        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3.5 px-4">Business / Tenant</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Admin Contact</th>
                  <th className="py-3.5 px-4">Plan & Expiry</th>
                  <th className="py-3.5 px-4 text-center">Status Control</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredTenants.map((tenant) => {
                  const isUpdating = updatingId === tenant._id;
                  const isActive = tenant.status === "Active";

                  return (
                    <tr key={tenant._id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Business Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs">{tenant.businessName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-indigo-700 border border-slate-200">
                                {tenant.businessCode || tenant._id}
                              </span>
                              {tenant.aadhaarNumber && (
                                <span className="text-[9px] font-mono text-slate-400">
                                  Aadhaar: {tenant.aadhaarNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {tenant.address?.city || 'City N/A'}, {tenant.address?.state || 'State N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Admin Contact */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-extrabold text-slate-800 text-xs">{tenant.adminName || tenant.name || 'Store Admin'}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {tenant.adminEmail || tenant.email}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {tenant.phone}
                          </p>
                        </div>
                      </td>

                      {/* Plan & Expiry */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {tenant.plan || 'Starter'}
                          </span>
                          {tenant.planExpiryDate && (
                            <p className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              Exp: {moment(tenant.planExpiryDate).format('DD MMM YYYY')}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* INTERACTIVE STATUS CONTROL DROPDOWN */}
                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={tenant.status || "Active"}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateStatus(tenant._id, e.target.value)}
                          className={`px-3 py-1.5 rounded-2xl text-[11px] font-black uppercase font-mono border outline-none cursor-pointer transition-all ${
                            tenant.status === "Active"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-2 focus:ring-emerald-500"
                              : tenant.status === "Suspended"
                              ? "bg-rose-50 text-rose-800 border-rose-300 focus:ring-2 focus:ring-rose-500"
                              : tenant.status === "Trial"
                              ? "bg-amber-50 text-amber-800 border-amber-300 focus:ring-2 focus:ring-amber-500"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          <option value="Active">🟢 Active</option>
                          <option value="Suspended">🔴 Suspended</option>
                          <option value="Trial">🟡 Trial</option>
                          <option value="Inactive">⚪ Inactive</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(tenant)}
                            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-indigo-200"
                            title="Edit Business Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}

                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="font-bold text-xs">No businesses found matching your search term.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REGISTER BUSINESS MODAL */}
      <RegisterBusinessModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterSuccess={fetchTenants}
        addToastNotification={(t, m, type) => console.log(t, m, type)}
      />

      {/* EDIT BUSINESS DETAILS MODAL */}
      {editModalTenant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Edit Business Details: {editModalTenant.businessName}
                </h3>
              </div>
              <button
                onClick={() => setEditModalTenant(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Business Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.businessName}
                    onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Subscription Plan</label>
                  <select
                    value={editForm.plan}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Free Trial">Free Trial</option>
                    <option value="Starter">Starter (₹2,499/mo)</option>
                    <option value="Professional">Professional (₹5,999/mo)</option>
                    <option value="Enterprise">Enterprise (₹14,999/mo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Plan Expiry Date</label>
                  <input
                    type="date"
                    value={editForm.planExpiryDate}
                    onChange={(e) => setEditForm({ ...editForm, planExpiryDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Business Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="Suspended">🔴 Suspended</option>
                    <option value="Trial">🟡 Trial</option>
                    <option value="Inactive">⚪ Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.adminEmail}
                    onChange={(e) => setEditForm({ ...editForm, adminEmail: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Admin Phone</label>
                  <input
                    type="text"
                    required
                    value={editForm.adminPhone}
                    onChange={(e) => setEditForm({ ...editForm, adminPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">City</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">State</label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalTenant(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingId === editModalTenant._id}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
export default SABusinesses;

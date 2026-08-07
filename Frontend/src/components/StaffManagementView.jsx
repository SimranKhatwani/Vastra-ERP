import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, ShieldBan, CheckCircle, User, Phone, Mail, MapPin } from "lucide-react";
import api from '../api/axios';
import { generateDemoEmployees } from "../data/demoData";

export function StaffManagementView() {
  const [staff, setStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [generatedAuth, setGeneratedAuth] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    gender: "Male",
    age: "",
    address: ""
  });

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Offline Mode");
      const { data } = await api.get(`/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setStaff(data.data || []);
      }
    } catch (error) {
      console.warn("Failed to fetch staff from API:", error.message);
      setStaff([]);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.post(`/staff`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        const newStaff = { ...data.data, password: data.generatedPassword };
        setStaff([newStaff, ...staff]);
        setShowAddModal(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          designation: "",
          gender: "Male",
          age: "",
          address: ""
        });
        if (data.generatedPassword) {
          setGeneratedAuth({ email: data.data.email, password: data.generatedPassword });
        }
      }
    } catch (err) {
      alert("Failed to add staff: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      try {
        const token = localStorage.getItem("token");
        await api.delete(`/staff/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStaff(staff.filter(s => s._id !== id));
      } catch (err) {
        alert("Failed to delete staff: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" id="sa-staff-root">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Staff Management</h2>
          <p className="text-xs text-slate-500 mt-1">Manage platform administrators, support agents, and technical staff.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="erp-btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Staff</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="erp-card">
        {/* Controls */}
        <div className="erp-card-header">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, email, or designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 pl-9 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-slate-200 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Contact Info</th>
                <th>Password</th>
                <th>Designation</th>
                <th>Demographics</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium text-xs">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((emp) => (
                  <tr key={emp._id || emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{emp.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                              ID: {(emp._id || emp.id || "").toString().substring(0, 8)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.phone}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-800 font-bold bg-slate-50/50">
                      {emp.password || 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide">
                        {emp.designation}
                      </span>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2 text-slate-500">
                        <User className="w-3.5 h-3.5" />
                        <span>{emp.gender}, {emp.age} yrs</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[150px]" title={emp.address}>{emp.address}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 w-fit mx-auto px-2 py-1 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase">{emp.status || "Active"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(emp._id || emp.id)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Remove Staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auth Generated Modal */}
      {generatedAuth && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg mb-1">Employee Registered</h3>
            <p className="text-xs text-slate-500 mb-6">Store these credentials safely. They will not be shown again.</p>
            
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-3 mb-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                <div className="text-sm font-semibold text-slate-700">{generatedAuth.email}</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generated Password</label>
                <div className="text-base font-mono font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg mt-1 select-all">
                  {generatedAuth.password}
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                navigator.clipboard.writeText(generatedAuth.password);
                setGeneratedAuth(null);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors"
            >
              Copy Password & Close
            </button>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">Register Staff Member</h3>
                <p className="text-xs text-slate-500 mt-0.5">Add a new admin or support staff to the platform.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddStaff} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                
                {/* Registration Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Account Registration</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Full Name</label>
                    <input 
                      type="text" name="name" required value={formData.name} onChange={handleChange}
                      placeholder="e.g. Rahul Sharma"
                      className="erp-input"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Email Address</label>
                    <input 
                      type="email" name="email" required value={formData.email} onChange={handleChange}
                      placeholder="rahul@garmenterp.com"
                      className="erp-input"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Phone Number</label>
                    <input 
                      type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                      placeholder="e.g. 9876543210" pattern="\d{10}" maxLength={10}
                      className="erp-input"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Designation / Role</label>
                    <input 
                      type="text" name="designation" required value={formData.designation} onChange={handleChange}
                      placeholder="e.g. Senior Support Executive"
                      className="erp-input"
                    />
                  </div>
                </div>

                {/* Personal Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Staff Details</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="erp-select">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Age</label>
                      <input 
                        type="number" name="age" required value={formData.age} onChange={handleChange}
                        placeholder="e.g. 28" min="18" max="100"
                        className="erp-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Full Address</label>
                    <textarea 
                      name="address" required value={formData.address} onChange={handleChange}
                      placeholder="Complete residential address..."
                      className="erp-input min-h-[105px] resize-none"
                    ></textarea>
                  </div>
                </div>

              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="erp-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="erp-btn-primary px-8">
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

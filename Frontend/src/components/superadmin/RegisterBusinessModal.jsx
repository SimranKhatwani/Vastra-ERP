import React, { useState, useEffect } from "react";
import { X, Building2, User, Mail, Phone, Lock, CreditCard, FileText, MapPin, IndianRupee } from "lucide-react";
import api from '../../api/axios';


export function RegisterBusinessModal({ isOpen, onClose, onRegisterSuccess, addToastNotification }) {
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    plan: "Starter",
    adminName: "",
    adminPassword: "",
    adminPhone: "",
    aadhaarNumber: "",
    street: "",
    city: "",
    district: "",
    state: ""
  });
  const [loading, setLoading] = useState(false);
  const [registeredTenant, setRegisteredTenant] = useState(null);

  if (!isOpen) {
    if (registeredTenant) setRegisteredTenant(null); // Reset when fully closed
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    if (formData.adminPhone.length !== 10) return addToastNotification("Error", "Phone must be 10 digits", "danger");
    if (formData.aadhaarNumber.length !== 12) return addToastNotification("Error", "Aadhaar must be 12 digits", "danger");

    setLoading(true);
    const token = localStorage.getItem("token") || "";
    const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } };

    try {
      const payload = {
        businessName: formData.businessName,
        email: formData.email,
        plan: formData.plan,
        adminName: formData.adminName,
        adminPassword: formData.adminPassword,
        adminPhone: formData.adminPhone,
        aadhaarNumber: formData.aadhaarNumber,
        address: {
          street: formData.street,
          city: formData.city,
          district: formData.district,
          state: formData.state
        }
      };

      const regRes = await api.post(`/superadmin/register-business`, payload, config);
      if (regRes.data.success) {
        addToastNotification("Success", "Business Registered Successfully!", "success");
        setRegisteredTenant(regRes.data.data.tenant);
        onRegisterSuccess(regRes.data.data.tenant);
        // Do not close immediately, let them see the success screen
      }
    } catch (error) {
      addToastNotification("Error", error.response?.data?.message || error.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAndReset = () => {
    setRegisteredTenant(null);
    onClose();
  };

  if (registeredTenant) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-center p-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Successful!</h2>
          <p className="text-sm text-slate-500 mb-6">You can now provide these details to the business admin so they can log in.</p>
          
          <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-200 mb-6 space-y-3">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Business Name</p>
              <p className="font-bold text-slate-700">{registeredTenant.businessName}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Business ID (Required for Login)</p>
              <div className="flex items-center gap-2">
                <code className="bg-white px-2 py-1 rounded border border-slate-200 text-indigo-600 font-mono text-sm">{registeredTenant.businessCode || registeredTenant._id}</code>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Admin Email</p>
              <p className="font-medium text-slate-700">{registeredTenant.email}</p>
            </div>
          </div>
          
          <button onClick={handleCloseAndReset} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-colors">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-4 max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Register New Business</h2>
            <p className="text-[11px] text-slate-500 font-medium">Aadhaar, address, and admin assignment.</p>
          </div>
          <button type="button" onClick={handleCloseAndReset} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleRegistration} className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Business & Payment */}
            <div className="space-y-4">
              <div>
                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Business Details
                </h3>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Business Name *</label>
                    <input required name="businessName" value={formData.businessName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="e.g. Acme Boutiques" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address (Business & Login) *</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="contact@acme.com" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> Location / Address
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Street Address *</label>
                    <input required name="street" value={formData.street} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500" placeholder="123 Main St" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">City *</label>
                    <input required name="city" value={formData.city} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500" placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">District *</label>
                    <input required name="district" value={formData.district} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500" placeholder="Mumbai Suburban" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">State *</label>
                    <input required name="state" value={formData.state} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500" placeholder="Maharashtra" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Admin & Payment */}
            <div className="space-y-4">
              <div>
                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-500" /> Primary Admin
                </h3>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Admin Full Name *</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input required name="adminName" value={formData.adminName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="John Doe" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone *</label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input required name="adminPhone" value={formData.adminPhone} onChange={handleChange} pattern="\d{10}" maxLength={10} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="10 Digits" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Aadhaar No. *</label>
                      <div className="relative">
                        <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input required name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} pattern="\d{12}" maxLength={12} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="12 Digits" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Admin Password *</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input required type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} minLength={6} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="Min 6 characters" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-500" /> Subscription
                </h3>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Plan Level</label>
                    <select name="plan" value={formData.plan} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500">
                      <option value="Trial">Trial</option>
                      <option value="Starter">Starter</option>
                      <option value="Professional">Professional</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0 mt-4">
            <button type="button" onClick={handleCloseAndReset} className="px-5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-lg transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2">
              {loading ? "Registering..." : "Register Business"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

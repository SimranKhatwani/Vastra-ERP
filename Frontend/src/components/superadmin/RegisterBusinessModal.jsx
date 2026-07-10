import React, { useState, useEffect } from "react";
import { X, Building2, User, Mail, Phone, Lock, CreditCard, FileText, MapPin, IndianRupee } from "lucide-react";
import axios from "axios";

export function RegisterBusinessModal({ isOpen, onClose, onRegisterSuccess, addToastNotification }) {
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    plan: "Starter",
    customAmount: "",
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

  // Dynamically load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePaymentAndRegistration = async (e) => {
    e.preventDefault();
    if (formData.adminPhone.length !== 10) return addToastNotification("Error", "Phone must be 10 digits", "danger");
    if (formData.aadhaarNumber.length !== 12) return addToastNotification("Error", "Aadhaar must be 12 digits", "danger");
    if (!formData.customAmount || isNaN(formData.customAmount) || Number(formData.customAmount) <= 0) {
      return addToastNotification("Error", "Please enter a valid amount to pay", "danger");
    }

    setLoading(true);
    const token = localStorage.getItem("token") || "";
    const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } };

    try {
      // 1. Create Order
      const orderRes = await axios.post("/api/super-admin/create-order", { amount: formData.customAmount }, config);
      
      if (!orderRes.data.success) {
        throw new Error("Failed to create Razorpay order");
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: "rzp_test_SbIYMAQzqrEkAM", // Should ideally fetch from backend or env, but using requested test key
        amount: orderRes.data.order.amount,
        currency: "INR",
        name: "Threadflow / Garment ERP",
        description: `Subscription: ${formData.plan} Plan`,
        order_id: orderRes.data.order.id,
        handler: async function (response) {
          try {
            setLoading(true);
            // 3. Verify Payment and Create Tenant
            const payload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
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

            const regRes = await axios.post("/api/super-admin/register-business", payload, config);
            if (regRes.data.success) {
              addToastNotification("Success", "Payment Verified & Business Registered!", "success");
              onRegisterSuccess(regRes.data.data.tenant);
              onClose();
            }
          } catch (err) {
            addToastNotification("Error", err.response?.data?.message || err.message, "danger");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: formData.adminName,
          email: formData.email,
          contact: formData.adminPhone
        },
        theme: {
          color: "#4f46e5" // indigo-600
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            addToastNotification("Warning", "Payment cancelled. Business was not registered.", "warning");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setLoading(false);
        addToastNotification("Error", response.error.description, "danger");
      });
      rzp.open();

    } catch (error) {
      setLoading(false);
      addToastNotification("Error", error.response?.data?.message || error.message, "danger");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-4 max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Register New Business</h2>
            <p className="text-[11px] text-slate-500 font-medium">Aadhaar, address, and mandatory payment integration.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handlePaymentAndRegistration} className="p-4 space-y-4 overflow-y-auto flex-1">
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
                <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Plan Level</label>
                    <select name="plan" value={formData.plan} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500">
                      <option value="Trial">Trial</option>
                      <option value="Starter">Starter</option>
                      <option value="Professional">Professional</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount (₹) *</label>
                    <div className="relative">
                      <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input required type="number" min="1" name="customAmount" value={formData.customAmount} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 font-bold text-indigo-700" placeholder="Amount" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0 mt-4">
            <button type="button" onClick={onClose} className="px-5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-lg transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2">
              {loading ? (
                <>Processing Payment...</>
              ) : (
                <>Pay ₹{formData.customAmount || '0'} & Register</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

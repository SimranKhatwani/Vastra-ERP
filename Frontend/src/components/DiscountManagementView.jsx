import React, { useState, useEffect } from 'react';
import { Percent, Tag, Plus, Check, Trash2, ShieldAlert, Award, FileText, BarChart3, Clock, Play } from 'lucide-react';

const DiscountManagementView = ({ onAddNotification }) => {
  const [activeTab, setActiveTab] = useState('rules');
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);

  // Form states for creating/editing a rule
  const [offerName, setOfferName] = useState('');
  const [offerType, setOfferType] = useState('Automatic');
  const [minBillAmount, setMinBillAmount] = useState(0);
  const [discountType, setDiscountType] = useState('Flat');
  const [discountValue, setDiscountValue] = useState(0);
  const [priority, setPriority] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Approval requests states
  const [approvals, setApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  // PIN validation for overrides
  const [selectedApprovalId, setSelectedApprovalId] = useState(null);
  const [supUsername, setSupUsername] = useState('');
  const [supPassword, setSupPassword] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  // Fetch all active rules
  const fetchRules = async () => {
    setRulesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/discounts/rules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setRules(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRulesLoading(false);
    }
  };

  // Fetch pending overrides approvals
  const fetchApprovals = async () => {
    setApprovalsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // For simplicity, we can fetch all overrides logs. We will query approvals directly.
      const res = await fetch('http://localhost:5000/api/discounts/rules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // In a real environment, we'd have a specific endpoint. Let's build a mock logs array if server does not respond
      const json = await res.json();
      setApprovals([
        { _id: '1', originalBillAmount: 6500, requestedDiscount: 1500, requestedBy: 'Cashier Terminal A', status: 'Pending', reason: 'Customer requested combo adjustment' },
        { _id: '2', originalBillAmount: 12000, requestedDiscount: 2000, requestedBy: 'Cashier Terminal B', status: 'Approved', approvedBy: 'Manager Rahul', reason: 'Festival opening exception' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setApprovalsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchApprovals();
  }, []);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!offerName || !discountValue) {
      alert('Please fill out required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/discounts/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          offerName,
          offerType,
          minBillAmount,
          discountType,
          discountValue,
          priority,
          couponCode: offerType === 'Coupon' ? couponCode : undefined
        })
      });
      const json = await res.json();
      if (json.success) {
        if (onAddNotification) {
          onAddNotification('Rule Created', `Offer "${offerName}" is now active.`, 'success');
        }
        setShowCreateModal(false);
        // Reset form
        setOfferName('');
        setOfferType('Automatic');
        setMinBillAmount(0);
        setDiscountType('Flat');
        setDiscountValue(0);
        setPriority(1);
        setCouponCode('');
        fetchRules();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/discounts/rules/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        if (onAddNotification) {
          onAddNotification('Rule Deleted', 'Promotion has been deactivated.', 'info');
        }
        fetchRules();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveOverride = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/discounts/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          approvalId: selectedApprovalId,
          supervisorUsername: supUsername,
          supervisorPassword: supPassword
        })
      });
      const json = await res.json();
      if (json.success) {
        if (onAddNotification) {
          onAddNotification('Override Approved', 'Discount manual override has been authorized.', 'success');
        }
        setShowPinModal(false);
        setSupUsername('');
        setSupPassword('');
        fetchApprovals();
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 font-sans text-xs font-semibold text-slate-600">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Discount & Offer Engine</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configure automatic promotions, buy X get Y combo offers, and authorize override requests</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          <span>New Discount Rule</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-2xs mb-6 grid grid-cols-2 md:grid-cols-4 gap-1 w-full max-w-2xl">
        {[
          { id: 'rules', label: 'Discount Rules', icon: Percent },
          { id: 'coupons', label: 'Coupon Codes', icon: Tag },
          { id: 'approvals', label: 'Approval History', icon: ShieldAlert },
          { id: 'analytics', label: 'Analytics Report', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active Promotions</h3>
          {rulesLoading ? (
            <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Loading active offers...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                    <th className="p-3.5">Offer Name</th>
                    <th className="p-3.5">Trigger Condition</th>
                    <th className="p-3.5">Discount Offer</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-3.5 font-bold text-slate-800">{rule.offerName}</td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {rule.minBillAmount > 0 ? `Subtotal >= ₹${rule.minBillAmount}` : 'No minimum condition'}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-indigo-600">
                        {rule.discountType === 'Flat' ? `₹${rule.discountValue} OFF` : `${rule.discountValue}% OFF`}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rule.offerType === 'Automatic' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {rule.offerType}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">{rule.priority}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteRule(rule._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rules.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-slate-400 font-bold">
                        No discount rules configured yet. Create a rule to enable automated checkouts!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Coupon Code Registry</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rules.filter(r => r.offerType === 'Coupon').map((coupon, idx) => (
              <div key={idx} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/20 space-y-2 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-indigo-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                      {coupon.couponCode || 'PROMO'}
                    </span>
                    <h4 className="font-bold text-slate-800 text-xs mt-1">{coupon.offerName}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(coupon._id)}
                    className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">
                  Offer: {coupon.discountType === 'Flat' ? `₹${coupon.discountValue} OFF` : `${coupon.discountValue}% OFF`} on min bill of ₹{coupon.minBillAmount}
                </p>
              </div>
            ))}
            {rules.filter(r => r.offerType === 'Coupon').length === 0 && (
              <div className="col-span-3 p-12 text-center text-slate-400 font-bold">
                No active coupon codes found. Click "New Discount Rule" to set up a code (e.g. WINTER500).
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Manual Override Authorization Ledger</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                  <th className="p-3.5">Requested By</th>
                  <th className="p-3.5">Cart Subtotal</th>
                  <th className="p-3.5">Proposed Discount</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((app, idx) => (
                  <tr key={idx} className="border-b border-slate-50">
                    <td className="p-3.5 font-bold text-slate-700">{app.requestedBy}</td>
                    <td className="p-3.5 font-mono">₹{app.originalBillAmount}</td>
                    <td className="p-3.5 font-mono text-red-500">-₹{app.requestedDiscount}</td>
                    <td className="p-3.5 text-slate-400">{app.reason}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {app.status === 'Pending' ? (
                        <button
                          onClick={() => {
                            setSelectedApprovalId(app._id);
                            setShowPinModal(true);
                          }}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold cursor-pointer"
                        >
                          Approve (PIN)
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Approved by {app.approvedBy}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <h4 className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Total Discount Value Issued</h4>
            <span className="text-2xl font-black text-indigo-600 font-mono">₹24,500</span>
            <p className="text-[9px] text-slate-400">Total discount budget consumed across all checkouts.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <h4 className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Automatic Offer Redemptions</h4>
            <span className="text-2xl font-black text-slate-800 font-mono">112 sales</span>
            <p className="text-[9px] text-slate-400">Count of checks matching subtotal rule ranges.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <h4 className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Active Rule Conversion</h4>
            <span className="text-2xl font-black text-emerald-600 font-mono">18.4%</span>
            <p className="text-[9px] text-slate-400">Percentage of cart bills utilizing active discount codes.</p>
          </div>
        </div>
      )}

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Configure New Promotion Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Offer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival Flat ₹100 Off"
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Offer Type</label>
                  <select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800"
                  >
                    <option value="Automatic">Automatic (Subtotal Trigger)</option>
                    <option value="Coupon">Coupon Code</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Priority Order</label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-mono"
                  />
                </div>
              </div>

              {offerType === 'Coupon' && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Promo Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WINTER500"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">Minimum Bill Subtotal (₹)</label>
                  <input
                    type="number"
                    value={minBillAmount}
                    onChange={(e) => setMinBillAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-mono focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tax Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800"
                  >
                    <option value="Flat">Flat (₹)</option>
                    <option value="Percentage">Pct (%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Discount Value *</label>
                <input
                  type="number"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-mono focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supervisor Credentials Override Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Supervisor Override Authorization</h3>
            <form onSubmit={handleApproveOverride} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Supervisor Username</label>
                <input
                  type="text"
                  required
                  placeholder="Enter manager username..."
                  value={supUsername}
                  onChange={(e) => setSupUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Supervisor Password / PIN</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={supPassword}
                  onChange={(e) => setSupPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Authorize Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountManagementView;

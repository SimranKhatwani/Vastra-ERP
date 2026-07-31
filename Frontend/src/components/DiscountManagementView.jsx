import api from '../api/axios';
import React, { useState, useEffect } from 'react';
import { Percent, Tag, Plus, Check, Trash2, ShieldAlert, Award, FileText, BarChart3, Clock, Play, Copy, Archive, Power, Calendar, Edit3 } from 'lucide-react';

const DiscountManagementView = ({ onAddNotification }) => {
  const [activeTab, setActiveTab] = useState('rules');
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);

  // Form states for creating a rule
  const [offerName, setOfferName] = useState('');
  const [description, setDescription] = useState('');
  const [offerType, setOfferType] = useState('Automatic');
  const [discountType, setDiscountType] = useState('Flat');
  const [discountValue, setDiscountValue] = useState(0);
  const [minBillAmount, setMinBillAmount] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState(0);
  const [priority, setPriority] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Specific targets
  const [targetProduct, setTargetProduct] = useState('');
  const [targetCategory, setTargetCategory] = useState('');
  const [targetBrand, setTargetBrand] = useState('');
  
  // Quantity discount limits
  const [minQuantity, setMinQuantity] = useState(1);
  
  // Buy X Get Y
  const [buyProductId, setBuyProductId] = useState('');
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [getProductId, setGetProductId] = useState('');
  const [getQuantity, setGetQuantity] = useState(1);
  const [getDiscountPercent, setGetDiscountPercent] = useState(100);

  // Loyalty settings
  const [requiredLoyaltyPoints, setRequiredLoyaltyPoints] = useState(100);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);

  // Fetch rules
  const fetchRules = async () => {
    setRulesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/discounts/rules`);
      const json = res.data;
      if (json.success) {
        setRules(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!offerName || !discountValue || !startDate || !endDate) {
      alert('Please fill out all required fields, including Start and End dates.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        offerName,
        description,
        offerType,
        discountType,
        discountValue,
        minBillAmount,
        maxDiscount: maxDiscount || undefined,
        priority,
        startDate,
        endDate,
        applicableProducts: targetProduct ? [targetProduct] : [],
        applicableCategories: targetCategory ? [targetCategory] : [],
        applicableBrands: targetBrand ? [targetBrand] : [],
        buyProductId: offerType === 'BuyXGetY' ? buyProductId : undefined,
        buyQuantity: offerType === 'BuyXGetY' ? buyQuantity : undefined,
        getProductId: offerType === 'BuyXGetY' ? getProductId : undefined,
        getQuantity: offerType === 'BuyXGetY' ? getQuantity : undefined,
        getDiscountPercent: offerType === 'BuyXGetY' ? getDiscountPercent : undefined,
        requiredLoyaltyPoints: offerType === 'LoyaltyRule' ? requiredLoyaltyPoints : undefined,
        status: 'Active'
      };

      const url = editingRuleId
        ? `/discounts/rules/${editingRuleId}`
        : '/discounts/rules';

      const method = editingRuleId ? 'put' : 'post';

      const res = await api[method](url, payload);
      const json = res.data;
      if (json.success) {
        if (onAddNotification) {
          onAddNotification(
            editingRuleId ? 'Rule Updated' : 'Rule Configured',
            `Offer "${offerName}" was successfully saved.`,
            'success'
          );
        }
        setShowCreateModal(false);
        resetForm();
        fetchRules();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setOfferName('');
    setDescription('');
    setOfferType('Automatic');
    setDiscountType('Flat');
    setDiscountValue(0);
    setMinBillAmount(0);
    setMaxDiscount(0);
    setPriority(1);
    setStartDate('');
    setEndDate('');
    setTargetProduct('');
    setTargetCategory('');
    setTargetBrand('');
    setBuyProductId('');
    setBuyQuantity(1);
    setGetProductId('');
    setGetQuantity(1);
    setGetDiscountPercent(100);
    setRequiredLoyaltyPoints(100);
    setEditingRuleId(null);
  };

  const handleEditClick = (rule) => {
    setEditingRuleId(rule._id);
    setOfferName(rule.offerName || '');
    setDescription(rule.description || '');
    setOfferType(rule.offerType || 'Automatic');
    setDiscountType(rule.discountType || 'Flat');
    setDiscountValue(rule.discountValue || 0);
    setMinBillAmount(rule.minBillAmount || 0);
    setMaxDiscount(rule.maxDiscount || 0);
    setPriority(rule.priority || 1);
    
    const startFormatted = rule.startDate ? new Date(rule.startDate).toISOString().substring(0, 10) : '';
    const endFormatted = rule.endDate ? new Date(rule.endDate).toISOString().substring(0, 10) : '';
    setStartDate(startFormatted);
    setEndDate(endFormatted);

    setTargetProduct(rule.applicableProducts?.[0] || '');
    setTargetCategory(rule.applicableCategories?.[0] || '');
    setTargetBrand(rule.applicableBrands?.[0] || '');
    
    setBuyProductId(rule.buyProductId || '');
    setBuyQuantity(rule.buyQuantity || 1);
    setGetProductId(rule.getProductId || '');
    setGetQuantity(rule.getQuantity || 1);
    setGetDiscountPercent(rule.getDiscountPercent || 100);
    setRequiredLoyaltyPoints(rule.requiredLoyaltyPoints || 100);

    setShowCreateModal(true);
  };

  // Toggle Rule Status (Active / Inactive)
  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const token = localStorage.getItem('token');
      const res = await api.put(`/discounts/rules/${id}/toggle`, { status: nextStatus });
      const json = res.data;
      if (json.success) {
        if (onAddNotification) {
          onAddNotification('Status Updated', `Offer status changed to ${nextStatus}.`, 'info');
        }
        fetchRules();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Duplicate Rule
  const handleDuplicate = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/discounts/rules/${id}/duplicate`);
      const json = res.data;
      if (json.success) {
        if (onAddNotification) {
          onAddNotification('Duplicated', 'Discount rule duplicated successfully.', 'success');
        }
        fetchRules();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Archive Rule (Soft Delete)
  const handleArchive = async (id) => {
    if (!confirm('Are you sure you want to archive this discount rule?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await api.put(`/discounts/rules/${id}/archive`);
      const json = res.data;
      if (json.success) {
        if (onAddNotification) {
          onAddNotification('Archived', 'Promotion archived.', 'info');
        }
        fetchRules();
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
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configure Product, Category, Brand, combos, buy X get Y promotions, and loyalty redemption rules</p>
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
      <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-2xs mb-6 grid grid-cols-2 md:grid-cols-2 gap-1 w-full max-w-md">
        {[
          { id: 'rules', label: 'Discount Rules', icon: Percent },
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
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Trigger Target</th>
                    <th className="p-3.5">Discount Value</th>
                    <th className="p-3.5">Validity Dates</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, idx) => {
                    const isExpired = new Date(rule.endDate) < new Date();
                    return (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">{rule.offerName}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{rule.description || 'No description'}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {rule.offerType}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-500">
                          {rule.offerType === 'Product' && `Product ID: ${rule.applicableProducts[0] || 'N/A'}`}
                          {rule.offerType === 'Category' && `Category: ${rule.applicableCategories[0] || 'N/A'}`}
                          {rule.offerType === 'Brand' && `Brand: ${rule.applicableBrands[0] || 'N/A'}`}
                          {rule.offerType === 'Automatic' && `Min Bill: ₹${rule.minBillAmount}`}
                          {rule.offerType === 'BuyXGetY' && `Buy ${rule.buyQuantity} Get ${rule.getQuantity}`}
                          {rule.offerType === 'LoyaltyRule' && `Redeem: ${rule.requiredLoyaltyPoints} points`}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-indigo-600">
                          {rule.discountType === 'Flat' ? `₹${rule.discountValue} OFF` : `${rule.discountValue}% OFF`}
                        </td>
                        <td className="p-3.5 font-mono text-[10px]">
                          <div className="text-slate-600">Start: {new Date(rule.startDate).toLocaleDateString()}</div>
                          <div className={isExpired ? 'text-red-500 font-bold' : 'text-slate-400'}>
                            End: {new Date(rule.endDate).toLocaleDateString()} {isExpired && '(Expired)'}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleStatus(rule._id, rule.status)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              rule.status === 'Active' && !isExpired
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title="Click to toggle rule status"
                          >
                            <Power className="w-3 h-3" />
                            <span>{rule.status === 'Active' && !isExpired ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(rule)}
                              className="p-1 hover:bg-slate-50 text-indigo-600 rounded"
                              title="Edit Promotion"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(rule._id)}
                              className="p-1 hover:bg-slate-50 text-slate-500 rounded"
                              title="Duplicate Offer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleArchive(rule._id)}
                              className="p-1 hover:bg-amber-50 text-amber-600 rounded"
                              title="Archive (Soft Delete)"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {rules.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-12 text-center text-slate-400 font-bold">
                        No active discount rules configured yet. Create a rule to enable automatic checkout benefits!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-600 font-semibold">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-100 shadow-xl overflow-y-auto max-h-[85vh]">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Configure New Promotion Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Offer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Festival flat Sarees ₹500 OFF"
                    value={offerName}
                    onChange={(e) => setOfferName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Offer Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Applicable only on selected brands"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Offer Type</label>
                <select
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800"
                >
                  <option value="Automatic">Bill Level Automatic (Subtotal)</option>
                  <option value="Product">Product Discount</option>
                  <option value="Category">Category Discount</option>
                  <option value="Brand">Brand Discount</option>
                  <option value="BuyXGetY">Buy X Get Y (BOGO)</option>
                  <option value="LoyaltyRule">Loyalty Point Redemption Rule</option>
                </select>
              </div>

              {/* Conditional parameters based on type */}
              {offerType === 'Product' && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Applicable Product ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter database Product ID..."
                    value={targetProduct}
                    onChange={(e) => setTargetProduct(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              )}

              {offerType === 'Category' && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Applicable Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shirts, Sarees..."
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              )}

              {offerType === 'Brand' && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Applicable Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Levi's, Zara..."
                    value={targetBrand}
                    onChange={(e) => setTargetBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-500"
                  />
                </div>
              )}

              {offerType === 'BuyXGetY' && (
                <div className="space-y-3 bg-indigo-50/20 p-3 rounded-xl border border-indigo-50">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Buy Product ID *</label>
                      <input
                        type="text"
                        required
                        value={buyProductId}
                        onChange={(e) => setBuyProductId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Buy Qty *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={buyQuantity}
                        onChange={(e) => setBuyQuantity(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Get Product ID *</label>
                      <input
                        type="text"
                        required
                        value={getProductId}
                        onChange={(e) => setGetProductId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Free Qty *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={getQuantity}
                        onChange={(e) => setGetQuantity(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Discount % *</label>
                      <input
                        type="number"
                        max={100}
                        required
                        value={getDiscountPercent}
                        onChange={(e) => setGetDiscountPercent(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {offerType === 'LoyaltyRule' && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Required Loyalty Points *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={requiredLoyaltyPoints}
                    onChange={(e) => setRequiredLoyaltyPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">Minimum Bill Subtotal (₹)</label>
                  <input
                    type="number"
                    value={minBillAmount}
                    onChange={(e) => setMinBillAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Value Type</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Max Discount Limit</label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
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
    </div>
  );
};

export default DiscountManagementView;

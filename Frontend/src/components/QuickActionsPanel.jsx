import api from '../api/axios';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Scissors,
  Receipt,
  Scan,
  Search,
  ScanLine,
  Printer,
  MessageCircle,
  X,
  Loader2,
  UserCheck,
  Calendar,
  CheckCircle2,
  ArrowRight,
  User
} from 'lucide-react';

export const QuickActionsPanel = ({ onNavigate, openArticulationWithDefaults, employees = [] }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Suggestion states for search/scan actions
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Alteration specific states for Assign Tailor & Change Delivery Date
  const [alterationsList, setAlterationsList] = useState([]);
  const [loadingAlts, setLoadingAlts] = useState(false);
  const [selectedAlt, setSelectedAlt] = useState(null);
  const [newTailor, setNewTailor] = useState('');
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  const [newPriority, setNewPriority] = useState('Normal');
  const [actionReason, setActionReason] = useState('');

  const tailorOptions = useMemo(() => {
    if (employees && employees.length > 0) {
      const dbTailors = employees.filter(
        e => (e.designation || e.role || '').toLowerCase() === 'tailor' || (e.role || '').toLowerCase() === 'tailor'
      );
      if (dbTailors.length > 0) return dbTailors.map(t => t.name);
    }
    return [

    ];
  }, [employees]);

  // Fetch recent alterations when Assign Tailor or Change Delivery Date is opened
  useEffect(() => {
    if (activeModal === 'assign_tailor' || activeModal === 'change_delivery_date') {
      setLoadingAlts(true);
      api
        .get('/alterations')
        .then(res => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setAlterationsList(res.data.data);
            if (res.data.data.length > 0 && !selectedAlt) {
              const first = res.data.data[0];
              setSelectedAlt(first);
              setNewTailor(first.tailorName || tailorOptions[0] || '');
              const d = first.deliveryDate || (first.expectedDeliveryDate ? new Date(first.expectedDeliveryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
              setNewDeliveryDate(d);
              setNewPriority(first.priority || 'Normal');
            }
          }
        })
        .catch(err => {
          console.error('Failed to load alterations for quick action:', err);
        })
        .finally(() => {
          setLoadingAlts(false);
        });
    }
  }, [activeModal]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!inputValue || inputValue.length < 2) {
        setSuggestions([]);
        return;
      }

      if (!['search_customer', 'search_bill', 'scan_bill', 'scan_item', 'search_barcode'].includes(activeModal)) {
        return;
      }

      setIsSearching(true);
      try {
        let res;
        if (activeModal === 'search_customer') {
          res = await api.get(`/customers?search=${inputValue}`);
        } else if (activeModal === 'search_bill' || activeModal === 'scan_bill') {
          res = await api.get(`/billing?search=${inputValue}`);
        } else if (activeModal === 'scan_item' || activeModal === 'search_barcode') {
          res = await api.get(`/products?search=${inputValue}`);
        }

        if (res) {
          const data = res.data;
          if (data.success) {
            setSuggestions(data.data || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch suggestions', err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, activeModal]);

  const actions = [
    { id: 'alteration', label: 'New Alteration', icon: Scissors, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { id: 'assign_tailor', label: 'Assign Tailor', icon: UserCheck, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { id: 'change_delivery_date', label: 'Change Delivery Date', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { id: 'scan_bill', label: 'Scan Bill', icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { id: 'scan_item', label: 'Scan Item', icon: Scan, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { id: 'search_customer', label: 'Search Customer', icon: Search, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
    { id: 'search_bill', label: 'Search Bill', icon: Search, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
    { id: 'search_barcode', label: 'Search Barcode', icon: ScanLine, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { id: 'print_tag', label: 'Print Tag', icon: Printer, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
    { id: 'whatsapp', label: 'Send WhatsApp', icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
  ];

  const handleOpenModal = (actionId) => {
    if (actionId === 'alteration' && openArticulationWithDefaults) {
      openArticulationWithDefaults({ tab: 'dashboard', startAlteration: true });
      return;
    }
    setActiveModal(actionId);
    setInputValue('');
    setResult(null);
    setError('');
    setSuggestions([]);
    setSelectedAlt(null);
    setActionReason('');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedAlt(null);
    setResult(null);
    setError('');
  };

  const handleSelectAlterationTicket = (alt) => {
    setSelectedAlt(alt);
    setNewTailor(alt.tailorName || tailorOptions[0] || '');
    const d = alt.deliveryDate || (alt.expectedDeliveryDate ? new Date(alt.expectedDeliveryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setNewDeliveryDate(d);
    setNewPriority(alt.priority || 'Normal');
    setInputValue(alt.alterationId || alt.alterationNo || alt.invoiceNumber || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      let res;
      if (activeModal === 'assign_tailor') {
        if (!selectedAlt) {
          throw new Error('Please select an alteration ticket first.');
        }
        if (!newTailor) {
          throw new Error('Please select a master tailor.');
        }

        if (selectedAlt.pssmItemId) {
          try {
            await api.patch(`/pssm/items/${selectedAlt.pssmItemId}/assign`, {
              tailorName: newTailor,
              reason: actionReason || `Tailor assigned to ${newTailor}`
            });
          } catch (pErr) {
            console.warn('PSSM assign sync warning:', pErr);
          }
        }

        res = await api.patch(`/alterations/${selectedAlt._id}/status`, {
          tailorName: newTailor,
          reason: actionReason || `Tailor assigned to ${newTailor}`
        });

        const data = res.data;
        if (data.success) {
          setResult({
            success: true,
            action: 'Tailor Assigned',
            ticketId: selectedAlt.alterationId || selectedAlt.alterationNo,
            customerName: selectedAlt.customerName,
            garment: selectedAlt.productName,
            assignedTailor: newTailor,
            reason: actionReason || 'Workload assignment',
            auditLogged: true
          });
        } else {
          setError(data.message || 'Failed to assign tailor');
        }
        return;
      }

      if (activeModal === 'change_delivery_date') {
        if (!selectedAlt) {
          throw new Error('Please select an alteration ticket first.');
        }
        if (!newDeliveryDate) {
          throw new Error('Please choose a delivery date.');
        }

        res = await api.patch(`/alterations/${selectedAlt._id}/status`, {
          deliveryDate: newDeliveryDate,
          expectedDeliveryDate: newDeliveryDate,
          priority: newPriority,
          reason: actionReason || `Delivery date changed to ${newDeliveryDate}`
        });

        const data = res.data;
        if (data.success) {
          setResult({
            success: true,
            action: 'Delivery Date Updated',
            ticketId: selectedAlt.alterationId || selectedAlt.alterationNo,
            customerName: selectedAlt.customerName,
            garment: selectedAlt.productName,
            deliveryDate: newDeliveryDate,
            priority: newPriority,
            reason: actionReason || 'Delivery rescheduled',
            auditLogged: true
          });
        } else {
          setError(data.message || 'Failed to update delivery date');
        }
        return;
      }

      switch (activeModal) {
        case 'scan_bill':
        case 'search_bill':
          res = await api.get(`/billing?search=${inputValue}`);
          break;
        case 'scan_item':
        case 'search_barcode':
        case 'print_tag':
          res = await api.get(`/products/scan/${inputValue}`);
          break;
        case 'search_customer':
          res = await api.get(`/customers?search=${inputValue}`);
          break;
        case 'whatsapp':
          res = await api.post(`/billing/${inputValue}/send-whatsapp`);
          break;
        case 'alteration':
          res = await api.post(`/tickets`, { subject: 'Alteration Request', description: inputValue, priority: 'High', status: 'Open' });
          break;
        default:
          throw new Error('Unknown action');
      }

      const data = res.data;
      if (data.success) {
        setResult(data.data || data);
      } else {
        setError(data.message || 'Action failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const renderModalContent = () => {
    const action = actions.find(a => a.id === activeModal);
    if (!action) return null;

    const isAssignTailor = activeModal === 'assign_tailor';
    const isChangeDelivery = activeModal === 'change_delivery_date';
    const isAlterationAction = isAssignTailor || isChangeDelivery;

    // Filter alterations for search input in alteration modal
    const filteredAlterations = isAlterationAction && inputValue.trim().length > 0
      ? alterationsList.filter(a => {
        const q = inputValue.toLowerCase();
        return (
          (a.alterationId && a.alterationId.toLowerCase().includes(q)) ||
          (a.alterationNo && a.alterationNo.toLowerCase().includes(q)) ||
          (a.invoiceNumber && a.invoiceNumber.toLowerCase().includes(q)) ||
          (a.customerName && a.customerName.toLowerCase().includes(q)) ||
          (a.customerPhone && a.customerPhone.includes(q)) ||
          (a.productName && a.productName.toLowerCase().includes(q))
        );
      })
      : alterationsList;

    let inputLabel = "Enter Value";
    let inputType = "text";

    if (activeModal === 'scan_bill' || activeModal === 'search_bill') inputLabel = "Enter Invoice Number / Customer Phone";
    else if (activeModal === 'scan_item' || activeModal === 'search_barcode' || activeModal === 'print_tag') inputLabel = "Enter SKU or Barcode";
    else if (activeModal === 'search_customer') inputLabel = "Enter Customer Name or Phone";
    else if (activeModal === 'whatsapp') inputLabel = "Enter Invoice ID (_id)";
    else if (activeModal === 'alteration') inputLabel = "Describe Alteration Details";

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
        <div className={`bg-white rounded-2xl shadow-2xl w-full ${isAlterationAction ? 'max-w-xl' : 'max-w-md'} overflow-hidden animate-scale-up`}>
          <div className={`p-4 ${action.bg} ${action.border} border-b flex justify-between items-center`}>
            <div className="flex items-center gap-2">
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <h3 className={`font-bold ${action.color}`}>{action.label}</h3>
            </div>
            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* SUCCESS VIEW */}
            {result && isAlterationAction ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-900">{result.action} Successfully!</h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Ticket <strong>{result.ticketId}</strong> for <strong>{result.customerName}</strong> ({result.garment}).
                    </p>
                    {isAssignTailor && (
                      <p className="text-xs text-emerald-800 font-bold mt-1">
                        Assigned Master Tailor: <span className="underline">{result.assignedTailor}</span>
                      </p>
                    )}
                    {isChangeDelivery && (
                      <p className="text-xs text-emerald-800 font-bold mt-1">
                        New Delivery Date: <span className="font-mono">{result.deliveryDate}</span> (Priority: {result.priority})
                      </p>
                    )}
                    <div className="mt-2 text-[10px] text-amber-700 font-semibold bg-white/70 px-2 py-1 rounded-md inline-block border border-amber-200">
                      ✓ Audit Trail logged with User Name, Date, Time & Reason: "{result.reason}"
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                  {openArticulationWithDefaults && (
                    <button
                      type="button"
                      onClick={() => {
                        closeModal();
                        openArticulationWithDefaults({ tab: 'dashboard' });
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View in Tailoring Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : isAlterationAction ? (
              /* ALTERATION ACTION FORM (ASSIGN TAILOR / CHANGE DELIVERY DATE) */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Quick Select Ticket Search */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Select Alteration Ticket / Garment
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      placeholder="Search Ticket #, Invoice #, or Customer..."
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none pr-8"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
                  </div>

                  {/* Quick Select Ticket Pill List */}
                  <div className="mt-2 max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-xl p-1 bg-slate-50/50">
                    {loadingAlts ? (
                      <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        <span>Loading active alteration tickets...</span>
                      </div>
                    ) : filteredAlterations.length === 0 ? (
                      <div className="p-2 text-center text-xs text-slate-400">
                        No alteration tickets found.
                      </div>
                    ) : (
                      filteredAlterations.slice(0, 5).map((alt) => {
                        const isSelected = selectedAlt?._id === alt._id;
                        return (
                          <div
                            key={alt._id}
                            onClick={() => handleSelectAlterationTicket(alt)}
                            className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all border ${isSelected
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-2xs'
                                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                              }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-black text-indigo-700">{alt.alterationId || alt.alterationNo || 'Ticket'}</span>
                                <span>•</span>
                                <span className="font-bold text-slate-800">{alt.customerName}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {alt.productName} | Tailor: <strong className="text-slate-600">{alt.tailorName || 'Unassigned'}</strong>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono text-[10px] block text-slate-600 font-bold">{alt.deliveryDate || 'No Date'}</span>
                              <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {alt.priority || 'Normal'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Selected Item Details */}
                {selectedAlt && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">Selected Ticket:</span>
                      <strong className="font-mono text-indigo-700">{selectedAlt.alterationId || selectedAlt.alterationNo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">Customer:</span>
                      <strong className="text-slate-800">{selectedAlt.customerName} ({selectedAlt.customerPhone || 'N/A'})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">Current Tailor:</span>
                      <strong className="text-violet-700">{selectedAlt.tailorName || 'Unassigned'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">Current Delivery:</span>
                      <strong className="font-mono text-amber-700">{selectedAlt.deliveryDate || 'Not Set'} ({selectedAlt.priority || 'Normal'})</strong>
                    </div>
                  </div>
                )}

                {/* Specific Fields for Assign Tailor */}
                {isAssignTailor && (
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                      Assign Master Tailor
                    </label>
                    <select
                      value={newTailor}
                      onChange={e => setNewTailor(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                      required
                    >
                      <option value="">-- Choose Master Tailor --</option>
                      {tailorOptions.map((name, i) => (
                        <option key={i} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Specific Fields for Change Delivery Date */}
                {isChangeDelivery && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                        New Delivery Date
                      </label>
                      <input
                        type="date"
                        value={newDeliveryDate}
                        onChange={e => setNewDeliveryDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        required
                      />
                      {/* Date Presets */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {[
                          { label: 'Today', days: 0 },
                          { label: 'Tomorrow', days: 1 },
                          { label: '+3 Days', days: 3 },
                          { label: '+7 Days', days: 7 }
                        ].map(p => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + p.days);
                              setNewDeliveryDate(d.toISOString().split('T')[0]);
                            }}
                            className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                        Priority Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Normal', 'Urgent', 'Express'].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setNewPriority(p)}
                            className={`py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${newPriority === p
                                ? p === 'Express'
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : p === 'Urgent'
                                    ? 'bg-amber-500 text-white border-amber-500'
                                    : 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Trail Reason Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      Reason for Change
                    </label>
                    <span className="text-[10px] text-amber-600 font-bold">Audit Trail Log</span>
                  </div>
                  <input
                    type="text"
                    value={actionReason}
                    onChange={e => setActionReason(e.target.value)}
                    placeholder="Enter reason for audit record..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(isAssignTailor
                      ? ['Workload balancing', 'Tailor absent / leave', 'Urgent priority handover']
                      : ['Customer requested earlier', 'Fabric delayed', 'Customer postponed']
                    ).map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setActionReason(chip)}
                        className="text-[10px] bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-800 px-2 py-0.5 rounded font-medium transition-colors cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedAlt}
                  className={`w-full text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${isAssignTailor
                      ? 'bg-violet-600 hover:bg-violet-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : action.label}
                </button>
              </form>
            ) : (
              /* REGULAR SCAN / SEARCH FORM */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{inputLabel}</label>
                  {activeModal === 'alteration' ? (
                    <textarea
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      rows="3"
                      required
                    />
                  ) : (
                    <input
                      type={inputType}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      required
                      autoFocus
                      autoComplete="off"
                    />
                  )}

                  {suggestions.length > 0 && !result && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                      {suggestions.map((item, idx) => (
                        <div
                          key={item._id || idx}
                          onClick={() => {
                            if (activeModal === 'search_customer') {
                              setInputValue(item.phone || item.name);
                            } else if (activeModal === 'search_bill' || activeModal === 'scan_bill') {
                              setInputValue(item.invoiceNo || item.billNo);
                            } else if (activeModal === 'scan_item' || activeModal === 'search_barcode') {
                              setInputValue(item.barcode || item.sku);
                            }
                            setSuggestions([]);
                          }}
                          className="p-3 border-b border-slate-50 last:border-0 hover:bg-indigo-50 cursor-pointer transition-colors"
                        >
                          {activeModal === 'search_customer' && (
                            <div className="text-sm font-medium text-slate-700">{item.name} <span className="text-slate-400 text-xs ml-2">{item.phone}</span></div>
                          )}
                          {(activeModal === 'search_bill' || activeModal === 'scan_bill') && (
                            <div className="text-sm font-medium text-slate-700">{item.invoiceNo || item.billNo} <span className="text-slate-400 text-xs ml-2">{item.customerName}</span></div>
                          )}
                          {(activeModal === 'scan_item' || activeModal === 'search_barcode') && (
                            <div className="text-sm font-medium text-slate-700">{item.name} <span className="text-slate-400 text-xs ml-2">{item.barcode || item.sku}</span></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !inputValue}
                  className={`w-full text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-slate-800'}`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : action.label}
                </button>
              </form>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">
                {error}
              </div>
            )}

            {result && !isAlterationAction && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl max-h-60 overflow-y-auto">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Success Result</h4>
                <pre className="text-[10px] text-slate-700 whitespace-pre-wrap font-mono">
                  {JSON.stringify(result, null, 2)}
                </pre>
                {activeModal === 'print_tag' && (
                  <button
                    onClick={() => window.print()}
                    className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-sm transition-all cursor-pointer"
                  >
                    Print Tag Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden mb-6">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
          <h3 className="font-bold text-slate-800 text-lg">Quick Actions</h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fast Access</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {actions.map((action) => (
            <div
              key={action.id}
              onClick={() => handleOpenModal(action.id)}
              className={`flex flex-col items-center justify-center text-center gap-2.5 p-5 rounded-2xl border ${action.border} ${action.bg} cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group`}
            >
              <action.icon strokeWidth={2.2} className={`w-7 h-7 ${action.color} group-hover:scale-110 transition-transform duration-300`} />
              <span className={`font-bold text-xs ${action.color}`}>{action.label}</span>
            </div>
          ))}
        </div>
      </div>
      {activeModal && renderModalContent()}
    </div>
  );
};

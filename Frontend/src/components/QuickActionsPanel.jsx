import api from '../api/axios';
import React, { useState, useEffect } from 'react';
import { Scissors, Receipt, Scan, Search, ScanLine, Printer, MessageCircle, X, Loader2 } from 'lucide-react';

export const QuickActionsPanel = ({ onNavigate, openArticulationWithDefaults }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Suggestion states
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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
      openArticulationWithDefaults({ tab: "dashboard", startAlteration: true });
      return;
    }
    setActiveModal(actionId);
    setInputValue('');
    setResult(null);
    setError('');
    setSuggestions([]);
  };

  const closeModal = () => {
    setActiveModal(null);
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderModalContent = () => {
    const action = actions.find(a => a.id === activeModal);
    if (!action) return null;

    let inputLabel = "Enter Value";
    let inputType = "text";
    
    if (activeModal === 'scan_bill' || activeModal === 'search_bill') inputLabel = "Enter Invoice Number / Customer Phone";
    else if (activeModal === 'scan_item' || activeModal === 'search_barcode' || activeModal === 'print_tag') inputLabel = "Enter SKU or Barcode";
    else if (activeModal === 'search_customer') inputLabel = "Enter Customer Name or Phone";
    else if (activeModal === 'whatsapp') inputLabel = "Enter Invoice ID (_id)";
    else if (activeModal === 'alteration') inputLabel = "Describe Alteration Details";

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
          <div className={`p-4 ${action.bg} ${action.border} border-b flex justify-between items-center`}>
            <div className="flex items-center gap-2">
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <h3 className={`font-bold ${action.color}`}>{action.label}</h3>
            </div>
            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
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

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl max-h-60 overflow-y-auto">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Success Result</h4>
                <pre className="text-[10px] text-slate-700 whitespace-pre-wrap font-mono">
                  {JSON.stringify(result, null, 2)}
                </pre>
                {activeModal === 'print_tag' && (
                  <button 
                    onClick={() => window.print()}
                    className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-sm transition-all"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <div 
              key={action.id}
              onClick={() => handleOpenModal(action.id)}
              className={`flex flex-col items-center justify-center text-center gap-3 p-6 rounded-2xl border ${action.border} ${action.bg} cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group`}
            >
              <action.icon strokeWidth={2.5} className={`w-8 h-8 ${action.color} group-hover:scale-110 transition-transform duration-300`} />
              <span className={`font-bold text-sm ${action.color}`}>{action.label}</span>
            </div>
          ))}
        </div>
      </div>
      {activeModal && renderModalContent()}
    </div>
  );
};

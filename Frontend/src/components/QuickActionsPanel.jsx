import React, { useState, useEffect } from 'react';
import { 
  Scissors, Search, ScanLine, Users, FileText, Printer, 
  MessageCircle, UserPlus, Calendar, List, X, AlertCircle, CheckCircle2
} from 'lucide-react';

export const QuickActionsPanel = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [selectedTailor, setSelectedTailor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [alterationData, setAlterationData] = useState({ phone: '', garment: '', issue: '' });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (activeModal === 'assignTailor' && employees.length === 0) {
      fetch('http://localhost:5000/api/staff', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setEmployees(data.data.filter(e => e.role.toLowerCase().includes('tailor'))))
      .catch(console.error);
    }
  }, [activeModal]);

  const closeModal = () => {
    setActiveModal(null);
    setInputValue('');
    setResults(null);
    setError(null);
    setSuccess(null);
    setAlterationData({ phone: '', garment: '', issue: '' });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setSuccess(null);

    try {
      let url = '';
      if (activeModal === 'scanBill' || activeModal === 'searchBill') {
        if (activeModal === 'scanBill') url = `http://localhost:5000/api/invoices/scan/${inputValue}`;
        else url = `http://localhost:5000/api/invoices?search=${inputValue}`;
      } else if (activeModal === 'scanItem' || activeModal === 'searchBarcode' || activeModal === 'printTag') {
        url = `http://localhost:5000/api/products/scan/${inputValue}`;
      } else if (activeModal === 'searchCustomer') {
        url = `http://localhost:5000/api/customers?search=${inputValue}`;
      } else if (activeModal === 'pendingList') {
        url = `http://localhost:5000/api/invoices?fulfillmentStatus=Pending`;
      }

      if (!url) return;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Not found');
      }

      setResults(data.data || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let url = '';
      let method = 'POST';
      let body = {};

      if (activeModal === 'sendWhatsapp') {
        url = `http://localhost:5000/api/invoices/${inputValue}/send-whatsapp`;
      } else if (activeModal === 'assignTailor') {
        url = `http://localhost:5000/api/invoices/${inputValue}/assign-tailor`;
        method = 'PUT';
        body = { tailorId: selectedTailor };
      } else if (activeModal === 'changeDeliveryDate') {
        url = `http://localhost:5000/api/invoices/${inputValue}/delivery-date`;
        method = 'PUT';
        body = { expectedDeliveryDate: selectedDate };
      } else if (activeModal === 'newAlteration') {
        url = `http://localhost:5000/api/tickets`;
        body = {
          subject: `Alteration: ${alterationData.garment}`,
          description: `Customer Phone: ${alterationData.phone}\nIssue: ${alterationData.issue}`,
          priority: 'High'
        };
      }

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Action failed');
      
      setSuccess('Action completed successfully!');
      setTimeout(closeModal, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === 'pendingList') {
      handleSearch({ preventDefault: () => {} });
    }
  }, [activeModal]);

  const quickActions = [
    { id: 'newAlteration', label: 'New Alteration', icon: Scissors, color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 'scanBill', label: 'Scan Bill', icon: ScanLine, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'scanItem', label: 'Scan Item', icon: ScanLine, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { id: 'searchCustomer', label: 'Search Customer', icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
    { id: 'searchBill', label: 'Search Bill', icon: FileText, color: 'text-sky-600', bg: 'bg-sky-100' },
    { id: 'searchBarcode', label: 'Search Barcode', icon: ScanLine, color: 'text-teal-600', bg: 'bg-teal-100' },
    { id: 'printTag', label: 'Print Tag', icon: Printer, color: 'text-slate-600', bg: 'bg-slate-100' },
    { id: 'sendWhatsapp', label: 'Send WhatsApp', icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { id: 'assignTailor', label: 'Assign Tailor', icon: UserPlus, color: 'text-pink-600', bg: 'bg-pink-100' },
    { id: 'changeDeliveryDate', label: 'Change Delivery', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-100' },
    { id: 'pendingList', label: 'Pending List', icon: List, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="mb-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
          <ScanLine className="w-5 h-5 text-indigo-500" />
          Quick Actions Menu
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <div 
                key={action.id}
                onClick={() => setActiveModal(action.id)}
                className={`flex flex-col items-center justify-center text-center gap-1.5 p-2 rounded-xl border border-slate-100 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all group bg-slate-50`}
              >
                <div className={`p-1.5 rounded-lg ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-bold text-slate-700 leading-tight">
                  {action.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {quickActions.find(a => a.id === activeModal)?.icon && React.createElement(quickActions.find(a => a.id === activeModal).icon, { className: "w-5 h-5 text-indigo-600" })}
                {quickActions.find(a => a.id === activeModal)?.label}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  {success}
                </div>
              )}

              {['scanBill', 'searchBill', 'scanItem', 'searchBarcode', 'searchCustomer', 'printTag'].includes(activeModal) && (
                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                      Enter Search Query
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        placeholder="ID, Name, Phone, or Barcode..."
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        autoFocus
                      />
                      <button 
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
                      >
                        {loading ? '...' : <Search className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {results && (
                    <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-3 py-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-600 uppercase">Search Results</span>
                      </div>
                      <div className="p-3 text-sm">
                        {Array.isArray(results) ? (
                          results.length === 0 ? <p className="text-slate-500 text-center py-4">No results found.</p> :
                          <ul className="space-y-2">
                            {results.map((r, i) => (
                              <li key={i} className="p-2 bg-slate-50 rounded border border-slate-100">
                                <div className="font-bold">{r.name || r.customerName || r.invoiceNo}</div>
                                <div className="text-xs text-slate-500">{r.phone || r.sku || r.date || r._id}</div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="space-y-1">
                            {Object.entries(results).map(([k, v]) => {
                              if (typeof v !== 'object') {
                                return <div key={k} className="flex justify-between border-b border-slate-50 py-1"><span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span> <span className="font-semibold text-slate-800 text-right truncate ml-4">{String(v)}</span></div>
                              }
                              return null;
                            })}
                            {activeModal === 'printTag' && (
                              <button type="button" className="mt-4 w-full bg-slate-800 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors cursor-pointer" onClick={() => window.print()}>
                                <Printer className="w-4 h-4" /> Print Barcode Tag
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </form>
              )}

              {['sendWhatsapp', 'assignTailor', 'changeDeliveryDate'].includes(activeModal) && (
                <form onSubmit={handleAction} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                      Invoice Object ID
                    </label>
                    <input 
                      type="text" 
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      placeholder="Paste Invoice MongoDB _id..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      required
                    />
                  </div>
                  
                  {activeModal === 'assignTailor' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                        Select Tailor
                      </label>
                      <select 
                        value={selectedTailor}
                        onChange={e => setSelectedTailor(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        required
                      >
                        <option value="">-- Choose a Tailor --</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp._id}>{emp.name} (Load: {emp.currentWorkload || 0})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {activeModal === 'changeDeliveryDate' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                        New Delivery Date
                      </label>
                      <input 
                        type="date" 
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        required
                      />
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Processing...' : 'Execute Action'}
                  </button>
                </form>
              )}

              {activeModal === 'newAlteration' && (
                <form onSubmit={handleAction} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Customer Phone</label>
                    <input 
                      type="text" 
                      value={alterationData.phone}
                      onChange={e => setAlterationData({...alterationData, phone: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Garment Description</label>
                    <input 
                      type="text" 
                      value={alterationData.garment}
                      onChange={e => setAlterationData({...alterationData, garment: e.target.value})}
                      placeholder="e.g. Blue Denim Shirt"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Issue / Work Required</label>
                    <textarea 
                      value={alterationData.issue}
                      onChange={e => setAlterationData({...alterationData, issue: e.target.value})}
                      rows="3"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      required
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Creating...' : 'Register Alteration'}
                  </button>
                </form>
              )}

              {activeModal === 'pendingList' && (
                <div>
                  {loading ? <p className="text-center py-4 text-slate-500 text-sm">Loading pending items...</p> : 
                  (results && results.length > 0) ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="p-2 rounded-l-lg font-semibold">Invoice No</th>
                            <th className="p-2 font-semibold">Customer</th>
                            <th className="p-2 font-semibold">Due Date</th>
                            <th className="p-2 rounded-r-lg font-semibold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {results.map(inv => (
                            <tr key={inv._id} className="hover:bg-slate-50">
                              <td className="p-2 font-medium text-indigo-600">{inv.invoiceNo}</td>
                              <td className="p-2">{inv.customerName}</td>
                              <td className="p-2">{inv.expectedDeliveryDate ? new Date(inv.expectedDeliveryDate).toLocaleDateString() : 'N/A'}</td>
                              <td className="p-2 text-right">
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold uppercase">{inv.fulfillmentStatus}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-center py-4 text-slate-500 text-sm">No pending items found!</p>}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

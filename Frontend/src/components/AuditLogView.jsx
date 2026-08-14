import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Monitor, 
  FileText,
  Activity,
  X,
  Eye
} from "lucide-react";

export const AuditLogView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [error, setError] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [loadingPurchase, setLoadingPurchase] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit');
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setError("Failed to load audit logs. Only administrators can access this information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPurchaseId) {
      setPurchaseDetails(null);
      return;
    }
    const fetchPurchase = async () => {
      setLoadingPurchase(true);
      try {
        const res = await api.get(`/purchase/${selectedPurchaseId}`);
        if (res.data?.success) {
          setPurchaseDetails(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch purchase details", err);
      } finally {
        setLoadingPurchase(false);
      }
    };
    fetchPurchase();
  }, [selectedPurchaseId]);

  useEffect(() => {
    if (!selectedProductId) {
      setProductDetails(null);
      return;
    }
    const fetchProduct = async () => {
      setLoadingProduct(true);
      try {
        const res = await api.get(`/products/${selectedProductId}`);
        if (res.data?.success) {
          setProductDetails(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch product details", err);
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProduct();
  }, [selectedProductId]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.userName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (log.item?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAction === "all" || log.action === filterAction;
    
    return matchesSearch && matchesFilter;
  });

  const uniqueActions = [...new Set(logs.map(log => log.action).filter(Boolean))];

  const getDisplayItem = (log) => {
    // 1. Strict displayName provided by new frontend trackers
    if (log.displayName) return log.displayName;

    // 2. Legacy fallback overrides
    if (log.item && log.item !== 'purchase' && log.item !== 'Purchase Module') return log.item;
    if (log.details?.params?.id) {
      const actionName = log.action || '';
      if (actionName.includes('PURCHASE')) return `Purchase Bill (ID: ${log.details.params.id})`;
      return `${log.module} (ID: ${log.details.params.id})`;
    }
    
    // Clarify backend-generated generic list view actions
    if (log.action === 'PURCHASE_VIEW') return 'Purchase Module / Master List';
    
    return log.module;
  };

  const getEntityId = (log) => {
    // Rely on strict entityId and entityType
    if (log.entityId && (log.entityType === 'PT_FILE' || log.entityType === 'PURCHASE' || log.entityType === 'POS_ITEM')) {
      return log.entityId;
    }
    
    // Legacy fallback for purchases
    if (log.details?.purchaseId) return log.details.purchaseId;
    if (log.details?.params?.id && (log.action?.includes('PURCHASE') || log.module === 'purchase')) {
      return log.details.params.id;
    }
    return null;
  };

  const handleItemClick = (log) => {
    const id = getEntityId(log);
    if (!id) return;
    
    if (log.entityType === 'POS_ITEM') {
      setSelectedProductId(id);
    } else {
      // Default to purchase for legacy or PT_FILE/PURCHASE
      setSelectedPurchaseId(id);
    }
  };

  if (error) {
    return (
      <div className="flex-1 p-8 bg-slate-50/50 flex flex-col items-center justify-center">
        <ShieldCheck className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50 h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Audit Log</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Track confidential system access and user activities
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-8 pb-4 shrink-0">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search user or item..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <select 
                className="pl-10 pr-8 py-2 border border-slate-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all appearance-none bg-white font-medium text-slate-600"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="all">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 p-8 pt-0 min-h-0">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[20%]">User Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[15%]">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[10%]">Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[20%]">Item</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[20%]">Action</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[15%]">Device/System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="font-medium">Loading audit records...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <ShieldCheck className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="font-medium text-slate-600 text-lg">No audit records found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="font-semibold text-slate-800">{log.userName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                          {log.date || new Date(log.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {log.time || new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          {getEntityId(log) ? (
                            <button 
                              onClick={() => handleItemClick(log)}
                              className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 text-left"
                            >
                              {getDisplayItem(log)}
                              <Eye className="w-3 h-3 flex-shrink-0" />
                            </button>
                          ) : (
                            <span className="font-medium text-slate-700">{getDisplayItem(log)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-slate-400" />
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span 
                            className={`text-sm text-slate-600 cursor-pointer transition-all ${expandedRowId === log._id ? 'break-all whitespace-normal' : 'truncate max-w-[150px]'}`} 
                            onClick={() => setExpandedRowId(expandedRowId === log._id ? null : log._id)}
                            title="Click to view full device info"
                          >
                            {log.deviceInfo || log.userAgent || 'Unknown'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Purchase Modal */}
      {selectedPurchaseId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Purchase Details</h2>
              <button 
                onClick={() => setSelectedPurchaseId(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-50">
              {loadingPurchase ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p className="font-medium">Loading details...</p>
                </div>
              ) : purchaseDetails ? (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Bill No</p>
                      <p className="font-semibold text-slate-800">{purchaseDetails.billNo}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Vendor</p>
                      <p className="font-semibold text-slate-800">{purchaseDetails.vendor?.name || purchaseDetails.vendorName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Date</p>
                      <p className="font-semibold text-slate-800">{new Date(purchaseDetails.billDate).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Total Amount</p>
                      <p className="font-semibold text-slate-800">₹{purchaseDetails.totalAmount || purchaseDetails.netAmount || 0}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">Item Name</th>
                          <th className="px-4 py-3">Design/Code</th>
                          <th className="px-4 py-3 text-right">Qty</th>
                          <th className="px-4 py-3 text-right">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {purchaseDetails.items && purchaseDetails.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-medium text-slate-700">{item.itemName || item.product?.name}</td>
                            <td className="px-4 py-3 text-slate-500">{item.designNo || item.itemCode}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-slate-500">₹{item.rate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p>Could not load purchase details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProductId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Item Details</h2>
              <button 
                onClick={() => setSelectedProductId(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-50">
              {loadingProduct ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p className="font-medium">Loading details...</p>
                </div>
              ) : productDetails ? (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-slate-400 uppercase">Item Name</p>
                      <p className="font-bold text-lg text-slate-800">{productDetails.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Item Code</p>
                      <p className="font-semibold text-slate-800">{productDetails.itemCode}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Design No</p>
                      <p className="font-semibold text-slate-800">{productDetails.designNo || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Category</p>
                      <p className="font-semibold text-slate-800">{productDetails.category || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Current Stock</p>
                      <p className="font-semibold text-emerald-600 font-mono">{productDetails.stock || productDetails.availableStock || 0} PCS</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Purchase Price</p>
                      <p className="font-semibold text-red-600 font-mono">₹{productDetails.purchasePrice || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Selling Price</p>
                      <p className="font-semibold text-indigo-600 font-mono">₹{productDetails.sellingPrice || productDetails.mrp || 0}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p>Could not load item details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogView;

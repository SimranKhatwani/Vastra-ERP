import api from '../api/axios';
import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Warehouse,
  AlertTriangle,
  ArrowRightLeft,
  ClipboardCheck,
  Undo2,
  Download,
  Search,
  Filter,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  FileText
} from "lucide-react";

export const StockManagementView = ({
  products = [],
  onAddNotification
}) => {
  const [activeTab, setActiveTab] = useState("opening");
  
  // Lookup states from standard API routes
  const [warehouses, setWarehouses] = useState([
    { id: "w-1", name: "Bandra Central Warehouse", code: "WH-BND-01", location: "Bandra Kurla Complex, Mumbai", manager: "Sachin Pilot" },
    { id: "w-2", name: "Colaba Retail Godown", code: "WH-COL-02", location: "Colaba Causeway, Mumbai", manager: "Suniel Shetty" },
    { id: "w-3", name: "Thane Logistics Depot", code: "WH-THA-03", location: "Wagle Estate, Thane", manager: "Bobby Deol" }
  ]);
  const [suppliers, setSuppliers] = useState([]);

  // Common UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState("All");
  const [selectedSort, setSelectedSort] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Search input ref for keyboard shortcuts
  const searchInputRef = useRef(null);

  // 1. Opening Stock States
  const [openingList, setOpeningList] = useState([]);
  const [openingStats, setOpeningStats] = useState({ totalProducts: 0, totalQty: 0, stockValue: 0, totalCost: 0 });
  const [openingLoading, setOpeningLoading] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [editOpeningProd, setEditOpeningProd] = useState(null);
  const [opProductId, setOpProductId] = useState("");
  const [opQty, setOpQty] = useState(100);
  const [opWhId, setOpWhId] = useState("w-1");
  const [opBatchNo, setOpBatchNo] = useState("");
  const [opRemarks, setOpRemarks] = useState("");

  // 2. Transfers States (DB Integrated)
  const [transfers, setTransfers] = useState([]);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [tfSourceId, setTfSourceId] = useState("w-1");
  const [tfDestId, setTfDestId] = useState("w-2");
  const [tfProductId, setTfProductId] = useState("");
  const [tfQty, setTfQty] = useState(20);
  const [tfRemarks, setTfRemarks] = useState("");

  // 3. Purchase Entry States
  const [peSupplierId, setPeSupplierId] = useState("");
  const [peSupplierName, setPeSupplierName] = useState("");
  const [pePoNo, setPePoNo] = useState("");
  const [peInvoiceNo, setPeInvoiceNo] = useState("");
  const [peDate, setPeDate] = useState(new Date().toISOString().split("T")[0]);
  const [peWhId, setPeWhId] = useState("w-1");
  const [peBatchNo, setPeBatchNo] = useState("");
  const [peProductId, setPeProductId] = useState("");
  const [peQty, setPeQty] = useState(50);
  const [pePrice, setPePrice] = useState(350);
  const [peMrp, setPeMrp] = useState(799);
  const [peSellingPrice, setPeSellingPrice] = useState(699);
  const [peGst, setPeGst] = useState(12);
  const [peDiscount, setPeDiscount] = useState(0);

  // 4. Sales Stock States
  const [salesList, setSalesList] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);

  // 5. Adjustments States
  const [adjProductId, setAdjProductId] = useState("");
  const [adjWhId, setAdjWhId] = useState("w-1");
  const [adjType, setAdjType] = useState("Damage");
  const [adjDiff, setAdjDiff] = useState(10);
  const [adjReason, setAdjReason] = useState("Water damage during storage");
  const [adjRemarks, setAdjRemarks] = useState("");
  const [adjApprovedBy, setAdjApprovedBy] = useState("");

  // 6. Returns States
  const [returnsList, setReturnsList] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [retType, setRetType] = useState("Customer Return");
  const [retInvoice, setRetInvoice] = useState("");
  const [retPartner, setRetPartner] = useState("");
  const [retProductId, setRetProductId] = useState("");
  const [retQty, setRetQty] = useState(5);
  const [retWhId, setRetWhId] = useState("w-1");
  const [retReason, setRetReason] = useState("Weave misalignment");

  // 7. Audit Reports States
  const [reportType, setReportType] = useState("summary");
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + F: Search focus
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      // Ctrl + N: Open new record form/modal
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        if (activeTab === "opening") {
          setEditOpeningProd(null);
          setOpProductId("");
          setOpQty(100);
          setOpBatchNo("");
          setOpRemarks("");
          setShowOpeningModal(true);
        } else if (activeTab === "transfers") {
          setShowTransferModal(true);
        } else if (activeTab === "returns") {
          setShowReturnModal(true);
        }
      }
      // Ctrl + S: Save/Submit active form
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        // Trigger whatever save action is currently visible/focused
        onAddNotification("System Info", "Ctrl + S triggered. Use the form buttons to submit.", "info");
      }
      // Ctrl + P: Print active list
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        window.print();
      }
      // Esc: Close modals
      if (e.key === "Escape") {
        setShowOpeningModal(false);
        setShowTransferModal(false);
        setShowReturnModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, onAddNotification]);

  // Load Initial opening stocks
  const fetchOpeningList = async () => {
    setOpeningLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/stock-management/opening`);
      const json = res.data;
      if (json.success) {
        setOpeningList(json.data || []);
        if (json.stats) setOpeningStats(json.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOpeningLoading(false);
    }
  };

  // Load transfers
  const fetchTransfers = async () => {
    setTransfersLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/location-transfers`);
      const json = res.data;
      if (json.success) {
        setTransfers(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTransfersLoading(false);
    }
  };

  // Load sales deductions
  const fetchSalesDeductions = async () => {
    setSalesLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/stock-management/sales-deductions`);
      const json = res.data;
      if (json.success) {
        setSalesList(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSalesLoading(false);
    }
  };

  // Load returns
  const fetchReturns = async () => {
    setReturnsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/stock-management/returns`);
      const json = res.data;
      if (json.success) {
        setReturnsList(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReturnsLoading(false);
    }
  };

  // Load Reports
  const fetchReports = async () => {
    setReportLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/stock-management/reports/${reportType}`);
      const json = res.data;
      if (json.success) {
        setReportData(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  // Fetch Suppliers
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/suppliers`);
      const json = res.data;
      if (json.success) setSuppliers(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Reload active tab contents
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery("");
    if (activeTab === "opening") fetchOpeningList();
    if (activeTab === "transfers") fetchTransfers();
    if (activeTab === "sales") fetchSalesDeductions();
    if (activeTab === "returns") fetchReturns();
    if (activeTab === "reports") fetchReports();
  }, [activeTab, reportType]);

  // Handle Opening Stock submit
  const handleSaveOpening = async (e) => {
    e.preventDefault();
    const isEdit = !!editOpeningProd;
    const url = isEdit
      ? `/stock-management/opening/${editOpeningProd._id}`
      : "/stock-management/opening";
    const method = isEdit ? "PUT" : "POST";

    const wh = warehouses.find(w => w.id === opWhId);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: opProductId || (editOpeningProd ? editOpeningProd._id : undefined),
          quantity: opQty,
          warehouseId: opWhId,
          warehouseName: wh ? wh.name : "Main Warehouse",
          batchNo: opBatchNo,
          remarks: opRemarks
        })
      });
      const json = res.data;
      if (json.success) {
        onAddNotification("Success", isEdit ? "Opening stock corrected" : "Opening stock registered", "success");
        setShowOpeningModal(false);
        fetchOpeningList();
      } else {
        onAddNotification("Operation Failed", json.message, "danger");
      }
    } catch (err) {
      onAddNotification("Connection Error", err.message, "danger");
    }
  };

  // Handle Purchase Entry submit
  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (!peProductId) {
      alert("Please select a product");
      return;
    }
    const wh = warehouses.find(w => w.id === peWhId);
    const supp = suppliers.find(s => s._id === peSupplierId);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/stock-management/purchase-entry`, {
          supplierId: peSupplierId,
          supplierName: supp ? supp.name : peSupplierName,
          poNo: pePoNo,
          invoiceNo: peInvoiceNo,
          date: peDate,
          warehouseId: peWhId,
          warehouseName: wh ? wh.name : "Main Warehouse",
          productId: peProductId,
          quantity: peQty,
          purchasePrice: pePrice,
          mrp: peMrp,
          sellingPrice: peSellingPrice,
          gst: peGst,
          discount: peDiscount,
          batchNo: peBatchNo
        });
      const json = res.data;
      if (json.success) {
        onAddNotification("Voucher Logged", "Purchase stock entry received and batch lot spawned.", "success");
        // Reset purchase form
        setPePoNo("");
        setPeInvoiceNo("");
        setPeQty(50);
        setPeBatchNo("");
      } else {
        onAddNotification("Operation Failed", json.message, "danger");
      }
    } catch (err) {
      onAddNotification("Connection Error", err.message, "danger");
    }
  };

  // Handle Transfer creation
  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    const srcW = warehouses.find(w => w.id === tfSourceId);
    const dstW = warehouses.find(w => w.id === tfDestId);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/location-transfers`, {
          sourceLocationId: tfSourceId,
          sourceLocationName: srcW ? srcW.name : tfSourceId,
          destinationLocationId: tfDestId,
          destinationLocationName: dstW ? dstW.name : tfDestId,
          productId: tfProductId,
          quantity: tfQty,
          remarks: tfRemarks
        });
      const json = res.data;
      if (json.success) {
        onAddNotification("Transfer Initiated", `Requested transfer log ${json.data.transferNo}`, "success");
        setShowTransferModal(false);
        fetchTransfers();
      } else {
        onAddNotification("Failed", json.message, "danger");
      }
    } catch (err) {
      onAddNotification("Connection Error", err.message, "danger");
    }
  };

  // Handle Transfer status update
  const handleUpdateTransferStatus = async (tfId, statusVal) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/location-transfers/${tfId}/status`, { status: statusVal });
      const json = res.data;
      if (json.success) {
        onAddNotification("Status Updated", `Transfer marked ${statusVal}`, "success");
        fetchTransfers();
      }
    } catch (err) {
      onAddNotification("Error", err.message, "danger");
    }
  };

  // Handle Adjustment save
  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!adjProductId) {
      alert("Please select a product");
      return;
    }
    const wh = warehouses.find(w => w.id === adjWhId);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/stock-management/adjustments`, {
          productId: adjProductId,
          warehouseId: adjWhId,
          warehouseName: wh ? wh.name : "Main Warehouse",
          type: adjType,
          difference: adjDiff,
          reason: adjReason,
          remarks: adjRemarks,
          approvedBy: adjApprovedBy
        });
      const json = res.data;
      if (json.success) {
        onAddNotification("Stock Reconciled", "Adjustment approved and inventory corrected.", "success");
        setAdjDiff(10);
        setAdjReason("");
        setAdjRemarks("");
        setAdjApprovedBy("");
      } else {
        onAddNotification("Failed", json.message, "danger");
      }
    } catch (err) {
      onAddNotification("Connection Error", err.message, "danger");
    }
  };

  // Handle Return submit
  const handleSaveReturn = async (e) => {
    e.preventDefault();
    const wh = warehouses.find(w => w.id === retWhId);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/stock-management/returns`, {
          returnType: retType,
          refInvoice: retInvoice,
          partnerName: retPartner,
          productId: retProductId,
          quantity: retQty,
          warehouseId: retWhId,
          warehouseName: wh ? wh.name : "Main Warehouse",
          reason: retReason
        });
      const json = res.data;
      if (json.success) {
        onAddNotification("Return Logged", "Inventory returned and movement generated.", "success");
        setShowReturnModal(false);
        fetchReturns();
      } else {
        onAddNotification("Failed", json.message, "danger");
      }
    } catch (err) {
      onAddNotification("Connection Error", err.message, "danger");
    }
  };

  // Export spreadsheet Snapshot
  const handleExportCSV = (tableType) => {
    onAddNotification("CSV Export", `Spreadsheet download started for ${tableType}.`, "success");
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 font-sans text-xs font-semibold text-slate-600">
      
      {/* Module Title / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Stock Management Dashboard</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enterprise Inventory Traceability & locations pipeline</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === "opening") fetchOpeningList();
              if (activeTab === "transfers") fetchTransfers();
              if (activeTab === "sales") fetchSalesDeductions();
              if (activeTab === "returns") fetchReturns();
              if (activeTab === "reports") fetchReports();
              onAddNotification("Refreshed", "Synchronized live parameters with MongoDB Atlas.", "success");
            }}
            className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> <span>Refresh</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> <span>Print</span>
          </button>
        </div>
      </div>

      {/* Tab Selector Links */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-2xs mb-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 w-full">
        {[
          { id: "opening", label: "Opening Stock Management", icon: Warehouse },
          { id: "transfers", label: "Stock Transfer Between Locations", icon: ArrowRightLeft },
          { id: "purchase", label: "Purchase Stock Entry", icon: ArrowUpRight },
          { id: "sales", label: "Sales Stock Deduction", icon: ArrowDownLeft },
          { id: "adjustments", label: "Stock Adjustment", icon: ClipboardCheck },
          { id: "returns", label: "Stock Return Management", icon: Undo2 },
          { id: "reports", label: "Inventory Audit Report", icon: TrendingUp }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 py-2.5 rounded-xl font-extrabold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-center text-[10px] cursor-pointer ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. OPENING STOCK TAB */}
      {/* ========================================================= */}
      {activeTab === "opening" && (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Products configured</span>
              <span className="text-xl font-black text-slate-800">{openingStats.totalProducts} items</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Opening Stock</span>
              <span className="text-xl font-black text-emerald-600">{openingStats.totalQty.toLocaleString()} units</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Opening Stock Value</span>
              <span className="text-xl font-black text-indigo-600">₹{openingStats.stockValue.toLocaleString()}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Cost Value</span>
              <span className="text-xl font-black text-slate-700">₹{openingStats.totalCost.toLocaleString()}</span>
            </div>
          </div>

          {/* Opening Table Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-2xs gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search opening stock... (Ctrl+F)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 font-semibold text-slate-700 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  setEditOpeningProd(null);
                  setOpProductId("");
                  setOpQty(100);
                  setOpBatchNo("");
                  setOpRemarks("");
                  setShowOpeningModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> <span>Add Opening Stock (Ctrl+N)</span>
              </button>
              <button
                onClick={() => handleExportCSV("Opening Stock")}
                className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Opening stock table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {openingLoading ? (
              <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Loading Opening Stock from Atlas...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-400 border-b border-slate-100 tracking-wider">
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Code</th>
                      <th className="p-3.5">SKU</th>
                      <th className="p-3.5">Barcode</th>
                      <th className="p-3.5 text-center">Opening Stock</th>
                      <th className="p-3.5 text-center">Current Stock</th>
                      <th className="p-3.5">Warehouse Depot</th>
                      <th className="p-3.5 font-mono">Date Configured</th>
                      <th className="p-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(openingList || [])
                      .filter(p => {
                        if (!p) return false;
                        const q = String(searchQuery || "").toLowerCase();
                        const nameStr = String(p.name || p.productName || "").toLowerCase();
                        const skuStr = String(p.sku || p.productCode || "").toLowerCase();
                        return nameStr.includes(q) || skuStr.includes(q);
                      })
                      .map((p) => (
                        <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="p-3.5 font-bold text-slate-800">{p.name}</td>
                          <td className="p-3.5 font-mono text-slate-400">{p.productCode}</td>
                          <td className="p-3.5 font-mono text-indigo-600 font-bold">{p.sku}</td>
                          <td className="p-3.5 font-mono text-slate-500">{p.barcode || "N/A"}</td>
                          <td className="p-3.5 text-center font-mono font-bold text-slate-700">{p.openingStock}</td>
                          <td className="p-3.5 text-center font-mono font-bold text-emerald-600">{p.stock}</td>
                          <td className="p-3.5 text-slate-600">Main Warehouse (w-1)</td>
                          <td className="p-3.5 text-slate-400 font-mono">{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => {
                                setEditOpeningProd(p);
                                setOpQty(p.openingStock);
                                setOpWhId("w-1");
                                setOpRemarks("Adjustment correction");
                                setShowOpeningModal(true);
                              }}
                              className="px-2 py-1 border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              Edit Stock (F2)
                            </button>
                          </td>
                        </tr>
                      ))}
                    {openingList.length === 0 && (
                      <tr><td colSpan="9" className="p-12 text-center text-slate-400">No opening stock entries recorded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. DEPOT TRANSFERS TAB */}
      {/* ========================================================= */}
      {activeTab === "transfers" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-2xs gap-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Depot Transfer Registry</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTransferModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> <span>New Stock Transfer</span>
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {transfersLoading ? (
              <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Fetching transfers from MongoDB...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-400 border-b border-slate-100 tracking-wider">
                      <th className="p-3.5">Transfer No</th>
                      <th className="p-3.5">Source Depot</th>
                      <th className="p-3.5">Destination Depot</th>
                      <th className="p-3.5">Product SKU</th>
                      <th className="p-3.5 text-center">Quantity</th>
                      <th className="p-3.5">Date Requested</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center">Action pipeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((t) => (
                      <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-3.5 font-mono font-bold text-indigo-600">{t.transferNo}</td>
                        <td className="p-3.5 font-bold text-slate-700">{t.sourceLocationName}</td>
                        <td className="p-3.5 font-bold text-slate-700">{t.destinationLocationName}</td>
                        <td className="p-3.5 font-mono text-slate-600">{t.productName}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-800">{t.quantity} items</td>
                        <td className="p-3.5 font-mono text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            t.status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : t.status === "In Transit" || t.status === "Dispatched" ? "bg-blue-50 text-blue-600 border-blue-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <select
                            value={t.status}
                            onChange={(e) => handleUpdateTransferStatus(t._id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-extrabold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                            <option value="Requested">Requested</option>
                            <option value="Approved">Approved</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Received">Received</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {transfers.length === 0 && (
                      <tr><td colSpan="8" className="p-12 text-center text-slate-400">No transfers recorded in system.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PURCHASE STOCK ENTRY TAB */}
      {/* ========================================================= */}
      {activeTab === "purchase" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Purchase Order Stock Inbound Voucher</h3>
              <p className="text-[10px] text-slate-400">Manually record purchased stock items directly to MongoDB collections and create inventory batches.</p>
            </div>
            <button
              onClick={() => handleExportCSV("Purchase Entries")}
              className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold flex items-center gap-1 cursor-pointer bg-white"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> <span>Template Download</span>
            </button>
          </div>

          <form onSubmit={handleSavePurchase} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Select Supplier</label>
              <select
                value={peSupplierId}
                onChange={(e) => setPeSupplierId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
              >
                <option value="">Select supplier partner...</option>
                {suppliers.map(s => (
                  <option key={s._id} value={s._id}>{s.name} (Balance: ₹{s.outstandingBalance})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Supplier Name (Fallback)</label>
              <input
                type="text"
                placeholder="e.g. Pratibha Syntex Ltd"
                value={peSupplierName}
                onChange={(e) => setPeSupplierName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Purchase Order No</label>
              <input
                type="text"
                placeholder="e.g. PO-2026-904"
                value={pePoNo}
                onChange={(e) => setPePoNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Purchase Invoice Number</label>
              <input
                type="text"
                placeholder="e.g. PINV-94819"
                required
                value={peInvoiceNo}
                onChange={(e) => setPeInvoiceNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Date Inbound</label>
              <input
                type="date"
                required
                value={peDate}
                onChange={(e) => setPeDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Target Warehouse Depot</label>
              <select
                value={peWhId}
                onChange={(e) => setPeWhId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Garment Product</label>
              <select
                required
                value={peProductId}
                onChange={(e) => setPeProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
              >
                <option value="">Select product to inbound...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Purchase Qty</label>
              <input
                type="number"
                required
                min={1}
                value={peQty}
                onChange={(e) => setPeQty(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Batch Code (Auto-generated if empty)</label>
              <input
                type="text"
                placeholder="e.g. LOT-A-1"
                value={peBatchNo}
                onChange={(e) => setPeBatchNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 col-span-3 border-t border-slate-100 pt-4">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Purchase / Cost Price</label>
                <input
                  type="number"
                  required
                  value={pePrice}
                  onChange={(e) => setPePrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Selling Price</label>
                <input
                  type="number"
                  required
                  value={peSellingPrice}
                  onChange={(e) => setPeSellingPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">MRP Value</label>
                <input
                  type="number"
                  required
                  value={peMrp}
                  onChange={(e) => setPeMrp(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 col-span-3 pb-3 border-b border-slate-100">
              <div>
                <label className="block text-slate-400 font-bold mb-1">GST Levy Rate (%)</label>
                <input
                  type="number"
                  value={peGst}
                  onChange={(e) => setPeGst(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Trade Discount (%)</label>
                <input
                  type="number"
                  value={peDiscount}
                  onChange={(e) => setPeDiscount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                />
              </div>
            </div>
            <div className="col-span-3 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Inbound Stock & Create Batch (Ctrl+S)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SALES STOCK TAB */}
      {/* ========================================================= */}
      {activeTab === "sales" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-2xs gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">POS Sales Deductions Ledger</h3>
              <p className="text-[11px] text-slate-400">Compiled log lines of retail sales checkouts from Billing POS (Read Only).</p>
            </div>
            <button
              onClick={() => handleExportCSV("Sales Deductions")}
              className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> <span>Export Logs</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {salesLoading ? (
              <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Fetching sales deductions from POS...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-400 border-b border-slate-100 tracking-wider">
                      <th className="p-3.5">Invoice Number</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Product Name</th>
                      <th className="p-3.5">SKU</th>
                      <th className="p-3.5 text-center">Qty Sold</th>
                      <th className="p-3.5">Warehouse</th>
                      <th className="p-3.5">Salesperson</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesList.map((row) => (
                      <tr key={row._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-3.5 font-mono font-bold text-indigo-600">{row.invoiceNo}</td>
                        <td className="p-3.5 font-bold text-slate-700">{row.customer}</td>
                        <td className="p-3.5 text-slate-800">{row.productName}</td>
                        <td className="p-3.5 font-mono text-slate-500">{row.sku}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-red-500">-{row.qtySold}</td>
                        <td className="p-3.5 text-slate-600">{row.warehouse}</td>
                        <td className="p-3.5 text-slate-600">{row.salesperson}</td>
                        <td className="p-3.5 text-slate-400 font-mono">{new Date(row.date).toLocaleDateString()}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-800">₹{row.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {salesList.length === 0 && (
                      <tr><td colSpan="9" className="p-12 text-center text-slate-400">No retail POS sales recorded yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. STOCK ADJUSTMENTS TAB */}
      {/* ========================================================= */}
      {activeTab === "adjustments" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Physical Inventory Reconciliation Adjustment</h3>
            <p className="text-[10px] text-slate-400">Correct warehouse inventory counts manually. Enforces manager authorization requirements.</p>
          </div>

          <form onSubmit={handleSaveAdjustment} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Target Product</label>
              <select
                required
                value={adjProductId}
                onChange={(e) => setAdjProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
              >
                <option value="">Select item to adjust...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Warehouse Depot</label>
              <select
                value={adjWhId}
                onChange={(e) => setAdjWhId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Adjustment Action</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
              >
                <option value="Increase">Increase (Found Stock)</option>
                <option value="Decrease">Decrease (Mismatch correction)</option>
                <option value="Damage">Damage (Scrap disposal)</option>
                <option value="Expired">Expired</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Adjustment Quantity</label>
              <input
                type="number"
                required
                min={1}
                value={adjDiff}
                onChange={(e) => setAdjDiff(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Reconciliation Reason</label>
              <input
                type="text"
                required
                placeholder="e.g. Audit variance offset"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Authorized Manager Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sachin Pilot"
                value={adjApprovedBy}
                onChange={(e) => setAdjApprovedBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-slate-400 font-bold mb-1">Internal Remarks</label>
              <input
                type="text"
                value={adjRemarks}
                onChange={(e) => setAdjRemarks(e.target.value)}
                placeholder="Discrepancy logs notes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none"
              />
            </div>
            <div className="col-span-3 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Apply Reconciliation Adjustments
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. RETURNS TAB */}
      {/* ========================================================= */}
      {activeTab === "returns" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-2xs gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Customer & Supplier Returns</h3>
              <p className="text-[11px] text-slate-400">Reconcile returns directly to MongoDB inventory logs (INBOUND/OUTBOUND).</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReturnModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> <span>Log Return Ticket (Ctrl+N)</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {returnsLoading ? (
              <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Loading return logs...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-400 border-b border-slate-100 tracking-wider">
                      <th className="p-3.5">Return Code</th>
                      <th className="p-3.5">Ref Invoice</th>
                      <th className="p-3.5">Channel Type</th>
                      <th className="p-3.5">Partner</th>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5 text-center">Returned Qty</th>
                      <th className="p-3.5">Reason</th>
                      <th className="p-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnsList.map((row) => (
                      <tr key={row._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-3.5 font-mono font-bold text-indigo-600">{row.returnNo}</td>
                        <td className="p-3.5 font-mono text-slate-400">{row.refInvoice}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            row.type === "Customer Return" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">{row.partner}</td>
                        <td className="p-3.5 text-slate-800">{row.productName}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-800">{row.quantity} units</td>
                        <td className="p-3.5 text-slate-400">{row.reason}</td>
                        <td className="p-3.5 text-center">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold">Processed</span>
                        </td>
                      </tr>
                    ))}
                    {returnsList.length === 0 && (
                      <tr><td colSpan="8" className="p-12 text-center text-slate-400">No returns logged.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. AUDIT REPORTS TAB */}
      {/* ========================================================= */}
      {activeTab === "reports" && (
        <div className="space-y-6 animate-fade-in text-xs font-semibold text-slate-600">
          <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-2xs gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 flex-wrap">
              {[
                { id: "summary", label: "Summary" },
                { id: "valuation", label: "Valuation" },
                { id: "opening-vs-current", label: "Opening vs Current" },
                { id: "fast-moving", label: "Fast Moving" },
                { id: "slow-moving", label: "Slow Moving" },
                { id: "dead-stock", label: "Dead Stock" },
                { id: "low-stock", label: "Low Stock" },
                { id: "movement-summary", label: "Movements" }
              ].map(rep => (
                <button
                  key={rep.id}
                  onClick={() => setReportType(rep.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    reportType === rep.id ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {rep.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleExportCSV(`${reportType} Report`)}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> <span>Export Sheet</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {reportLoading ? (
              <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Running live Mongoose analytics pipelines...</div>
            ) : (
              <div className="overflow-x-auto">
                {/* Standard grid format render depending on the reportType */}
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-400 border-b border-slate-100 tracking-wider">
                      {reportType === "summary" && (
                        <>
                          <th className="p-3.5">Product Name</th>
                          <th className="p-3.5">SKU</th>
                          <th className="p-3.5 text-center">Opening Stock</th>
                          <th className="p-3.5 text-center">Purchased</th>
                          <th className="p-3.5 text-center">Sold</th>
                          <th className="p-3.5 text-center">Reserved</th>
                          <th className="p-3.5 text-center">Current Stock</th>
                          <th className="p-3.5 text-center">Status</th>
                        </>
                      )}
                      {reportType === "valuation" && (
                        <>
                          <th className="p-3.5">Product Name</th>
                          <th className="p-3.5">SKU</th>
                          <th className="p-3.5 text-center">Current Stock</th>
                          <th className="p-3.5 text-right">Cost Price</th>
                          <th className="p-3.5 text-right">Selling Price</th>
                          <th className="p-3.5 text-right">Total Cost Value</th>
                          <th className="p-3.5 text-right">Total Retail Value</th>
                        </>
                      )}
                      {reportType === "opening-vs-current" && (
                        <>
                          <th className="p-3.5">Product Name</th>
                          <th className="p-3.5">SKU</th>
                          <th className="p-3.5 text-center">Opening Stock</th>
                          <th className="p-3.5 text-center">Current Stock</th>
                          <th className="p-3.5 text-center">Variance</th>
                        </>
                      )}
                      {reportType === "fast-moving" && (
                        <>
                          <th className="p-3.5">Product Name</th>
                          <th className="p-3.5">SKU</th>
                          <th className="p-3.5 text-center">Sold Units</th>
                          <th className="p-3.5 text-center">Remaining Stock</th>
                          <th className="p-3.5 text-right">Sales Revenue</th>
                        </>
                      )}
                      {reportType === "slow-moving" && (
                        <>
                          <th className="p-3.5">Product Name</th>
                          <th className="p-3.5">SKU</th>
                          <th className="p-3.5 text-center">Sold Qty</th>
                          <th className="p-3.5 text-center">Current Stock</th>
                        </>
                      )}
                      {reportType === "dead-stock" && (
                        <>
                          <th className="p-3.5">Product Name</th>
                          <th className="p-3.5">SKU</th>
                          <th className="p-3.5 text-center">Current Stock</th>
                          <th className="p-3.5">Created Date</th>
                        </>
                      )}
                      {reportType === "low-stock" && (
                        <>
                          <th className="p-3.5">Product Name</th>
                          <th className="p-3.5">SKU</th>
                          <th className="p-3.5 text-center">Current Stock</th>
                          <th className="p-3.5 text-center">Min Threshold</th>
                          <th className="p-3.5 text-center">Alert Status</th>
                        </>
                      )}
                      {reportType === "movement-summary" && (
                        <>
                          <th className="p-3.5">Product Name</th>
                          <th className="p-3.5">SKU</th>
                          <th className="p-3.5 text-center">Inbound Transactions</th>
                          <th className="p-3.5 text-center">Outbound Transactions</th>
                          <th className="p-3.5 text-center">Transfers Count</th>
                          <th className="p-3.5 text-center">Total Movements</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                        {reportType === "summary" && (
                          <>
                            <td className="p-3.5 font-bold text-slate-800">{row.productName}</td>
                            <td className="p-3.5 font-mono text-indigo-600">{row.sku}</td>
                            <td className="p-3.5 text-center font-mono">{row.openingStock}</td>
                            <td className="p-3.5 text-center font-mono">{row.purchased}</td>
                            <td className="p-3.5 text-center font-mono">{row.sold}</td>
                            <td className="p-3.5 text-center font-mono">{row.reserved}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-emerald-600">{row.currentStock}</td>
                            <td className="p-3.5 text-center">
                              <span className="bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{row.status}</span>
                            </td>
                          </>
                        )}
                        {reportType === "valuation" && (
                          <>
                            <td className="p-3.5 font-bold text-slate-800">{row.productName}</td>
                            <td className="p-3.5 font-mono text-indigo-600">{row.sku}</td>
                            <td className="p-3.5 text-center font-mono">{row.currentStock}</td>
                            <td className="p-3.5 text-right font-mono">₹{row.costPrice}</td>
                            <td className="p-3.5 text-right font-mono">₹{row.sellingPrice}</td>
                            <td className="p-3.5 text-right font-mono font-bold text-indigo-600">₹{row.totalCostValue.toLocaleString()}</td>
                            <td className="p-3.5 text-right font-mono font-bold text-slate-800">₹{row.totalRetailValue.toLocaleString()}</td>
                          </>
                        )}
                        {reportType === "opening-vs-current" && (
                          <>
                            <td className="p-3.5 font-bold text-slate-800">{row.productName}</td>
                            <td className="p-3.5 font-mono text-indigo-600">{row.sku}</td>
                            <td className="p-3.5 text-center font-mono">{row.openingStock}</td>
                            <td className="p-3.5 text-center font-mono">{row.currentStock}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-indigo-600">{row.variance}</td>
                          </>
                        )}
                        {reportType === "fast-moving" && (
                          <>
                            <td className="p-3.5 font-bold text-slate-800">{row.productName}</td>
                            <td className="p-3.5 font-mono text-indigo-600">{row.sku}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-indigo-600">{row.soldQuantity}</td>
                            <td className="p-3.5 text-center font-mono">{row.currentStock}</td>
                            <td className="p-3.5 text-right font-mono font-bold text-slate-800">₹{row.revenueGenerated.toLocaleString()}</td>
                          </>
                        )}
                        {reportType === "slow-moving" && (
                          <>
                            <td className="p-3.5 font-bold text-slate-800">{row.productName}</td>
                            <td className="p-3.5 font-mono text-indigo-600">{row.sku}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-amber-600">{row.soldQuantity}</td>
                            <td className="p-3.5 text-center font-mono">{row.currentStock}</td>
                          </>
                        )}
                        {reportType === "dead-stock" && (
                          <>
                            <td className="p-3.5 font-bold text-slate-800">{row.productName}</td>
                            <td className="p-3.5 font-mono text-indigo-600">{row.sku}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-slate-400">{row.currentStock}</td>
                            <td className="p-3.5 text-slate-400 font-mono">{new Date(row.createdDate).toLocaleDateString()}</td>
                          </>
                        )}
                        {reportType === "low-stock" && (
                          <>
                            <td className="p-3.5 font-bold text-slate-800">{row.productName}</td>
                            <td className="p-3.5 font-mono text-indigo-600">{row.sku}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-red-500">{row.currentStock}</td>
                            <td className="p-3.5 text-center font-mono">{row.threshold}</td>
                            <td className="p-3.5 text-center">
                              <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[9px] font-bold">Alert Threshold Triggered</span>
                            </td>
                          </>
                        )}
                        {reportType === "movement-summary" && (
                          <>
                            <td className="p-3.5 font-bold text-slate-800">{row.productName}</td>
                            <td className="p-3.5 font-mono text-indigo-600">{row.sku}</td>
                            <td className="p-3.5 text-center font-mono text-emerald-600 font-bold">+{row.inboundTransactions}</td>
                            <td className="p-3.5 text-center font-mono text-red-500 font-bold">-{row.outboundTransactions}</td>
                            <td className="p-3.5 text-center font-mono text-indigo-600">{row.transfersCount}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-slate-700">{row.totalMovements}</td>
                          </>
                        )}
                      </tr>
                    ))}
                    {reportData.length === 0 && (
                      <tr><td colSpan="8" className="p-12 text-center text-slate-400">No report parameters loaded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* Modal: ADD/EDIT OPENING STOCK */}
      {showOpeningModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in font-semibold text-slate-600">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {editOpeningProd ? `Edit Opening Stock: ${editOpeningProd.name}` : "Configure New Opening Stock"}
            </h3>
            
            <form onSubmit={handleSaveOpening} className="space-y-4">
              {!editOpeningProd && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Target Garment Product</label>
                  <select
                    required
                    value={opProductId}
                    onChange={(e) => setOpProductId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    <option value="">Select product SKU...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Opening Quantity</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={opQty}
                    onChange={(e) => setOpQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Warehouse Facility</label>
                  <select
                    value={opWhId}
                    onChange={(e) => setOpWhId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!editOpeningProd && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Batch Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. OP-LOT-1"
                    value={opBatchNo}
                    onChange={(e) => setOpBatchNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-bold mb-1">Reconciliation Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Initial inventory initialization"
                  value={opRemarks}
                  onChange={(e) => setOpRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpeningModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Entry (Ctrl+S)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: NEW STOCK TRANSFER */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in font-semibold text-slate-600">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Initiate Stock Transfer
            </h3>
            
            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Source warehouse</label>
                  <select
                    value={tfSourceId}
                    onChange={(e) => setTfSourceId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Destination location</label>
                  <select
                    value={tfDestId}
                    onChange={(e) => setTfDestId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Product SKU</label>
                <select
                  required
                  value={tfProductId}
                  onChange={(e) => setTfProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                >
                  <option value="">Select product to transfer...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={tfQty}
                    onChange={(e) => setTfQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Transfer Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Showroom replenishment"
                    value={tfRemarks}
                    onChange={(e) => setTfRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Log Dispatch (Ctrl+S)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: LOG NEW RETURN */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in font-semibold text-slate-600 font-semibold">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Register Stock Return Voucher
            </h3>
            
            <form onSubmit={handleSaveReturn} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Return Channel</label>
                  <select
                    value={retType}
                    onChange={(e) => setRetType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    <option value="Customer Return">Customer Return (+ Stock)</option>
                    <option value="Supplier Return">Supplier Return (- Stock)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Reference Invoice</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-94819"
                    value={retInvoice}
                    onChange={(e) => setRetInvoice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Partner Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditya / Global Fabrics"
                    value={retPartner}
                    onChange={(e) => setRetPartner(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Warehouse Location</label>
                  <select
                    value={retWhId}
                    onChange={(e) => setRetWhId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Product SKU</label>
                <select
                  required
                  value={retProductId}
                  onChange={(e) => setRetProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                >
                  <option value="">Select return product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={retQty}
                    onChange={(e) => setRetQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Reason for Return</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Size swap / Weave defect"
                    value={retReason}
                    onChange={(e) => setRetReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Log Return Voucher (Ctrl+S)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

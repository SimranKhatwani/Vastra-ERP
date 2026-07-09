import React, { useState } from "react";
import {
  Plus,
  Warehouse,
  AlertTriangle,
  Layers,
  Trash2,
  Edit3,
  ArrowRightLeft,
  ClipboardCheck,
  Undo2,
  Download,
} from "lucide-react";

export const InventoryView = ({
  products,
  onAdjustStock,
  onAddNotification,
}) => {
  // Tabs for Inventory
  const [activeTab, setActiveTab] = useState("warehouses");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("All");

  // Warehouses List State (Full CRUD)
  const [warehouses, setWarehouses] = useState([
    {
      id: "w-1",
      name: "Bandra Central Warehouse",
      location: "Bandra Kurla Complex, Mumbai",
      manager: "Sachin Pilot",
      capacity: "78%",
      totalGarments: 4500,
    },
    {
      id: "w-2",
      name: "Colaba Retail Godown",
      location: "Colaba Causeway, Mumbai",
      manager: "Suniel Shetty",
      capacity: "42%",
      totalGarments: 1200,
    },
    {
      id: "w-3",
      name: "Thane Logistics Depot",
      location: "Wagle Estate, Thane",
      manager: "Bobby Deol",
      capacity: "91%",
      totalGarments: 8900,
    },
  ]);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [whName, setWhName] = useState("");
  const [whLocation, setWhLocation] = useState("");
  const [whManager, setWhManager] = useState("");
  const [whCapacity, setWhCapacity] = useState("50%");

  // Batch Tracking State
  const [batches, setBatches] = useState([
    {
      id: "b-1",
      batchNo: "BAT-2026-001",
      productId: "p-1",
      productName: "Raymond Executive Linen Shirt - White",
      quantity: 150,
      manufacturingDate: "2026-01-10",
      expiryDate: "2028-01-10",
      warehouseId: "w-1",
      warehouseName: "Bandra Central Warehouse",
    },
    {
      id: "b-2",
      batchNo: "BAT-2026-002",
      productId: "p-4",
      productName: "Zara Slim Fit Denim Jeans - Midnight Black",
      quantity: 200,
      manufacturingDate: "2026-02-15",
      expiryDate: "2029-02-15",
      warehouseId: "w-3",
      warehouseName: "Thane Logistics Depot",
    },
    {
      id: "b-3",
      batchNo: "BAT-2026-003",
      productId: "p-7",
      productName: "Biba Festive Floral Saree - Red Silk",
      quantity: 80,
      manufacturingDate: "2026-03-01",
      expiryDate: "2031-03-01",
      warehouseId: "w-2",
      warehouseName: "Colaba Retail Godown",
    },
  ]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchNo, setBatchNo] = useState("");
  const [batchProductId, setBatchProductId] = useState("");
  const [batchQty, setBatchQty] = useState(50);
  const [batchMfgDate, setBatchMfgDate] = useState("2026-06-01");
  const [batchExpDate, setBatchExpDate] = useState("2028-06-01");
  const [batchWhId, setBatchWhId] = useState("w-1");

  // Manual Adjustments Form State
  const [adjustingId, setAdjustingId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState(10);
  const [adjustType, setAdjustType] = useState("Add");
  const [adjustReason, setAdjustReason] = useState("Stock replenishment");

  // Stock Transfers State
  const [transfers, setTransfers] = useState([
    {
      id: "t-1",
      timestamp: "2026-06-28 14:15:30",
      productId: "p-1",
      productName: "Raymond Executive Linen Shirt - White",
      quantity: 30,
      sourceWarehouseId: "w-3",
      sourceWarehouseName: "Thane Logistics Depot",
      destWarehouseId: "w-1",
      destWarehouseName: "Bandra Central Warehouse",
      status: "Completed",
      referenceNo: "TO-20260601",
    },
    {
      id: "t-2",
      timestamp: "2026-06-29 10:30:00",
      productId: "p-4",
      productName: "Zara Slim Fit Denim Jeans - Midnight Black",
      quantity: 50,
      sourceWarehouseId: "w-1",
      sourceWarehouseName: "Bandra Central Warehouse",
      destWarehouseId: "w-2",
      destWarehouseName: "Colaba Retail Godown",
      status: "In Transit",
      referenceNo: "TO-20260602",
    },
  ]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [xferProductId, setXferProductId] = useState("");
  const [xferQty, setXferQty] = useState(20);
  const [xferSourceWhId, setXferSourceWhId] = useState("w-3");
  const [xferDestWhId, setXferDestWhId] = useState("w-1");
  const [xferRef, setXferRef] = useState("");

  // Stock Returns State
  const [returns, setReturns] = useState([
    {
      id: "ret-1",
      timestamp: "2026-06-27 16:45:00",
      productId: "p-7",
      productName: "Biba Festive Floral Saree - Red Silk",
      quantity: 3,
      partnerName: "Pratibha Syntex Ltd",
      type: "Vendor Return",
      reason: "Micro-tears in silk border (QC Failed)",
      status: "Completed",
    },
    {
      id: "ret-2",
      timestamp: "2026-06-28 09:12:00",
      productId: "p-2",
      productName: "Raymond Custom Fit Chino - Khaki",
      quantity: 1,
      partnerName: "Ramesh Kumar",
      type: "Customer Return",
      reason: "Unfit waist length",
      status: "Completed",
    },
  ]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [retProductId, setRetProductId] = useState("");
  const [retQty, setRetQty] = useState(5);
  const [retPartner, setRetPartner] = useState("");
  const [retType, setRetType] = useState("Vendor Return");
  const [retReason, setRetReason] = useState("Defective weave sizing");

  // Stock Audits State
  const [audits, setAudits] = useState([
    {
      id: "aud-1",
      timestamp: "2026-06-26 15:00:00",
      productId: "p-1",
      productName: "Raymond Executive Linen Shirt - White",
      warehouseId: "w-1",
      warehouseName: "Bandra Central Warehouse",
      systemStock: 45,
      physicalStock: 45,
      variance: 0,
      auditor: "Vijay Shekhar",
      notes: "Perfect barcode match.",
      status: "Adjusted",
    },
    {
      id: "aud-2",
      timestamp: "2026-06-28 11:00:00",
      productId: "p-4",
      productName: "Zara Slim Fit Denim Jeans - Midnight Black",
      warehouseId: "w-3",
      warehouseName: "Thane Logistics Depot",
      systemStock: 72,
      physicalStock: 70,
      variance: -2,
      auditor: "Sachin Pilot",
      notes: "2 units missing in pack box. Writing off.",
      status: "Pending Review",
    },
  ]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditProductId, setAuditProductId] = useState("");
  const [auditWhId, setAuditWhId] = useState("w-1");
  const [auditPhysicalStock, setAuditPhysicalStock] = useState(0);
  const [auditNotes, setAuditNotes] = useState("");
  const [auditorName, setAuditorName] = useState("Vijay Shekhar");

  // Pagination for tables
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Warehouses CRUD functions
  const handleOpenWarehouseModal = (wh) => {
    if (wh) {
      setEditingWarehouse(wh);
      setWhName(wh.name);
      setWhLocation(wh.location);
      setWhManager(wh.manager);
      setWhCapacity(wh.capacity);
    } else {
      setEditingWarehouse(null);
      setWhName("");
      setWhLocation("");
      setWhManager("");
      setWhCapacity("60%");
    }
    setShowWarehouseModal(true);
  };

  const handleWarehouseSubmit = (e) => {
    e.preventDefault();
    if (!whName || !whLocation || !whManager) return;

    if (editingWarehouse) {
      // Edit
      setWarehouses((prev) =>
        prev.map((w) =>
          w.id === editingWarehouse.id
            ? {
                ...w,
                name: whName,
                location: whLocation,
                manager: whManager,
                capacity: whCapacity,
              }
            : w,
        ),
      );
      onAddNotification(
        "Warehouse Modified",
        `Updated depot specifications for ${whName}.`,
        "success",
      );
    } else {
      // Create
      const newWh = {
        id: `wh-${Date.now()}`,
        name: whName,
        location: whLocation,
        manager: whManager,
        capacity: whCapacity,
        totalGarments: 0,
      };
      setWarehouses((prev) => [...prev, newWh]);
      onAddNotification(
        "Warehouse Created",
        `Established secure logistics depot: ${whName}.`,
        "success",
      );
    }
    setShowWarehouseModal(false);
  };

  const handleDeleteWarehouse = (id, name) => {
    if (confirm(`Are you sure you want to delete warehouse depot: ${name}?`)) {
      setWarehouses((prev) => prev.filter((w) => w.id !== id));
      onAddNotification(
        "Warehouse Deleted",
        `Logistics depot ${name} decommissioned from database.`,
        "danger",
      );
    }
  };

  // Batch Tracking Functions
  const handleCreateBatch = (e) => {
    e.preventDefault();
    if (!batchNo || !batchProductId || batchQty <= 0) return;

    const targetProduct = products.find((p) => p.id === batchProductId);
    const targetWh = warehouses.find((w) => w.id === batchWhId);
    if (!targetProduct || !targetWh) return;

    const newBatch = {
      id: `b-${Date.now()}`,
      batchNo,
      productId: batchProductId,
      productName: targetProduct.name,
      quantity: batchQty,
      manufacturingDate: batchMfgDate,
      expiryDate: batchExpDate,
      warehouseId: batchWhId,
      warehouseName: targetWh.name,
    };

    setBatches((prev) => [newBatch, ...prev]);
    onAdjustStock(batchProductId, batchQty); // Add to catalog stock

    onAddNotification(
      "Batch Registered",
      `Logged textile production batch ${batchNo} with ${batchQty} items inside ${targetWh.name}.`,
      "success",
    );
    setShowBatchModal(false);
    setBatchNo("");
    setBatchProductId("");
    setBatchQty(50);
  };

  // Stock Transfer Function
  const handleInitiateTransfer = (e) => {
    e.preventDefault();
    if (!xferProductId || xferQty <= 0 || !xferSourceWhId || !xferDestWhId)
      return;
    if (xferSourceWhId === xferDestWhId) {
      onAddNotification(
        "Transfer Failed",
        "Source and Destination warehouses must be distinct.",
        "danger",
      );
      return;
    }

    const targetProduct = products.find((p) => p.id === xferProductId);
    const srcWh = warehouses.find((w) => w.id === xferSourceWhId);
    const dstWh = warehouses.find((w) => w.id === xferDestWhId);

    if (!targetProduct || !srcWh || !dstWh) return;

    if (targetProduct.stock < xferQty) {
      onAddNotification(
        "Transfer Warning",
        `Insufficient stock in system. Only ${targetProduct.stock} available.`,
        "warning",
      );
      return;
    }

    const newXfer = {
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      productId: xferProductId,
      productName: targetProduct.name,
      quantity: xferQty,
      sourceWarehouseId: xferSourceWhId,
      sourceWarehouseName: srcWh.name,
      destWarehouseId: xferDestWhId,
      destWarehouseName: dstWh.name,
      status: "Completed",
      referenceNo:
        xferRef || `TO-2026${Math.floor(1000 + Math.random() * 9000)}`,
    };

    // Update state
    setTransfers((prev) => [newXfer, ...prev]);
    // Note: Overall global stock does not change as it just moves warehouses,
    // but we can log it inside the movement history logs!
    onAddNotification(
      "Stock Transferred",
      `Moved ${xferQty} units of ${targetProduct.name} from ${srcWh.name} to ${dstWh.name}.`,
      "success",
    );
    setShowTransferModal(false);
    setXferProductId("");
    setXferRef("");
  };

  // Stock Return Functions
  const handleCreateReturn = (e) => {
    e.preventDefault();
    if (!retProductId || retQty <= 0 || !retPartner) return;

    const targetProduct = products.find((p) => p.id === retProductId);
    if (!targetProduct) return;

    if (retType === "Vendor Return" && targetProduct.stock < retQty) {
      onAddNotification(
        "Insufficient Stock",
        `Cannot return ${retQty} units to Vendor. Only ${targetProduct.stock} units exist.`,
        "warning",
      );
      return;
    }

    const newReturn = {
      id: `ret-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      productId: retProductId,
      productName: targetProduct.name,
      quantity: retQty,
      partnerName: retPartner,
      type: retType,
      reason: retReason,
      status: "Completed",
    };

    setReturns((prev) => [newReturn, ...prev]);

    // Update catalog stocks (Vendors Return reduces stock, Customer Return increases stock)
    const adjustmentDelta = retType === "Vendor Return" ? -retQty : retQty;
    onAdjustStock(retProductId, adjustmentDelta);

    onAddNotification(
      "Stock Return Filed",
      `Logged ${retType}: ${retQty} units of ${targetProduct.name} ${retType === "Vendor Return" ? "dispatched back to" : "returned by"} ${retPartner}.`,
      "success",
    );
    setShowReturnModal(false);
    setRetProductId("");
    setRetPartner("");
  };

  // Stock Audit Functions
  const handleInitiateAudit = (e) => {
    e.preventDefault();
    if (!auditProductId || !auditWhId) return;

    const targetProduct = products.find((p) => p.id === auditProductId);
    const targetWh = warehouses.find((w) => w.id === auditWhId);
    if (!targetProduct || !targetWh) return;

    const variance = auditPhysicalStock - targetProduct.stock;

    const newAudit = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      productId: auditProductId,
      productName: targetProduct.name,
      warehouseId: auditWhId,
      warehouseName: targetWh.name,
      systemStock: targetProduct.stock,
      physicalStock: auditPhysicalStock,
      variance,
      auditor: auditorName,
      notes: auditNotes || "Routine bi-weekly stock take",
      status: "Pending Review",
    };

    setAudits((prev) => [newAudit, ...prev]);
    onAddNotification(
      "Audit Recorded",
      `Logged physical count of ${auditPhysicalStock} vs system ${targetProduct.stock} (Variance: ${variance}) for ${targetProduct.name}.`,
      "info",
    );
    setShowAuditModal(false);
    setAuditProductId("");
    setAuditNotes("");
  };

  const handleApplyAuditReconciliation = (id, productId, variance) => {
    if (variance !== 0) {
      onAdjustStock(productId, variance);
    }
    setAudits((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Adjusted" } : a)),
    );
    onAddNotification(
      "Stock Reconciled",
      "Physical count discrepancy adjusted in system catalog.",
      "success",
    );
  };

  // Stock movement timeline logs compiled
  const getCompiledMovementLogs = () => {
    const rawLogs = [
      {
        timestamp: "2026-06-28 14:15:30",
        productName: "Raymond Executive Linen Shirt - White",
        type: "IN",
        quantity: 150,
        source: "Thane Logistics Depot",
        dest: "Bandra Central Warehouse",
        reference: "TO-20261101",
      },
      {
        timestamp: "2026-06-28 11:30:12",
        productName: "Zara Slim Fit Denim Jeans - Midnight Black",
        type: "OUT",
        quantity: 24,
        source: "Bandra Central Warehouse",
        dest: "POS Sale Line",
        reference: "INV-20260499",
      },
      {
        timestamp: "2026-06-27 16:45:00",
        productName: "Biba Festive Floral Saree - Red Silk",
        type: "ADJUST",
        quantity: -3,
        source: "Colaba Retail Godown",
        dest: "Damaged Stock Writeoff",
        reference: "ADJ-10294",
      },
    ];

    // Map state variables into logs
    const transferLogs = transfers.map((t) => ({
      timestamp: t.timestamp,
      productName: t.productName,
      type: "XFER",
      quantity: t.quantity,
      source: t.sourceWarehouseName,
      dest: t.destWarehouseName,
      reference: t.referenceNo,
    }));

    const returnLogs = returns.map((r) => ({
      timestamp: r.timestamp,
      productName: r.productName,
      type: r.type === "Vendor Return" ? "V-RET" : "C-RET",
      quantity: r.type === "Vendor Return" ? -r.quantity : r.quantity,
      source:
        r.type === "Vendor Return" ? "Bandra Central Warehouse" : r.partnerName,
      dest:
        r.type === "Vendor Return" ? r.partnerName : "Bandra Central Warehouse",
      reference: "RET-" + r.id.slice(-5),
    }));

    const dynamicLogs = [...rawLogs, ...transferLogs, ...returnLogs];
    return dynamicLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  };

  const handleApplyAdjustment = (e) => {
    e.preventDefault();
    if (!adjustingId) return;

    const matchedProd = products.find((p) => p.id === adjustingId);
    if (!matchedProd) return;

    const delta = adjustType === "Add" ? adjustAmount : -adjustAmount;
    if (adjustType === "Remove" && matchedProd.stock < adjustAmount) {
      onAddNotification(
        "Adjustment Denied",
        `Cannot withdraw ${adjustAmount} units. Only ${matchedProd.stock} currently in stock.`,
        "danger",
      );
      return;
    }

    onAdjustStock(adjustingId, delta);
    onAddNotification(
      "Stock Ledger Adjusted",
      `Manually ${adjustType === "Add" ? "added" : "subtracted"} ${adjustAmount} units of ${matchedProd.name}. Reason: ${adjustReason}`,
      "success",
    );
    setAdjustingId("");
    setAdjustAmount(10);
  };

  const lowStockAlerts = products.filter((p) => p.stock <= p.minStockAlert);

  // Search & Filter
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  const handleExportCSV = (tableType) => {
    onAddNotification(
      "CSV Export",
      `Generated spreadsheet snapshot for ${tableType}. Downloading now...`,
      "success",
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="inventory-root">
      {/* Overview stats header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">
              Total Depots
            </p>
            <p className="text-lg font-bold text-slate-800">
              {warehouses.length} Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">
              Tracked Batches
            </p>
            <p className="text-lg font-bold text-slate-800">
              {batches.length} Registered
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">
              Stock Movements
            </p>
            <p className="text-lg font-bold text-slate-800">
              {transfers.length} Transfers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">
              Audits Completed
            </p>
            <p className="text-lg font-bold text-slate-800">
              {audits.length} Records
            </p>
          </div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl gap-0.5">
          <button
            onClick={() => {
              setActiveTab("warehouses");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "warehouses" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Warehouse Depots
          </button>
          <button
            onClick={() => {
              setActiveTab("batches");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "batches" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Batch Tracking
          </button>
          <button
            onClick={() => {
              setActiveTab("adjustments");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "adjustments" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Manual Adjustments
          </button>
          <button
            onClick={() => {
              setActiveTab("transfers");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "transfers" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Stock Transfers
          </button>
          <button
            onClick={() => {
              setActiveTab("returns");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "returns" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Stock Returns
          </button>
          <button
            onClick={() => {
              setActiveTab("audits");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "audits" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Stock Audits
          </button>
          <button
            onClick={() => {
              setActiveTab("logs");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "logs" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Movement History
          </button>
        </div>

        <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-amber-200 shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{lowStockAlerts.length} Low Stock alerts</span>
        </span>
      </div>

      {/* TAB: WAREHOUSES (FULL CRUD) */}
      {activeTab === "warehouses" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Storage Facilities Directory
              </h3>
              <p className="text-[11px] text-slate-400">
                Manage corporate godowns, physical locations, and supervisors.
              </p>
            </div>
            <button
              onClick={() => handleOpenWarehouseModal()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Facility</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warehouses.map((w) => (
              <div
                key={w.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-center">
                  <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenWarehouseModal(w)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWarehouse(w.id, w.name)}
                      className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-slate-800 text-sm">{w.name}</h4>
                  <p className="text-slate-400">{w.location}</p>
                  <p className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded inline-block font-bold">
                    Capacity: {w.capacity}
                  </p>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-100 pt-3">
                  <span className="text-slate-500">
                    Ops: <b>{w.manager}</b>
                  </span>
                  <span className="font-bold text-indigo-600">
                    {w.totalGarments.toLocaleString()} units
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Low stock alerts panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Low Stock Alerts & Reorder Points</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {lowStockAlerts.slice(0, 10).map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-800 block truncate max-w-[200px]">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      SKU: {p.sku} | Threshold: {p.minStockAlert} units
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-red-600 block">
                      {p.stock} units
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                      Reorder Triggered
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: BATCH TRACKING */}
      {activeTab === "batches" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Garment Production Batch Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                Trace manufacturing dates, fabrics, lots, and shelf locations.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportCSV("Batches")}
                className="p-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowBatchModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Register Batch</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Batch Number</th>
                    <th className="p-3.5">Garment Product</th>
                    <th className="p-3.5">Assigned Depot</th>
                    <th className="p-3.5 text-right">Mfg Qty</th>
                    <th className="p-3.5">Mfg Date</th>
                    <th className="p-3.5">Expiry Date</th>
                    <th className="p-3.5 text-center">Trace Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {batches.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono font-bold text-indigo-600">
                        {b.batchNo}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {b.productName}
                      </td>
                      <td className="p-3.5">{b.warehouseName}</td>
                      <td className="p-3.5 text-right font-mono font-bold">
                        {b.quantity} units
                      </td>
                      <td className="p-3.5 font-mono">{b.manufacturingDate}</td>
                      <td className="p-3.5 font-mono">{b.expiryDate}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] rounded-full font-bold">
                          Traceable
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MANUAL ADJUSTMENTS */}
      {activeTab === "adjustments" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleApplyAdjustment}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm md:col-span-5 space-y-4 text-xs"
          >
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-50 pb-2">
              Manual Inventory Correction
            </h4>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Select Garment SKU
              </label>
              <select
                required
                value={adjustingId}
                onChange={(e) => setAdjustingId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700 outline-none"
              >
                <option value="">Select Item...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Adjustment Mode
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAdjustType("Add")}
                    className={`w-full py-1.5 text-xs font-bold rounded-lg ${adjustType === "Add" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"}`}
                  >
                    Stock In (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("Remove")}
                    className={`w-full py-1.5 text-xs font-bold rounded-lg ${adjustType === "Remove" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"}`}
                  >
                    Stock Out (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Quantity Offset
                </label>
                <input
                  type="number"
                  min={1}
                  value={adjustAmount}
                  onChange={(e) =>
                    setAdjustAmount(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Reason / Reference *
              </label>
              <input
                required
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Replenishment, Damaged on floor, QC fail..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 cursor-pointer shadow-xs"
            >
              Apply Stock Correction
            </button>
          </form>

          <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 md:col-span-7 space-y-4 font-mono text-xs">
            <h4 className="text-xs font-bold tracking-wider text-indigo-400 uppercase">
              Interactive Stock Simulator
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              This ledger directly triggers the physical stock adjustments.
              Altering stock quantities impacts overall COGS valuation, balance
              sheet equations, and triggers real-time webhook broadcasts to
              e-commerce storefront channels (such as Shopify & WooCommerce
              bridges).
            </p>
            <div className="border-t border-slate-800 pt-3">
              <span className="text-[10px] text-slate-500 block mb-1">
                Active Channel Targets:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Shopify status</span>
                  <span className="text-emerald-400 font-bold">
                    ✓ AUTO SYNC ACTIVE
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">
                    WooCommerce status
                  </span>
                  <span className="text-amber-500 font-bold">⚠ OFFLINE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: STOCK TRANSFERS */}
      {activeTab === "transfers" && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Stock Transfer Registers (TO)
              </h3>
              <p className="text-[11px] text-slate-400">
                Reconcile internal stock dispatchments between retail depots.
              </p>
            </div>
            <button
              onClick={() => setShowTransferModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Initiate Transfer</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Ref ID</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Garment SKU</th>
                    <th className="p-3.5">Source Depot</th>
                    <th className="p-3.5">Destination Depot</th>
                    <th className="p-3.5 text-right">Transfer Qty</th>
                    <th className="p-3.5 text-center">Dispatch Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {transfers.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono font-bold text-indigo-600">
                        {t.referenceNo}
                      </td>
                      <td className="p-3.5 font-mono">{t.timestamp}</td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {t.productName}
                      </td>
                      <td className="p-3.5">{t.sourceWarehouseName}</td>
                      <td className="p-3.5">{t.destWarehouseName}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        {t.quantity} items
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.status === "Completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: STOCK RETURNS */}
      {activeTab === "returns" && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Stock Return Bookings
              </h3>
              <p className="text-[11px] text-slate-400">
                Record stock dispatches back to suppliers (damages) or customer
                rollbacks.
              </p>
            </div>
            <button
              onClick={() => setShowReturnModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Undo2 className="w-4 h-4" />
              <span>Log Return</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Log ID</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Garment SKU</th>
                    <th className="p-3.5">Return Channel</th>
                    <th className="p-3.5">Partner Entity</th>
                    <th className="p-3.5">Reason for Action</th>
                    <th className="p-3.5 text-right">Returned Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {returns.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono font-bold text-indigo-600">
                        {r.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="p-3.5 font-mono">{r.timestamp}</td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {r.productName}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${r.type === "Vendor Return" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
                        >
                          {r.type}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        {r.partnerName}
                      </td>
                      <td className="p-3.5 text-slate-500">{r.reason}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        {r.quantity} pcs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: STOCK AUDITS */}
      {activeTab === "audits" && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Physical Inventory Audits
              </h3>
              <p className="text-[11px] text-slate-400">
                Conduct barcode audits and reconcile count discrepancies with
                physical catalog.
              </p>
            </div>
            <button
              onClick={() => setShowAuditModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Record Audit Sheet</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Audit Date</th>
                    <th className="p-3.5">Warehouse Depot</th>
                    <th className="p-3.5">Garment SKU</th>
                    <th className="p-3.5 text-right">System Stock</th>
                    <th className="p-3.5 text-right">Physical Count</th>
                    <th className="p-3.5 text-right">Variance</th>
                    <th className="p-3.5">Auditor</th>
                    <th className="p-3.5">Notes</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {audits.map((a, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono">{a.timestamp}</td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {a.warehouseName}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        {a.productName}
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        {a.systemStock}
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        {a.physicalStock}
                      </td>
                      <td
                        className={`p-3.5 text-right font-mono font-bold ${a.variance === 0 ? "text-emerald-600" : a.variance > 0 ? "text-teal-600" : "text-red-500"}`}
                      >
                        {a.variance > 0 ? `+${a.variance}` : a.variance}
                      </td>
                      <td className="p-3.5">{a.auditor}</td>
                      <td className="p-3.5 max-w-xs truncate">{a.notes}</td>
                      <td className="p-3.5 text-center">
                        {a.status === "Pending Review" ? (
                          <button
                            onClick={() =>
                              handleApplyAuditReconciliation(
                                a.id,
                                a.productId,
                                a.variance,
                              )
                            }
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[10px] uppercase cursor-pointer"
                          >
                            Reconcile System
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] rounded font-bold uppercase">
                            Reconciled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MOVEMENT HISTORY LOGS */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Dynamic Stock Telemetry Log
            </h4>
            <button
              onClick={() => handleExportCSV("History Logs")}
              className="text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Export Log
            </button>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Garment Item</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3 text-center">Qty Offset</th>
                  <th className="p-3">Source Facility</th>
                  <th className="p-3">Target / Dest</th>
                  <th className="p-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {getCompiledMovementLogs().map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-[10px] text-slate-400">
                      {log.timestamp}
                    </td>
                    <td className="p-3 text-slate-800 font-semibold">
                      {log.productName}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          log.type === "IN" || log.type === "C-RET"
                            ? "bg-emerald-50 text-emerald-600"
                            : log.type === "OUT" || log.type === "V-RET"
                              ? "bg-indigo-50 text-indigo-600"
                              : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td
                      className={`p-3 text-center font-bold font-mono ${log.quantity > 0 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                    </td>
                    <td className="p-3 text-slate-500">{log.source}</td>
                    <td className="p-3 text-slate-500">{log.dest}</td>
                    <td className="p-3 font-mono font-bold text-indigo-500 text-[10px]">
                      {log.reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================== MODALS ===================================== */}

      {/* WAREHOUSE CRUD MODAL */}
      {showWarehouseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl animate-fade-in">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {editingWarehouse
                ? "Edit Warehouse Depot"
                : "Add Logistics Facility"}
            </h3>
            <form onSubmit={handleWarehouseSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Facility Name
                </label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="e.g. Bandra Central Warehouse"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Physical Location Address
                </label>
                <input
                  type="text"
                  required
                  value={whLocation}
                  onChange={(e) => setWhLocation(e.target.value)}
                  placeholder="e.g. BKC, Mumbai"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Depot Manager
                  </label>
                  <input
                    type="text"
                    required
                    value={whManager}
                    onChange={(e) => setWhManager(e.target.value)}
                    placeholder="e.g. Sachin Pilot"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Capacity Load
                  </label>
                  <select
                    value={whCapacity}
                    onChange={(e) => setWhCapacity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    <option>10%</option>
                    <option>30%</option>
                    <option>50%</option>
                    <option>70%</option>
                    <option>90%</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH REGISTRATION MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Register Production Batch
            </h3>
            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Batch Code (Unique)
                </label>
                <input
                  type="text"
                  required
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  placeholder="e.g. BAT-2026-X11"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Link Product SKU
                </label>
                <select
                  required
                  value={batchProductId}
                  onChange={(e) => setBatchProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                >
                  <option value="">Select Item...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Batch Yield Qty
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={batchQty}
                    onChange={(e) => setBatchQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Storage Depot
                  </label>
                  <select
                    value={batchWhId}
                    onChange={(e) => setBatchWhId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Manufacturing Date
                  </label>
                  <input
                    type="date"
                    required
                    value={batchMfgDate}
                    onChange={(e) => setBatchMfgDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={batchExpDate}
                    onChange={(e) => setBatchExpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
                >
                  Register Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Initiate Internal Depot Transfer
            </h3>
            <form onSubmit={handleInitiateTransfer} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Garment Item SKU
                </label>
                <select
                  required
                  value={xferProductId}
                  onChange={(e) => setXferProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                >
                  <option value="">Select Item...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Available: {p.stock} units)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Source Depot
                  </label>
                  <select
                    value={xferSourceWhId}
                    onChange={(e) => setXferSourceWhId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Destination Depot
                  </label>
                  <select
                    value={xferDestWhId}
                    onChange={(e) => setXferDestWhId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Transfer Qty
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={xferQty}
                    onChange={(e) => setXferQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Reference TO Number
                  </label>
                  <input
                    type="text"
                    value={xferRef}
                    onChange={(e) => setXferRef(e.target.value)}
                    placeholder="e.g. TO-20261182"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
                >
                  Dispatch Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK RETURN MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Register Stock Return Dispatch
            </h3>
            <form onSubmit={handleCreateReturn} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Return Channel Type
                  </label>
                  <select
                    value={retType}
                    onChange={(e) => setRetType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    <option value="Vendor Return">
                      Vendor Return (Stock Out)
                    </option>
                    <option value="Customer Return">
                      Customer Return (Stock In)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Partner Entity Name
                  </label>
                  <input
                    type="text"
                    required
                    value={retPartner}
                    onChange={(e) => setRetPartner(e.target.value)}
                    placeholder="e.g. Supplier / Buyer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Garment Item SKU
                </label>
                <select
                  required
                  value={retProductId}
                  onChange={(e) => setRetProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                >
                  <option value="">Select Item...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Available: {p.stock})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Quantity
                  </label>
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
                  <label className="block text-slate-400 font-semibold mb-1">
                    QC/Return Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={retReason}
                    onChange={(e) => setRetReason(e.target.value)}
                    placeholder="e.g. Size variance, QC tear..."
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
                >
                  Process Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHYSICAL AUDIT RECORD MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Record Physical Stock Audit
            </h3>
            <form onSubmit={handleInitiateAudit} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Warehouse Facility Audited
                </label>
                <select
                  value={auditWhId}
                  onChange={(e) => setAuditWhId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Target Garment Product
                </label>
                <select
                  required
                  value={auditProductId}
                  onChange={(e) => setAuditProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                >
                  <option value="">Select Item...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Expected: {p.stock} units)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Actual Physical Count
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={auditPhysicalStock}
                    onChange={(e) =>
                      setAuditPhysicalStock(Number(e.target.value))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Auditor Registered Name
                  </label>
                  <input
                    type="text"
                    required
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Audit Log Notes & Discrepancy Findings
                </label>
                <input
                  type="text"
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="e.g. Found damp packaging in Row B, correct mismatch..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
                >
                  Record Findings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

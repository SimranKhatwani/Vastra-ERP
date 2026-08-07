import api from '../api/axios';
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
  products = [],
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
      code: "WH-BND-01",
      location: "Bandra Kurla Complex, Mumbai",
      manager: "Sachin Pilot",
      phone: "9876543210",
      email: "bandra@vastraerp.com",
      capacity: "78%",
      totalGarments: 4500,
    },
    {
      id: "w-2",
      name: "Colaba Retail Godown",
      code: "WH-COL-02",
      location: "Colaba Causeway, Mumbai",
      manager: "Suniel Shetty",
      phone: "9812345678",
      email: "colaba@vastraerp.com",
      capacity: "42%",
      totalGarments: 1200,
    },
    {
      id: "w-3",
      name: "Thane Logistics Depot",
      code: "WH-THA-03",
      location: "Wagle Estate, Thane",
      manager: "Bobby Deol",
      phone: "9834567890",
      email: "thane@vastraerp.com",
      capacity: "91%",
      totalGarments: 8900,
    },
  ]);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [whName, setWhName] = useState("");
  const [whCode, setWhCode] = useState("");
  const [whLocation, setWhLocation] = useState("");
  const [whManager, setWhManager] = useState("");
  const [whPhone, setWhPhone] = useState("");
  const [whEmail, setWhEmail] = useState("");
  const [whCapacity, setWhCapacity] = useState("50%");

  // Warehouse detailed dashboard drilldown states
  const [selectedWarehouseDetail, setSelectedWarehouseDetail] = useState(null);
  const [warehouseSubTab, setWarehouseSubTab] = useState("general");
  const [selectedActivityTab, setSelectedActivityTab] = useState("received");
  const [selectedReportTab, setSelectedReportTab] = useState("summary");

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
      status: "Completed",
    },
  ]);

  // Dynamic MongoDB movement logs states
  const [dbMovements, setDbMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementsError, setMovementsError] = useState(null);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [movementsPages, setMovementsPages] = useState(1);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsLimit, setMovementsLimit] = useState(10);
  const [movementsSort, setMovementsSort] = useState("-createdAt");
  const [movementsSearch, setMovementsSearch] = useState("");
  const [movementsFilterType, setMovementsFilterType] = useState("");
  const [movementsFilterActivity, setMovementsFilterActivity] = useState("");
  const [movementsFilterWarehouse, setMovementsFilterWarehouse] = useState("");
  const [movementsFilterProduct, setMovementsFilterProduct] = useState("");

  const fetchMovements = React.useCallback(async () => {
    setMovementsLoading(true);
    setMovementsError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMovementsError("Authentication required.");
        setMovementsLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: movementsPage,
        limit: movementsLimit,
        sort: movementsSort,
        search: movementsSearch,
        movementType: movementsFilterType,
        activity: movementsFilterActivity,
        warehouseId: movementsFilterWarehouse,
        productId: movementsFilterProduct
      });

      const res = await api.get(`/inventory-movements?${params.toString()}`);

      const json = res.data;
      if (json.success) {
        setDbMovements(json.data || []);
        setMovementsTotal(json.total || 0);
        setMovementsPages(json.pages || 1);
      } else {
        setMovementsError(json.message || "Failed to load movement logs.");
      }
    } catch (err) {
      setMovementsError(err.message || "Connection failure to api server.");
    } finally {
      setMovementsLoading(false);
    }
  }, [
    movementsPage,
    movementsLimit,
    movementsSort,
    movementsSearch,
    movementsFilterType,
    movementsFilterActivity,
    movementsFilterWarehouse,
    movementsFilterProduct
  ]);

  React.useEffect(() => {
    if (activeTab === "logs") {
      fetchMovements();
    }
  }, [activeTab, fetchMovements]);

  const logMovementToBackend = async (data) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.post(`/inventory-movements`, data);
      // Trigger fetch refresh
      fetchMovements();
    } catch (err) {
      console.error("Failed to log movement to backend:", err.message);
    }
  };

  // Dynamic MongoDB Batches states
  const [dbBatches, setDbBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState(null);
  const [selectedBatchDetail, setSelectedBatchDetail] = useState(null);
  const [batchesSearch, setBatchesSearch] = useState("");
  const [batchesFilterStatus, setBatchesFilterStatus] = useState("");

  const fetchBatches = React.useCallback(async () => {
    setBatchesLoading(true);
    setBatchesError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setBatchesError("Authentication required.");
        setBatchesLoading(false);
        return;
      }
      const params = new URLSearchParams({
        search: batchesSearch,
        status: batchesFilterStatus
      });
      const res = await api.get(`/batches?${params.toString()}`);
      const json = res.data;
      if (json.success) {
        setDbBatches(json.data || []);
      } else {
        setBatchesError(json.message || "Failed to load batches.");
      }
    } catch (err) {
      setBatchesError(err.message || "Connection failure to api server.");
    } finally {
      setBatchesLoading(false);
    }
  }, [batchesSearch, batchesFilterStatus]);

  React.useEffect(() => {
    if (activeTab === "batches") {
      fetchBatches();
    }
  }, [activeTab, fetchBatches]);

  // States for batch workspace actions modals
  const [showBarcodePrint, setShowBarcodePrint] = useState(false);
  const [showLabelPrint, setShowLabelPrint] = useState(false);
  const [showBatchHistory, setShowBatchHistory] = useState(false);
  const [batchHistoryLogs, setBatchHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Approve QC Handler
  const handleApproveQC = async () => {
    if (!selectedBatchDetail) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/batches/${selectedBatchDetail._id}`, { status: "QC" });
      const json = res.data;
      if (json.success) {
        setSelectedBatchDetail(json.data);
        onAddNotification("QC Approved", `Batch ${selectedBatchDetail.batchNo} status updated to QC verification.`, "success");
        fetchBatches();
      } else {
        onAddNotification("Update Failed", json.message, "danger");
      }
    } catch (err) {
      onAddNotification("Connection Error", err.message, "danger");
    }
  };

  // View Batch History Handler
  const handleViewBatchHistory = async () => {
    if (!selectedBatchDetail) return;
    setShowBatchHistory(true);
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem("token");
      const prodId = selectedBatchDetail.productId?._id || selectedBatchDetail.productId;
      const res = await api.get(`/inventory-movements?productId=${prodId}`);
      const json = res.data;
      if (json.success) {
        setBatchHistoryLogs(json.data || []);
      } else {
        setBatchHistoryLogs([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Reserve Stock Handler
  const handleReserveBatchStock = async () => {
    if (!selectedBatchDetail) return;
    const amountStr = prompt(`Enter quantity to reserve (Available: ${selectedBatchDetail.availableQty}):`, "10");
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }
    if (amount > selectedBatchDetail.availableQty) {
      alert(`Cannot reserve ${amount} units. Only ${selectedBatchDetail.availableQty} available.`);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const newAvail = selectedBatchDetail.availableQty - amount;
      const newReserved = (selectedBatchDetail.reservedQty || 0) + amount;
      const res = await api.put(`/batches/${selectedBatchDetail._id}`, {
          availableQty: newAvail,
          reservedQty: newReserved,
          status: newAvail === 0 ? "Reserved" : selectedBatchDetail.status
        });
      const json = res.data;
      if (json.success) {
        setSelectedBatchDetail(json.data);
        onAdjustStock(selectedBatchDetail.productId?._id || selectedBatchDetail.productId, -amount, "MATERIAL_ISSUE", "Reserve Allocation", selectedBatchDetail.batchNo, `Reserved ${amount} units from batch`);
        onAddNotification("Stock Reserved", `Successfully allocated ${amount} units of batch ${selectedBatchDetail.batchNo} to reserve.`, "success");
        fetchBatches();
      } else {
        onAddNotification("Allocation Failed", json.message, "danger");
      }
    } catch (err) {
      onAddNotification("Connection Error", err.message, "danger");
    }
  };

  // ========== MULTI-LOCATION INVENTORY STATES ==========
  const [locTransfers, setLocTransfers] = useState([]);
  const [locTransfersLoading, setLocTransfersLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [tfSourceId, setTfSourceId] = useState("w-1");
  const [tfDestId, setTfDestId] = useState("w-2");
  const [tfProductId, setTfProductId] = useState("");
  const [tfQty, setTfQty] = useState(20);
  const [tfRemarks, setTfRemarks] = useState("");

  const locations = React.useMemo(() => {
    return warehouses.map((w) => {
      let totalProducts = 0;
      let stockValue = 0;
      let availableStock = 0;
      let reservedStock = 0;
      let lowStockCount = 0;

      products.forEach((p, idx) => {
        let qty = 0;
        if (w.id === "w-1" || w.id.toString().includes("w-1")) {
          qty = idx % 2 === 0 ? Math.floor(p.stock * 0.6) : 0;
        } else if (w.id === "w-2" || w.id.toString().includes("w-2")) {
          qty = idx % 2 === 1 ? Math.floor(p.stock * 0.3) : 0;
        } else {
          qty = Math.floor(p.stock * 0.4);
        }
        if (qty === 0 && p.stock > 0) qty = Math.floor(p.stock * 0.2) || 1;
        if (qty > 0) {
          totalProducts++;
          const reserved = Math.floor(qty * 0.1);
          const available = qty - reserved;
          stockValue += qty * (p.price || 500);
          availableStock += available;
          reservedStock += reserved;
          if (available <= 10) lowStockCount++;
        }
      });

      const inTransit = locTransfers
        .filter(t => (t.destinationLocationId === w.id && t.status === "In Transit") || (t.sourceLocationId === w.id && t.status === "Dispatched"))
        .reduce((sum, t) => sum + t.quantity, 0);

      return {
        ...w,
        totalProducts,
        stockValue,
        availableStock,
        reservedStock,
        lowStockCount,
        inTransit
      };
    });
  }, [warehouses, products, locTransfers]);

  const locationProductStock = React.useMemo(() => {
    if (!selectedLocation) return [];
    return products.map((p, idx) => {
      let qty = 0;
      if (selectedLocation.id === "w-1" || selectedLocation.id.toString().includes("w-1")) {
        qty = idx % 2 === 0 ? Math.floor(p.stock * 0.6) : 0;
      } else if (selectedLocation.id === "w-2" || selectedLocation.id.toString().includes("w-2")) {
        qty = idx % 2 === 1 ? Math.floor(p.stock * 0.3) : 0;
      } else {
        qty = Math.floor(p.stock * 0.4);
      }
      if (qty === 0 && p.stock > 0) qty = Math.floor(p.stock * 0.2) || 1;
      if (qty <= 0) return null;
      const reserved = Math.floor(qty * 0.1);
      const available = qty - reserved;
      const inTransit = locTransfers
        .filter(t => t.productId?._id === p.id && t.destinationLocationId === selectedLocation.id && t.status === "In Transit")
        .reduce((sum, t) => sum + t.quantity, 0);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku || "N/A",
        batch: `BAT-2026-00${(idx % 3) + 1}`,
        available,
        reserved,
        inTransit,
        lastUpdated: new Date().toLocaleDateString()
      };
    }).filter(Boolean);
  }, [selectedLocation, products, locTransfers]);

  const locStats = React.useMemo(() => {
    const totalLocations = locations.length;
    const totalStock = locations.reduce((s, l) => s + l.availableStock + l.reservedStock, 0);
    const stockInTransit = locTransfers.filter(t => ["Dispatched", "In Transit"].includes(t.status)).reduce((s, t) => s + t.quantity, 0);
    const pendingTransfers = locTransfers.filter(t => t.status === "Requested" || t.status === "Approved").length;
    const lowStockLocations = locations.filter(l => l.lowStockCount > 0).length;
    return { totalLocations, totalStock, stockInTransit, pendingTransfers, lowStockLocations };
  }, [locations, locTransfers]);

  const fetchLocTransfers = React.useCallback(async () => {
    setLocTransfersLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/location-transfers`);
      const json = res.data;
      if (json.success) setLocTransfers(json.data || []);
    } catch (err) {
      console.error("Failed to fetch transfers:", err);
    } finally {
      setLocTransfersLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === "locations") {
      fetchLocTransfers();
    }
  }, [activeTab, fetchLocTransfers]);

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!tfProductId) {
      alert("Please select a product to transfer.");
      return;
    }
    const srcW = warehouses.find(w => w.id === tfSourceId);
    const dstW = warehouses.find(w => w.id === tfDestId);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/location-transfers`, {
          sourceLocationId: tfSourceId,
          sourceLocationName: srcW?.name || tfSourceId,
          destinationLocationId: tfDestId,
          destinationLocationName: dstW?.name || tfDestId,
          productId: tfProductId,
          quantity: tfQty,
          remarks: tfRemarks
        });
      const json = res.data;
      if (json.success) {
        onAddNotification("Transfer Created", `Transfer ${json.data.transferNo} has been requested.`, "success");
        setShowTransferModal(false);
        setTfRemarks("");
        fetchLocTransfers();
      } else {
        onAddNotification("Error", json.message, "danger");
      }
    } catch (err) {
      onAddNotification("Connection Error", err.message, "danger");
    }
  };

  const handleUpdateTransferStatus = async (transferId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/location-transfers/${transferId}/status`, { status: newStatus });
      const json = res.data;
      if (json.success) {
        onAddNotification("Status Updated", `Transfer updated to "${newStatus}".`, "success");
        fetchLocTransfers();
      } else {
        onAddNotification("Error", json.message, "danger");
      }
    } catch (err) {
      onAddNotification("Connection Error", err.message, "danger");
    }
  };

  const locLowStockAlerts = React.useMemo(() => {
    const alerts = [];
    locations.forEach(loc => {
      products.forEach((p, idx) => {
        let qty = 0;
        if (loc.id === "w-1" || loc.id.toString().includes("w-1")) {
          qty = idx % 2 === 0 ? Math.floor(p.stock * 0.6) : 0;
        } else if (loc.id === "w-2" || loc.id.toString().includes("w-2")) {
          qty = idx % 2 === 1 ? Math.floor(p.stock * 0.3) : 0;
        } else {
          qty = Math.floor(p.stock * 0.4);
        }
        if (qty === 0 && p.stock > 0) qty = Math.floor(p.stock * 0.2) || 1;
        if (qty > 0 && qty <= 10) {
          alerts.push({ locationName: loc.name, locationId: loc.id, productName: p.name, productId: p.id, available: qty });
        }
      });
    });
    return alerts;
  }, [locations, products]);

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
      setWhCode(wh.code || "");
      setWhLocation(wh.location);
      setWhManager(wh.manager);
      setWhPhone(wh.phone || "");
      setWhEmail(wh.email || "");
      setWhCapacity(wh.capacity);
    } else {
      setEditingWarehouse(null);
      setWhName("");
      setWhCode("");
      setWhLocation("");
      setWhManager("");
      setWhPhone("");
      setWhEmail("");
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
              code: whCode,
              location: whLocation,
              manager: whManager,
              phone: whPhone,
              email: whEmail,
              capacity: whCapacity,
            }
            : w,
        ),
      );
      // Also update selectedWarehouseDetail if active to sync updates
      if (selectedWarehouseDetail && selectedWarehouseDetail.id === editingWarehouse.id) {
        setSelectedWarehouseDetail({
          ...selectedWarehouseDetail,
          name: whName,
          code: whCode,
          location: whLocation,
          manager: whManager,
          phone: whPhone,
          email: whEmail,
          capacity: whCapacity,
        });
      }
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
        code: whCode || `WH-${whName.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 90) + 10}`,
        location: whLocation,
        manager: whManager,
        phone: whPhone || "9876543210",
        email: whEmail || `${whName.toLowerCase().replace(/\s+/g, '')}@vastraerp.com`,
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

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!batchNo || !batchProductId || batchQty <= 0) return;

    const targetProduct = products.find((p) => p._id === batchProductId || p.id === batchProductId);
    const targetWh = warehouses.find((w) => w.id === batchWhId);
    if (!targetProduct || !targetWh) return;

    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/batches`, {
          batchNo,
          productId: targetProduct._id || targetProduct.id,
          warehouseId: batchWhId,
          purchaseQty: batchQty,
          availableQty: batchQty,
          costPrice: targetProduct.purchasePrice || 0,
          sellingPrice: targetProduct.sellingPrice || 0,
          mrp: targetProduct.mrp || 0,
          status: "Available",
          remarks: "Manual batch entry registration"
        });
      const json = res.data;
      if (json.success) {
        onAdjustStock(targetProduct._id || targetProduct.id, batchQty, "FINISHED_GOODS_RECEIVED", "Batch Registration", batchNo, `Batch registration with ${batchQty} units`);
        onAddNotification(
          "Batch Registered",
          `Logged textile production batch ${batchNo} with ${batchQty} items inside ${targetWh.name}.`,
          "success",
        );
        setShowBatchModal(false);
        setBatchNo("");
        setBatchProductId("");
        setBatchQty(50);
        fetchBatches();
      } else {
        onAddNotification("Registration Failed", json.message, "danger");
      }
    } catch (err) {
      onAddNotification("Connection Error", err.message, "danger");
    }
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

    // Log TRANSFER OUT
    logMovementToBackend({
      productId: xferProductId,
      movementType: "OUTBOUND",
      activity: "STOCK_TRANSFER",
      quantity: xferQty,
      warehouseId: xferSourceWhId,
      warehouseName: srcWh.name,
      sourceLocation: srcWh.name,
      destinationLocation: dstWh.name,
      referenceType: "Transfer",
      referenceNumber: newXfer.referenceNo,
      remarks: `Transfer out from ${srcWh.name} to ${dstWh.name}`
    });

    // Log TRANSFER IN
    logMovementToBackend({
      productId: xferProductId,
      movementType: "INBOUND",
      activity: "STOCK_TRANSFER",
      quantity: xferQty,
      warehouseId: xferDestWhId,
      warehouseName: dstWh.name,
      sourceLocation: srcWh.name,
      destinationLocation: dstWh.name,
      referenceType: "Transfer",
      referenceNumber: newXfer.referenceNo,
      remarks: `Transfer in to ${dstWh.name} from ${srcWh.name}`
    });

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
    onAdjustStock(retProductId, adjustmentDelta, "RETURN", "Return", `RET-${newReturn.id.slice(-5)}`, `${retType} filed: ${retReason}. Partner: ${retPartner}`);

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
      onAdjustStock(productId, variance, "ADJUSTMENT", "Inventory Audit", `AUD-${id.slice(-5)}`, "Audit discrepancy reconciliation adjustment");
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

    onAdjustStock(adjustingId, delta, "ADJUSTMENT", "Stock Adjustment", `ADJ-${Date.now().toString().slice(-6)}`, adjustReason);
    onAddNotification(
      "Stock Ledger Adjusted",
      `Manually ${adjustType === "Add" ? "added" : "subtracted"} ${adjustAmount} units of ${matchedProd.name}. Reason: ${adjustReason}`,
      "success",
    );
    setAdjustingId("");
    setAdjustAmount(10);
  };

  const lowStockAlerts = (products || []).filter((p) => p && (Number(p.stock || 0) <= Number(p.minStockAlert || 0)));

  // Search & Filter
  const filteredProducts = (products || []).filter((p) => {
    if (!p) return false;
    const query = String(searchQuery || "").toLowerCase();
    const nameStr = String(p.name || p.productName || "").toLowerCase();
    const skuStr = String(p.sku || p.productCode || p.itemCode || "").toLowerCase();
    const categoryStr = String(p.category || "").toLowerCase();
    return (
      nameStr.includes(query) ||
      skuStr.includes(query) ||
      categoryStr.includes(query)
    );
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

  // Dynamic warehouse stock distribution
  const warehouseStock = React.useMemo(() => {
    if (!selectedWarehouseDetail) return [];
    return products.map((p, idx) => {
      let qty = 0;
      if (selectedWarehouseDetail.id === "w-1" || selectedWarehouseDetail.id.toString().includes("w-1")) {
        qty = idx % 2 === 0 ? Math.floor(p.stock * 0.6) : 0;
      } else if (selectedWarehouseDetail.id === "w-2" || selectedWarehouseDetail.id.toString().includes("w-2")) {
        qty = idx % 2 === 1 ? Math.floor(p.stock * 0.3) : 0;
      } else {
        qty = Math.floor(p.stock * 0.4);
      }
      if (qty === 0 && p.stock > 0) {
        qty = Math.floor(p.stock * 0.2) || 1;
      }
      const reserved = Math.floor(qty * 0.1);
      const available = qty - reserved;
      return {
        productName: p.name,
        sku: p.sku || "N/A",
        batch: `BAT-2026-00${(idx % 3) + 1}`,
        qty,
        reserved,
        available,
        rack: `RCK-${String.fromCharCode(65 + (idx % 4))}`,
        shelf: `SHLF-${(idx % 3) + 1}`
      };
    }).filter(item => item.qty > 0);
  }, [selectedWarehouseDetail, products]);

  // Dynamic warehouses stock sums
  const computedWarehouses = React.useMemo(() => {
    return warehouses.map((w) => {
      let sum = 0;
      products.forEach((p, idx) => {
        let qty = 0;
        if (w.id === "w-1" || w.id.toString().includes("w-1")) {
          qty = idx % 2 === 0 ? Math.floor(p.stock * 0.6) : 0;
        } else if (w.id === "w-2" || w.id.toString().includes("w-2")) {
          qty = idx % 2 === 1 ? Math.floor(p.stock * 0.3) : 0;
        } else {
          qty = Math.floor(p.stock * 0.4);
        }
        if (qty === 0 && p.stock > 0) {
          qty = Math.floor(p.stock * 0.2) || 1;
        }
        sum += qty;
      });
      return {
        ...w,
        totalGarments: sum,
        capacity: Math.min(99, Math.max(10, Math.round((sum / 12000) * 100))) + "%"
      };
    });
  }, [warehouses, products]);

  const selectedWarehouseTotalGarments = React.useMemo(() => {
    if (!selectedWarehouseDetail) return 0;
    const match = computedWarehouses.find(w => w.id === selectedWarehouseDetail.id);
    return match ? match.totalGarments : selectedWarehouseDetail.totalGarments;
  }, [selectedWarehouseDetail, computedWarehouses]);

  const selectedWarehouseCapacity = React.useMemo(() => {
    if (!selectedWarehouseDetail) return "50%";
    const match = computedWarehouses.find(w => w.id === selectedWarehouseDetail.id);
    return match ? match.capacity : selectedWarehouseDetail.capacity;
  }, [selectedWarehouseDetail, computedWarehouses]);

  const batchStats = React.useMemo(() => {
    let total = dbBatches.length;
    let active = dbBatches.filter(b => b.status !== "Closed").length;
    let closed = dbBatches.filter(b => b.status === "Closed").length;
    let totalValue = dbBatches.reduce((acc, b) => acc + (b.availableQty * b.costPrice), 0);
    let reserved = dbBatches.reduce((acc, b) => acc + (b.reservedQty || 0), 0);
    let lowStock = dbBatches.filter(b => b.availableQty <= 10 && b.status !== "Closed").length;
    return { total, active, closed, totalValue, reserved, lowStock };
  }, [dbBatches]);

  // Mock activities filtered by selected warehouse
  const warehouseActivities = React.useMemo(() => {
    if (!selectedWarehouseDetail) return { received: [], issued: [], transfers: [], adjustments: [], audits: [] };

    // Inbound Stock Received
    const received = [
      { date: "2026-07-15 10:30", product: "Raymond Executive Linen Shirt", sku: "RAY-SHIRT-W", batch: "BAT-2026-001", qty: 100, supplier: "Pratibha Syntex Ltd", status: "Completed" },
      { date: "2026-07-18 14:20", product: "Biba Festive Floral Saree", sku: "BIBA-SAREE-R", batch: "BAT-2026-003", qty: 50, supplier: "Bahl Garments", status: "Completed" },
      { date: "2026-07-20 09:15", product: "Zara Slim Fit Denim Jeans", sku: "ZARA-JEANS-B", batch: "BAT-2026-002", qty: 80, supplier: "Reliance Retail Hub", status: "In Transit" }
    ];

    // Outbound Stock Issued
    const issued = [
      { date: "2026-07-16 11:45", product: "Raymond Executive Linen Shirt", sku: "RAY-SHIRT-W", qty: 12, invoice: "INV-2026-1024", customer: "Aditya", status: "Shipped" },
      { date: "2026-07-19 16:30", product: "Zara Slim Fit Denim Jeans", sku: "ZARA-JEANS-B", qty: 25, invoice: "INV-2026-1025", customer: "Yash", status: "Completed" },
      { date: "2026-07-20 10:10", product: "Raymond Custom Fit Chino", sku: "RAY-CHINO-K", qty: 8, invoice: "INV-2026-1026", customer: "Vikas", status: "Processing" }
    ];

    // Transfers
    const activeTransfers = transfers.filter(t =>
      t.sourceWarehouseId === selectedWarehouseDetail.id || t.destWarehouseId === selectedWarehouseDetail.id
    );

    // Adjustments
    const activeAdjustments = [
      { date: "2026-07-14 15:00", product: "Raymond Custom Fit Chino", qty: -2, type: "Wastage", reason: "Fabric color bleeding", user: "Vijay Shekhar" },
      { date: "2026-07-17 11:30", product: "Zara Slim Fit Denim Jeans", qty: 15, type: "Replenishment", reason: "Direct purchase order", user: "Bobby Deol" }
    ];

    // Audits
    const activeAudits = audits.filter(a => a.warehouseId === selectedWarehouseDetail.id);

    return { received, issued, transfers: activeTransfers, adjustments: activeAdjustments, audits: activeAudits };
  }, [selectedWarehouseDetail, transfers, audits]);

  // Analytics Reports for selected warehouse
  const warehouseReports = React.useMemo(() => {
    if (!selectedWarehouseDetail || warehouseStock.length === 0) return { valuation: 0, deadStock: [], fastMoving: [], slowMoving: [] };

    // Inventory Valuation
    const valDetails = warehouseStock.map((item, idx) => {
      const prd = products.find(p => p.name === item.productName) || { purchasePrice: 450 };
      const val = item.qty * prd.purchasePrice;
      return {
        ...item,
        cost: prd.purchasePrice,
        valuation: val
      };
    });

    const totalValuation = valDetails.reduce((sum, item) => sum + item.valuation, 0);

    // Fast Moving (top 3 highest qty)
    const fastMoving = [...valDetails].sort((a, b) => b.qty - a.qty).slice(0, 3);

    // Slow Moving (items with qty > 30)
    const slowMoving = [...valDetails].filter(item => item.qty > 30).slice(0, 3);

    // Dead Stock
    const deadStock = valDetails.filter((item, idx) => idx % 3 === 0);

    return { valuation: totalValuation, valDetails, deadStock, fastMoving, slowMoving };
  }, [selectedWarehouseDetail, warehouseStock, products]);

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
              setActiveTab("locations");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "locations" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Multi-Location Inventory
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

      {/* TAB: WAREHOUSES (FULL CRUD & DASHBOARD) */}
      {activeTab === "warehouses" && (
        selectedWarehouseDetail ? (
          // ==================== WAREHOUSE DASHBOARD DRILLDOWN VIEW ====================
          <div className="space-y-6 animate-scale-up text-xs font-semibold text-slate-600">
            {/* Header / Actions Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedWarehouseDetail(null)}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Back to Facilities Directory</span>
                </button>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
                    {selectedWarehouseDetail.name}
                  </h3>
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border border-indigo-200">
                    {selectedWarehouseDetail.code || "WH-BND-01"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <span>Location:</span>
                  <span className="text-slate-600 font-bold">{selectedWarehouseDetail.location}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenWarehouseModal(selectedWarehouseDetail)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Specifications</span>
                </button>
                <button
                  onClick={() => {
                    handleDeleteWarehouse(selectedWarehouseDetail.id, selectedWarehouseDetail.name);
                    setSelectedWarehouseDetail(null);
                  }}
                  className="px-3.5 py-2 bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Decommission Depot</span>
                </button>
              </div>
            </div>

            {/* Dashboard Sub-tabs Row */}
            <div className="bg-slate-100/80 p-1 rounded-xl flex gap-1 w-fit shadow-2xs border border-slate-200/50">
              <button
                onClick={() => setWarehouseSubTab("general")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${warehouseSubTab === "general" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                General Details
              </button>
              <button
                onClick={() => setWarehouseSubTab("stock")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${warehouseSubTab === "stock" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                Warehouse Stock
              </button>
              <button
                onClick={() => setWarehouseSubTab("activities")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${warehouseSubTab === "activities" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                Warehouse Activities
              </button>
              <button
                onClick={() => setWarehouseSubTab("reports")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${warehouseSubTab === "reports" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                Warehouse Reports
              </button>
            </div>

            {/* Sub-tab view viewport */}
            {warehouseSubTab === "general" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Left Card: General specifications */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100">
                    General Warehouse Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <span className="text-slate-400 block">Warehouse Name</span>
                      <span className="text-slate-800 text-sm font-bold block">{selectedWarehouseDetail.name}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 block">Warehouse Code</span>
                      <span className="text-slate-800 font-mono text-sm font-bold block">{selectedWarehouseDetail.code || "WH-BND-01"}</span>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-slate-400 block">Physical Address</span>
                      <span className="text-slate-800 font-bold block">{selectedWarehouseDetail.location}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 block">Contact Person (Manager)</span>
                      <span className="text-indigo-600 font-bold block">{selectedWarehouseDetail.manager}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 block">Contact Phone</span>
                      <span className="text-slate-800 font-mono font-bold block">{selectedWarehouseDetail.phone || "9876543210"}</span>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-slate-400 block">Contact Email Address</span>
                      <span className="text-slate-800 font-mono font-bold block">{selectedWarehouseDetail.email || "bandra@vastraerp.com"}</span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Storage metrics */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100">
                    Logistics Capacity Load
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Current Load capacity</span>
                        <span className="text-indigo-600">{selectedWarehouseCapacity}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: selectedWarehouseCapacity }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-2">
                      <span className="text-slate-400">Total Stored Garments</span>
                      <span className="text-slate-800 font-bold text-sm">
                        {selectedWarehouseTotalGarments.toLocaleString()} units
                      </span>
                    </div>
                    <div className="p-3 bg-indigo-50/50 rounded-xl text-[10px] text-indigo-700 leading-relaxed font-semibold">
                      📦 This depot holds active bulk variants. All inbound supplier stocks are cleared here before POS distribution.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {warehouseSubTab === "stock" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Stock Inventory Ledger Sheet
                  </h4>
                  <button
                    onClick={() => handleExportCSV("Warehouse Stock")}
                    className="p-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-white text-[10px] font-bold flex items-center gap-1 cursor-pointer bg-white"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export Sheet</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="erp-table">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider font-mono">
                        <th className="p-3 font-sans">Product Name</th>
                        <th className="p-3 text-center">SKU</th>
                        <th className="p-3 text-center">Batch</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-center">Reserved</th>
                        <th className="p-3 text-center font-sans">Available</th>
                        <th className="p-3 text-center">Rack</th>
                        <th className="p-3 text-center">Shelf</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {warehouseStock.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/30 font-mono">
                          <td className="p-3 font-sans font-bold text-slate-800">{item.productName}</td>
                          <td className="p-3 text-center text-slate-500">{item.sku}</td>
                          <td className="p-3 text-center font-semibold text-slate-600">{item.batch}</td>
                          <td className="p-3 text-center font-bold text-slate-800">{item.qty}</td>
                          <td className="p-3 text-center text-slate-400">{item.reserved}</td>
                          <td className="p-3 text-center font-bold text-emerald-600">{item.available}</td>
                          <td className="p-3 text-center text-slate-500">{item.rack}</td>
                          <td className="p-3 text-center text-slate-500">{item.shelf}</td>
                        </tr>
                      ))}
                      {warehouseStock.length === 0 && (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-slate-400 font-sans">
                            No product stock currently stored in this depot.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {warehouseSubTab === "activities" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Warehouse Inbound & Outbound Activities Log
                  </h4>
                  {/* Secondary Activity tabs */}
                  <div className="flex flex-wrap gap-1 bg-slate-200/50 p-0.5 rounded-lg border border-slate-200/80">
                    {["received", "issued", "transfer", "adjustment", "audit"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSelectedActivityTab(tab)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-all ${selectedActivityTab === tab ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 font-mono text-[11px] text-slate-600">
                  {selectedActivityTab === "received" && (
                    <div className="overflow-x-auto">
                      <table className="erp-table">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="p-3">Date</th>
                            <th className="p-3 font-sans">Product</th>
                            <th className="p-3 text-center">Batch</th>
                            <th className="p-3 text-center">Qty Recd</th>
                            <th className="p-3 font-sans">Supplier</th>
                            <th className="p-3 text-center font-sans">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {warehouseActivities.received.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/20">
                              <td className="p-3 text-slate-500">{row.date}</td>
                              <td className="p-3 font-sans font-bold text-slate-800">{row.product}</td>
                              <td className="p-3 text-center font-semibold text-slate-600">{row.batch}</td>
                              <td className="p-3 text-center font-bold text-emerald-600">+{row.qty}</td>
                              <td className="p-3 font-sans text-slate-600 font-bold">{row.supplier}</td>
                              <td className="p-3 text-center font-sans">
                                <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase ${row.status === "Completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedActivityTab === "issued" && (
                    <div className="overflow-x-auto">
                      <table className="erp-table">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="p-3">Date</th>
                            <th className="p-3 font-sans">Product</th>
                            <th className="p-3 text-center">Qty Issued</th>
                            <th className="p-3 text-center">Invoice ID</th>
                            <th className="p-3 font-sans">Customer</th>
                            <th className="p-3 text-center font-sans">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {warehouseActivities.issued.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/20">
                              <td className="p-3 text-slate-500">{row.date}</td>
                              <td className="p-3 font-sans font-bold text-slate-800">{row.product}</td>
                              <td className="p-3 text-center font-bold text-red-500">-{row.qty}</td>
                              <td className="p-3 text-center font-semibold text-indigo-600">{row.invoice}</td>
                              <td className="p-3 font-sans text-slate-600 font-bold">{row.customer}</td>
                              <td className="p-3 text-center font-sans">
                                <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase ${row.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
                                  }`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedActivityTab === "transfer" && (
                    <div className="overflow-x-auto">
                      <table className="erp-table">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="p-3">Date</th>
                            <th className="p-3 font-sans">Product</th>
                            <th className="p-3 text-center">Qty</th>
                            <th className="p-3 font-sans">Source Warehouse</th>
                            <th className="p-3 font-sans">Dest Warehouse</th>
                            <th className="p-3 text-center font-sans">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {warehouseActivities.transfers.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/20">
                              <td className="p-3 text-slate-400">{row.timestamp.split(' ')[0]}</td>
                              <td className="p-3 font-sans font-bold text-slate-800">{row.productName}</td>
                              <td className="p-3 text-center font-bold text-indigo-600">{row.quantity}</td>
                              <td className="p-3 font-sans text-slate-500">{row.sourceWarehouseName}</td>
                              <td className="p-3 font-sans text-slate-500">{row.destWarehouseName}</td>
                              <td className="p-3 text-center font-sans">
                                <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase ${row.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                  }`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {warehouseActivities.transfers.length === 0 && (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-400 font-sans">
                                No stock transfer logs matching this warehouse.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedActivityTab === "adjustment" && (
                    <div className="overflow-x-auto">
                      <table className="erp-table">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="p-3">Date</th>
                            <th className="p-3 font-sans">Product</th>
                            <th className="p-3 text-center">Adjustment Qty</th>
                            <th className="p-3 font-sans">Correction Type</th>
                            <th className="p-3 font-sans">Reason</th>
                            <th className="p-3 font-sans">Operator</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {warehouseActivities.adjustments.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/20">
                              <td className="p-3 text-slate-500">{row.date}</td>
                              <td className="p-3 font-sans font-bold text-slate-800">{row.product}</td>
                              <td className={`p-3 text-center font-bold ${row.qty > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {row.qty > 0 ? `+${row.qty}` : row.qty}
                              </td>
                              <td className="p-3 font-sans font-semibold text-slate-600">{row.type}</td>
                              <td className="p-3 font-sans text-slate-500">{row.reason}</td>
                              <td className="p-3 font-sans text-slate-600 font-bold">{row.user}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedActivityTab === "audit" && (
                    <div className="overflow-x-auto">
                      <table className="erp-table">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="p-3">Date</th>
                            <th className="p-3 font-sans">Product</th>
                            <th className="p-3 text-center">System Stock</th>
                            <th className="p-3 text-center">Physical Stock</th>
                            <th className="p-3 text-center">Variance</th>
                            <th className="p-3 font-sans">Auditor</th>
                            <th className="p-3 text-center font-sans">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {warehouseActivities.audits.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/20">
                              <td className="p-3 text-slate-400">{row.timestamp.split(' ')[0]}</td>
                              <td className="p-3 font-sans font-bold text-slate-800">{row.productName}</td>
                              <td className="p-3 text-center">{row.systemStock}</td>
                              <td className="p-3 text-center">{row.physicalStock}</td>
                              <td className={`p-3 text-center font-bold ${row.variance === 0 ? "text-slate-600" : row.variance > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {row.variance === 0 ? `0` : row.variance > 0 ? `+${row.variance}` : row.variance}
                              </td>
                              <td className="p-3 font-sans text-slate-600 font-bold">{row.auditor}</td>
                              <td className="p-3 text-center font-sans">
                                <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase ${row.status === "Adjusted" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                  }`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {warehouseActivities.audits.length === 0 && (
                            <tr>
                              <td colSpan="7" className="p-8 text-center text-slate-400 font-sans">
                                No audit history recorded for this depot facility.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {warehouseSubTab === "reports" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Logistics Analytics & Warehouse Valuation Reports
                  </h4>
                  {/* Secondary Report tabs */}
                  <div className="flex flex-wrap gap-1 bg-slate-200/50 p-0.5 rounded-lg border border-slate-200/80">
                    {[
                      { id: "summary", label: "Stock Summary" },
                      { id: "movement", label: "Stock Movement" },
                      { id: "value", label: "Inventory Value" },
                      { id: "dead_stock", label: "Dead Stock" },
                      { id: "fast_moving", label: "Fast Moving" },
                      { id: "slow_moving", label: "Slow Moving" }
                    ].map((rep) => (
                      <button
                        key={rep.id}
                        onClick={() => setSelectedReportTab(rep.id)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-all ${selectedReportTab === rep.id ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                          }`}
                      >
                        {rep.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  {selectedReportTab === "summary" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-slate-400">Logistics Valuation</span>
                        <span className="text-slate-800 text-base font-extrabold block font-mono">
                          ₹{warehouseReports.valuation.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium block font-sans">Total sum value of stored quantities</span>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-slate-400">Total Unique SKUs</span>
                        <span className="text-slate-800 text-base font-extrabold block font-mono">
                          {warehouseStock.length} SKUs
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium block font-sans">Active catalog variants stored</span>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-slate-400">Depot Utilization</span>
                        <span className="text-indigo-600 text-base font-extrabold block font-mono">
                          {selectedWarehouseDetail.capacity}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium block font-sans">Current space loading coefficient</span>
                      </div>
                    </div>
                  )}

                  {selectedReportTab === "movement" && (
                    <div className="space-y-4 max-w-md">
                      <h5 className="font-bold text-slate-700">Depot Stock Velocity Logs</h5>
                      <div className="space-y-3 font-semibold text-[11px]">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>Inbound flow rate</span>
                            <span className="text-emerald-600">65% (Fast)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: "65%" }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>Outbound flow rate</span>
                            <span className="text-indigo-600">45% (Normal)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full" style={{ width: "45%" }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>Variance / Leakage risk</span>
                            <span className="text-red-500">0.2% (Low)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full" style={{ width: "2%" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedReportTab === "value" && (
                    <div className="overflow-x-auto">
                      <table className="erp-table font-mono">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider font-sans">
                            <th className="p-3">Product</th>
                            <th className="p-3">SKU</th>
                            <th className="p-3 text-center">Cost Price</th>
                            <th className="p-3 text-center">Quantity</th>
                            <th className="p-3 text-right">Valuation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {warehouseReports.valDetails.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/20 font-semibold text-slate-600">
                              <td className="p-3 font-sans font-bold text-slate-800">{row.productName}</td>
                              <td className="p-3 text-slate-500">{row.sku}</td>
                              <td className="p-3 text-center">₹{row.cost}</td>
                              <td className="p-3 text-center text-slate-800">{row.qty}</td>
                              <td className="p-3 text-right text-indigo-600 font-bold">₹{row.valuation.toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50/50 font-bold text-slate-800 font-sans">
                            <td colSpan="3" className="p-3 uppercase">Total valuation</td>
                            <td className="p-3 text-center font-mono">{warehouseStock.reduce((sum, item) => sum + item.qty, 0)} units</td>
                            <td className="p-3 text-right text-indigo-600 text-sm font-mono">₹{warehouseReports.valuation.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedReportTab === "dead_stock" && (
                    <div className="space-y-4 font-mono text-[11px] text-slate-600">
                      <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-xl leading-relaxed text-[11px] font-bold font-sans">
                        ⚠️ The following products have been stored for &gt; 90 days with zero stock velocity or local demand. Consider discount markdown releases:
                      </div>
                      <div className="overflow-x-auto">
                        <table className="erp-table">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider font-sans">
                              <th className="p-3">Product Name</th>
                              <th className="p-3">SKU</th>
                              <th className="p-3 text-center">Days Stored</th>
                              <th className="p-3 text-center">Quantity</th>
                              <th className="p-3 text-right">Capital Blocked</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold">
                            {warehouseReports.deadStock.map((row, idx) => (
                              <tr key={idx} className="hover:bg-red-50/10">
                                <td className="p-3 font-sans font-bold text-slate-800">{row.productName}</td>
                                <td className="p-3 text-slate-500">{row.sku}</td>
                                <td className="p-3 text-center text-slate-500">{120 + (idx * 15)} days</td>
                                <td className="p-3 text-center">{row.qty}</td>
                                <td className="p-3 text-right text-red-600 font-bold">₹{row.valuation.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedReportTab === "fast_moving" && (
                    <div className="space-y-4 font-mono text-[11px] text-slate-600">
                      <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl leading-relaxed text-[11px] font-bold font-sans">
                        🚀 High stock velocity products. Ensure prompt purchase replenishment cycles:
                      </div>
                      <div className="overflow-x-auto">
                        <table className="erp-table">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider font-sans">
                              <th className="p-3">Product Name</th>
                              <th className="p-3">SKU</th>
                              <th className="p-3 text-center font-mono">Qty Stored</th>
                              <th className="p-3 text-center font-sans">Velocity Rank</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold">
                            {warehouseReports.fastMoving.map((row, idx) => (
                              <tr key={idx} className="hover:bg-emerald-50/10">
                                <td className="p-3 font-sans font-bold text-slate-800">{row.productName}</td>
                                <td className="p-3 text-slate-500">{row.sku}</td>
                                <td className="p-3 text-center font-bold text-emerald-600">{row.qty}</td>
                                <td className="p-3 text-center font-sans">
                                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase text-[9px]">
                                    Rank #{idx + 1}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedReportTab === "slow_moving" && (
                    <div className="space-y-4 font-mono text-[11px] text-slate-600">
                      <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl leading-relaxed text-[11px] font-bold font-sans">
                        🐢 Low stock turnover products. Limit further procurements:
                      </div>
                      <div className="overflow-x-auto">
                        <table className="erp-table">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider font-sans">
                              <th className="p-3">Product Name</th>
                              <th className="p-3">SKU</th>
                              <th className="p-3 text-center font-mono">Qty Stored</th>
                              <th className="p-3 text-center font-sans">Demand Level</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold">
                            {warehouseReports.slowMoving.map((row, idx) => (
                              <tr key={idx} className="hover:bg-amber-50/10">
                                <td className="p-3 font-sans font-bold text-slate-800">{row.productName}</td>
                                <td className="p-3 text-slate-500">{row.sku}</td>
                                <td className="p-3 text-center font-bold text-slate-700">{row.qty}</td>
                                <td className="p-3 text-center font-sans">
                                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase text-[9px]">
                                    Slow Demand
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // ==================== STANDARD DIRECTORY CARDS GRID ====================
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
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs animate-scale-up"
              >
                <Plus className="w-4 h-4" />
                <span>Add Facility</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {computedWarehouses.map((w) => (
                <div
                  key={w.id}
                  onClick={() => {
                    setSelectedWarehouseDetail(w);
                    setWarehouseSubTab("general");
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center">
                    <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-350">
                      <Warehouse className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenWarehouseModal(w);
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWarehouse(w.id, w.name);
                        }}
                        className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{w.name}</h4>
                    <p className="text-slate-400">{w.location}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                        {w.code || "WH-BND-01"}
                      </span>
                      <p className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded inline-block font-bold">
                        Capacity: {w.capacity}
                      </p>
                    </div>
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
                        Code: PRD-{(p._id || p.id || "").toString().substring(Math.max(0, (p._id || p.id || "").toString().length - 6)).toUpperCase()} | SKU: {p.sku} | Threshold: {p.minStockAlert} units
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
                {lowStockAlerts.length === 0 && (
                  <p className="text-slate-400 p-4">No low stock alerts detected across Active Godowns.</p>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* TAB: MULTI-LOCATION INVENTORY */}
      {activeTab === "locations" && (
        selectedLocation ? (
          /* ========== LOCATION DRILLDOWN ========== */
          <div className="space-y-6 animate-scale-up text-xs font-semibold text-slate-600">
            {/* Header */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
                >
                  &larr; Back to All Locations
                </button>
                <h3 className="text-lg font-extrabold text-slate-800">{selectedLocation.name}</h3>
                <p className="text-slate-400 text-[10px]">{selectedLocation.location} &middot; Code: {selectedLocation.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowTransferModal(true); setTfSourceId(selectedLocation.id); }}
                  className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold cursor-pointer"
                >
                  + New Transfer From Here
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Products</span>
                <span className="text-lg font-extrabold text-slate-800 block">{selectedLocation.totalProducts}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Available Stock</span>
                <span className="text-lg font-extrabold text-emerald-600 block">{selectedLocation.availableStock}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Reserved</span>
                <span className="text-lg font-extrabold text-amber-600 block">{selectedLocation.reservedStock}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">In Transit</span>
                <span className="text-lg font-extrabold text-indigo-600 block">{selectedLocation.inTransit}</span>
              </div>
            </div>

            {/* Product Stock Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Product Stock at {selectedLocation.name}</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="p-3 text-left text-slate-500 font-bold uppercase">Product</th>
                      <th className="p-3 text-left text-slate-500 font-bold uppercase">SKU</th>
                      <th className="p-3 text-left text-slate-500 font-bold uppercase">Batch</th>
                      <th className="p-3 text-center text-slate-500 font-bold uppercase">Available</th>
                      <th className="p-3 text-center text-slate-500 font-bold uppercase">Reserved</th>
                      <th className="p-3 text-center text-slate-500 font-bold uppercase">In Transit</th>
                      <th className="p-3 text-left text-slate-500 font-bold uppercase">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationProductStock.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-bold text-slate-800">{item.name}</td>
                        <td className="p-3 font-mono text-indigo-600 font-bold">{item.sku}</td>
                        <td className="p-3 font-mono text-slate-500">{item.batch}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-600">{item.available}</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-600">{item.reserved}</td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-600">{item.inTransit}</td>
                        <td className="p-3 text-slate-400 font-mono">{item.lastUpdated}</td>
                      </tr>
                    ))}
                    {locationProductStock.length === 0 && (
                      <tr><td colSpan="7" className="p-8 text-center text-slate-400">No products stocked at this location.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transfer History for this Location */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Transfer History (This Location)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="p-3 text-left text-slate-500 font-bold uppercase">Transfer No</th>
                      <th className="p-3 text-left text-slate-500 font-bold uppercase">Source</th>
                      <th className="p-3 text-left text-slate-500 font-bold uppercase">Destination</th>
                      <th className="p-3 text-left text-slate-500 font-bold uppercase">Product</th>
                      <th className="p-3 text-left text-slate-500 font-bold uppercase">Date</th>
                      <th className="p-3 text-center text-slate-500 font-bold uppercase">Qty</th>
                      <th className="p-3 text-center text-slate-500 font-bold uppercase">Status</th>
                      <th className="p-3 text-center text-slate-500 font-bold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locTransfers
                      .filter(t => t.sourceLocationId === selectedLocation.id || t.destinationLocationId === selectedLocation.id)
                      .map((t) => (
                        <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-indigo-600">{t.transferNo}</td>
                          <td className="p-3 font-bold text-slate-700">{t.sourceLocationName}</td>
                          <td className="p-3 font-bold text-slate-700">{t.destinationLocationName}</td>
                          <td className="p-3 text-slate-600">{t.productName}</td>
                          <td className="p-3 font-mono text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800">{t.quantity}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${t.status === "Completed" ? "bg-emerald-50 text-emerald-600"
                                : t.status === "In Transit" || t.status === "Dispatched" ? "bg-blue-50 text-blue-600"
                                  : t.status === "Requested" || t.status === "Approved" ? "bg-amber-50 text-amber-600"
                                    : "bg-slate-100 text-slate-500"
                              }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {t.status === "Requested" && (
                              <button onClick={() => handleUpdateTransferStatus(t._id, "Approved")} className="px-2 py-1 bg-amber-500 text-white rounded-lg font-bold text-[9px] cursor-pointer hover:bg-amber-600">Approve</button>
                            )}
                            {t.status === "Approved" && (
                              <button onClick={() => handleUpdateTransferStatus(t._id, "Dispatched")} className="px-2 py-1 bg-blue-600 text-white rounded-lg font-bold text-[9px] cursor-pointer hover:bg-blue-700">Dispatch</button>
                            )}
                            {t.status === "Dispatched" && (
                              <button onClick={() => handleUpdateTransferStatus(t._id, "In Transit")} className="px-2 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[9px] cursor-pointer hover:bg-indigo-700">In Transit</button>
                            )}
                            {t.status === "In Transit" && (
                              <button onClick={() => handleUpdateTransferStatus(t._id, "Received")} className="px-2 py-1 bg-purple-600 text-white rounded-lg font-bold text-[9px] cursor-pointer hover:bg-purple-700">Receive</button>
                            )}
                            {t.status === "Received" && (
                              <button onClick={() => handleUpdateTransferStatus(t._id, "Completed")} className="px-2 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[9px] cursor-pointer hover:bg-emerald-700">Complete</button>
                            )}
                            {t.status === "Completed" && (
                              <span className="text-emerald-500 font-bold text-[9px]">&#10003; Done</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    {locTransfers.filter(t => t.sourceLocationId === selectedLocation.id || t.destinationLocationId === selectedLocation.id).length === 0 && (
                      <tr><td colSpan="8" className="p-8 text-center text-slate-400">No transfers involving this location.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ========== MAIN MULTI-LOCATION DASHBOARD ========== */
          <div className="space-y-6 text-xs">

            {/* Dashboard Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Locations</span>
                <span className="text-xl font-extrabold text-slate-800 block">{locStats.totalLocations}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Stock</span>
                <span className="text-xl font-extrabold text-emerald-600 block">{locStats.totalStock.toLocaleString()}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Stock In Transit</span>
                <span className="text-xl font-extrabold text-blue-600 block">{locStats.stockInTransit}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Pending Transfers</span>
                <span className="text-xl font-extrabold text-amber-600 block">{locStats.pendingTransfers}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Low Stock Locations</span>
                <span className="text-xl font-extrabold text-red-500 block">{locStats.lowStockLocations}</span>
              </div>
            </div>

            {/* Location Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">All Inventory Locations</h4>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-[11px] cursor-pointer hover:bg-indigo-700"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> New Stock Transfer
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="p-3 text-left text-slate-500 font-bold uppercase">Location</th>
                      <th className="p-3 text-center text-slate-500 font-bold uppercase">Products</th>
                      <th className="p-3 text-center text-slate-500 font-bold uppercase">Stock Value</th>
                      <th className="p-3 text-center text-slate-500 font-bold uppercase">Available</th>
                      <th className="p-3 text-center text-slate-500 font-bold uppercase">Reserved</th>
                      <th className="p-3 text-center text-slate-500 font-bold uppercase">Low Stock</th>
                      <th className="p-3 text-left text-slate-500 font-bold uppercase">Manager</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((loc) => (
                      <tr
                        key={loc.id}
                        onClick={() => setSelectedLocation(loc)}
                        className="border-b border-slate-50 hover:bg-indigo-50/40 cursor-pointer transition-colors"
                      >
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">{loc.name}</span>
                          <span className="text-[10px] text-slate-400">{loc.location}</span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">{loc.totalProducts}</td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-600">₹{loc.stockValue.toLocaleString()}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-600">{loc.availableStock}</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-600">{loc.reservedStock}</td>
                        <td className="p-3 text-center">
                          {loc.lowStockCount > 0 ? (
                            <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[9px] font-bold">{loc.lowStockCount} items</span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded-full text-[9px] font-bold">OK</span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-700">{loc.manager}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transfer Status Pipeline Visual */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Transfer Status Pipeline</h4>
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl overflow-x-auto gap-2">
                {["Requested", "Approved", "Dispatched", "In Transit", "Received", "Completed"].map((stage, idx) => {
                  const count = locTransfers.filter(t => t.status === stage).length;
                  return (
                    <React.Fragment key={stage}>
                      <div className="flex flex-col items-center min-w-[80px]">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm ${count > 0
                            ? stage === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                            : "bg-slate-100 text-slate-400"
                          }`}>
                          {count}
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 mt-1 text-center">{stage}</span>
                      </div>
                      {idx < 5 && (
                        <div className="text-slate-300 font-bold text-lg flex-shrink-0">&rarr;</div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Transfer History */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Transfer History</h4>
              </div>
              {locTransfersLoading ? (
                <div className="p-12 text-center text-slate-400 animate-pulse font-bold">Loading transfers...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="p-3 text-left text-slate-500 font-bold uppercase">Transfer No</th>
                        <th className="p-3 text-left text-slate-500 font-bold uppercase">Source</th>
                        <th className="p-3 text-left text-slate-500 font-bold uppercase">Destination</th>
                        <th className="p-3 text-left text-slate-500 font-bold uppercase">Date</th>
                        <th className="p-3 text-center text-slate-500 font-bold uppercase">Qty</th>
                        <th className="p-3 text-center text-slate-500 font-bold uppercase">Status</th>
                        <th className="p-3 text-center text-slate-500 font-bold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locTransfers.map((t) => (
                        <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-indigo-600">{t.transferNo}</td>
                          <td className="p-3 font-bold text-slate-700">{t.sourceLocationName}</td>
                          <td className="p-3 font-bold text-slate-700">{t.destinationLocationName}</td>
                          <td className="p-3 font-mono text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800">{t.quantity}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${t.status === "Completed" ? "bg-emerald-50 text-emerald-600"
                                : t.status === "In Transit" || t.status === "Dispatched" ? "bg-blue-50 text-blue-600"
                                  : t.status === "Requested" || t.status === "Approved" ? "bg-amber-50 text-amber-600"
                                    : "bg-slate-100 text-slate-500"
                              }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {t.status === "Requested" && (
                              <button onClick={() => handleUpdateTransferStatus(t._id, "Approved")} className="px-2 py-1 bg-amber-500 text-white rounded-lg font-bold text-[9px] cursor-pointer hover:bg-amber-600">Approve</button>
                            )}
                            {t.status === "Approved" && (
                              <button onClick={() => handleUpdateTransferStatus(t._id, "Dispatched")} className="px-2 py-1 bg-blue-600 text-white rounded-lg font-bold text-[9px] cursor-pointer hover:bg-blue-700">Dispatch</button>
                            )}
                            {t.status === "Dispatched" && (
                              <button onClick={() => handleUpdateTransferStatus(t._id, "In Transit")} className="px-2 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[9px] cursor-pointer hover:bg-indigo-700">Mark Transit</button>
                            )}
                            {t.status === "In Transit" && (
                              <button onClick={() => handleUpdateTransferStatus(t._id, "Received")} className="px-2 py-1 bg-purple-600 text-white rounded-lg font-bold text-[9px] cursor-pointer hover:bg-purple-700">Receive</button>
                            )}
                            {t.status === "Received" && (
                              <button onClick={() => handleUpdateTransferStatus(t._id, "Completed")} className="px-2 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[9px] cursor-pointer hover:bg-emerald-700">Complete</button>
                            )}
                            {t.status === "Completed" && (
                              <span className="text-emerald-500 font-bold text-[9px]">&#10003; Done</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {locTransfers.length === 0 && (
                        <tr><td colSpan="7" className="p-8 text-center text-slate-400 font-medium">No transfer records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low Stock Alerts */}
            {locLowStockAlerts.length > 0 && (
              <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100 shadow-xs">
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Location Alerts
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {locLowStockAlerts.slice(0, 9).map((alert, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-red-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-800 font-bold text-[11px] block">{alert.locationName}</span>
                        <span className="text-[10px] text-slate-400 block">{alert.productName}</span>
                        <span className="text-red-500 font-bold text-[10px]">Only {alert.available} left</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowTransferModal(true);
                          setTfDestId(alert.locationId);
                          setTfProductId(alert.productId);
                          setTfQty(20);
                        }}
                        className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-[9px] cursor-pointer hover:bg-indigo-700 whitespace-nowrap"
                      >
                        Transfer Stock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* TAB: BATCH TRACKING (MongoDB DYNAMIC BATCHES) */}
      {activeTab === "batches" && (
        <div className="space-y-6 text-xs">
          {/* Detail Workspace Overlay/View */}
          {selectedBatchDetail ? (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-6 animate-fade-in font-semibold text-slate-600">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedBatchDetail(null);
                      fetchBatches();
                    }}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Back to Batch Directory</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                      Batch Workspace: {selectedBatchDetail.batchNo}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${selectedBatchDetail.status === "Closed"
                        ? "bg-slate-100 text-slate-500 border-slate-200"
                        : selectedBatchDetail.status === "Reserved"
                          ? "bg-amber-50 text-amber-600 border-amber-200"
                          : "bg-emerald-50 text-emerald-600 border-emerald-200"
                      }`}>
                      {selectedBatchDetail.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApproveQC}
                    className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-bold cursor-pointer"
                  >
                    Approve QC
                  </button>
                  <button
                    onClick={() => setShowBarcodePrint(true)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg font-bold cursor-pointer"
                  >
                    Print Barcode
                  </button>
                </div>
              </div>

              {/* Three Column Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Column 1: Batch & Stock Info */}
                <div className="space-y-6">
                  {/* Batch Information */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-50">
                      Batch Traceability Info
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Batch Number</span>
                        <span className="text-slate-800 font-mono font-bold">{selectedBatchDetail.batchNo}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Invoice Number</span>
                        <span className="text-slate-800 font-mono font-bold">{selectedBatchDetail.purchaseInvoiceNo || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Purchase Order</span>
                        <span className="text-indigo-600 font-mono font-bold">
                          {selectedBatchDetail.purchaseOrderId?.poNo || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Supplier Partner</span>
                        <span className="text-slate-800 font-bold">
                          {selectedBatchDetail.supplierId?.name || "Global Fabrics"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Purchase Date</span>
                        <span className="text-slate-800">
                          {selectedBatchDetail.purchaseDate ? new Date(selectedBatchDetail.purchaseDate).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Received Date</span>
                        <span className="text-slate-800">
                          {selectedBatchDetail.receivedDate ? new Date(selectedBatchDetail.receivedDate).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Warehouse Depot</span>
                        <span className="text-slate-800 font-bold">
                          {warehouses.find(w => w.id === selectedBatchDetail.warehouseId)?.name || "Main Storage Room"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Storage Location</span>
                        <span className="text-slate-800 font-mono font-bold">
                          {selectedBatchDetail.rack || "RCK-A"} / {selectedBatchDetail.shelf || "SHLF-1"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Created By</span>
                        <span className="text-slate-500 font-bold">{selectedBatchDetail.createdBy || "System Admin"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Information */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-50">
                      Stock Ledger Audits
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Opening Quantity</span>
                        <span className="text-slate-800 font-mono font-bold">{selectedBatchDetail.purchaseQty} units</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Purchased Quantity</span>
                        <span className="text-slate-800 font-mono font-bold">{selectedBatchDetail.purchaseQty} units</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Sold Quantity</span>
                        <span className="text-slate-800 font-mono font-bold">{selectedBatchDetail.soldQty || 0} units</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Reserved Quantity</span>
                        <span className="text-amber-600 font-mono font-bold">{selectedBatchDetail.reservedQty || 0} units</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Returned Quantity</span>
                        <span className="text-red-500 font-mono font-bold">{selectedBatchDetail.returnedQty || 0} units</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Available Quantity</span>
                        <span className="text-emerald-600 font-mono font-extrabold text-sm block">
                          {selectedBatchDetail.availableQty} units
                        </span>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-100">
                        <span className="text-slate-400 block text-[10px]">Current Batch Value</span>
                        <span className="text-indigo-600 font-mono font-extrabold text-sm block">
                          ₹{(selectedBatchDetail.availableQty * selectedBatchDetail.costPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Product & Financial Details */}
                <div className="space-y-6">
                  {/* Product Information */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-50">
                      Product Characteristics
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Product Name</span>
                        <span className="text-slate-800 font-bold block">{selectedBatchDetail.productId?.name || "Custom Fabric Roll"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Product SKU</span>
                        <span className="text-slate-800 font-mono font-bold">{selectedBatchDetail.productId?.sku || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Barcode</span>
                        <span className="text-slate-800 font-mono font-bold">{selectedBatchDetail.productId?.barcode || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Category</span>
                        <span className="text-slate-800 font-bold">{selectedBatchDetail.productId?.category || "Uncategorized"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Brand</span>
                        <span className="text-slate-800 font-bold">{selectedBatchDetail.productId?.brand || "Generic"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Size / Dimension</span>
                        <span className="text-slate-800 font-bold">{selectedBatchDetail.productId?.size || "Custom"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Primary Color</span>
                        <span className="text-slate-800 font-bold">{selectedBatchDetail.productId?.color || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Fabric Structure</span>
                        <span className="text-slate-800 font-bold">{selectedBatchDetail.productId?.fabricCode || "Cotton Weave"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Fabric Weight (GSM)</span>
                        <span className="text-slate-800 font-mono font-bold">{selectedBatchDetail.productId?.gsm || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-50">
                      Commercial Ledger Value
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Purchase / Cost Price</span>
                        <span className="text-slate-800 font-mono font-bold">₹{selectedBatchDetail.costPrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Maximum Retail Price (MRP)</span>
                        <span className="text-slate-800 font-mono font-bold">₹{selectedBatchDetail.mrp || selectedBatchDetail.sellingPrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Selling Price</span>
                        <span className="text-emerald-600 font-mono font-bold">₹{selectedBatchDetail.sellingPrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Lot Discount</span>
                        <span className="text-indigo-600 font-mono font-bold">{selectedBatchDetail.discount || 0}%</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Applied GST Levy</span>
                        <span className="text-slate-800 font-mono font-bold">{selectedBatchDetail.gst || 12}% GST Standard</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Actions & Timeline */}
                <div className="space-y-6">
                  {/* Actions Panel */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-50">
                      Batch Actions Workspace
                    </h4>

                    <button
                      onClick={() => setShowLabelPrint(true)}
                      className="w-full text-left py-2 px-3 border border-slate-100 hover:bg-slate-50 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      📄 Print Batch Label
                    </button>
                    <button
                      onClick={handleViewBatchHistory}
                      className="w-full text-left py-2 px-3 border border-slate-100 hover:bg-slate-50 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      📜 View Batch History
                    </button>
                    <button
                      onClick={handleReserveBatchStock}
                      className="w-full text-left py-2 px-3 border border-slate-100 hover:bg-slate-50 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-colors text-amber-700 bg-amber-50/20"
                    >
                      🔒 Allocate Reserve Stock
                    </button>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-50">
                      Trace Timeline Flow
                    </h4>
                    <div className="space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                      {[
                        { label: "Created", key: "Created" },
                        { label: "Received", key: "Received" },
                        { label: "QC Checked", key: "QC" },
                        { label: "Available", key: "Available" },
                        { label: "Reserved", key: "Reserved" },
                        { label: "Sold Out", key: "Sold" },
                        { label: "Closed", key: "Closed" }
                      ].map((t, idx) => {
                        const states = ["Created", "Received", "QC", "Available", "Reserved", "Sold", "Closed"];
                        const currentIdx = states.indexOf(selectedBatchDetail.status);
                        const isDone = states.indexOf(t.key) <= currentIdx;
                        return (
                          <div key={idx} className="flex items-center gap-3 text-[11px]">
                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 z-10 ${isDone ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-200"
                              }`}>
                              {isDone && <span className="w-1 h-1 bg-white rounded-full" />}
                            </span>
                            <span className={isDone ? "text-slate-800 font-extrabold" : "text-slate-400 font-bold"}>
                              {t.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <>
              {/* Summary Statistics Row */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Total Batches</span>
                  <span className="text-slate-800 font-extrabold text-lg block">{batchStats.total}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Active Lots</span>
                  <span className="text-emerald-600 font-extrabold text-lg block">{batchStats.active}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Closed Lots</span>
                  <span className="text-slate-400 font-extrabold text-lg block">{batchStats.closed}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Batch Val</span>
                  <span className="text-indigo-600 font-extrabold text-lg block">₹{Math.round(batchStats.totalValue).toLocaleString()}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Reserved</span>
                  <span className="text-amber-600 font-extrabold text-lg block">{batchStats.reserved} units</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Low Stock</span>
                  <span className="text-red-500 font-extrabold text-lg block">{batchStats.lowStock} lots</span>
                </div>
              </div>

              {/* Main Directory panel */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs font-semibold">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Garment Production Batch Ledger
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Trace manufacturing dates, fabrics, lots, cost profiles, and status values.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search batch lot No..."
                      value={batchesSearch}
                      onChange={(e) => setBatchesSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] outline-none w-full sm:w-44 text-slate-700"
                    />
                    <select
                      value={batchesFilterStatus}
                      onChange={(e) => setBatchesFilterStatus(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] outline-none text-slate-700 font-bold"
                    >
                      <option value="">All Status</option>
                      <option value="Available">Available</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <button
                      onClick={() => fetchBatches()}
                      className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold cursor-pointer bg-white"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={() => setShowBatchModal(true)}
                      className="bg-slate-950 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Lot</span>
                    </button>
                  </div>
                </div>

                {/* Table lists */}
                {batchesLoading ? (
                  <div className="py-12 text-center text-slate-400 animate-pulse font-sans font-bold">
                    ⚡ Synchronizing MongoDB batch registry...
                  </div>
                ) : batchesError ? (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl leading-relaxed font-semibold">
                    ❌ {batchesError}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-[11px]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase border-b border-slate-100 tracking-wider">
                            <th className="p-3.5">Batch No</th>
                            <th className="p-3.5">Product</th>
                            <th className="p-3.5">SKU</th>
                            <th className="p-3.5">Supplier</th>
                            <th className="p-3.5">Purchase Date</th>
                            <th className="p-3.5 text-center">Purchased Qty</th>
                            <th className="p-3.5 text-center">Available Qty</th>
                            <th className="p-3.5 text-center">Reserved Qty</th>
                            <th className="p-3.5">Warehouse</th>
                            <th className="p-3.5 text-right">Cost Price</th>
                            <th className="p-3.5 text-right">Selling Price</th>
                            <th className="p-3.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                          {dbBatches.map((b) => (
                            <tr
                              key={b._id}
                              onClick={() => setSelectedBatchDetail(b)}
                              className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                            >
                              <td className="p-3.5 font-mono font-bold text-indigo-600">
                                {b.batchNo}
                              </td>
                              <td className="p-3.5 font-semibold text-slate-800">
                                {b.productId?.name || "Custom Fabric Lot"}
                              </td>
                              <td className="p-3.5 font-mono text-[10px] text-slate-400">
                                {b.productId?.sku || "N/A"}
                              </td>
                              <td className="p-3.5">
                                {b.supplierId?.name || "Global Fabrics"}
                              </td>
                              <td className="p-3.5 font-mono">
                                {b.purchaseDate ? new Date(b.purchaseDate).toLocaleDateString() : "N/A"}
                              </td>
                              <td className="p-3.5 text-center font-mono font-bold">{b.purchaseQty} units</td>
                              <td className="p-3.5 text-center font-mono font-extrabold text-slate-800">{b.availableQty} units</td>
                              <td className="p-3.5 text-center font-mono text-amber-600 font-bold">{b.reservedQty || 0} units</td>
                              <td className="p-3.5 font-semibold text-slate-700">
                                {warehouses.find(w => w.id === b.warehouseId)?.name || "Bandra Central"}
                              </td>
                              <td className="p-3.5 text-right font-mono">₹{b.costPrice}</td>
                              <td className="p-3.5 text-right font-mono font-bold text-slate-800">₹{b.sellingPrice}</td>
                              <td className="p-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${b.status === "Closed"
                                    ? "bg-slate-100 text-slate-500 border-slate-200"
                                    : b.status === "Reserved"
                                      ? "bg-amber-50 text-amber-600 border-amber-200"
                                      : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                  }`}>
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {dbBatches.length === 0 && (
                            <tr>
                              <td colSpan="12" className="p-8 text-center text-slate-400 font-sans font-medium">
                                No production batches registered in database.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
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


      {/* TAB: MOVEMENT HISTORY LOGS (MongoDB DYNAMIC LOGS) */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-xs space-y-4 p-5 font-semibold text-slate-600">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Dynamic Stock Telemetry Logs
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">Real-time ledger audit trail fetched directly from MongoDB.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchMovements()}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold flex items-center gap-1 cursor-pointer bg-white"
              >
                <span>Refresh Log</span>
              </button>
              <button
                onClick={() => handleExportCSV("Telemetry Logs")}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Export Log</span>
              </button>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Search */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Search Query</label>
              <input
                type="text"
                placeholder="Search Item, SKU, Ref No..."
                value={movementsSearch}
                onChange={(e) => {
                  setMovementsSearch(e.target.value);
                  setMovementsPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 outline-none"
              />
            </div>

            {/* Movement Type */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Movement Type</label>
              <select
                value={movementsFilterType}
                onChange={(e) => {
                  setMovementsFilterType(e.target.value);
                  setMovementsPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-700 outline-none"
              >
                <option value="">All Types</option>
                <option value="INBOUND">INBOUND</option>
                <option value="OUTBOUND">OUTBOUND</option>
                <option value="TRANSFER">TRANSFER</option>
              </select>
            </div>

            {/* Activity Type */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Activity</label>
              <select
                value={movementsFilterActivity}
                onChange={(e) => {
                  setMovementsFilterActivity(e.target.value);
                  setMovementsPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-700 outline-none"
              >
                <option value="">All Activities</option>
                <option value="PURCHASE_RECEIVED">Purchase Received</option>
                <option value="POS_SALE">POS Checkout Sale</option>
                <option value="STOCK_TRANSFER">Warehouse Transfer</option>
                <option value="MATERIAL_ISSUE">Material Issue/Reserve</option>
                <option value="RETURN">Stock Return</option>
                <option value="ADJUSTMENT">Stock Adjustment</option>
                <option value="FINISHED_GOODS_RECEIVED">Finished Goods Recd</option>
                <option value="OPENING_STOCK">Opening Stock</option>
              </select>
            </div>

            {/* Warehouse Filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Warehouse depot</label>
              <select
                value={movementsFilterWarehouse}
                onChange={(e) => {
                  setMovementsFilterWarehouse(e.target.value);
                  setMovementsPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-700 outline-none"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loader / Error Panels */}
          {movementsLoading && (
            <div className="py-12 text-center text-slate-400 animate-pulse font-sans font-bold">
              ⚡ Synchronizing MongoDB inventory database...
            </div>
          )}

          {movementsError && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl leading-relaxed font-semibold">
              ❌ {movementsError}
            </div>
          )}

          {/* Table list */}
          {!movementsLoading && !movementsError && (
            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th
                      className="p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setMovementsSort(movementsSort === "-createdAt" ? "createdAt" : "-createdAt")}
                    >
                      Timestamp {movementsSort.includes("createdAt") ? (movementsSort.startsWith("-") ? "↓" : "↑") : ""}
                    </th>
                    <th className="p-3">Garment Item</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">Activity</th>
                    <th className="p-3 text-center">Offset Qty</th>
                    <th className="p-3 text-center">Stock Log</th>
                    <th className="p-3">Reference (Type / No)</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {dbMovements.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="text-slate-800 font-bold block">{log.productName}</span>
                        <span className="bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded text-[9px] font-bold font-mono">
                          {log.productCode}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${log.movementType === "INBOUND"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : log.movementType === "OUTBOUND"
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-indigo-50 text-indigo-600 border border-indigo-200"
                            }`}
                        >
                          {log.movementType}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9.5px] font-extrabold uppercase">
                          {log.activity}
                        </span>
                      </td>
                      <td
                        className={`p-3 text-center font-bold font-mono ${log.movementType === "INBOUND" ? "text-emerald-600" : "text-red-500"
                          }`}
                      >
                        {log.movementType === "INBOUND" ? `+${log.quantity}` : `-${log.quantity}`}
                      </td>
                      <td className="p-3 text-center font-mono text-[10px] text-slate-400">
                        {log.previousStock} → <b className="text-slate-700">{log.newStock}</b>
                      </td>
                      <td className="p-3 font-sans text-slate-700 font-semibold">
                        <span className="block text-slate-400 text-[10px] font-bold uppercase">{log.referenceType}</span>
                        <span className="font-mono text-indigo-600 font-bold text-[10px]">{log.referenceNumber}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-700">{log.performedBy}</td>
                      <td className="p-3 max-w-xs truncate text-slate-400 font-medium">{log.remarks}</td>
                    </tr>
                  ))}
                  {dbMovements.length === 0 && (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-slate-400 font-sans font-medium">
                        No movement log records found matching the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-500">
            <div>
              Showing {dbMovements.length} log lines (Total: {movementsTotal} entries)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={movementsPage <= 1}
                onClick={() => setMovementsPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer bg-white"
              >
                Previous
              </button>
              <span className="font-mono font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                Page {movementsPage} of {movementsPages}
              </span>
              <button
                disabled={movementsPage >= movementsPages}
                onClick={() => setMovementsPage(prev => Math.min(movementsPages, prev + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer bg-white"
              >
                Next
              </button>
            </div>
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
                  Facility Name *
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
                  Warehouse Code
                </label>
                <input
                  type="text"
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value)}
                  placeholder="e.g. WH-BND-01"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Physical Location Address *
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
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={whPhone}
                    onChange={(e) => setWhPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={whEmail}
                    onChange={(e) => setWhEmail(e.target.value)}
                    placeholder="e.g. bandra@vastraerp.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Depot Manager *
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

      {/* MODAL: PRINT BARCODE */}
      {showBarcodePrint && selectedBatchDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in font-semibold text-slate-600">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-xl text-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Print Batch Barcode
            </h3>
            <div className="border-2 border-dashed border-slate-200 p-4 rounded-xl bg-slate-50 flex flex-col items-center justify-center space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                {selectedBatchDetail.productId?.brand || "VastraERP Custom"}
              </span>
              <span className="text-slate-800 font-extrabold text-xs">
                {selectedBatchDetail.productId?.name || "Garment Item"}
              </span>

              {/* CSS Mock Barcode Pattern */}
              <div className="flex items-center justify-center gap-[1.5px] h-10 w-44 bg-white px-2 py-1.5 border border-slate-200 rounded">
                {[1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 4, 1, 2, 1].map((w, i) => (
                  <div key={i} className="bg-slate-900 h-full" style={{ width: `${w}px` }} />
                ))}
              </div>

              <span className="font-mono text-slate-600 font-bold text-[10px]">
                {selectedBatchDetail.productId?.barcode || selectedBatchDetail.batchNo}
              </span>
              <span className="font-mono text-indigo-600 font-extrabold text-sm block">
                ₹{selectedBatchDetail.sellingPrice}
              </span>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowBarcodePrint(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                  onAddNotification("Printed", "Sent barcode print job to hardware dispatcher.", "success");
                  setShowBarcodePrint(false);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
              >
                Dispatch Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINT BATCH LABEL */}
      {showLabelPrint && selectedBatchDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in font-semibold text-slate-600">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-center">
              Print Batch Dispatch Label
            </h3>

            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-3 font-semibold text-[11px] text-slate-600">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Batch Lot</span>
                  <span className="text-slate-800 font-mono font-extrabold">{selectedBatchDetail.batchNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Qty</span>
                  <span className="text-slate-800 font-mono font-extrabold">{selectedBatchDetail.availableQty} Units</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] block">Garment Product</span>
                <span className="text-slate-800 font-bold block">{selectedBatchDetail.productId?.name}</span>
                <span className="text-[10px] text-indigo-600 font-mono block">SKU: {selectedBatchDetail.productId?.sku}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-[10px]">
                <div>
                  <span className="text-slate-400 block">Warehouse location</span>
                  <span className="text-slate-700 font-bold">
                    {warehouses.find(w => w.id === selectedBatchDetail.warehouseId)?.name || "Default"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Rack / Shelf</span>
                  <span className="text-slate-700 font-mono font-bold">{selectedBatchDetail.rack || "A"} / {selectedBatchDetail.shelf || "1"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Supplier</span>
                  <span className="text-slate-700 font-bold">{selectedBatchDetail.supplierId?.name || "Global Fabrics"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date Received</span>
                  <span className="text-slate-700 font-mono font-bold">
                    {selectedBatchDetail.receivedDate ? new Date(selectedBatchDetail.receivedDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowLabelPrint(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                  onAddNotification("Label Printed", "Label dispatched to thermal printer.", "success");
                  setShowLabelPrint(false);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
              >
                Print Thermal Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BATCH HISTORY */}
      {showBatchHistory && selectedBatchDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in font-semibold text-slate-600 font-semibold">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-100 shadow-xl text-slate-600">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Batch Ledger Audit Log
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Telemetry movement records logged for this product structure in MongoDB.</p>

            <div className="border border-slate-200 rounded-xl max-h-60 overflow-y-auto bg-slate-50/50 p-2">
              {historyLoading ? (
                <div className="p-8 text-center text-slate-400 animate-pulse font-sans font-bold">
                  ⚡ Compiling audit history lines...
                </div>
              ) : batchHistoryLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-medium font-sans">
                  No movement logs captured for this item.
                </div>
              ) : (
                <div className="space-y-2">
                  {batchHistoryLogs.map((log) => (
                    <div key={log._id} className="p-2.5 bg-white border border-slate-100 rounded-lg flex justify-between items-center text-[10.5px]">
                      <div>
                        <span className="text-[9.5px] text-slate-400 block font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        <span className="text-slate-800 font-bold block">{log.remarks || "Stock transaction log"}</span>
                        <span className="text-[9.5px] text-indigo-600 font-bold font-mono">
                          {log.referenceType}: {log.referenceNumber}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] block mb-1 text-center ${log.movementType === "INBOUND" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                          }`}>
                          {log.movementType}
                        </span>
                        <span className={`font-mono font-bold ${log.movementType === "INBOUND" ? "text-emerald-600" : "text-red-500"
                          }`}>
                          {log.movementType === "INBOUND" ? `+${log.quantity}` : `-${log.quantity}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowBatchHistory(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE STOCK TRANSFER */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in font-semibold text-slate-600">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Create Stock Transfer
            </h3>

            {/* Transfer Flow Visual */}
            <div className="bg-slate-50 p-4 rounded-xl flex flex-col items-center gap-2 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Source</span>
              <span className="text-slate-800 font-bold text-[11px]">{warehouses.find(w => w.id === tfSourceId)?.name || "Select Source"}</span>
              <span className="text-indigo-400 text-lg font-bold">&darr;</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Destination</span>
              <span className="text-slate-800 font-bold text-[11px]">{warehouses.find(w => w.id === tfDestId)?.name || "Select Destination"}</span>
              <span className="text-indigo-400 text-lg font-bold">&darr;</span>
              <span className="text-indigo-600 font-extrabold">{tfQty} Units</span>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Source Location</label>
                <select
                  value={tfSourceId}
                  onChange={(e) => setTfSourceId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Destination Location</label>
                <select
                  value={tfDestId}
                  onChange={(e) => setTfDestId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Product</label>
                <select
                  required
                  value={tfProductId}
                  onChange={(e) => setTfProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                >
                  <option value="">Select Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Quantity</label>
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
                  <label className="block text-slate-400 font-semibold mb-1">Remarks</label>
                  <input
                    type="text"
                    value={tfRemarks}
                    onChange={(e) => setTfRemarks(e.target.value)}
                    placeholder="e.g. Weekend replenishment"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer hover:bg-indigo-700"
                >
                  Request Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

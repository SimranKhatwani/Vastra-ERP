import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Download,
  Printer,
  RefreshCw,
  SlidersHorizontal,
  Plus,
  Edit,
  Trash2,
  Copy,
  QrCode,
  Barcode,
  List,
  Package,
  ChevronDown,
  ChevronRight,
  X,
  Truck,
  ArrowUpDown,
  ChevronUp,
  Layers,
} from "lucide-react";

// 8 target sizes matching union 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL'
const SIZES_LIST = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];

export const InventoryArticulationWindow = ({
  products,
  setProducts,
  suppliers,
  setSuppliers,
  purchaseOrders,
  setPurchaseOrders,
  invoices,
  setInvoices,
  onAdjustStock,
  onAddNotification,
}) => {
  // --- UI STATES ---
  const [searchTerm, setSearchTerm] = useState("");
  const [skuSearch, setSkuSearch] = useState("");
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedQuickFilter, setSelectedQuickFilter] = useState("All");
  // Sorting & Pagination
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Row selection & expansion
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [expandedRowIds, setExpandedRowIds] = useState({});
  const [colWidths, setColWidths] = useState({
    image: 60,
    name: 220,
    sku: 130,
    barcode: 110,
    brand: 100,
    category: 120,
    color: 90,
    stocks: 65,
    totalStock: 80,
    reservedStock: 80,
    availableStock: 85,
    purchaseQty: 90,
    soldQty: 80,
    value: 100,
    price: 80,
    warehouse: 140,
    status: 100,
  });

  // Drawer & Modals
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [crudMode, setCrudMode] = useState("create");
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);

  // Forms states
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(10);
  const [adjustType, setAdjustType] = useState("Add");
  const [adjustReason, setAdjustReason] = useState("Manual audit update");
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferQty, setTransferQty] = useState(10);
  const [reserveQty, setReserveQty] = useState(5);
  const [reserveAction, setReserveAction] = useState("reserve");

  // Purchase state
  const [purchaseForm, setPurchaseForm] = useState({
    productId: "",
    color: "",
    size: "M",
    quantity: 10,
    supplierId: "",
    purchasePrice: 0,
  });

  // Context Menu
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // Keyboard navigation ref
  const tableRef = useRef(null);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    skuSearch,
    barcodeSearch,
    brandFilter,
    categoryFilter,
    colorFilter,
    sizeFilter,
    warehouseFilter,
    supplierFilter,
    statusFilter,
    selectedQuickFilter,
  ]);

  // --- DERIVED DEMO METADATA FOR PRODUCTS ---
  const productExtraMeta = useMemo(() => {
    const meta = {};

    const warehousesList = [
      "Bandra Central Warehouse",
      "Colaba Retail Godown",
      "Thane Logistics Depot",
      "Andheri Distribution Hub",
      "Dharavi Bulk Depot",
    ];

    products.forEach((p, idx) => {
      // Deterministic extra data based on product ID seed
      const seed = p.id
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const warehouse = warehousesList[seed % warehousesList.length];
      const supplier =
        suppliers[seed % suppliers.length]?.name || "Pratibha Syntex Ltd";
      const reserved = Math.round(p.stock * 0.15);
      const available = Math.max(0, p.stock - reserved);
      const soldQty = ((seed * 11) % 450) + 50;
      const purchaseQty = p.stock + soldQty + ((seed * 7) % 100);
      const orderedQty = Math.round(p.stock * 0.25);
      const lastPurDay = 1 + (seed % 28);
      const lastSoldDay = 1 + ((seed + 12) % 28);
      meta[p.id] = {
        rack: `Rack ${String.fromCharCode(65 + (seed % 6))}-${(seed % 15) + 1}`,
        reserved,
        available,
        purchaseQty,
        orderedQty,
        soldQty,
        warehouse,
        supplier,
        lastPurchaseDate: `2026-05-${lastPurDay < 10 ? "0" + lastPurDay : lastPurDay}`,
        lastSoldDate: `2026-06-${lastSoldDay < 10 ? "0" + lastSoldDay : lastSoldDay}`,
        pendingPO: seed % 5 === 0 ? 50 : 0,
        damaged: seed % 13 === 0 ? 3 : 0,
        returned: seed % 9 === 0 ? 4 : 0,
        maxStock: p.minStockAlert * 5,
        reorderQty: p.minStockAlert * 2,
        discontinued: seed % 29 === 0,
      };
    });
    return meta;
  }, [products, suppliers]);

  // Size details & Color-wise stock generator for individual rows
  const getProductMatrix = (prod) => {
    const seed = prod.id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const primaryColor = prod.color;
    const secondaryColors = [
      "Charcoal Gray",
      "Navy Blue",
      "Classic White",
      "Crimson Red",
    ].filter((c) => c !== primaryColor);
    // Size distribution generator
    const generateSizeDist = (total, sVal) => {
      const sizes = [...SIZES_LIST];
      const weights = [5, 10, 15, 25, 20, 15, 8, 2]; // XXS to 3XL
      let remaining = total;
      const breakdown = {};
      sizes.forEach((sz, i) => {
        if (i === sizes.length - 1) {
          breakdown[sz] = remaining;
        } else {
          const rand = (((sVal * (i + 1) * 23) % 100) / 100) * 0.4 + 0.8;
          const portion = Math.min(
            remaining,
            Math.round(total * (weights[i] / 100) * rand),
          );
          breakdown[sz] = portion;
          remaining -= portion;
        }
      });
      return breakdown;
    };

    const mainColorMatrix = generateSizeDist(prod.stock, seed);
    const extraColorsMatrix = secondaryColors.map((color, cIdx) => ({
      color,
      matrix: generateSizeDist(
        Math.round(prod.stock * (0.4 - cIdx * 0.1)),
        seed + cIdx + 5,
      ),
    }));

    return {
      primaryColor,
      mainColorMatrix,
      extraColorsMatrix,
    };
  };

  // --- FILTERING AND SORTING LOGIC ---
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const meta = productExtraMeta[p.id] || {
          warehouse: "",
          supplier: "",
          discontinued: false,
          available: p.stock,
        };
        // Global Search
        const matchGlobal =
          searchTerm === "" ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.barcode.includes(searchTerm) ||
          p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.color.toLowerCase().includes(searchTerm.toLowerCase());

        // Specific Toolbar Filters
        const matchSku =
          skuSearch === "" ||
          p.sku.toLowerCase().includes(skuSearch.toLowerCase());
        const matchBarcode =
          barcodeSearch === "" || p.barcode.includes(barcodeSearch);
        const matchBrand = brandFilter === "" || p.brand === brandFilter;
        const matchCategory =
          categoryFilter === "" || p.category === categoryFilter;
        const matchColor = colorFilter === "" || p.color === colorFilter;
        const matchSize = sizeFilter === "" || p.size === sizeFilter;
        const matchWarehouse =
          warehouseFilter === "" || meta.warehouse === warehouseFilter;
        const matchSupplier =
          supplierFilter === "" || meta.supplier === supplierFilter;
        // Status filter
        let matchStatus = true;
        if (statusFilter !== "") {
          if (statusFilter === "Discontinued") {
            matchStatus = !!meta.discontinued;
          } else {
            matchStatus = p.status === statusFilter && !meta.discontinued;
          }
        }

        // Quick Filter Chips
        let matchQuick = true;
        if (selectedQuickFilter === "Low Stock") {
          matchQuick = p.status === "Low Stock";
        } else if (selectedQuickFilter === "Out of Stock") {
          matchQuick = p.status === "Out of Stock";
        } else if (selectedQuickFilter === "High Value") {
          matchQuick = p.stock * p.purchasePrice > 75000;
        } else if (selectedQuickFilter === "Incoming Orders") {
          matchQuick = meta.pendingPO > 0;
        } else if (selectedQuickFilter === "Discontinued") {
          matchQuick = !!meta.discontinued;
        }

        return (
          matchGlobal &&
          matchSku &&
          matchBarcode &&
          matchBrand &&
          matchCategory &&
          matchColor &&
          matchSize &&
          matchWarehouse &&
          matchSupplier &&
          matchStatus &&
          matchQuick
        );
      })
      .sort((a, b) => {
        let valA = a[sortField] ?? "";
        let valB = b[sortField] ?? "";

        // Custom fields
        if (sortField === "totalStock") {
          valA = a.stock;
          valB = b.stock;
        } else if (sortField === "stockValue") {
          valA = a.stock * a.purchasePrice;
          valB = b.stock * b.purchasePrice;
        }

        if (typeof valA === "string") {
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        } else {
          return sortDirection === "asc"
            ? valA > valB
              ? 1
              : -1
            : valA < valB
              ? 1
              : -1;
        }
      });
  }, [
    products,
    productExtraMeta,
    searchTerm,
    skuSearch,
    barcodeSearch,
    brandFilter,
    categoryFilter,
    colorFilter,
    sizeFilter,
    warehouseFilter,
    supplierFilter,
    statusFilter,
    selectedQuickFilter,
    sortField,
    sortDirection,
  ]);

  // Pagination bounds
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // --- SUMMARY KPI CARDS ---
  const stockSummary = useMemo(() => {
    let totalCStock = 0;
    let totalAvail = 0;
    let totalReserve = 0;
    let totalIncoming = 0;
    let totalVal = 0;
    let lowStockCount = 0;
    let outStockCount = 0;

    filteredProducts.forEach((p) => {
      const meta = productExtraMeta[p.id];
      totalCStock += p.stock;
      totalAvail += meta ? meta.available : p.stock;
      totalReserve += meta ? meta.reserved : 0;
      totalIncoming += meta ? meta.pendingPO : 0;
      totalVal += p.stock * p.purchasePrice;
      if (p.status === "Low Stock") lowStockCount++;
      if (p.status === "Out of Stock") outStockCount++;
    });

    return {
      totalCStock,
      totalAvail,
      totalReserve,
      totalIncoming,
      totalVal,
      lowStockCount,
      outStockCount,
    };
  }, [filteredProducts, productExtraMeta]);

  // --- DROP-DOWN FILTER UNIQUE OPTIONS ---
  const filterOptions = useMemo(() => {
    const brandsSet = new Set();
    const catsSet = new Set();
    const colorsSet = new Set();
    const warehousesSet = new Set();
    const suppliersSet = new Set();

    products.forEach((p) => {
      brandsSet.add(p.brand);
      catsSet.add(p.category);
      colorsSet.add(p.color);
      const meta = productExtraMeta[p.id];
      if (meta) {
        warehousesSet.add(meta.warehouse);
        suppliersSet.add(meta.supplier);
      }
    });

    return {
      brands: Array.from(brandsSet).sort(),
      categories: Array.from(catsSet).sort(),
      colors: Array.from(colorsSet).sort(),
      warehouses: Array.from(warehousesSet).sort(),
      suppliers: Array.from(suppliersSet).sort(),
    };
  }, [products, productExtraMeta]);

  // --- HANDLERS ---
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRowClick = (productId, e) => {
    // Avoid expanding if click was on action button or checkbox
    if (e.target.closest(".stop-propagation")) {
      return;
    }
    setSelectedProductId(productId);
    setIsDetailsDrawerOpen(true);
  };

  const toggleRowExpand = (productId) => {
    setExpandedRowIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(paginatedProducts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (productId, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, productId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  // --- BUY SINGLE PRODUCT WORKFLOW ---
  const handleQuickPurchaseClick = (prod) => {
    const meta = productExtraMeta[prod.id];
    setPurchaseForm({
      productId: prod.id,
      color: prod.color,
      size: prod.size,
      quantity: 10,
      supplierId: suppliers[0]?.id || "s-1",
      purchasePrice: prod.purchasePrice,
    });
    setIsBuyModalOpen(true);
  };

  const handleSavePurchase = () => {
    const matchedProd = products.find((p) => p.id === purchaseForm.productId);
    if (!matchedProd) return;

    const supplierObj =
      suppliers.find((s) => s.id === purchaseForm.supplierId) || suppliers[0];

    const subTotal = purchaseForm.quantity * purchaseForm.purchasePrice;
    const gstTotal = Math.round(subTotal * 0.12);
    const grandTotal = subTotal + gstTotal;

    // Create a physical PO matching ERP interfaces
    const newPO = {
      id: `po-${Date.now().toString().slice(-4)}`,
      poNo: `PO-MAN-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split("T")[0],
      supplierId: supplierObj.id,
      supplierName: supplierObj.name,
      subTotal,
      gstTotal,
      grandTotal,
      status: "Completed",
      outstandingPaid: grandTotal,
      items: [
        {
          productId: purchaseForm.productId,
          name: matchedProd.name,
          quantity: purchaseForm.quantity,
          purchasePrice: purchaseForm.purchasePrice,
          totalPrice: subTotal,
        },
      ],
    };

    // Increment original products stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === purchaseForm.productId) {
          const newStock = p.stock + purchaseForm.quantity;
          let newStatus = "In Stock";
          if (newStock === 0) newStatus = "Out of Stock";
          else if (newStock <= p.minStockAlert) newStatus = "Low Stock";
          return {
            ...p,
            stock: newStock,
            status: newStatus,
          };
        }
        return p;
      }),
    );

    // Save PO
    setPurchaseOrders((prev) => [newPO, ...prev]);

    // Update supplier ledger outstanding balance
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierObj.id) {
          return {
            ...s,
            outstandingBalance: s.outstandingBalance + newPO.grandTotal,
            totalOrders: s.totalOrders + 1,
          };
        }
        return s;
      }),
    );

    onAddNotification(
      "Purchase Order Finalized",
      `Directly purchased & stocked ${purchaseForm.quantity} units of ${matchedProd.name} (${purchaseForm.size}/${purchaseForm.color}) from ${supplierObj.name}. Inventory updated.`,
      "success",
    );
    setIsBuyModalOpen(false);
  };

  // --- CRUD PRODUCT HANDLERS ---
  const handleCreateProductClick = () => {
    setCrudMode("create");
    setEditingProduct({
      id: `p-${Date.now().toString().slice(-4)}`,
      name: "Designer Casual Chinos",
      brand: brandsList[0] || "Zara",
      category: categoriesList[0] || "Casual Shirts",
      color: colorsList[0] || "Midnight Black",
      size: "M",
      sku: `ZAR-CHI-M-${Date.now().toString().slice(-4)}`,
      barcode: `890${Date.now().toString().slice(-9)}`,
      purchasePrice: 1200,
      sellingPrice: 2200,
      mrp: 2499,
      gstPercent: 12,
      stock: 50,
      minStockAlert: 15,
      status: "In Stock",
      description: "Newly customized premium stretch fabric.",
    });
    setIsCrudModalOpen(true);
  };

  const handleEditProductClick = (prod) => {
    setCrudMode("edit");
    setEditingProduct(prod);
    setIsCrudModalOpen(true);
  };

  const handleSaveCrudProduct = () => {
    if (!editingProduct || !editingProduct.name) return;

    if (crudMode === "create") {
      const prodToSave = editingProduct;
      setProducts((prev) => [prodToSave, ...prev]);
      onAddNotification(
        "Product Registered",
        `Garment ${prodToSave.name} successfully registered.`,
        "success",
      );
    } else {
      const prodToSave = editingProduct;
      setProducts((prev) =>
        prev.map((p) => (p.id === prodToSave.id ? prodToSave : p)),
      );
      onAddNotification(
        "Product Refined",
        `Details for SKU ${prodToSave.sku} updated.`,
        "success",
      );
    }
    setIsCrudModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProductClick = (productId) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    if (
      confirm(
        `Are you absolutely sure you want to delete ${prod.name} from the database?`,
      )
    ) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      onAddNotification(
        "Product Deleted",
        `Removed ${prod.name} from global ERP inventory.`,
        "danger",
      );
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (
      confirm(`Bulk action: Delete ${selectedIds.length} products permanently?`)
    ) {
      setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      onAddNotification(
        "Bulk Deletion Completed",
        `Removed ${selectedIds.length} SKU assets from catalog.`,
        "danger",
      );
      setSelectedIds([]);
    }
  };

  const handleBulkUpdatePrice = () => {
    if (selectedIds.length === 0) return;
    setProducts((prev) =>
      prev.map((p) => {
        if (selectedIds.includes(p.id)) {
          // Boost selling price by 5% as wholesale premium adjustment
          const revisedPrice = Math.round(p.sellingPrice * 1.05);
          return { ...p, sellingPrice: revisedPrice };
        }
        return p;
      }),
    );
    onAddNotification(
      "Bulk Price Calibrated",
      `Adjusted pricing by +5% on ${selectedIds.length} selected items.`,
      "success",
    );
  };

  // --- EXTRA ACTIONS HANDLERS ---
  const handleStockAdjustment = () => {
    const matched = products.find((p) => p.id === selectedProductId);
    if (!matched) return;
    const delta = adjustType === "Add" ? adjustAmount : -adjustAmount;
    if (adjustType === "Remove" && matched.stock < adjustAmount) {
      onAddNotification(
        "Insufficient Available Stock",
        `Cannot deduct ${adjustAmount} units. Only ${matched.stock} available.`,
        "danger",
      );
      return;
    }

    onAdjustStock(matched.id, delta);
    setIsAdjustModalOpen(false);
  };

  const handleWarehouseTransfer = () => {
    const matched = products.find((p) => p.id === selectedProductId);
    if (!matched) return;
    if (!transferFrom || !transferTo || transferFrom === transferTo) {
      alert("Please specify distinct facilities for logistical transfer.");
      return;
    }
    if (matched.stock < transferQty) {
      alert("Transfer quantity exceeds local stock boundaries.");
      return;
    }

    onAddNotification(
      "Logistical Warehouse Transfer",
      `Dispatched ${transferQty} units of ${matched.name} from [${transferFrom}] to [${transferTo}]. Bill of Lading generated.`,
      "info",
    );
    setIsTransferModalOpen(false);
  };

  const handleReservation = () => {
    const matched = products.find((p) => p.id === selectedProductId);
    if (!matched) return;

    if (reserveAction === "reserve") {
      onAddNotification(
        "Stock Ring-fenced",
        `Reserved ${reserveQty} units of SKU ${matched.sku} for priority customer channel allocations.`,
        "success",
      );
    } else {
      onAddNotification(
        "Stock Released",
        `De-reserved ${reserveQty} units of SKU ${matched.sku} back to available trade pool.`,
        "info",
      );
    }
    setIsReserveModalOpen(false);
  };

  const handleContextAction = (action) => {
    if (!contextMenu) return;
    const prod = products.find((p) => p.id === contextMenu.productId);
    setContextMenu(null);
    if (!prod) return;

    setSelectedProductId(prod.id);

    if (action === "details") {
      setIsDetailsDrawerOpen(true);
    } else if (action === "purchase") {
      handleQuickPurchaseClick(prod);
    } else if (action === "adjust") {
      setIsAdjustModalOpen(true);
    } else if (action === "transfer") {
      setIsTransferModalOpen(true);
    } else if (action === "reserve") {
      setIsReserveModalOpen(true);
    } else if (action === "barcode") {
      onAddNotification(
        "Zebra Barcode Printed",
        `Queued raw thermal print job for SKU ${prod.sku}. Check warehouse printer.`,
        "success",
      );
    } else if (action === "qrcode") {
      alert(
        `ERP QR Code payload:\n\nSKU: ${prod.sku}\nBarcode: ${prod.barcode}\nName: ${prod.name}`,
      );
    } else if (action === "duplicate") {
      const duplicate = {
        ...prod,
        id: `p-dup-${Date.now().toString().slice(-4)}`,
        sku: `${prod.sku}-COPY`,
        barcode: `890${Date.now().toString().slice(-9)}`,
        name: `${prod.name} (Copy)`,
      };
      setProducts((prev) => [duplicate, ...prev]);
      onAddNotification(
        "Catalog Cloned",
        `Cloned product to ${duplicate.sku}`,
        "info",
      );
    } else if (action === "delete") {
      handleDeleteProductClick(prod.id);
    }
  };

  // --- EXPORT TO EXCEL ---
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent +=
      "Product Name,SKU,Barcode,Brand,Category,Color,Size,Stock,Purchase Price,Selling Price,Warehouse\r\n";
    filteredProducts.forEach((p) => {
      const meta = productExtraMeta[p.id] || { warehouse: "" };
      const row = `"${p.name}","${p.sku}","${p.barcode}","${p.brand}","${p.category}","${p.color}","${p.size}",${p.stock},${p.purchasePrice},${p.sellingPrice},"${meta.warehouse}"`;
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ERP_Articulation_Matrix_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onAddNotification(
      "Spreadsheet Dispatched",
      "Excel/CSV file compiled with active filters and downloaded.",
      "success",
    );
  };

  // --- PRINT MATRIX VIEW ---
  const handlePrint = () => {
    window.print();
  };

  // --- CONTEXT MENU CLOSE HANDLER ---
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const brandsList = filterOptions.brands;
  const categoriesList = filterOptions.categories;
  const colorsList = filterOptions.colors;
  const warehousesList = filterOptions.warehouses;
  const suppliersList = filterOptions.suppliers;

  const currentSelectedProduct = products.find(
    (p) => p.id === selectedProductId,
  );
  const selectedProductMeta = currentSelectedProduct
    ? productExtraMeta[currentSelectedProduct.id]
    : null;

  return (
    <div
      className="space-y-6 text-slate-800"
      id="articulation-window-root"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* 1. TOP HEADER SUMMARY GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Current Stock
          </span>
          <span className="text-lg font-bold text-slate-900 block font-mono mt-0.5">
            {stockSummary.totalCStock.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">pcs</span>
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Available Pool
          </span>
          <span className="text-lg font-bold text-emerald-600 block font-mono mt-0.5">
            {stockSummary.totalAvail.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">pcs</span>
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Reserved Order
          </span>
          <span className="text-lg font-bold text-amber-600 block font-mono mt-0.5">
            {stockSummary.totalReserve.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">pcs</span>
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Incoming POs
          </span>
          <span className="text-lg font-bold text-indigo-600 block font-mono mt-0.5">
            {stockSummary.totalIncoming.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">pcs</span>
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Stock Value
          </span>
          <span className="text-lg font-bold text-slate-900 block font-mono mt-0.5">
            ₹{stockSummary.totalVal.toLocaleString()}
          </span>
        </div>
        <div className="bg-red-50/50 border border-red-200 p-3 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-red-500 block tracking-wider">
            Out of Stock
          </span>
          <span className="text-lg font-bold text-red-600 block font-mono mt-0.5">
            {stockSummary.outStockCount}{" "}
            <span className="text-xs font-normal text-slate-500">SKUs</span>
          </span>
        </div>
        <div className="bg-amber-50/50 border border-amber-200 p-3 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">
            Low Alerts
          </span>
          <span className="text-lg font-bold text-amber-700 block font-mono mt-0.5">
            {stockSummary.lowStockCount}{" "}
            <span className="text-xs font-normal text-slate-500">SKUs</span>
          </span>
        </div>
      </div>

      {/* 2. DYNAMIC WORKSPACE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* TOP COMPREHENSIVE FILTER BAR */}
        <div className="p-4 bg-slate-50/75 border-b border-slate-200 space-y-3.5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Global Search (Name, Brand, Color...)"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <input
                type="text"
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
                placeholder="SKU"
                className="w-24 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />

              <input
                type="text"
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
                placeholder="Barcode"
                className="w-28 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCreateProductClick}
                className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Garment</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 hover:bg-slate-50 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Matrix</span>
              </button>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setSkuSearch("");
                  setBarcodeSearch("");
                  setBrandFilter("");
                  setCategoryFilter("");
                  setColorFilter("");
                  setSizeFilter("");
                  setWarehouseFilter("");
                  setSupplierFilter("");
                  setStatusFilter("");
                  setSelectedQuickFilter("All");
                  onAddNotification(
                    "Filters Cleared",
                    "Spreadsheet grid resets to absolute defaults.",
                    "info",
                  );
                }}
                className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors"
                title="Reset Filters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SPREADSHEET DROPDOWNS ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-medium"
            >
              <option value="">All Brands</option>
              {brandsList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-medium"
            >
              <option value="">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-medium"
            >
              <option value="">All Colors</option>
              {colorsList.map((cl) => (
                <option key={cl} value={cl}>
                  {cl}
                </option>
              ))}
            </select>

            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-medium"
            >
              <option value="">All Sizes</option>
              {SIZES_LIST.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>

            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-medium col-span-1"
            >
              <option value="">All Warehouses</option>
              {warehousesList.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>

            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-medium col-span-1"
            >
              <option value="">All Suppliers</option>
              {suppliersList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-medium"
            >
              <option value="">Stock Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Discontinued">Discontinued</option>
            </select>

            <div className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-400 font-semibold flex items-center justify-center font-mono">
              2026 Season ACTIVE
            </div>
          </div>

          {/* QUICK CHIP CONTROLS */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap gap-1.5">
              {[
                "All",
                "Low Stock",
                "Out of Stock",
                "High Value",
                "Incoming Orders",
                "Discontinued",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setSelectedQuickFilter(chip)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${selectedQuickFilter === chip ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                <span className="text-[11px] font-bold text-indigo-700">
                  {selectedIds.length} items checked:
                </span>
                <button
                  onClick={handleBulkUpdatePrice}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  Adjust Selling Price (+5%)
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  Bulk Delete SKUs
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. EXCEL-STYLE DENSE SPREADSHEET CANVAS */}
        <div
          className="overflow-auto max-h-[580px] border-b border-slate-200 relative"
          ref={tableRef}
        >
          <table className="w-full text-left border-collapse table-fixed text-xs select-none">
            {/* HEADERS */}
            <thead className="bg-slate-100/90 backdrop-blur-xs sticky top-0 z-20 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                {/* Checkbox Column */}
                <th className="p-2 w-10 text-center sticky left-0 bg-slate-100 z-30 border-r border-slate-200">
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={
                      selectedIds.length === paginatedProducts.length &&
                      paginatedProducts.length > 0
                    }
                    className="cursor-pointer"
                  />
                </th>

                {/* Expander Arrow */}
                <th className="p-2 w-8 text-center sticky left-10 bg-slate-100 z-30 border-r border-slate-200">
                  <span className="sr-only">Expand</span>
                </th>

                {/* Column: Product Image */}
                <th
                  className="p-2 text-center border-r border-slate-200 font-bold text-[10px]"
                  style={{ width: colWidths.image }}
                >
                  IMG
                </th>

                {/* Column: Product Name - STICKY STABLE FIRST HEADER COLUMN */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] sticky left-[78px] bg-slate-100 z-30 cursor-pointer hover:bg-slate-200"
                  style={{ width: colWidths.name }}
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center justify-between">
                    <span>Product Name</span>
                    {sortField === "name" ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="w-3 h-3 text-slate-800" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-800" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>

                {/* Column: SKU */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] cursor-pointer hover:bg-slate-200"
                  style={{ width: colWidths.sku }}
                  onClick={() => handleSort("sku")}
                >
                  <div className="flex items-center justify-between">
                    <span>SKU Code</span>
                    {sortField === "sku" ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="w-3 h-3 text-slate-800" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-800" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>

                {/* Column: Barcode */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] cursor-pointer hover:bg-slate-200"
                  style={{ width: colWidths.barcode }}
                  onClick={() => handleSort("barcode")}
                >
                  <div className="flex items-center justify-between">
                    <span>Barcode</span>
                    {sortField === "barcode" ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="w-3 h-3 text-slate-800" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-800" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>

                {/* Column: Brand */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] cursor-pointer hover:bg-slate-200"
                  style={{ width: colWidths.brand }}
                  onClick={() => handleSort("brand")}
                >
                  <div className="flex items-center justify-between">
                    <span>Brand</span>
                    {sortField === "brand" ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="w-3 h-3 text-slate-800" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-800" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>

                {/* Column: Category */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] cursor-pointer hover:bg-slate-200"
                  style={{ width: colWidths.category }}
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center justify-between">
                    <span>Category</span>
                    {sortField === "category" ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="w-3 h-3 text-slate-800" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-800" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>

                {/* Column: Color */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] cursor-pointer hover:bg-slate-200"
                  style={{ width: colWidths.color }}
                  onClick={() => handleSort("color")}
                >
                  <span>Color</span>
                </th>

                {/* XS to 3XL Stock Sizes Matrix Headers */}
                {SIZES_LIST.map((sz) => (
                  <th
                    key={sz}
                    className="p-2 border-r border-slate-200 font-bold text-[10px] text-center w-[58px]"
                  >
                    {sz}
                  </th>
                ))}

                {/* Column: Total Stock */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] text-center cursor-pointer hover:bg-slate-200"
                  style={{ width: colWidths.totalStock }}
                  onClick={() => handleSort("totalStock")}
                >
                  <span>Tot Stock</span>
                </th>

                {/* Column: Reserved Stock */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] text-center"
                  style={{ width: colWidths.reservedStock }}
                >
                  <span>Reserved</span>
                </th>

                {/* Column: Available Stock */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] text-center"
                  style={{ width: colWidths.availableStock }}
                >
                  <span>Avail</span>
                </th>

                {/* Column: Purchase Quantity */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] text-center"
                  style={{ width: colWidths.purchaseQty }}
                >
                  <span>Purchased</span>
                </th>

                {/* Column: Sold Quantity */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] text-center"
                  style={{ width: colWidths.soldQty }}
                >
                  <span>Sold</span>
                </th>

                {/* Column: Current Stock Value */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] text-center cursor-pointer hover:bg-slate-200"
                  style={{ width: colWidths.value }}
                  onClick={() => handleSort("stockValue")}
                >
                  <span>Stock Val</span>
                </th>

                {/* Column: Purchase Price */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] text-center"
                  style={{ width: colWidths.price }}
                >
                  <span>Pur Price</span>
                </th>

                {/* Column: Selling Price */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px] text-center"
                  style={{ width: colWidths.price }}
                >
                  <span>Sell Price</span>
                </th>

                {/* Column: Warehouse */}
                <th
                  className="p-2 border-r border-slate-200 font-bold text-[10px]"
                  style={{ width: colWidths.warehouse }}
                >
                  <span>Facility</span>
                </th>

                {/* Column: Status */}
                <th
                  className="p-2 font-bold text-[10px] text-center"
                  style={{ width: colWidths.status }}
                >
                  <span>Status</span>
                </th>
              </tr>
            </thead>

            {/* SPREADSHEET ROWS */}
            <tbody className="divide-y divide-slate-200">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={30}
                    className="text-center p-8 text-slate-400 font-medium"
                  >
                    No garment assets match the current search or filter matrix.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const meta = productExtraMeta[p.id] || {
                    rack: "Rack A-1",
                    reserved: 0,
                    available: p.stock,
                    purchaseQty: p.stock,
                    soldQty: 0,
                    value: 0,
                    warehouse: "Facility",
                    supplier: "Vendor",
                    lastPurchaseDate: "-",
                    lastSoldDate: "-",
                    pendingPO: 0,
                    discontinued: false,
                  };
                  const isExpanded = !!expandedRowIds[p.id];
                  const matrixData = getProductMatrix(p);

                  // Color assignment based on stock level
                  let statusColorClass =
                    "bg-emerald-50 text-emerald-700 border-emerald-200";
                  if (meta.discontinued) {
                    statusColorClass =
                      "bg-slate-100 text-slate-500 border-slate-300";
                  } else if (p.status === "Out of Stock") {
                    statusColorClass =
                      "bg-rose-50 text-rose-700 border-rose-200";
                  } else if (p.status === "Low Stock") {
                    statusColorClass =
                      "bg-amber-50 text-amber-700 border-amber-200";
                  }

                  const rowSelected = selectedIds.includes(p.id);

                  return (
                    <React.Fragment key={p.id}>
                      <tr
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            productId: p.id,
                          });
                        }}
                        onClick={(e) => handleRowClick(p.id, e)}
                        className={`hover:bg-slate-50/75 cursor-pointer font-medium text-slate-700 transition-colors ${rowSelected ? "bg-indigo-50/40 hover:bg-indigo-50/60" : ""}`}
                      >
                        {/* Checkbox */}
                        <td className="p-2 text-center sticky left-0 bg-white border-r border-slate-200 z-10 stop-propagation">
                          <input
                            type="checkbox"
                            checked={rowSelected}
                            onChange={(e) =>
                              handleSelectRow(p.id, e.target.checked)
                            }
                            className="cursor-pointer"
                          />
                        </td>

                        {/* Expander arrow */}
                        <td className="p-2 text-center sticky left-10 bg-white border-r border-slate-200 z-10 stop-propagation">
                          <button
                            onClick={() => toggleRowExpand(p.id)}
                            className="text-slate-400 hover:text-slate-800 p-0.5 rounded cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>

                        {/* IMG */}
                        <td className="p-2 text-center border-r border-slate-200">
                          <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden mx-auto">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt="G"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {p.brand.slice(0, 1)}
                                {p.category.slice(0, 1)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Name - Sticky first column */}
                        <td
                          className="p-2 border-r border-slate-200 font-bold text-slate-900 sticky left-[78px] bg-white z-10 truncate"
                          title={p.name}
                        >
                          {p.name}
                        </td>

                        {/* SKU */}
                        <td className="p-2 border-r border-slate-200 font-mono text-[10px] text-slate-500 font-bold truncate">
                          {p.sku}
                        </td>

                        {/* Barcode */}
                        <td className="p-2 border-r border-slate-200 font-mono text-[10px] text-slate-400 truncate">
                          {p.barcode}
                        </td>

                        {/* Brand */}
                        <td className="p-2 border-r border-slate-200 font-semibold text-slate-800 truncate">
                          {p.brand}
                        </td>

                        {/* Category */}
                        <td className="p-2 border-r border-slate-200 text-slate-500 truncate">
                          {p.category}
                        </td>

                        {/* Color */}
                        <td className="p-2 border-r border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-slate-300"
                              style={{
                                backgroundColor:
                                  p.color === "Classic White"
                                    ? "#fff"
                                    : p.color === "Midnight Black"
                                      ? "#000"
                                      : p.color === "Crimson Red"
                                        ? "#dc2626"
                                        : p.color === "Royal Blue"
                                          ? "#2563eb"
                                          : "#94a3b8",
                              }}
                            />
                            <span className="truncate">{p.color}</span>
                          </div>
                        </td>

                        {/* Size Stocks Matrix cells */}
                        {SIZES_LIST.map((sz) => {
                          const sizeStock = matrixData.mainColorMatrix[sz] || 0;
                          return (
                            <td
                              key={sz}
                              className={`p-2 border-r border-slate-200 text-center font-mono font-bold ${sizeStock === 0 ? "text-slate-300" : "text-slate-700"}`}
                            >
                              {sizeStock}
                            </td>
                          );
                        })}

                        {/* Total Stock */}
                        <td
                          className={`p-2 border-r border-slate-200 text-center font-mono font-bold ${p.status === "Out of Stock" ? "text-red-600 bg-rose-50/30" : "text-slate-900"}`}
                        >
                          {p.stock}
                        </td>

                        {/* Reserved Stock */}
                        <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500">
                          {meta.reserved}
                        </td>

                        {/* Available Stock */}
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-emerald-600 bg-emerald-50/10">
                          {meta.available}
                        </td>

                        {/* Purchase Quantity */}
                        <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500">
                          {meta.purchaseQty}
                        </td>

                        {/* Sold Quantity */}
                        <td className="p-2 border-r border-slate-200 text-center font-mono text-indigo-600">
                          {meta.soldQty}
                        </td>

                        {/* Value */}
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-900">
                          ₹{(p.stock * p.purchasePrice).toLocaleString()}
                        </td>

                        {/* Purchase Price */}
                        <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500">
                          ₹{p.purchasePrice}
                        </td>

                        {/* Selling Price */}
                        <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-900">
                          ₹{p.sellingPrice}
                        </td>

                        {/* Warehouse */}
                        <td
                          className="p-2 border-r border-slate-200 text-slate-500 truncate"
                          title={`${meta.warehouse} - ${meta.rack}`}
                        >
                          {meta.warehouse}{" "}
                          <span className="text-[10px] text-slate-400 font-bold block">
                            {meta.rack}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="p-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide inline-block ${statusColorClass}`}
                          >
                            {meta.discontinued ? "Discontinued" : p.status}
                          </span>
                        </td>
                      </tr>

                      {/* EXPANDED ROWS SIZE AND COLOR MATRIX DETAILS */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td
                            colSpan={30}
                            className="p-4 border-b border-slate-200"
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                              {/* Left size-color matrix grid (col-span-7) */}
                              <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-500" />
                                    <span>
                                      Color & Size Matrix Availability Map
                                    </span>
                                  </h4>
                                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                                    Dynamic calculations
                                  </span>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-center text-[11px] border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                                        <th className="p-2 text-left">
                                          Color Accent
                                        </th>
                                        {SIZES_LIST.map((sz) => (
                                          <th key={sz} className="p-2 w-12">
                                            {sz}
                                          </th>
                                        ))}
                                        <th className="p-2 w-16">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium font-mono">
                                      {/* Primary Color Row */}
                                      <tr className="hover:bg-slate-50/30">
                                        <td className="p-2 text-left font-sans font-semibold text-slate-900 flex items-center gap-1.5">
                                          <span
                                            className="w-2.5 h-2.5 rounded-full border border-slate-300"
                                            style={{
                                              backgroundColor:
                                                p.color === "Classic White"
                                                  ? "#fff"
                                                  : p.color === "Midnight Black"
                                                    ? "#000"
                                                    : p.color === "Crimson Red"
                                                      ? "#dc2626"
                                                      : p.color === "Royal Blue"
                                                        ? "#2563eb"
                                                        : "#94a3b8",
                                            }}
                                          />
                                          {p.color}
                                        </td>
                                        {SIZES_LIST.map((sz) => (
                                          <td key={sz} className="p-2">
                                            {matrixData.mainColorMatrix[sz] ||
                                              0}
                                          </td>
                                        ))}
                                        <td className="p-2 font-bold text-slate-900">
                                          {p.stock}
                                        </td>
                                      </tr>

                                      {/* Secondary Colors Simulation rows */}
                                      {matrixData.extraColorsMatrix.map(
                                        (ec, idx) => {
                                          const extraTotal = Object.values(
                                            ec.matrix,
                                          ).reduce((a, b) => a + b, 0);
                                          return (
                                            <tr
                                              key={idx}
                                              className="hover:bg-slate-50/30 text-slate-400"
                                            >
                                              <td className="p-2 text-left font-sans font-semibold flex items-center gap-1.5">
                                                <span
                                                  className="w-2.5 h-2.5 rounded-full border border-slate-300"
                                                  style={{
                                                    backgroundColor:
                                                      ec.color ===
                                                      "Classic White"
                                                        ? "#fff"
                                                        : ec.color ===
                                                            "Midnight Black"
                                                          ? "#000"
                                                          : ec.color ===
                                                              "Crimson Red"
                                                            ? "#dc2626"
                                                            : ec.color ===
                                                                "Royal Blue"
                                                              ? "#2563eb"
                                                              : "#cbd5e1",
                                                  }}
                                                />
                                                {ec.color}
                                              </td>
                                              {SIZES_LIST.map((sz) => (
                                                <td key={sz} className="p-2">
                                                  {ec.matrix[sz] || 0}
                                                </td>
                                              ))}
                                              <td className="p-2 font-bold">
                                                {extraTotal}
                                              </td>
                                            </tr>
                                          );
                                        },
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Right Logistics information panel (col-span-5) */}
                              <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                                <h4 className="font-bold text-slate-800 flex items-center gap-1 border-b border-slate-100 pb-2">
                                  <Truck className="w-4 h-4 text-emerald-500" />
                                  <span>Purchase & Supplier Operations</span>
                                </h4>

                                <div className="grid grid-cols-2 gap-4 text-[11px]">
                                  <div className="space-y-1">
                                    <span className="text-slate-400 block font-semibold">
                                      Active Vendor Partner:
                                    </span>
                                    <span className="font-bold text-slate-700 block">
                                      {meta.supplier}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-slate-400 block font-semibold">
                                      Expected Inflow Date:
                                    </span>
                                    <span className="font-bold text-indigo-600 block flex items-center gap-1">
                                      <span>2026-07-05</span>
                                      <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold px-1 rounded uppercase">
                                        Incoming
                                      </span>
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-slate-400 block font-semibold">
                                      Pending PO Volume:
                                    </span>
                                    <span className="font-bold font-mono text-slate-700 block">
                                      {meta.pendingPO} units
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-slate-400 block font-semibold">
                                      Delivery Logs Status:
                                    </span>
                                    <span className="font-bold text-emerald-600 block">
                                      ✓ 100% On-Time
                                    </span>
                                  </div>
                                </div>

                                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                                    Logistics Actions:
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleQuickPurchaseClick(p)
                                      }
                                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1 rounded-md text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Buy Single</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedProductId(p.id);
                                        setIsAdjustModalOpen(true);
                                      }}
                                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-2 py-1 rounded-md text-[10px] transition-colors cursor-pointer"
                                    >
                                      Adjust Stock
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 font-medium">
              Showing{" "}
              <b>
                {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
              </b>{" "}
              of <b>{filteredProducts.length}</b> records
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="px-2 py-1 bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white rounded-lg cursor-pointer font-bold"
            >
              ≪
            </button>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="px-3 py-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white rounded-lg cursor-pointer font-bold"
            >
              Prev
            </button>
            <span className="px-3 py-1 bg-slate-200 border border-slate-200 text-slate-800 font-bold rounded-lg font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              className="px-3 py-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white rounded-lg cursor-pointer font-bold"
            >
              Next
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="px-2 py-1 bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white rounded-lg cursor-pointer font-bold"
            >
              ≫
            </button>
          </div>
        </div>
      </div>

      {/* 4. PRODUCT DETAILS SLIDE DRAWER PANEL */}
      {isDetailsDrawerOpen && currentSelectedProduct && selectedProductMeta && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-in">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider font-mono">
                  Master Product Blueprint
                </span>
                <h3 className="text-sm font-bold truncate max-w-[320px]">
                  {currentSelectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setIsDetailsDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="p-5 flex-1 overflow-y-auto space-y-6 text-xs">
              {/* Image & Description banner */}
              <div className="flex gap-4 items-start bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="w-20 h-20 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  {currentSelectedProduct.image ? (
                    <img
                      src={currentSelectedProduct.image}
                      alt="P"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-lg font-bold text-slate-300 uppercase">
                      {currentSelectedProduct.brand.slice(0, 1)}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.2 rounded uppercase">
                    {currentSelectedProduct.category}
                  </span>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    {currentSelectedProduct.description ||
                      "Premium finished garment asset cataloged for global ERP distribution."}
                  </p>
                </div>
              </div>

              {/* Core Attributes */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1">
                  Technical Parameters
                </h4>
                <div className="grid grid-cols-2 gap-3.5 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-semibold block">
                      SKU Code:
                    </span>
                    <span className="font-bold font-mono text-slate-800">
                      {currentSelectedProduct.sku}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">
                      Barcode EAN:
                    </span>
                    <span className="font-bold font-mono text-slate-800">
                      {currentSelectedProduct.barcode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">
                      Tax Bracket (GST):
                    </span>
                    <span className="font-bold text-slate-800">
                      {currentSelectedProduct.gstPercent}% Included
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">
                      MRP Value:
                    </span>
                    <span className="font-bold text-slate-800">
                      ₹{currentSelectedProduct.mrp}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">
                      Storage rack:
                    </span>
                    <span className="font-bold text-indigo-600 font-mono">
                      {selectedProductMeta.rack}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">
                      Warehouse Location:
                    </span>
                    <span className="font-bold text-slate-800 truncate block">
                      {selectedProductMeta.warehouse}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Inventory KPI Split */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1">
                  Stock Quantities Dashboard
                </h4>
                <div className="grid grid-cols-3 gap-2.5 font-mono text-center">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-400 font-sans block font-bold">
                      CURRENT
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {currentSelectedProduct.stock}
                    </span>
                  </div>
                  <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                    <span className="text-[9px] text-emerald-600 font-sans block font-bold">
                      AVAILABLE
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                      {selectedProductMeta.available}
                    </span>
                  </div>
                  <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                    <span className="text-[9px] text-amber-600 font-sans block font-bold">
                      RESERVED
                    </span>
                    <span className="text-sm font-bold text-amber-700">
                      {selectedProductMeta.reserved}
                    </span>
                  </div>
                  <div className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                    <span className="text-[9px] text-indigo-600 font-sans block font-bold">
                      INCOMING
                    </span>
                    <span className="text-sm font-bold text-indigo-700">
                      {selectedProductMeta.pendingPO}
                    </span>
                  </div>
                  <div className="bg-red-50/50 p-2 rounded-lg border border-red-100">
                    <span className="text-[9px] text-red-600 font-sans block font-bold">
                      DAMAGED
                    </span>
                    <span className="text-sm font-bold text-red-700">
                      {selectedProductMeta.damaged}
                    </span>
                  </div>
                  <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-500 font-sans block font-bold">
                      RETURNED
                    </span>
                    <span className="text-sm font-bold text-slate-600">
                      {selectedProductMeta.returned}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons inside Drawer */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Interactive Controls
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsAdjustModalOpen(true);
                    }}
                    className="py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Adjust Stock</span>
                  </button>
                  <button
                    onClick={() => {
                      setTransferFrom(selectedProductMeta.warehouse);
                      setTransferTo(
                        warehousesList.find(
                          (w) => w !== selectedProductMeta.warehouse,
                        ) || "",
                      );
                      setIsTransferModalOpen(true);
                    }}
                    className="py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Transfer Stock</span>
                  </button>
                  <button
                    onClick={() => {
                      setReserveAction("reserve");
                      setIsReserveModalOpen(true);
                    }}
                    className="py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5 text-amber-600" />
                    <span>Reserve Stock</span>
                  </button>
                  <button
                    onClick={() =>
                      handleQuickPurchaseClick(currentSelectedProduct)
                    }
                    className="py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Quick Buy Single</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1.5">
                  <button
                    onClick={() =>
                      handleEditProductClick(currentSelectedProduct)
                    }
                    className="py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-semibold text-[10px] flex items-center justify-center gap-0.5 cursor-pointer"
                  >
                    <Edit className="w-3 h-3" /> Edit Item
                  </button>
                  <button
                    onClick={() => {
                      onAddNotification(
                        "Thermal Barcode Enqueued",
                        `Sent barcode sheet for SKU ${currentSelectedProduct.sku} to Zebra ZD420.`,
                        "success",
                      );
                    }}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[10px] flex items-center justify-center gap-0.5 cursor-pointer"
                  >
                    <Barcode className="w-3 h-3" /> Print Tag
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteProductClick(currentSelectedProduct.id)
                    }
                    className="py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md font-semibold text-[10px] flex items-center justify-center gap-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>

              {/* Transactions History Logs */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1">
                  Product Log History Timeline
                </h4>
                <div className="space-y-2 text-[10px]">
                  <div className="p-2 bg-slate-50 border-l-2 border-indigo-500 rounded-r-lg flex justify-between">
                    <div>
                      <span className="font-bold text-slate-700 block">
                        Dispatch Sale Delivery
                      </span>
                      <span className="text-slate-400 font-mono">
                        Reference: BILL-91823 | Clerk: Cashier
                      </span>
                    </div>
                    <span className="font-bold text-rose-600 font-mono">
                      -10 units
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 border-l-2 border-emerald-500 rounded-r-lg flex justify-between">
                    <div>
                      <span className="font-bold text-slate-700 block">
                        Supplier Freight In
                      </span>
                      <span className="text-slate-400 font-mono">
                        Reference: PO-MAN-9982 | Vendor:{" "}
                        {selectedProductMeta.supplier}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-600 font-mono">
                      +50 units
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. BUY SINGLE PRODUCT MODAL (WORKFLOW ACTION) */}
      {isBuyModalOpen && (
        <div className="fixed inset-0 z-55 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Logistical Inventory Purchasing (Direct SKU Entry)</span>
              </h3>
              <button
                onClick={() => setIsBuyModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Target Garment Item
                </label>
                <select
                  value={purchaseForm.productId}
                  onChange={(e) => {
                    const matched = products.find(
                      (p) => p.id === e.target.value,
                    );
                    if (matched) {
                      setPurchaseForm((prev) => ({
                        ...prev,
                        productId: matched.id,
                        purchasePrice: matched.purchasePrice,
                        color: matched.color,
                      }));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                >
                  {products.slice(0, 40).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Purchased Color
                  </label>
                  <input
                    type="text"
                    value={purchaseForm.color}
                    onChange={(e) =>
                      setPurchaseForm((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Target Size Matrix
                  </label>
                  <select
                    value={purchaseForm.size}
                    onChange={(e) =>
                      setPurchaseForm((prev) => ({
                        ...prev,
                        size: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold cursor-pointer"
                  >
                    {SIZES_LIST.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Purchase Qty (Units)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={purchaseForm.quantity}
                    onChange={(e) =>
                      setPurchaseForm((prev) => ({
                        ...prev,
                        quantity: Math.max(1, Number(e.target.value)),
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Purchase Price (₹/Unit)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={purchaseForm.purchasePrice}
                    onChange={(e) =>
                      setPurchaseForm((prev) => ({
                        ...prev,
                        purchasePrice: Math.max(1, Number(e.target.value)),
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Supplier Partner Ledger
                </label>
                <select
                  value={purchaseForm.supplierId}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({
                      ...prev,
                      supplierId: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold cursor-pointer"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Balance: ₹{s.outstandingBalance})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-bold">
                  TOTAL OUTFLOW AMOUNT:
                </span>
                <span className="text-sm font-bold text-indigo-600">
                  ₹
                  {(
                    purchaseForm.quantity * purchaseForm.purchasePrice
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsBuyModalOpen(false)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePurchase}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Save & Stock Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CREATE & EDIT PRODUCT MODAL (CRUD) */}
      {isCrudModalOpen && editingProduct && (
        <div className="fixed inset-0 z-55 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Package className="w-4 h-4 text-indigo-400" />
                <span>
                  {crudMode === "create"
                    ? "Register New Garment Asset"
                    : "Refine Garment Attributes"}
                </span>
              </h3>
              <button
                onClick={() => setIsCrudModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-4 max-h-[480px] overflow-y-auto">
              <div className="col-span-2">
                <label className="block text-slate-400 font-bold mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={editingProduct.name || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  value={editingProduct.sku || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      sku: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Barcode *
                </label>
                <input
                  type="text"
                  value={editingProduct.barcode || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      barcode: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Brand
                </label>
                <select
                  value={editingProduct.brand || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      brand: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer"
                >
                  {brandsList.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Category
                </label>
                <select
                  value={editingProduct.category || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer"
                >
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Color *
                </label>
                <input
                  type="text"
                  value={editingProduct.color || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Size Matrix Anchor
                </label>
                <select
                  value={editingProduct.size || "M"}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      size: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer"
                >
                  {SIZES_LIST.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Purchase Price *
                </label>
                <input
                  type="number"
                  value={editingProduct.purchasePrice || 0}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      purchasePrice: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Selling Price *
                </label>
                <input
                  type="number"
                  value={editingProduct.sellingPrice || 0}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      sellingPrice: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Initial Stock Units
                </label>
                <input
                  type="number"
                  disabled={crudMode === "edit"}
                  value={editingProduct.stock || 0}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      stock: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Min Stock Threshold Alert
                </label>
                <input
                  type="number"
                  value={editingProduct.minStockAlert || 10}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      minStockAlert: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsCrudModalOpen(false)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCrudProduct}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
              >
                Save Catalog Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. QUICK STOCK ADJUSTMENT MODAL */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-55 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>Adjust Stock Levels</span>
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="text-slate-400 block font-semibold mb-1">
                  Adjust Mode:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAdjustType("Add")}
                    className={`py-2 rounded-xl border font-bold ${adjustType === "Add" ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    Stock In (+)
                  </button>
                  <button
                    onClick={() => setAdjustType("Remove")}
                    className={`py-2 rounded-xl border font-bold ${adjustType === "Remove" ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    Stock Out (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Quantity Offset
                </label>
                <input
                  type="number"
                  min={1}
                  value={adjustAmount}
                  onChange={(e) =>
                    setAdjustAmount(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Reference Reason
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Manual audit correction..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStockAdjustment}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
              >
                Apply Correction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. WAREHOUSE TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-55 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Inter-facility Logistical Transfer</span>
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Source Facility
                </label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold"
                >
                  <option value="">Choose Source...</option>
                  {warehousesList.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Destination Facility
                </label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold"
                >
                  <option value="">Choose Destination...</option>
                  {warehousesList.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Logistical Qty to Dispatch
                </label>
                <input
                  type="number"
                  min={1}
                  value={transferQty}
                  onChange={(e) =>
                    setTransferQty(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleWarehouseTransfer}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Dispatch Shipment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. RESERVE / RELEASE STOCK MODAL */}
      {isReserveModalOpen && (
        <div className="fixed inset-0 z-55 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Reserve or Release Stock</span>
              </h3>
              <button
                onClick={() => setIsReserveModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="text-slate-400 block font-semibold mb-1">
                  Target Action:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setReserveAction("reserve")}
                    className={`py-2 rounded-xl border font-bold ${reserveAction === "reserve" ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    Lock Reserved Stock
                  </button>
                  <button
                    onClick={() => setReserveAction("release")}
                    className={`py-2 rounded-xl border font-bold ${reserveAction === "release" ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    Release to Trade Pool
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Lock/Release Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={reserveQty}
                  onChange={(e) =>
                    setReserveQty(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsReserveModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReservation}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. CUSTOM CONTEXT RIGHT-CLICK MENU */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-slate-200 shadow-xl rounded-xl py-1 w-48 z-100 text-xs font-semibold text-slate-700 divide-y divide-slate-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            <button
              onClick={() => handleContextAction("details")}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-left cursor-pointer"
            >
              <List className="w-3.5 h-3.5 text-indigo-500" /> View Detailed
              Blueprint
            </button>
            <button
              onClick={() => handleContextAction("purchase")}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-left cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" /> Direct Wholesale
              Buy
            </button>
          </div>
          <div className="py-1">
            <button
              onClick={() => handleContextAction("adjust")}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-left cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" /> Quick
              Stock Adjustment
            </button>
            <button
              onClick={() => handleContextAction("transfer")}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-left cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-indigo-500" /> Logistics Stock
              Transfer
            </button>
            <button
              onClick={() => handleContextAction("reserve")}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-left cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-orange-500" /> Reserve /
              Release Stock
            </button>
          </div>
          <div className="py-1">
            <button
              onClick={() => handleContextAction("barcode")}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-left cursor-pointer"
            >
              <Barcode className="w-3.5 h-3.5 text-slate-500" /> Print Thermal
              Barcode
            </button>
            <button
              onClick={() => handleContextAction("qrcode")}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-left cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-500" /> Generate QR Code
            </button>
          </div>
          <div className="py-1">
            <button
              onClick={() => handleContextAction("duplicate")}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-left cursor-pointer text-indigo-600"
            >
              <Copy className="w-3.5 h-3.5" /> Clone SKU Asset
            </button>
            <button
              onClick={() => handleContextAction("delete")}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-left text-rose-600 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete SKU permanently
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

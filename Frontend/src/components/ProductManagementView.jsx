import api from '../api/axios';
import React, { useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";

export const ProductManagementView = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProducts,
  onAddNotification,
  currentUser,
  onNavigate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState("products");

  // GST & SGST Config States
  const [cgstPercent, setCgstPercent] = useState(5);
  const [sgstPercent, setSgstPercent] = useState(5);
  const [taxLoading, setTaxLoading] = useState(false);

  const fetchTaxConfig = async () => {
    setTaxLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/products/tax-config`);
      const json = res.data;
      if (json.success && json.data) {
        setCgstPercent(json.data.cgstRate);
        setSgstPercent(json.data.sgstRate);
      }
    } catch (err) {
      console.error("Failed to load tax config:", err);
    } finally {
      setTaxLoading(false);
    }
  };

  const handleSaveTaxConfig = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/products/tax-config`, { cgstRate: cgstPercent, sgstRate: sgstPercent });
      const json = res.data;
      if (json.success) {
        onAddNotification("Config Saved", "GST & SGST settings updated successfully.", "success");
      } else {
        onAddNotification("Error", json.message, "danger");
      }
    } catch (err) {
      onAddNotification("Connection Error", err.message, "danger");
    }
  };

  React.useEffect(() => {
    if (activeSubTab === "gst-config") {
      fetchTaxConfig();
    }
  }, [activeSubTab]);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Multi select rows
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add/Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingProductId, setEditingProductId] = useState(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Casual Shirts");
  const [formBrand, setFormBrand] = useState("Raymond");
  const [formSKU, setFormSKU] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formSize, setFormSize] = useState("M");
  const [formVariants, setFormVariants] = useState([]);
  const [formPurchasePrice, setFormPurchasePrice] = useState(500);
  const [formMRP, setFormMRP] = useState(1200);
  const [formSellingPrice, setFormSellingPrice] = useState(1000);
  const [formGSTPercent, setFormGSTPercent] = useState(12);
  const [formStock, setFormStock] = useState(50);
  const [formMinStock, setFormMinStock] = useState(10);

  // Calculate dynamic categories from products
  const dynamicCategoriesList = React.useMemo(() => {
    const counts = {};
    products.forEach(p => {
      const cat = p.category || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map((cat, idx) => ({
      id: `cat-${idx}`,
      name: cat,
      code: cat.substring(0, 3).toUpperCase() + "-00" + (idx+1),
      totalProducts: counts[cat],
      description: `All garments under ${cat}`
    }));
  }, [products]);

  // Calculate dynamic brands from products
  const dynamicBrandsList = React.useMemo(() => {
    const counts = {};
    products.forEach(p => {
      const brand = p.brand || "Generic";
      counts[brand] = (counts[brand] || 0) + 1;
    });
    return Object.keys(counts).map((brand, idx) => ({
      id: `b-${idx}`,
      name: brand,
      code: brand.substring(0, 3).toUpperCase(),
      totalProducts: counts[brand]
    }));
  }, [products]);

  // Filters application
  const filteredProductsList = products.filter((p) => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCat =
      selectedCategory === "All" || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesBrand = selectedBrand === "All" || p.brand === selectedBrand;
    let matchesStatus = true;
    if (selectedStatus === "In Stock")
      matchesStatus = p.status === 'In Stock';
    else if (selectedStatus === "Low Stock")
      matchesStatus = p.status === 'Low Stock';
    else if (selectedStatus === "Out of Stock") matchesStatus = p.status === 'Out of Stock';

    return matchesSearch && matchesCat && matchesBrand && matchesStatus && (activeSubTab === 'low_stock' ? p.status === 'Low Stock' : true);
  });

  // Group products by style (Name + Brand)
  const groupedProductsList = React.useMemo(() => {
    const groups = {};
    filteredProductsList.forEach(p => {
       const baseName = p.name ? p.name.split('-')[0].trim().toLowerCase() : '';
       const key = `${baseName}-${p.brand?.trim().toLowerCase()}`;
       if (!groups[key]) {
           groups[key] = { 
             ...p, 
             sizesAvailable: new Set(p.size ? [p.size] : []), 
             colorsAvailable: new Set(p.color ? [p.color] : []),
             variants: [p] 
           };
       } else {
           if (p.size) groups[key].sizesAvailable.add(p.size);
           if (p.color) groups[key].colorsAvailable.add(p.color);
           groups[key].variants.push(p);
           groups[key].stock += (p.stock || 0);
           groups[key].openingStock = (groups[key].openingStock || 0) + (p.openingStock || 0);
           groups[key].purchasedQuantity = (groups[key].purchasedQuantity || 0) + (p.purchasedQuantity || 0);
           groups[key].threshold = (groups[key].threshold || 0) + (p.threshold || 0);
       }
    });
    return Object.values(groups).map(g => {
       const totalIncoming = (g.openingStock || 0) + (g.purchasedQuantity || 0);
       const stockPercentage = totalIncoming > 0 ? Number(((g.stock / totalIncoming) * 100).toFixed(1)) : 0;
       return {
         ...g,
         stockPercentage,
         size: g.sizesAvailable.size > 0 ? Array.from(g.sizesAvailable).join(", ") : "-",
         color: g.colorsAvailable.size > 0 ? Array.from(g.colorsAvailable).join(", ") : "-"
       };
    });
  }, [filteredProductsList]);

  // Pagination logic
  const totalItems = groupedProductsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = groupedProductsList.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Reset page when filters change
  const handleFilterChange = (filterType, value) => {
    if (filterType === "cat") setSelectedCategory(value);
    if (filterType === "brand") setSelectedBrand(value);
    if (filterType === "status") setSelectedStatus(value);
    setCurrentPage(1);
  };

  // Row selection helpers
  const toggleSelectRow = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === paginatedProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(paginatedProducts.map((p) => p.id));
    }
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    if (selectedProductIds.length === 0) return;
    onDeleteProducts(selectedProductIds);
    onAddNotification(
      "Bulk Actions Terminal",
      `Mass-deleted ${selectedProductIds.length} catalog garments.`,
      "success",
    );
    setSelectedProductIds([]);
  };

  const handleBulkMarkDown = () => {
    if (selectedProductIds.length === 0) return;
    selectedProductIds.forEach((id) => {
      const match = products.find((p) => p.id === id);
      if (match) {
        match.sellingPrice = Math.floor(match.sellingPrice * 0.9); // 10% discount
      }
    });
    onAddNotification(
      "Bulk Actions Terminal",
      `Applied flat 10% catalog markdown across ${selectedProductIds.length} styles.`,
      "success",
    );
    setSelectedProductIds([]);
  };

  // Open create modal
  const openCreateModal = () => {
    setModalMode("create");
    setFormName("");
    setFormSKU("");
    setFormBarcode(`890${String(100000000 + products.length + 1)}`);
    setFormColor("");
    setFormSize("M");
    setFormVariants([]);
    setFormPurchasePrice(450);
    setFormMRP(1200);
    setFormSellingPrice(999);
    setFormStock(40);
    setFormMinStock(8);
    setShowProductModal(true);
  };

  // Open Edit Modal
  const openEditModal = (prod) => {
    setModalMode("edit");
    setEditingProductId(prod.id);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormBrand(prod.brand);
    setFormSKU(prod.sku);
    setFormBarcode(prod.barcode);
    setFormColor(prod.color);
    setFormSize(prod.size);
    setFormVariants(prod.variants || []);
    setFormPurchasePrice(prod.purchasePrice);
    setFormMRP(prod.mrp);
    setFormSellingPrice(prod.sellingPrice);
    setFormStock(prod.stock);
    setFormMinStock(prod.minStockAlert);
    setShowProductModal(true);
  };

  // Submit Modal Form
  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (modalMode === "create") {
      const newProd = {
        id: `p-${products.length + 1}`,
        name: formName,
        category: formCategory,
        brand: formBrand,
        sku: formSKU || `SKU-${Date.now().toString().substring(8)}`,
        barcode: formBarcode,
        color: formColor || "Classic White",
        size: formCategory.toLowerCase().includes("saree") ? "FS" : formSize,
        purchasePrice: formPurchasePrice,
        sellingPrice: formSellingPrice,
        mrp: formMRP,
        gstPercent: formGSTPercent,
        stock: formStock,
        minStockAlert: formMinStock,
        status:
          formStock === 0
            ? "Out of Stock"
            : formStock <= formMinStock
              ? "Low Stock"
              : "In Stock",
        description: `Premium newly created apparel by ${formBrand}. Perfect fit tailored item.`,
      };
      onAddProduct(newProd);
      onAddNotification(
        "Garment Saved",
        `Registered ${formName} under active stock catalogs.`,
        "success",
      );
    } else {
      if (editingProductId) {
        const updated = {
          id: editingProductId,
          name: formName,
          category: formCategory,
          brand: formBrand,
          sku: formSKU,
          barcode: formBarcode,
          color: formColor,
          size: formCategory.toLowerCase().includes("saree") ? "FS" : formSize,
          purchasePrice: formPurchasePrice,
          sellingPrice: formSellingPrice,
          mrp: formMRP,
          gstPercent: formGSTPercent,
          stock: formStock,
          minStockAlert: formMinStock,
          status:
            formStock === 0
              ? "Out of Stock"
              : formStock <= formMinStock
                ? "Low Stock"
                : "In Stock",
        };
        onUpdateProduct(updated);
        onAddNotification(
          "Garment Updated",
          `Successfully updated profile parameters for ${formName}.`,
          "success",
        );
      }
    }
    setShowProductModal(false);
  };

  // Simulated Excel/CSV handlers
  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Product Name,Category,Brand,SKU,Barcode,Stock,MRP,Selling Price"].join(
        ",",
      ) +
      "\n" +
      products
        .slice(0, 15)
        .map(
          (p) =>
            `"${p.name}","${p.category}","${p.brand}","${p.sku}","${p.barcode}",${p.stock},₹${p.mrp},₹${p.sellingPrice}`,
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "garmentflow_stock_catalog.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onAddNotification(
      "CSV Generator",
      "Stock catalog exported successfully to CSV sheet format.",
      "success",
    );
  };

  const handleImportCSV = () => {
    onAddNotification(
      "CSV Loader",
      "Reading schema of garmentflow_import_template.xlsx...",
      "info",
    );
    onAddNotification(
      "CSV Feed",
      "Successfully added 12 new items matchingRaymond collections.",
      "success",
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="product-mgmt-root">
      {/* Module Navigation Tabs */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab("products")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeSubTab === "products" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Garment Catalog
          </button>
          <button
            onClick={() => setActiveSubTab("categories")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeSubTab === "categories" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Category Grid
          </button>
          <button
            onClick={() => setActiveSubTab("brands")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeSubTab === "brands" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Brand Assets
          </button>
          <button
            onClick={() => setActiveSubTab("low_stock")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeSubTab === "low_stock" ? "bg-orange-500 text-white shadow-xs" : "text-orange-600 hover:text-orange-700 bg-orange-50"}`}
          >
            Low Stock Products
          </button>
          <button
            onClick={() => setActiveSubTab("gst-config")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeSubTab === "gst-config" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            GST & SGST Configuration
          </button>
        </div>

        {activeSubTab === "products" && currentUser?.role?.toLowerCase() !== 'salesperson' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleImportCSV}
              className="p-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import Excel</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
            <button
              onClick={openCreateModal}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Garment</span>
            </button>
          </div>
        )}
      </div>

      {/* RENDER PRODUCTS LIST */}
      {(activeSubTab === "products" || activeSubTab === "low_stock") && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 bg-indigo-50/50 px-4 py-2 rounded-xl border border-indigo-100 w-fit">
            <span className="font-bold text-slate-700 mr-2">Stock Legend:</span>
            <span className="flex items-center gap-1"><span className="text-xs">🟢</span> In Stock</span>
            <span className="flex items-center gap-1"><span className="text-xs">🟡</span> Low Stock</span>
            <span className="flex items-center gap-1"><span className="text-xs">🔴</span> Out of Stock / Unconfigured</span>
          </div>
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between text-xs font-semibold">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search catalog by name, sku, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 pl-9 pr-3 py-2 rounded-xl border border-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700"
              />
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
              <div>
                <span className="text-slate-400 mr-1.5">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleFilterChange("cat", e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5"
                >
                  <option value="All">All Categories</option>
                  {Array.from(new Set(products.map((p) => p.category))).map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <span className="text-slate-400 mr-1.5">Brand:</span>
                <select
                  value={selectedBrand}
                  onChange={(e) => handleFilterChange("brand", e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5"
                >
                  <option value="All">All Brands</option>
                  {Array.from(new Set(products.map((p) => p.brand))).map(
                    (b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <span className="text-slate-400 mr-1.5">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5"
                >
                  <option value="All">All Statuses</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Actions Panel if any row is selected */}
          {selectedProductIds.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex justify-between items-center text-xs animate-scale-up">
              <span className="font-semibold text-indigo-800">
                {selectedProductIds.length} items selected for bulk updates
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkMarkDown}
                  className="bg-white text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>10% Discount MarkDown</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedProductIds.length ===
                            paginatedProducts.length &&
                          paginatedProducts.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="p-3.5">Garment Style</th>
                    <th className="p-3.5">SKU & Barcode</th>
                    <th className="p-3.5">Color / Size</th>
                    {activeSubTab === 'low_stock' ? (
                      <>
                        <th className="p-3.5 text-center">Opening Qty</th>
                        <th className="p-3.5 text-center">Current Qty</th>
                        <th className="p-3.5 text-center">Threshold</th>
                        <th className="p-3.5 text-center">Stock %</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3.5 text-right">Cost Price</th>
                        <th className="p-3.5 text-right">Retail MRP</th>
                        <th className="p-3.5 text-right">Selling Price</th>
                        <th className="p-3.5 text-center">In Stock</th>
                      </>
                    )}
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {paginatedProducts.map((p, idx) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isSelected ? "bg-indigo-50/20" : ""}`}
                        onClick={() => {
                          if (currentUser?.role?.toLowerCase() !== 'salesperson') {
                            openEditModal(p);
                          }
                        }}
                      >
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(p.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono shrink-0">
                                PRD-{p.id ? p.id.toString().substring(Math.max(0, p.id.toString().length - 6)).toUpperCase() : "TEMP"}
                              </span>
                              <p className="font-bold text-slate-800 leading-tight">
                                {p.name}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {p.category} | {p.brand}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono">
                          <p className="font-semibold text-slate-700">
                            {p.sku}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {p.barcode}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-slate-700 font-medium">
                            {p.color}
                          </span>{" "}
                          /{" "}
                          <span className="bg-slate-100 text-slate-600 px-1 rounded font-bold font-mono text-[10px]">
                            {p.size}
                          </span>
                        </td>
                        {activeSubTab === 'low_stock' ? (
                          <>
                            <td className="p-3.5 text-center font-mono text-slate-500">
                              {p.openingStock || 0}
                            </td>
                            <td className="p-3.5 text-center font-bold font-mono text-indigo-600">
                              {p.stock || 0}
                            </td>
                            <td className="p-3.5 text-center font-mono text-slate-500">
                              {p.threshold || 0}
                            </td>
                            <td className="p-3.5 text-center font-mono font-semibold">
                              {p.stockPercentage || 0}%
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3.5 text-right font-mono">
                              ₹{p.purchasePrice}
                            </td>
                            <td className="p-3.5 text-right font-mono text-slate-400 line-through">
                              ₹{p.mrp}
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold text-indigo-600">
                              ₹{p.sellingPrice}
                            </td>
                            <td className="p-3.5 text-center font-bold font-mono">
                              {p.stock}
                            </td>
                          </>
                        )}
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.status === 'Out of Stock' ? "bg-red-100 text-red-700" : p.status === 'Low Stock' ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            {p.status || 'In Stock'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {currentUser?.role?.toLowerCase() !== 'salesperson' ? (
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you sure you want to permanently delete "${p.name}"?`)) {
                                    onDeleteProducts([p.id]);
                                    onAddNotification(
                                      "Catalog Item Deleted",
                                      `Removed "${p.name}" from products ledger.`,
                                      "danger",
                                    );
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, totalItems)} of{" "}
                {totalItems} items
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES GRID SUBTAB */}
      {activeSubTab === "categories" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dynamicCategoriesList.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.name);
                setActiveSubTab("products");
              }}
              className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-3 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start">
                <span className="bg-indigo-50 text-indigo-600 font-mono font-bold text-xs px-2 py-0.5 rounded">
                  {cat.code}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {cat.totalProducts} Garments
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm">{cat.name}</h4>
              <p className="text-xs text-slate-400">{cat.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* BRANDS SUBTAB */}
      {activeSubTab === "brands" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {dynamicBrandsList.map((b) => (
            <div
              key={b.id}
              onClick={() => {
                setSelectedBrand(b.name);
                setActiveSubTab("products");
              }}
              className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs text-center space-y-3 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center font-mono font-bold text-lg text-slate-600">
                {b.name[0]}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{b.name}</h4>
                <p className="text-[10px] text-slate-400 font-mono font-semibold uppercase">
                  {b.code}
                </p>
              </div>
              <span className="text-[10px] bg-slate-50 px-2 py-1 rounded text-slate-500 font-bold">
                {b.totalProducts} registered styles
              </span>
            </div>
          ))}
        </div>
      )}

      {/* GST & SGST CONFIGURATION SUBTAB */}
      {activeSubTab === "gst-config" && (
        <div className="max-w-md bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">GST & SGST Configuration</h3>
            <p className="text-[10px] text-slate-400">Configure default tax percentages applied on POS Billing checkouts.</p>
          </div>

          {taxLoading ? (
            <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Loading settings from database...</div>
          ) : (
            <form onSubmit={handleSaveTaxConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">CGST Rate (%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={cgstPercent}
                    onChange={(e) => setCgstPercent(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">SGST Rate (%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={sgstPercent}
                    onChange={(e) => setSgstPercent(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Preview Applied Total Tax</span>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600">Total Tax Rate (CGST + SGST)</span>
                  <span className="text-indigo-600 font-mono">{cgstPercent + sgstPercent}%</span>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Save Tax Configuration
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                {modalMode === "create"
                  ? "Register New Garment Style"
                  : "Update Garment Style Parameters"}
              </h4>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Garment Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                    placeholder="e.g. Raymond Executive Silk Kurta"
                  />
                </div>

                {modalMode === "edit" && (
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 mb-1 font-semibold">
                      Unique Product ID (Read-Only)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`PRD-${editingProductId ? editingProductId.toString().substring(Math.max(0, editingProductId.toString().length - 6)).toUpperCase() : ""}`}
                      className="w-full bg-slate-100 border border-slate-250 px-3 py-2 rounded-xl font-mono text-slate-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Category Group
                  </label>
                  <input
                    type="text"
                    list="categories-list"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                    placeholder="Select or type custom..."
                  />
                  <datalist id="categories-list">
                    {dynamicCategoriesList.map(cat => (
                      <option key={cat.id} value={cat.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Brand Label
                  </label>
                  <input
                    type="text"
                    list="brands-list"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                    placeholder="Select or type custom..."
                  />
                  <datalist id="brands-list">
                    {dynamicBrandsList.map(brand => (
                      <option key={brand.id} value={brand.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    SKU Code *
                  </label>
                  <input
                    required
                    type="text"
                    value={formSKU}
                    onChange={(e) => setFormSKU(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono uppercase"
                    placeholder="e.g. RAY-TRS-M-1024"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Barcode EAN
                  </label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Color Shade
                  </label>
                  <input
                    type="text"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                    placeholder="e.g. Royal Indigo"
                  />
                </div>

                <div>
                  <label className="text-slate-500 mb-1 font-semibold flex justify-between items-center">
                    <span>Sizing Code</span>
                    <span className="flex items-center gap-1.5 text-[9px] font-medium bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      <span>🟢 In Stock</span>
                      <span>🟡 Low</span>
                      <span>🔴 Out</span>
                    </span>
                  </label>
                  <select
                    value={formCategory.toLowerCase().includes("saree") ? "FS" : formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    disabled={formCategory.toLowerCase().includes("saree")}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {["XS", "S", "M", "L", "XL", "XXL", "3XL", "FS"].map(s => {
                       const variant = formVariants.find(v => v.size === s);
                       let emoji = "🔴 "; // Default to Out of Stock for unconfigured sizes
                       if (variant) {
                          if (variant.stock <= 0) emoji = "🔴 ";
                          else if (variant.stock <= (variant.minStockAlert || 5)) emoji = "🟡 ";
                          else emoji = "🟢 ";
                       }
                       return <option key={s} value={s}>{emoji}{s}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Buy Price (Cost)
                  </label>
                  <input
                    type="number"
                    value={formPurchasePrice}
                    onChange={(e) =>
                      setFormPurchasePrice(Number(e.target.value))
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Retail Price (MRP)
                  </label>
                  <input
                    type="number"
                    value={formMRP}
                    onChange={(e) => setFormMRP(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    POS Selling Price
                  </label>
                  <input
                    type="number"
                    value={formSellingPrice}
                    onChange={(e) =>
                      setFormSellingPrice(Number(e.target.value))
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    GST Rate (%)
                  </label>
                  <select
                    value={formGSTPercent}
                    onChange={(e) => setFormGSTPercent(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                  >
                    <option value="5">5% (Sarees / handlooms)</option>
                    <option value="12">12% (Standard garments)</option>
                    <option value="18">18% (Luxury items)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Initial Stock Level
                  </label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                {modalMode === "edit" && onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                       const p = products.find(prod => prod.id === editingProductId);
                       if (p) {
                         localStorage.setItem("pending_pos_cart_item", JSON.stringify(p));
                         setShowProductModal(false);
                         onNavigate("billing");
                       }
                    }}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-200 shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Send to POS Cart
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-md cursor-pointer"
                >
                  Save Catalog Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

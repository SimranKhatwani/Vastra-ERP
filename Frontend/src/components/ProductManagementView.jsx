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
} from "lucide-react";

export const ProductManagementView = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProducts,
  onAddNotification,
}) => {
  // Navigation tabs: Products, Categories, Brands
  const [activeSubTab, setActiveSubTab] = useState("products");

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
  const [formPurchasePrice, setFormPurchasePrice] = useState(500);
  const [formMRP, setFormMRP] = useState(1200);
  const [formSellingPrice, setFormSellingPrice] = useState(1000);
  const [formGSTPercent, setFormGSTPercent] = useState(12);
  const [formStock, setFormStock] = useState(50);
  const [formMinStock, setFormMinStock] = useState(10);

  // Mock Categories and Brands
  const mockCategoriesList = [
    {
      id: "cat-1",
      name: "Casual Shirts",
      code: "CSH",
      description: "Men & Women everyday shirts",
      totalProducts: 34,
    },
    {
      id: "cat-2",
      name: "Formal Shirts",
      code: "FSH",
      description: "Premium business wear threads",
      totalProducts: 28,
    },
    {
      id: "cat-3",
      name: "Trousers",
      code: "TRS",
      description: "Tailored chino trousers",
      totalProducts: 24,
    },
    {
      id: "cat-4",
      name: "Denim Jeans",
      code: "DNM",
      description: "Standard indigo denim cuts",
      totalProducts: 30,
    },
    {
      id: "cat-5",
      name: "Kurtas & Kurtis",
      code: "KRT",
      description: "Designer ethnic kurtis & tunics",
      totalProducts: 45,
    },
    {
      id: "cat-6",
      name: "Sarees",
      code: "SAR",
      description: "Traditional pure silk banarasi sarees",
      totalProducts: 22,
    },
  ];

  const mockBrandsList = [
    { id: "b-1", name: "Raymond", code: "RAY", totalProducts: 42 },
    { id: "b-2", name: "Allen Solly", code: "ALS", totalProducts: 35 },
    { id: "b-3", name: "Zara", code: "ZAR", totalProducts: 28 },
    { id: "b-4", name: "Levis", code: "LEV", totalProducts: 30 },
    { id: "b-5", name: "Biba", code: "BIB", totalProducts: 31 },
  ];

  // Filters application
  const filteredProductsList = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    const matchesCat =
      selectedCategory === "All" || p.category === selectedCategory;
    const matchesBrand = selectedBrand === "All" || p.brand === selectedBrand;
    let matchesStatus = true;
    if (selectedStatus === "In Stock")
      matchesStatus = p.stock > p.minStockAlert;
    else if (selectedStatus === "Low Stock")
      matchesStatus = p.stock > 0 && p.stock <= p.minStockAlert;
    else if (selectedStatus === "Out of Stock") matchesStatus = p.stock === 0;

    return matchesSearch && matchesCat && matchesBrand && matchesStatus;
  });

  // Pagination logic
  const totalItems = filteredProductsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProductsList.slice(
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
        size: formSize,
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
          size: formSize,
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
      {activeSubTab === "products" && (
        <div className="space-y-4">
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
                    <th className="p-3.5 text-right">Cost Price</th>
                    <th className="p-3.5 text-right">Retail MRP</th>
                    <th className="p-3.5 text-right">Selling Price</th>
                    <th className="p-3.5 text-center">In Stock</th>
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
                        className={`hover:bg-slate-50/50 transition-colors ${isSelected ? "bg-indigo-50/20" : ""}`}
                      >
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(p.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="p-3.5">
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">
                              {p.name}
                            </p>
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
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${p.stock === 0 ? "bg-red-100 text-red-700" : p.stock <= p.minStockAlert ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            {p.stock === 0
                              ? "OUT"
                              : p.stock <= p.minStockAlert
                                ? "LOW"
                                : "SAFE"}
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
                                onClick={() => {
                                  onDeleteProducts([p.id]);
                                  onAddNotification(
                                    "Catalog Item Deleted",
                                    `Removed "${p.name}" from products ledger.`,
                                    "danger",
                                  );
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
          {mockCategoriesList.map((cat) => (
            <div
              key={cat.id}
              className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-3"
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
          {mockBrandsList.map((b) => (
            <div
              key={b.id}
              className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs text-center space-y-3"
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

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Category Group
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                  >
                    <option value="Casual Shirts">Casual Shirts</option>
                    <option value="Formal Shirts">Formal Shirts</option>
                    <option value="Trousers">Trousers</option>
                    <option value="Denim Jeans">Denim Jeans</option>
                    <option value="Kurtas & Kurtis">Kurtas & Kurtis</option>
                    <option value="Sarees">Sarees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Brand Label
                  </label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                  >
                    <option value="Raymond">Raymond</option>
                    <option value="Allen Solly">Allen Solly</option>
                    <option value="Zara">Zara</option>
                    <option value="Levis">Levis</option>
                    <option value="Biba">Biba</option>
                  </select>
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
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Sizing Code
                  </label>
                  <select
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
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

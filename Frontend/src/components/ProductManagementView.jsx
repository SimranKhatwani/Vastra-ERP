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
  Loader2
} from "lucide-react";

export const ProductManagementView = ({
  products = [],
  isLoadingProducts = false,
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
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [selectedSize, setSelectedSize] = useState("All");
  const [selectedColor, setSelectedColor] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

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

  // Local state for products with persistent direct API fetch fallback
  const [localProducts, setLocalProducts] = React.useState(products || []);
  const [isFetching, setIsFetching] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    if (Array.isArray(products)) {
      setLocalProducts(products.map(p => ({ ...p, id: p._id || p.id })));
    }
    const fetchLiveProducts = async () => {
      setIsFetching(true);
      try {
        const res = await api.get(`/products`);
        if (res.data?.success && isMounted) {
          const raw = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.products || []);
          setLocalProducts(raw.map(p => ({ ...p, id: p._id || p.id })));
        }
      } catch (err) {
        console.error("Fetch live products in ProductManagementView error:", err);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };
    fetchLiveProducts();
    return () => { isMounted = false; };
  }, [products]);

  // Helper for safe string conversions
  const safeStr = (val, fallback = '') => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val.name || val.code || fallback;
    return String(val);
  };

  // Dynamic Companies List
  const dynamicCompaniesList = React.useMemo(() => {
    const set = new Set();
    (localProducts || []).forEach(p => {
      const comp = safeStr(p.company, safeStr(p.firmName, "Primary Store Firm"));
      set.add(comp);
    });
    return Array.from(set);
  }, [localProducts]);

  // Dynamic Sizes List
  const dynamicSizesList = React.useMemo(() => {
    const set = new Set();
    (localProducts || []).forEach(p => {
      const sz = safeStr(p.size);
      if (sz) sz.split(',').forEach(s => set.add(s.trim()));
    });
    return Array.from(set).filter(Boolean);
  }, [localProducts]);

  // Dynamic Colors List
  const dynamicColorsList = React.useMemo(() => {
    const set = new Set();
    (localProducts || []).forEach(p => {
      const clr = safeStr(p.primaryColor, safeStr(p.color));
      if (clr) set.add(clr.trim());
    });
    return Array.from(set).filter(Boolean);
  }, [localProducts]);

  // Dynamic Categories List
  const dynamicCategoriesList = React.useMemo(() => {
    const counts = {};
    (localProducts || []).forEach(p => {
      const cat = safeStr(p.categoryId, safeStr(p.category, "Uncategorized"));
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map((cat, idx) => ({
      id: `cat-${idx}`,
      name: cat,
      code: cat.substring(0, 3).toUpperCase() + "-00" + (idx+1),
      totalProducts: counts[cat],
      description: `All garments under ${cat}`
    }));
  }, [localProducts]);

  // Dynamic Brands List
  const dynamicBrandsList = React.useMemo(() => {
    const counts = {};
    (localProducts || []).forEach(p => {
      const brand = safeStr(p.brandId, safeStr(p.brand, "Generic"));
      counts[brand] = (counts[brand] || 0) + 1;
    });
    return Object.keys(counts).map((brand, idx) => ({
      id: `b-${idx}`,
      name: brand,
      code: brand.substring(0, 3).toUpperCase(),
      totalProducts: counts[brand]
    }));
  }, [localProducts]);

  // Filters application & MongoDB field mapping
  const filteredProductsList = (localProducts || []).map(p => {
    const categoryName = safeStr(p.categoryId, safeStr(p.category, 'General'));
    const brandName = safeStr(p.brandId, safeStr(p.brand, 'Generic'));
    const companyName = safeStr(p.company, safeStr(p.firmName, 'Primary Store Firm'));
    const sizeVal = safeStr(p.size, 'FREE');
    const colorVal = safeStr(p.primaryColor, safeStr(p.color, '-'));
    const secondaryColorVal = safeStr(p.secondaryColor, '-');
    const hsnVal = safeStr(p.hsnId, safeStr(p.hsn, 'N/A'));

    return {
      ...p,
      id: p._id || p.id,
      name: safeStr(p.itemName, safeStr(p.name, 'Unnamed Product')),
      itemName: safeStr(p.itemName, safeStr(p.name, 'Unnamed Product')),
      subItem: safeStr(p.subItem, ''),
      designNo: safeStr(p.designNo, 'N/A'),
      itemCode: safeStr(p.itemCode, safeStr(p.designNo, 'N/A')),
      sku: safeStr(p.itemCode, safeStr(p.designNo, safeStr(p.sku, 'N/A'))),
      productCode: safeStr(p.itemCode, safeStr(p.designNo, safeStr(p.productCode, 'N/A'))),
      barcode: safeStr(p.barcode, safeStr(p.pieces?.[0]?.barcode, '')),
      uniqueCode: safeStr(p.uniqueCode, safeStr(p.pieces?.[0]?.uniqueCode, '')),
      ipn: safeStr(p.ipn, safeStr(p.pieces?.[0]?.ipn, '')),
      category: categoryName,
      brand: brandName,
      company: companyName,
      firmName: companyName,
      size: sizeVal,
      color: colorVal,
      primaryColor: colorVal,
      secondaryColor: secondaryColorVal,
      hsn: hsnVal,
      mrp: p.defaultMRP ?? p.mrp ?? 0,
      price: p.defaultMRP ?? p.price ?? 0,
      sellingPrice: p.sellingPrice ?? p.defaultMRP ?? p.price ?? 0,
      purchasePrice: p.purchasePrice ?? p.purchaseRate ?? 0,
      stock: p.stock ?? 0,
      rackLocation: safeStr(p.rackLocation, 'Shelf A1'),
      status: (p.stock ?? 0) > 0 ? 'In Stock' : 'Out of Stock',
      createdAtDate: p.createdAt ? new Date(p.createdAt) : new Date(0),
      formattedDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    };
  }).filter((p) => {
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !searchQuery ||
      safeStr(p.name).toLowerCase().includes(searchLower) ||
      safeStr(p.itemName).toLowerCase().includes(searchLower) ||
      safeStr(p.itemCode).toLowerCase().includes(searchLower) ||
      safeStr(p.designNo).toLowerCase().includes(searchLower) ||
      safeStr(p.barcode).toLowerCase().includes(searchLower) ||
      safeStr(p.uniqueCode).toLowerCase().includes(searchLower) ||
      safeStr(p.ipn).toLowerCase().includes(searchLower);

    const matchesCat =
      selectedCategory === "All" || safeStr(p.category).toLowerCase() === selectedCategory.toLowerCase();
    const matchesBrand = selectedBrand === "All" || safeStr(p.brand).toLowerCase() === selectedBrand.toLowerCase();
    const matchesCompany = selectedCompany === "All" || safeStr(p.company).toLowerCase() === selectedCompany.toLowerCase();
    const matchesSize = selectedSize === "All" || safeStr(p.size).toLowerCase().includes(selectedSize.toLowerCase());
    const matchesColor = selectedColor === "All" || safeStr(p.primaryColor).toLowerCase().includes(selectedColor.toLowerCase());

    let matchesStatus = true;
    if (selectedStatus === "In Stock")
      matchesStatus = p.stock > 0;
    else if (selectedStatus === "Low Stock")
      matchesStatus = p.stock > 0 && p.stock <= 10;
    else if (selectedStatus === "Out of Stock") matchesStatus = p.stock <= 0;

    return matchesSearch && matchesCat && matchesBrand && matchesCompany && matchesSize && matchesColor && matchesStatus && (activeSubTab === 'low_stock' ? p.stock <= 10 : true);
  }).sort((a, b) => {
    let valA = a[sortField] ?? '';
    let valB = b[sortField] ?? '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Direct product list mapping from database records
  const groupedProductsList = React.useMemo(() => {
    return filteredProductsList;
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

  // Extra Detail States
  const [formSubItem, setFormSubItem] = useState("");
  const [formDesignNo, setFormDesignNo] = useState("");
  const [formItemCode, setFormItemCode] = useState("");
  const [formUniqueCode, setFormUniqueCode] = useState("");
  const [formIPN, setFormIPN] = useState("");
  const [formSecondaryColor, setFormSecondaryColor] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formRack, setFormRack] = useState("");
  const [formHSN, setFormHSN] = useState("");
  const [formCreatedDate, setFormCreatedDate] = useState("");

  // Open Edit Modal
  const openEditModal = (prod) => {
    setModalMode("edit");
    setEditingProductId(prod.id);
    setFormName(prod.itemName || prod.name || '');
    setFormSubItem(prod.subItem || '');
    setFormDesignNo(prod.designNo || '');
    setFormItemCode(prod.itemCode || '');
    setFormCategory(prod.category);
    setFormBrand(prod.brand);
    setFormSKU(prod.sku);
    setFormBarcode(prod.barcode);
    setFormUniqueCode(prod.uniqueCode || '');
    setFormIPN(prod.ipn || '');
    setFormColor(prod.primaryColor || prod.color || '');
    setFormSecondaryColor(prod.secondaryColor || '');
    setFormCompany(prod.company || prod.firmName || '');
    setFormRack(prod.rackLocation || '');
    setFormHSN(prod.hsn || '');
    setFormSize(prod.size);
    setFormVariants(prod.variants || []);
    setFormPurchasePrice(prod.purchasePrice || 0);
    setFormMRP(prod.mrp || 0);
    setFormSellingPrice(prod.sellingPrice || 0);
    setFormStock(prod.stock || 0);
    setFormMinStock(prod.minStockAlert || 5);
    setFormCreatedDate(prod.formattedDate || '—');
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
        gstPercent: 0,
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
          gstPercent: 0,
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
            <div className="relative w-full md:w-96 lg:w-[450px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search catalog by name, sku, product code, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 pl-9 pr-3 py-2 rounded-xl border border-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700"
              />
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
              <div>
                <span className="text-slate-400 mr-1.5">Company:</span>
                <select
                  value={selectedCompany}
                  onChange={(e) => { setSelectedCompany(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5"
                >
                  <option value="All">All Companies</option>
                  {dynamicCompaniesList.map((comp) => (
                    <option key={comp} value={comp}>
                      {comp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-400 mr-1.5">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleFilterChange("cat", e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5"
                >
                  <option value="All">All Categories</option>
                  {dynamicCategoriesList.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
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
                  {dynamicBrandsList.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-400 mr-1.5">Size:</span>
                <select
                  value={selectedSize}
                  onChange={(e) => { setSelectedSize(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5"
                >
                  <option value="All">All Sizes</option>
                  {dynamicSizesList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-400 mr-1.5">Color:</span>
                <select
                  value={selectedColor}
                  onChange={(e) => { setSelectedColor(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5"
                >
                  <option value="All">All Colors</option>
                  {dynamicColorsList.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
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
                  {(isLoadingProducts || isFetching) ? (
                    <tr>
                      <td colSpan={10} className="p-12 text-center text-slate-500 font-medium">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Searching & Preparing Garment Catalog... Please wait.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400 text-xs font-medium">
                          No catalog items found matching your search.
                        </td>
                      </tr>
                    )
                  )}
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
                    Garment / Product Name *
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
                    Design No.
                  </label>
                  <input
                    type="text"
                    value={formDesignNo}
                    onChange={(e) => setFormDesignNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono"
                    placeholder="e.g. DSG-1002"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Item Code
                  </label>
                  <input
                    type="text"
                    value={formItemCode}
                    onChange={(e) => setFormItemCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono uppercase"
                    placeholder="e.g. ITEM-001"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Sub Item Type
                  </label>
                  <input
                    type="text"
                    value={formSubItem}
                    onChange={(e) => setFormSubItem(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                    placeholder="e.g. BANARASI / HALF SLEEVE"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Company / Firm
                  </label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                    placeholder="e.g. Primary Store Firm"
                  />
                </div>

                {modalMode === "edit" && (
                  <>
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">
                        Unique Code
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={formUniqueCode || 'N/A'}
                        className="w-full bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl font-mono text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">
                        IPN (Piece No.)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={formIPN || 'N/A'}
                        className="w-full bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl font-mono text-slate-600"
                      />
                    </div>
                  </>
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
                    Primary Color
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
                    Secondary Color
                  </label>
                  <input
                    type="text"
                    value={formSecondaryColor}
                    onChange={(e) => setFormSecondaryColor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                    placeholder="e.g. Gold Accent"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    Rack Location
                  </label>
                  <input
                    type="text"
                    value={formRack}
                    onChange={(e) => setFormRack(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                    placeholder="e.g. Shelf A1"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={formHSN}
                    onChange={(e) => setFormHSN(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono"
                    placeholder="e.g. 6205"
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

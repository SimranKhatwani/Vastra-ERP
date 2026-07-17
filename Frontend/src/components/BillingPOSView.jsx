import React, { useState, useEffect } from "react";
import {
  Search,
  Barcode,
  Trash2,
  UserPlus,
  Percent,
  CreditCard,
  Smartphone,
  Coins,
  Printer,
  CheckCircle,
  X,
  Plus,
  Minus,
  FileText,
  Download,
  AlertCircle,
  User,
  ChevronRight,
  Grid,
  FileSpreadsheet,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";

export const BillingPOSView = ({
  currentUser,
  products = [],
  customers = [],
  employees = [],
  invoices = [],
  onAddInvoice,
  onAddCustomer,
  onUpdateCustomerBalance,
  onAddNotification,
  onRetryWhatsApp,
  quickArticulateItem,
  clearQuickArticulateItem,
}) => {
  // Cart state
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [cashierId, setCashierId] = useState("e-2"); // default cashier
  const [salespersonId, setSalespersonId] = useState("");
  const [rightColumnTab, setRightColumnTab] = useState("catalog");
  const [showAllCatalogItems, setShowAllCatalogItems] = useState(false);

  useEffect(() => {
    if (customers && customers.length > 0 && (!selectedCustomerId || !customers.find(c => c.id === selectedCustomerId))) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);
  const [staffList, setStaffList] = useState([]);

  // Fetch staff (salespersons)
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/staff', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setStaffList(data.data.map(s => ({ ...s, id: s._id })));
        }
      } catch (err) {
        console.error("Error fetching staff:", err);
      }
    };
    fetchStaff();
  }, []);

  // Inputs
  const [barcodeInput, setBarcodeInput] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [flatDiscount, setFlatDiscount] = useState(0);

  // Payments
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [splitCash, setSplitCash] = useState(0);
  const [splitCard, setSplitCard] = useState(0);
  const [splitUPI, setSplitUPI] = useState(0);

  // Active view states
  const [activePOSMode, setActivePOSMode] = useState("billing");
  const [selectedInvoiceForReturn, setSelectedInvoiceForReturn] =
    useState(null);
  const [returnedItemIds, setReturnedItemIds] = useState([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);

  // New billing features states
  const [quotations, setQuotations] = useState([
    {
      id: "q-1",
      quoteNo: "QTN-2026-001",
      customerName: "Ramesh Kumar",
      date: "2026-06-25",
      total: 4500,
      status: "Draft",
      items: [
        {
          name: "Raymond Executive Linen Shirt - White",
          quantity: 2,
          price: 1500,
          totalPrice: 3000,
        },
      ],
    },
    {
      id: "q-2",
      quoteNo: "QTN-2026-002",
      customerName: "Sushma Swaraj",
      date: "2026-06-27",
      total: 12500,
      status: "Approved",
      items: [
        {
          name: "Biba Festive Floral Saree - Red Silk",
          quantity: 1,
          price: 8500,
          totalPrice: 8500,
        },
      ],
    },
  ]);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteCustName, setQuoteCustName] = useState("");
  const [quoteProdId, setQuoteProdId] = useState("");
  const [quoteQty, setQuoteQty] = useState(1);

  const [salesOrders, setSalesOrders] = useState([
    {
      id: "so-1",
      orderNo: "SO-2026-101",
      customerName: "Ramesh Kumar",
      date: "2026-06-26",
      total: 9200,
      status: "Pending",
      itemsCount: 3,
    },
    {
      id: "so-2",
      orderNo: "SO-2026-102",
      customerName: "Aman Deep",
      date: "2026-06-28",
      total: 18500,
      status: "Dispatched",
      itemsCount: 5,
    },
  ]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderCustName, setOrderCustName] = useState("");
  const [orderProdId, setOrderProdId] = useState("");
  const [orderQty, setOrderQty] = useState(10);

  const [creditNotes, setCreditNotes] = useState([
    {
      id: "cn-1",
      noteNo: "CN-2026-01",
      invoiceNo: "INV-20260499",
      customerName: "Ramesh Kumar",
      amount: 1500,
      reason: "Damaged Collar seam",
      date: "2026-06-27",
    },
  ]);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditCustId, setCreditCustId] = useState("c-1");
  const [creditInvoiceNo, setCreditInvoiceNo] = useState("");
  const [creditAmt, setCreditAmt] = useState(500);
  const [creditReason, setCreditReason] = useState("Size mismatch refund");

  const [debitNotes, setDebitNotes] = useState([
    {
      id: "dn-1",
      noteNo: "DN-2026-01",
      invoiceNo: "INV-20260498",
      customerName: "Sushma Swaraj",
      amount: 800,
      reason: "Express delivery charges",
      date: "2026-06-26",
    },
  ]);
  const [showDebitModal, setShowDebitModal] = useState(false);
  const [debitCustId, setDebitCustId] = useState("c-1");
  const [debitInvoiceNo, setDebitInvoiceNo] = useState("");
  const [debitAmt, setDebitAmt] = useState(500);
  const [debitReason, setDebitReason] = useState(
    "Extra custom tailoring adjustments",
  );
  // New Customer Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustWhatsApp, setNewCustWhatsApp] = useState("");

  // WhatsApp dispatch state (for receipt modal)
  // 'idle' | 'sending' | 'success' | 'failed' | 'no_number'
  const [whatsappDispatchState, setWhatsappDispatchState] = useState('idle');
  const [whatsappDispatchId, setWhatsappDispatchId] = useState(null);

  // Selected Category filter
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // --- NEW ERP STATE VARIABLES ---
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [focusedProductIndex, setFocusedProductIndex] = useState(-1);
  const [qtyModalProduct, setQtyModalProduct] = useState(null);
  const [qtyModalValue, setQtyModalValue] = useState(1);
  
  const searchInputRef = React.useRef(null);
  const barcodeInputRef = React.useRef(null);
  const customerSearchRef = React.useRef(null);
  const qtyInputRef = React.useRef(null);
  const payBtnRef = React.useRef(null);
  
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [focusedCustomerIndex, setFocusedCustomerIndex] = useState(-1);
  const [heldBills, setHeldBills] = useState([]);
  
  // Debounced search term
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
    }, 200);
    return () => clearTimeout(handler);
  }, [productSearch]);

  const handleHoldBill = () => {
    if (cart.length === 0) {
      if (onAddNotification) onAddNotification("Hold Bill", "Cart is empty.", "warning");
      return;
    }
    setHeldBills(prev => [...prev, { cart, customerId: selectedCustomerId, timestamp: new Date() }]);
    setCart([]);
    if (onAddNotification) onAddNotification("Hold Bill", "Bill placed on hold (F8).", "success");
  };

  const handleResumeBill = () => {
    if (heldBills.length === 0) {
      if (onAddNotification) onAddNotification("Resume Bill", "No bills on hold.", "warning");
      return;
    }
    const lastBill = heldBills[heldBills.length - 1];
    setCart(lastBill.cart);
    setSelectedCustomerId(lastBill.customerId);
    setHeldBills(prev => prev.slice(0, -1));
    if (onAddNotification) onAddNotification("Resume Bill", "Bill resumed (F5).", "success");
  };

  // --- GLOBAL KEYBOARD LISTENERS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent browser default actions (like F5 refresh) for our POS shortcuts
      if (["F2", "F3", "F4", "F5", "F6", "F8", "F9"].includes(e.key)) {
        e.preventDefault();
      }

      // If a modal (like quantity) is open, handle its keys separately
      if (qtyModalProduct) {
        if (e.key === "Escape") {
          e.preventDefault();
          setQtyModalProduct(null);
        } else if (e.key === "Enter") {
          e.preventDefault();
          qtyInputRef.current?.click();
        } else if (e.key === "ArrowUp" && document.activeElement?.tagName !== "SELECT") {
          e.preventDefault();
          setQtyModalValue(prev => prev + 1);
        } else if (e.key === "ArrowDown" && document.activeElement?.tagName !== "SELECT") {
          e.preventDefault();
          setQtyModalValue(prev => Math.max(1, prev - 1));
        }
        return;
      }

      // F2: Product Search
      if (e.key === "F2") {
        searchInputRef.current?.focus();
      }
      // F3: Customer Search
      if (e.key === "F3") {
        customerSearchRef.current?.focus();
      }
      // F4: Open New Customer Modal
      if (e.key === "F4") {
        setShowAddCustomerModal(true);
      }
      // F5: Resume Bill
      if (e.key === "F5") {
        handleResumeBill();
      }
      // F6: Payment / Checkout
      if (e.key === "F6") {
        payBtnRef.current?.focus();
      }
      // F8: Hold Bill
      if (e.key === "F8") {
        handleHoldBill();
      }
      // Ctrl+B: Barcode Scanner
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      // Esc: Close Modals / Dropdowns
      if (e.key === "Escape") {
        setIsProductDropdownOpen(false);
        setIsCustomerDropdownOpen(false);
        setVariantModalProduct(null);
      }
      // F9: Generate Bill
      if (e.key === "F9") {
        document.getElementById('btn-generate-bill')?.click();
      }
      // Alt+1 to Alt+6 (Categories)
      if (e.altKey && e.key >= "1" && e.key <= "6") {
        e.preventDefault();
        const cats = ["Sarees", "Kurtas", "Shirts", "Trousers", "Denim", "Ethnic"];
        const idx = parseInt(e.key) - 1;
        if (cats[idx]) {
           setSelectedCategoryFilter(cats[idx]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [qtyModalProduct, cart, heldBills, selectedCustomerId]); // Re-bind if these states change so handleHoldBill gets latest state
  // Articulation Window States (Module 2)
  const [articulationProduct, setArticulationProduct] = useState(null);
  // Variant Selection Modal State
  const [variantModalProduct, setVariantModalProduct] = useState(null);
  const [variantModalSize, setVariantModalSize] = useState("M");
  const [variantModalColor, setVariantModalColor] = useState("White");

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [articulationQty, setArticulationQty] = useState(1);
  const [articulationSearch, setArticulationSearch] = useState("");
  const [spreadsheetQuantities, setSpreadsheetQuantities] = useState({});
  const [activeCellId, setActiveCellId] = useState({ row: 1, col: "A" });

  // Memoized variant matrices for the active product
  const articulationVariants = React.useMemo(() => {
    if (!articulationProduct) return [];
    return products.filter(
      (p) =>
        p.brand === articulationProduct.brand &&
        p.category === articulationProduct.category,
    );
  }, [articulationProduct, products]);

  const articulationColors = React.useMemo(() => {
    if (!articulationProduct) return [];
    return Array.from(new Set(articulationVariants.map((v) => v.color)));
  }, [articulationVariants, articulationProduct]);

  const articulationSizes = React.useMemo(() => {
    return ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
  }, []);

  // Action: Add product to cart with custom quantity (from articulation window)
  const handleAddProductToCartWithQty = (prod, qty) => {
    if (prod.stock <= 0) {
      onAddNotification(
        "POS Warning",
        `${prod.name} is currently out of stock.`,
        "warning",
      );
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productId === prod.id && !item.isCustom,
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + qty;
        const sPrice = Number(prod.sellingPrice) || Number(prod.price) || 0;
        const sub = sPrice * newQty;
        const discountAmt = Math.floor(
          sub * (updated[existingIdx].discount / 100),
        );
        const itemGst = Math.floor(
          (sub - discountAmt) * (prod.gstPercent / 100),
        );
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          totalPrice: sub - discountAmt + itemGst,
        };
        return updated;
      } else {
        const sPrice = Number(prod.sellingPrice) || Number(prod.price) || 0;
        const sub = sPrice * qty;
        const discountAmt = 0;
        const itemGst = Math.floor(
          (sub - discountAmt) * (prod.gstPercent / 100),
        );
        return [
          ...prev,
          {
            productId: prod.id,
            name: prod.name,
            sku: prod.sku,
            size: prod.size,
            color: prod.color,
            quantity: qty,
            price: Number(prod.sellingPrice) || Number(prod.price) || 0,
            discount: 0,
            gstPercent: prod.gstPercent || 0,
            totalPrice: sub + itemGst,
          },
        ];
      }
    });
  };

  // Handle articulated items forwarded from Customizer
  useEffect(() => {
    if (quickArticulateItem) {
      const artProduct = {
        productId: "custom-garment",
        name: `Custom Articulated ${quickArticulateItem.fabric} - ${quickArticulateItem.pattern}`,
        sku: "CST-ART-001",
        size: quickArticulateItem.size,
        color: quickArticulateItem.color,
        quantity: 1,
        price: quickArticulateItem.estimatedCost,
        discount: 0,
        gstPercent: 12,
        totalPrice: quickArticulateItem.estimatedCost,
        isCustom: true,
        customDetails: quickArticulateItem,
      };

      setCart((prev) => {
        // Since it's a bespoke garment, we always append as a unique row
        return [...prev, artProduct];
      });

      onAddNotification(
        "POS Terminal Feed",
        "Articulated Custom Garment added to POS basket.",
        "success",
      );
      clearQuickArticulateItem();
    }
  }, [quickArticulateItem]);

  const activeCustomer = (customers || []).find(
    (c) => c.id === selectedCustomerId,
  ) ||
    (customers || [])[0] || {
      id: "c-walkin",
      name: "Walk-in Customer",
      phone: "0000000000",
      email: "",
      outstandingBalance: 0,
      membership: "Bronze",
      walletBalance: 0,
      loyaltyPoints: 0,
      birthday: "",
      createdAt: "",
      totalInvoices: 0,
      totalSpent: 0,
    };

  const baseFilteredProducts = React.useMemo(() => {
    return (products || []).filter((p) => {
      const matchesCat =
        selectedCategoryFilter === "All" || p.category?.toLowerCase() === selectedCategoryFilter.toLowerCase();
      const q = debouncedProductSearch.toLowerCase();
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.color?.toLowerCase().includes(q) ||
        p.size?.toLowerCase().includes(q) ||
        p.fabric?.toLowerCase().includes(q) ||
        p.styleNumber?.toLowerCase().includes(q) ||
        p.hsnCode?.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategoryFilter, debouncedProductSearch]);

  // Inject 50 demo products if the user's DB doesn't have enough to show off the UI feature
  const [demoProducts, setDemoProducts] = useState([]);
  useEffect(() => {
    if (products.length < 15 && demoProducts.length === 0) {
      const categories = ['Shirts', 'T-Shirts', 'Trousers', 'Jeans', 'Jackets', 'Suits', 'Ethnic Wear'];
      const colors = ['Red', 'Blue', 'Black', 'White', 'Grey', 'Navy', 'Olive', 'Maroon'];
      const brands = ['Raymond', 'Peter England', 'Levis', 'Allen Solly', 'Van Heusen', 'Arrow'];
      
      let mocks = [];
      for(let i = 1; i <= 50; i++) {
          const cat = categories[Math.floor(Math.random() * categories.length)];
          const brand = brands[Math.floor(Math.random() * brands.length)];
          mocks.push({
              id: `demo-${i}`,
              name: `Premium ${brand} ${colors[Math.floor(Math.random() * colors.length)]} ${cat}`,
              sku: `SKU-99${i}`,
              barcode: `BCODE99${i}`,
              category: cat,
              brand: brand,
              color: colors[Math.floor(Math.random() * colors.length)],
              size: 'M',
              purchasePrice: 500,
              sellingPrice: Math.floor(Math.random() * 1500) + 1500,
              mrp: Math.floor(Math.random() * 2000) + 2000,
              stock: Math.floor(Math.random() * 50) + 10,
              minStockAlert: 15,
              gstPercent: 12,
              status: 'In Stock'
          });
      }
      setDemoProducts(mocks);
    }
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    const filteredDemos = demoProducts.filter((p) => {
      const matchesCat = selectedCategoryFilter === "All" || p.category?.toLowerCase() === selectedCategoryFilter.toLowerCase();
      const q = debouncedProductSearch.toLowerCase();
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.color?.toLowerCase().includes(q) ||
        p.size?.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });

    const combined = [...baseFilteredProducts, ...filteredDemos];
    const groups = {};
    combined.forEach(p => {
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
       }
    });

    return Object.values(groups).map(g => ({
       ...g,
       size: g.sizesAvailable.size > 0 ? Array.from(g.sizesAvailable).join(", ") : "-",
       color: g.colorsAvailable.size > 0 ? Array.from(g.colorsAvailable).join(", ") : "-"
    })).slice(0, 50); // Virtual slicing for performance
  }, [baseFilteredProducts, demoProducts, selectedCategoryFilter, debouncedProductSearch]);

  // Unique categories list
  const uniqueCategories = React.useMemo(() => {
    return [
      "All",
      ...Array.from(new Set([...(products || []), ...demoProducts].map((p) => p.category).filter(Boolean))),
    ];
  }, [products, demoProducts]);

  const RenderedProductsTable = React.useMemo(() => {
    return filteredProducts.map((p, idx) => {
      const isSelected = focusedProductIndex === idx;
      let stockBadgeClass = "bg-emerald-50 text-emerald-600";
      if (p.stock <= 0) stockBadgeClass = "bg-red-50 text-red-600";
      else if (p.stock <= (p.minStockAlert || 5)) stockBadgeClass = "bg-orange-50 text-orange-600";
      
      return (
        <tr
          key={p.id || p._id}
          className={`transition-colors cursor-pointer border-b border-slate-100 ${isSelected ? "bg-indigo-50" : "hover:bg-slate-50"}`}
          onClick={() => {
            setQtyModalProduct({
              ...p,
              ...(p.variants ? p.variants[0] : {}),
              variants: p.variants
            });
            setQtyModalValue(1);
          }}
        >
          <td className="p-2.5 text-[11px] text-slate-500 font-mono">{p.sku}</td>
          <td className="p-2.5 text-xs font-bold text-slate-800">{p.name}</td>
          <td className="p-2.5 text-[11px] font-semibold text-slate-600">{p.brand}</td>
          <td className="p-2.5 text-[11px] font-semibold text-slate-600">{p.size}</td>
          <td className="p-2.5 text-[11px] font-semibold text-slate-600">{p.color}</td>
          <td className="p-2.5 text-[11px] font-mono">
            <span className={`px-1.5 py-0.5 rounded font-bold ${stockBadgeClass}`}>
              {p.stock}
            </span>
          </td>
          <td className="p-2.5 text-[11px] text-slate-400 font-mono line-through">₹{p.mrp || p.price}</td>
          <td className="p-2.5 text-xs font-bold text-indigo-600 font-mono">
            ₹{p.sellingPrice || p.price}
          </td>
          <td className="p-2.5 text-center">
            <button 
              tabIndex="-1"
              className="inline-flex px-3 py-1.5 rounded-lg bg-indigo-600 text-white items-center justify-center font-bold text-[10px] hover:bg-indigo-700 transition-colors uppercase tracking-wider"
              onClick={(e) => {
                e.stopPropagation();
                setQtyModalProduct({
                  ...p,
                  ...(p.variants ? p.variants[0] : {}),
                  variants: p.variants
                });
                setQtyModalValue(1);
              }}
            >
              + Add
            </button>
          </td>
        </tr>
      );
    });
  }, [filteredProducts, focusedProductIndex]);

  // Action: Add product to cart
  const handleAddProductToCart = (prod) => {
    if (prod.stock <= 0) {
      onAddNotification(
        "POS Warning",
        `${prod.name} is currently out of stock.`,
        "warning",
      );
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productId === (prod._id || prod.id) && item.size === prod.size && item.color === prod.color && !item.isCustom,
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + 1;
        const sPrice = Number(prod.sellingPrice) || Number(prod.price) || 0;
        const sub = sPrice * newQty;
        const discountAmt = Math.floor(
          sub * (updated[existingIdx].discount / 100),
        );
        const itemGst = Math.floor(
          (sub - discountAmt) * ((prod.gstPercent || 0) / 100),
        );
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          totalPrice: sub - discountAmt + itemGst,
        };
        return updated;
      } else {
        const sPrice = Number(prod.sellingPrice) || Number(prod.price) || 0;
        const sub = sPrice;
        const itemGst = Math.floor(sub * ((prod.gstPercent || 0) / 100));
        return [
          ...prev,
          {
            productId: prod._id || prod.id,
            name: prod.name,
            sku: prod.sku,
            size: prod.size,
            color: prod.color,
            quantity: 1,
            price: Number(prod.sellingPrice) || Number(prod.price) || 0,
            discount: 0,
            gstPercent: prod.gstPercent || 0,
            totalPrice: sub + itemGst,
          },
        ];
      }
    });
  };

  // Barcode quick simulated lookup (and Universal Search Enter)
  const handleBarcodeSubmit = (e) => {
    if (e) e.preventDefault();
    if (!productSearch) return;
    
    // Barcode First Workflow
    const exactMatch = products.find(
      (p) =>
        p.barcode === productSearch ||
        p.sku?.toLowerCase() === productSearch.toLowerCase(),
    );
    
    if (exactMatch) {
      handleAddProductToCart(exactMatch);
      onAddNotification("Barcode Match", `Added: ${exactMatch.name}`, "success");
      setProductSearch("");
      setIsProductDropdownOpen(false);
      return;
    }

    if (filteredProducts.length === 1) {
      handleAddProductToCart(filteredProducts[0]);
      onAddNotification("Auto Match", `Added: ${filteredProducts[0].name}`, "success");
      setProductSearch("");
      setIsProductDropdownOpen(false);
      return;
    }
    
    if (filteredProducts.length > 1) {
      setIsProductDropdownOpen(true);
      setFocusedProductIndex(0);
    } else {
      onAddNotification("Search Error", `No product found for "${productSearch}"`, "danger");
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isProductDropdownOpen && focusedProductIndex >= 0 && filteredProducts[focusedProductIndex]) {
        // Add from dropdown via Quantity Modal
        setQtyModalProduct({
          ...filteredProducts[focusedProductIndex],
          ...(filteredProducts[focusedProductIndex].variants ? filteredProducts[focusedProductIndex].variants[0] : {}),
          variants: filteredProducts[focusedProductIndex].variants
        });
        setQtyModalValue(1);
        setIsProductDropdownOpen(false);
      } else {
        handleBarcodeSubmit();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsProductDropdownOpen(true);
      setFocusedProductIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedProductIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Escape") {
      setIsProductDropdownOpen(false);
    }
  };

  // Adjust quantity
  const handleAdjustQty = (idx, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[idx];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      const match = products.find((p) => p.id === item.productId);
      const gstRate = match ? match.gstPercent : 12;
      const sub = item.price * newQty;
      const discountAmt = Math.floor(sub * (item.discount / 100));
      const itemGst = Math.floor((sub - discountAmt) * (gstRate / 100));

      updated[idx] = {
        ...item,
        quantity: newQty,
        totalPrice: sub - discountAmt + itemGst,
      };
      return updated;
    });
  };

  // Adjust item discount
  const handleAdjustItemDiscount = (idx, discountPct) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[idx];
      const sub = item.price * item.quantity;
      const discountAmt = Math.floor(sub * (discountPct / 100));
      const itemGst = Math.floor((sub - discountAmt) * (item.gstPercent / 100));

      updated[idx] = {
        ...item,
        discount: discountPct,
        totalPrice: sub - discountAmt + itemGst,
      };
      return updated;
    });
  };

  // Calculations
  const { subTotal, discountTotal, couponDiscount, gstTotal, grandTotal } = React.useMemo(() => {
    let subTotal = 0;
    let discountTotal = 0;
    let gstTotal = 0;

    cart.forEach((item) => {
      const sub = item.price * item.quantity;
      const disc = Math.floor(sub * (item.discount / 100));
      const taxable = sub - disc;
      const gst = Math.floor(taxable * (item.gstPercent / 100));

      subTotal += sub;
      discountTotal += disc;
      gstTotal += gst;
    });

    // Handle flat discount & coupon code
    let couponDiscount = 0;
    if (couponCode === "WINTER20") {
      couponDiscount = Math.floor(subTotal * 0.2);
    } else if (couponCode === "LOYALTY50") {
      couponDiscount = 500;
    } else if (couponCode === "FESTIVE15") {
      couponDiscount = Math.floor(subTotal * 0.15);
    }

    const totalDiscount = discountTotal + flatDiscount + couponDiscount;
    const grandTotal = Math.max(0, subTotal - totalDiscount + gstTotal);

    return {
      subTotal,
      discountTotal: totalDiscount,
      couponDiscount,
      gstTotal,
      grandTotal,
    };
  }, [cart, couponCode, flatDiscount]);

  // Handle checkout
  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) {
      onAddNotification(
        "POS Checkout Failed",
        "Cannot compile an empty cart.",
        "danger",
      );
      return;
    }

    const cashier = employees.find((e) => e.id === cashierId) || employees[0] || { id: "e-default", name: "Default Cashier" };

    // Create Invoice object
    const selectedSalesperson = staffList.find((e) => (e._id || e.id) === salespersonId);
    const finalEmployeeId = selectedSalesperson ? (selectedSalesperson._id || selectedSalesperson.id) : cashier.id;

    const newInvoice = {
      invoiceNo: `INV-${Date.now().toString().substring(5)}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString(),
      customerId: selectedCustomerId && selectedCustomerId.length === 24 ? selectedCustomerId : undefined,
      customerName: activeCustomer.name,
      customerPhone: activeCustomer.phone,
      items: [...cart],
      subTotal,
      discountTotal,
      couponCode: couponCode ? couponCode : undefined,
      couponDiscount,
      gstTotal,
      grandTotal,
      paymentMethod,
      splitPayments: paymentMethod === "Split"
        ? [
            { method: "Cash", amount: splitCash },
            { method: "Card", amount: splitCard },
            { method: "UPI", amount: splitUPI },
          ].filter((s) => s.amount > 0)
        : undefined,
      amountPaid: paymentMethod === "Credit" ? 0 : grandTotal,
      status: paymentMethod === "Credit" ? "Unpaid" : "Paid",
      employeeId: finalEmployeeId && finalEmployeeId.length === 24 ? finalEmployeeId : undefined,
      employeeName: cashier.name,
      salespersonName: selectedSalesperson ? selectedSalesperson.name : "Admin (Self)",
    };

    // If Credit, add outstanding balance to Customer's profile
    if (paymentMethod === "Credit") {
      onUpdateCustomerBalance(selectedCustomerId, grandTotal);
      onAddNotification(
        "Credit Balance Logged",
        `₹${grandTotal.toLocaleString()} logged to ${activeCustomer.name}'s credit ledger.`,
        "info",
      );
    }

    // Trigger state callbacks — onAddInvoice now returns the saved invoice object (or null on error)
    const savedInvoice = await onAddInvoice(newInvoice);
    setCompletedInvoice(savedInvoice || newInvoice);
    setCart([]);
    setCouponCode("");
    setFlatDiscount(0);
    setPaymentMethod("Cash");
    setSplitCash(0);
    setSplitCard(0);
    setSplitUPI(0);
    setSalespersonId("");
    setShowReceiptModal(true);

    onAddNotification(
      "Invoice Compiled Successfully",
      `Issued receipt ${newInvoice.invoiceNo} for ₹${newInvoice.grandTotal.toLocaleString()}`,
      "success",
    );

    // ── Automatic WhatsApp Dispatch (fire-and-forget, never blocks checkout) ──
    if (savedInvoice && savedInvoice._id && onRetryWhatsApp) {
      setWhatsappDispatchState('sending');
      setWhatsappDispatchId(savedInvoice._id);
      try {
        const ok = await onRetryWhatsApp(savedInvoice._id);
        setWhatsappDispatchState(ok ? 'success' : 'failed');
      } catch (err) {
        console.error('[BillingPOSView] WhatsApp dispatch error:', err);
        setWhatsappDispatchState('failed');
      }
    } else {
      setWhatsappDispatchState('idle');
    }
  };

  // Add new customer local submit
  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    const newId = `c-${(customers || []).length + 1}`;
    const newCust = {
      id: newId,
      name: newCustName,
      phone: newCustPhone,
      email:
        newCustEmail ||
        `${newCustName.toLowerCase().replace(/\s+/g, "")}@example.com`,
      whatsappNumber: newCustWhatsApp || newCustPhone,
      outstandingBalance: 0,
      membership: "Bronze",
      walletBalance: 0,
      loyaltyPoints: 10,
      birthday: "1995-01-01",
      createdAt: "2026-06-28",
      totalInvoices: 0,
      totalSpent: 0,
    };

    if (onAddCustomer) {
      onAddCustomer(newCust);
    } else {
      (customers || []).push(newCust);
    }

    setSelectedCustomerId(newId);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustEmail("");
    setNewCustWhatsApp("");
    setShowAddCustomerModal(false);
    onAddNotification(
      "CRM Engine",
      "New Retail Customer profile saved successfully.",
      "success",
    );
  };

  // New CRM & Sales Helper Submissions
  const handleCreateQuotation = (e) => {
    e.preventDefault();
    if (!quoteCustName || !quoteProdId) return;
    const targetP = products.find((p) => p.id === quoteProdId);
    if (!targetP) return;

    const total = targetP.sellingPrice * quoteQty;
    const newQuote = {
      id: `q-${Date.now()}`,
      quoteNo: `QTN-2026-00${quotations.length + 1}`,
      customerName: quoteCustName,
      date: new Date().toISOString().slice(0, 10),
      total,
      status: "Approved",
      items: [
        {
          name: targetP.name,
          quantity: quoteQty,
          price: targetP.sellingPrice,
          totalPrice: total,
        },
      ],
    };

    setQuotations((prev) => [...prev, newQuote]);
    onAddNotification(
      "Quotation Compiled",
      `Quote estimate generated for ${quoteCustName}. Value: ₹${total.toLocaleString()}`,
      "success",
    );
    setShowQuoteModal(false);
  };

  const handleCreateSalesOrder = (e) => {
    e.preventDefault();
    if (!orderCustName || !orderProdId) return;
    const targetP = products.find((p) => p.id === orderProdId);
    if (!targetP) return;

    const total = targetP.sellingPrice * orderQty;
    const newOrder = {
      id: `so-${Date.now()}`,
      orderNo: `SO-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: orderCustName,
      date: new Date().toISOString().slice(0, 10),
      total,
      status: "Pending",
      itemsCount: 1,
    };

    setSalesOrders((prev) => [...prev, newOrder]);
    onAddNotification(
      "Sales Order Registered",
      `Bulk commercial contract registered for ${orderCustName} for ${orderQty} units.`,
      "success",
    );
    setShowOrderModal(false);
  };

  const handleCreateCreditNote = (e) => {
    e.preventDefault();
    if (!creditInvoiceNo || creditAmt <= 0) return;
    const targetC = customers.find((c) => c.id === creditCustId);
    if (!targetC) return;

    const newCredit = {
      id: `cn-${Date.now()}`,
      noteNo: `CN-2026-0${creditNotes.length + 1}`,
      invoiceNo: creditInvoiceNo,
      customerName: targetC.name,
      amount: creditAmt,
      reason: creditReason,
      date: new Date().toISOString().slice(0, 10),
    };

    setCreditNotes((prev) => [...prev, newCredit]);
    if (onUpdateCustomerBalance) {
      onUpdateCustomerBalance(creditCustId, -creditAmt); // Credited: reduces outstanding or adds to wallet
    }

    onAddNotification(
      "Credit Note Issued",
      `Credited ₹${creditAmt.toLocaleString()} to ${targetC.name}'s wallet ledger.`,
      "success",
    );
    setShowCreditModal(false);
  };

  const handleCreateDebitNote = (e) => {
    e.preventDefault();
    if (!debitInvoiceNo || debitAmt <= 0) return;
    const targetC = customers.find((c) => c.id === debitCustId);
    if (!targetC) return;

    const newDebit = {
      id: `dn-${Date.now()}`,
      noteNo: `DN-2026-0${debitNotes.length + 1}`,
      invoiceNo: debitInvoiceNo,
      customerName: targetC.name,
      amount: debitAmt,
      reason: debitReason,
      date: new Date().toISOString().slice(0, 10),
    };

    setDebitNotes((prev) => [...prev, newDebit]);
    if (onUpdateCustomerBalance) {
      onUpdateCustomerBalance(debitCustId, debitAmt); // Debited: increases outstanding debit ledger balance
    }

    onAddNotification(
      "Debit Note Levied",
      `Charged ₹${debitAmt.toLocaleString()} to ${targetC.name}'s balance account. Reason: ${debitReason}`,
      "success",
    );
    setShowDebitModal(false);
  };

  // Return and Exchange submission
  const handleSubmitReturn = () => {
    if (!selectedInvoiceForReturn) return;
    if (returnedItemIds.length === 0) {
      onAddNotification(
        "Return Wizard",
        "No items selected to issue a refund or exchange.",
        "warning",
      );
      return;
    }

    // Process return
    const refundTotal = selectedInvoiceForReturn.items
      .filter((item) => returnedItemIds.includes(item.productId))
      .reduce((sum, item) => sum + item.totalPrice, 0);

    // Apply refund as wallet balance or POS exchange credit
    onUpdateCustomerBalance(selectedInvoiceForReturn.customerId, -refundTotal);

    // Toggle invoice state in mock
    const match = invoices.find(
      (inv) => inv.id === selectedInvoiceForReturn.id,
    );
    if (match) {
      match.status = "Returned";
    }

    onAddNotification(
      "Return Approved",
      `Returned items from ${selectedInvoiceForReturn.invoiceNo}. Credited ₹${refundTotal.toLocaleString()} to customer's account balance.`,
      "success",
    );
    // Clear states
    setSelectedInvoiceForReturn(null);
    setReturnedItemIds([]);
    setActivePOSMode("billing");
  };

  // Receipt HTML downloader matching rule
  const handleDownloadReceiptHTML = (invoice) => {
    const receiptDate = invoice.date ? new Date(invoice.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '-';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${invoice.invoiceNo}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; color: #000; padding: 20px; max-width: 380px; margin: 0 auto; }
          .text-center { text-align: center; }
          .header { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
          .details { font-size: 11px; line-height: 1.4; margin-bottom: 10px; }
          .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; font-size: 11px; }
          th { text-align: left; }
          .text-right { text-align: right; }
          .totals { font-weight: bold; }
          .footer { font-size: 10px; margin-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="text-center header">ZIVA FASHION BOUTIQUE</div>
        <div class="text-center details">104, Galleria Mall, Hiranandani Estate,<br>Bandra West, Mumbai - 400050<br>GSTIN: 27AABCV1942A1ZX</div>
        <div class="divider"></div>
        <div class="details">
          <b>Receipt No:</b> ${invoice.invoiceNo}<br>
          <b>Date:</b> ${receiptDate}<br>
          <b>Salesperson:</b> ${invoice.salespersonName || 'Admin (Self)'}<br>
          <b>Customer:</b> ${invoice.customerName} (${invoice.customerPhone || '-'})
        </div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item) => `
              <tr>
                <td>${item.name} (${item.size}/${item.color})</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">₹${item.price}</td>
                <td class="text-right">₹${item.totalPrice}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        <div class="divider"></div>
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">₹${invoice.subTotal}</td>
          </tr>
          ${
            invoice.discountTotal > 0
              ? `
            <tr>
              <td>Discount:</td>
              <td class="text-right">-₹${invoice.discountTotal}</td>
            </tr>
          `
              : ""
          }
          <tr>
            <td>GST CGST+SGST:</td>
            <td class="text-right">₹${invoice.gstTotal}</td>
          </tr>
          <tr class="totals">
            <td>Grand Total:</td>
            <td class="text-right">₹${invoice.grandTotal}</td>
          </tr>
        </table>
        <div class="divider"></div>
        <div class="details text-center">
          <b>Payment Mode:</b> ${invoice.paymentMethod}<br>
          <b>Status:</b> ${invoice.status.toUpperCase()}<br>
          Thank you for shopping with us!<br>
          Powered by GarmentFlow SaaS ERP
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    // URL.revokeObjectURL(url); // Don't revoke immediately or the new tab will fail to load the blob in some browsers
    onAddNotification(
      "File Downloader",
      `HTML Invoice ${invoice.invoiceNo} successfully generated & downloaded.`,
      "success",
    );
  };

  const handleWhatsAppShare = (invoice) => {
    const itemsText = invoice.items
      .map(
        (item) =>
          `- ${item.name} (${item.size}/${item.color}) x ${item.quantity} = ₹${item.totalPrice}`,
      )
      .join("\n");
    const msg =
      `*VASTRA ERP - INVOICE GENERATED*\n\n` +
      `*Receipt No:* ${invoice.invoiceNo}\n` +
      `*Date:* ${invoice.date ? new Date(invoice.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}\n` +
      `*Customer:* ${invoice.customerName}\n` +
      `*Salesperson:* ${invoice.salespersonName || "Admin (Self)"}\n` +
      `---------------------------\n` +
      `*Apparel Items:*\n${itemsText}\n` +
      `---------------------------\n` +
      `*Subtotal:* ₹${invoice.subTotal}\n` +
      `*GST (CGST+SGST):* ₹${invoice.gstTotal}\n` +
      `*Grand Total:* ₹${invoice.grandTotal}\n\n` +
      `Thank you for shopping with us!`;
    const encoded = encodeURIComponent(msg);
    const phoneClean = invoice.customerPhone.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${phoneClean ? phoneClean : "91" + invoice.customerPhone}?text=${encoded}`;
    window.open(url, "_blank");
    onAddNotification(
      "WhatsApp API Relay",
      "Redirecting to WhatsApp to send invoice...",
      "success",
    );
  };

  const handleDownloadHTML = (invoice) => {
    const itemsHtml = invoice.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name} (${item.size}/${item.color})</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">?${item.totalPrice}</td>
        </tr>`
      )
      .join("");

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.invoiceNo}</title>
      <style>
        body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; }
        h1 { text-align: center; }
        .header-info { margin-bottom: 20px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f5f5f5; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
        .totals { text-align: right; margin-top: 20px; font-size: 14px; }
        .totals p { margin: 5px 0; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <h1>ZIVA FASHION BOUTIQUE</h1>
      <p style="text-align: center; font-size: 12px; color: #777;">Bandra, Mumbai - GSTIN 27AABCV1942A1ZX</p>
      
      <div class="header-info">
        <p><strong>Receipt No:</strong> ${invoice.invoiceNo}</p>
        <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleString()}</p>
        <p><strong>Customer:</strong> ${invoice.customerName}</p>
        <p><strong>Salesperson:</strong> ${invoice.salespersonName || "N/A"}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <p>Subtotal: <strong>?${invoice.subTotal}</strong></p>
        <p>Discount: <strong>?${invoice.discountTotal}</strong></p>
        <p>GST: <strong>?${invoice.gstTotal}</strong></p>
        <p style="font-size: 18px; margin-top: 10px;">Grand Total: <strong>?${invoice.grandTotal}</strong></p>
      </div>

      <div class="footer">
        <p>Thank you for shopping with us!</p>
      </div>
    </body>
    </html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 animate-fade-in" id="billing-pos-root">
      {/* POS Mode Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActivePOSMode("billing")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "billing" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            POS Checkout
          </button>
          <button
            onClick={() => setActivePOSMode("history")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "history" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Invoice History
          </button>
          <button
            onClick={() => setActivePOSMode("returns")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "returns" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Returns & Exchange
          </button>
          <button
            onClick={() => setActivePOSMode("quotations")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "quotations" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Quotations
          </button>
          <button
            onClick={() => setActivePOSMode("orders")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "orders" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Sales Orders
          </button>
          <button
            onClick={() => setActivePOSMode("credit_notes")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "credit_notes" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Credit Notes
          </button>
          <button
            onClick={() => setActivePOSMode("debit_notes")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "debit_notes" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Debit Notes
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Cashier:</span>
          <select
            value={cashierId}
            onChange={(e) => setCashierId(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {employees
              .filter(
                (e) =>
                  e.role === "Admin" ||
                  e.role === "Cashier" ||
                  e.role === "Manager",
              )
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.role})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* POS TERMINAL INTERFACE */}
      {activePOSMode === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Cart, customer, checkout (Lg: col-span-5) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 lg:col-span-5 flex flex-col h-[calc(100vh-140px)] gap-4 relative">
            {/* Customer Lookup Header (Sticky Top) */}
            <div className="space-y-2 shrink-0">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Retail Customer Profile
                </label>
                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Customer</span>
                </button>
              </div>
              
              <div className="relative">
                <div className="flex gap-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    ref={customerSearchRef}
                    type="text"
                    placeholder={activeCustomer && activeCustomer.id !== "c-walkin" ? `${activeCustomer.name} (${activeCustomer.phone})` : "Search Customer (F3)..."}
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    className="w-full bg-slate-50 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                {isCustomerDropdownOpen && customerSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50">
                    {customers.filter(c => 
                        c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                        c.phone.includes(customerSearch) ||
                        c.id === customerSearch
                     ).map((c, idx) => (
                      <div 
                        key={c.id} 
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                        onMouseDown={() => {
                           setSelectedCustomerId(c.id);
                           setCustomerSearch("");
                           setIsCustomerDropdownOpen(false);
                        }}
                      >
                         <p className="text-xs font-bold text-slate-800">{c.name}</p>
                         <p className="text-[10px] font-mono text-slate-500">{c.phone} - {c.membership}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CRM Info Summary Bar */}
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400">Wallet:</span>{" "}
                  <span className="text-emerald-600 font-bold">
                    ₹{activeCustomer.walletBalance || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Points:</span>{" "}
                  <span className="text-violet-600 font-bold">
                    {activeCustomer.loyaltyPoints || 0}
                  </span>
                </div>
                {activeCustomer.outstandingBalance > 0 && (
                  <div>
                    <span className="text-slate-400">Debt:</span>{" "}
                    <span className="text-red-500 font-bold">
                      ₹{activeCustomer.outstandingBalance}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Items list (Scrollable Middle) */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 border border-slate-100 rounded-xl p-3 gap-2">
              <div className="flex justify-between items-center shrink-0">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Garment Basket ({cart.length})
                </label>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cart</span>
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Barcode className="w-10 h-10 text-slate-300 stroke-1" />
                  <span className="text-xs">
                    Scan barcodes or select garments
                  </span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 erp-hide-scrollbar">
                  {cart.map((item, idx) => (
                    <div key={idx} className="bg-white border border-slate-100 rounded-lg p-2.5 flex flex-col space-y-1.5 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {item.sku} | Size: {item.size} | Color: {item.color}{" "}
                            {item.isCustom && (
                              <span className="bg-violet-100 text-violet-700 px-1 py-0.2 rounded font-sans font-bold uppercase text-[8px] ml-1">
                                Customized
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 shrink-0 font-mono">
                          ₹{(Number(item.totalPrice) || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {/* Qty Adjustment */}
                        <div className="flex items-center border border-slate-200 rounded-md">
                          <button
                            onClick={() => handleAdjustQty(idx, -1)}
                            className="p-1 text-slate-500 hover:bg-slate-100 rounded-l-md cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-xs font-mono font-bold text-slate-700">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleAdjustQty(idx, 1)}
                            className="p-1 text-slate-500 hover:bg-slate-100 rounded-r-md cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Individual Item Discount adjustment */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            Disc:
                          </span>
                          <select
                            value={item.discount}
                            onChange={(e) =>
                              handleAdjustItemDiscount(
                                idx,
                                Number(e.target.value),
                              )
                            }
                            className="text-[10px] font-mono font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 focus:outline-none"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="10">10%</option>
                            <option value="15">15%</option>
                            <option value="20">20%</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Bill Summary (Fixed Bottom) */}
            <div className="shrink-0 space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="relative">
                    <Percent className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                    <input
                      type="text"
                      placeholder="Coupon"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-mono"
                    />
                    {couponCode && (
                      <button onClick={() => setCouponCode("")} className="absolute right-1.5 top-2 text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <span className="text-slate-400 absolute left-2 top-1.5 text-xs font-mono font-bold">₹</span>
                    <input
                      type="number"
                      placeholder="Flat Disc"
                      value={flatDiscount || ""}
                      onChange={(e) =>
                        setFlatDiscount(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tax / Total breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                <div className="flex justify-between text-slate-500 mb-1">
                  <span>Subtotal Items</span>
                  <span className="font-mono font-semibold">₹{subTotal.toLocaleString()}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold mb-1">
                    <span>Coupons & Markdowns</span>
                    <span className="font-mono">
                      -₹{discountTotal.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 pb-2 border-b border-slate-200/60 mb-2">
                  <span>GST Tax (CGST+SGST)</span>
                  <span className="font-mono font-semibold">₹{gstTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-slate-800 uppercase">Grand Total</span>
                  <span className="font-mono font-extrabold text-xl text-indigo-700 leading-none">
                    ₹{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "Cash", label: "Cash", icon: Coins },
                  { id: "UPI", label: "UPI", icon: Smartphone },
                  { id: "Card", label: "Card", icon: CreditCard },
                  { id: "Credit", label: "Credit", icon: FileText },
                  { id: "Split", label: "Split", icon: Percent },
                ].map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPaymentMethod(p.id)}
                      className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center border rounded-lg gap-1 transition-all cursor-pointer ${paymentMethod === p.id ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight">
                        {p.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Split Pay Fields */}
              {paymentMethod === "Split" && (
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-2 space-y-1.5 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Cash</span>
                      <input
                        type="number"
                        value={splitCash || ""}
                        onChange={(e) => setSplitCash(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Card</span>
                      <input
                        type="number"
                        value={splitCard || ""}
                        onChange={(e) => setSplitCard(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">UPI</span>
                      <input
                        type="number"
                        value={splitUPI || ""}
                        onChange={(e) => setSplitUPI(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Salesperson & Generate Invoice */}
              <div className="flex gap-2 items-center">
                <select
                  value={salespersonId}
                  onChange={(e) => setSalespersonId(e.target.value)}
                  className="w-1/3 min-w-0 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="">No Salesperson</option>
                  {(staffList || [])
                    .filter(e => {
                      const title = (e.designation || e.role || "").toLowerCase();
                      return title.includes("sales") || title.includes("admin");
                    })
                    .map((e) => (
                    <option key={e._id || e.id} value={e._id || e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>

                <button
                  id="btn-generate-bill"
                  ref={payBtnRef}
                  onClick={handleCheckoutSubmit}
                  disabled={cart.length === 0}
                  className={`flex-1 py-3 rounded-xl text-[11px] font-extrabold tracking-widest uppercase transition-all shadow-md cursor-pointer ${cart.length === 0 ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:brightness-105"}`}
                >
                  Generate Invoice (F9)
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Scanners, filters, search and quick grid (Lg: col-span-7) */}
          <div className="lg:col-span-7 flex flex-col h-[calc(100vh-140px)] gap-4">
            
            {/* Quick Actions Bar */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
              {["New Customer (F4)", "Hold Bill (F8)", "Resume Bill (F5)", "Goods Return", "Exchange", "Apply Coupon", "Assign Tailor", "Delivery Date"].map((action, i) => (
                <button 
                  key={i} 
                  id={`btn-action-${action}`}
                  type="button" 
                  onClick={() => {
                    if (action === "New Customer (F4)") setShowAddCustomerModal(true);
                    if (action === "Hold Bill (F8)") handleHoldBill();
                    if (action === "Resume Bill (F5)") handleResumeBill();
                  }}
                  className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {action} {action === "Resume Bill (F5)" && heldBills.length > 0 && `(${heldBills.length})`}
                </button>
              ))}
            </div>

            {/* Universal Smart Search & Autocomplete */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 relative z-20 shrink-0">
              <div className="flex gap-2 items-center">
                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Universal Search (F2) - Scan Barcode or type SKU, Name, Brand..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setIsProductDropdownOpen(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => setIsProductDropdownOpen(true)}
                  className="w-full bg-slate-50 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {isProductDropdownOpen && productSearch && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 font-semibold">No products found for "{productSearch}"</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500 sticky top-0 shadow-xs">
                        <tr>
                          <th className="p-2">SKU</th>
                          <th className="p-2">Name</th>
                          <th className="p-2">Brand</th>
                          <th className="p-2">Size</th>
                          <th className="p-2">Color</th>
                          <th className="p-2">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.slice(0, 20).map((p, idx) => (
                          <tr 
                            key={p.id || p._id} 
                            className={`border-b border-slate-100 cursor-pointer transition-colors ${focusedProductIndex === idx ? 'bg-indigo-100' : 'hover:bg-slate-50'}`}
                            onClick={() => {
                              setQtyModalProduct({
                                ...p,
                                ...(p.variants ? p.variants[0] : {}),
                                variants: p.variants
                              });
                              setQtyModalValue(1);
                              setIsProductDropdownOpen(false);
                            }}
                          >
                            <td className="p-2 text-xs font-mono text-slate-500">{p.sku}</td>
                            <td className="p-2 text-xs font-bold text-slate-800">{p.name}</td>
                            <td className="p-2 text-[10px] font-semibold text-slate-600">{p.brand}</td>
                            <td className="p-2 text-[10px] font-semibold text-slate-600">{p.size}</td>
                            <td className="p-2 text-[10px] font-semibold text-slate-600">{p.color}</td>
                            <td className="p-2 text-xs font-bold text-indigo-600 font-mono">₹{p.sellingPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Hidden Barcode Trap */}
            <input 
              ref={barcodeInputRef}
              type="text" 
              className="opacity-0 absolute w-0 h-0"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />

            {/* Categories & Toggle */}
            <div className="flex gap-4 items-center shrink-0">
               <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {uniqueCategories.map((cat, idx) => (
                    <button
                      key={idx}
                      id={`btn-cat-${cat}`}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shrink-0 border ${selectedCategoryFilter === cat ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                    >
                      {cat !== "All" && <span className="opacity-50 mr-1 text-[9px]">A{idx}</span>}
                      {cat}
                    </button>
                  ))}
               </div>

              <div className="flex bg-slate-100/70 p-1 rounded-xl gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setRightColumnTab("catalog")}
                  className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${rightColumnTab === "catalog" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <Grid className="w-4 h-4 text-indigo-600" />
                  <span>ERP Catalog</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightColumnTab("history")}
                  className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${rightColumnTab === "history" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800 relative"}`}
                >
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>History</span>
                </button>
              </div>
            </div>

            {rightColumnTab === "catalog" && (
              /* Enterprise Product Table */
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 flex flex-col min-h-0 relative z-10 overflow-hidden">
                <div className="flex-1 overflow-y-auto min-h-0">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead className="bg-slate-100 sticky top-0 z-20 shadow-xs">
                      <tr>
                        <th className="p-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">SKU</th>
                        <th className="p-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">Product Name</th>
                        <th className="p-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">Brand</th>
                        <th className="p-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">Size</th>
                        <th className="p-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">Color</th>
                        <th className="p-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">Stock</th>
                        <th className="p-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">MRP</th>
                        <th className="p-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">Price</th>
                        <th className="p-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {RenderedProductsTable}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {rightColumnTab === "history" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      Historical Purchases
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Showing previous receipts for{" "}
                      <span className="text-indigo-600 font-bold">
                        {activeCustomer.name}
                      </span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                    {activeCustomer.phone}
                  </span>
                </div>

                {(() => {
                  const customerInvoices = invoices.filter(
                    (inv) =>
                      inv.customerId === selectedCustomerId ||
                      inv.customerPhone === activeCustomer.phone ||
                      inv.customerName.toLowerCase() ===
                        activeCustomer.name.toLowerCase(),
                  );

                  if (customerInvoices.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto stroke-1" />
                        <p className="text-xs font-semibold">
                          No earlier bills found for this customer.
                        </p>
                        <p className="text-[10px]">
                          When they complete their first transaction, their
                          purchase log will register here.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {customerInvoices.map((inv, index) => (
                        <div
                          key={index}
                          className="border border-slate-100 bg-slate-50/40 hover:bg-slate-50 rounded-xl p-3.5 space-y-3 transition-all"
                        >
                          <div className="flex justify-between items-center text-xs font-semibold border-b border-slate-100/60 pb-2">
                            <span 
                              className="font-mono font-bold text-indigo-600 cursor-pointer hover:underline"
                              onClick={() => handleDownloadReceiptHTML(inv)}
                            >
                              {inv.invoiceNo}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {inv.date}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {inv.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-xs text-slate-600"
                              >
                                <div>
                                  <span className="font-bold text-slate-800">
                                    {item.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    Size: {item.size} | Color: {item.color} |
                                    Qty: {item.quantity}
                                  </span>
                                </div>
                                <span className="font-bold font-mono text-slate-700">
                                  ₹{item.totalPrice.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-slate-100/60 pt-2 flex justify-between items-center">
                            <div className="text-[10px] text-slate-400 space-y-0.5">
                              {inv.salespersonName && (
                                <p>
                                  Salesperson:{" "}
                                  <span className="font-bold text-slate-600">
                                    {inv.salespersonName}
                                  </span>
                                </p>
                              )}
                              <p>
                                Pay Mode:{" "}
                                <span className="font-bold text-slate-600">
                                  {inv.paymentMethod}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 block">
                                Grand Total
                              </span>
                              <span className="font-extrabold text-xs text-slate-800 font-mono">
                                ₹{inv.grandTotal.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1 border-t border-dashed border-slate-200">
                            <button
                              type="button"
                              onClick={() => {
                                handleDownloadReceiptHTML(inv);
                              }}
                              className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>View Bill</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                // Add all items from this invoice to the current cart!
                                inv.items.forEach((item) => {
                                  setCart((prev) => {
                                    const existing = prev.find(
                                      (i) =>
                                        i.productId === item.productId &&
                                        i.size === item.size &&
                                        i.color === item.color,
                                    );
                                    if (existing) {
                                      return prev.map((i) =>
                                        i.productId === item.productId &&
                                        i.size === item.size &&
                                        i.color === item.color
                                          ? {
                                              ...i,
                                              quantity:
                                                i.quantity + item.quantity,
                                              totalPrice:
                                                i.totalPrice + item.totalPrice,
                                            }
                                          : i,
                                      );
                                    }
                                    return [...prev, { ...item }];
                                  });
                                });
                                onAddNotification(
                                  "POS Terminal Basket",
                                  `Copied items from invoice ${inv.invoiceNo} into active basket.`,
                                  "success",
                                );
                              }}
                              className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Repeat Order</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode: History List of Previous Invoices */}
      {activePOSMode === "history" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Historical Billing Logs
              </h3>
              <p className="text-xs text-slate-400">
                Total processed transactions: {invoices.length} invoices
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search Invoice # / customer..."
                className="bg-slate-50 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Salesperson</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total Cost</th>
                  <th className="p-3">Pay Mode</th>
                  <th className="p-3">WhatsApp</th>
                  <th className="p-3">Receipt HTML</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {invoices.slice(0, 50).map((inv, idx) => (
                  <tr key={inv._id || inv.id || idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-indigo-600">
                      <span className="cursor-pointer hover:underline" onClick={() => handleDownloadReceiptHTML(inv)}>
                        {inv.invoiceNo}
                      </span>
                    </td>
                    <td className="p-3">{inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                    <td className="p-3 font-medium text-slate-800">
                      {inv.customerName}
                    </td>
                    <td className="p-3">{inv.salespersonName || 'Admin (Self)'}</td>
                    <td className="p-3 font-mono">
                      {(inv.items || []).reduce(
                        (sum, i) => sum + i.quantity,
                        0,
                      )}{" "}
                      pcs
                    </td>
                    <td className="p-3 font-bold font-mono">
                      ₹{inv.grandTotal.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${inv.paymentMethod === "Cash" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}
                      >
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3">
                      {inv.whatsappStatus === 'Sent' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" /> Sent
                        </span>
                      )}
                      {inv.whatsappStatus === 'Failed' && (
                        <button
                          onClick={() => onRetryWhatsApp && onRetryWhatsApp(inv._id || inv.id)}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1 cursor-pointer w-fit"
                          title={inv.failureReason || 'WhatsApp dispatch failed'}
                        >
                          <XCircle className="w-3 h-3" /> Retry
                        </button>
                      )}
                      {!inv.whatsappStatus && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-400 w-fit">
                          —
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDownloadReceiptHTML(inv)}
                        className="text-indigo-500 hover:text-indigo-700 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>HTML</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode: Returns & Exchanges Setup */}
      {activePOSMode === "returns" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Lookup Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:col-span-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lookup Previous Invoice
            </h4>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1 font-mono">
                  Invoice Number
                </span>
                <select
                  onChange={(e) => {
                    const match = invoices.find(
                      (inv) => inv.invoiceNo === e.target.value,
                    );
                    setSelectedInvoiceForReturn(match || null);
                    setReturnedItemIds([]);
                  }}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  <option value="">Select Invoice...</option>
                  {invoices.slice(0, 20).map((inv) => (
                    <option key={inv.id} value={inv.invoiceNo}>
                      {inv.invoiceNo} - {inv.customerName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoiceForReturn && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Date Issued:</span>
                    <span className="font-mono">
                      {selectedInvoiceForReturn.date}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Grand Total:</span>
                    <span className="font-mono text-indigo-600">
                      ₹{selectedInvoiceForReturn.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Payment Route:</span>
                    <span>{selectedInvoiceForReturn.paymentMethod}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items Selector for refund */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:col-span-7 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Select Items to Return / Swap
            </h4>
            {!selectedInvoiceForReturn ? (
              <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                Please search/select an invoice on the left to review return
                eligibility.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-slate-100 space-y-2.5">
                  {selectedInvoiceForReturn.items.map((item, idx) => {
                    const isChecked = returnedItemIds.includes(item.productId);
                    return (
                      <div
                        key={idx}
                        className="py-2 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setReturnedItemIds((prev) =>
                                isChecked
                                  ? prev.filter((id) => id !== item.productId)
                                  : [...prev, item.productId],
                              );
                            }}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
                          />

                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Size: {item.size} | Color: {item.color} | Qty:{" "}
                              {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold font-mono text-slate-800">
                          ₹{item.totalPrice.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="font-semibold text-slate-500">
                    Refund Credit Estimated:
                  </span>
                  <span className="font-mono font-bold text-red-600 text-sm">
                    ₹
                    {selectedInvoiceForReturn.items
                      .filter((item) =>
                        returnedItemIds.includes(item.productId),
                      )
                      .reduce((sum, item) => sum + item.totalPrice, 0)
                      .toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={handleSubmitReturn}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 tracking-wide cursor-pointer"
                >
                  Approve Return & Credit Customer Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode: Quotations */}
      {activePOSMode === "quotations" && (
        <div className="space-y-4 text-xs animate-fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Garment Quotation Builder
              </h3>
              <p className="text-[11px] text-slate-400">
                Generate commercial estimates for custom apparel projects.
              </p>
            </div>
            <button
              onClick={() => {
                setQuoteCustName("");
                setQuoteProdId("");
                setQuoteQty(1);
                setShowQuoteModal(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Quotation</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Quote ID</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Apparel Quote Summary</th>
                    <th className="p-3.5 text-right">Estimated Cost</th>
                    <th className="p-3.5">Approval Status</th>
                    <th className="p-3.5 text-center">Fulfillment Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {quotations.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono font-bold text-indigo-600">
                        {q.quoteNo}
                      </td>
                      <td className="p-3.5 font-mono">{q.date}</td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {q.customerName}
                      </td>
                      <td className="p-3.5">
                        {q.items.map((it, i) => (
                          <div key={i}>
                            {it.quantity}x {it.name}
                          </div>
                        ))}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        ₹{q.total.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${q.status === "Approved" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            // Find linked products and inject to POS checkout
                            const quoteItems = q.items.map((it) => {
                              const prod =
                                products.find((p) => p.name === it.name) ||
                                products[0];
                              return {
                                productId: prod.id,
                                name: prod.name,
                                sku: prod.sku,
                                price: prod.sellingPrice || prod.price || 0,
                                totalPrice: (prod.sellingPrice || prod.price || 0) * it.quantity,
                                quantity: it.quantity,
                                size: prod.size,
                                color: prod.color,
                                discount: 0,
                                isCustom: false,
                              };
                            });
                            setCart(quoteItems);
                            setActivePOSMode("billing");
                            onAddNotification(
                              "Converted Quote",
                              `Converted ${q.quoteNo} into POS active checkout session.`,
                              "success",
                            );
                          }}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[10px] uppercase cursor-pointer shadow-xs"
                        >
                          Convert to POS Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mode: Sales Orders */}
      {activePOSMode === "orders" && (
        <div className="space-y-4 text-xs animate-fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Bulk Sales Orders Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                Track large custom production runs and franchise orders.
              </p>
            </div>
            <button
              onClick={() => {
                setOrderCustName("");
                setOrderProdId("");
                setOrderQty(20);
                setShowOrderModal(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Sales Order</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Order ID</th>
                    <th className="p-3.5">Date Created</th>
                    <th className="p-3.5">Client / Buyer</th>
                    <th className="p-3.5 text-right">Items Count</th>
                    <th className="p-3.5 text-right">Contract Value</th>
                    <th className="p-3.5">Delivery Status</th>
                    <th className="p-3.5 text-center">Fulfillment Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {salesOrders.map((so, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono font-bold text-indigo-600">
                        {so.orderNo}
                      </td>
                      <td className="p-3.5 font-mono">{so.date}</td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {so.customerName}
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        {so.itemsCount} lines
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        ₹{so.total.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            so.status === "Dispatched"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {so.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {so.status === "Pending" ? (
                          <button
                            onClick={() => {
                              setSalesOrders((prev) =>
                                prev.map((o) =>
                                  o.id === so.id
                                    ? { ...o, status: "Dispatched" }
                                    : o,
                                ),
                              );
                              onAddNotification(
                                "Order Shipped",
                                `Sales Order ${so.orderNo} status flagged as DISPATCHED.`,
                                "success",
                              );
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] uppercase cursor-pointer shadow-xs"
                          >
                            Mark Dispatched
                          </button>
                        ) : (
                          <span className="text-slate-400 font-bold text-[10px]">
                            Fulfillment Completed
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

      {/* Mode: Credit Notes */}
      {activePOSMode === "credit_notes" && (
        <div className="space-y-4 text-xs animate-fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Credit Notes Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                Issue commercial refunds or pricing waivers credited directly to
                client wallets.
              </p>
            </div>
            <button
              onClick={() => {
                setCreditInvoiceNo("");
                setCreditAmt(500);
                setCreditReason("Size swap price difference");
                setShowCreditModal(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Credit Note</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Note ID</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Link Invoice</th>
                    <th className="p-3.5">Client / Buyer</th>
                    <th className="p-3.5">Waiver Reason</th>
                    <th className="p-3.5 text-right">Credited Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {creditNotes.map((cn, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono font-bold text-red-600">
                        {cn.noteNo}
                      </td>
                      <td className="p-3.5 font-mono">{cn.date}</td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {cn.invoiceNo}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {cn.customerName}
                      </td>
                      <td className="p-3.5 text-slate-500">{cn.reason}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                        ₹{cn.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mode: Debit Notes */}
      {activePOSMode === "debit_notes" && (
        <div className="space-y-4 text-xs animate-fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Debit Notes Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                Levy charges, freight costs, or bespoke alterations additions to
                ledger balance.
              </p>
            </div>
            <button
              onClick={() => {
                setDebitInvoiceNo("");
                setDebitAmt(500);
                setDebitReason("Custom fit alteration surcharge");
                setShowDebitModal(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Debit Note</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Note ID</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Link Invoice</th>
                    <th className="p-3.5">Client / Buyer</th>
                    <th className="p-3.5">Debit Surcharge Reason</th>
                    <th className="p-3.5 text-right">Debited Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {debitNotes.map((dn, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono font-bold text-indigo-600">
                        {dn.noteNo}
                      </td>
                      <td className="p-3.5 font-mono">{dn.date}</td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {dn.invoiceNo}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {dn.customerName}
                      </td>
                      <td className="p-3.5 text-slate-500">{dn.reason}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        ₹{dn.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= BILLING MODALS ======================= */}

      {/* MODAL: CREATE QUOTATION */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Create Garment Quotation
              </h3>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateQuotation} className="space-y-4">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Customer / Lead Name
                </label>
                <input
                  type="text"
                  required
                  value={quoteCustName}
                  onChange={(e) => setQuoteCustName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Select Catalog Item
                  </label>
                  <select
                    required
                    value={quoteProdId}
                    onChange={(e) => setQuoteProdId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700 outline-none"
                  >
                    <option value="">Select Item...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={quoteQty}
                    onChange={(e) =>
                      setQuoteQty(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
                >
                  Generate Estimate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SALES ORDER */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Register Bulk Sales Order
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSalesOrder} className="space-y-4">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  B2B Franchise/Client Name
                </label>
                <input
                  type="text"
                  required
                  value={orderCustName}
                  onChange={(e) => setOrderCustName(e.target.value)}
                  placeholder="e.g. Ziva Retail Bangalore"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Assigned SKU Product
                  </label>
                  <select
                    required
                    value={orderProdId}
                    onChange={(e) => setOrderProdId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700 outline-none"
                  >
                    <option value="">Select Item...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Production Qty
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={orderQty}
                    onChange={(e) =>
                      setOrderQty(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
                >
                  Register Sales Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE CREDIT NOTE */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Issue Credit Note Waiver
              </h3>
              <button
                onClick={() => setShowCreditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCreditNote} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Beneficiary Customer
                  </label>
                  <select
                    value={creditCustId}
                    onChange={(e) => setCreditCustId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Linked Invoice #
                  </label>
                  <input
                    type="text"
                    required
                    value={creditInvoiceNo}
                    onChange={(e) => setCreditInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-20260499"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Credit Note Value (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={creditAmt}
                    onChange={(e) =>
                      setCreditAmt(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Waiver Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder="e.g. Garment mismatch refund"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreditModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
                >
                  Issue Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE DEBIT NOTE */}
      {showDebitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Issue Debit Surcharge Note
              </h3>
              <button
                onClick={() => setShowDebitModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDebitNote} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Charge Customer Account
                  </label>
                  <select
                    value={debitCustId}
                    onChange={(e) => setDebitCustId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Linked Invoice #
                  </label>
                  <input
                    type="text"
                    required
                    value={debitInvoiceNo}
                    onChange={(e) => setDebitInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-20260498"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Debit Value (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={debitAmt}
                    onChange={(e) =>
                      setDebitAmt(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Surcharge Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={debitReason}
                    onChange={(e) => setDebitReason(e.target.value)}
                    placeholder="e.g. Premium express custom tailoring"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDebitModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
                >
                  Issue Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SELECT VARIANT (Size & Color) */}
      {variantModalProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xs w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Select Options
              </h4>
              <button
                onClick={() => setVariantModalProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">{variantModalProduct.name}</p>
              
              <div className="space-y-3">
                {!(variantModalProduct.category || "").toLowerCase().includes("saree") && !(variantModalProduct.name || "").toLowerCase().includes("saree") && (
                  <div>
                    <label className="block text-slate-500 mb-1 text-xs font-semibold">Size</label>
                    <select 
                      value={variantModalSize}
                      onChange={(e) => setVariantModalSize(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
                    >
                      {["XS", "S", "M", "L", "XL", "XXL", "3XL", "FS"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-slate-500 mb-1 text-xs font-semibold">Color</label>
                  <select 
                    value={variantModalColor}
                    onChange={(e) => setVariantModalColor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
                  >
                    {["White", "Black", "Red", "Blue", "Green", "Navy", "Grey", "Yellow", "Pink", "Maroon"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const finalSize = ((variantModalProduct.category || "").toLowerCase().includes("saree") || (variantModalProduct.name || "").toLowerCase().includes("saree")) ? "FS" : variantModalSize;
                const prodWithVariant = {
                  ...variantModalProduct,
                  size: finalSize,
                  color: variantModalColor
                };
                handleAddProductToCart(prodWithVariant);
                onAddNotification("POS Billing", `Added ${variantModalProduct.name} (${finalSize}, ${variantModalColor}) to cart.`, "success");
                setVariantModalProduct(null);
              }}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md cursor-pointer mt-4"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD RETAIL CUSTOMER */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Register New Customer
              </h4>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Shashi Kapoor"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Contact Mobile *
                </label>
                <input
                  required
                  type="text"
                  pattern="\d{10}"
                  title="Phone number must be exactly 10 digits"
                  maxLength="10"
                  placeholder="e.g. 9876543210"
                  value={newCustPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setNewCustPhone(val);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. shashi@gmail.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  WhatsApp Number <span className="text-slate-400 font-normal">(optional, defaults to mobile)</span>
                </label>
                <input
                  type="text"
                  pattern="\d{10}"
                  title="WhatsApp number must be exactly 10 digits"
                  maxLength="10"
                  placeholder="e.g. 9876543210"
                  value={newCustWhatsApp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setNewCustWhatsApp(val);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md cursor-pointer"
              >
                Save CRM Record & Select
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODULE 2: ARTICULATION WINDOW (Product Availability & Variant Matrix Spreadsheet) */}
      {articulationProduct &&
        (() => {
          // Filter variants based on articulation search
          const spreadsheetFilteredVariants = products
            .filter(
              (p) =>
                p.brand === articulationProduct.brand &&
                p.category === articulationProduct.category,
            )
            .filter((v) => {
              if (!articulationSearch) return true;
              const qs = articulationSearch.toLowerCase();
              return (
                v.name.toLowerCase().includes(qs) ||
                v.sku.toLowerCase().includes(qs) ||
                v.color.toLowerCase().includes(qs) ||
                v.size.toLowerCase().includes(qs) ||
                v.barcode.includes(qs)
              );
            });

          return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
              <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 max-w-6xl w-full flex flex-col overflow-hidden my-4 max-h-[92vh] text-slate-800 animate-scale-up">
                {/* EXCEL TITLE BAR (GREEN) */}
                <div className="bg-[#107c41] text-white px-4 py-2.5 flex items-center justify-between shadow-md shrink-0">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-100" />
                    <div className="leading-none">
                      <span className="text-xs font-bold font-mono tracking-tight text-emerald-100 uppercase block">
                        Excel Inventory Workspace
                      </span>
                      <h3 className="text-sm font-extrabold font-mono">
                        Sku_Matrix_
                        {articulationProduct.brand.replace(/\s+/g, "_")}_
                        {articulationProduct.category.replace(/\s+/g, "_")}.xlsx
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1.5 text-[10px] bg-emerald-800/50 px-2.5 py-1 rounded font-mono">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span>Online Co-Authoring</span>
                    </div>
                    <button
                      onClick={() => setArticulationProduct(null)}
                      className="p-1 hover:bg-emerald-800 text-white rounded transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* GOOGLE SHEETS MENU BAR */}
                <div className="bg-white border-b border-slate-200 px-4 py-1 text-xs text-slate-600 flex gap-4 select-none overflow-x-auto shrink-0 scrollbar-none">
                  {[
                    "File",
                    "Edit",
                    "View",
                    "Insert",
                    "Format",
                    "Data",
                    "Tools",
                    "Extensions",
                    "Help",
                  ].map((menu) => (
                    <span
                      key={menu}
                      className="hover:bg-slate-100 px-2 py-0.5 rounded cursor-pointer transition-colors font-medium"
                    >
                      {menu}
                    </span>
                  ))}
                </div>

                {/* EXCEL FORMATTING TOOLBAR */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 flex flex-wrap items-center gap-2 text-slate-600 select-none shrink-0 text-xs">
                  <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                    <button
                      title="Undo (Ctrl+Z)"
                      className="p-1 hover:bg-slate-200 rounded text-slate-400 cursor-not-allowed"
                    >
                      ↩
                    </button>
                    <button
                      title="Redo (Ctrl+Y)"
                      className="p-1 hover:bg-slate-200 rounded text-slate-400 cursor-not-allowed"
                    >
                      ↪
                    </button>
                    <button
                      title="Print (Ctrl+P)"
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 border-r border-slate-200 pr-2 font-mono">
                    <select className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[11px] font-sans outline-none">
                      <option>Inter</option>
                      <option>JetBrains Mono</option>
                      <option>Arial</option>
                    </select>
                    <select className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[11px] outline-none">
                      <option>11</option>
                      <option>10</option>
                      <option>12</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                    <button
                      title="Bold (Ctrl+B)"
                      className="p-1 hover:bg-slate-200 rounded font-bold"
                    >
                      B
                    </button>
                    <button
                      title="Italic (Ctrl+I)"
                      className="p-1 hover:bg-slate-200 rounded italic"
                    >
                      I
                    </button>
                    <button
                      title="Underline (Ctrl+U)"
                      className="p-1 hover:bg-slate-200 rounded underline"
                    >
                      U
                    </button>
                    <button
                      title="Strikethrough"
                      className="p-1 hover:bg-slate-200 rounded line-through"
                    >
                      S
                    </button>
                  </div>

                  <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                    <span className="text-[10px] text-slate-400">Fill:</span>
                    <span className="w-4 h-4 bg-yellow-100 border border-slate-300 rounded cursor-pointer" />
                    <span className="text-[10px] text-slate-400">Text:</span>
                    <span className="font-bold text-indigo-600 cursor-pointer text-xs">
                      A
                    </span>
                  </div>

                  {/* Formulas and local search */}
                  <div className="flex-1 flex items-center justify-end gap-2 min-w-[200px]">
                    <div className="relative w-full max-w-xs">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Search spreadsheet matrix..."
                        value={articulationSearch}
                        onChange={(e) => setArticulationSearch(e.target.value)}
                        className="w-full pl-7 pr-3 py-1 bg-white border border-slate-200 rounded text-[11px] outline-none focus:border-emerald-500 font-semibold"
                      />

                      {articulationSearch && (
                        <button
                          onClick={() => setArticulationSearch("")}
                          className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 font-bold text-[10px]"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* EXCEL FORMULA BAR */}
                <div className="bg-white border-b border-slate-200 px-4 py-1 flex items-center text-xs shrink-0 font-mono">
                  <div className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-center min-w-[40px] font-bold text-[#107c41]">
                    {activeCellId
                      ? `${activeCellId.col}${activeCellId.row}`
                      : "A1"}
                  </div>
                  <div className="h-4 w-[1px] bg-slate-300 mx-2" />
                  <div className="text-slate-400 font-serif italic font-semibold select-none mr-2">
                    fx
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={(() => {
                      if (spreadsheetFilteredVariants.length === 0)
                        return "=EMPTY_SELECTION()";
                      const activeRowIndex = Math.min(
                        (activeCellId?.row || 1) - 1,
                        spreadsheetFilteredVariants.length - 1,
                      );
                      const activeVar =
                        spreadsheetFilteredVariants[
                          activeRowIndex >= 0 ? activeRowIndex : 0
                        ];
                      if (!activeVar) return `=SUM(F1:F0)`;
                      const col = activeCellId?.col || "A";
                      const rowQty = spreadsheetQuantities[activeVar.id] || 1;
                      switch (col) {
                        case "A":
                          return `="${activeVar.name.split(" - ")[0]}"`;
                        case "B":
                          return `="${activeVar.color}"`;
                        case "C":
                          return `="${activeVar.size}"`;
                        case "D":
                          return `="${activeVar.sku}"`;
                        case "E":
                          return `="${activeVar.barcode}"`;
                        case "F":
                          return `=STOCK_LEVEL("${activeVar.sku}", ${activeVar.stock})`;
                        case "G":
                          return `=ORDER_QTY("${activeVar.sku}", ${rowQty})`;
                        case "H":
                          return `=BUY_SINGLE("${activeVar.sku}", 1)`;
                        case "I":
                          return `=BUY_BULK("${activeVar.sku}", ${rowQty})`;
                        default:
                          return `=SUM(F2:F${spreadsheetFilteredVariants.length + 1})`;
                      }
                    })()}
                    className="flex-1 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded outline-none text-slate-600 text-[11px]"
                  />
                </div>

                {/* MAIN WORKSPACE LAYOUT (SHEET + FORM DETAILS LEDGER) */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                  {/* LEFT SPREADSHEET CANVAS */}
                  <div className="flex-1 overflow-auto bg-slate-200 p-1 min-h-[350px] flex flex-col justify-between">
                    <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden select-none flex-1 overflow-y-auto">
                      <table className="w-full border-collapse text-left text-[11px] font-mono table-fixed">
                        <thead>
                          {/* COLUMN LETTERS INDEX ROW */}
                          <tr className="bg-slate-100 text-slate-500 border-b border-slate-300 text-center text-[10px] font-bold select-none">
                            <th className="w-10 bg-slate-100 border-r border-slate-300 p-1 text-slate-400">
                              #
                            </th>
                            <th className="w-48 border-r border-slate-300 p-1">
                              A (Product Details)
                            </th>
                            <th className="w-20 border-r border-slate-300 p-1">
                              B (Color)
                            </th>
                            <th className="w-14 border-r border-slate-300 p-1">
                              C (Size)
                            </th>
                            <th className="w-28 border-r border-slate-300 p-1">
                              D (SKU)
                            </th>
                            <th className="w-28 border-r border-slate-300 p-1">
                              E (Barcode)
                            </th>
                            <th className="w-22 border-r border-slate-300 p-1">
                              F (In Stock)
                            </th>
                            <th className="w-24 border-r border-slate-300 p-1">
                              G (Order Qty)
                            </th>
                            <th className="w-22 border-r border-slate-300 p-1">
                              H (Buy Single)
                            </th>
                            <th className="w-22 p-1">I (Buy Qty)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {spreadsheetFilteredVariants.length === 0 ? (
                            <tr>
                              <td
                                colSpan={10}
                                className="p-8 text-center text-slate-400 font-sans italic bg-slate-50"
                              >
                                No matching variant matrix cells found. Adjust
                                spreadsheet filters.
                              </td>
                            </tr>
                          ) : (
                            spreadsheetFilteredVariants.map((item, index) => {
                              const rowIndex = index + 1;
                              const itemQty =
                                spreadsheetQuantities[item.id] || 1;
                              const isLow = item.stock <= item.minStockAlert;
                              const isOut = item.stock <= 0;

                              const checkCellSelected = (colName) => {
                                return (
                                  activeCellId?.row === rowIndex &&
                                  activeCellId?.col === colName
                                );
                              };

                              const renderCellBorderClass = (colName) => {
                                const isSel = checkCellSelected(colName);
                                return `border-r border-slate-200 p-1.5 truncate relative ${
                                  isSel
                                    ? "ring-2 ring-emerald-500 ring-inset bg-emerald-50/10 z-10"
                                    : "hover:bg-slate-50/50 cursor-cell"
                                }`;
                              };

                              return (
                                <tr
                                  key={item.id}
                                  className={`hover:bg-slate-50/40 ${selectedVariant?.id === item.id ? "bg-emerald-50/20" : ""}`}
                                >
                                  {/* ROW LABELS */}
                                  <td className="bg-slate-50 border-r border-slate-300 p-1.5 text-center text-slate-400 font-bold select-none text-[10px]">
                                    {rowIndex}
                                  </td>

                                  {/* COL A: Spec Name */}
                                  <td
                                    onClick={() => {
                                      setActiveCellId({
                                        row: rowIndex,
                                        col: "A",
                                      });
                                      setSelectedVariant(item);
                                    }}
                                    className={`${renderCellBorderClass("A")} font-sans font-bold text-slate-700`}
                                  >
                                    {item.name.split(" - ")[0]}
                                  </td>

                                  {/* COL B: Color */}
                                  <td
                                    onClick={() => {
                                      setActiveCellId({
                                        row: rowIndex,
                                        col: "B",
                                      });
                                      setSelectedVariant(item);
                                    }}
                                    className={`${renderCellBorderClass("B")} font-sans text-slate-600`}
                                  >
                                    {item.color}
                                  </td>

                                  {/* COL C: Size */}
                                  <td
                                    onClick={() => {
                                      setActiveCellId({
                                        row: rowIndex,
                                        col: "C",
                                      });
                                      setSelectedVariant(item);
                                    }}
                                    className={`${renderCellBorderClass("C")} text-center font-bold text-slate-700`}
                                  >
                                    {item.size}
                                  </td>

                                  {/* COL D: SKU */}
                                  <td
                                    onClick={() => {
                                      setActiveCellId({
                                        row: rowIndex,
                                        col: "D",
                                      });
                                      setSelectedVariant(item);
                                    }}
                                    className={`${renderCellBorderClass("D")} text-slate-500`}
                                  >
                                    {item.sku}
                                  </td>

                                  {/* COL E: Barcode */}
                                  <td
                                    onClick={() => {
                                      setActiveCellId({
                                        row: rowIndex,
                                        col: "E",
                                      });
                                      setSelectedVariant(item);
                                    }}
                                    className={`${renderCellBorderClass("E")} text-slate-400 text-[10px]`}
                                  >
                                    {item.barcode}
                                  </td>

                                  {/* COL F: In Stock */}
                                  <td
                                    onClick={() => {
                                      setActiveCellId({
                                        row: rowIndex,
                                        col: "F",
                                      });
                                      setSelectedVariant(item);
                                    }}
                                    className={`${renderCellBorderClass("F")} text-right`}
                                  >
                                    <span
                                      className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${
                                        isOut
                                          ? "bg-red-50 text-red-600 border border-red-200"
                                          : isLow
                                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      }`}
                                    >
                                      {item.stock} Qty
                                    </span>
                                  </td>

                                  {/* COL G: Order Qty Input spinner inside cell */}
                                  <td
                                    onClick={() => {
                                      setActiveCellId({
                                        row: rowIndex,
                                        col: "G",
                                      });
                                      setSelectedVariant(item);
                                    }}
                                    className={`${renderCellBorderClass("G")} text-center font-sans z-20`}
                                  >
                                    <div className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded px-1 py-0.2">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newVal = Math.max(
                                            1,
                                            itemQty - 1,
                                          );
                                          setSpreadsheetQuantities((prev) => ({
                                            ...prev,
                                            [item.id]: newVal,
                                          }));
                                        }}
                                        className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded flex items-center justify-center font-bold text-[10px] cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="text"
                                        value={itemQty}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          const val =
                                            parseInt(e.target.value) || 1;
                                          setSpreadsheetQuantities((prev) => ({
                                            ...prev,
                                            [item.id]: val,
                                          }));
                                        }}
                                        className="w-6 text-center text-[10px] font-mono font-bold outline-none text-slate-800 bg-transparent"
                                      />

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newVal = Math.min(
                                            item.stock || 99,
                                            itemQty + 1,
                                          );
                                          setSpreadsheetQuantities((prev) => ({
                                            ...prev,
                                            [item.id]: newVal,
                                          }));
                                        }}
                                        className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded flex items-center justify-center font-bold text-[10px] cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </td>

                                  {/* COL H: Action BUY SINGLE */}
                                  <td
                                    onClick={() => {
                                      setActiveCellId({
                                        row: rowIndex,
                                        col: "H",
                                      });
                                      setSelectedVariant(item);
                                    }}
                                    className={`${renderCellBorderClass("H")} text-center`}
                                  >
                                    <button
                                      type="button"
                                      disabled={isOut}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddProductToCartWithQty(item, 1);
                                        onAddNotification(
                                          "Spreadsheet Dispatch",
                                          `Successfully added 1x single ${item.brand} size ${item.size} to POS cart.`,
                                          "success",
                                        );
                                      }}
                                      className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold uppercase transition-all tracking-wider cursor-pointer ${
                                        isOut
                                          ? "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200"
                                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-sm"
                                      }`}
                                    >
                                      Buy 1
                                    </button>
                                  </td>

                                  {/* COL I: Action BUY BULK/CUSTOM QTY */}
                                  <td
                                    onClick={() => {
                                      setActiveCellId({
                                        row: rowIndex,
                                        col: "I",
                                      });
                                      setSelectedVariant(item);
                                    }}
                                    className={`${renderCellBorderClass("I")} text-center`}
                                  >
                                    <button
                                      type="button"
                                      disabled={isOut}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddProductToCartWithQty(
                                          item,
                                          itemQty,
                                        );
                                        onAddNotification(
                                          "Spreadsheet Dispatch",
                                          `Injected ${itemQty}x variant units directly to POS cart.`,
                                          "success",
                                        );
                                      }}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-sans font-bold uppercase transition-all tracking-wider cursor-pointer ${
                                        isOut
                                          ? "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200"
                                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                      }`}
                                    >
                                      Buy Qty
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}

                          {/* EXCEL CALCULATED SUM ROW */}
                          {spreadsheetFilteredVariants.length > 0 && (
                            <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-700">
                              <td className="bg-slate-100 p-2 text-center text-[10px] text-slate-400 border-r border-slate-300 select-none">
                                ∑
                              </td>
                              <td className="p-2 border-r border-slate-200 font-sans text-[10px] uppercase text-slate-500">
                                Spreadsheet Formula Sum (=SUM(F2:F
                                {spreadsheetFilteredVariants.length + 1}))
                              </td>
                              <td className="p-2 border-r border-slate-200"></td>
                              <td className="p-2 border-r border-slate-200"></td>
                              <td className="p-2 border-r border-slate-200"></td>
                              <td className="p-2 border-r border-slate-200"></td>
                              {/* Total Stock Summary */}
                              <td className="p-2 border-r border-slate-200 text-right text-indigo-600 font-extrabold text-xs underline decoration-double">
                                {spreadsheetFilteredVariants.reduce(
                                  (sum, v) => sum + v.stock,
                                  0,
                                )}{" "}
                                Pcs
                              </td>
                              {/* Total planned Order Summary */}
                              <td className="p-2 border-r border-slate-200 text-center text-emerald-600 font-extrabold text-xs">
                                {spreadsheetFilteredVariants.reduce(
                                  (sum, v) =>
                                    sum + (spreadsheetQuantities[v.id] || 1),
                                  0,
                                )}{" "}
                                Pcs
                              </td>
                              <td className="p-2 border-r border-slate-200 text-center text-slate-400 text-[9px]">
                                N/A
                              </td>
                              <td className="p-2 text-indigo-600 text-right font-extrabold text-xs underline decoration-double">
                                ₹
                                {spreadsheetFilteredVariants
                                  .reduce(
                                    (sum, v) =>
                                      sum +
                                      v.sellingPrice *
                                        (spreadsheetQuantities[v.id] || 1),
                                    0,
                                  )
                                  .toLocaleString()}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* SHEETS WORKBOOK TABS FOOTER (EXCEL STYLE STATUS BAR) */}
                    <div className="mt-1 bg-white border border-slate-300 rounded shadow-xs p-1 px-3 flex items-center justify-between text-[10px] font-sans text-slate-500 shrink-0 select-none">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-emerald-50 text-[#107c41] px-2.5 py-0.5 border-t-2 border-[#107c41] font-bold text-[11px] cursor-pointer">
                          Sizes_Stock_Log
                        </span>
                        <span className="hover:bg-slate-100 px-2 py-0.5 rounded cursor-not-allowed">
                          Warehouse_Distribution
                        </span>
                        <span className="hover:bg-slate-100 px-2 py-0.5 rounded cursor-not-allowed">
                          Customer_Loyalty_Formulas
                        </span>
                        <button
                          className="text-slate-400 hover:text-slate-700 text-sm font-bold ml-1"
                          title="Add New Sheet"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[9px]">
                        <span>
                          AVERAGE:{" "}
                          {(
                            spreadsheetFilteredVariants.reduce(
                              (sum, v) => sum + v.stock,
                              0,
                            ) / (spreadsheetFilteredVariants.length || 1)
                          ).toFixed(1)}
                        </span>
                        <span>COUNT: {spreadsheetFilteredVariants.length}</span>
                        <span className="font-bold text-slate-700">
                          SUM:{" "}
                          {spreadsheetFilteredVariants.reduce(
                            (sum, v) => sum + v.stock,
                            0,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT DETAILS PANEL: FORMULAS & SPECS LEDGER */}
                  <div className="w-full lg:w-72 bg-slate-900 text-slate-200 p-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800 shrink-0 space-y-5">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono tracking-widest text-[#107c41] uppercase font-bold">
                          Inspect Workspace Cell
                        </span>
                        <h4 className="text-sm font-extrabold tracking-tight">
                          Active Matrix Blueprint
                        </h4>
                      </div>

                      {selectedVariant ? (
                        <div className="space-y-4 text-xs">
                          {/* Specs */}
                          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300">
                            <div className="flex justify-between border-b border-slate-850 pb-1">
                              <span className="text-slate-500">Specs:</span>
                              <span className="font-sans font-bold text-white truncate max-w-[150px]">
                                {selectedVariant.brand} {selectedVariant.size}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-850 pb-1">
                              <span className="text-slate-500">
                                Color Variant:
                              </span>
                              <span className="font-sans font-bold text-emerald-400">
                                {selectedVariant.color}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-850 pb-1">
                              <span className="text-slate-500">Size Code:</span>
                              <span className="font-sans font-bold text-white">
                                {selectedVariant.size}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-850 pb-1">
                              <span className="text-slate-500">
                                Item Price:
                              </span>
                              <span className="text-white font-bold font-mono">
                                ₹{selectedVariant.sellingPrice}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-850 pb-1">
                              <span className="text-slate-500">
                                Stock Capacity:
                              </span>
                              <span
                                className={
                                  selectedVariant.stock <=
                                  selectedVariant.minStockAlert
                                    ? "text-amber-400 font-bold"
                                    : "text-emerald-400 font-bold"
                                }
                              >
                                {selectedVariant.stock} units
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-850 pb-1">
                              <span className="text-slate-500">
                                Central Hub:
                              </span>
                              <span className="text-white font-bold">
                                Central Rack{" "}
                                {selectedVariant.id.replace("p-", "C-")}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">
                                GST Percent:
                              </span>
                              <span className="text-indigo-400 font-bold">
                                {selectedVariant.gstPercent}%
                              </span>
                            </div>
                          </div>

                          {/* Stock distribution cross warehouses */}
                          <div className="space-y-1.5">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                              Multi-Warehouse Inventory
                            </p>
                            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-2.5 space-y-1 font-mono text-[9px] text-slate-400">
                              <div className="flex justify-between">
                                <span>Main Warehouse</span>
                                <span className="text-white font-bold">
                                  {Math.round(selectedVariant.stock * 0.5)} Qty
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Showroom Rack</span>
                                <span className="text-white font-bold">
                                  {Math.round(selectedVariant.stock * 0.3)} Qty
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Stock Transit</span>
                                <span className="text-white font-bold">
                                  {Math.round(selectedVariant.stock * 0.2)} Qty
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* CRM Buyer */}
                          {activeCustomer && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-[10px] leading-tight font-sans">
                              <p className="font-bold flex items-center gap-1 mb-1">
                                <User className="w-3.5 h-3.5 text-emerald-400" />
                                <span>CRM Target Buyer</span>
                              </p>
                              <p className="mt-0.5 font-bold text-white">
                                {activeCustomer.name}
                              </p>
                              <p className="text-[9px] text-slate-400">
                                Membership:{" "}
                                <span className="text-emerald-400 font-bold">
                                  {activeCustomer.membership}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-slate-500 text-xs">
                          <p>No cell active.</p>
                          <p className="text-[10px]">
                            Select any spreadsheet cell to retrieve catalog
                            specs.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions & Inject */}
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-400 font-mono text-[10px]">
                          <span>Selected Unit Price:</span>
                          <span>
                            ₹
                            {selectedVariant ? selectedVariant.sellingPrice : 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400 font-mono text-[10px]">
                          <span>Order Dispatch Qty:</span>
                          <span>
                            {selectedVariant
                              ? spreadsheetQuantities[selectedVariant.id] || 1
                              : 0}{" "}
                            units
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-800 text-white font-bold text-xs">
                          <span>Total Invoice est.</span>
                          <span className="font-mono text-emerald-400 text-sm">
                            ₹
                            {selectedVariant
                              ? (
                                  selectedVariant.sellingPrice *
                                  (spreadsheetQuantities[selectedVariant.id] ||
                                    1)
                                ).toLocaleString()
                              : 0}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={
                          !selectedVariant || selectedVariant.stock <= 0
                        }
                        onClick={() => {
                          if (selectedVariant) {
                            const rowQty =
                              spreadsheetQuantities[selectedVariant.id] || 1;
                            handleAddProductToCartWithQty(
                              selectedVariant,
                              rowQty,
                            );
                            onAddNotification(
                              "POS Dispatch Injected",
                              `Successfully added ${rowQty}x ${selectedVariant.brand} ${selectedVariant.size} directly from spreadsheet matrix.`,
                              "success",
                            );
                            setArticulationProduct(null);
                          }
                        }}
                        className={`w-full py-2.5 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all ${
                          selectedVariant && selectedVariant.stock > 0
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-950/40"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                        }`}
                      >
                        <span>Inject Row Into POS</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setArticulationProduct(null)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer text-center font-sans"
                      >
                        Close Spreadsheet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* MODAL: COMPLETED RECEIPT VIEW */}
      {showReceiptModal && completedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wide">
                  Sale Completed Successfully
                </span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Receipt paper layout */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 font-mono text-xs text-slate-800 space-y-3 max-h-96 overflow-y-auto">
              <div className="text-center font-bold text-slate-900 text-sm">
                ZIVA FASHION BOUTIQUE
              </div>
              <div className="text-center text-[10px] text-slate-500">
                Bandra, Mumbai - GSTIN 27AABCV1942A1ZX
              </div>
              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="flex justify-between">
                <span>Receipt: {completedInvoice.invoiceNo}</span>
                <span>Date: {completedInvoice.date ? new Date(completedInvoice.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span>Customer: {completedInvoice.customerName}</span>
                <span>Salesperson: {completedInvoice.salespersonName || 'Admin (Self)'}</span>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="space-y-1 text-[11px]">
                {completedInvoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {item.quantity}x {item.name.substring(0, 24)}...
                    </span>
                    <span>₹{(Number(item.totalPrice) || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{completedInvoice.subTotal}</span>
                </div>
                {completedInvoice.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount:</span>
                    <span>-₹{completedInvoice.discountTotal}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST:</span>
                  <span>₹{completedInvoice.gstTotal}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Paid:</span>
                  <span>₹{completedInvoice.grandTotal}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />
              <div className="text-center text-[10px] text-slate-400">
                Powering Retail Commerce via GarmentFlow SaaS
              </div>
            </div>

            {/* Actions for receipts */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDownloadReceiptHTML(completedInvoice)}
                  className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download HTML</span>
                </button>
                <button
                  onClick={() => {
                    onAddNotification(
                      "Printer Terminal",
                      "Sending print job TM-T88 thermal stack...",
                      "info",
                    );
                    onAddNotification(
                      "SMS Gateway",
                      `WhatsApp receipt sent to ${completedInvoice.customerPhone}`,
                      "success",
                    );
                    setShowReceiptModal(false);
                  }}
                  className="py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Send to Thermal</span>
                </button>
              </div>

              {/* ── WhatsApp Dispatch Status ───────────────────────────── */}
              <div className="mt-2 p-3 rounded-xl border text-xs" style={{
                background: whatsappDispatchState === 'success' ? '#f0fdf4' : whatsappDispatchState === 'failed' ? '#fef2f2' : whatsappDispatchState === 'sending' ? '#eff6ff' : '#f8fafc',
                borderColor: whatsappDispatchState === 'success' ? '#bbf7d0' : whatsappDispatchState === 'failed' ? '#fecaca' : whatsappDispatchState === 'sending' ? '#bfdbfe' : '#e2e8f0',
              }}>
                {whatsappDispatchState === 'sending' && (
                  <div className="flex items-center gap-2 text-blue-700 font-semibold">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching invoice via WhatsApp...</span>
                  </div>
                )}
                {whatsappDispatchState === 'success' && (
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Invoice sent to customer's WhatsApp successfully!</span>
                  </div>
                )}
                {whatsappDispatchState === 'failed' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-600 font-semibold">
                      <XCircle className="w-4 h-4" />
                      <span>WhatsApp dispatch failed. You can retry below.</span>
                    </div>
                    <button
                      onClick={async () => {
                        if (whatsappDispatchId && onRetryWhatsApp) {
                          setWhatsappDispatchState('sending');
                          const ok = await onRetryWhatsApp(whatsappDispatchId);
                          setWhatsappDispatchState(ok ? 'success' : 'failed');
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                    >
                      Retry WhatsApp
                    </button>
                  </div>
                )}
                {whatsappDispatchState === 'idle' && (
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Smartphone className="w-4 h-4" />
                    <span>WhatsApp auto-dispatch not triggered (no customer number or config).</span>
                  </div>
                )}
              </div>
              
              
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Quantity Modal */}
      {qtyModalProduct && (() => {
        // Compute sizes/colors based on variants array if available, otherwise use a generic Garment sizing standard
        const uniqueSizes = qtyModalProduct.variants?.length ? [...new Set(qtyModalProduct.variants.map(v => v.size).filter(Boolean))] : ["XS", "S", "M", "L", "XL", "XXL", "3XL", "FS"];
        const uniqueColors = qtyModalProduct.variants?.length ? [...new Set(qtyModalProduct.variants.map(v => v.color).filter(Boolean))] : ["Red", "Blue", "Black", "White", "Grey", "Navy", "Olive", "Maroon", "Pink", "Yellow"];

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-scale-up">
              <h3 className="text-sm font-bold text-slate-800 mb-4 line-clamp-1">Add to Cart: {qtyModalProduct.name}</h3>
              
              {/* Size & Color Selectors */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between items-center">
                    <span>Size</span>
                    <span className="flex items-center gap-1.5 text-[8px] tracking-normal font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                      <span>🟢 Safe</span>
                      <span>🟡 Low</span>
                      <span>🔴 Out</span>
                    </span>
                  </label>
                  <select 
                    value={qtyModalProduct.size || ""} 
                    onChange={(e) => {
                      const newSize = e.target.value;
                      const matching = qtyModalProduct.variants?.find(v => v.size === newSize && v.color === qtyModalProduct.color) || qtyModalProduct.variants?.find(v => v.size === newSize);
                      setQtyModalProduct({
                        ...qtyModalProduct,
                        ...(matching || {}),
                        size: newSize,
                        variants: qtyModalProduct.variants
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">Default Size</option>
                    {uniqueSizes.map(s => {
                       const variant = qtyModalProduct.variants?.find(v => v.size === s && v.color === qtyModalProduct.color) || qtyModalProduct.variants?.find(v => v.size === s);
                       let emoji = "";
                       if (variant) {
                          if (variant.stock <= 0) emoji = "🔴 ";
                          else if (variant.stock <= (variant.minStockAlert || 5)) emoji = "🟡 ";
                          else emoji = "🟢 ";
                       }
                       return <option key={s} value={s}>{emoji}{s}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Color</label>
                  <select 
                    value={qtyModalProduct.color || ""} 
                    onChange={(e) => {
                      const newColor = e.target.value;
                      const matching = qtyModalProduct.variants?.find(v => v.color === newColor && v.size === qtyModalProduct.size) || qtyModalProduct.variants?.find(v => v.color === newColor);
                      setQtyModalProduct({
                        ...qtyModalProduct,
                        ...(matching || {}),
                        color: newColor,
                        variants: qtyModalProduct.variants
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">Default Color</option>
                    {uniqueColors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Quantity</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setQtyModalValue(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-bold font-mono text-slate-800 min-w-[20px] text-center">
                    {qtyModalValue}
                  </span>
                  <button 
                    onClick={() => setQtyModalValue(prev => prev + 1)}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setQtyModalProduct(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel (Esc)
                </button>
                <button 
                  ref={qtyInputRef}
                  onClick={() => {
                    for (let i = 0; i < qtyModalValue; i++) {
                       handleAddProductToCart(qtyModalProduct);
                    }
                    onAddNotification("Added", `Added ${qtyModalValue}x ${qtyModalProduct.name} (${qtyModalProduct.size || ''} ${qtyModalProduct.color || ''})`, "success");
                    setQtyModalProduct(null);
                    setTimeout(() => { searchInputRef.current?.focus(); }, 100);
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  Add Items (Enter)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

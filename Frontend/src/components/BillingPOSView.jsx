import api from '../api/axios';
import React, { useState, useEffect, useMemo } from "react";
import { generateCode128SvgString } from '../helpers/barcode128.helper';
import { generateReceiptHTMLContent, generateAlterationReceiptHTMLContent, generateInvoiceUPIQrSvg } from '../helpers/printTemplate.helper';
import {
  Search,
  Barcode,
  QrCode,
  Trash2,
  UserPlus,
  Percent,
  CreditCard,
  Smartphone,
  Coins,
  Printer,
  CheckCircle,
  Check,
  X,
  Plus,
  Minus,
  FileText,
  Download,
  AlertCircle,
  User,
  ChevronRight,
  ChevronDown,
  Grid,
  FileSpreadsheet,
  Clock,
  XCircle,
  RefreshCw,
  Scissors,
  Ruler,
  ChevronsLeft,
  RotateCcw,
  ArrowRight,
  Save,
  Upload,
  Copy,
  Info,
  Banknote,
  Wallet,
  Loader2,
  ImageIcon,
  Pencil,
  Tag,
  Phone,
  MessageCircle
} from "lucide-react";

const generateUniqueItemCode = (designNo, size, index = 0) => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const timeHex = Date.now().toString(36).slice(-3).toUpperCase();
  let randStr = '';
  for (let i = 0; i < 3; i++) {
    randStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `UC-${timeHex}${randStr}`;
};

export const getFirmStyle = (firmName = '') => {
  const norm = String(firmName || '').trim().toLowerCase();
  if (!norm || norm === '-' || norm === 'n/a' || norm === '-') {
    return {
      rowClass: 'bg-white hover:bg-slate-50 border-l-4 border-l-slate-300',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-300 font-semibold',
      tagColor: 'slate',
      firmName: firmName || '-'
    };
  }

  // Firm 1: New Fashion Style (Palam) -> Fixed Cyan / Sky Blue Theme
  if (norm.includes('palam')) {
    return {
      rowClass: 'bg-sky-50/80 hover:bg-sky-100/90 border-l-4 border-l-sky-500',
      badgeClass: 'bg-sky-100 text-sky-950 border border-sky-400 font-extrabold',
      tagColor: 'sky',
      firmName: firmName || 'New Fashion Style (Palam)'
    };
  }

  // Firm 2: New Fashion Style (Main) -> Fixed Amber / Gold Theme
  if (norm.includes('new fashion') || norm.includes('main') || norm.includes('nfs')) {
    return {
      rowClass: 'bg-amber-50/80 hover:bg-amber-100/90 border-l-4 border-l-amber-500',
      badgeClass: 'bg-amber-100 text-amber-950 border border-amber-400 font-extrabold',
      tagColor: 'amber',
      firmName: firmName || 'New Fashion Style'
    };
  }

  // Other Registered Firms -> Fixed Emerald / Green Theme
  return {
    rowClass: 'bg-emerald-50/70 hover:bg-emerald-100/80 border-l-4 border-l-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-extrabold',
    tagColor: 'emerald',
    firmName: firmName
  };
};

export const BillingPOSView = ({
  activeModule,
  posInitialMode,
  currentUser,
  products = [],
  customers = [],
  employees = [],
  invoices = [],
  isLoadingInvoices = false,
  isLoadingProducts = false,
  onAddInvoice,
  onAddCustomer,
  onUpdateCustomerBalance,
  onAddNotification,
  onRetryWhatsApp,
  quickArticulateItem,
  clearQuickArticulateItem,
  onAlterationIssued,
}) => {
  // Cart state
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("pos_saved_cart");
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return [];
  });

  // GST & SGST Configurations
  const [cgstRate, setCgstRate] = useState(0);
  const [sgstRate, setSgstRate] = useState(0);

  const fetchTaxConfig = async () => {
    try {
      setCgstRate(0);
      setSgstRate(0);
    } catch (err) {
      console.error("Failed to load tax configs in BillingPOS:", err);
    }
  };

  const [discountRules, setDiscountRules] = useState([]);
  const fetchActiveRules = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/discounts/rules`);
      const json = res.data;
      if (json.success) {
        setDiscountRules(json.data.filter(r => r.status === "Active"));
      }
    } catch (err) {
      console.error("Failed to load discount rules:", err);
    }
  };

  React.useEffect(() => {
    fetchTaxConfig();
    fetchActiveRules();
  }, []);


  // Product Configuration Modal state
  const [configModalProduct, setConfigModalProduct] = useState(null);
  const [configQty, setConfigQty] = useState(1);
  const [configSize, setConfigSize] = useState("");
  const [configColor, setConfigColor] = useState("");
  const [configSalesperson, setConfigSalesperson] = useState(null);
  const [configWorker, setConfigWorker] = useState(null);
  const [configError, setConfigError] = useState("");

  // Filtered employees for assignment
  const salespersonList = React.useMemo(() => {
    const filtered = (employees || []).filter(e => {
      if (e.isActive === false) return false;
      const des = (e.designation || "").toLowerCase();
      const r = (e.role || "").toLowerCase();
      const name = (e.name || "").toLowerCase();

      // Exclude cashiers & tailors (e.g. Aman, Mahesh if cashier/tailor) & Dhruv
      if (des.includes("cashier") || r.includes("cashier") || name === "aman" || name === "mahesh") return false;
      if (des.includes("tailor") || r.includes("tailor")) return false;
      if (name.includes("dhruv")) return false;

      return des.includes("sales") || r.includes("sales") || des.includes("executive") || r.includes("executive") || des.includes("manager") || r.includes("manager") || des.includes("admin") || r.includes("admin");
    });

    if (filtered.length > 0) return filtered;
    return (employees || []).filter(e => {
      const r = (e.role || "").toLowerCase();
      const des = (e.designation || "").toLowerCase();
      const n = (e.name || "").toLowerCase();
      return e.isActive !== false && !r.includes("cashier") && !des.includes("cashier") && !r.includes("tailor") && !des.includes("tailor") && n !== "aman" && n !== "mahesh" && !n.includes("dhruv");
    });
  }, [employees]);

  const displayedSalespersonList = React.useMemo(() => {
    const role = String(currentUser?.role || "").toLowerCase();
    const name = String(currentUser?.name || "").toLowerCase();
    const isUserAdmin = ["admin", "superadmin", "owner", "businessadmin"].includes(role) || name.includes("dhruv");

    if (isUserAdmin) return salespersonList;

    const currentUserName = String(currentUser?.name || "").toLowerCase().trim();
    const self = salespersonList.find(emp =>
      String(emp.name || "").toLowerCase().trim() === currentUserName ||
      String(emp._id || emp.id) === String(currentUser?._id || currentUser?.id)
    );

    if (self) return [self];

    return [
      {
        id: currentUser?._id || currentUser?.id || "curr-user",
        _id: currentUser?._id || currentUser?.id || "curr-user",
        name: currentUser?.name || "Self",
        isActive: true,
        role: currentUser?.role || "Staff"
      }
    ];
  }, [salespersonList, currentUser]);

  const workerList = React.useMemo(() => {
    const filtered = (employees || []).filter(e => {
      if (e.isActive === false) return false;
      const des = (e.designation || "").toLowerCase();
      const r = (e.role || "").toLowerCase();
      const name = (e.name || "").toLowerCase();

      // Exclude cashiers & salespersons (e.g. Aman, Mahesh if cashier)
      if (des.includes("cashier") || r.includes("cashier") || name === "mahesh") return false;
      if (des.includes("sales") || r.includes("sales")) return false;

      return des.includes("worker") || r.includes("worker") || des.includes("tailor") || r.includes("tailor") || des.includes("stitching") || r.includes("stitching");
    });

    if (filtered.length > 0) return filtered;
    return (employees || []).filter(e => {
      const r = (e.role || "").toLowerCase();
      const des = (e.designation || "").toLowerCase();
      const n = (e.name || "").toLowerCase();
      return e.isActive !== false && !r.includes("cashier") && !des.includes("cashier") && n !== "mahesh";
    });
  }, [employees]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    return localStorage.getItem("pos_saved_customer_id") || "";
  });
  const [customerForm, setCustomerForm] = useState(() => {
    try {
      const saved = localStorage.getItem("pos_saved_customer_form");
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return { phone: '', name: '', customerId: '', gstin: '', lf: '2588' };
  });

  // Persist POS state to localStorage
  React.useEffect(() => {
    localStorage.setItem("pos_saved_cart", JSON.stringify(cart));
    localStorage.setItem("pos_saved_customer_id", selectedCustomerId);
    localStorage.setItem("pos_saved_customer_form", JSON.stringify(customerForm));
  }, [cart, selectedCustomerId, customerForm]);

  const handleCustomerPhoneChange = (e) => {
    const val = e.target.value;
    const match = customers.find(c => (c.phone && c.phone === val) || (c.mobile && c.mobile === val));
    if (match) {
      const custId = match.customerId || (match.phone ? `CUST-${match.phone.slice(-4)}` : `CUST-${(match._id || match.id || '').toString().slice(-4).toUpperCase()}`);
      setCustomerForm({
        phone: val,
        name: match.name || '',
        customerId: custId,
        gstin: match.gstin || match.gstNo || '',
        lf: '2588'
      });
      setSelectedCustomerId(match.id || match._id);
    } else {
      const autoId = val.length >= 10 ? `CUST-${val.slice(-4)}` : (val.length > 0 ? `CUST-AUTO` : '');
      setCustomerForm(prev => ({ ...prev, phone: val, customerId: autoId }));
      setSelectedCustomerId("");
    }
  };

  const handleCustomerSave = async () => {
    if (!customerForm.phone) {
      if (onAddNotification) onAddNotification("Error", "Mobile number required", "danger");
      return;
    }
    if (!selectedCustomerId && onAddCustomer) {
      try {
        const autoCustId = customerForm.customerId && customerForm.customerId !== 'CUST-AUTO'
          ? customerForm.customerId
          : `CUST-${customerForm.phone.slice(-4)}`;
        const newCust = await onAddCustomer({
          name: customerForm.name || 'Walk-in Customer',
          phone: customerForm.phone,
          gstin: customerForm.gstin,
          customerId: autoCustId
        });
        if (newCust && (newCust.id || newCust._id)) {
          setSelectedCustomerId(newCust.id || newCust._id);
          const resolvedCustId = newCust.customerId || autoCustId;
          setCustomerForm(prev => ({ ...prev, customerId: resolvedCustId }));
          if (onAddNotification) onAddNotification("Success", `Customer Created (ID: ${resolvedCustId})`, "success");
        }
      } catch (err) {
        console.error(err);
      }
    } else if (selectedCustomerId) {
      try {
        const res = await api.put(`/customers/${selectedCustomerId}`, {
          name: customerForm.name,
          phone: customerForm.phone,
          gstin: customerForm.gstin
        });
        if (res.data && res.data.data) {
          if (onAddNotification) onAddNotification("Success", "Customer Info Updated", "success");
        }
      } catch (err) {
        console.error("Failed to update existing customer:", err);
      }
    }
  };
  const [selectedLoyaltyRuleId, setSelectedLoyaltyRuleId] = useState("");
  const [showHoldBillModal, setShowHoldBillModal] = useState(false);
  const [cashierId, setCashierId] = useState("e-2"); // default cashier
  const [salespersonId, setSalespersonId] = useState("");
  const [rightColumnTab, setRightColumnTab] = useState("catalog");
  const [showAllCatalogItems, setShowAllCatalogItems] = useState(false);

  // Optional GST Configuration States
  const [isGstApplied, setIsGstApplied] = useState(false);
  const [gstRateInput, setGstRateInput] = useState("0");
  const [cgstRateInput, setCgstRateInput] = useState("0");
  const [sgstRateInput, setSgstRateInput] = useState("0");
  const [igstRateInput, setIgstRateInput] = useState("0");
  const [gstTaxType, setGstTaxType] = useState("INTRA");
  const GST_SLAB_OPTIONS = [0, 5, 12, 18, 28];

  const setCartItemGstRate = (index, value) => {
    const gstPercent = value === '' ? undefined : Math.max(0, Number(value) || 0);
    setCart((previousCart) => previousCart.map((item, itemIndex) => (
      itemIndex === index ? { ...item, gstPercent } : item
    )));
    if (gstPercent > 0) setIsGstApplied(true);
  };

  const handleGstRateChange = (val) => {
    setGstRateInput(val);
    const num = Number(val) || 0;
    setIsGstApplied(num > 0);
    if (gstTaxType === "INTER") {
      setIgstRateInput(String(num));
      setCgstRateInput("0");
      setSgstRateInput("0");
    } else {
      const half = num / 2;
      setCgstRateInput(String(half));
      setSgstRateInput(String(half));
      setIgstRateInput("0");
    }
  };

  const handleCgstRateChange = (val) => {
    setCgstRateInput(val);
    const cNum = Number(val) || 0;
    const sNum = Number(sgstRateInput) || 0;
    setGstRateInput(String(cNum + sNum));
    setIsGstApplied(cNum + sNum > 0);
    setIgstRateInput("0");
    setGstTaxType("INTRA");
  };

  const handleSgstRateChange = (val) => {
    setSgstRateInput(val);
    const sNum = Number(val) || 0;
    const cNum = Number(cgstRateInput) || 0;
    setGstRateInput(String(cNum + sNum));
    setIsGstApplied(cNum + sNum > 0);
    setIgstRateInput("0");
    setGstTaxType("INTRA");
  };

  const handleIgstRateChange = (val) => {
    setIgstRateInput(val);
    const iNum = Number(val) || 0;
    setGstRateInput(String(iNum));
    setIsGstApplied(iNum > 0);
    setCgstRateInput("0");
    setSgstRateInput("0");
    setGstTaxType("INTER");
  };

  const handleApplyGst = () => {
    const gRate = Number(gstRateInput) || 0;
    const cRate = Number(cgstRateInput) || 0;
    const sRate = Number(sgstRateInput) || 0;
    const iRate = Number(igstRateInput) || 0;

    if (gRate < 0) {
      if (onAddNotification) onAddNotification("Validation Error", "GST Rate cannot be negative", "warning");
      return;
    }

    if (iRate > 0) {
      if (Math.abs(iRate - gRate) > 0.01) {
        if (onAddNotification) onAddNotification("Validation Error", `IGST (${iRate}%) must equal GST % (${gRate}%)`, "warning");
        return;
      }
    } else {
      if (Math.abs((cRate + sRate) - gRate) > 0.01) {
        if (onAddNotification) onAddNotification("Validation Error", `CGST (${cRate}%) + SGST (${sRate}%) must equal GST % (${gRate}%)`, "warning");
        return;
      }
    }

    setIsGstApplied(true);
    if (onAddNotification) onAddNotification("GST Applied", `GST (${gRate}%) applied to bill.`, "success");
  };

  const handleRemoveGst = () => {
    setIsGstApplied(false);
    if (onAddNotification) onAddNotification("GST Removed", "GST tax removed from bill.", "info");
  };

  useEffect(() => {
    if (activeModule === "billing") {
      const pendingItem = localStorage.getItem("pending_pos_cart_item");
      if (pendingItem) {
        try {
          const p = JSON.parse(pendingItem);
          localStorage.removeItem("pending_pos_cart_item");
          const sPrice = Number(p.sellingPrice) || Number(p.price) || Number(p.mrp) || Number(p.basePrice) || 0;
          setCart(prev => [
            ...prev,
            {
              productId: p._id || p.id,
              name: p.itemName || p.name || 'Item',
              itemName: p.itemName || p.name || 'Item',
              barcode: p.barcode || (p.pieces && p.pieces[0]?.barcode) || '',
              subItem: p.subItem || (typeof p.category === 'string' ? p.category : p.categoryId?.name) || '',
              firmName: p.firmName || p.company || (p.pieces && p.pieces[0]?.firmId?.name) || '',
              company: p.company || p.firmName || (p.pieces && p.pieces[0]?.firmId?.name) || '',
              designNo: p.designNo || p.sku || '',
              itemCode: p.itemCode || p.productCode || p.sku || '',
              ipn: p.ipn || p.pieces?.[0]?.ipn || '',
              sku: p.sku || p.designNo || '',
              size: p.size || 'M',
              color: p.primaryColor || p.color || 'Standard',
              primaryColor: p.primaryColor || p.color || 'Standard',
              secondaryColor: p.secondaryColor || '',
              hsn: p.hsn || p.hsnCode || '',
              mrp: Number(p.mrp) || Number(p.defaultMRP) || sPrice,
              price: sPrice,
              sellingPrice: sPrice,
              salespersonId: "",
              salespersonName: "",
              workerId: "",
              workerName: "",
              quantity: 1,
              discount: 0,
              gstPercent: 0,
              totalPrice: sPrice,
              uniqueCode: generateUniqueItemCode(p.designNo || p.itemName || 'ITM', p.size || 'FS', 0)
            }
          ]);
          if (onAddNotification) {
            onAddNotification("POS Cart", `${p.name} added directly to cart.`, "success");
          }
        } catch (e) {
          console.error("Failed to parse pending cart item", e);
        }
      }
    }
  }, [activeModule]);

  // Customer selection is optional — defaults to Walk-in Customer if unselected
  const [staffList, setStaffList] = useState([]);

  // Fetch staff (salespersons)
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get(`/staff`);
        const data = res.data;
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
  const [itemNameInput, setItemNameInput] = useState("");
  const [itemSearchInputText, setItemSearchInputText] = useState("");
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [itemSearchHighlightedIndex, setItemSearchHighlightedIndex] = useState(0);
  const [itemCodeSearchInput, setItemCodeSearchInput] = useState("");
  const [isItemCodeDropdownOpen, setIsItemCodeDropdownOpen] = useState(false);
  const [itemCodeHighlightedIndex, setItemCodeHighlightedIndex] = useState(0);
  const [designNoSearchInput, setDesignNoSearchInput] = useState("");
  const [isDesignNoDropdownOpen, setIsDesignNoDropdownOpen] = useState(false);
  const [designNoHighlightedIndex, setDesignNoHighlightedIndex] = useState(0);
  const [lastSearchedQuery, setLastSearchedQuery] = useState(null);
  const [isItemSearchModalOpen, setIsItemSearchModalOpen] = useState(false);
  const [itemSearchResults, setItemSearchResults] = useState([]);
  const [selectedSearchItem, setSelectedSearchItem] = useState(null);
  const [infoModalItem, setInfoModalItem] = useState(null);
  const [showSearchItemDetailsPanel, setShowSearchItemDetailsPanel] = useState(false);
  const [alterationPromptItem, setAlterationPromptItem] = useState(null);
  const [showBillPreviewInvoice, setShowBillPreviewInvoice] = useState(null);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Alteration Panel Keyboard Focus States
  const [isAlterationModeActive, setIsAlterationModeActive] = useState(false);
  const [focusedAlterationIndex, setFocusedAlterationIndex] = useState(0);

  // Refs for dropdown container outside-click detection
  const designNoContainerRef = React.useRef(null);
  const itemSearchContainerRef = React.useRef(null);
  const itemCodeContainerRef = React.useRef(null);

  const [designNoDropdownCoords, setDesignNoDropdownCoords] = useState({ top: 0, left: 0 });
  const [itemSearchDropdownCoords, setItemSearchDropdownCoords] = useState({ top: 0, left: 0 });

  // Update Design No dropdown fixed coordinates on open/scroll/resize
  useEffect(() => {
    if (isDesignNoDropdownOpen && designNoContainerRef.current) {
      const updatePos = () => {
        if (!designNoContainerRef.current) return;
        const rect = designNoContainerRef.current.getBoundingClientRect();
        const screenW = window.innerWidth || document.documentElement.clientWidth;
        const width = 780;
        const left = Math.max(10, Math.min(screenW - width - 10, rect.left - 240));
        setDesignNoDropdownCoords({
          top: rect.bottom + 4,
          left: left
        });
      };
      updatePos();
      window.addEventListener('resize', updatePos);
      window.addEventListener('scroll', updatePos, true);
      return () => {
        window.removeEventListener('resize', updatePos);
        window.removeEventListener('scroll', updatePos, true);
      };
    }
  }, [isDesignNoDropdownOpen, designNoSearchInput]);

  // Update Item Search dropdown fixed coordinates on open/scroll/resize
  useEffect(() => {
    if (isItemDropdownOpen && itemSearchContainerRef.current) {
      const updatePos = () => {
        if (!itemSearchContainerRef.current) return;
        const rect = itemSearchContainerRef.current.getBoundingClientRect();
        const screenW = window.innerWidth || document.documentElement.clientWidth;
        const width = 780;
        const left = Math.max(10, Math.min(screenW - width - 10, rect.left));
        setItemSearchDropdownCoords({
          top: rect.bottom + 4,
          left: left
        });
      };
      updatePos();
      window.addEventListener('resize', updatePos);
      window.addEventListener('scroll', updatePos, true);
      return () => {
        window.removeEventListener('resize', updatePos);
        window.removeEventListener('scroll', updatePos, true);
      };
    }
  }, [isItemDropdownOpen, itemSearchInputText]);

  // Global Outside Click listener to close any open search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      const designDrop = document.getElementById('design-no-fixed-dropdown');
      const itemDrop = document.getElementById('item-search-fixed-dropdown');

      if (
        designNoContainerRef.current &&
        !designNoContainerRef.current.contains(e.target) &&
        (!designDrop || !designDrop.contains(e.target))
      ) {
        setIsDesignNoDropdownOpen(false);
      }
      if (
        itemSearchContainerRef.current &&
        !itemSearchContainerRef.current.contains(e.target) &&
        (!itemDrop || !itemDrop.contains(e.target))
      ) {
        setIsItemDropdownOpen(false);
      }
      if (itemCodeContainerRef.current && !itemCodeContainerRef.current.contains(e.target)) {
        setIsItemCodeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Keydown Shortcut listener (Alt+B -> Barcode, Alt+D -> Design No)
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      // Alt + B -> Focus Barcode Input
      if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        const el = document.getElementById('posBarcodeInput');
        if (el) {
          el.focus();
          el.select();
        }
      }
      // Alt + D -> Focus Design No Input
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        const el = document.getElementById('designNoSearchInput');
        if (el) {
          el.focus();
          el.select();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);



  const handleOpenAlterationForCartItem = (item) => {
    if (!item) return;
    setSelectedAlterationCartItem(item);
    setAltMeasurements(item.alterationRecord?.measurements || {});
    setAltOptions(item.alterationRecord?.alterationDetails || []);
    setAltCustomText(item.alterationRecord?.customAlterationText || "");
    setAltSpecialInstructions(item.alterationRecord?.specialInstructions || "");
    setAltDeliveryDate(item.alterationRecord?.deliveryDate || "");
    setAltDeliveryTime(item.alterationRecord?.deliveryTime || "05:00 PM");
    setAltTrialRequired(item.alterationRecord?.trialRequired !== undefined ? item.alterationRecord.trialRequired : true);
    setAltTrialDate(item.alterationRecord?.trialDate || "");
    setAltPriority(item.alterationRecord?.priority || "Normal");
    setAltSelectedTailor((tailorEmployeesList || []).find(t => t.name === item.alterationRecord?.tailorName) || null);
    setShowAlterationModal(true);
  };

  const filteredItemCodeProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const q = String(itemCodeSearchInput || "").trim().toLowerCase();
    if (!q) return products.slice(0, 40);
    return products.filter(p => {
      const code = String(p.itemCode || p.productCode || p.sku || "").toLowerCase();
      const name = String(p.itemName || p.name || "").toLowerCase();
      const barcode = String(p.barcode || (p.pieces && p.pieces[0]?.barcode) || "").toLowerCase();
      return code.includes(q) || name.includes(q) || barcode.includes(q);
    }).slice(0, 60);
  }, [products, itemCodeSearchInput]);

  const filteredItemSearchProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const q = String(itemSearchInputText || "").trim().toLowerCase();
    if (!q) return products.slice(0, 40);
    return products.filter(p => {
      const code = String(p.itemCode || p.productCode || p.sku || "").toLowerCase();
      const name = String(p.itemName || p.name || "").toLowerCase();
      const design = String(p.designNo || "").toLowerCase();
      const barcode = String(p.barcode || (p.pieces && p.pieces[0]?.barcode) || "").toLowerCase();
      return name.includes(q) || code.includes(q) || design.includes(q) || barcode.includes(q);
    }).slice(0, 60);
  }, [products, itemSearchInputText]);

  const expandProductVariants = (list) => {
    const uniqueVariantsMap = new Map();

    (list || []).forEach(p => {
      const availablePieces = (p.pieces || []).filter(pc => pc.status === 'AVAILABLE' || !pc.status);

      if (availablePieces.length > 0) {
        availablePieces.forEach(pc => {
          const size = (pc.size || p.size || 'FREE').trim();
          const color = (pc.primaryColor || pc.color || p.primaryColor || p.color || '-').trim();
          const mrp = Number(pc.mrp || p.mrp || p.defaultMRP || p.sellingPrice || 0);
          const price = Number(pc.mrp || p.mrp || p.defaultMRP || pc.sellingPrice || p.sellingPrice || 0);
          const name = p.itemName || p.name || 'Unnamed Item';
          const barcode = (pc.barcode || pc.uniqueCode || p.barcode || p.uniqueCode || '').trim();

          // Differentiate each available piece by its unique barcode, size, color, price and product
          const variantKey = `${p._id || p.id || p.itemCode}_${barcode}_${size.toLowerCase()}_${color.toLowerCase()}_${price}`;

          if (!uniqueVariantsMap.has(variantKey)) {
            uniqueVariantsMap.set(variantKey, {
              ...p,
              _id: p._id || p.id,
              id: p._id || p.id,
              pieceId: pc._id || pc.id,
              name: name,
              itemName: name,
              barcode: barcode,
              uniqueCode: pc.uniqueCode || pc.barcode || p.uniqueCode || '',
              firmName: pc.firmId?.name || p.firmName || p.company || '',
              company: pc.firmId?.name || p.company || p.firmName || '',
              size: size,
              color: color,
              primaryColor: color,
              secondaryColor: pc.secondaryColor || p.secondaryColor || '',
              mrp: mrp,
              price: price,
              sellingPrice: price,
              availableStock: 1,
              stock: 1,
              pieces: [pc]
            });
          }
        });
      } else {
        // Product without piece records
        const size = (p.size || 'FREE').trim();
        const color = (p.primaryColor || p.color || '-').trim();
        const price = Number(p.sellingPrice ?? p.mrp ?? p.defaultMRP ?? 0);
        const barcode = (p.barcode || p.uniqueCode || '').trim();
        const variantKey = `${p._id || p.id || p.itemCode}_${barcode}_${size.toLowerCase()}_${color.toLowerCase()}_${price}`;

        if (!uniqueVariantsMap.has(variantKey)) {
          uniqueVariantsMap.set(variantKey, {
            ...p,
            firmName: p.firmName || p.company || '',
            company: p.company || p.firmName || ''
          });
        }
      }
    });

    return Array.from(uniqueVariantsMap.values());
  };

  const filteredDesignNoProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const q = String(designNoSearchInput || "").trim().toLowerCase();
    if (!q) return [];

    // 1. Exact matches strictly on designNo / sku
    const exactDesign = products.filter(p => {
      const design = String(p.designNo || p.sku || p.design_no || p.designNumber || "").trim().toLowerCase();
      return design === q;
    });
    if (exactDesign.length > 0) return expandProductVariants(exactDesign);

    // 2. Strict prefix/contains matches ONLY on designNo / sku
    const partials = products.filter(p => {
      const design = String(p.designNo || p.sku || p.design_no || p.designNumber || "").trim().toLowerCase();
      return design.length > 0 && (design.startsWith(q) || design.includes(q));
    });
    return expandProductVariants(partials).slice(0, 60);
  }, [products, designNoSearchInput]);


  useEffect(() => {
    if (isItemSearchModalOpen && itemSearchResults.length > 0 && !selectedSearchItem) {
      setSelectedSearchItem(itemSearchResults[0]);
    }
  }, [isItemSearchModalOpen, itemSearchResults, selectedSearchItem]);
  const [productSearch, setProductSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [manualDiscountIds, setManualDiscountIds] = useState([]);
  const [rejectedAutoDiscountIds, setRejectedAutoDiscountIds] = useState([]);

  // Payments
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [paymentLoaderMessage, setPaymentLoaderMessage] = useState("Preparing Payment Details... Please wait.");
  const [allocatedFullPaymentMode, setAllocatedFullPaymentMode] = useState(null);
  const [confirmedPartPaymentModes, setConfirmedPartPaymentModes] = useState({});
  const [showAdvancePromptModal, setShowAdvancePromptModal] = useState(false);
  const [showOverpaymentModal, setShowOverpaymentModal] = useState(false);
  const [overpaidModalData, setOverpaidModalData] = useState({
    grandTotal: 0,
    paidTotal: 0,
    excessAmount: 0,
    manualAmount: 0,
    reason: ''
  });
  const [splitCash, setSplitCash] = useState(0);
  const [splitCard, setSplitCard] = useState(0);
  const [splitUPI, setSplitUPI] = useState(0);

  // Active view states
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [billAdjustment, setBillAdjustment] = useState({
    type: 'Amount', // Amount or Percentage
    operation: 'Discount', // Discount or Charge
    value: '',
    amount: 0,
    reason: '',
    isApproved: false
  });
  const [showOwnerApprovalModal, setShowOwnerApprovalModal] = useState(false);
  const [ownerPin, setOwnerPin] = useState("");
  const [activePOSMode, setActivePOSMode] = useState("billing");

  useEffect(() => {
    if (posInitialMode) {
      setActivePOSMode(posInitialMode);
    }
  }, [posInitialMode]);

  // New POS Quick Action Tab States
  const [showTotalsModal, setShowTotalsModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showChallanModal, setShowChallanModal] = useState(false);
  const [showOtherDetailsModal, setShowOtherDetailsModal] = useState(false);
  const [showHoldListModal, setShowHoldListModal] = useState(false);
  const [otherBillDetails, setOtherBillDetails] = useState({
    transporter: '',
    trackingNo: '',
    shippingAddress: ''
  });

  const [selectedInvoiceForReturn, setSelectedInvoiceForReturn] =
    useState(null);
  const [loadedOriginalInvoice, setLoadedOriginalInvoice] = useState(null);
  const [selectedCartRowIndex, setSelectedCartRowIndex] = useState(0);
  const [returnedItemIds, setReturnedItemIds] = useState([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);

  // Returns & Exchange Subsystem States
  const [returnSearchQuery, setReturnSearchQuery] = useState("");
  const [returnActionType, setReturnActionType] = useState("return"); // 'return' | 'exchange'
  const [returnReason, setReturnReason] = useState("");
  const [returnCustomReason, setReturnCustomReason] = useState("");
  const [returnApprovedCheckbox, setReturnApprovedCheckbox] = useState(false);
  const [returnRefundMode, setReturnRefundMode] = useState("DIRECT_REFUND");
  const [returnCustomerName, setReturnCustomerName] = useState("");
  const [returnCustomerPhone, setReturnCustomerPhone] = useState("");
  const [showReturnCustomerModal, setShowReturnCustomerModal] = useState(false);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  const [exchangeReason, setExchangeReason] = useState("");
  const [exchangeCustomReason, setExchangeCustomReason] = useState("");
  const [exchangeOldItemIdx, setExchangeOldItemIdx] = useState(0);
  const [exchangeNewSearchQuery, setExchangeNewSearchQuery] = useState("");
  const [exchangeSelectedNewProduct, setExchangeSelectedNewProduct] = useState(null);
  const [exchangeCart, setExchangeCart] = useState([]);
  const [showReturnExchangeModal, setShowReturnExchangeModal] = useState(false);
  const [showExchangeSlipModal, setShowExchangeSlipModal] = useState(false);
  const [completedExchangeSlip, setCompletedExchangeSlip] = useState(null);
  const [showAlterationDocketModal, setShowAlterationDocketModal] = useState(false);
  const [completedAlterationDocket, setCompletedAlterationDocket] = useState(null);
  const [returnWarning, setReturnWarning] = useState({ show: false, title: "", message: "" });

  // PSS Post-Bill Flow States
  const [showPSSQuestionPromptModal, setShowPSSQuestionPromptModal] = useState(false);
  const [showPSSCustomerDetailsModal, setShowPSSCustomerDetailsModal] = useState(false);
  const [showPSSItemSelectModal, setShowPSSItemSelectModal] = useState(false);
  const [showPSSWaitingModal, setShowPSSWaitingModal] = useState(false); // NEW: Customer Waiting + Salesman step
  const [showPSSServiceSelectModal, setShowPSSServiceSelectModal] = useState(false);
  const [pssCustomerWaitingOption, setPssCustomerWaitingOption] = useState('Will Come Later'); // 'Waiting in Store' | 'Will Come Later' | 'Home Delivery Required'
  const [pssSalesmanName, setPssSalesmanName] = useState(''); // inherited from bill or selected
  const [pssAllowWhatsApp, setPssAllowWhatsApp] = useState(true);
  const [pssInseamBookCode, setPssInseamBookCode] = useState("");
  const [pssAssignmentOption, setPssAssignmentOption] = useState("DIRECT"); // "DIRECT" | "PENDING_QUEUE"
  const [pssInvoice, setPssInvoice] = useState(null);
  const [pssConfigItems, setPssConfigItems] = useState([]);
  const [pssFocusedIndex, setPssFocusedIndex] = useState(0);
  const [pssCustName, setPssCustName] = useState("");
  const [pssCustPhone, setPssCustPhone] = useState("");
  const [pssCustAltPhone, setPssCustAltPhone] = useState("");
  const [pssCustWhatsapp, setPssCustWhatsapp] = useState("");
  const [pssCustNotes, setPssCustNotes] = useState("");
  const [pssSameAsMobileWhatsapp, setPssSameAsMobileWhatsapp] = useState(false);
  const [pssServiceGenderFilter, setPssServiceGenderFilter] = useState('All'); // 'All' | 'Gents' | 'Ladies'
  const [showPssCustNameSuggestions, setShowPssCustNameSuggestions] = useState(false);
  const [showPssCustPhoneSuggestions, setShowPssCustPhoneSuggestions] = useState(false);

  const filteredPssCustomersByName = (customers || []).filter(c => (c.name || '').toLowerCase().includes((pssCustName || '').toLowerCase()) && pssCustName.trim() !== '');
  const filteredPssCustomersByPhone = (customers || []).filter(c => (c.phone || '').includes(pssCustPhone) && pssCustPhone.trim() !== '');

  const handleSelectPssCustomer = (cust) => {
    setPssCustName(cust.name || '');
    setPssCustPhone(cust.phone || '');
    const altP = cust.alternatePhone || cust.secondaryPhone || '';
    const waP = cust.whatsappNumber || cust.phone || '';
    setPssCustAltPhone(altP);
    setPssCustWhatsapp(waP);
    setPssSameAsMobileWhatsapp(Boolean(waP && cust.phone && waP === cust.phone));
    setPssCustNotes(cust.notes || cust.specialInstructions || '');
    setShowPssCustNameSuggestions(false);
    setShowPssCustPhoneSuggestions(false);
    if (cust._id || cust.id) {
      setPssInvoice(prev => ({
        ...prev,
        customerId: cust._id || cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        alternatePhone: altP,
        whatsappNumber: waP,
        specialInstructions: cust.notes || cust.specialInstructions || '',
        notes: cust.notes || ''
      }));
    }
  };
  const [pssGeneralTailor, setPssGeneralTailor] = useState("");
  const [pssGeneralService, setPssGeneralService] = useState("Alteration");
  const [pssGeneralDeliveryDate, setPssGeneralDeliveryDate] = useState("");
  const [pssGeneralTrialRequired, setPssGeneralTrialRequired] = useState(true);
  const [pssGeneralTrialDate, setPssGeneralTrialDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [pssGeneralPriority, setPssGeneralPriority] = useState("NORMAL");
  const [pssGeneralRemarks, setPssGeneralRemarks] = useState("");
  const [isSubmittingPSS, setIsSubmittingPSS] = useState(false);
  const [pssSlipData, setPssSlipData] = useState(null); // for PSS slip modal after save

  // Cash Denomination UI
  const [showCashDenominationModal, setShowCashDenominationModal] = useState(false);
  const [paymentType, setPaymentType] = useState('Full Payment'); // 'Full Payment' | 'Part Payment'
  const [cashDenominations, setCashDenominations] = useState({
    500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: ''
  });
  const [activeDenomination, setActiveDenomination] = useState(500);
  const [partPaymentAmounts, setPartPaymentAmounts] = useState({
    Card: '', UPI: '', Advance: '', Due: '', 'Gift Voucher': '', 'Points Redeem': '', Other: ''
  });
  const [paymentWarning, setPaymentWarning] = useState("");

  // Auto-reset payment states only when the cart is emptied
  useEffect(() => {
    if (cart.length === 0) {
      setIsGstApplied(false);
      setGstRateInput("0");
      setCgstRateInput("0");
      setSgstRateInput("0");
      setIgstRateInput("0");
      setPaymentType('Full Payment');
      setCashDenominations({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: '' });
      setPartPaymentAmounts({
        Card: '', UPI: '', Advance: '', Due: '', 'Gift Voucher': '', 'Points Redeem': '', Other: ''
      });
      setPaymentMethod("Cash");
      setAllocatedFullPaymentMode(null);
      setConfirmedPartPaymentModes({});
    }
  }, [cart]);

  // Local Reactive Invoices State & Bill History Navigation
  const [invoiceList, setInvoiceList] = useState(invoices);
  const setHistoryInvoices = setInvoiceList;
  const [historyViewIndex, setHistoryViewIndex] = useState(-1); // -1 = Active New Bill



  const handleStartNewBill = () => {
    setHistoryViewIndex(-1);
    setCart([]); // This now safely resets payment states via the useEffect
    setSelectedCustomerId("");
    setCustomerSearch("");
    setCouponCode("");
    setManualDiscountIds([]);
    setRejectedAutoDiscountIds([]);
    setSelectedLoyaltyRuleId("");
    if (onAddNotification) onAddNotification("New Bill", "Fresh POS billing session started.", "info");
  };

  // Helper to map PSSM records onto invoice/cart items
  const matchAndTagPSSMOnItems = (itemsList = [], pssmData) => {
    if (!pssmData || !pssmData.items) return itemsList;
    const { pssm, items: pssItems } = pssmData;
    const usedPssIds = new Set();

    return (itemsList || []).map((item, idx) => {
      // 1. Match by inventoryPieceId
      let pssMatch = (pssItems || []).find(pi =>
        !usedPssIds.has(String(pi._id)) &&
        pi.inventoryPieceId && item.inventoryPieceId &&
        String(pi.inventoryPieceId) === String(item.inventoryPieceId)
      );

      // 2. Match by barcode or uniqueCode or sku
      if (!pssMatch) {
        const itemBarcodes = [item.barcode, item.uniqueCode, item.barcodeNo, item.pieceBarcode, item.sku, item.itemCode]
          .filter(Boolean)
          .map(s => String(s).trim().toLowerCase());

        pssMatch = (pssItems || []).find(pi => {
          if (usedPssIds.has(String(pi._id))) return false;
          const piBarcodes = [pi.barcode, pi.uniqueCode, pi.sku].filter(Boolean).map(s => String(s).trim().toLowerCase());
          return itemBarcodes.some(ib => piBarcodes.includes(ib));
        });
      }

      // 3. Match by product/piece name
      if (!pssMatch) {
        pssMatch = (pssItems || []).find(pi => {
          if (usedPssIds.has(String(pi._id))) return false;
          const pName = (pi.productName || pi.pieceName || '').trim().toLowerCase();
          const iName = (item.name || item.itemName || '').trim().toLowerCase();
          return pName && iName && pName === iName;
        });
      }

      // 4. Index-based fallback if lengths match
      if (!pssMatch && pssItems.length === itemsList.length && pssItems[idx] && !usedPssIds.has(String(pssItems[idx]._id))) {
        pssMatch = pssItems[idx];
      }

      if (pssMatch) {
        usedPssIds.add(String(pssMatch._id));
        const serviceName = pssMatch.serviceType ||
          (Array.isArray(pssMatch.alterationDetails) && pssMatch.alterationDetails.length > 0 ? pssMatch.alterationDetails.join(', ') : '') ||
          'Alteration';

        return {
          ...item,
          hasPSSM: true,
          pssmNo: pssm.pssmNo,
          pssmItemId: pssMatch._id,
          pssmItemStatus: pssMatch.status || 'PENDING_ASSIGNMENT',
          pssmServiceType: serviceName,
          pssmTailorName: pssMatch.assignedTo || pssm.tailorName || 'Assigned Tailor',
          pssmBillBarcode: pssm.billBarcode || pssm.billNo || item.barcode,
          pssmAlterationDetails: pssMatch.alterationDetails || [],
          pssmRecord: pssm
        };
      }
      return item;
    });
  };

  const fetchAndEnrichPSSM = async (inv) => {
    if (!inv) return null;
    const barcodeToSearch = inv.billBarcode || inv.invoiceNo || inv.billNo || inv._id || inv.id;
    if (!barcodeToSearch) return null;
    try {
      const res = await api.get(`/pssm/barcode/${encodeURIComponent(barcodeToSearch)}`);
      if (res.data?.success && res.data.data?.pssm) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Could not fetch PSSM for invoice:", err);
    }
    return null;
  };

  // Helper: Load full invoice details into POS Billing Window
  const loadInvoiceIntoPOS = async (invData, preloadedPssm = null, clearInputFn = null) => {
    if (!invData) return null;
    const inv = invData.bill || invData.saleBill || invData;
    const rawItems = invData.items || inv.items || [];
    const cust = inv.customerId || inv.customer || {};

    const custName = inv.customerName || (typeof cust === 'object' ? cust.name : '') || 'Walk-in Customer';
    const custPhone = inv.customerPhone || (typeof cust === 'object' ? cust.phone : '') || '';
    let resolvedCustomerId = (typeof cust === 'object' && cust.customerId) ? cust.customerId : '';
    if (!resolvedCustomerId && custPhone) {
      const found = (customers || []).find(c => c.phone === custPhone || c.mobile === custPhone);
      if (found && found.customerId) resolvedCustomerId = found.customerId;
      else resolvedCustomerId = `CUST-${custPhone.slice(-4)}`;
    }
    if (!resolvedCustomerId && typeof cust === 'object' && (cust._id || cust.id)) {
      resolvedCustomerId = `CUST-${(cust._id || cust.id).toString().slice(-4).toUpperCase()}`;
    }
    if (!resolvedCustomerId && custName && !custName.toLowerCase().includes('walk-in')) {
      resolvedCustomerId = 'CUST-0001';
    }
    const custGstin = (typeof cust === 'object' ? (cust.gstin || cust.gstNo) : '') || '';

    // 1. Populate Customer / CRM Strip
    setCustomerForm({
      phone: custPhone,
      name: custName,
      customerId: resolvedCustomerId,
      gstin: custGstin,
      lf: '2588'
    });
    setSelectedCustomerId((typeof cust === 'object' && (cust._id || cust.id)) ? (cust._id || cust.id) : '');
    setCustomerSearchQuery(custPhone || custName || '');
    setCustomerSearch(custPhone || custName || '');
    setPaymentMethod(inv.paymentMethod || "Cash");

    // 2. Populate Billing Grid with all original items
    let formattedItems = rawItems.map((item, idx) => {
      const piece = item.inventoryPieceId || item.piece || {};
      let prod = (piece && typeof piece === 'object' && piece.productId) ? piece.productId : (item.productId || item);

      const stateProduct = products?.find(p =>
        (p._id === (prod._id || prod)) ||
        (p.id === (prod.id || prod._id || prod)) ||
        (item.barcode && p.barcode === item.barcode) ||
        (piece && piece.barcode && p.barcode === piece.barcode) ||
        (item.barcode && p.pieces?.some(pp => pp.barcode === item.barcode))
      );

      if (stateProduct) {
        prod = { ...prod, ...stateProduct };
      }
      const sPrice = Number(item.sellingPrice ?? item.price ?? item.mrp ?? prod.sellingPrice ?? 0);
      const mrpVal = Number(item.mrp ?? prod.mrp ?? prod.defaultMRP ?? sPrice);
      const nameVal = item.name || item.itemName || (typeof prod === 'object' ? (prod.itemName || prod.name) : '') || 'Original Item';
      const barcodeVal = item.barcode || (piece && piece.barcode) || (typeof prod === 'object' ? prod.barcode : '') || '';
      const designVal = item.designNo || (typeof prod === 'object' ? (prod.designNo || prod.sku) : '') || '';
      const itemCodeVal = item.itemCode || (typeof prod === 'object' ? (prod.itemCode || prod.productCode) : '') || '';
      const firmVal = item.firmName || (typeof prod === 'object' ? (prod.firmName || prod.company || prod.firmId?.name) : '') || (piece && piece.firmId?.name) || '';
      const sizeVal = item.size || (piece && piece.size) || (typeof prod === 'object' ? prod.size : '') || '';
      const colorVal = item.color || item.primaryColor || (piece && piece.primaryColor) || (typeof prod === 'object' ? (prod.primaryColor || prod.color) : '') || '';
      const uniqueCodeVal = item.uniqueCode || (piece && piece.uniqueCode) || (piece && piece.barcode) || barcodeVal || '';

      return {
        cartItemId: `cart-item-orig-${Date.now()}-${idx}`,
        productId: (typeof prod === 'object' ? (prod._id || prod.id) : null) || item.productId,
        id: item._id || item.id || undefined,
        inventoryPieceId: item.inventoryPieceId || (piece && piece._id) || (piece && piece.id) || undefined,
        name: nameVal,
        itemName: nameVal,
        barcode: barcodeVal,
        barcodeNo: barcodeVal,
        subItem: item.subItem || (typeof prod === 'object' ? (prod.subItem || prod.category) : '') || '',
        firmName: firmVal,
        company: firmVal,
        designNo: designVal,
        itemCode: itemCodeVal,
        ipn: item.ipn || (piece && piece.ipn) || '',
        sku: designVal || itemCodeVal,
        size: sizeVal,
        color: colorVal,
        primaryColor: colorVal,
        secondaryColor: item.secondaryColor || (piece && piece.secondaryColor) || '',
        hsn: item.hsn || (typeof prod === 'object' ? (prod.hsn || prod.hsnCode) : '') || '',
        mrp: mrpVal,
        price: sPrice,
        sellingPrice: sPrice,
        discount: Number(item.discountAmount || item.discount || 0),
        gstPercent: item.gstPercent !== undefined && item.gstPercent !== null
          ? Number(item.gstPercent)
          : (typeof prod === 'object' && prod.gstPercent !== undefined ? Number(prod.gstPercent) : undefined),
        totalPrice: Number(item.finalPrice || item.totalPrice || (sPrice * (item.quantity || 1))),
        quantity: Number(item.quantity || 1),
        uniqueCode: uniqueCodeVal,
        isReturned: Boolean(item.isReturned),
        returnedAt: item.returnedAt || null,
        returnReason: item.returnReason || '',
        isExchanged: Boolean(item.isExchanged),
        exchangedFor: item.exchangedFor || '',
        exchangeReason: item.exchangeReason || '',
        hasAlteration: Boolean(item.hasAlteration),
        alterationRecord: item.alterationRecord || null
      };
    });

    // 3. Check and Enrich with PSSM details
    let pssmData = preloadedPssm || invData.pssmData || inv.pssmData;
    if (!pssmData) {
      const barcodeToSearch = inv.billBarcode || inv.invoiceNo || inv.billNo || inv._id || inv.id;
      if (barcodeToSearch) {
        try {
          const pssRes = await api.get(`/pssm/barcode/${encodeURIComponent(barcodeToSearch)}`);
          if (pssRes.data?.success && pssRes.data.data?.pssm) {
            pssmData = pssRes.data.data;
          }
        } catch (e) {
          console.warn("Could not load PSSM in loadInvoiceIntoPOS:", e);
        }
      }
    }

    if (pssmData) {
      formattedItems = matchAndTagPSSMOnItems(formattedItems, pssmData);
    }

    setCart(formattedItems);
    const unifiedInv = {
      ...inv,
      items: formattedItems,
      customerName: custName,
      customerPhone: custPhone,
      invoiceNo: inv.billNo || inv.invoiceNo,
      billNo: inv.billNo || inv.invoiceNo,
      billBarcode: inv.billBarcode || inv.billNo || inv.invoiceNo,
      hasPSSM: Boolean(pssmData),
      pssmRecord: pssmData?.pssm || inv.pssmRecord || null,
      pssmData: pssmData || null
    };
    setLoadedOriginalInvoice(unifiedInv);
    if (typeof clearInputFn === 'function') clearInputFn("");
    if (onAddNotification) {
      onAddNotification(
        "Original Bill Loaded",
        `Loaded Invoice ${inv.billNo || inv.invoiceNo} (${formattedItems.length} item${formattedItems.length === 1 ? '' : 's'})${pssmData ? ' • PSSM Linked' : ''}`,
        "success"
      );
    }
    return unifiedInv;
  };

  const handleLoadPreviousBill = async () => {
    const list = invoiceList || invoices || [];
    if (!list.length) {
      if (onAddNotification) onAddNotification("Invoice History", "No previous invoices recorded.", "warning");
      return;
    }
    let targetIdx = historyViewIndex;
    if (targetIdx === -1) {
      targetIdx = list.length - 1;
    } else {
      targetIdx = Math.max(0, targetIdx - 1);
    }

    setHistoryViewIndex(targetIdx);
    const targetInv = list[targetIdx];
    if (targetInv) {
      await loadInvoiceIntoPOS(targetInv);
      setShowBillPreviewInvoice(targetInv);
      if (onAddNotification) onAddNotification("Previous Bill Loaded", `Viewing Bill: ${targetInv.invoiceNo || targetInv.billNo} (${targetIdx + 1}/${list.length})`, "success");
    }
  };

  const handleLoadNextBill = async () => {
    const list = invoiceList || invoices || [];
    if (!list.length || historyViewIndex === -1) {
      if (onAddNotification) onAddNotification("Invoice History", "Already on active new bill.", "info");
      return;
    }
    if (historyViewIndex >= list.length - 1) {
      handleStartNewBill();
      return;
    }
    const targetIdx = historyViewIndex + 1;
    setHistoryViewIndex(targetIdx);
    const targetInv = list[targetIdx];
    if (targetInv) {
      await loadInvoiceIntoPOS(targetInv);
      setShowBillPreviewInvoice(targetInv);
      if (onAddNotification) onAddNotification("Next Bill Loaded", `Viewing Bill: ${targetInv.invoiceNo || targetInv.billNo} (${targetIdx + 1}/${list.length})`, "success");
    }
  };

  const handleModifyBill = async () => {
    if (historyViewIndex >= 0) {
      const list = invoiceList || invoices || [];
      const targetInv = list[historyViewIndex];
      if (targetInv) {
        const updatedInv = {
          ...targetInv,
          items: [...cart],
          subTotal,
          discountTotal,
          gstTotal,
          grandTotal,
          paymentMethod
        };
        try {
          const token = localStorage.getItem("token");
          const invId = targetInv._id || targetInv.id;
          await api.put(`/invoices/${invId}`, updatedInv);
        } catch (e) {
          console.error("Failed to update invoice:", e);
        }
        setInvoiceList(prev => prev.map((inv, idx) => idx === historyViewIndex ? updatedInv : inv));
        if (onAddNotification) onAddNotification("Bill Modified", `Invoice ${targetInv.invoiceNo} successfully updated!`, "success");
      }
    } else {
      if (onAddNotification) onAddNotification("Modify Bill", "Bill modified in cart. Click Generate Invoice to issue.", "info");
    }
  };

  useEffect(() => {
    if (Array.isArray(invoices)) {
      setInvoiceList(invoices);
    }
  }, [invoices]);

  // Helper to unroll multi-quantity invoice items into distinct individual unit lines
  const unrollInvoiceItems = (items = []) => {
    const result = [];
    (items || []).forEach((item, origIdx) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = item.price || (item.totalPrice ? Math.round(item.totalPrice / qty) : 0);
      const baseId = item.productId || item.id || `item-${origIdx}`;

      if (qty <= 1) {
        result.push({
          ...item,
          unitId: item.unitId || `${baseId}-${origIdx}-u1`,
          quantity: 1,
          price: unitPrice,
          totalPrice: unitPrice
        });
      } else {
        for (let i = 1; i <= qty; i++) {
          result.push({
            ...item,
            unitId: `${baseId}-${origIdx}-u${i}`,
            unitIndex: i,
            totalQty: qty,
            quantity: 1,
            price: unitPrice,
            totalPrice: unitPrice,
            name: `${item.name} (Piece #${i} of ${qty})`
          });
        }
      }
    });
    return result;
  };


  // New billing features states
  const [quotations, setQuotations] = useState([]);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteCustName, setQuoteCustName] = useState("");
  const [quoteProdId, setQuoteProdId] = useState("");
  const [quoteQty, setQuoteQty] = useState(1);

  const [salesOrders, setSalesOrders] = useState([]);
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
  const [newCustGst, setNewCustGst] = useState("");
  const [newCustSaving, setNewCustSaving] = useState(false);

  // Customer History Modal State
  const [showCustomerHistoryModal, setShowCustomerHistoryModal] = useState(false);
  const [customerHistoryData, setCustomerHistoryData] = useState(null);
  const [loadingCustomerHistory, setLoadingCustomerHistory] = useState(false);

  const fetchCustomerHistory = async (id) => {
    if (!id) return;
    setLoadingCustomerHistory(true);
    try {
      const res = await api.get(`/customers/${id}/history`);
      if (res.data && res.data.success) {
        setCustomerHistoryData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch customer history", err);
    } finally {
      setLoadingCustomerHistory(false);
    }
  };

  const handleOpenCustomerHistory = () => {
    if (!selectedCustomerId) return;
    setShowCustomerHistoryModal(true);
    fetchCustomerHistory(selectedCustomerId);
  };

  const [showDueCustomerModal, setShowDueCustomerModal] = useState(false);
  const [dueCustName, setDueCustName] = useState("");
  const [dueCustPhone, setDueCustPhone] = useState("");

  // Edit Payment Method modal state
  const [editPayMethodModal, setEditPayMethodModal] = useState(null); // { inv } | null
  const [editPayMethodValue, setEditPayMethodValue] = useState("");
  const [isSavingPayMethod, setIsSavingPayMethod] = useState(false);
  const [editPartSplits, setEditPartSplits] = useState({}); // { Cash: '200', UPI: '300', ... }

  const PART_PAY_METHODS = ["Cash", "Card", "UPI", "Cheque", "Net Banking", "Due", "Gift Voucher", "Other"];

  // WhatsApp dispatch state (for receipt modal)
  // 'idle' | 'sending' | 'success' | 'failed' | 'no_number'
  const [whatsappDispatchState, setWhatsappDispatchState] = useState('idle');
  const [whatsappDispatchId, setWhatsappDispatchId] = useState(null);

  // Selected Category filter
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // --- ALTERATION MODULE STATES ---
  const [showAlterationModal, setShowAlterationModal] = useState(false);
  const [selectedAlterationCartItem, setSelectedAlterationCartItem] = useState(null);
  const [altMeasurements, setAltMeasurements] = useState({});
  const [altOptions, setAltOptions] = useState([]);
  const [altCustomText, setAltCustomText] = useState("");
  const [altDeliveryDate, setAltDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [altDeliveryTime, setAltDeliveryTime] = useState("05:00 PM");
  const [altTrialRequired, setAltTrialRequired] = useState(true);
  const [altTrialDate, setAltTrialDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [altPriority, setAltPriority] = useState("Normal");
  const [altSelectedTailor, setAltSelectedTailor] = useState(null);
  const [altSpecialInstructions, setAltSpecialInstructions] = useState("");

  const tailorEmployeesList = React.useMemo(() => {
    const list = (employees || []).filter(
      (e) => e.isActive !== false && (
        (e.designation || "").toLowerCase().includes("tailor") ||
        (e.role || "").toLowerCase().includes("tailor") ||
        (e.designation || "").toLowerCase().includes("darzi") ||
        (e.role || "").toLowerCase().includes("darzi") ||
        (e.designation || "").toLowerCase().includes("karigar") ||
        (e.role || "").toLowerCase().includes("karigar") ||
        (e.designation || "").toLowerCase().includes("master") ||
        (e.role || "").toLowerCase().includes("master")
      )
    );
    return list.length > 0 ? list : (employees || []).slice(0, 5);
  }, [employees]);

  const getMeasurementFieldsForGarment = (productName = "", category = "") => {
    const text = `${productName} ${category}`.toLowerCase();
    if (text.includes("shirt") || text.includes("kurta") || text.includes("top")) {
      return [
        "Sleeve Length", "Shoulder", "Chest", "Waist", "Collar", "Shirt Length", "Cuff", "Arm Hole", "Front Length", "Back Length"
      ];
    }
    if (text.includes("trouser") || text.includes("pant") || text.includes("denim") || text.includes("jeans") || text.includes("bottom")) {
      return [
        "Waist", "Hip", "Thigh", "Bottom", "Length", "Rise", "Knee"
      ];
    }
    if (text.includes("suit") || text.includes("blazer") || text.includes("jacket") || text.includes("coat")) {
      return [
        "Chest", "Waist", "Shoulder", "Sleeve", "Length", "Neck", "Arm Hole"
      ];
    }
    return [
      "Bust / Chest", "Waist", "Hips", "Length", "Shoulder", "Sleeves", "Armhole"
    ];
  };

  const quickAlterationOptionsList = [
    "Sleeve Shorten",
    "Sleeve Lengthen",
    "Waist Tight",
    "Waist Loose",
    "Length Short",
    "Length Increase",
    "Shoulder Adjustment",
    "Neck Adjustment",
    "Collar Change",
    "Bottom Narrow",
    "Bottom Wide",
    "Zip Replace",
    "Button Replace",
    "Stitch Repair",
    "Custom Alteration"
  ];

  const handleSaveAlteration = async () => {
    if (!selectedAlterationCartItem) {
      if (onAddNotification) onAddNotification("Validation Warning", "Please select a garment from the bill.", "warning");
      return;
    }

    const targetTailor = altSelectedTailor || (Array.isArray(tailorEmployeesList) ? tailorEmployeesList[0] : null) || { id: "t-default", name: "Ajay" };
    const invNo = loadedOriginalInvoice?.invoiceNo || loadedOriginalInvoice?.billNo || `INV-${Date.now().toString().slice(-6)}`;
    const invId = loadedOriginalInvoice?._id || loadedOriginalInvoice?.id || undefined;

    const payload = {
      saleBillId: invId,
      invoiceId: invId || invNo,
      invoiceNumber: invNo,
      customerId: ((activeCustomer.id || activeCustomer._id) === "c-walkin" || activeCustomer.phone === "") ? null : (activeCustomer.id || activeCustomer._id),
      customerName: customerForm.name || activeCustomer.name || "Walk-in Customer",
      customerPhone: customerForm.phone || activeCustomer.phone || "",
      productId: selectedAlterationCartItem.productId || selectedAlterationCartItem.id || "p-gen",
      productName: selectedAlterationCartItem.name || selectedAlterationCartItem.itemName,
      sku: selectedAlterationCartItem.sku || selectedAlterationCartItem.designNo || "SKU-001",
      barcode: selectedAlterationCartItem.barcode || selectedAlterationCartItem.uniqueCode || "BAR-001",
      size: selectedAlterationCartItem.size || "M",
      color: selectedAlterationCartItem.color || "Standard",
      salespersonId: selectedAlterationCartItem.salespersonId || "sp-1",
      salespersonName: selectedAlterationCartItem.salespersonName || "Store Salesperson",
      workerId: selectedAlterationCartItem.workerId || "w-1",
      workerName: selectedAlterationCartItem.workerName || "In-House",
      tailorId: targetTailor.id || targetTailor._id || "t-1",
      tailorName: targetTailor.name,
      measurements: altMeasurements,
      alterationDetails: altOptions,
      customAlterationText: altOptions.includes("Custom Alteration") ? altCustomText : "",
      specialInstructions: altSpecialInstructions,
      deliveryDate: altDeliveryDate,
      deliveryTime: altDeliveryTime,
      trialRequired: altTrialRequired,
      trialDate: altTrialRequired ? altTrialDate : '',
      priority: altPriority,
      status: "Pending",
      createdBy: currentUser ? currentUser.name : "Cashier"
    };

    // Attach alteration record to target item in cart
    setCart(prev => prev.map(item => {
      let isMatch = false;
      if (item.cartItemId && selectedAlterationCartItem.cartItemId) {
        isMatch = item.cartItemId === selectedAlterationCartItem.cartItemId;
      } else {
        isMatch = (item === selectedAlterationCartItem) ||
          (item.id && selectedAlterationCartItem.id && item.id === selectedAlterationCartItem.id) ||
          (item.productId && selectedAlterationCartItem.productId && item.productId === selectedAlterationCartItem.productId && item.size === selectedAlterationCartItem.size && item.color === selectedAlterationCartItem.color) ||
          (item.name === selectedAlterationCartItem.name && item.size === selectedAlterationCartItem.size);
      }

      if (isMatch) {
        return { ...item, hasAlteration: true, alterationRecord: payload };
      }
      return item;
    }));

    if (onAddNotification) {
      onAddNotification(
        "Alteration Configured",
        `Alteration details saved for ${selectedAlterationCartItem.name}. Click 'Complete & Issue Slips' to finish.`,
        "success"
      );
    }

    setSelectedAlterationCartItem(null);
    setAltMeasurements({});
    setAltOptions([]);
    setAltCustomText("");
    setAltSpecialInstructions("");
    setShowAlterationModal(false);
  };

  const handleCompleteAllBillActions = async () => {
    const alteredItems = cart.filter(i => i.hasAlteration && i.alterationRecord);

    if (alteredItems.length === 0) {
      if (onAddNotification) onAddNotification("Notice", "Please configure alteration on at least one item first.", "warning");
      return;
    }

    const invNo = loadedOriginalInvoice?.invoiceNo || loadedOriginalInvoice?.billNo || `INV-${Date.now().toString().slice(-6)}`;
    const invId = loadedOriginalInvoice?._id || loadedOriginalInvoice?.id || undefined;
    const firstRec = alteredItems[0]?.alterationRecord || {};

    const rawItemsPayload = alteredItems.map(item => {
      const rec = item.alterationRecord || {};
      return {
        productId: item.productId || item.id,
        productName: item.name || item.itemName,
        pieceName: item.name || item.itemName,
        sku: item.sku || item.designNo || item.itemCode || "SKU-001",
        barcode: item.barcode || item.uniqueCode || item.itemCode || "BAR-001",
        uniqueCode: item.uniqueCode || item.barcode || "",
        size: item.size || "FS",
        color: item.color || "Standard",
        instructions: Array.isArray(rec.alterationDetails) && rec.alterationDetails.length > 0 ? rec.alterationDetails.join(', ') : (rec.customAlterationText || rec.specialInstructions || 'Standard Fit'),
        alterationDetails: rec.alterationDetails || [],
        measurements: rec.measurements || {},
        charge: Number(rec.charge || 0)
      };
    });

    const unifiedPayload = {
      saleBillId: invId,
      invoiceId: invId || invNo,
      invoiceNumber: invNo,
      customerId: ((activeCustomer.id || activeCustomer._id) === "c-walkin" || activeCustomer.phone === "") ? null : (activeCustomer.id || activeCustomer._id),
      customerName: customerForm.name || activeCustomer.name || "Walk-in Customer",
      customerPhone: customerForm.phone || activeCustomer.phone || "",
      tailorId: firstRec.tailorId || "t-1",
      tailorName: firstRec.tailorName || "Master Tailor",
      deliveryDate: firstRec.deliveryDate,
      deliveryTime: firstRec.deliveryTime,
      trialDate: firstRec.trialDate,
      priority: firstRec.priority || "Normal",
      remarks: firstRec.specialInstructions || firstRec.customAlterationText || "",
      items: rawItemsPayload
    };

    let issuedDocketNo = `ALT-${Date.now().toString(36).toUpperCase()}`;

    try {
      const altRes = await api.post('/alterations', unifiedPayload);
      if (altRes.data?.success && altRes.data.data?.alteration?.alterationNo) {
        issuedDocketNo = altRes.data.data.alteration.alterationNo;
      } else if (altRes.data?.success && altRes.data.data?.alterationNo) {
        issuedDocketNo = altRes.data.data.alterationNo;
      }
    } catch (err) {
      console.error("Failed to post unified alteration order:", err);
    }

    // Build multi-item docket data
    const multiDocketData = {
      docketNo: issuedDocketNo,
      originalInvoiceNo: invNo,
      customerName: customerForm.name || activeCustomer.name || "Walk-in Customer",
      customerPhone: customerForm.phone || activeCustomer.phone || "",
      cashierName: currentUser ? currentUser.name : "Cashier",
      items: alteredItems,
      createdAt: new Date().toISOString()
    };

    setCompletedAlterationDocket(multiDocketData);
    setShowAlterationDocketModal(true);

    // Sync parent app state for live Invoice History
    if (typeof onAlterationIssued === 'function') {
      onAlterationIssued(invNo, alteredItems);
    }

    // Finish process & clear cart for next transaction
    setLoadedOriginalInvoice(null);
    setCart([]);
    setCustomerForm({ phone: '', name: '', customerId: '', gstin: '', lf: '2588' });
    setSelectedCustomerId('');

    if (onAddNotification) {
      onAddNotification(
        "Alteration Slip Issued",
        `Alteration Slip #${issuedDocketNo} issued for ${alteredItems.length} item(s) on Bill ${invNo}. Cart cleared.`,
        "success"
      );
    }
  };

  // ── Post Sales Service (PSS) Keyboard Navigation & SPACEBAR Toggle ──
  useEffect(() => {
    if (!showPSSItemSelectModal) return;

    const handleKeyDown = (e) => {
      const tagName = document.activeElement?.tagName?.toLowerCase();
      const isInputField = tagName === "input" || tagName === "textarea" || tagName === "select";
      if (isInputField) return;

      const isSpace = e.code === "Space" || e.key === " " || e.key === "Spacebar" || e.keyCode === 32;
      const isDown = e.key === "ArrowDown" || e.code === "ArrowDown" || e.keyCode === 40;
      const isUp = e.key === "ArrowUp" || e.code === "ArrowUp" || e.keyCode === 38;

      if (isSpace) {
        e.preventDefault();
        e.stopPropagation();
        setPssConfigItems(prev => prev.map((itm, idx) => {
          if (idx === pssFocusedIndex) {
            return { ...itm, selectedForPSS: !itm.selectedForPSS };
          }
          return itm;
        }));
      } else if (isDown) {
        e.preventDefault();
        e.stopPropagation();
        setPssFocusedIndex(prev => (prev + 1) % (pssConfigItems.length || 1));
      } else if (isUp) {
        e.preventDefault();
        e.stopPropagation();
        setPssFocusedIndex(prev => (prev - 1 + (pssConfigItems.length || 1)) % (pssConfigItems.length || 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [showPSSItemSelectModal, pssFocusedIndex, pssConfigItems.length]);

  const handleYesOnPSSPrompt = () => {
    setShowPSSQuestionPromptModal(false);

    // Verify and populate customer details from current generated bill or active customer
    const cName = (pssInvoice?.customerName || activeCustomer?.name || "").trim();
    const cPhone = (pssInvoice?.customerPhone || activeCustomer?.phone || "").trim();
    const cAltPhone = (pssInvoice?.alternatePhone || activeCustomer?.alternatePhone || "").trim();
    const cWhatsapp = (pssInvoice?.whatsappNumber || activeCustomer?.whatsappNumber || (cPhone.length === 10 ? cPhone : "")).trim();
    const cNotes = (pssInvoice?.specialInstructions || pssInvoice?.remarks || activeCustomer?.notes || "").trim();

    setPssCustName(cName === "Walk-in Customer" ? "" : cName);
    setPssCustPhone(cPhone);
    setPssCustAltPhone(cAltPhone);
    setPssCustWhatsapp(cWhatsapp);
    setPssSameAsMobileWhatsapp(Boolean(cWhatsapp && cPhone && cWhatsapp === cPhone));
    setPssCustNotes(cNotes);

    // Show Customer Details Modal so user can review/enter Name, Mobile, Alternate Number, WhatsApp, & Notes
    setShowPSSCustomerDetailsModal(true);
  };

  const handleSavePSSCustomerDetails = () => {
    if (!pssCustName.trim()) {
      if (onAddNotification) onAddNotification("Customer Info Required", "Please enter customer name for Post Sales Service.", "warning");
      return;
    }
    if (!pssCustPhone.trim() || pssCustPhone.trim().length < 10) {
      if (onAddNotification) onAddNotification("Customer Info Required", "Please enter a valid 10-digit mobile number.", "warning");
      return;
    }

    const updatedInv = {
      ...pssInvoice,
      customerName: pssCustName.trim(),
      customerPhone: pssCustPhone.trim(),
      alternatePhone: pssCustAltPhone.trim(),
      whatsappNumber: pssCustWhatsapp.trim(),
      specialInstructions: pssCustNotes.trim(),
      remarks: pssCustNotes.trim()
    };
    setPssInvoice(updatedInv);
    setShowPSSCustomerDetailsModal(false);
    handleOpenPssItemSelection(updatedInv);
  };

  const handleOpenPssItemSelection = (invoice) => {
    const inv = invoice || pssInvoice;
    if (!inv || !inv.items || inv.items.length === 0) return;

    const defaultTailorName = tailorEmployeesList[0]?.name || "Master Tailor";
    const defaultDeliveryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultTrialDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const itemsConfig = inv.items.map((item, idx) => ({
      _id: item._id || item.inventoryPieceId || item.id,
      inventoryPieceId: item.inventoryPieceId || item._id,
      name: item.name || item.pieceName || item.productName || 'Garment Item',
      productName: item.name || item.pieceName || item.productName || 'Garment Item',
      barcode: item.barcode || item.uniqueCode || item.sku || '',
      uniqueCode: item.uniqueCode || item.barcode || '',
      ...item,
      itemKey: `pss-item-${idx}-${item.barcode || item.uniqueCode || idx}`,
      selectedForPSS: true,
      serviceType: "Alteration",
      services: ['Alteration'],
      gender: item.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(item.name || item.pieceName || item.productName || '') ? 'Ladies' : 'Gents'),
      tailorName: defaultTailorName,
      deliveryDate: defaultDeliveryDate,
      trialRequired: true,
      trialDate: defaultTrialDate,
      priority: 'Normal',
      selectedOptions: [],
      measurements: {},
      instructions: '',
      charge: 0
    }));

    setPssConfigItems(itemsConfig);
    setPssFocusedIndex(0);
    setPssGeneralService("Alteration");
    setPssGeneralTailor(defaultTailorName);
    setPssGeneralDeliveryDate(defaultDeliveryDate);
    setPssGeneralTrialRequired(true);
    setPssGeneralTrialDate(defaultTrialDate);
    setPssGeneralPriority('Normal');
    setPssGeneralRemarks('');
    setShowPSSItemSelectModal(true);
  };

  const handleTogglePssItemOption = (itemIdx, optionText) => {
    setPssConfigItems(prev => prev.map((itm, idx) => {
      if (idx !== itemIdx) return itm;
      const exists = (itm.selectedOptions || []).includes(optionText);
      const nextOpts = exists
        ? (itm.selectedOptions || []).filter(o => o !== optionText)
        : [...(itm.selectedOptions || []), optionText];
      return { ...itm, selectedOptions: nextOpts };
    }));
  };

  const handlePssMeasurementChange = (itemIdx, fieldName, val) => {
    setPssConfigItems(prev => prev.map((itm, idx) => {
      if (idx !== itemIdx) return itm;
      return {
        ...itm,
        measurements: {
          ...(itm.measurements || {}),
          [fieldName]: val
        }
      };
    }));
  };

  const handleContinueToServiceSelection = () => {
    const selectedItems = pssConfigItems.filter(i => i.selectedForPSS);
    if (selectedItems.length === 0) {
      if (onAddNotification) {
        onAddNotification("PSS Warning", "Please select at least one garment for Post Sales Service.", "warning");
      }
      return;
    }
    // Auto-inherit salesman from bill if available
    if (!pssSalesmanName && pssInvoice?.salesmanName) {
      setPssSalesmanName(pssInvoice.salesmanName);
    }
    setShowPSSItemSelectModal(false);
    setShowPSSWaitingModal(true); // NEW: go to Customer Waiting Option step
  };

  const handleSubmitPSS = async () => {
    const selectedItems = pssConfigItems.filter(i => i.selectedForPSS);
    if (selectedItems.length === 0) {
      if (onAddNotification) {
        onAddNotification("PSS Warning", "Please select at least one garment for Post Sales Service.", "warning");
      }
      return;
    }

    try {
      setIsSubmittingPSS(true);

      const isDirect = pssAssignmentOption === "DIRECT";

      // Derive priority from customerWaitingOption
      let derivedPriority = 'NORMAL';
      if (pssCustomerWaitingOption === 'Waiting in Store') derivedPriority = 'HIGH';
      else if (pssCustomerWaitingOption === 'Home Delivery Required') derivedPriority = 'DELIVERY';

      const custNameVal = pssCustName.trim() || pssInvoice.customerName || activeCustomer?.name || 'Walk-in Customer';
      const custPhoneVal = pssCustPhone.trim() || pssInvoice.customerPhone || activeCustomer?.phone || '';
      const custAltPhoneVal = pssCustAltPhone.trim() || pssInvoice.alternatePhone || activeCustomer?.alternatePhone || '';
      const custWhatsappVal = pssCustWhatsapp.trim() || pssInvoice.whatsappNumber || activeCustomer?.whatsappNumber || '';
      const custNotesVal = pssCustNotes.trim() || pssInvoice.specialInstructions || pssGeneralRemarks || '';

      const payload = {
        saleBillId: pssInvoice._id,
        invoiceNumber: pssInvoice.invoiceNo,
        billBarcode: pssInvoice.billBarcode || pssInvoice.invoiceNo,
        customerId: pssInvoice.customerId || activeCustomer?._id,
        customerName: custNameVal,
        customerPhone: custPhoneVal,
        alternatePhone: custAltPhoneVal,
        whatsappNumber: custWhatsappVal,
        specialInstructions: custNotesVal,
        salesmanName: pssSalesmanName || pssInvoice?.salesmanName || '',
        customerWaitingOption: pssCustomerWaitingOption,
        priority: derivedPriority,
        gender: selectedItems[0]?.gender || 'Gents',
        allowWhatsApp: pssAllowWhatsApp,
        tailorName: isDirect ? (pssGeneralTailor || selectedItems[0]?.tailorName || 'Master Tailor') : '',
        expectedDeliveryDate: pssGeneralDeliveryDate || selectedItems[0]?.deliveryDate,
        trialRequired: pssGeneralTrialRequired !== false,
        trialDate: pssGeneralTrialDate || undefined,
        remarks: pssGeneralRemarks || custNotesVal || '',
        items: selectedItems.map(item => {
          const itemServices = Array.isArray(item.services) && item.services.length > 0
            ? item.services
            : [item.serviceType || pssGeneralService || 'Alteration'];
          const hasItemAlt = itemServices.some(s => s.toLowerCase().includes('alteration'));
          const itemTrialReq = hasItemAlt ? (item.trialRequired !== undefined ? item.trialRequired : pssGeneralTrialRequired !== false) : false;
          return {
            inventoryPieceId: item.inventoryPieceId || item._id,
            pieceName: item.name,
            productName: item.name,
            barcode: item.barcode,
            uniqueCode: item.uniqueCode,
            sku: item.sku || item.barcode,
            size: item.size,
            color: item.color,
            gender: item.gender || 'Gents',
            services: itemServices,
            serviceType: itemServices[0] || 'Alteration',
            assignedTo: isDirect ? (item.tailorName || pssGeneralTailor || 'Master Tailor') : '',
            trialRequired: itemTrialReq,
            trialDate: itemTrialReq ? (item.trialDate || pssGeneralTrialDate || undefined) : undefined,
            alterationDetails: itemServices,
            measurements: item.measurements || {},
            instructions: itemServices.join(' + '),
            charge: Number(item.charge || 0)
          };
        })
      };

      const res = await api.post('/pssm', payload);
      const createdData = res.data?.data?.pssmRecord || res.data?.data || {};
      const createdItems = createdData.items || res.data?.data?.items || [];
      const tailoringJobs = res.data?.data?.tailoringJobs || [];
      const tailorInvoiceNo = tailoringJobs.length > 0 ? tailoringJobs[0].tailorInvoiceNo : null;

      const issuedPssmNo = createdData.pssmNo || createdData.pssmRecord?.pssmNo || `PSSM-${Date.now().toString(36).toUpperCase()}`;
      const slipBarcode = createdData.slipBarcode || createdData.pssmRecord?.slipBarcode || issuedPssmNo;
      const originalInvoiceNo = pssInvoice.invoiceNo;
      const billBarcode = pssInvoice.billBarcode || originalInvoiceNo;

      // Build PSS Slip data
      const slipData = {
        pssmNo: issuedPssmNo,
        slipBarcode,
        tailorInvoiceNo,
        originalInvoiceNo,
        billBarcode,
        customerName: custNameVal,
        customerPhone: custPhoneVal,
        alternatePhone: custAltPhoneVal,
        whatsappNumber: custWhatsappVal,
        specialInstructions: custNotesVal,
        salesmanName: pssSalesmanName || pssInvoice?.salesmanName || 'Counter Staff',
        customerWaitingOption: pssCustomerWaitingOption,
        priority: derivedPriority,
        gender: selectedItems[0]?.gender || 'Gents',
        allowWhatsApp: pssAllowWhatsApp,
        cashierName: currentUser ? currentUser.name : 'Cashier',
        deliveryDate: pssGeneralDeliveryDate,
        trialRequired: pssGeneralTrialRequired !== false,
        trialDate: pssGeneralTrialDate,
        items: selectedItems.map((itm, idx) => {
          const itmServices = Array.isArray(itm.services) && itm.services.length > 0
            ? itm.services
            : [itm.serviceType || pssGeneralService || 'Alteration'];
          const hasItmAlt = itmServices.some(s => s.toLowerCase().includes('alteration'));
          const itmTrialReq = hasItmAlt ? (itm.trialRequired !== undefined ? itm.trialRequired : pssGeneralTrialRequired !== false) : false;
          const matchingCreatedItem = createdItems[idx] || createdItems.find(ci => ci.barcode === (itm.barcode || itm.uniqueCode)) || {};
          const matchingJob = tailoringJobs[idx] || tailoringJobs.find(tj => String(tj.pssmItemId) === String(matchingCreatedItem._id)) || {};
          const itemTailorInvoiceNo = matchingCreatedItem.tailorInvoiceNo || matchingJob.tailorInvoiceNo || (hasItmAlt ? tailorInvoiceNo : null);
          const itemAlterationBarcode = matchingCreatedItem.alterationBarcode || itemTailorInvoiceNo || (issuedPssmNo ? `${issuedPssmNo}-${idx + 1}` : null);

          return {
            name: itm.name,
            size: itm.size,
            color: itm.color,
            gender: itm.gender || 'Gents',
            barcode: itm.barcode || itm.uniqueCode,
            alterationBarcode: itemAlterationBarcode,
            services: itmServices,
            serviceType: itmServices.join(' + '),
            tailorInvoiceNo: itemTailorInvoiceNo,
            trialRequired: itmTrialReq,
            trialDate: itmTrialReq ? (itm.trialDate || pssGeneralTrialDate || '') : '',
            assignedTo: isDirect ? (itm.tailorName || pssGeneralTailor || 'Master Tailor') : 'Pending Assignment',
            alterationDetails: itmServices,
            instructions: itmServices.join(' + ')
          };
        }),
        createdAt: new Date().toISOString()
      };

      setPssSlipData(slipData);
      setShowPSSServiceSelectModal(false);

      // Maintain original invoice immutability while updating local invoice history with linked PSS reference
      setHistoryInvoices(prev => (prev || []).map(item => {
        if ((item._id && item._id === pssInvoice._id) || item.invoiceNo === pssInvoice.invoiceNo || (item.billNo && item.billNo === pssInvoice.invoiceNo)) {
          return {
            ...item,
            hasPSSM: true,
            pssmNo: issuedPssmNo,
            pssmStatus: 'PENDING_ASSIGNMENT',
            pssmRecord: slipData
          };
        }
        return item;
      }));

      if (onAddNotification) {
        onAddNotification(
          "PSS Docket Issued",
          `Post Sales Service docket ${issuedPssmNo} issued successfully!`,
          "success"
        );
      }
    } catch (err) {
      console.error("Failed to submit PSS:", err);
      if (onAddNotification) {
        onAddNotification(
          "PSS Error",
          err.response?.data?.message || err.message || "Failed to create PSS record.",
          "error"
        );
      }
    } finally {
      setIsSubmittingPSS(false);
    }
  };

  const handleOpenPSSSlipFromInvoice = async (inv) => {
    if (!inv) return;
    try {
      const barcodeToSearch = inv.pssmNo || inv.slipBarcode || inv.billBarcode || inv.invoiceNo || inv.billNo;
      const res = await api.get(`/pssm/barcode/${encodeURIComponent(barcodeToSearch)}`);
      if (res.data?.success && res.data.data?.pssm) {
        const pssm = res.data.data.pssm;
        const items = res.data.data.items || [];
        const slip = {
          pssmNo: pssm.pssmNo,
          slipBarcode: pssm.slipBarcode || pssm.pssmNo || barcodeToSearch,
          originalInvoiceNo: pssm.billNo || inv.invoiceNo,
          billBarcode: pssm.billBarcode || barcodeToSearch,
          customerName: pssm.customerName || inv.customerName,
          customerPhone: pssm.customerPhone || inv.customerPhone,
          salesmanName: pssm.salesmanName || inv.salesmanName || 'Sales Staff',
          customerWaitingOption: pssm.customerWaitingOption || 'Will Come Later',
          priority: pssm.priority || 'NORMAL',
          status: pssm.status || 'PENDING_ASSIGNMENT',
          cashierName: currentUser ? currentUser.name : 'Cashier',
          deliveryDate: pssm.expectedDeliveryDate,
          allowWhatsApp: pssm.allowWhatsApp !== false,
          items: items.map((it, idx) => ({
            _id: it._id,
            name: it.productName || it.pieceName,
            size: it.size,
            color: it.color,
            barcode: it.barcode || it.uniqueCode,
            alterationBarcode: it.alterationBarcode || it.tailorInvoiceNo || (pssm.pssmNo ? `${pssm.pssmNo}-${idx + 1}` : null),
            serviceType: it.serviceType || 'Alteration',
            tailorInvoiceNo: it.tailorInvoiceNo,
            status: it.status || 'PENDING_ASSIGNMENT',
            assignedTo: it.assignedTo || 'Pending Assignment',
            alterationDetails: it.alterationDetails || [],
            instructions: it.instructions || ''
          })),
          createdAt: pssm.createdAt
        };
        setPssSlipData(slip);
      } else if (inv.pssmRecord) {
        setPssSlipData(inv.pssmRecord);
      } else {
        if (onAddNotification) onAddNotification("PSS Info", "No active PSS record found for this invoice.", "info");
      }
    } catch (err) {
      if (inv.pssmRecord) {
        setPssSlipData(inv.pssmRecord);
      } else {
        if (onAddNotification) onAddNotification("Error", "Could not load PSS details.", "danger");
      }
    }
  };

  const handleCollectPSSItemFromSlip = async (itemId = null) => {
    if (!pssSlipData || !pssSlipData.billBarcode) return;
    try {
      const res = await api.post('/pssm/collection', {
        billBarcode: pssSlipData.billBarcode,
        itemIds: itemId ? [itemId] : []
      });
      if (res.data?.success && res.data.data?.pssm) {
        const pssm = res.data.data.pssm;
        const items = res.data.data.items || [];
        const allItemsCollected = items.length > 0 && items.every(it => it.status === 'COLLECTED' || it.status === 'CLOSED');
        const computedStatus = (allItemsCollected || pssm.status === 'CLOSED' || pssm.status === 'COLLECTED') ? 'CLOSED' : (pssm.status || 'PENDING');

        const updatedSlip = {
          ...pssSlipData,
          status: computedStatus,
          items: items.map(it => ({
            _id: it._id,
            name: it.productName || it.pieceName,
            size: it.size,
            color: it.color,
            barcode: it.barcode || it.uniqueCode,
            serviceType: it.serviceType || 'Alteration',
            status: it.status || 'COLLECTED',
            assignedTo: it.assignedTo || 'Pending Assignment',
            alterationDetails: it.alterationDetails || [],
            instructions: it.instructions || ''
          }))
        };
        setPssSlipData(updatedSlip);

        // Update local invoice history in real-time
        setHistoryInvoices(prev => (prev || []).map(i => {
          const isMatch = (i.invoiceNo && (i.invoiceNo === pssSlipData.originalInvoiceNo || i.invoiceNo === pssSlipData.billBarcode)) ||
            (i.billNo && (i.billNo === pssSlipData.originalInvoiceNo || i.billNo === pssSlipData.billBarcode)) ||
            (i.billBarcode && (i.billBarcode === pssSlipData.billBarcode || i.billBarcode === pssSlipData.originalInvoiceNo)) ||
            (i.pssmNo && (i.pssmNo === pssm.pssmNo || i.pssmNo === pssSlipData.pssmNo));
          if (isMatch) {
            return {
              ...i,
              pssmStatus: computedStatus,
              pssmRecord: updatedSlip
            };
          }
          return i;
        }));

        if (onAddNotification) {
          onAddNotification(
            "Product Collected",
            computedStatus === 'CLOSED'
              ? `All garments collected! PSS docket status is now CLOSED.`
              : `Product successfully marked as COLLECTED. Ticket status: ${computedStatus.replace(/_/g, ' ')}`,
            "success"
          );
        }
      }
    } catch (err) {
      if (onAddNotification) onAddNotification("Error", err.response?.data?.message || "Collection failed.", "danger");
    }
  };

  const handleCollectPSSItemDirectly = async (item, idx) => {
    const billBarcode = item.pssmBillBarcode || loadedOriginalInvoice?.billBarcode || loadedOriginalInvoice?.invoiceNo || loadedOriginalInvoice?.billNo || item.barcode;
    const itemId = item.pssmItemId;
    if (!billBarcode) {
      if (onAddNotification) onAddNotification("Collection Warning", "Bill barcode not found for this PSS item.", "warning");
      return;
    }

    try {
      const res = await api.post('/pssm/collection', {
        billBarcode,
        itemIds: itemId ? [itemId] : []
      });

      if (res.data?.success && res.data.data?.pssm) {
        const pssm = res.data.data.pssm;
        const returnedItems = res.data.data?.items || [];
        const allCollected = returnedItems.length > 0 && returnedItems.every(it => it.status === 'COLLECTED' || it.status === 'CLOSED');
        const computedStatus = (allCollected || pssm.status === 'CLOSED' || pssm.status === 'COLLECTED') ? 'CLOSED' : (pssm.status || 'PENDING');

        // 1. Update Cart state
        setCart(prev => {
          const next = [...prev];
          if (next[idx]) {
            next[idx] = {
              ...next[idx],
              pssmItemStatus: 'COLLECTED'
            };
          }
          return next;
        });

        // 2. Update loadedOriginalInvoice
        setLoadedOriginalInvoice(prev => {
          if (!prev) return prev;
          const updatedItems = (prev.items || []).map((it, i) => {
            if (i === idx || (itemId && it.pssmItemId === itemId) || (it.barcode && it.barcode === item.barcode)) {
              return { ...it, pssmItemStatus: 'COLLECTED' };
            }
            return it;
          });
          return {
            ...prev,
            items: updatedItems,
            pssmRecord: { ...pssm, status: computedStatus }
          };
        });

        // 3. Update invoiceList and historyInvoices
        if (typeof setInvoiceList === 'function') {
          setInvoiceList(prev => (prev || []).map(i => {
            const isMatch = (i.invoiceNo && (i.invoiceNo === billBarcode || i.invoiceNo === pssm.billNo)) ||
              (i.billNo && (i.billNo === billBarcode || i.billNo === pssm.billNo)) ||
              (i.billBarcode && (i.billBarcode === billBarcode || i.billBarcode === pssm.billBarcode)) ||
              (i.pssmNo && (i.pssmNo === pssm.pssmNo || i.pssmNo === item.pssmNo));
            if (isMatch) {
              return {
                ...i,
                pssmStatus: computedStatus,
                pssmRecord: { ...pssm, status: computedStatus }
              };
            }
            return i;
          }));
        }

        if (typeof setHistoryInvoices === 'function') {
          setHistoryInvoices(prev => (prev || []).map(i => {
            const isMatch = (i.invoiceNo && (i.invoiceNo === billBarcode || i.invoiceNo === pssm.billNo)) ||
              (i.billNo && (i.billNo === billBarcode || i.billNo === pssm.billNo)) ||
              (i.billBarcode && (i.billBarcode === billBarcode || i.billBarcode === pssm.billBarcode)) ||
              (i.pssmNo && (i.pssmNo === pssm.pssmNo || i.pssmNo === item.pssmNo));
            if (isMatch) {
              return {
                ...i,
                pssmStatus: computedStatus,
                pssmRecord: { ...pssm, status: computedStatus }
              };
            }
            return i;
          }));
        }

        if (pssSlipData) {
          setPssSlipData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              status: computedStatus,
              items: (prev.items || []).map(pi => {
                if ((itemId && pi._id === itemId) || (pi.barcode && pi.barcode === item.barcode)) {
                  return { ...pi, status: 'COLLECTED' };
                }
                return pi;
              })
            };
          });
        }

        if (onAddNotification) {
          onAddNotification(
            "Product Collected",
            computedStatus === 'CLOSED'
              ? `All garments collected! PSS docket status is now CLOSED.`
              : `${item.name} marked as COLLECTED.`,
            "success"
          );
        }
      } else {
        if (onAddNotification) onAddNotification("Collection Failed", res.data?.message || "Failed to mark item as collected", "danger");
      }
    } catch (err) {
      console.error("Direct collection failed:", err);
      if (onAddNotification) onAddNotification("Error", err.response?.data?.message || "Failed to process collection", "danger");
    }
  };

  const handleOpenAlterationForSelectedProduct = (specificItem = null, specificIdx = null) => {
    let targetIdx = specificIdx;
    if (targetIdx === null || targetIdx === undefined) {
      targetIdx = (selectedCartRowIndex >= 0 && selectedCartRowIndex < cart.length) ? selectedCartRowIndex : 0;
    }
    const targetItem = specificItem || cart[targetIdx];
    if (!targetItem) {
      if (onAddNotification) onAddNotification("Validation Notice", "Please select a product from the bill first.", "warning");
      return;
    }
    setSelectedCartRowIndex(targetIdx);
    setSelectedAlterationCartItem(targetItem);
    setAltMeasurements(targetItem.alterationRecord?.measurements || {});
    setAltOptions(targetItem.alterationRecord?.alterationDetails || []);
    setAltCustomText(targetItem.alterationRecord?.customAlterationText || "");
    setAltSpecialInstructions(targetItem.alterationRecord?.specialInstructions || "");
    setShowAlterationModal(true);
  };

  // --- NEW ERP STATE VARIABLES ---

  // --- REDESIGNED BILLING WINDOW STATES ---
  const [isDesignSelectionPopupOpen, setIsDesignSelectionPopupOpen] = useState(false);
  const [designSelectionItems, setDesignSelectionItems] = useState([]);
  const [selectedDesignItemIdx, setSelectedDesignItemIdx] = useState(0);

  const [isPurchaseAuthModalOpen, setIsPurchaseAuthModalOpen] = useState(false);
  const [purchaseAuthOwnerId, setPurchaseAuthOwnerId] = useState('');
  const [purchaseAuthPassword, setPurchaseAuthPassword] = useState('');
  const [isPurchaseTabUnlocked, setIsPurchaseTabUnlocked] = useState(false);

  const [infoPanelItem, setInfoPanelItem] = useState(null);
  const [infoPanelTab, setInfoPanelTab] = useState('General'); // General, Stock, Purchase, Sales

  // Audit log tracking for POS Item View
  React.useEffect(() => {
    if (selectedSearchItem) {
      const itemName = selectedSearchItem?.name || selectedSearchItem?.product?.name || selectedSearchItem?.itemCode || 'Unknown Item';
      const code = selectedSearchItem?.designNo || selectedSearchItem?.itemCode || '';
      const display = code ? `${itemName} (${code})` : itemName;

      const rawId = selectedSearchItem?._id || selectedSearchItem?.id;
      const validEntityId = /^[a-fA-F0-9]{24}$/.test(rawId) ? rawId : null;

      // Audit log moved to handlePurchaseAuth
    }
  }, [selectedSearchItem]);

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

  // Filtered invoices for Invoice History mode
  const filteredHistoryInvoices = useMemo(() => {
    const list = invoiceList || invoices || [];
    const q = (historySearch || "").toLowerCase().trim();
    if (!q) return list;
    return list.filter((inv) => {
      const matchNo = (inv.invoiceNo || "").toLowerCase().includes(q);
      const matchCust = (inv.customerName || "").toLowerCase().includes(q);
      const matchPhone = (inv.customerPhone || "").toLowerCase().includes(q);
      const matchPay = (inv.paymentMethod || "").toLowerCase().includes(q);
      const matchItems = (inv.items || []).some(
        (item) =>
          (item.name || "").toLowerCase().includes(q) ||
          (item.productCode || "").toLowerCase().includes(q) ||
          (item.uniqueCode || "").toLowerCase().includes(q)
      );
      return matchNo || matchCust || matchPhone || matchPay || matchItems;
    });
  }, [invoiceList, invoices, historySearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
    }, 200);
    return () => clearTimeout(handler);
  }, [productSearch]);

  // When any modal opens, close all floating dropdowns immediately
  useEffect(() => {
    if (
      isItemSearchModalOpen ||
      showPaymentModal ||
      showAdjustmentModal ||
      showReceiptModal ||
      showExchangeSlipModal ||
      qtyModalProduct ||
      activePOSMode !== "billing"
    ) {
      setIsDesignNoDropdownOpen(false);
      setIsItemDropdownOpen(false);
      setIsItemCodeDropdownOpen(false);
    }
  }, [
    isItemSearchModalOpen,
    showPaymentModal,
    showAdjustmentModal,
    showReceiptModal,
    showExchangeSlipModal,
    qtyModalProduct,
    activePOSMode
  ]);

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
    setShowHoldListModal(true);
  };

  const handleResumeSpecificBill = (index) => {
    const selectedBill = heldBills[index];
    setCart(selectedBill.cart);
    setSelectedCustomerId(selectedBill.customerId);
    setHeldBills(prev => prev.filter((_, i) => i !== index));
    setShowHoldListModal(false);
    if (onAddNotification) onAddNotification("Resume Bill", "Bill resumed (F5).", "success");
  };

  const handleFocusItemCodeSearch = () => {
    if (isItemSearchModalOpen) setIsItemSearchModalOpen(false);
    if (activePOSMode !== "billing") {
      setActivePOSMode("billing");
    }
    const focusAction = () => {
      const input = document.getElementById("itemCodeSearchInput");
      if (input) {
        input.focus();
        input.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        if (typeof input.select === "function") input.select();
        setIsItemCodeDropdownOpen(true);
      }
    };
    focusAction();
    setTimeout(focusAction, 50);
    setTimeout(focusAction, 150);
  };

  const handleFocusDesignNoSearch = () => {
    if (isItemSearchModalOpen) setIsItemSearchModalOpen(false);
    if (activePOSMode !== "billing") {
      setActivePOSMode("billing");
    }
    const focusAction = () => {
      const input = document.getElementById("designNoSearchInput");
      if (input) {
        input.focus();
        input.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        if (typeof input.select === "function") input.select();
        if (designNoSearchInput.trim().length > 0) {
          setIsDesignNoDropdownOpen(true);
          setDesignNoHighlightedIndex(0);
        }
      }
    };
    focusAction();
    setTimeout(focusAction, 50);
    setTimeout(focusAction, 150);
  };

  // Centralized helper to completely wipe out existing context (cart, loaded invoice, customer, returns)
  const handleClearBillContext = (notificationTitle = "Clear Bill", notificationMsg = "Context cleared.") => {
    setCart([]);
    setCustomerForm({ phone: '', name: '', customerId: '', gstin: '', lf: '2588' });
    setSelectedCustomerId("");
    setLoadedOriginalInvoice(null);
    setReturnActionType(null);
    setReturnedItemIds([]);
    setActivePOSMode("billing");
    if (onAddNotification) onAddNotification(notificationTitle, notificationMsg, "info");
  };

  // --- GLOBAL KEYBOARD LISTENERS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Master Shortcut: Alt + D → Focus Design No Search (Intercept early before browser catches it)
      if (e.altKey && (e.key === "d" || e.key === "D" || e.code === "KeyD" || e.key === "∂" || e.keyCode === 68)) {
        e.preventDefault();
        e.stopPropagation();
        handleFocusDesignNoSearch();
        return;
      }

      // Prevent browser default actions (like F5 refresh) for our POS shortcuts
      if (["F1", "F2", "F3", "F4", "F5", "F6", "F8", "F9"].includes(e.key)) {
        e.preventDefault();
      }

      // If alteration prompt is open, F1 cancels, F2 proceeds
      if (alterationPromptItem) {
        if (e.key === "F1") {
          e.preventDefault();
          setAlterationPromptItem(null);
          return;
        }
        if (e.key === "F2") {
          e.preventDefault();
          setSelectedAlterationCartItem(alterationPromptItem);
          setAltMeasurements({});
          setAltOptions([]);
          setAltCustomText("");
          setAltSpecialInstructions("");
          setAlterationPromptItem(null);
          setShowAlterationModal(true);
          return;
        }
      }

      // Space key shortcut to open search modal when not inside an input/textarea/button, and no other modal is open
      const isAnyModalOpen =
        isItemSearchModalOpen ||
        qtyModalProduct ||
        showAddCustomerModal ||
        showDueCustomerModal ||
        showPaymentModal ||
        showReceiptModal ||
        showHoldBillModal ||
        showExchangeSlipModal ||
        showAlterationModal ||
        isPurchaseAuthModalOpen ||
        showPSSQuestionPromptModal ||
        showPSSCustomerDetailsModal ||
        showPSSItemSelectModal ||
        showPSSWaitingModal ||
        showPSSServiceSelectModal ||
        alterationPromptItem;

      if (
        e.key === " " &&
        !isAnyModalOpen &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "BUTTON"
      ) {
        e.preventDefault();
        e.stopPropagation();
        setItemNameInput("");
        handleOpenItemSearchModal();
        return;
      }

      // If item search modal is open
      if (isItemSearchModalOpen) {
        if (e.key === "F1") {
          e.preventDefault();
          const inputEl = document.getElementById("modalItemNameInput");
          if (inputEl) {
            inputEl.focus();
            inputEl.select();
          }
          if (itemSearchResults.length === 0) {
            handleOpenItemSearchModal();
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setIsItemSearchModalOpen(false);
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const currentIndex = itemSearchResults.findIndex(
            (item) => (selectedSearchItem && (selectedSearchItem._id === item._id || selectedSearchItem.id === item._id))
          );
          const nextIndex = (currentIndex + 1) % itemSearchResults.length;
          if (itemSearchResults[nextIndex]) {
            setSelectedSearchItem(itemSearchResults[nextIndex]);
            document.getElementById(`search-row-${nextIndex}`)?.scrollIntoView({ block: 'nearest' });
          }
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const currentIndex = itemSearchResults.findIndex(
            (item) => (selectedSearchItem && (selectedSearchItem._id === item._id || selectedSearchItem.id === item._id))
          );
          const prevIndex = (currentIndex - 1 + itemSearchResults.length) % itemSearchResults.length;
          if (itemSearchResults[prevIndex]) {
            setSelectedSearchItem(itemSearchResults[prevIndex]);
            document.getElementById(`search-row-${prevIndex}`)?.scrollIntoView({ block: 'nearest' });
          }
          return;
        }
        if (e.key === "Enter") {
          if (document.activeElement?.id === "modalItemNameInput") {
            return;
          }
          e.preventDefault();
          const activeItem = selectedSearchItem || itemSearchResults[0];
          if (activeItem) {
            handleAddProductToCart(activeItem);
            setItemNameInput("");
            setIsItemSearchModalOpen(false);
          }
          return;
        }
      }

      // If the receipt preview modal is open, handle its keyboard shortcuts
      if (showBillPreviewInvoice) {
        if (e.key === "Escape") {
          e.preventDefault();
          setShowBillPreviewInvoice(null);
          return;
        }
        // Button 1: Generate Bill (No Print) -> Enter ONLY
        if (showBillPreviewInvoice.isDraftPreview && e.key === "Enter") {
          e.preventDefault();
          if (!isGeneratingBill) handleGenerateBillAction();
          return;
        }
        // Button 2: Print -> F10 ONLY
        if (e.key === "F10") {
          e.preventDefault();
          if (!isPrinting) handlePrintAction();
          return;
        }
        // Button 3: Download HTML -> F11 ONLY
        if (e.key === "F11") {
          e.preventDefault();
          if (!isDownloading) handleDownloadAction();
          return;
        }
        // Button 4: WhatsApp -> F12 ONLY
        if (e.key === "F12") {
          e.preventDefault();
          handleSendWhatsAppAction();
          return;
        }
        return;
      }

      // If the receipt modal is open, close it on Escape
      if (completedInvoice && e.key === "Escape") {
        e.preventDefault();
        setCompletedInvoice(null);
        return;
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

      // F1: New Bill
      if (e.key === "F1") {
        e.preventDefault();
        handleClearBillContext("New Bill", "Cart cleared for new bill.");
        return;
      }
      // F2: Product Search
      if (e.key === "F2") {
        e.preventDefault();
        handleOpenItemSearchModal();
        return;
      }
      // F3: Customer Search
      if (e.key === "F3") {
        e.preventDefault();
        document.getElementById("mobileSearchInput")?.focus();
        return;
      }

      // 'R' / 'r': Returns
      if ((e.key === "r" || e.key === "R") && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA" && !isAnyModalOpen) {
        e.preventDefault();
        if (loadedOriginalInvoice) setSelectedInvoiceForReturn({ ...loadedOriginalInvoice, items: unrollInvoiceItems(loadedOriginalInvoice.items || []) });
        setReturnActionType("return");
        setActivePOSMode("returns");
        return;
      }

      // 'E' / 'e': Exchange
      if ((e.key === "e" || e.key === "E") && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA" && !isAnyModalOpen) {
        e.preventDefault();
        if (loadedOriginalInvoice) setSelectedInvoiceForReturn({ ...loadedOriginalInvoice, items: unrollInvoiceItems(loadedOriginalInvoice.items || []) });
        setReturnActionType("exchange");
        setActivePOSMode("returns");
        return;
      }

      // F4 / Alt+I: Search Item Through Item Code
      if (e.key === "F4" || (e.altKey && e.key.toLowerCase() === "i")) {
        e.preventDefault();
        handleFocusItemCodeSearch();
        return;
      }
      // F5: Resume Bill
      if (e.key === "F5") {
        e.preventDefault();
        handleResumeBill();
        return;
      }
      // F6: Payment / Checkout
      if (e.key === "F6") {
        e.preventDefault();
        handleOpenPaymentFlow();
        return;
      }
      // F7: Save Bill
      if (e.key === "F7") {
        e.preventDefault();
        handleCheckoutSubmit();
        return;
      }
      // F8: Hold Bill
      if (e.key === "F8") {
        e.preventDefault();
        handleHoldBill();
        return;
      }
      // F9: Generate/Print Draft Bill Preview
      if (e.key === "F9") {
        e.preventDefault();
        handleOpenDraftPreview();
        return;
      }
      // F10: Print Bill Shortcut (Global)
      if (e.key === "F10" || e.code === "F10" || e.keyCode === 121) {
        e.preventDefault();
        e.stopPropagation();
        if (showBillPreviewInvoice) {
          if (!isPrinting) handlePrintAction();
        } else if (showPaymentModal) {
          handleCheckoutSubmit(false, false, true);
        } else if (cart.length > 0) {
          handleOpenDraftPreview();
        }
        return;
      }

      // Ctrl+B: Barcode Scanner
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        return;
      }

      // Payment Modal Shortcuts
      if (showPaymentModal) {
        if (e.ctrlKey && e.key.toLowerCase() === "s") {
          e.preventDefault();
          document.getElementById("save-payment-btn")?.click();
          return;
        }
        if (e.ctrlKey && e.key.toLowerCase() === "p") {
          e.preventDefault();
          document.getElementById("save-print-payment-btn")?.click();
          return;
        }
      }

      // Esc: Close Modals / Dropdowns
      if (e.key === "Escape") {
        setIsProductDropdownOpen(false);
        setIsCustomerDropdownOpen(false);
        setIsItemCodeDropdownOpen(false);
        setIsDesignNoDropdownOpen(false);
        setVariantModalProduct(null);
        setShowPaymentModal(false);
        setShowAlterationModal(false);
        setShowDueCustomerModal(false);
      }

      // Master Shortcut: Alt + A → Focus/Activate Alteration Panel
      if (e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (cart.length === 0) {
          if (onAddNotification) onAddNotification("Alteration Panel", "No items in bill to alter.", "info");
          return;
        }
        if (document.activeElement && typeof document.activeElement.blur === "function") {
          document.activeElement.blur();
        }
        setIsAlterationModeActive(true);
        setFocusedAlterationIndex(prev => (prev >= 0 && prev < cart.length ? prev : 0));
        return;
      }

      // Master Shortcut: Alt + D → Focus Design No Search
      if (e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleFocusDesignNoSearch();
        return;
      }

      // Single Key Shortcuts & Space Key (Guarded when typing text in editable inputs)
      const isTyping = document.activeElement && (
        (document.activeElement.tagName === "INPUT" && !document.activeElement.readOnly) ||
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.tagName === "SELECT" ||
        document.activeElement.isContentEditable
      );

      if (!isTyping && !isAlterationModeActive && !showPaymentModal && !isItemSearchModalOpen && !isAnyModalOpen) {
        const k = (e.key || "").toLowerCase();

        // Space Key -> Search Product Modal
        if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          handleOpenItemSearchModal();
          return;
        }
        // Adjustments -> A
        if (k === "a" && !e.altKey) {
          e.preventDefault();
          setShowAdjustmentModal(true);
          return;
        }
        // Item Code Search -> I
        if (k === "i" && !e.altKey) {
          e.preventDefault();
          handleFocusItemCodeSearch();
          return;
        }
        // Returns -> R
        if (k === "r") {
          e.preventDefault();
          setActivePOSMode("returns");
          return;
        }
        // Discount -> D
        if (k === "d") {
          e.preventDefault();
          setShowDiscountSelectionModal(true);
          return;
        }
        // Exchange -> E
        if (k === "e") {
          e.preventDefault();
          setActivePOSMode("returns");
          return;
        }
        // Clear Bill -> C
        if (k === "c") {
          e.preventDefault();
          handleClearBillContext("Clear Bill", "Cart cleared.");
          return;
        }
        // Loyalty -> L
        if (k === "l") {
          e.preventDefault();
          document.getElementById("mobileSearchInput")?.focus();
          return;
        }
        // Previous Bill (<)
        if (e.key === "<" || e.key === "," || (e.altKey && e.key === "ArrowLeft")) {
          e.preventDefault();
          handleLoadPreviousBill();
          return;
        }
        // Next Bill (>)
        if (e.key === ">" || e.key === "." || (e.altKey && e.key === "ArrowRight")) {
          e.preventDefault();
          handleLoadNextBill();
          return;
        }
      }

      // Alteration Panel Active Mode Navigation Controls
      if (isAlterationModeActive && cart.length > 0 && !showAlterationModal && !showPaymentModal && !isItemSearchModalOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          setIsAlterationModeActive(false);
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedAlterationIndex(prev => Math.min(cart.length - 1, prev + 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedAlterationIndex(prev => Math.max(0, prev - 1));
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const targetItem = cart[focusedAlterationIndex];
          if (targetItem) {
            setCart(prev => {
              const next = [...prev];
              const cur = next[focusedAlterationIndex];
              const nextHasAlt = !cur.hasAlteration;
              next[focusedAlterationIndex] = {
                ...cur,
                hasAlteration: nextHasAlt,
                alterationStatus: nextHasAlt ? 'PENDING' : 'NONE'
              };
              return next;
            });
            if (!targetItem.hasAlteration && onAddNotification) {
              onAddNotification(
                "Marked for Alteration",
                `${targetItem.name} marked for alteration. Complete tailoring details in Alteration Module after billing.`,
                "info"
              );
            }
          }
          return;
        }
      }

      // Payment Modal Navigation
      if (showPaymentModal) {
        const methods = ["Cash", "Card", "UPI", "Credit"];
        const currIdx = methods.indexOf(paymentMethod);
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          setPaymentMethod(methods[Math.min(currIdx + 1, methods.length - 1)]);
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          setPaymentMethod(methods[Math.max(currIdx - 1, 0)]);
        } else if (e.key === "Enter") {
          e.preventDefault();
          setShowPaymentModal(false);
        }
        return;
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
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [
    qtyModalProduct,
    cart,
    heldBills,
    selectedCustomerId,
    completedInvoice,
    showPaymentModal,
    paymentMethod,
    isItemSearchModalOpen,
    itemSearchResults,
    selectedSearchItem,
    products,
    activeModule,
    alterationPromptItem,
    isAlterationModeActive,
    focusedAlterationIndex,
    showAlterationModal,
    showBillPreviewInvoice,
    isGeneratingBill
  ]); // Re-bind if these states change so handleHoldBill gets latest state
  // Articulation Window States (Module 2)
  const [articulationProduct, setArticulationProduct] = useState(null);
  // Variant Selection Modal State
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantModalProduct, setVariantModalProduct] = useState(null);
  const [showDiscountSelectionModal, setShowDiscountSelectionModal] = useState(false);
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

  const isSameProduct = (item1, item2) => {
    if (!item1 || !item2) return false;
    const id1 = String(item1.productId || item1._id || item1.id || "").trim();
    const id2 = String(item2.productId || item2._id || item2.id || "").trim();
    if (id1 && id2 && id1 === id2) return true;

    const barcode1 = String(item1.barcode || item1.barcodeNo || item1.uniqueCode || "").trim();
    const barcode2 = String(item2.barcode || item2.barcodeNo || item2.uniqueCode || "").trim();
    if (barcode1 && barcode2 && barcode1 === barcode2) return true;

    const sku1 = String(item1.sku || item1.designNo || item1.itemCode || "").trim();
    const sku2 = String(item2.sku || item2.designNo || item2.itemCode || "").trim();
    if (sku1 && sku2 && sku1.length > 0 && sku1 === sku2) return true;

    return false;
  };

  const getLiveStock = (prod) => {
    if (!prod) return 0;
    const statusStr = String(prod.status || "").toLowerCase();
    if (statusStr === "out of stock" || statusStr === "out_of_stock" || statusStr === "unavailable") {
      return 0;
    }
    if (Array.isArray(prod.pieces)) {
      if (prod.pieces.length === 0) {
        const s = prod.availableStock ?? prod.stock ?? prod.stockQuantity ?? 0;
        return Math.max(0, Number(s) || 0);
      }
      const availPieces = prod.pieces.filter(pc => {
        const pcStatus = String(pc.status || "").toUpperCase();
        return pcStatus === 'AVAILABLE' || pcStatus === 'IN STOCK' || !pc.status;
      });
      return availPieces.length;
    }
    if (Array.isArray(prod.variants) && prod.variants.length > 0) {
      return prod.variants.reduce((sum, v) => sum + getLiveStock(v), 0);
    }
    if (prod.availableStock !== undefined && prod.availableStock !== null) {
      return Math.max(0, Number(prod.availableStock) || 0);
    }
    if (prod.stock !== undefined && prod.stock !== null) {
      return Math.max(0, Number(prod.stock) || 0);
    }
    if (prod.stockQuantity !== undefined && prod.stockQuantity !== null) {
      return Math.max(0, Number(prod.stockQuantity) || 0);
    }
    if (prod.quantity !== undefined && prod.quantity !== null && !prod.cartItemId) {
      return Math.max(0, Number(prod.quantity) || 0);
    }
    const matched = (products || []).find(p => isSameProduct(p, prod));
    if (matched && matched !== prod) {
      return getLiveStock(matched);
    }
    return 0;
  };

  // Action: Add product to cart with custom quantity (from articulation window)
  const handleAddProductToCartWithQty = (prod, qty = 1) => {
    if (!prod) return false;
    const prodName = prod.name || prod.itemName || "This product";
    const availableStock = getLiveStock(prod);

    // Calculate how many units of this product are currently in cart
    const currentInCartCount = cart.filter(item => isSameProduct(item, prod)).reduce((sum, item) => sum + (item.quantity || 1), 0);

    if (availableStock <= 0) {
      alert(`Cannot be added! "${prodName}" is out of stock.`);
      if (onAddNotification) {
        onAddNotification(
          "Out of Stock",
          `"${prodName}" is currently out of stock and cannot be added.`,
          "danger",
        );
      }
      return false;
    }

    if (currentInCartCount + qty > availableStock) {
      const detailMsg = currentInCartCount > 0
        ? `"${prodName}" has only ${availableStock} unit(s) in stock (${currentInCartCount} already in cart).`
        : `Only ${availableStock} unit(s) of "${prodName}" are available in stock.`;

      alert(`Cannot be added! ${detailMsg}`);
      if (onAddNotification) {
        onAddNotification(
          "Stock Limit Reached",
          detailMsg,
          "warning",
        );
      }
      return false;
    }

    const sp = displayedSalespersonList[0] || (currentUser ? { id: currentUser.id || currentUser._id, name: currentUser.name } : { id: "sp-default", name: "Store Salesperson" });
    const wk = workerList[0] || { id: "w-default", name: "In-House Tailor" };
    const customSize = prod.size || "M";
    const customColor = prod.color || "Standard";

    finalizeAddToCart(
      prod,
      qty,
      customSize,
      customColor,
      sp.id || sp._id || "sp-default",
      sp.name || "Store Salesperson",
      wk.id || wk._id || "w-default",
      wk.name || "In-House Tailor"
    );
    return true;
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
    (c) => (c.id || c._id) === selectedCustomerId,
  ) || {
    id: "c-walkin",
    name: "Walk-in Customer",
    phone: "",
    outstandingBalance: 0,
    membership: "Bronze",
    walletAdvance: 0,
    loyaltyPoints: 0,
    createdAt: "",
    totalInvoices: 0,
    totalSpent: 0,
  };

  const baseFilteredProducts = React.useMemo(() => {
    return (products || []).filter((p) => {
      const matchesCat =
        selectedCategoryFilter === "All" || p.category?.toLowerCase() === selectedCategoryFilter.toLowerCase();
      const q = debouncedProductSearch.toLowerCase();
      const prdIdStr = p._id || p.id || "";
      const prdCode = `prd-${prdIdStr.toString().substring(Math.max(0, prdIdStr.toString().length - 6)).toLowerCase()}`;
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        prdCode.includes(q) ||
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

  const filteredProducts = React.useMemo(() => {
    const groups = {};
    (baseFilteredProducts || []).forEach(p => {
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
  }, [baseFilteredProducts, selectedCategoryFilter, debouncedProductSearch]);

  // Unique categories list from real DB products
  const uniqueCategories = React.useMemo(() => {
    return [
      "All",
      ...Array.from(new Set((products || []).map((p) => p.category).filter(Boolean))),
    ];
  }, [products]);

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
            handleAddProductToCart(p);
          }}
        >
          <td className="p-2.5 text-[11px] text-slate-500 font-mono">
            <span className="bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded text-[8px] font-extrabold block mb-0.5 w-fit uppercase font-mono">
              PRD-{p._id || p.id ? (p._id || p.id).toString().substring(Math.max(0, (p._id || p.id).toString().length - 6)).toUpperCase() : "TEMP"}
            </span>
            {p.sku}
          </td>
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
                handleAddProductToCart(p);
              }}
            >
              + Add
            </button>
          </td>
        </tr>
      );
    });
  }, [filteredProducts, focusedProductIndex]);

  // Action: Add product to cart (opens configuration modal)
  const handleAddProductToCart = (prod) => {
    return handleAddProductToCartWithQty(prod, 1);
  };

  // Action: Finalize product addition from configuration modal
  const finalizeAddToCart = (prod, customQty, customSize, customColor, spId, spName, wId, wName) => {
    setCart((prev) => {
      const newItems = [];
      const sPrice = Number(prod.mrp) || Number(prod.defaultMRP) || Number(prod.sellingPrice) || Number(prod.price) || 0;
      const mrpVal = Number(prod.mrp) || Number(prod.defaultMRP) || sPrice;
      const itemNameVal = prod.itemName || prod.name || 'Unnamed Item';
      const barcodeVal = prod.barcode || prod.barcodeNo || (prod.pieces && prod.pieces[0]?.barcode) || '';
      const subItemVal = prod.subItem || (typeof prod.category === 'string' ? prod.category : prod.categoryId?.name) || '';
      const designNoVal = prod.designNo || prod.sku || '';
      const itemCodeVal = prod.itemCode || prod.productCode || prod.sku || '';
      const ipnVal = prod.ipn || prod.pieces?.[0]?.ipn || '';
      const primaryColorVal = customColor || prod.primaryColor || prod.color || 'Standard';
      const secondaryColorVal = prod.secondaryColor || '';
      const sizeVal = customSize || prod.size || 'M';
      const hsnVal = prod.hsn || prod.hsnCode || prod.hsnId?.code || '';

      for (let i = 0; i < customQty; i++) {
        // If product has distinct piece uniqueCodes from available inventory, use them; otherwise generate a fresh unique code
        const pieceUniqueCode = (prod.pieces && prod.pieces[i]?.uniqueCode && !prod.pieces[i].uniqueCode.includes('undefined'))
          ? prod.pieces[i].uniqueCode
          : generateUniqueItemCode(designNoVal || itemNameVal, sizeVal, i);

        newItems.push({
          cartItemId: `cart-item-${Date.now()}-${Math.random().toString(36).substring(7)}-${i}`,
          productId: prod._id || prod.id,
          name: itemNameVal,
          itemName: itemNameVal,
          barcode: barcodeVal,
          barcodeNo: barcodeVal,
          subItem: subItemVal,
          firmName: prod.firmName || prod.company || prod.firm || (prod.pieces && prod.pieces[0]?.firmId?.name) || '',
          company: prod.company || prod.firmName || prod.firm || (prod.pieces && prod.pieces[0]?.firmId?.name) || '',
          designNo: designNoVal,
          itemCode: itemCodeVal,
          ipn: ipnVal,
          sku: prod.sku || designNoVal,
          size: sizeVal,
          color: primaryColorVal,
          primaryColor: primaryColorVal,
          secondaryColor: secondaryColorVal,
          hsn: hsnVal,
          mrp: mrpVal,
          price: sPrice,
          sellingPrice: sPrice,
          discount: Number(prod.discount) || 0,
          gstPercent: Number(prod.gstPercent) || 0,
          totalPrice: sPrice,
          salespersonId: spId,
          salespersonName: spName,
          workerId: wId,
          workerName: wName,
          quantity: 1,
          uniqueCode: pieceUniqueCode,
          hasAlteration: false,
          alterationRecord: null
        });
      }
      return [...prev, ...newItems];
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
    if (delta === -1) {
      setCart((prev) => prev.filter((_, i) => i !== idx));
    } else if (delta === 1) {
      const targetItem = cart[idx];
      if (targetItem) {
        const prodName = targetItem.name || targetItem.itemName || "This item";
        const availableStock = getLiveStock(targetItem);
        const currentInCartCount = cart.filter(i => isSameProduct(i, targetItem)).reduce((sum, item) => sum + (item.quantity || 1), 0);

        if (currentInCartCount >= availableStock) {
          alert(`Cannot add more! "${prodName}" has only ${availableStock} unit(s) in stock (${currentInCartCount} already in cart).`);
          if (onAddNotification) {
            onAddNotification(
              "Stock Limit Reached",
              `Cannot add more units of "${prodName}". Available stock: ${availableStock}.`,
              "warning"
            );
          }
          return;
        }
      }
      setCart((prev) => {
        const item = prev[idx];
        const newItem = {
          ...item,
          cartItemId: `cart-item-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          quantity: 1,
          uniqueCode: generateUniqueItemCode(item.designNo || item.itemName || 'ITM', item.size || 'FS', prev.length),
          alterationRecord: undefined,
          hasAlteration: false
        };
        return [...prev, newItem];
      });
    }
  };

  // Adjust item discount
  const handleAdjustItemDiscount = (idx, discountPct) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[idx];
      const sub = item.price * item.quantity;
      const discountAmt = Math.floor(sub * (discountPct / 100));
      const itemGst = 0;

      updated[idx] = {
        ...item,
        discount: discountPct,
        totalPrice: sub - discountAmt,
      };
      return updated;
    });
  };

  // Calculations
  const {
    subTotal,
    discountTotal,
    couponDiscount,
    gstTotal,
    grandTotal,
    appliedDiscountsList,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax,
    taxDetails
  } = React.useMemo(() => {
    let subTotal = 0;
    let discountTotal = 0; // Item level discounts

    cart.forEach((item) => {
      const itemPrice = item.sellingPrice || item.price || 0;
      const itemDisc = item.customDiscount || item.discount || 0;
      const sub = itemPrice * item.quantity;
      const disc = Math.floor(sub * (itemDisc / 100));

      subTotal += sub;
      discountTotal += disc;
    });

    const activeOffers = discountRules.filter(r => {
      if (r.status !== 'Active') return false;
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      if (new Date(r.endDate) < new Date() && new Date(r.endDate).setHours(23, 59, 59, 999) < new Date()) return false;
      return true;
    });

    let totalRuleDiscount = 0;
    let appliedDiscountsList = [];

    activeOffers.forEach(r => {
      const rId = r._id || r.id;
      const isManual = manualDiscountIds.includes(rId);
      const isAutoType = ['Automatic', 'Product', 'Category', 'Brand'].includes(r.offerType);

      // If it's manual, or if it's auto and not rejected
      if (isManual || (isAutoType && !rejectedAutoDiscountIds.includes(rId))) {
        let disc = 0;

        if (r.offerType === 'Automatic' || r.offerType === 'Coupon' || r.offerType === 'Flat') {
          if (subTotal >= (r.minBillAmount || 0)) {
            disc = r.discountType === 'Flat' ? r.discountValue : Math.floor(subTotal * (r.discountValue / 100));
          }
        } else if (r.offerType === 'Product') {
          cart.forEach(item => {
            const matchedProd = products.find(p => p._id === item.productId || p.id === item.productId);
            const match = (r.applicableProducts || []).some(p =>
              p.toLowerCase().trim() === (item.productId || '').toLowerCase().trim() ||
              p.toLowerCase().trim() === (item.name || '').toLowerCase().trim() ||
              p.toLowerCase().trim() === (item.sku || '').toLowerCase().trim() ||
              (matchedProd && matchedProd.productCode && p.toLowerCase().trim() === matchedProd.productCode.toLowerCase().trim())
            );
            if (match) {
              const itemSub = (item.sellingPrice || item.price || 0) * item.quantity;
              disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : Math.floor(itemSub * (r.discountValue / 100));
            }
          });
        } else if (r.offerType === 'Category') {
          cart.forEach(item => {
            const matchedProd = products.find(p => p._id === item.productId || p.id === item.productId);
            if (matchedProd && matchedProd.category) {
              const match = (r.applicableCategories || []).some(c => c.toLowerCase().trim() === matchedProd.category.toLowerCase().trim());
              if (match) {
                const itemSub = (item.sellingPrice || item.price || 0) * item.quantity;
                disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : Math.floor(itemSub * (r.discountValue / 100));
              }
            }
          });
        } else if (r.offerType === 'Brand') {
          cart.forEach(item => {
            const matchedProd = products.find(p => p._id === item.productId || p.id === item.productId);
            if (matchedProd && matchedProd.brand) {
              const match = (r.applicableBrands || []).some(b => b.toLowerCase().trim() === matchedProd.brand.toLowerCase().trim());
              if (match) {
                const itemSub = (item.sellingPrice || item.price || 0) * item.quantity;
                disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : Math.floor(itemSub * (r.discountValue / 100));
              }
            }
          });
        }

        if (disc > 0) {
          totalRuleDiscount += disc;
          appliedDiscountsList.push({ id: rId, name: r.offerName, amount: disc, type: isManual ? 'Manual' : 'Auto' });
        }
      }
    });

    // Loyalty Points Logic
    if (activeCustomer && activeCustomer.id !== "c-walkin" && !rejectedAutoDiscountIds.includes("loyalty")) {
      const eligibleLoyaltyRules = discountRules.filter(r =>
        r.offerType === 'LoyaltyRule' && r.status === 'Active' &&
        (activeCustomer.loyaltyPoints || 0) >= r.requiredLoyaltyPoints
      );
      if (eligibleLoyaltyRules.length > 0) {
        const bestRule = eligibleLoyaltyRules.reduce((best, current) =>
          current.requiredLoyaltyPoints > best.requiredLoyaltyPoints ? current : best
          , eligibleLoyaltyRules[0]);
        const lDisc = bestRule.discountType === 'Flat' ? bestRule.discountValue : Math.floor(subTotal * (bestRule.discountValue / 100));
        if (lDisc > 0) {
          totalRuleDiscount += lDisc;
          appliedDiscountsList.push({ id: 'loyalty', name: `Loyalty (${bestRule.requiredLoyaltyPoints} pts)`, amount: lDisc, type: 'Auto' });
        }
      }
    }

    // Legacy coupon codes
    let couponDiscount = 0;
    if (couponCode === "WINTER20") {
      couponDiscount = Math.floor(subTotal * 0.2);
    } else if (couponCode === "LOYALTY50") {
      couponDiscount = 500;
    } else if (couponCode === "FESTIVE15") {
      couponDiscount = Math.floor(subTotal * 0.15);
    }
    if (couponDiscount > 0) {
      totalRuleDiscount += couponDiscount;
      appliedDiscountsList.push({ id: 'legacy', name: couponCode, amount: couponDiscount, type: 'Legacy' });
    }

    const totalOverallDiscount = discountTotal + totalRuleDiscount;
    let netBillAmount = Math.max(0, subTotal - totalOverallDiscount);

    if (billAdjustment && billAdjustment.amount > 0) {
      if (billAdjustment.operation === 'Charge') {
        netBillAmount += billAdjustment.amount;
      } else if (billAdjustment.operation === 'Discount') {
        netBillAmount = Math.max(0, netBillAmount - billAdjustment.amount);
      }
    }

    let computedTaxableAmount = 0;
    let computedCgstAmount = 0;
    let computedSgstAmount = 0;
    let computedIgstAmount = 0;
    let computedTotalTax = 0;

    const gRate = Number(gstRateInput) || 0;
    const cRate = Number(cgstRateInput) || 0;
    const sRate = Number(sgstRateInput) || 0;
    const iRate = Number(igstRateInput) || 0;

    const gstSummaryMap = new Map();
    const itemNetAmounts = cart.map((item) => {
      const itemPrice = Number(item.sellingPrice || item.price || 0);
      const itemDiscount = Number(item.customDiscount || item.discount || 0);
      return Math.max(0, itemPrice * Number(item.quantity || 1) - Math.floor(itemPrice * Number(item.quantity || 1) * itemDiscount / 100));
    });
    const totalItemNet = itemNetAmounts.reduce((sum, amount) => sum + amount, 0);
    const billAdjustmentAmount = Number(billAdjustment?.amount || 0);
    cart.forEach((item, index) => {
      const itemNet = Math.max(0, itemNetAmounts[index] + (
        billAdjustmentAmount && totalItemNet > 0
          ? (billAdjustment.operation === 'Charge' ? 1 : -1) * billAdjustmentAmount * (itemNetAmounts[index] / totalItemNet)
          : 0
      ));
      const hasItemSlab = item.gstPercent !== undefined && item.gstPercent !== null && item.gstPercent !== '';
      const slab = Number(hasItemSlab ? item.gstPercent : (isGstApplied ? gRate : 0)) || 0;
      if (!isGstApplied || slab <= 0 || itemNet <= 0) return;
      const tax = parseFloat((itemNet * slab / 100).toFixed(2));
      const current = gstSummaryMap.get(slab) || { gstPercent: slab, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
      current.taxableAmount += itemNet;
      current.totalTax += tax;
      if (gstTaxType === 'INTER') {
        current.igst += tax;
      } else {
        const configuredSplit = cRate + sRate;
        const cgstShare = configuredSplit > 0 ? cRate / configuredSplit : 0.5;
        const taxCents = Math.round(tax * 100);
        const cgstCents = Math.ceil(taxCents * cgstShare);
        current.cgst += cgstCents / 100;
        current.sgst += (taxCents - cgstCents) / 100;
      }
      gstSummaryMap.set(slab, current);
    });
    const computedTaxBreakdown = Array.from(gstSummaryMap.values()).map((row) => ({
      ...row,
      taxableAmount: parseFloat(row.taxableAmount.toFixed(2)),
      cgst: parseFloat(row.cgst.toFixed(2)),
      sgst: parseFloat(row.sgst.toFixed(2)),
      igst: parseFloat(row.igst.toFixed(2)),
      totalTax: parseFloat(row.totalTax.toFixed(2))
    })).sort((a, b) => a.gstPercent - b.gstPercent);
    computedTaxableAmount = computedTaxBreakdown.reduce((sum, row) => sum + row.taxableAmount, 0);
    computedCgstAmount = computedTaxBreakdown.reduce((sum, row) => sum + row.cgst, 0);
    computedSgstAmount = computedTaxBreakdown.reduce((sum, row) => sum + row.sgst, 0);
    computedIgstAmount = computedTaxBreakdown.reduce((sum, row) => sum + row.igst, 0);
    computedTotalTax = computedTaxBreakdown.reduce((sum, row) => sum + row.totalTax, 0);

    // Grand total = net amount + GST tax (if applied)
    const grandTotal = parseFloat((netBillAmount + computedTotalTax).toFixed(2));

    const taxDetails = {
      isApplied: isGstApplied,
      gstRate: gRate,
      cgstRate: cRate,
      sgstRate: sRate,
      igstRate: iRate,
      taxableAmount: isGstApplied ? computedTaxableAmount : 0,
      cgstAmount: isGstApplied ? computedCgstAmount : 0,
      sgstAmount: isGstApplied ? computedSgstAmount : 0,
      igstAmount: isGstApplied ? computedIgstAmount : 0,
      totalTax: isGstApplied ? computedTotalTax : 0
      , taxBreakdown: isGstApplied ? computedTaxBreakdown : []
    };

    return {
      subTotal,
      discountTotal: totalOverallDiscount,
      couponDiscount,
      gstTotal: isGstApplied ? computedTotalTax : 0,
      grandTotal,
      netBillAmount,
      appliedDiscountsList,
      taxableAmount: isGstApplied ? computedTaxableAmount : 0,
      cgstAmount: isGstApplied ? computedCgstAmount : 0,
      sgstAmount: isGstApplied ? computedSgstAmount : 0,
      igstAmount: isGstApplied ? computedIgstAmount : 0,
      totalTax: isGstApplied ? computedTotalTax : 0,
      taxBreakdown: isGstApplied ? computedTaxBreakdown : [],
      taxDetails
    };
  }, [cart, couponCode, manualDiscountIds, rejectedAutoDiscountIds, discountRules, products, activeCustomer, billAdjustment, isGstApplied, gstRateInput, cgstRateInput, sgstRateInput, igstRateInput]);

  const handleOpenPaymentFlow = async () => {
    if (cart.length === 0) {
      onAddNotification(
        "POS Checkout Failed",
        "Cannot open payment for an empty cart.",
        "danger"
      );
      return;
    }

    setPaymentLoaderMessage("Preparing Payment Details... Please wait.");
    setIsPreparingPayment(true);

    try {
      // Refresh discounts & active rules to ensure latest calculation
      await fetchActiveRules().catch(() => { });

      const totalAdvance = (activeCustomer?.walletAdvance || 0) + (activeCustomer?.loyaltyPoints || 0);

      // Brief async pause (300ms) to ensure state synchronization & display loader
      await new Promise(resolve => setTimeout(resolve, 300));

      if (activeCustomer && activeCustomer.id !== "c-walkin" && totalAdvance > 0) {
        // If this is the FIRST time opening the payment flow and they haven't explicitly set states yet
        if (!allocatedFullPaymentMode && Object.keys(confirmedPartPaymentModes).every(k => !confirmedPartPaymentModes[k])) {
          setShowAdvancePromptModal(true);
        } else {
          setShowPaymentModal(true);
        }
      } else {
        setShowPaymentModal(true);
      }
    } catch (err) {
      console.error("Error opening payment flow:", err);
    } finally {
      setIsPreparingPayment(false);
    }
  };

  const handleRemoveCategoryAdvance = (category) => {
    if (category === "loyalty") {
      setPartPaymentAmounts((p) => ({
        ...p,
        "Points Redeem": ""
      }));
    } else if (category === "all") {
      setPartPaymentAmounts((p) => ({
        ...p,
        Advance: "",
        "Points Redeem": ""
      }));
    } else {
      setPartPaymentAmounts((p) => ({
        ...p,
        Advance: ""
      }));
    }
  };

  const handleApplyCategoryAdvance = async (category) => {
    setShowAdvancePromptModal(false);
    setPaymentLoaderMessage("Preparing Payment Details... Please wait.");
    setIsPreparingPayment(true);

    try {
      const wallet = activeCustomer?.walletAdvance || 0;
      const loyalty = activeCustomer?.loyaltyPoints || 0;
      const history = activeCustomer?.advanceHistory || [];

      const returnAmt = history
        .filter(h => h.reason && h.reason.toLowerCase().includes('return'))
        .reduce((acc, h) => acc + (h.amount || 0), 0);
      const overpaidAmt = history
        .filter(h => h.reason && h.reason.toLowerCase().includes('overpayment'))
        .reduce((acc, h) => acc + (h.amount || 0), 0);
      const prepaidFromHistory = history
        .filter(h => h.reason && (h.reason.toLowerCase().includes('prepaid') || h.reason.toLowerCase().includes('advance') || h.reason.toLowerCase().includes('deposit')))
        .reduce((acc, h) => acc + (h.amount || 0), 0);

      const prepaidAmt = activeCustomer?.prepaidAdvance || activeCustomer?.prepaidAmount || prepaidFromHistory || Math.max(0, wallet - overpaidAmt - returnAmt);
      const fallbackOverpaid = overpaidAmt > 0 ? overpaidAmt : (history.length === 0 && prepaidAmt === 0 ? wallet : 0);

      setPaymentType("Part Payment");

      // Compute new amounts (do NOT spread prev — start fresh to avoid stale Card/UPI values)
      let newPointsRedeem = 0;
      let newAdvance = 0;

      if (category === "loyalty") {
        const applyLoyalty = Math.min(loyalty, grandTotal);
        newPointsRedeem = applyLoyalty;
      } else {
        let targetCategoryBalance = 0;
        if (category === "overpaid") targetCategoryBalance = fallbackOverpaid;
        else if (category === "return") targetCategoryBalance = returnAmt;
        else if (category === "prepaid") targetCategoryBalance = prepaidAmt;
        else if (category === "all") targetCategoryBalance = wallet;

        newAdvance = Math.min(targetCategoryBalance, grandTotal);
      }

      // Reset all part-payment amounts to avoid stale values from previous interactions
      const freshAmounts = {
        Card: '', UPI: '', Advance: newAdvance > 0 ? newAdvance.toString() : '',
        Due: '', 'Gift Voucher': '', 'Points Redeem': newPointsRedeem > 0 ? newPointsRedeem.toString() : '', Other: ''
      };
      setPartPaymentAmounts(freshAmounts);

      // Auto-confirm the modes that were just set so they appear in compiledTransactions
      const autoConfirmed = {};
      if (newPointsRedeem > 0) autoConfirmed['Points Redeem'] = true;
      if (newAdvance > 0) autoConfirmed['Advance'] = true;

      await new Promise(resolve => setTimeout(resolve, 300));
      setAllocatedFullPaymentMode(null);
      setConfirmedPartPaymentModes(autoConfirmed);
      setShowPaymentModal(true);
    } catch (err) {
      console.error("Error applying category advance:", err);
    } finally {
      setIsPreparingPayment(false);
    }
  };

  const handleAcceptAdvance = async (accept) => {
    if (accept) {
      await handleApplyCategoryAdvance("all");
    } else {
      setShowAdvancePromptModal(false);
      setPaymentLoaderMessage("Preparing Payment Details... Please wait.");
      setIsPreparingPayment(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        setShowPaymentModal(true);
      } finally {
        setIsPreparingPayment(false);
      }
    }
  };

  const handleSaveOverpaidAdvance = async () => {
    const saveAmount = Number(overpaidModalData.manualAmount || 0);
    if (saveAmount > 0) {
      if (selectedCustomerId && selectedCustomerId.length === 24) {
        try {
          const currentWallet = Number(activeCustomer?.walletAdvance || 0);
          const currentPrepaid = Number(activeCustomer?.prepaidAdvance || 0);
          const newWallet = currentWallet + saveAmount;
          const newPrepaid = currentPrepaid + saveAmount;
          const newHistory = [
            ...(activeCustomer?.advanceHistory || []),
            {
              amount: saveAmount,
              reason: overpaidModalData.reason || `Overpaid excess saved as advance from bill`,
              date: new Date()
            }
          ];
          await api.put(`/customers/${selectedCustomerId}`, {
            walletAdvance: newWallet,
            prepaidAdvance: newPrepaid,
            advanceHistory: newHistory
          });
          onAddNotification(
            "Overpaid Advance Saved",
            `₹${saveAmount.toLocaleString('en-IN')} saved to ${activeCustomer.name}'s wallet as Future Advance.`,
            "success"
          );
        } catch (err) {
          console.error("Failed to save overpaid advance:", err);
          onAddNotification("Error", "Failed to save overpaid advance: " + err.message, "error");
        }
      } else {
        onAddNotification(
          "Notice",
          `₹${saveAmount.toLocaleString('en-IN')} excess payment logged.`,
          "info"
        );
      }
    }
    setShowOverpaymentModal(false);
    handleCheckoutSubmit(false, true, true);
  };

  // Handle checkout
  const handleCheckoutSubmit = async (overrideCustomerDue = false, skipBillPreview = false, skipOverpaymentPrompt = false, forcedCustomer = null) => {
    if (isGeneratingBill) return false;
    setIsGeneratingBill(true);

    try {
      if (cart.length === 0) {
        onAddNotification(
          "POS Checkout Failed",
          "Cannot compile an empty cart.",
          "danger",
        );
        return false;
      }

      const currentActiveCustomer = forcedCustomer || activeCustomer;

      const computedDueAmount = paymentType === "Full Payment"
        ? (paymentMethod === "Due" ? grandTotal : 0)
        : (Number(partPaymentAmounts["Due"]) || 0);

      const isCustomerMissing = (!selectedCustomerId && !forcedCustomer) || currentActiveCustomer.id === "c-walkin" || !currentActiveCustomer.name;

      const requiresCustomerForAlteration = cart.some(item => item.hasAlteration);
      if (requiresCustomerForAlteration && isCustomerMissing) {
        onAddNotification(
          "Customer Details Required",
          "Customer details are mandatory because this bill includes an item requiring alteration.",
          "warning"
        );
        setShowDueCustomerModal(true);
        return false;
      }

      if (computedDueAmount > 0 && isCustomerMissing && overrideCustomerDue !== true) {
        setShowDueCustomerModal(true);
        return false;
      }

      // Overpayment Logic
      const cashTotal = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
      let computedAmountPaid = grandTotal;
      let advanceApplied = 0;
      let loyaltyPointsUsed = 0;

      if (paymentType === "Part Payment") {
        // Only count confirmed payment modes (excluding Due which is the unpaid portion)
        computedAmountPaid = cashTotal + ["Card", "UPI", "Gift Voucher", "Other"].reduce((acc, m) =>
          acc + (confirmedPartPaymentModes[m] ? (Number(partPaymentAmounts[m]) || 0) : 0), 0);
        advanceApplied = confirmedPartPaymentModes["Advance"] ? (Number(partPaymentAmounts["Advance"]) || 0) : 0;
        loyaltyPointsUsed = confirmedPartPaymentModes["Points Redeem"] ? (Number(partPaymentAmounts["Points Redeem"]) || 0) : 0;
      } else if (paymentMethod === "Cash") {
        computedAmountPaid = cashTotal > 0 ? cashTotal : grandTotal;
      } else if (paymentMethod === "Credit" || paymentMethod === "Due") {
        computedAmountPaid = 0;
      } else if (paymentMethod === "Advance") {
        computedAmountPaid = 0;
        advanceApplied = grandTotal;
      } else if (paymentMethod === "Points Redeem") {
        computedAmountPaid = 0;
        loyaltyPointsUsed = grandTotal;
      }

      const effectiveTotalPaid = computedAmountPaid + advanceApplied + loyaltyPointsUsed;
      if (effectiveTotalPaid > grandTotal && isCustomerMissing && overrideCustomerDue !== true) {
        setShowDueCustomerModal(true);
        onAddNotification(
          "Customer Details Required",
          "Customer details are required to save the overpaid advance amount to their wallet.",
          "warning"
        );
        return false;
      }

      if (effectiveTotalPaid > grandTotal && !skipOverpaymentPrompt) {
        const excess = effectiveTotalPaid - grandTotal;
        setOverpaidModalData({
          grandTotal,
          paidTotal: effectiveTotalPaid,
          excessAmount: excess,
          manualAmount: excess,
          reason: `Overpaid excess saved as advance from bill`
        });
        setShowOverpaymentModal(true);
        setIsGeneratingBill(false);
        return false;
      }

      const cashier = employees.find((e) => e.id === cashierId) || employees[0] || { id: "e-default", name: "Default Cashier" };

      // Create Invoice object
      const selectedSalesperson = staffList.find((e) => (e._id || e.id) === salespersonId);
      const finalEmployeeId = selectedSalesperson ? (selectedSalesperson._id || selectedSalesperson.id) : cashier.id;

      const compiledTransactions = paymentType === "Part Payment"
        ? [
          ...(cashTotal > 0 ? [{ mode: "CASH", amount: cashTotal }] : []),
          ...["Card", "UPI", "Advance", "Due", "Gift Voucher", "Points Redeem", "Other"]
            .filter(m => confirmedPartPaymentModes[m] && Number(partPaymentAmounts[m]) > 0)
            .map(m => {
              let mode = m.toUpperCase().replace(/\s+/g, '_');
              if (mode === 'POINTS_REDEEM') mode = 'POINTS';
              return { mode, amount: Number(partPaymentAmounts[m]) };
            })
        ]
        : [
          {
            mode: allocatedFullPaymentMode ? (allocatedFullPaymentMode.toUpperCase().replace(/\s+/g, '_') === 'POINTS_REDEEM' ? 'POINTS' : allocatedFullPaymentMode.toUpperCase().replace(/\s+/g, '_')) : 'CASH',
            amount: grandTotal
          }
        ];

      const displayPaymentMode = paymentType === "Part Payment"
        ? (compiledTransactions.length > 1 ? compiledTransactions.map(t => t.mode).join(' + ') : (compiledTransactions[0]?.mode || 'Split'))
        : paymentMethod;

      // Build taxBreakdown for the invoice
      const taxBreakdown = isGstApplied && totalTax > 0
        ? (taxDetails.taxBreakdown || [])
        : [];

      const newInvoice = {
        invoiceNo: `INV-${Date.now().toString().substring(5)}-${Math.floor(Math.random() * 1000)}`,
        date: new Date().toISOString(),
        customerId: ((currentActiveCustomer.id || currentActiveCustomer._id) === "c-walkin" || currentActiveCustomer.phone === "") ? null : (currentActiveCustomer.id || currentActiveCustomer._id),
        customerName: currentActiveCustomer.name === "Walk-in Customer" ? "Walk-in Customer" : currentActiveCustomer.name,
        customerPhone: (currentActiveCustomer.phone === "" || (currentActiveCustomer.id || currentActiveCustomer._id) === "c-walkin") ? "" : currentActiveCustomer.phone,
        items: [...cart],
        subTotal,
        discountTotal,
        couponCode: couponCode ? couponCode : undefined,
        couponDiscount,
        gstTotal,
        grandTotal,
        isGstApplied,
        gstRate: Number(gstRateInput) || 0,
        cgstRate: Number(cgstRateInput) || 0,
        sgstRate: Number(sgstRateInput) || 0,
        igstRate: Number(igstRateInput) || 0,
        taxableAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalTax,
        taxDetails,
        taxBreakdown,
        paymentMethod: displayPaymentMode,
        paymentTransactions: compiledTransactions,
        splitPayments: compiledTransactions.map(t => ({ method: t.mode, amount: t.amount })),
        amountPaid: computedAmountPaid,
        advanceApplied,
        loyaltyPointsUsed,
        status: paymentMethod === "Credit" || computedDueAmount >= grandTotal ? "Unpaid" : "Paid",
        employeeId: finalEmployeeId && finalEmployeeId.length === 24 ? finalEmployeeId : undefined,
        salesmanId: finalEmployeeId && finalEmployeeId.length === 24 ? finalEmployeeId : undefined,
        employeeName: cashier.name,
        salespersonName: selectedSalesperson ? selectedSalesperson.name : "Admin (Self)",
        billAdjustment: billAdjustment && billAdjustment.amount > 0 ? billAdjustment : undefined,
        specialDiscount: billAdjustment && billAdjustment.amount > 0 ? billAdjustment.amount : 0,
        notes: [otherBillDetails.transporter && `Transporter: ${otherBillDetails.transporter}`, otherBillDetails.trackingNo && `LR: ${otherBillDetails.trackingNo}`, otherBillDetails.shippingAddress && `Shipping: ${otherBillDetails.shippingAddress}`].filter(Boolean).join(' | ') || undefined,
        shippingDetails: (otherBillDetails.transporter || otherBillDetails.trackingNo || otherBillDetails.shippingAddress) ? otherBillDetails : undefined,
      };

      // Automatically log any outstanding due/credit balance to Customer's ledger
      const totalPaidAmt = compiledTransactions.reduce((acc, t) => acc + (t.mode === 'DUE' ? 0 : t.amount), 0);
      const outstandingDueAmt = Math.max(0, Number((grandTotal - totalPaidAmt).toFixed(2)));
      if (outstandingDueAmt > 0 && selectedCustomerId && onUpdateCustomerBalance) {
        onUpdateCustomerBalance(selectedCustomerId, outstandingDueAmt);
        onAddNotification(
          "Credit/Due Balance Logged",
          `₹${outstandingDueAmt.toLocaleString('en-IN')} logged to ${currentActiveCustomer.name}'s credit ledger.`,
          "info"
        );
      }

      const loyaltyOffer = selectedLoyaltyRuleId ? discountRules.find(r => (r._id || r.id) === selectedLoyaltyRuleId) : null;
      // Process Loyalty point deductions
      if (loyaltyOffer && selectedCustomerId && selectedCustomerId.length === 24) {
        try {
          const token = localStorage.getItem("token");
          const nextPoints = Math.max(0, (activeCustomer.loyaltyPoints || 0) - loyaltyOffer.requiredLoyaltyPoints);
          await api.put(`/customers/${selectedCustomerId}`, { loyaltyPoints: nextPoints });
          onAddNotification(
            "Loyalty Redeemed",
            `Redeemed ${loyaltyOffer.requiredLoyaltyPoints} points for discount.`,
            "success"
          );
        } catch (err) {
          console.error("Failed to update loyalty balance:", err);
        }
      }

      // Trigger state callbacks — onAddInvoice returns the saved invoice object from MongoDB (or null on error)
      const savedInvoice = await onAddInvoice(newInvoice);

      if (!savedInvoice) {
        setIsPreparingPayment(false);
        return false;
      }

      // Merge cart item alteration metadata onto completed invoice items so receipt ALWAYS displays full alteration details!
      // IMPORTANT: GST fields must be preserved from newInvoice because savedInvoice (from backend)
      // may not return/store these frontend-computed fields, causing them to be undefined/overwritten.
      const mergedInvoice = {
        ...newInvoice,
        ...(savedInvoice || {}),
        // Always preserve GST/tax fields from newInvoice (source of truth for tax calculation)
        isGstApplied: newInvoice.isGstApplied,
        gstRate: newInvoice.gstRate,
        cgstRate: newInvoice.cgstRate,
        sgstRate: newInvoice.sgstRate,
        igstRate: newInvoice.igstRate,
        taxableAmount: newInvoice.taxableAmount,
        cgstAmount: newInvoice.cgstAmount,
        sgstAmount: newInvoice.sgstAmount,
        igstAmount: newInvoice.igstAmount,
        totalTax: newInvoice.totalTax,
        gstTotal: newInvoice.gstTotal,
        taxDetails: newInvoice.taxDetails,
        taxBreakdown: newInvoice.taxBreakdown,
        grandTotal: newInvoice.grandTotal,
        subTotal: newInvoice.subTotal,
        discountTotal: newInvoice.discountTotal,
        paymentMethod: newInvoice.paymentMethod || savedInvoice?.paymentMethod || "Cash",
        splitPayments: newInvoice.splitPayments || savedInvoice?.splitPayments,
        paymentTransactions: newInvoice.paymentTransactions || savedInvoice?.paymentTransactions,
        advanceApplied: newInvoice.advanceApplied || savedInvoice?.advanceApplied || 0,
        items: ((savedInvoice && savedInvoice.items) || newInvoice.items).map((savedItem, i) => {
          const originalItem = newInvoice.items[i] || savedItem;
          return {
            ...savedItem,
            gstPercent: originalItem.gstPercent ?? savedItem.gstPercent ?? 0,
            hasAlteration: originalItem.hasAlteration || savedItem.hasAlteration || Boolean(originalItem.alterationRecord),
            alterationRecord: originalItem.alterationRecord || savedItem.alterationRecord
          };
        })
      };

      setCompletedInvoice(mergedInvoice);

      // ← Immediately add to local invoiceList so "Previous Bill" shows the latest bill
      //    without waiting for the parent component to re-render with a fresh invoices prop
      setInvoiceList(prev => {
        const already = (prev || []).some(inv => (inv._id || inv.invoiceNo) === (mergedInvoice._id || mergedInvoice.invoiceNo));
        return already ? prev : [...(prev || []), mergedInvoice];
      });

      handleClearBillContext("Invoice Compiled Successfully", `Issued receipt ${newInvoice.invoiceNo} for ₹${newInvoice.grandTotal.toLocaleString()}`);

      setCouponCode("");
      setCustomerSearch("");
      setOtherBillDetails({ transporter: '', trackingNo: '', shippingAddress: '' });

      setSelectedLoyaltyRuleId("");
      setPaymentMethod("Cash");
      setSplitCash(0);
      setSplitCard(0);
      setSplitUPI(0);
      setSalespersonId("");
      setBillAdjustment({
        type: 'Amount',
        operation: 'Discount',
        value: '',
        amount: 0,
        reason: '',
        isApproved: false
      });
      setPaymentType('Full Payment');
      setPartPaymentAmounts({ Cash: 0, Card: 0, UPI: 0, Cheque: 0, Wallet: 0, Due: 0 });
      setManualDiscountIds([]);
      setRejectedAutoDiscountIds([]);
      setProductSearch("");
      setCustomerSearchQuery("");
      setCouponCode("");
      setRightColumnTab("catalog");

      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);

      if (!skipBillPreview) {
        setShowBillPreviewInvoice(mergedInvoice);
      }

      // ── Automatic WhatsApp Dispatch (fire-and-forget, never blocks checkout) ──
      const custPhoneDigits = (currentActiveCustomer.phone || '').replace(/\D/g, '');
      if (savedInvoice && savedInvoice._id && onRetryWhatsApp && custPhoneDigits.length >= 10) {
        setWhatsappDispatchState('sending');
        setWhatsappDispatchId(savedInvoice._id);
        onRetryWhatsApp(savedInvoice._id)
          .then(ok => setWhatsappDispatchState(ok ? 'success' : 'failed'))
          .catch(err => {
            console.warn('[BillingPOSView] WhatsApp dispatch notice:', err?.message);
            setWhatsappDispatchState('failed');
          });
      } else {
        setWhatsappDispatchState('idle');
      }

      // ── Post Sales Service (PSS) Prompt Flow ──
      // Trigger PSS Question Modal AFTER normal bill is successfully generated & saved!
      setPssInvoice(mergedInvoice);
      setShowPSSQuestionPromptModal(true);

      return mergedInvoice;
    } finally {
      setIsGeneratingBill(false);
    }
  };

  // Add new customer local submit
  const [showDueCustNameSuggestions, setShowDueCustNameSuggestions] = useState(false);
  const [showDueCustPhoneSuggestions, setShowDueCustPhoneSuggestions] = useState(false);

  const filteredDueCustomersByName = (customers || []).filter(c => c.name?.toLowerCase().includes(dueCustName.toLowerCase()) && dueCustName.trim() !== "");
  const filteredDueCustomersByPhone = (customers || []).filter(c => c.phone?.includes(dueCustPhone) && dueCustPhone.trim() !== "");

  const handleSelectDueCustomer = (cust) => {
    setDueCustName(cust.name);
    setDueCustPhone(cust.phone);
    setShowDueCustNameSuggestions(false);
    setShowDueCustPhoneSuggestions(false);
  };

  const handleDueCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!dueCustName || !dueCustPhone) return;

    // Check if customer already exists by phone
    const existingCustomer = (customers || []).find(c => c.phone === dueCustPhone);
    let targetCust;

    if (existingCustomer) {
      targetCust = existingCustomer;
    } else {
      try {
        const custRes = await api.post('/customers', { name: dueCustName, phone: dueCustPhone });
        targetCust = custRes.data.data;
        if (onAddCustomer) {
          onAddCustomer(targetCust);
        } else {
          (customers || []).push(targetCust);
        }
      } catch (err) {
        if (onAddNotification) onAddNotification("Error", "Failed to create customer", "danger");
        return;
      }
    }

    setSelectedCustomerId(targetCust.id || targetCust._id);
    setDueCustName("");
    setDueCustPhone("");
    setShowDueCustomerModal(false);

    // Call checkout directly with forced customer to bypass closure stale state
    handleCheckoutSubmit(true, false, false, targetCust);
  };

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    const newId = `c-${(customers || []).length + 1}`;
    const newCust = {
      id: newId,
      name: newCustName,
      phone: newCustPhone,
      outstandingBalance: 0,
      membership: "Bronze",
      walletAdvance: 0,
      loyaltyPoints: 10,
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
      "Advance amount Issued",
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
    let refundTotal = selectedInvoiceForReturn.items
      .filter((item) => returnedItemIds.includes(item.productId))
      .reduce((sum, item) => sum + item.totalPrice, 0);

    if (selectedInvoiceForReturn.billAdjustment && selectedInvoiceForReturn.billAdjustment.amount > 0) {
      const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * i.quantity)), 0) || 1;
      const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
      const proportionalAdjustment = refundTotal * adjustmentRatio;

      if (selectedInvoiceForReturn.billAdjustment.operation === 'Discount') {
        refundTotal -= proportionalAdjustment;
      } else if (selectedInvoiceForReturn.billAdjustment.operation === 'Charge') {
        refundTotal += proportionalAdjustment;
      }
      refundTotal = Math.floor(refundTotal);
    }

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

  const handleOpenDraftPreview = () => {
    if (cart.length === 0) {
      onAddNotification(
        "POS Preview Failed",
        "Cannot preview an empty cart.",
        "danger",
      );
      return;
    }
    const cashier = employees.find((e) => e.id === cashierId) || employees[0] || { id: "e-default", name: "Default Cashier" };
    const selectedSalesperson = staffList.find((e) => (e._id || e.id) === salespersonId);
    const finalEmployeeId = selectedSalesperson ? (selectedSalesperson._id || selectedSalesperson.id) : cashier.id;

    const cashTotal = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
    const compiledTransactions = paymentType === "Part Payment"
      ? [
        ...(cashTotal > 0 ? [{ mode: "CASH", amount: cashTotal }] : []),
        ...["Card", "UPI", "Advance", "Due", "Gift Voucher", "Points Redeem", "Other"]
          .filter(m => confirmedPartPaymentModes[m] && Number(partPaymentAmounts[m]) > 0)
          .map(m => {
            let mode = m.toUpperCase().replace(/\s+/g, '_');
            if (mode === 'POINTS_REDEEM') mode = 'POINTS';
            return { mode, amount: Number(partPaymentAmounts[m]) };
          })
      ]
      : [
        {
          mode: allocatedFullPaymentMode ? (allocatedFullPaymentMode.toUpperCase().replace(/\s+/g, '_') === 'POINTS_REDEEM' ? 'POINTS' : allocatedFullPaymentMode.toUpperCase().replace(/\s+/g, '_')) : 'CASH',
          amount: grandTotal
        }
      ];

    const displayPaymentMode = paymentType === "Part Payment"
      ? (compiledTransactions.length > 1 ? compiledTransactions.map(t => t.mode).join(' + ') : (compiledTransactions[0]?.mode || 'SPLIT'))
      : (allocatedFullPaymentMode ? allocatedFullPaymentMode.toUpperCase().replace(/\s+/g, '_') : 'CASH');

    const previewInv = {
      invoiceNo: `INV-TEMP-${Date.now().toString().substring(6)}`,
      date: new Date().toISOString(),
      customerId: ((activeCustomer.id || activeCustomer._id) === "c-walkin" || activeCustomer.phone === "") ? null : (activeCustomer.id || activeCustomer._id),
      customerName: activeCustomer.name === "Walk-in Customer" ? "Walk-in Customer" : activeCustomer.name,
      customerPhone: (activeCustomer.phone === "N/A" || activeCustomer.phone === "" || (activeCustomer.id || activeCustomer._id) === "c-walkin") ? "" : activeCustomer.phone,
      items: [...cart],
      subTotal,
      discountTotal,
      couponCode: couponCode ? couponCode : undefined,
      couponDiscount,
      gstTotal,
      grandTotal,
      isGstApplied,
      gstRate: isGstApplied ? (Number(gstRateInput) || 0) : 0,
      cgstRate: isGstApplied ? (Number(cgstRateInput) || 0) : 0,
      sgstRate: isGstApplied ? (Number(sgstRateInput) || 0) : 0,
      igstRate: isGstApplied ? (Number(igstRateInput) || 0) : 0,
      taxableAmount: isGstApplied ? taxableAmount : 0,
      cgstAmount: isGstApplied ? cgstAmount : 0,
      sgstAmount: isGstApplied ? sgstAmount : 0,
      igstAmount: isGstApplied ? igstAmount : 0,
      totalTax: isGstApplied ? totalTax : 0,
      taxDetails,
      taxBreakdown: isGstApplied && totalTax > 0 ? (taxDetails.taxBreakdown || []) : [],
      paymentMethod: displayPaymentMode,
      paymentMode: displayPaymentMode,
      transactions: compiledTransactions,
      amountPaid: displayPaymentMode === "DUE" ? 0 : grandTotal,
      status: displayPaymentMode === "DUE" ? "Unpaid" : "Paid",
      employeeId: finalEmployeeId && finalEmployeeId.length === 24 ? finalEmployeeId : undefined,
      employeeName: cashier.name,
      salespersonName: selectedSalesperson ? selectedSalesperson.name : "Admin (Self)",
      customer: activeCustomer,
      loyaltyPointsRedeemed: Number(partPaymentAmounts["Points Redeem"]) || 0,
      loyaltyPointsUsed: Number(partPaymentAmounts["Points Redeem"]) || 0,
      loyaltyPointsEarned: (activeCustomer && (activeCustomer.id || activeCustomer._id) !== "c-walkin") ? Math.floor(grandTotal / 100) : 0,
      splitPayments: compiledTransactions.map(t => ({ method: t.mode, amount: t.amount })),
      specialDiscount: billAdjustment && billAdjustment.amount > 0 ? billAdjustment.amount : 0,
      billAdjustment: billAdjustment && billAdjustment.amount > 0 ? billAdjustment : undefined,
      isDraftPreview: true,
      notes: [otherBillDetails.transporter && `Transporter: ${otherBillDetails.transporter}`, otherBillDetails.trackingNo && `LR: ${otherBillDetails.trackingNo}`, otherBillDetails.shippingAddress && `Shipping: ${otherBillDetails.shippingAddress}`].filter(Boolean).join(' | ') || undefined,
      shippingDetails: (otherBillDetails.transporter || otherBillDetails.trackingNo || otherBillDetails.shippingAddress) ? otherBillDetails : undefined
    };
    setShowBillPreviewInvoice(previewInv);
  };

  const handleGenerateBillAction = async () => {
    try {
      const saved = await handleCheckoutSubmit(false, true);
      if (saved) {
        setShowBillPreviewInvoice(null);
        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 150);
      }
    } catch (err) {
      console.error("Generate Bill Error:", err);
    }
  };

  const handleDirectPrint = (invoice) => {
    if (!invoice) return;
    try {
      const htmlContent = generateReceiptHTMLContent(invoice, true);
      const printFrame = document.createElement("iframe");
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "0";
      document.body.appendChild(printFrame);

      const frameWin = printFrame.contentWindow || printFrame.contentDocument;
      const doc = frameWin.document || frameWin;
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          frameWin.focus();
          frameWin.print();
        } catch (err) {
          console.error("Frame print error:", err);
        }
        setTimeout(() => {
          try {
            if (printFrame.parentNode) {
              printFrame.parentNode.removeChild(printFrame);
            }
          } catch (e) { }
        }, 2000);
      }, 300);
    } catch (err) {
      console.error("handleDirectPrint Error:", err);
    }
  };

  const handlePrintAction = () => {
    if (isPrinting || !showBillPreviewInvoice) return;
    setIsPrinting(true);
    try {
      handleDirectPrint(showBillPreviewInvoice);
    } catch (err) {
      console.error("Print Action Error:", err);
    } finally {
      setTimeout(() => setIsPrinting(false), 400);
    }
  };

  const handleDownloadAction = () => {
    if (isDownloading || !showBillPreviewInvoice) return;
    setIsDownloading(true);
    try {
      handleDownloadOnly(showBillPreviewInvoice);
    } catch (err) {
      console.error("Download Action Error:", err);
    } finally {
      setTimeout(() => setIsDownloading(false), 400);
    }
  };

  const handleSendWhatsAppAction = () => {
    if (!showBillPreviewInvoice) return;
    const inv = showBillPreviewInvoice;
    const custName = inv.customerName || customerForm.name || "Customer";
    const rawPhone = (inv.customerPhone || customerForm.phone || "").replace(/\D/g, "");
    const invNo = inv.invoiceNo || inv.billNumber || inv.id || "DRAFT";
    const total = (inv.grandTotal || grandTotal || 0).toLocaleString('en-IN');
    const payMode = inv.paymentMode || paymentMethod || "Cash";
    const dateStr = inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

    const itemsSummary = (inv.items || cart || []).map(i => {
      const iName = i.name || i.itemName || "Item";
      const iQty = i.quantity || 1;
      const iPrice = (i.sellingPrice || i.price || i.mrp || 0) * iQty;
      return `• ${iName} (Qty: ${iQty}) - ₹${iPrice.toLocaleString('en-IN')}`;
    }).join('\n');

    const messageText = `*VASTRA ERP*\nInvoice & Receipt Confirmation\n--------------------------------\n*Receipt No:* ${invNo}\n*Date:* ${dateStr}\n*Customer:* ${custName}\n\n*Items Purchased:*\n${itemsSummary}\n\n*Grand Total:* ₹${total}\n*Payment Mode:* ${payMode}\n\nThank you for shopping with us! 🙏`;

    const encodedMsg = encodeURIComponent(messageText);
    let whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMsg}`;
    if (rawPhone && rawPhone.length >= 10) {
      const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
      whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMsg}`;
    }

    window.open(whatsappUrl, '_blank');
    if (typeof onAddNotification === 'function') {
      onAddNotification("WhatsApp Shared", `Opening WhatsApp to send invoice ${invNo}`, "success");
    }
  };

  // Helper to generate the standardized receipt HTML template

  // Direct download trigger as HTML file
  const handleDownloadOnly = (invoice) => {
    if (!invoice) return;
    const htmlContent = generateReceiptHTMLContent(invoice, false);

    const invoiceNoStr = (invoice.invoiceNo || invoice.billNo || 'DRAFT').replace(/[^a-z0-9_]/gi, '_');
    const filename = `Invoice_${invoiceNoStr}.html`;

    const blob = new Blob(["\ufeff" + htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.setAttribute("download", filename);
    document.body.appendChild(link);

    setTimeout(() => {
      link.click();
      setTimeout(() => {
        try {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (e) { }
      }, 100);
    }, 50);

    onAddNotification(
      "File Downloader",
      `Invoice ${filename} downloaded in HTML format.`,
      "success"
    );
  };

  // Receipt HTML downloader matching rule - now displays the React modal preview
  const handleDownloadReceiptHTML = (invoice) => {
    setShowBillPreviewInvoice(invoice);
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
      (invoice.customerPhone ? `*Contact:* ${invoice.customerPhone}\n` : "") +
      `---------------------------\n` +
      `*Apparel Items:*\n${itemsText}\n` +
      `---------------------------\n` +
      `*Subtotal:* ₹${invoice.subTotal}\n` +
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
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            ${item.name} (${item.size}/${item.color})
            ${item.uniqueCode ? `<br/><span style="font-size: 10px; color: #666;">Code: ${item.uniqueCode}</span>` : ''}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.totalPrice}</td>
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
      <h1>VASTRA ERP</h1>
      <p style="text-align: center; font-size: 12px; color: #777;">Official Invoice &amp; Payment Receipt</p>
      
      <div class="header-info">
        <p><strong>Receipt No:</strong> ${invoice.invoiceNo}</p>
        <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleString()}</p>
        <p><strong>Customer:</strong> ${invoice.customerName}</p>
        ${invoice.customerPhone ? `<p><strong>Phone:</strong> ${invoice.customerPhone}</p>` : ''}
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


  // --- REDESIGNED POS BILLING LOGIC ---
  const executeSmartSearch = async (query, clearInputFn) => {
    const q = (query || "").trim();
    if (!q) return;

    // 0. Check if scanned value is a PSSM Barcode / Docket (e.g. starts with PSSM- or PSS-)
    const isExplicitPssmPattern = /^pssm-|^pss-/i.test(q);
    if (isExplicitPssmPattern) {
      try {
        const pssRes = await api.get(`/pssm/barcode/${encodeURIComponent(q)}`);
        if (pssRes.data?.success && pssRes.data.data?.pssm) {
          const pssm = pssRes.data.data.pssm;
          const targetBill = pssm.billNo || pssm.billBarcode;
          if (targetBill) {
            try {
              const billRes = await api.get(`/billing/${encodeURIComponent(targetBill)}`);
              if (billRes.data?.success && billRes.data.data) {
                await loadInvoiceIntoPOS(billRes.data.data, pssRes.data.data, clearInputFn);
                return;
              }
            } catch (err) {
              const localBill = (invoiceList || invoices || []).find(inv => (inv.invoiceNo || inv.billNo || '').toLowerCase() === targetBill.toLowerCase());
              if (localBill) {
                await loadInvoiceIntoPOS(localBill, pssRes.data.data, clearInputFn);
                return;
              }
            }
          }
        }
      } catch (err) { }
    }

    // 1. Check if scanned value is a known bill in memory or starts with INV- / BILL-
    const localMatch = (invoiceList || invoices || []).find(inv =>
      (inv.invoiceNo && inv.invoiceNo.toLowerCase() === q.toLowerCase()) ||
      (inv.billNo && inv.billNo.toLowerCase() === q.toLowerCase()) ||
      (inv.billBarcode && inv.billBarcode.toLowerCase() === q.toLowerCase())
    );
    if (localMatch) {
      await loadInvoiceIntoPOS(localMatch, null, clearInputFn);
      return;
    }

    const isExplicitBillPattern = /^inv-|^bill-/i.test(q);
    if (isExplicitBillPattern) {
      try {
        const billRes = await api.get(`/billing/${encodeURIComponent(q)}`);
        if (billRes.data?.success && billRes.data.data) {
          await loadInvoiceIntoPOS(billRes.data.data, null, clearInputFn);
          return;
        }
      } catch (err) {
        if (onAddNotification) onAddNotification("Invoice Not Found", `No invoice found for "${q}"`, "danger");
        return;
      }
    }

    // 2. Normal Product Lookup flow
    try {
      const res = await api.get(`/products/search-billing?q=${encodeURIComponent(q)}`);
      if (res.data.success) {
        const items = res.data.data;
        if (items.length > 0) {
          if (loadedOriginalInvoice) setLoadedOriginalInvoice(null);

          if (items.length === 1 || items.find(i => i.barcode === q)) {
            const match = items.find(i => i.barcode === q) || items[0];
            handleAddProductToCart(match);
            if (onAddNotification) onAddNotification("Added", `${match.name} added to bill`, "success");
            if (typeof clearInputFn === 'function') clearInputFn("");
          } else {
            setDesignSelectionItems(items);
            setSelectedDesignItemIdx(0);
            setIsDesignSelectionPopupOpen(true);
          }
          return;
        }
      }
    } catch (err) {
      console.error("Smart barcode product search failed:", err);
    }

    // 3. Fallback: Check if scanned value matches an invoice without INV- prefix (e.g. NFS-983)
    try {
      const billRes = await api.get(`/billing/${encodeURIComponent(q)}`);
      if (billRes.data?.success && billRes.data.data) {
        await loadInvoiceIntoPOS(billRes.data.data, null, clearInputFn);
        return;
      }
    } catch (e) { }

    // 4. Fallback: Check if scanned barcode is a PSSM garment item or docket
    try {
      const pssRes = await api.get(`/pssm/barcode/${encodeURIComponent(q)}`);
      if (pssRes.data?.success && pssRes.data.data?.pssm) {
        const pssm = pssRes.data.data.pssm;
        const targetBill = pssm.billNo || pssm.billBarcode;
        if (targetBill) {
          try {
            const billRes = await api.get(`/billing/${encodeURIComponent(targetBill)}`);
            if (billRes.data?.success && billRes.data.data) {
              await loadInvoiceIntoPOS(billRes.data.data, pssRes.data.data, clearInputFn);
              return;
            }
          } catch (err) {
            const localBill = (invoiceList || invoices || []).find(inv => (inv.invoiceNo || inv.billNo || '').toLowerCase() === targetBill.toLowerCase());
            if (localBill) {
              await loadInvoiceIntoPOS(localBill, pssRes.data.data, clearInputFn);
              return;
            }
          }
        }
      }
    } catch (e) { }

    const localBillFallback = (invoiceList || invoices || []).find(inv => (inv.invoiceNo || inv.billNo || '').toLowerCase() === q.toLowerCase());
    if (localBillFallback) {
      await loadInvoiceIntoPOS(localBillFallback, null, clearInputFn);
      return;
    }

    if (onAddNotification) onAddNotification("Not Found", "No product or invoice found for this code", "danger");
  };

  const handleSmartBarcodeKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await executeSmartSearch(barcodeInput, setBarcodeInput);
    }
  };

  const executeDesignNoSearch = async (query) => {
    const q = String(query || "").trim();
    if (!q) return;

    const qLower = q.toLowerCase();
    let matchingRaw = [];

    // 1. Check local in-memory products strictly for exact designNo matches first
    const localExact = (products || []).filter(p => {
      const design = String(p.designNo || p.sku || p.design_no || p.designNumber || "").trim().toLowerCase();
      return design === qLower;
    });

    if (localExact.length > 0) {
      matchingRaw = localExact;
    } else {
      const localPartial = (products || []).filter(p => {
        const design = String(p.designNo || p.sku || p.design_no || p.designNumber || "").trim().toLowerCase();
        return design.length > 0 && (design.startsWith(qLower) || design.includes(qLower));
      });
      if (localPartial.length > 0) {
        matchingRaw = localPartial;
      }
    }

    // 2. Query backend API to ensure we check the full database, strictly filtering on designNo
    try {
      const res = await api.get(`/products/search-billing?q=${encodeURIComponent(q)}`);
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const remoteItems = res.data.data.filter(p => {
          const design = String(p.designNo || p.sku || p.design_no || p.designNumber || "").trim().toLowerCase();
          return design.length > 0 && (design === qLower || design.startsWith(qLower) || design.includes(qLower));
        });

        if (remoteItems.length > 0) {
          const remoteExact = remoteItems.filter(p => {
            const design = String(p.designNo || p.sku || p.design_no || p.designNumber || "").trim().toLowerCase();
            return design === qLower;
          });
          const bestRemote = remoteExact.length > 0 ? remoteExact : remoteItems;

          const mergedMap = new Map();
          [...matchingRaw, ...bestRemote].forEach(item => {
            const key = (item._id || item.id || item.barcode || Math.random()).toString();
            if (!mergedMap.has(key)) {
              mergedMap.set(key, item);
            }
          });
          matchingRaw = Array.from(mergedMap.values());
        }
      }
    } catch (err) {
      console.warn("Design No backend search fallback error:", err);
    }

    // Expand all product pieces/variants so all items with this design no are selectable
    const matchingItems = expandProductVariants(matchingRaw);

    // TEST 1: 0 matching items -> Show validation message, do NOT add to billing, close dropdown
    if (matchingItems.length === 0) {
      if (onAddNotification) {
        onAddNotification("Not Found", `No item found for Design No: ${q}`, "danger");
      }
      setIsDesignNoDropdownOpen(false);
      return;
    }

    // TEST 2: Exactly 1 matching item -> Automatically add to billing, no dropdown, no extra click
    if (matchingItems.length === 1) {
      const itemToAdd = matchingItems[0];
      handleAddProductToCart(itemToAdd);
      setDesignNoSearchInput("");
      setIsDesignNoDropdownOpen(false);
      if (onAddNotification) {
        onAddNotification("Item Added", `Added ${itemToAdd.itemName || itemToAdd.name || 'Item'} to bill`, "success");
      }
      return;
    }

    // TEST 3: More than 1 matching item (2+ matches) -> Show dropdown list containing all matching items
    setIsDesignNoDropdownOpen(true);
    setDesignNoHighlightedIndex(0);
  };

  const handleDesignNoKeyDown = async (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsDesignNoDropdownOpen(true);
      setDesignNoHighlightedIndex(prev => {
        const next = (prev + 1) % Math.max(1, filteredDesignNoProducts.length);
        setTimeout(() => {
          document.getElementById(`designsearch-opt-${next}`)?.scrollIntoView({ block: 'nearest' });
        }, 10);
        return next;
      });
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsDesignNoDropdownOpen(true);
      setDesignNoHighlightedIndex(prev => {
        const next = (prev - 1 + Math.max(1, filteredDesignNoProducts.length)) % Math.max(1, filteredDesignNoProducts.length);
        setTimeout(() => {
          document.getElementById(`designsearch-opt-${next}`)?.scrollIntoView({ block: 'nearest' });
        }, 10);
        return next;
      });
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setIsDesignNoDropdownOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      // If dropdown is open with multiple items and operator hits Enter, select highlighted item
      if (isDesignNoDropdownOpen && filteredDesignNoProducts.length > 1) {
        const itemToAdd = filteredDesignNoProducts[designNoHighlightedIndex] || filteredDesignNoProducts[0];
        if (itemToAdd) {
          handleAddProductToCart(itemToAdd);
          setDesignNoSearchInput("");
          setIsDesignNoDropdownOpen(false);
          if (onAddNotification) onAddNotification("Item Added", `Added ${itemToAdd.itemName || itemToAdd.name || 'Item'} to bill`, "success");
          return;
        }
      }
      await executeDesignNoSearch(designNoSearchInput);
    }
  };

  const handleItemCodeKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await executeSmartSearch(itemCodeSearchInput, setItemCodeSearchInput);
    }
  };

  const handleOpenItemSearchModal = () => {
    setIsDesignNoDropdownOpen(false);
    setIsItemDropdownOpen(false);
    setIsItemCodeDropdownOpen(false);
    const formatted = (products || []).map(p => ({
      _id: p._id || p.id,
      id: p._id || p.id,
      barcode: p.barcode || (p.pieces && p.pieces[0]?.barcode) || '',
      name: p.itemName || p.name || 'Unnamed Item',
      itemName: p.itemName || p.name || 'Unnamed Item',
      subItem: p.subItem || (typeof p.category === 'string' ? p.category : p.categoryId?.name) || '',
      designNo: p.designNo || p.sku || '',
      itemCode: p.itemCode || p.productCode || '',
      ipn: p.ipn || p.pieces?.[0]?.ipn || p.rackLocation || '',
      uniqueCode: p.uniqueCode || p.pieces?.[0]?.uniqueCode || '',
      hsn: p.hsn || p.hsnId?.code || '',
      company: p.company || p.firmName || (typeof p.brand === 'string' ? p.brand : p.brandId?.name) || '',
      remarks: p.remarks || '',
      color: p.primaryColor || p.color || '',
      primaryColor: p.primaryColor || p.color || '',
      secondaryColor: p.secondaryColor || '',
      size: p.size || '',
      mrp: p.defaultMRP ?? p.mrp ?? p.sellingPrice ?? 0,
      sellingPrice: p.sellingPrice ?? p.defaultMRP ?? p.mrp ?? 0,
      sellingRate: p.sellingPrice ?? p.defaultMRP ?? p.mrp ?? 0,
      availableStock: p.stock ?? 0,
      soldQuantity: p.soldQuantity || 0,
      basePrice: p.purchasePrice ?? p.purchaseRate ?? 0,
      purchasePrice: p.purchasePrice ?? p.purchaseRate ?? 0
    }));
    setItemSearchResults(formatted);
    setSelectedSearchItem(formatted[0] || null);
    setShowSearchItemDetailsPanel(false);
    setIsItemSearchModalOpen(true);
  };

  const handleItemNameKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = itemNameInput.trim();

      if (!q) {
        if (isItemSearchModalOpen) {
          const activeItem = selectedSearchItem || itemSearchResults[0];
          if (activeItem) {
            handleAddProductToCart(activeItem);
            setItemNameInput("");
            setLastSearchedQuery(null);
            setIsItemSearchModalOpen(false);
          }
        } else {
          handleOpenItemSearchModal();
        }
        return;
      }

      if (lastSearchedQuery === q && isItemSearchModalOpen) {
        const activeItem = selectedSearchItem || itemSearchResults[0];
        if (activeItem) {
          handleAddProductToCart(activeItem);
          setItemNameInput("");
          setLastSearchedQuery(null);
          setIsItemSearchModalOpen(false);
        }
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await api.get(`/products/search-billing?name=${encodeURIComponent(q)}`);
        if (res.data.success) {
          const items = res.data.data;
          setItemSearchResults(items);
          setSelectedSearchItem(items[0] || null);
          setShowSearchItemDetailsPanel(false);
          setIsItemSearchModalOpen(true);
          setLastSearchedQuery(q);
        }
      } catch (err) {
        console.error("Item name search failed:", err);
      }
    }
  };

  const handlePurchaseAuth = async () => {
    if (purchaseAuthOwnerId && purchaseAuthPassword) {
      try {
        await api.post('/auth/verify-supervisor', {
          email: purchaseAuthOwnerId,
          password: purchaseAuthPassword
        });

        setIsPurchaseTabUnlocked(true);
        setInfoPanelTab('Purchase');
        setIsPurchaseAuthModalOpen(false);
        setPurchaseAuthOwnerId("");
        setPurchaseAuthPassword("");

        const itemName = selectedSearchItem?.name || selectedSearchItem?.product?.name || selectedSearchItem?.itemCode || 'Unknown Item';
        const code = selectedSearchItem?.designNo || selectedSearchItem?.itemCode || '';
        const display = code ? `${itemName} (${code})` : itemName;
        const rawId = selectedSearchItem?._id || selectedSearchItem?.id;
        const validEntityId = /^[a-fA-F0-9]{24}$/.test(rawId) ? rawId : null;

        api.post('/audit/track', {
          action: 'VIEW',
          item: `Purchase Info Unlocked: ${display}`,
          moduleName: 'POS',
          entityType: 'POS_ITEM',
          entityId: validEntityId,
          displayName: `Purchase Tab Unlocked: ${display}`
        }).catch(err => console.error("Failed to track audit log", err));
      } catch (err) {
        if (onAddNotification) onAddNotification("Auth Failed", "Invalid owner credentials", "danger");
      }
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-80px)] min-h-0 space-y-2 pb-1" id="billing-pos-root">
      {/* POS Mode Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActivePOSMode("billing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "billing" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            POS Checkout
          </button>
          <button
            onClick={() => setActivePOSMode("history")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "history" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Invoice History
          </button>
          <button
            onClick={() => setActivePOSMode("returns")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "returns" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Returns & Exchange
          </button>
          <button
            onClick={() => setActivePOSMode("quotations")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "quotations" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Quotations
          </button>
          <button
            onClick={() => setActivePOSMode("orders")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "orders" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Sales Orders
          </button>


        </div>

        {activePOSMode !== "billing" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Cashier:</span>
            <select
              value={cashierId}
              onChange={(e) => setCashierId(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        )}
      </div>
      {/* POS TERMINAL INTERFACE */}
      {/* THE NEW ENTERPRISE BILLING GRID */}
      {/* LEGACY POS UI REDESIGN */}
      {activePOSMode === "billing" && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#f0f0f0] p-1 font-sans text-xs relative" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>

          {/* TOP CUSTOMER INFORMATION PANEL */}
          <div className="bg-[#f0f0f0] border border-slate-400 m-1 flex flex-col shrink-0">
            <div className="bg-[#c0c0c0] text-center text-[11px] py-1 font-bold border-b border-slate-400 text-slate-700 shadow-inner text-white flex items-center justify-between px-2" style={{ background: 'linear-gradient(to bottom, #999, #777)' }}>
              <span>Loyalty Customer Information</span>
              <span className={`text-[10px] bg-slate-800 text-white px-2 py-0.2 rounded font-mono ${customerForm.customerId ? 'cursor-pointer hover:bg-slate-700' : ''}`} onClick={() => { if (customerForm.customerId) handleOpenCustomerHistory(); }}>
                {customerForm.customerId ? `ID: ${customerForm.customerId}` : 'New/Walk-in'}
              </span>
            </div>
            <div className="p-2 flex flex-col gap-2 bg-slate-50">
              {/* Row 1: Search, Name, Mobile, GST No., Blank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 items-center">
                {/* Mobile No Search / Dropdown */}
                <div className="flex items-center border border-slate-300 relative bg-white col-span-1 md:col-span-2">
                  <span className="text-[10px] text-slate-600 bg-[#e1e1e1] border-r border-slate-300 p-1 px-2 shrink-0">Search Mobile/Name</span>
                  <input type="text" id="mobileSearchInput" className="flex-1 p-1 text-[10px] outline-none focus:bg-yellow-100 font-bold"
                    value={customerSearchQuery || customerForm.phone}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setCustomerForm(prev => ({ ...prev, phone: e.target.value }));
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
                    placeholder="Type to search..."
                  />
                  {isCustomerDropdownOpen && customerSearchQuery && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 shadow-xl max-h-48 overflow-y-auto z-[150]">
                      {customers.filter(c =>
                        (c.name || "").toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                        (c.phone || "").includes(customerSearchQuery) ||
                        (c.id || "").includes(customerSearchQuery)
                      ).map((c, idx) => (
                        <div key={idx} className="p-1.5 text-[10px] hover:bg-indigo-50 border-b border-slate-100 cursor-pointer"
                          onClick={() => {
                            setCustomerForm({ phone: c.phone || '', name: c.name || '', customerId: c.customerId || '', gstin: c.gstin || c.gstNo || '', lf: '2588' });
                            setSelectedCustomerId(c.id || c._id);
                            setCustomerSearchQuery(c.phone);
                            setIsCustomerDropdownOpen(false);
                            if (onAddNotification) onAddNotification("Customer Loaded", `Loaded ${c.name}'s profile`, "success");
                          }}>
                          <div className="font-bold text-slate-800">{c.name}</div>
                          <div className="text-slate-500">Phone: {c.phone} {c.gstin ? `| GST: ${c.gstin}` : ''} | Pts: {c.loyaltyPoints || 0}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex relative items-center border border-slate-300 bg-white">
                  <span className="text-[10px] text-slate-600 bg-[#e1e1e1] border-r border-slate-300 p-1 px-2 shrink-0">Name</span>
                  <input
                    type="text"
                    className={`flex-1 p-1 text-[10px] outline-none focus:bg-yellow-100 uppercase font-bold font-mono ${selectedCustomerId ? 'text-blue-600 cursor-pointer hover:underline' : ''}`}
                    value={customerForm.name}
                    onChange={e => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                    onClick={() => { if (selectedCustomerId) handleOpenCustomerHistory(); }}
                    placeholder="Customer Name"
                  />
                </div>

                {/* Mobile Display */}
                <div className="flex relative items-center border border-slate-300 bg-white">
                  <span className="text-[10px] text-slate-600 bg-[#e1e1e1] border-r border-slate-300 p-1 px-2 shrink-0">Mobile</span>
                  <input
                    type="text"
                    maxLength={10}
                    className="flex-1 p-1 text-[10px] outline-none focus:bg-yellow-100 font-bold font-mono"
                    value={customerForm.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleCustomerPhoneChange({ target: { value: digits } });
                    }}
                    placeholder="10 Digits"
                  />
                </div>

                {/* Customer ID (Row 1) */}
                <div className="flex relative items-center border border-slate-300 bg-white overflow-hidden">
                  <span className="text-[10px] text-slate-600 bg-[#e1e1e1] border-r border-slate-300 p-1 px-2 shrink-0 font-bold text-indigo-700">Cust ID</span>
                  <input
                    type="text"
                    readOnly
                    className={`flex-1 min-w-0 p-1 text-[10px] outline-none bg-slate-50 uppercase font-mono font-bold ${customerForm.customerId ? 'text-indigo-600 cursor-pointer hover:underline' : 'text-slate-400'}`}
                    value={customerForm.customerId || (customerForm.phone && customerForm.phone.length >= 10 ? `CUST-${customerForm.phone.slice(-4)}` : 'AUTO-GEN')}
                    onClick={() => { if (customerForm.customerId) handleOpenCustomerHistory(); }}
                    placeholder="Cust ID"
                  />
                </div>
              </div>

              {/* Row 2: GST, Points & Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 items-center pt-1 border-t border-slate-200/80">
                {/* GST No. (Moved to Row 2) */}
                <div className="flex relative items-center border border-slate-300 bg-white">
                  <span className="text-[10px] text-slate-600 bg-[#e1e1e1] border-r border-slate-300 p-1 px-2 shrink-0 font-bold">GST No.</span>
                  <input
                    type="text"
                    className="flex-1 p-1 text-[10px] outline-none focus:bg-yellow-100 uppercase font-mono font-bold"
                    value={customerForm.gstin}
                    onChange={e => setCustomerForm(prev => ({ ...prev, gstin: e.target.value }))}
                    placeholder="GSTIN (Optional)"
                  />
                </div>

                {/* Loyalty Points */}
                <div className="flex items-center border border-slate-300 bg-slate-100">
                  <span className="text-[10px] text-slate-600 bg-[#e1e1e1] border-r border-slate-300 p-1 px-2 shrink-0">Points</span>
                  <span className="flex-1 p-1 text-[10px] font-bold text-indigo-700">
                    {customers.find(c => (c.id || c._id) === selectedCustomerId)?.loyaltyPoints || 0} pts
                  </span>
                </div>

                {/* Customer Actions */}
                <div className="flex gap-1.5 justify-start col-span-1 md:col-span-2">
                  <button className="px-3 py-1.5 bg-[#f0f0f0] hover:bg-[#e1e1e1] border border-slate-300 rounded text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer" onClick={handleCustomerSave}>
                    <Save className="w-3.5 h-3.5 text-green-600" />
                    <span>Save Profile</span>
                  </button>
                  <button className="px-3 py-1.5 bg-[#f0f0f0] hover:bg-[#e1e1e1] border border-slate-300 rounded text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer" onClick={() => handleClearBillContext("Loaded Bill Cleared", "Original bill context cleared.")}>
                    <X className="w-3.5 h-3.5 text-red-500" />
                    <span>New Customer</span>
                  </button>
                </div>

                {/* Blank Space on Row 2 */}
                <div className="hidden md:block"></div>
                <div className="hidden md:block"></div>
              </div>

              {/* Loaded Original Bill Banner */}
              {loadedOriginalInvoice && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 mt-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                      Original Bill Loaded
                    </span>
                    <span
                      onClick={() => setShowBillPreviewInvoice(loadedOriginalInvoice)}
                      className="font-mono font-black text-indigo-700 hover:text-indigo-900 cursor-pointer underline text-xs"
                      title="Click to view full receipt"
                    >
                      {loadedOriginalInvoice.invoiceNo || loadedOriginalInvoice.billNo}
                    </span>
                    <span className="text-slate-500 font-medium text-[10px]">
                      ({loadedOriginalInvoice.date ? new Date(loadedOriginalInvoice.date).toLocaleDateString('en-IN') : ''} • ₹{(loadedOriginalInvoice.grandTotal || 0).toLocaleString()} • {loadedOriginalInvoice.paymentMethod || 'Paid'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenAlterationForSelectedProduct()}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black px-2.5 py-1 rounded shadow-xs cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                    >
                      <Scissors className="w-3 h-3" /> Alteration (Alt+A)
                    </button>
                    {(loadedOriginalInvoice.pssmRecord || cart.some(i => i.hasPSSM || i.pssmNo)) && (
                      <button
                        type="button"
                        onClick={() => handleOpenPSSSlipFromInvoice(loadedOriginalInvoice)}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black px-2.5 py-1 rounded shadow-xs cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                      >
                        <FileText className="w-3 h-3" /> PSS Slip ({cart.find(i => i.pssmNo)?.pssmNo || loadedOriginalInvoice.pssmRecord?.pssmNo})
                      </button>
                    )}
                    {cart.some(i => i.hasAlteration) && (
                      <button
                        type="button"
                        onClick={handleCompleteAllBillActions}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-3 py-1 rounded shadow-md cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                        <span>Complete & Issue Slips ({cart.filter(i => i.hasAlteration).length})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvoiceForReturn({ ...loadedOriginalInvoice, items: unrollInvoiceItems(loadedOriginalInvoice.items || []) });
                        setReturnActionType("return");
                        setReturnedItemIds([]);
                        setShowReturnExchangeModal(true);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-2.5 py-1 rounded shadow-xs cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                    >
                      <RotateCcw className="w-3 h-3" /> Returns (R)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvoiceForReturn({ ...loadedOriginalInvoice, items: unrollInvoiceItems(loadedOriginalInvoice.items || []) });
                        setReturnActionType("exchange");
                        setExchangeOldItemIdx(0);
                        setExchangeSelectedNewProduct(null);
                        setShowReturnExchangeModal(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-2.5 py-1 rounded shadow-xs cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                    >
                      <RefreshCw className="w-3 h-3" /> Exchange (E)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoadedOriginalInvoice(null);
                        setCart([]);
                        setCustomerForm({ phone: '', name: '', customerId: '', gstin: '', lf: '2588' });
                        setSelectedCustomerId('');
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                      title="Clear Loaded Bill"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-1 gap-1 overflow-hidden min-w-0">

            {/* LEFT MAIN (GRID + SUMMARIES) */}
            <div className="flex-[3] flex flex-col bg-white border border-slate-400 min-w-0">

              {/* THE GRID */}
              <div className="flex-1 overflow-auto border-b border-slate-400 custom-scrollbar relative">
                <table className="w-full border-collapse text-[11px] whitespace-nowrap table-fixed">
                  <thead className="bg-[#f0f0f0] border-b border-slate-400 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="border-r border-slate-400 font-normal p-1 text-center w-8 text-[9px]">S.NO.</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-20">Barcode</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-32">Item Name</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-center w-44">Firm</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-20">Sub Item</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-24">Design No.</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-36 min-w-[140px]">Item Code</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-14">Ipn</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-center w-20">Quantity</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-20">Colour (P)</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-16">Colour (S)</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-14">Size</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-16">HSN</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-center w-24">GST Slab</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-right w-16">MRP</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-right w-16">Discount</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-right w-18">Rate</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-right w-20">Amount</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-20">Salesman 1</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-20">Salesman 2</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-24">Unique Code</th>
                      <th className="font-normal p-1 text-center w-10">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => {
                      const qty = item.quantity || 1;
                      const mrp = item.mrp || item.price || 0;
                      const disc = item.customDiscount || item.discount || 0;
                      const rate = item.sellingPrice || (mrp - disc) || 0;
                      const amt = qty * rate;

                      // Proportional Bill Adjustment per item: (ItemPrice / TotalPrice) × AdjustmentAmount
                      const cartSubTotal = cart.reduce((acc, ci) => acc + ((ci.sellingPrice || (ci.mrp || ci.price || 0) - (ci.customDiscount || ci.discount || 0)) * (ci.quantity || 1)), 0);
                      let billAdjShare = 0;
                      if (billAdjustment && billAdjustment.amount > 0 && cartSubTotal > 0) {
                        billAdjShare = (amt / cartSubTotal) * billAdjustment.amount;
                        billAdjShare = Math.round(billAdjShare * 100) / 100; // round to 2 decimals
                      }
                      const isCharge = billAdjustment && billAdjustment.operation === 'Charge';
                      const totalDiscDisplay = billAdjShare > 0
                        ? (isCharge ? disc : disc + billAdjShare)
                        : disc;

                      const barcodeDisplay = item.barcode || item.barcodeNo || item.productId?.barcode || item.pieces?.[0]?.barcode || '';
                      const nameDisplay = item.itemName || item.name || item.productId?.itemName || item.productId?.name || '';
                      const firmDisplay = item.firmName || item.company || item.productId?.firmName || item.productId?.company || item.piece?.firmId?.name || (item.pieces && item.pieces[0]?.firmId?.name) || '';
                      const firmStyle = getFirmStyle(firmDisplay);
                      const subItemDisplay = item.subItem || item.productId?.subItem || (typeof item.category === 'string' ? item.category : item.category?.name) || '';
                      const designNoDisplay = item.designNo || item.productId?.designNo || item.sku || '';
                      const itemCodeDisplay = item.itemCode || item.productId?.itemCode || '';
                      const ipnDisplay = item.ipn || item.productId?.ipn || item.piece?.ipn || '';
                      const colorDisplay = item.primaryColor || item.color || item.productId?.primaryColor || '';
                      const secondaryColorDisplay = item.secondaryColor || item.productId?.secondaryColor || '';
                      const sizeDisplay = item.size || item.productId?.size || '';
                      const hsnDisplay = item.hsn || item.hsnCode || item.hsnId?.code || '';
                      const itemGstRate = item.gstPercent ?? (isGstApplied ? Number(gstRateInput) || 0 : 0);

                      return (
                        <tr
                          key={idx}
                          onClick={() => {
                            setSelectedCartRowIndex(idx);
                            setFocusedAlterationIndex(idx);
                          }}
                          className={`border-b border-slate-200 transition-all cursor-pointer ${firmStyle.rowClass} ${selectedCartRowIndex === idx
                              ? 'ring-2 ring-inset ring-indigo-500 shadow-xs font-bold text-slate-900'
                              : ''
                            }`}
                        >
                          <td className="border-r border-slate-300 p-1 text-center font-bold">{idx + 1}</td>
                          <td className="border-r border-slate-300 p-1 font-mono overflow-hidden text-ellipsis whitespace-nowrap" title={barcodeDisplay}>{barcodeDisplay}</td>
                          <td className="border-r border-slate-300 p-1 font-semibold text-slate-800 overflow-hidden text-ellipsis whitespace-nowrap" title={nameDisplay}>{nameDisplay}</td>
                          <td className="border-r border-slate-300 p-1 text-center whitespace-nowrap overflow-hidden">
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-tight inline-block shadow-2xs ${firmStyle.badgeClass}`} title={firmDisplay}>
                              {firmDisplay}
                            </span>
                          </td>
                          <td className="border-r border-slate-300 p-1 overflow-hidden text-ellipsis whitespace-nowrap" title={subItemDisplay}>{subItemDisplay}</td>
                          <td className="border-r border-slate-300 p-1 font-mono overflow-hidden text-ellipsis whitespace-nowrap" title={designNoDisplay}>{designNoDisplay}</td>
                          <td className="border-r border-slate-300 p-1 font-mono overflow-hidden text-ellipsis whitespace-nowrap font-bold text-slate-800" title={itemCodeDisplay}>{itemCodeDisplay}</td>
                          <td className="border-r border-slate-300 p-1 font-mono overflow-hidden text-ellipsis whitespace-nowrap" title={ipnDisplay}>{ipnDisplay}</td>
                          <td className="border-r border-slate-300 p-1 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => {
                                const newCart = [...cart];
                                if (newCart[idx].quantity > 1) {
                                  newCart[idx].quantity -= 1;
                                  newCart[idx].totalPrice = newCart[idx].quantity * rate;
                                  setCart(newCart);
                                }
                              }} className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-[10px]">-</button>
                              <input
                                type="number"
                                min="1"
                                value={qty}
                                onChange={(e) => {
                                  const requestedQty = Math.max(1, parseInt(e.target.value) || 1);
                                  const availableStock = getLiveStock(cart[idx]);
                                  if (availableStock > 0 && requestedQty > availableStock) {
                                    alert(`Cannot set quantity to ${requestedQty}! Only ${availableStock} unit(s) of "${cart[idx].name || cart[idx].itemName}" are available in stock.`);
                                    return;
                                  }
                                  const newCart = [...cart];
                                  newCart[idx].quantity = requestedQty;
                                  newCart[idx].totalPrice = requestedQty * rate;
                                  setCart(newCart);
                                }}
                                className="w-10 text-center font-bold text-xs bg-transparent border-b border-slate-400 outline-none focus:bg-yellow-100"
                              />
                              <button onClick={() => {
                                const availableStock = getLiveStock(cart[idx]);
                                const currentInCartCount = cart.filter(i => isSameProduct(i, cart[idx])).reduce((sum, item) => sum + (item.quantity || 1), 0);
                                if (availableStock > 0 && currentInCartCount >= availableStock) {
                                  alert(`Cannot add more! "${cart[idx].name || cart[idx].itemName}" has only ${availableStock} unit(s) in stock (${currentInCartCount} already in cart).`);
                                  return;
                                }
                                const newCart = [...cart];
                                newCart[idx].quantity += 1;
                                newCart[idx].totalPrice = newCart[idx].quantity * rate;
                                setCart(newCart);
                              }} className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-[10px]">+</button>
                            </div>
                          </td>
                          <td className="border-r border-slate-300 p-1">{colorDisplay}</td>
                          <td className="border-r border-slate-300 p-1">{secondaryColorDisplay}</td>
                          <td className="border-r border-slate-300 p-1">{sizeDisplay}</td>
                          <td className="border-r border-slate-300 p-1">{hsnDisplay}</td>
                          <td className="border-r border-slate-300 p-1 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              list="gst-slab-options"
                              value={item.gstPercent ?? ''}
                              onChange={(event) => setCartItemGstRate(idx, event.target.value)}
                              className="w-full min-w-[82px] border border-slate-300 rounded px-1 py-0.5 text-[10px] font-bold text-slate-700 bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder={isGstApplied ? `${gstRateInput}%` : 'No GST'}
                              title="Enter GST slab for this item"
                            />
                            <datalist id="gst-slab-options">
                              {GST_SLAB_OPTIONS.map((slab) => (
                                <option key={slab} value={slab}>{slab === 0 ? 'No GST' : `${slab}%`}</option>
                              ))}
                            </datalist>
                            <span className="sr-only">Applied GST: {itemGstRate}%</span>
                          </td>
                          <td className="border-r border-slate-300 p-1 text-right">
                            <input
                              type="number"
                              value={mrp}
                              onChange={(e) => {
                                const newCart = [...cart];
                                const newPrice = parseFloat(e.target.value) || 0;
                                newCart[idx].price = newPrice;
                                newCart[idx].mrp = newPrice;
                                const newRate = newPrice - (newCart[idx].customDiscount || newCart[idx].discount || 0);
                                newCart[idx].sellingPrice = newRate;
                                newCart[idx].totalPrice = newCart[idx].quantity * newRate;
                                setCart(newCart);
                              }}
                              className="w-14 text-right font-bold text-xs bg-transparent border-b border-slate-400 outline-none focus:bg-yellow-100"
                            />
                          </td>
                          <td className={`border-r border-slate-300 p-1 text-right ${billAdjShare > 0 ? (isCharge ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold') : ''}`} title={billAdjShare > 0 ? `Item Disc: ₹${disc.toFixed(2)} | Bill Adj (${isCharge ? '+Charge' : '-Disc'}): ₹${billAdjShare.toFixed(2)}` : ''}>
                            {totalDiscDisplay.toFixed(2)}
                            {billAdjShare > 0 && (
                              <div className={`text-[8px] leading-tight ${isCharge ? 'text-emerald-500' : 'text-red-400'}`}>
                                ({isCharge ? '+' : '-'}₹{billAdjShare.toFixed(2)})
                              </div>
                            )}
                          </td>
                          <td className="border-r border-slate-300 p-1 text-right">{rate.toFixed(2)}</td>
                          <td className={`border-r border-slate-300 p-1 text-right ${billAdjShare > 0 ? 'font-bold' : ''}`}>{(isCharge ? amt + billAdjShare : amt - billAdjShare).toFixed(2)}</td>
                          <td className="border-r border-slate-300 p-1 relative">
                            {(() => {
                              const val1 = item.salesman1 || '';
                              const filtered1 = staffList?.filter(s => s.name.toLowerCase().includes(val1.toLowerCase())) || [];
                              return (
                                <div className="relative">
                                  <input
                                    type="text"
                                    className="w-full bg-transparent border-b border-slate-300 outline-none focus:bg-yellow-100 text-[10px] pr-4"
                                    value={val1}
                                    placeholder="-"
                                    onChange={(e) => {
                                      const newCart = [...cart];
                                      newCart[idx].salesman1 = e.target.value;
                                      setCart(newCart);
                                    }}
                                    onFocus={(e) => e.target.select()}
                                  />
                                  {val1 && filtered1.length > 0 && !(filtered1.length === 1 && filtered1[0].name.toLowerCase() === val1.toLowerCase()) && (
                                    <div className="absolute top-full left-0 z-[9999] bg-white border border-slate-200 rounded shadow-lg min-w-[130px] max-h-40 overflow-y-auto">
                                      {filtered1.map(s => (
                                        <div
                                          key={s._id || s.id}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            const newCart = [...cart];
                                            newCart[idx].salesman1 = s.name;
                                            setCart(newCart);
                                          }}
                                          className="px-2 py-1 text-[11px] cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 font-medium"
                                        >
                                          {s.name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="border-r border-slate-300 p-1 relative">
                            {(() => {
                              const val2 = item.salesman2 || '';
                              const filtered2 = staffList?.filter(s => s.name.toLowerCase().includes(val2.toLowerCase())) || [];
                              return (
                                <div className="relative">
                                  <input
                                    type="text"
                                    className="w-full bg-transparent border-b border-slate-300 outline-none focus:bg-yellow-100 text-[10px] pr-4"
                                    value={val2}
                                    placeholder="-"
                                    onChange={(e) => {
                                      const newCart = [...cart];
                                      newCart[idx].salesman2 = e.target.value;
                                      setCart(newCart);
                                    }}
                                    onFocus={(e) => e.target.select()}
                                  />
                                  {val2 && filtered2.length > 0 && !(filtered2.length === 1 && filtered2[0].name.toLowerCase() === val2.toLowerCase()) && (
                                    <div className="absolute top-full left-0 z-[9999] bg-white border border-slate-200 rounded shadow-lg min-w-[130px] max-h-40 overflow-y-auto">
                                      {filtered2.map(s => (
                                        <div
                                          key={s._id || s.id}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            const newCart = [...cart];
                                            newCart[idx].salesman2 = s.name;
                                            setCart(newCart);
                                          }}
                                          className="px-2 py-1 text-[11px] cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 font-medium"
                                        >
                                          {s.name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="border-r border-slate-300 p-1 font-mono font-bold text-[10.5px] text-indigo-700 tracking-tight select-all">{item.uniqueCode || ''}</td>
                          <td className="p-1 text-center">
                            <button onClick={() => {
                              const newCart = cart.filter((_, i) => i !== idx);
                              setCart(newCart);
                            }} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Empty Entry Row */}
                    <tr className="border-b border-slate-300 bg-[#e8f4ff]">
                      <td className="border-r border-slate-300 p-1 text-center font-bold text-blue-700">{cart.length + 1}</td>
                      <td className="border-r border-slate-300 p-0.5">
                        <input
                          id="posBarcodeInput"
                          type="text"
                          className="w-full bg-white border border-blue-300 outline-none p-1 text-xs focus:bg-yellow-100 font-bold uppercase shadow-inner"
                          placeholder="(Alt+B)"
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyDown={handleSmartBarcodeKeyDown}
                        />
                      </td>
                      {/* Item Search Input with Drop Arrow Button & Interactive Dropdown */}
                      <td ref={itemSearchContainerRef} className="border-r border-slate-300 p-0.5 relative">
                        <div className="flex items-center bg-white border border-blue-300 shadow-inner">
                          <input
                            type="text"
                            className="w-full outline-none p-1 text-xs focus:bg-yellow-100 cursor-pointer placeholder-slate-500 font-semibold"
                            placeholder="Click to Search Item (F2)..."
                            value={itemSearchInputText}
                            onChange={(e) => {
                              setItemSearchInputText(e.target.value);
                              handleOpenItemSearchModal();
                            }}
                            onClick={() => handleOpenItemSearchModal()}
                            onFocus={() => handleOpenItemSearchModal()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "ArrowDown") {
                                e.preventDefault();
                                handleOpenItemSearchModal();
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="px-1.5 py-1 text-slate-500 hover:text-blue-600 border-l border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenItemSearchModal();
                            }}
                            title="Open Detailed Item Search List (F2)"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Interactive Detailed Item Table Dropdown List */}
                        {isItemDropdownOpen && (
                          <div
                            id="item-search-fixed-dropdown"
                            style={{
                              position: 'fixed',
                              top: `${itemSearchDropdownCoords.top}px`,
                              left: `${itemSearchDropdownCoords.left}px`,
                              width: '780px',
                              maxHeight: '340px',
                              zIndex: 99999
                            }}
                            className="bg-white border border-slate-300 shadow-2xl rounded-xl overflow-hidden flex flex-col text-slate-800 border-t-4 border-t-blue-600 ring-2 ring-blue-500/30 animate-in fade-in zoom-in-95 duration-100"
                          >
                            <div className="p-2.5 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex items-center justify-between text-xs font-bold shrink-0 shadow-md">
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider">Inventory Search</span>
                                <span>Found {filteredItemSearchProducts.length} Items • Use ↑ ↓ & Enter</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsItemDropdownOpen(false);
                                    handleOpenItemSearchModal();
                                  }}
                                  className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-xs flex items-center gap-1"
                                >
                                  <span>Full List (F2)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsItemDropdownOpen(false);
                                  }}
                                  className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-5 h-5 flex items-center justify-center font-extrabold text-xs cursor-pointer transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            {filteredItemSearchProducts.length === 0 ? (
                              <div className="p-6 text-center text-xs text-slate-400 font-medium bg-slate-50">No matching items found</div>
                            ) : (
                              <div className="overflow-y-auto max-h-[280px] custom-scrollbar">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10 text-[10px] uppercase tracking-wider">
                                    <tr>
                                      <th className="p-2 border-r border-slate-200">Barcode / Unique Code</th>
                                      <th className="p-2 border-r border-slate-200">Item Name & Sub-Item</th>
                                      <th className="p-2 border-r border-slate-200 text-center">Size</th>
                                      <th className="p-2 border-r border-slate-200 text-center">Color</th>
                                      <th className="p-2 border-r border-slate-200 text-center">Stock</th>
                                      <th className="p-2 border-r border-slate-200 text-right">Price</th>
                                      <th className="p-2 text-center">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 text-slate-700">
                                    {filteredItemSearchProducts.map((p, pIdx) => {
                                      const barcode = p.barcode || p.uniqueCode || p.itemCode || '-';
                                      const code = p.itemCode || p.productCode || p.sku || '-';
                                      const name = p.itemName || p.name || 'Unnamed Item';
                                      const subItem = p.subCategory || p.subItem || p.category || '-';
                                      const size = p.size || '-';
                                      const color = p.primaryColor || p.color || '-';
                                      const price = p.sellingPrice ?? p.mrp ?? p.defaultMRP ?? 0;
                                      const stock = p.availableStock ?? p.stock ?? 0;
                                      const isHighlighted = pIdx === itemSearchHighlightedIndex;

                                      return (
                                        <tr
                                          id={`itemsearch-opt-${pIdx}`}
                                          key={p._id || p.id || pIdx}
                                          className={`cursor-pointer transition-colors ${isHighlighted
                                            ? 'bg-blue-100/90 font-bold border-l-4 border-l-blue-600 text-blue-900 shadow-xs'
                                            : pIdx % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-slate-50/60 hover:bg-blue-50'
                                            }`}
                                          onClick={() => {
                                            const added = handleAddProductToCart(p);
                                            if (added) {
                                              setItemSearchInputText("");
                                              setIsItemDropdownOpen(false);
                                              if (onAddNotification) onAddNotification("Item Added", `Added ${name} to bill`, "success");
                                            }
                                          }}
                                        >
                                          <td className="p-2 font-mono text-[11px] font-bold text-slate-800 border-r border-slate-200">
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 text-slate-700">{barcode}</span>
                                          </td>
                                          <td className="p-2 border-r border-slate-200">
                                            <div className="font-bold text-slate-900">{name}</div>
                                            <div className="text-[10px] text-slate-500 font-medium">Code: <span className="font-mono text-blue-600 font-bold">{code}</span> {subItem !== '-' && `• ${subItem}`}</div>
                                          </td>
                                          <td className="p-2 text-center font-bold border-r border-slate-200 text-slate-700">{size}</td>
                                          <td className="p-2 text-center border-r border-slate-200">{color}</td>
                                          <td className="p-2 text-center border-r border-slate-200 font-mono font-bold">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${stock > 0 ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-rose-100 text-rose-800 border border-rose-200"}`}>
                                              {stock} pcs
                                            </span>
                                          </td>
                                          <td className="p-2 text-right font-mono font-black text-slate-900 text-sm border-r border-slate-200">
                                            ₹{Number(price).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                          </td>
                                          <td className="p-2 text-center">
                                            <button
                                              type="button"
                                              className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase transition-all shadow-2xs ${isHighlighted ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-800 text-white hover:bg-slate-900'
                                                }`}
                                            >
                                              + Add
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Empty Firm Cell */}
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>

                      {/* Empty Sub Item Cell */}
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>

                      {/* Design No Search Field */}
                      <td ref={designNoContainerRef} className="border-r border-slate-300 p-0.5 relative">
                        <input
                          id="designNoSearchInput"
                          type="text"
                          className="w-full bg-white border border-blue-300 outline-none p-1 text-xs focus:bg-yellow-100 font-bold uppercase placeholder-slate-500 font-mono cursor-pointer shadow-inner"
                          placeholder="(Alt+D)"
                          value={designNoSearchInput}
                          onChange={(e) => {
                            setDesignNoSearchInput(e.target.value);
                            if (e.target.value.trim().length > 0) {
                              setIsDesignNoDropdownOpen(true);
                              setDesignNoHighlightedIndex(0);
                            } else {
                              setIsDesignNoDropdownOpen(false);
                            }
                          }}
                          onFocus={() => {
                            if (designNoSearchInput.trim().length > 0) {
                              setIsDesignNoDropdownOpen(true);
                              setDesignNoHighlightedIndex(0);
                            }
                          }}
                          onKeyDown={handleDesignNoKeyDown}
                        />

                        {isDesignNoDropdownOpen && !isItemSearchModalOpen && !showPaymentModal && !showAlterationModal && !showDueCustomerModal && (
                          <div
                            id="design-no-fixed-dropdown"
                            style={{
                              position: 'fixed',
                              top: `${designNoDropdownCoords.top}px`,
                              left: `${designNoDropdownCoords.left}px`,
                              width: '780px',
                              maxHeight: '340px',
                              zIndex: 99999
                            }}
                            className="bg-white border border-slate-300 shadow-2xl rounded-xl overflow-hidden flex flex-col text-slate-800 border-t-4 border-t-indigo-600 ring-2 ring-indigo-500/30 animate-in fade-in zoom-in-95 duration-100"
                          >
                            <div className="p-2.5 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between text-xs font-bold shrink-0 shadow-md">
                              <div className="flex items-center gap-2">
                                <span className="bg-indigo-500/40 text-indigo-100 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider border border-indigo-400/30">Design No Search</span>
                                <span>Found {filteredDesignNoProducts.length} Items • Use ↑ ↓ to navigate & Enter to add</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsDesignNoDropdownOpen(false);
                                }}
                                className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-5 h-5 flex items-center justify-center font-extrabold text-xs cursor-pointer transition-colors"
                              >
                                ✕
                              </button>
                            </div>

                            {filteredDesignNoProducts.length === 0 ? (
                              <div className="p-6 text-center text-xs text-slate-400 font-medium bg-slate-50">No matching design numbers found</div>
                            ) : (
                              <div className="overflow-y-auto max-h-[280px] custom-scrollbar">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 text-[10px] uppercase tracking-wider shadow-2xs">
                                    <tr>
                                      <th className="p-2 border-r border-slate-200 w-24 whitespace-nowrap">Design No</th>
                                      <th className="p-2 border-r border-slate-200 w-24 whitespace-nowrap">Barcode</th>
                                      <th className="p-2 border-r border-slate-200 min-w-[130px]">Item Name</th>
                                      <th className="p-2 border-r border-slate-200 w-36 whitespace-nowrap text-center">Firm</th>
                                      <th className="p-2 border-r border-slate-200 text-center w-12 whitespace-nowrap">Size</th>
                                      <th className="p-2 border-r border-slate-200 text-center w-16 whitespace-nowrap">Color</th>
                                      <th className="p-2 border-r border-slate-200 text-center w-14 whitespace-nowrap">Stock</th>
                                      <th className="p-2 border-r border-slate-200 text-right w-20 whitespace-nowrap">Price</th>
                                      <th className="p-2 text-center w-16 whitespace-nowrap">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 text-slate-700">
                                    {filteredDesignNoProducts.map((p, pIdx) => {
                                      const designNo = p.designNo || p.sku || '-';
                                      const barcode = p.barcode || p.uniqueCode || (p.pieces && p.pieces[0]?.barcode) || '-';
                                      const name = p.itemName || p.name || 'Unnamed Item';
                                      const firm = p.firmName || p.company || 'New Fashion Style';
                                      const firmStyle = getFirmStyle(firm);
                                      const size = p.size || '-';
                                      const color = p.primaryColor || p.color || '-';
                                      const price = p.sellingPrice ?? p.mrp ?? p.defaultMRP ?? 0;
                                      const stock = p.availableStock ?? p.stock ?? 0;
                                      const isHighlighted = pIdx === designNoHighlightedIndex;

                                      return (
                                        <tr
                                          id={`designsearch-opt-${pIdx}`}
                                          key={p._id || p.id || pIdx}
                                          className={`cursor-pointer transition-colors ${isHighlighted
                                            ? 'bg-indigo-100/90 font-bold border-l-4 border-l-indigo-600 text-indigo-900 shadow-xs'
                                            : pIdx % 2 === 0 ? 'bg-white hover:bg-indigo-50/70' : 'bg-slate-50/70 hover:bg-indigo-50/70'
                                            }`}
                                          onClick={() => {
                                            const added = handleAddProductToCart(p);
                                            if (added) {
                                              setDesignNoSearchInput("");
                                              setIsDesignNoDropdownOpen(false);
                                              if (onAddNotification) onAddNotification("Item Added", `Added ${name} to bill`, "success");
                                            }
                                          }}
                                        >
                                          <td className="p-2 font-mono text-[11px] font-bold text-indigo-700 border-r border-slate-200 whitespace-nowrap">
                                            <span className="bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-800">{designNo}</span>
                                          </td>
                                          <td className="p-2 font-mono text-[11px] font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap">
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 text-slate-800">{barcode}</span>
                                          </td>
                                          <td className="p-2 border-r border-slate-200">
                                            <div className="font-bold text-slate-900">{name}</div>
                                          </td>
                                          <td className="p-2 border-r border-slate-200 text-center whitespace-nowrap">
                                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase tracking-tight ${firmStyle.badgeClass}`}>
                                              {firm}
                                            </span>
                                          </td>
                                          <td className="p-2 text-center font-bold border-r border-slate-200 text-slate-700 whitespace-nowrap">{size}</td>
                                          <td className="p-2 text-center border-r border-slate-200 whitespace-nowrap font-medium">{color}</td>
                                          <td className="p-2 text-center border-r border-slate-200 font-mono font-bold whitespace-nowrap">
                                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${stock > 0 ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-rose-100 text-rose-800 border border-rose-200"}`}>
                                              {stock} pcs
                                            </span>
                                          </td>
                                          <td className="p-2 text-right font-mono font-black text-slate-900 text-xs border-r border-slate-200 whitespace-nowrap">
                                            ₹{Number(price).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                          </td>
                                          <td className="p-2 text-center whitespace-nowrap">
                                            <button
                                              type="button"
                                              className={`px-2.5 py-1 rounded text-[9.5px] font-extrabold uppercase transition-all shadow-2xs ${isHighlighted ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-800 text-white hover:bg-slate-900'
                                                }`}
                                            >
                                              + Add
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Item Code Search Field */}
                      <td ref={itemCodeContainerRef} className="border-r border-slate-300 p-0.5 relative">
                        <input
                          id="itemCodeSearchInput"
                          type="text"
                          className="w-full bg-white border border-blue-300 outline-none p-1 text-xs focus:bg-yellow-100 font-bold uppercase placeholder-slate-500 font-mono cursor-pointer shadow-inner"
                          placeholder="SEARCH(F4)"
                          value={itemCodeSearchInput}
                          onChange={(e) => setItemCodeSearchInput(e.target.value)}
                          onKeyDown={handleItemCodeKeyDown}
                        />
                      </td>
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>
                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>
                      <td className="p-1 bg-slate-50/50"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Grid Footer */}
              <div className="bg-[#f0f0f0] p-1 text-[10px] text-right border-b border-slate-400 text-slate-600">
                Rows: {cart.length + 1} Cols: 14 Average: 0 Count: {cart.length} Sum: {(cart.reduce((a, b) => a + b.quantity, 0))}
              </div>

              {/* Bottom Left Summary & Bottom Action Toolbar */}
              <div className="flex flex-col bg-[#e1e1e1] p-1 gap-1">

                {/* Summary & GST Configuration Container */}
                <div className="flex flex-wrap items-start gap-1.5">
                  {/* Summary Block */}
                  <div className="bg-white border border-slate-400 w-[390px] p-1 shadow-sm">
                    <table className="w-full text-xs font-bold text-slate-700 table-fixed">
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 p-1 px-2 bg-[#f0f0f0] w-24">Gross Amt</td>
                          <td className="border border-slate-300 p-1 px-2 text-right text-blue-600 w-24">{(subTotal || 0).toFixed(2)}</td>
                          <td className="border border-slate-300 p-1 px-2 bg-[#f0f0f0] w-24">Disc Amt</td>
                          <td className="border border-slate-300 p-1 px-2 text-right text-red-600 w-24">{(discountTotal || 0).toFixed(2)}</td>
                        </tr>
                        {isGstApplied && (
                          <>
                            <tr>
                              <td className="border border-slate-300 p-1 px-2 bg-[#f0f0f0]">Taxable Amt</td>
                              <td className="border border-slate-300 p-1 px-2 text-right text-slate-800 font-mono">₹{(taxableAmount || 0).toFixed(2)}</td>
                              <td className="border border-slate-300 p-1 px-2 bg-[#f0f0f0]">Total Tax</td>
                              <td className="border border-slate-300 p-1 px-2 text-right text-purple-700 font-mono">₹{(totalTax || 0).toFixed(2)}</td>
                            </tr>
                            {igstAmount > 0 ? (
                              <tr>
                                <td className="border border-slate-300 p-1 px-2 bg-[#f0f0f0]">IGST ({gstRateInput}%)</td>
                                <td className="border border-slate-300 p-1 px-2 text-right text-purple-600 font-mono" colSpan={3}>₹{igstAmount.toFixed(2)}</td>
                              </tr>
                            ) : (
                              <tr>
                                <td className="border border-slate-300 p-1 px-2 bg-[#f0f0f0]">CGST ({cgstRateInput}%)</td>
                                <td className="border border-slate-300 p-1 px-2 text-right text-indigo-600 font-mono">₹{cgstAmount.toFixed(2)}</td>
                                <td className="border border-slate-300 p-1 px-2 bg-[#f0f0f0]">SGST ({sgstRateInput}%)</td>
                                <td className="border border-slate-300 p-1 px-2 text-right text-indigo-600 font-mono">₹{sgstAmount.toFixed(2)}</td>
                              </tr>
                            )}
                          </>
                        )}
                        <tr>
                          <td className="border border-slate-300 p-1 px-2 bg-[#f0f0f0]">Net Amt</td>
                          <td className="border border-slate-300 p-1 px-2 text-right text-blue-600">{(grandTotal || 0).toFixed(2)}</td>
                          <td className="border border-slate-300 p-1 px-2 bg-[#f0f0f0]">Payable</td>
                          <td className="border border-slate-300 p-1 px-2 text-right text-emerald-600">{(grandTotal || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1 px-2 bg-[#f0f0f0]">Quantity</td>
                          <td className="border border-slate-300 p-1 px-2 text-right text-emerald-600" colSpan={3}>{cart.reduce((a, b) => a + b.quantity, 0)} PCS</td>
                        </tr>
                      </tbody>
                    </table>
                    {/* Applied Discount Block */}
                    {appliedDiscountsList && appliedDiscountsList.length > 0 && (
                      <div className="w-full mt-1 space-y-1">
                        {appliedDiscountsList.map(d => (
                          <div key={d.id} className="bg-indigo-50 border border-indigo-200 p-2 shadow-sm rounded-md flex justify-between items-center text-xs font-bold text-indigo-800">
                            <span>Applied: {d.name} ({d.amount} OFF)</span>
                            <button
                              onClick={() => {
                                if (d.type === 'Manual') {
                                  setManualDiscountIds(prev => prev.filter(id => id !== d.id));
                                } else if (d.type === 'Legacy') {
                                  setCouponCode("");
                                } else {
                                  setRejectedAutoDiscountIds(prev => [...prev, d.id]);
                                }
                              }}
                              className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-2 py-0.5 rounded shadow-sm text-[10px] cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Bill Adjustment Block */}
                    {billAdjustment && billAdjustment.amount > 0 && (
                      <div className="w-full mt-1 space-y-1">
                        <div className="bg-yellow-50 border border-yellow-200 p-2 shadow-sm rounded-md flex justify-between items-center text-xs font-bold text-slate-800">
                          <span>Bill Adjustment ({billAdjustment.operation === 'Charge' ? 'Service Charge' : 'Discount'})</span>
                          <div className="flex items-center gap-2">
                            <span className={billAdjustment.operation === 'Charge' ? "text-emerald-600" : "text-red-600"}>
                              {billAdjustment.operation === 'Charge' ? '+' : '-'}₹{(billAdjustment.amount || 0).toLocaleString()}
                            </span>
                            <button
                              onClick={() => {
                                setBillAdjustment({ type: 'Amount', operation: 'Discount', value: '', amount: 0, reason: '', isApproved: false });
                              }}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded shadow-sm text-[10px] cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* GST CONFIGURATION PANEL */}
                  <div className="bg-white border border-slate-400 p-2 shadow-sm rounded-sm text-xs space-y-2 w-[440px]">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <span className="font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                        GST CONFIGURATION
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${isGstApplied ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                        {isGstApplied ? 'GST Applied ✓' : 'GST Inactive'}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium">
                      Bill GST applies to all items. An item GST slab overrides it for that product only.
                    </p>

                    <div className="grid grid-cols-4 gap-1.5 items-center font-mono">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase">GST %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={gstRateInput}
                          onChange={(e) => handleGstRateChange(e.target.value)}
                          className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase">CGST %</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={cgstRateInput}
                          onChange={(e) => handleCgstRateChange(e.target.value)}
                          className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase">SGST %</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={sgstRateInput}
                          onChange={(e) => handleSgstRateChange(e.target.value)}
                          className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase">IGST %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={igstRateInput}
                          onChange={(e) => handleIgstRateChange(e.target.value)}
                          className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 gap-2">
                      {isGstApplied ? (
                        <button
                          type="button"
                          onClick={handleRemoveGst}
                          className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                        >
                          Remove GST
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyGst}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                        >
                          APPLY GST
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-wrap gap-1 mt-1 bg-white border border-slate-400 p-1 shadow-sm">
                  {[
                    { id: "newBill", label: "New Bill (F1)", icon: <FileText className="w-5 h-5 text-blue-500 mx-auto" />, onClick: () => handleClearBillContext("New Bill", "Cart cleared for new bill.") },
                    { id: "modify", label: "Alteration (Alt+A)", icon: <AlertCircle className="w-5 h-5 text-yellow-500 mx-auto" />, onClick: () => handleOpenAlterationForSelectedProduct() },
                    { id: "payment", label: "Payment (F6)", icon: <CreditCard className="w-5 h-5 text-green-500 mx-auto" />, onClick: handleOpenPaymentFlow },
                    { id: "save", label: "Save (F7)", icon: <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />, onClick: handleCheckoutSubmit },
                    { id: "print", label: "Print (F9)", icon: <Printer className="w-5 h-5 text-blue-600 mx-auto" />, onClick: handleOpenDraftPreview },
                    { id: "delete", label: "Delete (Alt+X)", icon: <Trash2 className="w-5 h-5 text-red-500 mx-auto" />, onClick: () => handleClearBillContext() },
                    { id: "hold", label: "Hold (F8)", icon: <AlertCircle className="w-5 h-5 text-red-700 mx-auto" />, onClick: handleHoldBill },
                    { id: "customer", label: "Customer (F3)", icon: <User className="w-5 h-5 text-orange-500 mx-auto" />, onClick: () => { document.getElementById("mobileSearchInput")?.focus() } },
                    { id: "searchItem", label: "Search Item (F2)", icon: <Search className="w-5 h-5 text-blue-400 mx-auto" />, onClick: () => setIsItemSearchModalOpen(true) },
                    { id: "itemCodeSearch", label: "Item Code (F4)", icon: <Search className="w-5 h-5 text-purple-600 mx-auto" />, onClick: handleFocusItemCodeSearch },
                    { id: "designNoSearch", label: "Design No (Alt+D)", icon: <Search className="w-5 h-5 text-indigo-600 mx-auto" />, onClick: handleFocusDesignNoSearch },
                    { id: "viewTotals", label: "Cash Summary", icon: <Search className="w-5 h-5 text-blue-600 mx-auto" />, onClick: () => setShowTotalsModal(true) },
                    { id: "prevBill", label: "Previous Bill (<)", icon: <ChevronsLeft className="w-5 h-5 text-green-600 mx-auto" />, onClick: handleLoadPreviousBill },
                    { id: "nextBill", label: "Next Bill (>)", icon: <ChevronRight className="w-5 h-5 text-green-600 mx-auto" />, onClick: handleLoadNextBill },
                    {
                      id: "enterReturns", label: "Returns (R)", icon: <RotateCcw className="w-5 h-5 text-green-600 mx-auto" />, onClick: () => {
                        if (loadedOriginalInvoice) setSelectedInvoiceForReturn({ ...loadedOriginalInvoice, items: unrollInvoiceItems(loadedOriginalInvoice.items || []) });
                        setReturnActionType("return");
                        setActivePOSMode("returns");
                      }
                    },
                    {
                      id: "recvChallan", label: "Exchange (E)", icon: <FileText className="w-5 h-5 text-slate-600 mx-auto" />, onClick: () => {
                        if (loadedOriginalInvoice) setSelectedInvoiceForReturn({ ...loadedOriginalInvoice, items: unrollInvoiceItems(loadedOriginalInvoice.items || []) });
                        setReturnActionType("exchange");
                        setActivePOSMode("returns");
                      }
                    },
                    { id: "config", label: "Discount (D)", icon: <AlertCircle className="w-5 h-5 text-slate-600 mx-auto" />, onClick: () => setShowDiscountSelectionModal(true) },
                    { id: "adjustments", label: "Adjustments (A)", icon: <AlertCircle className="w-5 h-5 text-indigo-600 mx-auto" />, onClick: () => setShowAdjustmentModal(true) },
                    { id: "clearBill", label: "Clear Bill (C)", icon: <X className="w-5 h-5 text-red-600 mx-auto" />, onClick: () => handleClearBillContext() },
                    { id: "viewHolds", label: "View Holds (F5)", icon: <Clock className="w-5 h-5 text-orange-600 mx-auto" />, onClick: handleResumeBill },
                    { id: "challanModal", label: "Retv Challans", icon: <FileText className="w-5 h-5 text-slate-600 mx-auto" />, onClick: () => setShowChallanModal(true) },
                    { id: "otherDetails", label: "Other Details", icon: <FileText className="w-5 h-5 text-indigo-600 mx-auto" />, onClick: () => setShowOtherDetailsModal(true) },
                    { id: "closePos", label: "Close", icon: <X className="w-5 h-5 text-red-600 mx-auto" />, onClick: () => { if (window.confirm('Close POS?')) window.location.href = '/'; } },
                    { id: "loyaltyCustomer", label: "Loyalty (L)", icon: <User className="w-5 h-5 text-red-500 mx-auto" />, onClick: () => document.getElementById("mobileSearchInput")?.focus() }
                  ].map(btn => (
                    <button key={btn.id} onClick={btn.onClick || (() => { })} className="w-[68px] h-[58px] flex flex-col items-center justify-center bg-gradient-to-b from-white to-[#e5e5e5] border border-slate-300 hover:to-white shadow-sm text-[9px] leading-[1.1] text-center p-1 rounded-sm">
                      {btn.icon}
                      <span className="mt-1 font-semibold">{btn.label}</span>
                    </button>
                  ))}
                </div>

                {/* Status Bar */}
                <div className="text-[10px] text-slate-600 mt-0.5 flex justify-between px-1">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Options Shift Last Bill Details - Last Bill No:NFS-983 Time: {new Date().toLocaleTimeString()} Bill Amount: {grandTotal} Qty: {cart.reduce((a, b) => a + b.quantity, 0)}</span>
                  <span>F6=Sch F9=Other Details Ctrl+F9=Print Copies</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ALTERATION PANEL */}
            <div className="w-[200px] flex-shrink-0 flex flex-col bg-[#e1e1e1] border border-slate-400">

              {/* Selected Product Image (ABOVE ALTERATION) */}
              <div className="bg-white border-b border-slate-400 p-2 flex flex-col items-center justify-center min-h-[160px]">
                {(() => {
                  const activeImgItem = selectedSearchItem || (focusedAlterationIndex >= 0 ? cart[focusedAlterationIndex] : null);
                  if (activeImgItem?.imageUrl) {
                    return <img src={activeImgItem.imageUrl} alt="Product" className="max-h-[150px] object-contain rounded shadow-sm" />;
                  }
                  return (
                    <div className="text-slate-400 text-xs text-center flex flex-col items-center gap-2">
                      <ImageIcon className="w-8 h-8 opacity-50" />
                      <span>No Image</span>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-[#555] text-center py-1.5 px-1 border-b border-slate-500 text-white shadow-inner flex flex-col items-center justify-center gap-1 uppercase tracking-wider" style={{ background: 'linear-gradient(to bottom, #6b7280, #4b5563)' }}>
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-white">
                  <Scissors className="w-3.5 h-3.5 text-white" />
                  <span>Alteration Panel</span>
                </div>
                <div className="inline-flex items-center gap-1 bg-black/25 px-2 py-0.5 rounded text-[9px] font-bold font-sans text-slate-100 border border-white/20 normal-case tracking-normal">
                  <span>Alt + A</span>
                  <span className="text-slate-300">→</span>
                  <span>Focus Panel</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 custom-scrollbar bg-slate-50">
                {cart.length === 0 ? (
                  <div className="text-center text-slate-400 py-8 text-[10px]">
                    No items in bill.
                  </div>
                ) : (
                  cart.map((item, idx) => {
                    const hasAlt = !!(item.hasAlteration || item.alterationRecord);
                    const hasPSSM = !!(item.hasPSSM || item.pssmRecord || item.pssmNo);
                    const pssStatus = item.pssmItemStatus || item.pssmRecord?.status || 'PENDING_ASSIGNMENT';
                    const isCollected = pssStatus === 'COLLECTED' || pssStatus === 'CLOSED';
                    const isFocused = isAlterationModeActive && focusedAlterationIndex === idx;
                    const barcodeText = item.barcode || item.barcodeNo || item.uniqueCode || item.itemCode || 'N/A';

                    const handleToggleAlterationMark = () => {
                      setFocusedAlterationIndex(idx);
                      setIsAlterationModeActive(true);
                      setCart(prev => {
                        const next = [...prev];
                        const cur = next[idx];
                        const nextHasAlt = !cur.hasAlteration;
                        next[idx] = {
                          ...cur,
                          hasAlteration: nextHasAlt,
                          alterationStatus: nextHasAlt ? 'PENDING' : 'NONE'
                        };
                        return next;
                      });
                      if (!hasAlt && onAddNotification) {
                        onAddNotification(
                          "Marked for Alteration",
                          `${item.name} marked for alteration. Complete tailoring details in Alteration Module after billing.`,
                          "info"
                        );
                      }
                    };

                    const cardStyle = hasPSSM
                      ? (isCollected
                        ? 'bg-emerald-50/80 border-2 border-emerald-500 shadow-sm'
                        : pssStatus === 'READY'
                          ? 'bg-blue-50/80 border-2 border-blue-500 ring-2 ring-blue-400/30 shadow-sm'
                          : 'bg-purple-50/80 border-2 border-purple-400 ring-2 ring-purple-400/20 shadow-sm')
                      : (hasAlt
                        ? 'bg-emerald-50 border-2 border-emerald-500 ring-2 ring-emerald-400/40 shadow-sm'
                        : (isFocused
                          ? 'bg-indigo-50/90 border-2 border-indigo-600 ring-2 ring-indigo-500/30 shadow-md'
                          : 'bg-white border border-slate-300 hover:border-slate-400'));

                    return (
                      <div
                        key={idx}
                        id={`alt-panel-item-${idx}`}
                        className={`p-2 rounded-lg transition-all flex flex-col gap-1 cursor-pointer select-none ${cardStyle}`}
                        onClick={() => {
                          setSelectedCartRowIndex(idx);
                          setFocusedAlterationIndex(idx);
                          handleOpenAlterationForSelectedProduct(item, idx);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {isFocused && (
                            <span className="text-indigo-700 font-black text-xs shrink-0 animate-pulse">➢</span>
                          )}

                          {/* Custom Styled Checkbox Bracket */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAlterationMark();
                            }}
                            className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center transition-all cursor-pointer ${hasPSSM
                              ? (isCollected ? 'bg-emerald-600 border-2 border-emerald-600 text-white' : 'bg-purple-600 border-2 border-purple-600 text-white')
                              : (hasAlt
                                ? 'bg-emerald-600 border-2 border-emerald-600 text-white shadow-xs'
                                : 'bg-white border-2 border-slate-400 hover:border-emerald-500')
                              }`}
                          >
                            {(hasAlt || hasPSSM) && <Check className="w-3 h-3 text-white stroke-[3.5]" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className={`font-bold truncate text-[10px] ${hasPSSM ? (isCollected ? 'text-emerald-950 font-black' : 'text-purple-950 font-black') : (hasAlt ? 'text-emerald-950 font-extrabold' : (isFocused ? 'text-indigo-950 font-extrabold' : 'text-slate-800'))}`} title={item.name}>
                              {item.name}
                            </div>
                            <div className="text-[9.5px] font-mono text-slate-700 font-bold mt-0.5 truncate" title={`Barcode: ${barcodeText}`}>
                              Barcode: <span className="text-slate-900">{barcodeText}</span>
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono">
                              Sz: {item.size || 'M'} | Col: {item.color || 'Std'} | Qty: {item.quantity}
                            </div>

                            {/* PSSM Service Details & Status */}
                            {hasPSSM ? (
                              <div className="mt-1 bg-white/95 border border-purple-200/90 rounded p-1 text-[9px] font-mono text-purple-900 space-y-0.5 shadow-2xs">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-purple-800 truncate text-[8.5px]">
                                    PSS: {item.pssmNo || item.pssmRecord?.pssmNo}
                                  </span>
                                  <span className={`px-1 py-0.2 rounded font-black text-[7.5px] shrink-0 uppercase tracking-wider ${isCollected
                                      ? 'bg-emerald-600 text-white'
                                      : pssStatus === 'READY'
                                        ? 'bg-blue-600 text-white animate-pulse'
                                        : 'bg-amber-500 text-white'
                                    }`}>
                                    {isCollected ? 'COLLECTED' : pssStatus === 'READY' ? 'READY' : (pssStatus === 'IN_PROGRESS' ? 'IN PROGRESS' : (pssStatus || 'IN PROGRESS'))}
                                  </span>
                                </div>
                                <div className="text-[8px] text-slate-600 truncate">
                                  {item.pssmServiceType || 'Alteration'} • {item.pssmTailorName || 'Tailor'}
                                </div>

                                {/* Direct Collection Button from Billing Window */}
                                {!isCollected ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCollectPSSItemDirectly(item, idx);
                                    }}
                                    className="mt-1 w-full py-1 px-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[8.5px] rounded shadow-xs flex items-center justify-center gap-1 uppercase tracking-wider transition-all cursor-pointer"
                                    title="Collect garment directly from billing window"
                                  >
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    <span>Collect Product</span>
                                  </button>
                                ) : (
                                  <div className="mt-0.5 w-full py-0.5 px-1 bg-emerald-100/90 border border-emerald-300 text-emerald-800 font-black text-[8px] rounded flex items-center justify-center gap-1 uppercase tracking-wider">
                                    <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                                    <span>Collected</span>
                                  </div>
                                )}
                              </div>
                            ) : hasAlt ? (
                              <div className="text-[9px] text-emerald-700 font-extrabold mt-0.5 flex items-center gap-0.5">
                                <span>✔ Marked for Alteration</span>
                              </div>
                            ) : (
                              <div className="text-[8.5px] text-slate-400 italic mt-0.5">
                                Click to mark for alteration
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {activePOSMode === "history" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Historical Billing Logs
              </h3>
              <p className="text-xs text-slate-400">
                Total processed transactions: {filteredHistoryInvoices.length} invoices
                {historySearch && ` (filtered from ${invoices.length})`}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by Unique Code, Invoice #, customer..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="bg-slate-50 pl-9 pr-8 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold w-96 md:w-[450px] border border-slate-200/80"
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch("")}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total Cost</th>
                  <th className="p-3">Pay Mode</th>
                  <th className="p-3">WhatsApp</th>
                  <th className="p-3 whitespace-nowrap min-w-[270px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredHistoryInvoices.slice(0, 100).map((inv, idx) => {
                  const isReturned = inv.hasReturn || (inv.items && inv.items.some(i => i.isReturned));
                  const isExchanged = inv.hasExchange || inv.exchangeSlip || (inv.items && inv.items.some(i => i.isExchanged));
                  return (
                    <tr key={inv._id || inv.id || idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-indigo-600">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="cursor-pointer hover:underline text-slate-900 font-extrabold" onClick={() => handleDownloadReceiptHTML(inv)}>
                              {inv.invoiceNo}
                            </span>
                            {isReturned && (
                              <span className="bg-rose-100 text-rose-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-2xs">
                                ↩ RETURNED
                              </span>
                            )}
                            {isExchanged && (
                              <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-2xs">
                                🔁 EXCHANGED
                              </span>
                            )}
                            {Boolean(inv.hasAlteration && !inv.hasPSSM) && (
                              <span className="bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-2xs">
                                ✂ ALTERATION
                              </span>
                            )}
                          </div>

                          {/* LINKED PSS TICKET & STATUS */}
                          {(inv.hasPSSM || inv.pssmNo || inv.pssmRecord) && (() => {
                            const pssRecordItems = inv.pssmRecord?.items || [];
                            const allItemsCollected = pssRecordItems.length > 0 && pssRecordItems.every(i => i.status === 'COLLECTED' || i.status === 'CLOSED');
                            const rawStatus = inv.pssmStatus || inv.pssmRecord?.status;
                            const displayStatus = (allItemsCollected || rawStatus === 'CLOSED' || rawStatus === 'COLLECTED')
                              ? 'CLOSED'
                              : (rawStatus || 'PENDING');
                            return (
                              <div className="bg-purple-50/90 border border-purple-200/90 rounded-lg p-2 space-y-1 text-left">
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">PSS Ticket:</span>
                                  <span className="font-mono font-extrabold text-purple-800">{inv.pssmNo || inv.pssmRecord?.pssmNo}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">PSS Status:</span>
                                  <span className={`font-black uppercase px-2 py-0.5 rounded-md text-[9px] border ${displayStatus === 'CLOSED'
                                      ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                                      : displayStatus === 'READY_FOR_DELIVERY' || displayStatus === 'READY'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : displayStatus === 'PARTIALLY_COLLECTED'
                                          ? 'bg-teal-100 text-teal-800 border-teal-300'
                                          : displayStatus === 'PARTIALLY_READY'
                                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                                            : displayStatus === 'IN_PROGRESS' || displayStatus === 'ASSIGNED'
                                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                                              : 'bg-amber-100 text-amber-800 border-amber-300'
                                    }`}>
                                    {displayStatus.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="p-3">{inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                      <td className="p-3 font-medium text-slate-800">
                        {inv.customerName || inv.customerId?.name || inv.pssmRecord?.customerName || "Walk-in"}
                      </td>
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
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                          {/* SEPARATE BUTTON 1: VIEW ORIGINAL INVOICE */}
                          <button
                            type="button"
                            onClick={() => handleDownloadReceiptHTML(inv)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer border border-indigo-200 transition-colors shadow-2xs shrink-0"
                            title="View / Print Original Invoice"
                          >
                            <FileText className="w-3 h-3 text-indigo-600" />
                            <span>VIEW INVOICE</span>
                          </button>

                          {/* SEPARATE BUTTON 2: VIEW PSS SLIP (IF LINKED) */}
                          {(inv.hasPSSM || inv.pssmNo || inv.pssmRecord) && (
                            <button
                              type="button"
                              onClick={() => handleOpenPSSSlipFromInvoice(inv)}
                              className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer border border-purple-200 transition-colors shadow-2xs shrink-0"
                              title="View / Print Separate PSS Slip"
                            >
                              <Tag className="w-3 h-3 text-purple-600" />
                              <span>VIEW PSS</span>
                            </button>
                          )}
                          {isExchanged && (
                            <button
                              onClick={() => {
                                if (inv.exchangeSlip) {
                                  setCompletedExchangeSlip(inv.exchangeSlip);
                                  setShowExchangeSlipModal(true);
                                } else {
                                  const exItem = inv.items?.find(i => i.isExchanged);
                                  const docket = {
                                    docketNo: `EXCH-${(inv._id || inv.id || '001').slice(-6)}`,
                                    originalInvoiceNo: inv.invoiceNo,
                                    customerName: inv.customerName,
                                    customerPhone: inv.customerPhone,
                                    reason: exItem?.exchangeReason || "Product Exchange",
                                    oldItem: { name: exItem?.name || "Original Garment", size: exItem?.size || "M", color: exItem?.color || "Std", price: exItem?.totalPrice || 1000 },
                                    newItem: { name: exItem?.exchangedFor || "Exchanged Garment", sku: "EXCH", size: "M", color: "Std", price: exItem?.totalPrice || 1000 },
                                    priceDiff: 0,
                                    cashierName: currentUser ? currentUser.name : "Store Cashier",
                                    createdAt: inv.date || new Date().toISOString()
                                  };
                                  setCompletedExchangeSlip(docket);
                                  setShowExchangeSlipModal(true);
                                }
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer border border-indigo-200"
                            >
                              <RefreshCw className="w-3 h-3 text-indigo-600" />
                              <span>Exchange Slip</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditPayMethodModal({ inv });
                              setEditPayMethodValue(inv.paymentMethod || "Cash");
                            }}
                            className="text-amber-500 hover:text-amber-700 p-1 rounded hover:bg-amber-50 cursor-pointer transition-colors shrink-0"
                            title="Edit Payment Method"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm("Are you sure you want to permanently delete this invoice? This will revert inventory back to available stock.")) {
                                try {
                                  const res = await api.delete(`/billing/${inv._id || inv.id}`);
                                  if (res.data.success) {
                                    if (onAddNotification) onAddNotification("Success", "Invoice deleted successfully", "success");
                                    // Remove locally to update UI fast
                                    setHistoryInvoices(prev => prev.filter(i => (i._id || i.id) !== (inv._id || inv.id)));
                                  } else {
                                    if (onAddNotification) onAddNotification("Error", res.data.message || "Failed to delete invoice", "danger");
                                  }
                                } catch (error) {
                                  if (onAddNotification) onAddNotification("Error", error.response?.data?.message || "Failed to delete invoice", "danger");
                                }
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors shrink-0"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {isLoadingInvoices ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Preparing Invoice History... Please wait.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHistoryInvoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 text-xs font-medium">
                        No invoices found matching "{historySearch}".
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode: Returns & Exchanges Setup */}
      {activePOSMode === "returns" && (
        <div className="space-y-6 animate-fade-in font-sans">

          {/* ─── TOP SEARCH BAR FOR INVOICE OR CUSTOMER ─── */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-indigo-600" />
                  <span>Lookup Invoice for Return or Exchange</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Search by Invoice Number, Customer Name, or Phone Number to load past transaction.
                </p>
              </div>
              {selectedInvoiceForReturn && (
                <button
                  onClick={() => {
                    setSelectedInvoiceForReturn(null);
                    setReturnedItemIds([]);
                    setExchangeSelectedNewProduct(null);
                    setReturnSearchQuery("");
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 cursor-pointer"
                >
                  Clear Selected Invoice
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search invoice # (e.g. INV-98347457), customer name, phone number, or unique code..."
                value={returnSearchQuery}
                onChange={(e) => setReturnSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-2xs"
              />
              {returnSearchQuery && (
                <button
                  onClick={() => setReturnSearchQuery("")}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Instant Real-Time Search Results Dropdown List */}
            {returnSearchQuery && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                {invoices
                  .filter((inv) =>
                    (inv.invoiceNo || "").toLowerCase().includes(returnSearchQuery.toLowerCase().trim()) ||
                    (inv.customerName || "").toLowerCase().includes(returnSearchQuery.toLowerCase().trim()) ||
                    (inv.customerPhone || "").toLowerCase().includes(returnSearchQuery.toLowerCase().trim()) ||
                    (inv.items || []).some(item => (item.uniqueCode || "").toLowerCase().includes(returnSearchQuery.toLowerCase().trim()))
                  )
                  .map((inv) => (
                    <div
                      key={inv._id || inv.id || inv.invoiceNo}
                      onClick={() => {
                        const invDate = new Date(inv.date || inv.createdAt);
                        const today = new Date();
                        const diffTime = Math.abs(today - invDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays > 7) {
                          setReturnWarning({
                            show: true,
                            title: "Return Policy Exceeded",
                            message: `This invoice was generated ${diffDays} days ago. The standard return period is 7 days.\nIt has exceeded the return period by ${diffDays - 7} days.\nOwner approval may be required.`
                          });
                        }

                        const unrolledInv = {
                          ...inv,
                          items: unrollInvoiceItems(inv.items)
                        };
                        setSelectedInvoiceForReturn(unrolledInv);
                        const barcodeToSearch = inv.billBarcode || inv.invoiceNo || inv.billNo;
                        if (barcodeToSearch) {
                          fetchAndEnrichPSSM(inv).then(pssmData => {
                            if (pssmData) {
                              setSelectedInvoiceForReturn(prev => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  items: matchAndTagPSSMOnItems(prev.items, pssmData),
                                  pssmRecord: pssmData.pssm
                                };
                              });
                            }
                          }).catch(() => { });
                        }
                        setReturnSearchQuery("");
                        setReturnedItemIds([]);
                        setExchangeSelectedNewProduct(null);
                        setExchangeOldItemIdx(0);
                      }}
                      className="p-3.5 hover:bg-indigo-50/70 cursor-pointer flex justify-between items-center transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-600">{inv.invoiceNo}</span>
                          <span className="font-extrabold text-slate-800">• {inv.customerName}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Phone: {inv.customerPhone || "Walk-in"} | Date: {inv.date ? new Date(inv.date).toLocaleDateString("en-IN") : "-"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-800 text-xs">₹{inv.grandTotal.toLocaleString()}</span>
                        <p className="text-[10px] text-slate-400">{(inv.items || []).length} item(s)</p>
                      </div>
                    </div>
                  ))}
                {invoices.filter((inv) =>
                  (inv.invoiceNo || "").toLowerCase().includes(returnSearchQuery.toLowerCase().trim()) ||
                  (inv.customerName || "").toLowerCase().includes(returnSearchQuery.toLowerCase().trim()) ||
                  (inv.customerPhone || "").toLowerCase().includes(returnSearchQuery.toLowerCase().trim()) ||
                  (inv.items || []).some(item => (item.uniqueCode || "").toLowerCase().includes(returnSearchQuery.toLowerCase().trim()))
                ).length === 0 && (
                    <div className="p-4 text-center text-slate-400 font-medium">
                      No matching invoices found for "{returnSearchQuery}".
                    </div>
                  )}
              </div>
            )}
          </div>

          {!selectedInvoiceForReturn ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400 space-y-2">
              <RotateCcw className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
              <p className="font-bold text-slate-600 text-sm">No Invoice Selected</p>
              <p className="text-xs">
                Use the search bar above or select a past invoice to evaluate return or exchange eligibility.
              </p>
            </div>
          ) : (
            (() => {
              let implicitDiscount = 0;
              if (selectedInvoiceForReturn.splitPayments && selectedInvoiceForReturn.splitPayments.length > 0) {
                const totalSplitPaid = selectedInvoiceForReturn.splitPayments.reduce((acc, sp) => acc + (Number(sp.amount) || 0), 0);
                const hasDue = selectedInvoiceForReturn.splitPayments.some(sp => (sp.method || sp.mode || '').toUpperCase() === 'DUE');
                if (totalSplitPaid < selectedInvoiceForReturn.grandTotal && !hasDue && totalSplitPaid > 0) {
                  implicitDiscount = selectedInvoiceForReturn.grandTotal - totalSplitPaid;
                }
              } else if (selectedInvoiceForReturn.amountPaid !== undefined && selectedInvoiceForReturn.amountPaid < selectedInvoiceForReturn.grandTotal && selectedInvoiceForReturn.amountPaid > 0) {
                implicitDiscount = selectedInvoiceForReturn.grandTotal - selectedInvoiceForReturn.amountPaid;
              }

              const hasManualAdj = selectedInvoiceForReturn.billAdjustment && selectedInvoiceForReturn.billAdjustment.amount > 0;
              const hasImplicitAdj = implicitDiscount > 0;
              const totalAdjAmt = (hasManualAdj ? (selectedInvoiceForReturn.billAdjustment.operation === 'Charge' ? -selectedInvoiceForReturn.billAdjustment.amount : selectedInvoiceForReturn.billAdjustment.amount) : 0) + implicitDiscount;

              return (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                  {/* LEFT COLUMN: SELECTED INVOICE DETAILS & MODE SWITCHER */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:col-span-5 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Selected Invoice Details
                      </h4>
                      <span
                        className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
                        onClick={() => setShowBillPreviewInvoice(selectedInvoiceForReturn)}
                        title="Click to view full receipt"
                      >
                        {selectedInvoiceForReturn.invoiceNo}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Customer Name:</span>
                        <span className="font-bold text-slate-800">{selectedInvoiceForReturn.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Customer Phone:</span>
                        <span className="font-mono text-slate-700">{selectedInvoiceForReturn.customerPhone || 'Walk-in'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date Issued:</span>
                        <span className="font-mono text-slate-700">
                          {selectedInvoiceForReturn.date ? new Date(selectedInvoiceForReturn.date).toLocaleString('en-IN') : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Grand Total:</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{selectedInvoiceForReturn.grandTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payment Route:</span>
                        <span className="font-bold text-emerald-600">{selectedInvoiceForReturn.paymentMethod}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-200">
                        <button
                          onClick={() => setShowBillPreviewInvoice(selectedInvoiceForReturn)}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] py-2 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          <FileText className="w-4 h-4" />
                          View Full Original Receipt
                        </button>
                      </div>
                    </div>

                    {/* MODE SELECTION BUTTONS: RETURN vs EXCHANGE */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Choose Workflow Action:
                      </label>
                      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setReturnActionType('return')}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${returnActionType === 'return' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>RETURN ITEMS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReturnActionType('exchange')}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${returnActionType === 'exchange' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>EXCHANGE ITEMS</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: ACTION PANELS */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:col-span-7 space-y-5">

                    {/* ─── RETURN PANEL WORKFLOW ─── */}
                    {returnActionType === 'return' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                            <RotateCcw className="w-4 h-4" />
                            <span>Process Item Return & Credit Refund</span>
                          </h4>
                        </div>

                        {/* Reason for Return */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Reason for Return:
                          </label>
                          <select
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-rose-500"
                          >
                            <option value="">None / Optional (Fast Checkout)</option>
                            <option value="Defective / Damaged">Defective / Damaged Garment</option>
                            <option value="Wrong Size / Fit Issue">Wrong Size / Fit Issue</option>
                            <option value="Customer Changed Mind">Customer Changed Mind</option>
                            <option value="Quality Dissatisfaction">Quality Dissatisfaction</option>
                            <option value="Other">Other (Specify Custom Text)</option>
                          </select>
                          {returnReason === "Other" && (
                            <input
                              type="text"
                              value={returnCustomReason}
                              onChange={(e) => setReturnCustomReason(e.target.value)}
                              placeholder="Enter specific return reason details..."
                              className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                            />
                          )}
                        </div>

                        {/* Select Items to Return */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            Select Items to Return:
                          </label>
                          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-60 overflow-y-auto space-y-2">
                            {selectedInvoiceForReturn.items.map((item, idx) => {
                              const targetId = item.unitId || `${item.productId || item.id}-${idx}`;
                              const isChecked = returnedItemIds.includes(targetId);
                              return (
                                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (!isChecked && (item.hasAlteration || !!item.alterationRecord || item.hasPSSM || !!item.pssmRecord || item.pssmNo)) {
                                          const isPSS = !!(item.hasPSSM || item.pssmRecord || item.pssmNo);
                                          const pssStatus = (item.pssmItemStatus || item.pssmRecord?.status || 'IN PROGRESS').replace(/_/g, ' ');
                                          const serviceDone = item.pssmServiceType || (Array.isArray(item.pssmAlterationDetails) && item.pssmAlterationDetails.length > 0 ? item.pssmAlterationDetails.join(', ') : '') || 'Alteration';
                                          setReturnWarning({
                                            show: true,
                                            title: isPSS ? `PSSM Service (${serviceDone}) Detected` : "Alteration Detected",
                                            message: isPSS
                                              ? `This garment had "${serviceDone}" service performed under PSS docket ${item.pssmNo || item.pssmRecord?.pssmNo || ''}. Current status: [${pssStatus}]. Tailor: ${item.pssmTailorName || item.pssmRecord?.tailorName || 'Assigned'}. Garments with services require manager authorization before processing returns.`
                                              : "This item has been previously altered. By default, altered garments cannot be returned. Please consult the store owner for approval before proceeding."
                                          });
                                          if (onAddNotification) {
                                            onAddNotification(
                                              isPSS ? `PSSM Service: ${serviceDone}` : "Alteration Detected",
                                              `Item ${item.name} has service [${serviceDone}] (Status: ${pssStatus}).`,
                                              "warning"
                                            );
                                          }
                                        }
                                        const targetId = item.unitId || `${item.productId || item.id}-${idx}`;
                                        setReturnedItemIds((prev) =>
                                          isChecked ? prev.filter((id) => id !== targetId) : [...prev, targetId]
                                        );
                                      }}
                                      className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                                    />
                                    <div>
                                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <span>{item.name}</span>
                                        {item.isReturned && (
                                          <span className="bg-rose-100 text-rose-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                            RETURNED
                                          </span>
                                        )}
                                        {item.isExchanged && (
                                          <span className="bg-indigo-100 text-indigo-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                            EXCHANGED
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-mono">
                                        Size: {item.size || 'M'} | Color: {item.color || 'Std'} | Qty: {item.quantity}
                                      </p>
                                      {!!(item.hasAlteration || item.alterationRecord) && (
                                        <div className="mt-1.5 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-lg text-[10px] font-mono text-amber-900 flex items-center gap-1.5">
                                          <Scissors className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                          <span>
                                            <strong>Alteration:</strong> {item.alterationRecord?.garmentType || 'Custom'} fit | Tailor: {item.alterationRecord?.tailorName || item.workerName || 'Master Tailor'} | Delivery: {item.alterationRecord?.deliveryDate ? new Date(item.alterationRecord.deliveryDate).toLocaleDateString('en-IN') : 'Scheduled'}
                                          </span>
                                        </div>
                                      )}
                                      {!!(item.hasPSSM || item.pssmRecord || item.pssmNo) && (
                                        <div className="mt-1.5 bg-purple-50 border border-purple-200 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-purple-900 flex flex-col gap-1 shadow-2xs">
                                          <div className="flex items-center justify-between gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                              <Scissors className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                              <span>
                                                <strong className="text-purple-950">Service Done:</strong>{' '}
                                                <span className="bg-purple-200/90 text-purple-900 font-black px-1.5 py-0.5 rounded text-[9.5px]">
                                                  {item.pssmServiceType || 'Alteration'}
                                                </span>
                                              </span>
                                            </div>
                                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${(item.pssmItemStatus || item.pssmRecord?.status) === 'COLLECTED' || (item.pssmItemStatus || item.pssmRecord?.status) === 'CLOSED'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : (item.pssmItemStatus || item.pssmRecord?.status) === 'READY'
                                                  ? 'bg-blue-100 text-blue-800 font-bold ring-1 ring-blue-400'
                                                  : 'bg-amber-100 text-amber-800'
                                              }`}>
                                              {(item.pssmItemStatus || item.pssmRecord?.status || 'IN PROGRESS').replace(/_/g, ' ')}
                                            </span>
                                          </div>
                                          <div className="text-[8.5px] text-slate-600 flex items-center justify-between">
                                            <span>Docket: <strong>{item.pssmNo || item.pssmRecord?.pssmNo || 'PSSM'}</strong> • Tailor: {item.pssmTailorName || item.pssmRecord?.tailorName || 'Assigned Staff'}</span>
                                            {Array.isArray(item.pssmAlterationDetails) && item.pssmAlterationDetails.length > 1 && (
                                              <span className="italic text-purple-700">Details: {item.pssmAlterationDetails.join(', ')}</span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold font-mono text-slate-800">
                                    ₹{(item.totalPrice || item.price * item.quantity).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {(hasManualAdj || hasImplicitAdj) && (
                          <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 flex items-start gap-2.5 animate-fade-in mb-3">
                            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-orange-800 font-bold text-xs block">Manual Bill Adjustment / Short Pay Applied</span>
                              <span className="text-orange-600 text-[10.5px] font-medium leading-tight block mt-0.5">
                                This bill had a net adjustment of -₹{totalAdjAmt}. The estimated refund amount is proportionally adjusted downwards.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Refund Estimate */}
                        <div className="flex justify-between items-center bg-rose-50 p-3.5 rounded-xl border border-rose-200">
                          <span className="text-xs font-bold text-rose-900">Estimated Refund Amount:</span>
                          <span className="font-mono font-black text-rose-600 text-base">
                            ₹{(() => {
                              let rAmt = selectedInvoiceForReturn.items
                                .filter((item, idx) => returnedItemIds.includes(item.unitId || `${item.productId || item.id}-${idx}`))
                                .reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0);
                              if (totalAdjAmt > 0) {
                                const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * i.quantity)), 0) || 1;
                                const adjustmentRatio = totalAdjAmt / totalItemsPrice;
                                const proportionalAdjustment = rAmt * adjustmentRatio;
                                rAmt -= proportionalAdjustment;
                                rAmt = Math.floor(rAmt);
                              } else if (hasManualAdj && selectedInvoiceForReturn.billAdjustment.operation === 'Charge') {
                                const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * i.quantity)), 0) || 1;
                                const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
                                const proportionalAdjustment = rAmt * adjustmentRatio;
                                rAmt += proportionalAdjustment;
                                rAmt = Math.floor(rAmt);
                              }
                              return rAmt.toLocaleString();
                            })()}
                          </span>
                        </div>

                        {/* Advance / Wallet Logic */}
                        <div className="flex flex-col gap-3 mt-4">
                          <label className="text-xs font-bold text-slate-700 uppercase">Select Refund Destination:</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div
                              onClick={() => setReturnRefundMode('DIRECT_REFUND')}
                              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${returnRefundMode === 'DIRECT_REFUND' ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                            >
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${returnRefundMode === 'DIRECT_REFUND' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                {returnRefundMode === 'DIRECT_REFUND' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                              <div>
                                <p className={`text-sm font-bold ${returnRefundMode === 'DIRECT_REFUND' ? 'text-indigo-900' : 'text-slate-700'}`}>Refund to Customer</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Give money back directly</p>
                              </div>
                            </div>

                            <div
                              onClick={() => setReturnRefundMode('ADD_TO_ADVANCE')}
                              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${returnRefundMode === 'ADD_TO_ADVANCE' ? 'bg-amber-50 border-amber-500 shadow-sm' : 'bg-white border-slate-200 hover:border-amber-300'}`}
                            >
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${returnRefundMode === 'ADD_TO_ADVANCE' ? 'border-amber-600 bg-amber-600' : 'border-slate-300'}`}>
                                {returnRefundMode === 'ADD_TO_ADVANCE' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                              <div>
                                <p className={`text-sm font-bold ${returnRefundMode === 'ADD_TO_ADVANCE' ? 'text-amber-900' : 'text-slate-700'}`}>Save to Wallet</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Keep as advance for future</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mandatory Approval Checkbox */}

                        <label className="flex items-center gap-2.5 bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-900 text-xs font-semibold cursor-pointer mt-4">
                          <input
                            type="checkbox"
                            checked={returnApprovedCheckbox}
                            onChange={(e) => setReturnApprovedCheckbox(e.target.checked)}
                            className="w-4 h-4 text-rose-600 rounded border-amber-300 focus:ring-rose-500 cursor-pointer shrink-0"
                          />
                          <span>I approve this return request & confirm physical garment condition has been verified.</span>
                        </label>

                        <button
                          type="button"
                          onClick={async () => {
                            if (isProcessingReturn) return;
                            setIsProcessingReturn(true);
                            try {
                              const finalReason = returnReason === "Other" ? returnCustomReason : returnReason;
                              const returnedItems = selectedInvoiceForReturn.items.filter((item, idx) => returnedItemIds.includes(item.unitId || `${item.productId || item.id}-${idx}`));
                              let refundAmt = returnedItems.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0);

                              if (totalAdjAmt > 0) {
                                const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * i.quantity)), 0) || 1;
                                const adjustmentRatio = totalAdjAmt / totalItemsPrice;
                                const proportionalAdjustment = refundAmt * adjustmentRatio;
                                refundAmt -= proportionalAdjustment;
                                refundAmt = Math.floor(refundAmt);
                              } else if (hasManualAdj && selectedInvoiceForReturn.billAdjustment.operation === 'Charge') {
                                const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * i.quantity)), 0) || 1;
                                const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
                                const proportionalAdjustment = refundAmt * adjustmentRatio;
                                refundAmt += proportionalAdjustment;
                                refundAmt = Math.floor(refundAmt);
                              }

                              const updatedItems = selectedInvoiceForReturn.items.map((item, idx) => {
                                if (returnedItemIds.includes(item.unitId || `${item.productId || item.id}-${idx}`)) {
                                  return {
                                    ...item,
                                    isReturned: true,
                                    returnReason: finalReason,
                                    returnedAt: new Date().toISOString()
                                  };
                                }
                                return item;
                              });

                              const allRet = updatedItems.every(i => i.isReturned);
                              const updatedInvoice = {
                                ...selectedInvoiceForReturn,
                                hasReturn: true,
                                returnedAmount: (selectedInvoiceForReturn.returnedAmount || 0) + refundAmt,
                                status: allRet ? 'Returned' : 'Partially Returned',
                                items: updatedItems
                              };

                              let finalCustomerId = selectedInvoiceForReturn.customer?._id || selectedInvoiceForReturn.customer || selectedInvoiceForReturn.customerId;
                              if (finalCustomerId === "c-walkin") finalCustomerId = null;

                              if (returnRefundMode === 'ADD_TO_ADVANCE' && !finalCustomerId) {
                                setShowReturnCustomerModal(true);
                                return;
                              }

                              // Call Backend API to update MongoDB invoice, inventory & customer ledger
                              try {
                                const token = localStorage.getItem("token");
                                const invId = selectedInvoiceForReturn._id || selectedInvoiceForReturn.id || selectedInvoiceForReturn.invoiceNo;
                                const returnItemsPayload = returnedItems.map(item => {
                                  let itemPrice = item.totalPrice || ((item.sellingPrice || item.price || 0) * (item.quantity || 1));

                                  // Adjust for proportional short-pay/discounts if any
                                  if (selectedInvoiceForReturn.billAdjustment) {
                                    const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, it) => s + (it.totalPrice || ((it.sellingPrice || it.price || 0) * it.quantity)), 0) || 1;
                                    const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
                                    if (selectedInvoiceForReturn.billAdjustment.operation === 'Discount') {
                                      itemPrice -= (itemPrice * adjustmentRatio);
                                    } else {
                                      itemPrice += (itemPrice * adjustmentRatio);
                                    }
                                  }
                                  return {
                                    inventoryPieceId: item?.inventoryPieceId,
                                    barcode: item?.barcode || item?.uniqueCode || item?.designNo || item?.itemCode || '',
                                    refundRate: Math.floor(itemPrice),
                                    condition: 'RESELLABLE'
                                  };
                                });

                                console.log("DEBUG PAYLOAD - Items:", JSON.stringify(returnItemsPayload, null, 2));
                                console.log("DEBUG PAYLOAD - Invoice:", JSON.stringify(selectedInvoiceForReturn, null, 2));

                                await api.post(`/returns`, {
                                  saleBillId: invId,
                                  saleBillNo: selectedInvoiceForReturn.invoiceNo,
                                  customerId: finalCustomerId,
                                  refundMode: returnRefundMode,
                                  reason: finalReason,
                                  items: returnItemsPayload,
                                  forceApprove: true
                                });
                              } catch (apiErr) {
                                console.warn("Backend return endpoint call error:", apiErr.message);
                                if (onAddNotification) onAddNotification("Return Failed", apiErr.response?.data?.message || apiErr.message || "Failed to process return in backend", "danger");
                                return; // Stop execution to prevent desync
                              }

                              // Update local invoices list so Invoice History reflects returned status immediately
                              setInvoiceList(prev => prev.map(inv => (inv.invoiceNo === updatedInvoice.invoiceNo || inv._id === updatedInvoice._id) ? updatedInvoice : inv));

                              if (invoices) {
                                const idx = invoices.findIndex(i => i.invoiceNo === selectedInvoiceForReturn.invoiceNo || i._id === selectedInvoiceForReturn._id);
                                if (idx !== -1) invoices[idx] = updatedInvoice;
                              }

                              if (selectedInvoiceForReturn.customerId && onUpdateCustomerBalance) {
                                onUpdateCustomerBalance(selectedInvoiceForReturn.customerId, -refundAmt);
                              }

                              if (onAddNotification) {
                                onAddNotification("Return Approved", `Return of ₹${refundAmt.toLocaleString()} approved for ${selectedInvoiceForReturn.customerName}. Inventory & Financials recalculated.`, "success");
                              }

                              // Auto-clear data and reset selection
                              setSelectedInvoiceForReturn(null);
                              setReturnedItemIds([]);
                              setReturnApprovedCheckbox(false);
                              setReturnSearchQuery("");
                              setReturnReason("Defective / Damaged");
                              setReturnCustomReason("");
                            } finally {
                              setIsProcessingReturn(false);
                            }
                          }}
                          disabled={isProcessingReturn || (!returnApprovedCheckbox || returnedItemIds.length === 0)}
                          className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${returnApprovedCheckbox && returnedItemIds.length > 0 && !isProcessingReturn ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                          {isProcessingReturn ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing Return...
                            </>
                          ) : (
                            "Approve Return & Credit Customer Wallet"
                          )}
                        </button>
                      </div>
                    )}

                    {/* ─── EXCHANGE PANEL WORKFLOW ─── */}
                    {returnActionType === 'exchange' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                            <RefreshCw className="w-4 h-4" />
                            <span>Process Product Exchange & Issue Docket</span>
                          </h4>
                        </div>

                        {/* Reason for Exchange */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Reason for Exchange:
                          </label>
                          <select
                            value={exchangeReason}
                            onChange={(e) => setExchangeReason(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Size / Fit Swap">Size / Fit Swap</option>
                            <option value="Color Swap">Color / Hue Swap</option>
                            <option value="Defective Replacement">Defective Item Replacement</option>
                            <option value="Product Upgrade">Product Upgrade / Variant Change</option>
                            <option value="Customer Preference">Customer Preference Change</option>
                          </select>
                        </div>

                        {/* Step A: Choose Item to Return */}
                        <div className="mb-4">
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            1. Select Items from Invoice to Return / Swap Out:
                          </label>
                          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-60 overflow-y-auto space-y-2">
                            {selectedInvoiceForReturn.items.map((item, idx) => {
                              const targetId = item.unitId || `${item.productId || item.id}-${idx}`;
                              const isChecked = returnedItemIds.includes(targetId);
                              return (
                                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (!isChecked && (item.hasAlteration || !!item.alterationRecord || item.hasPSSM || !!item.pssmRecord || item.pssmNo)) {
                                          const isPSS = !!(item.hasPSSM || item.pssmRecord || item.pssmNo);
                                          const pssStatus = item.pssmItemStatus || item.pssmRecord?.status || 'IN PROGRESS';
                                          setReturnWarning({
                                            show: true,
                                            title: isPSS ? "PSSM Service Detected" : "Alteration Detected",
                                            message: isPSS
                                              ? `This item has been submitted for PSSM (${item.pssmNo || item.pssmRecord?.pssmNo || 'Tailoring/Alteration'}). Garments currently or previously in PSSM require manager authorization before processing exchanges. Current Status: ${pssStatus}.`
                                              : "This item has been previously altered. By default, altered garments cannot be exchanged. Please consult the store owner for approval before proceeding."
                                          });
                                        }
                                        setReturnedItemIds((prev) =>
                                          isChecked ? prev.filter((id) => id !== targetId) : [...prev, targetId]
                                        );
                                      }}
                                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <div>
                                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <span>{item.name}</span>
                                        {item.isExchanged && (
                                          <span className="bg-indigo-100 text-indigo-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                            EXCHANGED
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-mono">
                                        Size: {item.size || 'M'} / Color: {item.color || 'Std'}
                                      </p>
                                      {!!(item.hasAlteration || item.alterationRecord) && (
                                        <div className="mt-1.5 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-lg text-[10px] font-mono text-amber-900 flex items-center gap-1.5">
                                          <Scissors className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                          <span>
                                            <strong>Alteration:</strong> {item.alterationRecord?.garmentType || 'Custom'} fit | Tailor: {item.alterationRecord?.tailorName || item.workerName || 'Master Tailor'} | Delivery: {item.alterationRecord?.deliveryDate ? new Date(item.alterationRecord.deliveryDate).toLocaleDateString('en-IN') : 'Scheduled'}
                                          </span>
                                        </div>
                                      )}
                                      {!!(item.hasPSSM || item.pssmRecord || item.pssmNo) && (
                                        <div className="mt-1.5 bg-purple-50 border border-purple-200 px-2 py-1 rounded-lg text-[10px] font-mono text-purple-900 flex items-center justify-between gap-1.5">
                                          <div className="flex items-center gap-1.5">
                                            <Scissors className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                            <span>
                                              <strong>PSSM:</strong> {item.pssmNo || item.pssmRecord?.pssmNo} {item.pssmServiceType ? `(${item.pssmServiceType})` : ''} | Tailor: {item.pssmTailorName || item.pssmRecord?.tailorName || 'Assigned'}
                                            </span>
                                          </div>
                                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${(item.pssmItemStatus || item.pssmRecord?.status) === 'COLLECTED' || (item.pssmItemStatus || item.pssmRecord?.status) === 'CLOSED'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : (item.pssmItemStatus || item.pssmRecord?.status) === 'READY'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-amber-100 text-amber-800'
                                            }`}>
                                            {item.pssmItemStatus || item.pssmRecord?.status || 'IN PROGRESS'}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <span className="font-mono font-bold text-slate-600 text-xs">
                                    ₹{(item.totalPrice || item.price * item.quantity).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Step B: Search/Enter Product ID or Barcode for New Product */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            2. Search or Enter Product ID / Barcode for New Exchanged Item:
                          </label>
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                            <input
                              type="text"
                              value={exchangeNewSearchQuery}
                              onChange={(e) => {
                                setExchangeNewSearchQuery(e.target.value);
                                const q = e.target.value.trim().toLowerCase();
                                const match = products.find(p =>
                                  (p._id && p._id.toLowerCase() === q) ||
                                  (p.id && p.id.toLowerCase() === q) ||
                                  (p.barcode && p.barcode.toLowerCase() === q) ||
                                  (p.productCode && p.productCode.toLowerCase() === q) ||
                                  (p.name && p.name.toLowerCase() === q)
                                );
                                if (match) {
                                  if (!exchangeCart.find(i => (i.id || i._id) === (match.id || match._id))) {
                                    setExchangeCart([...exchangeCart, match]);
                                  }
                                  setExchangeNewSearchQuery("");
                                }
                              }}
                              placeholder="Enter product ID, barcode (e.g. BAR-001) or product name..."
                              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Matching Product Dropdown */}
                          {exchangeNewSearchQuery && (
                            <div className="bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto divide-y divide-slate-100 text-xs font-sans">
                              {products
                                .filter(p =>
                                  (p.name || "").toLowerCase().includes(exchangeNewSearchQuery.toLowerCase()) ||
                                  (p.productCode || p.barcode || p.sku || p.id || "").toLowerCase().includes(exchangeNewSearchQuery.toLowerCase())
                                )
                                .map(p => (
                                  <div
                                    key={p._id || p.id}
                                    onClick={() => {
                                      if (!exchangeCart.find(i => (i.id || i._id) === (p.id || p._id))) {
                                        setExchangeCart([...exchangeCart, p]);
                                      }
                                      setExchangeNewSearchQuery("");
                                    }}
                                    className="p-2.5 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors"
                                  >
                                    <div>
                                      <p className="font-bold text-slate-800">{p.name}</p>
                                      <p className="text-[10px] text-slate-400 font-mono">
                                        ID/Barcode: {p.productCode || p.barcode || p.id} | Size: {p.size || 'M'} | Stock: {p.stock || p.stockQuantity || 10}
                                      </p>
                                    </div>
                                    <span className="font-mono font-bold text-indigo-600">
                                      ₹{(p.sellingPrice || p.price || 0).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Selected New Products Cart */}
                        {exchangeCart.length > 0 && (
                          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 flex flex-col gap-2 text-xs">
                            <p className="text-[10px] font-bold uppercase text-indigo-500">Selected New Exchanged Items:</p>
                            {exchangeCart.map((cartItem, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-indigo-100 shadow-sm">
                                <div>
                                  <p className="font-extrabold text-slate-900">{cartItem.name}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    SKU/ID: {cartItem.productCode || cartItem.barcode || cartItem.id} | Size: {cartItem.size || 'M'} / {cartItem.color || 'Std'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-black text-indigo-700 text-sm">
                                    ₹{(cartItem.sellingPrice || cartItem.price || 0).toLocaleString()}
                                  </span>
                                  <button
                                    onClick={() => setExchangeCart(exchangeCart.filter(i => (i.id || i._id) !== (cartItem.id || cartItem._id)))}
                                    className="text-rose-500 hover:text-rose-700 p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Price Difference Summary */}
                        {(() => {
                          const returnedItems = selectedInvoiceForReturn.items.filter((item, idx) => returnedItemIds.includes(item.unitId || `${item.productId || item.id}-${idx}`));
                          if (returnedItems.length === 0 || exchangeCart.length === 0) return null;

                          let oldPrice = returnedItems.reduce((sum, item) => sum + (item.totalPrice || ((item.sellingPrice || item.price || 0) * (item.quantity || 1))), 0);

                          if (totalAdjAmt > 0) {
                            const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * (i.quantity || 1))), 0) || 1;
                            const adjustmentRatio = totalAdjAmt / totalItemsPrice;
                            const proportionalAdjustment = oldPrice * adjustmentRatio;
                            oldPrice -= proportionalAdjustment;
                            oldPrice = Math.floor(oldPrice);
                          } else if (hasManualAdj && selectedInvoiceForReturn.billAdjustment.operation === 'Charge') {
                            const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * (i.quantity || 1))), 0) || 1;
                            const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
                            const proportionalAdjustment = oldPrice * adjustmentRatio;
                            oldPrice += proportionalAdjustment;
                            oldPrice = Math.floor(oldPrice);
                          }

                          const newPrice = exchangeCart.reduce((sum, item) => sum + (item.sellingPrice || item.price || 0), 0);
                          const priceDiff = newPrice - oldPrice;

                          return (
                            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs font-mono">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Original Item Value:</span>
                                <span>- ₹{oldPrice.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">New Item Value:</span>
                                <span>+ ₹{newPrice.toLocaleString()}</span>
                              </div>
                              <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-sm">
                                <span className="font-sans">Net Adjustment:</span>
                                <span className={priceDiff > 0 ? 'text-amber-400' : priceDiff < 0 ? 'text-emerald-400' : 'text-white'}>
                                  {priceDiff > 0 ? `+ ₹${priceDiff.toLocaleString()} (Payable)` : priceDiff < 0 ? `- ₹${Math.abs(priceDiff).toLocaleString()} (Refund)` : '₹0 (Even Swap)'}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        <button
                          type="button"
                          disabled={isProcessingReturn || returnedItemIds.length === 0 || exchangeCart.length === 0}
                          onClick={async () => {
                            if (isProcessingReturn) return;
                            setIsProcessingReturn(true);
                            try {
                              const returnedItems = selectedInvoiceForReturn.items.filter((item, idx) => returnedItemIds.includes(item.unitId || `${item.productId || item.id}-${idx}`));
                              if (returnedItems.length === 0 || exchangeCart.length === 0) return;

                              let oldPrice = returnedItems.reduce((sum, item) => sum + (item.totalPrice || ((item.sellingPrice || item.price || 0) * (item.quantity || 1))), 0);

                              if (totalAdjAmt > 0) {
                                const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * (i.quantity || 1))), 0) || 1;
                                const adjustmentRatio = totalAdjAmt / totalItemsPrice;
                                const proportionalAdjustment = oldPrice * adjustmentRatio;
                                oldPrice -= proportionalAdjustment;
                                oldPrice = Math.floor(oldPrice);
                              } else if (hasManualAdj && selectedInvoiceForReturn.billAdjustment.operation === 'Charge') {
                                const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * (i.quantity || 1))), 0) || 1;
                                const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
                                const proportionalAdjustment = oldPrice * adjustmentRatio;
                                oldPrice += proportionalAdjustment;
                                oldPrice = Math.floor(oldPrice);
                              }

                              const newPrice = exchangeCart.reduce((sum, item) => sum + (item.sellingPrice || item.price || 0), 0);
                              const priceDiff = newPrice - oldPrice;

                              const docket = {
                                docketNo: `EXCH-${Date.now().toString().slice(-6)}`,
                                originalInvoiceNo: selectedInvoiceForReturn.invoiceNo,
                                customerName: selectedInvoiceForReturn.customerName,
                                customerPhone: selectedInvoiceForReturn.customerPhone,
                                reason: exchangeReason,
                                oldItem: {
                                  name: returnedItems.map(i => i.name).join(', '),
                                  size: 'Mixed',
                                  color: 'Mixed',
                                  price: oldPrice
                                },
                                newItem: {
                                  name: exchangeCart.map(i => i.name).join(', '),
                                  sku: exchangeCart.map(i => i.sku || i.productCode || i.id).join(', '),
                                  size: 'Mixed',
                                  color: 'Mixed',
                                  price: newPrice
                                },
                                priceDiff,
                                cashierName: currentUser ? currentUser.name : "Store Cashier",
                                createdAt: new Date().toISOString()
                              };

                              const updatedItems = selectedInvoiceForReturn.items.map((item, idx) => {
                                const targetId = item.unitId || `${item.productId || item.id}-${idx}`;
                                if (returnedItemIds.includes(targetId)) {
                                  return {
                                    ...item,
                                    isExchanged: true,
                                    exchangedFor: exchangeCart.map(i => i.name).join(', '),
                                    exchangeReason
                                  };
                                }
                                return item;
                              });

                              const allEx = updatedItems.every(i => i.isExchanged);
                              const updatedInvoice = {
                                ...selectedInvoiceForReturn,
                                hasExchange: true,
                                exchangeSlip: docket,
                                status: allEx ? 'Exchanged' : 'Partially Exchanged',
                                items: updatedItems
                              };

                              // Call Backend API to process exchange in MongoDB
                              try {
                                const token = localStorage.getItem("token");
                                const invId = selectedInvoiceForReturn._id || selectedInvoiceForReturn.id || selectedInvoiceForReturn.invoiceNo;
                                await api.post(`/exchanges`, {
                                  originalBillId: invId,
                                  originalBillNo: selectedInvoiceForReturn.invoiceNo,
                                  customerId: selectedInvoiceForReturn.customer?._id || selectedInvoiceForReturn.customer || selectedInvoiceForReturn.customerId,
                                  returnedBarcodes: returnedItems.map(i => i.barcode || i.designNo || i.itemCode || ''),
                                  newBarcodes: exchangeCart.map(i => i.barcode || i.productCode || i.sku || i.id || ''),
                                  returnedValue: oldPrice,
                                  newItemValue: newPrice,
                                  remarks: exchangeReason,
                                  forceApprove: true
                                });
                              } catch (apiErr) {
                                console.warn("Backend exchange endpoint call error:", apiErr.message);
                                if (onAddNotification) onAddNotification("Exchange Failed", apiErr.response?.data?.message || apiErr.message || "Failed to process exchange in backend", "danger");
                                return; // Stop execution to prevent desync
                              }

                              // Update local invoices list so Invoice History reflects exchanged status immediately
                              setInvoiceList(prev => prev.map(inv => (inv.invoiceNo === updatedInvoice.invoiceNo || inv._id === updatedInvoice._id) ? updatedInvoice : inv));

                              if (invoices) {
                                const idx = invoices.findIndex(i => i.invoiceNo === selectedInvoiceForReturn.invoiceNo || i._id === selectedInvoiceForReturn._id);
                                if (idx !== -1) invoices[idx] = updatedInvoice;
                              }

                              setCompletedExchangeSlip(docket);
                              setShowExchangeSlipModal(true);

                              if (onAddNotification) {
                                onAddNotification("Exchange Completed", `Exchange docket ${docket.docketNo} issued successfully. Stocks & Financials recalculated.`, "success");
                              }

                              // Auto-clear search & selection data after completing exchange
                              setSelectedInvoiceForReturn(null);
                              setExchangeCart([]);
                              setExchangeNewSearchQuery("");
                              setReturnSearchQuery("");
                              setReturnedItemIds([]);
                            } finally {
                              setIsProcessingReturn(false);
                            }
                          }}
                          className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${exchangeCart.length > 0 && returnedItemIds.length > 0 && !isProcessingReturn ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                          {isProcessingReturn ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing Exchange...
                            </>
                          ) : (
                            "Confirm Exchange & Deduct Difference"
                          )}
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              );
            })()
          )}
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
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${so.status === "Dispatched"
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
                  placeholder="e.g. Vastra Retail Hub"
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

      {/* MODAL: DUE CUSTOMER MANDATORY */}
      {showReturnCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[130]">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Customer Details Required
              </h4>
              <button
                onClick={() => setShowReturnCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded border border-rose-100">
              Customer details are mandatory to save the returned amount as an advance in their wallet.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!returnCustomerName || !returnCustomerPhone) return;
                if (isProcessingReturn) return;
                setIsProcessingReturn(true);

                try {
                  const custRes = await api.post('/customers', { name: returnCustomerName, phone: returnCustomerPhone });

                  // Now trigger the return logic with the newly created customer
                  setShowReturnCustomerModal(false);

                  // Re-trigger the Approve Return manually but bypassing the check since we have the new customer ID
                  const finalCustomerId = custRes.data.data._id;

                  const token = localStorage.getItem("token");
                  const invId = selectedInvoiceForReturn._id || selectedInvoiceForReturn.id || selectedInvoiceForReturn.invoiceNo;
                  const finalReason = returnCustomReason.trim() !== "" ? returnCustomReason : returnReason;

                  const returnItemsPayload = returnedItemIds.map(id => {
                    const item = selectedInvoiceForReturn.items.find(i => i._id === id || i.id === id);
                    let itemPrice = item.totalPrice || ((item.sellingPrice || item.price || 0) * (item.quantity || 1));
                    if (selectedInvoiceForReturn.billAdjustment) {
                      const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, it) => s + (it.totalPrice || ((it.sellingPrice || it.price || 0) * it.quantity)), 0) || 1;
                      const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
                      if (selectedInvoiceForReturn.billAdjustment.operation === 'Discount') {
                        itemPrice -= (itemPrice * adjustmentRatio);
                      } else {
                        itemPrice += (itemPrice * adjustmentRatio);
                      }
                    }
                    return {
                      barcode: item?.barcode || item?.designNo || item?.itemCode || '',
                      refundRate: Math.floor(itemPrice),
                      condition: 'RESELLABLE'
                    };
                  });

                  await api.post(`/returns`, {
                    saleBillId: invId,
                    saleBillNo: selectedInvoiceForReturn.invoiceNo,
                    customerId: finalCustomerId,
                    refundMode: 'ADD_TO_ADVANCE',
                    reason: finalReason,
                    items: returnItemsPayload,
                    forceApprove: true
                  }, { headers: { Authorization: `Bearer ${token}` } });

                  if (onAddNotification) onAddNotification("Success", "Return processed successfully & Customer created", "success");

                  setSelectedInvoiceForReturn(null);
                  setReturnedItemIds([]);
                  setReturnApprovedCheckbox(false);
                  setReturnRefundMode('DIRECT_REFUND');
                  setReturnSearchQuery("");

                } catch (err) {
                  if (onAddNotification) onAddNotification("Error", "Failed to create customer and process return", "danger");
                } finally {
                  setIsProcessingReturn(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={returnCustomerName}
                  onChange={(e) => setReturnCustomerName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]*"
                  maxLength="10"
                  value={returnCustomerPhone}
                  onChange={(e) => setReturnCustomerPhone(e.target.value)}
                  placeholder="Enter 10-digit number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnCustomerModal(false)}
                  className="px-4 py-2 text-slate-500 font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save & Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DUE CUSTOMER MANDATORY */}
      {showDueCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[130]">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Customer Details Required
              </h4>
              <button
                onClick={() => setShowDueCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded border border-rose-100">
              Customer details are mandatory for bills with a Due Amount.
            </p>

            <form onSubmit={handleDueCustomerSubmit} className="space-y-3 text-xs">
              <div className="relative">
                <label className="block text-slate-500 mb-1 font-semibold">
                  Customer Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Shashi Kapoor"
                  value={dueCustName}
                  onChange={(e) => {
                    setDueCustName(e.target.value);
                    setShowDueCustNameSuggestions(true);
                  }}
                  onFocus={() => setShowDueCustNameSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDueCustNameSuggestions(false), 200)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
                />
                {showDueCustNameSuggestions && filteredDueCustomersByName.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                    {filteredDueCustomersByName.map((cust) => (
                      <li
                        key={cust.id || cust._id}
                        className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-700"
                        onClick={() => handleSelectDueCustomer(cust)}
                      >
                        {cust.name} ({cust.phone})
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative">
                <label className="block text-slate-500 mb-1 font-semibold">
                  Mobile Number *
                </label>
                <input
                  required
                  type="text"
                  pattern="\d{10}"
                  title="Phone number must be exactly 10 digits"
                  maxLength="10"
                  placeholder="e.g. 9876543210"
                  value={dueCustPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setDueCustPhone(val);
                    setShowDueCustPhoneSuggestions(true);
                  }}
                  onFocus={() => setShowDueCustPhoneSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDueCustPhoneSuggestions(false), 200)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-800 tracking-wider font-mono"
                />
                {showDueCustPhoneSuggestions && filteredDueCustomersByPhone.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                    {filteredDueCustomersByPhone.map((cust) => (
                      <li
                        key={cust.id || cust._id}
                        className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-700 font-mono"
                        onClick={() => handleSelectDueCustomer(cust)}
                      >
                        {cust.phone} <span className="text-slate-400 font-sans ml-1">- {cust.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDueCustomerModal(false)}
                  className="px-4 py-2 text-slate-500 font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-md shadow-indigo-200 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save & Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER HISTORY */}
      {showCustomerHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center shrink-0">
              <h4 className="text-lg font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                Customer History
              </h4>
              <button onClick={() => setShowCustomerHistoryModal(false)} className="text-slate-400 hover:text-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingCustomerHistory ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : customerHistoryData ? (
              <div className="flex-1 overflow-y-auto space-y-6 min-h-0">
                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Customer Name</div>
                    <div className="font-bold text-slate-800">{customerForm.name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Mobile</div>
                    <div className="font-bold text-slate-800 font-mono">{customerForm.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Customer ID</div>
                    <div className="font-bold text-indigo-600 font-mono">{customerForm.customerId || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Loyalty Points</div>
                    <div className="font-bold text-slate-800">{customers.find(c => (c.id || c._id) === selectedCustomerId)?.loyaltyPoints || 0} pts</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-slate-700 uppercase text-sm border-b pb-2">Purchase History</h5>
                  {customerHistoryData.bills && customerHistoryData.bills.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600">
                          <tr>
                            <th className="p-3 border-b">Invoice No</th>
                            <th className="p-3 border-b">Date</th>
                            <th className="p-3 border-b">Items</th>
                            <th className="p-3 border-b text-right">Total Amount</th>
                            <th className="p-3 border-b text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customerHistoryData.bills.map((bill, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td
                                className="p-3 font-mono font-bold text-indigo-600 cursor-pointer hover:underline"
                                onClick={() => handleDownloadReceiptHTML(bill)}
                              >
                                {bill.billNo}
                              </td>
                              <td className="p-3">{new Date(bill.billDate).toLocaleDateString()}</td>
                              <td className="p-3">
                                {bill.items && bill.items.length > 0
                                  ? bill.items.map(item => item.inventoryPieceId?.itemName || 'Item').join(', ')
                                  : 'N/A'}
                                <span className="text-[10px] text-slate-400 ml-1">({bill.items?.length || 0} qty)</span>
                              </td>
                              <td className="p-3 text-right font-bold text-slate-800">₹{bill.grandTotal?.toLocaleString()}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${bill.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                  {bill.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-slate-50 rounded-xl text-slate-500 text-sm">No purchase history found.</div>
                  )}
                </div>

                {customerHistoryData.alterations && customerHistoryData.alterations.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-700 uppercase text-sm border-b pb-2">Alteration History</h5>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600">
                          <tr>
                            <th className="p-3 border-b">Job ID</th>
                            <th className="p-3 border-b">Date</th>
                            <th className="p-3 border-b">Type</th>
                            <th className="p-3 border-b text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customerHistoryData.alterations.map((alt, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-3 font-mono font-bold text-slate-700">{alt.jobId || alt._id.substring(0, 8)}</td>
                              <td className="p-3">{new Date(alt.createdAt).toLocaleDateString()}</td>
                              <td className="p-3">{alt.alterationType} - {alt.garmentType}</td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">{alt.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 text-slate-500">Failed to load history data.</div>
            )}
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
                                return `border-r border-slate-200 p-1.5 truncate relative ${isSel
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
                                      className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${isOut
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
                                      className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold uppercase transition-all tracking-wider cursor-pointer ${isOut
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
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-sans font-bold uppercase transition-all tracking-wider cursor-pointer ${isOut
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
                        className={`w-full py-2.5 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all ${selectedVariant && selectedVariant.stock > 0
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


      {/* Small Alteration Prompt Popup */}
      {alterationPromptItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 backdrop-blur-xs animate-fade-in text-slate-800">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-slate-200 space-y-4 text-center font-sans">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-center gap-1.5 text-indigo-600">
              <Scissors className="w-4 h-4" />
              <span>Alteration?</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Would you like to configure bespoke fit alterations for <strong>{alterationPromptItem.name}</strong>?
            </p>
            <div className="flex gap-4 justify-center pt-1">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => setAlterationPromptItem(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer text-xs flex items-center gap-1 text-slate-650"
              >
                <X className="w-3.5 h-3.5 text-red-500" />
                <span>Cancel (F1)</span>
              </button>
              {/* Tick (Confirm) Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAlterationCartItem(alterationPromptItem);
                  setAltMeasurements({});
                  setAltOptions([]);
                  setAltCustomText("");
                  setAltSpecialInstructions("");
                  setAlterationPromptItem(null);
                  setShowAlterationModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer text-xs flex items-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>Yes (F2)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTERATION WINDOW */}
      {showAlterationModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-3 sm:p-5 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scale-up text-slate-800">

            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-wide uppercase font-mono">
                      ALTERATION WINDOW
                    </h3>
                    <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30 uppercase">
                      Live POS Tailoring Module
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Bespoke fit adjustments, tailor job dispatch & customer measurement records.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowAlterationModal(false);
                  setSelectedAlterationCartItem(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 erp-hide-scrollbar">

              {/* STEP 1: SELECT PRODUCT FROM BILL */}
              {!selectedAlterationCartItem ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                        STEP 1: Select Garment from Bill
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Choose a product from your current active basket to record alterations.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-xs">
                      {cart.length} Products in Bill
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cart.map((item, idx) => {
                      const isAltered = item.hasAlteration;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedAlterationCartItem(item);
                            setAltMeasurements(item.alterationRecord?.measurements || {});
                            setAltOptions(item.alterationRecord?.alterationDetails || []);
                          }}
                          className={`group relative bg-white rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between space-y-3 hover:shadow-lg ${isAltered ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-rose-400'}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase block mb-1 w-fit">
                                SKU: {item.sku || 'SKU-001'}
                              </span>
                              <h5 className="text-sm font-extrabold text-slate-800 group-hover:text-rose-600 transition-colors">
                                {item.name}
                              </h5>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">
                                Size: <span className="font-bold text-slate-700">{item.size}</span> | Color: <span className="font-bold text-slate-700">{item.color}</span> | Qty: <span className="font-bold text-slate-700">{item.quantity}</span>
                              </p>
                            </div>
                            <span className="text-sm font-black font-mono text-indigo-600">
                              ₹{(Number(item.totalPrice) || 0).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div className="text-[11px] font-semibold text-slate-500">
                              {item.salespersonName && <span>Sales: <span className="text-slate-800">{item.salespersonName}</span></span>}
                            </div>

                            {isAltered ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full uppercase">
                                <CheckCircle className="w-3 h-3" /> Alteration Logged
                              </span>
                            ) : (
                              <button className="text-xs font-bold text-white bg-slate-900 group-hover:bg-rose-600 px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1">
                                <span>Configure Alteration</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* STEP 2: ALTERATION ENTRY FORM */
                <div className="space-y-6">

                  {/* Selected Garment Header Summary */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <button
                        onClick={() => setSelectedAlterationCartItem(null)}
                        className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                        <span>Back to Product Selection</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                          {loadedOriginalInvoice ? `Billed Invoice: ${loadedOriginalInvoice.invoiceNo || loadedOriginalInvoice.billNo}` : 'Target Invoice: LIVE'}
                        </span>
                        <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                          {customerForm.name || activeCustomer.name} ({customerForm.phone || activeCustomer.phone || 'Walk-in'})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Product Name</span>
                        <span className="font-extrabold text-white">{selectedAlterationCartItem.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">SKU / Barcode</span>
                        <span className="font-mono font-bold text-slate-300">{selectedAlterationCartItem.sku || 'SKU-001'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Size & Color</span>
                        <span className="font-bold text-amber-300">{selectedAlterationCartItem.size} / {selectedAlterationCartItem.color}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Sales / Worker</span>
                        <span className="font-bold text-slate-300">{selectedAlterationCartItem.salespersonName || 'Store Staff'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 1. MEASUREMENT ENTRY GRID */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                          Measurement Entry (Inches)
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Non-mandatory — fill required specs only</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
                      {getMeasurementFieldsForGarment(selectedAlterationCartItem.name, selectedAlterationCartItem.category).map((field) => (
                        <div key={field} className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase block truncate" title={field}>
                            {field}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 40"
                            value={altMeasurements[field] || ""}
                            onChange={(e) => setAltMeasurements({ ...altMeasurements, [field]: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. QUICK ALTERATION OPTIONS */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                      <Scissors className="w-4 h-4 text-rose-600" />
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        Quick Alteration Type Options
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {quickAlterationOptionsList.map((opt) => {
                        const isSelected = altOptions.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setAltOptions(altOptions.filter(o => o !== opt));
                              } else {
                                setAltOptions([...altOptions, opt]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isSelected ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                          >
                            {isSelected ? '✓ ' : '+ '}{opt}
                          </button>
                        );
                      })}
                    </div>

                    {altOptions.includes("Custom Alteration") && (
                      <div className="pt-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Custom Alteration Note</label>
                        <input
                          type="text"
                          placeholder="Describe specific custom alteration..."
                          value={altCustomText}
                          onChange={(e) => setAltCustomText(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* 3. DELIVERY & PRIORITY DETAILS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Delivery Date & Time</label>
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={altDeliveryDate}
                          onChange={(e) => setAltDeliveryDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                        />
                        <input
                          type="text"
                          value={altDeliveryTime}
                          onChange={(e) => setAltDeliveryTime(e.target.value)}
                          placeholder="05:00 PM"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-slate-800 outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Trial Required?</label>
                        <div className="flex items-center gap-2.5">
                          <label className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 cursor-pointer">
                            <input
                              type="radio"
                              name="altModalTrialReq"
                              checked={altTrialRequired !== false}
                              onChange={() => setAltTrialRequired(true)}
                              className="accent-purple-600 cursor-pointer"
                            />
                            Yes
                          </label>
                          <label className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 cursor-pointer">
                            <input
                              type="radio"
                              name="altModalTrialReq"
                              checked={altTrialRequired === false}
                              onChange={() => setAltTrialRequired(false)}
                              className="accent-purple-600 cursor-pointer"
                            />
                            No
                          </label>
                        </div>
                      </div>
                      {altTrialRequired !== false && (
                        <div className="pt-1">
                          <label className="text-[10px] font-bold text-purple-700 uppercase block mb-1">Expected Trial Date</label>
                          <input
                            type="date"
                            value={altTrialDate}
                            onChange={(e) => setAltTrialDate(e.target.value)}
                            className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Job Priority</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {["Normal", "Urgent", "Express"].map((prio) => (
                          <button
                            key={prio}
                            type="button"
                            onClick={() => setAltPriority(prio)}
                            className={`py-2 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer ${altPriority === prio ? (prio === 'Express' ? 'bg-red-600 text-white' : prio === 'Urgent' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-white') : 'bg-white text-slate-600 border border-slate-200'}`}
                          >
                            {prio}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4. TAILOR ASSIGNMENT */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Select Master Tailor / Worker</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {tailorEmployeesList.map((t) => {
                        const isSelected = (altSelectedTailor?.id || altSelectedTailor?._id) === (t.id || t._id);
                        return (
                          <div
                            key={t.id || t._id}
                            onClick={() => setAltSelectedTailor(t)}
                            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${isSelected ? 'bg-indigo-50 border-indigo-600 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                          >
                            <p className={`text-xs font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>{t.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t.designation || t.role || 'Master Tailor'}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. SPECIAL INSTRUCTIONS */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Special Tailoring Instructions / Notes</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Customer wants sleeve exactly 1 inch short. Ensure heavy double stitch on seam."
                      value={altSpecialInstructions}
                      onChange={(e) => setAltSpecialInstructions(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                    />
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <button
                onClick={() => {
                  setShowAlterationModal(false);
                  setSelectedAlterationCartItem(null);
                }}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close (Esc)
              </button>

              {selectedAlterationCartItem && (
                <button
                  onClick={handleSaveAlteration}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Scissors className="w-4 h-4" />
                  <span>{loadedOriginalInvoice ? 'Issue Alteration Slip (No Re-Billing)' : 'Save Alteration Record'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PAYMENT METHOD */}
      {editPayMethodModal && (() => {
        const inv = editPayMethodModal.inv;
        const invId = inv._id || inv.id;
        const isPartPay = editPayMethodValue === 'Part Payment';
        const splitTotal = Object.values(editPartSplits).reduce((s, v) => s + (Number(v) || 0), 0);
        const grandTotalAmt = Number(inv.grandTotal) || 0;
        const splitRemaining = grandTotalAmt - splitTotal;

        const handleSave = async () => {
          if (!editPayMethodValue) return;
          if (isPartPay) {
            const activeSplits = Object.entries(editPartSplits).filter(([, v]) => Number(v) > 0);
            if (activeSplits.length === 0) {
              if (onAddNotification) onAddNotification("Error", "Enter amount for at least one payment method.", "danger");
              return;
            }
          }
          setIsSavingPayMethod(true);
          try {
            const body = { paymentMethod: editPayMethodValue };
            if (isPartPay) {
              body.splitPayments = Object.entries(editPartSplits)
                .filter(([, v]) => Number(v) > 0)
                .map(([method, amount]) => ({ method, amount: Number(amount) }));
            }
            await api.patch(`/billing/${invId}/payment-method`, body);
            setInvoiceList(prev => (prev || []).map(i =>
              (i._id || i.id) === invId ? { ...i, paymentMethod: editPayMethodValue, splitPayments: body.splitPayments || i.splitPayments } : i
            ));
            if (onAddNotification) onAddNotification("Payment Updated", `Payment method changed to ${editPayMethodValue} for ${inv.invoiceNo}`, "success");
            setEditPayMethodModal(null);
          } catch (err) {
            if (onAddNotification) onAddNotification("Error", err?.response?.data?.message || "Failed to update payment method", "danger");
          } finally {
            setIsSavingPayMethod(false);
          }
        };

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center gap-2 text-amber-700">
                  <Pencil className="w-4 h-4" />
                  <span className="font-bold text-sm uppercase tracking-wide">Edit Payment Method</span>
                </div>
                <button onClick={() => setEditPayMethodModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Invoice info bar */}
                <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 flex flex-wrap gap-x-3 gap-y-1">
                  <span><span className="font-semibold text-slate-700">Invoice:</span> {inv.invoiceNo}</span>
                  <span className="text-slate-300">|</span>
                  <span><span className="font-semibold text-slate-700">Customer:</span> {inv.customerName || 'Walk-in'}</span>
                  <span className="text-slate-300">|</span>
                  <span><span className="font-semibold text-slate-700">Total:</span> ₹{grandTotalAmt.toLocaleString()}</span>
                </div>

                {/* Payment Method dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Payment Method</label>
                  <select
                    value={editPayMethodValue}
                    onChange={e => {
                      setEditPayMethodValue(e.target.value);
                      setEditPartSplits({});
                    }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white cursor-pointer"
                  >
                    {["Cash", "Card", "UPI", "Due", "Credit", "Part Payment", "Cheque", "Net Banking", "Gift Voucher", "Other"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Part Payment Sub-options */}
                {isPartPay && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Split Amounts</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${splitRemaining < 0 ? 'bg-red-100 text-red-600' :
                          splitRemaining === 0 ? 'bg-green-100 text-green-700' :
                            'bg-amber-100 text-amber-700'
                        }`}>
                        {splitRemaining < 0 ? '⚠ Over by ₹' + Math.abs(splitRemaining).toLocaleString() :
                          splitRemaining === 0 ? '✓ Balanced' :
                            'Remaining: ₹' + splitRemaining.toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {PART_PAY_METHODS.map(method => (
                        <div key={method} className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer w-32 shrink-0">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                              checked={editPartSplits[method] !== undefined}
                              onChange={e => {
                                setEditPartSplits(prev => {
                                  const next = { ...prev };
                                  if (e.target.checked) next[method] = '';
                                  else delete next[method];
                                  return next;
                                });
                              }}
                            />
                            <span className="text-xs font-semibold text-slate-700">{method}</span>
                          </label>
                          {editPartSplits[method] !== undefined && (
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="0.00"
                                value={editPartSplits[method]}
                                onChange={e => setEditPartSplits(prev => ({ ...prev, [method]: e.target.value }))}
                                className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs font-bold pt-1 border-t border-amber-200">
                      <span className="text-slate-600">Split Total:</span>
                      <span className={splitTotal > grandTotalAmt ? 'text-red-600' : 'text-emerald-700'}>₹{splitTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setEditPayMethodModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={isSavingPayMethod || (isPartPay && splitTotal === 0)}
                  onClick={handleSave}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all
                    ${isSavingPayMethod || (isPartPay && splitTotal === 0)
                      ? 'bg-amber-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 cursor-pointer shadow-md'}`}
                >
                  {isSavingPayMethod ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>) : (<><Save className="w-4 h-4" /> Save Changes</>)}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: BILL RECEIPT PREVIEW */}
      {showBillPreviewInvoice && (

        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[120] font-sans animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-up flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-1.5 text-rose-600">
                <Printer className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-bold uppercase tracking-wide">
                  Bill Receipt Preview
                </span>
              </div>
              <button
                onClick={() => setShowBillPreviewInvoice(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Thermal Scroll Preview Frame */}
            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden bg-slate-100 shadow-inner">
              <iframe
                title="Invoice Print Preview"
                srcDoc={generateReceiptHTMLContent(showBillPreviewInvoice, false)}
                className="w-full h-[58vh] border-none bg-white"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col gap-2 shrink-0 pt-1 font-sans">
              {showBillPreviewInvoice.isDraftPreview && (
                <button
                  disabled={isGeneratingBill}
                  onClick={handleGenerateBillAction}
                  className={`w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${isGeneratingBill ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  title="Shortcut: Enter"
                >
                  {isGeneratingBill ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span className="text-sm">✅</span>}
                  <span>{isGeneratingBill ? 'GENERATING BILL...' : 'GENERATE BILL (NO PRINT)'}</span>
                  <span className="bg-black/25 text-amber-100 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-white/20 normal-case ml-1">Enter</span>
                </button>
              )}
              <div className="flex gap-2 w-full">
                <button
                  disabled={isPrinting}
                  onClick={handlePrintAction}
                  className={`flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 ${isPrinting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  title="Shortcut: F10"
                >
                  {isPrinting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span className="text-sm">🖨️</span>}
                  <span>{isPrinting ? 'PRINTING...' : 'PRINT'}</span>
                  <span className="bg-black/25 text-blue-100 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-white/20 normal-case ml-0.5">F10</span>
                </button>

                <button
                  disabled={isDownloading}
                  onClick={handleDownloadAction}
                  className={`flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 ${isDownloading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  title="Shortcut: F11"
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span className="text-sm">⬇️</span>}
                  <span>{isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD HTML'}</span>
                  <span className="bg-black/25 text-emerald-100 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-white/20 normal-case ml-0.5">F11</span>
                </button>
              </div>

              {/* NEW BUTTON: WhatsApp Direct Share */}
              <button
                type="button"
                onClick={handleSendWhatsAppAction}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:to-green-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40"
                title="Shortcut: F12"
              >
                <span className="text-sm">💬</span>
                <span>SEND BILL DIRECTLY TO WHATSAPP</span>
                <span className="bg-black/30 text-emerald-100 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-white/30 normal-case ml-1">F12</span>
              </button>
            </div>

            <button
              onClick={() => setShowBillPreviewInvoice(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1"
            >
              <span>Close</span>
              <span className="text-[10px] text-slate-400 font-mono font-normal">(Esc)</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETED EXCHANGE SLIP DOCKET */}
      {showExchangeSlipModal && completedExchangeSlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[120] font-sans animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-indigo-600">
                <RefreshCw className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wide">
                  Exchange Docket Issued
                </span>
              </div>
              <button
                onClick={() => setShowExchangeSlipModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Docket Ticket View */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 font-mono text-xs text-slate-800 space-y-3 max-h-96 overflow-y-auto">
              <div className="">

                <p className="text-[10px] text-indigo-600 uppercase font-black tracking-widest mt-0.5">
                  OFFICIAL EXCHANGE SLIP DOCKET
                </p>
                <span className="inline-block bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-mono mt-1 font-bold">
                  {completedExchangeSlip.docketNo}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="space-y-1 text-[11px]">
                <p>Date: <strong>{new Date(completedExchangeSlip.createdAt).toLocaleString('en-IN')}</strong></p>
                <p>Original Inv: <strong className="text-indigo-600">{completedExchangeSlip.originalInvoiceNo}</strong></p>
                <p>Customer: <strong>{completedExchangeSlip.customerName}</strong> ({completedExchangeSlip.customerPhone || 'Walk-in'})</p>
                <p>Cashier: {completedExchangeSlip.cashierName}</p>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              {/* Returned Item */}
              <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200 space-y-1">
                <p className="text-[10px] font-bold text-rose-700 uppercase">RETURNED GARMENT (SWAPPED OUT):</p>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{completedExchangeSlip.oldItem.name} ({completedExchangeSlip.oldItem.size}/{completedExchangeSlip.oldItem.color})</span>
                  <span className="text-rose-600">- ₹{completedExchangeSlip.oldItem.price.toLocaleString()}</span>
                </div>
                <p className="text-[9.5px] text-slate-500 italic">Reason: {completedExchangeSlip.reason}</p>
              </div>

              {/* Exchanged Item */}
              <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-200 space-y-1">
                <p className="text-[10px] font-bold text-indigo-700 uppercase">NEW ISSUED GARMENT (EXCHANGED):</p>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{completedExchangeSlip.newItem.name} ({completedExchangeSlip.newItem.size}/{completedExchangeSlip.newItem.color})</span>
                  <span className="text-indigo-600">+ ₹{completedExchangeSlip.newItem.price.toLocaleString()}</span>
                </div>
                <p className="text-[9.5px] text-slate-500 font-mono">SKU/ID: {completedExchangeSlip.newItem.sku}</p>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="flex justify-between items-center text-sm font-bold">
                <span>NET ADJUSTMENT:</span>
                <span className={completedExchangeSlip.priceDiff > 0 ? 'text-amber-600' : completedExchangeSlip.priceDiff < 0 ? 'text-emerald-600' : 'text-slate-900'}>
                  {completedExchangeSlip.priceDiff > 0
                    ? `+ ₹${completedExchangeSlip.priceDiff.toLocaleString()} (Payable)`
                    : completedExchangeSlip.priceDiff < 0
                      ? `- ₹${Math.abs(completedExchangeSlip.priceDiff).toLocaleString()} (Refund)`
                      : '₹0 (Even Swap)'}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 font-sans text-xs">
              <button
                onClick={() => setShowExchangeSlipModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Docket
              </button>
              <button
                onClick={() => {
                  const docket = completedExchangeSlip;
                  const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                      <title>Exchange Slip ${docket.docketNo}</title>
                      <style>
                        body { font-family: 'Courier New', Courier, monospace; color: #000; padding: 20px; max-width: 400px; margin: 0 auto; line-height: 1.4; }
                        .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                        .section { border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px; font-size: 12px; }
                        .bold { font-weight: bold; }
                        .flex { display: flex; justify-content: space-between; }
                        .badge { background: #000; color: #fff; padding: 3px 8px; font-weight: bold; font-size: 11px; display: inline-block; margin-top: 5px; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h2 style="margin:0;">VASTRA ERP</h2>
                        <p style="margin:2px 0; font-size:11px;">OFFICIAL EXCHANGE DOCKET</p>
                        <div class="badge">${docket.docketNo}</div>
                      </div>
                      <div class="section">
                        <div class="flex"><span>Date:</span><span>${new Date(docket.createdAt).toLocaleString('en-IN')}</span></div>
                        <div class="flex"><span>Invoice #:</span><span class="bold">${docket.originalInvoiceNo}</span></div>
                        <div class="flex"><span>Customer:</span><span class="bold">${docket.customerName}</span></div>
                        <div class="flex"><span>Phone:</span><span>${docket.customerPhone || 'N/A'}</span></div>
                        <div class="flex"><span>Cashier:</span><span>${docket.cashierName}</span></div>
                      </div>
                      <div class="section">
                        <p class="bold" style="margin:0 0 4px 0; color:#d97706;">RETURNED ITEM (SWAPPED OUT):</p>
                        <div class="flex"><span>${docket.oldItem.name} (${docket.oldItem.size}/${docket.oldItem.color})</span><span>- &#8377;${docket.oldItem.price.toLocaleString()}</span></div>
                        <p style="margin:2px 0; font-size:10px; color:#666;">Reason: ${docket.reason}</p>
                      </div>
                      <div class="section">
                        <p class="bold" style="margin:0 0 4px 0; color:#2563eb;">NEW ISSUED ITEM (EXCHANGED):</p>
                        <div class="flex"><span>${docket.newItem.name} (${docket.newItem.size}/${docket.newItem.color})</span><span>+ &#8377;${docket.newItem.price.toLocaleString()}</span></div>
                      </div>
                      <div class="section" style="border:none;">
                        <div class="flex bold" style="font-size:13px;">
                          <span>NET ADJUSTMENT:</span>
                          <span>${docket.priceDiff >= 0 ? '+ &#8377;' + docket.priceDiff.toLocaleString() + ' (Payable)' : '- &#8377;' + Math.abs(docket.priceDiff).toLocaleString() + ' (Refund)'}</span>
                        </div>
                      </div>
                      <div class="header" style="border-top:2px dashed #000; border-bottom:none; margin-top:15px; padding-top:10px;">
                        <p style="font-size:10px; margin:0;">Thank you for shopping with Vastra!</p>
                      </div>
                    <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
                      </body>
                      </html>
                  `;
                  const blob = new Blob(["\ufeff" + htmlContent], { type: "text/html;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const receiptWin = window.open(url, "_blank");
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Exchange Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: POST SALES SERVICE (PSS) INITIAL QUESTION PROMPT */}
      {showPSSQuestionPromptModal && pssInvoice && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up text-slate-800 space-y-6">

            {/* Header / Badge */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl border border-rose-200">
                  <Scissors className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                    Post Sales Service (PSS)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tailoring, alteration & custom fitting request
                  </p>
                </div>
              </div>
              <span className="bg-slate-900 text-white font-mono text-xs font-bold px-3 py-1 rounded-xl shadow-xs">
                {pssInvoice.invoiceNo}
              </span>
            </div>

            {/* Bill Info Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Customer Name:</span>
                <strong className="text-slate-900 font-semibold">{pssInvoice.customerName || "Walk-in Customer"}</strong>
              </div>
              {pssInvoice.customerPhone && (
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Phone:</span>
                  <span className="font-mono text-slate-800">{pssInvoice.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Items in Bill:</span>
                <span className="font-bold text-rose-600">{pssInvoice.items?.length || 0} Products</span>
              </div>
            </div>

            {/* The Core Question */}
            <div className="text-center py-2 space-y-2">
              <h4 className="text-base font-bold text-slate-900">
                Do you want Post Sales Service for this generated bill?
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Choosing YES allows you to pick garments from this bill, set service requirements, assign staff/vendor, and issue a PSS docket.
              </p>
            </div>

            {/* Action Buttons: YES / NO */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPSSQuestionPromptModal(false);
                  // NO PSS record created, NO service item created, NO tailor assigned, NO status created
                }}
                className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
              >
                <X className="w-4 h-4 text-slate-500" />
                NO (Skip PSS)
              </button>

              <button
                type="button"
                onClick={handleYesOnPSSPrompt}
                className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Scissors className="w-4 h-4" />
                YES (Configure PSS)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: PSS CUSTOMER DETAILS PROMPT (WITH EXISTING CUSTOMER SUGGESTIONS & EXTRA CONTACT FIELDS) */}
      {showPSSCustomerDetailsModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up text-slate-800 flex flex-col max-h-[92vh] relative">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 shrink-0">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Customer Info Required
                </h3>
                <p className="text-xs text-slate-500">
                  Please select or enter customer details for Post Sales Service tracking
                </p>
              </div>
            </div>

            <div className="space-y-3.5 py-3 overflow-y-auto erp-hide-scrollbar flex-1 pr-1">
              {/* Customer Full Name Input with Suggestions */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  placeholder="Type name to search existing customer..."
                  value={pssCustName}
                  onChange={(e) => {
                    setPssCustName(e.target.value);
                    setShowPssCustNameSuggestions(true);
                    setShowPssCustPhoneSuggestions(false);
                  }}
                  onFocus={() => setShowPssCustNameSuggestions(true)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500"
                />

                {/* Suggestions Dropdown for Name */}
                {showPssCustNameSuggestions && filteredPssCustomersByName.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[230] max-h-48 overflow-y-auto erp-hide-scrollbar py-1">
                    <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 flex items-center justify-between">
                      <span>Existing Customers ({filteredPssCustomersByName.length})</span>
                      <button
                        type="button"
                        onClick={() => setShowPssCustNameSuggestions(false)}
                        className="text-[10px] text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </div>
                    {filteredPssCustomersByName.map((cust) => (
                      <button
                        key={cust._id || cust.id || cust.phone}
                        type="button"
                        onClick={() => handleSelectPssCustomer(cust)}
                        className="w-full text-left px-3 py-2.5 hover:bg-rose-50 text-xs flex justify-between items-center transition-colors cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        <div>
                          <strong className="text-slate-900 font-bold block">{cust.name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{cust.phone || 'No Phone'}</span>
                        </div>
                        <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-lg border border-rose-200">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Phone Input with Suggestions */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Mobile / Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="Type 10-digit mobile number..."
                  value={pssCustPhone}
                  onChange={(e) => {
                    const cleanPhone = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPssCustPhone(cleanPhone);
                    if (pssSameAsMobileWhatsapp) {
                      setPssCustWhatsapp(cleanPhone);
                    }
                    setShowPssCustPhoneSuggestions(true);
                    setShowPssCustNameSuggestions(false);
                  }}
                  onFocus={() => setShowPssCustPhoneSuggestions(true)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-rose-500"
                />

                {/* Suggestions Dropdown for Phone */}
                {showPssCustPhoneSuggestions && filteredPssCustomersByPhone.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[230] max-h-48 overflow-y-auto erp-hide-scrollbar py-1">
                    <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 flex items-center justify-between">
                      <span>Existing Customers ({filteredPssCustomersByPhone.length})</span>
                      <button
                        type="button"
                        onClick={() => setShowPssCustPhoneSuggestions(false)}
                        className="text-[10px] text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </div>
                    {filteredPssCustomersByPhone.map((cust) => (
                      <button
                        key={cust._id || cust.id || cust.phone}
                        type="button"
                        onClick={() => handleSelectPssCustomer(cust)}
                        className="w-full text-left px-3 py-2.5 hover:bg-rose-50 text-xs flex justify-between items-center transition-colors cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        <div>
                          <strong className="text-slate-900 font-bold block">{cust.name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{cust.phone}</span>
                        </div>
                        <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-lg border border-rose-200">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Alternate Number - Optional & WhatsApp Number - Optional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Alternate Number */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Alternate Number
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 lowercase italic">optional</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Secondary contact no..."
                    value={pssCustAltPhone}
                    onChange={(e) => setPssCustAltPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-rose-500 placeholder:font-sans placeholder:text-xs"
                  />
                </div>

                {/* WhatsApp Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp Number
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (pssSameAsMobileWhatsapp) {
                          setPssSameAsMobileWhatsapp(false);
                        } else {
                          setPssSameAsMobileWhatsapp(true);
                          setPssCustWhatsapp(pssCustPhone);
                        }
                      }}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${pssSameAsMobileWhatsapp
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      title="Auto-fill with Mobile number"
                    >
                      {pssSameAsMobileWhatsapp ? '✓ Same as Mobile' : 'Same as Mobile'}
                    </button>
                  </div>
                  <input
                    type="tel"
                    placeholder="WhatsApp contact no..."
                    value={pssCustWhatsapp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPssCustWhatsapp(val);
                      if (val !== pssCustPhone) {
                        setPssSameAsMobileWhatsapp(false);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500 placeholder:font-sans placeholder:text-xs"
                  />
                </div>
              </div>

              {/* Special Instructions / Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between mb-1">
                  <span>Special Instructions / Notes</span>
                  <span className="text-[10px] font-semibold text-slate-400 lowercase italic">optional</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Special alteration notes, fitting preferences, garment instructions..."
                  value={pssCustNotes}
                  onChange={(e) => setPssCustNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-rose-500 resize-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowPSSCustomerDetailsModal(false);
                  setShowPssCustNameSuggestions(false);
                  setShowPssCustPhoneSuggestions(false);
                }}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Cancel PSS
              </button>
              <button
                type="button"
                onClick={handleSavePSSCustomerDetails}
                className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Save & Continue to PSS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: POST SALES SERVICE (PSS) ITEM SELECTION & TAILORING MODAL */}
      {showPSSItemSelectModal && pssInvoice && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-6 animate-fade-in overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scale-up text-slate-800">

            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-wide uppercase font-mono">
                      POST SALES SERVICE (PSS) SELECTION
                    </h3>
                    <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30 uppercase font-mono">
                      Bill #{pssInvoice.invoiceNo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Customer: <span className="text-white font-semibold">{pssInvoice.customerName || "Walk-in Customer"}</span> {pssInvoice.customerPhone ? `(${pssInvoice.customerPhone})` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPSSItemSelectModal(false);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 erp-hide-scrollbar">

              {/* Keyboard Instruction Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Keyboard Shortcut</strong>: Use <kbd className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono font-bold text-amber-950">↑</kbd> <kbd className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono font-bold text-amber-950">↓</kbd> Arrow keys to navigate items and <kbd className="bg-emerald-600 text-white px-2 py-0.5 rounded font-mono font-bold">SPACEBAR</kbd> to toggle selection.
                  </span>
                </div>
                <span className="font-mono font-bold text-[11px] bg-white px-2.5 py-1 rounded-lg border border-amber-300 text-amber-900 shrink-0">
                  {pssConfigItems.filter(i => i.selectedForPSS).length} of {pssConfigItems.length} items in PSS
                </span>
              </div>

              {/* Garment Selection Checklist (SPACEBAR Toggle) */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
                  <span>Select Products from Bill (Press SPACEBAR on focused item to toggle)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = pssConfigItems.every(i => i.selectedForPSS);
                      setPssConfigItems(prev => prev.map(i => ({ ...i, selectedForPSS: !allSelected })));
                    }}
                    className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer lowercase font-mono"
                  >
                    {pssConfigItems.every(i => i.selectedForPSS) ? "unselect all" : "select all"}
                  </button>
                </h4>

                <div className="space-y-3">
                  {pssConfigItems.map((item, idx) => {
                    const isSelected = item.selectedForPSS;
                    const isFocused = idx === pssFocusedIndex;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setPssFocusedIndex(idx);
                          setPssConfigItems(prev => prev.map((itm, i) => i === idx ? { ...itm, selectedForPSS: !itm.selectedForPSS } : itm));
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected
                            ? 'bg-emerald-50 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                            : 'bg-slate-50 border-slate-200 opacity-90 hover:opacity-100'
                          } ${isFocused ? 'ring-4 ring-rose-500/70 border-rose-500 scale-[1.01] shadow-xl' : ''
                          }`}
                      >
                        {/* Header Item Strip */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center font-bold text-xs transition-colors ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white text-transparent'
                              }`}>
                              ✓
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className={`text-sm font-black ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                                  {item.name}
                                </h5>
                                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-700">
                                  Size: {item.size} | Color: {item.color}
                                </span>
                              </div>
                              <p className="text-xs font-mono text-slate-500 mt-0.5">
                                Barcode / Unique Code: {item.barcode || item.uniqueCode || 'N/A'} | Price: ₹{item.price?.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <span className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs uppercase tracking-wider font-mono">
                                SELECTED FOR PSS
                              </span>
                            ) : (
                              <span className="bg-slate-200 text-slate-600 font-semibold text-xs px-3 py-1.5 rounded-xl uppercase tracking-wider font-mono">
                                NOT IN PSS / TAKE HOME
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer / Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600">
                Total Selected PSS Items: <strong className="text-emerald-700 font-bold">{pssConfigItems.filter(i => i.selectedForPSS).length}</strong>
                {pssConfigItems.reduce((acc, i) => acc + Number(i.selectedForPSS ? (i.charge || 0) : 0), 0) > 0 && (
                  <span className="ml-3">
                    Extra Charges: <strong className="text-slate-900 font-mono">₹{pssConfigItems.reduce((acc, i) => acc + Number(i.selectedForPSS ? (i.charge || 0) : 0), 0)}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPSSItemSelectModal(false)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel / Skip PSS
                </button>

                <button
                  type="button"
                  onClick={handleContinueToServiceSelection}
                  disabled={pssConfigItems.filter(i => i.selectedForPSS).length === 0}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Scissors className="w-4 h-4" />
                  SAVE & CONTINUE TO SERVICE SELECTION →
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: PSS STEP 2 — CUSTOMER WAITING OPTION + SALESMAN OWNERSHIP + PRIORITY */}
      {showPSSWaitingModal && pssInvoice && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 animate-fade-in overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scale-up text-slate-800">

            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-wide uppercase font-mono">
                      STEP 2: CUSTOMER WAITING & SALESMAN
                    </h3>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30 uppercase font-mono">
                      Bill #{pssInvoice.invoiceNo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {pssConfigItems.filter(i => i.selectedForPSS).length} garment(s) selected for PSS
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setShowPSSWaitingModal(false)} className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 erp-hide-scrollbar">

              {/* Customer Waiting Option */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">1</span>
                  Is the Customer Waiting in Store?
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'Waiting in Store', label: 'Waiting in Store', badge: 'HIGH PRIORITY', color: 'rose', desc: 'Customer is present. Work urgently.' },
                    { value: 'Will Come Later', label: 'Will Come Later', badge: 'NORMAL', color: 'slate', desc: 'Customer will return at delivery date.' },
                    { value: 'Home Delivery Required', label: 'Home Delivery', badge: 'DELIVERY', color: 'blue', desc: 'Item needs to be delivered to customer.' }
                  ].map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => setPssCustomerWaitingOption(opt.value)}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${pssCustomerWaitingOption === opt.value
                          ? opt.color === 'rose' ? 'bg-rose-50 border-rose-500 ring-1 ring-rose-500/30 shadow-md'
                            : opt.color === 'blue' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500/30 shadow-md'
                              : 'bg-slate-100 border-slate-500 ring-1 ring-slate-500/30 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${pssCustomerWaitingOption === opt.value
                            ? opt.color === 'rose' ? 'border-rose-600 bg-rose-600' : opt.color === 'blue' ? 'border-blue-600 bg-blue-600' : 'border-slate-600 bg-slate-600'
                            : 'border-slate-300 bg-white'
                          }`}>
                          {pssCustomerWaitingOption === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <p className="text-xs font-black text-slate-900">{opt.label}</p>
                      </div>
                      <span className={`text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 rounded ${opt.color === 'rose' ? 'bg-rose-100 text-rose-700'
                          : opt.color === 'blue' ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}>{opt.badge}</span>
                      <p className="text-[10px] text-slate-500 mt-1.5">{opt.desc}</p>
                    </div>
                  ))}
                </div>
                {/* Priority Preview */}
                <div className={`rounded-xl p-3 flex items-center gap-2 text-xs font-bold border ${pssCustomerWaitingOption === 'Waiting in Store' ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : pssCustomerWaitingOption === 'Home Delivery Required' ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                  Auto Priority:&nbsp;
                  <strong>
                    {pssCustomerWaitingOption === 'Waiting in Store' ? 'HIGH / URGENT'
                      : pssCustomerWaitingOption === 'Home Delivery Required' ? 'DELIVERY'
                        : 'NORMAL'}
                  </strong>
                </div>
              </div>

              {/* Salesman Ownership */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-black">2</span>
                  Salesman Ownership
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  {/* Inherited salesman pill (still shown even when overriding) */}
                  {pssInvoice?.salesmanName && !pssSalesmanName && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">
                        {(pssInvoice.salesmanName || 'S')[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-slate-900">{pssInvoice.salesmanName}</p>
                        <p className="text-[11px] text-indigo-600 font-semibold">Auto-inherited from Bill #{pssInvoice.invoiceNo}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPssSalesmanName(' ')}
                        className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-lg border border-amber-200 uppercase hover:bg-amber-200 cursor-pointer transition-colors"
                      >
                        Override
                      </button>
                    </div>
                  )}

                  {/* Autocomplete input — shown when no inherited salesman, or when user clicked Override */}
                  {(!pssInvoice?.salesmanName || pssSalesmanName) && (() => {
                    const query = pssSalesmanName.trim().toLowerCase();
                    const suggestions = (salespersonList || []).filter(e =>
                      query === '' || (e.name || '').toLowerCase().includes(query)
                    );
                    return (
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          {pssInvoice?.salesmanName ? 'Override Salesman' : 'Select Salesman for PSS Ownership'}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={pssSalesmanName.trim() === '' && !pssInvoice?.salesmanName ? '' : pssSalesmanName}
                            onChange={(e) => setPssSalesmanName(e.target.value)}
                            onFocus={() => {
                              // Initialise to empty string so dropdown opens
                              if (pssSalesmanName === ' ') setPssSalesmanName('');
                            }}
                            placeholder="Search salesman by name..."
                            autoComplete="off"
                            className="w-full bg-white border border-indigo-300 rounded-xl text-xs font-bold px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none pr-8"
                          />
                          {pssSalesmanName && (
                            <button
                              type="button"
                              onClick={() => setPssSalesmanName('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          )}

                          {/* Suggestions Dropdown */}
                          {suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-indigo-200 rounded-xl shadow-xl z-[10] overflow-hidden max-h-48 overflow-y-auto erp-hide-scrollbar">
                              {suggestions.map((emp) => (
                                <button
                                  key={emp._id || emp.id || emp.name}
                                  type="button"
                                  onClick={() => setPssSalesmanName(emp.name)}
                                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2.5 hover:bg-indigo-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0 ${pssSalesmanName.trim().toLowerCase() === (emp.name || '').toLowerCase()
                                      ? 'bg-indigo-50 font-black text-indigo-900'
                                      : 'font-semibold text-slate-800'
                                    }`}
                                >
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-[10px] shrink-0">
                                    {(emp.name || 'S')[0].toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate">{emp.name}</p>
                                    {emp.designation && <p className="text-[10px] text-slate-400 truncate">{emp.designation}</p>}
                                  </div>
                                  {pssSalesmanName.trim().toLowerCase() === (emp.name || '').toLowerCase() && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-indigo-600 ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Selected confirmation pill */}
                        {pssSalesmanName.trim() && suggestions.some(e => e.name.toLowerCase() === pssSalesmanName.trim().toLowerCase()) && (
                          <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            Selected: <span className="text-slate-900">{pssSalesmanName.trim()}</span>
                          </p>
                        )}

                        {/* Back to inherited link */}
                        {pssInvoice?.salesmanName && (
                          <button
                            type="button"
                            onClick={() => setPssSalesmanName('')}
                            className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                          >
                            ← Revert to inherited ({pssInvoice.salesmanName})
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>


              {/* WhatsApp Permission */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    id="pssWhatsAppConsent"
                    checked={pssAllowWhatsApp}
                    onChange={(e) => setPssAllowWhatsApp(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label htmlFor="pssWhatsAppConsent" className="text-xs font-black text-slate-900 cursor-pointer flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    Customer has given WhatsApp consent
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {pssAllowWhatsApp
                      ? 'PSS Slip will be sent to customer via WhatsApp after saving.'
                      : 'WhatsApp message will NOT be sent — slip will only be printed.'}
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => { setShowPSSWaitingModal(false); setShowPSSItemSelectModal(true); }}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                ← Back to Item Selection
              </button>
              <button
                type="button"
                onClick={() => { setShowPSSWaitingModal(false); setShowPSSServiceSelectModal(true); }}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                CONTINUE TO SERVICE SELECTION →
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: POST SALES SERVICE (PSS) - SERVICE SELECTION & WORK ASSIGNMENT MODAL */}
      {showPSSServiceSelectModal && pssInvoice && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 animate-fade-in overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scale-up text-slate-800">

            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-wide uppercase font-mono">
                      STEP 2: PSS SERVICE SELECTION & WORK ASSIGNMENT
                    </h3>
                    <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30 uppercase font-mono">
                      Bill Barcode: {pssInvoice.invoiceNo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Customer: <span className="text-white font-semibold">{pssInvoice.customerName || "Walk-in Customer"}</span> {pssInvoice.customerPhone ? `(${pssInvoice.customerPhone})` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPSSServiceSelectModal(false);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 erp-hide-scrollbar">

              {/* Per-Item Service Selection */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Garments Pending Service Setup ({pssConfigItems.filter(i => i.selectedForPSS).length} Items)
                  </h4>

                  {/* Filter Tab: All / Gents / Ladies */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-wider">Filter:</span>
                    {['All', 'Gents', 'Ladies'].map(gf => {
                      const count = gf === 'All'
                        ? pssConfigItems.filter(i => i.selectedForPSS).length
                        : pssConfigItems.filter(i => i.selectedForPSS && (i.gender || 'Gents') === gf).length;
                      const isAct = pssServiceGenderFilter === gf;
                      return (
                        <button
                          key={gf}
                          type="button"
                          onClick={() => setPssServiceGenderFilter(gf)}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${isAct
                              ? gf === 'Ladies'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : gf === 'Gents'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-900 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                            }`}
                        >
                          {gf === 'Gents' && <span>👨</span>}
                          {gf === 'Ladies' && <span>👩</span>}
                          <span>{gf} ({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  {pssConfigItems
                    .filter(i => i.selectedForPSS && (pssServiceGenderFilter === 'All' || (i.gender || 'Gents') === pssServiceGenderFilter))
                    .map((item, idx) => {
                      const selectedServices = Array.isArray(item.services) ? item.services : (item.serviceType ? [item.serviceType] : ['Alteration']);
                      const hasAlteration = selectedServices.some(s => s.toLowerCase().includes('alteration'));
                      return (
                        <div
                          key={item.itemKey || idx}
                          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-sm font-black text-slate-900">
                                  {item.name}
                                </h5>
                                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                  Size: {item.size} | Color: {item.color}
                                </span>
                              </div>
                              <p className="text-xs font-mono text-slate-500 mt-0.5">
                                Barcode / Unique Code: <strong className="text-slate-800">{item.barcode || item.uniqueCode || 'N/A'}</strong>
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Option of Gents / Ladies in front of product if Alteration service is selected */}
                              {hasAlteration && (
                                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 shadow-2xs">
                                  <span className="text-[10px] font-black uppercase text-slate-400 px-1">Gender:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPssConfigItems(prev => prev.map(itm => itm.itemKey === item.itemKey ? { ...itm, gender: 'Gents' } : itm));
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${(item.gender || 'Gents') === 'Gents'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                  >
                                    <span>👨 Gents</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPssConfigItems(prev => prev.map(itm => itm.itemKey === item.itemKey ? { ...itm, gender: 'Ladies' } : itm));
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${item.gender === 'Ladies'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                  >
                                    <span>👩 Ladies</span>
                                  </button>
                                </div>
                              )}

                              {/* Service Badges - When Alteration is written, show Gents/Ladies under it */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {selectedServices.map(sv => (
                                  <div key={sv} className="flex flex-col items-center">
                                    <span className="text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                                      {sv}
                                    </span>
                                    {sv.toLowerCase().includes('alteration') && (
                                      <span className={`text-[8px] font-black uppercase tracking-wider mt-0.5 px-1.5 py-0.2 rounded border ${(item.gender || 'Gents') === 'Ladies'
                                          ? 'bg-pink-50 text-pink-700 border-pink-200'
                                          : 'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                        {(item.gender || 'Gents')}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Multi-Service Selection */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                              Select Required Service(s) * <span className="text-slate-400 font-normal normal-case">(Select all that apply — one ticket per garment)</span>
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {['Alteration', 'Re-Alteration', 'Dry Clean', 'Fall & Pico', 'Charak', 'Embroidery', 'Repair', 'Ironing', 'Finishing', 'Packing'].map(srv => {
                                const isChecked = selectedServices.includes(srv);
                                return (
                                  <label
                                    key={srv}
                                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 cursor-pointer transition-all text-xs font-bold select-none ${isChecked
                                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                      }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        const newServices = isChecked
                                          ? selectedServices.filter(s => s !== srv)
                                          : [...selectedServices, srv];
                                        setPssConfigItems(prev => prev.map(itm =>
                                          itm.itemKey === item.itemKey
                                            ? { ...itm, services: newServices.length ? newServices : ['Alteration'], serviceType: newServices[0] || 'Alteration' }
                                            : itm
                                        ));
                                      }}
                                      className="w-3 h-3 accent-rose-600 shrink-0 cursor-pointer"
                                    />
                                    <span className="truncate">{srv}</span>
                                  </label>
                                );
                              })}
                            </div>
                            {selectedServices.length === 0 && (
                              <p className="text-[11px] text-rose-600 font-bold mt-1">⚠ Select at least one service</p>
                            )}
                          </div>

                          {/* Trial Required Option (Shown when Alteration service is selected) */}
                          {hasAlteration && (
                            <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-black uppercase text-purple-950 flex items-center gap-1.5">
                                  <span>👔</span> Trial Required?
                                </span>
                                <div className="flex items-center gap-3">
                                  <label className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`trialReq-${item.itemKey || idx}`}
                                      checked={item.trialRequired !== false}
                                      onChange={() => {
                                        setPssConfigItems(prev => prev.map(itm => itm.itemKey === item.itemKey ? { ...itm, trialRequired: true } : itm));
                                      }}
                                      className="accent-purple-600 cursor-pointer"
                                    />
                                    <span>Yes</span>
                                  </label>
                                  <label className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`trialReq-${item.itemKey || idx}`}
                                      checked={item.trialRequired === false}
                                      onChange={() => {
                                        setPssConfigItems(prev => prev.map(itm => itm.itemKey === item.itemKey ? { ...itm, trialRequired: false } : itm));
                                      }}
                                      className="accent-purple-600 cursor-pointer"
                                    />
                                    <span>No</span>
                                  </label>
                                </div>
                              </div>

                              {item.trialRequired !== false && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold uppercase text-purple-900">Trial Date:</span>
                                  <input
                                    type="date"
                                    value={item.trialDate || pssGeneralTrialDate || ''}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setPssConfigItems(prev => prev.map(itm => itm.itemKey === item.itemKey ? { ...itm, trialDate: v } : itm));
                                    }}
                                    className="bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-purple-950 outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tailor Assignment */}
                          {pssAssignmentOption === "DIRECT" && (
                            <div>
                              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                Tailor / Vendor Assignment
                              </label>
                              <select
                                value={item.tailorName || pssGeneralTailor}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPssConfigItems(prev => prev.map(itm => itm.itemKey === item.itemKey ? { ...itm, tailorName: val } : itm));
                                }}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                              >
                                {tailorEmployeesList.map(t => (
                                  <option key={t.id || t._id || t.name} value={t.name}>
                                    {t.name} {t.designation ? `(${t.designation})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>


              {/* 3. Work Assignment Flow Options */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
                  <span>Work Assignment Workflow Option</span>
                  <span className="text-[11px] font-mono text-slate-500">Service-based routing</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setPssAssignmentOption("DIRECT")}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${pssAssignmentOption === "DIRECT"
                        ? 'bg-rose-50 border-rose-500 shadow-xs ring-1 ring-rose-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="pssAssignOpt"
                      checked={pssAssignmentOption === "DIRECT"}
                      onChange={() => setPssAssignmentOption("DIRECT")}
                      className="mt-1 accent-rose-600"
                    />
                    <div>
                      <h5 className="text-xs font-black text-slate-900">
                        OPTION A — Direct Assignment (Counter has time)
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Immediately assign items to tailors/vendors now. Status set to <strong className="text-emerald-700">ASSIGNED</strong>.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setPssAssignmentOption("PENDING_QUEUE")}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${pssAssignmentOption === "PENDING_QUEUE"
                        ? 'bg-amber-50 border-amber-500 shadow-xs ring-1 ring-amber-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="pssAssignOpt"
                      checked={pssAssignmentOption === "PENDING_QUEUE"}
                      onChange={() => setPssAssignmentOption("PENDING_QUEUE")}
                      className="mt-1 accent-amber-600"
                    />
                    <div>
                      <h5 className="text-xs font-black text-slate-900">
                        OPTION B — Pending Assignment Queue (Fast Counter)
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Send to queue without assigning. Status set to <strong className="text-amber-700">PENDING ASSIGNMENT</strong> for manager later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Date, Trial Date & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Promised Delivery Date
                  </label>
                  <input
                    type="date"
                    value={pssGeneralDeliveryDate}
                    onChange={(e) => setPssGeneralDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Trial Date
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="pssGenTrialReq"
                          checked={pssGeneralTrialRequired !== false}
                          onChange={() => setPssGeneralTrialRequired(true)}
                          className="accent-purple-600 cursor-pointer"
                        />
                        Yes
                      </label>
                      <label className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="pssGenTrialReq"
                          checked={pssGeneralTrialRequired === false}
                          onChange={() => setPssGeneralTrialRequired(false)}
                          className="accent-purple-600 cursor-pointer"
                        />
                        No
                      </label>
                    </div>
                  </div>
                  <input
                    type="date"
                    disabled={pssGeneralTrialRequired === false}
                    value={pssGeneralTrialDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPssGeneralTrialDate(v);
                      setPssConfigItems(prev => prev.map(itm => ({ ...itm, trialDate: itm.trialDate || v })));
                    }}
                    className={`w-full border rounded-xl text-xs font-mono font-bold px-3 py-2 outline-none ${pssGeneralTrialRequired === false
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-purple-50/50 border-purple-300 text-purple-950 focus:ring-2 focus:ring-purple-500'
                      }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Priority
                  </label>
                  <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1">
                    {['Normal', 'Urgent'].map(prio => (
                      <button
                        key={prio}
                        type="button"
                        onClick={() => setPssGeneralPriority(prio)}
                        className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${pssGeneralPriority === prio
                            ? prio === 'Urgent' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        {prio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer / Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowPSSServiceSelectModal(false);
                  setShowPSSWaitingModal(true);
                }}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                ← Back to Priority / Salesman
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPSSServiceSelectModal(false)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel PSS
                </button>

                <button
                  type="button"
                  onClick={handleSubmitPSS}
                  disabled={isSubmittingPSS}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingPSS ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving PSS Record...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      SAVE PSS RECORD & ISSUE DOCKET
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: COMPLETED ALTERATION SLIP DOCKET */}
      {showAlterationDocketModal && completedAlterationDocket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[120] font-sans animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-rose-600">
                <Scissors className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wide">
                  Alteration Slip Issued
                </span>
              </div>
              <button
                onClick={() => setShowAlterationDocketModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Docket Ticket View (Supports Multiple Garments) */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 font-mono text-xs text-slate-800 space-y-3 max-h-96 overflow-y-auto">
              <div className="text-center font-bold text-slate-900 text-sm">
                VASTRA ERP
                <p className="text-[10px] text-rose-600 uppercase font-black tracking-widest mt-0.5">
                  OFFICIAL ALTERATION JOB DOCKET
                </p>
                <span className="inline-block bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-mono mt-1 font-bold">
                  {completedAlterationDocket.docketNo}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="space-y-1 text-[11px]">
                <p>Date: <strong>{new Date(completedAlterationDocket.createdAt).toLocaleString('en-IN')}</strong></p>
                <p>Ref Bill: <strong className="text-indigo-600">{completedAlterationDocket.originalInvoiceNo}</strong></p>
                <p>Customer: <strong>{completedAlterationDocket.customerName}</strong> {completedAlterationDocket.customerPhone ? `(${completedAlterationDocket.customerPhone})` : ''}</p>
                <p>Cashier: {completedAlterationDocket.cashierName}</p>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              {/* Multi-Garment List */}
              {(() => {
                const itemsList = completedAlterationDocket.items || (completedAlterationDocket.item ? [completedAlterationDocket.item] : []);
                return itemsList.map((itm, iIdx) => {
                  const rec = itm.alterationRecord || completedAlterationDocket;
                  return (
                    <div key={iIdx} className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 mb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs">{iIdx + 1}. {itm.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Size: {itm.size || 'M'} | Col: {itm.color || 'Std'} | Code: {itm.barcode || itm.uniqueCode || 'N/A'}</p>
                        </div>
                        <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded uppercase">
                          {rec.tailorName || 'Master Tailor'}
                        </span>
                      </div>

                      {rec.alterationDetails?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rec.alterationDetails.map((req, rIdx) => (
                            <span key={rIdx} className="bg-rose-50 text-rose-700 font-bold text-[9px] px-2 py-0.5 rounded border border-rose-200">
                              {req}
                            </span>
                          ))}
                        </div>
                      )}

                      {rec.customInstructions && (
                        <p className="text-[9.5px] text-slate-600 italic">"{rec.customInstructions}"</p>
                      )}

                      {Object.keys(rec.measurements || {}).filter(k => rec.measurements[k]).length > 0 && (
                        <div className="pt-1 border-t border-slate-100 grid grid-cols-3 gap-1 text-[9px]">
                          {Object.entries(rec.measurements).filter(([_, v]) => v).map(([k, v]) => (
                            <span key={k}><strong>{k}:</strong> {v}"</span>
                          ))}
                        </div>
                      )}

                      <p className="text-[9.5px] text-amber-700 font-bold">
                        Delivery: {rec.deliveryDate ? new Date(rec.deliveryDate).toLocaleDateString('en-IN') : 'Standard'} {rec.deliveryTime || ''}
                      </p>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 font-sans text-xs">
              <button
                onClick={() => setShowAlterationDocketModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close & Next Bill
              </button>
              <button
                onClick={() => {
                  const docket = completedAlterationDocket;
                  const itemsList = docket.items || (docket.item ? [docket.item] : []);
                  const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                      <title>Alteration Slip ${docket.docketNo}</title>
                      <style>
                        body { font-family: 'Courier New', Courier, monospace; color: #000; padding: 20px; max-width: 380px; margin: 0 auto; line-height: 1.4; }
                        .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                        .section { border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px; font-size: 12px; }
                        .bold { font-weight: bold; }
                        .badge { background: #000; color: #fff; padding: 3px 8px; font-weight: bold; font-size: 11px; display: inline-block; margin-top: 5px; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h2 style="margin:0;">VASTRA ERP</h2>
                        <p style="margin:2px 0; font-size:11px;">OFFICIAL ALTERATION SLIP</p>
                        <div class="badge">${docket.docketNo}</div>
                      </div>
                      <div class="section">
                        <div><b>Date:</b> ${new Date(docket.createdAt).toLocaleString('en-IN')}</div>
                        <div><b>Ref Sale Bill:</b> ${docket.originalInvoiceNo}</div>
                        <div><b>Customer:</b> ${docket.customerName} ${docket.customerPhone ? `(${docket.customerPhone})` : ''}</div>
                      </div>
                      ${itemsList.map((itm, iIdx) => {
                    const rec = itm.alterationRecord || docket;
                    return `
                          <div class="section">
                            <b>${iIdx + 1}. GARMENT:</b> ${itm.name} (${itm.size || 'M'} / ${itm.color || 'Std'})<br/>
                            <b>Barcode:</b> ${itm.barcode || itm.uniqueCode || 'N/A'}<br/>
                            <b>Tailor:</b> ${rec.tailorName || 'Master Tailor'}<br/>
                            <b>Delivery:</b> ${rec.deliveryDate ? new Date(rec.deliveryDate).toLocaleDateString('en-IN') : 'Standard'} ${rec.deliveryTime || ''}<br/>
                            <b>INSTRUCTIONS:</b><br/>
                            ${rec.alterationDetails?.join(', ') || 'Custom Fitting'}<br/>
                            ${rec.customInstructions ? `<i>${rec.customInstructions}</i><br/>` : ''}
                            ${Object.entries(rec.measurements || {}).filter(([_, v]) => v).map(([k, v]) => `<span><b>${k}:</b> ${v}" </span>`).join(' | ')}
                          </div>
                        `;
                  }).join('')}
                      <div style="text-align: center; font-size: 10px; margin-top: 15px;">
                        *** Please present this slip during delivery collection ***
                      </div>
                    <script>window.onload = function() { setTimeout(function() { window.print(); }, 400); }</script>
                    </body>
                    </html>
                  `;
                  const blob = new Blob(["\ufeff" + htmlContent], { type: "text/html;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  window.open(url, "_blank");
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Alteration Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL: PSS SLIP (after save) — Invoice No + PSS Ticket No + Bill Barcode + WhatsApp */}
      {pssSlipData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[220] font-sans animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 animate-scale-up overflow-hidden">

            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-wide font-mono">PSS SLIP ISSUED</p>
                  <p className="text-[11px] text-slate-400">Post Sales Service Booking Confirmed</p>
                </div>
              </div>
              <button onClick={() => setPssSlipData(null)} className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Slip Body */}
            <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto erp-hide-scrollbar">

              {/* Key Reference Numbers & Customer Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Date</span>
                  <span className="font-bold text-slate-800">{new Date(pssSlipData.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Customer Name</span>
                  <span className="font-black text-slate-900">{pssSlipData.customerName || 'Walk-in Customer'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Mobile Number</span>
                  <span className="font-bold text-slate-800">{pssSlipData.customerPhone || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Original Invoice No</span>
                  <span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">{pssSlipData.originalInvoiceNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">PSS Ticket No</span>
                  <span className="font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg">{pssSlipData.pssmNo}</span>
                </div>
                {(() => {
                  const itemTIs = (pssSlipData.items || []).map(i => i.tailorInvoiceNo).filter(Boolean);
                  const allTIs = Array.from(new Set([pssSlipData.tailorInvoiceNo, ...itemTIs].filter(Boolean))).join(', ');
                  if (!allTIs) return null;
                  return (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider">Tailor Invoice No</span>
                      <span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg font-mono text-[11px]">{allTIs}</span>
                    </div>
                  );
                })()}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Bill Barcode</span>
                  <span className="font-black text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-lg font-mono">{pssSlipData.billBarcode}</span>
                </div>
                <div className="border-t border-dashed border-slate-200 my-1" />

                {/* Financial Summary: Advance / Balance */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Advance Paid</span>
                  <span className="font-bold text-emerald-700">₹{(pssSlipData.advancePaid || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Balance Due</span>
                  <span className={`font-black px-2 py-0.5 rounded ${(pssSlipData.balanceDue || 0) > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800'}`}>
                    ₹{(pssSlipData.balanceDue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-dashed border-slate-200 my-1" />

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Priority</span>
                  <span className={`font-black px-2.5 py-0.5 rounded-lg ${pssSlipData.priority === 'HIGH' ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : pssSlipData.priority === 'DELIVERY' ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>{pssSlipData.priority}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Salesman</span>
                  <span className="font-bold text-slate-800">{pssSlipData.salesmanName}</span>
                </div>
                {pssSlipData.deliveryDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider">Expected Delivery</span>
                    <span className="font-bold text-amber-700">{new Date(pssSlipData.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
                {Boolean(pssSlipData.trialRequired && pssSlipData.trialDate) && (
                  <div className="flex justify-between items-center bg-purple-50/60 p-1.5 rounded-lg border border-purple-200/60">
                    <span className="text-purple-900 font-bold uppercase tracking-wider flex items-center gap-1 text-[11px]">
                      <span>👔</span>
                      <span>Trial Date</span>
                    </span>
                    <span className="font-black text-purple-700 bg-white border border-purple-300 px-2 py-0.5 rounded shadow-2xs">
                      {new Date(pssSlipData.trialDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {/* Overall PSS Status */}
                {(() => {
                  const allItemsCollected = (pssSlipData.items?.length > 0) && pssSlipData.items.every(it => it.status === 'COLLECTED' || it.status === 'CLOSED');
                  const displayStatus = (allItemsCollected || pssSlipData.status === 'CLOSED' || pssSlipData.status === 'COLLECTED')
                    ? 'CLOSED'
                    : (pssSlipData.status || 'PENDING');
                  return (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider">Overall Status</span>
                      <span className={`font-black uppercase px-2.5 py-0.5 rounded-lg text-xs border ${displayStatus === 'CLOSED' ? 'bg-slate-800 text-white border-slate-900 shadow-xs' :
                          displayStatus === 'READY_FOR_DELIVERY' || displayStatus === 'READY' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            displayStatus === 'PARTIALLY_COLLECTED' ? 'bg-teal-100 text-teal-800 border-teal-300' :
                              displayStatus === 'PARTIALLY_READY' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                displayStatus === 'IN_PROGRESS' || displayStatus === 'ASSIGNED' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                  'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                        {displayStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Customer Info */}
              <div className="text-xs space-y-1.5 border border-slate-100 rounded-xl p-3 bg-white">
                <p className="font-black text-slate-800">{pssSlipData.customerName} {pssSlipData.customerPhone ? `(${pssSlipData.customerPhone})` : ''}</p>
                {(pssSlipData.alternatePhone || pssSlipData.whatsappNumber) && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500 text-[11px]">
                    {pssSlipData.alternatePhone && <span>Alt: <strong className="text-slate-700">{pssSlipData.alternatePhone}</strong></span>}
                    {pssSlipData.whatsappNumber && <span>WA: <strong className="text-emerald-700">{pssSlipData.whatsappNumber}</strong></span>}
                  </div>
                )}
                <p className="text-slate-500">Cashier: {pssSlipData.cashierName} | Waiting: {pssSlipData.customerWaitingOption}</p>
                {pssSlipData.specialInstructions && (
                  <div className="text-amber-900 bg-amber-50 rounded-lg p-2 border border-amber-200 text-[11px] leading-relaxed">
                    <strong className="block text-[10px] uppercase font-bold text-amber-700">Special Instructions / Notes:</strong>
                    {pssSlipData.specialInstructions}
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-black uppercase text-slate-600 tracking-wider">{pssSlipData.items?.length} Garment(s) for Service</p>
                  {(pssSlipData.items || []).filter(it => it.status !== 'COLLECTED').length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleCollectPSSItemFromSlip(null)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-all shadow-xs flex items-center gap-1"
                      title="Mark all garments as collected by customer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Collect All Items</span>
                    </button>
                  )}
                </div>
                {(pssSlipData.items || []).map((itm, idx) => {
                  const isReady = itm.status === 'READY';
                  const isCollected = itm.status === 'COLLECTED';
                  const isAlterationService = String(itm.serviceType || '').toLowerCase().includes('alteration');
                  const measurementsObj = itm.measurements || {};
                  const inseamVal = measurementsObj.inseam || measurementsObj.innerLegLength || measurementsObj.Inseam || measurementsObj['Inner Leg Length'] || '';

                  return (
                    <div key={idx} className={`border rounded-xl p-3 text-xs space-y-1.5 transition-all ${isCollected ? 'bg-slate-50/80 border-slate-200' :
                        isReady ? 'bg-emerald-50/70 border-emerald-300' :
                          'bg-white border-slate-200'
                      }`}>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-black text-slate-900">{idx + 1}. {itm.name}</p>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${(itm.gender || 'Gents') === 'Ladies' ? 'bg-pink-100 text-pink-700 border-pink-300' : 'bg-blue-100 text-blue-700 border-blue-300'
                              }`}>
                              {itm.gender || 'Gents'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded uppercase inline-block">
                              {itm.serviceType}
                            </span>
                            {isAlterationService && itm.tailorInvoiceNo && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-300 font-black px-2 py-0.5 rounded font-mono inline-block">
                                Tailor Invoice No: {itm.tailorInvoiceNo}
                              </span>
                            )}
                            {isAlterationService && (itm.charge > 0 || pssSlipData.totalCharges > 0) && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded inline-block">
                                Tailoring Charge: ₹{itm.charge || pssSlipData.totalCharges || 0}
                              </span>
                            )}
                            {Boolean((itm.trialRequired !== undefined ? itm.trialRequired : pssSlipData.trialRequired) && (itm.trialDate || pssSlipData.trialDate)) && (
                              <span className="text-[10px] bg-purple-50 text-purple-800 border border-purple-300 font-black px-2 py-0.5 rounded uppercase inline-flex items-center gap-1">
                                <span>👔 Trial: {new Date(itm.trialDate || pssSlipData.trialDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isCollected ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>COLLECTED</span>
                            </span>
                          ) : (
                            <>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${isReady ? 'bg-emerald-600 text-white border-emerald-700' :
                                  itm.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                    'bg-amber-100 text-amber-800 border-amber-200'
                                }`}>
                                {(itm.status || 'PENDING').replace(/_/g, ' ')}
                              </span>
                              {itm._id && (
                                <button
                                  type="button"
                                  onClick={() => handleCollectPSSItemFromSlip(itm._id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                                  title="Handover to customer & mark as collected"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Collect</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-600 font-mono text-[11px]">
                        Bill No: <strong className="text-slate-900">{pssSlipData.originalInvoiceNo}</strong> | Code: <strong className="text-slate-900">{itm.uniqueCode || itm.barcode || 'N/A'}</strong> | Size: {itm.size} | Color: {itm.color}
                      </p>

                      {/* Measurements & Inseam if Alteration */}
                      {isAlterationService && Object.keys(measurementsObj).length > 0 && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] space-y-1 mt-1">
                          <span className="font-bold text-slate-700 uppercase block text-[10px]">Measurements:</span>
                          <div className="flex flex-wrap gap-2 text-slate-800 font-mono">
                            {Object.entries(measurementsObj).map(([mk, mv]) => (
                              <span key={mk} className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                <strong>{mk}:</strong> {mv}"
                              </span>
                            ))}
                          </div>
                          {inseamVal && (
                            <div className="text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px] font-bold mt-1 inline-block">
                              Inseam / Inner Leg Length: {inseamVal}"
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-slate-600 font-semibold text-[11px]">Assigned to: <span className="text-slate-900 font-black">{itm.assignedTo}</span></p>
                      {itm.alterationDetails?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {itm.alterationDetails.map((d, di) => (
                            <span key={di} className="bg-rose-50 text-rose-700 font-bold text-[9px] px-1.5 py-0.5 rounded border border-rose-200">{d}</span>
                          ))}
                        </div>
                      )}

                      {/* Item-Level Alteration Barcode Box */}
                      {(() => {
                        const itemAltBarcode = itm.alterationBarcode || itm.tailorInvoiceNo || (itm.barcode && String(itm.barcode).startsWith('TI-') ? itm.barcode : null) || (pssSlipData.pssmNo ? `${pssSlipData.pssmNo}-${idx + 1}` : null);
                        if (!itemAltBarcode) return null;
                        const itemBarcodeSvg = generateCode128SvgString(itemAltBarcode, {
                          width: 1.5,
                          height: 38,
                          displayValue: false,
                          margin: 4,
                          background: '#ffffff',
                          lineColor: '#000000'
                        });
                        return (
                          <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                            <div className="text-[10px] space-y-0.5">
                              <span className="font-bold text-slate-500 uppercase tracking-wider block text-[9px]">Item Alteration Barcode</span>
                              <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded inline-block">{itemAltBarcode}</span>
                              <span className="text-[9px] text-slate-400 block italic">Scannable in Tailoring &amp; Garments</span>
                            </div>
                            <div className="bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                              <div
                                className="flex items-center justify-center [&>svg]:max-w-[150px] [&>svg]:h-auto"
                                dangerouslySetInnerHTML={{ __html: itemBarcodeSvg }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>

              {/* Connected Bill UPI & Verification QR Code Graphic Box */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 text-center space-y-2 font-mono shadow-md border border-slate-800">
                <div className="flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <p className="text-[10.5px] text-emerald-300 font-black uppercase tracking-wider">ALTERATION TRACKING QR CODE ({pssSlipData.pssmNo})</p>
                </div>
                <div className="bg-white p-3 rounded-xl inline-block text-slate-900 shadow-inner max-w-full">
                  {(() => {
                    const pssmQrSvg = generateInvoiceUPIQrSvg(pssSlipData, {
                      width: 130,
                      height: 130,
                      padding: 1
                    });
                    return (
                      <div className="flex flex-col items-center justify-center">
                        <div
                          className="w-32 h-32 flex items-center justify-center overflow-hidden [&>svg]:w-full [&>svg]:h-full"
                          dangerouslySetInnerHTML={{ __html: pssmQrSvg }}
                        />
                        <div className="text-[11px] font-black mt-1 font-mono tracking-wider text-slate-900">
                          {pssSlipData.pssmNo}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <p className="text-[9.5px] text-slate-300">
                  Scan to View Live Alteration Progress • Linked to Ticket <strong className="text-white font-mono">{pssSlipData.pssmNo}</strong>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-5 py-4 border-t border-slate-100 grid grid-cols-3 gap-2">
              <button
                onClick={() => setPssSlipData(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const d = pssSlipData;
                  const allCollected = (d.items || []).length > 0 && (d.items || []).every(it => it.status === 'COLLECTED' || it.status === 'CLOSED');
                  const printOverallStatus = (allCollected || d.status === 'CLOSED' || d.status === 'COLLECTED') ? 'CLOSED' : (d.status || 'PENDING');
                  const pssmQrSvg = generateInvoiceUPIQrSvg(d, {
                    width: 100,
                    height: 100,
                    padding: 1
                  });
                  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PSS Slip ${d.pssmNo}</title><style>body{font-family:'Courier New',monospace;color:#000;padding:16px;max-width:380px;margin:0 auto;line-height:1.4}h2{margin:0}.section{border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px;font-size:11px}.bold{font-weight:bold}.badge{background:#000;color:#fff;padding:3px 8px;font-weight:bold;display:inline-block;margin-top:4px}.qr-wrap{text-align:center;margin-top:14px;padding-top:8px;border-top:1px dashed #000}.opt-charge{font-style:italic;color:#555;font-size:10px}</style></head><body><div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:10px"><h2>POST SALES SERVICE SLIP</h2><p style="margin:2px 0;font-size:11px">Date: <b>${d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</b></p><p style="margin:2px 0;font-size:11px">Original Bill No: <b>${d.originalInvoiceNo}</b></p><div class="badge">PSS Ticket: ${d.pssmNo}</div>${(() => { const itemTIs = (d.items || []).map(i => i.tailorInvoiceNo).filter(Boolean); const allTIs = Array.from(new Set([d.tailorInvoiceNo, ...itemTIs].filter(Boolean))).join(', '); return allTIs ? `<p style="margin:2px 0;font-size:11px;font-weight:bold">Tailor Invoice No: ${allTIs}</p>` : ''; })()}</div><div class="section"><b>Customer Name:</b> ${d.customerName}<br/><b>Mobile Number:</b> ${d.customerPhone || 'N/A'}<br/>${d.alternatePhone ? '<b>Alt Phone:</b> ' + d.alternatePhone + '<br/>' : ''}${d.whatsappNumber ? '<b>WhatsApp:</b> ' + d.whatsappNumber + '<br/>' : ''}<b>Salesman:</b> ${d.salesmanName}<br/><b>Cashier:</b> ${d.cashierName}<br/><b>Priority:</b> ${d.priority}<br/>${d.deliveryDate ? '<b>Expected Delivery Date:</b> ' + new Date(d.deliveryDate).toLocaleDateString('en-IN') + '<br/>' : ''}${d.trialRequired !== undefined ? '<b>Trial Required:</b> ' + (d.trialRequired ? 'YES' : 'NO') + (d.trialDate ? ' (Trial Date: ' + (new Date(d.trialDate).toLocaleDateString('en-IN') || d.trialDate) + ')' : '') + '<br/>' : ''}<b>Advance Paid:</b> ₹${d.advancePaid || 0}<br/><b>Balance Due:</b> ₹${d.balanceDue || 0}<br/><b>Overall Status:</b> <span style="font-weight:bold;text-transform:uppercase">${printOverallStatus.replace(/_/g, ' ')}</span><br/>${d.specialInstructions ? '<b>Special Instructions:</b> ' + d.specialInstructions + '<br/>' : ''}</div>${(d.items || []).map((it, i) => { const isAlt = String(it.serviceType || '').toLowerCase().includes('alteration'); const mObj = it.measurements || {}; const ins = mObj.inseam || mObj.innerLegLength || mObj.Inseam || mObj['Inner Leg Length'] || ''; const mStr = Object.entries(mObj).map(([k, v]) => `${k}: ${v}"`).join(', '); const charge = it.charge || d.totalCharges; const itemAltBarcode = it.alterationBarcode || it.tailorInvoiceNo || (it.barcode && String(it.barcode).startsWith('TI-') ? it.barcode : null) || (d.pssmNo ? `${d.pssmNo}-${i + 1}` : null); const itemBarcodeSvg = itemAltBarcode ? generateCode128SvgString(itemAltBarcode, { width: 1.4, height: 34, displayValue: false, margin: 2, background: '#ffffff', lineColor: '#000000' }) : ''; return `<div class="section"><b>${i + 1}. Garment: ${it.name}</b><br/><b>Gents / Ladies:</b> ${it.gender || 'Gents'}<br/><b>Bill No &amp; Unique Code:</b> ${d.originalInvoiceNo} / ${it.uniqueCode || it.barcode || 'N/A'}<br/><b>Size &amp; Color:</b> ${it.size} / ${it.color}<br/><b>Service:</b> ${it.serviceType}<br/>${isAlt && it.tailorInvoiceNo ? '<b>Tailor Invoice No:</b> ' + it.tailorInvoiceNo + '<br/>' : ''}${isAlt ? '<b>Tailoring Charges:</b> ' + (charge > 0 ? '₹' + charge : '<span class="opt-charge">N/A (optional)</span>') + '<br/>' : ''}${isAlt && mStr ? '<b>Measurements:</b> ' + mStr + '<br/>' : ''}${isAlt && ins ? '<b>Inseam / Inner Leg Length:</b> <b>' + ins + '"</b><br/>' : ''}<b>Status:</b> ${it.status === 'COLLECTED' ? '[COLLECTED]' : (it.status || 'PENDING')}<br/><b>Assigned To:</b> ${it.assignedTo}${itemAltBarcode ? `<div style="text-align:center;margin:6px 0;padding:4px;border:1px dashed #000;background:#fafafa"><div style="font-size:8px;font-weight:bold;color:#444;margin-bottom:2px">GARMENT ALTERATION BARCODE</div><div style="display:inline-block;max-width:100%;background:#fff">${itemBarcodeSvg}</div><div style="font-size:10px;font-weight:900;font-family:monospace;letter-spacing:1px;margin-top:2px">${itemAltBarcode}</div></div>` : ''}</div>`; }).join('')}<div class="qr-wrap"><div style="font-size:9px;font-weight:bold;color:#333;margin-bottom:4px;letter-spacing:0.5px">ALTERATION TRACKING QR CODE</div><div style="display:inline-block;background:#fff;padding:4px;border:1px solid #ccc;border-radius:4px"><div style="width:100px;height:100px;margin:0 auto">${pssmQrSvg}</div></div><p style="margin:4px 0 2px;font-size:11px;font-weight:bold;font-family:monospace">PSSM: ${d.pssmNo}</p><p style="font-size:9.5px;margin-top:2px;font-style:italic;color:#666">*** Scan to view live alteration status &amp; product progress ***</p></div><script>window.onload=function(){setTimeout(function(){window.print()},400)}</script></body></html>`;
                  const url = URL.createObjectURL(new Blob(['\ufeff' + html], { type: 'text/html;charset=utf-8' }));
                  window.open(url, '_blank');
                }}
                className="py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                Print Slip
              </button>
              <button
                onClick={() => {
                  if (!pssSlipData.allowWhatsApp) {
                    alert('WhatsApp consent not given for this customer. Slip printed only.');
                    return;
                  }
                  const d = pssSlipData;
                  const uniqueSlipBarcode = d.slipBarcode || d.pssmNo || d.billBarcode;
                  const itemLines = (d.items || []).map((it, i) => `${i + 1}. ${it.name} (${it.size} · ${it.gender || 'Gents'}) — *${it.serviceType}*`).join('\n');
                  const msg = `🧵 *PSS Service Booking Confirmed!*\n\n📋 *Invoice No:* ${d.originalInvoiceNo}\n🎫 *PSS Ticket:* ${d.pssmNo}\n🔖 *Slip Barcode:* ${uniqueSlipBarcode}\n⚡ *Priority:* ${d.priority}\n\n👔 *Garments:*\n${itemLines}\n\n${d.deliveryDate ? '📅 *Expected Delivery:* ' + new Date(d.deliveryDate).toLocaleDateString('en-IN') + '\n' : ''}${d.specialInstructions ? '📝 *Notes:* ' + d.specialInstructions + '\n\n' : ''}Thank you for choosing our store! 🙏`;
                  const phone = (d.whatsappNumber || d.customerPhone || '').replace(/\D/g, '');
                  const waUrl = phone
                    ? `https://wa.me/91${phone.replace(/^91/, '')}?text=${encodeURIComponent(msg)}`
                    : `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
                  window.open(waUrl, '_blank');
                }}
                className={`py-2.5 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 ${pssSlipData.allowWhatsApp
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN & EXCHANGE POPUP MODAL (DIRECTLY IN BILLING) */}
      {showReturnExchangeModal && selectedInvoiceForReturn && (() => {
        let implicitDiscount = 0;
        if (selectedInvoiceForReturn.subTotal && selectedInvoiceForReturn.grandTotal < selectedInvoiceForReturn.subTotal) {
          implicitDiscount = selectedInvoiceForReturn.subTotal - selectedInvoiceForReturn.grandTotal;
        } else if (selectedInvoiceForReturn.amountPaid !== undefined && selectedInvoiceForReturn.amountPaid < selectedInvoiceForReturn.grandTotal && selectedInvoiceForReturn.amountPaid > 0) {
          implicitDiscount = selectedInvoiceForReturn.grandTotal - selectedInvoiceForReturn.amountPaid;
        }

        const hasManualAdj = selectedInvoiceForReturn.billAdjustment && selectedInvoiceForReturn.billAdjustment.amount > 0;
        const hasImplicitAdj = implicitDiscount > 0;
        const totalAdjAmt = (hasManualAdj ? (selectedInvoiceForReturn.billAdjustment.operation === 'Charge' ? -selectedInvoiceForReturn.billAdjustment.amount : selectedInvoiceForReturn.billAdjustment.amount) : 0) + implicitDiscount;

        return (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-50 border border-slate-300 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">

              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                    {returnActionType === 'return' ? <RotateCcw className="w-4 h-4 text-rose-400" /> : <RefreshCw className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
                      <span>{returnActionType === 'return' ? 'Process Item Return' : 'Process Item Exchange'}</span>
                      <span className="text-[11px] bg-slate-800 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded font-mono font-bold">
                        {selectedInvoiceForReturn.invoiceNo}
                      </span>
                    </h3>
                    <p className="text-[10.5px] text-slate-400">
                      Customer: <strong className="text-white">{selectedInvoiceForReturn.customerName}</strong> ({selectedInvoiceForReturn.customerPhone || 'Walk-in'}) • Total: <strong className="text-emerald-400">₹{(selectedInvoiceForReturn.grandTotal || 0).toLocaleString()}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setReturnActionType('return')}
                      className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${returnActionType === 'return' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Return
                    </button>
                    <button
                      type="button"
                      onClick={() => setReturnActionType('exchange')}
                      className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${returnActionType === 'exchange' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Exchange
                    </button>
                  </div>

                  <button
                    onClick={() => setShowReturnExchangeModal(false)}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">

                  {/* Left Column: Bill Details */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 md:col-span-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                      Original Bill Info
                    </h4>
                    <div className="space-y-2 text-xs font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Invoice No:</span>
                        <span className="font-mono font-bold text-indigo-600">{selectedInvoiceForReturn.invoiceNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Customer:</span>
                        <span className="font-bold text-slate-800">{selectedInvoiceForReturn.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mobile:</span>
                        <span className="font-mono text-slate-700">{selectedInvoiceForReturn.customerPhone || 'Walk-in'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date:</span>
                        <span className="font-mono text-slate-700">
                          {selectedInvoiceForReturn.date ? new Date(selectedInvoiceForReturn.date).toLocaleDateString('en-IN') : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Grand Total:</span>
                        <span className="font-mono font-bold text-slate-900">₹{(selectedInvoiceForReturn.grandTotal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payment:</span>
                        <span className="font-bold text-emerald-600">{selectedInvoiceForReturn.paymentMethod || 'Cash'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Workflow Panels */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 md:col-span-8 space-y-4">
                    {/* ─── RETURN PANEL WORKFLOW ─── */}
                    {returnActionType === 'return' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                            <RotateCcw className="w-4 h-4" />
                            <span>Process Item Return & Credit Refund</span>
                          </h4>
                        </div>

                        {/* Reason for Return */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Reason for Return:
                          </label>
                          <select
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-rose-500"
                          >
                            <option value="">None / Optional (Fast Checkout)</option>
                            <option value="Defective / Damaged">Defective / Damaged Garment</option>
                            <option value="Wrong Size / Fit Issue">Wrong Size / Fit Issue</option>
                            <option value="Customer Changed Mind">Customer Changed Mind</option>
                            <option value="Quality Dissatisfaction">Quality Dissatisfaction</option>
                            <option value="Other">Other (Specify Custom Text)</option>
                          </select>
                          {returnReason === "Other" && (
                            <input
                              type="text"
                              value={returnCustomReason}
                              onChange={(e) => setReturnCustomReason(e.target.value)}
                              placeholder="Enter specific return reason details..."
                              className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                            />
                          )}
                        </div>

                        {/* Select Items to Return */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            Select Items to Return:
                          </label>
                          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-60 overflow-y-auto space-y-2">
                            {selectedInvoiceForReturn.items.map((item, idx) => {
                              const targetId = item.unitId || `${item.productId || item.id}-${idx}`;
                              const isChecked = returnedItemIds.includes(targetId);
                              return (
                                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (!isChecked && (item.hasAlteration || !!item.alterationRecord || item.hasPSSM || !!item.pssmRecord || item.pssmNo)) {
                                          const isPSS = !!(item.hasPSSM || item.pssmRecord || item.pssmNo);
                                          const pssStatus = (item.pssmItemStatus || item.pssmRecord?.status || 'IN PROGRESS').replace(/_/g, ' ');
                                          const serviceDone = item.pssmServiceType || (Array.isArray(item.pssmAlterationDetails) && item.pssmAlterationDetails.length > 0 ? item.pssmAlterationDetails.join(', ') : '') || 'Alteration';
                                          setReturnWarning({
                                            show: true,
                                            title: isPSS ? `PSSM Service (${serviceDone}) Detected` : "Alteration Detected",
                                            message: isPSS
                                              ? `This garment had "${serviceDone}" service performed under PSS docket ${item.pssmNo || item.pssmRecord?.pssmNo || ''}. Current status: [${pssStatus}]. Tailor: ${item.pssmTailorName || item.pssmRecord?.tailorName || 'Assigned'}. Garments with services require manager authorization before processing returns.`
                                              : "This item has been previously altered. By default, altered garments cannot be returned. Please consult the store owner for approval before proceeding."
                                          });
                                          if (onAddNotification) {
                                            onAddNotification(
                                              isPSS ? `PSSM Service: ${serviceDone}` : "Alteration Detected",
                                              `Item ${item.name} has service [${serviceDone}] (Status: ${pssStatus}).`,
                                              "warning"
                                            );
                                          }
                                        }
                                        const targetId = item.unitId || `${item.productId || item.id}-${idx}`;
                                        setReturnedItemIds((prev) =>
                                          isChecked ? prev.filter((id) => id !== targetId) : [...prev, targetId]
                                        );
                                      }}
                                      className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                                    />
                                    <div>
                                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <span>{item.name}</span>
                                        {item.isReturned && (
                                          <span className="bg-rose-100 text-rose-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                            RETURNED
                                          </span>
                                        )}
                                        {item.isExchanged && (
                                          <span className="bg-indigo-100 text-indigo-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                            EXCHANGED
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-mono">
                                        Size: {item.size || 'M'} | Color: {item.color || 'Std'} | Qty: {item.quantity}
                                      </p>
                                      {!!(item.hasAlteration || item.alterationRecord) && (
                                        <div className="mt-1.5 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-lg text-[10px] font-mono text-amber-900 flex items-center gap-1.5">
                                          <Scissors className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                          <span>
                                            <strong>Alteration:</strong> {item.alterationRecord?.garmentType || 'Custom'} fit | Tailor: {item.alterationRecord?.tailorName || item.workerName || 'Master Tailor'} | Delivery: {item.alterationRecord?.deliveryDate ? new Date(item.alterationRecord.deliveryDate).toLocaleDateString('en-IN') : 'Scheduled'}
                                          </span>
                                        </div>
                                      )}
                                      {!!(item.hasPSSM || item.pssmRecord || item.pssmNo) && (
                                        <div className="mt-1.5 bg-purple-50 border border-purple-200 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-purple-900 flex flex-col gap-1 shadow-2xs">
                                          <div className="flex items-center justify-between gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                              <Scissors className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                              <span>
                                                <strong className="text-purple-950">Service Done:</strong>{' '}
                                                <span className="bg-purple-200/90 text-purple-900 font-black px-1.5 py-0.5 rounded text-[9.5px]">
                                                  {item.pssmServiceType || 'Alteration'}
                                                </span>
                                              </span>
                                            </div>
                                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${(item.pssmItemStatus || item.pssmRecord?.status) === 'COLLECTED' || (item.pssmItemStatus || item.pssmRecord?.status) === 'CLOSED'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : (item.pssmItemStatus || item.pssmRecord?.status) === 'READY'
                                                  ? 'bg-blue-100 text-blue-800 font-bold ring-1 ring-blue-400'
                                                  : 'bg-amber-100 text-amber-800'
                                              }`}>
                                              {(item.pssmItemStatus || item.pssmRecord?.status || 'IN PROGRESS').replace(/_/g, ' ')}
                                            </span>
                                          </div>
                                          <div className="text-[8.5px] text-slate-600 flex items-center justify-between">
                                            <span>Docket: <strong>{item.pssmNo || item.pssmRecord?.pssmNo || 'PSSM'}</strong> • Tailor: {item.pssmTailorName || item.pssmRecord?.tailorName || 'Assigned Staff'}</span>
                                            {Array.isArray(item.pssmAlterationDetails) && item.pssmAlterationDetails.length > 1 && (
                                              <span className="italic text-purple-700">Details: {item.pssmAlterationDetails.join(', ')}</span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold font-mono text-slate-800">
                                    ₹{(item.totalPrice || item.price * item.quantity).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {(hasManualAdj || hasImplicitAdj) && (
                          <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 flex items-start gap-2.5 animate-fade-in mb-3">
                            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-orange-800 font-bold text-xs block">Manual Bill Adjustment / Short Pay Applied</span>
                              <span className="text-orange-600 text-[10.5px] font-medium leading-tight block mt-0.5">
                                This bill had a net adjustment of -₹{totalAdjAmt}. The estimated refund amount is proportionally adjusted downwards.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Refund Estimate */}
                        <div className="flex justify-between items-center bg-rose-50 p-3.5 rounded-xl border border-rose-200">
                          <span className="text-xs font-bold text-rose-900">Estimated Refund Amount:</span>
                          <span className="font-mono font-black text-rose-600 text-base">
                            ₹{(() => {
                              let rAmt = selectedInvoiceForReturn.items
                                .filter((item, idx) => returnedItemIds.includes(item.unitId || `${item.productId || item.id}-${idx}`))
                                .reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0);
                              if (totalAdjAmt > 0) {
                                const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * i.quantity)), 0) || 1;
                                const adjustmentRatio = totalAdjAmt / totalItemsPrice;
                                const proportionalAdjustment = rAmt * adjustmentRatio;
                                rAmt -= proportionalAdjustment;
                                rAmt = Math.floor(rAmt);
                              } else if (hasManualAdj && selectedInvoiceForReturn.billAdjustment.operation === 'Charge') {
                                const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * i.quantity)), 0) || 1;
                                const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
                                const proportionalAdjustment = rAmt * adjustmentRatio;
                                rAmt += proportionalAdjustment;
                                rAmt = Math.floor(rAmt);
                              }
                              return rAmt.toLocaleString();
                            })()}
                          </span>
                        </div>

                        {/* Advance / Wallet Logic */}
                        <div className="flex flex-col gap-3 mt-4">
                          <label className="text-xs font-bold text-slate-700 uppercase">Select Refund Destination:</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div
                              onClick={() => setReturnRefundMode('DIRECT_REFUND')}
                              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${returnRefundMode === 'DIRECT_REFUND' ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                            >
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${returnRefundMode === 'DIRECT_REFUND' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                {returnRefundMode === 'DIRECT_REFUND' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                              <div>
                                <p className={`text-sm font-bold ${returnRefundMode === 'DIRECT_REFUND' ? 'text-indigo-900' : 'text-slate-700'}`}>Refund to Customer</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Give money back directly</p>
                              </div>
                            </div>

                            <div
                              onClick={() => setReturnRefundMode('ADD_TO_ADVANCE')}
                              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${returnRefundMode === 'ADD_TO_ADVANCE' ? 'bg-amber-50 border-amber-500 shadow-sm' : 'bg-white border-slate-200 hover:border-amber-300'}`}
                            >
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${returnRefundMode === 'ADD_TO_ADVANCE' ? 'border-amber-600 bg-amber-600' : 'border-slate-300'}`}>
                                {returnRefundMode === 'ADD_TO_ADVANCE' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                              <div>
                                <p className={`text-sm font-bold ${returnRefundMode === 'ADD_TO_ADVANCE' ? 'text-amber-900' : 'text-slate-700'}`}>Save to Wallet</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Keep as advance for future</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mandatory Approval Checkbox */}

                        <label className="flex items-center gap-2.5 bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-900 text-xs font-semibold cursor-pointer mt-4">
                          <input
                            type="checkbox"
                            checked={returnApprovedCheckbox}
                            onChange={(e) => setReturnApprovedCheckbox(e.target.checked)}
                            className="w-4 h-4 text-rose-600 rounded border-amber-300 focus:ring-rose-500 cursor-pointer shrink-0"
                          />
                          <span>I approve this return request & confirm physical garment condition has been verified.</span>
                        </label>

                        <button
                          type="button"
                          onClick={async () => {
                            if (isProcessingReturn) return;
                            setIsProcessingReturn(true);
                            try {
                              const finalReason = returnReason === "Other" ? returnCustomReason : returnReason;
                              const returnedItems = selectedInvoiceForReturn.items.filter((item, idx) => returnedItemIds.includes(item.unitId || `${item.productId || item.id}-${idx}`));
                              let refundAmt = returnedItems.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0);

                              if (totalAdjAmt > 0) {
                                const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * i.quantity)), 0) || 1;
                                const adjustmentRatio = totalAdjAmt / totalItemsPrice;
                                const proportionalAdjustment = refundAmt * adjustmentRatio;
                                refundAmt -= proportionalAdjustment;
                                refundAmt = Math.floor(refundAmt);
                              } else if (hasManualAdj && selectedInvoiceForReturn.billAdjustment.operation === 'Charge') {
                                const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * i.quantity)), 0) || 1;
                                const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
                                const proportionalAdjustment = refundAmt * adjustmentRatio;
                                refundAmt += proportionalAdjustment;
                                refundAmt = Math.floor(refundAmt);
                              }

                              const updatedItems = selectedInvoiceForReturn.items.map((item, idx) => {
                                if (returnedItemIds.includes(item.unitId || `${item.productId || item.id}-${idx}`)) {
                                  return {
                                    ...item,
                                    isReturned: true,
                                    returnReason: finalReason,
                                    returnedAt: new Date().toISOString()
                                  };
                                }
                                return item;
                              });

                              const allRet = updatedItems.every(i => i.isReturned);
                              const updatedInvoice = {
                                ...selectedInvoiceForReturn,
                                hasReturn: true,
                                returnedAmount: (selectedInvoiceForReturn.returnedAmount || 0) + refundAmt,
                                status: allRet ? 'Returned' : 'Partially Returned',
                                items: updatedItems
                              };

                              let finalCustomerId = selectedInvoiceForReturn.customer?._id || selectedInvoiceForReturn.customer || selectedInvoiceForReturn.customerId;
                              if (finalCustomerId === "c-walkin") finalCustomerId = null;

                              if (returnRefundMode === 'ADD_TO_ADVANCE' && !finalCustomerId) {
                                setShowReturnCustomerModal(true);
                                return;
                              }

                              // Call Backend API to update MongoDB invoice, inventory & customer ledger
                              try {
                                const token = localStorage.getItem("token");
                                const invId = selectedInvoiceForReturn._id || selectedInvoiceForReturn.id || selectedInvoiceForReturn.invoiceNo;
                                const returnItemsPayload = returnedItems.map(item => {
                                  let itemPrice = item.totalPrice || ((item.sellingPrice || item.price || 0) * (item.quantity || 1));

                                  // Adjust for proportional short-pay/discounts if any
                                  if (selectedInvoiceForReturn.billAdjustment) {
                                    const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, it) => s + (it.totalPrice || ((it.sellingPrice || it.price || 0) * it.quantity)), 0) || 1;
                                    const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
                                    if (selectedInvoiceForReturn.billAdjustment.operation === 'Discount') {
                                      itemPrice -= (itemPrice * adjustmentRatio);
                                    } else {
                                      itemPrice += (itemPrice * adjustmentRatio);
                                    }
                                  }
                                  return {
                                    inventoryPieceId: item?.inventoryPieceId,
                                    barcode: item?.barcode || item?.uniqueCode || item?.designNo || item?.itemCode || '',
                                    refundRate: Math.floor(itemPrice),
                                    condition: 'RESELLABLE'
                                  };
                                });

                                console.log("DEBUG PAYLOAD - Items:", JSON.stringify(returnItemsPayload, null, 2));
                                console.log("DEBUG PAYLOAD - Invoice:", JSON.stringify(selectedInvoiceForReturn, null, 2));

                                await api.post(`/returns`, {
                                  saleBillId: invId,
                                  saleBillNo: selectedInvoiceForReturn.invoiceNo,
                                  customerId: finalCustomerId,
                                  refundMode: returnRefundMode,
                                  reason: finalReason,
                                  items: returnItemsPayload,
                                  forceApprove: true
                                });
                              } catch (apiErr) {
                                console.warn("Backend return endpoint call error:", apiErr.message);
                                if (onAddNotification) onAddNotification("Return Failed", apiErr.response?.data?.message || apiErr.message || "Failed to process return in backend", "danger");
                                return; // Stop execution to prevent desync
                              }

                              // Update local invoices list so Invoice History reflects returned status immediately
                              setInvoiceList(prev => prev.map(inv => (inv.invoiceNo === updatedInvoice.invoiceNo || inv._id === updatedInvoice._id) ? updatedInvoice : inv));

                              if (invoices) {
                                const idx = invoices.findIndex(i => i.invoiceNo === selectedInvoiceForReturn.invoiceNo || i._id === selectedInvoiceForReturn._id);
                                if (idx !== -1) invoices[idx] = updatedInvoice;
                              }

                              if (selectedInvoiceForReturn.customerId && onUpdateCustomerBalance) {
                                onUpdateCustomerBalance(selectedInvoiceForReturn.customerId, -refundAmt);
                              }

                              if (onAddNotification) {
                                onAddNotification("Return Approved", `Return of ₹${refundAmt.toLocaleString()} approved for ${selectedInvoiceForReturn.customerName}. Inventory & Financials recalculated.`, "success");
                              }

                              // Auto-clear data and reset selection
                              if (loadedOriginalInvoice?.invoiceNo === selectedInvoiceForReturn.invoiceNo || loadedOriginalInvoice?._id === selectedInvoiceForReturn._id) {
                                setCart([]);
                                setLoadedOriginalInvoice(null);
                                setCustomerForm({ phone: '', name: '', customerId: '', gstin: '', lf: '' });
                                setSelectedCustomerId('');
                                setCustomerSearchQuery('');
                              }

                              setSelectedInvoiceForReturn(null);
                              setReturnedItemIds([]);
                              setReturnApprovedCheckbox(false);
                              setReturnSearchQuery("");
                              setReturnReason("Defective / Damaged");
                              setReturnCustomReason("");
                            } finally {
                              setIsProcessingReturn(false);
                            }
                          }}
                          disabled={isProcessingReturn || (!returnApprovedCheckbox || returnedItemIds.length === 0)}
                          className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${returnApprovedCheckbox && returnedItemIds.length > 0 && !isProcessingReturn ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                          {isProcessingReturn ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing Return...
                            </>
                          ) : (
                            "Approve Return & Credit Customer Wallet"
                          )}
                        </button>
                      </div>
                    )}

                    {/* ─── EXCHANGE PANEL WORKFLOW ─── */}
                    {returnActionType === 'exchange' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                            <RefreshCw className="w-4 h-4" />
                            <span>Process Product Exchange & Issue Docket</span>
                          </h4>
                        </div>

                        {/* Reason for Exchange */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Reason for Exchange:
                          </label>
                          <select
                            value={exchangeReason}
                            onChange={(e) => setExchangeReason(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Size / Fit Swap">Size / Fit Swap</option>
                            <option value="Color Swap">Color / Hue Swap</option>
                            <option value="Defective Replacement">Defective Item Replacement</option>
                            <option value="Product Upgrade">Product Upgrade / Variant Change</option>
                            <option value="Customer Preference">Customer Preference Change</option>
                          </select>
                        </div>

                        {/* Step A: Choose Item to Return */}
                        <div className="mb-4">
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            1. Select Items from Invoice to Return / Swap Out:
                          </label>
                          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-60 overflow-y-auto space-y-2">
                            {selectedInvoiceForReturn.items.map((item, idx) => {
                              const targetId = item.unitId || `${item.productId || item.id}-${idx}`;
                              const isChecked = returnedItemIds.includes(targetId);
                              return (
                                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (!isChecked && (item.hasAlteration || !!item.alterationRecord || item.hasPSSM || !!item.pssmRecord || item.pssmNo)) {
                                          const isPSS = !!(item.hasPSSM || item.pssmRecord || item.pssmNo);
                                          const pssStatus = (item.pssmItemStatus || item.pssmRecord?.status || 'IN PROGRESS').replace(/_/g, ' ');
                                          const serviceDone = item.pssmServiceType || (Array.isArray(item.pssmAlterationDetails) && item.pssmAlterationDetails.length > 0 ? item.pssmAlterationDetails.join(', ') : '') || 'Alteration';
                                          setReturnWarning({
                                            show: true,
                                            title: isPSS ? `PSSM Service (${serviceDone}) Detected` : "Alteration Detected",
                                            message: isPSS
                                              ? `This garment had "${serviceDone}" service performed under PSS docket ${item.pssmNo || item.pssmRecord?.pssmNo || ''}. Current status: [${pssStatus}]. Tailor: ${item.pssmTailorName || item.pssmRecord?.tailorName || 'Assigned'}. Garments with services require manager authorization before processing exchanges.`
                                              : "This item has been previously altered. By default, altered garments cannot be exchanged. Please consult the store owner for approval before proceeding."
                                          });
                                          if (onAddNotification) {
                                            onAddNotification(
                                              isPSS ? `PSSM Service: ${serviceDone}` : "Alteration Detected",
                                              `Item ${item.name} has service [${serviceDone}] (Status: ${pssStatus}).`,
                                              "warning"
                                            );
                                          }
                                        }
                                        setReturnedItemIds((prev) =>
                                          isChecked ? prev.filter((id) => id !== targetId) : [...prev, targetId]
                                        );
                                      }}
                                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <div>
                                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <span>{item.name}</span>
                                        {item.isExchanged && (
                                          <span className="bg-indigo-100 text-indigo-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                            EXCHANGED
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-mono">
                                        Size: {item.size || 'M'} / Color: {item.color || 'Std'}
                                      </p>
                                      {!!(item.hasAlteration || item.alterationRecord) && (
                                        <div className="mt-1.5 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-lg text-[10px] font-mono text-amber-900 flex items-center gap-1.5">
                                          <Scissors className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                          <span>
                                            <strong>Alteration:</strong> {item.alterationRecord?.garmentType || 'Custom'} fit | Tailor: {item.alterationRecord?.tailorName || item.workerName || 'Master Tailor'} | Delivery: {item.alterationRecord?.deliveryDate ? new Date(item.alterationRecord.deliveryDate).toLocaleDateString('en-IN') : 'Scheduled'}
                                          </span>
                                        </div>
                                      )}
                                      {!!(item.hasPSSM || item.pssmRecord || item.pssmNo) && (
                                        <div className="mt-1.5 bg-purple-50 border border-purple-200 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-purple-900 flex flex-col gap-1 shadow-2xs">
                                          <div className="flex items-center justify-between gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                              <Scissors className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                              <span>
                                                <strong className="text-purple-950">Service Done:</strong>{' '}
                                                <span className="bg-purple-200/90 text-purple-900 font-black px-1.5 py-0.5 rounded text-[9.5px]">
                                                  {item.pssmServiceType || 'Alteration'}
                                                </span>
                                              </span>
                                            </div>
                                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${(item.pssmItemStatus || item.pssmRecord?.status) === 'COLLECTED' || (item.pssmItemStatus || item.pssmRecord?.status) === 'CLOSED'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : (item.pssmItemStatus || item.pssmRecord?.status) === 'READY'
                                                  ? 'bg-blue-100 text-blue-800 font-bold ring-1 ring-blue-400'
                                                  : 'bg-amber-100 text-amber-800'
                                              }`}>
                                              {(item.pssmItemStatus || item.pssmRecord?.status || 'IN PROGRESS').replace(/_/g, ' ')}
                                            </span>
                                          </div>
                                          <div className="text-[8.5px] text-slate-600 flex items-center justify-between">
                                            <span>Docket: <strong>{item.pssmNo || item.pssmRecord?.pssmNo || 'PSSM'}</strong> • Tailor: {item.pssmTailorName || item.pssmRecord?.tailorName || 'Assigned Staff'}</span>
                                            {Array.isArray(item.pssmAlterationDetails) && item.pssmAlterationDetails.length > 1 && (
                                              <span className="italic text-purple-700">Details: {item.pssmAlterationDetails.join(', ')}</span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <span className="font-mono font-bold text-slate-600 text-xs">
                                    ₹{(item.totalPrice || item.price * item.quantity).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Step B: Search/Enter Product ID or Barcode for New Product */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            2. Search or Enter Product ID / Barcode for New Exchanged Item:
                          </label>
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                            <input
                              type="text"
                              value={exchangeNewSearchQuery}
                              onChange={(e) => {
                                setExchangeNewSearchQuery(e.target.value);
                                const q = e.target.value.trim().toLowerCase();
                                const match = products.find(p =>
                                  (p._id && p._id.toLowerCase() === q) ||
                                  (p.id && p.id.toLowerCase() === q) ||
                                  (p.barcode && p.barcode.toLowerCase() === q) ||
                                  (p.productCode && p.productCode.toLowerCase() === q) ||
                                  (p.name && p.name.toLowerCase() === q)
                                );
                                if (match) {
                                  if (!exchangeCart.find(i => (i.id || i._id) === (match.id || match._id))) {
                                    setExchangeCart([...exchangeCart, match]);
                                  }
                                  setExchangeNewSearchQuery("");
                                }
                              }}
                              placeholder="Enter product ID, barcode (e.g. BAR-001) or product name..."
                              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Matching Product Dropdown */}
                          {exchangeNewSearchQuery && (
                            <div className="bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto divide-y divide-slate-100 text-xs font-sans">
                              {products
                                .filter(p =>
                                  (p.name || "").toLowerCase().includes(exchangeNewSearchQuery.toLowerCase()) ||
                                  (p.productCode || p.barcode || p.sku || p.id || "").toLowerCase().includes(exchangeNewSearchQuery.toLowerCase())
                                )
                                .map(p => (
                                  <div
                                    key={p._id || p.id}
                                    onClick={() => {
                                      if (!exchangeCart.find(i => (i.id || i._id) === (p.id || p._id))) {
                                        setExchangeCart([...exchangeCart, p]);
                                      }
                                      setExchangeNewSearchQuery("");
                                    }}
                                    className="p-2.5 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors"
                                  >
                                    <div>
                                      <p className="font-bold text-slate-800">{p.name}</p>
                                      <p className="text-[10px] text-slate-400 font-mono">
                                        ID/Barcode: {p.productCode || p.barcode || p.id} | Size: {p.size || 'M'} | Stock: {p.stock || p.stockQuantity || 10}
                                      </p>
                                    </div>
                                    <span className="font-mono font-bold text-indigo-600">
                                      ₹{(p.sellingPrice || p.price || 0).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Selected New Products Cart */}
                        {exchangeCart.length > 0 && (
                          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 flex flex-col gap-2 text-xs">
                            <p className="text-[10px] font-bold uppercase text-indigo-500">Selected New Exchanged Items:</p>
                            {exchangeCart.map((cartItem, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-indigo-100 shadow-sm">
                                <div>
                                  <p className="font-extrabold text-slate-900">{cartItem.name}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    SKU/ID: {cartItem.productCode || cartItem.barcode || cartItem.id} | Size: {cartItem.size || 'M'} / {cartItem.color || 'Std'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-black text-indigo-700 text-sm">
                                    ₹{(cartItem.sellingPrice || cartItem.price || 0).toLocaleString()}
                                  </span>
                                  <button
                                    onClick={() => setExchangeCart(exchangeCart.filter(i => (i.id || i._id) !== (cartItem.id || cartItem._id)))}
                                    className="text-rose-500 hover:text-rose-700 p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Price Difference Summary */}
                        {(() => {
                          const returnedItems = selectedInvoiceForReturn.items.filter((item, idx) => returnedItemIds.includes(item.unitId || `${item.productId || item.id}-${idx}`));
                          if (returnedItems.length === 0 || exchangeCart.length === 0) return null;

                          let oldPrice = returnedItems.reduce((sum, item) => sum + (item.totalPrice || ((item.sellingPrice || item.price || 0) * (item.quantity || 1))), 0);

                          if (totalAdjAmt > 0) {
                            const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * (i.quantity || 1))), 0) || 1;
                            const adjustmentRatio = totalAdjAmt / totalItemsPrice;
                            const proportionalAdjustment = oldPrice * adjustmentRatio;
                            oldPrice -= proportionalAdjustment;
                            oldPrice = Math.floor(oldPrice);
                          } else if (hasManualAdj && selectedInvoiceForReturn.billAdjustment.operation === 'Charge') {
                            const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * (i.quantity || 1))), 0) || 1;
                            const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
                            const proportionalAdjustment = oldPrice * adjustmentRatio;
                            oldPrice += proportionalAdjustment;
                            oldPrice = Math.floor(oldPrice);
                          }

                          const newPrice = exchangeCart.reduce((sum, item) => sum + (item.sellingPrice || item.price || 0), 0);
                          const priceDiff = newPrice - oldPrice;

                          return (
                            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs font-mono">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Original Item Value:</span>
                                <span>- ₹{oldPrice.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">New Item Value:</span>
                                <span>+ ₹{newPrice.toLocaleString()}</span>
                              </div>
                              <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-sm">
                                <span className="font-sans">Net Adjustment:</span>
                                <span className={priceDiff > 0 ? 'text-amber-400' : priceDiff < 0 ? 'text-emerald-400' : 'text-white'}>
                                  {priceDiff > 0 ? `+ ₹${priceDiff.toLocaleString()} (Payable)` : priceDiff < 0 ? `- ₹${Math.abs(priceDiff).toLocaleString()} (Refund)` : '₹0 (Even Swap)'}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        <button
                          type="button"
                          disabled={isProcessingReturn || returnedItemIds.length === 0 || exchangeCart.length === 0}
                          onClick={async () => {
                            if (isProcessingReturn) return;
                            setIsProcessingReturn(true);
                            try {
                              const returnedItems = selectedInvoiceForReturn.items.filter((item, idx) => returnedItemIds.includes(item.unitId || `${item.productId || item.id}-${idx}`));
                              if (returnedItems.length === 0 || exchangeCart.length === 0) return;

                              let oldPrice = returnedItems.reduce((sum, item) => sum + (item.totalPrice || ((item.sellingPrice || item.price || 0) * (item.quantity || 1))), 0);

                              if (totalAdjAmt > 0) {
                                const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * (i.quantity || 1))), 0) || 1;
                                const adjustmentRatio = totalAdjAmt / totalItemsPrice;
                                const proportionalAdjustment = oldPrice * adjustmentRatio;
                                oldPrice -= proportionalAdjustment;
                                oldPrice = Math.floor(oldPrice);
                              } else if (hasManualAdj && selectedInvoiceForReturn.billAdjustment.operation === 'Charge') {
                                const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || ((i.sellingPrice || i.price || 0) * (i.quantity || 1))), 0) || 1;
                                const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
                                const proportionalAdjustment = oldPrice * adjustmentRatio;
                                oldPrice += proportionalAdjustment;
                                oldPrice = Math.floor(oldPrice);
                              }

                              const newPrice = exchangeCart.reduce((sum, item) => sum + (item.sellingPrice || item.price || 0), 0);
                              const priceDiff = newPrice - oldPrice;

                              const docket = {
                                docketNo: `EXCH-${Date.now().toString().slice(-6)}`,
                                originalInvoiceNo: selectedInvoiceForReturn.invoiceNo,
                                customerName: selectedInvoiceForReturn.customerName,
                                customerPhone: selectedInvoiceForReturn.customerPhone,
                                reason: exchangeReason,
                                oldItem: {
                                  name: returnedItems.map(i => i.name).join(', '),
                                  size: 'Mixed',
                                  color: 'Mixed',
                                  price: oldPrice
                                },
                                newItem: {
                                  name: exchangeCart.map(i => i.name).join(', '),
                                  sku: exchangeCart.map(i => i.sku || i.productCode || i.id).join(', '),
                                  size: 'Mixed',
                                  color: 'Mixed',
                                  price: newPrice
                                },
                                priceDiff,
                                cashierName: currentUser ? currentUser.name : "Store Cashier",
                                createdAt: new Date().toISOString()
                              };

                              const updatedItems = selectedInvoiceForReturn.items.map((item, idx) => {
                                const targetId = item.unitId || `${item.productId || item.id}-${idx}`;
                                if (returnedItemIds.includes(targetId)) {
                                  return {
                                    ...item,
                                    isExchanged: true,
                                    exchangedFor: exchangeCart.map(i => i.name).join(', '),
                                    exchangeReason
                                  };
                                }
                                return item;
                              });

                              const allEx = updatedItems.every(i => i.isExchanged);
                              const updatedInvoice = {
                                ...selectedInvoiceForReturn,
                                hasExchange: true,
                                exchangeSlip: docket,
                                status: allEx ? 'Exchanged' : 'Partially Exchanged',
                                items: updatedItems
                              };

                              // Call Backend API to process exchange in MongoDB
                              try {
                                const token = localStorage.getItem("token");
                                const invId = selectedInvoiceForReturn._id || selectedInvoiceForReturn.id || selectedInvoiceForReturn.invoiceNo;
                                await api.post(`/exchanges`, {
                                  originalBillId: invId,
                                  originalBillNo: selectedInvoiceForReturn.invoiceNo,
                                  customerId: selectedInvoiceForReturn.customer?._id || selectedInvoiceForReturn.customer || selectedInvoiceForReturn.customerId,
                                  returnedBarcodes: returnedItems.map(i => i.barcode || i.designNo || i.itemCode || ''),
                                  newBarcodes: exchangeCart.map(i => i.barcode || i.productCode || i.sku || i.id || ''),
                                  returnedValue: oldPrice,
                                  newItemValue: newPrice,
                                  remarks: exchangeReason,
                                  forceApprove: true
                                });
                              } catch (apiErr) {
                                console.warn("Backend exchange endpoint call error:", apiErr.message);
                                if (onAddNotification) onAddNotification("Exchange Failed", apiErr.response?.data?.message || apiErr.message || "Failed to process exchange in backend", "danger");
                                return; // Stop execution to prevent desync
                              }

                              // Update local invoices list so Invoice History reflects exchanged status immediately
                              setInvoiceList(prev => prev.map(inv => (inv.invoiceNo === updatedInvoice.invoiceNo || inv._id === updatedInvoice._id) ? updatedInvoice : inv));

                              if (invoices) {
                                const idx = invoices.findIndex(i => i.invoiceNo === selectedInvoiceForReturn.invoiceNo || i._id === selectedInvoiceForReturn._id);
                                if (idx !== -1) invoices[idx] = updatedInvoice;
                              }

                              setCompletedExchangeSlip(docket);
                              setShowExchangeSlipModal(true);

                              if (onAddNotification) {
                                onAddNotification("Exchange Completed", `Exchange docket ${docket.docketNo} issued successfully. Stocks & Financials recalculated.`, "success");
                              }

                              // Auto-clear search & selection data after completing exchange
                              setSelectedInvoiceForReturn(null);
                              setExchangeCart([]);
                              setExchangeNewSearchQuery("");
                              setReturnSearchQuery("");
                              setReturnedItemIds([]);
                            } finally {
                              setIsProcessingReturn(false);
                            }
                          }}
                          className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${exchangeCart.length > 0 && returnedItemIds.length > 0 && !isProcessingReturn ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                          {isProcessingReturn ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing Exchange...
                            </>
                          ) : (
                            "Confirm Exchange & Deduct Difference"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* BILL ADJUSTMENT MODAL */}
      {showAdjustmentModal && (() => {
        const maxAllowedDiscountWithoutApproval = (subTotal || 0) * 0.05;
        const enteredVal = parseFloat(billAdjustment.value) || 0;

        const handleApply = () => {
          if (billAdjustment.operation === 'Discount' && billAdjustment.amount > (subTotal || 0)) {
            if (onAddNotification) onAddNotification("Adjustment Error", "Negative adjustment cannot exceed the bill amount.", "danger");
            return;
          }

          // Require Owner Approval if Discount > 5% (both for Percentage > 5% and Amount > 5% of Bill Amount)
          const requiresApproval = billAdjustment.operation === 'Discount' && !billAdjustment.isApproved && (
            billAdjustment.type === 'Percentage'
              ? enteredVal > 5
              : billAdjustment.amount > maxAllowedDiscountWithoutApproval
          );

          if (requiresApproval) {
            setShowOwnerApprovalModal(true);
            return;
          }
          setShowAdjustmentModal(false);
        };

        return (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
            onKeyDown={(e) => {
              if (showOwnerApprovalModal) return; // Let inner modal handle
              if (e.key === 'Escape') {
                setBillAdjustment({ type: 'Amount', operation: 'Discount', value: '', amount: 0, reason: '', isApproved: false });
                setShowAdjustmentModal(false);
              } else if (e.key === 'Enter') {
                // Only apply if the target isn't a textarea (to allow multiline reasons)
                if (e.target.tagName !== 'TEXTAREA') {
                  e.preventDefault();
                  handleApply();
                }
              }
            }}
          >
            <div className="bg-[#f0f0f0] w-[450px] flex flex-col shadow-2xl font-sans border-2 border-slate-400">
              {/* Window Title Bar */}
              <div className="bg-[#005fb8] text-white px-2 py-1 flex justify-between items-center text-[12px] font-bold">
                <span>Bill Adjustment</span>
                <button className="hover:bg-red-600 px-2 rounded text-white font-bold" onClick={() => setShowAdjustmentModal(false)}>X</button>
              </div>

              <div className="p-4 flex flex-col gap-4 text-sm font-bold text-slate-700">

                <div className="flex justify-between items-center gap-2 border-b border-slate-300 pb-2">
                  <span className="text-slate-500">Original Amount:</span>
                  <span className="text-blue-600 text-lg">₹{(subTotal || 0).toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label>Type</label>
                    <select
                      className="border border-slate-400 p-1 bg-white outline-none focus:border-blue-500"
                      value={billAdjustment.type}
                      onChange={(e) => setBillAdjustment({ ...billAdjustment, type: e.target.value, amount: 0, value: '' })}
                    >
                      <option value="Amount">Amount (₹)</option>
                      <option value="Percentage">Percentage (%)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label>Operation</label>
                    <select
                      className="border border-slate-400 p-1 bg-white outline-none focus:border-blue-500"
                      value={billAdjustment.operation}
                      onChange={(e) => setBillAdjustment({ ...billAdjustment, operation: e.target.value, amount: 0, value: '' })}
                    >
                      <option value="Discount">Discount (-)</option>
                      <option value="Charge">Charge (+)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label>Adjustment Value {billAdjustment.type === 'Percentage' ? '(%)' : '(₹)'}</label>
                  <input
                    type="number"
                    autoFocus
                    placeholder="Enter value..."
                    className="border border-slate-400 p-2 text-lg font-mono outline-none focus:border-blue-500"
                    value={billAdjustment.value}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      let amt = 0;
                      if (billAdjustment.type === 'Percentage') {
                        amt = Math.floor((subTotal || 0) * (val / 100));
                      } else {
                        amt = val;
                      }
                      if (billAdjustment.operation === 'Discount' && amt > (subTotal || 0)) {
                        amt = (subTotal || 0); // Cap discount
                        if (onAddNotification) onAddNotification("Adjustment Capped", "Negative adjustment cannot exceed the bill amount.", "warning");
                      }
                      setBillAdjustment({ ...billAdjustment, value: e.target.value, amount: amt, isApproved: false }); // Reset approval if changed
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label>Reason (Optional)</label>
                  <textarea
                    rows="2"
                    className="border border-slate-400 p-1 bg-white outline-none focus:border-blue-500"
                    value={billAdjustment.reason}
                    onChange={(e) => setBillAdjustment({ ...billAdjustment, reason: e.target.value })}
                  ></textarea>
                </div>

                <div className="flex justify-between items-center gap-2 bg-slate-200 p-2 border border-slate-300">
                  <span className="text-slate-600">Adjustment Amount:</span>
                  <span className={billAdjustment.operation === 'Discount' ? "text-red-600 text-lg" : "text-emerald-600 text-lg"}>
                    {billAdjustment.operation === 'Discount' ? '-' : '+'}₹{(billAdjustment.amount || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-2 bg-yellow-100 p-2 border border-yellow-300 shadow-inner">
                  <span className="text-slate-800 text-lg">Final Bill Amount:</span>
                  <span className="text-indigo-700 text-2xl font-black">
                    ₹{Math.max(0, (subTotal || 0) + (billAdjustment.operation === 'Charge' ? billAdjustment.amount : -billAdjustment.amount)).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    className="px-4 py-2 border border-slate-400 bg-[#e1e1e1] hover:bg-white text-slate-800 shadow-sm"
                    onClick={() => {
                      setBillAdjustment({ type: 'Amount', operation: 'Discount', value: '', amount: 0, reason: '', isApproved: false });
                      setShowAdjustmentModal(false);
                    }}
                  >
                    Cancel (Esc)
                  </button>
                  <button
                    className="px-4 py-2 border border-[#005fb8] bg-[#005fb8] hover:bg-blue-700 text-white shadow-sm font-bold"
                    onClick={handleApply}
                  >
                    Apply (Enter)
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* OWNER APPROVAL MODAL */}
      {showOwnerApprovalModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60">
          <div className="bg-white p-6 shadow-2xl border-t-4 border-rose-600 w-[380px]">
            <h3 className="text-lg font-bold text-rose-700 mb-2">Owner Approval Required</h3>
            <p className="text-xs text-slate-600 mb-4">
              The manual discount exceeds the allowed 5% limit (Max: 5% / ₹{((subTotal || 0) * 0.05).toFixed(2)}). Enter Owner PIN to authorize.
            </p>
            <input
              type="password"
              autoFocus
              placeholder="Enter PIN (e.g., 1234)"
              value={ownerPin}
              onChange={(e) => setOwnerPin(e.target.value)}
              className="w-full border p-2 text-center text-xl tracking-widest outline-none focus:border-rose-500 mb-4 bg-slate-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (ownerPin === '1234') { // Mock PIN
                    setBillAdjustment({ ...billAdjustment, isApproved: true });
                    setShowOwnerApprovalModal(false);
                    setShowAdjustmentModal(false);
                    setOwnerPin("");
                    if (onAddNotification) onAddNotification("Approval Granted", "Discount approved by Owner.", "success");
                  } else {
                    if (onAddNotification) onAddNotification("Approval Denied", "Incorrect Owner PIN.", "danger");
                  }
                } else if (e.key === 'Escape') {
                  setShowOwnerApprovalModal(false);
                  setOwnerPin("");
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1.5 border border-slate-300 bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700" onClick={() => setShowOwnerApprovalModal(false)}>Cancel (Esc)</button>
              <button className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow flex items-center gap-1" onClick={() => {
                if (ownerPin === '1234') { // Mock PIN
                  setBillAdjustment({ ...billAdjustment, isApproved: true });
                  setShowOwnerApprovalModal(false);
                  setShowAdjustmentModal(false);
                  setOwnerPin("");
                  if (onAddNotification) onAddNotification("Approval Granted", "Discount approved by Owner.", "success");
                } else {
                  if (onAddNotification) onAddNotification("Approval Denied", "Incorrect Owner PIN.", "danger");
                }
              }}>Authorize (Enter)</button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM SEARCH LIST MODAL */}
      {isItemSearchModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-[#f0f0f0] w-[1250px] max-h-[92vh] flex flex-col shadow-2xl font-sans" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
            {/* Window Title Bar */}
            <div className="bg-[#005fb8] text-white px-2 py-1 flex justify-between items-center text-[12px] font-bold border-t-2 border-l-2 border-r-2 border-slate-300 cursor-move">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center text-blue-800 text-[10px]">L</div>
                <span>Item Search List [Single Selection]</span>
              </div>
              <div className="flex gap-1">
                <button className="hover:bg-white/20 px-2 rounded">_</button>
                <button className="hover:bg-white/20 px-2 rounded">[]</button>
                <button className="hover:bg-red-600 px-2 rounded text-white font-bold" onClick={() => setIsItemSearchModalOpen(false)}>X</button>
              </div>
            </div>

            {/* Top Search Controls */}
            <div className="p-2 border-b border-slate-300 bg-[#e1e1e1] flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700">Item Name</span>
              <input
                id="modalItemNameInput"
                type="text"
                className="border border-slate-400 p-1 flex-1 outline-none focus:border-blue-500 focus:bg-yellow-50 text-slate-800 font-bold"
                value={itemNameInput}
                onChange={(e) => setItemNameInput(e.target.value)}
                onKeyDown={handleItemNameKeyDown}
                placeholder="Type name here and click Search or press Enter..."
                autoFocus
              />
              <button
                onClick={() => {
                  const fakeEvent = { key: "Enter", preventDefault: () => { } };
                  handleItemNameKeyDown(fakeEvent);
                }}
                className="px-4 py-1 bg-[#005fb8] hover:bg-blue-700 text-white rounded font-bold cursor-pointer text-xs"
              >
                Search
              </button>
              <span className="font-semibold text-slate-700 ml-4">Records Limit</span>
              <input type="number" className="border border-slate-400 p-1 w-16 outline-none text-right" defaultValue={100} />
            </div>

            {/* Toolbar */}
            <div className="flex gap-1 p-1 bg-[#f0f0f0] border-b border-slate-300">
              <button className="p-1 hover:border-slate-300 border border-transparent"><Save className="w-5 h-5 text-green-700" /></button>
              <button className="p-1 hover:border-slate-300 border border-transparent"><RotateCcw className="w-5 h-5 text-blue-600" /></button>
              <button className="p-1 hover:border-slate-300 border border-transparent"><RefreshCw className="w-5 h-5 text-green-500" /></button>
              <button className="p-1 hover:border-slate-300 border border-transparent"><Upload className="w-5 h-5 text-blue-800" /></button>
              <button className="p-1 hover:border-slate-300 border border-transparent"><Printer className="w-5 h-5 text-slate-600" /></button>
              <button className="p-1 hover:border-slate-300 border border-transparent"><Copy className="w-5 h-5 text-blue-500" /></button>
              <button className="p-1 hover:border-slate-300 border border-transparent"><X className="w-5 h-5 text-red-600" onClick={() => setIsItemSearchModalOpen(false)} /></button>
              <button className="p-1 hover:border-slate-300 border border-transparent"><Grid className="w-5 h-5 text-slate-500" /></button>
            </div>

            {/* Top Cards/Summary Panel */}
            {(() => {
              const activeItem = selectedSearchItem || itemSearchResults[0] || {};
              const available = activeItem.availableStock || 0;
              const sold = activeItem.soldQuantity || 0;
              const total = available + sold;
              return (
                <div className="bg-slate-100 p-2 border-b border-slate-300 grid grid-cols-5 gap-2 text-xs font-semibold">
                  <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Design No.</div>
                    <div className="font-bold text-slate-800 mt-0.5">{activeItem.designNo || activeItem.sku || '(NIL)'}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Item Name</div>
                    <div className="font-bold text-slate-800 mt-0.5">{activeItem.name || '(NIL)'}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Total Pieces</div>
                    <div className="font-mono font-bold text-indigo-600 mt-0.5">{total}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Available</div>
                    <div className="font-mono font-bold text-emerald-600 mt-0.5">{available}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Sold</div>
                    <div className="font-mono font-bold text-amber-600 mt-0.5">{sold}</div>
                  </div>
                </div>
              );
            })()}

            {/* Split Grid & Info Panel View */}
            <div className="flex-1 flex overflow-hidden min-h-[350px]">
              {/* Left Side: Data Grid */}
              <div className="flex-1 overflow-auto bg-white border-r border-slate-300">
                <table className="w-full text-[11px] whitespace-nowrap border-collapse">
                  <thead className="bg-[#f0f0f0] sticky top-0 shadow-sm border-b border-slate-400">
                    <tr>
                      <th className="border-r border-slate-300 p-1 text-center w-10">SNO.</th>
                      <th className="border-r border-slate-300 p-1 text-left w-24">DESIGN NO.</th>
                      <th className="border-r border-slate-300 p-1 text-left w-36">ITEM NAME</th>
                      <th className="border-r border-slate-300 p-1 text-left w-32">BARCODE</th>
                      <th className="border-r border-slate-300 p-1 text-left w-24">COLOUR</th>
                      <th className="border-r border-slate-300 p-1 text-left w-20">SIZE</th>
                      <th className="border-r border-slate-300 p-1 text-right w-24">MRP</th>
                      <th className="border-r border-slate-300 p-1 text-right w-24">RATE</th>
                      <th className="border-r border-slate-300 p-1 text-center w-28">TOTAL PIECES</th>
                      <th className="border-r border-slate-300 p-1 text-center w-28">AVAILABLE STOCK</th>
                      <th className="border-r border-slate-300 p-1 text-left w-28">SOLD STATUS</th>
                      <th className="p-1 text-center w-10">INFO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemSearchResults.map((item, idx) => {
                      const isSelected = selectedSearchItem && (selectedSearchItem._id === item._id || selectedSearchItem.id === item._id);
                      const piecesTotal = (item.availableStock || 0) + (item.soldQuantity || 0);
                      return (
                        <tr
                          key={item._id || item.id || idx}
                          className={`border-b border-slate-200 cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 font-bold' : 'hover:bg-blue-50'
                            }`}
                          onClick={() => setSelectedSearchItem(item)}
                          onDoubleClick={() => {
                            handleAddProductToCart(item);
                            setItemNameInput("");
                            setIsItemSearchModalOpen(false);
                          }}
                        >
                          <td className="border-r border-slate-300 p-1 text-center">{idx + 1}</td>
                          <td className="border-r border-slate-300 p-1">{item.designNo || item.sku || 'N/A'}</td>
                          <td className="border-r border-slate-300 p-1">{item.name}</td>
                          <td className="border-r border-slate-300 p-1 font-mono">{item.barcode}</td>
                          <td className="border-r border-slate-300 p-1">{item.color || 'N/A'}</td>
                          <td className="border-r border-slate-300 p-1 text-center">{item.size || 'N/A'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono">₹{item.mrp?.toLocaleString()}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono">₹{item.sellingRate?.toLocaleString() || item.sellingPrice?.toLocaleString()}</td>
                          <td className="border-r border-slate-300 p-1 text-center font-mono text-indigo-600">{piecesTotal}</td>
                          <td className="border-r border-slate-300 p-1 text-center font-mono text-emerald-600">{item.availableStock}</td>
                          <td className="border-r border-slate-300 p-1">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${item.availableStock > 0 ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-red-50 text-red-700 font-bold'
                              }`}>
                              {item.availableStock > 0 ? 'Available' : 'Sold Out'}
                              {item.soldQuantity > 0 ? ` (${item.soldQuantity} Sold)` : ''}
                            </span>
                          </td>
                          <td className="p-1 text-center border-l border-slate-200">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSearchItem(item);
                                setInfoPanelTab('General');
                                setShowSearchItemDetailsPanel(true);
                              }}
                              className="p-1 hover:bg-slate-200 rounded text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center justify-center cursor-pointer"
                              title="View details in Right Panel"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {itemSearchResults.length === 0 && (
                      <tr>
                        <td colSpan={12} className="text-center p-8 text-slate-500 font-semibold italic">No items found matching "{itemNameInput}"</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Right Side: Information Panel */}
              {showSearchItemDetailsPanel && (
                <div className="w-[320px] bg-slate-50 flex flex-col border-l border-slate-200 overflow-y-auto p-3">
                  <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-1">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-slate-400">
                      Item Detail Options
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowSearchItemDetailsPanel(false)}
                      className="p-1 hover:bg-slate-100 hover:text-red-600 rounded text-slate-400 transition-colors cursor-pointer"
                      title="Hide Panel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(() => {
                    const activeItem = selectedSearchItem || itemSearchResults[0];
                    if (!activeItem) {
                      return (
                        <div className="text-slate-400 italic text-center py-8">
                          Select an item to view options
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {/* Tab buttons */}
                        <div className={`grid ${String(currentUser?.role || "").toLowerCase().includes('sales') ? 'grid-cols-3' : 'grid-cols-4'} gap-1 bg-slate-200 p-0.5 rounded-lg`}>
                          {[
                            { id: 'General', label: '🛈 General' },
                            { id: 'Stock', label: '📦 Stock' },
                            { id: 'Purchase', label: '🛒 Purchase' },
                            { id: 'Sales', label: '📈 Sales' }
                          ].filter(t => {
                            if (t.id === 'Sales' && String(currentUser?.role || "").toLowerCase().includes('sales')) return false;
                            return true;
                          }).map(t => (
                            <button
                              key={t.id}
                              onClick={() => {
                                if (t.id === 'Purchase' && !isPurchaseTabUnlocked) {
                                  setInfoPanelItem(activeItem);
                                  setPurchaseAuthOwnerId('');
                                  setPurchaseAuthPassword('');
                                  setIsPurchaseAuthModalOpen(true);
                                } else {
                                  setInfoPanelTab(t.id);
                                }
                              }}
                              className={`py-1.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${infoPanelTab === t.id
                                ? 'bg-white text-slate-800 shadow-xs'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5 shadow-2xs">
                          {infoPanelTab === 'General' && (
                            <div className="space-y-2 text-slate-700">
                              <div className="text-[10px] uppercase font-bold text-slate-405 border-b border-slate-100 pb-1 mb-2">🛈 General Details</div>

                              {/* Product Image Section */}
                              <div className="flex justify-center border border-slate-200 rounded p-2 bg-slate-50 mb-3">
                                {activeItem.imageUrl ? (
                                  <img src={activeItem.imageUrl} alt="Product" className="max-h-[150px] object-contain rounded shadow-sm" />
                                ) : (
                                  <div className="text-slate-400 text-xs flex flex-col items-center gap-1 py-4">
                                    <ImageIcon className="w-6 h-6 opacity-50" />
                                    <span>No Image Available</span>
                                  </div>
                                )}
                              </div>

                              <div><span className="text-slate-400 font-bold">Item Name:</span> <span className="text-slate-800 font-semibold">{activeItem.name || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Sub Item:</span> <span className="text-slate-800 font-semibold">{activeItem.subItem || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Design No.:</span> <span className="text-slate-800 font-mono font-semibold">{activeItem.designNo || activeItem.sku || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Ipn:</span> <span className="text-slate-800 font-semibold">{activeItem.ipn || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Barcode:</span> <span className="text-slate-800 font-mono font-semibold">{activeItem.barcode || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Item Code:</span> <span className="text-slate-800 font-mono font-semibold">{activeItem.itemCode || activeItem.sku || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Unique product Code:</span> <span className="text-slate-800 font-mono font-semibold">{activeItem.uniqueCode || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">HSN:</span> <span className="text-slate-800 font-mono font-semibold">{activeItem.hsn || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Brand:</span> <span className="text-slate-800 font-semibold">{activeItem.brand || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Company:</span> <span className="text-slate-800 font-semibold">{activeItem.company || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Category:</span> <span className="text-slate-800 font-semibold">{activeItem.category || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Remarks:</span> <span className="text-slate-800 font-semibold">{activeItem.remarks || activeItem.description || 'N/A'}</span></div>
                            </div>
                          )}

                          {infoPanelTab === 'Stock' && (
                            <div className="space-y-2 text-slate-700">
                              <div className="text-[10px] uppercase font-bold text-slate-405 border-b border-slate-100 pb-1">📦 Stock Metrics</div>
                              <div><span className="text-slate-400 font-bold">Available Stock:</span> <span className="text-emerald-600 font-bold font-mono">{activeItem.availableStock || activeItem.stock || 0} PCS</span></div>
                              <div><span className="text-slate-400 font-bold">Sold Quantity:</span> <span className="text-slate-800 font-bold font-mono">{activeItem.soldQuantity || 0} PCS</span></div>
                              <div><span className="text-slate-400 font-bold">Reserved Quantity:</span> <span className="text-slate-800 font-bold font-mono">{activeItem.reservedQuantity || 0} PCS</span></div>
                              <div><span className="text-slate-400 font-bold">Alteration Quantity:</span> <span className="text-slate-800 font-bold font-mono">{activeItem.alterationQuantity || 0} PCS</span></div>
                              <div><span className="text-slate-400 font-bold">Transit:</span> <span className="text-slate-800 font-bold font-mono">{activeItem.transitQuantity || 0} PCS</span></div>
                              <div><span className="text-slate-400 font-bold">Rack Location:</span> <span className="text-slate-800 font-semibold">{activeItem.ipn || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Godown:</span> <span className="text-slate-800 font-semibold">{activeItem.godown || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Stock Age:</span> <span className="text-slate-800 font-semibold">{activeItem.stockAge || 'N/A'} Days</span></div>
                              <div><span className="text-slate-400 font-bold">Last Stock Update:</span> <span className="text-slate-800 font-semibold">{activeItem.updatedAt ? new Date(activeItem.updatedAt).toLocaleDateString() : 'N/A'}</span></div>
                            </div>
                          )}

                          {infoPanelTab === 'Purchase' && (
                            <div className="space-y-2 text-slate-700 animate-fade-in">
                              <div className="text-[10px] uppercase font-bold text-slate-405 border-b border-slate-100 pb-1">🛒 Confidential Purchase Details</div>
                              {isPurchaseTabUnlocked ? (
                                <>
                                  <div><span className="text-slate-400 font-bold">Vendor Name:</span> <span className="text-slate-800 font-semibold">{activeItem.vendorName || 'N/A'}</span></div>
                                  <div><span className="text-slate-400 font-bold">Vendor Code:</span> <span className="text-slate-800 font-mono font-semibold">{activeItem.vendorCode || 'N/A'}</span></div>
                                  <div><span className="text-slate-400 font-bold">Purchase Rate:</span> <span className="text-red-600 font-bold font-mono">₹{(activeItem.purchasePrice || 0).toLocaleString()}</span></div>
                                  <div><span className="text-slate-400 font-bold">Average Purchase Rate:</span> <span className="text-slate-800 font-bold font-mono">₹{(activeItem.avgPurchaseRate || activeItem.purchasePrice || 0).toLocaleString()}</span></div>
                                  <div><span className="text-slate-400 font-bold">Last Purchase Rate:</span> <span className="text-slate-800 font-bold font-mono">₹{(activeItem.lastPurchaseRate || activeItem.purchasePrice || 0).toLocaleString()}</span></div>
                                  <div><span className="text-slate-400 font-bold">Purchase Date:</span> <span className="text-slate-800 font-semibold">{activeItem.purchaseDate || 'N/A'}</span></div>
                                  <div><span className="text-slate-400 font-bold">Last Purchase Date:</span> <span className="text-slate-800 font-semibold">{activeItem.lastPurchaseDate || 'N/A'}</span></div>
                                  <div><span className="text-slate-400 font-bold">Purchase Invoice:</span> <span className="text-slate-800 font-semibold">{activeItem.purchaseInvoice || 'N/A'}</span></div>
                                  <div><span className="text-slate-400 font-bold">Goods Return Details:</span> <span className="text-slate-800 font-semibold">{activeItem.goodsReturnDetails || 'N/A'}</span></div>
                                  <div><span className="text-slate-400 font-bold">Landed Cost:</span> <span className="text-slate-800 font-bold font-mono">₹{(activeItem.landedCost || activeItem.purchasePrice || 0).toLocaleString()}</span></div>
                                  <div>
                                    <span className="text-slate-400 font-bold">Margin:</span>{' '}
                                    <span className="text-emerald-600 font-bold font-mono">
                                      ₹{((activeItem.sellingRate || activeItem.mrp || 0) - (activeItem.purchasePrice || 0)).toLocaleString()}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-4 space-y-2">
                                  <span className="text-slate-400 italic block text-[10px]">Purchase details are locked</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInfoPanelItem(activeItem);
                                      setPurchaseAuthOwnerId('');
                                      setPurchaseAuthPassword('');
                                      setIsPurchaseAuthModalOpen(true);
                                    }}
                                    className="px-3 py-1 bg-[#005fb8] text-white rounded font-bold text-[10px] cursor-pointer"
                                  >
                                    Authorize Access
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {infoPanelTab === 'Sales' && (
                            <div className="space-y-2 text-slate-700">
                              <div className="text-[10px] uppercase font-bold text-slate-405 border-b border-slate-100 pb-1">📈 Sales Metrics</div>
                              <div><span className="text-slate-400 font-bold">MRP:</span> <span className="text-slate-800 font-bold font-mono">₹{(activeItem.mrp || 0).toLocaleString()}</span></div>
                              <div><span className="text-slate-400 font-bold">Current Selling Rate:</span> <span className="text-slate-800 font-bold font-mono">₹{(activeItem.sellingRate || activeItem.sellingPrice || 0).toLocaleString()}</span></div>
                              <div><span className="text-slate-400 font-bold">Last Selling Rate:</span> <span className="text-slate-800 font-bold font-mono">₹{(activeItem.lastSellingRate || activeItem.sellingRate || activeItem.sellingPrice || 0).toLocaleString()}</span></div>
                              <div><span className="text-slate-400 font-bold">Last Sale Date:</span> <span className="text-slate-800 font-semibold">{activeItem.lastSaleDate || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Total Sold:</span> <span className="text-amber-600 font-bold font-mono">{activeItem.soldQuantity || 0} PCS</span></div>
                              <div><span className="text-slate-400 font-bold">Discount History:</span> <span className="text-slate-800 font-semibold">{activeItem.discountHistory || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold">Average Discount:</span> <span className="text-slate-800 font-bold font-mono">{activeItem.avgDiscount || '0'}%</span></div>
                              <div><span className="text-slate-400 font-bold">Return %:</span> <span className="text-slate-800 font-bold font-mono">{activeItem.returnPercent || '0'}%</span></div>
                              <div><span className="text-slate-400 font-bold">Exchange %:</span> <span className="text-slate-800 font-bold font-mono">{activeItem.exchangePercent || '0'}%</span></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Bottom Options */}
            <div className="bg-[#f0f0f0] p-2 text-[10px] text-slate-700">
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-1"><input type="checkbox" /> Use Company</label>
                  <label className="flex items-center gap-1"><input type="checkbox" /> Use Group</label>
                </div>
                <div className="flex flex-col gap-1 border border-slate-300 p-1 bg-[#e1e1e1] flex-1">
                  <div className="flex items-center gap-2">
                    <span>Display Order</span>
                    <select className="border border-slate-300 p-0.5 outline-none flex-1"><option>Item Name/Code</option></select>
                  </div>
                  <label className="flex items-center gap-1"><input type="checkbox" /> Include Additional Item Name Search</label>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-1"><input type="checkbox" /> Prompt For Items in Special Groups</label>
                  <label className="flex items-center gap-1"><input type="checkbox" /> Display Item Image</label>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2 border-t border-slate-300 pt-1">
                <span className="font-bold text-blue-800">F4=Edit HSN Code</span>
                <label className="flex items-center gap-1"><input type="checkbox" /> Prompt for blank HSN</label>
                <label className="flex items-center gap-1"><input type="checkbox" /> Always retrieve items from live data</label>
                <span className="font-bold text-blue-800 flex-1 text-right">Save And Refresh</span>
              </div>

              <div className="flex items-center gap-4 mt-1">
                <span className="text-blue-800">F2=New Item</span>
                <span className="text-blue-800">F3=New Item Shade/Size Wise</span>
                <span className="text-blue-800">F5=Stock Details</span>
                <span className="text-blue-800">F9=Toggle Search Item Name / Item Desc / Model / Part</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ITEM DETAIL INFO MODAL */}
      {infoModalItem && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-[450px] rounded-xl shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center text-sm font-bold">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Product Specification Sheet
              </span>
              <button
                onClick={() => setInfoModalItem(null)}
                className="hover:bg-white/20 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Item Name</div>
                  <div className="font-bold text-slate-800 mt-0.5">{infoModalItem.name}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Design No (SKU)</div>
                  <div className="font-bold text-slate-800 mt-0.5">{infoModalItem.designNo || infoModalItem.sku || 'N/A'}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Barcode</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{infoModalItem.barcode}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">HSN Code</div>
                  <div className="font-bold text-slate-800 mt-0.5">{infoModalItem.hsn || 'N/A'}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Colour</div>
                  <div className="font-bold text-slate-800 mt-0.5">{infoModalItem.color || 'N/A'}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Size</div>
                  <div className="font-bold text-slate-800 mt-0.5">{infoModalItem.size || 'N/A'}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">MRP</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">₹{infoModalItem.mrp?.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Selling Rate</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">₹{infoModalItem.sellingRate?.toLocaleString() || infoModalItem.sellingPrice?.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Available Stock</div>
                  <div className="font-mono font-bold text-emerald-600 mt-0.5">{infoModalItem.availableStock} PCS</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Sold Quantity</div>
                  <div className="font-mono font-bold text-amber-600 mt-0.5">{infoModalItem.soldQuantity} PCS</div>
                </div>
              </div>
              <div className="bg-slate-50 p-2 rounded space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Additional Attributes</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category (Sub Item):</span>
                  <span className="font-semibold">{infoModalItem.subItem || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Company (Brand):</span>
                  <span className="font-semibold">{infoModalItem.company || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rack / Location (IPN):</span>
                  <span className="font-semibold">{infoModalItem.ipn || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unique Code:</span>
                  <span className="font-semibold">{infoModalItem.uniqueCode || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInfoModalItem(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                Close Spec Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advance Prompt Modal */}
      {showAdvancePromptModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up border-t-4 border-indigo-500">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Available Advance & Loyalty</h3>
                  <p className="text-xs text-slate-500">Customer: <span className="font-bold text-slate-700">{activeCustomer?.name}</span></p>
                </div>
              </div>
              <button onClick={() => setShowAdvancePromptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const wallet = activeCustomer?.walletAdvance || 0;
              const loyalty = activeCustomer?.loyaltyPoints || 0;
              const history = activeCustomer?.advanceHistory || [];

              const returnAmt = history
                .filter(h => h.reason && h.reason.toLowerCase().includes('return'))
                .reduce((acc, h) => acc + (h.amount || 0), 0);
              const overpaidAmt = history
                .filter(h => h.reason && h.reason.toLowerCase().includes('overpayment'))
                .reduce((acc, h) => acc + (h.amount || 0), 0);
              const prepaidFromHistory = history
                .filter(h => h.reason && (h.reason.toLowerCase().includes('prepaid') || h.reason.toLowerCase().includes('advance') || h.reason.toLowerCase().includes('deposit')))
                .reduce((acc, h) => acc + (h.amount || 0), 0);

              const prepaidAmt = activeCustomer?.prepaidAdvance || activeCustomer?.prepaidAmount || prepaidFromHistory || Math.max(0, wallet - overpaidAmt - returnAmt);
              const fallbackOverpaid = overpaidAmt > 0 ? overpaidAmt : (history.length === 0 && prepaidAmt === 0 ? wallet : 0);

              return (
                <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-1">
                  {/* Category 1: Loyalty Points */}
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <div>
                      <p className="text-xs font-bold text-purple-900">Loyalty Point Amount</p>
                      <p className="text-sm font-black text-purple-700 font-mono">&#8377;{loyalty.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {Number(partPaymentAmounts["Points Redeem"]) > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategoryAdvance('loyalty')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleApplyCategoryAdvance('loyalty')}
                        disabled={loyalty <= 0}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Category 2: Overpaid Amount */}
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div>
                      <p className="text-xs font-bold text-emerald-900">Overpaid Amount</p>
                      <p className="text-sm font-black text-emerald-700 font-mono">&#8377;{fallbackOverpaid.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {Number(partPaymentAmounts["Advance"]) > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategoryAdvance('overpaid')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleApplyCategoryAdvance('overpaid')}
                        disabled={fallbackOverpaid <= 0}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Category 3: Return Amount */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div>
                      <p className="text-xs font-bold text-blue-900">Return Amount</p>
                      <p className="text-sm font-black text-blue-700 font-mono">&#8377;{returnAmt.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {Number(partPaymentAmounts["Advance"]) > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategoryAdvance('return')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleApplyCategoryAdvance('return')}
                        disabled={returnAmt <= 0}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Category 4: Prepaid Amount */}
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div>
                      <p className="text-xs font-bold text-amber-900">Prepaid Amount</p>
                      <p className="text-sm font-black text-amber-700 font-mono">&#8377;{prepaidAmt.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {Number(partPaymentAmounts["Advance"]) > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategoryAdvance('prepaid')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleApplyCategoryAdvance('prepaid')}
                        disabled={prepaidAmt <= 0}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-3">
              <button
                onClick={() => handleAcceptAdvance(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => handleApplyCategoryAdvance('all')}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors"
              >
                Apply All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW TOTALS */}
      {showTotalsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="p-4 bg-blue-600 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5" /> Cash Summary
              </h3>
              <button onClick={() => setShowTotalsModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const todayStr = new Date().toDateString();
                const todaysInvoices = invoices.filter(inv => new Date(inv.date).toDateString() === todayStr && inv.status !== 'Returned');
                const totalSales = todaysInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
                const billCount = todaysInvoices.length;
                const avgBill = billCount > 0 ? (totalSales / billCount) : 0;
                return (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center shadow-inner">
                      <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Total Sales</p>
                      <p className="text-3xl font-black text-blue-600 font-mono">&#8377;{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bill Count</p>
                        <p className="text-xl font-black text-slate-700">{billCount}</p>
                      </div>
                      <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Average Bill</p>
                        <p className="text-xl font-black text-slate-700">&#8377;{avgBill.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                    {/* Collection Breakdown */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1.5">Collection Summary</p>
                      {(() => {
                        let tCash = 0, tCard = 0, tUPI = 0, tDue = 0, tAdvance = 0;
                        todaysInvoices.forEach(inv => {
                          const splits = inv.transactions || inv.splitPayments || [];
                          if (splits.length > 0) {
                            splits.forEach(t => {
                              const m = (t.mode || t.method || '').toUpperCase();
                              const amt = Number(t.amount) || 0;
                              if (m === 'CASH') tCash += amt;
                              else if (m === 'CARD') tCard += amt;
                              else if (m === 'UPI') tUPI += amt;
                              else if (m === 'DUE') tDue += amt;
                              else if (m === 'ADVANCE') tAdvance += amt;
                            });
                          } else {
                            const pm = (inv.paymentMethod || inv.paymentMode || '').toUpperCase();
                            const amt = inv.grandTotal || 0;
                            if (pm.includes('CASH')) tCash += amt;
                            else if (pm.includes('CARD')) tCard += amt;
                            else if (pm.includes('UPI')) tUPI += amt;
                            else if (pm.includes('DUE') || pm.includes('CREDIT')) tDue += amt;
                            else if (pm.includes('ADVANCE')) tAdvance += amt;
                          }
                        });
                        return (
                          <>
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-600">Cash</span>
                              <span className="font-bold font-mono text-emerald-600">&#8377;{tCash.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-600">UPI</span>
                              <span className="font-bold font-mono text-blue-600">&#8377;{tUPI.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-600">Card</span>
                              <span className="font-bold font-mono text-indigo-600">&#8377;{tCard.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs pt-1.5 mt-1.5 border-t border-slate-200">
                              <span className="font-semibold text-slate-600">Due (Credit)</span>
                              <span className="font-bold font-mono text-amber-600">&#8377;{tDue.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-600">Advance Adjusted</span>
                              <span className="font-bold font-mono text-slate-700">&#8377;{tAdvance.toLocaleString('en-IN')}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURATIONS */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="p-4 bg-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> POS Configurations
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 text-sm font-medium text-slate-700">
              <div className="flex items-center justify-between">
                <span>Default Print Format</span>
                <select className="border border-slate-300 rounded-lg p-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-slate-500 bg-slate-50">
                  <option>Thermal (80mm)</option>
                  <option>A4 Size</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span>Auto-Print Receipt</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-slate-800" />
              </div>
              <div className="flex items-center justify-between">
                <span>Tax Inclusive Billing</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-slate-800" />
              </div>
              <p className="text-[10px] text-slate-400 mt-4 text-center font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100">Settings are saved locally for this session.</p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setShowConfigModal(false)} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 transition-colors text-white rounded-lg text-xs font-bold shadow-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RETRIEVE CHALLAN */}
      {showChallanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden animate-scale-up flex flex-col">
            <div className="p-4 bg-indigo-600 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" /> Alteration Challans
              </h3>
              <button onClick={() => setShowChallanModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {(() => {
                const alterationInvoices = invoices.filter(inv => inv.items && inv.items.some(item => item.hasAlteration));
                if (alterationInvoices.length === 0) {
                  return (
                    <div className="py-10 text-center text-slate-500">
                      <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="font-bold text-sm">No alteration challans found.</p>
                    </div>
                  );
                }
                return (
                  <div className="overflow-hidden border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Invoice No</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Tailor Name</th>
                          <th className="p-3">Delivery Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {alterationInvoices.map(inv => {
                          const alteredItem = inv.items.find(i => i.hasAlteration);
                          return (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-mono font-bold text-indigo-600">{inv.invoiceNo}</td>
                              <td className="p-3 font-medium text-slate-700">{new Date(inv.date).toLocaleDateString()}</td>
                              <td className="p-3 font-bold text-slate-800">{inv.customerName || 'Walk-in'}</td>
                              <td className="p-3 font-medium text-slate-600">{alteredItem?.alterationRecord?.tailorName || 'N/A'}</td>
                              <td className="p-3 font-bold text-amber-600">{alteredItem?.alterationRecord?.deliveryDate ? new Date(alteredItem.alterationRecord.deliveryDate).toLocaleDateString() : 'N/A'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OTHER DETAILS */}
      {showOtherDetailsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-4 bg-purple-600 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" /> Other Bill Details
              </h3>
              <button onClick={() => setShowOtherDetailsModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Transporter / Courier Name</label>
                <input
                  type="text"
                  value={otherBillDetails.transporter}
                  onChange={(e) => setOtherBillDetails({ ...otherBillDetails, transporter: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-shadow"
                  placeholder="e.g. DTDC, BlueDart"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Tracking / L.R. Number</label>
                <input
                  type="text"
                  value={otherBillDetails.trackingNo}
                  onChange={(e) => setOtherBillDetails({ ...otherBillDetails, trackingNo: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-mono font-bold text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-shadow"
                  placeholder="e.g. LR-12345678"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Shipping Address / Notes</label>
                <textarea
                  value={otherBillDetails.shippingAddress}
                  onChange={(e) => setOtherBillDetails({ ...otherBillDetails, shippingAddress: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-medium text-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-shadow min-h-[80px]"
                  placeholder="Shipping notes or destination address..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setShowOtherDetailsModal(false)} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 transition-colors text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-200">Save Details</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW HOLDS */}
      {showHoldListModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-scale-up flex flex-col">
            <div className="p-4 bg-orange-600 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5" /> Parked Bills ({heldBills.length})
              </h3>
              <button onClick={() => setShowHoldListModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {heldBills.length === 0 ? (
                <div className="py-10 text-center text-slate-500">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm">No parked bills found.</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Time</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Items Qty</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {heldBills.map((bill, idx) => {
                        const custName = customers?.find(c => c.id === bill.customerId || c._id === bill.customerId)?.name || "Walk-in";
                        const totalQty = bill.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-medium text-slate-700">{new Date(bill.timestamp).toLocaleTimeString()}</td>
                            <td className="p-3 font-bold text-slate-800">{custName}</td>
                            <td className="p-3 font-medium text-slate-600">{totalQty} Items</td>
                            <td className="p-3 flex gap-2">
                              <button onClick={() => handleResumeSpecificBill(idx)} className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs font-bold transition-colors">Resume</button>
                              <button onClick={() => setHeldBills(prev => prev.filter((_, i) => i !== idx))} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isPreparingPayment && (
        <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center max-w-md w-full animate-scale-up relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

            {/* Glowing Spinner Icon */}
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-ping opacity-25"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-inner">
                <CreditCard className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <h3 className="text-base font-black text-slate-800 mb-1 tracking-wider uppercase">
              Payment Quick Tab Initialization
            </h3>

            <p className="text-sm font-bold text-indigo-600 mb-4 animate-pulse">
              {paymentLoaderMessage}
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-full text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" /> Recalculating Bill Breakdown</span>
                <span className="text-emerald-600 font-bold">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-purple-500" /> Verifying Advance & Loyalty</span>
                <span className="text-purple-600 font-bold">Updated</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-emerald-500" /> Syncing Payable Summary</span>
                <span className="text-slate-800 font-mono font-bold">₹{(grandTotal || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overpaid Excess Balance Modal */}
      {showOverpaymentModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-scale-up">
            {/* Header */}
            <div className="bg-emerald-600 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black text-xl">
                  &#8377;
                </div>
                <div>
                  <h3 className="font-extrabold text-lg leading-tight">Overpaid Excess Balance Detected</h3>
                  <p className="text-emerald-100 text-xs font-medium">Save excess payment to customer wallet as future advance</p>
                </div>
              </div>
              <button onClick={() => setShowOverpaymentModal(false)} className="text-emerald-100 hover:text-white transition-colors cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Bill vs Paid Summary */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center font-mono">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Bill Total</span>
                  <span className="text-sm font-black text-slate-800">&#8377;{overpaidModalData.grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Paid</span>
                  <span className="text-sm font-black text-indigo-700">&#8377;{overpaidModalData.paidTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-emerald-50 rounded-lg p-1 border border-emerald-200">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Excess</span>
                  <span className="text-sm font-black text-emerald-700">&#8377;{overpaidModalData.excessAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Customer Badge */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-900">Customer Wallet:</span>
                <span className="font-extrabold text-indigo-700">{activeCustomer?.name || 'Walk-in Customer'}</span>
              </div>

              {/* Manual Amount Editor */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Overpaid Amount to Save as Future Advance (&#8377;)
                </label>
                <input
                  type="number"
                  min="0"
                  value={overpaidModalData.manualAmount}
                  onChange={(e) => setOverpaidModalData(prev => ({ ...prev, manualAmount: e.target.value }))}
                  className="w-full h-12 border-2 border-emerald-500 rounded-xl px-4 font-black font-mono text-lg text-slate-900 outline-none focus:ring-2 focus:ring-emerald-300 bg-white shadow-inner"
                  placeholder="Enter excess amount to save"
                />
              </div>

              {/* Reason / Remarks */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Reason / Remark (Optional)
                </label>
                <input
                  type="text"
                  value={overpaidModalData.reason}
                  onChange={(e) => setOverpaidModalData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full h-10 border border-slate-300 rounded-xl px-3 text-sm text-slate-800 outline-none focus:border-indigo-500 bg-white"
                  placeholder="Reason for advance saving"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSaveOverpaidAdvance}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> Save &#8377;{Number(overpaidModalData.manualAmount || 0).toLocaleString('en-IN')} as Future Advance
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOverpaymentModal(false);
                  handleCheckoutSubmit(false, true, true);
                }}
                className="w-full py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Proceed without saving extra to Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Payment Selection & Cash Denomination Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-50 rounded-2xl shadow-2xl w-[94vw] max-w-[1340px] overflow-hidden animate-scale-up flex flex-col border border-slate-200 h-[720px] max-h-[90vh] relative">

            {/* Custom Payment Warning Overlay */}
            {paymentWarning && (
              <div className="absolute inset-0 z-[130] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-96 p-6 border-t-4 border-t-rose-500 flex flex-col items-center text-center animate-scale-up">
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-500">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">Payment Incomplete</h3>
                  <p className="text-slate-600 mb-6 font-medium leading-relaxed whitespace-pre-line">{paymentWarning}</p>
                  <button onClick={() => setPaymentWarning("")} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition-colors cursor-pointer">
                    Understood
                  </button>
                </div>
              </div>
            )}

            {/* Top Bar: Tabs & Type */}
            <div className="bg-white border-b border-slate-200 px-2 pt-2 flex justify-between items-end">
              <div className="flex gap-1">
                <button className="px-6 py-3 font-bold text-indigo-700 bg-indigo-50 border-b-2 border-indigo-600 rounded-t-lg">Payment</button>
              </div>
              <div className="flex gap-4 pb-3 pr-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="paymentType" checked={paymentType === 'Full Payment'} onChange={() => setPaymentType('Full Payment')} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                  <span className="font-bold text-slate-700 text-sm">Full Payment</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="paymentType" checked={paymentType === 'Part Payment'} onChange={() => setPaymentType('Part Payment')} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                  <span className="font-bold text-slate-700 text-sm">Part Payment</span>
                </label>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 ml-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left Column: Payment Methods */}
              <div className="w-52 bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0">
                {["Cash", "Card", "UPI", "Advance", "Due", "Gift Voucher", "Points Redeem", "Other"].map(method => (
                  <button
                    key={method}
                    onClick={() => {
                      setPaymentMethod(method);
                      if (paymentType === 'Full Payment') {
                        setAllocatedFullPaymentMode(method);
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 text-left transition-all font-bold cursor-pointer ${paymentMethod === method ? "bg-indigo-50 text-indigo-700 border-l-4 border-l-indigo-600 shadow-sm z-10" : "text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent"}`}
                  >
                    <span className="flex-1 text-sm">{method}</span>
                    {paymentMethod === method && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
              </div>

              {/* Middle Column: Cash Denominations & Numpad */}
              <div className="flex-1 flex bg-slate-50 relative">
                {paymentMethod === "Cash" ? (
                  <>
                    <div className="flex-1 p-4 overflow-y-auto border-r border-slate-200">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { val: 500 },
                          { val: 200 },
                          { val: 100 },
                          { val: 50 },
                          { val: 20 },
                          { val: 10 },
                          { val: 5, isCoin: true },
                          { val: 2, isCoin: true },
                          { val: 1, isCoin: true }
                        ].map(note => (
                          <div
                            key={note.val}
                            onClick={() => setActiveDenomination(note.val)}
                            className={`flex items-center gap-3 p-3.5 min-h-[84px] rounded-2xl border-2 cursor-pointer transition-all ${activeDenomination === note.val ? 'border-indigo-600 bg-indigo-50/80 shadow-md ring-2 ring-indigo-200' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'}`}
                          >
                            {note.isCoin ? (
                              <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-sm shadow-md border-2 border-amber-400 shrink-0" style={{ background: 'linear-gradient(145deg, #f5d98e, #d4a843)', color: '#6b4c00' }}>
                                &#8377;{note.val}
                              </div>
                            ) : (
                              <img
                                src={`/photos/${note.val}.jpg`}
                                alt={"₹" + note.val}
                                className="w-24 h-16 object-cover rounded-xl shadow-sm border border-slate-200 transition-transform hover:scale-[1.03] shrink-0"
                              />
                            )}

                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Qty</span>
                              <input
                                type="number" min="0"
                                className="w-full h-10 border border-slate-300 rounded-xl text-center font-extrabold text-slate-800 outline-none focus:border-indigo-500 bg-white text-base shadow-inner"
                                value={cashDenominations[note.val] || ''}
                                onChange={(e) => {
                                  setActiveDenomination(note.val);
                                  setCashDenominations(prev => ({ ...prev, [note.val]: e.target.value }));
                                }}
                                placeholder="0"
                              />
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider mb-0.5">Total</span>
                              <span className="font-mono font-black text-slate-900 text-sm">
                                &#8377;{((Number(cashDenominations[note.val]) || 0) * note.val).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Virtual Numpad for Cash */}
                    <div className="w-[300px] p-4 bg-[#e8ecf1] flex flex-col items-center justify-center gap-3 shrink-0">
                      {/* LCD Display */}
                      <div className="w-full h-16 bg-white border border-slate-300 rounded shadow-inner flex flex-col justify-center items-end px-4">
                        <span className="text-xs font-bold text-slate-400">₹{activeDenomination} {activeDenomination <= 5 ? 'Coins' : 'Notes'}</span>
                        <span className="text-2xl font-black font-mono text-slate-800">{cashDenominations[activeDenomination] || '0'}</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 w-full flex-1">
                        {/* Row 1 */}
                        <button onClick={() => setCashDenominations(p => ({ ...p, [activeDenomination]: '' }))} className="col-span-2 py-3 bg-red-100 hover:bg-red-200 border border-red-200 rounded font-bold text-red-700 shadow-sm active:scale-95 transition-transform text-lg cursor-pointer">CLR</button>
                        <button onClick={() => setCashDenominations(p => ({ ...p, [activeDenomination]: (p[activeDenomination]?.toString() || '').slice(0, -1) }))} className="col-span-2 py-3 bg-orange-100 hover:bg-orange-200 border border-orange-200 rounded font-bold text-orange-700 shadow-sm active:scale-95 transition-transform text-lg cursor-pointer">BCK</button>

                        {/* Numbers */}
                        {['7', '8', '9', '+', '4', '5', '6', '-', '1', '2', '3', '=', '0', '00', '.', 'Pay'].map((btn, i) => (
                          <button
                            key={i}
                            onClick={async () => {
                              if (btn === 'Pay') {
                                const cashTot = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                                if (paymentType === 'Full Payment' && cashTot < grandTotal) {
                                  setPaymentWarning(`Paid amount (₹${cashTot}) is less than Bill Amount (₹${grandTotal}).\n\nPlease select "Part Payment" to add Due amount or select multiple methods.`);
                                  return;
                                }
                                const saved = await handleCheckoutSubmit(false, true, true);
                                if (saved) {
                                  setShowPaymentModal(false);
                                  setShowBillPreviewInvoice(saved);
                                }
                              } else if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '00'].includes(btn)) {
                                setCashDenominations(p => ({ ...p, [activeDenomination]: (p[activeDenomination]?.toString() || '') + btn }));
                              }
                            }}
                            className={`py-3 bg-white hover:bg-slate-50 border border-slate-300 rounded font-bold text-slate-700 shadow-sm active:scale-95 transition-transform text-xl cursor-pointer ${btn === 'Pay' ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 text-base' :
                              ['+', '-', '='].includes(btn) ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300' : ''
                              }`}
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : paymentMethod === "Advance" ? (
                  <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 p-4 overflow-y-auto border-r border-slate-200 bg-white">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wider truncate">Customer Wallet & Advance</span>
                          </div>
                          <span className="text-xs font-black text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full shrink-0 font-mono">
                            Avail: &#8377;{((activeCustomer?.walletAdvance || 0) + (activeCustomer?.loyaltyPoints || 0)).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Customer: <strong className="text-slate-700 font-bold">{activeCustomer?.name || 'Walk-in Customer'}</strong></span>
                        </div>
                      </div>

                      {(() => {
                        const wallet = activeCustomer?.walletAdvance || 0;
                        const loyalty = activeCustomer?.loyaltyPoints || 0;
                        const history = activeCustomer?.advanceHistory || [];

                        const returnAmt = history
                          .filter(h => h.reason && h.reason.toLowerCase().includes('return'))
                          .reduce((acc, h) => acc + (h.amount || 0), 0);
                        const overpaidAmt = history
                          .filter(h => h.reason && h.reason.toLowerCase().includes('overpayment'))
                          .reduce((acc, h) => acc + (h.amount || 0), 0);
                        const prepaidFromHistory = history
                          .filter(h => h.reason && (h.reason.toLowerCase().includes('prepaid') || h.reason.toLowerCase().includes('advance') || h.reason.toLowerCase().includes('deposit')))
                          .reduce((acc, h) => acc + (h.amount || 0), 0);

                        const prepaidAmt = activeCustomer?.prepaidAdvance || activeCustomer?.prepaidAmount || prepaidFromHistory || Math.max(0, wallet - overpaidAmt - returnAmt);
                        const fallbackOverpaid = overpaidAmt > 0 ? overpaidAmt : (history.length === 0 && prepaidAmt === 0 ? wallet : 0);

                        return (
                          <div className="space-y-2.5">
                            {/* Option 1: Loyalty Points */}
                            <div className="flex items-center justify-between p-2.5 bg-purple-50/70 rounded-xl border border-purple-100">
                              <div>
                                <p className="text-xs font-bold text-purple-900">Loyalty Point Amount</p>
                                <p className="text-sm font-black text-purple-700 font-mono">&#8377;{loyalty.toLocaleString('en-IN')}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {Number(partPaymentAmounts["Points Redeem"]) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCategoryAdvance('loyalty')}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleApplyCategoryAdvance('loyalty')}
                                  disabled={loyalty <= 0}
                                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>

                            {/* Option 2: Overpaid Amount */}
                            <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
                              <div>
                                <p className="text-xs font-bold text-emerald-900">Overpaid Amount</p>
                                <p className="text-sm font-black text-emerald-700 font-mono">&#8377;{fallbackOverpaid.toLocaleString('en-IN')}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {Number(partPaymentAmounts["Advance"]) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCategoryAdvance('overpaid')}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleApplyCategoryAdvance('overpaid')}
                                  disabled={fallbackOverpaid <= 0}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>

                            {/* Option 3: Return Amount */}
                            <div className="flex items-center justify-between p-2.5 bg-blue-50/70 rounded-xl border border-blue-100">
                              <div>
                                <p className="text-xs font-bold text-blue-900">Return Amount</p>
                                <p className="text-sm font-black text-blue-700 font-mono">&#8377;{returnAmt.toLocaleString('en-IN')}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {Number(partPaymentAmounts["Advance"]) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCategoryAdvance('return')}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleApplyCategoryAdvance('return')}
                                  disabled={returnAmt <= 0}
                                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>

                            {/* Option 4: Prepaid Amount */}
                            <div className="flex items-center justify-between p-2.5 bg-amber-50/70 rounded-xl border border-amber-100">
                              <div>
                                <p className="text-xs font-bold text-amber-900">Prepaid Amount</p>
                                <p className="text-sm font-black text-amber-700 font-mono">&#8377;{prepaidAmt.toLocaleString('en-IN')}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {Number(partPaymentAmounts["Advance"]) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCategoryAdvance('prepaid')}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleApplyCategoryAdvance('prepaid')}
                                  disabled={prepaidAmt <= 0}
                                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="w-[280px] p-4 bg-[#e8ecf1] flex flex-col items-center justify-center gap-3 shrink-0">
                      {/* LCD Display */}
                      <div className="w-full h-16 bg-white border border-slate-300 rounded shadow-inner flex flex-col justify-center items-end px-4">
                        <span className="text-xs font-bold text-slate-400">Advance Allocated</span>
                        <div className="flex items-center w-full justify-end">
                          <span className="text-2xl font-black font-mono text-slate-800 mr-1">&#8377;</span>
                          {paymentType === 'Full Payment' ? (
                            <span className="text-2xl font-black font-mono text-slate-800">{grandTotal}</span>
                          ) : (
                            <input
                              type="number" min="0"
                              autoFocus
                              value={partPaymentAmounts["Advance"] || ''}
                              onChange={(e) => {
                                setPartPaymentAmounts(p => ({ ...p, Advance: e.target.value }));
                                setConfirmedPartPaymentModes(p => ({ ...p, Advance: false }));
                              }}
                              className="text-2xl font-black font-mono text-slate-800 bg-transparent text-right outline-none w-32 border-b-2 border-transparent focus:border-indigo-400"
                              placeholder="0"
                            />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 w-full">
                        <button onClick={() => { if (paymentType === 'Part Payment') setPartPaymentAmounts(p => ({ ...p, Advance: '' })) }} className="col-span-2 py-3 bg-red-100 hover:bg-red-200 border border-red-200 rounded font-bold text-red-700 shadow-sm active:scale-95 transition-transform text-lg cursor-pointer">CLR</button>
                        <button onClick={() => { if (paymentType === 'Part Payment') setPartPaymentAmounts(p => ({ ...p, Advance: (p.Advance?.toString() || '').slice(0, -1) })) }} className="col-span-2 py-3 bg-orange-100 hover:bg-orange-200 border border-orange-200 rounded font-bold text-orange-700 shadow-sm active:scale-95 transition-transform text-lg cursor-pointer">BCK</button>

                        {['7', '8', '9', '+', '4', '5', '6', '-', '1', '2', '3', '=', '0', '00', '.', 'Pay'].map((btn, i) => (
                          <button
                            key={i}
                            onClick={async () => {
                              if (btn === 'Pay') {
                                if (paymentType === 'Full Payment') {
                                  const saved = await handleCheckoutSubmit(false, true, true);
                                  if (saved) {
                                    setShowPaymentModal(false);
                                    setShowBillPreviewInvoice(saved);
                                  }
                                  return;
                                }
                                const cashTot = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                                // Only count confirmed modes (except Due) for validation
                                const confirmedTot = cashTot + ["Card", "UPI", "Advance", "Gift Voucher", "Points Redeem", "Other"].reduce((acc, m) =>
                                  acc + (confirmedPartPaymentModes[m] ? (Number(partPaymentAmounts[m]) || 0) : 0), 0) +
                                  (confirmedPartPaymentModes["Due"] ? (Number(partPaymentAmounts["Due"]) || 0) : 0);
                                if (confirmedTot < grandTotal) {
                                  setPaymentWarning(`Total Confirmed Amount (₹${confirmedTot}) does not match Bill Amount (₹${grandTotal})!`);
                                  return;
                                }
                                const saved2 = await handleCheckoutSubmit(false, true, true);
                                if (saved2) {
                                  setShowPaymentModal(false);
                                  setShowBillPreviewInvoice(saved2);
                                }
                              } else if (paymentType === 'Part Payment' && ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '.'].includes(btn)) {
                                setPartPaymentAmounts(p => ({ ...p, Advance: (p.Advance?.toString() || '') + btn }));
                                setConfirmedPartPaymentModes(p => ({ ...p, Advance: false }));
                              }
                            }}
                            className={`py-3 bg-white hover:bg-slate-50 border border-slate-300 rounded font-bold text-slate-700 shadow-sm active:scale-95 transition-transform text-xl cursor-pointer ${btn === 'Pay' ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 text-base' :
                              ['+', '-', '='].includes(btn) ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300' : ''
                              }`}
                          >
                            {btn}
                          </button>
                        ))}
                      </div>

                      {/* Pay Advance Button below editor */}
                      {(() => {
                        const cashTot = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                        // Only count confirmed modes (excluding Advance) for remaining calc
                        const otherTot = ["Card", "UPI", "Advance", "Due", "Gift Voucher", "Points Redeem", "Other"].reduce((acc, m) =>
                          m === 'Advance' ? acc : acc + (confirmedPartPaymentModes[m] ? (Number(partPaymentAmounts[m]) || 0) : 0), 0);
                        const remainingUnpaidAdv = Math.max(0, Number((grandTotal - cashTot - otherTot).toFixed(2)));
                        const advVal = Number(partPaymentAmounts["Advance"]) || 0;
                        const displayAdvVal = paymentType === 'Full Payment' ? grandTotal : (advVal > 0 ? advVal : remainingUnpaidAdv);

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (paymentType === 'Part Payment') {
                                if (confirmedPartPaymentModes['Advance']) {
                                  // Deselect: only when confirmed
                                  setConfirmedPartPaymentModes(p => ({ ...p, Advance: false }));
                                  setPartPaymentAmounts(p => ({ ...p, Advance: '' }));
                                } else {
                                  if (advVal <= 0 && remainingUnpaidAdv > 0) {
                                    setPartPaymentAmounts(p => ({ ...p, Advance: remainingUnpaidAdv.toString() }));
                                  }
                                  setConfirmedPartPaymentModes(p => ({ ...p, Advance: true }));
                                }
                              }
                            }}
                            className={`w-full py-3 ${paymentType === 'Part Payment' && confirmedPartPaymentModes['Advance'] ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-xl font-extrabold uppercase text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5`}
                          >
                            <CheckCircle className="w-4 h-4" /> {paymentType === 'Part Payment' && confirmedPartPaymentModes['Advance'] ? `PAID ADVANCE` : `PAY ADVANCE`} (&#8377;{displayAdvVal.toLocaleString('en-IN')})
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4 relative">
                    {paymentType === 'Full Payment' && (
                      <div className="absolute top-8 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-bold shadow-sm animate-fade-in z-10 flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Full Payment Mode: Entire bill is allocated to {paymentMethod}.
                      </div>
                    )}
                    <div className={`w-[300px] p-4 bg-[#e8ecf1] flex flex-col items-center justify-center gap-3 shrink-0 rounded shadow-md border border-slate-200 transition-opacity ${paymentType === 'Full Payment' ? 'opacity-90' : ''}`}>
                      {/* LCD Display */}
                      <div className="w-full h-16 bg-white border border-slate-300 rounded shadow-inner flex flex-col justify-center items-end px-4">
                        <span className="text-xs font-bold text-slate-400">{paymentMethod} Amount</span>
                        <div className="flex items-center w-full justify-end">
                          <span className="text-2xl font-black font-mono text-slate-800 mr-1">&#8377;</span>
                          {paymentType === 'Full Payment' ? (
                            <span className="text-2xl font-black font-mono text-slate-800">{grandTotal}</span>
                          ) : (
                            <input
                              type="number" step="any" min="0"
                              autoFocus
                              value={partPaymentAmounts[paymentMethod] || ''}
                              onChange={(e) => {
                                setPartPaymentAmounts(p => ({ ...p, [paymentMethod]: e.target.value }));
                                setConfirmedPartPaymentModes(p => ({ ...p, [paymentMethod]: false }));
                              }}
                              className="text-2xl font-black font-mono text-slate-800 bg-transparent text-right outline-none w-32 border-b-2 border-transparent focus:border-indigo-400"
                              placeholder="0"
                            />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 w-full">
                        <button onClick={() => { if (paymentType === 'Part Payment') { setPartPaymentAmounts(p => ({ ...p, [paymentMethod]: '' })); setConfirmedPartPaymentModes(p => ({ ...p, [paymentMethod]: false })); } }} className={`col-span-2 py-3 bg-red-100 hover:bg-red-200 border border-red-200 rounded font-bold text-red-700 shadow-sm active:scale-95 transition-transform text-lg cursor-pointer ${paymentType === 'Full Payment' ? 'opacity-50 cursor-not-allowed' : ''}`}>CLR</button>
                        <button onClick={() => { if (paymentType === 'Part Payment') { setPartPaymentAmounts(p => ({ ...p, [paymentMethod]: (p[paymentMethod]?.toString() || '').slice(0, -1) })); setConfirmedPartPaymentModes(p => ({ ...p, [paymentMethod]: false })); } }} className={`col-span-2 py-3 bg-orange-100 hover:bg-orange-200 border border-orange-200 rounded font-bold text-orange-700 shadow-sm active:scale-95 transition-transform text-lg cursor-pointer ${paymentType === 'Full Payment' ? 'opacity-50 cursor-not-allowed' : ''}`}>BCK</button>

                        {['7', '8', '9', '+', '4', '5', '6', '-', '1', '2', '3', '=', '0', '00', '.', 'Pay'].map((btn, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (btn === 'Pay') {
                                if (paymentType === 'Full Payment') {
                                  if (allocatedFullPaymentMode === paymentMethod) {
                                    setAllocatedFullPaymentMode(null);
                                  } else {
                                    setAllocatedFullPaymentMode(paymentMethod);
                                  }
                                  return;
                                }
                                if (confirmedPartPaymentModes[paymentMethod]) {
                                  // Deselect: clear amount and unconfirm
                                  setPartPaymentAmounts(p => ({ ...p, [paymentMethod]: '' }));
                                  setConfirmedPartPaymentModes(p => ({ ...p, [paymentMethod]: false }));
                                  return;
                                }
                                const cashTot = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                                // Only count confirmed modes for validation (plus current method's typed amount)
                                const currentAmt = Number(partPaymentAmounts[paymentMethod]) || 0;
                                const confirmedTot = cashTot + ["Card", "UPI", "Advance", "Due", "Gift Voucher", "Points Redeem", "Other"].reduce((acc, m) =>
                                  acc + (m === paymentMethod ? currentAmt : (confirmedPartPaymentModes[m] ? (Number(partPaymentAmounts[m]) || 0) : 0)), 0);
                                if (confirmedTot < grandTotal) {
                                  setPaymentWarning(`Total Confirmed Amount (₹${confirmedTot}) does not match Bill Amount (₹${grandTotal})!`);
                                  return;
                                }
                                setConfirmedPartPaymentModes(p => ({ ...p, [paymentMethod]: true }));
                              } else if (paymentType === 'Part Payment' && ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '.'].includes(btn)) {
                                setPartPaymentAmounts(p => {
                                  const curr = p[paymentMethod]?.toString() || '';
                                  if (btn === '.' && curr.includes('.')) return p;
                                  return { ...p, [paymentMethod]: curr + btn };
                                });
                                setConfirmedPartPaymentModes(p => ({ ...p, [paymentMethod]: false }));
                              }
                            }}
                            className={`py-3 bg-white border border-slate-300 rounded font-bold text-slate-700 shadow-sm transition-transform text-xl ${btn === 'Pay' ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 text-base active:scale-95 cursor-pointer' :
                              paymentType === 'Part Payment' ? 'hover:bg-slate-50 active:scale-95 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                              } ${['+', '-', '='].includes(btn) && paymentType === 'Part Payment' ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300' : ''}`}
                          >
                            {btn}
                          </button>
                        ))}
                      </div>

                      {/* Pay Button below manual editor */}
                      {(() => {
                        const cashTot = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                        // Only count confirmed modes (excluding current method) when computing remaining
                        const otherTot = ["Card", "UPI", "Advance", "Due", "Gift Voucher", "Points Redeem", "Other"].reduce((acc, m) =>
                          m === paymentMethod ? acc : acc + (confirmedPartPaymentModes[m] ? (Number(partPaymentAmounts[m]) || 0) : 0), 0);
                        const remainingUnpaidMode = Math.max(0, Number((grandTotal - cashTot - otherTot).toFixed(2)));
                        const currentVal = Number(partPaymentAmounts[paymentMethod]) || 0;
                        const displayVal = paymentType === 'Full Payment' ? grandTotal : (currentVal > 0 ? currentVal : remainingUnpaidMode);

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (paymentType === 'Part Payment') {
                                if (confirmedPartPaymentModes[paymentMethod]) {
                                  setConfirmedPartPaymentModes(p => ({ ...p, [paymentMethod]: false }));
                                  setPartPaymentAmounts(p => ({ ...p, [paymentMethod]: '' }));
                                } else {
                                  let newPart = { ...partPaymentAmounts };
                                  if (currentVal <= 0 && remainingUnpaidMode > 0) {
                                    newPart[paymentMethod] = remainingUnpaidMode.toString();
                                    setPartPaymentAmounts(newPart);
                                  }
                                  setConfirmedPartPaymentModes(p => ({ ...p, [paymentMethod]: true }));
                                }
                              } else if (paymentType === 'Full Payment') {
                                if (allocatedFullPaymentMode === paymentMethod) {
                                  setAllocatedFullPaymentMode(null);
                                } else {
                                  setAllocatedFullPaymentMode(paymentMethod);
                                }
                              }
                            }}
                            className={`w-full py-3 ${(paymentType === 'Full Payment' && allocatedFullPaymentMode === paymentMethod) ||
                              (paymentType === 'Part Payment' && confirmedPartPaymentModes[paymentMethod])
                              ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'
                              } text-white rounded-xl font-extrabold uppercase text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5`}
                          >
                            <CheckCircle className="w-4 h-4" /> {
                              (paymentType === 'Full Payment' && allocatedFullPaymentMode === paymentMethod) ||
                                (paymentType === 'Part Payment' && confirmedPartPaymentModes[paymentMethod])
                                ? `PAID VIA ${paymentMethod}` : `PAY ${paymentMethod}`
                            } (&#8377;{displayVal.toLocaleString('en-IN')})
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Billing Break-up */}
              <div className="w-80 bg-white flex flex-col text-sm border-l border-slate-200 shrink-0">
                <div className="bg-slate-100 font-bold p-3 border-b border-slate-200 text-slate-700 flex justify-between items-center uppercase tracking-wider text-xs">
                  <span>Payment Break-up</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">Live Summary</span>
                </div>

                <div className="p-3.5 space-y-2.5 font-mono flex-1 overflow-y-auto text-xs">
                  {/* Summary Breakdown Header */}
                  <div className="space-y-1.5 pb-2.5 border-b border-slate-200">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Original Bill Total</span>
                      <span className="font-bold text-slate-800">₹{(subTotal || 0).toLocaleString()}</span>
                    </div>
                    {discountTotal > 0 && (
                      <div className="flex justify-between items-center text-emerald-600">
                        <span>Total Discounts</span>
                        <span className="font-bold">-₹{discountTotal.toLocaleString()}</span>
                      </div>
                    )}
                    {billAdjustment && billAdjustment.amount > 0 && (
                      <div className="flex justify-between items-center text-indigo-600">
                        <span>Bill Adjustment ({billAdjustment.operation})</span>
                        <span className="font-bold">
                          {billAdjustment.operation === 'Discount' ? '-' : '+'}₹{billAdjustment.amount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-900 pt-1.5 border-t border-slate-200 font-black text-sm">
                      <span>Net Payable Amount</span>
                      <span className="text-indigo-700">₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment Modes Allocation */}
                  <div className="space-y-1.5 py-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Allocated Payment Modes</div>
                    {(() => {
                      const cashTotal = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                      // Show only confirmed amounts in the summary (unconfirmed are still being edited)
                      const rows = [
                        { label: "Cash", val: paymentType === 'Full Payment' ? (allocatedFullPaymentMode === 'Cash' ? cashTotal : 0) : cashTotal },
                        { label: "Card", val: paymentType === 'Full Payment' ? (allocatedFullPaymentMode === 'Card' ? grandTotal : 0) : (confirmedPartPaymentModes['Card'] ? (Number(partPaymentAmounts['Card']) || 0) : 0) },
                        { label: "UPI", val: paymentType === 'Full Payment' ? (allocatedFullPaymentMode === 'UPI' ? grandTotal : 0) : (confirmedPartPaymentModes['UPI'] ? (Number(partPaymentAmounts['UPI']) || 0) : 0) },
                        { label: "Advance Used", val: paymentType === 'Full Payment' ? (allocatedFullPaymentMode === 'Advance' ? grandTotal : 0) : (confirmedPartPaymentModes['Advance'] ? (Number(partPaymentAmounts['Advance']) || 0) : 0) },
                        { label: "Points Redeem", val: paymentType === 'Full Payment' ? (allocatedFullPaymentMode === 'Points Redeem' ? grandTotal : 0) : (confirmedPartPaymentModes['Points Redeem'] ? (Number(partPaymentAmounts['Points Redeem']) || 0) : 0) },
                        { label: "Due Balance", val: paymentType === 'Full Payment' ? (allocatedFullPaymentMode === 'Due' ? grandTotal : 0) : (confirmedPartPaymentModes['Due'] ? (Number(partPaymentAmounts['Due']) || 0) : 0) },
                        { label: "Gift Voucher", val: confirmedPartPaymentModes['Gift Voucher'] ? (Number(partPaymentAmounts['Gift Voucher']) || 0) : 0 },
                        { label: "Other", val: confirmedPartPaymentModes['Other'] ? (Number(partPaymentAmounts['Other']) || 0) : 0 },
                      ].filter(row => row.val > 0);
                      return rows.length > 0 ? rows.map((row, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-600 text-[11px]">
                          <span>{row.label}</span>
                          <span className="text-emerald-700 font-bold">₹{row.val.toLocaleString()}</span>
                        </div>
                      )) : <div className="text-slate-400 text-[11px] italic">No payments confirmed yet</div>;
                    })()}
                  </div>

                  {/* Summary Totals Footer */}
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    {(() => {
                      const cashTotal = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                      // Only count confirmed amounts for total display
                      const partTotal = cashTotal + ["Card", "UPI", "Advance", "Due", "Gift Voucher", "Points Redeem", "Other"].reduce((acc, m) =>
                        acc + (confirmedPartPaymentModes[m] ? (Number(partPaymentAmounts[m]) || 0) : 0), 0);
                      const totalPaidDisplay = paymentType === 'Full Payment' ? (allocatedFullPaymentMode ? (allocatedFullPaymentMode === 'Cash' ? cashTotal : grandTotal) : 0) : partTotal;
                      const remainingDue = Math.max(0, grandTotal - totalPaidDisplay);
                      const changeReturn = Math.max(0, totalPaidDisplay - grandTotal);
                      return (
                        <>
                          <div className="flex justify-between items-center text-slate-800 pt-1">
                            <span className="font-bold text-xs">Total Amount Paid</span>
                            <span className="font-black text-emerald-600 text-base">
                              ₹{totalPaidDisplay.toLocaleString('en-IN')}
                            </span>
                          </div>
                          {remainingDue > 0 && (
                            <div className="flex justify-between items-center text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 text-xs">
                              <span className="font-bold">Remaining Amount to be Paid</span>
                              <span className="font-black text-amber-700 text-sm">
                                ₹{remainingDue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                          {changeReturn > 0 && (
                            <div className="flex justify-between items-center text-slate-800 bg-rose-50 p-2 rounded border border-rose-200 text-xs">
                              <span className="font-bold">Balance (Change Return)</span>
                              <span className="font-black text-rose-600 text-sm">
                                ₹{changeReturn.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
                  <button
                    id="save-payment-btn"
                    disabled={paymentType === 'Full Payment' && !allocatedFullPaymentMode}
                    onClick={() => {
                      setShowPaymentModal(false);
                    }}
                    className="w-full py-3 bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-300 text-slate-700 rounded font-bold uppercase text-xs shadow-sm cursor-pointer transition-colors"
                  >
                    <Save className="w-4 h-4 inline mr-2" /> Save Payment (Ctrl+S)
                  </button>
                  <button
                    id="save-print-payment-btn"
                    disabled={paymentType === 'Full Payment' && !allocatedFullPaymentMode}
                    onClick={() => {
                      setShowPaymentModal(false);
                      handleOpenDraftPreview();
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-black uppercase text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Printer className="w-5 h-5" /> Save & Print Bill (Ctrl+P)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount Selection Modal */}
      {showDiscountSelectionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999999] flex justify-center items-center p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-100 shadow-2xl relative animate-scale-up flex flex-col overflow-hidden max-h-[85vh]">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold tracking-tight">Available Discounts</h2>
              <button onClick={() => setShowDiscountSelectionModal(false)} className="text-white hover:text-rose-200 transition-colors p-2 rounded-full hover:bg-white/10 cursor-pointer"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-4">
              {discountRules.filter(r => {
                if (r.status !== 'Active' || r.offerType === 'LoyaltyRule') return false;
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);
                if (new Date(r.endDate) < new Date() && new Date(r.endDate).setHours(23, 59, 59, 999) < new Date()) return false;
                return true;
              }).map(rule => {
                const rId = rule._id || rule.id;
                const isEligible = subTotal >= (rule.minBillAmount || 0);
                return (
                  <div key={rId} className={`bg-white rounded-2xl p-5 border ${isEligible ? 'border-indigo-100 shadow-md shadow-indigo-100/50' : 'border-slate-200 opacity-60'} flex justify-between items-center transition-all`}>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        {rule.offerName}
                        {rule.offerType === 'Automatic' && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Auto</span>}
                        {rule.offerType === 'Coupon' && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Coupon</span>}
                        {rule.offerType === 'Product' && <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Product</span>}
                        {rule.offerType === 'Brand' && <span className="bg-cyan-100 text-cyan-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Brand</span>}
                        {rule.offerType === 'Category' && <span className="bg-pink-100 text-pink-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Category</span>}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 mt-1">{rule.description || 'Applies to cart if eligible.'}</p>
                      <div className="text-[10px] font-bold text-slate-400 mt-2 flex gap-4 uppercase">
                        {rule.offerType === 'Product' && rule.applicableProducts && rule.applicableProducts.length > 0 ? (
                          <span>Products: {rule.applicableProducts.join(', ')}</span>
                        ) : rule.offerType === 'Brand' && rule.applicableBrands && rule.applicableBrands.length > 0 ? (
                          <span>Brands: {rule.applicableBrands.join(', ')}</span>
                        ) : rule.offerType === 'Category' && rule.applicableCategories && rule.applicableCategories.length > 0 ? (
                          <span>Categories: {rule.applicableCategories.join(', ')}</span>
                        ) : (
                          <span>Min Bill: ₹{rule.minBillAmount || 0}</span>
                        )}
                        <span className="text-indigo-600">Off: {rule.discountType === 'Flat' ? `₹${rule.discountValue}` : `${rule.discountValue}%`}</span>
                      </div>
                    </div>
                    <button
                      disabled={!isEligible}
                      onClick={() => {
                        if (manualDiscountIds.includes(rId)) {
                          setManualDiscountIds(prev => prev.filter(id => id !== rId));
                        } else {
                          setManualDiscountIds(prev => [...prev, rId]);
                          if (typeof onAddNotification === 'function') onAddNotification("Success", `Applied ${rule.offerName}`, "success");
                        }
                      }}
                      className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${isEligible ? (manualDiscountIds.includes(rId) ? 'bg-emerald-500 text-white shadow-md cursor-pointer' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 cursor-pointer') : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                      {manualDiscountIds.includes(rId) ? 'Applied (Remove)' : 'Apply Offer'}
                    </button>
                  </div>
                );
              })}
              {discountRules.filter(r => {
                if (r.status !== 'Active' || r.offerType === 'LoyaltyRule') return false;
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);
                if (new Date(r.endDate) < new Date() && new Date(r.endDate).setHours(23, 59, 59, 999) < new Date()) return false;
                return true;
              }).length === 0 && (
                  <div className="text-center py-10 text-slate-400 font-semibold">No active discount rules found.</div>
                )}
            </div>
          </div>
        </div>
      )}
      {/* Return & Exchange Alert Warning Modal */}
      {returnWarning.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-[400px] shadow-2xl overflow-hidden border border-red-200">
            <div className="bg-red-600 text-white p-4 flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">{returnWarning.title}</h3>
            </div>
            <div className="p-6 text-slate-800 font-bold text-sm whitespace-pre-wrap">
              {returnWarning.message}
            </div>
            <div className="bg-red-50 p-4 border-t border-red-100 flex justify-end">
              <button
                onClick={() => setReturnWarning({ show: false, title: "", message: "" })}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-black tracking-wider rounded-xl transition-colors shadow-md border-2 border-red-600 hover:border-red-700"
              >
                APPROVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Auth Modal for Purchase Tab */}
      {isPurchaseAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[260] animate-fade-in text-slate-600 font-semibold">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-indigo-600">
              <Info className="w-4 h-4" />
              <span>Supervisor Purchase Unlock</span>
            </h3>
            <p className="text-[10px] text-slate-400">Please enter credentials to unlock confidential purchase details.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Supervisor Username</label>
                <input
                  type="email"
                  required
                  value={purchaseAuthOwnerId}
                  onChange={(e) => setPurchaseAuthOwnerId(e.target.value)}
                  autoComplete="off"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-450 font-bold mb-1">Supervisor Password / PIN</label>
                <input
                  type="password"
                  required
                  value={purchaseAuthPassword}
                  onChange={(e) => setPurchaseAuthPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseAuthModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePurchaseAuth}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer text-xs"
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

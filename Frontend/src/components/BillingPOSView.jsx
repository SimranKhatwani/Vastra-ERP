import api from '../api/axios';
import React, { useState, useEffect, useMemo } from "react";
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
  Loader2
} from "lucide-react";

const generateUniqueItemCode = () => {
  const prefixes = ["TRK", "ITM", "UC"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${randomPart}`;
};

export const BillingPOSView = ({
  activeModule,
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
}) => {
  // Cart state
  const [cart, setCart] = useState([]);

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
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerForm, setCustomerForm] = useState({ phone: '', name: '', email: '', dob: '', gstin: '', lf: '2588' });

  const handleCustomerPhoneChange = (e) => {
    const val = e.target.value;
    const match = customers.find(c => c.phone === val || c.mobile === val);
    if (match) {
      setCustomerForm({ phone: val, name: match.name || '', email: match.email || '', dob: match.dob || '', gstin: match.gstin || match.gstNo || '', lf: '2588' });
      setSelectedCustomerId(match.id || match._id);
    } else {
      setCustomerForm(prev => ({ ...prev, phone: val }));
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
        const newCust = await onAddCustomer({
          name: customerForm.name,
          phone: customerForm.phone,
          email: customerForm.email,
          dob: customerForm.dob,
          gstin: customerForm.gstin
        });
        if (newCust && (newCust.id || newCust._id)) {
          setSelectedCustomerId(newCust.id || newCust._id);
          if (onAddNotification) onAddNotification("Success", "Customer Created & Saved", "success");
        }
      } catch (err) {
        console.error(err);
      }
    } else if (selectedCustomerId) {
      try {
        const res = await api.put(`/customers/${selectedCustomerId}`, {
          name: customerForm.name,
          phone: customerForm.phone,
          email: customerForm.email,
          dob: customerForm.dob,
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
              uniqueCode: generateUniqueItemCode()
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

  const handleOpenAlterationForCartItem = (item) => {
    if (!item) return;
    setSelectedAlterationCartItem(item);
    setAltMeasurements(item.alterationRecord?.measurements || {});
    setAltOptions(item.alterationRecord?.alterationDetails || []);
    setAltCustomText(item.alterationRecord?.customAlterationText || "");
    setAltSpecialInstructions(item.alterationRecord?.specialInstructions || "");
    setAltDeliveryDate(item.alterationRecord?.deliveryDate || "");
    setAltDeliveryTime(item.alterationRecord?.deliveryTime || "05:00 PM");
    setAltTrialDate(item.alterationRecord?.trialDate || "");
    setAltPriority(item.alterationRecord?.priority || "Normal");
    setAltSelectedTailor((tailorEmployeesList || []).find(t => t.name === item.alterationRecord?.tailorName) || null);
    setShowAlterationModal(true);
  };

  const filteredItemCodeProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const q = (itemCodeSearchInput || "").trim().toLowerCase();
    if (!q) return products.slice(0, 40);
    return products.filter(p => {
      const code = (p.itemCode || p.productCode || p.sku || "").toLowerCase();
      const name = (p.itemName || p.name || "").toLowerCase();
      const barcode = (p.barcode || (p.pieces && p.pieces[0]?.barcode) || "").toLowerCase();
      return code.includes(q) || name.includes(q) || barcode.includes(q);
    }).slice(0, 60);
  }, [products, itemCodeSearchInput]);

  const filteredItemSearchProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const q = (itemSearchInputText || "").trim().toLowerCase();
    if (!q) return products.slice(0, 40);
    return products.filter(p => {
      const code = (p.itemCode || p.productCode || p.sku || "").toLowerCase();
      const name = (p.itemName || p.name || "").toLowerCase();
      const design = (p.designNo || "").toLowerCase();
      const barcode = (p.barcode || (p.pieces && p.pieces[0]?.barcode) || "").toLowerCase();
      return name.includes(q) || code.includes(q) || design.includes(q) || barcode.includes(q);
    }).slice(0, 60);
  }, [products, itemSearchInputText]);

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
  const [selectedInvoiceForReturn, setSelectedInvoiceForReturn] =
    useState(null);
  const [returnedItemIds, setReturnedItemIds] = useState([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);

  // Returns & Exchange Subsystem States
  const [returnSearchQuery, setReturnSearchQuery] = useState("");
  const [returnActionType, setReturnActionType] = useState("return"); // 'return' | 'exchange'
  const [returnReason, setReturnReason] = useState("");
  const [returnCustomReason, setReturnCustomReason] = useState("");
  const [returnApprovedCheckbox, setReturnApprovedCheckbox] = useState(false);
  const [returnRefundTotalAmount, setReturnRefundTotalAmount] = useState(true);
  const [returnAdvanceAmount, setReturnAdvanceAmount] = useState("");

  const [exchangeReason, setExchangeReason] = useState("");
  const [exchangeCustomReason, setExchangeCustomReason] = useState("");
  const [exchangeOldItemIdx, setExchangeOldItemIdx] = useState(0);
  const [exchangeNewSearchQuery, setExchangeNewSearchQuery] = useState("");
  const [exchangeSelectedNewProduct, setExchangeSelectedNewProduct] = useState(null);
  const [showExchangeSlipModal, setShowExchangeSlipModal] = useState(false);
  const [completedExchangeSlip, setCompletedExchangeSlip] = useState(null);
  const [returnWarning, setReturnWarning] = useState({ show: false, title: "", message: "" });

  // Cash Denomination UI
  const [showCashDenominationModal, setShowCashDenominationModal] = useState(false);
  const [paymentType, setPaymentType] = useState('Full Payment'); // 'Full Payment' | 'Part Payment'
  const [cashDenominations, setCashDenominations] = useState({
    500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: ''
  });
  const [activeDenomination, setActiveDenomination] = useState(500);
  const [partPaymentAmounts, setPartPaymentAmounts] = useState({
    Card: '', UPI: '', Advance: '', Due: '', 'Gift Voucher': '', 'Credit Note': '', 'Points Redeem': '', Other: ''
  });
  const [paymentWarning, setPaymentWarning] = useState("");

  // Payment modal state is cleared manually in handleOpenPaymentFlow

  // Local Reactive Invoices State & Bill History Navigation
  const [invoiceList, setInvoiceList] = useState(invoices);
  const [historyViewIndex, setHistoryViewIndex] = useState(-1); // -1 = Active New Bill

  const handleStartNewBill = () => {
    setHistoryViewIndex(-1);
    setCart([]);
    setSelectedCustomerId("");
    setCustomerSearch("");
    setCouponCode("");
    setManualDiscountIds([]);
    setRejectedAutoDiscountIds([]);
    setSelectedLoyaltyRuleId("");
    setPaymentMethod("Cash");
    if (onAddNotification) onAddNotification("New Bill", "Fresh POS billing session started.", "info");
  };

  const handleLoadPreviousBill = () => {
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
      setCart(targetInv.items || []);
      setSelectedCustomerId(targetInv.customerId || targetInv.customer?.id || "");
      setCustomerSearch(targetInv.customerName || "");
      setPaymentMethod(targetInv.paymentMethod || "Cash");
      if (onAddNotification) onAddNotification("Previous Bill Loaded", `Viewing Bill: ${targetInv.invoiceNo} (${targetIdx + 1}/${list.length})`, "success");
    }
  };

  const handleLoadNextBill = () => {
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
      setCart(targetInv.items || []);
      setSelectedCustomerId(targetInv.customerId || targetInv.customer?.id || "");
      setCustomerSearch(targetInv.customerName || "");
      setPaymentMethod(targetInv.paymentMethod || "Cash");
      if (onAddNotification) onAddNotification("Next Bill Loaded", `Viewing Bill: ${targetInv.invoiceNo} (${targetIdx + 1}/${list.length})`, "success");
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
          unitId: item.unitId || `${baseId}-u1`,
          quantity: 1,
          price: unitPrice,
          totalPrice: unitPrice
        });
      } else {
        for (let i = 1; i <= qty; i++) {
          result.push({
            ...item,
            unitId: `${baseId}-u${i}`,
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

  const [showDueCustomerModal, setShowDueCustomerModal] = useState(false);
  const [dueCustName, setDueCustName] = useState("");
  const [dueCustPhone, setDueCustPhone] = useState("");

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

    const previewInvNo = `INV-${Date.now().toString().slice(-6)}`;
    const targetTailor = altSelectedTailor || tailorEmployeesList[0] || { id: "t-default", name: "Master Tailor Ramesh" };

    const payload = {
      invoiceId: previewInvNo,
      invoiceNumber: previewInvNo,
      customerId: activeCustomer.id || activeCustomer._id || "c-walkin",
      customerName: activeCustomer.name,
      customerPhone: activeCustomer.phone,
      productId: selectedAlterationCartItem.productId || selectedAlterationCartItem.id || "p-gen",
      productName: selectedAlterationCartItem.name,
      sku: selectedAlterationCartItem.sku || "SKU-001",
      barcode: selectedAlterationCartItem.barcode || "BAR-001",
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
      trialDate: altTrialDate,
      priority: altPriority,
      status: "Pending",
      createdBy: currentUser ? currentUser.name : "Cashier"
    };

    let savedRecord = payload;
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/alterations`, payload);
      const data = res.data;
      if (data.success && data.data) {
        savedRecord = data.data;
      }
    } catch (err) {
      console.error("Save alteration error:", err);
    }

    // Attach alteration record to target item in cart
    setCart(prev => prev.map(item => {
      const isMatch = (item === selectedAlterationCartItem) ||
        (item.id && selectedAlterationCartItem.id && item.id === selectedAlterationCartItem.id) ||
        (item.productId && selectedAlterationCartItem.productId && item.productId === selectedAlterationCartItem.productId && item.size === selectedAlterationCartItem.size && item.color === selectedAlterationCartItem.color) ||
        (item.name === selectedAlterationCartItem.name && item.size === selectedAlterationCartItem.size);
      if (isMatch) {
        return { ...item, hasAlteration: true, alterationRecord: savedRecord };
      }
      return item;
    }));

    if (onAddNotification) {
      onAddNotification("Alteration Saved", `Alteration ticket created for ${selectedAlterationCartItem.name} & attached to bill!`, "success");
    }

    setSelectedAlterationCartItem(null);
    setAltMeasurements({});
    setAltOptions([]);
    setAltCustomText("");
    setAltSpecialInstructions("");
    setShowAlterationModal(false);
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

  const handleFocusItemCodeSearch = () => {
    const input = document.getElementById("itemCodeSearchInput");
    if (input) {
      input.focus();
      if (typeof input.select === "function") input.select();
      setIsItemCodeDropdownOpen(true);
    }
  };

  // --- GLOBAL KEYBOARD LISTENERS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
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
        setCart([]);
        setCustomerForm({ phone: '', name: '', email: '', dob: '', title: 'Mr.', lf: '2588' });
        setSelectedCustomerId("");
        if (onAddNotification) onAddNotification("New Bill", "Cart cleared for new bill.", "info");
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

      // Ctrl+B: Barcode Scanner
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        return;
      }

      // Esc: Close Modals / Dropdowns
      if (e.key === "Escape") {
        setIsProductDropdownOpen(false);
        setIsCustomerDropdownOpen(false);
        setIsItemCodeDropdownOpen(false);
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

      // Single Key Shortcuts & Space Key (Guarded when typing text in editable inputs)
      const isTyping = document.activeElement && (
        (document.activeElement.tagName === "INPUT" && !document.activeElement.readOnly) ||
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.tagName === "SELECT" ||
        document.activeElement.isContentEditable
      );

      if (!isTyping && !isAlterationModeActive && !showPaymentModal && !isItemSearchModalOpen) {
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
          setCart([]);
          if (onAddNotification) onAddNotification("Clear Bill", "Cart cleared.", "info");
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
            handleOpenAlterationForCartItem(targetItem);
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
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
    showAlterationModal
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

  // Action: Add product to cart with custom quantity (from articulation window)
  const handleAddProductToCartWithQty = (prod, qty) => {
    if (prod.stock <= 0) {
      onAddNotification(
        "POS Warning",
        `${prod.name} is currently out of stock.`,
        "warning",
      );
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

    // Show the Alteration prompt popup
    const cartItemRef = {
      productId: prod._id || prod.id,
      name: prod.name,
      sku: prod.sku,
      size: customSize,
      color: customColor,
      salespersonId: sp.id || sp._id || "sp-default",
      salespersonName: sp.name || "Store Salesperson",
      workerId: wk.id || wk._id || "w-default",
      workerName: wk.name || "In-House Tailor",
      quantity: qty
    };
    setAlterationPromptItem(cartItemRef);
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
    phone: "N/A",
    email: "",
    outstandingBalance: 0,
    membership: "Bronze",
    walletAdvance: 0,
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

  // Inject 50 demo products if the user's DB doesn't have enough to show off the UI feature
  const [demoProducts, setDemoProducts] = useState([]);
  useEffect(() => {
    if (products.length < 15 && demoProducts.length === 0) {
      const categories = ['Shirts', 'T-Shirts', 'Trousers', 'Jeans', 'Jackets', 'Suits', 'Ethnic Wear'];
      const colors = ['Red', 'Blue', 'Black', 'White', 'Grey', 'Navy', 'Olive', 'Maroon'];
      const brands = ['Raymond', 'Peter England', 'Levis', 'Allen Solly', 'Van Heusen', 'Arrow'];

      let mocks = [];
      for (let i = 1; i <= 50; i++) {
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
    handleAddProductToCartWithQty(prod, 1);
  };

  // Action: Finalize product addition from configuration modal
  const finalizeAddToCart = (prod, customQty, customSize, customColor, spId, spName, wId, wName) => {
    setCart((prev) => {
      const newItems = [];
      const sPrice = Number(prod.sellingPrice) ?? Number(prod.price) ?? Number(prod.mrp) ?? Number(prod.defaultMRP) ?? 0;
      const mrpVal = Number(prod.mrp) ?? Number(prod.defaultMRP) ?? sPrice;
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
        newItems.push({
          productId: prod._id || prod.id,
          name: itemNameVal,
          itemName: itemNameVal,
          barcode: barcodeVal,
          barcodeNo: barcodeVal,
          subItem: subItemVal,
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
          uniqueCode: generateUniqueItemCode()
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
      setCart((prev) => {
        const item = prev[idx];
        const newItem = {
          ...item,
          quantity: 1,
          uniqueCode: generateUniqueItemCode(),
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
  const { subTotal, discountTotal, couponDiscount, gstTotal, grandTotal, appliedDiscountsList } = React.useMemo(() => {
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
    let taxable = Math.max(0, subTotal - totalOverallDiscount);

    if (billAdjustment && billAdjustment.amount > 0) {
      if (billAdjustment.operation === 'Charge') {
        taxable += billAdjustment.amount;
      } else if (billAdjustment.operation === 'Discount') {
        taxable = Math.max(0, taxable - billAdjustment.amount);
      }
    }

    const gstTotal = 0;
    const grandTotal = taxable;

    return {
      subTotal,
      discountTotal: totalOverallDiscount,
      couponDiscount,
      gstTotal,
      grandTotal,
      appliedDiscountsList
    };
  }, [cart, couponCode, manualDiscountIds, rejectedAutoDiscountIds, cgstRate, sgstRate, discountRules, products, activeCustomer, billAdjustment]);

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
      await fetchActiveRules().catch(() => {});

      const totalAdvance = (activeCustomer?.walletAdvance || 0) + (activeCustomer?.loyaltyPoints || 0);

      // Brief async pause (300ms) to ensure state synchronization & display loader
      await new Promise(resolve => setTimeout(resolve, 300));

      if (activeCustomer && activeCustomer.id !== "c-walkin" && totalAdvance > 0) {
        setShowAdvancePromptModal(true);
      } else {
        setPaymentType('Full Payment');
        setCashDenominations({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: '' });
        setPartPaymentAmounts({
          Card: '', UPI: '', Advance: '', Due: '', 'Gift Voucher': '', 'Credit Note': '', 'Points Redeem': '', Other: ''
        });
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

      setPartPaymentAmounts((prev) => {
        const currentPointsRedeem = Number(prev["Points Redeem"]) || 0;
        const currentAdvance = Number(prev["Advance"]) || 0;
        let newPointsRedeem = currentPointsRedeem;
        let newAdvance = currentAdvance;

        if (category === "loyalty") {
          const remainingForLoyalty = Math.max(0, grandTotal - currentAdvance);
          const applyLoyalty = Math.min(loyalty, remainingForLoyalty);
          newPointsRedeem = applyLoyalty;
          if (newPointsRedeem + newAdvance > grandTotal) {
            newAdvance = Math.max(0, grandTotal - newPointsRedeem);
          }
        } else {
          const remainingForAdvance = Math.max(0, grandTotal - currentPointsRedeem);
          let targetCategoryBalance = 0;
          if (category === "overpaid") targetCategoryBalance = fallbackOverpaid;
          else if (category === "return") targetCategoryBalance = returnAmt;
          else if (category === "prepaid") targetCategoryBalance = prepaidAmt;
          else if (category === "all") targetCategoryBalance = wallet;

          const applyAdvance = Math.min(targetCategoryBalance, remainingForAdvance);
          newAdvance = applyAdvance;
        }

        const remainingUnpaid = Math.max(0, Number((grandTotal - newPointsRedeem - newAdvance).toFixed(2)));

        return {
          ...prev,
          "Points Redeem": newPointsRedeem > 0 ? newPointsRedeem.toString() : "",
          "Advance": newAdvance > 0 ? newAdvance.toString() : "",
          "UPI": remainingUnpaid > 0 && !prev["Card"] && !prev["Due"] ? remainingUnpaid.toString() : (prev["UPI"] || "")
        };
      });

      await new Promise(resolve => setTimeout(resolve, 300));
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
  const handleCheckoutSubmit = async (overrideCustomerDue = false, skipBillPreview = false, skipOverpaymentPrompt = false) => {
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

      const computedDueAmount = paymentType === "Full Payment"
        ? (paymentMethod === "Due" ? grandTotal : 0)
        : (Number(partPaymentAmounts["Due"]) || 0);

      const isCustomerMissing = !selectedCustomerId || activeCustomer.id === "c-walkin" || !activeCustomer.name;
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
        computedAmountPaid = cashTotal + ["Card", "UPI"].reduce((acc, m) => acc + (Number(partPaymentAmounts[m]) || 0), 0);
        advanceApplied = Number(partPaymentAmounts["Advance"]) || 0;
        loyaltyPointsUsed = Number(partPaymentAmounts["Points Redeem"]) || 0;
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
            ...["Card", "UPI", "Advance", "Due", "Gift Voucher", "Credit Note", "Points Redeem", "Other"]
              .filter(m => Number(partPaymentAmounts[m]) > 0)
              .map(m => {
                let mode = m.toUpperCase().replace(/\s+/g, '_');
                if (mode === 'POINTS_REDEEM') mode = 'POINTS';
                return { mode, amount: Number(partPaymentAmounts[m]) };
              })
          ]
        : [
            {
              mode: paymentMethod === 'Cash' ? 'CASH'
                : (paymentMethod === 'Card' ? 'CARD'
                : (paymentMethod === 'UPI' ? 'UPI'
                : (paymentMethod === 'Advance' ? 'ADVANCE'
                : (paymentMethod === 'Points Redeem' ? 'POINTS'
                : (paymentMethod === 'Due' ? 'DUE' : paymentMethod.toUpperCase()))))),
              amount: grandTotal
            }
          ];

      const displayPaymentMode = paymentType === "Part Payment"
        ? (compiledTransactions.length > 1 ? compiledTransactions.map(t => t.mode).join(' + ') : (compiledTransactions[0]?.mode || 'Split'))
        : paymentMethod;

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
        paymentMethod: displayPaymentMode,
        paymentTransactions: compiledTransactions,
        splitPayments: compiledTransactions.map(t => ({ method: t.mode, amount: t.amount })),
        amountPaid: computedAmountPaid,
        advanceApplied,
        loyaltyPointsUsed,
        status: paymentMethod === "Credit" || computedDueAmount >= grandTotal ? "Unpaid" : "Paid",
        employeeId: finalEmployeeId && finalEmployeeId.length === 24 ? finalEmployeeId : undefined,
        employeeName: cashier.name,
        salespersonName: selectedSalesperson ? selectedSalesperson.name : "Admin (Self)",
        billAdjustment: billAdjustment && billAdjustment.amount > 0 ? billAdjustment : undefined,
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
      const mergedInvoice = {
        ...newInvoice,
        ...(savedInvoice || {}),
        paymentMethod: newInvoice.paymentMethod || savedInvoice?.paymentMethod || "Cash",
        splitPayments: newInvoice.splitPayments || savedInvoice?.splitPayments,
        paymentTransactions: newInvoice.paymentTransactions || savedInvoice?.paymentTransactions,
        advanceApplied: newInvoice.advanceApplied || savedInvoice?.advanceApplied || 0,
        items: ((savedInvoice && savedInvoice.items) || newInvoice.items).map((savedItem, i) => {
          const originalItem = newInvoice.items[i] || savedItem;
          return {
            ...savedItem,
            hasAlteration: originalItem.hasAlteration || savedItem.hasAlteration || Boolean(originalItem.alterationRecord),
            alterationRecord: originalItem.alterationRecord || savedItem.alterationRecord
          };
        })
      };

      setCompletedInvoice(mergedInvoice);
      setCart([]);
      setCouponCode("");
      setSelectedCustomerId("");
      setCustomerSearch("");
      setCustomerForm({ phone: '', name: '', email: '', dob: '', title: 'Mr.', lf: '' });

      setSelectedLoyaltyRuleId("");
      setCancelAutoDiscount(false);
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
      if (!skipBillPreview) {
        setShowBillPreviewInvoice(mergedInvoice);
      }

      onAddNotification(
        "Invoice Compiled Successfully",
        `Issued receipt ${newInvoice.invoiceNo} for ₹${newInvoice.grandTotal.toLocaleString()}`,
        "success",
      );

      // ── Automatic WhatsApp Dispatch (fire-and-forget, never blocks checkout) ──
      if (savedInvoice && savedInvoice._id && onRetryWhatsApp) {
        setWhatsappDispatchState('sending');
        setWhatsappDispatchId(savedInvoice._id);
        onRetryWhatsApp(savedInvoice._id)
          .then(ok => setWhatsappDispatchState(ok ? 'success' : 'failed'))
          .catch(err => {
            console.error('[BillingPOSView] WhatsApp dispatch error:', err);
            setWhatsappDispatchState('failed');
          });
      } else {
        setWhatsappDispatchState('idle');
      }

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
    let targetId;

    if (existingCustomer) {
      targetId = existingCustomer.id || existingCustomer._id;
    } else {
      targetId = `c-${(customers || []).length + 1}`;
      const newCust = {
        id: targetId,
        name: dueCustName,
        phone: dueCustPhone,
        email: `${dueCustName.toLowerCase().replace(/\s+/g, "")}@example.com`,
        whatsappNumber: dueCustPhone,
        outstandingBalance: 0,
        membership: "Bronze",
        walletAdvance: 0,
        loyaltyPoints: 10,
        birthday: "1995-01-01",
        createdAt: new Date().toISOString().split('T')[0],
        totalInvoices: 0,
        totalSpent: 0,
      };

      if (onAddCustomer) {
        onAddCustomer(newCust);
      } else {
        (customers || []).push(newCust);
      }
    }

    setSelectedCustomerId(targetId);
    setDueCustName("");
    setDueCustPhone("");
    setShowDueCustomerModal(false);

    // Slight delay to allow state to settle before checking out
    setTimeout(() => {
      handleCheckoutSubmit(true);
    }, 100);
  };

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
      walletAdvance: 0,
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
    let refundTotal = selectedInvoiceForReturn.items
      .filter((item) => returnedItemIds.includes(item.productId))
      .reduce((sum, item) => sum + item.totalPrice, 0);

    if (selectedInvoiceForReturn.billAdjustment && selectedInvoiceForReturn.billAdjustment.amount > 0) {
      const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || 0), 0) || 1;
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

  const generateUniqueItemCode = () => {
    const prefixes = ["TRK", "ITM", "UC"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    for (let i = 0; i < 8; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${randomPart}`;
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

    const previewInv = {
      invoiceNo: `INV-TEMP-${Date.now().toString().substring(6)}`,
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
      isDraftPreview: true
    };
    setShowBillPreviewInvoice(previewInv);
  };

  const handleGenerateBillAction = async () => {
    if (isGeneratingBill) return;
    setIsGeneratingBill(true);
    try {
      const saved = await handleCheckoutSubmit(false, true);
      if (saved) {
        setShowBillPreviewInvoice(null);
        if (typeof onAddNotification === 'function') {
          onAddNotification("Success", "Bill generated successfully.", "success");
        }
      }
    } catch (err) {
      console.error("Generate Bill Error:", err);
    } finally {
      setIsGeneratingBill(false);
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

    const messageText = `*ZIVA FASHION BOUTIQUE*\nInvoice & Receipt Confirmation\n--------------------------------\n*Receipt No:* ${invNo}\n*Date:* ${dateStr}\n*Customer:* ${custName}\n\n*Items Purchased:*\n${itemsSummary}\n\n*Grand Total:* ₹${total}\n*Payment Mode:* ${payMode}\n\nThank you for shopping with us! 🙏`;

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
  const generateReceiptHTMLContent = (invoice, autoPrint = false) => {
    const receiptDate = invoice.date ? new Date(invoice.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '-';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Receipt ${invoice.invoiceNo || 'DRAFT'}</title>
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
          <b>Receipt No:</b> ${invoice.invoiceNo || 'DRAFT'}<br>
          <b>Date:</b> ${receiptDate}<br>
          <b>Customer:</b> ${invoice.customerName} ${invoice.customerPhone ? `(${invoice.customerPhone})` : ''}
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
            ${unrollInvoiceItems(invoice.items)
        .map(
          (item) => `
                <tr>
                  <td>
                    ${item.name} (${item.size}/${item.color})
                    ${item.uniqueCode ? `<br/><span style="font-size: 9px; color: #555;">Code: ${item.uniqueCode}</span>` : ''}
                  </td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">&#8377;${(Number(item.price) || 0).toLocaleString('en-IN')}</td>
                  <td class="text-right">&#8377;${(Number(item.totalPrice || item.price) || 0).toLocaleString('en-IN')}</td>
                </tr>
                ${item.isReturned ? `<tr><td colSpan="4" style="color:#e11d48; font-weight:bold; font-size:9.5px; padding:2px 4px;">↩ [RETURNED ITEM]</td></tr>` : ''}
                ${item.isExchanged ? `<tr><td colSpan="4" style="color:#4f46e5; font-weight:bold; font-size:9.5px; padding:2px 4px;">🔁 [EXCHANGED FOR: ${item.exchangedFor || 'New Garment'}]</td></tr>` : ''}
                ${!!(item.hasAlteration || item.alterationRecord) ? `
                  <tr>
                    <td colSpan="4" style="font-size:9.5px; color:#be123c; background:#fff1f2; padding:4px 6px; border-radius:4px; margin-bottom:4px;">
                      <b>✂ ALTERATION:</b> ${item.alterationRecord?.alterationDetails?.join(', ') || 'Custom Fit'} | <b>Tailor:</b> ${item.alterationRecord?.tailorName || 'Master Tailor'}<br/>
                      <b>Delivery:</b> ${item.alterationRecord?.deliveryDate || 'Scheduled'} ${item.alterationRecord?.deliveryTime || ''} [Trial: ${item.alterationRecord?.trialDate || 'N/A'}, Priority: ${item.alterationRecord?.priority || 'Normal'}]
                    </td>
                  </tr>
                ` : ''}
              `,
        )
        .join("")}
          </tbody>
        </table>
        <div class="divider"></div>
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">&#8377;${(Number(invoice.subTotal) || 0).toLocaleString('en-IN')}</td>
          </tr>
          ${invoice.discountTotal > 0
        ? `
              <tr>
                <td>Discount:</td>
                <td class="text-right">-&#8377;${(Number(invoice.discountTotal) || 0).toLocaleString('en-IN')}</td>
              </tr>
            `
        : ""
      }
          ${invoice.billAdjustment && invoice.billAdjustment.amount > 0
        ? `
              <tr>
                <td>Adj (${invoice.billAdjustment.operation === 'Charge' ? '+' : '-'}) ${invoice.billAdjustment.reason ? `[${invoice.billAdjustment.reason}]` : ''}:</td>
                <td class="text-right">${invoice.billAdjustment.operation === 'Charge' ? '+' : '-'}&#8377;${(Number(invoice.billAdjustment.amount) || 0).toLocaleString('en-IN')}</td>
              </tr>
            `
        : ""
      }

          <tr class="totals">
            <td>Grand Total:</td>
            <td class="text-right">&#8377;${(Number(invoice.grandTotal) || 0).toLocaleString('en-IN')}</td>
          </tr>
        </table>
        ${invoice.items.some(i => i.hasAlteration || !!i.alterationRecord) ? `
          <div class="divider"></div>
          <div style="font-size:11px; font-weight:bold; text-align:center; color:#be123c; margin-bottom:4px;">
            *** ALTERATION & DELIVERY SLIP ***
          </div>
          ${invoice.items.filter(i => i.hasAlteration || !!i.alterationRecord).map(i => `
            <div style="font-size:10px; line-height:1.4; background:#fff1f2; padding:6px; margin-bottom:4px; border:1px solid #fecdd3; border-radius:4px;">
              <b>Item:</b> ${i.name} (${i.size}/${i.color})<br/>
              <b>Tailor:</b> ${i.alterationRecord?.tailorName || 'Master Tailor'}<br/>
              <b>Alterations:</b> ${i.alterationRecord?.alterationDetails?.join(', ') || 'Custom Fit'}<br/>
              <b>Delivery Date & Time:</b> ${i.alterationRecord?.deliveryDate || 'Scheduled'} ${i.alterationRecord?.deliveryTime || ''}<br/>
              <b>Trial Date:</b> ${i.alterationRecord?.trialDate || 'N/A'} (Priority: ${i.alterationRecord?.priority || 'Normal'})<br/>
              ${i.alterationRecord?.specialInstructions ? `<b>Notes:</b> ${i.alterationRecord.specialInstructions}<br/>` : ''}
            </div>
          `).join('')}
        ` : ''}
        <div class="divider"></div>
        <div class="details">
          ${(invoice.advanceApplied > 0 || (invoice.splitPayments && invoice.splitPayments.some(s => (s.method || s.mode || '').toUpperCase() === 'ADVANCE' && s.amount > 0))) ?
            `<div style="font-weight:bold; color:#047857; text-align:center; margin-bottom:6px;">
              ADVANCE AMOUNT USED: &#8377;${((invoice.advanceApplied || 0) || (invoice.splitPayments?.find(s => (s.method || s.mode || '').toUpperCase() === 'ADVANCE')?.amount || 0)).toLocaleString('en-IN')}
            </div>`
            : ''
          }
          ${invoice.splitPayments && invoice.splitPayments.length > 0 ?
            `<div style="background:#f8fafc; padding:6px; border:1px solid #e2e8f0; border-radius:4px; font-size:11px; margin-bottom:8px;">
              <div style="font-weight:bold; text-align:center; margin-bottom:4px; border-bottom:1px solid #cbd5e1; padding-bottom:2px;">PAYMENT BREAKDOWN</div>
              ${invoice.splitPayments.map(sp => `
                <div style="display:flex; justify-content:space-between; padding:2px 0;">
                  <span>${sp.method || sp.mode}:</span>
                  <b>&#8377;${(Number(sp.amount) || 0).toLocaleString('en-IN')}</b>
                </div>
              `).join('')}
            </div>`
            : ''
          }
          <div class="text-center"><b>Payment Mode:</b> ${invoice.paymentMethod || 'Cash'}</div>
          <div class="text-center">
            <b>Status:</b> ${(invoice.status || 'Paid').toUpperCase()}<br>
            Thank you for shopping with us!<br>
            Powered by GarmentFlow SaaS ERP
          </div>
        </div>
        ${autoPrint ? `
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
        ` : ''}
      </body>
      </html>
    `;
  };

  // Direct print trigger using a hidden iframe to prevent blank browser tabs
  const handleDirectPrint = (invoice) => {
    if (!invoice) return;
    const htmlContent = generateReceiptHTMLContent(invoice, false);
    
    let iframe = document.getElementById("print-iframe");
    if (iframe) {
      try { document.body.removeChild(iframe); } catch (e) {}
    }
    iframe = document.createElement("iframe");
    iframe.id = "print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error("Iframe print error:", e);
        const win = window.open('', '_blank', 'width=400,height=600');
        if (win) {
          win.document.write(htmlContent);
          win.document.close();
          win.focus();
          win.print();
          win.close();
        }
      }
    }, 250);
  };

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
        } catch (e) {}
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
      <h1>ZIVA FASHION BOUTIQUE</h1>
      <p style="text-align: center; font-size: 12px; color: #777;">Bandra, Mumbai - GSTIN 27AABCV1942A1ZX</p>
      
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
  const handleSmartBarcodeKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = barcodeInput.trim();
      if (!q) return;

      try {
        const token = localStorage.getItem('token');
        const res = await api.get(`/products/search-billing?q=${encodeURIComponent(q)}`);
        if (res.data.success) {
          const items = res.data.data;
          if (items.length === 0) {
            if (onAddNotification) onAddNotification("Not Found", "No product found for this code", "danger");
          } else if (items.length === 1 || items.find(i => i.barcode === q)) {
            // Auto add exact match or single result
            const match = items.find(i => i.barcode === q) || items[0];
            handleAddProductToCart(match);
            if (onAddNotification) onAddNotification("Added", `${match.name} added to bill`, "success");
            setBarcodeInput("");
          } else {
            // Multiple matches -> Open Selection Popup
            setDesignSelectionItems(items);
            setSelectedDesignItemIdx(0);
            setIsDesignSelectionPopupOpen(true);
          }
        }
      } catch (err) {
        console.error("Smart barcode search failed:", err);
      }
    }
  };

  const handleOpenItemSearchModal = () => {
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
        // Authenticate (in real app, use auth API, here we simulate basic check based on Owner role)
        // If successful, log audit:
        await api.post('/audit-logs/purchase-view', {
          itemViewed: infoPanelItem?.name || 'General Product',
          device: navigator.userAgent
        });
        setIsPurchaseTabUnlocked(true);
        setInfoPanelTab('Purchase');
        setIsPurchaseAuthModalOpen(false);
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
          <button
            onClick={() => setActivePOSMode("credit_notes")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "credit_notes" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Credit Notes
          </button>
          <button
            onClick={() => setActivePOSMode("debit_notes")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activePOSMode === "debit_notes" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Debit Notes
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
              <span className="text-[10px] bg-slate-800 text-white px-2 py-0.2 rounded font-mono">
                {selectedCustomerId ? `ID: ${selectedCustomerId}` : 'New/Walk-in'}
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
                            setCustomerForm({ phone: c.phone || '', name: c.name || '', email: c.email || '', dob: c.dob || '', gstin: c.gstin || c.gstNo || '', lf: '2588' });
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
                  <input type="text" className="flex-1 p-1 text-[10px] outline-none focus:bg-yellow-100 font-bold" value={customerForm.name} onChange={e => setCustomerForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Name" />
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

                {/* GST No. (Replaced Title) */}
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

                {/* Blank Space on Row 1 */}
                <div className="hidden md:block"></div>
              </div>

              {/* Row 2: Email, DOB, Points & Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 items-center pt-1 border-t border-slate-200/80">
                {/* Email */}
                <div className="flex relative items-center border border-slate-300 bg-white">
                  <span className="text-[10px] text-slate-600 bg-[#e1e1e1] border-r border-slate-300 p-1 px-2 shrink-0">Email</span>
                  <input type="email" className="flex-1 p-1 text-[10px] outline-none focus:bg-yellow-100" value={customerForm.email} onChange={e => setCustomerForm(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" />
                </div>

                {/* DOB */}
                <div className="flex relative items-center border border-slate-300 bg-white">
                  <span className="text-[10px] text-slate-600 bg-[#e1e1e1] border-r border-slate-300 p-1 px-2 shrink-0">DOB</span>
                  <input type="date" className="flex-1 p-1 text-[10px] outline-none focus:bg-yellow-100 font-semibold" value={customerForm.dob} onChange={e => setCustomerForm(prev => ({ ...prev, dob: e.target.value }))} />
                </div>

                {/* Loyalty Points */}
                <div className="flex items-center border border-slate-300 bg-slate-100">
                  <span className="text-[10px] text-slate-600 bg-[#e1e1e1] border-r border-slate-300 p-1 px-2 shrink-0">Points</span>
                  <span className="flex-1 p-1 text-[10px] font-bold text-indigo-700">
                    {customers.find(c => (c.id || c._id) === selectedCustomerId)?.loyaltyPoints || 0} pts
                  </span>
                </div>

                {/* Blank Space on Row 2 */}
                <div className="hidden md:block"></div>

                {/* Customer Actions */}
                <div className="flex gap-1.5 justify-end col-span-1 md:col-span-2">
                  <button className="px-3 py-1.5 bg-[#f0f0f0] hover:bg-[#e1e1e1] border border-slate-300 rounded text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer" onClick={handleCustomerSave}>
                    <Save className="w-3.5 h-3.5 text-green-600" />
                    <span>Save Profile</span>
                  </button>
                  <button className="px-3 py-1.5 bg-[#f0f0f0] hover:bg-[#e1e1e1] border border-slate-300 rounded text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer" onClick={() => {
                    setSelectedCustomerId("");
                    setCustomerForm({ phone: '', name: '', email: '', dob: '', gstin: '', lf: '2588' });
                    setCustomerSearchQuery("");
                  }}>
                    <X className="w-3.5 h-3.5 text-red-500" />
                    <span>New Customer</span>
                  </button>
                </div>
              </div>
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
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-24">Barcode</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-32">Item Name</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-24">Sub Item</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-24">Design No.</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-24">Item Code</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-16">Ipn</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-center w-20">Quantity</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-16">Colour (P)</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-16">Colour (S)</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-16">Size</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-20">HSN</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-right w-16">MRP</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-right w-16">Discount</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-right w-20">Rate</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-right w-20">Amount</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-24">Salesman 1</th>
                      <th className="border-r border-slate-400 font-normal p-1 text-left w-24">Salesman 2</th>
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
                      const subItemDisplay = item.subItem || item.productId?.subItem || (typeof item.category === 'string' ? item.category : item.category?.name) || '';
                      const designNoDisplay = item.designNo || item.productId?.designNo || item.sku || '';
                      const itemCodeDisplay = item.itemCode || item.productId?.itemCode || '';
                      const ipnDisplay = item.ipn || item.productId?.ipn || item.piece?.ipn || '';
                      const colorDisplay = item.primaryColor || item.color || item.productId?.primaryColor || '';
                      const secondaryColorDisplay = item.secondaryColor || item.productId?.secondaryColor || '';
                      const sizeDisplay = item.size || item.productId?.size || '';
                      const hsnDisplay = item.hsn || item.hsnCode || item.hsnId?.code || '';

                      return (
                        <tr key={idx} className="border-b border-slate-200 hover:bg-yellow-50">
                          <td className="border-r border-slate-300 p-1 text-center">{idx + 1}</td>
                          <td className="border-r border-slate-300 p-1 font-mono">{barcodeDisplay}</td>
                          <td className="border-r border-slate-300 p-1 font-semibold text-slate-800">{nameDisplay}</td>
                          <td className="border-r border-slate-300 p-1">{subItemDisplay}</td>
                          <td className="border-r border-slate-300 p-1 font-mono">{designNoDisplay}</td>
                          <td className="border-r border-slate-300 p-1 font-mono">{itemCodeDisplay}</td>
                          <td className="border-r border-slate-300 p-1 font-mono">{ipnDisplay}</td>
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
                                  const newCart = [...cart];
                                  newCart[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                                  newCart[idx].totalPrice = newCart[idx].quantity * rate;
                                  setCart(newCart);
                                }}
                                className="w-10 text-center font-bold text-xs bg-transparent border-b border-slate-400 outline-none focus:bg-yellow-100"
                              />
                              <button onClick={() => {
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
                          <td className="border-r border-slate-300 p-1">
                            <select
                              className="w-full bg-transparent border-b border-slate-300 outline-none focus:bg-yellow-100 text-[10px]"
                              value={item.salesman1 || ''}
                              onChange={(e) => {
                                const newCart = [...cart];
                                newCart[idx].salesman1 = e.target.value;
                                setCart(newCart);
                              }}
                            >
                              <option value="">-</option>
                              {staffList?.map(s => <option key={s._id || s.id} value={s.name}>{s.name}</option>)}
                            </select>
                          </td>
                          <td className="border-r border-slate-300 p-1">
                            <select
                              className="w-full bg-transparent border-b border-slate-300 outline-none focus:bg-yellow-100 text-[10px]"
                              value={item.salesman2 || ''}
                              onChange={(e) => {
                                const newCart = [...cart];
                                newCart[idx].salesman2 = e.target.value;
                                setCart(newCart);
                              }}
                            >
                              <option value="">-</option>
                              {staffList?.map(s => <option key={s._id || s.id} value={s.name}>{s.name}</option>)}
                            </select>
                          </td>
                          <td className="border-r border-slate-300 p-1">{item.uniqueCode || ''}</td>
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
                          type="text"
                          className="w-full bg-white border border-blue-300 outline-none p-1 text-xs focus:bg-yellow-100 font-bold uppercase shadow-inner"
                          placeholder="Barcode / Code"
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyDown={handleSmartBarcodeKeyDown}
                        />
                      </td>
                      {/* Item Search Input with Drop Arrow Button & Interactive Dropdown */}
                      <td className="border-r border-slate-300 p-0.5 relative" colSpan={2}>
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
                          <div className="absolute top-full left-0 w-[780px] bg-white border border-slate-300 shadow-2xl rounded-b-xl max-h-80 overflow-y-auto z-[250] text-slate-800 border-t-2 border-t-blue-600">
                            <div className="p-2 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex items-center justify-between text-xs font-bold sticky top-0 z-20 shadow-sm">
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
                                  className="text-slate-400 hover:text-white font-extrabold px-1 text-sm cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            {filteredItemSearchProducts.length === 0 ? (
                              <div className="p-6 text-center text-xs text-slate-400 font-medium bg-slate-50">No matching items found</div>
                            ) : (
                              <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-[33px] z-10 text-[10px] uppercase tracking-wider">
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
                                        className={`cursor-pointer transition-colors ${
                                          isHighlighted
                                            ? 'bg-blue-100/90 font-bold border-l-4 border-l-blue-600 text-blue-900 shadow-xs'
                                            : pIdx % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-slate-50/60 hover:bg-blue-50'
                                        }`}
                                        onClick={() => {
                                          handleAddProductToCart(p);
                                          setItemSearchInputText("");
                                          setIsItemDropdownOpen(false);
                                          if (onAddNotification) onAddNotification("Item Added", `Added ${name} to bill`, "success");
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
                                          &#8377;{Number(price).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-2 text-center">
                                          <button
                                            type="button"
                                            className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase transition-all shadow-2xs ${
                                              isHighlighted ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-800 text-white hover:bg-slate-900'
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
                            )}
                          </div>
                        )}
                      </td>

                      <td className="border-r border-slate-300 p-1 bg-slate-50/50"></td>

                      {/* Item Code (Click to Search with SEARCH placeholder & Dropdown) */}
                      <td className="border-r border-slate-300 p-0.5 relative">
                        <div className="flex items-center bg-white border border-blue-300 shadow-inner">
                          <input
                            id="itemCodeSearchInput"
                            type="text"
                            className="w-full outline-none p-1 text-xs focus:bg-yellow-100 font-bold uppercase placeholder-slate-500 font-mono cursor-pointer"
                            placeholder="SEARCH"
                            value={itemCodeSearchInput}
                            onChange={(e) => {
                              setItemCodeSearchInput(e.target.value);
                              handleOpenItemSearchModal();
                            }}
                            onFocus={() => handleOpenItemSearchModal()}
                            onClick={() => handleOpenItemSearchModal()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "ArrowDown") {
                                e.preventDefault();
                                handleOpenItemSearchModal();
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="px-1.5 py-1 text-slate-500 hover:text-indigo-600 border-l border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenItemSearchModal();
                            }}
                            title="Open Detailed Item Search List (F2)"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Dropdown list for multiple products with same/matching Item Code */}
                        {isItemCodeDropdownOpen && (
                          <div className="absolute top-full left-0 w-[780px] bg-white border border-slate-300 shadow-2xl rounded-b-xl max-h-80 overflow-y-auto z-[250] text-slate-800 border-t-2 border-t-indigo-600">
                            <div className="p-2 bg-gradient-to-r from-slate-900 to-indigo-900 text-white flex items-center justify-between text-xs font-bold sticky top-0 z-20 shadow-sm">
                              <div className="flex items-center gap-2">
                                <span className="bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider">Item Code Search</span>
                                <span>Found {filteredItemCodeProducts.length} Matching Items • Use ↑ ↓ & Enter</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsItemCodeDropdownOpen(false);
                                }}
                                className="text-slate-400 hover:text-white font-extrabold px-1 text-sm cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                            {filteredItemCodeProducts.length === 0 ? (
                              <div className="p-6 text-center text-xs text-slate-400 font-medium bg-slate-50">No items found matching item code</div>
                            ) : (
                              <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-[33px] z-10 text-[10px] uppercase tracking-wider">
                                  <tr>
                                    <th className="p-2 border-r border-slate-200">Item Code</th>
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
                                  {filteredItemCodeProducts.map((p, pIdx) => {
                                    const code = p.itemCode || p.productCode || p.sku || '-';
                                    const barcode = p.barcode || p.uniqueCode || (p.pieces && p.pieces[0]?.barcode) || '-';
                                    const name = p.itemName || p.name || 'Unnamed Item';
                                    const subItem = p.subCategory || p.subItem || p.category || '-';
                                    const size = p.size || '-';
                                    const color = p.primaryColor || p.color || '-';
                                    const price = p.sellingPrice ?? p.mrp ?? p.defaultMRP ?? 0;
                                    const stock = p.availableStock ?? p.stock ?? 0;
                                    const isHighlighted = pIdx === itemCodeHighlightedIndex;

                                    return (
                                      <tr
                                        id={`itemcode-opt-${pIdx}`}
                                        key={p._id || p.id || pIdx}
                                        className={`cursor-pointer transition-colors ${
                                          isHighlighted
                                            ? 'bg-indigo-100/90 font-bold border-l-4 border-l-indigo-600 text-indigo-900 shadow-xs'
                                            : pIdx % 2 === 0 ? 'bg-white hover:bg-indigo-50' : 'bg-slate-50/60 hover:bg-indigo-50'
                                        }`}
                                        onClick={() => {
                                          handleAddProductToCart(p);
                                          setItemCodeSearchInput("");
                                          setIsItemCodeDropdownOpen(false);
                                          if (onAddNotification) onAddNotification("Item Added", `Added ${name} to bill`, "success");
                                        }}
                                      >
                                        <td className="p-2 font-mono text-[11px] font-bold text-indigo-700 border-r border-slate-200">
                                          <span className="bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">{code}</span>
                                        </td>
                                        <td className="p-2 font-mono text-[11px] font-bold text-slate-800 border-r border-slate-200">
                                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 text-slate-700">{barcode}</span>
                                        </td>
                                        <td className="p-2 border-r border-slate-200">
                                          <div className="font-bold text-slate-900">{name}</div>
                                          {subItem !== '-' && <div className="text-[10px] text-slate-500 font-medium">{subItem}</div>}
                                        </td>
                                        <td className="p-2 text-center font-bold border-r border-slate-200 text-slate-700">{size}</td>
                                        <td className="p-2 text-center border-r border-slate-200">{color}</td>
                                        <td className="p-2 text-center border-r border-slate-200 font-mono font-bold">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${stock > 0 ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-rose-100 text-rose-800 border border-rose-200"}`}>
                                            {stock} pcs
                                          </span>
                                        </td>
                                        <td className="p-2 text-right font-mono font-black text-slate-900 text-sm border-r border-slate-200">
                                          &#8377;{Number(price).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-2 text-center">
                                          <button
                                            type="button"
                                            className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase transition-all shadow-2xs ${
                                              isHighlighted ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-800 text-white hover:bg-slate-900'
                                            }`}
                                          >
                                            + Select
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
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

                {/* Summary Block */}
                <div className="bg-white border border-slate-400 w-[400px] p-1 shadow-sm">
                  <table className="w-full text-xs font-bold text-slate-700 table-fixed">
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-1 px-2 bg-[#f0f0f0] w-24">Gross Amt</td>
                        <td className="border border-slate-300 p-1 px-2 text-right text-blue-600 w-24">{(subTotal || 0).toFixed(2)}</td>
                        <td className="border border-slate-300 p-1 px-2 bg-[#f0f0f0] w-24">Disc Amt</td>
                        <td className="border border-slate-300 p-1 px-2 text-right text-red-600 w-24">{(discountTotal || 0).toFixed(2)}</td>
                      </tr>
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
                    <div className="w-[400px] mt-1 space-y-1">
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
                    <div className="w-[400px] mt-1 space-y-1">
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

                {/* Action Toolbar */}
                <div className="flex flex-wrap gap-1 mt-1 bg-white border border-slate-400 p-1 shadow-sm">
                  {[
                    { id: "newBill", label: "New Bill (F1)", icon: <FileText className="w-5 h-5 text-blue-500 mx-auto" />, onClick: () => { setCart([]); setCustomerForm({ phone: '', name: '', email: '', dob: '', title: 'Mr.', lf: '2588' }); setSelectedCustomerId(""); } },
                    { id: "modify", label: "Alteration (Alt+A)", icon: <AlertCircle className="w-5 h-5 text-yellow-500 mx-auto" />, onClick: () => setShowAlterationModal(true) },
                    { id: "payment", label: "Payment (F6)", icon: <CreditCard className="w-5 h-5 text-green-500 mx-auto" />, onClick: handleOpenPaymentFlow },
                    { id: "save", label: "Save (F7)", icon: <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />, onClick: handleCheckoutSubmit },
                    { id: "print", label: "Print (F9)", icon: <Printer className="w-5 h-5 text-blue-600 mx-auto" />, onClick: handleOpenDraftPreview },
                    { id: "delete", label: "Delete (Alt+X)", icon: <Trash2 className="w-5 h-5 text-red-500 mx-auto" />, onClick: () => setCart([]) },
                    { id: "hold", label: "Hold (F8)", icon: <AlertCircle className="w-5 h-5 text-red-700 mx-auto" />, onClick: handleHoldBill },
                    { id: "customer", label: "Customer (F3)", icon: <User className="w-5 h-5 text-orange-500 mx-auto" />, onClick: () => { document.getElementById("mobileSearchInput")?.focus() } },
                    { id: "searchItem", label: "Search Item (F2/Space)", icon: <Search className="w-5 h-5 text-blue-400 mx-auto" />, onClick: () => setIsItemSearchModalOpen(true) },
                    { id: "itemCodeSearch", label: "Item Code (F4/I)", icon: <Search className="w-5 h-5 text-purple-600 mx-auto" />, onClick: handleFocusItemCodeSearch },
                    { id: "prevBill", label: "Previous Bill (<)", icon: <ChevronsLeft className="w-5 h-5 text-green-600 mx-auto" />, onClick: handleLoadPreviousBill },
                    { id: "nextBill", label: "Next Bill (>)", icon: <ChevronRight className="w-5 h-5 text-green-600 mx-auto" />, onClick: handleLoadNextBill },
                    { id: "enterReturns", label: "Returns (R)", icon: <RotateCcw className="w-5 h-5 text-green-600 mx-auto" />, onClick: () => setActivePOSMode("returns") },
                    { id: "config", label: "Discount (D)", icon: <AlertCircle className="w-5 h-5 text-slate-600 mx-auto" />, onClick: () => setShowDiscountSelectionModal(true) },
                    { id: "recvChallan", label: "Exchange (E)", icon: <FileText className="w-5 h-5 text-slate-600 mx-auto" />, onClick: () => setActivePOSMode("returns") },
                    { id: "adjustments", label: "Adjustments (A)", icon: <AlertCircle className="w-5 h-5 text-indigo-600 mx-auto" />, onClick: () => setShowAdjustmentModal(true) },
                    { id: "close", label: "Clear Bill (C)", icon: <X className="w-5 h-5 text-red-600 mx-auto" />, onClick: () => setCart([]) },
                    { id: "viewHolds", label: "Resume (F5)", icon: <Clock className="w-5 h-5 text-orange-600 mx-auto" />, onClick: handleResumeBill },
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
                    const isFocused = isAlterationModeActive && focusedAlterationIndex === idx;

                    const cardStyle = isFocused
                      ? (hasAlt
                          ? 'bg-emerald-100/90 border-2 border-indigo-600 ring-2 ring-indigo-500/40 shadow-md font-bold'
                          : 'bg-indigo-50/90 border-2 border-indigo-600 ring-2 ring-indigo-500/30 shadow-md font-bold')
                      : (hasAlt
                          ? 'bg-emerald-50 border-emerald-300 hover:border-emerald-400'
                          : 'bg-white border-slate-300 hover:border-slate-400');

                    return (
                      <div
                        key={idx}
                        id={`alt-panel-item-${idx}`}
                        className={`p-2 rounded border transition-all flex flex-col gap-1 cursor-pointer ${cardStyle}`}
                        onClick={() => {
                          setFocusedAlterationIndex(idx);
                          setIsAlterationModeActive(true);
                          handleOpenAlterationForCartItem(item);
                        }}
                      >
                        <div className="flex items-start gap-1.5">
                          {isFocused && (
                            <span className="text-indigo-700 font-black text-xs shrink-0 animate-pulse">➢</span>
                          )}
                          <input
                            type="checkbox"
                            checked={hasAlt}
                            onChange={(e) => {
                              e.stopPropagation();
                              setFocusedAlterationIndex(idx);
                              setIsAlterationModeActive(true);
                              handleOpenAlterationForCartItem(item);
                            }}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold truncate text-[10px] ${isFocused ? 'text-indigo-950 font-extrabold' : 'text-slate-800'}`} title={item.name}>
                              {item.name}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono">
                              Sz: {item.size || 'M'} | Col: {item.color || 'Std'} | Qty: {item.quantity}
                            </div>
                            {hasAlt && (
                              <div className="text-[9px] text-emerald-700 font-bold mt-0.5 flex items-center gap-0.5">
                                <span>✔ Ready</span>
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
                  <th className="p-3">Receipt HTML</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredHistoryInvoices.slice(0, 100).map((inv, idx) => {
                  const isReturned = inv.hasReturn || (inv.items && inv.items.some(i => i.isReturned));
                  const isExchanged = inv.hasExchange || inv.exchangeSlip || (inv.items && inv.items.some(i => i.isExchanged));
                  return (
                    <tr key={inv._id || inv.id || idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-indigo-600">
                        <div className="flex items-center gap-1.5">
                          <span className="cursor-pointer hover:underline" onClick={() => handleDownloadReceiptHTML(inv)}>
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
                        </div>
                      </td>
                      <td className="p-3">{inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                      <td className="p-3 font-medium text-slate-800">
                        {inv.customerName}
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
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadReceiptHTML(inv)}
                            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold text-xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

              {/* LEFT COLUMN: SELECTED INVOICE DETAILS & MODE SWITCHER */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:col-span-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Selected Invoice Details
                  </h4>
                  <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
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
                      onClick={() => handleDownloadReceiptHTML(selectedInvoiceForReturn)}
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
                          const isChecked = returnedItemIds.includes(item.productId || item.id);
                          return (
                            <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (!isChecked && (item.hasAlteration || !!item.alterationRecord)) {
                                      setReturnWarning({
                                        show: true,
                                        title: "Alteration Detected",
                                        message: "This item has been previously altered. By default, altered garments cannot be returned. Please consult the store owner for approval before proceeding."
                                      });
                                    }
                                    const targetId = item.productId || item.id;
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

                    {/* Refund Estimate */}
                    <div className="flex justify-between items-center bg-rose-50 p-3.5 rounded-xl border border-rose-200">
                      <span className="text-xs font-bold text-rose-900">Estimated Refund Amount:</span>
                      <span className="font-mono font-black text-rose-600 text-base">
                        ₹{(() => {
                          let rAmt = selectedInvoiceForReturn.items
                            .filter((item) => returnedItemIds.includes(item.productId || item.id))
                            .reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0);
                          if (selectedInvoiceForReturn.billAdjustment && selectedInvoiceForReturn.billAdjustment.amount > 0) {
                            const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || i.price * i.quantity), 0) || 1;
                            const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
                            const proportionalAdjustment = rAmt * adjustmentRatio;
                            if (selectedInvoiceForReturn.billAdjustment.operation === 'Discount') rAmt -= proportionalAdjustment;
                            else if (selectedInvoiceForReturn.billAdjustment.operation === 'Charge') rAmt += proportionalAdjustment;
                            rAmt = Math.floor(rAmt);
                          }
                          return rAmt.toLocaleString();
                        })()}
                      </span>
                    </div>

                    {/* Advance / Wallet Logic */}
                    <label className="flex items-center gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={returnRefundTotalAmount}
                        onChange={(e) => {
                          setReturnRefundTotalAmount(e.target.checked);
                          if (e.target.checked) setReturnAdvanceAmount("");
                        }}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                      />
                      <span>Refund total amount? (Untick to save partially to Customer Advance/Wallet)</span>
                    </label>

                    {!returnRefundTotalAmount && (
                      <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between animate-fade-in">
                        <span className="text-xs font-bold text-indigo-900">Advance Amount (Save to Wallet)</span>
                        <input
                          type="number"
                          value={returnAdvanceAmount}
                          onChange={(e) => setReturnAdvanceAmount(e.target.value)}
                          placeholder="0"
                          className="w-32 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-right font-mono font-bold text-indigo-700 outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    {/* Mandatory Approval Checkbox */}
                    <label className="flex items-center gap-2.5 bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-900 text-xs font-semibold cursor-pointer">
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
                      disabled={!returnApprovedCheckbox || returnedItemIds.length === 0}
                      onClick={async () => {
                        const finalReason = returnReason === "Other" ? returnCustomReason : returnReason;
                        const returnedItems = selectedInvoiceForReturn.items.filter(item => returnedItemIds.includes(item.productId || item.id));
                        let refundAmt = returnedItems.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0);

                        if (selectedInvoiceForReturn.billAdjustment && selectedInvoiceForReturn.billAdjustment.amount > 0) {
                          const totalItemsPrice = selectedInvoiceForReturn.items.reduce((s, i) => s + (i.totalPrice || i.price * i.quantity), 0) || 1;
                          const adjustmentRatio = selectedInvoiceForReturn.billAdjustment.amount / totalItemsPrice;
                          const proportionalAdjustment = refundAmt * adjustmentRatio;
                          if (selectedInvoiceForReturn.billAdjustment.operation === 'Discount') refundAmt -= proportionalAdjustment;
                          else if (selectedInvoiceForReturn.billAdjustment.operation === 'Charge') refundAmt += proportionalAdjustment;
                          refundAmt = Math.floor(refundAmt);
                        }

                        const updatedItems = selectedInvoiceForReturn.items.map(item => {
                          if (returnedItemIds.includes(item.productId || item.id)) {
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

                        // Call Backend API to update MongoDB invoice, inventory & customer ledger
                        try {
                          const token = localStorage.getItem("token");
                          const invId = selectedInvoiceForReturn._id || selectedInvoiceForReturn.id || selectedInvoiceForReturn.invoiceNo;
                          await api.post(`/invoices/${invId}/return`, {
                            returnedItemIds,
                            returnReason: finalReason,
                            refundMethod: "Cash",
                            advanceAmount: !returnRefundTotalAmount ? (Number(returnAdvanceAmount) || 0) : 0
                          });
                        } catch (apiErr) {
                          console.warn("Backend return endpoint call error:", apiErr.message);
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
                      }}
                      className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${returnApprovedCheckbox && returnedItemIds.length > 0 ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                      Approve Return & Credit Customer Wallet
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

                    {/* Step A: Select Item from Original Invoice to Exchange */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        1. Select Item from Invoice to Return / Swap Out:
                      </label>
                      <select
                        value={exchangeOldItemIdx}
                        onChange={(e) => {
                          const idx = Number(e.target.value);
                          const item = selectedInvoiceForReturn.items[idx];
                          if (item && (item.hasAlteration || !!item.alterationRecord)) {
                            setReturnWarning({
                              show: true,
                              title: "Alteration Detected",
                              message: "This item has been previously altered. By default, altered garments cannot be exchanged. Please consult the store owner for approval before proceeding."
                            });
                          }
                          setExchangeOldItemIdx(idx);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {selectedInvoiceForReturn.items.map((item, idx) => (
                          <option key={idx} value={idx}>
                            {item.name} ({item.size || 'M'}/{item.color || 'Std'}) — ₹{(item.totalPrice || item.price * item.quantity).toLocaleString()}
                          </option>
                        ))}
                      </select>
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
                            if (match) setExchangeSelectedNewProduct(match);
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
                                  setExchangeSelectedNewProduct(p);
                                  setExchangeNewSearchQuery(`${p.name} (${p.size || 'M'}/${p.color || 'Std'})`);
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

                    {/* Selected New Product Card */}
                    {exchangeSelectedNewProduct && (
                      <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 flex justify-between items-center text-xs">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-indigo-500">Selected New Exchanged Item:</p>
                          <p className="font-extrabold text-slate-900">{exchangeSelectedNewProduct.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            SKU/ID: {exchangeSelectedNewProduct.productCode || exchangeSelectedNewProduct.barcode || exchangeSelectedNewProduct.id} | Size: {exchangeSelectedNewProduct.size || 'M'} / {exchangeSelectedNewProduct.color || 'Std'}
                          </p>
                        </div>
                        <span className="font-mono font-black text-indigo-700 text-sm">
                          ₹{(exchangeSelectedNewProduct.sellingPrice || exchangeSelectedNewProduct.price || 0).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Price Difference Summary */}
                    {(() => {
                      const oldItem = selectedInvoiceForReturn.items[exchangeOldItemIdx] || selectedInvoiceForReturn.items[0];
                      const oldPrice = oldItem ? (oldItem.totalPrice || oldItem.price * oldItem.quantity) : 0;
                      const newPrice = exchangeSelectedNewProduct ? (exchangeSelectedNewProduct.sellingPrice || exchangeSelectedNewProduct.price || 0) : 0;
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
                      disabled={!exchangeSelectedNewProduct}
                      onClick={async () => {
                        const oldItem = selectedInvoiceForReturn.items[exchangeOldItemIdx] || selectedInvoiceForReturn.items[0];
                        if (!oldItem || !exchangeSelectedNewProduct) return;

                        const oldPrice = oldItem.totalPrice || (oldItem.price * oldItem.quantity);
                        const newPrice = (exchangeSelectedNewProduct.sellingPrice || exchangeSelectedNewProduct.price || 0);
                        const priceDiff = newPrice - oldPrice;

                        const docket = {
                          docketNo: `EXCH-${Date.now().toString().slice(-6)}`,
                          originalInvoiceNo: selectedInvoiceForReturn.invoiceNo,
                          customerName: selectedInvoiceForReturn.customerName,
                          customerPhone: selectedInvoiceForReturn.customerPhone,
                          reason: exchangeReason,
                          oldItem: {
                            name: oldItem.name,
                            size: oldItem.size || 'Std',
                            color: oldItem.color || 'Std',
                            price: oldPrice
                          },
                          newItem: {
                            name: exchangeSelectedNewProduct.name,
                            sku: exchangeSelectedNewProduct.sku || exchangeSelectedNewProduct.productCode || exchangeSelectedNewProduct.id,
                            size: exchangeSelectedNewProduct.size || 'M',
                            color: exchangeSelectedNewProduct.color || 'Standard',
                            price: newPrice
                          },
                          priceDiff,
                          cashierName: currentUser ? currentUser.name : "Store Cashier",
                          createdAt: new Date().toISOString()
                        };

                        const updatedItems = selectedInvoiceForReturn.items.map((item, idx) => {
                          if (idx === exchangeOldItemIdx) {
                            return {
                              ...item,
                              isExchanged: true,
                              exchangedFor: exchangeSelectedNewProduct.name,
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
                          await api.post(`/invoices/${invId}/exchange`, {
                            oldItemIdx: exchangeOldItemIdx,
                            exchangeReason,
                            newItem: exchangeSelectedNewProduct
                          });
                        } catch (apiErr) {
                          console.warn("Backend exchange endpoint call error:", apiErr.message);
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
                        setExchangeSelectedNewProduct(null);
                        setExchangeNewSearchQuery("");
                        setReturnSearchQuery("");
                      }}
                      className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${exchangeSelectedNewProduct ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                      Generate Exchange Slip & Invoice
                    </button>
                  </div>
                )}

              </div>
            </div>
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
                          Target Invoice: INV-2026-LIVE
                        </span>
                        <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                          {activeCustomer.name} ({activeCustomer.phone})
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

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Expected Trial Date</label>
                      <input
                        type="date"
                        value={altTrialDate}
                        onChange={(e) => setAltTrialDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
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
                  <span>Save Alteration Record</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
              <div className="text-center font-bold text-slate-900 text-sm">
                ZIVA FASHION BOUTIQUE
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
                        <h2 style="margin:0;">ZIVA FASHION BOUTIQUE</h2>
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
                        <p style="font-size:10px; margin:0;">Thank you for shopping with Ziva Boutique!</p>
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
                        <div className="grid grid-cols-4 gap-1 bg-slate-200 p-0.5 rounded-lg">
                          {[
                            { id: 'General', label: '🛈 General' },
                            { id: 'Stock', label: '📦 Stock' },
                            { id: 'Purchase', label: '🛒 Purchase' },
                            { id: 'Sales', label: '📈 Sales' }
                          ].map(t => (
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
                              <div className="text-[10px] uppercase font-bold text-slate-405 border-b border-slate-100 pb-1">🛈 General Details</div>
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

      {/* PROFESSIONAL PAYMENT QUICK TAB LOADER OVERLAY */}
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
                {["Cash", "Card", "UPI", "Advance", "Due", "Gift Voucher", "Credit Note", "Points Redeem", "Other"].map(method => (
                  <button
                    key={method}
                    onClick={() => {
                      setPaymentMethod(method);
                      if (paymentType === 'Part Payment' && method !== 'Cash' && method !== 'Advance') {
                        setPartPaymentAmounts(p => {
                          if (!p[method]) {
                            const cashTot = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                            const otherTot = ["Card", "UPI", "Advance", "Due", "Gift Voucher", "Credit Note", "Points Redeem", "Other"].reduce((acc, m) => m === method ? acc : acc + (Number(p[m]) || 0), 0);
                            const remaining = Math.max(0, Number((grandTotal - cashTot - otherTot).toFixed(2)));
                            if (remaining > 0) return { ...p, [method]: remaining.toString() };
                          }
                          return p;
                        });
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
                            onClick={() => {
                              if (btn === 'Pay') {
                                const cashTot = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                                if (paymentType === 'Full Payment' && cashTot < grandTotal) {
                                  setPaymentWarning(`Paid amount (₹${cashTot}) is less than Bill Amount (₹${grandTotal}).\n\nPlease select "Part Payment" to add Due amount or select multiple methods.`);
                                  return;
                                }
                                setShowPaymentModal(false);
                                handlePrintConfirm();
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
                              onChange={(e) => setPartPaymentAmounts(p => ({ ...p, Advance: e.target.value }))}
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
                            onClick={() => {
                              if (btn === 'Pay') {
                                if (paymentType === 'Full Payment') {
                                  setShowPaymentModal(false);
                                  handlePrintConfirm();
                                  return;
                                }
                                const cashTot = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                                const partTot = cashTot + ["Card", "UPI", "Advance", "Due", "Gift Voucher", "Credit Note", "Points Redeem", "Other"].reduce((acc, m) => acc + (Number(partPaymentAmounts[m]) || 0), 0);
                                if (partTot < grandTotal) {
                                  setPaymentWarning(`Total Distributed Amount (₹${partTot}) does not match Bill Amount (₹${grandTotal})!`);
                                  return;
                                }
                                setShowPaymentModal(false);
                                handlePrintConfirm();
                              } else if (paymentType === 'Part Payment' && ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '.'].includes(btn)) {
                                setPartPaymentAmounts(p => ({ ...p, Advance: (p.Advance?.toString() || '') + btn }));
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
                        const otherTot = ["Card", "UPI", "Advance", "Due", "Gift Voucher", "Credit Note", "Points Redeem", "Other"].reduce((acc, m) => m === 'Advance' ? acc : acc + (Number(partPaymentAmounts[m]) || 0), 0);
                        const remainingUnpaidAdv = Math.max(0, Number((grandTotal - cashTot - otherTot).toFixed(2)));
                        const advVal = Number(partPaymentAmounts["Advance"]) || 0;
                        const displayAdvVal = paymentType === 'Full Payment' ? grandTotal : (advVal > 0 ? advVal : remainingUnpaidAdv);

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (paymentType === 'Part Payment') {
                                if (advVal <= 0 && remainingUnpaidAdv > 0) {
                                  setPartPaymentAmounts(p => ({ ...p, Advance: remainingUnpaidAdv.toString() }));
                                }
                              }
                            }}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold uppercase text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" /> Pay Advance (&#8377;{displayAdvVal.toLocaleString('en-IN')})
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
                              onChange={(e) => setPartPaymentAmounts(p => ({ ...p, [paymentMethod]: e.target.value }))}
                              className="text-2xl font-black font-mono text-slate-800 bg-transparent text-right outline-none w-32 border-b-2 border-transparent focus:border-indigo-400"
                              placeholder="0"
                            />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 w-full">
                        <button onClick={() => { if (paymentType === 'Part Payment') setPartPaymentAmounts(p => ({ ...p, [paymentMethod]: '' })) }} className={`col-span-2 py-3 bg-red-100 hover:bg-red-200 border border-red-200 rounded font-bold text-red-700 shadow-sm active:scale-95 transition-transform text-lg cursor-pointer ${paymentType === 'Full Payment' ? 'opacity-50 cursor-not-allowed' : ''}`}>CLR</button>
                        <button onClick={() => { if (paymentType === 'Part Payment') setPartPaymentAmounts(p => ({ ...p, [paymentMethod]: (p[paymentMethod]?.toString() || '').slice(0, -1) })) }} className={`col-span-2 py-3 bg-orange-100 hover:bg-orange-200 border border-orange-200 rounded font-bold text-orange-700 shadow-sm active:scale-95 transition-transform text-lg cursor-pointer ${paymentType === 'Full Payment' ? 'opacity-50 cursor-not-allowed' : ''}`}>BCK</button>

                        {['7', '8', '9', '+', '4', '5', '6', '-', '1', '2', '3', '=', '0', '00', '.', 'Pay'].map((btn, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (btn === 'Pay') {
                                if (paymentType === 'Full Payment') {
                                  setShowPaymentModal(false);
                                  handlePrintConfirm();
                                  return;
                                }
                                const cashTot = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                                const partTot = cashTot + ["Card", "UPI", "Advance", "Due", "Gift Voucher", "Credit Note", "Points Redeem", "Other"].reduce((acc, m) => acc + (Number(partPaymentAmounts[m]) || 0), 0);
                                if (partTot < grandTotal) {
                                  setPaymentWarning(`Total Distributed Amount (₹${partTot}) does not match Bill Amount (₹${grandTotal})!`);
                                  return;
                                }
                                setShowPaymentModal(false);
                                handlePrintConfirm();
                              } else if (paymentType === 'Part Payment' && ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '.'].includes(btn)) {
                                setPartPaymentAmounts(p => {
                                  const curr = p[paymentMethod]?.toString() || '';
                                  if (btn === '.' && curr.includes('.')) return p;
                                  return { ...p, [paymentMethod]: curr + btn };
                                });
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
                        const otherTot = ["Card", "UPI", "Advance", "Due", "Gift Voucher", "Credit Note", "Points Redeem", "Other"].reduce((acc, m) => m === paymentMethod ? acc : acc + (Number(partPaymentAmounts[m]) || 0), 0);
                        const remainingUnpaidMode = Math.max(0, Number((grandTotal - cashTot - otherTot).toFixed(2)));
                        const currentVal = Number(partPaymentAmounts[paymentMethod]) || 0;
                        const displayVal = paymentType === 'Full Payment' ? grandTotal : (currentVal > 0 ? currentVal : remainingUnpaidMode);

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (paymentType === 'Part Payment') {
                                let newPart = { ...partPaymentAmounts };
                                if (currentVal <= 0 && remainingUnpaidMode > 0) {
                                  newPart[paymentMethod] = remainingUnpaidMode.toString();
                                  setPartPaymentAmounts(newPart);
                                }
                                const currentAllocated = cashTot + ["Card", "UPI", "Advance", "Due", "Gift Voucher", "Credit Note", "Points Redeem", "Other"].reduce((acc, m) => acc + (Number(newPart[m]) || 0), 0);
                                if (currentAllocated >= grandTotal) {
                                  setShowPaymentModal(false);
                                  handlePrintConfirm();
                                }
                              }
                            }}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold uppercase text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" /> Pay {paymentMethod} (&#8377;{displayVal.toLocaleString('en-IN')})
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
                      const rows = [
                        { label: "Cash", val: paymentType === 'Full Payment' ? (paymentMethod === 'Cash' ? cashTotal : 0) : cashTotal },
                        { label: "Card", val: paymentType === 'Full Payment' ? (paymentMethod === 'Card' ? grandTotal : 0) : (Number(partPaymentAmounts['Card']) || 0) },
                        { label: "UPI", val: paymentType === 'Full Payment' ? (paymentMethod === 'UPI' ? grandTotal : 0) : (Number(partPaymentAmounts['UPI']) || 0) },
                        { label: "Advance Used", val: paymentType === 'Full Payment' ? (paymentMethod === 'Advance' ? grandTotal : 0) : (Number(partPaymentAmounts['Advance']) || 0) },
                        { label: "Points Redeem", val: paymentType === 'Full Payment' ? (paymentMethod === 'Points Redeem' ? grandTotal : 0) : (Number(partPaymentAmounts['Points Redeem']) || 0) },
                        { label: "Due Balance", val: paymentType === 'Full Payment' ? (paymentMethod === 'Due' ? grandTotal : 0) : (Number(partPaymentAmounts['Due']) || 0) },
                        { label: "Gift Voucher / Other", val: (Number(partPaymentAmounts['Gift Voucher']) || 0) + (Number(partPaymentAmounts['Credit Note']) || 0) + (Number(partPaymentAmounts['Other']) || 0) },
                      ];
                      return rows.map((row, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-600 text-[11px]">
                          <span>{row.label}</span>
                          <span className={row.val > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>₹{row.val.toLocaleString()}</span>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Summary Totals Footer */}
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    {(() => {
                      const cashTotal = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                      const partTotal = cashTotal + ["Card", "UPI", "Advance", "Due", "Gift Voucher", "Credit Note", "Points Redeem", "Other"].reduce((acc, m) => acc + (Number(partPaymentAmounts[m]) || 0), 0);
                      const totalPaidDisplay = paymentType === 'Full Payment' ? (paymentMethod === 'Cash' ? cashTotal : grandTotal) : partTotal;
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
                    disabled={isSavingPayment}
                    onClick={async () => {
                      if (isSavingPayment) return;
                      const cashTotal = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                      const partTotal = cashTotal + ["Card", "UPI", "Advance", "Due", "Gift Voucher", "Credit Note", "Points Redeem", "Other"].reduce((acc, m) => acc + (Number(partPaymentAmounts[m]) || 0), 0);
                      if (paymentType === 'Full Payment' && paymentMethod === 'Cash' && cashTotal < grandTotal) {
                        setPaymentWarning(`Paid amount (₹${cashTotal}) is less than Bill Amount (₹${grandTotal}).\n\nPlease select "Part Payment" to split or add to Due.`);
                        return;
                      }
                      if (paymentType === 'Part Payment' && partTotal < grandTotal) {
                        setPaymentWarning(`Total Distributed Amount (₹${partTotal}) does not match Bill Amount (₹${grandTotal})!`);
                        return;
                      }
                      setIsSavingPayment(true);
                      try {
                        setShowPaymentModal(false);
                        await handlePrintConfirm();
                      } finally {
                        setIsSavingPayment(false);
                      }
                    }}
                    className="w-full py-3 bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-300 text-slate-700 rounded font-bold uppercase text-xs shadow-sm cursor-pointer transition-colors"
                  >
                    <Save className="w-4 h-4 inline mr-2" /> {isSavingPayment ? "Saving Payment..." : "Save Payment"}
                  </button>
                  <button
                    disabled={isSavingPayment}
                    onClick={async () => {
                      if (isSavingPayment) return;
                      const cashTotal = [500, 200, 100, 50, 20, 10, 5, 2, 1].reduce((acc, note) => acc + (Number(cashDenominations[note]) || 0) * note, 0);
                      const partTotal = cashTotal + ["Card", "UPI", "Advance", "Due", "Gift Voucher", "Credit Note", "Points Redeem", "Other"].reduce((acc, m) => acc + (Number(partPaymentAmounts[m]) || 0), 0);
                      if (paymentType === 'Full Payment' && paymentMethod === 'Cash' && cashTotal < grandTotal) {
                        setPaymentWarning(`Paid amount (₹${cashTotal}) is less than Bill Amount (₹${grandTotal}).\n\nPlease select "Part Payment" to split or add to Due.`);
                        return;
                      }
                      if (paymentType === 'Part Payment' && partTotal < grandTotal) {
                        setPaymentWarning(`Total Distributed Amount (₹${partTotal}) does not match Bill Amount (₹${grandTotal})!`);
                        return;
                      }
                      setIsSavingPayment(true);
                      try {
                        setShowPaymentModal(false);
                        await handlePrintConfirm();
                      } finally {
                        setIsSavingPayment(false);
                      }
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-black uppercase text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Printer className="w-5 h-5" /> {isSavingPayment ? "Saving & Printing..." : "Save & Print Bill"}
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
                  type="text"
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

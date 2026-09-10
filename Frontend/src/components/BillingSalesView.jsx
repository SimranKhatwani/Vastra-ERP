import api from '../api/axios';
import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  X,
  Printer,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  ShoppingCart,
  QrCode,
  Smartphone,
  CreditCard,
  Coins,
  Percent,
  Calculator,
  UserCheck,
  Award,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Users,
  Loader2,
  Tag
} from "lucide-react";
import { generateReceiptHTMLContent } from '../helpers/printTemplate.helper';

const extractBillsArray = (resData) => {
  if (!resData) return [];
  if (Array.isArray(resData.data)) return resData.data;
  if (resData.data && Array.isArray(resData.data.bills)) return resData.data.bills;
  if (Array.isArray(resData.bills)) return resData.bills;
  if (Array.isArray(resData)) return resData;
  return [];
};

const normalizeInvoice = (b) => {
  if (!b) return null;
  const billId = b._id || b.id;
  const rawItems = (Array.isArray(b.items) && b.items.length > 0)
    ? b.items
    : (Array.isArray(b.saleItems) ? b.saleItems : (b.billItems || []));
  const custName = b.customerId?.name || b.customerName || b.customer?.name || b.pssmRecord?.customerName || "Walk-in";
  const custPhone = b.customerId?.phone || b.customerPhone || b.customer?.phone || b.pssmRecord?.customerPhone || "";

  return {
    ...b,
    id: billId,
    _id: billId,
    invoiceNo: b.billNo || b.invoiceNo || `BILL-${billId}`,
    billNo: b.billNo || b.invoiceNo || `BILL-${billId}`,
    date: b.billDate || b.date || b.createdAt,
    customerName: custName,
    customerPhone: custPhone,
    customerId: b.customerId?._id || b.customerId?.id || b.customerId,
    items: rawItems.map(i => ({
      ...i,
      id: i._id || i.id,
      name: i.name || i.productName || i.itemName || i.barcode || "Garment Item",
      price: i.sellingPrice || i.price || i.mrp || 0,
      quantity: i.quantity || i.qty || 1,
      sellingPrice: i.sellingPrice || i.price || 0,
      discountAmount: i.discountAmount || 0,
      finalPrice: i.finalPrice || ((i.sellingPrice || i.price || 0) - (i.discountAmount || 0)),
      hasAlteration: Boolean(i.hasAlteration || i.alterationRecord || i.alterationId || (i.alterationStatus && i.alterationStatus !== 'NONE')),
      alterationStatus: i.alterationStatus || (i.hasAlteration ? 'PENDING' : 'NONE'),
      alterationRecord: i.alterationRecord
    })),
    hasAlteration: Boolean(b.hasAlteration || b.alterationBill || b.hasPSSM || b.pssmRecord || rawItems.some(i => i.hasAlteration || i.alterationRecord || i.alterationId || (i.alterationStatus && i.alterationStatus !== 'NONE'))),
    alterationBill: b.alterationBill || null,
    hasPSSM: Boolean(b.hasPSSM || b.pssmRecord || b.pssmNo),
    pssmNo: b.pssmNo || b.pssmRecord?.pssmNo || null,
    pssmStatus: b.pssmStatus || b.pssmRecord?.status || null,
    pssmRecord: b.pssmRecord || null,
    billBarcode: b.billBarcode || b.billNo || b.invoiceNo || `BILL-${billId}`,
    subTotal: b.subTotal || b.grandTotal || 0,
    discount: b.discountAmount || b.discount || 0,
    grandTotal: b.grandTotal || b.totalAmount || 0,
    amountPaid: b.paidAmount ?? b.amountPaid ?? b.grandTotal,
    dueAmount: b.dueAmount || 0,
    advanceApplied: b.advanceApplied || 0,
    paymentMethod: b.paymentMethod || (b.paymentTransactions && b.paymentTransactions.length > 0 ? b.paymentTransactions.map(t => t.mode).join(' + ') : (b.dueAmount > 0 ? "Credit" : "Cash")),
    splitPayments: b.splitPayments || (b.paymentTransactions ? b.paymentTransactions.map(t => ({ method: t.mode, amount: t.amount })) : undefined),
    paymentTransactions: b.paymentTransactions,
    status: b.status || "Completed"
  };
};

export const BillingSalesView = ({
  products = [],
  customers = [],
  employees = [],
  invoices = [],
  isLoadingInvoices = false,
  isLoadingProducts = false,
  onAddNotification
}) => {
  const [activeTab, setActiveTab] = useState("wholesale-billing");

  // Cart & Invoice states
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [salespersonId, setSalespersonId] = useState("");
  const [manualSalespersonName, setManualSalespersonName] = useState("");
  const [manualCgstTotal, setManualCgstTotal] = useState("");
  const [manualSgstTotal, setManualSgstTotal] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState(0);

  // Search references for keyboard hotkey
  const searchInputRef = useRef(null);

  // Split payment amounts
  const [splitCash, setSplitCash] = useState(0);
  const [splitUPI, setSplitUPI] = useState(0);
  const [splitCard, setSplitCard] = useState(0);

  // Lookup data
  const [dealers, setDealers] = useState([
    { id: "d-1", name: "Apex Garment Distributors", company: "Apex Retail Pvt Ltd", gstin: "27AAAAA1111A1Z1", creditLimit: 250000, outstanding: 120000 },
    { id: "d-2", name: "Heritage Lifestyle India", company: "Heritage Styles LLC", gstin: "27BBBBB2222B2Z2", creditLimit: 500000, outstanding: 340000 }
  ]);

  // Tax rates (CGST & SGST configurations)
  const [cgstRate, setCgstRate] = useState(0);
  const [sgstRate, setSgstRate] = useState(0);

  // GST overrides states
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideItemIndex, setOverrideItemIndex] = useState(null);
  const [ovCgstRate, setOvCgstRate] = useState(5);
  const [ovSgstRate, setOvSgstRate] = useState(5);
  const [ovIgstRate, setOvIgstRate] = useState(0);
  const [ovHsn, setOvHsn] = useState("6109");
  const [ovReason, setOvReason] = useState("");
  const [gstModifications, setGstModifications] = useState([]);

  // Wholesale specific states
  const [selectedDealerId, setSelectedDealerId] = useState("");
  const [lrNumber, setLrNumber] = useState("");
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [transportDetails, setTransportDetails] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");

  // B2B specific states
  const [companyGstin, setCompanyGstin] = useState("27GGGGG8888G8Z8");
  const [billingAddress, setBillingAddress] = useState("Boutique Plaza, Link Road, Bandra West, Mumbai");
  const [shippingAddress, setShippingAddress] = useState("Thane Logistics Hub, Warehouse A, Thane");
  const [stateCode, setStateCode] = useState("27 (MH)");

  // Invoice History States & Fetcher
  const [invoicesList, setInvoicesList] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pssSlipModalData, setPssSlipModalData] = useState(null);

  const handleOpenInvoiceReceipt = (inv) => {
    try {
      const html = generateReceiptHTMLContent(inv);
      const url = URL.createObjectURL(new Blob(['\ufeff' + html], { type: 'text/html;charset=utf-8' }));
      window.open(url, '_blank');
    } catch (e) {
      if (onAddNotification) onAddNotification("Error", "Failed to generate invoice receipt", "danger");
    }
  };

  const handleOpenPSSSlip = async (inv) => {
    if (!inv) return;
    try {
      const barcodeToSearch = inv.billBarcode || inv.invoiceNo || inv.billNo;
      const res = await api.get(`/pssm/barcode/${encodeURIComponent(barcodeToSearch)}`);
      if (res.data?.success && res.data.data?.pssm) {
        const pssm = res.data.data.pssm;
        const items = res.data.data.items || [];
        setPssSlipModalData({
          pssmNo: pssm.pssmNo,
          originalInvoiceNo: pssm.billNo || inv.invoiceNo,
          billBarcode: pssm.billBarcode || barcodeToSearch,
          customerName: pssm.customerName || inv.customerName,
          customerPhone: pssm.customerPhone || inv.customerPhone,
          salesmanName: pssm.salesmanName || inv.salesmanName || 'Sales Staff',
          customerWaitingOption: pssm.customerWaitingOption || 'Will Come Later',
          priority: pssm.priority || 'NORMAL',
          status: pssm.status || 'PENDING_ASSIGNMENT',
          deliveryDate: pssm.expectedDeliveryDate,
          items: items.map(it => ({
            _id: it._id,
            name: it.productName || it.pieceName,
            size: it.size,
            color: it.color,
            barcode: it.barcode || it.uniqueCode,
            serviceType: it.serviceType || 'Alteration',
            status: it.status || 'PENDING_ASSIGNMENT',
            assignedTo: it.assignedTo || 'Pending Assignment',
            alterationDetails: it.alterationDetails || [],
            instructions: it.instructions || ''
          })),
          createdAt: pssm.createdAt
        });
      } else if (inv.pssmRecord) {
        setPssSlipModalData(inv.pssmRecord);
      } else {
        if (onAddNotification) onAddNotification("PSS Info", "No active PSS record found for this invoice.", "info");
      }
    } catch (e) {
      if (inv.pssmRecord) {
        setPssSlipModalData(inv.pssmRecord);
      } else {
        if (onAddNotification) onAddNotification("Error", "Could not load PSS details.", "danger");
      }
    }
  };

  const handleCollectPSSItemFromSlip = async (itemId = null) => {
    if (!pssSlipModalData || !pssSlipModalData.billBarcode) return;
    try {
      const res = await api.post('/pssm/collection', {
        billBarcode: pssSlipModalData.billBarcode,
        itemIds: itemId ? [itemId] : []
      });
      if (res.data?.success && res.data.data?.pssm) {
        const pssm = res.data.data.pssm;
        const items = res.data.data.items || [];
        const allItemsCollected = items.length > 0 && items.every(it => it.status === 'COLLECTED' || it.status === 'CLOSED');
        const computedStatus = (allItemsCollected || pssm.status === 'CLOSED' || pssm.status === 'COLLECTED') ? 'CLOSED' : (pssm.status || 'PENDING');

        const updatedSlip = {
          ...pssSlipModalData,
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
        setPssSlipModalData(updatedSlip);

        // Update invoices state in real-time
        setInvoices(prev => (prev || []).map(i => {
          const isMatch = (i.invoiceNo && (i.invoiceNo === pssSlipModalData.originalInvoiceNo || i.invoiceNo === pssSlipModalData.billBarcode)) ||
                          (i.billNo && (i.billNo === pssSlipModalData.originalInvoiceNo || i.billNo === pssSlipModalData.billBarcode)) ||
                          (i.billBarcode && (i.billBarcode === pssSlipModalData.billBarcode || i.billBarcode === pssSlipModalData.originalInvoiceNo)) ||
                          (i.pssmNo && (i.pssmNo === pssm.pssmNo || i.pssmNo === pssSlipModalData.pssmNo));
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

  // Credit Limit Override Authorization Modal states
  const [showCreditOverrideModal, setShowCreditOverrideModal] = useState(false);
  const [overrideUsername, setOverrideUsername] = useState("");
  const [overridePassword, setOverridePassword] = useState("");
  const [isOverrideApproved, setIsOverrideApproved] = useState(false);

  // Outstanding Receivables States
  const [outstandingInvoices, setOutstandingInvoices] = useState([]);
  const [receivablesSearch, setReceivablesSearch] = useState("");
  const [receivablesStatusFilter, setReceivablesStatusFilter] = useState("All");
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionInvoice, setCollectionInvoice] = useState(null);
  const [collectAmount, setCollectAmount] = useState(0);
  const [collectMode, setCollectMode] = useState("Cash");
  const [collectRemarks, setCollectRemarks] = useState("");
  const [collectRef, setCollectRef] = useState("");

  const fetchInvoicesHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await api.get(`/billing`);
      const fetched = extractBillsArray(res.data);
      const normalized = fetched.map(i => normalizeInvoice(i)).filter(Boolean);
      if (normalized.length > 0) {
        setInvoicesList(normalized);
        setOutstandingInvoices(normalized.filter(inv => inv.dueAmount > 0));
      }
    } catch (err) {
      console.error("Failed to fetch invoice history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (Array.isArray(invoices) && invoices.length > 0) {
      setInvoicesList(invoices);
      setOutstandingInvoices(invoices.filter(inv => inv.dueAmount > 0));
    }
  }, [invoices]);

  useEffect(() => {
    if (activeTab === "invoice-history" || activeTab === "outstanding-receivables") {
      fetchInvoicesHistory();
    }
  }, [activeTab]);

  // Fetch Default config
  const fetchTaxConfig = async () => {
    try {
      setCgstRate(0);
      setSgstRate(0);
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTaxConfig();
    fetchActiveRules();
  }, []);



  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      }
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        handleResetInvoice();
        onAddNotification("New Invoice", "Cart cleared and initialized.", "info");
      }
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleCheckoutSubmit();
      }
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        window.print();
      }
      if (e.key === "Escape") {
        setShowOverrideModal(false);
        setShowCreditOverrideModal(false);
        setShowCollectionModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, selectedCustomerId, paymentMethod, amountPaid, activeTab, cgstRate, sgstRate, isOverrideApproved]);

  // Reset invoice details
  const handleResetInvoice = () => {
    setCart([]);
    setSelectedCustomerId("");
    setManualCustomerName("");
    setSalespersonId("");
    setManualSalespersonName("");
    setManualCgstTotal("");
    setManualSgstTotal("");
    setAmountPaid(0);
    setGstModifications([]);
    setSelectedDealerId("");
    setLrNumber("");
    setEwayBillNo("");
    setTransportDetails("");
    setIsOverrideApproved(false);
  };

  // Add Item to cart
  const handleAddItem = (productId) => {
    const prod = products.find(p => p.id === productId || p._id === productId);
    if (!prod) return;

    // Check if item already in cart
    const existingIdx = cart.findIndex(item => item.productId === prod._id);
    if (existingIdx > -1) {
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          productId: prod._id,
          name: prod.name,
          sku: prod.sku,
          quantity: 1,
          price: prod.sellingPrice || prod.price || 0,
          discount: 0,
          gstPercent: prod.gstPercent || 0
        }
      ]);
    }
  };

  const handleRemoveItem = (idx) => {
    const updated = [...cart];
    updated.splice(idx, 1);
    setCart(updated);
  };

  // Calculate Subtotals & Taxes
  const { subTotal, discountTotal, taxTotal, grandTotal, autoOffer } = React.useMemo(() => {
    let subTotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    cart.forEach(item => {
      const sub = item.price * item.quantity;
      const disc = sub * (item.discount / 100);
      const taxable = sub - disc;
      const gst = taxable * (item.gstPercent / 100);

      subTotal += sub;
      discountTotal += disc;
      taxTotal += gst;
    });

    // Check dynamic rules (Status Active + date validity checks)
    const activeOffers = discountRules.filter(r => {
      if (r.status !== 'Active') return false;
      const now = new Date();
      if (new Date(r.startDate) > now || new Date(r.endDate) < now) return false;
      return true;
    });

    let autoDiscountAmt = 0;
    let appliedOffer = null;

    activeOffers.forEach(r => {
      let disc = 0;
      if (r.offerType === 'Automatic' && subTotal >= r.minBillAmount) {
        disc = r.discountType === 'Flat' ? r.discountValue : subTotal * (r.discountValue / 100);
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
            const itemSub = item.price * item.quantity;
            disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : itemSub * (r.discountValue / 100);
          }
        });
      } else if (r.offerType === 'Category') {
        cart.forEach(item => {
          const matchedProd = products.find(p => p._id === item.productId || p.id === item.productId);
          if (matchedProd && matchedProd.category) {
            const match = (r.applicableCategories || []).some(c => c.toLowerCase().trim() === matchedProd.category.toLowerCase().trim());
            if (match) {
              const itemSub = item.price * item.quantity;
              disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : itemSub * (r.discountValue / 100);
            }
          }
        });
      } else if (r.offerType === 'Brand') {
        cart.forEach(item => {
          const matchedProd = products.find(p => p._id === item.productId || p.id === item.productId);
          if (matchedProd && matchedProd.brand) {
            const match = (r.applicableBrands || []).some(b => b.toLowerCase().trim() === matchedProd.brand.toLowerCase().trim());
            if (match) {
              const itemSub = item.price * item.quantity;
              disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : itemSub * (r.discountValue / 100);
            }
          }
        });
      }

      if (disc > autoDiscountAmt) {
        autoDiscountAmt = disc;
        appliedOffer = r;
      }
    });

    const finalCgst = manualCgstTotal !== "" ? manualCgstTotal : Math.round(taxTotal / 2);
    const finalSgst = manualSgstTotal !== "" ? manualSgstTotal : Math.round(taxTotal / 2);

    const grandTotal = subTotal - discountTotal - autoDiscountAmt + finalCgst + finalSgst;
    return {
      subTotal,
      discountTotal: discountTotal + autoDiscountAmt,
      taxTotal: finalCgst + finalSgst,
      grandTotal: Math.round(grandTotal),
      autoOffer: appliedOffer
    };
  }, [cart, manualCgstTotal, manualSgstTotal, discountRules, products]);

  // Synchronize amountPaid with grandTotal (defined after grandTotal useMemo initialization)
  useEffect(() => {
    if (paymentMethod === "Credit") {
      setAmountPaid(0);
    } else if (paymentMethod !== "Split") {
      setAmountPaid(grandTotal);
    }
  }, [grandTotal, paymentMethod]);

  // Handle manual GST override trigger
  const triggerGstOverride = (idx) => {
    const item = cart[idx];
    setOverrideItemIndex(idx);
    setOvCgstRate(item.gstPercent / 2);
    setOvSgstRate(item.gstPercent / 2);
    setShowOverrideModal(true);
  };

  const saveGstOverride = (e) => {
    e.preventDefault();
    if (overrideItemIndex === null) return;
    const updated = [...cart];
    const newGstRate = Number(ovCgstRate) + Number(ovSgstRate) + Number(ovIgstRate);
    updated[overrideItemIndex].gstPercent = newGstRate;
    setCart(updated);

    // Save override log
    setGstModifications([
      ...gstModifications,
      {
        productId: updated[overrideItemIndex].productId,
        originalGst: cart[overrideItemIndex].gstPercent,
        modifiedGst: newGstRate,
        reason: ovReason
      }
    ]);

    setShowOverrideModal(false);
    onAddNotification("Override Exemption Saved", "Manual taxation override has been registered.", "info");
  };

  // Check Credit Limits and request supervisor override if needed
  const activeCustomer = customers.find(c => c._id === selectedCustomerId || c.id === selectedCustomerId);
  const isCreditExceeded = activeCustomer && 
    paymentMethod === "Credit" && 
    ((activeCustomer.outstandingBalance || 0) + grandTotal > (activeCustomer.creditLimit || 50000));

  // Authorize Credit limit override
  const handleCreditOverrideSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/discounts/approve`, {
          approvalId: new mongoose.Types.ObjectId()
      });
      const data = res.data;
      if (data.success) {
        setIsOverrideApproved(true);
        setShowCreditOverrideModal(false);
        onAddNotification("Credit Bypass Approved", `Supervisor override authorized by: ${data.data.approvedBy}`, "success");
      } else {
        alert(data.message || "Invalid Supervisor supervisor credentials.");
      }
    } catch (err) {
      alert("Supervisor validation failed: " + err.message);
    }
  };

  // Submit invoice checkout
  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    if (isCreditExceeded && !isOverrideApproved) {
      setShowCreditOverrideModal(true);
      return;
    }

    const customer = customers.find(c => c._id === selectedCustomerId || c.id === selectedCustomerId);
    const sp = employees.find(e => e._id === salespersonId);

    const invoicePayload = {
      invoiceType: activeTab === "wholesale-billing" ? "Wholesale" : activeTab === "b2b-invoice" ? "B2B" : "Retail",
      items: cart.map(item => ({
        ...item,
        totalPrice: Math.round((item.price * item.quantity) * (1 - ((item.discount || 0) / 100)))
      })),
      customerId: selectedCustomerId,
      customerName: manualCustomerName || (customer ? customer.name : "Walk-in Customer"),
      customerPhone: customer ? customer.phone : undefined,
      companyName: activeTab === "wholesale-billing" ? (manualCustomerName || dealers.find(d => d.id === selectedDealerId)?.company) : undefined,
      gstin: activeTab === "wholesale-billing" ? dealers.find(d => d.id === selectedDealerId)?.gstin : undefined,
      billingAddress: activeTab === "b2b-invoice" ? billingAddress : undefined,
      shippingAddress: activeTab === "b2b-invoice" ? shippingAddress : undefined,
      stateCode: activeTab === "b2b-invoice" ? stateCode : undefined,
      lrNumber,
      ewayBillNo,
      paymentMethod,
      amountPaid: paymentMethod === "Split" ? (splitCash + splitCard + splitUPI) : (paymentMethod === "Credit" ? 0 : (amountPaid !== undefined && amountPaid !== "" ? Number(amountPaid) : grandTotal)),
      subTotal,
      discountTotal,
      gstTotal: taxTotal,
      cgstTotal: Math.round(taxTotal / 2),
      sgstTotal: Math.round(taxTotal / 2),
      grandTotal,
      paymentTerms,
      salespersonId,
      salespersonName: manualSalespersonName || (sp ? sp.name : "Sales Counter"),
      gstModifications
    };

    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/billing-sales/invoice`, invoicePayload);
      const json = res.data;
      if (json.success) {
        onAddNotification("Invoice Generated", `Document number ${json.invoice.invoiceNo} persists in MongoDB.`, "success");
        handleResetInvoice();
      } else {
        onAddNotification("Checkout Failed", json.message, "danger");
      }
    } catch (err) {
      onAddNotification("Connection Error", err.message, "danger");
    }
  };

  // Payment Collection from Outstanding view
  const handleCollectPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!collectionInvoice || !collectAmount) return;
    const invId = collectionInvoice._id || collectionInvoice.id;

    try {
      const mode = collectMethod === "UPI" ? "UPI" : (collectMethod === "Card" ? "CARD" : "CASH");
      const res = await api.post(`/billing/${invId}/payments`, {
        paymentTransactions: [
          { mode, amount: Number(collectAmount), referenceNo: collectRef, notes: collectRemarks }
        ],
        remarks: collectRemarks || `Payment collection for bill ${collectionInvoice.invoiceNo}`
      });

      const json = res.data;
      if (json.success) {
        onAddNotification("Payment Logged", `Received ₹${collectAmount} for invoice ${collectionInvoice.invoiceNo}`, "success");
        setShowCollectionModal(false);
        setCollectAmount(0);
        setCollectRemarks("");
        setCollectRef("");
        fetchInvoicesHistory();
      }
    } catch (err) {
      console.error("Payment collection error:", err);
      onAddNotification("Error", "Failed to save payment collection: " + (err.response?.data?.message || err.message), "error");
    }
  };

  // Manual WhatsApp reminder trigger
  const handleSendReminder = async (invoiceId, mode) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/billing-sales/send-reminder`, { invoiceId, mode });
      const json = res.data;
      if (json.success) {
        onAddNotification("Reminder Dispatched", `Manual ${mode} reminder logged on ledger.`, "success");
        fetchInvoicesHistory();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const renderInvoiceHistory = () => {
    const filteredInvoices = invoicesList.filter(inv => {
      const q = historySearch.toLowerCase().trim();
      if (!q) return true;
      const invNoMatch = (inv.invoiceNo || "").toLowerCase().includes(q);
      const nameMatch = (inv.customerName || "").toLowerCase().includes(q);
      const phoneMatch = (inv.customerPhone || "").includes(q);
      const codeMatch = inv.items && inv.items.some(item => (item.uniqueCode || "").toLowerCase().includes(q));
      return invNoMatch || nameMatch || phoneMatch || codeMatch;
    });

    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Invoice History Ledger</h3>
            <p className="text-[10px] text-slate-400">All registered sales transactions for this tenant.</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by Unique Code, Invoice No, Customer..."
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white w-96 md:w-[450px] outline-none font-bold animate-fade-in"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
            <button
              onClick={fetchInvoicesHistory}
              className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        {(historyLoading || isLoadingInvoices) ? (
          <div className="flex flex-col items-center justify-center p-16 bg-slate-50/50 rounded-2xl border border-slate-100 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Preparing Invoice History... Please wait.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 text-[10px] uppercase">
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Salesperson</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3">Amount Paid</th>
                  <th className="p-3">Total Grand</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 whitespace-nowrap min-w-[270px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, idx) => (
                  <tr key={idx} className="border-b border-slate-50 text-slate-600 hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900">{inv.invoiceNo}</span>
                          {Boolean(inv.hasAlteration && !inv.hasPSSM) && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-2xs">
                              ✂ ALTERATION
                            </span>
                          )}
                          {Boolean(inv.hasReturn || (inv.items && inv.items.some(i => i.isReturned))) && (
                            <span className="bg-rose-100 text-rose-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-2xs">
                              ↩ RETURN
                            </span>
                          )}
                          {Boolean(inv.hasExchange || (inv.items && inv.items.some(i => i.isExchanged))) && (
                            <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-2xs">
                              🔁 EXCHANGE
                            </span>
                          )}
                        </div>

                        {/* LINKED PSS SLIP / TICKET */}
                        {(inv.hasPSSM || inv.pssmNo || inv.pssmRecord) && (() => {
                          const pssRecordItems = inv.pssmRecord?.items || [];
                          const allItemsCollected = pssRecordItems.length > 0 && pssRecordItems.every(i => i.status === 'COLLECTED' || i.status === 'CLOSED');
                          const rawStatus = inv.pssmStatus || inv.pssmRecord?.status;
                          const displayStatus = (allItemsCollected || rawStatus === 'CLOSED' || rawStatus === 'COLLECTED')
                            ? 'CLOSED'
                            : (rawStatus || 'PENDING');
                          return (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-1.5 text-left text-xs space-y-0.5">
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">PSS:</span>
                                <span className="font-mono font-black text-purple-700">{inv.pssmNo || inv.pssmRecord?.pssmNo}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">PSS Status:</span>
                                <span className={`font-black uppercase px-1.5 py-0.2 rounded text-[9px] border ${
                                  displayStatus === 'CLOSED'
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
                    <td className="p-3 font-mono text-[10px]">{new Date(inv.date || inv.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 font-medium">{inv.customerName}</td>
                    <td className="p-3">{inv.salespersonName || 'Counter Cashier'}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 font-mono">₹{(inv.amountPaid || 0).toLocaleString()}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">₹{(inv.grandTotal || 0).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                        {/* VIEW INVOICE */}
                        <button
                          type="button"
                          onClick={() => handleOpenInvoiceReceipt(inv)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-black flex items-center gap-1 border border-indigo-200 cursor-pointer shadow-2xs shrink-0"
                          title="View / Print Original Invoice"
                        >
                          <FileText className="w-3 h-3 text-indigo-600" />
                          <span>VIEW INVOICE</span>
                        </button>

                        {/* VIEW PSS */}
                        {(inv.hasPSSM || inv.pssmNo || inv.pssmRecord) && (
                          <button
                            type="button"
                            onClick={() => handleOpenPSSSlip(inv)}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-[10px] font-black flex items-center gap-1 border border-purple-200 cursor-pointer shadow-2xs shrink-0"
                            title="View / Print Separate PSS Slip"
                          >
                            <Tag className="w-3 h-3 text-purple-600" />
                            <span>VIEW PSS</span>
                          </button>
                        )}

                        <button
                          onClick={async () => {
                            if (window.confirm("Are you sure you want to permanently delete this invoice? This will revert inventory back to available stock.")) {
                              try {
                                const res = await fetch(`${API}/billing/${inv._id || inv.id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${localStorage.getItem('token')}`, "Content-Type": "application/json" } });
                                const data = await res.json();
                                if (data.success) {
                                  if (onAddNotification) onAddNotification("Success", "Invoice deleted successfully", "success");
                                  fetchInvoices(); // Refresh the list
                                } else {
                                  if (onAddNotification) onAddNotification("Error", data.message || "Failed to delete invoice", "danger");
                                }
                              } catch (error) {
                                if (onAddNotification) onAddNotification("Error", "Failed to delete invoice", "danger");
                              }
                            }
                          }}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 cursor-pointer transition-colors inline-flex items-center shrink-0"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-slate-400 font-bold">
                      No invoices found. Generate an invoice to see it listed here!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderReturnsDatabase = () => {
    const returnInvoices = invoices.filter(inv => inv.hasReturn || inv.hasExchange || (inv.items && inv.items.some(i => i.isReturned || i.isExchanged)));

    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-xl text-slate-800">Returns & Exchanges Database</h3>
            <p className="text-slate-500 text-sm font-medium mt-1">Comprehensive audit trail of all items returned or exchanged.</p>
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Search Invoice or Item..." className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200">
                <th className="p-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Date</th>
                <th className="p-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Invoice No</th>
                <th className="p-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Customer</th>
                <th className="p-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Type</th>
                <th className="p-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Item Details</th>
                <th className="p-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Reason</th>
                <th className="p-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returnInvoices.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400 font-semibold italic">No returns or exchanges found in the database.</td></tr>
              ) : (
                returnInvoices.map(inv => {
                  return (inv.items || []).filter(i => i.isReturned || i.isExchanged).map((item, idx) => {
                    const isReturn = item.isReturned;
                    return (
                      <tr key={`${inv._id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-500 font-mono text-xs">{new Date(item.returnedAt || inv.updatedAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-3 font-bold text-slate-700">{inv.invoiceNo}</td>
                        <td className="p-3 text-slate-600">{inv.customerName || 'Walk-in'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isReturn ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'}`}>
                            {isReturn ? 'Return' : 'Exchange'}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-700">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}</p>
                          {item.isExchanged && item.exchangedFor && (
                            <p className="text-[10px] font-bold text-indigo-600 mt-1">Exchanged For: {item.exchangedFor}</p>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 text-xs italic">{item.returnReason || item.exchangeReason || '-'}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">₹{(item.totalPrice || item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOutstandingReceivables = () => {
    // Math indicators
    let totalOutstandingVal = 0;
    let overdueVal = 0;
    let todayDueVal = 0;
    let uniqueCusts = new Set();

    outstandingInvoices.forEach(inv => {
      const itemTotal = inv.grandTotal || 0;
      const itemPaid = inv.amountPaid || 0;
      const itemOutstanding = Math.max(0, itemTotal - itemPaid);
      totalOutstandingVal += itemOutstanding;
      if (inv.customerId) uniqueCusts.add(inv.customerId);
      
      const due = inv.dueDate ? new Date(inv.dueDate) : new Date();
      const isOverdue = due < new Date();
      if (isOverdue) overdueVal += itemOutstanding;

      const today = new Date().toDateString();
      if (due.toDateString() === today) todayDueVal += itemOutstanding;
    });

    const filtered = outstandingInvoices.filter(inv => {
      const nameStr = inv.customerName || 'Walk-in Customer';
      const invNoStr = inv.invoiceNo || '';
      const phoneStr = inv.customerPhone || '';
      const custMatch = nameStr.toLowerCase().includes(receivablesSearch.toLowerCase()) ||
        invNoStr.toLowerCase().includes(receivablesSearch.toLowerCase()) ||
        phoneStr.includes(receivablesSearch);
      
      if (!custMatch) return false;
      if (receivablesStatusFilter === "Overdue") {
        return new Date(inv.dueDate) < new Date();
      }
      return true;
    });

    return (
      <div className="space-y-6">
        {/* KPI Dashboard Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Outstanding</span>
            <p className="text-xl font-black text-slate-800 font-mono">₹{totalOutstandingVal.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-red-500">Total Overdue</span>
            <p className="text-xl font-black text-red-600 font-mono">₹{overdueVal.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Due Today</span>
            <p className="text-xl font-black text-indigo-600 font-mono">₹{todayDueVal.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Debtors</span>
            <p className="text-xl font-black text-slate-800 font-mono">{uniqueCusts.size} customers</p>
          </div>
        </div>

        {/* Search and Filters panel */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex flex-wrap justify-between items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Search by invoice number, name, or phone..."
              value={receivablesSearch}
              onChange={(e) => setReceivablesSearch(e.target.value)}
              className="w-full bg-slate-50 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setReceivablesStatusFilter("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                receivablesStatusFilter === "All" ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Receivables
            </button>
            <button
              onClick={() => setReceivablesStatusFilter("Overdue")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                receivablesStatusFilter === "Overdue" ? "bg-red-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Overdue Only
            </button>
          </div>
        </div>

        {/* Aging Classification Cards */}
        <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
          <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl">
            <div className="text-emerald-700 font-bold">0-30 Days</div>
            <div className="font-mono mt-1 font-bold text-slate-700">₹{(totalOutstandingVal - overdueVal).toLocaleString()}</div>
          </div>
          <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl">
            <div className="text-amber-700 font-bold">31-60 Days</div>
            <div className="font-mono mt-1 font-bold text-slate-700">₹{Math.round(overdueVal * 0.5).toLocaleString()}</div>
          </div>
          <div className="bg-orange-50/50 border border-orange-100 p-2.5 rounded-xl">
            <div className="text-orange-700 font-bold">61-90 Days</div>
            <div className="font-mono mt-1 font-bold text-slate-700">₹{Math.round(overdueVal * 0.3).toLocaleString()}</div>
          </div>
          <div className="bg-red-50/50 border border-red-100 p-2.5 rounded-xl">
            <div className="text-red-700 font-bold">91-180 Days</div>
            <div className="font-mono mt-1 font-bold text-slate-700">₹{Math.round(overdueVal * 0.15).toLocaleString()}</div>
          </div>
          <div className="bg-rose-50/50 border border-rose-100 p-2.5 rounded-xl">
            <div className="text-rose-700 font-bold">180+ Days</div>
            <div className="font-mono mt-1 font-bold text-slate-700">₹{Math.round(overdueVal * 0.05).toLocaleString()}</div>
          </div>
        </div>

        {/* Outstanding Receivables Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 text-[10px] uppercase">
                <th className="p-3">Invoice No</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Grand Total</th>
                <th className="p-3">Outstanding</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Reminders</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const totalVal = inv.grandTotal || 0;
                const paidVal = inv.amountPaid || 0;
                const outstandingAmt = Math.max(0, totalVal - paidVal);
                const isOverdue = inv.dueDate ? new Date(inv.dueDate) < new Date() : false;
                return (
                  <tr key={inv._id || inv.id || Math.random()} className="border-b border-slate-50 text-slate-600 hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">{inv.invoiceNo || 'N/A'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedCustomerDetail(inv)}
                        className="text-indigo-600 hover:underline font-bold text-left cursor-pointer"
                      >
                        {inv.customerName || 'Walk-in Customer'}
                      </button>
                      <div className="text-[10px] text-slate-400">{inv.customerPhone || 'No Phone'}</div>
                    </td>
                    <td className="p-3 font-mono">₹{totalVal.toLocaleString()}</td>
                    <td className="p-3 font-mono font-bold text-red-500">₹{outstandingAmt.toLocaleString()}</td>
                    <td className="p-3 font-mono text-[10px]">
                      <div>{new Date(inv.dueDate).toLocaleDateString()}</div>
                      <span className={`px-1 rounded text-[9px] font-bold ${
                        isOverdue ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {isOverdue ? 'Overdue' : 'Current'}
                      </span>
                    </td>
                    <td className="p-3 text-[10px] font-mono text-slate-400">
                      <div>Count: {inv.reminderHistory?.length || 0}</div>
                      <div>Last: {inv.reminderHistory?.length > 0 ? new Date(inv.reminderHistory[inv.reminderHistory.length-1].sentAt).toLocaleDateString() : 'Never'}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setCollectionInvoice(inv);
                            setCollectAmount(outstandingAmt);
                            setShowCollectionModal(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold cursor-pointer text-[10px]"
                        >
                          Collect
                        </button>
                        <button
                          onClick={() => handleSendReminder(inv._id, 'WhatsApp')}
                          className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded font-bold cursor-pointer text-[10px]"
                        >
                          Ping
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-400 font-bold">
                    No outstanding receivables found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 font-sans text-xs font-semibold text-slate-600">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Billing & Sales Management</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Generate B2B retail tax vouchers, wholesale bulk delivery memos, and outstanding logs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetInvoice}
            className="px-3 py-2 border border-red-200 hover:bg-red-50 text-red-700 bg-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Clear Voucher (Ctrl+N)</span>
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-2xs mb-6 grid grid-cols-2 md:grid-cols-5 gap-1 w-full max-w-fit">
        {[
          { id: "gst-billing", label: "GST Billing Layout" },
          { id: "wholesale-billing", label: "Wholesale Bulk Billing" },
          { id: "b2b-invoice", label: "Tax Invoice Generation (B2B)" },
          { id: "invoice-history", label: "Invoice History" },
          { id: "outstanding-receivables", label: "Outstanding Receivables" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              handleResetInvoice();
            }}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-nowrap cursor-pointer transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN WORKSPACE GRID */}
      {activeTab === "invoice-history" && renderInvoiceHistory()}
      {activeTab === "outstanding-receivables" && renderOutstandingReceivables()}

      {activeTab !== "invoice-history" && activeTab !== "outstanding-receivables" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        
          {/* LEFT COLUMN: PRODUCT SELECTION & CART TABLE */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Fast Lookup scan box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
                  <select
                    ref={searchInputRef}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddItem(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:border-indigo-500 font-bold focus:outline-none"
                  >
                    <option value="">Search / Scan Barcode (Ctrl+F)</option>
                    {products.map(p => (
                      <option key={p._id || p.id} value={p._id || p.id}>{p.name} - {p.sku} (Qty: {p.stock})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Cart checkout list table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-indigo-500" />
                <span>Invoice Cart Line Items</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 text-[10px] uppercase">
                      <th className="p-3.5">Product Details</th>
                      <th className="p-3.5">Qty</th>
                      <th className="p-3.5">Unit Price</th>
                      <th className="p-3.5">Tax (GST)</th>
                      <th className="p-3.5">Discount %</th>
                      <th className="p-3.5">Total Line</th>
                      <th className="p-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-50 text-slate-600 hover:bg-slate-50/50">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono font-medium">{item.sku}</div>
                        </td>
                        <td className="p-3.5 font-mono">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...cart];
                              updated[idx].quantity = Math.max(1, Number(e.target.value));
                              setCart(updated);
                            }}
                            className="w-12 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-center font-bold"
                          />
                        </td>
                        <td className="p-3.5 font-mono">₹{item.price.toLocaleString()}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => triggerGstOverride(idx)}
                            className="font-mono text-indigo-600 hover:underline font-bold"
                            title="Click to manually edit CGST & SGST taxes"
                          >
                            {item.gstPercent}% (Modify)
                          </button>
                        </td>
                        <td className="p-3.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) => {
                              const updated = [...cart];
                              updated[idx].discount = Math.min(100, Math.max(0, Number(e.target.value)));
                              setCart(updated);
                            }}
                            className="w-12 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-center font-bold"
                          />
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">
                          ₹{Math.round((item.price * item.quantity) * (1 - (item.discount / 100))).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cart.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-12 text-center text-slate-400 font-bold">
                          Basket is empty. Select products from lookup above to compile voucher.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: METADATA & CHECKOUT */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                <span>Voucher Parameters</span>
              </h3>

              {/* Customer Selector / Manual name input */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Select Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-bold focus:outline-none"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Manual Customer Name Column</label>
                  <input
                    type="text"
                    placeholder="Enter customer name manually..."
                    value={manualCustomerName}
                    onChange={(e) => setManualCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Wholesale specifics */}
              {activeTab === "wholesale-billing" && (
                <div className="space-y-3 bg-indigo-50/20 p-3 rounded-xl border border-indigo-50">
                  <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Wholesale Logistics Details</div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Select Dealer Account</label>
                    <select
                      value={selectedDealerId}
                      onChange={(e) => setSelectedDealerId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5"
                    >
                      <option value="">-- Choose Dealer Account --</option>
                      {dealers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.company})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">LR Number</label>
                      <input
                        type="text"
                        value={lrNumber}
                        onChange={(e) => setLrNumber(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">E-Way Bill No</label>
                      <input
                        type="text"
                        value={ewayBillNo}
                        onChange={(e) => setEwayBillNo(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* B2B Specifics */}
              {activeTab === "b2b-invoice" && (
                <div className="space-y-3 bg-indigo-50/20 p-3 rounded-xl border border-indigo-50">
                  <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Corporate Business (B2B) parameters</div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">GSTIN Column</label>
                    <input
                      type="text"
                      placeholder="Enter buyer's GSTIN..."
                      value={companyGstin}
                      onChange={(e) => setCompanyGstin(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Billing Address</label>
                    <input
                      type="text"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1"
                    />
                  </div>
                </div>
              )}

              {/* Staff attribution */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Assign Salesperson</label>
                <select
                  value={salespersonId}
                  onChange={(e) => setSalespersonId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none"
                >
                  <option value="">-- Choose Salesperson --</option>
                  {employees.filter(e => e.designation === "Salesperson" || e.role === "Salesperson").map(e => (
                    <option key={e._id} value={e._id}>{e.name}</option>
                  ))}
                </select>
              </div>

              {/* Payment methods */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-bold focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Credit">Credit Ledger Sale</option>
                    <option value="Split">Split Pay</option>
                  </select>
                </div>

                {paymentMethod !== "Split" && (
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Amount Received (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter amount paid/received..."
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold font-mono outline-none"
                    />
                  </div>
                )}

                {paymentMethod === "Split" && (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Split Breakdown</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-450 text-[9px] font-bold">Cash</label>
                        <input
                          type="number"
                          value={splitCash}
                          onChange={(e) => setSplitCash(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-bold font-mono text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-450 text-[9px] font-bold">UPI</label>
                        <input
                          type="number"
                          value={splitUPI}
                          onChange={(e) => setSplitUPI(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-bold font-mono text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-450 text-[9px] font-bold">Card</label>
                        <input
                          type="number"
                          value={splitCard}
                          onChange={(e) => setSplitCard(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-bold font-mono text-[10px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic credit limit warning */}
              {isCreditExceeded && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-600 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-[10px] uppercase">
                    <AlertCircle className="w-4 h-4" />
                    <span>Credit Limit Exceeded</span>
                  </div>
                  <p className="text-[9px]">Customer has exceeded their configured credit limit budget. Supervisor approval required.</p>
                </div>
              )}

              {/* Checkout Calculation summaries */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal Value</span>
                  <span className="font-mono font-bold">₹{subTotal.toLocaleString()}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Applied Promotions</span>
                    <span className="font-mono">-₹{discountTotal.toLocaleString()}</span>
                  </div>
                )}
                {autoOffer && (
                  <div className="bg-emerald-50 border border-emerald-100 p-2 rounded text-emerald-700 text-[10px] font-bold">
                    Applied Auto Promo: {autoOffer.offerName}
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200/50 pt-2 font-bold text-slate-800">
                  <span className="uppercase text-[10px]">Grand Net Payable</span>
                  <span className="font-mono text-indigo-600 text-sm">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleCheckoutSubmit}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-center cursor-pointer shadow-md shadow-indigo-100"
              >
                {isCreditExceeded && !isOverrideApproved ? "Request Credit Override" : "Finalize Invoice (Ctrl+S)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Limit Exceeded Supervisor Override Modal */}
      {showCreditOverrideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-600 font-semibold">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1 text-red-600">
              <AlertCircle className="w-4 h-4 animate-bounce" />
              <span>Credit Exceeded Override</span>
            </h3>
            <p className="text-[10px] text-slate-400">Please scan or input supervisor credentials to authorize checkout.</p>
            <form onSubmit={handleCreditOverrideSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Supervisor Username</label>
                <input
                  type="text"
                  required
                  value={overrideUsername}
                  onChange={(e) => setOverrideUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Supervisor Password / PIN</label>
                <input
                  type="password"
                  required
                  value={overridePassword}
                  onChange={(e) => setOverridePassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreditOverrideModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Authorize credit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual CGST / SGST Exemption Override modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-600 font-semibold">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Manual GST Override Exemption</h3>
            <p className="text-[10px] text-slate-400">Alter statutory taxes for this specific cart item line.</p>
            <form onSubmit={saveGstOverride} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">CGST (%)</label>
                  <input
                    type="number"
                    value={ovCgstRate}
                    onChange={(e) => setOvCgstRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">SGST (%)</label>
                  <input
                    type="number"
                    value={ovSgstRate}
                    onChange={(e) => setOvSgstRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">IGST (%)</label>
                  <input
                    type="number"
                    value={ovIgstRate}
                    onChange={(e) => setOvIgstRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={ovHsn}
                    onChange={(e) => setOvHsn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-slate-800 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Reason for override *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fabric blend variation exemption"
                  value={ovReason}
                  onChange={(e) => setOvReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-600 font-semibold">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Payment Collection Settlement</h3>
            {collectionInvoice && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] space-y-1">
                <div>Invoice No: <span className="font-bold text-slate-800">{collectionInvoice.invoiceNo}</span></div>
                <div>Customer: <span className="font-bold text-slate-800">{collectionInvoice.customerName}</span></div>
                <div>Grand Total: <span className="font-bold text-slate-800">₹{(collectionInvoice.grandTotal || 0).toLocaleString()}</span></div>
                <div>Current Paid: <span className="font-bold text-slate-800">₹{(collectionInvoice.amountPaid || 0).toLocaleString()}</span></div>
              </div>
            )}
            <form onSubmit={handleCollectPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Collection Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Payment Mode</label>
                  <select
                    value={collectMode}
                    onChange={(e) => setCollectMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Transaction Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR / Chq number"
                    value={collectRef}
                    onChange={(e) => setCollectRef(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Payment remarks..."
                  value={collectRemarks}
                  onChange={(e) => setCollectRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCollectionModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Apply Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Side Drawer */}
      {selectedCustomerDetail && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col p-6 animate-slide-in text-slate-600 font-semibold overflow-y-auto">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Customer Profile Summary</h3>
            <button onClick={() => setSelectedCustomerDetail(null)} className="p-1 hover:bg-slate-50 rounded cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-6 pt-4 text-xs">
            <div className="space-y-2">
              <div>Name: <span className="font-bold text-slate-800">{selectedCustomerDetail.customerName}</span></div>
              <div>Phone: <span className="font-bold text-slate-800">{selectedCustomerDetail.customerPhone || 'N/A'}</span></div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Credit Accounts Information</div>
              <div className="flex justify-between">
                <span>Credit Limit</span>
                <span className="font-mono font-bold text-slate-800">₹{(activeCustomer?.creditLimit || 50000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding Balance</span>
                <span className="font-mono font-bold text-red-500">₹{(activeCustomer?.outstandingBalance || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Available Credit</span>
                <span className="font-mono font-bold text-emerald-600">₹{Math.max(0, (activeCustomer?.creditLimit || 50000) - (activeCustomer?.outstandingBalance || 0)).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sales Ledger Context</div>
              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-1">
                <div>Invoice Reference: <span className="font-mono font-bold">{selectedCustomerDetail.invoiceNo}</span></div>
                <div>Sales Date: <span>{new Date(selectedCustomerDetail.date || selectedCustomerDetail.createdAt).toLocaleDateString()}</span></div>
                <div>Grand Subtotal: <span className="font-mono">₹{selectedCustomerDetail.grandTotal.toLocaleString()}</span></div>
                <div>Payment Terms: <span className="font-bold text-indigo-600">{selectedCustomerDetail.paymentTerms || 'Net 30'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEPARATE PSS SLIP MODAL */}
      {pssSlipModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-scale-up">
            <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-rose-400">Post Sales Service Slip</h3>
                <p className="text-[11px] text-slate-400 font-mono">Separate Service Document (Original Bill Untouched)</p>
              </div>
              <button onClick={() => setPssSlipModalData(null)} className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Original Invoice:</span>
                  <span className="font-bold text-indigo-700">{pssSlipModalData.originalInvoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PSS Ticket:</span>
                  <span className="font-bold text-rose-700">{pssSlipModalData.pssmNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bill Barcode:</span>
                  <span className="font-bold text-slate-800">{pssSlipModalData.billBarcode}</span>
                </div>
                {(() => {
                  const allItemsCollected = (pssSlipModalData.items?.length > 0) && pssSlipModalData.items.every(it => it.status === 'COLLECTED' || it.status === 'CLOSED');
                  const displayStatus = (allItemsCollected || pssSlipModalData.status === 'CLOSED' || pssSlipModalData.status === 'COLLECTED')
                    ? 'CLOSED'
                    : (pssSlipModalData.status || 'PENDING');
                  return (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Overall Status:</span>
                      <span className={`font-black uppercase px-2 py-0.5 rounded-lg text-[10px] border ${
                        displayStatus === 'CLOSED' ? 'bg-slate-800 text-white border-slate-900 shadow-xs' :
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

              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1">
                <p className="font-bold text-slate-800">{pssSlipModalData.customerName} {pssSlipModalData.customerPhone ? `(${pssSlipModalData.customerPhone})` : ''}</p>
                <p className="text-slate-500">Salesman: {pssSlipModalData.salesmanName} | Priority: {pssSlipModalData.priority}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-bold uppercase text-[10px] text-slate-500 tracking-wider">Garments ({pssSlipModalData.items?.length || 0}):</p>
                  {(pssSlipModalData.items || []).filter(it => it.status !== 'COLLECTED').length > 1 && (
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
                {(pssSlipModalData.items || []).map((it, i) => {
                  const isReady = it.status === 'READY';
                  const isCollected = it.status === 'COLLECTED';
                  return (
                    <div key={i} className={`border rounded-xl p-2.5 space-y-1.5 transition-all ${
                      isCollected ? 'bg-slate-50/80 border-slate-200' :
                      isReady ? 'bg-emerald-50/70 border-emerald-300' :
                      'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900">{i + 1}. {it.name}</span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                              (it.gender || 'Gents') === 'Ladies' ? 'bg-pink-100 text-pink-700 border-pink-300' : 'bg-blue-100 text-blue-700 border-blue-300'
                            }`}>{it.gender || 'Gents'}</span>
                            <span className="bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase inline-block">{it.serviceType}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isCollected ? (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>COLLECTED</span>
                            </span>
                          ) : (
                            <>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                isReady ? 'bg-emerald-600 text-white border-emerald-700' :
                                it.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                'bg-amber-100 text-amber-800 border-amber-200'
                              }`}>
                                {(it.status || 'PENDING').replace(/_/g, ' ')}
                              </span>
                              {it._id && (
                                <button
                                  type="button"
                                  onClick={() => handleCollectPSSItemFromSlip(it._id)}
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
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Size: {it.size} | Color: {it.color} | Code: {it.barcode || 'N/A'}</span>
                        <span className="font-semibold text-slate-700">Assigned: <b>{it.assignedTo || 'Pending'}</b></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button
                onClick={() => setPssSlipModalData(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const d = pssSlipModalData;
                  const allCollected = (d.items || []).length > 0 && (d.items || []).every(it => it.status === 'COLLECTED' || it.status === 'CLOSED');
                  const printOverallStatus = (allCollected || d.status === 'CLOSED' || d.status === 'COLLECTED') ? 'CLOSED' : (d.status || 'PENDING');
                  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PSS Slip ${d.pssmNo}</title><style>body{font-family:'Courier New',monospace;color:#000;padding:16px;max-width:380px;margin:0 auto;line-height:1.4}h2{margin:0}.section{border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px;font-size:11px}.bold{font-weight:bold}.badge{background:#000;color:#fff;padding:3px 8px;font-weight:bold;display:inline-block;margin-top:4px}.barcode{font-family:monospace;letter-spacing:3px;font-size:18px;font-weight:bold;border:1px solid #000;padding:6px;display:inline-block;margin:8px 0}.opt-charge{font-style:italic;color:#555;font-size:10px}</style></head><body><div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:10px"><h2>POST SALES SERVICE SLIP</h2><p style="margin:2px 0;font-size:11px">Date: <b>${d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</b></p><p style="margin:2px 0;font-size:11px">Original Bill No: <b>${d.originalInvoiceNo}</b></p><div class="badge">PSS Ticket: ${d.pssmNo}</div>${(() => { const itemTIs = (d.items || []).map(i => i.tailorInvoiceNo).filter(Boolean); const allTIs = Array.from(new Set([d.tailorInvoiceNo, ...itemTIs].filter(Boolean))).join(', '); return allTIs ? `<p style="margin:2px 0;font-size:11px;font-weight:bold">Tailor Invoice No: ${allTIs}</p>` : ''; })()}<p style="font-size:11px;margin-top:4px">Bill Barcode: <b>${d.billBarcode}</b></p></div><div class="section"><b>Customer Name:</b> ${d.customerName}<br/><b>Mobile Number:</b> ${d.customerPhone || 'N/A'}<br/>${d.alternatePhone ? '<b>Alt Phone:</b> ' + d.alternatePhone + '<br/>' : ''}${d.whatsappNumber ? '<b>WhatsApp:</b> ' + d.whatsappNumber + '<br/>' : ''}<b>Salesman:</b> ${d.salesmanName}<br/><b>Priority:</b> ${d.priority}<br/>${d.deliveryDate ? '<b>Expected Delivery Date:</b> ' + new Date(d.deliveryDate).toLocaleDateString('en-IN') + '<br/>' : ''}${d.trialRequired !== undefined ? '<b>Trial Required:</b> ' + (d.trialRequired ? 'YES' : 'NO') + (d.trialDate ? ' (Trial Date: ' + (new Date(d.trialDate).toLocaleDateString('en-IN') || d.trialDate) + ')' : '') + '<br/>' : ''}<b>Advance Paid:</b> \u20B9${d.advancePaid || 0}<br/><b>Balance Due:</b> \u20B9${d.balanceDue || 0}<br/><b>Overall Status:</b> <span style="font-weight:bold;text-transform:uppercase">${printOverallStatus.replace(/_/g, ' ')}</span><br/>${d.specialInstructions ? '<b>Special Instructions:</b> ' + d.specialInstructions + '<br/>' : ''}</div>${(d.items || []).map((it, i) => { const isAlt = String(it.serviceType || '').toLowerCase().includes('alteration'); const mObj = it.measurements || {}; const ins = mObj.inseam || mObj.innerLegLength || mObj.Inseam || mObj['Inner Leg Length'] || ''; const mStr = Object.entries(mObj).map(([k,v]) => `${k}: ${v}"`).join(', '); const charge = it.charge || d.totalCharges; return `<div class="section"><b>${i + 1}. Garment: ${it.name}</b><br/><b>Gents / Ladies:</b> ${it.gender || 'Gents'}<br/><b>Bill No &amp; Unique Code:</b> ${d.originalInvoiceNo} / ${it.uniqueCode || it.barcode || 'N/A'}<br/><b>Size &amp; Color:</b> ${it.size} / ${it.color}<br/><b>Service:</b> ${it.serviceType}<br/>${isAlt && it.tailorInvoiceNo ? '<b>Tailor Invoice No:</b> ' + it.tailorInvoiceNo + '<br/>' : ''}${isAlt ? '<b>Tailoring Charges:</b> ' + (charge > 0 ? '\u20B9' + charge : '<span class="opt-charge">N/A (optional)</span>') + '<br/>' : ''}${isAlt && mStr ? '<b>Measurements:</b> ' + mStr + '<br/>' : ''}${isAlt && ins ? '<b>Inseam / Inner Leg Length:</b> <b>' + ins + '"</b><br/>' : ''}${it.trialRequired !== undefined ? '<b>Trial Req:</b> ' + (it.trialRequired ? 'YES' : 'NO') + (it.trialDate ? ' (Trial Date: ' + (new Date(it.trialDate).toLocaleDateString('en-IN') || it.trialDate) + ')' : '') + '<br/>' : ''}<b>Status:</b> ${it.status === 'COLLECTED' ? '<span style="color:#15803d;font-weight:bold">[COLLECTED]</span>' : (it.status || 'PENDING')}<br/><b>Assigned To:</b> ${it.assignedTo || 'Pending'}</div>`; }).join('')}<div style="text-align:center;margin-top:10px"><div class="barcode">||||||||||||||||||||||||</div><p style="margin:2px 0;font-size:10px;font-weight:bold">${d.billBarcode || d.pssmNo}</p><p style="font-size:10px;margin-top:6px">*** Please present this slip during collection ***</p></div><script>window.onload=function(){setTimeout(function(){window.print()},400)}</script></body></html>`;
                  const url = URL.createObjectURL(new Blob(['\ufeff' + html], { type: 'text/html;charset=utf-8' }));
                  window.open(url, '_blank');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PSS Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSalesView;

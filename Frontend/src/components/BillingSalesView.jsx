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
  UserCheck
} from "lucide-react";

export const BillingSalesView = ({
  products = [],
  customers = [],
  employees = [],
  onAddNotification
}) => {
  const [activeTab, setActiveTab] = useState("gst-billing");

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
  const [cgstRate, setCgstRate] = useState(5);
  const [sgstRate, setSgstRate] = useState(5);

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
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchInvoicesHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/billing-sales/reports", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setInvoicesList(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "invoice-history") {
      fetchInvoicesHistory();
    }
  }, [activeTab]);

  // Fetch Default config
  const fetchTaxConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/products/tax-config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCgstRate(json.data.cgstRate || 5);
        setSgstRate(json.data.sgstRate || 5);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [discountRules, setDiscountRules] = useState([]);
  const fetchActiveRules = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/discounts/rules", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, selectedCustomerId, paymentMethod, amountPaid, activeTab, cgstRate, sgstRate]);

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
  };

  // Add Item to cart
  const handleAddItem = (productId) => {
    const prod = products.find(p => p.id === productId || p._id === productId);
    if (!prod) return;

    // Check if item already in cart
    const existingIdx = cart.findIndex(item => item.productId === prod._id);
    if (existingIdx > 0 || existingIdx === 0) {
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      updated[existingIdx].totalPrice = (updated[existingIdx].price - (updated[existingIdx].price * (updated[existingIdx].discount / 100))) * updated[existingIdx].quantity;
      setCart(updated);
    } else {
      const defaultGst = prod.taxRate || (cgstRate + sgstRate);
      const halfGst = Math.floor(defaultGst / 2);
      setCart([...cart, {
        productId: prod._id,
        name: prod.name,
        sku: prod.sku || "N/A",
        hsn: "6109", // Standard Garment HSN
        price: prod.sellingPrice || prod.basePrice || 999,
        quantity: 1,
        discount: 0,
        cgstPercent: halfGst,
        sgstPercent: defaultGst - halfGst,
        igstPercent: 0,
        gstPercent: defaultGst,
        totalPrice: prod.sellingPrice || prod.basePrice || 999
      }]);
    }
  };

  // Remove Item
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
          if (r.applicableProducts.includes(item.productId)) {
            const itemSub = item.price * item.quantity;
            disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : itemSub * (r.discountValue / 100);
          }
        });
      } else if (r.offerType === 'Category') {
        cart.forEach(item => {
          const matchedProd = products.find(p => p._id === item.productId || p.id === item.productId);
          if (matchedProd && r.applicableCategories.includes(matchedProd.category)) {
            const itemSub = item.price * item.quantity;
            disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : itemSub * (r.discountValue / 100);
          }
        });
      } else if (r.offerType === 'Brand') {
        cart.forEach(item => {
          const matchedProd = products.find(p => p._id === item.productId || p.id === item.productId);
          if (matchedProd && r.applicableBrands.includes(matchedProd.brand)) {
            const itemSub = item.price * item.quantity;
            disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : itemSub * (r.discountValue / 100);
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

  // Handle manual GST override trigger
  const triggerGstOverride = (idx) => {
    const item = cart[idx];
    setOverrideItemIndex(idx);
    setOvCgstRate(item.cgstPercent !== undefined ? item.cgstPercent : Math.floor(item.gstPercent / 2));
    setOvSgstRate(item.sgstPercent !== undefined ? item.sgstPercent : (item.gstPercent - Math.floor(item.gstPercent / 2)));
    setOvIgstRate(item.igstPercent || 0);
    setOvHsn(item.hsn);
    setOvReason("");
    setShowOverrideModal(true);
  };

  // Save manual override
  const handleSaveOverride = (e) => {
    e.preventDefault();
    if (overrideItemIndex === null) return;

    const updated = [...cart];
    const item = updated[overrideItemIndex];

    const originalGst = item.gstPercent;
    const finalGst = ovCgstRate + ovSgstRate + ovIgstRate;
    item.gstPercent = finalGst;
    item.cgstPercent = ovCgstRate;
    item.sgstPercent = ovSgstRate;
    item.igstPercent = ovIgstRate;
    item.hsn = ovHsn;
    item.totalPrice = (item.price - (item.price * (item.discount / 100))) * item.quantity;

    setCart(updated);

    // Track modifications log
    setGstModifications([...gstModifications, {
      productId: item.productId,
      originalGst,
      modifiedGst: finalGst,
      reason: ovReason
    }]);

    setShowOverrideModal(false);
    onAddNotification("Override Saved", "Manual CGST & SGST overrides applied and logged.", "success");
  };

  // Handle Checkout Submit to Backend MDB APIs
  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const customer = customers.find(c => c._id === selectedCustomerId);
    const sp = employees.find(e => e._id === salespersonId);

    const invoicePayload = {
      invoiceType: activeTab === "wholesale-billing" ? "Wholesale" : activeTab === "b2b-invoice" ? "B2B" : "Retail",
      items: cart,
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
      amountPaid: paymentMethod === "Split" ? (splitCash + splitCard + splitUPI) : (amountPaid || grandTotal),
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
      const res = await fetch("http://localhost:5000/api/billing-sales/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(invoicePayload)
      });
      const json = await res.json();
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

  const renderInvoiceHistory = () => {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Invoice History Ledger</h3>
            <p className="text-[10px] text-slate-400">All registered sales transactions for this tenant.</p>
          </div>
          <button
            onClick={fetchInvoicesHistory}
            className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {historyLoading ? (
          <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Loading transaction journals...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 border-b border-slate-100 tracking-wider">
                  <th className="p-3.5">Invoice Number</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Client / Business</th>
                  <th className="p-3.5">Voucher Type</th>
                  <th className="p-3.5 text-right">Subtotal</th>
                  <th className="p-3.5 text-right">Discount</th>
                  <th className="p-3.5 text-right">Tax (GST)</th>
                  <th className="p-3.5 text-right">Grand Total</th>
                  <th className="p-3.5 text-center">Payment Method</th>
                  <th className="p-3.5 text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {invoicesList.map((inv, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-3.5 font-mono font-bold text-slate-800">{inv.invoiceNo}</td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {inv.date ? new Date(inv.date).toLocaleDateString("en-IN") : "N/A"}
                    </td>
                    <td className="p-3.5 text-slate-700 font-bold">{inv.customer || "Walk-in"}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.type === "Wholesale" ? "bg-amber-50 text-amber-700" :
                        inv.type === "B2B" ? "bg-purple-50 text-purple-700" : "bg-teal-50 text-teal-700"
                      }`}>
                        {inv.type || "Retail"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono">₹{inv.subTotal?.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono text-emerald-600">-₹{inv.discount?.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono">₹{inv.gst?.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-800">₹{inv.total?.toLocaleString()}</td>
                    <td className="p-3.5 text-center font-bold text-slate-500">{inv.paymentMethod}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === "Paid" ? "bg-emerald-50 text-emerald-700" :
                        inv.status === "Partial" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {invoicesList.length === 0 && (
                  <tr>
                    <td colSpan="10" className="p-12 text-center text-slate-400 font-bold">
                      No transactions registered yet.
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

  return (
    <div className="bg-slate-50 min-h-screen p-6 font-sans text-xs font-semibold text-slate-600">
      
      {/* Module Title / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Billing & Sales Manager</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enterprise Invoice Engine & B2B Tax compliance</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetInvoice}
            className="px-3 py-2 border border-red-200 hover:bg-red-50 text-red-700 bg-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Clear Voucher (Ctrl+N)</span>
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-2xs mb-6 grid grid-cols-1 md:grid-cols-4 gap-1 w-full max-w-fit">
        {[
          { id: "gst-billing", label: "GST Billing Layout" },
          { id: "wholesale-billing", label: "Wholesale Bulk Billing" },
          { id: "b2b-invoice", label: "Tax Invoice Generation (B2B)" },
          { id: "invoice-history", label: "Invoice History" }
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
      {activeTab === "invoice-history" ? renderInvoiceHistory() : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 font-semibold text-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="">Barcode/SKU search product catalog... (Ctrl+F)</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - SKU: {p.sku} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cart Table Container */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-400 border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Product Details</th>
                    <th className="p-3.5">HSN Code</th>
                    <th className="p-3.5 text-center">GST %</th>
                    <th className="p-3.5 text-right">Taxable Value</th>
                    <th className="p-3.5 text-right">CGST (%)</th>
                    <th className="p-3.5 text-right">SGST (%)</th>
                    <th className="p-3.5 text-center">Qty</th>
                    <th className="p-3.5 text-right">Subtotal</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => {
                    const lineSub = item.price * item.quantity;
                    const lineDisc = lineSub * (item.discount / 100);
                    const taxable = lineSub - lineDisc;
                    const curCgstRate = item.cgstPercent !== undefined ? item.cgstPercent : Math.floor(item.gstPercent / 2);
                    const curSgstRate = item.sgstPercent !== undefined ? item.sgstPercent : (item.gstPercent - Math.floor(item.gstPercent / 2));
                    const gstVal = taxable * ((curCgstRate + curSgstRate + (item.igstPercent || 0)) / 100);

                    return (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-3.5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...cart];
                              updated[idx].name = e.target.value;
                              setCart(updated);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold text-slate-800 outline-none focus:border-indigo-500"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">{item.hsn}</td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-mono font-bold text-slate-800">
                              {curCgstRate + curSgstRate + (item.igstPercent || 0)}%
                            </span>
                            <button
                              onClick={() => triggerGstOverride(idx)}
                              className="p-0.5 hover:bg-slate-100 rounded text-indigo-600"
                              title="Override GST parameters"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-700">₹{taxable.toLocaleString()}</td>
                        <td className="p-3.5 text-right font-mono text-slate-400">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={curCgstRate}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = [...cart];
                              updated[idx].cgstPercent = val;
                              updated[idx].gstPercent = val + (updated[idx].sgstPercent !== undefined ? updated[idx].sgstPercent : curSgstRate) + (item.igstPercent || 0);
                              setCart(updated);
                            }}
                            className="w-12 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right font-mono font-bold text-slate-700 outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-400">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={curSgstRate}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = [...cart];
                              updated[idx].sgstPercent = val;
                              updated[idx].gstPercent = (updated[idx].cgstPercent !== undefined ? updated[idx].cgstPercent : curCgstRate) + val + (item.igstPercent || 0);
                              setCart(updated);
                            }}
                            className="w-12 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right font-mono font-bold text-slate-700 outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...cart];
                              updated[idx].quantity = Number(e.target.value);
                              updated[idx].totalPrice = (updated[idx].price - (updated[idx].price * (updated[idx].discount / 100))) * updated[idx].quantity;
                              setCart(updated);
                            }}
                            className="w-12 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-center font-mono font-bold text-slate-700"
                          />
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-800">₹{(taxable + gstVal).toLocaleString()}</td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {cart.length === 0 && (
                    <tr><td colSpan="9" className="p-12 text-center text-slate-400 font-bold">Cart is empty. Add products to configure invoice.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TAX BILLING SUMMARY PANEL */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-3 border-b border-slate-100">Checkout parameters</h3>

            {/* A. GST BILLING VIEW EXTRAS */}
            {activeTab === "gst-billing" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Select Customer (Ledger sync)</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setSelectedCustomerId(cid);
                      const found = customers.find(c => c._id === cid);
                      if (found) {
                        setManualCustomerName(found.name);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    <option value="">Select customer ledger...</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Customer / Business Name (B2B)</label>
                  <input
                    type="text"
                    placeholder="Enter manual name or edit selected..."
                    value={manualCustomerName}
                    onChange={(e) => setManualCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Assigned Salesperson (Commission)</label>
                  <select
                    value={salespersonId}
                    onChange={(e) => {
                      const sid = e.target.value;
                      setSalespersonId(sid);
                      const found = employees.find(emp => emp._id === sid);
                      if (found) {
                        setManualSalespersonName(found.name);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    <option value="">Select salesperson...</option>
                    {employees.filter(e => e.role === "Salesperson").map(e => (
                      <option key={e._id} value={e._id}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Or Enter / Edit Salesperson Name</label>
                  <input
                    type="text"
                    placeholder="Type custom salesperson name..."
                    value={manualSalespersonName}
                    onChange={(e) => setManualSalespersonName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* B. RETAIL BILLING WORKFLOW */}
            {activeTab === "retail-billing" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">POS Cashier Account</label>
                  <input
                    type="text"
                    disabled
                    value="Boutique POS cashier Terminal A"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-500"
                  />
                </div>
                 <div>
                   <label className="block text-slate-400 font-bold mb-1">Select customer loyalty profile</label>
                   <select
                     value={selectedCustomerId}
                     onChange={(e) => {
                       const cid = e.target.value;
                       setSelectedCustomerId(cid);
                       const found = customers.find(c => c._id === cid);
                       if (found) {
                         setManualCustomerName(found.name);
                       }
                     }}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800"
                   >
                     <option value="">Walk-in Customer</option>
                     {customers.map(c => (
                       <option key={c._id} value={c._id}>{c.name} (Loyalty Points: {c.loyaltyPoints || 0})</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-slate-400 font-bold mb-1">Customer / Business Name</label>
                   <input
                     type="text"
                     placeholder="Type customer name manually..."
                     value={manualCustomerName}
                     onChange={(e) => setManualCustomerName(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:border-indigo-500 outline-none"
                   />
                 </div>
                 <div>
                   <label className="block text-slate-400 font-bold mb-1">Assigned Salesperson (Commission)</label>
                   <select
                     value={salespersonId}
                     onChange={(e) => {
                       const sid = e.target.value;
                       setSalespersonId(sid);
                       const found = employees.find(emp => emp._id === sid);
                       if (found) {
                         setManualSalespersonName(found.name);
                       }
                     }}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                   >
                     <option value="">Select salesperson...</option>
                     {employees.filter(e => e.role === "Salesperson").map(e => (
                       <option key={e._id} value={e._id}>{e.name}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-slate-400 font-bold mb-1">Or Enter / Edit Salesperson Name</label>
                   <input
                     type="text"
                     placeholder="Type custom salesperson name..."
                     value={manualSalespersonName}
                     onChange={(e) => setManualSalespersonName(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:border-indigo-500 outline-none"
                   />
                 </div>
               </div>
            )}

             {/* C. WHOLESALE BILLING WORKFLOW */}
             {activeTab === "wholesale-billing" && (
               <div className="space-y-4">
                 <div>
                   <label className="block text-slate-400 font-bold mb-1">Dealer Company Account</label>
                   <select
                     value={selectedDealerId}
                     onChange={(e) => {
                       const did = e.target.value;
                       setSelectedDealerId(did);
                       const found = dealers.find(d => d.id === did);
                       if (found) {
                         setManualCustomerName(found.company);
                       }
                     }}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                   >
                     <option value="">Select dealer registry...</option>
                     {dealers.map(d => (
                       <option key={d.id} value={d.id}>{d.company} (GSTIN: {d.gstin})</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-slate-400 font-bold mb-1">Company / Business Name (Wholesale)</label>
                   <input
                     type="text"
                     placeholder="Enter manual name or edit selected..."
                     value={manualCustomerName}
                     onChange={(e) => setManualCustomerName(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:border-indigo-500 outline-none"
                   />
                 </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Transport LR No</label>
                    <input
                      type="text"
                      placeholder="e.g. LR-94819"
                      value={lrNumber}
                      onChange={(e) => setLrNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">E-Way Bill Number</label>
                    <input
                      type="text"
                      placeholder="e.g. EWAY-84918"
                      value={ewayBillNo}
                      onChange={(e) => setEwayBillNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Terms of payment</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800"
                  >
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                    <option value="COD">Cash On Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Assigned Salesperson (Commission)</label>
                  <select
                    value={salespersonId}
                    onChange={(e) => {
                      const sid = e.target.value;
                      setSalespersonId(sid);
                      const found = employees.find(emp => emp._id === sid);
                      if (found) {
                        setManualSalespersonName(found.name);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    <option value="">Select salesperson...</option>
                    {employees.filter(e => e.role === "Salesperson").map(e => (
                      <option key={e._id} value={e._id}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Or Enter / Edit Salesperson Name</label>
                  <input
                    type="text"
                    placeholder="Type custom salesperson name..."
                    value={manualSalespersonName}
                    onChange={(e) => setManualSalespersonName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* D. B2B COMPLIANT TAX INVOICE */}
            {activeTab === "b2b-invoice" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Select Customer (Ledger sync)</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setSelectedCustomerId(cid);
                      const found = customers.find(c => c._id === cid);
                      if (found) {
                        setManualCustomerName(found.name);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    <option value="">Select customer ledger...</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Customer / Business Name (B2B)</label>
                  <input
                    type="text"
                    placeholder="Enter manual name or edit selected..."
                    value={manualCustomerName}
                    onChange={(e) => setManualCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Assigned Salesperson (Commission)</label>
                  <select
                    value={salespersonId}
                    onChange={(e) => {
                      const sid = e.target.value;
                      setSalespersonId(sid);
                      const found = employees.find(emp => emp._id === sid);
                      if (found) {
                        setManualSalespersonName(found.name);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none"
                  >
                    <option value="">Select salesperson...</option>
                    {employees.filter(e => e.role === "Salesperson").map(e => (
                      <option key={e._id} value={e._id}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Or Enter / Edit Salesperson Name</label>
                  <input
                    type="text"
                    placeholder="Type custom salesperson name..."
                    value={manualSalespersonName}
                    onChange={(e) => setManualSalespersonName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Company logo GSTIN</label>
                  <input
                    type="text"
                    value={companyGstin}
                    onChange={(e) => setCompanyGstin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Billing address (Supplier)</label>
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Shipping depot address</label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* PAYMENT METHOD SPLIT/CASH SELECTOR */}
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800"
                >
                  <option value="Cash">Cash payment</option>
                  <option value="UPI">UPI Transfer</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Credit">Credit Ledger (Outstanding)</option>
                  <option value="Split">Split Payment</option>
                </select>
              </div>

              {paymentMethod === "Split" && (
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-slate-400 font-bold mb-0.5">Cash</label>
                    <input
                      type="number"
                      value={splitCash}
                      onChange={(e) => setSplitCash(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded p-1 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-0.5">UPI</label>
                    <input
                      type="number"
                      value={splitUPI}
                      onChange={(e) => setSplitUPI(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded p-1 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-0.5">Card</label>
                    <input
                      type="number"
                      value={splitCard}
                      onChange={(e) => setSplitCard(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded p-1 font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BILL CALCULATOR SUMMARY */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between items-center font-bold text-slate-600">
                <span>Subtotal Items</span>
                <span className="font-mono">₹{subTotal.toLocaleString()}</span>
              </div>
              {autoOffer && (
                <div className="flex justify-between items-center font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100/60">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Offer: {autoOffer.offerName}</span>
                  </span>
                  <span className="font-mono">-₹{(discountTotal - cart.reduce((acc, c) => acc + (c.price * c.quantity * (c.discount / 100)), 0)).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center font-bold text-slate-600">
                <span>Total CGST</span>
                <input
                  type="number"
                  placeholder="CGST total..."
                  value={manualCgstTotal !== "" ? manualCgstTotal : Math.round(taxTotal / 2)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setManualCgstTotal(val === "" ? "" : Number(val));
                  }}
                  className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-right font-mono font-bold text-slate-700 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-between items-center font-bold text-slate-600 pb-2 border-b border-slate-200/60">
                <span>Total SGST</span>
                <input
                  type="number"
                  placeholder="SGST total..."
                  value={manualSgstTotal !== "" ? manualSgstTotal : Math.round(taxTotal / 2)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setManualSgstTotal(val === "" ? "" : Number(val));
                  }}
                  className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-right font-mono font-bold text-slate-700 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-between items-end pt-1">
                <span className="text-xs font-bold text-slate-800 uppercase">Grand Total</span>
                <span className="font-mono font-black text-lg text-indigo-700">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              onClick={handleCheckoutSubmit}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-all shadow-md shadow-indigo-100"
            >
              Post Invoice & Update Stocks (Ctrl+S)
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================= */}
      {/* OVERRIDE MODAL */}
      {/* ========================================================= */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in font-semibold text-slate-600">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Override GST / HSN Values
            </h3>
            
            <form onSubmit={handleSaveOverride} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">CGST (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={ovCgstRate}
                    onChange={(e) => setOvCgstRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">SGST (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={ovSgstRate}
                    onChange={(e) => setOvSgstRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">IGST (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={ovIgstRate}
                    onChange={(e) => setOvIgstRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Total Rate</label>
                  <input
                    type="text"
                    disabled
                    value={`${ovCgstRate + ovSgstRate + ovIgstRate}%`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">New HSN Code</label>
                  <input
                    type="text"
                    required
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
    </div>
  );
};

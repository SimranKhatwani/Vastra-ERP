import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  ShieldCheck,
  FileSpreadsheet,
  Receipt,
  Building2,
  Calendar,
  Layers,
  PieChart,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  Landmark,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  BookOpen,
  Scale
} from "lucide-react";
import api from "../api/axios";

export const AccountingView = ({
  expenses: propExpenses = [],
  invoices: propInvoices = [],
  products: propProducts = [],
  purchaseOrders: propPurchaseOrders = [],
  purchaseInvoices: propPurchaseInvoices = [],
  vendors: propVendors = [],
  customers: propCustomers = [],
  employees: propEmployees = [],
  currentUser = null,
  setActiveModule,
  onAddExpense,
  onAddNotification,
}) => {
  const [activeTab, setActiveTab] = useState("pnl");

  // Live local data state with direct MongoDB sync fallback
  const [dbInvoices, setDbInvoices] = useState([]);
  const [dbExpenses, setDbExpenses] = useState([]);
  const [dbProducts, setDbProducts] = useState([]);
  const [dbPOs, setDbPOs] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Time Range / Period Filter state
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Search & Tab Filters
  const [journalSearch, setJournalSearch] = useState("");
  const [journalFilterType, setJournalFilterType] = useState("ALL");
  const [cashbookSearch, setCashbookSearch] = useState("");
  const [cashbookCategoryFilter, setCashbookCategoryFilter] = useState("ALL");

  // Add Expense Form Fields
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Miscellaneous");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expensePayMethod, setExpensePayMethod] = useState("UPI");
  const [expensePaidTo, setExpensePaidTo] = useState("");

  // Journal Vouchers state with persistent storage
  const [manualJournalVouchers, setManualJournalVouchers] = useState(() => {
    try {
      const saved = localStorage.getItem("vastra_accounting_journal_vouchers");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [showJournalModal, setShowJournalModal] = useState(false);
  const [jvDebitAcc, setJvDebitAcc] = useState("Salaries Account");
  const [jvCreditAcc, setJvCreditAcc] = useState("HDFC Bank Main");
  const [jvAmt, setJvAmt] = useState("");
  const [jvNarration, setJvNarration] = useState("");

  // GST filing compliance state with persistent storage
  const [gstr1Filed, setGstr1Filed] = useState(() => {
    try {
      const saved = localStorage.getItem("vastra_gstr1_status");
      return saved === "true";
    } catch (e) {
      return false;
    }
  });

  const [gstr3bFiled, setGstr3bFiled] = useState(() => {
    try {
      const saved = localStorage.getItem("vastra_gstr3b_status");
      return saved === "true";
    } catch (e) {
      return false;
    }
  });

  // Save manual vouchers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("vastra_accounting_journal_vouchers", JSON.stringify(manualJournalVouchers));
    } catch (e) {
      console.warn("Could not save manual journal vouchers to localStorage", e);
    }
  }, [manualJournalVouchers]);

  // Live Backend Data Fetcher & Synchronization Engine
  const fetchLiveAccountingData = useCallback(async (showToast = false) => {
    setIsSyncing(true);
    try {
      const [resBills, resExp, resProd, resPur] = await Promise.allSettled([
        api.get("/billing?limit=2000"),
        api.get("/expenses"),
        api.get("/products"),
        api.get("/purchase-orders")
      ]);

      if (resBills.status === "fulfilled" && resBills.value?.data) {
        const rawBills = resBills.value.data.data?.bills || resBills.value.data.data || resBills.value.data;
        if (Array.isArray(rawBills)) {
          setDbInvoices(rawBills);
        }
      }

      if (resExp.status === "fulfilled" && resExp.value?.data) {
        const rawExp = resExp.value.data.data || resExp.value.data;
        if (Array.isArray(rawExp)) {
          setDbExpenses(rawExp);
        }
      }

      if (resProd.status === "fulfilled" && resProd.value?.data) {
        const rawProd = resProd.value.data.data?.products || resProd.value.data.data || resProd.value.data;
        if (Array.isArray(rawProd)) {
          setDbProducts(rawProd);
        }
      }

      if (resPur.status === "fulfilled" && resPur.value?.data) {
        const rawPur = resPur.value.data.data?.bills || resPur.value.data.data || resPur.value.data;
        if (Array.isArray(rawPur)) {
          setDbPOs(rawPur);
        }
      }

      setLastSyncTime(new Date());
      if (showToast && typeof onAddNotification === "function") {
        onAddNotification(
          "Ledger Synchronized",
          "All general ledger, P&L, sales receipts, and operating expenses synced from live database.",
          "success"
        );
      }
    } catch (err) {
      console.warn("[AccountingView Live Sync]", err?.message);
    } finally {
      setIsSyncing(false);
    }
  }, [onAddNotification]);

  // Initial mount sync if props are empty or on mount
  useEffect(() => {
    fetchLiveAccountingData(false);
  }, [fetchLiveAccountingData]);

  // Listen for global data refresh events
  useEffect(() => {
    const handleGlobalRefresh = () => fetchLiveAccountingData(false);
    window.addEventListener("vastra-data-refresh", handleGlobalRefresh);
    return () => window.removeEventListener("vastra-data-refresh", handleGlobalRefresh);
  }, [fetchLiveAccountingData]);

  // Unified Effective Data Sources (combines props and DB fetched records)
  const allInvoices = useMemo(() => {
    if (propInvoices && propInvoices.length > 0) return propInvoices;
    return dbInvoices;
  }, [propInvoices, dbInvoices]);

  const allExpenses = useMemo(() => {
    if (propExpenses && propExpenses.length > 0) return propExpenses;
    return dbExpenses;
  }, [propExpenses, dbExpenses]);

  const allProducts = useMemo(() => {
    if (propProducts && propProducts.length > 0) return propProducts;
    return dbProducts;
  }, [propProducts, dbProducts]);

  const allPurchaseOrders = useMemo(() => {
    if (propPurchaseOrders && propPurchaseOrders.length > 0) return propPurchaseOrders;
    return dbPOs;
  }, [propPurchaseOrders, dbPOs]);

  // Product price lookup map for accurate COGS matching
  const productCostMap = useMemo(() => {
    const map = new Map();
    (allProducts || []).forEach(p => {
      const cost = Number(p.purchaseRate || p.costPrice || p.purchasePrice || 0);
      if (p.barcode) map.set(String(p.barcode).trim(), cost);
      if (p.itemCode) map.set(String(p.itemCode).trim(), cost);
      if (p._id) map.set(String(p._id), cost);
      if (p.id) map.set(String(p.id), cost);
      if (p.name) map.set(String(p.name).toLowerCase().trim(), cost);
    });
    return map;
  }, [allProducts]);

  // Date period filter helper
  const isDateInSelectedPeriod = useCallback((dateVal, period, startCustom, endCustom) => {
    if (!dateVal) return true;
    if (period === "all") return true;

    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return true;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (period === "today") {
      return d >= todayStart && d <= todayEnd;
    }
    if (period === "yesterday") {
      const yStart = new Date(todayStart);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(todayEnd);
      yEnd.setDate(yEnd.getDate() - 1);
      return d >= yStart && d <= yEnd;
    }
    if (period === "this_week") {
      const dayOfWeek = todayStart.getDay();
      const distanceToMonday = (dayOfWeek + 6) % 7;
      const mondayStart = new Date(todayStart);
      mondayStart.setDate(mondayStart.getDate() - distanceToMonday);
      return d >= mondayStart;
    }
    if (period === "last_7_days") {
      const past7 = new Date(todayStart);
      past7.setDate(past7.getDate() - 7);
      return d >= past7;
    }
    if (period === "this_month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return d >= startOfMonth;
    }
    if (period === "last_30_days") {
      const past30 = new Date(todayStart);
      past30.setDate(past30.getDate() - 30);
      return d >= past30;
    }
    if (period === "this_quarter") {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const startOfQuarter = new Date(now.getFullYear(), qMonth, 1, 0, 0, 0, 0);
      return d >= startOfQuarter;
    }
    if (period === "this_year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return d >= startOfYear;
    }
    if (period === "custom") {
      if (startCustom && d < new Date(startCustom + "T00:00:00")) return false;
      if (endCustom && d > new Date(endCustom + "T23:59:59")) return false;
      return true;
    }
    return true;
  }, []);

  // Filtered in-scope Invoices and Expenses
  const effectiveInvoices = useMemo(() => {
    return (allInvoices || []).filter(inv => {
      if (inv.status === "CANCELLED" || inv.isDeleted) return false;
      const dt = inv.billDate || inv.date || inv.createdAt;
      return isDateInSelectedPeriod(dt, selectedPeriod, customStartDate, customEndDate);
    });
  }, [allInvoices, selectedPeriod, customStartDate, customEndDate, isDateInSelectedPeriod]);

  const effectiveExpenses = useMemo(() => {
    return (allExpenses || []).filter(exp => {
      const dt = exp.date || exp.createdAt;
      return isDateInSelectedPeriod(dt, selectedPeriod, customStartDate, customEndDate);
    });
  }, [allExpenses, selectedPeriod, customStartDate, customEndDate, isDateInSelectedPeriod]);

  const effectivePurchaseOrders = useMemo(() => {
    return (allPurchaseOrders || []).filter(po => {
      const dt = po.billDate || po.date || po.poDate || po.createdAt;
      return isDateInSelectedPeriod(dt, selectedPeriod, customStartDate, customEndDate);
    });
  }, [allPurchaseOrders, selectedPeriod, customStartDate, customEndDate, isDateInSelectedPeriod]);

  // 1. Compute Sales Turnover from Filtered Invoices
  const totalSalesRevenue = useMemo(() => {
    return effectiveInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || Number(inv.totalAmount) || 0), 0);
  }, [effectiveInvoices]);

  // 2. Real Cost of Goods Sold (COGS) from Real Purchase Rates & Product Master
  const realCOGS = useMemo(() => {
    return effectiveInvoices.reduce((sum, inv) => {
      if (inv.purchaseCostTotal !== undefined && inv.purchaseCostTotal !== null && Number(inv.purchaseCostTotal) > 0) {
        return sum + Number(inv.purchaseCostTotal);
      }
      const itemCost = (inv.items || []).reduce((isum, it) => {
        let rate = Number(it.purchasePrice || it.purchaseRate || it.costPrice || 0);
        if (!rate || rate <= 0) {
          const barcodeKey = it.barcode ? String(it.barcode).trim() : null;
          const codeKey = it.itemCode ? String(it.itemCode).trim() : null;
          const nameKey = it.name ? String(it.name).toLowerCase().trim() : null;
          const pId = it.productId || it.id || it._id;

          rate = (barcodeKey && productCostMap.get(barcodeKey)) ||
                 (codeKey && productCostMap.get(codeKey)) ||
                 (pId && productCostMap.get(String(pId))) ||
                 (nameKey && productCostMap.get(nameKey)) ||
                 0;
        }

        // Standard wholesale margin assumption fallback if item rate is unrecorded (45% of retail selling price)
        if (!rate || rate <= 0) {
          const sellPrice = Number(it.price || it.sellingPrice || it.mrp || 0);
          rate = sellPrice > 0 ? (sellPrice * 0.45) : 0;
        }

        const qty = Number(it.quantity || it.qty || 1);
        return isum + (rate * qty);
      }, 0);
      return sum + itemCost;
    }, 0);
  }, [effectiveInvoices, productCostMap]);

  const isCostAvailable = realCOGS > 0;
  const cogsValue = realCOGS;

  // 3. Real Expenses Paid
  const totalExpensesPaid = useMemo(() => {
    return effectiveExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [effectiveExpenses]);

  // 4. Real Customer Dues / Receivables
  const totalReceivables = useMemo(() => {
    return effectiveInvoices.reduce((sum, inv) => sum + (Number(inv.dueAmount) || 0), 0);
  }, [effectiveInvoices]);

  // 5. Total Purchases Incurred
  const totalPurchasesAmount = useMemo(() => {
    return effectivePurchaseOrders.reduce((sum, po) => sum + (Number(po.grandTotal || po.totalAmount || po.amount || 0)), 0);
  }, [effectivePurchaseOrders]);

  // 6. Profit Metrics
  const grossProfit = isCostAvailable ? (totalSalesRevenue - cogsValue) : totalSalesRevenue;
  const grossMarginPct = totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100).toFixed(1) : "0.0";
  const netProfit = grossProfit - totalExpensesPaid;
  const netMarginPct = totalSalesRevenue > 0 ? ((netProfit / totalSalesRevenue) * 100).toFixed(1) : "0.0";

  // 7. Expense Breakdown by Category
  const expenseByCategory = useMemo(() => {
    const map = {};
    effectiveExpenses.forEach(exp => {
      const cat = exp.category || "Miscellaneous";
      map[cat] = (map[cat] || 0) + (Number(exp.amount) || 0);
    });
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpensesPaid > 0 ? ((amount / totalExpensesPaid) * 100).toFixed(1) : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [effectiveExpenses, totalExpensesPaid]);

  // 8. Real GST Output Liabilities
  const { totalCGST, totalSGST, totalIGST, totalGSTTax, taxableSales, b2bSales, b2cSales } = useMemo(() => {
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let totalTax = 0;
    let taxable = 0;
    let b2b = 0;
    let b2c = 0;

    effectiveInvoices.forEach(inv => {
      const invTaxable = Number(inv.taxableAmount) || (inv.isGstApplied ? Number(inv.grandTotal) / (1 + (Number(inv.gstRate) || 12) / 100) : Number(inv.grandTotal) || 0);
      const invCGST = Number(inv.cgstAmount) || (inv.isGstApplied ? (Number(inv.totalTax || 0) / 2) : 0);
      const invSGST = Number(inv.sgstAmount) || (inv.isGstApplied ? (Number(inv.totalTax || 0) / 2) : 0);
      const invIGST = Number(inv.igstAmount || 0);
      const invTax = Number(inv.totalTax) || (invCGST + invSGST + invIGST);

      taxable += invTaxable;
      cgst += invCGST;
      sgst += invSGST;
      igst += invIGST;
      totalTax += invTax;

      const hasGstin = Boolean(inv.customerGst || inv.gstin || inv.customerId?.gstin);
      if (hasGstin) b2b += (Number(inv.grandTotal) || 0);
      else b2c += (Number(inv.grandTotal) || 0);
    });

    return {
      totalCGST: cgst,
      totalSGST: sgst,
      totalIGST: igst,
      totalGSTTax: totalTax,
      taxableSales: taxable,
      b2bSales: b2b,
      b2cSales: b2c
    };
  }, [effectiveInvoices]);

  // 9. Synthesize Complete Double Entry General Journal Vouchers
  const synthesizedJournalVouchers = useMemo(() => {
    const list = [];

    // A. Double-entry vouchers from Sales Receipts
    effectiveInvoices.forEach(inv => {
      const invAmt = Number(inv.grandTotal || inv.totalAmount || 0);
      if (invAmt <= 0) return;

      const dateStr = inv.billDate || inv.date || (inv.createdAt ? inv.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
      const payMode = (inv.paymentMethod || 'Cash').toLowerCase();
      const due = Number(inv.dueAmount || 0);

      let debitAcc = "Operating Cash-in-hand";
      if (due > 0 && due >= invAmt) {
        debitAcc = `Accounts Receivable (${inv.customerName || 'Walk-in Customer'})`;
      } else if (payMode.includes("upi") || payMode.includes("bank") || payMode.includes("card") || payMode.includes("qr") || payMode.includes("pos")) {
        debitAcc = "HDFC Bank Main (UPI/Cards)";
      } else if (payMode.includes("credit")) {
        debitAcc = `Accounts Receivable (${inv.customerName || 'Walk-in Customer'})`;
      }

      list.push({
        id: `JV-SLS-${inv.invoiceNo || inv.billNo || inv._id?.slice(-6) || 'BILL'}`,
        date: dateStr,
        type: "SALE",
        debitAccount: debitAcc,
        creditAccount: "Retail Sales Revenue (4000-REV)",
        amount: invAmt,
        narration: `Retail invoice bill #${inv.invoiceNo || inv.billNo || 'BILL'} for ${inv.customerName || 'Walk-in'} via ${inv.paymentMethod || 'Cash'}`,
        referenceId: inv._id || inv.id
      });
    });

    // B. Double-entry vouchers from Operating Expenses
    effectiveExpenses.forEach(exp => {
      const expAmt = Number(exp.amount || 0);
      if (expAmt <= 0) return;

      const dateStr = exp.date || (exp.createdAt ? exp.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
      const payMode = (exp.paymentMethod || 'UPI').toLowerCase();
      const creditAcc = payMode.includes("cash") ? "Operating Cash-in-hand" : "HDFC Bank Main";

      list.push({
        id: `JV-EXP-${exp._id?.slice(-6) || exp.id?.slice(-6) || Date.now().toString().slice(-6)}`,
        date: dateStr,
        type: "EXPENSE",
        debitAccount: `${exp.category || 'Operating'} Expense Account`,
        creditAccount: creditAcc,
        amount: expAmt,
        narration: exp.description || `Outflow for ${exp.category || 'General'}${exp.paidTo ? ` to ${exp.paidTo}` : ''}`,
        referenceId: exp._id || exp.id
      });
    });

    // C. Double-entry vouchers from Procurements & POs
    effectivePurchaseOrders.forEach(po => {
      const poAmt = Number(po.grandTotal || po.totalAmount || po.amount || 0);
      if (poAmt <= 0) return;

      const dateStr = po.billDate || po.date || po.poDate || (po.createdAt ? po.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
      const vendorName = po.vendorName || po.vendorId?.name || po.supplierName || 'Apparel Mill';

      list.push({
        id: `JV-PUR-${po.billNumber || po.billNo || po.poNo || po._id?.slice(-6) || 'PO'}`,
        date: dateStr,
        type: "PURCHASE",
        debitAccount: "Apparel Inventory Stock (1200-STOCK)",
        creditAccount: `Accounts Payable (${vendorName})`,
        amount: poAmt,
        narration: `Procurement PO #${po.billNumber || po.billNo || po.poNo || 'PO'} from ${vendorName}`,
        referenceId: po._id || po.id
      });
    });

    // D. User-created manual Journal Vouchers
    manualJournalVouchers.forEach(jv => {
      const dt = jv.date;
      if (isDateInSelectedPeriod(dt, selectedPeriod, customStartDate, customEndDate)) {
        list.push({
          ...jv,
          type: "MANUAL"
        });
      }
    });

    // Sort chronologically descending
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [effectiveInvoices, effectiveExpenses, effectivePurchaseOrders, manualJournalVouchers, selectedPeriod, customStartDate, customEndDate, isDateInSelectedPeriod]);

  // Filtered Journal Vouchers based on search and type filter
  const filteredJournalVouchers = useMemo(() => {
    return synthesizedJournalVouchers.filter(jv => {
      if (journalFilterType !== "ALL" && jv.type !== journalFilterType) return false;
      if (journalSearch.trim()) {
        const query = journalSearch.toLowerCase().trim();
        const matchId = String(jv.id || '').toLowerCase().includes(query);
        const matchDr = String(jv.debitAccount || '').toLowerCase().includes(query);
        const matchCr = String(jv.creditAccount || '').toLowerCase().includes(query);
        const matchNarr = String(jv.narration || '').toLowerCase().includes(query);
        if (!matchId && !matchDr && !matchCr && !matchNarr) return false;
      }
      return true;
    });
  }, [synthesizedJournalVouchers, journalFilterType, journalSearch]);

  // Filtered Cashbook records
  const filteredCashbookExpenses = useMemo(() => {
    return effectiveExpenses.filter(exp => {
      if (cashbookCategoryFilter !== "ALL" && (exp.category || "Miscellaneous") !== cashbookCategoryFilter) return false;
      if (cashbookSearch.trim()) {
        const query = cashbookSearch.toLowerCase().trim();
        const matchCat = String(exp.category || '').toLowerCase().includes(query);
        const matchDesc = String(exp.description || '').toLowerCase().includes(query);
        const matchPaidTo = String(exp.paidTo || '').toLowerCase().includes(query);
        const matchMethod = String(exp.paymentMethod || '').toLowerCase().includes(query);
        if (!matchCat && !matchDesc && !matchPaidTo && !matchMethod) return false;
      }
      return true;
    });
  }, [effectiveExpenses, cashbookCategoryFilter, cashbookSearch]);

  // Add Expense Handler
  const handleCreateExpenseSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(expenseAmount);
    if (!amt || amt <= 0) return;

    const newExp = {
      date: new Date().toISOString().slice(0, 10),
      category: expenseCategory,
      amount: amt,
      description: expenseDesc || `${expenseCategory} outflow`,
      paymentMethod: expensePayMethod,
      paidTo: expensePaidTo || ''
    };

    if (typeof onAddExpense === "function") {
      await onAddExpense(newExp);
    } else {
      try {
        const res = await api.post("/expenses", newExp);
        if (res.data?.success) {
          setDbExpenses(prev => [{ ...res.data.data, id: res.data.data._id }, ...prev]);
        }
      } catch (err) {
        console.error("Failed to post expense directly", err);
      }
    }

    if (typeof onAddNotification === "function") {
      onAddNotification(
        "Expense Recorded",
        `Logged ₹${amt.toLocaleString("en-IN")} under ${expenseCategory}. General ledger debit voucher updated.`,
        "success"
      );
    }

    setExpenseAmount("");
    setExpenseDesc("");
    setExpensePaidTo("");

    // Trigger instant background sync
    setTimeout(() => fetchLiveAccountingData(false), 300);
  };

  // Post Manual Journal Voucher Handler
  const handleCreateJournalVoucher = (e) => {
    e.preventDefault();
    const amt = Number(jvAmt);
    if (!amt || amt <= 0) return;

    const newJV = {
      id: `JV-MAN-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
      debitAccount: jvDebitAcc,
      creditAccount: jvCreditAcc,
      amount: amt,
      narration: jvNarration || `Journal transfer from ${jvCreditAcc} to ${jvDebitAcc}`,
      type: "MANUAL"
    };

    setManualJournalVouchers((prev) => [newJV, ...prev]);

    if (typeof onAddNotification === "function") {
      onAddNotification(
        "Journal Voucher Posted",
        `Posted double-entry debit to ${jvDebitAcc} and credit to ${jvCreditAcc} for ₹${amt.toLocaleString("en-IN")}.`,
        "success"
      );
    }
    setShowJournalModal(false);
    setJvAmt("");
    setJvNarration("");
  };

  // Export Double-Entry Journal CSV
  const handleExportJournalCSV = () => {
    const headers = "Voucher ID,Date,Type,Debit Account (Dr),Credit Account (Cr),Amount (INR),Narration\n";
    const rows = filteredJournalVouchers.map(jv => {
      const cleanNarr = (jv.narration || '').replace(/"/g, '""');
      return `"${jv.id}","${jv.date}","${jv.type}","${jv.debitAccount}","${jv.creditAccount}",${Number(jv.amount || 0).toFixed(2)},"${cleanNarr}"\n`;
    }).join("");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `General_Ledger_Journal_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof onAddNotification === "function") {
      onAddNotification("Journal Exported", "Double-entry general journal exported to CSV.", "success");
    }
  };

  // Export Expenses Cashbook CSV
  const handleExportCashbookCSV = () => {
    const headers = "Date,Category,Description,Paid To,Payment Method,Amount (INR)\n";
    const rows = filteredCashbookExpenses.map(exp => {
      const cleanDesc = (exp.description || '').replace(/"/g, '""');
      const cleanPaidTo = (exp.paidTo || '').replace(/"/g, '""');
      return `"${exp.date || exp.createdAt?.slice(0, 10)}","${exp.category || 'General'}","${cleanDesc}","${cleanPaidTo}","${exp.paymentMethod || 'UPI'}",${Number(exp.amount || 0).toFixed(2)}\n`;
    }).join("");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Corporate_Cashbook_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof onAddNotification === "function") {
      onAddNotification("Cashbook Exported", "Expenses cashbook ledger exported to CSV.", "success");
    }
  };

  // Export GSTR-1 CSV
  const handleExportGSTR1 = () => {
    const headers = "Invoice No,Date,Customer,Customer Phone,GSTIN,Taxable Value (INR),CGST (INR),SGST (INR),IGST (INR),Total Tax (INR),Grand Total (INR)\n";
    const rows = effectiveInvoices
      .map((inv) => {
        const invTaxable = (Number(inv.taxableAmount) || (inv.isGstApplied ? Number(inv.grandTotal) / (1 + (Number(inv.gstRate) || 12) / 100) : Number(inv.grandTotal) || 0)).toFixed(2);
        const invCGST = (Number(inv.cgstAmount) || (inv.isGstApplied ? (Number(inv.totalTax || 0) / 2) : 0)).toFixed(2);
        const invSGST = (Number(inv.sgstAmount) || (inv.isGstApplied ? (Number(inv.totalTax || 0) / 2) : 0)).toFixed(2);
        const invIGST = (Number(inv.igstAmount) || 0).toFixed(2);
        const invTax = (Number(inv.totalTax) || (Number(invCGST) + Number(invSGST) + Number(invIGST))).toFixed(2);
        const gstin = inv.customerGst || inv.gstin || inv.customerId?.gstin || "Unregistered (B2C)";
        const cleanCustName = (inv.customerName || inv.customerId?.name || "Walk-in Customer").replace(/"/g, '""');

        return `"${inv.invoiceNo || inv.billNo}","${inv.billDate || inv.date || inv.createdAt?.slice(0, 10) || ''}","${cleanCustName}","${inv.customerPhone || ''}","${gstin}",${invTaxable},${invCGST},${invSGST},${invIGST},${invTax},${Number(inv.grandTotal || 0).toFixed(2)}\n`;
      })
      .join("");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GSTR_1_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (typeof onAddNotification === "function") {
      onAddNotification(
        "GST Exporter",
        "GSTR-1 compliant sales ledger exported to CSV successfully.",
        "success",
      );
    }
  };

  const periodOptions = [
    { id: "all", label: "All Time (Complete Sync)" },
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "this_week", label: "This Week" },
    { id: "last_7_days", label: "Last 7 Days" },
    { id: "this_month", label: "This Month" },
    { id: "last_30_days", label: "Last 30 Days" },
    { id: "this_quarter", label: "This Quarter" },
    { id: "this_year", label: "This Financial Year" },
    { id: "custom", label: "Custom Date Range" }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="accounting-ledger-root">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-mono border border-emerald-500/30 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              General Ledger & Profit
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Live Double-Entry Financial Engine
            </span>
            {currentUser?.role && (
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border border-indigo-500/30">
                Viewing as: {currentUser.role}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Financial Ledger & Real-time Profit Center
          </h1>
          <p className="text-xs text-slate-300 max-w-3xl">
            Live profit & loss statement, complete double-entry general journal, cashbook expenditures, adjusted trial balance, and GST compliance automatically synchronized across all sales, purchases, and operating outflows.
          </p>
        </div>

        {/* Action Controls & Live Sync */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchLiveAccountingData(true)}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh and synchronize all live records from MongoDB"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Live DB"}</span>
          </button>

          <button
            onClick={() => {
              setJvDebitAcc("Salaries Account");
              setJvCreditAcc("HDFC Bank Main");
              setJvAmt("");
              setShowJournalModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Post Journal Voucher</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar: Period Selector & Real-Time Sync Indicator */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Financial Period:</span>
          </div>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-indigo-500 cursor-pointer transition-colors"
          >
            {periodOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>

          {selectedPeriod === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 outline-none font-mono"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 outline-none font-mono"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <strong>{effectiveInvoices.length}</strong> Bills | <strong>{effectiveExpenses.length}</strong> Expenses | <strong>{synthesizedJournalVouchers.length}</strong> JVs
          </span>
          {lastSyncTime && (
            <span className="hidden sm:inline text-[10px] text-slate-400">
              Synced: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab("pnl")}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "pnl" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Profit & Loss Statement</span>
          </button>

          <button
            onClick={() => setActiveTab("journal")}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "journal" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Double Entry Journal ({synthesizedJournalVouchers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "ledger" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-rose-600" />
            <span>Expenses Cashbook ({effectiveExpenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("trial_balance")}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "trial_balance" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-600" />
            <span>Adjusted Trial Balance</span>
          </button>

          <button
            onClick={() => setActiveTab("gst")}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "gst" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-600" />
            <span>GST Audit & Compliance</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PROFIT & LOSS STATEMENT */}
      {/* ========================================================================= */}
      {activeTab === "pnl" && (
        <div className="space-y-6">
          {/* Top Core Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gross Sales Turnover */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Gross Sales Turnover
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  ₹{totalSalesRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Across {effectiveInvoices.length} billed transaction{effectiveInvoices.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 border border-indigo-100">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Cost of Goods Sold (COGS) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cost of Goods Sold (COGS)
                </span>
                <div className="text-2xl font-black text-amber-700 font-mono">
                  ₹{cogsValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {grossMarginPct}% Gross Margin
                </p>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 border border-amber-100">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Recorded Operating Expenses
                </span>
                <div className="text-2xl font-black text-rose-700 font-mono">
                  ₹{totalExpensesPaid.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {effectiveExpenses.length} corporate outflow{effectiveExpenses.length === 1 ? '' : 's'} logged
                </p>
              </div>
              <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600 border border-rose-100">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>

            {/* Calculated Net Yield */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Calculated Net Profit / Yield
                </span>
                <div className={`text-2xl font-black font-mono ${netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  ₹{netProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <span>Net Margin:</span>
                  <span className="font-bold text-slate-800 font-mono">{netMarginPct}%</span>
                </p>
              </div>
              <div className={`p-2.5 rounded-xl border ${netProfit >= 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Detailed Statement Ledger Sheet */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Profit & Loss Statement (Real-Time Accounting Breakdown)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Computed directly from processed retail sale receipts, purchase costs (COGS), and recorded operational outflows.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                Financial Period: {periodOptions.find(p => p.id === selectedPeriod)?.label || selectedPeriod}
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs font-semibold">
              <div className="py-3.5 flex justify-between items-center">
                <span className="text-slate-800 font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span>1. Gross Operating Sales Revenue (Billed Invoices)</span>
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ₹{totalSalesRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="py-3 flex justify-between items-center pl-4 text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>2. Cost of Goods Sold (COGS from Purchase Rates & Product Master)</span>
                </span>
                <span className="font-mono text-amber-700 font-bold">
                  {isCostAvailable ? `-₹${cogsValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "₹0.00 (Standard Purchase Rates Active)"}
                </span>
              </div>

              <div className="py-3.5 flex justify-between items-center bg-indigo-50/60 px-3.5 rounded-xl text-indigo-950 border border-indigo-100">
                <span className="font-bold flex items-center gap-2">
                  <span>3. Gross Margin Profit</span>
                  <span className="text-[10px] font-mono font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                    {grossMarginPct}% Margin
                  </span>
                </span>
                <span className="font-mono font-black text-indigo-700 text-sm">
                  ₹{grossProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="py-3 flex justify-between items-center pl-4 text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>4. Total Recorded Operating Expenses (Payroll, Rent, Logistics, Utilities)</span>
                </span>
                <span className="font-mono text-rose-600 font-bold">
                  -₹{totalExpensesPaid.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="py-4 flex justify-between items-center bg-slate-900 px-4 rounded-xl text-white shadow-xs">
                <span className="font-bold flex items-center gap-2">
                  <span className="text-sm">5. Net Operating Profit / Income Yield</span>
                  <span className="text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-md border border-slate-700">
                    {netMarginPct}% Net Yield
                  </span>
                </span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  ₹{netProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Category-wise Expense Breakdown if expenses exist */}
            {expenseByCategory.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>Real Expense Category Breakdown</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {expenseByCategory.map((cat, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{cat.category}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{cat.percentage}% of outflows</div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900 text-xs">
                        ₹{cat.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Transaction-Level Profitability Audit Stream */}
          {effectiveInvoices.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-wide">
                    Sales Transaction Profitability Breakdown
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Itemized margin, COGS deduction, and operating yield across all real billed sales.
                  </p>
                </div>
                <span className="font-mono text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  {effectiveInvoices.length} Bills
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80 tracking-wider text-[11px]">
                      <th className="p-3.5">Bill No / Date</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5 text-right font-mono">Gross Sales</th>
                      <th className="p-3.5 text-right font-mono">COGS Cost</th>
                      <th className="p-3.5 text-right font-mono">Gross Profit</th>
                      <th className="p-3.5 text-right font-mono">Margin</th>
                      <th className="p-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {effectiveInvoices.slice(0, 30).map((inv, idx) => {
                      const sVal = Number(inv.grandTotal || inv.totalAmount || 0);
                      let cVal = 0;
                      if (inv.purchaseCostTotal !== undefined && Number(inv.purchaseCostTotal) > 0) {
                        cVal = Number(inv.purchaseCostTotal);
                      } else {
                        cVal = (inv.items || []).reduce((isum, it) => {
                          let r = Number(it.purchasePrice || it.purchaseRate || it.costPrice || 0);
                          if (!r) {
                            r = productCostMap.get(String(it.barcode || '').trim()) || (Number(it.price || it.sellingPrice || 0) * 0.45);
                          }
                          return isum + (r * Number(it.quantity || it.qty || 1));
                        }, 0);
                      }
                      const gp = sVal - cVal;
                      const margin = sVal > 0 ? ((gp / sVal) * 100).toFixed(1) : "0.0";

                      return (
                        <tr key={inv._id || inv.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 font-mono">
                            <div className="font-bold text-indigo-700">{inv.invoiceNo || inv.billNo || `BILL-${inv._id?.slice(-6)}`}</div>
                            <div className="text-[10px] text-slate-400">{inv.billDate || inv.date || inv.createdAt?.slice(0, 10)}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{inv.customerName || inv.customerId?.name || 'Walk-in Customer'}</div>
                            <div className="text-[10px] text-slate-400">{inv.paymentMethod || 'Cash'}</div>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                            ₹{sVal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-right font-mono text-amber-700">
                            ₹{cVal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                            ₹{gp.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                            {margin}%
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${gp >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                              {gp >= 0 ? "Profitable" : "Loss"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DOUBLE ENTRY GENERAL JOURNAL */}
      {/* ========================================================================= */}
      {activeTab === "journal" && (
        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Double Entry General Journal (Live Reconciled Ledger)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Audit-compliant chronological double-entry vouchers automatically synthesized from sales receipts, expenses, and vendor purchases.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportJournalCSV}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Journal CSV</span>
              </button>

              <button
                onClick={() => {
                  setJvDebitAcc("Salaries Account");
                  setJvCreditAcc("HDFC Bank Main");
                  setJvAmt("");
                  setShowJournalModal(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Post Journal Voucher</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Voucher ID, account, or narration..."
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {["ALL", "SALE", "EXPENSE", "PURCHASE", "MANUAL"].map(t => (
                <button
                  key={t}
                  onClick={() => setJournalFilterType(t)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                    journalFilterType === t
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t === "ALL" ? "All Vouchers" : t === "SALE" ? "Sales (Dr/Cr)" : t === "EXPENSE" ? "Expenses" : t === "PURCHASE" ? "Purchases" : "Manual JVs"}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80 tracking-wider text-[11px]">
                    <th className="p-3.5">Voucher ID</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Account Debit (Dr)</th>
                    <th className="p-3.5">Account Credit (Cr)</th>
                    <th className="p-3.5 text-right font-mono">Amount (₹)</th>
                    <th className="p-3.5">Narration Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredJournalVouchers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Receipt className="w-8 h-8 text-slate-300" />
                          <p className="font-bold text-slate-600 text-xs">No journal vouchers match the criteria</p>
                          <p className="text-[11px] text-slate-400">
                            Processed sales bills, recorded expenses, and vendor purchases automatically generate double-entry vouchers here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredJournalVouchers.map((jv, idx) => (
                      <tr key={jv.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-indigo-700">
                          {jv.id}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">{jv.date}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            jv.type === "SALE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            jv.type === "EXPENSE" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                            jv.type === "PURCHASE" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}>
                            {jv.type}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {jv.debitAccount}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                            {jv.creditAccount}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          ₹{Number(jv.amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium max-w-xs truncate" title={jv.narration}>
                          {jv.narration}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EXPENSES CASHBOOK */}
      {/* ========================================================================= */}
      {activeTab === "ledger" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Create expense form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 lg:col-span-4 space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-rose-600" />
                <span>Log Corporate Debit Outflow</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Record real store operating expenses, payroll, rent, or maintenance outflows.
              </p>
            </div>

            <form onSubmit={handleCreateExpenseSubmit} className="space-y-3.5">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">
                  Expense Category *
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="Rent">Rent & Lease</option>
                  <option value="Electricity">Electricity & Utilities</option>
                  <option value="Salaries">Payroll & Karigar Salaries</option>
                  <option value="Marketing">Marketing & Advertising</option>
                  <option value="Logistics">Supply Logistics & Freight</option>
                  <option value="Maintenance">Store Maintenance & Repairs</option>
                  <option value="IT & Software">Software & IT Subscriptions</option>
                  <option value="Miscellaneous">Miscellaneous Outflow</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">
                  Payment Amount (₹) *
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Enter expense amount..."
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">
                  Payment Method
                </label>
                <select
                  value={expensePayMethod}
                  onChange={(e) => setExpensePayMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="UPI">UPI / Digital QR</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Card">Corporate Debit/Credit Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">
                  Paid To (Recipient / Vendor)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Landlord, Electricity Board, Vendor..."
                  value={expensePaidTo}
                  onChange={(e) => setExpensePaidTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">
                  Description / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid monthly showroom electricity bill..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Record Operating Expense</span>
              </button>
            </form>
          </div>

          {/* Expenses history table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden lg:col-span-8 space-y-3">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Cashbook Expenditure Ledger
                </h4>
                <p className="text-[11px] text-slate-500">
                  {filteredCashbookExpenses.length} recorded corporate disbursement{filteredCashbookExpenses.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCashbookCSV}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <span className="font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-xs">
                  Total: ₹{totalExpensesPaid.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Filter row */}
            <div className="px-4 pb-2 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter expenses by category, paid to, or remarks..."
                  value={cashbookSearch}
                  onChange={(e) => setCashbookSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <select
                value={cashbookCategoryFilter}
                onChange={(e) => setCashbookCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Rent">Rent</option>
                <option value="Electricity">Electricity</option>
                <option value="Salaries">Salaries</option>
                <option value="Marketing">Marketing</option>
                <option value="Logistics">Logistics</option>
                <option value="Maintenance">Maintenance</option>
                <option value="IT & Software">IT & Software</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80 tracking-wider text-[11px]">
                    <th className="p-3.5">Disbursement Date</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Payment Route</th>
                    <th className="p-3.5 text-right">Debit Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredCashbookExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Receipt className="w-8 h-8 text-slate-300" />
                          <p className="font-bold text-slate-600 text-xs">No expenditure entries found</p>
                          <p className="text-[11px] text-slate-400">
                            Use the form on the left to record real corporate expenses.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCashbookExpenses.map((exp, idx) => (
                      <tr key={exp._id || exp.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono text-slate-500">
                          {exp.date || (exp.createdAt ? exp.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10))}
                        </td>
                        <td className="p-3.5">
                          <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                            {exp.category || "General"}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-xs truncate text-slate-800">
                          <div>{exp.description || `${exp.category} outflow`}</div>
                          {exp.paidTo && <div className="text-[10px] text-slate-400 font-normal">To: {exp.paidTo}</div>}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-600">
                          {exp.paymentMethod || "UPI"}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                          ₹{Number(exp.amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CORPORATE ADJUSTED TRIAL BALANCE */}
      {/* ========================================================================= */}
      {activeTab === "trial_balance" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden text-xs">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/50">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Corporate Adjusted Trial Balance</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time general ledger reconciliation showing verified debit assets & expenses vs credit revenue & liabilities.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black uppercase font-mono">
              ✓ Verified Balanced Ledger
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80 tracking-wider text-[11px]">
                  <th className="p-3.5">Account Code</th>
                  <th className="p-3.5">Ledger Account Description</th>
                  <th className="p-3.5 text-right font-mono">Debit Balance (Dr)</th>
                  <th className="p-3.5 text-right font-mono">Credit Balance (Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {/* 1. Cash & Bank Net Inflows */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-mono text-slate-400">1001-CASH</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    Operating Cash & Bank Accounts (Net Collected Funds)
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-900 font-bold">
                    ₹{Math.max(0, totalSalesRevenue - totalReceivables - totalExpensesPaid).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">—</td>
                </tr>

                {/* 2. Accounts Receivable (Customer Unpaid Dues) */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-mono text-slate-400">1100-RECV</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    Accounts Receivable (Customer Ledger Unpaid Dues)
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-900 font-bold">
                    ₹{totalReceivables.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">—</td>
                </tr>

                {/* 3. Inventory Stock / Cost of Goods Sold */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-mono text-slate-400">1200-STOCK</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    Apparel Inventory Cost (COGS & Purchases Valuation)
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-900 font-bold">
                    ₹{Math.max(cogsValue, totalPurchasesAmount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">—</td>
                </tr>

                {/* 4. Sales Revenue */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-mono text-slate-400">4000-REV</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    Retail & Counter Billed Sales Revenue
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">—</td>
                  <td className="p-3.5 text-right font-mono text-indigo-700 font-bold">
                    ₹{totalSalesRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* 5. Operational Overhead Expenses */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-mono text-slate-400">5000-EXP</td>
                  <td className="p-3.5 font-bold text-slate-800">
                    Operational Overhead Expenses (Payroll, Rent, Logistics)
                  </td>
                  <td className="p-3.5 text-right font-mono text-rose-600 font-bold">
                    ₹{totalExpensesPaid.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">—</td>
                </tr>

                {/* Aggregate Balanced Sum */}
                <tr className="bg-slate-900 text-white font-bold">
                  <td className="p-4" colSpan={2}>
                    <div className="font-bold text-sm">Aggregate Ledger Compliance Sum</div>
                    <div className="text-[10px] text-slate-400 font-normal">Matching debits and credits verified across all real ledger entries</div>
                  </td>
                  <td className="p-4 text-right font-mono text-emerald-400 font-black text-sm">
                    ₹{(
                      Math.max(0, totalSalesRevenue - totalReceivables - totalExpensesPaid) +
                      totalReceivables +
                      Math.max(cogsValue, totalPurchasesAmount) +
                      totalExpensesPaid
                    ).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right font-mono text-emerald-400 font-black text-sm">
                    ₹{(
                      totalSalesRevenue +
                      Math.max(cogsValue, totalPurchasesAmount)
                    ).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. GST AUDIT & COMPLIANCE REPORT */}
      {/* ========================================================================= */}
      {activeTab === "gst" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>GST Output Tax Liabilities (CGST + SGST + IGST Reconciled)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Derived directly from GST tax details across {effectiveInvoices.length} real sales invoice records.
                </p>
              </div>
              <button
                onClick={handleExportGSTR1}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all font-sans"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export GSTR-1 Audit CSV</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-sans block mb-1 font-bold">
                  Total Taxable Turnover
                </span>
                <span className="text-lg font-black text-slate-900">
                  ₹{taxableSales.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-sans block mb-1 font-bold">
                  Total CGST Output Liability
                </span>
                <span className="text-lg font-black text-slate-900">
                  ₹{totalCGST.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-sans block mb-1 font-bold">
                  Total SGST Output Liability
                </span>
                <span className="text-lg font-black text-slate-900">
                  ₹{totalSGST.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-sans block mb-1 font-bold">
                  Total GST Output Liability
                </span>
                <span className="text-lg font-black text-indigo-700">
                  ₹{totalGSTTax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              GST Return Filing & Compliance Timeline
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <div>
                  <p className="font-bold text-slate-900 text-xs">
                    GSTR-1 (Outward B2B & B2C Sales Returns)
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Monthly statutory deadline: 11th of succeeding month
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !gstr1Filed;
                    setGstr1Filed(next);
                    try { localStorage.setItem("vastra_gstr1_status", String(next)); } catch (e) {}
                    if (typeof onAddNotification === "function") {
                      onAddNotification(
                        "GSTR-1 Status",
                        next ? "GSTR-1 outward return marked as Filed." : "GSTR-1 status changed to Pending.",
                        "info"
                      );
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    gstr1Filed ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {gstr1Filed ? "✓ Filed" : "Pending Filing"}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <div>
                  <p className="font-bold text-slate-900 text-xs">
                    GSTR-3B (Summary Tax Return & Payment)
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Monthly statutory deadline: 20th of succeeding month
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !gstr3bFiled;
                    setGstr3bFiled(next);
                    try { localStorage.setItem("vastra_gstr3b_status", String(next)); } catch (e) {}
                    if (typeof onAddNotification === "function") {
                      onAddNotification(
                        "GSTR-3B Status",
                        next ? "GSTR-3B summary return marked as Filed." : "GSTR-3B status changed to Pending.",
                        "info"
                      );
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    gstr3bFiled
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {gstr3bFiled ? "✓ Filed" : "Pending Filing"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: POST JOURNAL VOUCHER */}
      {/* ========================================================================= */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Post General Journal Voucher
                </h3>
                <p className="text-[11px] text-slate-500">Record a double-entry debit and credit transfer</p>
              </div>
              <button
                onClick={() => setShowJournalModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJournalVoucher} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Account Debit (Dr) *
                  </label>
                  <select
                    value={jvDebitAcc}
                    onChange={(e) => setJvDebitAcc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="Salaries Account">Salaries Account</option>
                    <option value="Rent Expense Account">Rent Expense Account</option>
                    <option value="Electricity Utilities">Electricity Utilities</option>
                    <option value="Apparel Inventory Stock">Apparel Inventory Stock</option>
                    <option value="Marketing & Promo">Marketing & Promo</option>
                    <option value="Operating Cash-in-hand">Operating Cash-in-hand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Account Credit (Cr) *
                  </label>
                  <select
                    value={jvCreditAcc}
                    onChange={(e) => setJvCreditAcc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="HDFC Bank Main">HDFC Bank Main</option>
                    <option value="Operating Cash-in-hand">Operating Cash-in-hand</option>
                    <option value="Accounts Payable">Accounts Payable</option>
                    <option value="Retail Sales Revenue">Retail Sales Revenue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Voucher Amount (INR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="Enter voucher amount..."
                  value={jvAmt}
                  onChange={(e) => setJvAmt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Narration Statement *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paid showroom floor lease or vendor settlement..."
                  value={jvNarration}
                  onChange={(e) => setJvNarration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-slate-800"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Post General Ledger</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

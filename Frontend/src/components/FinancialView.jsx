import api from '../api/axios';
import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Receipt as ReceiptIcon,
  PieChart,
  Calendar,
  Search,
  Filter,
  Download,
  Printer,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Building,
  User,
  RefreshCw,
  X,
  Share2,
  MessageSquare,
  Mail,
  Lock,
} from "lucide-react";

const API = "/financial";
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const Badge = ({ label, color = "slate" }) => {
  const map = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${map[color] || map.slate}`}>
      {label}
    </span>
  );
};

const KPICard = ({ icon: Icon, label, value, sub, color = "indigo", trend }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-all">
    <div className={`p-3 rounded-xl bg-${color}-50 shrink-0`}>
      <Icon className={`w-5 h-5 text-${color}-600`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{label}</p>
      <p className="text-lg font-black text-slate-800 mt-0.5 truncate">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{sub}</p>}
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-0.5 text-xs font-bold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
        {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {Math.abs(trend)}%
      </div>
    )}
  </div>
);

const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
    <div className={`bg-white rounded-2xl shadow-2xl border border-slate-100 w-full ${wide ? "max-w-4xl" : "max-w-lg"} max-h-[90vh] flex flex-col`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{title}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 p-5 text-xs">{children}</div>
    </div>
  </div>
);

const InputRow = ({ label, children, required }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] uppercase font-bold text-slate-500">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = "w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all bg-white";

export const FinancialView = ({ mode = "financial", onAddNotification, currentUser = {} }) => {
  // Tabs for Module 1: Financial Management
  const financialTabs = useMemo(() => [
    { id: "dashboard", label: "Financial Summary Dashboard", icon: BarChart3 },
    { id: "customer-ledger", label: "Customer Ledger", icon: User },
    { id: "vendor-ledger", label: "Vendor Ledger", icon: Building },
    { id: "profit-loss", label: "Profit & Loss Reports", icon: PieChart },
    { id: "incomes", label: "Income Management", icon: ArrowUpRight },
  ], []);

  // Tabs for Module 2: Accounts & Treasury Management
  const accountsTabs = useMemo(() => [
    { id: "cash-book", label: "Cash Book", icon: Wallet },
    { id: "bank-book", label: "Bank Book", icon: CreditCard },
    { id: "expenses", label: "Expense Management", icon: ArrowDownRight },
    { id: "payments", label: "Payment Tracking", icon: DollarSign },
    { id: "receipts", label: "Receipt Management", icon: ReceiptIcon },
  ], []);

  const currentTabs = mode === "accounts" ? accountsTabs : financialTabs;

  const [activeTab, setActiveTab] = useState(() => (mode === "accounts" ? "cash-book" : "dashboard"));

  useEffect(() => {
    if (!currentTabs.some((t) => t.id === activeTab)) {
      setActiveTab(currentTabs[0].id);
    }
  }, [mode, currentTabs]);

  // Global State for all tabs
  const [summary, setSummary] = useState(null);
  const [customerLedgers, setCustomerLedgers] = useState([]);
  const [vendorLedgers, setVendorLedgers] = useState([]);
  const [cashBook, setCashBook] = useState({ summary: {}, data: [] });
  const [bankBook, setBankBook] = useState({ summary: {}, data: [] });
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modals & Form States
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCashBankModal, setShowCashBankModal] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Forms
  const [expenseForm, setExpenseForm] = useState({
    category: "Miscellaneous",
    amount: "",
    gst: 0,
    date: new Date().toISOString().split("T")[0],
    description: "",
    paymentMethod: "Cash",
    vendorName: "",
    referenceNo: "",
    bankAccountName: "",
    remarks: "",
  });

  const [incomeForm, setIncomeForm] = useState({
    source: "Other Income",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paymentMode: "Cash",
    customerName: "",
    description: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    beneficiaryType: "Vendor",
    beneficiaryName: "",
    category: "Vendor Payment",
    amount: "",
    paymentMode: "Cash",
    referenceNo: "",
    bankAccountName: "",
    status: "Completed",
    remarks: "",
  });

  const [receiptForm, setReceiptForm] = useState({
    customerName: "",
    invoiceRef: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paymentMode: "Cash",
    bankAccountName: "",
    referenceNo: "",
    remarks: "",
  });

  const [cashBankForm, setCashBankForm] = useState({
    type: "Cash",
    direction: "In",
    source: "Opening Balance",
    bankAccountName: "HDFC Main Store Account",
    amount: "",
    remarks: "",
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

  // Income Management Search & Filters
  const [incomeSearch, setIncomeSearch] = useState("");
  const [incomeCategoryFilter, setIncomeCategoryFilter] = useState("All");
  const [incomeModeFilter, setIncomeModeFilter] = useState("All");

  // Profit & Loss State & Filters
  const [plPreset, setPlPreset] = useState("month");
  const [plCustomDates, setPlCustomDates] = useState({ start: "", end: "" });
  const [plSearchQuery, setPlSearchQuery] = useState("");

  // Cash Book Filters
  const [cashSearch, setCashSearch] = useState("");
  const [cashTypeFilter, setCashTypeFilter] = useState("All");
  const [cashCategoryFilter, setCashCategoryFilter] = useState("All");

  const filteredCashBookData = useMemo(() => {
    return (cashBook?.data || []).filter((row) => {
      const q = cashSearch.toLowerCase().trim();
      if (q) {
        const matchDesc = (row.description || "").toLowerCase().includes(q);
        const matchRef = (row.refNo || "").toLowerCase().includes(q);
        const matchCat = (row.category || "").toLowerCase().includes(q);
        if (!matchDesc && !matchRef && !matchCat) return false;
      }
      if (cashTypeFilter !== "All" && row.type !== cashTypeFilter) return false;
      if (cashCategoryFilter !== "All" && row.category !== cashCategoryFilter) return false;
      return true;
    });
  }, [cashBook, cashSearch, cashTypeFilter, cashCategoryFilter]);

  // Bank Book Filters
  const [bankSearch, setBankSearch] = useState("");
  const [bankTypeFilter, setBankTypeFilter] = useState("All");
  const [bankModeFilter, setBankModeFilter] = useState("All");

  const filteredBankBookData = useMemo(() => {
    return (bankBook?.data || []).filter((row) => {
      const q = bankSearch.toLowerCase().trim();
      if (q) {
        const matchParty = (row.party || "").toLowerCase().includes(q);
        const matchAccount = (row.bankAccountName || "").toLowerCase().includes(q);
        const matchRef = (row.refNo || "").toLowerCase().includes(q);
        const matchRemarks = (row.remarks || "").toLowerCase().includes(q);
        const matchMode = (row.mode || "").toLowerCase().includes(q);
        if (!matchParty && !matchAccount && !matchRef && !matchRemarks && !matchMode) return false;
      }
      if (bankTypeFilter !== "All" && row.type !== bankTypeFilter) return false;
      if (bankModeFilter !== "All" && row.mode !== bankModeFilter) return false;
      return true;
    });
  }, [bankBook, bankSearch, bankTypeFilter, bankModeFilter]);

  // Payment Tracking Filters
  const [paySearch, setPaySearch] = useState("");
  const [payCategoryFilter, setPayCategoryFilter] = useState("All");
  const [payBeneficiaryTypeFilter, setPayBeneficiaryTypeFilter] = useState("All");
  const [payModeFilter, setPayModeFilter] = useState("All");

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = paySearch.toLowerCase().trim();
      if (q) {
        const matchName = (p.beneficiaryName || "").toLowerCase().includes(q);
        const matchNo = (p.paymentNo || "").toLowerCase().includes(q);
        const matchRef = (p.referenceNo || "").toLowerCase().includes(q);
        const matchRemarks = (p.remarks || "").toLowerCase().includes(q);
        if (!matchName && !matchNo && !matchRef && !matchRemarks) return false;
      }
      if (payCategoryFilter !== "All" && p.category !== payCategoryFilter) return false;
      if (payBeneficiaryTypeFilter !== "All" && p.beneficiaryType !== payBeneficiaryTypeFilter) return false;
      if (payModeFilter !== "All" && p.paymentMode !== payModeFilter) return false;
      return true;
    });
  }, [payments, paySearch, payCategoryFilter, payBeneficiaryTypeFilter, payModeFilter]);

  const filteredIncomes = useMemo(() => {
    return incomes.filter((inc) => {
      const q = incomeSearch.toLowerCase().trim();
      if (q) {
        const matchCustomer = (inc.customerName || "").toLowerCase().includes(q);
        const matchNo = (inc.incomeNo || "").toLowerCase().includes(q);
        const matchRef = (inc.referenceNo || "").toLowerCase().includes(q);
        const matchSource = (inc.source || "").toLowerCase().includes(q);
        const matchMode = (inc.paymentMode || "").toLowerCase().includes(q);
        if (!matchCustomer && !matchNo && !matchRef && !matchSource && !matchMode) return false;
      }
      if (incomeCategoryFilter !== "All" && inc.source !== incomeCategoryFilter) {
        return false;
      }
      if (incomeModeFilter !== "All" && inc.paymentMode !== incomeModeFilter) {
        return false;
      }
      return true;
    });
  }, [incomes, incomeSearch, incomeCategoryFilter, incomeModeFilter]);

  // ---------------------------------------------------------------------------
  // Data Loaders
  // ---------------------------------------------------------------------------
  const loadDashboard = async () => {
    try {
      const res = await fetch(`${API}/dashboard`, { headers: authHeaders() });
      const data = res.data;
      if (data.success) setSummary(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCustomerLedgers = async () => {
    try {
      const res = await fetch(`${API}/customer-ledger`, { headers: authHeaders() });
      const data = res.data;
      if (data.success) setCustomerLedgers(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadVendorLedgers = async () => {
    try {
      const res = await fetch(`${API}/vendor-ledger`, { headers: authHeaders() });
      const data = res.data;
      if (data.success) setVendorLedgers(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCashBook = async () => {
    try {
      const res = await fetch(`${API}/cash-book`, { headers: authHeaders() });
      const data = res.data;
      if (data.success) setCashBook(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadBankBook = async () => {
    try {
      const res = await fetch(`${API}/bank-book`, { headers: authHeaders() });
      const data = res.data;
      if (data.success) setBankBook(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadExpenses = async () => {
    try {
      const res = await fetch(`${API}/expenses`, { headers: authHeaders() });
      const data = res.data;
      if (data.success) setExpenses(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadIncomes = async () => {
    try {
      const res = await fetch(`${API}/incomes`, { headers: authHeaders() });
      const data = res.data;
      if (data.success) setIncomes(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await fetch(`${API}/payments`, { headers: authHeaders() });
      const data = res.data;
      if (data.success) setPayments(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadReceipts = async () => {
    try {
      const res = await fetch(`${API}/receipts`, { headers: authHeaders() });
      const data = res.data;
      if (data.success) setReceipts(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadProfitLoss = async () => {
    try {
      let query = `?preset=${plPreset}`;
      if (plPreset === "custom" && plCustomDates.start && plCustomDates.end) {
        query = `?startDate=${plCustomDates.start}&endDate=${plCustomDates.end}`;
      }
      const res = await fetch(`${API}/profit-loss${query}`, { headers: authHeaders() });
      const data = res.data;
      if (data.success) setProfitLoss(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "profit-loss") {
      loadProfitLoss();
    }
  }, [activeTab, plPreset, plCustomDates]);

  const handleExportPLCSV = () => {
    if (!profitLoss?.kpis) return;
    const k = profitLoss.kpis;
    const rows = [
      ["Vastra ERP - Executive Profit & Loss Report"],
      ["Generated At", new Date().toLocaleString()],
      ["Preset Filter", plPreset.toUpperCase()],
      [""],
      ["KPI METRIC", "VALUE (INR)"],
      ["Total Sales", k.totalSales],
      ["Cost of Goods Sold (COGS)", k.cogs],
      ["Gross Profit", k.grossProfit],
      ["Other Income", k.otherIncome],
      ["Total Expenses", k.totalExpenses],
      ["Net Profit / Loss", k.netProfit],
      ["Profit Margin (%)", k.profitMargin + "%"],
      ["Overall Status", k.status],
      ["Today's Profit", k.todayProfit],
      ["Monthly Profit", k.monthlyProfit],
      ["Yearly Profit", k.yearlyProfit],
      [""],
      ["Date", "Invoice No", "Customer", "Sales Amount", "COGS Cost", "Gross Profit", "Expense Allocation", "Net Profit", "Status"],
      ...(profitLoss.reportTable || []).map((r) => [
        new Date(r.date).toLocaleDateString(),
        r.invoiceNo,
        r.customerName,
        r.salesAmount,
        r.costAmount,
        r.grossProfit,
        r.expenseAllocation,
        r.netProfit,
        r.status,
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VastraERP_ProfitLoss_${plPreset}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      loadDashboard(),
      loadCustomerLedgers(),
      loadVendorLedgers(),
      loadCashBook(),
      loadBankBook(),
      loadExpenses(),
      loadIncomes(),
      loadPayments(),
      loadReceipts(),
      loadProfitLoss(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Submit Handlers
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(expenseForm.amount);
    if (!amt || isNaN(amt) || amt <= 0) {
      onAddNotification?.("Validation", "Please enter a valid expense amount (> 0).", "warning");
      return;
    }
    try {
      const payload = { ...expenseForm, amount: amt, gst: Number(expenseForm.gst || 0) };
      const res = await fetch(`${API}/expenses`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = res.data;
      if (data.success) {
        onAddNotification?.("Expense Added", `Expense of ₹${fmt(amt)} recorded.`, "success");
        setShowExpenseModal(false);
        setExpenseForm({
          category: "Miscellaneous",
          amount: "",
          gst: 0,
          date: new Date().toISOString().split("T")[0],
          description: "",
          paymentMethod: "Cash",
          vendorName: "",
          referenceNo: "",
          bankAccountName: "",
          remarks: "",
        });
        refreshAll();
      } else {
        onAddNotification?.("Error", data.message, "danger");
      }
    } catch (err) {
      onAddNotification?.("Error", err.message, "danger");
    }
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(incomeForm.amount);
    if (!amt || isNaN(amt) || amt <= 0) {
      onAddNotification?.("Validation", "Please enter a valid income amount (> 0).", "warning");
      return;
    }
    try {
      const payload = { ...incomeForm, amount: amt };
      const res = await fetch(`${API}/incomes`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = res.data;
      if (data.success) {
        onAddNotification?.("Income Logged", `Income of ₹${fmt(amt)} added.`, "success");
        setShowIncomeModal(false);
        setIncomeForm({
          source: "Other Income",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          paymentMode: "Cash",
          customerName: "",
          description: "",
        });
        refreshAll();
      } else {
        onAddNotification?.("Error", data.message, "danger");
      }
    } catch (err) {
      onAddNotification?.("Error", err.message, "danger");
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(paymentForm.amount);
    if (!amt || isNaN(amt) || amt <= 0) {
      onAddNotification?.("Validation", "Please enter a valid amount (> 0).", "warning");
      return;
    }
    try {
      const payload = { ...paymentForm, amount: amt };
      const res = await fetch(`${API}/payments`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = res.data;
      if (data.success) {
        onAddNotification?.("Payment Disbursed", `Payment of ₹${fmt(amt)} logged.`, "success");
        setShowPaymentModal(false);
        setPaymentForm({
          beneficiaryType: "Vendor",
          beneficiaryName: "",
          category: "Vendor Payment",
          amount: "",
          paymentMode: "Cash",
          referenceNo: "",
          bankAccountName: "",
          status: "Completed",
          remarks: "",
        });
        refreshAll();
      } else {
        onAddNotification?.("Error", data.message, "danger");
      }
    } catch (err) {
      onAddNotification?.("Error", err.message, "danger");
    }
  };

  const handleReceiptSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(receiptForm.amount);
    if (!amt || isNaN(amt) || amt <= 0) {
      onAddNotification?.("Validation", "Please enter a valid receipt amount (> 0).", "warning");
      return;
    }
    try {
      const payload = { ...receiptForm, amount: amt };
      const res = await fetch(`${API}/receipts`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = res.data;
      if (data.success) {
        onAddNotification?.("Receipt Issued", `Receipt ${data.data.receiptNo} created for ₹${fmt(amt)}.`, "success");
        setShowReceiptModal(false);
        setReceiptForm({
          customerName: "",
          invoiceRef: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          paymentMode: "Cash",
          bankAccountName: "",
          referenceNo: "",
          remarks: "",
        });
        refreshAll();
      } else {
        onAddNotification?.("Error", data.message, "danger");
      }
    } catch (err) {
      onAddNotification?.("Error", err.message, "danger");
    }
  };

  const handleCashBankSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(cashBankForm.amount);
    if (!amt || isNaN(amt) || amt <= 0) {
      onAddNotification?.("Validation", "Please enter a valid adjustment amount (> 0).", "warning");
      return;
    }
    try {
      const payload = { ...cashBankForm, amount: amt };
      const res = await fetch(`${API}/cash-bank-adjustment`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = res.data;
      if (data.success) {
        onAddNotification?.("Adjustment Saved", `${cashBankForm.type} adjustment of ₹${fmt(amt)} recorded.`, "success");
        setShowCashBankModal(false);
        setCashBankForm({
          type: "Cash",
          direction: "In",
          source: "Opening Balance",
          bankAccountName: "HDFC Main Store Account",
          amount: "",
          remarks: "",
        });
        refreshAll();
      } else {
        onAddNotification?.("Error", data.message, "danger");
      }
    } catch (err) {
      onAddNotification?.("Error", err.message, "danger");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12" id="financial-management-root">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-800">
            {mode === "accounts" ? "Accounts & Treasury Management" : "Financial Management"}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === "accounts"
              ? "Focuses on daily money movement, cash & bank bookkeeping, expenses, payments & receipts."
              : "Focuses on the financial health of the business, ledgers, income, and profit & loss intelligence."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => setShowCashBankModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-2 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Cash/Bank Adjustment
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
        {currentTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === t.id
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. FINANCIAL SUMMARY DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-4">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KPICard icon={DollarSign} label="Today Net Sales" value={`₹${fmt(summary?.kpis?.todaySales)}`} sub={summary?.kpis?.todaySalesReturns ? `Gross: ₹${fmt(summary?.kpis?.grossTodaySales)}` : undefined} color="indigo" />
            <KPICard icon={RefreshCw} label="Sales Returns" value={`₹${fmt(summary?.kpis?.totalSalesReturns || summary?.kpis?.monthlySalesReturns || 0)}`} sub="Refund Deductions" color="red" />
            <KPICard icon={ArrowUpRight} label="Total Income (Net)" value={`₹${fmt(summary?.kpis?.totalIncome)}`} color="green" />
            <KPICard icon={ArrowDownRight} label="Total Expenses" value={`₹${fmt(summary?.kpis?.totalExpenses)}`} color="amber" />
            <KPICard icon={TrendingUp} label="Net Profit (Month)" value={`₹${fmt(summary?.kpis?.netProfit)}`} sub="Gross Profit - COGS - Exp" color="emerald" />
          </div>

          {/* Quick Actions & Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-bold text-xs gap-1"
                >
                  <ArrowDownRight className="w-5 h-5" /> Add Expense
                </button>
                <button
                  onClick={() => setShowIncomeModal(true)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-bold text-xs gap-1"
                >
                  <ArrowUpRight className="w-5 h-5" /> Add Income
                </button>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-bold text-xs gap-1"
                >
                  <DollarSign className="w-5 h-5" /> Record Payment
                </button>
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-bold text-xs gap-1"
                >
                  <ReceiptIcon className="w-5 h-5" /> Issue Receipt
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recent Sales & Receipts</h4>
              <div className="space-y-2">
                {(summary?.recent?.sales || []).slice(0, 4).map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{s.invoiceNo} — {s.customerName}</p>
                      <p className="text-[10px] text-slate-400">{fmtDate(s.date)} · {s.paymentMethod}</p>
                    </div>
                    <p className="font-mono font-bold text-emerald-600">₹{fmt(s.grandTotal)}</p>
                  </div>
                ))}
                {!summary?.recent?.sales?.length && (
                  <p className="text-xs text-slate-400 text-center py-4">No recent sales records.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CUSTOMER LEDGER */}
      {/* ========================================================================= */}
      {activeTab === "customer-ledger" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name/phone..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 outline-none"
              />
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl hover:bg-slate-200"
            >
              <Printer className="w-3.5 h-3.5" /> Print Statement
            </button>
          </div>

          <div className="space-y-4">
            {customerLedgers
              .filter(
                (l) =>
                  !searchQuery ||
                  l.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  l.customer?.phone?.includes(searchQuery)
              )
              .map((leg, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
                  <div className="bg-slate-800 text-white p-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm">{leg.customer?.name}</h4>
                      <p className="text-[10px] text-slate-400">Phone: {leg.customer?.phone || "—"} | Email: {leg.customer?.email || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Outstanding</p>
                      <p className="font-mono font-black text-amber-400 text-sm">₹{fmt(leg.closingBalance)}</p>
                    </div>
                  </div>

                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Ref No</th>
                        <th className="p-3 text-right font-mono">Debit (₹)</th>
                        <th className="p-3 text-right font-mono">Credit (₹)</th>
                        <th className="p-3 text-right font-mono">Running Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                      {leg.entries.map((entry, eIdx) => (
                        <tr key={eIdx} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-500">{fmtDate(entry.date)}</td>
                          <td className="p-3">
                            <Badge label={entry.type} color={entry.type === "Invoice" ? "indigo" : "green"} />
                          </td>
                          <td className="p-3 font-mono font-bold">{entry.refNo}</td>
                          <td className="p-3 text-right font-mono text-slate-800">{entry.debit ? `₹${fmt(entry.debit)}` : "—"}</td>
                          <td className="p-3 text-right font-mono text-emerald-600">{entry.credit ? `₹${fmt(entry.credit)}` : "—"}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800">₹{fmt(entry.runningBalance)}</td>
                        </tr>
                      ))}
                      {!leg.entries?.length && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">No financial transactions logged for this customer.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
            {!customerLedgers.length && (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-100">
                No customer ledger accounts found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VENDOR LEDGER */}
      {/* ========================================================================= */}
      {activeTab === "vendor-ledger" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by vendor name/GSTIN..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 outline-none"
              />
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl hover:bg-slate-200"
            >
              <Printer className="w-3.5 h-3.5" /> Print Statement
            </button>
          </div>

          <div className="space-y-4">
            {vendorLedgers
              .filter(
                (l) =>
                  !searchQuery ||
                  l.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  l.vendor?.phone?.includes(searchQuery)
              )
              .map((leg, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
                  <div className="bg-slate-800 text-white p-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm">{leg.vendor?.name}</h4>
                      <p className="text-[10px] text-slate-400">Phone: {leg.vendor?.phone || "—"} | GSTIN: {leg.vendor?.gstin || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Current Payable</p>
                      <p className="font-mono font-black text-red-400 text-sm">₹{fmt(leg.closingBalance)}</p>
                    </div>
                  </div>

                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Ref No</th>
                        <th className="p-3 text-right font-mono">Credit (Bill Amt)</th>
                        <th className="p-3 text-right font-mono">Debit (Paid)</th>
                        <th className="p-3 text-right font-mono">Running Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                      {leg.entries.map((entry, eIdx) => (
                        <tr key={eIdx} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-500">{fmtDate(entry.date)}</td>
                          <td className="p-3">
                            <Badge label={entry.type} color={entry.type.includes("Invoice") ? "red" : "green"} />
                          </td>
                          <td className="p-3 font-mono font-bold">{entry.refNo}</td>
                          <td className="p-3 text-right font-mono text-red-600">{entry.credit ? `₹${fmt(entry.credit)}` : "—"}</td>
                          <td className="p-3 text-right font-mono text-emerald-600">{entry.debit ? `₹${fmt(entry.debit)}` : "—"}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800">₹{fmt(entry.runningBalance)}</td>
                        </tr>
                      ))}
                      {!leg.entries?.length && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">No purchase or payment history logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
            {!vendorLedgers.length && (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-100">
                No vendor ledger accounts found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CASH BOOK */}
      {/* ========================================================================= */}
      {activeTab === "cash-book" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <KPICard icon={ArrowUpRight} label="Total Cash In" value={`₹${fmt(cashBook?.summary?.totalCashIn)}`} color="green" />
            <KPICard icon={ArrowDownRight} label="Total Cash Out" value={`₹${fmt(cashBook?.summary?.totalCashOut)}`} color="red" />
            <KPICard icon={Wallet} label="Net Cash Balance" value={`₹${fmt(cashBook?.summary?.closingBalance)}`} color="amber" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider">Cash Book Log</h4>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 md:w-56">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search particular, ref no..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    value={cashSearch}
                    onChange={(e) => setCashSearch(e.target.value)}
                  />
                  {cashSearch && (
                    <button onClick={() => setCashSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Type Filter */}
                <select
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none cursor-pointer"
                  value={cashTypeFilter}
                  onChange={(e) => setCashTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Cash In">Cash In (+)</option>
                  <option value="Cash Out">Cash Out (-)</option>
                </select>

                {/* Category Filter */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    className="bg-transparent border-none outline-none text-slate-700 font-medium text-xs cursor-pointer"
                    value={cashCategoryFilter}
                    onChange={(e) => setCashCategoryFilter(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    <option value="Opening Balance">Opening Balance</option>
                    <option value="POS Sales">POS Sales</option>
                    <option value="Customer Receipt">Customer Receipt</option>
                    <option value="Manual Income">Manual Income</option>
                    <option value="Expense Payout">Expense Payout</option>
                    <option value="Vendor Payment">Vendor Payment</option>
                    <option value="Salary">Salary</option>
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="Adjustment">Adjustment</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowCashBankModal(true)}
                  className="flex items-center gap-1 bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-amber-700 transition-colors shadow-sm ml-auto md:ml-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Cash Entry
                </button>
              </div>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                  <th className="p-3">Date</th>
                  <th className="p-3">Ref No</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right font-mono">Cash In (₹)</th>
                  <th className="p-3 text-right font-mono">Cash Out (₹)</th>
                  <th className="p-3 text-right font-mono">Closing Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {filteredCashBookData.map((row, i) => {
                  const isRet = row.hasReturn || row.status === "Returned" || row.status === "Partially Returned" || row.category === "Sales Refund";
                  const isEx = row.hasExchange || row.status === "Exchanged" || row.status === "Partially Exchanged";
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-500">{fmtDate(row.date)}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {row.refNo}
                        {isRet && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            ↩ RETURNED
                          </span>
                        )}
                        {isEx && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                            🔁 EXCHANGED
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge label={row.category} color={row.category === "Sales Refund" ? "red" : "indigo"} />
                      </td>
                      <td className="p-3 text-slate-600">{row.description}</td>
                      <td className="p-3 text-right font-mono text-emerald-600">{row.type === "Cash In" ? `₹${fmt(row.amount)}` : "—"}</td>
                      <td className="p-3 text-right font-mono text-red-600">{row.type === "Cash Out" ? `₹${fmt(row.amount)}` : "—"}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">₹{fmt(row.runningBalance)}</td>
                    </tr>
                  );
                })}
                {!filteredCashBookData.length && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      {cashBook?.data?.length ? "No cash entries matching search/filter." : "No cash transactions logged."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BANK BOOK */}
      {/* ========================================================================= */}
      {activeTab === "bank-book" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <KPICard icon={ArrowUpRight} label="Total Deposits" value={`₹${fmt(bankBook?.summary?.totalDeposits)}`} color="green" />
            <KPICard icon={ArrowDownRight} label="Total Withdrawals" value={`₹${fmt(bankBook?.summary?.totalWithdrawals)}`} color="red" />
            <KPICard icon={CreditCard} label="Bank Balance" value={`₹${fmt(bankBook?.summary?.closingBalance)}`} color="blue" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider">Bank Book Log</h4>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 md:w-56">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search party, account, ref..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                  />
                  {bankSearch && (
                    <button onClick={() => setBankSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Type Filter */}
                <select
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none cursor-pointer"
                  value={bankTypeFilter}
                  onChange={(e) => setBankTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Deposit">Deposit (+)</option>
                  <option value="Withdrawal">Withdrawal (-)</option>
                </select>

                {/* Payment Mode Filter */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    className="bg-transparent border-none outline-none text-slate-700 font-medium text-xs cursor-pointer"
                    value={bankModeFilter}
                    onChange={(e) => setBankModeFilter(e.target.value)}
                  >
                    <option value="All">All Payment Modes</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="Card">Card</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowCashBankModal(true)}
                  className="flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm ml-auto md:ml-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Bank Entry
                </button>
              </div>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                  <th className="p-3">Date</th>
                  <th className="p-3">Ref No</th>
                  <th className="p-3">Bank Account</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Party / Remarks</th>
                  <th className="p-3 text-right font-mono">Deposit (₹)</th>
                  <th className="p-3 text-right font-mono">Withdrawal (₹)</th>
                  <th className="p-3 text-right font-mono">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {filteredBankBookData.map((row, i) => {
                  const isRet = row.hasReturn || row.status === "Returned" || row.status === "Partially Returned" || (row.remarks || "").toLowerCase().includes("return");
                  const isEx = row.hasExchange || row.status === "Exchanged" || row.status === "Partially Exchanged";
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-500">{fmtDate(row.date)}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {row.refNo}
                        {isRet && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            ↩ RETURNED
                          </span>
                        )}
                        {isEx && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                            🔁 EXCHANGED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 font-semibold">{row.bankAccountName}</td>
                      <td className="p-3"><Badge label={row.mode} color="blue" /></td>
                      <td className="p-3 text-slate-600">{row.party} — {row.remarks}</td>
                      <td className="p-3 text-right font-mono text-emerald-600">{row.type === "Deposit" ? `₹${fmt(row.amount)}` : "—"}</td>
                      <td className="p-3 text-right font-mono text-red-600">{row.type === "Withdrawal" ? `₹${fmt(row.amount)}` : "—"}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">₹{fmt(row.runningBalance)}</td>
                    </tr>
                  );
                })}
                {!filteredBankBookData.length && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      {bankBook?.data?.length ? "No bank entries matching search/filter." : "No bank transactions logged."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EXPENSE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase text-slate-700">Business Expenses Log</h4>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-red-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Expense
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                  <th className="p-3">Expense No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Vendor / Payee</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3 text-right font-mono">GST (₹)</th>
                  <th className="p-3 text-right font-mono">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {expenses.map((exp, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-red-600">{exp.expenseNo || "—"}</td>
                    <td className="p-3 text-slate-500">{fmtDate(exp.date)}</td>
                    <td className="p-3"><Badge label={exp.category} color="indigo" /></td>
                    <td className="p-3 font-bold text-slate-800">{exp.vendorName || "General"}</td>
                    <td className="p-3">{exp.paymentMethod}</td>
                    <td className="p-3 text-right font-mono">₹{fmt(exp.gst)}</td>
                    <td className="p-3 text-right font-mono font-bold text-red-600">₹{fmt(exp.amount)}</td>
                  </tr>
                ))}
                {!expenses.length && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">No expenses recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. INCOME MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "incomes" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs uppercase text-slate-700">Income Log</h4>
              <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-100">
                Total: ₹{fmt(filteredIncomes.reduce((sum, i) => sum + (i.amount || 0), 0))}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer, ref no, mode..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                  value={incomeSearch}
                  onChange={(e) => setIncomeSearch(e.target.value)}
                />
                {incomeSearch && (
                  <button onClick={() => setIncomeSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Source / Category Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  className="bg-transparent border-none outline-none text-slate-700 font-medium text-xs cursor-pointer"
                  value={incomeCategoryFilter}
                  onChange={(e) => setIncomeCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  <option value="Retail Sales">Retail Sales</option>
                  <option value="Wholesale Sales">Wholesale Sales</option>
                  <option value="Customer Receipt">Customer Receipt</option>
                  <option value="Advance Receipt">Advance Receipt</option>
                  <option value="Stitching Charges">Stitching Charges</option>
                  <option value="Alteration Charges">Alteration Charges</option>
                  <option value="Delivery Charges">Delivery Charges</option>
                  <option value="Service Charges">Service Charges</option>
                  <option value="Commission Income">Commission Income</option>
                  <option value="Other Income">Other Income</option>
                </select>
              </div>

              {/* Payment Mode Filter */}
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-medium text-slate-700 outline-none cursor-pointer"
                value={incomeModeFilter}
                onChange={(e) => setIncomeModeFilter(e.target.value)}
              >
                <option value="All">All Payment Modes</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Wallet">Wallet</option>
                <option value="Cheque">Cheque</option>
              </select>

              <button
                onClick={() => setShowIncomeModal(true)}
                className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-green-700 transition-colors shadow-sm ml-auto md:ml-0"
              >
                <Plus className="w-3.5 h-3.5" /> Log Income
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                  <th className="p-3">Income No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Source / Category</th>
                  <th className="p-3">Customer / Party</th>
                  <th className="p-3">Ref No</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3 text-right font-mono">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {filteredIncomes.map((inc, i) => {
                  const isRet = inc.hasReturn || inc.status === "Returned" || inc.status === "Partially Returned";
                  const isEx = inc.hasExchange || inc.status === "Exchanged" || inc.status === "Partially Exchanged";
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-emerald-600">
                        {inc.incomeNo}
                        {isRet && (
                          <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            ↩ RETURNED
                          </span>
                        )}
                        {isEx && (
                          <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                            🔁 EXCHANGED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500">{fmtDate(inc.date)}</td>
                      <td className="p-3"><Badge label={inc.source} color="green" /></td>
                      <td className="p-3 font-bold text-slate-800">{inc.customerName || "Walk-in"}</td>
                      <td className="p-3 font-mono text-slate-500">{inc.referenceNo || "—"}</td>
                      <td className="p-3">{inc.paymentMode}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">
                        ₹{fmt(inc.amount)}
                        {inc.returnedAmount > 0 && (
                          <p className="text-[10px] text-rose-600 font-sans font-normal">
                            (Ref: -₹{fmt(inc.returnedAmount)})
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!filteredIncomes.length && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      {incomes.length ? "No income records matching search/filters." : "No income records available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. PAYMENT TRACKING */}
      {/* ========================================================================= */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <h4 className="font-bold text-xs uppercase text-slate-700">Outgoing Payments Disbursed</h4>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-56">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search beneficiary, payment no..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  value={paySearch}
                  onChange={(e) => setPaySearch(e.target.value)}
                />
                {paySearch && (
                  <button onClick={() => setPaySearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Beneficiary Type Filter */}
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none cursor-pointer"
                value={payBeneficiaryTypeFilter}
                onChange={(e) => setPayBeneficiaryTypeFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Vendor">Vendor</option>
                <option value="Employee">Employee</option>
                <option value="Other">Other</option>
              </select>

              {/* Category Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  className="bg-transparent border-none outline-none text-slate-700 font-medium text-xs cursor-pointer"
                  value={payCategoryFilter}
                  onChange={(e) => setPayCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  <option value="Vendor Payment">Vendor Payment</option>
                  <option value="Salary">Salary</option>
                  <option value="Expense Payment">Expense Payment</option>
                  <option value="Refund">Refund</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Mode Filter */}
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none cursor-pointer"
                value={payModeFilter}
                onChange={(e) => setPayModeFilter(e.target.value)}
              >
                <option value="All">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="Card">Card</option>
              </select>

              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm ml-auto md:ml-0"
              >
                <Plus className="w-3.5 h-3.5" /> Record Payment
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                  <th className="p-3">Payment No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Beneficiary</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right font-mono">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {filteredPayments.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-blue-600">{p.paymentNo}</td>
                    <td className="p-3 text-slate-500">{fmtDate(p.date)}</td>
                    <td className="p-3 font-bold text-slate-800">{p.beneficiaryName}</td>
                    <td className="p-3"><Badge label={p.category} color="indigo" /></td>
                    <td className="p-3">{p.paymentMode}</td>
                    <td className="p-3 text-center"><Badge label={p.status} color="green" /></td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800">₹{fmt(p.amount)}</td>
                  </tr>
                ))}
                {!filteredPayments.length && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      {payments.length ? "No payment records matching search/filters." : "No outgoing payments recorded."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. RECEIPT MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "receipts" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase text-slate-700">Customer Receipts Issued</h4>
            <button
              onClick={() => setShowReceiptModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Issue Receipt
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                  <th className="p-3">Receipt No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Invoice Ref</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3 text-right font-mono">Amount (₹)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {receipts.map((rec, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-indigo-600">{rec.receiptNo}</td>
                    <td className="p-3 text-slate-500">{fmtDate(rec.date)}</td>
                    <td className="p-3 font-bold text-slate-800">{rec.customerName}</td>
                    <td className="p-3 font-mono">{rec.invoiceRef || "—"}</td>
                    <td className="p-3"><Badge label={rec.paymentMode} color="blue" /></td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600">₹{fmt(rec.amount)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setViewingReceipt(rec)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Receipt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!receipts.length && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">No receipts issued yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. PROFIT & LOSS REPORTS (AUTOMATED & LIVE) */}
      {/* ========================================================================= */}
      {activeTab === "profit-loss" && (
        <div className="space-y-5">
          {/* Header & Filter Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm uppercase text-slate-800 tracking-wider">
                    Executive Profit & Loss Statement
                  </h4>
                  {profitLoss?.kpis?.status === "LOSS" ? (
                    <span className="bg-red-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <TrendingDown className="w-3 h-3" /> LOSS
                    </span>
                  ) : (
                    <span className="bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> PROFIT
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Automated real-time financial aggregation across Sales, COGS, Expenses & Incomes
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Preset Selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-0.5 text-xs font-bold text-slate-600 overflow-x-auto">
                {[
                  { key: "today", label: "Today" },
                  { key: "yesterday", label: "Yesterday" },
                  { key: "week", label: "This Week" },
                  { key: "month", label: "This Month" },
                  { key: "quarter", label: "This Quarter" },
                  { key: "year", label: "This Year" },
                  { key: "custom", label: "Custom" },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPlPreset(p.key)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      plPreset === p.key ? "bg-white text-slate-900 shadow-sm font-black" : "hover:text-slate-900"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Pickers */}
              {plPreset === "custom" && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs">
                  <input
                    type="date"
                    className="bg-transparent outline-none text-slate-700 font-bold"
                    value={plCustomDates.start}
                    onChange={(e) => setPlCustomDates({ ...plCustomDates, start: e.target.value })}
                  />
                  <span className="text-slate-400 font-bold">to</span>
                  <input
                    type="date"
                    className="bg-transparent outline-none text-slate-700 font-bold"
                    value={plCustomDates.end}
                    onChange={(e) => setPlCustomDates({ ...plCustomDates, end: e.target.value })}
                  />
                </div>
              )}

              {/* Export Buttons */}
              <button
                onClick={handleExportPLCSV}
                className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
                title="Export Excel / CSV"
              >
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-slate-900 transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print PDF
              </button>
            </div>
          </div>

          {/* 10 KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KPICard icon={DollarSign} label="Total Sales Revenue" value={`₹${fmt(profitLoss?.kpis?.totalSales)}`} color="emerald" />
            <KPICard icon={TrendingDown} label="COGS (Purchase Cost)" value={`₹${fmt(profitLoss?.kpis?.cogs)}`} color="purple" />
            <KPICard icon={TrendingUp} label="Gross Profit" value={`₹${fmt(profitLoss?.kpis?.grossProfit)}`} color="blue" />
            <KPICard icon={ArrowUpRight} label="Total Other Income" value={`₹${fmt(profitLoss?.kpis?.otherIncome)}`} color="green" />
            <KPICard icon={ArrowDownRight} label="Total Operating Expenses" value={`₹${fmt(profitLoss?.kpis?.totalExpenses)}`} color="red" />
            
            <div className={`p-4 rounded-2xl border ${profitLoss?.kpis?.status === "LOSS" ? "bg-red-500 text-white border-red-600" : "bg-slate-900 text-white border-slate-800"} shadow-md flex flex-col justify-between`}>
              <div className="flex items-center justify-between text-[11px] font-bold opacity-80 uppercase">
                <span>Net Profit / Loss</span>
                <span className="font-black px-2 py-0.5 rounded-full bg-white/20 text-white">{profitLoss?.kpis?.status || "PROFIT"}</span>
              </div>
              <p className="text-xl font-black font-mono mt-2">₹{fmt(profitLoss?.kpis?.netProfit)}</p>
            </div>

            <KPICard icon={PieChart} label="Profit Margin (%)" value={`${profitLoss?.kpis?.profitMargin || "0.00"}%`} color="indigo" />
            <KPICard icon={Calendar} label="Today's Profit" value={`₹${fmt(profitLoss?.kpis?.todayProfit)}`} color="blue" />
            <KPICard icon={Calendar} label="Monthly Profit" value={`₹${fmt(profitLoss?.kpis?.monthlyProfit)}`} color="indigo" />
            <KPICard icon={Calendar} label="Yearly Profit" value={`₹${fmt(profitLoss?.kpis?.yearlyProfit)}`} color="purple" />
          </div>

          {/* Statement & Breakdown Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Financial Statement Summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3.5 lg:col-span-2 text-xs">
              <h4 className="font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Income & Expense Statement Summary
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                  <span className="font-semibold text-slate-600">Gross Sales Revenue</span>
                  <span className="font-mono font-bold text-slate-800">₹{fmt(profitLoss?.kpis?.totalSales)}</span>
                </div>

                {Boolean(profitLoss?.kpis?.salesReturnsAmount) && (
                  <div className="flex items-center justify-between border-b border-slate-50 pb-1.5 text-red-600">
                    <span className="font-medium">Less: Sales Returns & Allowances</span>
                    <span className="font-mono font-bold">- ₹{fmt(profitLoss?.kpis?.salesReturnsAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-slate-50 pb-1.5 text-slate-600">
                  <span className="font-semibold">Less: Cost of Goods Sold (COGS)</span>
                  <span className="font-mono font-bold text-red-600">- ₹{fmt(profitLoss?.kpis?.cogs)}</span>
                </div>

                <div className="flex items-center justify-between bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
                  <span className="font-black text-indigo-900 uppercase">Gross Profit</span>
                  <span className="font-mono font-black text-indigo-700 text-sm">₹{fmt(profitLoss?.kpis?.grossProfit)}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-1.5 pt-1 text-emerald-700">
                  <span className="font-semibold">Add: Other Operating Income</span>
                  <span className="font-mono font-bold">+ ₹{fmt(profitLoss?.kpis?.otherIncome)}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-1.5 text-red-600">
                  <span className="font-semibold">Less: Total Operating & Payroll Expenses</span>
                  <span className="font-mono font-bold">- ₹{fmt(profitLoss?.kpis?.totalExpenses)}</span>
                </div>

                <div className={`flex items-center justify-between p-3.5 rounded-xl font-black text-sm text-white ${profitLoss?.kpis?.status === "LOSS" ? "bg-red-600" : "bg-slate-900"}`}>
                  <span className="uppercase tracking-wider">NET {profitLoss?.kpis?.status || "PROFIT"}</span>
                  <span className="font-mono text-base text-emerald-400">₹{fmt(profitLoss?.kpis?.netProfit)}</span>
                </div>
              </div>
            </div>

            {/* Expense & Income Breakdown Analytics */}
            <div className="space-y-4">
              {/* Expense Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 text-xs">
                <h4 className="font-bold text-slate-700 uppercase">Expense Category Breakdown</h4>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {(profitLoss?.charts?.expenseBreakdown || []).map((exp, i) => {
                    const pct = profitLoss?.kpis?.totalExpenses ? ((exp.value / profitLoss.kpis.totalExpenses) * 100).toFixed(1) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">{exp.name}</span>
                          <span className="font-mono font-bold text-slate-900">₹{fmt(exp.value)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {!(profitLoss?.charts?.expenseBreakdown || []).length && (
                    <p className="text-slate-400 text-center py-6">No expenses logged.</p>
                  )}
                </div>
              </div>

              {/* Income Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 text-xs">
                <h4 className="font-bold text-slate-700 uppercase">Income Source Breakdown</h4>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {(profitLoss?.charts?.incomeBreakdown || []).map((inc, i) => {
                    const pct = profitLoss?.kpis?.otherIncome ? ((inc.value / profitLoss.kpis.otherIncome) * 100).toFixed(1) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">{inc.name}</span>
                          <span className="font-mono font-bold text-slate-900">₹{fmt(inc.value)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {!(profitLoss?.charts?.incomeBreakdown || []).length && (
                    <p className="text-slate-400 text-center py-4">No other incomes logged.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product Profitability Rankings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Top Profitable Products */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5 text-emerald-600">
                <TrendingUp className="w-4 h-4" /> Top Profitable Products
              </h4>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-2">Product Name</th>
                    <th className="p-2 text-center">Qty Sold</th>
                    <th className="p-2 text-right">Revenue</th>
                    <th className="p-2 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {(profitLoss?.charts?.topProducts || []).map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2 font-bold text-slate-800">{p.name}</td>
                      <td className="p-2 text-center font-mono">{p.qty}</td>
                      <td className="p-2 text-right font-mono">₹{fmt(p.sales)}</td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-600">₹{fmt(p.profit)}</td>
                    </tr>
                  ))}
                  {!(profitLoss?.charts?.topProducts || []).length && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">No product sales recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Least Profitable Products */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5 text-red-600">
                <TrendingDown className="w-4 h-4" /> Least Profitable Products
              </h4>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-2">Product Name</th>
                    <th className="p-2 text-center">Qty Sold</th>
                    <th className="p-2 text-right">Cost (₹)</th>
                    <th className="p-2 text-right">Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {(profitLoss?.charts?.leastProducts || []).map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2 font-bold text-slate-800">{p.name}</td>
                      <td className="p-2 text-center font-mono">{p.qty}</td>
                      <td className="p-2 text-right font-mono text-red-600">₹{fmt(p.cost)}</td>
                      <td className={`p-2 text-right font-mono font-bold ${p.profit < 0 ? "text-red-600" : "text-slate-800"}`}>
                        ₹{fmt(p.profit)}
                      </td>
                    </tr>
                  ))}
                  {!(profitLoss?.charts?.leastProducts || []).length && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">No product data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Itemized Report Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs space-y-3 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-800 uppercase tracking-wider">
                Transaction Breakdown & Net Profit Audit Log
              </h4>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice or customer..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-400/20"
                  value={plSearchQuery}
                  onChange={(e) => setPlSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                    <th className="p-3">Date</th>
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3 text-right font-mono">Sales Amount (₹)</th>
                    <th className="p-3 text-right font-mono">Cost (COGS ₹)</th>
                    <th className="p-3 text-right font-mono">Gross Profit (₹)</th>
                    <th className="p-3 text-right font-mono">Expense Alloc. (₹)</th>
                    <th className="p-3 text-right font-mono">Net Profit (₹)</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {(profitLoss?.reportTable || [])
                    .filter((r) => {
                      if (!plSearchQuery) return true;
                      const q = plSearchQuery.toLowerCase();
                      return (
                        (r.invoiceNo || "").toLowerCase().includes(q) ||
                        (r.customerName || "").toLowerCase().includes(q)
                      );
                    })
                    .map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-500">{fmtDate(row.date)}</td>
                        <td className="p-3 font-mono font-bold text-slate-800">{row.invoiceNo}</td>
                        <td className="p-3 font-bold text-slate-800">{row.customerName}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600">₹{fmt(row.salesAmount)}</td>
                        <td className="p-3 text-right font-mono text-red-600">₹{fmt(row.costAmount)}</td>
                        <td className="p-3 text-right font-mono font-bold text-indigo-600">₹{fmt(row.grossProfit)}</td>
                        <td className="p-3 text-right font-mono text-slate-500">₹{fmt(row.expenseAllocation)}</td>
                        <td className={`p-3 text-right font-mono font-black ${row.netProfit < 0 ? "text-red-600" : "text-emerald-600"}`}>
                          ₹{fmt(row.netProfit)}
                        </td>
                        <td className="p-3 text-center">
                          {row.status === "LOSS" ? (
                            <span className="bg-red-100 text-red-700 font-black text-[10px] px-2 py-0.5 rounded-md">LOSS</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 font-black text-[10px] px-2 py-0.5 rounded-md">PROFIT</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  {!(profitLoss?.reportTable || []).length && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">No transaction records available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {/* Expense Modal */}
      {showExpenseModal && (
        <Modal title="Record New Business Expense" onClose={() => setShowExpenseModal(false)}>
          <form onSubmit={handleExpenseSubmit} className="space-y-3">
            <InputRow label="Category" required>
              <select
                className={inputClass}
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              >
                {["Rent", "Utilities", "Salary", "Maintenance", "Logistics", "Tax", "Marketing", "Electricity", "Internet", "Courier", "Packaging", "Repairs", "Fuel", "Miscellaneous"].map(
                  (c) => (
                    <option key={c} value={c}>{c}</option>
                  )
                )}
              </select>
            </InputRow>
            <InputRow label="Amount (₹)" required>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="Enter amount (e.g. 1500)"
                className={inputClass}
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              />
            </InputRow>
            <InputRow label="Payment Mode">
              <select
                className={inputClass}
                value={expenseForm.paymentMethod}
                onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
              >
                {["Cash", "Card", "UPI", "Bank Transfer", "Cheque"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </InputRow>
            <InputRow label="Vendor / Payee Name">
              <input
                className={inputClass}
                value={expenseForm.vendorName}
                onChange={(e) => setExpenseForm({ ...expenseForm, vendorName: e.target.value })}
              />
            </InputRow>
            <InputRow label="Description">
              <input
                className={inputClass}
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              />
            </InputRow>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700">
                Save Expense
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Income Modal */}
      {showIncomeModal && (
        <Modal title="Log Manual Business Income" onClose={() => setShowIncomeModal(false)}>
          <form onSubmit={handleIncomeSubmit} className="space-y-3">
            <InputRow label="Income Source" required>
              <select
                className={inputClass}
                value={incomeForm.source}
                onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
              >
                {["Stitching Charges", "Alteration Charges", "Delivery Charges", "Service Charges", "Commission Income", "Other Income"].map(
                  (s) => (
                    <option key={s} value={s}>{s}</option>
                  )
                )}
              </select>
            </InputRow>
            <InputRow label="Amount (₹)" required>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="Enter amount (e.g. 2500)"
                className={inputClass}
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
              />
            </InputRow>
            <InputRow label="Customer Name">
              <input
                className={inputClass}
                value={incomeForm.customerName}
                onChange={(e) => setIncomeForm({ ...incomeForm, customerName: e.target.value })}
              />
            </InputRow>
            <InputRow label="Payment Mode">
              <select
                className={inputClass}
                value={incomeForm.paymentMode}
                onChange={(e) => setIncomeForm({ ...incomeForm, paymentMode: e.target.value })}
              >
                {["Cash", "Card", "UPI", "Bank Transfer", "Wallet"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </InputRow>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowIncomeModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700">
                Log Income
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <Modal title="Record Outgoing Payment" onClose={() => setShowPaymentModal(false)}>
          <form onSubmit={handlePaymentSubmit} className="space-y-3">
            <InputRow label="Beneficiary Type" required>
              <select
                className={inputClass}
                value={paymentForm.beneficiaryType}
                onChange={(e) => setPaymentForm({ ...paymentForm, beneficiaryType: e.target.value })}
              >
                <option value="Vendor">Vendor</option>
                <option value="Employee">Employee</option>
                <option value="Other">Other</option>
              </select>
            </InputRow>
            <InputRow label="Beneficiary Name" required>
              <input
                required
                className={inputClass}
                placeholder="Enter payee / vendor / employee name..."
                value={paymentForm.beneficiaryName}
                onChange={(e) => setPaymentForm({ ...paymentForm, beneficiaryName: e.target.value })}
              />
            </InputRow>
            <InputRow label="Category" required>
              <select
                className={inputClass}
                value={paymentForm.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  const bType = cat === "Salary" ? "Employee" : cat === "Vendor Payment" ? "Vendor" : "Other";
                  setPaymentForm({ ...paymentForm, category: cat, beneficiaryType: bType });
                }}
              >
                {["Vendor Payment", "Salary", "Expense Payment", "Refund", "Other"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </InputRow>
            <InputRow label="Amount (₹)" required>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="Enter amount (e.g. 5000)"
                className={inputClass}
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              />
            </InputRow>
            <InputRow label="Payment Mode">
              <select
                className={inputClass}
                value={paymentForm.paymentMode}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
              >
                {["Cash", "Bank Transfer", "UPI", "Cheque", "NEFT", "RTGS"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </InputRow>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">
                Record Payment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <Modal title="Issue Customer Receipt" onClose={() => setShowReceiptModal(false)}>
          <form onSubmit={handleReceiptSubmit} className="space-y-3">
            <InputRow label="Customer Name" required>
              <input
                required
                className={inputClass}
                value={receiptForm.customerName}
                onChange={(e) => setReceiptForm({ ...receiptForm, customerName: e.target.value })}
              />
            </InputRow>
            <InputRow label="Invoice Reference No">
              <input
                className={inputClass}
                placeholder="e.g. INV-1004"
                value={receiptForm.invoiceRef}
                onChange={(e) => setReceiptForm({ ...receiptForm, invoiceRef: e.target.value })}
              />
            </InputRow>
            <InputRow label="Amount (₹)" required>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="Enter amount (e.g. 1000)"
                className={inputClass}
                value={receiptForm.amount}
                onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
              />
            </InputRow>
            <InputRow label="Payment Mode">
              <select
                className={inputClass}
                value={receiptForm.paymentMode}
                onChange={(e) => setReceiptForm({ ...receiptForm, paymentMode: e.target.value })}
              >
                {["Cash", "Card", "UPI", "Bank Transfer", "Cheque"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </InputRow>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">
                Issue Receipt
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cash / Bank Adjustment Modal */}
      {showCashBankModal && (
        <Modal title="Record Cash / Bank Adjustment Entry" onClose={() => setShowCashBankModal(false)}>
          <form onSubmit={handleCashBankSubmit} className="space-y-3">
            <InputRow label="Account Type" required>
              <select
                className={inputClass}
                value={cashBankForm.type}
                onChange={(e) => setCashBankForm({ ...cashBankForm, type: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
              </select>
            </InputRow>
            <InputRow label="Direction" required>
              <select
                className={inputClass}
                value={cashBankForm.direction}
                onChange={(e) => setCashBankForm({ ...cashBankForm, direction: e.target.value })}
              >
                <option value="In">In (Deposit / Opening)</option>
                <option value="Out">Out (Withdrawal / Transfer)</option>
              </select>
            </InputRow>
            <InputRow label="Source / Reason" required>
              <input
                required
                className={inputClass}
                placeholder="e.g. Opening Balance, Petty Cash Replenishment"
                value={cashBankForm.source}
                onChange={(e) => setCashBankForm({ ...cashBankForm, source: e.target.value })}
              />
            </InputRow>
            <InputRow label="Amount (₹)" required>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="Enter amount (e.g. 5000)"
                className={inputClass}
                value={cashBankForm.amount}
                onChange={(e) => setCashBankForm({ ...cashBankForm, amount: e.target.value })}
              />
            </InputRow>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCashBankModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900">
                Save Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Receipt Printable Preview Modal */}
      {viewingReceipt && (
        <Modal title={`Receipt View — ${viewingReceipt.receiptNo}`} onClose={() => setViewingReceipt(null)}>
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between font-bold border-b border-slate-200 pb-2">
                <span>Vastra ERP Receipt</span>
                <span className="font-mono text-indigo-600">{viewingReceipt.receiptNo}</span>
              </div>
              <p><strong>Customer:</strong> {viewingReceipt.customerName}</p>
              <p><strong>Invoice Ref:</strong> {viewingReceipt.invoiceRef || "N/A"}</p>
              <p><strong>Date:</strong> {fmtDate(viewingReceipt.date)}</p>
              <p><strong>Mode:</strong> {viewingReceipt.paymentMode}</p>
              <p className="text-sm font-black text-emerald-600 border-t border-slate-200 pt-2">
                Amount Received: ₹{fmt(viewingReceipt.amount)}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

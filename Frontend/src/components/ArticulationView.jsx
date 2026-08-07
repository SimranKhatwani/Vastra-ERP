import api from '../api/axios';
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Layers,
  Settings,
  DollarSign,
  Printer,
  Clock,
  ArrowRight,
  Sparkles,
  Scissors,
  Ruler,
  Save,
  FileText,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Layers2,
  Workflow,
  X,
  MessageSquare,
  Send,
  BarChart3,
  Users,
  Award,
  AlertTriangle,
  Download,
  ExternalLink,
  UserCheck,
  Activity,
  Check,
  PieChart,
  Sliders,
  Filter,
  Phone,
  Star,
  RefreshCw,
} from "lucide-react";

export const ArticulationView = ({
  customers = [],
  employees = [],
  products = [],
  onAddCustomToCart,
  onAddNotification,
  initialTab = "dashboard",
  initialFilterStatus = "All",
  autoStartAlteration = false,
  clearAutoStartAlteration = () => {}
}) => {
  // ─── CORE SYSTEM DATA FALLBACKS ───
  const defaultCustomers = useMemo(() => {
    if (customers && customers.length > 0) return customers;
    return [
      { id: "c-101", _id: "c-101", name: "Aditya", phone: "9823456789", email: "aditya@example.com", code: "C-1001", loyaltyPoints: 150 },
      { id: "c-102", _id: "c-102", name: "Yash", phone: "9812345678", email: "yash@example.com", code: "C-1002", loyaltyPoints: 120 },
      { id: "c-103", _id: "c-103", name: "Vikas", phone: "9834567890", email: "vikas@example.com", code: "C-1003", loyaltyPoints: 80 }
    ];
  }, [customers]);

  const defaultFabrics = useMemo(() => {
    // Filter fabric category from inventory if exists, else provide rich garment database
    const dbFabrics = (products || []).filter(p => (p.category || "").toLowerCase() === "fabric" || (p.type || "").toLowerCase() === "fabric");
    if (dbFabrics.length > 0) {
      return dbFabrics.map((f, idx) => ({
        id: f._id || f.id || `f-${idx}`,
        name: f.name,
        brand: f.brand || "Indian Mills",
        color: f.color || "Indigo Blue",
        stock: f.stock || f.quantity || 45,
        price: f.price || f.sellingPrice || 850,
        lotNo: f.sku || `L-90${idx}`
      }));
    }
    return [
      { id: "fb-1", name: "Giza Premium Cotton", brand: "Egyptian Weave", color: "Classic White", stock: 35.5, price: 1450, lotNo: "LOT-EGY-402" },
      { id: "fb-2", name: "Pure Irish Linen Weft", brand: "Linen Club", color: "Natural Beige", stock: 18.0, price: 1850, lotNo: "LOT-LIN-801" },
      { id: "fb-3", name: "Mulberry Silk Brocade", brand: "Banaras Weaves", color: "Royal Crimson", stock: 12.2, price: 2900, lotNo: "LOT-SLK-990" },
      { id: "fb-4", name: "Merino Tweed Worsted", brand: "Raymonds Classic", color: "Charcoal Gray", stock: 24.0, price: 2200, lotNo: "LOT-WOO-711" },
      { id: "fb-5", name: "Super 120s Wool Cashmere", brand: "Loro Piana", color: "Navy Blue", stock: 8.5, price: 3800, lotNo: "LOT-CSH-555" },
      { id: "fb-6", name: "Viscose Twill Indigo", brand: "Birla Century", color: "Indigo Wash", stock: 52.0, price: 950, lotNo: "LOT-VIS-108" }
    ];
  }, [products]);

  const defaultTailors = useMemo(() => {
    const dbTailors = (employees || []).filter(e => (e.designation || e.role || "").toLowerCase() === "tailor" || (e.role || "").toLowerCase() === "tailor");
    if (dbTailors.length > 0) {
      return dbTailors.map((t, idx) => ({
        id: t._id || t.id || `t-${idx}`,
        name: t.name,
        jobs: t.currentWorkload || 0,
        availability: (t.currentWorkload || 0) > 6 ? "Unavailable" : (t.currentWorkload || 0) > 3 ? "Busy" : "Available"
      }));
    }
    return [
      { id: "tr-1", name: "Master Ramesh Kumar", jobs: 2, availability: "Available" },
      { id: "tr-2", name: "Ustad Imran Ansari", jobs: 5, availability: "Busy" },
      { id: "tr-3", name: "Darzi Amit Saxena", jobs: 8, availability: "Unavailable" },
      { id: "tr-4", name: "Karigar Mansoor Alam", jobs: 1, availability: "Available" },
      { id: "tr-5", name: "Master Jitendra Dev", jobs: 4, availability: "Busy" }
    ];
  }, [employees]);

  const defaultAlterationsList = useMemo(() => [
    {
      _id: "alt-101",
      alterationId: "ALT-2026-101",
      invoiceNumber: "INV-2026-8801",
      customerName: "Ritu Sharma",
      customerPhone: "9823456789",
      productName: "Silk Brocade Sherwani",
      size: "42",
      color: "Royal Crimson",
      tailorName: "Master Ramesh Kumar",
      priority: "Urgent",
      status: "Ready for Delivery",
      deliveryDate: new Date().toISOString().split('T')[0],
      trialDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      alterationDetails: ["Sleeve Shortening", "Waist Fitting"],
      measurements: { Chest: "42", Waist: "36", Shoulder: "18.5", Sleeve: "24.5" },
      createdBy: "Cashier"
    },
    {
      _id: "alt-102",
      alterationId: "ALT-2026-102",
      invoiceNumber: "INV-2026-8802",
      customerName: "Ananya Roy",
      customerPhone: "9812345678",
      productName: "Italian Cut Blazer",
      size: "40",
      color: "Charcoal Gray",
      tailorName: "Ustad Imran Ansari",
      priority: "Normal",
      status: "In Progress",
      deliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      trialDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      alterationDetails: ["Shoulder Padding", "Length Adjustment"],
      measurements: { Chest: "40", Waist: "34", Shoulder: "17.5", Sleeve: "25" },
      createdBy: "Admin"
    },
    {
      _id: "alt-103",
      alterationId: "ALT-2026-103",
      invoiceNumber: "INV-2026-8803",
      customerName: "Vikram Malhotra",
      customerPhone: "9834567890",
      productName: "Designer Kurta Pajama",
      size: "38",
      color: "Classic White",
      tailorName: "Darzi Amit Saxena",
      priority: "Express",
      status: "In Progress",
      deliveryDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      trialDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      alterationDetails: ["Side Slit Fitting", "Collar Adjustment"],
      measurements: { Chest: "38", Waist: "32", Shoulder: "17", Sleeve: "24" },
      createdBy: "Cashier"
    },
    {
      _id: "alt-104",
      alterationId: "ALT-2026-104",
      invoiceNumber: "INV-2026-8804",
      customerName: "Deepak Verma",
      customerPhone: "9876543210",
      productName: "Slim Fit Formal Trousers",
      size: "32",
      color: "Navy Blue",
      tailorName: "Karigar Mansoor Alam",
      priority: "Normal",
      status: "Pending",
      deliveryDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
      trialDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      alterationDetails: ["Bottom Hemming", "Thigh Fitting"],
      measurements: { Waist: "32", Length: "40", Thigh: "23", Bottom: "15" },
      createdBy: "Cashier"
    },
    {
      _id: "alt-105",
      alterationId: "ALT-2026-105",
      invoiceNumber: "INV-2026-8805",
      customerName: "Pooja Hegde",
      customerPhone: "9865432109",
      productName: "Embroidered Anarkali Suit",
      size: "36",
      color: "Emerald Green",
      tailorName: "Master Ramesh Kumar",
      priority: "Urgent",
      status: "Ready for Delivery",
      deliveryDate: new Date().toISOString().split('T')[0],
      trialDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      alterationDetails: ["Bust Fitting", "Drape Stitching"],
      measurements: { Bust: "36", Waist: "30", Length: "52" },
      createdBy: "Admin"
    },
    {
      _id: "alt-106",
      alterationId: "ALT-2026-106",
      invoiceNumber: "INV-2026-8806",
      customerName: "Rahul Kapoor",
      customerPhone: "9854321098",
      productName: "3-Piece Tuxedo Suit",
      size: "42",
      color: "Midnight Black",
      tailorName: "Master Jitendra Dev",
      priority: "Normal",
      status: "Delivered",
      deliveryDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      trialDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      alterationDetails: ["Lapel Ironing", "Waistcoat Fitting"],
      measurements: { Chest: "42", Waist: "36", Shoulder: "18.5" },
      createdBy: "Cashier"
    }
  ], []);

  // ─── ACTIVE PANEL FOCUS STATE ───
  // 'customer_search' | 'order_info' | 'garments' | 'fabric_search' | 'fabrics' | 'colors' | 'measurements' | 'customizations' | 'tailors'
  const [focusedSection, setFocusedSection] = useState("customer_search");

  // ─── KEYBOARD & MODAL STATE ───
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showProductionSummary, setShowProductionSummary] = useState(false);

  // ─── LEFT PANEL (CUSTOMER & ORDER) ───
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(defaultCustomers[0]);
  const [activeCustomerIndex, setActiveCustomerIndex] = useState(0);

  const [orderNo, setOrderNo] = useState(() => `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [salesperson, setSalesperson] = useState("Vijay Shekhar");
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 10); // Default 10 days delivery
    return today.toISOString().split('T')[0];
  });
  const [orderPriority, setOrderPriority] = useState("Medium");
  const [branch, setBranch] = useState("Bandra Boutique");
  const [orderStatus, setOrderStatus] = useState("Draft");
  const [isFabricReserved, setIsFabricReserved] = useState(false);

  // ─── THREE NEW ENTERPRISE TABS & WHATSAPP STATE ───
  // 'dashboard' | 'reports' | 'tracking'
  const [activeStudioTab, setActiveStudioTab] = useState(initialTab || "dashboard");
  const [alterationRecords, setAlterationRecords] = useState(defaultAlterationsList);
  const [alterationsFilterStatus, setAlterationsFilterStatus] = useState(initialFilterStatus || "All");
  const [alterationSearchQuery, setAlterationSearchQuery] = useState("");
  const [selectedJobTicket, setSelectedJobTicket] = useState(null);
  const [whatsappModalTarget, setWhatsappModalTarget] = useState(null);

  // --- NEW ALTERATION WIZARD STATE ---
  const [showCreateAltModal, setShowCreateAltModal] = useState(false);
  const [altInvoiceSearch, setAltInvoiceSearch] = useState("");
  const [altInvoices, setAltInvoices] = useState([]);
  const [searchingAltInvoices, setSearchingAltInvoices] = useState(false);
  const [selectedAltInvoice, setSelectedAltInvoice] = useState(null);
  const [selectedAltItem, setSelectedAltItem] = useState(null);
  const [altTailorName, setAltTailorName] = useState("");
  const [altPriority, setAltPriority] = useState("Normal");
  const [altDeliveryDate, setAltDeliveryDate] = useState("");
  const [altTrialDate, setAltTrialDate] = useState("");
  const [altDetails, setAltDetails] = useState([]);
  const [altCustomText, setAltCustomText] = useState("");
  const [altMeasurements, setAltMeasurements] = useState({});

  const tailorOptions = useMemo(() => {
    if (employees && employees.length > 0) {
      const dbTailors = employees.filter(e => (e.designation || e.role || "").toLowerCase() === "tailor" || (e.role || "").toLowerCase() === "tailor");
      if (dbTailors.length > 0) return dbTailors.map(t => t.name);
    }
    return defaultTailors.map(t => t.name);
  }, [employees, defaultTailors]);

  useEffect(() => {
    if (autoStartAlteration) {
      setShowCreateAltModal(true);
      if (clearAutoStartAlteration) clearAutoStartAlteration();
      // Set default dates
      const delivery = new Date();
      delivery.setDate(delivery.getDate() + 3);
      setAltDeliveryDate(delivery.toISOString().split('T')[0]);
      
      const trial = new Date();
      trial.setDate(trial.getDate() + 2);
      setAltTrialDate(trial.toISOString().split('T')[0]);
      
      // Reset other states
      setSelectedAltInvoice(null);
      setSelectedAltItem(null);
      setAltInvoiceSearch("");
      setAltInvoices([]);
      setAltTailorName("");
      setAltPriority("Normal");
      setAltDetails([]);
      setAltCustomText("");
      setAltMeasurements({});
    }
  }, [autoStartAlteration, clearAutoStartAlteration]);

  const handleSearchAltInvoices = async () => {
    if (!altInvoiceSearch.trim()) return;
    setSearchingAltInvoices(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/billing?search=${altInvoiceSearch}`);
      const data = res.data;
      if (data.success && data.data) {
        setAltInvoices(data.data);
      }
    } catch (err) {
      console.error("Failed to search invoices:", err);
    } finally {
      setSearchingAltInvoices(false);
    }
  };

  const handleSaveAlterationTicket = async (e) => {
    e.preventDefault();
    if (!selectedAltInvoice || !selectedAltItem) {
      if (onAddNotification) onAddNotification("Error", "Please select an invoice and item first.", "danger");
      return;
    }

    const payload = {
      invoiceNumber: selectedAltInvoice.invoiceNo || selectedAltInvoice._id,
      invoiceId: selectedAltInvoice._id,
      customerName: selectedAltInvoice.customerName,
      customerPhone: selectedAltInvoice.customerPhone,
      productId: selectedAltItem.productId,
      productName: selectedAltItem.productName || selectedAltItem.name,
      sku: selectedAltItem.sku,
      size: selectedAltItem.size,
      color: selectedAltItem.color,
      tailorName: altTailorName,
      priority: altPriority,
      status: "Pending",
      deliveryDate: altDeliveryDate,
      trialDate: altTrialDate,
      alterationDetails: altDetails,
      customAlterationText: altCustomText,
      measurements: altMeasurements
    };

    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/alterations`, payload);
      const data = res.data;
      if (data.success) {
        if (onAddNotification) {
          onAddNotification("Alteration Created", `Ticket ${data.data.alterationId} added successfully.`, "success");
        }
        setShowCreateAltModal(false);
        fetchAlterations(); // Refresh list
      } else {
        if (onAddNotification) {
          onAddNotification("Error", data.message || "Failed to create alteration ticket.", "danger");
        }
      }
    } catch (err) {
      console.error("Save alteration error:", err);
      if (onAddNotification) {
        onAddNotification("Error", "Network or server failure.", "danger");
      }
    }
  };

  useEffect(() => {
    if (initialTab) setActiveStudioTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialFilterStatus) setAlterationsFilterStatus(initialFilterStatus);
  }, [initialFilterStatus]);

  // Filters State for Reports & Employee Tracking
  const [filterDateRange, setFilterDateRange] = useState("All");
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");

  // Reports & Employee Performance Data State
  const [reportsData, setReportsData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (filterDateRange !== "All") queryParams.append("dateRange", filterDateRange);
      if (filterEmployee !== "All") queryParams.append("employee", filterEmployee);
      if (filterStatus !== "All") queryParams.append("status", filterStatus);
      if (filterPriority !== "All") queryParams.append("priority", filterPriority);

      const res = await api.get(`/alteration-reports?${queryParams.toString()}`);
      const data = res.data;
      if (data.success) {
        setReportsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch alteration reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchPerformance = async () => {
    setLoadingPerformance(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (filterDateRange !== "All") queryParams.append("dateRange", filterDateRange);
      if (filterEmployee !== "All") queryParams.append("employee", filterEmployee);
      if (filterStatus !== "All") queryParams.append("status", filterStatus);
      if (filterPriority !== "All") queryParams.append("priority", filterPriority);

      const res = await api.get(`/employee-alteration-performance?${queryParams.toString()}`);
      const data = res.data;
      if (data.success) {
        setPerformanceData(data);
      }
    } catch (err) {
      console.error("Failed to fetch employee performance:", err);
    } finally {
      setLoadingPerformance(false);
    }
  };

  useEffect(() => {
    if (activeStudioTab === "reports") {
      fetchReports();
    } else if (activeStudioTab === "tracking") {
      fetchPerformance();
    }
  }, [activeStudioTab, filterDateRange, filterEmployee, filterStatus, filterPriority]);

  const handleConfirmSendWhatsApp = async (target) => {
    if (!target) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/alteration/send-whatsapp`, { alterationId: target._id || target.alterationId });
      const data = res.data;
      setWhatsappModalTarget(null);

      if (data.success) {
        if (onAddNotification) {
          onAddNotification("WhatsApp Alert Sent", `Notification logged & sent to ${target.customerName}.`, "success");
        }
        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, "_blank");
        }
      } else {
        if (onAddNotification) {
          onAddNotification("WhatsApp Web Relay", `Opened pre-filled message for ${target.customerName}.`, "info");
        }
        const phoneClean = (target.customerPhone || '').replace(/[^0-9]/g, '');
        const msg = `Hello ${target.customerName},\n\nYour alteration for Invoice ${target.invoiceNumber || target.invoiceId} is now completed and ready for pickup.\n\nProduct:\n${target.productName}\n\nDelivery Date:\n${target.deliveryDate || 'Today'}\n\nPlease visit the showroom to collect your garment.\n\nThank You,\nVastra ERP Tailoring Dept`;
        const fallbackUrl = `https://wa.me/${phoneClean.length === 10 ? '91' + phoneClean : phoneClean}?text=${encodeURIComponent(msg)}`;
        window.open(fallbackUrl, "_blank");
      }
    } catch (err) {
      console.error("WhatsApp notification error:", err);
      setWhatsappModalTarget(null);
      const phoneClean = (target.customerPhone || '').replace(/[^0-9]/g, '');
      const msg = `Hello ${target.customerName},\n\nYour alteration for Invoice ${target.invoiceNumber || target.invoiceId} is now completed and ready for pickup.\n\nProduct:\n${target.productName}\n\nDelivery Date:\n${target.deliveryDate || 'Today'}\n\nPlease visit the showroom to collect your garment.\n\nThank You,\nVastra ERP Tailoring Dept`;
      const fallbackUrl = `https://wa.me/${phoneClean.length === 10 ? '91' + phoneClean : phoneClean}?text=${encodeURIComponent(msg)}`;
      window.open(fallbackUrl, "_blank");
    }
  };

  const handleExportReportsCSV = () => {
    if (!alterationRecords || !alterationRecords.length) return;
    const headers = ["Ticket ID", "Invoice Number", "Customer Name", "Customer Phone", "Product Name", "Size", "Color", "Master Tailor", "Priority", "Status", "Delivery Date", "Created Date"];
    const rows = alterationRecords.map(a => [
      a.alterationId || "",
      a.invoiceNumber || a.invoiceId || "",
      `"${a.customerName || ''}"`,
      a.customerPhone || "",
      `"${a.productName || ''}"`,
      a.size || "",
      a.color || "",
      `"${a.tailorName || 'Unassigned'}"`,
      a.priority || "Normal",
      a.status || "Pending",
      a.deliveryDate || "",
      a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Alteration_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onAddNotification) onAddNotification("CSV Exported", "Alterations analytics report downloaded.", "success");
  };

  const handlePrintJobTicketHTML = (ticket) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Job Ticket ${ticket.alterationId}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; color: #000; padding: 20px; max-width: 400px; margin: 0 auto; }
          .text-center { text-align: center; }
          .header { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
          .details { font-size: 11px; line-height: 1.4; margin-bottom: 10px; }
          .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; font-size: 11px; }
          th { text-align: left; }
          .text-right { text-align: right; }
          .badge { font-weight: bold; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="text-center header">VASTRA ERP — ALTERATION TICKET</div>
        <div class="text-center details">Boutique Tailoring & Garment Fitting Slip</div>
        <div class="divider"></div>
        <div class="details">
          <b>Ticket ID:</b> ${ticket.alterationId}<br>
          <b>Target Invoice:</b> ${ticket.invoiceNumber || ticket.invoiceId}<br>
          <b>Date Created:</b> ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}<br>
          <b>Customer:</b> ${ticket.customerName} (${ticket.customerPhone})
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>Garment Item:</b> ${ticket.productName}<br>
          <b>SKU / Barcode:</b> ${ticket.sku || '-'} / ${ticket.barcode || '-'}<br>
          <b>Size & Color:</b> ${ticket.size} / ${ticket.color}<br>
          <b>Master Tailor:</b> ${ticket.tailorName || 'Unassigned'}
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>MEASUREMENTS (INCHES):</b><br>
          ${Object.entries(ticket.measurements || {}).map(([k, v]) => `- ${k}: ${v}"`).join('<br>') || 'Default measurements'}
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>ALTERATION TYPES:</b><br>
          ${(ticket.alterationDetails || ['Custom Fit']).map(d => `✓ ${d}`).join('<br>')}
          ${ticket.customAlterationText ? `<br><b>Custom Note:</b> ${ticket.customAlterationText}` : ''}
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>DELIVERY SCHEDULE:</b><br>
          <b>Delivery Date:</b> ${ticket.deliveryDate || 'Scheduled'} ${ticket.deliveryTime || ''}<br>
          <b>Trial Date:</b> ${ticket.trialDate || 'N/A'}<br>
          <b>Priority:</b> <span class="badge">${ticket.priority || 'Normal'}</span><br>
          <b>Current Status:</b> <span class="badge">${ticket.status || 'Pending'}</span>
        </div>
        ${ticket.specialInstructions ? `
          <div class="divider"></div>
          <div class="details">
            <b>SPECIAL INSTRUCTIONS:</b><br>
            "${ticket.specialInstructions}"
          </div>
        ` : ''}
        <div class="divider"></div>
        <div class="details text-center">
          Powered by Vastra ERP Tailoring Module
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const fetchAlterations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/alterations`);
      const data = res.data;
      if (data.success && data.data && data.data.length > 0) {
        const sorted = data.data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setAlterationRecords(sorted);
      } else {
        setAlterationRecords(defaultAlterationsList);
      }
    } catch (err) {
      console.error("Failed to fetch alterations:", err);
      setAlterationRecords(defaultAlterationsList);
    }
  };

  useEffect(() => {
    fetchAlterations();
    const interval = setInterval(fetchAlterations, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateAlterationStatus = async (altId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.patch(`/alterations/${altId}`, { status: newStatus });
      const data = res.data;
      if (data.success) {
        if (onAddNotification) {
          onAddNotification("Status Updated", `Alteration ticket status set to "${newStatus}".`, "success");
        }
        fetchAlterations();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // ─── CENTER PANEL STATE ───
  // Section 3: Garments
  const garmentsList = ["Shirt", "Pant", "Suit", "Kurta", "Sherwani", "Blazer", "Jacket", "Waistcoat"];
  const [selectedGarment, setSelectedGarment] = useState("Shirt");
  const [activeGarmentIndex, setActiveGarmentIndex] = useState(0);

  // Section 4: Fabric Selection
  const [fabricSearch, setFabricSearch] = useState("");
  const [selectedFabric, setSelectedFabric] = useState(defaultFabrics[0]);
  const [activeFabricIndex, setActiveFabricIndex] = useState(0);

  // Filtered fabrics based on search
  const filteredFabrics = useMemo(() => {
    return defaultFabrics.filter(f =>
      f.name.toLowerCase().includes(fabricSearch.toLowerCase()) ||
      f.brand.toLowerCase().includes(fabricSearch.toLowerCase())
    );
  }, [defaultFabrics, fabricSearch]);

  // Section 5: Color Swatches
  const colorsList = [
    { name: "Classic White", hex: "#ffffff" },
    { name: "Midnight Black", hex: "#000000" },
    { name: "Royal Indigo", hex: "#224499" },
    { name: "Crimson Maroon", hex: "#800020" },
    { name: "Forest Olive", hex: "#3b5323" },
    { name: "Khaki Gold", hex: "#c3b091" },
    { name: "Natural Beige", hex: "#f5f5dc" },
    { name: "Sky Blue", hex: "#87ceeb" }
  ];
  const [selectedColor, setSelectedColor] = useState(colorsList[2]); // Royal Indigo
  const [activeColorIndex, setActiveColorIndex] = useState(2);

  // Section 6: Excel-style Measurements
  const measurementLabels = ["Chest", "Waist", "Shoulder", "Sleeve", "Length", "Neck", "Hip", "Thigh", "Bottom", "Wrist"];
  const [measurements, setMeasurements] = useState({
    Chest: 38,
    Waist: 32,
    Shoulder: 18,
    Sleeve: 25,
    Length: 29,
    Neck: 15,
    Hip: 40,
    Thigh: 24,
    Bottom: 16,
    Wrist: 9
  });

  // Section 7: Design Customization Tiles
  const [customizations, setCustomizations] = useState({
    Collar: "Mandarin",
    Sleeves: "Full Sleeve",
    Pocket: "No Pocket",
    Buttons: "Premium Bone",
    Cuff: "French Cuff",
    Embroidery: "None",
    Logo: "None",
    Fit: "Regular Fit",
    Monogram: "Left Cuff (AM)",
    Lining: "Satin Indigo",
    Piping: "Gold Weave"
  });
  const [activeCustomKey, setActiveCustomKey] = useState("Collar");

  const customizationOptions = {
    Collar: ["Standard", "Mandarin", "Spread", "Button-down"],
    Sleeves: ["Full Sleeve", "Half Sleeve", "Three-Quarter", "Sleeveless"],
    Pocket: ["No Pocket", "Single Pocket", "Double Flap Pocket", "Hidden Pocket"],
    Buttons: ["Premium Bone", "Pearl Finish", "Wood Horn", "Brass Classic"],
    Cuff: ["French Cuff", "Single Button", "Mitered Double", "Round Classic"],
    Embroidery: ["None", "Zari Collar Accent", "Monogram Cuff", "Full Front Placket"],
    Logo: ["None", "Left Chest Embroidered", "Contrast Pocket Thread"],
    Fit: ["Regular Fit", "Slim Tailored", "Comfort Fit", "Bespoke Drape"],
    Monogram: ["None", "Left Cuff", "Chest Placement", "Inside Label"],
    Lining: ["Satin Indigo", "Contrast Paisley", "Pure Cotton Breathable", "None"],
    Piping: ["Gold Weave", "Silver Border", "Contrast Red Silk", "None"]
  };

  // Section 8: Tailors
  const [selectedTailor, setSelectedTailor] = useState(defaultTailors[0]);
  const [activeTailorIndex, setActiveTailorIndex] = useState(0);

  // ─── REFS FOR KEYBOARD FOCUSING ───
  const customerSearchRef = useRef(null);
  const fabricSearchRef = useRef(null);
  const deliveryDateRef = useRef(null);
  const measurementRefs = useRef([]);

  // ─── AUTO FABRIC CALCULATIONS (SECTION 9) ───
  const garmentBaseFabricMeters = {
    Shirt: 2.2,
    Pant: 1.5,
    Suit: 3.8,
    Kurta: 3.0,
    Sherwani: 4.5,
    Blazer: 2.8,
    Jacket: 2.6,
    Waistcoat: 1.2
  };

  const fabricRequiredBase = garmentBaseFabricMeters[selectedGarment] || 2.0;
  const shrinkageLoss = parseFloat((fabricRequiredBase * 0.03).toFixed(2)); // 3%
  const cuttingLoss = parseFloat((fabricRequiredBase * 0.05).toFixed(2)); // 5%
  const totalFabricRequired = parseFloat((fabricRequiredBase + shrinkageLoss + cuttingLoss).toFixed(2));

  const fabricReserved = isFabricReserved ? totalFabricRequired : 0;
  const fabricRemaining = parseFloat((selectedFabric.stock - totalFabricRequired).toFixed(2));

  // ─── COST BREAKDOWN (SECTION 11) ───
  const fabricCost = Math.round(totalFabricRequired * selectedFabric.price);
  const accessoriesCost = customizations.Buttons !== "Premium Bone" ? 250 : 150;
  const embroideryCost = customizations.Embroidery !== "None" ? 650 : 0;
  const tailorCost = selectedTailor.availability === "Busy" ? 950 : 750;
  const alterationCost = 0;
  const discount = 0;
  const subtotal = fabricCost + accessoriesCost + embroideryCost + tailorCost + alterationCost;
  const gstCost = Math.round(subtotal * 0.05); // 5% GST on custom garments
  const grandTotal = subtotal + gstCost - discount;

  // ─── SEARCH FILTERS ───
  const filteredCustomers = useMemo(() => {
    return defaultCustomers.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch) ||
      c.code.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [defaultCustomers, customerSearch]);

  // ─── DATABASE LOAD SYNC EFFECTS ───
  useEffect(() => {
    if (customers && customers.length > 0) {
      const isMock = !selectedCustomer || selectedCustomer.id === "c-101" || selectedCustomer.id === "c-102" || selectedCustomer.id === "c-103" || selectedCustomer.id === "c-104" || selectedCustomer.id === "c-105";
      if (isMock) {
        setSelectedCustomer(defaultCustomers[0]);
      }
    }
  }, [customers, defaultCustomers]);

  useEffect(() => {
    const dbFabrics = (products || []).filter(p => (p.category || "").toLowerCase() === "fabric" || (p.type || "").toLowerCase() === "fabric");
    if (dbFabrics.length > 0) {
      const isMock = !selectedFabric || selectedFabric.id === "fb-1" || selectedFabric.id === "fb-2" || selectedFabric.id === "fb-3" || selectedFabric.id === "fb-4" || selectedFabric.id === "fb-5" || selectedFabric.id === "fb-6";
      if (isMock) {
        setSelectedFabric(defaultFabrics[0]);
      }
    }
  }, [products, defaultFabrics]);

  useEffect(() => {
    const dbTailors = (employees || []).filter(e => (e.designation || e.role || "").toLowerCase() === "tailor" || (e.role || "").toLowerCase() === "tailor");
    if (dbTailors.length > 0) {
      const isMock = !selectedTailor || selectedTailor.id === "tr-1" || selectedTailor.id === "tr-2" || selectedTailor.id === "tr-3" || selectedTailor.id === "tr-4" || selectedTailor.id === "tr-5";
      if (isMock) {
        setSelectedTailor(defaultTailors[0]);
      }
    }
  }, [employees, defaultTailors]);

  // ─── KEYBOARD LISTENERS (HOTKEYS & NAVIGATION) ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl) {
        switch (e.key.toLowerCase()) {
          case 'f':
            e.preventDefault();
            setFocusedSection("customer_search");
            customerSearchRef.current?.focus();
            customerSearchRef.current?.select();
            break;
          case 'd':
            e.preventDefault();
            setFocusedSection("order_info");
            deliveryDateRef.current?.focus();
            break;
          case 'm':
            e.preventDefault();
            setFocusedSection("measurements");
            measurementRefs.current[0]?.focus();
            measurementRefs.current[0]?.select();
            break;
          case 'b':
            e.preventDefault();
            setFocusedSection("fabric_search");
            fabricSearchRef.current?.focus();
            fabricSearchRef.current?.select();
            break;
          case 's':
            e.preventDefault();
            handleSaveDraft();
            break;
          case 'j':
            e.preventDefault();
            handleGenerateJobCard();
            break;
          case 'p':
            e.preventDefault();
            handleSendToProduction();
            break;
          case 't':
            e.preventDefault();
            setFocusedSection("tailors");
            break;
          case 'h':
            e.preventDefault();
            setShowHistoryModal(true);
            break;
          case 'l':
            e.preventDefault();
            handleLoadPreviousMeasurements();
            break;
          default:
            break;
        }
      } else {
        switch (e.key) {
          case 'F4':
            e.preventDefault();
            setShowProductionSummary(prev => !prev);
            break;
          case 'F8':
            e.preventDefault();
            handleReserveFabric();
            break;
          case 'F9':
            e.preventDefault();
            handlePushToPOS();
            break;
          case 'Escape':
            e.preventDefault();
            setShowHistoryModal(false);
            setShowPrintPreview(false);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedCustomer,
    measurements,
    selectedGarment,
    selectedFabric,
    selectedColor,
    customizations,
    selectedTailor,
    isFabricReserved,
    deliveryDate,
    grandTotal
  ]);

  // Section-specific Arrow Navigation
  useEffect(() => {
    const handleNavigation = (e) => {
      if (focusedSection === "customer_search" && filteredCustomers.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveCustomerIndex((prev) => (prev + 1) % filteredCustomers.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveCustomerIndex((prev) => (prev - 1 + filteredCustomers.length) % filteredCustomers.length);
        } else if (e.key === "Enter" && document.activeElement === customerSearchRef.current) {
          e.preventDefault();
          setSelectedCustomer(filteredCustomers[activeCustomerIndex]);
          setCustomerSearch("");
          setFocusedSection("garments");
          onAddNotification("Customer Selected", `${filteredCustomers[activeCustomerIndex].name} linked to custom ticket.`, "success");
        }
      }

      if (focusedSection === "garments") {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setActiveGarmentIndex((prev) => (prev + 1) % garmentsList.length);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setActiveGarmentIndex((prev) => (prev - 1 + garmentsList.length) % garmentsList.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          setSelectedGarment(garmentsList[activeGarmentIndex]);
          setFocusedSection("fabrics");
          onAddNotification("Garment Updated", `Style preset switched to ${garmentsList[activeGarmentIndex]}.`, "info");
        }
      }

      if (focusedSection === "fabrics" && filteredFabrics.length > 0) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setActiveFabricIndex((prev) => (prev + 1) % filteredFabrics.length);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setActiveFabricIndex((prev) => (prev - 1 + filteredFabrics.length) % filteredFabrics.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          setSelectedFabric(filteredFabrics[activeFabricIndex]);
          setFocusedSection("colors");
          onAddNotification("Fabric Linked", `${filteredFabrics[activeFabricIndex].name} lot attached.`, "success");
        }
      }

      if (focusedSection === "colors") {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setActiveColorIndex((prev) => (prev + 1) % colorsList.length);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setActiveColorIndex((prev) => (prev - 1 + colorsList.length) % colorsList.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          setSelectedColor(colorsList[activeColorIndex]);
          setFocusedSection("measurements");
          onAddNotification("Color Swatch Selected", `Garment shade set to ${colorsList[activeColorIndex].name}.`, "info");
        }
      }

      if (focusedSection === "tailors") {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveTailorIndex((prev) => (prev + 1) % defaultTailors.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveTailorIndex((prev) => (prev - 1 + defaultTailors.length) % defaultTailors.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          setSelectedTailor(defaultTailors[activeTailorIndex]);
          onAddNotification("Tailor Assigned", `${defaultTailors[activeTailorIndex].name} assigned to tailoring job.`, "success");
        }
      }
    };

    window.addEventListener("keydown", handleNavigation);
    return () => window.removeEventListener("keydown", handleNavigation);
  }, [focusedSection, activeCustomerIndex, activeGarmentIndex, activeFabricIndex, activeColorIndex, activeTailorIndex, filteredCustomers, filteredFabrics]);

  // Spreadsheet Measurement Navigation
  const handleMeasurementKeyDown = (idx, e) => {
    let nextIdx = -1;
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (idx < 4) {
          nextIdx = idx + 1; // Left column down
        } else if (idx === 4) {
          nextIdx = 5; // To top of right column
        } else if (idx < 9) {
          nextIdx = idx + 1; // Right column down
        } else {
          setFocusedSection("customizations");
          onAddNotification("Measurements Locked", "Bespoke spreadsheet values loaded.", "info");
        }
        break;
      case 'Tab':
        if (!e.shiftKey) {
          e.preventDefault();
          if (idx < 5) {
            nextIdx = idx + 5; // Move to corresponding cell in right column
          } else {
            nextIdx = idx - 5 + 1; // Move to next row in left column
            if (nextIdx > 4) nextIdx = 0;
          }
        } else {
          e.preventDefault();
          if (idx >= 5) {
            nextIdx = idx - 5; // Move to left column
          } else {
            nextIdx = idx + 5 - 1; // Move to previous row in right column
            if (nextIdx < 5) nextIdx = 9;
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (idx > 0 && idx !== 5) nextIdx = idx - 1;
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (idx < 9 && idx !== 4) nextIdx = idx + 1;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (idx >= 5) nextIdx = idx - 5;
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (idx < 5) nextIdx = idx + 5;
        break;
      default:
        break;
    }

    if (nextIdx !== -1) {
      measurementRefs.current[nextIdx]?.focus();
      measurementRefs.current[nextIdx]?.select();
    }
  };

  // ─── ACTION HANDLERS ───
  const handleSaveDraft = () => {
    onAddNotification("Draft Saved", `Bespoke customization draft logged under ${orderNo}.`, "success");
  };

  const logMovementToBackend = async (data) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.post(`/inventory-movements`, data);
    } catch (err) {
      console.error("Failed to log movement to backend:", err.message);
    }
  };

  const handleReserveFabric = () => {
    setIsFabricReserved(true);
    onAddNotification("Fabric Allocated", `${totalFabricRequired} meters of ${selectedFabric.name} reserved in stock.`, "success");

    if (selectedFabric && selectedFabric.id) {
      const matchedProd = products.find(p => p._id === selectedFabric.id || p.id === selectedFabric.id);
      if (matchedProd) {
        logMovementToBackend({
          productId: matchedProd._id || matchedProd.id,
          movementType: "OUTBOUND",
          activity: "MATERIAL_ISSUE",
          quantity: Math.ceil(totalFabricRequired),
          referenceType: "Job Card",
          referenceNumber: orderNo,
          remarks: `Fabric reserved for bespoke ${selectedGarment} order ${orderNo}`
        });
      }
    }
  };

  const handleGenerateJobCard = () => {
    setShowPrintPreview(true);
    onAddNotification("Job Card Built", "Garment job specifications compiled to job card.", "success");
  };

  const handleSendToProduction = () => {
    setOrderStatus("In Production");
    onAddNotification("Production Stage Loaded", `Garment sent to workflow line. Assigned: ${selectedTailor.name}.`, "success");

    if (selectedFabric && selectedFabric.id) {
      const matchedProd = products.find(p => p._id === selectedFabric.id || p.id === selectedFabric.id);
      if (matchedProd) {
        logMovementToBackend({
          productId: matchedProd._id || matchedProd.id,
          movementType: "OUTBOUND",
          activity: "MATERIAL_ISSUE",
          quantity: Math.ceil(totalFabricRequired),
          referenceType: "Job Card",
          referenceNumber: orderNo,
          remarks: `Fabric issued to tailor ${selectedTailor.name} for bespoke ${selectedGarment}`
        });
      }
    }
  };

  const handlePushToPOS = () => {
    const itemPayload = {
      id: `custom-${Date.now()}`,
      name: `${selectedGarment} - Bespoke Custom`,
      price: grandTotal,
      quantity: 1,
      totalPrice: grandTotal,
      isCustom: true,
      customDetails: {
        garmentType: selectedGarment,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        fabric: selectedFabric.name,
        color: selectedColor.name,
        tailor: selectedTailor.name,
        measurements: measurements,
        customizations: customizations,
        orderNo: orderNo,
        deliveryDate: deliveryDate
      }
    };
    onAddCustomToCart(itemPayload);
    onAddNotification("Sent to Billing", "Bespoke custom ticket pushed successfully to boutique POS queue.", "success");

    if (selectedFabric && selectedFabric.id) {
      const matchedProd = products.find(p => p._id === selectedFabric.id || p.id === selectedFabric.id);
      if (matchedProd) {
        logMovementToBackend({
          productId: matchedProd._id || matchedProd.id,
          movementType: "INBOUND",
          activity: "FINISHED_GOODS_RECEIVED",
          quantity: 1,
          referenceType: "Job Card",
          referenceNumber: orderNo,
          remarks: `Finished bespoke ${selectedGarment} received in showroom stock`
        });
      }
    }
  };

  const handleLoadPreviousMeasurements = () => {
    setMeasurements({
      Chest: 39,
      Waist: 33,
      Shoulder: 18.5,
      Sleeve: 25.5,
      Length: 29.5,
      Neck: 15.5,
      Hip: 41,
      Thigh: 24.5,
      Bottom: 16.5,
      Wrist: 9.5
    });
    onAddNotification("Bespoke History Loaded", `Restored measurements registry for ${selectedCustomer.name}.`, "success");
  };

  // ─── SVG PREVIEW BLUEPRINT CALCULATOR ───
  const renderSVGBlueprint = () => {
    const strokeColor = "#4338ca"; // Indigo-700
    const fillColor = selectedColor.hex;

    switch (selectedGarment) {
      case "Shirt":
        return (
          <svg className="w-full h-full text-indigo-600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Body */}
            <path d="M25 25 L40 20 L50 25 L60 20 L75 25 L75 80 L25 80 Z" fill={fillColor} fillOpacity="0.2" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Sleeves */}
            {customizations.Sleeves.includes("Full") ? (
              <>
                <path d="M25 25 L10 55 L16 57 L25 35 Z" fill={fillColor} fillOpacity="0.3" stroke={strokeColor} strokeWidth="1.5" />
                <path d="M75 25 L90 55 L84 57 L75 35 Z" fill={fillColor} fillOpacity="0.3" stroke={strokeColor} strokeWidth="1.5" />
              </>
            ) : (
              <>
                <path d="M25 25 L15 35 L20 38 L25 32 Z" fill={fillColor} fillOpacity="0.3" stroke={strokeColor} strokeWidth="1.5" />
                <path d="M75 25 L85 35 L80 38 L75 32 Z" fill={fillColor} fillOpacity="0.3" stroke={strokeColor} strokeWidth="1.5" />
              </>
            )}
            {/* Collar */}
            {customizations.Collar === "Mandarin" ? (
              <path d="M40 20 C40 16, 60 16, 60 20 Z" fill={fillColor} fillOpacity="0.5" stroke={strokeColor} strokeWidth="1.5" />
            ) : (
              <path d="M35 20 L50 27 L65 20 L58 17 L42 17 Z" fill={fillColor} fillOpacity="0.5" stroke={strokeColor} strokeWidth="1.5" />
            )}
            {/* Pocket */}
            {customizations.Pocket !== "No Pocket" && (
              <rect x="32" y="38" width="10" height="12" rx="1" stroke={strokeColor} strokeWidth="1.2" fill={fillColor} fillOpacity="0.1" />
            )}
            {/* Buttons Line */}
            <line x1="50" y1="27" x2="50" y2="78" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="50" cy="35" r="1.2" fill={strokeColor} />
            <circle cx="50" cy="45" r="1.2" fill={strokeColor} />
            <circle cx="50" cy="55" r="1.2" fill={strokeColor} />
            <circle cx="50" cy="65" r="1.2" fill={strokeColor} />
          </svg>
        );
      case "Pant":
        return (
          <svg className="w-full h-full text-indigo-600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 15 L70 15 L73 30 L62 90 L51 90 L50 45 L49 90 L38 90 L27 30 Z" fill={fillColor} fillOpacity="0.2" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Pockets */}
            <path d="M30 22 L36 28" stroke={strokeColor} strokeWidth="1.5" />
            <path d="M70 22 L64 28" stroke={strokeColor} strokeWidth="1.5" />
            {/* Waistband */}
            <rect x="30" y="15" width="40" height="5" stroke={strokeColor} strokeWidth="1" fill={fillColor} fillOpacity="0.3" />
          </svg>
        );
      case "Suit":
      case "Blazer":
      case "Jacket":
        return (
          <svg className="w-full h-full text-indigo-600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Coat Body */}
            <path d="M25 20 L40 18 L50 25 L60 18 L75 20 L72 82 L28 82 Z" fill={fillColor} fillOpacity="0.2" stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round" />
            {/* Lapels */}
            <path d="M25 20 L42 45 L50 25 L58 45 L75 20 L62 18 L50 25 L38 18 Z" fill={fillColor} fillOpacity="0.4" stroke={strokeColor} strokeWidth="1.5" />
            {/* Sleeves */}
            <path d="M25 20 L15 78 L21 80 L28 32 Z" fill={fillColor} fillOpacity="0.3" stroke={strokeColor} strokeWidth="1.5" />
            <path d="M75 20 L85 78 L79 80 L72 32 Z" fill={fillColor} fillOpacity="0.3" stroke={strokeColor} strokeWidth="1.5" />
            {/* Buttons */}
            <circle cx="47" cy="52" r="1.5" fill={strokeColor} />
            <circle cx="47" cy="59" r="1.5" fill={strokeColor} />
          </svg>
        );
      default: // Kurta, Sherwani, etc.
        return (
          <svg className="w-full h-full text-indigo-600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 20 L42 16 L50 20 L58 16 L70 20 L68 92 L32 92 Z" fill={fillColor} fillOpacity="0.2" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Sleeves */}
            <path d="M30 20 L12 50 L18 53 L32 30 Z" fill={fillColor} fillOpacity="0.3" stroke={strokeColor} strokeWidth="1.5" />
            <path d="M70 20 L88 50 L82 53 L68 30 Z" fill={fillColor} fillOpacity="0.3" stroke={strokeColor} strokeWidth="1.5" />
            {/* Neckline */}
            <path d="M45 20 L50 32 L55 20" stroke={strokeColor} strokeWidth="1.5" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] text-xs text-slate-600 bg-slate-50 font-sans select-none overflow-hidden" id="vastra-bespoke-studio-root">

      {/* ─── ENTERPRISE MODULE NAVIGATION TABS HEADER ─── */}
      <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200/80 shrink-0">
        <div className="bg-slate-100 p-2 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <button
              onClick={() => setActiveStudioTab("dashboard")}
              className={`w-full py-3.5 px-5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 ${activeStudioTab === "dashboard" ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200" : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-bold"}`}
            >
              <Scissors className="w-5 h-5 text-rose-600 stroke-[2.5]" />
              <span className="tracking-wide uppercase">Alteration Dashboard</span>
            </button>

            <button
              onClick={() => setActiveStudioTab("reports")}
              className={`w-full py-3.5 px-5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 ${activeStudioTab === "reports" ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200" : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-bold"}`}
            >
              <BarChart3 className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
              <span className="tracking-wide uppercase">Alteration Reports</span>
            </button>

            <button
              onClick={() => setActiveStudioTab("tracking")}
              className={`w-full py-3.5 px-5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 ${activeStudioTab === "tracking" ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200" : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-bold"}`}
            >
              <Users className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
              <span className="tracking-wide uppercase">Employee Alteration Tracking</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB CONTENT CONTAINER ─── */}
      <div className="flex-1 p-4 sm:p-6 bg-slate-50 overflow-y-auto space-y-6 animate-fade-in">

        {/* ============================================================================== */}
        {/* TAB 1: ALTERATION DASHBOARD */}
        {/* ============================================================================== */}
        {activeStudioTab === "dashboard" && (
          <div className="space-y-5 animate-fade-in">

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tickets</p>
                  <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{alterationRecords.length}</p>
                </div>
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ready for Delivery</p>
                  <p className="text-xl font-black text-emerald-600 font-mono mt-0.5">
                    {alterationRecords.filter(a => a.status === "Ready for Delivery").length}
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Progress Work</p>
                  <p className="text-xl font-black text-indigo-600 font-mono mt-0.5">
                    {alterationRecords.filter(a => a.status === "In Progress" || a.status === "Assigned").length}
                  </p>
                </div>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delayed / Overdue</p>
                  <p className="text-xl font-black text-rose-600 font-mono mt-0.5">
                    {alterationRecords.filter(a => a.deliveryDate && a.deliveryDate < new Date().toISOString().split('T')[0] && a.status !== 'Delivered').length}
                  </p>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={alterationSearchQuery}
                  onChange={(e) => setAlterationSearchQuery(e.target.value)}
                  placeholder="Search customer name, phone, invoice #, ticket #, tailor..."
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all shadow-2xs"
                />
                {alterationSearchQuery && (
                  <button
                    onClick={() => setAlterationSearchQuery("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Set default dates
                    const delivery = new Date();
                    delivery.setDate(delivery.getDate() + 3);
                    setAltDeliveryDate(delivery.toISOString().split('T')[0]);
                    
                    const trial = new Date();
                    trial.setDate(trial.getDate() + 2);
                    setAltTrialDate(trial.toISOString().split('T')[0]);
                    
                    // Reset states & show modal
                    setSelectedAltInvoice(null);
                    setSelectedAltItem(null);
                    setAltInvoiceSearch("");
                    setAltInvoices([]);
                    setAltTailorName("");
                    setAltPriority("Normal");
                    setAltDetails([]);
                    setAltCustomText("");
                    setAltMeasurements({});
                    setShowCreateAltModal(true);
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>New Alteration Ticket</span>
                </button>
                <button
                  onClick={fetchAlterations}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Stream</span>
                </button>
              </div>
            </div>

            {/* STATUS FILTER PILLS */}
            <div className="flex gap-2 overflow-x-auto pb-1 font-sans shrink-0">
              {["All", "Pending", "In Progress", "Ready for Trial", "Ready for Delivery", "Delivered", "Cancelled"].map((st) => {
                const count = st === "All" ? alterationRecords.length : alterationRecords.filter(a => a.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setAlterationsFilterStatus(st)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${alterationsFilterStatus === st ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                  >
                    {st} ({count})
                  </button>
                );
              })}
            </div>

            {/* ALTERATIONS MASTER DATA TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                      <th className="p-3.5">Ticket #</th>
                      <th className="p-3.5">Invoice No</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Product / Garment</th>
                      <th className="p-3.5">Master Tailor</th>
                      <th className="p-3.5">Measurements & Details</th>
                      <th className="p-3.5">Delivery & Priority</th>
                      <th className="p-3.5">Status Workflow</th>
                      <th className="p-3.5">Customer Notification</th>
                      <th className="p-3.5">Job Ticket Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    {alterationRecords
                      .filter(a => {
                        const matchesStatus = alterationsFilterStatus === "All" || a.status === alterationsFilterStatus;
                        if (!matchesStatus) return false;
                        if (!alterationSearchQuery.trim()) return true;
                        const q = alterationSearchQuery.toLowerCase().trim();
                        return (
                          (a.customerName || "").toLowerCase().includes(q) ||
                          (a.customerPhone || "").toLowerCase().includes(q) ||
                          (a.invoiceNumber || a.invoiceId || "").toLowerCase().includes(q) ||
                          (a.alterationId || "").toLowerCase().includes(q) ||
                          (a.productName || "").toLowerCase().includes(q) ||
                          (a.sku || "").toLowerCase().includes(q) ||
                          (a.tailorName || "").toLowerCase().includes(q)
                        );
                      })
                      .map((alt) => {
                        const mKeys = Object.keys(alt.measurements || {});
                        const isReadyForDelivery = alt.status === "Ready for Delivery";
                        return (
                          <tr key={alt._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-rose-600 whitespace-nowrap">
                              {alt.alterationId || `ALT-${alt._id.slice(-6)}`}
                            </td>
                            <td className="p-3.5 font-mono font-bold text-indigo-600 whitespace-nowrap">
                              {alt.invoiceNumber || alt.invoiceId}
                            </td>
                            <td className="p-3.5">
                              <p className="font-extrabold text-slate-800">{alt.customerName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{alt.customerPhone}</p>
                            </td>
                            <td className="p-3.5">
                              <p className="font-bold text-slate-800">{alt.productName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                SKU: {alt.sku} | Size: {alt.size} / {alt.color}
                              </p>
                            </td>
                            <td className="p-3.5 font-bold text-slate-700">
                              {alt.tailorName || 'Unassigned'}
                            </td>
                            <td className="p-3.5 max-w-xs">
                              <div className="space-y-1">
                                {alt.alterationDetails && alt.alterationDetails.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {alt.alterationDetails.map((d, i) => (
                                      <span key={i} className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                        {d}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {mKeys.length > 0 && (
                                  <p className="text-[10px] font-mono text-slate-500 truncate">
                                    {mKeys.slice(0, 4).map(k => `${k}: ${alt.measurements[k]}"`).join(', ')}
                                    {mKeys.length > 4 && ` +${mKeys.length - 4} more`}
                                  </p>
                                )}
                                {alt.specialInstructions && (
                                  <p className="text-[10px] text-slate-400 italic truncate" title={alt.specialInstructions}>
                                    "{alt.specialInstructions}"
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <p className="font-mono font-bold">{alt.deliveryDate || 'N/A'}</p>
                              <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${alt.priority === 'Express' ? 'bg-red-100 text-red-700' : alt.priority === 'Urgent' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                {alt.priority || 'Normal'}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <select
                                value={alt.status || 'Pending'}
                                onChange={(e) => handleUpdateAlterationStatus(alt._id, e.target.value)}
                                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none cursor-pointer focus:ring-1 focus:ring-rose-500"
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Ready for Trial">Ready for Trial</option>
                                <option value="Ready for Delivery">Ready for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            {/* FEATURE 1: WHATSAPP NOTIFY CUSTOMER BUTTON */}
                            <td className="p-3.5">
                              {isReadyForDelivery ? (
                                <button
                                  type="button"
                                  onClick={() => setWhatsappModalTarget(alt)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 shadow-xs cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Notify Customer</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono italic">Available when Ready</span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <button
                                onClick={() => setSelectedJobTicket(alt)}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Receipt</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                    {alterationRecords.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400 text-xs font-medium">
                          No alteration records logged yet. Click "ALTERATION" in POS Billing to add job tickets.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 2: ALTERATION REPORTS */}
        {/* ============================================================================== */}
        {activeStudioTab === "reports" && (
          <div className="space-y-6 animate-fade-in">

            {/* INTERACTIVE FILTERS BAR */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <span>Report Filters:</span>
                </div>

                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">Date Range: All Time</option>
                  <option value="Today">Today</option>
                  <option value="ThisWeek">This Week</option>
                  <option value="ThisMonth">This Month</option>
                </select>

                <select
                  value={filterEmployee}
                  onChange={(e) => setFilterEmployee(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">Master Tailor: All</option>
                  {defaultTailors.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">Status: All</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Ready for Trial">Ready for Trial</option>
                  <option value="Ready for Delivery">Ready for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">Priority: All</option>
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Express">Express</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportReportsCSV}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* BI SUMMARY KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Alterations</p>
                <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                  {reportsData?.summary?.totalAlterations || alterationRecords.length}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion Rate</p>
                <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
                  {reportsData?.summary?.completionRate || (alterationRecords.length ? Math.round((alterationRecords.filter(a => a.status === 'Delivered' || a.status === 'Ready for Delivery').length / alterationRecords.length) * 100) : 0)}%
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ready for Delivery</p>
                <p className="text-2xl font-black text-indigo-600 font-mono mt-1">
                  {reportsData?.summary?.readyForDeliveryCount || alterationRecords.filter(a => a.status === 'Ready for Delivery').length}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Progress Work</p>
                <p className="text-2xl font-black text-amber-600 font-mono mt-1">
                  {reportsData?.summary?.inProgressCount || alterationRecords.filter(a => a.status === 'In Progress').length}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delayed Job Rate</p>
                <p className="text-2xl font-black text-rose-600 font-mono mt-1">
                  {reportsData?.summary?.delayedRate || (alterationRecords.length ? Math.round((alterationRecords.filter(a => a.deliveryDate && a.deliveryDate < new Date().toISOString().split('T')[0] && a.status !== 'Delivered').length / alterationRecords.length) * 100) : 0)}%
                </p>
              </div>
            </div>

            {/* VISUAL CHARTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* CHART 1: STATUS BREAKDOWN */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-rose-600" />
                    <span>Alteration Status Breakdown</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Live Analytics</span>
                </div>

                <div className="space-y-3">
                  {["Pending", "In Progress", "Ready for Trial", "Ready for Delivery", "Delivered", "Cancelled"].map(st => {
                    const count = alterationRecords.filter(a => a.status === st).length;
                    const pct = alterationRecords.length ? Math.round((count / alterationRecords.length) * 100) : 0;
                    return (
                      <div key={st} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700">{st}</span>
                          <span className="font-mono text-slate-500">{count} jobs ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${st === 'Delivered' ? 'bg-emerald-500' : st === 'Ready for Delivery' ? 'bg-indigo-500' : st === 'In Progress' ? 'bg-amber-500' : st === 'Cancelled' ? 'bg-rose-500' : 'bg-slate-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CHART 2: GARMENT TYPE & PRIORITY DISTRIBUTION */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-indigo-600" />
                    <span>Garment Category Breakdown</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Volume</span>
                </div>

                <div className="space-y-3">
                  {["Shirt", "Pant", "Suit", "Kurta", "Sherwani", "Blazer"].map(g => {
                    const count = alterationRecords.filter(a => (a.productName || '').toLowerCase().includes(g.toLowerCase())).length;
                    const pct = alterationRecords.length ? Math.round((count / alterationRecords.length) * 100) : 0;
                    return (
                      <div key={g} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700">{g}</span>
                          <span className="font-mono text-slate-500">{count} garments ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DELAYED JOBS AUDIT TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Delayed Alteration Jobs Audit</span>
                </h3>
                <span className="text-[10px] font-mono text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="p-3">Ticket #</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Garment</th>
                      <th className="p-3">Master Tailor</th>
                      <th className="p-3">Delivery Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Overdue Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {alterationRecords
                      .filter(a => a.deliveryDate && a.deliveryDate < new Date().toISOString().split('T')[0] && a.status !== 'Delivered')
                      .map(alt => {
                        const targetDate = new Date(alt.deliveryDate);
                        const daysOverdue = Math.max(1, Math.floor((new Date() - targetDate) / (1000 * 60 * 60 * 24)));
                        return (
                          <tr key={alt._id} className="hover:bg-rose-50/40">
                            <td className="p-3 font-mono font-bold text-rose-600">{alt.alterationId}</td>
                            <td className="p-3 font-bold">{alt.customerName} ({alt.customerPhone})</td>
                            <td className="p-3">{alt.productName}</td>
                            <td className="p-3 font-bold">{alt.tailorName || 'Unassigned'}</td>
                            <td className="p-3 font-mono text-rose-600 font-bold">{alt.deliveryDate}</td>
                            <td className="p-3">
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                                {alt.status}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-black text-rose-600">
                              +{daysOverdue} Days Overdue
                            </td>
                          </tr>
                        );
                      })}

                    {alterationRecords.filter(a => a.deliveryDate && a.deliveryDate < new Date().toISOString().split('T')[0] && a.status !== 'Delivered').length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                          🎉 Outstanding! No delayed alteration jobs in backlog.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 3: EMPLOYEE ALTERATION TRACKING (PRODUCTIVITY ONLY, NO COMMISSION) */}
        {/* ============================================================================== */}
        {activeStudioTab === "tracking" && (
          <div className="space-y-6 animate-fade-in">



            {/* PERFORMANCE INDICATOR LEGEND BANNER */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Performance Indicators:</span>
              <div className="flex flex-wrap items-center gap-2 font-bold">
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1">
                  <Star className="w-3 h-3 text-emerald-600 fill-emerald-600" /> Excellent (85%+ Completion)
                </span>
                <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg text-[10px]">
                  Good (65%+ Completion)
                </span>
                <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg text-[10px]">
                  Average (45%+ Completion)
                </span>
                <span className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg text-[10px]">
                  Needs Attention (&lt;45%)
                </span>
              </div>
            </div>

            {/* TAILOR PERFORMANCE CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(performanceData?.metrics || defaultTailors.map((t, idx) => {
                const tailorAlts = alterationRecords.filter(a => a.tailorName === t.name);
                const assignedCount = tailorAlts.length || t.jobs || 0;
                const completedCount = tailorAlts.filter(a => a.status === 'Delivered' || a.status === 'Ready for Delivery').length;
                const pendingCount = tailorAlts.filter(a => a.status === 'Pending' || a.status === 'Assigned').length;
                const inProgressCount = tailorAlts.filter(a => a.status === 'In Progress').length;
                const readyForDeliveryCount = tailorAlts.filter(a => a.status === 'Ready for Delivery').length;
                const delayedCount = tailorAlts.filter(a => a.deliveryDate && a.deliveryDate < new Date().toISOString().split('T')[0] && a.status !== 'Delivered').length;
                const completionPct = assignedCount ? Math.round((completedCount / assignedCount) * 100) : 100;
                const availabilityStatus = t.availability || (inProgressCount >= 5 ? 'Busy' : 'Available');

                let performanceIndicator = 'Good';
                if (completionPct >= 85 && delayedCount === 0) performanceIndicator = 'Excellent';
                else if (completionPct >= 65) performanceIndicator = 'Good';
                else if (completionPct >= 45) performanceIndicator = 'Average';
                else performanceIndicator = 'Needs Attention';

                return {
                  employeeId: `EMP-TR-${101 + idx}`,
                  employeeName: t.name,
                  designation: 'Master Tailor',
                  assignedCount,
                  completedCount,
                  pendingCount,
                  inProgressCount,
                  readyForDeliveryCount,
                  delayedCount,
                  todayWork: Math.floor(assignedCount * 0.4),
                  weeklyWork: Math.floor(assignedCount * 0.7),
                  monthlyWork: assignedCount,
                  completionPct,
                  avgCompletionTimeHrs: 4.2,
                  lastCompletedDate: 'Today',
                  availabilityStatus,
                  performanceIndicator
                };
              })).map((tailor) => {
                const indicatorBg =
                  tailor.performanceIndicator === 'Excellent' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    tailor.performanceIndicator === 'Good' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                      tailor.performanceIndicator === 'Average' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-rose-100 text-rose-800 border-rose-200';

                const statusBg =
                  tailor.availabilityStatus === 'Available' ? 'bg-emerald-500' :
                    tailor.availabilityStatus === 'Busy' ? 'bg-amber-500' : 'bg-rose-500';

                return (
                  <div key={tailor.employeeName} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-all">

                    {/* CARD HEADER */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                            {tailor.employeeName.charAt(0)}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${statusBg}`} title={tailor.availabilityStatus} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">{tailor.employeeName}</h4>
                          <p className="text-[10px] text-slate-400 font-mono">{tailor.designation} | {tailor.employeeId}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${indicatorBg}`}>
                        {tailor.performanceIndicator}
                      </span>
                    </div>

                    {/* METRICS GRID */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Assigned</p>
                        <p className="font-mono font-black text-slate-800">{tailor.assignedCount}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Completed</p>
                        <p className="font-mono font-black text-emerald-600">{tailor.completedCount}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Pending</p>
                        <p className="font-mono font-black text-amber-600">{tailor.pendingCount}</p>
                      </div>
                    </div>

                    {/* WORK BREAKDOWN */}
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">In Progress:</span>
                        <span className="font-bold text-slate-700">{tailor.inProgressCount} jobs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ready for Pickup:</span>
                        <span className="font-bold text-indigo-600">{tailor.readyForDeliveryCount} jobs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Delayed Alterations:</span>
                        <span className={`font-bold ${tailor.delayedCount > 0 ? 'text-rose-600 font-mono' : 'text-slate-700'}`}>{tailor.delayedCount} jobs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Completion Time:</span>
                        <span className="font-mono font-bold text-slate-800">{tailor.avgCompletionTimeHrs} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Work Logs:</span>
                        <span className="font-mono text-slate-600 font-bold">Today: {tailor.todayWork} | Wk: {tailor.weeklyWork}</span>
                      </div>
                    </div>

                    {/* COMPLETION PROGRESS BAR */}
                    <div className="space-y-1 border-t border-slate-100 pt-3">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-500">Productivity Score</span>
                        <span className="font-mono text-emerald-600">{tailor.completionPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${tailor.completionPct}%` }}
                        />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

      {/* ============================================================================== */}
      {/* MODAL 1: WHATSAPP NOTIFICATION CONFIRMATION POPUP (FEATURE 1) */}
      {/* ============================================================================== */}
      {whatsappModalTarget && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-slate-800 animate-scale-up">

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900">
                  Send WhatsApp Notification?
                </h3>
                <p className="text-xs text-slate-400">
                  Confirm instant WhatsApp pickup alert to customer
                </p>
              </div>
            </div>

            {/* PRE-FETCHED CUSTOMER & ALTERATION DETAILS */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Customer Name:</span>
                <span className="font-extrabold text-slate-800">{whatsappModalTarget.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Customer Mobile #:</span>
                <span className="font-mono font-bold text-slate-800">{whatsappModalTarget.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Invoice Number:</span>
                <span className="font-mono font-bold text-indigo-600">{whatsappModalTarget.invoiceNumber || whatsappModalTarget.invoiceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Product / Garment:</span>
                <span className="font-bold text-slate-800">{whatsappModalTarget.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Delivery Date:</span>
                <span className="font-mono font-bold text-emerald-600">{whatsappModalTarget.deliveryDate || 'Today'}</span>
              </div>
            </div>

            {/* MESSAGE PREVIEW BOX */}
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-[11px] text-emerald-900 leading-relaxed font-mono whitespace-pre-line shadow-2xs">
              {`Hello ${whatsappModalTarget.customerName},\n\nYour alteration for Invoice ${whatsappModalTarget.invoiceNumber || whatsappModalTarget.invoiceId} is now completed and ready for pickup.\n\nProduct:\n${whatsappModalTarget.productName}\n\nDelivery Date:\n${whatsappModalTarget.deliveryDate || 'Today'}\n\nPlease visit the showroom to collect your garment.\n\nThank You,\nVastra ERP Tailoring Dept`}
            </div>

            {/* CONFIRMATION YES / NO BUTTONS */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setWhatsappModalTarget(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                NO (Cancel)
              </button>
              <button
                type="button"
                onClick={() => handleConfirmSendWhatsApp(whatsappModalTarget)}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>YES (Send Alert)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: JOB TICKET RECEIPT & ALTERATION SLIP */}
      {selectedJobTicket && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-up my-auto text-slate-800">

            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-black uppercase tracking-wide">
                  Alteration Job Ticket Receipt
                </h3>
              </div>
              <button
                onClick={() => setSelectedJobTicket(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Ticket Receipt Body */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 font-mono text-xs text-slate-800 space-y-3 max-h-[70vh] overflow-y-auto erp-hide-scrollbar">
              <div className="text-center font-black text-slate-900 text-base">
                VASTRA ERP — ALTERATION TICKET
              </div>
              <div className="text-center text-[10px] text-slate-500">
                Bespoke Tailoring & Garment Fitting Slip
              </div>
              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="flex justify-between">
                <span>Ticket #: <strong className="text-rose-600">{selectedJobTicket.alterationId}</strong></span>
                <span>Date: {selectedJobTicket.createdAt ? new Date(selectedJobTicket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}</span>
              </div>
              <div>
                <span>Target Invoice: <strong>{selectedJobTicket.invoiceNumber || selectedJobTicket.invoiceId}</strong></span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span>Customer: <strong>{selectedJobTicket.customerName}</strong></span>
                <span>Mobile: {selectedJobTicket.customerPhone}</span>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="space-y-1">
                <p className="font-bold text-slate-900 uppercase">Garment Specs:</p>
                <p>{selectedJobTicket.productName}</p>
                <p className="text-[10px] text-slate-500">SKU: {selectedJobTicket.sku} | Size: {selectedJobTicket.size} | Color: {selectedJobTicket.color}</p>
                <p className="text-[10px]">Master Tailor: <strong>{selectedJobTicket.tailorName || 'Unassigned'}</strong></p>
                <p className="text-[10px]">Staff: {selectedJobTicket.salespersonName || 'Store Cashier'}</p>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              {/* Measurements */}
              <div>
                <p className="font-bold text-slate-900 uppercase mb-1">Measurements (Inches):</p>
                {Object.keys(selectedJobTicket.measurements || {}).length > 0 ? (
                  <div className="grid grid-cols-2 gap-1 text-[10px] bg-white p-2 rounded border border-slate-200">
                    {Object.entries(selectedJobTicket.measurements).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500">{k}:</span>
                        <span className="font-bold">{v}"</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">No specific inches entered</p>
                )}
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              {/* Alterations */}
              <div>
                <p className="font-bold text-slate-900 uppercase mb-1">Alteration Types:</p>
                <div className="flex flex-wrap gap-1">
                  {(selectedJobTicket.alterationDetails || ['Custom Fit']).map((d, i) => (
                    <span key={i} className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      ✓ {d}
                    </span>
                  ))}
                </div>
                {selectedJobTicket.customAlterationText && (
                  <p className="text-[10px] text-slate-600 mt-1">Note: {selectedJobTicket.customAlterationText}</p>
                )}
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              {/* Delivery Details */}
              <div className="space-y-1 bg-rose-50 p-2.5 rounded border border-rose-200 text-rose-900">
                <div className="flex justify-between font-bold">
                  <span>Delivery Date:</span>
                  <span>{selectedJobTicket.deliveryDate || 'Scheduled'} {selectedJobTicket.deliveryTime || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Trial:</span>
                  <span>{selectedJobTicket.trialDate || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Job Priority:</span>
                  <span className="uppercase font-extrabold">{selectedJobTicket.priority || 'Normal'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Workflow Status:</span>
                  <span className="uppercase font-extrabold">{selectedJobTicket.status || 'Pending'}</span>
                </div>
              </div>

              {selectedJobTicket.specialInstructions && (
                <div>
                  <p className="font-bold text-slate-900 uppercase">Special Instructions:</p>
                  <p className="text-[10px] italic text-slate-600">"{selectedJobTicket.specialInstructions}"</p>
                </div>
              )}

              <div className="border-t border-dashed border-slate-300 my-2" />
              <div className="text-center text-[9px] text-slate-400">
                Powered by Vastra ERP Tailoring Module
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedJobTicket(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close (Esc)
              </button>
              <button
                onClick={() => handlePrintJobTicketHTML(selectedJobTicket)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Job Ticket</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── NEW CREATE ALTERATION MODAL WIZARD ─── */}
      {showCreateAltModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-up my-auto text-slate-800 flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-rose-600 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-wide">
                  New Alteration Request
                </h3>
              </div>
              <button
                onClick={() => setShowCreateAltModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Select Invoice */}
            {!selectedAltInvoice && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Search Target Invoice</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Invoice Number, Customer Name or Phone..."
                      value={altInvoiceSearch}
                      onChange={(e) => setAltInvoiceSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearchAltInvoices(); }}
                      className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                    <button
                      onClick={handleSearchAltInvoices}
                      disabled={searchingAltInvoices}
                      className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {searchingAltInvoices ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                  {altInvoices.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No invoices searched yet or no results found.
                    </div>
                  ) : (
                    altInvoices.map((inv) => (
                      <div
                        key={inv._id}
                        onClick={() => {
                          setSelectedAltInvoice(inv);
                          setSelectedAltItem(null);
                        }}
                        className="p-3.5 hover:bg-rose-50/50 cursor-pointer transition-colors flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-extrabold text-slate-800">{inv.invoiceNo}</p>
                          <p className="text-slate-500">{inv.customerName} · {inv.customerPhone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-800">₹{(inv.grandTotal || 0).toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Select Item from Invoice */}
            {selectedAltInvoice && !selectedAltItem && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-xs">
                  <div>
                    <p className="font-extrabold text-slate-800">Selected Invoice: {selectedAltInvoice.invoiceNo}</p>
                    <p className="text-slate-500">{selectedAltInvoice.customerName} · {selectedAltInvoice.customerPhone}</p>
                  </div>
                  <button
                    onClick={() => setSelectedAltInvoice(null)}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Change Invoice
                  </button>
                </div>

                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Garment to Alter</h4>
                <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto">
                  {selectedAltInvoice.items && selectedAltInvoice.items.length > 0 ? (
                    selectedAltInvoice.items.map((item, idx) => (
                      <div
                        key={item._id || idx}
                        onClick={() => {
                          setSelectedAltItem(item);
                          // Populate default measurements if possible
                          setAltMeasurements({
                            Chest: "",
                            Waist: "",
                            Shoulder: "",
                            Sleeve: "",
                            Length: ""
                          });
                        }}
                        className="p-3 border border-slate-200 hover:border-rose-300 hover:bg-rose-50/20 rounded-xl cursor-pointer transition-all flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-400">SKU: {item.sku || '-'} · Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                            {item.size || 'N/A'} / {item.color || 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400">No items found in this invoice.</div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Complete Alteration details */}
            {selectedAltInvoice && selectedAltItem && (
              <form onSubmit={handleSaveAlterationTicket} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* Selected Info Summary Header */}
                <div className="flex justify-between items-start bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <p className="font-extrabold text-slate-800">{selectedAltItem.name}</p>
                    <p className="text-[10px] text-slate-500">
                      Invoice: {selectedAltInvoice.invoiceNo} · Customer: {selectedAltInvoice.customerName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAltItem(null)}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Change Item
                  </button>
                </div>

                {/* Alteration Details Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Alteration Details (Select all that apply)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      "Sleeve Shortening",
                      "Sleeve Lengthening",
                      "Waist Fitting",
                      "Shoulder Fitting",
                      "Bottom Hemming",
                      "Length Shortening",
                      "Chest Fitting",
                      "Neck Alteration"
                    ].map((detail) => (
                      <label
                        key={detail}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${altDetails.includes(detail) ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={altDetails.includes(detail)}
                          onChange={() => {
                            if (altDetails.includes(detail)) {
                              setAltDetails(altDetails.filter(d => d !== detail));
                            } else {
                              setAltDetails([...altDetails, detail]);
                            }
                          }}
                          className="sr-only"
                        />
                        {detail}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Note */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Custom Alteration Note / Instructions</label>
                  <textarea
                    placeholder="Enter any custom measurements, specifications or instructions..."
                    value={altCustomText}
                    onChange={(e) => setAltCustomText(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-xs"
                    rows="2"
                  />
                </div>

                {/* Grid for Tailor, Priority, Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Assign Master Tailor</label>
                    <select
                      value={altTailorName}
                      onChange={(e) => setAltTailorName(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 outline-none text-xs font-semibold"
                    >
                      <option value="">Select Master Tailor</option>
                      {tailorOptions.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Ticket Priority</label>
                    <select
                      value={altPriority}
                      onChange={(e) => setAltPriority(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 outline-none text-xs font-semibold"
                    >
                      <option value="Normal">Normal (3 Days)</option>
                      <option value="Urgent">Urgent (24 Hours)</option>
                      <option value="Express">Express (Same Day)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Expected Trial Date</label>
                    <input
                      type="date"
                      value={altTrialDate}
                      onChange={(e) => setAltTrialDate(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 outline-none text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Expected Delivery Date</label>
                    <input
                      type="date"
                      value={altDeliveryDate}
                      onChange={(e) => setAltDeliveryDate(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 outline-none text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Measurements Inputs */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Alteration Measurements (Inches)</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {["Chest", "Waist", "Shoulder", "Sleeve", "Length", "Neck", "Hip", "Thigh", "Bottom"].map((m) => (
                      <div key={m} className="space-y-0.5">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase">{m}</label>
                        <input
                          type="text"
                          placeholder='-'
                          value={altMeasurements[m] || ""}
                          onChange={(e) => setAltMeasurements({ ...altMeasurements, [m]: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg p-2 text-center text-xs font-bold focus:ring-1 focus:ring-rose-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 border-t border-slate-100 pt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateAltModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Alteration Ticket</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

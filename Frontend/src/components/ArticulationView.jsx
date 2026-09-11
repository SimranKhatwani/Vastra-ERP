import api from '../api/axios';
import { generateCode128SvgString } from "../helpers/barcode128.helper";
import { generateReceiptHTMLContent as generateInvoiceReceiptHTML } from '../helpers/printTemplate.helper';
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
  Shirt,
  MoreHorizontal,
  Copy,
  PackageCheck,
  Truck,
  Zap,
  ShieldCheck,
  History,
  Edit3,
  Loader2,
  Barcode
} from "lucide-react";
import { GarmentMeasurementSection } from "./GarmentMeasurementSection";
import { MeasurementHistoryModal } from "./MeasurementHistoryModal";
import {
  GENTS_GARMENTS_CONFIG,
  LADIES_GARMENTS_CONFIG,
  OPTIONAL_MEASUREMENT_FIELDS,
  detectGarmentType,
  getGarmentMeasurementFields
} from "../helpers/measurementConfig";

const normalizeJobStatus = (s) => {
  if (!s) return 'Pending';
  const str = String(s).toUpperCase().replace(/[-\s]/g, '_');
  if (['IN_CUTTING', 'CUTTING'].includes(str)) return 'In Cutting';
  if (['IN_STITCHING', 'STITCHING', 'IN_PROGRESS', 'ASSIGNED'].includes(str)) return 'In Stitching';
  if (['IN_TRIAL', 'TRIAL', 'READY_FOR_TRIAL'].includes(str)) return 'In Trial';
  if (['RE_ALTERATION', 'REALTERATION', 'REWORK'].includes(str)) return 'Re-Alteration';
  if (['QUALITY_CHECK', 'QC', 'QA'].includes(str)) return 'Quality Check';
  if (['READY', 'READY_FOR_DELIVERY', 'READY_FOR_COLLECTION', 'COMPLETED'].includes(str)) return 'Ready';
  if (['COLLECTED', 'DELIVERED', 'CLOSED'].includes(str)) return 'Delivered';
  if (['CANCELLED'].includes(str)) return 'Cancelled';
  return s;
};

export const TAILORING_REPORT_TYPES = [
  {
    id: "daily_tailoring_jobs",
    label: "Daily Tailoring Jobs",
    icon: Calendar,
    description: "Daily scheduled, active & incoming tailoring jobs"
  },
  {
    id: "pending_tailoring_jobs",
    label: "Pending Jobs",
    icon: Clock,
    description: "Garments currently in cutting, stitching or awaiting trial"
  },
  {
    id: "overdue_tailoring_jobs",
    label: "Overdue Jobs",
    icon: AlertTriangle,
    description: "Garments that have passed promised customer delivery date"
  },
  {
    id: "ready_not_collected",
    label: "Ready but Not Collected",
    icon: PackageCheck,
    description: "Completed alterations staged in showroom awaiting customer pickup"
  },
  {
    id: "tailor_workload",
    label: "Tailor-wise Workload",
    icon: Scissors,
    description: "Active assigned jobs, backlog queue & capacity per master tailor"
  },
  {
    id: "tailor_completed_jobs",
    label: "Tailor-wise Completed Jobs",
    icon: Award,
    description: "Total delivered garments and throughput efficiency per tailor"
  },
  {
    id: "realteration",
    label: "Re-Alteration Report",
    icon: RefreshCw,
    description: "Refitting, rework and re-alteration tickets for quality assurance"
  },
  {
    id: "tailoring_charges",
    label: "Tailoring Charges Report",
    icon: DollarSign,
    description: "Financial ledger of alteration fees, advance payments & balance dues"
  },
  {
    id: "customer_tailoring_history",
    label: "Customer Tailoring History",
    icon: Users,
    description: "Customer-wise alteration frequency, volume and lifetime spend"
  }
];

const formatReportDate = (d) => {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(d);
  }
};

const formatReportDateTime = (d) => {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return String(d);
  }
};

export const ArticulationView = ({
  customers = [],
  employees = [],
  products = [],
  invoices = [],
  onAddCustomToCart,
  onAddNotification,
  initialTab = "dashboard",
  initialFilterStatus = "All",
  autoStartAlteration = false,
  clearAutoStartAlteration = () => { }
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
    const isTailorRole = (e) => {
      const des = (e.designation || "").toLowerCase();
      const rol = (e.role || "").toLowerCase();
      return des.includes("tailor") || rol.includes("tailor") || des.includes("karigar") || rol.includes("karigar") || des.includes("darzi") || rol.includes("darzi") || des.includes("stitcher") || rol.includes("stitcher");
    };
    const dbTailors = (employees || []).filter(isTailorRole);
    const sourceList = dbTailors.length > 0 ? dbTailors : (employees || []);
    if (sourceList.length > 0) {
      return sourceList.map((t, idx) => ({
        id: t._id || t.id || `t-${idx}`,
        name: t.name,
        jobs: t.currentWorkload || 0,
        availability: (t.currentWorkload || 0) > 6 ? "Unavailable" : (t.currentWorkload || 0) > 3 ? "Busy" : "Available"
      }));
    }
    return [
      { id: "t-default", name: "In-House Master Tailor", jobs: 0, availability: "Available" }
    ];
  }, [employees]);

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
  const [alterationRecords, setAlterationRecords] = useState([]);
  const [alterationsLoading, setAlterationsLoading] = useState(false);
  const [alterationsLoadError, setAlterationsLoadError] = useState("");

  const alterationRecordsWithSequence = useMemo(() => {
    if (!alterationRecords || !Array.isArray(alterationRecords)) return [];

    // 1. Group records by saleBillId or invoiceNumber
    const groups = {};
    alterationRecords.forEach(record => {
      if (!record) return;
      const billId = record.saleBillId || record.invoiceId || record.invoiceNumber || 'unknown';
      if (!groups[billId]) groups[billId] = [];
      groups[billId].push(record);
    });

    // 2. Sort items within each group by createdAt ascending to determine their sequence (1st created is 1st item)
    for (const key in groups) {
      groups[key].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    }

    // 3. Assign the sequence to each record
    return alterationRecords.map(record => {
      if (!record) return record;
      const billId = record.saleBillId || record.invoiceId || record.invoiceNumber || 'unknown';
      if (billId === 'unknown') {
        return { ...record, alterationSequence: '1/1' };
      }
      const group = groups[billId];
      const index = group.findIndex(r => r._id === record._id);
      return {
        ...record,
        alterationSequence: `${index + 1}/${group.length}`
      };
    });
  }, [alterationRecords]);
  const [pendingAlterations, setPendingAlterations] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [alterationsFilterStatus, setAlterationsFilterStatus] = useState(initialFilterStatus || "All");
  const [alterationSearchQuery, setAlterationSearchQuery] = useState("");
  const [alterationsFilterType, setAlterationsFilterType] = useState("All");
  const [altGenderFilter, setAltGenderFilter] = useState("All"); // "All" | "Gents" | "Ladies"
  const [altSourceFilter, setAltSourceFilter] = useState("All"); // "All" | "SHOWROOM_PURCHASE" | "CUSTOMER_OWN_GARMENT"
  const [altSummaryDate, setAltSummaryDate] = useState("Today");
  const [altTypeSummary, setAltTypeSummary] = useState(null);
  const [selectedJobTicket, setSelectedJobTicket] = useState(null);
  const [whatsappModalTarget, setWhatsappModalTarget] = useState(null);
  const alterationFetchSequence = useRef(0);
  const latestAppliedAlterationSequence = useRef(0);
  const isFetchingAlterations = useRef(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappMessageType, setWhatsappMessageType] = useState("ready_collection");
  const [previewBillInvoice, setPreviewBillInvoice] = useState(null);
  const [loadingBillPreview, setLoadingBillPreview] = useState(false);
  const [auditModalData, setAuditModalData] = useState(null);
  const [loadingAuditModal, setLoadingAuditModal] = useState(false);

  // Delivery & Tailor Dashboard state
  const [deliveryDashboard, setDeliveryDashboard] = useState(null);
  const [tailorSummaries, setTailorSummaries] = useState([]);
  const [allTailorsSummary, setAllTailorsSummary] = useState(null);
  const [capacityAlerts, setCapacityAlerts] = useState([]);
  const [selectedTailorFilter, setSelectedTailorFilter] = useState("All Tailors");
  const [serviceWisePending, setServiceWisePending] = useState(null);

  const activeTailorStats = useMemo(() => {
    if (selectedTailorFilter === "All Tailors") {
      return (
        allTailorsSummary || {
          tailorName: "All Master Tailors",
          assignedItems: 0,
          inProgress: 0,
          ready: 0,
          delivered: 0,
          overdue: 0,
          averageCompletionTime: "3.5 hrs",
          capacityUtilization: 0,
          todayNewWork: 0,
          isOverloaded: false
        }
      );
    }
    const found = (tailorSummaries || []).find(t => t.tailorName === selectedTailorFilter);
    return (
      found || {
        tailorName: selectedTailorFilter,
        assignedItems: 0,
        inProgress: 0,
        ready: 0,
        delivered: 0,
        overdue: 0,
        averageCompletionTime: "3.5 hrs",
        capacityUtilization: 0,
        todayNewWork: 0,
        isOverloaded: false
      }
    );
  }, [selectedTailorFilter, tailorSummaries, allTailorsSummary]);

  const [dashboardSummaryData, setDashboardSummaryData] = useState(null);

  // ─── 11 TAILORING DASHBOARD SUMMARY METRICS ───
  const tailoringSummaryMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    let todaysJobs = 0;
    let dueToday = 0;
    let overdue = 0;
    let pending = 0;
    let inCutting = 0;
    let inStitching = 0;
    let inTrial = 0;
    let reAlteration = 0;
    let qualityCheck = 0;
    let ready = 0;
    let delivered = 0;

    (alterationRecords || []).forEach(alt => {
      const createdDateStr = alt.createdAt ? new Date(alt.createdAt).toISOString().split('T')[0] : '';
      const delDateStr = alt.deliveryDate || (alt.expectedDeliveryDate ? new Date(alt.expectedDeliveryDate).toISOString().split('T')[0] : '');
      const st = (alt.status || 'Pending').toLowerCase().trim();

      // Today's Jobs
      if (createdDateStr === todayStr) {
        todaysJobs++;
      }

      // Delivered
      const isDelivered = st === 'delivered' || st === 'collected' || st === 'closed';
      if (isDelivered) {
        delivered++;
      }

      // Ready
      const isReady = st === 'ready' || st === 'ready for delivery' || st === 'ready for pickup';
      if (isReady) {
        ready++;
      }

      // Due Today
      if (!isDelivered && delDateStr === todayStr) {
        dueToday++;
      }

      // Overdue
      if (!isDelivered && !isReady && delDateStr && delDateStr < todayStr) {
        overdue++;
      }

      // Specific workflow stages
      if (st === 'pending' || st === 'received' || st === 'pending assignment') {
        pending++;
      } else if (st === 'in cutting' || st === 'cutting') {
        inCutting++;
      } else if (st === 'in stitching' || st === 'stitching' || st === 'in progress' || st === 'assigned') {
        inStitching++;
      } else if (st === 'in trial' || st === 'trial' || st === 'ready for trial') {
        inTrial++;
      } else if (st === 're-alteration' || st === 'realteration' || st === 'rework') {
        reAlteration++;
      } else if (st === 'quality check' || st === 'qc' || st === 'qa') {
        qualityCheck++;
      }
    });

    return {
      total: alterationRecords?.length || 0,
      todaysJobs: dashboardSummaryData?.todaysJobs ?? todaysJobs,
      dueToday: dashboardSummaryData?.dueToday ?? dueToday,
      overdue: dashboardSummaryData?.overdue ?? overdue,
      pending: dashboardSummaryData?.pending ?? pending,
      inCutting: dashboardSummaryData?.inCutting ?? inCutting,
      inStitching: dashboardSummaryData?.inStitching ?? inStitching,
      inTrial: dashboardSummaryData?.inTrial ?? inTrial,
      reAlteration: dashboardSummaryData?.reAlteration ?? reAlteration,
      qualityCheck: dashboardSummaryData?.qualityCheck ?? qualityCheck,
      ready: dashboardSummaryData?.ready ?? ready,
      delivered: dashboardSummaryData?.delivered ?? delivered
    };
  }, [alterationRecords, dashboardSummaryData]);

  // --- NEW ALTERATION WIZARD STATE ---
  const COG_ITEM_DEFAULT = () => ({
    garmentName: "",
    fabricColor: "",
    size: "M",
    gender: "Gents",
    garmentType: "Shirt",
    serviceType: "Custom Tailoring",
    charge: 0,
    alterationDetails: [],
    customText: "",
    measurements: {}
  });

  const [showCreateAltModal, setShowCreateAltModal] = useState(false);
  const [altCreationMode, setAltCreationMode] = useState("SHOWROOM_PURCHASE"); // "SHOWROOM_PURCHASE" | "CUSTOMER_OWN_GARMENT"
  const [cogCustomerName, setCogCustomerName] = useState("");
  const [cogCustomerPhone, setCogCustomerPhone] = useState("");
  // Multi-item support for Customer Own Garment mode
  const [cogItems, setCogItems] = useState([COG_ITEM_DEFAULT()]);
  const [cogGender, setCogGender] = useState("Gents"); // kept for backward compat
  const [cogServiceType, setCogServiceType] = useState("Custom Tailoring"); // kept for backward compat
  const [altInvoiceSearch, setAltInvoiceSearch] = useState("");
  const [altInvoices, setAltInvoices] = useState([]);
  const [searchingAltInvoices, setSearchingAltInvoices] = useState(false);
  const [selectedAltInvoice, setSelectedAltInvoice] = useState(null);
  const [selectedAltItem, setSelectedAltItem] = useState(null);
  const [altTailorName, setAltTailorName] = useState("");
  const [altPriority, setAltPriority] = useState("Normal");
  const [altDeliveryDate, setAltDeliveryDate] = useState("");
  const [altTrialRequired, setAltTrialRequired] = useState(false);
  const [altTrialDate, setAltTrialDate] = useState("");
  const [altDetails, setAltDetails] = useState([]);
  const [altCustomText, setAltCustomText] = useState("");
  const [altMeasurements, setAltMeasurements] = useState({});
  const [altCharges, setAltCharges] = useState(0);
  const [cogGarmentType, setCogGarmentType] = useState("Shirt");
  const [cogSaveAsMaster, setCogSaveAsMaster] = useState(false);
  const [showroomGarmentType, setShowroomGarmentType] = useState("Shirt");
  const [showroomSaveAsMaster, setShowroomSaveAsMaster] = useState(false);

  // --- MEASUREMENT MODAL STATE FOR EXISTING TICKETS ---
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [editingMeasurementAlt, setEditingMeasurementAlt] = useState(null);
  const [startWorkAfterMeasurement, setStartWorkAfterMeasurement] = useState(false);
  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [modalMeasurementGender, setModalMeasurementGender] = useState("Gents");
  const [modalMeasurementGarment, setModalMeasurementGarment] = useState("Shirt");
  const [modalSaveAsMaster, setModalSaveAsMaster] = useState(false);
  const [measurementForm, setMeasurementForm] = useState({});

  // --- GLOBAL MEASUREMENT HISTORY MODAL STATE ---
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalCustomer, setHistoryModalCustomer] = useState({ phone: "", id: "", name: "" });

  const handleOpenCustomerHistory = (phone, id, name) => {
    setHistoryModalCustomer({
      phone: phone || "",
      id: id || "",
      name: name || "Customer"
    });
    setHistoryModalOpen(true);
  };

  const handleOpenMeasurementModal = (alt, andStartWork = false) => {
    if (!alt) return;
    setEditingMeasurementAlt(alt);
    setStartWorkAfterMeasurement(andStartWork);

    const isLady = alt.gender === "Ladies" || /(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(alt.productName || alt.pieceName || "");
    const gGender = isLady ? "Ladies" : "Gents";
    setModalMeasurementGender(gGender);

    const detectedGarment = detectGarmentType(alt.productName || alt.pieceName || "", gGender);
    setModalMeasurementGarment(detectedGarment);

    const existing = alt.measurements || {};
    setMeasurementForm({ ...existing });
    setModalSaveAsMaster(false); // Current job measurement must never automatically overwrite customer master!
    setShowMeasurementModal(true);
  };

  const handleSaveMeasurements = async (e) => {
    e.preventDefault();
    if (!editingMeasurementAlt) return;

    const cleaned = {};
    Object.entries(measurementForm).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        cleaned[k] = String(v).trim();
      }
    });

    if (Object.keys(cleaned).length === 0) {
      if (onAddNotification) onAddNotification("Warning", "Please enter at least one measurement parameter.", "warning");
      return;
    }

    setSavingMeasurements(true);
    try {
      const nextStatus = startWorkAfterMeasurement ? "In Progress" : (editingMeasurementAlt.status || "Pending");
      const res = await api.patch(`/alterations/${editingMeasurementAlt._id}/measurements`, {
        measurements: cleaned,
        status: nextStatus,
        saveAsMaster: modalSaveAsMaster,
        garmentType: modalMeasurementGarment
      });

      if (res.data?.success) {
        if (onAddNotification) {
          onAddNotification(
            "Measurements Saved",
            startWorkAfterMeasurement
              ? "Measurements recorded and work moved to In Progress!"
              : modalSaveAsMaster
                ? "Measurements saved with job & master profile updated!"
                : "Measurements saved securely with tailoring job.",
            "success"
          );
        }
        setShowMeasurementModal(false);
        setEditingMeasurementAlt(null);
        fetchAlterations();
        fetchPendingAlterations();
        fetchAlterationDashboard();
      } else {
        if (onAddNotification) onAddNotification("Error", res.data?.message || "Failed to save measurements", "danger");
      }
    } catch (err) {
      console.error("Failed to save measurements:", err);
      if (onAddNotification) onAddNotification("Error", err.response?.data?.message || "Failed to save measurements", "danger");
    } finally {
      setSavingMeasurements(false);
    }
  };

  // --- PSSM COLLECTION & SCANNER STATE ---
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionBarcodeQuery, setCollectionBarcodeQuery] = useState("");
  const [collectionData, setCollectionData] = useState(null);
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [selectedCollectionItemIds, setSelectedCollectionItemIds] = useState([]);

  const tailorOptions = useMemo(() => {
    if (employees && employees.length > 0) {
      const dbTailors = employees.filter(e => (e.designation || e.role || "").toLowerCase() === "tailor" || (e.role || "").toLowerCase() === "tailor");
      if (dbTailors.length > 0) return dbTailors.map(t => t.name);
    }
    return defaultTailors.map(t => t.name);
  }, [employees, defaultTailors]);

  // --- TAILOR EDIT MODAL STATE FOR EXISTING TICKETS ---
  const [editingTailorAlt, setEditingTailorAlt] = useState(null);
  const [selectedNewTailor, setSelectedNewTailor] = useState("");
  const [tailorChangeReason, setTailorChangeReason] = useState("");
  const [savingTailorChange, setSavingTailorChange] = useState(false);

  const handleOpenTailorModal = (alt) => {
    if (!alt) return;
    setEditingTailorAlt(alt);
    setSelectedNewTailor(alt.tailorName || (tailorOptions && tailorOptions.length > 0 ? tailorOptions[0] : ""));
    setTailorChangeReason("");
  };

  const handleSaveTailorChange = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingTailorAlt) return;
    if (!selectedNewTailor) {
      if (onAddNotification) onAddNotification("Warning", "Please select or enter a master tailor.", "warning");
      return;
    }

    setSavingTailorChange(true);
    try {
      if (editingTailorAlt.pssmItemId) {
        try {
          await api.patch(`/pssm/items/${editingTailorAlt.pssmItemId}/assign`, {
            tailorName: selectedNewTailor,
            reason: tailorChangeReason || `Tailor reassigned to ${selectedNewTailor}`
          });
        } catch (pErr) {
          console.warn("PSSM item assign sync note:", pErr);
        }
      }

      const res = await api.patch(`/alterations/${editingTailorAlt._id}/status`, {
        tailorName: selectedNewTailor,
        reason: tailorChangeReason || `Tailor reassigned to ${selectedNewTailor}`
      });

      if (res.data?.success) {
        if (onAddNotification) {
          onAddNotification(
            "Tailor Assigned",
            `Assigned to ${selectedNewTailor} (Audit trail logged).`,
            "success"
          );
        }
        setEditingTailorAlt(null);
        fetchAlterations();
        fetchPendingAlterations();
        fetchAlterationDashboard();
      } else {
        if (onAddNotification) onAddNotification("Error", res.data?.message || "Failed to update tailor", "danger");
      }
    } catch (err) {
      console.error("Failed to update tailor:", err);
      if (onAddNotification) onAddNotification("Error", err.response?.data?.message || "Failed to update tailor", "danger");
    } finally {
      setSavingTailorChange(false);
    }
  };

  // --- DELIVERY DATE & PRIORITY EDIT MODAL STATE FOR EXISTING TICKETS ---
  const [editingDeliveryAlt, setEditingDeliveryAlt] = useState(null);
  const [selectedNewDeliveryDate, setSelectedNewDeliveryDate] = useState("");
  const [selectedNewTrialRequired, setSelectedNewTrialRequired] = useState(false);
  const [selectedNewTrialDate, setSelectedNewTrialDate] = useState("");
  const [selectedNewPriority, setSelectedNewPriority] = useState("Normal");
  const [deliveryChangeReason, setDeliveryChangeReason] = useState("");
  const [savingDeliveryChange, setSavingDeliveryChange] = useState(false);

  // --- TRIAL ASSESSMENT MODAL STATE FOR IN TRIAL STAGE ---
  const [trialModalTicket, setTrialModalTicket] = useState(null);
  const [trialFittingResult, setTrialFittingResult] = useState("");
  const [trialRequiredChanges, setTrialRequiredChanges] = useState("");
  const [trialReAlteration, setTrialReAlteration] = useState(false);
  const [trialMeasurements, setTrialMeasurements] = useState({});
  const [trialRemarks, setTrialRemarks] = useState("");
  const [savingTrialAssessment, setSavingTrialAssessment] = useState(false);

  const handleOpenTrialModal = (ticket) => {
    if (!ticket) return;
    const freshTicket = (alterationRecords || []).find(a => a._id === ticket._id) || ticket;
    setTrialModalTicket(freshTicket);
    setTrialFittingResult(freshTicket.fittingResult || "");
    setTrialRequiredChanges(freshTicket.requiredChanges || "");
    setTrialReAlteration(freshTicket.reAlterationRequired !== undefined ? Boolean(freshTicket.reAlterationRequired) : normalizeJobStatus(freshTicket.status) === 'Re-Alteration');
    const existingMeas = (freshTicket.measurements && typeof freshTicket.measurements === 'object' && Object.keys(freshTicket.measurements).length > 0)
      ? { ...freshTicket.measurements }
      : (freshTicket.items?.[0]?.measurements && typeof freshTicket.items[0].measurements === 'object')
        ? { ...freshTicket.items[0].measurements }
        : {};
    setTrialMeasurements(existingMeas);
    setTrialRemarks(freshTicket.remarks || freshTicket.specialInstructions || freshTicket.customAlterationText || "");
  };

  const handleSaveTrialAssessment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!trialModalTicket) return;
    if (!trialFittingResult.trim()) {
      if (onAddNotification) onAddNotification("Fitting Result Required", "Please enter the fitting result details.", "warning");
      return;
    }

    const nextStatus = trialReAlteration ? "Re-Alteration" : "Quality Check";
    const targetId = trialModalTicket._id;

    // Optimistically update the UI immediately
    setAlterationRecords(prev => prev.map(rec => {
      if (rec._id === targetId) {
        return {
          ...rec,
          status: nextStatus,
          measurements: { ...trialMeasurements },
          fittingResult: trialFittingResult.trim(),
          requiredChanges: trialRequiredChanges.trim(),
          remarks: trialRemarks.trim(),
          specialInstructions: trialRemarks.trim() || rec.specialInstructions,
          customAlterationText: trialRemarks.trim() || rec.customAlterationText,
          reAlterationRequired: trialReAlteration
        };
      }
      return rec;
    }));

    setSavingTrialAssessment(true);
    try {
      const res = await api.patch(`/alterations/${targetId}/status`, {
        status: nextStatus,
        measurements: trialMeasurements,
        fittingResult: trialFittingResult.trim(),
        requiredChanges: trialRequiredChanges.trim(),
        reAlterationRequired: trialReAlteration,
        remarks: trialRemarks.trim(),
        specialInstructions: trialRemarks.trim(),
        customAlterationText: trialRemarks.trim(),
        reason: `Trial assessment recorded. Fitting: "${trialFittingResult.trim()}". Changes: "${trialRequiredChanges.trim()}". Re-alteration: ${trialReAlteration ? 'Yes' : 'No'}. Stage advanced to ${nextStatus}.`
      });

      if (res.data?.success) {
        if (onAddNotification) {
          onAddNotification(
            "Trial Assessment Recorded",
            `Fitting recorded. Ticket advanced to ${nextStatus}.`,
            "success"
          );
        }
        setTrialModalTicket(null);
        await Promise.allSettled([
          fetchAlterations(),
          fetchPendingAlterations(),
          fetchAlterationDashboard()
        ]);
      } else {
        if (onAddNotification) onAddNotification("Error", res.data?.message || "Failed to save trial assessment", "danger");
      }
    } catch (err) {
      console.error("Failed to save trial assessment:", err);
      if (onAddNotification) onAddNotification("Error", err.response?.data?.message || "Failed to save trial assessment", "danger");
    } finally {
      setSavingTrialAssessment(false);
    }
  };

  const handleOpenDeliveryDateModal = (alt) => {
    if (!alt) return;
    setEditingDeliveryAlt(alt);
    let curDate = alt.deliveryDate || "";
    if (!curDate && alt.expectedDeliveryDate) {
      curDate = new Date(alt.expectedDeliveryDate).toISOString().split('T')[0];
    }
    if (!curDate) {
      curDate = new Date().toISOString().split('T')[0];
    }
    setSelectedNewDeliveryDate(curDate);
    setSelectedNewTrialRequired(alt.trialRequired !== false && Boolean(alt.trialDate || alt.trialRequired));
    setSelectedNewTrialDate(alt.trialDate || "");
    setSelectedNewPriority(alt.priority || "Normal");
    setDeliveryChangeReason("");
  };

  const handleSaveDeliveryDateChange = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingDeliveryAlt) return;
    if (!selectedNewDeliveryDate) {
      if (onAddNotification) onAddNotification("Warning", "Please choose a delivery date.", "warning");
      return;
    }

    setSavingDeliveryChange(true);
    try {
      const res = await api.patch(`/alterations/${editingDeliveryAlt._id}/status`, {
        deliveryDate: selectedNewDeliveryDate,
        expectedDeliveryDate: selectedNewDeliveryDate,
        trialRequired: selectedNewTrialRequired,
        trialDate: selectedNewTrialRequired ? selectedNewTrialDate : "",
        priority: selectedNewPriority,
        reason: deliveryChangeReason || `Delivery & trial date updated`
      });

      if (res.data?.success) {
        if (onAddNotification) {
          onAddNotification(
            "Delivery Date Updated",
            `Delivery date set to ${selectedNewDeliveryDate} (${selectedNewPriority})${selectedNewTrialRequired && selectedNewTrialDate ? ` | Trial: ${selectedNewTrialDate}` : ''} (Audit trail logged).`,
            "success"
          );
        }
        setEditingDeliveryAlt(null);
        fetchAlterations();
        fetchPendingAlterations();
        fetchAlterationDashboard();
      } else {
        if (onAddNotification) onAddNotification("Error", res.data?.message || "Failed to update delivery date", "danger");
      }
    } catch (err) {
      console.error("Failed to update delivery date:", err);
      if (onAddNotification) onAddNotification("Error", err.response?.data?.message || "Failed to update delivery date", "danger");
    } finally {
      setSavingDeliveryChange(false);
    }
  };

  // Clickable Invoice Preview Handler
  const handleOpenInvoicePreview = async (invoiceNumber, saleBillId = null) => {
    if (!invoiceNumber && !saleBillId) return;

    // 1. Try finding in loaded invoices
    const found = (invoices || []).find(inv =>
      (inv.invoiceNo && (inv.invoiceNo === invoiceNumber || inv.invoiceNo.toLowerCase() === String(invoiceNumber).toLowerCase())) ||
      (inv.billNo && (inv.billNo === invoiceNumber || inv.billNo.toLowerCase() === String(invoiceNumber).toLowerCase())) ||
      (inv.id && inv.id === saleBillId) ||
      (inv._id && inv._id === saleBillId)
    );

    if (found) {
      setPreviewBillInvoice(found);
      return;
    }

    // 2. Fetch from backend API
    setLoadingBillPreview(true);
    try {
      const searchKey = invoiceNumber || saleBillId;
      const res = await api.get(`/billing?search=${encodeURIComponent(searchKey)}`);
      const data = res.data;
      const bills = Array.isArray(data.data) ? data.data : (data.data?.bills || []);
      if (bills.length > 0) {
        const match = bills.find(b => b.billNo === invoiceNumber || b.invoiceNo === invoiceNumber || b._id === saleBillId) || bills[0];
        setPreviewBillInvoice(match);
      } else {
        if (onAddNotification) onAddNotification("Info", `Invoice ${invoiceNumber} details not found.`, "info");
      }
    } catch (err) {
      console.error("Failed to fetch bill invoice preview:", err);
      if (onAddNotification) onAddNotification("Error", "Could not load invoice details.", "danger");
    } finally {
      setLoadingBillPreview(false);
    }
  };

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


  const handlePrintPreviewBill = (inv) => {
    if (!inv) return;
    const html = generateInvoiceReceiptHTML(inv);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  };

  const handleDownloadPreviewBill = (inv) => {
    if (!inv) return;
    const html = generateInvoiceReceiptHTML(inv);
    const blob = new Blob(["\ufeff" + html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_${inv.invoiceNo || inv.billNo || 'Receipt'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleWhatsAppPreviewBill = (inv) => {
    if (!inv) return;
    const custName = inv.customerName || inv.customerId?.name || "Customer";
    const rawPhone = (inv.customerPhone || inv.customerId?.phone || "").replace(/\D/g, "");
    const invNo = inv.invoiceNo || inv.billNo || "INV";
    const total = (Number(inv.grandTotal || 0)).toLocaleString('en-IN');
    const msg = `*VASTRA ERP SHOWROOM*\nInvoice Confirmation\n-------------------------\n*Invoice:* ${invNo}\n*Customer:* ${custName}\n*Grand Total:* ₹${total}\n\nThank you for shopping with us!`;
    const encoded = encodeURIComponent(msg);
    const url = rawPhone && rawPhone.length >= 10
      ? `https://api.whatsapp.com/send?phone=${rawPhone.length === 10 ? '91' + rawPhone : rawPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Pre-load and open Alteration Details popup for a pending billed garment
  const handleConfigurePendingGarment = (pendingItem) => {
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 3);
    const trial = new Date();
    trial.setDate(trial.getDate() + 2);

    setSelectedAltInvoice({
      _id: pendingItem.saleBillId,
      invoiceNo: pendingItem.invoiceNo,
      customerName: pendingItem.customerName,
      customerPhone: pendingItem.customerPhone,
      customerId: pendingItem.customerId
    });

    setSelectedAltItem({
      productId: pendingItem.productId,
      inventoryPieceId: pendingItem.inventoryPieceId,
      name: pendingItem.productName,
      productName: pendingItem.productName,
      barcode: pendingItem.barcode,
      sku: pendingItem.sku,
      size: pendingItem.size || "M",
      color: pendingItem.color || "Standard",
      serviceType: pendingItem.serviceType || "Alteration",
      tailorInvoiceNo: pendingItem.tailorInvoiceNo,
      gender: pendingItem.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(pendingItem.productName || '') ? 'Ladies' : 'Gents'),
      isPssm: pendingItem.isPssm,
      pssmItemId: pendingItem.pssmItemId
    });

    setAltTailorName(tailorOptions[0] || "");
    setAltPriority("Normal");
    setAltDeliveryDate(pendingItem.expectedDeliveryDate ? new Date(pendingItem.expectedDeliveryDate).toISOString().split('T')[0] : delivery.toISOString().split('T')[0]);
    const isTrialReq = pendingItem.trialRequired !== undefined ? Boolean(pendingItem.trialRequired) : Boolean(pendingItem.trialDate);
    setAltTrialRequired(isTrialReq);
    setAltTrialDate(pendingItem.trialDate ? new Date(pendingItem.trialDate).toISOString().split('T')[0] : trial.toISOString().split('T')[0]);
    setAltDetails([]);
    setAltCustomText("");
    setAltMeasurements({
      Chest: "",
      Waist: "",
      Shoulder: "",
      Sleeve: "",
      Length: ""
    });
    setAltCharges(0);
    setShowCreateAltModal(true);
  };

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
      setAltTrialRequired(false);

      // Reset other states
      setSelectedAltInvoice(null);
      setSelectedAltItem(null);
      setAltInvoiceSearch("");
      setAltInvoices([]);
      setAltTailorName(tailorOptions[0] || "");
      setAltPriority("Normal");
      setAltDetails([]);
      setAltCustomText("");
      setAltMeasurements({});
      setAltCharges(0);
    }
  }, [autoStartAlteration, clearAutoStartAlteration, tailorOptions]);

  const handleSearchAltInvoices = async () => {
    if (!altInvoiceSearch.trim()) return;
    setSearchingAltInvoices(true);
    try {
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

    // MODE 1: CUSTOMER OWN GARMENT / FABRIC (CUSTOM TAILORING)
    if (altCreationMode === "CUSTOMER_OWN_GARMENT") {
      if (!cogCustomerName.trim()) {
        if (onAddNotification) onAddNotification("Warning", "Please enter customer name.", "warning");
        return;
      }
      if (!/^[6-9]\d{9}$/.test(cogCustomerPhone.trim())) {
        if (onAddNotification) onAddNotification("Warning", "Please enter a valid 10-digit mobile number.", "warning");
        return;
      }
      const validItems = cogItems.filter(it => it.garmentName.trim());
      if (validItems.length === 0) {
        if (onAddNotification) onAddNotification("Warning", "Please add at least one garment with a name.", "warning");
        return;
      }

      try {
        let lastTicket = null;
        for (const item of validItems) {
          const effectiveDetails = item.alterationDetails.length > 0
            ? item.alterationDetails
            : [item.serviceType || "Custom Tailoring"];

          const payload = {
            sourceType: 'CUSTOMER_OWN_GARMENT',
            invoiceNumber: 'CUSTOMER-OWN-GARMENT',
            customerName: cogCustomerName.trim(),
            customerPhone: cogCustomerPhone.trim(),
            productName: item.garmentName.trim(),
            garmentDescription: item.garmentName.trim(),
            fabricDetails: item.fabricColor.trim(),
            color: item.fabricColor.trim() || 'Standard',
            size: item.size.trim() || 'Custom',
            tailorName: altTailorName || (tailorOptions[0] || ''),
            priority: altPriority || 'Normal',
            status: "Pending",
            deliveryDate: altDeliveryDate,
            trialRequired: altTrialRequired,
            trialDate: altTrialRequired ? altTrialDate : '',
            serviceType: item.serviceType || 'Custom Tailoring',
            gender: item.gender || 'Gents',
            alterationDetails: effectiveDetails,
            customAlterationText: item.customText || altCustomText,
            specialInstructions: item.customText || altCustomText || effectiveDetails.join(', '),
            measurements: item.measurements || {},
            saveAsMaster: cogSaveAsMaster,
            garmentType: item.garmentType || cogGarmentType,
            charge: Number(item.charge || 0),
            totalCharges: Number(item.charge || 0),
            items: [{
              sourceType: 'CUSTOMER_OWN_GARMENT',
              pieceName: item.garmentName.trim(),
              gender: item.gender || 'Gents',
              serviceType: item.serviceType || 'Custom Tailoring',
              instructions: effectiveDetails.join(', ') || item.customText || 'Custom Tailoring',
              alterationDetails: effectiveDetails,
              measurements: item.measurements || {},
              charge: Number(item.charge || 0)
            }]
          };

          const res = await api.post(`/alterations`, payload);
          const data = res.data;
          if (data.success) {
            const createdAlt = data.data?.alteration || data.data || {};
            const tailoringJobs = data.data?.tailoringJobs || [];
            const tailorInvoiceNo = tailoringJobs.length > 0 ? tailoringJobs[0].tailorInvoiceNo : createdAlt.tailorInvoiceNo || null;
            const alterationBarcode = tailorInvoiceNo || createdAlt.alterationBarcode || createdAlt.alterationNo || null;
            lastTicket = {
              _id: createdAlt._id || `alt-${Date.now()}`,
              alterationId: createdAlt.alterationNo || `ALT-${Date.now().toString(36).toUpperCase()}`,
              tailorInvoiceNo,
              alterationBarcode,
              sourceType: 'CUSTOMER_OWN_GARMENT',
              invoiceNumber: 'CUSTOMER-OWN-GARMENT',
              customerName: cogCustomerName.trim(),
              customerPhone: cogCustomerPhone.trim(),
              productName: item.garmentName.trim(),
              size: item.size.trim() || 'Custom',
              color: item.fabricColor.trim() || 'Standard',
              serviceType: item.serviceType || 'Custom Tailoring',
              gender: item.gender || 'Gents',
              tailorName: altTailorName || (tailorOptions[0] || ''),
              priority: altPriority || 'Normal',
              status: "Pending",
              deliveryDate: altDeliveryDate,
              trialRequired: altTrialRequired,
              trialDate: altTrialRequired ? altTrialDate : '',
              alterationDetails: effectiveDetails,
              customAlterationText: item.customText || altCustomText,
              specialInstructions: item.customText || altCustomText || effectiveDetails.join(', '),
              measurements: item.measurements || {},
              charge: Number(item.charge || 0),
              createdAt: new Date().toISOString()
            };
          } else {
            if (onAddNotification) onAddNotification("Error", data.message || `Failed to save garment: ${item.garmentName}`, "danger");
          }
        }

        if (lastTicket) {
          if (onAddNotification) {
            onAddNotification("Custom Tailoring Saved", `${validItems.length} garment ticket(s) created successfully for ${cogCustomerName.trim()}.`, "success");
          }
          setShowCreateAltModal(false);
          fetchAlterations();
          fetchPendingAlterations();
          setSelectedJobTicket(lastTicket);
          setCogItems([COG_ITEM_DEFAULT()]);
        }
      } catch (err) {
        console.error("Save custom tailoring error:", err);
        if (onAddNotification) {
          onAddNotification("Error", err.response?.data?.message || "Network or server failure.", "danger");
        }
      }
      return;
    }

    // MODE 2: SHOWROOM PURCHASE (FROM BILLING)
    if (!selectedAltInvoice || !selectedAltItem) {
      if (onAddNotification) onAddNotification("Error", "Please select an invoice and item first.", "danger");
      return;
    }

    const effectiveDetails = altDetails.length > 0
      ? altDetails
      : (selectedAltItem.services && selectedAltItem.services.length > 0
        ? selectedAltItem.services
        : [selectedAltItem.serviceType || "Standard Service"]);

    const payload = {
      sourceType: 'SHOWROOM_PURCHASE',
      invoiceNumber: selectedAltInvoice.invoiceNo || selectedAltInvoice.invoiceNumber || selectedAltInvoice._id,
      invoiceId: selectedAltInvoice._id,
      saleBillId: selectedAltInvoice._id,
      customerId: selectedAltInvoice.customerId,
      customerName: selectedAltInvoice.customerName || 'Walk-in Customer',
      customerPhone: selectedAltInvoice.customerPhone || '',
      alternatePhone: selectedAltInvoice.alternatePhone || '',
      whatsappNumber: selectedAltInvoice.whatsappNumber || '',
      productId: selectedAltItem.productId,
      productName: selectedAltItem.productName || selectedAltItem.name,
      barcode: selectedAltItem.barcode || selectedAltItem.sku,
      sku: selectedAltItem.sku || selectedAltItem.barcode,
      size: selectedAltItem.size || 'M',
      color: selectedAltItem.color || 'Standard',
      tailorName: altTailorName || (tailorOptions[0] || ''),
      priority: altPriority || 'Normal',
      status: "Pending",
      deliveryDate: altDeliveryDate,
      trialRequired: altTrialRequired,
      trialDate: altTrialRequired ? altTrialDate : '',
      serviceType: selectedAltItem.serviceType || (effectiveDetails.length > 0 ? effectiveDetails.join(' + ') : 'Alteration'),
      gender: selectedAltItem.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(selectedAltItem.name || selectedAltItem.productName || '') ? 'Ladies' : 'Gents'),
      alterationDetails: effectiveDetails,
      customAlterationText: altCustomText,
      specialInstructions: altCustomText || effectiveDetails.join(', '),
      measurements: altMeasurements,
      saveAsMaster: showroomSaveAsMaster,
      garmentType: showroomGarmentType,
      charge: Number(altCharges || 0),
      items: [{
        sourceType: 'SHOWROOM_PURCHASE',
        barcode: selectedAltItem.barcode || selectedAltItem.sku || selectedAltItem.uniqueCode,
        inventoryPieceId: selectedAltItem.inventoryPieceId || selectedAltItem._id,
        pieceName: selectedAltItem.productName || selectedAltItem.name,
        gender: selectedAltItem.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(selectedAltItem.name || selectedAltItem.productName || '') ? 'Ladies' : 'Gents'),
        instructions: effectiveDetails.join(', ') || altCustomText || 'Standard Service',
        alterationDetails: effectiveDetails,
        measurements: altMeasurements,
        charge: Number(altCharges || 0)
      }]
    };

    try {
      if (selectedAltItem.isPssm && selectedAltItem.pssmItemId) {
        try {
          await api.patch(`/pssm/items/${selectedAltItem.pssmItemId}/assign`, {
            tailorName: altTailorName || (tailorOptions[0] || '')
          });
          await api.patch(`/pssm/items/${selectedAltItem.pssmItemId}/status`, {
            status: 'IN_PROGRESS',
            measurements: altMeasurements,
            alterationDetails: altDetails
          });
        } catch (pssmErr) {
          console.warn("PSSM assignment update note:", pssmErr.message);
        }
      }

      const res = await api.post(`/alterations`, payload);
      const data = res.data;
      if (data.success) {
        const createdAlt = data.data?.alteration || data.data || {};
        const tailoringJobs = data.data?.tailoringJobs || [];
        const matchedJob = (tailoringJobs.find(j => String(j.pssmItemId) === String(selectedAltItem?.pssmItemId)) || tailoringJobs[0]);
        const tailorInvoiceNo = selectedAltItem?.tailorInvoiceNo || matchedJob?.tailorInvoiceNo || createdAlt.tailorInvoiceNo || null;

        const ticketSlipObj = {
          _id: createdAlt._id || `alt-${Date.now()}`,
          alterationId: createdAlt.alterationNo || `ALT-${Date.now().toString(36).toUpperCase()}`,
          tailorInvoiceNo: tailorInvoiceNo,
          alterationBarcode: selectedAltItem?.alterationBarcode || tailorInvoiceNo || createdAlt.alterationBarcode || null,
          sourceType: 'SHOWROOM_PURCHASE',
          invoiceNumber: selectedAltInvoice.invoiceNo || selectedAltInvoice.invoiceNumber,
          invoiceId: selectedAltInvoice._id,
          customerName: selectedAltInvoice.customerName || 'Walk-in Customer',
          customerPhone: selectedAltInvoice.customerPhone || '',
          productName: selectedAltItem.productName || selectedAltItem.name || 'Altered Garment',
          barcode: selectedAltItem.barcode || selectedAltItem.sku || '',
          sku: selectedAltItem.sku || selectedAltItem.barcode || '',
          size: selectedAltItem.size || 'M',
          color: selectedAltItem.color || 'Standard',
          serviceType: selectedAltItem.serviceType || (effectiveDetails.length > 0 ? effectiveDetails.join(' + ') : 'Alteration'),
          tailorName: altTailorName || (tailorOptions[0] || ''),
          priority: altPriority || 'Normal',
          status: "Pending",
          deliveryDate: altDeliveryDate,
          trialRequired: altTrialRequired,
          trialDate: altTrialRequired ? altTrialDate : '',
          alterationDetails: effectiveDetails,
          customAlterationText: altCustomText,
          specialInstructions: altCustomText || effectiveDetails.join(', '),
          measurements: altMeasurements,
          createdAt: new Date().toISOString()
        };

        if (onAddNotification) {
          onAddNotification("Alteration Saved", `Alteration ticket ${ticketSlipObj.alterationId} assigned & generated successfully.`, "success");
        }

        setShowCreateAltModal(false);
        fetchAlterations();
        fetchPendingAlterations();
        // Promptly open the Alteration Job Ticket Receipt slip modal!
        setSelectedJobTicket(ticketSlipObj);
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
  const [tailoringReportType, setTailoringReportType] = useState("daily_tailoring_jobs");
  const [tailoringReportData, setTailoringReportData] = useState(null);
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [showVisualAnalytics, setShowVisualAnalytics] = useState(false);
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

  const fetchTailoringReport = async () => {
    try {
      const query = new URLSearchParams({ reportType: tailoringReportType });
      const today = new Date();
      if (filterDateRange === "Today") {
        const date = today.toISOString().split('T')[0];
        query.set("startDate", date);
        query.set("endDate", date);
      } else if (filterDateRange === "ThisMonth") {
        query.set("startDate", new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
        query.set("endDate", today.toISOString().split('T')[0]);
      } else if (filterDateRange === "ThisWeek") {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        query.set("startDate", weekStart.toISOString().split('T')[0]);
        query.set("endDate", today.toISOString().split('T')[0]);
      }
      const res = await api.get(`/reports/tailoring?${query.toString()}`);
      if (res.data?.success) setTailoringReportData(res.data.data);
    } catch (err) {
      console.error("Failed to fetch tailoring report:", err);
    }
  };

  useEffect(() => {
    if (activeStudioTab === "reports") {
      fetchReports();
      fetchTailoringReport();
    } else if (activeStudioTab === "tracking") {
      fetchPerformance();
    }
  }, [activeStudioTab, filterDateRange, filterEmployee, filterStatus, filterPriority, tailoringReportType]);

  const filteredTailoringRows = useMemo(() => {
    const rawRows = (tailoringReportData?.data && tailoringReportData.data.length > 0)
      ? tailoringReportData.data
      : (alterationRecords || []).map(a => ({
          _id: a._id,
          id: a._id,
          alterationId: a.alterationId || a.alterationNo,
          tailorInvoiceNo: a.tailorInvoiceNo || a.invoiceNumber || a.alterationId,
          invoiceNumber: a.invoiceNumber || a.tailorInvoiceNo || a.alterationId,
          jobDate: a.createdAt,
          createdAt: a.createdAt,
          expectedDeliveryDate: a.deliveryDate || a.expectedDeliveryDate,
          deliveryDate: a.deliveryDate || a.expectedDeliveryDate,
          customerName: a.customerName || 'Walk-in Customer',
          mobileNumber: a.customerPhone || '',
          customerPhone: a.customerPhone || '',
          garmentService: (a.alterationDetails && a.alterationDetails.length > 0) ? a.alterationDetails.join(', ') : (a.productName ? `${a.productName} (${a.serviceType || 'Alteration'})` : (a.serviceType || 'Alteration')),
          productName: a.productName || 'Garment',
          tailorName: a.tailorName || 'Unassigned',
          priority: a.priority || 'Normal',
          status: a.status || 'Pending',
          tailoringCharges: a.totalCharges || a.charge || 0,
          charge: a.totalCharges || a.charge || 0,
          measurements: a.measurements || {},
          barcode: a.barcode || a.alterationId,
          specialInstructions: a.specialInstructions || a.customAlterationText || ''
        }));
    const rows = rawRows;
    const normalize = (value) => String(value || '').toLowerCase().replace(/[\s_-]/g, '');
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(todayStart);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return rows.filter((row) => {
      const rowDate = row.jobDate || row.createdAt || row.lastJobDate;
      const date = rowDate ? new Date(rowDate) : null;
      const matchesDate = filterDateRange === "All" || (
        date && (
          filterDateRange === "Today" ? date >= todayStart && date < new Date(todayStart.getTime() + 86400000) :
            filterDateRange === "ThisWeek" ? date >= startOfWeek && date < new Date(todayStart.getTime() + 86400000) :
              filterDateRange === "ThisMonth" ? date >= startOfMonth && date < new Date(todayStart.getTime() + 86400000) :
                true
        )
      );
      const matchesEmployee = filterEmployee === "All" || normalize(row.tailorName) === normalize(filterEmployee);
      const rowStatus = normalize(row.status || row.currentStatus);
      const statusAliases = {
        pending: ['pending', 'received', 'pendingassignment'],
        inprogress: ['inprogress', 'institching', 'assigned', 'incutting'],
        readyfortrial: ['readyfortrial', 'intrial'],
        readyfordelivery: ['readyfordelivery', 'ready', 'readyforpickup'],
        delivered: ['delivered', 'collected', 'closed']
      };
      const requestedStatus = normalize(filterStatus);
      const matchesStatus = filterStatus === "All" || (statusAliases[requestedStatus] || [requestedStatus]).includes(rowStatus);
      const matchesPriority = filterPriority === "All" || normalize(row.priority) === normalize(filterPriority);

      // Search filter
      const q = reportSearchQuery.trim().toLowerCase();
      const matchesSearch = !q || (
        (row.tailorInvoiceNo && String(row.tailorInvoiceNo).toLowerCase().includes(q)) ||
        (row.customerName && String(row.customerName).toLowerCase().includes(q)) ||
        (row.mobileNumber && String(row.mobileNumber).toLowerCase().includes(q)) ||
        (row.tailorName && String(row.tailorName).toLowerCase().includes(q)) ||
        (row.garmentService && String(row.garmentService).toLowerCase().includes(q)) ||
        (row.garment && String(row.garment).toLowerCase().includes(q)) ||
        (row.productName && String(row.productName).toLowerCase().includes(q)) ||
        (row.pssmNo && String(row.pssmNo).toLowerCase().includes(q))
      );

      return matchesDate && matchesEmployee && matchesStatus && matchesPriority && matchesSearch;
    });
  }, [tailoringReportData, alterationRecords, filterDateRange, filterEmployee, filterStatus, filterPriority, reportSearchQuery]);

  const filteredTailoringSummary = useMemo(() => {
    const rows = filteredTailoringRows;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const normalize = (value) => String(value || '').toLowerCase().replace(/[\s_-]/g, '');
    const isPendingStatus = (st) => !['ready', 'delivered', 'cancelled'].includes(normalize(st));

    return {
      totalRecords: rows.length,
      totalCharges: rows.reduce((sum, row) => sum + Number(row.tailoringCharges || row.totalCharges || 0), 0),
      pendingJobs: rows.filter((row) => isPendingStatus(row.status || row.currentStatus)).length,
      readyNotCollected: rows.filter((row) => normalize(row.status || row.currentStatus) === 'ready').length,
      overdueJobs: rows.filter((row) => isPendingStatus(row.status || row.currentStatus) && row.expectedDeliveryDate && new Date(row.expectedDeliveryDate) < today).length
    };
  }, [filteredTailoringRows]);

  const filteredAlterationRecords = useMemo(() => {
    const normalize = (value) => String(value || '').toLowerCase().replace(/[\s_-]/g, '');
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(todayStart);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const dateInRange = (value) => {
      if (filterDateRange === 'All') return true;
      const date = value ? new Date(value) : null;
      if (!date) return false;
      const end = new Date(todayStart.getTime() + 86400000);
      if (filterDateRange === 'Today') return date >= todayStart && date < end;
      if (filterDateRange === 'ThisWeek') return date >= startOfWeek && date < end;
      if (filterDateRange === 'ThisMonth') return date >= startOfMonth && date < end;
      return true;
    };
    const statusMatches = (value) => {
      if (filterStatus === 'All') return true;
      const status = normalize(value);
      const aliases = {
        pending: ['pending', 'received', 'pendingassignment'],
        inprogress: ['inprogress', 'institching', 'assigned', 'incutting'],
        readyfortrial: ['readyfortrial', 'intrial'],
        readyfordelivery: ['readyfordelivery', 'ready', 'readyforpickup'],
        delivered: ['delivered', 'collected', 'closed']
      };
      return (aliases[normalize(filterStatus)] || [normalize(filterStatus)]).includes(status);
    };
    return (alterationRecords || []).filter((record) => (
      dateInRange(record.createdAt || record.jobDate || record.deliveryDate) &&
      (filterEmployee === 'All' || normalize(record.tailorName) === normalize(filterEmployee)) &&
      statusMatches(record.status) &&
      (filterPriority === 'All' || normalize(record.priority) === normalize(filterPriority))
    ));
  }, [alterationRecords, filterDateRange, filterEmployee, filterStatus, filterPriority]);

  const getServiceWhatsAppMessage = (target) => {
    if (!target) return "";
    const svcRaw = target.serviceType || (Array.isArray(target.alterationDetails) && target.alterationDetails.length > 0 ? target.alterationDetails.join(', ') : '') || target.instructions || '';
    const cleanServices = svcRaw
      ? svcRaw.split(/[+,/]/).map(s => s.trim()).filter(Boolean)
      : [];

    let actionWord = "service";
    if (cleanServices.length > 0) {
      actionWord = cleanServices.join(" & ");
    } else {
      actionWord = "alteration";
    }

    const isDryCl = actionWord.toLowerCase().includes('dry clean');
    const isEmb = actionWord.toLowerCase().includes('embroid');
    const isIron = actionWord.toLowerCase().includes('iron');
    const headingWord = isDryCl ? 'Dry Cleaning'
      : isEmb ? 'Embroidery Work'
        : isIron ? 'Ironing'
          : actionWord;

    return `Hello ${target.customerName},\n\nYour ${headingWord} for Invoice ${target.invoiceNumber || target.invoiceId || ''} is now completed and ready for pickup.\n\nGarment: ${target.productName || target.pieceName || 'Item'}\nService: ${headingWord}\nDelivery Date: ${target.deliveryDate || target.expectedDeliveryDate || 'Today'}\n\nPlease visit the showroom to collect your garment.\n\nThank You,\nVastra ERP Service Dept`;
  };

  const getWhatsAppMessageForType = (target, type) => {
    const customer = target?.customerName || "Customer";
    const invoice = target?.invoiceNumber || target?.invoiceId || "your job";
    const garment = target?.productName || target?.pieceName || "garment";
    const date = target?.deliveryDate || target?.expectedDeliveryDate || "the revised date";
    const messages = {
      received: `Hello ${customer},\n\nWe have received your tailoring job for ${garment}. Your job reference is ${invoice}. We will keep you updated on its progress.\n\nThank you,\nVastra ERP`,
      measurement_confirmation: `Hello ${customer},\n\nYour measurements and tailoring job for ${garment} have been confirmed under Invoice ${invoice}.\n\nThank you,\nVastra ERP`,
      trial_reminder: `Hello ${customer},\n\nThis is a reminder for your tailoring trial for ${garment} under Invoice ${invoice}. Please visit the showroom as scheduled.\n\nThank you,\nVastra ERP`,
      ready_collection: getServiceWhatsAppMessage(target),
      delay: `Hello ${customer},\n\nThere is a revised delivery date for your ${garment} under Invoice ${invoice}. The updated date is ${date}. We apologize for the delay.\n\nThank you,\nVastra ERP`,
      collection_reminder: `Hello ${customer},\n\nA reminder from Vastra: your ${garment} under Invoice ${invoice} is ready for collection. Please visit the showroom at your convenience.\n\nThank you,\nVastra ERP`,
      payment_reminder: `Hello ${customer},\n\nThis is a payment reminder for your ${garment} under Invoice ${invoice}. Please contact or visit the showroom to clear the pending amount.\n\nThank you,\nVastra ERP`
    };
    return messages[type] || messages.ready_collection;
  };

  const openWhatsAppModal = (target) => {
    setWhatsappModalTarget(target);
    setWhatsappMessageType("ready_collection");
    setWhatsappMessage(getWhatsAppMessageForType(target, "ready_collection"));
  };

  const handleConfirmSendWhatsApp = async (target) => {
    if (!target) return;
    try {
      const phoneClean = (target.customerPhone || '').replace(/[^0-9]/g, '');
      if (!phoneClean) {
        throw new Error('Customer mobile number is missing.');
      }
      const formattedPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMessage)}`, "_blank");
      setWhatsappModalTarget(null);
      if (onAddNotification) {
        onAddNotification("WhatsApp Message Ready", `Opened WhatsApp for ${target.customerName}.`, "success");
      }
    } catch (err) {
      console.error("WhatsApp notification error:", err);
      if (onAddNotification) onAddNotification("WhatsApp unavailable", err.message, "error");
    }
  };

  const handleExportReportsCSV = () => {
    if (activeStudioTab === "reports") {
      const activeRows = filteredTailoringRows;
      if (!activeRows || !activeRows.length) {
        if (onAddNotification) onAddNotification("Info", "No report records match the selected filters to export.", "info");
        return;
      }
      const currentReport = TAILORING_REPORT_TYPES.find(r => r.id === tailoringReportType) || { label: "Tailoring_Report" };
      const sample = activeRows[0];
      const keys = Object.keys(sample);
      const headers = keys.map(k => k.replace(/([A-Z])/g, " $1").trim().toUpperCase());
      const csvRows = activeRows.map(row => keys.map(k => {
        const val = row[k];
        if (val === null || val === undefined) return '""';
        if (k.toLowerCase().includes('date') || k === 'createdAt') {
          return `"${formatReportDate(val)}"`;
        }
        const strVal = String(val);
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return `"${strVal}"`;
      }));
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows.map(r => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${currentReport.label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (onAddNotification) onAddNotification("CSV Exported", `${currentReport.label} downloaded successfully.`, "success");
      return;
    }

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
    if (!ticket) return;
    const mObj = ticket.measurements || {};
    const ins = mObj.inseam || mObj.innerLegLength || mObj.Inseam || mObj['Inner Leg Length'] || '';
    const barcodeVal = ticket.alterationBarcode || ticket.tailorInvoiceNo || ticket.barcode || ticket.alterationId;
    const barcodeSvg = generateCode128SvgString(barcodeVal, {
      width: 1.8,
      height: 48,
      displayValue: false,
      margin: 4,
      background: '#ffffff',
      lineColor: '#000000'
    });
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Job Ticket ${ticket.alterationId}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; color: #000; padding: 16px; max-width: 380px; margin: 0 auto; line-height: 1.4; }
          .text-center { text-align: center; }
          .header { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
          .details { font-size: 11px; line-height: 1.4; margin-bottom: 8px; }
          .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
          .badge { font-weight: bold; text-transform: uppercase; }
          .barcode-badge-box { background: #f1f5f9; border: 1.5px solid #0f172a; border-radius: 4px; padding: 6px 8px; margin: 8px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="text-center header">VASTRA ERP — ALTERATION TICKET</div>
        <div class="text-center details">Boutique Tailoring & Garment Fitting Slip</div>
        <div class="divider"></div>
        <div class="barcode-badge-box">
          <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.8px; color: #334155; text-transform: uppercase;">ITEM ALTERATION BARCODE</div>
          <div style="font-size: 15px; font-weight: 900; letter-spacing: 1.5px; font-family: monospace; color: #0f172a; margin-top: 2px;">${barcodeVal}</div>
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>Ticket ID:</b> ${ticket.alterationId}<br>
          ${ticket.tailorInvoiceNo ? `<b>Tailor Invoice No:</b> <b>${ticket.tailorInvoiceNo}</b><br>` : ''}
          ${ticket.alterationBarcode && ticket.alterationBarcode !== ticket.tailorInvoiceNo ? `<b>Alteration Barcode:</b> <b>${ticket.alterationBarcode}</b><br>` : ''}
          <b>Date:</b> ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}<br>
          <b>Source / Bill No:</b> ${ticket.sourceType === 'CUSTOMER_OWN_GARMENT' ? 'Customer Own Garment (Custom Tailoring)' : (ticket.invoiceNumber || ticket.invoiceId || 'Showroom Billing')}<br>
          <b>Customer Name:</b> ${ticket.customerName}<br>
          <b>Mobile Number:</b> ${ticket.customerPhone || 'N/A'}
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>Garment:</b> ${ticket.productName}<br>
          <b>Category (Gents/Ladies):</b> <b>${ticket.gender || 'Gents'}</b><br>
          <b>Bill No & Code:</b> ${ticket.invoiceNumber || 'N/A'} / ${ticket.barcode || ticket.sku || ticket.uniqueCode || 'N/A'}<br>
          <b>Size & Color:</b> ${ticket.size || 'M'} / ${ticket.color || 'Standard'}<br>
          <b>Master Tailor:</b> ${ticket.tailorName || 'Unassigned'}
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>MEASUREMENTS (INCHES):</b><br>
          ${Object.entries(mObj).map(([k, v]) => `- ${k}: ${v}"`).join('<br>') || 'Default measurements'}
          ${ins ? `<br><b>Inseam / Inner Leg Length:</b> <b>${ins}"</b>` : ''}
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>REQUIRED SERVICES / WORK:</b><br>
          <b>Service:</b> ${ticket.serviceType || 'Alteration'} (${ticket.gender || 'Gents'})<br>
          ${((ticket.alterationDetails && ticket.alterationDetails.length > 0) ? ticket.alterationDetails : [ticket.serviceType || 'Standard Service']).map(d => `✓ ${d}`).join('<br>')}
          ${ticket.customAlterationText ? `<br><b>Custom Note:</b> ${ticket.customAlterationText}` : ''}
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>FINANCIAL & SCHEDULE:</b><br>
          <b>Tailoring Charge:</b> ₹${ticket.totalCharges || ticket.charge || 0}<br>
          <b>Advance Paid:</b> ₹${ticket.advancePaid || 0}<br>
          <b>Balance Due:</b> ₹${ticket.balanceDue || 0}<br>
          <b>Expected Delivery Date:</b> <b>${ticket.deliveryDate || 'Scheduled'} ${ticket.deliveryTime || ''}</b><br>
          <b>Trial Date:</b> ${ticket.trialDate || 'N/A'}<br>
          <b>Priority:</b> <span class="badge">${ticket.priority || 'Normal'}</span>
        </div>
        ${ticket.specialInstructions ? `
          <div class="divider"></div>
          <div class="details">
            <b>SPECIAL INSTRUCTIONS:</b><br>
            "${ticket.specialInstructions}"
          </div>
        ` : ''}
        <div class="divider"></div>
        <div class="text-center" style="margin-top:10px;">
          <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.8px; color: #334155; text-transform: uppercase; margin-bottom: 4px;">ITEM LEVEL ALTERATION BARCODE</div>
          <div style="display:inline-block;max-width:100%;margin:0 auto;background:#fff;padding:4px;border:1px solid #cbd5e1;border-radius:4px;">
            ${barcodeSvg}
          </div>
          <p style="margin:4px 0 2px;font-size:13px;font-weight:900;letter-spacing:1.5px;font-family:monospace">${barcodeVal}</p>
          <p style="font-size:9.5px;margin-top:4px;color:#475569;">*** Scan barcode or present slip during fitting / collection ***</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleDownloadJobTicketHTML = (ticket) => {
    if (!ticket) return;
    const mObj = ticket.measurements || {};
    const ins = mObj.inseam || mObj.innerLegLength || mObj.Inseam || mObj['Inner Leg Length'] || '';
    const barcodeVal = ticket.alterationBarcode || ticket.tailorInvoiceNo || ticket.barcode || ticket.alterationId;
    const barcodeSvg = generateCode128SvgString(barcodeVal, {
      width: 1.8,
      height: 48,
      displayValue: false,
      margin: 4,
      background: '#ffffff',
      lineColor: '#000000'
    });
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Job Ticket ${ticket.alterationId}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; color: #000; padding: 16px; max-width: 380px; margin: 0 auto; line-height: 1.4; }
          .text-center { text-align: center; }
          .header { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
          .details { font-size: 11px; line-height: 1.4; margin-bottom: 8px; }
          .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
          .badge { font-weight: bold; text-transform: uppercase; }
          .barcode-badge-box { background: #f1f5f9; border: 1.5px solid #0f172a; border-radius: 4px; padding: 6px 8px; margin: 8px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="text-center header">VASTRA ERP — ALTERATION TICKET</div>
        <div class="text-center details">Boutique Tailoring & Garment Fitting Slip</div>
        <div class="divider"></div>
        <div class="barcode-badge-box">
          <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.8px; color: #334155; text-transform: uppercase;">ITEM ALTERATION BARCODE</div>
          <div style="font-size: 15px; font-weight: 900; letter-spacing: 1.5px; font-family: monospace; color: #0f172a; margin-top: 2px;">${barcodeVal}</div>
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>Ticket ID:</b> ${ticket.alterationId}<br>
          ${ticket.tailorInvoiceNo ? `<b>Tailor Invoice No:</b> <b>${ticket.tailorInvoiceNo}</b><br>` : ''}
          ${ticket.alterationBarcode && ticket.alterationBarcode !== ticket.tailorInvoiceNo ? `<b>Alteration Barcode:</b> <b>${ticket.alterationBarcode}</b><br>` : ''}
          <b>Date:</b> ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}<br>
          <b>Source / Bill No:</b> ${ticket.sourceType === 'CUSTOMER_OWN_GARMENT' ? 'Customer Own Garment (Custom Tailoring)' : (ticket.invoiceNumber || ticket.invoiceId || 'Showroom Billing')}<br>
          <b>Customer Name:</b> ${ticket.customerName}<br>
          <b>Mobile Number:</b> ${ticket.customerPhone || 'N/A'}
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>Garment:</b> ${ticket.productName}<br>
          <b>Category (Gents/Ladies):</b> <b>${ticket.gender || 'Gents'}</b><br>
          <b>Bill No & Code:</b> ${ticket.invoiceNumber || 'N/A'} / ${ticket.barcode || ticket.sku || ticket.uniqueCode || 'N/A'}<br>
          <b>Size & Color:</b> ${ticket.size || 'M'} / ${ticket.color || 'Standard'}<br>
          <b>Master Tailor:</b> ${ticket.tailorName || 'Unassigned'}
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>MEASUREMENTS (INCHES):</b><br>
          ${Object.entries(mObj).map(([k, v]) => `- ${k}: ${v}"`).join('<br>') || 'Default measurements'}
          ${ins ? `<br><b>Inseam / Inner Leg Length:</b> <b>${ins}"</b>` : ''}
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>REQUIRED SERVICES / WORK:</b><br>
          <b>Service:</b> ${ticket.serviceType || 'Alteration'} (${ticket.gender || 'Gents'})<br>
          ${((ticket.alterationDetails && ticket.alterationDetails.length > 0) ? ticket.alterationDetails : [ticket.serviceType || 'Standard Service']).map(d => `✓ ${d}`).join('<br>')}
          ${ticket.customAlterationText ? `<br><b>Custom Note:</b> ${ticket.customAlterationText}` : ''}
        </div>
        <div class="divider"></div>
        <div class="details">
          <b>FINANCIAL & SCHEDULE:</b><br>
          <b>Tailoring Charge:</b> ₹${ticket.totalCharges || ticket.charge || 0}<br>
          <b>Advance Paid:</b> ₹${ticket.advancePaid || 0}<br>
          <b>Balance Due:</b> ₹${ticket.balanceDue || 0}<br>
          <b>Expected Delivery Date:</b> <b>${ticket.deliveryDate || 'Scheduled'} ${ticket.deliveryTime || ''}</b><br>
          <b>Trial Date:</b> ${ticket.trialDate || 'N/A'}<br>
          <b>Priority:</b> <span class="badge">${ticket.priority || 'Normal'}</span>
        </div>
        ${ticket.specialInstructions ? `
          <div class="divider"></div>
          <div class="details">
            <b>SPECIAL INSTRUCTIONS:</b><br>
            "${ticket.specialInstructions}"
          </div>
        ` : ''}
        <div class="divider"></div>
        <div class="text-center" style="margin-top:10px;">
          <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.8px; color: #334155; text-transform: uppercase; margin-bottom: 4px;">ITEM LEVEL ALTERATION BARCODE</div>
          <div style="display:inline-block;max-width:100%;margin:0 auto;background:#fff;padding:4px;border:1px solid #cbd5e1;border-radius:4px;">
            ${barcodeSvg}
          </div>
          <p style="margin:4px 0 2px;font-size:13px;font-weight:900;letter-spacing:1.5px;font-family:monospace">${barcodeVal}</p>
          <p style="font-size:9.5px;margin-top:4px;color:#475569;">*** Scan barcode or present slip during fitting / collection ***</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Alteration_Slip_${ticket.alterationId || 'Ticket'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onAddNotification) onAddNotification("Downloaded", `Alteration slip downloaded for ${ticket.alterationId}.`, "success");
  };

  const fetchPendingAlterations = async (isInitialLoad = false) => {
    if (isInitialLoad) setLoadingPending(true);
    try {
      const [resAlt, resPssm] = await Promise.allSettled([
        api.get(`/alterations/pending-items`),
        api.get(`/pssm/pending-assignments`)
      ]);

      let items = [];
      const pssmBarcodes = new Set();
      const pssmInvoiceNos = new Set();

      if (resPssm.status === 'fulfilled' && resPssm.value.data?.success && Array.isArray(resPssm.value.data.data)) {
        const pssmPending = resPssm.value.data.data.map(p => {
          if (p.barcode) pssmBarcodes.add(p.barcode.toString());
          if (p.uniqueCode) pssmBarcodes.add(p.uniqueCode.toString());
          if (p.billBarcode) pssmInvoiceNos.add(p.billBarcode.toString());
          if (p.billNo) pssmInvoiceNos.add(p.billNo.toString());

          return {
            _id: p._id,
            pssmItemId: p._id,
            alterationId: p.pssmNo,
            tailorInvoiceNo: p.tailorInvoiceNo,
            isPssm: true,
            saleItemId: p._id,
            invoiceNo: p.billBarcode || p.billNo,
            billBarcode: p.billBarcode || p.billNo,
            productName: p.productName || 'Garment Item',
            barcode: p.barcode || p.uniqueCode || 'N/A',
            uniqueCode: p.uniqueCode || p.barcode || '',
            sku: p.barcode || p.uniqueCode || '',
            customerName: p.customerName || 'Walk-in Customer',
            customerPhone: p.customerPhone || '',
            size: p.size || 'M',
            color: p.color || 'Standard',
            serviceType: p.serviceType || 'Alteration',
            gender: p.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(p.productName || '') ? 'Ladies' : 'Gents'),
            status: p.status || 'PENDING_ASSIGNMENT',
            trialRequired: p.trialRequired,
            trialDate: p.trialDate,
            expectedDeliveryDate: p.expectedDeliveryDate,
            priority: p.priority || 'Normal'
          };
        });
        items.push(...pssmPending);
      }

      if (resAlt.status === 'fulfilled' && resAlt.value.data?.success && Array.isArray(resAlt.value.data.data)) {
        const legacyItems = resAlt.value.data.data
          .map(altItem => ({
            ...altItem,
            gender: altItem.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(altItem.productName || '') ? 'Ladies' : 'Gents')
          }))
          .filter(altItem => {
            const b = altItem.barcode || altItem.uniqueCode;
            const inv = altItem.invoiceNo || altItem.billBarcode;
            if (b && pssmBarcodes.has(b.toString())) return false;
            if (inv && pssmInvoiceNos.has(inv.toString()) && items.length > 0) return false;
            return true;
          });
        items.push(...legacyItems);
      }

      setPendingAlterations(items);
    } catch (err) {
      console.error("Failed to fetch pending alterations:", err);
    } finally {
      if (isInitialLoad) setLoadingPending(false);
    }
  };

  const handleAssignPSSItem = async (itemId, tailorName) => {
    try {
      const res = await api.patch(`/pssm/items/${itemId}/assign`, { tailorName });
      if (res.data.success) {
        if (onAddNotification) onAddNotification("Assignment Saved", `Assigned to ${tailorName}`, "success");
        fetchPendingAlterations();
        fetchAlterations();
      }
    } catch (err) {
      console.error("Failed to assign tailor:", err);
      if (onAddNotification) onAddNotification("Error", err.response?.data?.message || "Failed to assign", "danger");
    }
  };

  const handleUpdatePSSItemStatus = async (itemId, newStatus, measurements, alterationDetails) => {
    try {
      const res = await api.patch(`/pssm/items/${itemId}/status`, { status: newStatus, measurements, alterationDetails });
      if (res.data.success) {
        if (onAddNotification) onAddNotification("Status Updated", `Item status changed to ${newStatus}`, "success");
        fetchAlterations();
        fetchPendingAlterations();
      }
    } catch (err) {
      console.error("Failed to update PSS item status:", err);
      if (onAddNotification) onAddNotification("Error", err.response?.data?.message || "Failed to update item status", "danger");
    }
  };

  const handleSearchBillCollection = async (barcode) => {
    const q = barcode || collectionBarcodeQuery;
    if (!q || !q.trim()) return;
    setLoadingCollection(true);
    try {
      const res = await api.get(`/pssm/barcode/${encodeURIComponent(q.trim())}`);
      if (res.data.success && res.data.data) {
        setCollectionData(res.data.data);
        if (res.data.data.matchedItemId) {
          setSelectedCollectionItemIds([res.data.data.matchedItemId]);
        } else {
          const readyIds = (res.data.data.items || []).filter(i => i.status === 'READY').map(i => i._id);
          setSelectedCollectionItemIds(readyIds);
        }
      } else {
        setCollectionData(null);
        if (onAddNotification) onAddNotification("No PSS Record", `No active PSS order found for barcode ${q}`, "warning");
      }
    } catch (err) {
      console.error("Collection barcode search error:", err);
      setCollectionData(null);
      if (onAddNotification) onAddNotification("Search Error", err.response?.data?.message || "Barcode not found", "danger");
    } finally {
      setLoadingCollection(false);
    }
  };

  const handleConfirmCollection = async () => {
    if (!collectionData || !collectionData.pssm) return;
    try {
      const res = await api.post('/pssm/collection', {
        billBarcode: collectionData.pssm.billBarcode,
        itemIds: selectedCollectionItemIds
      });
      if (res.data.success) {
        const updated = res.data.data;
        setCollectionData(updated);
        const nextMasterStatus = updated.pssm?.status || 'UPDATED';
        if (onAddNotification) {
          onAddNotification(
            "Collection Recorded",
            `Items marked as COLLECTED. Bill PSS Lifecycle: ${nextMasterStatus}`,
            "success"
          );
        }
        fetchAlterations();
        fetchPendingAlterations();
      }
    } catch (err) {
      console.error("Failed to record collection:", err);
      if (onAddNotification) onAddNotification("Error", err.response?.data?.message || "Failed to record collection", "danger");
    }
  };

  const handleOpenAuditModal = async (ticket) => {
    if (!ticket) return;
    const targetNo = ticket.alterationId || ticket.alterationNo || ticket.pssmNo || ticket.invoiceNumber || ticket.barcode || ticket._id || 'Ticket';
    setLoadingAuditModal(true);
    setAuditModalData({ ticket, title: String(targetNo), logs: [] });
    try {
      const searchTerm = ticket.alterationNo || ticket.alterationId || ticket.invoiceNumber || ticket.billNo || ticket.barcode || '';
      const res = await api.get(`/staff-activity/activity-logs?search=${encodeURIComponent(searchTerm)}&limit=50`);
      if (res.data?.success && res.data?.data) {
        setAuditModalData({ ticket, title: String(targetNo), logs: res.data.data });
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoadingAuditModal(false);
    }
  };

  const fetchAlterations = async (isBackground = false) => {
    if (isFetchingAlterations.current && isBackground) {
      return;
    }
    isFetchingAlterations.current = true;
    const requestSequence = ++alterationFetchSequence.current;
    if (!isBackground || alterationRecords.length === 0) {
      setAlterationsLoading(true);
    }
    try {
      const res = await api.get(`/alterations`);
      const data = res.data;
      if (requestSequence < latestAppliedAlterationSequence.current) return;
      latestAppliedAlterationSequence.current = requestSequence;
      setAlterationsLoadError("");
      const records = Array.isArray(data.data) ? data.data : (data.data?.alterations || []);
      if (data.success && records.length > 0) {
        const sorted = [...records].sort((a, b) => {
          const aNeeds = a.needsMeasurements || (!a.measurements || Object.keys(a.measurements).length === 0 || !Object.values(a.measurements).some(v => v));
          const bNeeds = b.needsMeasurements || (!b.measurements || Object.keys(b.measurements).length === 0 || !Object.values(b.measurements).some(v => v));
          const aPending = a.status === 'Pending' || a.status === 'Pending Measurements';
          const bPending = b.status === 'Pending' || b.status === 'Pending Measurements';
          if (aNeeds && aPending && !(bNeeds && bPending)) return -1;
          if (!(aNeeds && aPending) && bNeeds && bPending) return 1;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
        setAlterationRecords(sorted);
      } else if (data.success && records.length === 0) {
        setAlterationRecords([]);
      }
    } catch (err) {
      console.error("Failed to fetch alterations:", err.response?.data || err.message || err);
      if (requestSequence >= latestAppliedAlterationSequence.current) {
        setAlterationsLoadError(err.response?.data?.message || "Could not load alteration data.");
      }
      if (onAddNotification && !isBackground) {
        onAddNotification("Alterations unavailable", err.response?.data?.message || "Could not load alteration data. Please retry.", "danger");
      }
    } finally {
      isFetchingAlterations.current = false;
      setAlterationsLoading(false);
    }
  };

  const handleUpdateAlterationStatus = async (alterationId, newStatus) => {
    const targetAlt = (alterationRecords || []).find(a => a._id === alterationId);
    if (["In Progress", "In Cutting", "In Stitching"].includes(newStatus)) {
      const mKeys = targetAlt?.measurements ? Object.keys(targetAlt.measurements) : [];
      const hasMeas = mKeys.length > 0 && Object.values(targetAlt.measurements).some(v => v !== null && v !== '' && v !== undefined);
      if (!hasMeas) {
        if (onAddNotification) {
          onAddNotification(
            "Measurements Required",
            `Measurements must be added before work can be started (${newStatus}).`,
            "warning"
          );
        }
        handleOpenMeasurementModal(targetAlt, true);
        return;
      }
    }

    try {
      const res = await api.patch(`/alterations/${alterationId}/status`, { status: newStatus });
      if (res.data.success) {
        const updatedStatus = res.data.data?.status || newStatus;
        setAlterationRecords((records) => records.map((record) => (
          record._id === alterationId
            ? { ...record, status: normalizeJobStatus(updatedStatus), rawStatus: updatedStatus }
            : record
        )));
        if (onAddNotification) onAddNotification("Status Updated", `Status changed to ${newStatus}`, "success");
        await Promise.all([
          fetchAlterations(),
          fetchPendingAlterations(),
          fetchAlterationDashboard()
        ]);
        setAlterationRecords((records) => records.map((record) => (
          record._id === alterationId
            ? { ...record, status: normalizeJobStatus(updatedStatus), rawStatus: updatedStatus }
            : record
        )));
      } else {
        if (onAddNotification) onAddNotification("Error", res.data.message || "Failed to update status", "danger");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      const msg = err.response?.data?.message || "Network or server failure.";
      if (onAddNotification) onAddNotification("Error", msg, "danger");
      if (msg.toLowerCase().includes("measurement")) {
        handleOpenMeasurementModal(targetAlt, true);
      }
    }
  };

  useEffect(() => {
    fetchAlterations(false);
    fetchPendingAlterations(true);
    fetchAlterationDashboard();
    const interval = setInterval(() => {
      fetchAlterations(true);
      fetchPendingAlterations(false);
      fetchAlterationDashboard();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlterationDashboard = async () => {
    try {
      const res = await api.get(`/alterations/dashboard?dateRange=${altSummaryDate}`);
      if (res.data.success) {
        setAltTypeSummary(res.data.data.typeSummary);
        if (res.data.data.summary) setDashboardSummaryData(res.data.data.summary);
        if (res.data.data.serviceWisePending) setServiceWisePending(res.data.data.serviceWisePending);
        if (res.data.data.deliveryDashboard) setDeliveryDashboard(res.data.data.deliveryDashboard);
        if (res.data.data.tailorSummaries) setTailorSummaries(res.data.data.tailorSummaries);
        if (res.data.data.allTailorsSummary) setAllTailorsSummary(res.data.data.allTailorsSummary);
        if (res.data.data.capacityAlerts) setCapacityAlerts(res.data.data.capacityAlerts);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard summary:", err);
    }
  };

  useEffect(() => {
    fetchAlterationDashboard();
  }, [altSummaryDate]);

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
  const [selectedTailor, setSelectedTailor] = useState(() => defaultTailors[0] || { id: "t-default", name: "In-House Master Tailor", jobs: 0, availability: "Available" });
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
  const fabricRemaining = parseFloat(((selectedFabric?.stock || 0) - totalFabricRequired).toFixed(2));

  // ─── COST BREAKDOWN (SECTION 11) ───
  const fabricCost = Math.round(totalFabricRequired * (selectedFabric?.price || 0));
  const accessoriesCost = customizations.Buttons !== "Premium Bone" ? 250 : 150;
  const embroideryCost = customizations.Embroidery !== "None" ? 650 : 0;
  const tailorCost = selectedTailor?.availability === "Busy" ? 950 : 750;
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
    if (defaultTailors && defaultTailors.length > 0) {
      if (!selectedTailor || !defaultTailors.some(t => t.id === selectedTailor.id)) {
        setSelectedTailor(defaultTailors[0]);
      }
    }
  }, [defaultTailors]);

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

      if (focusedSection === "tailors" && defaultTailors.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveTailorIndex((prev) => (prev + 1) % defaultTailors.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveTailorIndex((prev) => (prev - 1 + defaultTailors.length) % defaultTailors.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          const target = defaultTailors[activeTailorIndex] || defaultTailors[0];
          if (target) {
            setSelectedTailor(target);
            if (onAddNotification) onAddNotification("Tailor Assigned", `${target.name} assigned to tailoring job.`, "success");
          }
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
    const tailorName = selectedTailor?.name || 'In-House Master Tailor';
    onAddNotification("Production Stage Loaded", `Garment sent to workflow line. Assigned: ${tailorName}.`, "success");

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
          remarks: `Fabric issued to tailor ${tailorName} for bespoke ${selectedGarment}`
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
        fabric: selectedFabric?.name || 'Standard Fabric',
        color: selectedColor?.name || 'Standard Color',
        tailor: selectedTailor?.name || 'In-House Master Tailor',
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

            {/* INCOMING ALTERATION REQUESTS FROM BILLED SALES (PENDING DETAILS) */}
            <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-indigo-500/10 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide">
                        Incoming Alterations from Billed Sales
                      </h3>
                      <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        {pendingAlterations.length} Pending
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Garments marked for alteration during POS checkout. Click any product to enter tailoring details & generate its Alteration Slip.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category Filter for Pending Alterations */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200 shadow-2xs">
                    <span className="text-[10px] font-black uppercase text-slate-400 px-1.5">Category:</span>
                    {['All', 'Gents', 'Ladies'].map(gf => {
                      const count = gf === 'All'
                        ? pendingAlterations.length
                        : pendingAlterations.filter(it => (it.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(it.productName || '') ? 'Ladies' : 'Gents')) === gf).length;
                      const isAct = altGenderFilter === gf;
                      return (
                        <button
                          key={gf}
                          type="button"
                          onClick={() => setAltGenderFilter(gf)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${isAct
                            ? gf === 'Ladies' ? 'bg-rose-600 text-white shadow-xs' : gf === 'Gents' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                          {gf === 'Gents' && <span>👨</span>}
                          {gf === 'Ladies' && <span>👩</span>}
                          <span>{gf} ({count})</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setShowCollectionModal(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    <span>SCAN BILL BARCODE / COLLECTION</span>
                  </button>

                  <button
                    onClick={fetchPendingAlterations}
                    disabled={loadingPending}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingPending ? 'animate-spin' : ''}`} />
                    <span>Refresh Queue</span>
                  </button>
                </div>
              </div>

              {pendingAlterations.length === 0 ? (
                <div className="bg-white/80 border border-dashed border-amber-200 rounded-2xl p-4 text-center text-xs text-slate-400">
                  No pending alterations from recent bills. Garments marked in POS will automatically appear here.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {pendingAlterations
                    .filter(item => {
                      if (altGenderFilter !== "All" && (item.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(item.productName || '') ? 'Ladies' : 'Gents')) !== altGenderFilter) {
                        return false;
                      }
                      if (alterationSearchQuery.trim()) {
                        const q = alterationSearchQuery.toLowerCase().trim();
                        return (
                          (item.customerName || "").toLowerCase().includes(q) ||
                          (item.customerPhone || "").toLowerCase().includes(q) ||
                          (item.invoiceNo || item.billBarcode || "").toLowerCase().includes(q) ||
                          (item.alterationId || "").toLowerCase().includes(q) ||
                          (item.alterationBarcode || "").toLowerCase().includes(q) ||
                          (item.tailorInvoiceNo || "").toLowerCase().includes(q) ||
                          (item.productName || "").toLowerCase().includes(q) ||
                          (item.sku || "").toLowerCase().includes(q) ||
                          (item.uniqueCode || "").toLowerCase().includes(q) ||
                          (item.barcode || "").toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((item, idx) => {
                      const itemGender = item.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(item.productName || '') ? 'Ladies' : 'Gents');
                      return (
                        <div
                          key={item.pssmItemId || item.saleItemId || idx}
                          onClick={() => handleConfigurePendingGarment(item)}
                          className="group bg-white rounded-2xl border-2 border-amber-200 hover:border-rose-500 p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex flex-col items-start gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenInvoicePreview(item.invoiceNo, item.saleBillId);
                                  }}
                                  className="text-[10px] font-mono font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-lg border border-indigo-200 uppercase transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Click to view full Invoice Receipt"
                                >
                                  <FileText className="w-3 h-3 text-indigo-600" />
                                  <span>Invoice: {item.invoiceNo}</span>
                                </button>
                                {item.tailorInvoiceNo && (
                                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                    TI: {item.tailorInvoiceNo}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                Pending Assignment
                              </span>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                                  {item.productName}
                                </h4>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${itemGender === 'Ladies'
                                  ? 'bg-pink-100 text-pink-700 border-pink-300'
                                  : 'bg-blue-100 text-blue-700 border-blue-300'
                                  }`}>
                                  {itemGender}
                                </span>
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-[10px] font-black uppercase font-mono px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                                  {item.serviceType || 'Alteration'}
                                </span>
                                <span className={`text-[8px] font-black uppercase tracking-wider mt-0.5 px-1.5 py-0.2 rounded border ${itemGender === 'Ladies'
                                  ? 'bg-pink-50 text-pink-700 border-pink-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}>
                                  {itemGender}
                                </span>
                              </div>
                            </div>

                            <div className="text-xs font-mono font-bold text-slate-700 mt-1 flex items-center gap-1">
                              <span className="text-slate-400">Barcode:</span>
                              <span className="text-slate-900 font-extrabold bg-slate-100 px-1.5 py-0.5 rounded">{item.barcode}</span>
                            </div>

                            <div className="text-[11px] text-slate-500 mt-1.5 flex justify-between items-center border-t border-slate-100 pt-2">
                              <span>Customer: <strong className="text-slate-700">{item.customerName}</strong></span>
                              <span className="font-mono text-[10px] text-slate-400">{item.customerPhone || ''}</span>
                            </div>

                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Size: <span className="font-bold text-slate-600">{item.size || 'M'}</span> | Color: <span className="font-bold text-slate-600">{item.color || 'Std'}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="w-full py-2 bg-slate-900 group-hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                            <span>Configure & Assign Tailor ➔</span>
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* ─── TAILORING DASHBOARD 11 SUMMARY FEATURES ─── */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-rose-500 to-indigo-600 text-white rounded-xl shadow-xs">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                      <span>Tailoring Dashboard Live Summary</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Real-time summary breakdown across today's queue, delivery commitments, and all workshop stages. Click any card to filter jobs.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAlterationsFilterStatus("All")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${alterationsFilterStatus === "All"
                      ? "bg-slate-900 text-white shadow-xs ring-1 ring-slate-800"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    title="View All Tickets"
                  >
                    <span>All Tickets ({alterationRecords.length})</span>
                  </button>
                  {alterationsFilterStatus !== "All" && (
                    <button
                      type="button"
                      onClick={() => setAlterationsFilterStatus("All")}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <span>Filtered: {alterationsFilterStatus} (Clear ✕)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 11 Summary Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 sm:gap-2.5">
                {[
                  {
                    id: "Today's Jobs",
                    title: "Today's Jobs",
                    count: tailoringSummaryMetrics.todaysJobs,
                    icon: Calendar,
                    border: "border-indigo-200",
                    bg: "bg-indigo-50/70 hover:bg-indigo-100/80",
                    activeBg: "bg-indigo-600 text-white ring-2 ring-indigo-500",
                    text: "text-indigo-900",
                    iconColor: "text-indigo-600",
                    sub: "Booked today"
                  },
                  {
                    id: "Due Today",
                    title: "Due Today",
                    count: tailoringSummaryMetrics.dueToday,
                    icon: Clock,
                    border: "border-amber-200",
                    bg: "bg-amber-50/70 hover:bg-amber-100/80",
                    activeBg: "bg-amber-500 text-white ring-2 ring-amber-400",
                    text: "text-amber-900",
                    iconColor: "text-amber-600",
                    sub: "Promise today"
                  },
                  {
                    id: "Overdue",
                    title: "Overdue",
                    count: tailoringSummaryMetrics.overdue,
                    icon: AlertTriangle,
                    border: "border-rose-200",
                    bg: "bg-rose-50/70 hover:bg-rose-100/80",
                    activeBg: "bg-rose-600 text-white ring-2 ring-rose-500",
                    text: "text-rose-900",
                    iconColor: "text-rose-600",
                    sub: "Past deadline"
                  },
                  {
                    id: "Pending",
                    title: "Pending",
                    count: tailoringSummaryMetrics.pending,
                    icon: FileText,
                    border: "border-slate-200",
                    bg: "bg-slate-50/80 hover:bg-slate-100",
                    activeBg: "bg-slate-800 text-white ring-2 ring-slate-700",
                    text: "text-slate-900",
                    iconColor: "text-slate-600",
                    sub: "Queued tickets"
                  },
                  {
                    id: "In Cutting",
                    title: "In Cutting",
                    count: tailoringSummaryMetrics.inCutting,
                    icon: Scissors,
                    border: "border-orange-200",
                    bg: "bg-orange-50/70 hover:bg-orange-100/80",
                    activeBg: "bg-orange-600 text-white ring-2 ring-orange-500",
                    text: "text-orange-900",
                    iconColor: "text-orange-600",
                    sub: "Pattern cutting"
                  },
                  {
                    id: "In Stitching",
                    title: "In Stitching",
                    count: tailoringSummaryMetrics.inStitching,
                    icon: Layers,
                    border: "border-blue-200",
                    bg: "bg-blue-50/70 hover:bg-blue-100/80",
                    activeBg: "bg-blue-600 text-white ring-2 ring-blue-500",
                    text: "text-blue-900",
                    iconColor: "text-blue-600",
                    sub: "With tailor"
                  },
                  {
                    id: "In Trial",
                    title: "In Trial",
                    count: tailoringSummaryMetrics.inTrial,
                    icon: Shirt,
                    border: "border-purple-200",
                    bg: "bg-purple-50/70 hover:bg-purple-100/80",
                    activeBg: "bg-purple-600 text-white ring-2 ring-purple-500",
                    text: "text-purple-900",
                    iconColor: "text-purple-600",
                    sub: "Fitting trial"
                  },
                  {
                    id: "Re-Alteration",
                    title: "Re-Alteration",
                    count: tailoringSummaryMetrics.reAlteration,
                    icon: RefreshCw,
                    border: "border-red-200",
                    bg: "bg-red-50/70 hover:bg-red-100/80",
                    activeBg: "bg-red-600 text-white ring-2 ring-red-500",
                    text: "text-red-900",
                    iconColor: "text-red-600",
                    sub: "Post-trial fix"
                  },
                  {
                    id: "Quality Check",
                    title: "Quality Check",
                    count: tailoringSummaryMetrics.qualityCheck,
                    icon: ShieldCheck,
                    border: "border-teal-200",
                    bg: "bg-teal-50/70 hover:bg-teal-100/80",
                    activeBg: "bg-teal-600 text-white ring-2 ring-teal-500",
                    text: "text-teal-900",
                    iconColor: "text-teal-600",
                    sub: "QC inspection"
                  },
                  {
                    id: "Ready",
                    title: "Ready",
                    count: tailoringSummaryMetrics.ready,
                    icon: CheckCircle2,
                    border: "border-emerald-200",
                    bg: "bg-emerald-50/70 hover:bg-emerald-100/80",
                    activeBg: "bg-emerald-600 text-white ring-2 ring-emerald-500",
                    text: "text-emerald-900",
                    iconColor: "text-emerald-600",
                    sub: "Ready for pickup"
                  },
                  {
                    id: "Delivered",
                    title: "Delivered",
                    count: tailoringSummaryMetrics.delivered,
                    icon: PackageCheck,
                    border: "border-emerald-300",
                    bg: "bg-emerald-50/50 hover:bg-emerald-100/70",
                    activeBg: "bg-slate-900 text-white ring-2 ring-slate-800",
                    text: "text-emerald-950",
                    iconColor: "text-emerald-700",
                    sub: "Collected"
                  }
                ].map(card => {
                  const Icon = card.icon;
                  const isActive = alterationsFilterStatus === card.id;
                  return (
                    <div
                      key={card.id}
                      onClick={() => setAlterationsFilterStatus(prev => prev === card.id ? "All" : card.id)}
                      className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none relative group ${isActive
                        ? `${card.activeBg} shadow-md -translate-y-0.5 scale-[1.02]`
                        : `${card.bg} ${card.border} hover:shadow-sm hover:-translate-y-0.5`
                        }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className={`p-1 rounded-md shrink-0 ${isActive ? "bg-white/20 text-white" : `${card.iconColor} bg-white shadow-2xs`}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-base sm:text-lg font-black font-mono leading-none ${isActive ? "text-white" : card.text}`}>
                          {card.count}
                        </span>
                      </div>
                      <div className="mt-0.5">
                        <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-tight leading-[13px] whitespace-normal break-words ${isActive ? "text-white" : "text-slate-800"}`}>
                          {card.title}
                        </p>
                        <p className={`text-[8.5px] font-medium leading-none mt-1 truncate ${isActive ? "text-white/80" : "text-slate-500"}`}>
                          {card.sub}
                        </p>
                      </div>
                    </div>
                  );
                })}
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
                  placeholder="Search customer name, phone, invoice #, tailor invoice #, ticket #, unique code, barcode..."
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
                    setAltCreationMode("SHOWROOM_PURCHASE");
                    setCogCustomerName("");
                    setCogCustomerPhone("");
                    setCogItems([COG_ITEM_DEFAULT()]);
                    setCogGender("Gents");
                    setCogServiceType("Custom Tailoring");
                    setSelectedAltInvoice(null);
                    setSelectedAltItem(null);
                    setAltInvoiceSearch("");
                    setAltInvoices([]);
                    setAltTailorName(tailorOptions[0] || "");
                    setAltPriority("Normal");
                    setAltDetails([]);
                    setAltCustomText("");
                    setAltMeasurements({});
                    setAltCharges(0);
                    setShowCreateAltModal(true);
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>New Alteration Ticket</span>
                </button>
                <button
                  onClick={() => fetchAlterations(false)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Stream</span>
                </button>
              </div>
            </div>

            {/* SOURCE, GENDER & STATUS FILTER BAR */}
            <div className="flex flex-col gap-2.5 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs font-sans">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Source Filter: ALL | ALTERATION FROM BILLING (SHOWROOM PURCHASE) | CUSTOMER OWN GARMENT */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-wider">Source:</span>
                  {[
                    { id: "All", label: "All Tickets" },
                    { id: "SHOWROOM_PURCHASE", label: "🏪 Alteration from Billing (Showroom Purchase)" },
                    { id: "CUSTOMER_OWN_GARMENT", label: "🧵 Customer Own Garment" }
                  ].map((src) => {
                    const isAct = altSourceFilter === src.id;
                    const count = src.id === "All"
                      ? alterationRecords.length
                      : alterationRecords.filter(a => (a.sourceType || (a.invoiceNumber === 'CUSTOMER-OWN-GARMENT' ? 'CUSTOMER_OWN_GARMENT' : 'SHOWROOM_PURCHASE')) === src.id).length;
                    return (
                      <button
                        key={src.id}
                        onClick={() => setAltSourceFilter(src.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${isAct
                          ? (src.id === 'CUSTOMER_OWN_GARMENT'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : src.id === 'SHOWROOM_PURCHASE'
                              ? 'bg-indigo-700 text-white shadow-xs'
                              : 'bg-slate-900 text-white shadow-xs')
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                          }`}
                      >
                        <span>{src.label} ({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Category Filter Pills: All | Gents | Ladies */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-wider">Category:</span>
                  {["All", "Gents", "Ladies"].map((g) => {
                    const isAct = altGenderFilter === g;
                    const count = g === "All"
                      ? alterationRecords.length
                      : alterationRecords.filter(a => (a.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(a.productName || '') ? 'Ladies' : 'Gents')) === g).length;
                    return (
                      <button
                        key={g}
                        onClick={() => setAltGenderFilter(g)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${isAct
                          ? (g === 'Ladies' ? 'bg-rose-600 text-white shadow-xs' : g === 'Gents' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-900 text-white shadow-xs')
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                          }`}
                      >
                        {g === 'Gents' && <span>👨</span>}
                        {g === 'Ladies' && <span>👩</span>}
                        <span>{g} ({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ALTERATIONS MASTER DATA TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                      <th className="p-3.5 w-24">Ticket #</th>
                      <th className="p-3.5 w-36 text-indigo-300 font-extrabold">Item Barcode / TI</th>
                      <th className="p-3.5 w-16">Alt Seq</th>
                      <th className="p-3.5 w-28">Invoice No / Source</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Product / Garment</th>
                      <th className="p-3.5 w-24">Master Tailor</th>
                      <th className="p-3.5 w-40">Measurements & Details</th>
                      <th className="p-3.5 w-24 text-right">Tailoring Charges</th>
                      <th className="p-3.5 w-28">Delivery & Priority</th>
                      <th className="p-3.5 w-32">Status Workflow</th>
                      <th className="p-3.5 w-36">Customer Notification</th>
                      <th className="p-3.5 w-24">Job Ticket Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    {alterationRecordsWithSequence
                      .filter(a => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const createdDateStr = a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '';
                        const delDateStr = a.deliveryDate || (a.expectedDeliveryDate ? new Date(a.expectedDeliveryDate).toISOString().split('T')[0] : '');
                        const st = (a.status || 'Pending').toLowerCase().trim();
                        const isDelivered = st === 'delivered' || st === 'collected' || st === 'closed';
                        const isReady = st === 'ready' || st === 'ready for delivery' || st === 'ready for pickup';

                        let matchesStatus = true;
                        if (alterationsFilterStatus === "All") {
                          matchesStatus = true;
                        } else if (alterationsFilterStatus === "Today's Jobs") {
                          matchesStatus = (createdDateStr === todayStr);
                        } else if (alterationsFilterStatus === "Due Today") {
                          matchesStatus = (!isDelivered && delDateStr === todayStr);
                        } else if (alterationsFilterStatus === "Overdue") {
                          matchesStatus = (!isDelivered && !isReady && delDateStr && delDateStr < todayStr);
                        } else if (alterationsFilterStatus === "Pending") {
                          matchesStatus = (st === 'pending' || st === 'received' || st === 'pending assignment');
                        } else if (alterationsFilterStatus === "In Cutting") {
                          matchesStatus = (st === 'in cutting' || st === 'cutting');
                        } else if (alterationsFilterStatus === "In Stitching" || alterationsFilterStatus === "In Progress") {
                          matchesStatus = (st === 'in stitching' || st === 'stitching' || st === 'in progress' || st === 'assigned');
                        } else if (alterationsFilterStatus === "In Trial" || alterationsFilterStatus === "Ready for Trial") {
                          matchesStatus = (st === 'in trial' || st === 'trial' || st === 'ready for trial');
                        } else if (alterationsFilterStatus === "Re-Alteration") {
                          matchesStatus = (st === 're-alteration' || st === 'realteration' || st === 'rework');
                        } else if (alterationsFilterStatus === "Quality Check") {
                          matchesStatus = (st === 'quality check' || st === 'qc' || st === 'qa');
                        } else if (alterationsFilterStatus === "Ready" || alterationsFilterStatus === "Ready for Delivery") {
                          matchesStatus = isReady;
                        } else if (alterationsFilterStatus === "Delivered") {
                          matchesStatus = isDelivered;
                        } else {
                          matchesStatus = (st === alterationsFilterStatus.toLowerCase());
                        }

                        if (!matchesStatus) return false;

                        const aSource = a.sourceType || (a.invoiceNumber === 'CUSTOMER-OWN-GARMENT' ? 'CUSTOMER_OWN_GARMENT' : 'SHOWROOM_PURCHASE');
                        const matchesSource = altSourceFilter === "All" || aSource === altSourceFilter;
                        if (!matchesSource) return false;

                        const aGender = a.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(a.productName || '') ? 'Ladies' : 'Gents');
                        const matchesGender = altGenderFilter === "All" || aGender === altGenderFilter;
                        if (!matchesGender) return false;

                        if (alterationsFilterType !== "All") {
                          const detailsStr = ((a.alterationDetails || []).join(" ") + " " + (a.instructions || "")).toLowerCase();
                          if (alterationsFilterType === "Others") {
                            // "Others" matches if it includes chest or has something that isn't one of the main categories
                            let isOther = false;
                            if (detailsStr.includes("chest")) isOther = true;
                            if (!isOther && detailsStr.length > 0) {
                              const hasStd = ["sleeve", "length shortening", "waist", "bottom", "shoulder", "neck"].some(std => detailsStr.includes(std));
                              if (!hasStd) isOther = true;
                            }
                            if (!isOther) return false;
                          } else {
                            const searchMap = {
                              "Sleeve": "sleeve",
                              "Length": "length shortening",
                              "Waist": "waist",
                              "Bottom": "bottom",
                              "Shoulder": "shoulder",
                              "Neck": "neck"
                            };
                            if (!detailsStr.includes(searchMap[alterationsFilterType])) return false;
                          }
                        }

                        if (!alterationSearchQuery.trim()) return true;
                        const q = alterationSearchQuery.toLowerCase().trim();
                        return (
                          (a.customerName || "").toLowerCase().includes(q) ||
                          (a.customerPhone || "").toLowerCase().includes(q) ||
                          (a.invoiceNumber || a.invoiceId || "").toLowerCase().includes(q) ||
                          (a.alterationId || "").toLowerCase().includes(q) ||
                          (a.alterationBarcode || "").toLowerCase().includes(q) ||
                          (a.tailorInvoiceNo || "").toLowerCase().includes(q) ||
                          (a.productName || "").toLowerCase().includes(q) ||
                          (a.sku || "").toLowerCase().includes(q) ||
                          (a.uniqueCode || "").toLowerCase().includes(q) ||
                          (a.barcode || "").toLowerCase().includes(q) ||
                          (a.tailorName || "").toLowerCase().includes(q) ||
                          (a.sourceType || "").toLowerCase().includes(q) ||
                          (a.garmentDescription || "").toLowerCase().includes(q) ||
                          (a.fabricDetails || "").toLowerCase().includes(q)
                        );
                      })
                      .map((alt) => {
                        const mKeys = Object.keys(alt.measurements || {});
                        const isReadyForDelivery = alt.status === "Ready for Delivery" || alt.status === "Ready";
                        return (
                          <tr key={alt._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-2 font-mono font-bold text-rose-600 whitespace-nowrap text-xs">
                              <div className="flex items-center gap-1">
                                <span>{alt.alterationId}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const text = alt.alterationId;
                                    navigator.clipboard.writeText(text);
                                    if (onAddNotification) onAddNotification("Copied", `Ticket ${text} copied to clipboard`, "success");
                                  }}
                                  className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                                  title="Copy Ticket ID"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="p-2 whitespace-nowrap font-mono font-bold text-xs text-indigo-700 bg-indigo-50/40 border-r border-indigo-100">
                              {alt.alterationBarcode || alt.tailorInvoiceNo ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded font-black text-[11px] tracking-tight">
                                    {alt.alterationBarcode || alt.tailorInvoiceNo}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const text = alt.alterationBarcode || alt.tailorInvoiceNo;
                                      navigator.clipboard.writeText(text);
                                      if (onAddNotification) onAddNotification("Copied", `Item Barcode ${text} copied to clipboard`, "success");
                                    }}
                                    className="text-indigo-400 hover:text-indigo-700 cursor-pointer transition-colors"
                                    title="Copy Item Barcode"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">N/A</span>
                              )}
                            </td>
                            <td className="p-2 whitespace-nowrap text-center font-mono font-bold text-slate-600 bg-slate-50 border-r border-l border-slate-100 text-[10px]">
                              {alt.alterationSequence}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              {alt.sourceType === 'CUSTOMER_OWN_GARMENT' ? (
                                <div className="flex flex-col items-start gap-0.5">
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-black tracking-tight shadow-2xs">
                                    🧵 Customer Own Garment
                                  </span>
                                  <span className="text-[9px] font-semibold text-emerald-600">Custom Tailoring</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-start gap-0.5">
                                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Showroom Purchase</span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInvoicePreview(alt.invoiceNumber || alt.invoiceId, alt.saleBillId)}
                                    className="font-mono font-bold text-indigo-600 hover:text-indigo-900 hover:underline bg-indigo-50/70 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-100 transition-all flex items-center gap-1 cursor-pointer shadow-2xs text-[10px]"
                                    title="Click to view full Invoice Receipt"
                                  >
                                    <FileText className="w-3 h-3 text-indigo-500" />
                                    <span>{alt.invoiceNumber || alt.invoiceId}</span>
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="p-3.5">
                              <p className="font-extrabold text-slate-800">{alt.customerName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{alt.customerPhone}</p>
                            </td>
                            <td className="p-3.5">
                              {(() => {
                                const altGender = alt.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(alt.productName || '') ? 'Ladies' : 'Gents');
                                return (
                                  <>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="font-bold text-slate-800">{alt.productName}</p>
                                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${altGender === 'Ladies'
                                        ? 'bg-pink-100 text-pink-700 border-pink-300'
                                        : 'bg-blue-100 text-blue-700 border-blue-300'
                                        }`}>
                                        {altGender}
                                      </span>
                                      {alt.sourceType === 'CUSTOMER_OWN_GARMENT' && (
                                        <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                                          Customer Own
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {alt.sourceType === 'CUSTOMER_OWN_GARMENT' ? (
                                        <span>Fabric/Color: <strong className="text-slate-600">{alt.color || 'Standard'}</strong> | Size: <strong className="text-slate-600">{alt.size || 'Custom'}</strong></span>
                                      ) : (
                                        <span>SKU: {alt.sku} | Size: {alt.size} / {alt.color}</span>
                                      )}
                                    </p>
                                  </>
                                );
                              })()}
                            </td>
                            <td className="p-3.5 font-bold text-slate-700">
                              <p>{alt.tailorName || 'Unassigned'}</p>
                              <button
                                type="button"
                                onClick={() => handleOpenTailorModal(alt)}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer block mt-0.5"
                                title="Assign or Change Tailor"
                              >
                                Edit
                              </button>
                            </td>
                            <td className="p-2 max-w-[12rem]">
                              <div className="flex flex-wrap gap-1 leading-tight">
                                {/* Service Type Badge with Gents / Ladies under Alteration */}
                                {(() => {
                                  const altGender = alt.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(alt.productName || '') ? 'Ladies' : 'Gents');
                                  return (
                                    <div className="flex flex-col items-start mb-1">
                                      <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-black border border-rose-200 uppercase">
                                        {alt.serviceType || 'Alteration'}
                                      </span>
                                      <span className={`text-[8px] font-black uppercase tracking-wider mt-0.5 px-1 py-0.2 rounded border ${altGender === 'Ladies' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                        {altGender}
                                      </span>
                                    </div>
                                  );
                                })()}
                                {alt.alterationDetails && alt.alterationDetails.length > 0 && alt.alterationDetails.some(d => d && !['Custom Fit', 'Standard Service', 'Alteration', 'alteration'].includes(d)) && (
                                  alt.alterationDetails.filter(d => d && !['Custom Fit', 'Standard Service', 'Alteration', 'alteration'].includes(d)).map((d, i) => (
                                    <span key={i} className="bg-rose-50 text-rose-700 px-1 py-[1px] rounded text-[10px] font-bold">
                                      {d}
                                    </span>
                                  ))
                                )}
                                {mKeys.length > 0 ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-mono text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                      {mKeys.slice(0, 4).map(k => `${k}: ${alt.measurements[k]}"`).join(', ')}
                                      {mKeys.length > 4 && ` +${mKeys.length - 4} more`}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenMeasurementModal(alt, false)}
                                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                                      title="Edit Measurements"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCustomerHistory(alt.customerPhone, alt.customerId, alt.customerName)}
                                      className="text-[10px] text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                                      title="View Customer Measurement History"
                                    >
                                      History
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenMeasurementModal(alt, false)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 hover:border-amber-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                                    >
                                      <Ruler className="w-3 h-3 text-amber-600" />
                                      <span>+ Add Measurements</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCustomerHistory(alt.customerPhone, alt.customerId, alt.customerName)}
                                      className="p-1 text-slate-400 hover:text-slate-700 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer"
                                      title="View Customer Measurement History"
                                    >
                                      <History className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                                {alt.specialInstructions && !['Custom Fitting', 'Standard Service', 'Alteration', 'alteration'].includes(alt.specialInstructions) && (
                                  <span className="text-[10px] text-slate-400 italic" title={alt.specialInstructions}>
                                    "{alt.specialInstructions}"
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 whitespace-nowrap text-right font-mono font-bold text-slate-800">
                              {(alt.totalCharges || alt.charge) ? (
                                <span className="text-emerald-700 font-extrabold text-xs">
                                  ₹{(alt.totalCharges || alt.charge).toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal italic text-[11px]">₹0</span>
                              )}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              {Boolean(alt.trialRequired && alt.trialDate) && (
                                <div className="mb-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenTrialModal(alt)}
                                    className="text-[9px] font-black uppercase text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                                    title="Click to view/edit Trial Details"
                                  >
                                    <Shirt className="w-2.5 h-2.5 text-purple-600 shrink-0" />
                                    <span>Trial: {alt.trialDate}</span>
                                  </button>
                                </div>
                              )}
                              <p className="font-mono font-bold text-xs text-slate-900">
                                <span className="text-[9px] text-slate-400 font-sans block uppercase leading-tight font-semibold">Delivery:</span>
                                {alt.deliveryDate || (alt.expectedDeliveryDate ? new Date(alt.expectedDeliveryDate).toISOString().split('T')[0] : 'N/A')}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${alt.priority === 'Express' ? 'bg-red-100 text-red-700' : alt.priority === 'Urgent' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {alt.priority || 'Normal'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeliveryDateModal(alt)}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                                  title="Change Delivery Date & Trial Details"
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <select
                                value={normalizeJobStatus(alt.status)}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  handleUpdateAlterationStatus(alt._id, newStatus);
                                  if (newStatus === 'In Trial') {
                                    handleOpenTrialModal({ ...alt, status: 'In Trial' });
                                  }
                                }}
                                className={`text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:ring-1 focus:ring-rose-500 border ${normalizeJobStatus(alt.status) === 'In Trial'
                                  ? 'bg-purple-50 border-purple-300 text-purple-950 ring-1 ring-purple-400'
                                  : mKeys.length === 0 && normalizeJobStatus(alt.status) !== 'Ready for Delivery' && normalizeJobStatus(alt.status) !== 'Ready' && normalizeJobStatus(alt.status) !== 'Delivered'
                                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                                    : 'bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                              >
                                <option value="Pending">Pending {mKeys.length === 0 ? '(Needs Meas)' : ''}</option>
                                <option value="In Cutting">In Cutting</option>
                                <option value="In Stitching">In Stitching</option>
                                <option value="In Trial">In Trial</option>
                                <option value="Re-Alteration">Re-Alteration</option>
                                <option value="Quality Check">Quality Check</option>
                                <option value="Ready">Ready</option>
                                <option value="Ready for Delivery">Ready for Delivery</option>
                                <option
                                  value="Delivered"
                                  disabled={!['Ready', 'Ready for Delivery'].includes(normalizeJobStatus(alt.status))}
                                >
                                  Delivered
                                </option>
                                <option value="Cancelled">Cancelled</option>
                              </select>

                              {/* Action Tab when in Trial or Re-Alteration stage */}
                              {['In Trial', 'Ready for Trial', 'Re-Alteration'].includes(normalizeJobStatus(alt.status)) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenTrialModal(alt)}
                                  className={`mt-1.5 w-full inline-flex items-center justify-center gap-1 px-2 py-1 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-xs hover:shadow transition-all cursor-pointer transform active:scale-95 ${normalizeJobStatus(alt.status) === 'Re-Alteration'
                                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                                    }`}
                                  title="View / Edit Trial Assessment, Measurements & Changes"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  <span>{normalizeJobStatus(alt.status) === 'Re-Alteration' ? 'Re-Alter Trial ✎' : 'Trial Action ✎'}</span>
                                </button>
                              )}

                              {/* Details under status workflow when showing Re-Alteration */}
                              {normalizeJobStatus(alt.status) === 'Re-Alteration' && (() => {
                                const activeMeas = (alt.measurements && typeof alt.measurements === 'object' && Object.keys(alt.measurements).length > 0)
                                  ? alt.measurements
                                  : (alt.items?.[0]?.measurements && typeof alt.items[0].measurements === 'object' && Object.keys(alt.items[0].measurements).length > 0)
                                    ? alt.items[0].measurements
                                    : {};
                                const measEntries = Object.entries(activeMeas).filter(([_, v]) => v !== null && v !== '' && v !== undefined && String(v).trim() !== '');
                                const hasRemarks = Boolean(alt.remarks || alt.specialInstructions || alt.customAlterationText);
                                const hasFitting = Boolean(alt.fittingResult);
                                const hasChanges = Boolean(alt.requiredChanges);
                                const hasAnyInfo = hasFitting || hasChanges || hasRemarks || measEntries.length > 0;

                                return (
                                  <div
                                    onClick={() => handleOpenTrialModal(alt)}
                                    className="mt-1.5 p-2.5 bg-red-50/95 hover:bg-red-100/90 border border-red-200 hover:border-red-300 rounded-xl space-y-1.5 text-left cursor-pointer transition-all shadow-2xs group"
                                    title="Click to view / edit re-alteration trial details & measurements"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-red-900 uppercase text-[9px] flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse inline-block" />
                                        <span>Re-Alter Details</span>
                                      </span>
                                      <span className="text-[9px] text-red-600 font-bold group-hover:underline flex items-center gap-0.5">
                                        <span>Edit</span> ✎
                                      </span>
                                    </div>

                                    {/* Fitting & Changes Remarks */}
                                    {(hasFitting || hasChanges || hasRemarks) && (
                                      <div className="text-[10px] leading-snug space-y-0.5 bg-white/70 p-1.5 rounded-lg border border-red-100">
                                        {alt.fittingResult && (
                                          <p className="font-medium text-slate-800 text-[10px] break-words">
                                            <strong className="text-slate-600 font-bold">Fit:</strong> {alt.fittingResult}
                                          </p>
                                        )}
                                        {alt.requiredChanges && (
                                          <p className="font-bold text-red-700 text-[10px] break-words">
                                            <strong className="text-red-900">Changes:</strong> {alt.requiredChanges}
                                          </p>
                                        )}
                                        {hasRemarks && (
                                          <p className="font-medium text-slate-800 text-[10px] break-words">
                                            <strong className="text-red-950 font-bold">Remarks:</strong> {alt.remarks || (!['Custom Fitting', 'Standard Service', 'Alteration', 'alteration'].includes(alt.specialInstructions) ? alt.specialInstructions : null) || alt.customAlterationText}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {/* After-Trial Measurements */}
                                    {measEntries.length > 0 && (
                                      <div className="pt-1 border-t border-red-200/80">
                                        <span className="font-extrabold text-red-900 uppercase text-[9px] block mb-1 flex items-center gap-1">
                                          <span>📏</span>
                                          <span>After-Trial Measurements:</span>
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                          {measEntries.map(([k, v]) => (
                                            <span key={k} className="text-[9px] font-mono font-bold bg-white text-slate-900 border border-red-200 px-1.5 py-0.5 rounded shadow-2xs inline-flex items-center gap-0.5">
                                              <span className="text-red-700 font-sans">{k}:</span>
                                              <span>{String(v).endsWith('"') ? v : `${v}"`}</span>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {!hasAnyInfo && (
                                      <p className="text-[9px] text-red-600/80 italic">
                                        + Click to enter trial measurements & remarks
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}

                              {normalizeJobStatus(alt.status) !== 'Re-Alteration' && alt.fittingResult && (
                                <p className="text-[9px] text-purple-700 font-medium mt-1 truncate max-w-[120px]" title={`Fitting: ${alt.fittingResult}${alt.requiredChanges ? ` | Changes: ${alt.requiredChanges}` : ''}`}>
                                  ✓ {alt.fittingResult}
                                </p>
                              )}
                            </td>
                            {/* FEATURE 1: WHATSAPP NOTIFY CUSTOMER BUTTON */}
                            <td className="p-3.5">
                              {isReadyForDelivery ? (
                                <button
                                  type="button"
                                  onClick={() => openWhatsAppModal(alt)}
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
                                title="Print / View Receipt"
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
                          {alterationsLoading ? (
                            <span className="inline-flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading alteration records...</span>
                          ) : alterationsLoadError ? (
                            <span className="inline-flex flex-col items-center gap-2 text-rose-500">
                              <span>{alterationsLoadError}</span>
                              <button type="button" onClick={fetchAlterations} className="rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-slate-700">Retry</button>
                            </span>
                          ) : (
                            'No alteration records logged yet. Click "ALTERATION" in POS Billing to add job tickets.'
                          )}
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
        {activeStudioTab === "reports" && (() => {
          const currentReportConfig = TAILORING_REPORT_TYPES.find(r => r.id === tailoringReportType) || TAILORING_REPORT_TYPES[0];
          const todayDateStr = new Date().toISOString().split('T')[0];

          return (
            <div className="space-y-5 animate-fade-in">

              {/* ─── 1. UNIFIED EXECUTIVE KPI SUMMARY ROW (NO CARDS IN MIDDLE) ─── */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Report Records</p>
                    <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                      <FileText className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                    {filteredTailoringSummary.totalRecords}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate" title={currentReportConfig.label}>
                    {currentReportConfig.label}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Pending Jobs</p>
                    <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-amber-600 font-mono mt-1">
                    {filteredTailoringSummary.pendingJobs}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    In cutting & stitching
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-200 transition-all">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Overdue Alerts</p>
                    <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-rose-600 font-mono mt-1">
                    {tailoringReportType === 'overdue_tailoring_jobs' ? filteredTailoringRows.length : (filteredTailoringSummary.overdueJobs || filteredAlterationRecords.filter(a => a.deliveryDate && a.deliveryDate < todayDateStr && !['Delivered', 'Collected', 'Closed'].includes(a.status)).length)}
                  </p>
                  <p className="text-[10px] text-rose-500 font-medium mt-0.5">
                    Past delivery deadline
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Ready in Showroom</p>
                    <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <PackageCheck className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-indigo-600 font-mono mt-1">
                    {filteredTailoringSummary.readyNotCollected || filteredAlterationRecords.filter(a => ['Ready for Delivery', 'Ready'].includes(a.status)).length}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Awaiting customer pickup
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all col-span-2 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Tailoring Revenue</p>
                    <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <DollarSign className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
                    ₹{Number(filteredTailoringSummary.totalCharges || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Total charges ledger
                  </p>
                </div>
              </div>

              {/* ─── 2. THE 9 REPORT CATEGORIES (STYLISH NAVIGATION PILL BAR) ─── */}
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  {TAILORING_REPORT_TYPES.map((rep) => {
                    const Icon = rep.icon;
                    const isActive = tailoringReportType === rep.id;
                    return (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => setTailoringReportType(rep.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all cursor-pointer ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-300 scale-[1.01]"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
                        }`}
                      >
                        <Icon className={`w-3 h-3 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span>{rep.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── 3. ACTIVE REPORT CONTAINER & TOOLBAR ─── */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {/* TOOLBAR HEADER */}
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      {React.createElement(currentReportConfig.icon, { className: "w-4 h-4" })}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                          {currentReportConfig.label}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {filteredTailoringRows.length} {filteredTailoringRows.length === 1 ? 'record' : 'records'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{currentReportConfig.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowVisualAnalytics(prev => !prev)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        showVisualAnalytics ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                      title="Toggle visual status breakdown"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>{showVisualAnalytics ? "Hide Analytics" : "Visual Analytics"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={fetchTailoringReport}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                      title="Refresh Report Data"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleExportReportsCSV}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* FILTERS & SEARCH ROW */}
                <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-[220px] max-w-sm relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={reportSearchQuery}
                      onChange={(e) => setReportSearchQuery(e.target.value)}
                      placeholder="Search ticket #, customer, phone, tailor, garment..."
                      className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {reportSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setReportSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={filterDateRange}
                      onChange={(e) => setFilterDateRange(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="All">Date: All Time</option>
                      <option value="Today">Today</option>
                      <option value="ThisWeek">This Week</option>
                      <option value="ThisMonth">This Month</option>
                    </select>

                    <select
                      value={filterEmployee}
                      onChange={(e) => setFilterEmployee(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="All">Tailor: All</option>
                      {tailorOptions.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>

                    {!['pending_tailoring_jobs', 'overdue_tailoring_jobs', 'ready_not_collected', 'tailor_workload', 'tailor_completed_jobs', 'customer_tailoring_history'].includes(tailoringReportType) && (
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="All">Status: All</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Ready for Trial">Ready for Trial</option>
                        <option value="Ready for Delivery">Ready for Delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    )}

                    {!['tailor_workload', 'tailor_completed_jobs', 'customer_tailoring_history', 'tailoring_charges'].includes(tailoringReportType) && (
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="All">Priority: All</option>
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Express">Express</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* ─── 4. STRUCTURED DATA TABLES FOR EACH REPORT TYPE ─── */}
                <div className="overflow-x-auto">
                  {/* CASE 1: TAILOR-WISE WORKLOAD */}
                  {tailoringReportType === "tailor_workload" && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                          <th className="p-3.5">Master Tailor</th>
                          <th className="p-3.5">Pending Jobs Queue</th>
                          <th className="p-3.5">Active Value (₹)</th>
                          <th className="p-3.5">Capacity Status</th>
                          <th className="p-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredTailoringRows.map((row, idx) => {
                          const count = Number(row.pendingJobs || 0);
                          const isHigh = count > 6;
                          const isMedium = count > 3;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xs">
                                  {(row.tailorName || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span>{row.tailorName || 'Unassigned'}</span>
                              </td>
                              <td className="p-3.5">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-black text-sm text-slate-900 min-w-[24px]">{count}</span>
                                  <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${Math.min(100, count * 12.5)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 font-mono font-bold text-slate-800">
                                ₹{Number(row.totalCharges || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1 ${
                                  isHigh ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  isMedium ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                  {isHigh ? 'High Workload' : isMedium ? 'Moderate' : 'Available'}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTailoringReportType("pending_tailoring_jobs");
                                    setFilterEmployee(row.tailorName);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] hover:underline"
                                >
                                  View Jobs →
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* CASE 2: TAILOR-WISE COMPLETED JOBS */}
                  {tailoringReportType === "tailor_completed_jobs" && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                          <th className="p-3.5">Master Tailor</th>
                          <th className="p-3.5">Completed Alterations</th>
                          <th className="p-3.5">Total Value Handled (₹)</th>
                          <th className="p-3.5">Throughput Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredTailoringRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs">
                                {(row.tailorName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span>{row.tailorName || 'Unassigned'}</span>
                            </td>
                            <td className="p-3.5">
                              <span className="font-mono font-black text-sm text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                                {row.completedJobs || 0} Delivered
                              </span>
                            </td>
                            <td className="p-3.5 font-mono font-bold text-slate-800">
                              ₹{Number(row.totalCharges || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-3.5">
                              <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-emerald-600" />
                                {Number(row.completedJobs || 0) > 10 ? 'Top Producer' : 'Active Producer'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* CASE 3: RE-ALTERATION REPORT */}
                  {tailoringReportType === "realteration" && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                          <th className="p-3.5">Rework Ticket #</th>
                          <th className="p-3.5">Date Logged</th>
                          <th className="p-3.5">Customer</th>
                          <th className="p-3.5">Garment</th>
                          <th className="p-3.5">Assigned Tailor</th>
                          <th className="p-3.5">Rework Instructions</th>
                          <th className="p-3.5">Priority</th>
                          <th className="p-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredTailoringRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-rose-600">
                              <span className="bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                {row.tailorInvoiceNo || row.pssmNo || 'REWORK'}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                              {formatReportDateTime(row.createdAt || row.jobDate)}
                            </td>
                            <td className="p-3.5">
                              <p className="font-bold text-slate-900">{row.customerName}</p>
                              {row.mobileNumber && <p className="text-[10px] text-slate-400 font-mono">{row.mobileNumber}</p>}
                            </td>
                            <td className="p-3.5 font-medium text-slate-800">{row.garment || row.productName || 'Garment'}</td>
                            <td className="p-3.5 font-bold text-slate-700">{row.tailorName || 'Unassigned'}</td>
                            <td className="p-3.5 max-w-[220px]">
                              <p className="text-[11px] text-slate-700 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                                {row.instructions || 'Customer requested refitting'}
                              </p>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                                {row.priority || 'Urgent'}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                                {row.status || 'Re-Alteration'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* CASE 4: TAILORING CHARGES REPORT */}
                  {tailoringReportType === "tailoring_charges" && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                          <th className="p-3.5">Tailor Invoice No</th>
                          <th className="p-3.5">Job Date</th>
                          <th className="p-3.5">Customer</th>
                          <th className="p-3.5">Tailor</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Total Charge</th>
                          <th className="p-3.5">Advance Paid</th>
                          <th className="p-3.5">Balance Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredTailoringRows.map((row, idx) => {
                          const charge = Number(row.tailoringCharges || 0);
                          const advance = Number(row.advancePaid || 0);
                          const balance = Number(row.balance || (charge - advance));
                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3.5 font-mono font-bold text-indigo-700">
                                <span className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                                  {row.tailorInvoiceNo || '-'}
                                </span>
                              </td>
                              <td className="p-3.5 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                                {formatReportDate(row.jobDate)}
                              </td>
                              <td className="p-3.5 font-bold text-slate-900">{row.customerName}</td>
                              <td className="p-3.5 font-medium text-slate-700">{row.tailorName || 'Unassigned'}</td>
                              <td className="p-3.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                  {row.status || 'Pending'}
                                </span>
                              </td>
                              <td className="p-3.5 font-mono font-bold text-slate-900">₹{charge.toLocaleString('en-IN')}</td>
                              <td className="p-3.5 font-mono text-emerald-700 font-bold">₹{advance.toLocaleString('en-IN')}</td>
                              <td className="p-3.5 font-mono font-black">
                                <span className={balance > 0 ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded" : "text-slate-400"}>
                                  ₹{balance.toLocaleString('en-IN')}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* CASE 5: CUSTOMER TAILORING HISTORY */}
                  {tailoringReportType === "customer_tailoring_history" && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                          <th className="p-3.5">Customer Name</th>
                          <th className="p-3.5">Mobile Number</th>
                          <th className="p-3.5">Total Alterations</th>
                          <th className="p-3.5">Completed Garments</th>
                          <th className="p-3.5">Total Spent (₹)</th>
                          <th className="p-3.5">Last Visited Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredTailoringRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900">{row.customerName}</td>
                            <td className="p-3.5 font-mono text-slate-600">{row.mobileNumber || '-'}</td>
                            <td className="p-3.5 font-mono font-bold text-slate-900">{row.totalJobs || 0}</td>
                            <td className="p-3.5 font-mono font-bold text-emerald-600">{row.completedJobs || 0}</td>
                            <td className="p-3.5 font-mono font-black text-slate-900">
                              ₹{Number(row.totalCharges || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-3.5 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                              {formatReportDate(row.lastJobDate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* CASE 6: DEFAULT JOB LISTS (Daily Tailoring Jobs, Pending Jobs, Overdue Jobs, Ready but Not Collected) */}
                  {!['tailor_workload', 'tailor_completed_jobs', 'realteration', 'tailoring_charges', 'customer_tailoring_history'].includes(tailoringReportType) && (
                    <table className="w-full text-left border-collapse text-xs" style={{tableLayout:'fixed'}}>
                      <colgroup>
                        <col style={{width:'120px'}} />
                        <col style={{width:'100px'}} />
                        <col style={{width:'180px'}} />
                        <col style={{width:'130px'}} />
                        <col style={{width:'80px'}} />
                        <col style={{width:'90px'}} />
                        <col style={{width:'80px'}} />
                        <col style={{width:'110px'}} />
                      </colgroup>
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                          <th className="px-2 py-2">Ticket / Date</th>
                          <th className="px-2 py-2">Delivery</th>
                          <th className="px-2 py-2">Customer & Garment</th>
                          <th className="px-2 py-2">Tailor</th>
                          <th className="px-2 py-2">Priority</th>
                          <th className="px-2 py-2">Status</th>
                          <th className="px-2 py-2">Charges</th>
                          <th className="px-2 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredTailoringRows.map((row, idx) => {
                          const isOverdue = row.expectedDeliveryDate && row.expectedDeliveryDate < todayDateStr && !['ready', 'delivered', 'collected'].includes(String(row.status || '').toLowerCase());
                          const isReady = String(row.status || '').toLowerCase().includes('ready');
                          const rowObj = row._id ? row : null;
                          return (
                            <tr key={idx} className={`hover:bg-slate-50/80 transition-colors ${isOverdue ? 'bg-rose-50/30' : ''}`}>
                              {/* Col 1: Ticket + Date */}
                              <td className="px-2 py-2 align-middle">
                                <span className="bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-mono font-bold text-indigo-700 text-[10px] block truncate" title={row.tailorInvoiceNo || '-'}>
                                  {row.tailorInvoiceNo || '-'}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono block mt-0.5 truncate">
                                  {formatReportDateTime(row.jobDate || row.createdAt)}
                                </span>
                              </td>
                              {/* Col 2: Delivery */}
                              <td className="px-2 py-2 align-middle">
                                <span className={`text-[10px] font-bold block truncate ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                                  {formatReportDate(row.expectedDeliveryDate)}
                                </span>
                                {isOverdue && <span className="text-[8px] font-black uppercase text-rose-600 bg-rose-50 px-1 py-0.5 rounded mt-0.5 inline-block">OVERDUE</span>}
                              </td>
                              {/* Col 3: Customer + Garment */}
                              <td className="px-2 py-2 align-middle">
                                <p className="font-bold text-slate-900 text-[11px] truncate" title={row.customerName}>{row.customerName || 'Walk-in'}</p>
                                {row.mobileNumber && <p className="text-[9px] text-slate-400 font-mono truncate">{row.mobileNumber}</p>}
                                <p className="text-[10px] text-slate-600 truncate" title={row.garmentService}>{row.garmentService || 'Alteration'}</p>
                              </td>
                              {/* Col 4: Tailor */}
                              <td className="px-2 py-2 align-middle">
                                <span className="font-bold text-slate-800 text-[10px] block truncate" title={row.tailorName}>
                                  {row.tailorName || 'Unassigned'}
                                </span>
                              </td>
                              {/* Col 5: Priority */}
                              <td className="px-2 py-2 align-middle">
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap ${
                                  String(row.priority).toLowerCase() === 'urgent' ? 'bg-rose-100 text-rose-800' :
                                  String(row.priority).toLowerCase() === 'express' ? 'bg-purple-100 text-purple-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {row.priority || 'Normal'}
                                </span>
                              </td>
                              {/* Col 6: Status */}
                              <td className="px-2 py-2 align-middle">
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide inline-flex items-center gap-1 whitespace-nowrap ${
                                  isReady ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                  String(row.status || '').toLowerCase() === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  String(row.status || '').toLowerCase().includes('overdue') || isOverdue ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  <span className={`w-1 h-1 rounded-full flex-shrink-0 ${isReady ? 'bg-indigo-500' : String(row.status || '').toLowerCase() === 'delivered' ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                  <span className="truncate max-w-[60px]" title={row.status}>{row.status || 'Pending'}</span>
                                </span>
                              </td>
                              {/* Col 7: Charges */}
                              <td className="px-2 py-2 align-middle font-mono font-bold text-slate-900 text-[11px] whitespace-nowrap">
                                ₹{Number(row.tailoringCharges || 0).toLocaleString('en-IN')}
                              </td>
                              {/* Col 8: Actions — always shown */}
                              <td className="px-2 py-2 align-middle">
                                <div className="flex items-center justify-center gap-1">
                                  {/* WhatsApp notification */}
                                  <button
                                    type="button"
                                    onClick={() => openWhatsAppModal(row)}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      isReady && row.mobileNumber
                                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-400'
                                    }`}
                                    title={isReady ? 'Notify customer on WhatsApp' : 'Notify (available when Ready)'}
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                  </button>
                                  {/* Print job slip */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Build a ticket-like obj from row and open the modal
                                      const altMatch = (alterationRecords || []).find(a => a._id === row._id || a.tailorInvoiceNo === row.tailorInvoiceNo || a.alterationId === row.alterationId);
                                      setSelectedJobTicket(altMatch || {
                                        ...row,
                                        alterationId: row.tailorInvoiceNo || row.alterationId || row._id,
                                        alterationBarcode: row.alterationBarcode || row.tailorInvoiceNo || row.barcode,
                                        tailorInvoiceNo: row.tailorInvoiceNo,
                                        customerPhone: row.mobileNumber || row.customerPhone,
                                        totalCharges: row.tailoringCharges || 0,
                                        serviceType: row.garmentService || 'Alteration',
                                        alterationDetails: row.garmentService ? [row.garmentService] : ['Alteration'],
                                        barcode: row.alterationBarcode || row.tailorInvoiceNo || row._id
                                      });
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 transition-colors cursor-pointer"
                                    title="Print / View Job Slip"
                                  >
                                    <Printer className="w-3 h-3" />
                                  </button>
                                  {/* Reassign tailor */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const altMatch = (alterationRecords || []).find(a => a._id === row._id || a.tailorInvoiceNo === row.tailorInvoiceNo);
                                      if (altMatch) handleOpenTailorModal(altMatch);
                                      else if (onAddNotification) onAddNotification('Info', 'Open the Alterations tab to reassign tailor for this job.', 'info');
                                    }}
                                    className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer"
                                    title="Reassign Master Tailor"
                                  >
                                    <Scissors className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* EMPTY STATE */}
                  {filteredTailoringRows.length === 0 && (
                    <div className="p-12 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                        <Filter className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-black uppercase text-slate-700">No records found</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        No tailoring records match the selected filters for {currentReportConfig.label}. Try adjusting the date range or tailor filter.
                      </p>
                      {(filterDateRange !== "All" || filterEmployee !== "All" || filterStatus !== "All" || reportSearchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilterDateRange("All");
                            setFilterEmployee("All");
                            setFilterStatus("All");
                            setFilterPriority("All");
                            setReportSearchQuery("");
                          }}
                          className="mt-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 cursor-pointer inline-block"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ─── 5. COLLAPSIBLE VISUAL BREAKDOWN & ANALYTICS DRAWER ─── */}
              {showVisualAnalytics && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        Visual Breakdown & Volume Analytics
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Live Studio Analytics</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* CHART 1: STATUS BREAKDOWN */}
                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Status Distribution</h4>
                      {["Pending", "In Progress", "Ready for Trial", "Ready for Delivery", "Delivered", "Cancelled"].map(st => {
                        const count = filteredAlterationRecords.filter(a => a.status === st).length;
                        const pct = filteredAlterationRecords.length ? Math.round((count / filteredAlterationRecords.length) * 100) : 0;
                        return (
                          <div key={st} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-700">{st}</span>
                              <span className="font-mono text-slate-500">{count} jobs ({pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${st === 'Delivered' ? 'bg-emerald-500' : st === 'Ready for Delivery' ? 'bg-indigo-500' : st === 'In Progress' ? 'bg-amber-500' : st === 'Cancelled' ? 'bg-rose-500' : 'bg-slate-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* CHART 2: GARMENT TYPE BREAKDOWN */}
                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Garment Category Breakdown</h4>
                      {["Shirt", "Pant", "Suit", "Kurta", "Sherwani", "Blazer"].map(g => {
                        const count = filteredAlterationRecords.filter(a => (a.productName || '').toLowerCase().includes(g.toLowerCase())).length;
                        const pct = filteredAlterationRecords.length ? Math.round((count / filteredAlterationRecords.length) * 100) : 0;
                        return (
                          <div key={g} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-700">{g}</span>
                              <span className="font-mono text-slate-500">{count} garments ({pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden">
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
              )}

            </div>
          );
        })()}

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
              {(performanceData?.metrics || (defaultTailors || []).map((t, idx) => {
                if (!t) return null;
                const tailorAlts = alterationRecords.filter(a => a.tailorName === t.name);
                const assignedCount = tailorAlts.length || t.jobs || 0;
                const completedCount = tailorAlts.filter(a => a.status === 'Delivered' || a.status === 'Ready for Delivery').length;
                const pendingCount = tailorAlts.filter(a => a.status === 'Pending' || a.status === 'Assigned').length;
                const inProgressCount = tailorAlts.filter(a => a.status === 'In Progress').length;
                const readyForDeliveryCount = tailorAlts.filter(a => a.status === 'Ready for Delivery').length;
                const delayedCount = tailorAlts.filter(a => a.deliveryDate && a.deliveryDate < new Date().toISOString().split('T')[0] && a.status !== 'Delivered').length;
                const completionPct = assignedCount ? Math.round((completedCount / assignedCount) * 100) : 100;
                const availabilityStatus = t?.availability || (inProgressCount >= 5 ? 'Busy' : 'Available');

                let performanceIndicator = 'Good';
                if (completionPct >= 85 && delayedCount === 0) performanceIndicator = 'Excellent';
                else if (completionPct >= 65) performanceIndicator = 'Good';
                else if (completionPct >= 45) performanceIndicator = 'Average';
                else performanceIndicator = 'Needs Attention';

                return {
                  employeeId: `EMP-TR-${101 + idx}`,
                  employeeName: t?.name || 'Master Tailor',
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

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-500">Message type</label>
              <select
                value={whatsappMessageType}
                onChange={(event) => {
                  const type = event.target.value;
                  setWhatsappMessageType(type);
                  setWhatsappMessage(getWhatsAppMessageForType(whatsappModalTarget, type));
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="received">Tailoring job received confirmation</option>
                <option value="measurement_confirmation">Measurement / job confirmation</option>
                <option value="trial_reminder">Trial reminder</option>
                <option value="ready_collection">Ready for collection message</option>
                <option value="delay">Delay / revised date message</option>
                <option value="collection_reminder">Delivery / collection reminder</option>
                <option value="payment_reminder">Payment reminder</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-500">Edit message before sending</label>
              <textarea
                value={whatsappMessage}
                onChange={(event) => setWhatsappMessage(event.target.value)}
                rows={9}
                className="w-full resize-y rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-[11px] text-emerald-900 leading-relaxed outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
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
                ALTERATION TICKET
              </div>
              <div className="text-center text-[10px] text-slate-500">
                Bespoke Tailoring & Garment Fitting Slip
              </div>
              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="flex justify-between items-center">
                <span>Ticket #: <strong className="text-rose-600 font-mono">{selectedJobTicket.alterationId}</strong></span>
                <span>Date: {selectedJobTicket.createdAt ? new Date(selectedJobTicket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}</span>
              </div>

              {/* Prominent Item Alteration Barcode Card */}
              {(() => {
                const itemBarcode = selectedJobTicket.alterationBarcode || selectedJobTicket.tailorInvoiceNo || selectedJobTicket.barcode || selectedJobTicket.alterationId;
                return (
                  <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-200 rounded-xl p-2.5 my-2 flex items-center justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-indigo-700">
                        <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Item Alteration Barcode</span>
                      </div>
                      <div className="font-mono font-black text-sm text-indigo-950 tracking-wider mt-0.5">
                        {itemBarcode}
                      </div>
                    </div>
                    {selectedJobTicket.tailorInvoiceNo && (
                      <div className="text-right pl-2 border-l border-indigo-200/80">
                        <div className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider">TI Number</div>
                        <div className="font-mono font-bold text-xs text-indigo-900">{selectedJobTicket.tailorInvoiceNo}</div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <span>Source: <strong className={selectedJobTicket.sourceType === 'CUSTOMER_OWN_GARMENT' ? 'text-emerald-700' : 'text-indigo-700'}>{selectedJobTicket.sourceType === 'CUSTOMER_OWN_GARMENT' ? '🧵 Customer Own Garment / Fabric' : '🏪 Showroom Purchase (Billing)'}</strong></span>
              </div>
              {selectedJobTicket.sourceType !== 'CUSTOMER_OWN_GARMENT' && selectedJobTicket.invoiceNumber && selectedJobTicket.invoiceNumber !== 'CUSTOMER-OWN-GARMENT' && (
                <div>
                  <span>Target Invoice: <strong>{selectedJobTicket.invoiceNumber || selectedJobTicket.invoiceId}</strong></span>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <span>Customer: <strong>{selectedJobTicket.customerName}</strong></span>
                <span>Mobile: {selectedJobTicket.customerPhone}</span>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="space-y-1">
                <p className="font-bold text-slate-900 uppercase">Garment Specs:</p>
                <p>{selectedJobTicket.productName}</p>
                <p className="text-[10px] text-slate-500">SKU: {selectedJobTicket.sku || 'N/A'} | Size: {selectedJobTicket.size || 'M'} | Color: {selectedJobTicket.color || 'Standard'}</p>
                <p className="text-[10px]">Item Barcode: <strong className="font-mono font-bold text-indigo-700">{selectedJobTicket.alterationBarcode || selectedJobTicket.tailorInvoiceNo || selectedJobTicket.barcode || 'N/A'}</strong></p>
                <p className="text-[10px]">Master Tailor: <strong>{selectedJobTicket.tailorName || 'Unassigned'}</strong></p>
                <p className="text-[10px]">Staff: {selectedJobTicket.salespersonName || 'Store Cashier'}</p>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              {/* Measurements */}
              <div>
                <p className="font-bold text-slate-900 uppercase mb-1">Measurements (Inches):</p>
                {Object.keys(selectedJobTicket.measurements || {}).length > 0 ? (
                  <div className="space-y-1">
                    <div className="grid grid-cols-2 gap-1 text-[10px] bg-white p-2 rounded border border-slate-200 font-mono">
                      {Object.entries(selectedJobTicket.measurements).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-500">{k}:</span>
                          <span className="font-bold">{v}"</span>
                        </div>
                      ))}
                    </div>
                    {(() => {
                      const m = selectedJobTicket.measurements || {};
                      const ins = m.inseam || m.innerLegLength || m.Inseam || m['Inner Leg Length'];
                      if (!ins) return null;
                      return (
                        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-1.5 rounded font-mono font-bold text-[10px]">
                          Inseam / Inner Leg Length: {ins}"
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">No specific inches entered</p>
                )}
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              {/* Alterations */}
              <div>
                <p className="font-bold text-slate-900 uppercase mb-1">Services / Work:</p>
                <div className="flex flex-wrap gap-1">
                  {((selectedJobTicket.alterationDetails && selectedJobTicket.alterationDetails.length > 0) ? selectedJobTicket.alterationDetails : [selectedJobTicket.serviceType || 'Standard Service']).map((d, i) => (
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

              {/* Delivery & Financial Details */}
              <div className="space-y-1 bg-rose-50 p-2.5 rounded border border-rose-200 text-rose-900">
                <div className="flex justify-between font-bold">
                  <span>Delivery Date:</span>
                  <span>{selectedJobTicket.deliveryDate || 'Scheduled'} {selectedJobTicket.deliveryTime || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Trial:</span>
                  <span>{selectedJobTicket.trialDate || 'N/A'}</span>
                </div>
                <div className="border-t border-rose-200/60 my-1" />
                <div className="flex justify-between font-bold">
                  <span>Tailoring Charges:</span>
                  <span>₹{selectedJobTicket.totalCharges || selectedJobTicket.charge || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Advance Paid:</span>
                  <span>₹{selectedJobTicket.advancePaid || 0}</span>
                </div>
                <div className="flex justify-between font-extrabold text-amber-900">
                  <span>Balance Due:</span>
                  <span>₹{selectedJobTicket.balanceDue || 0}</span>
                </div>
                <div className="border-t border-rose-200/60 my-1" />
                <div className="flex justify-between">
                  <span>Job Priority:</span>
                  <span className="uppercase font-extrabold">{selectedJobTicket.priority || 'Normal'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Workflow Status:</span>
                  <span className="uppercase font-extrabold">{selectedJobTicket.status || 'Pending'}</span>
                </div>
              </div>

              {/* Barcode Graphic */}
              {(() => {
                const itemBarcode = selectedJobTicket.alterationBarcode || selectedJobTicket.tailorInvoiceNo || selectedJobTicket.barcode || selectedJobTicket.alterationId;
                const barcodeSvg = generateCode128SvgString(itemBarcode, {
                  width: 1.8,
                  height: 44,
                  displayValue: false,
                  margin: 4,
                  background: '#ffffff',
                  lineColor: '#000000'
                });
                return (
                  <div className="bg-slate-900 text-white rounded-xl p-3 text-center font-mono my-2 space-y-1.5 shadow-md">
                    <div className="flex items-center justify-center gap-1.5">
                      <Barcode className="w-4 h-4 text-indigo-400" />
                      <p className="text-[10px] text-indigo-300 font-black uppercase tracking-wider">ITEM LEVEL ALTERATION BARCODE</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg inline-block text-slate-900 shadow-inner max-w-full">
                      <div
                        className="flex items-center justify-center overflow-hidden [&>svg]:max-w-full [&>svg]:h-auto"
                        dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                      />
                      <div className="text-[12px] font-black mt-1.5 font-mono tracking-widest text-slate-900">
                        {itemBarcode}
                      </div>
                    </div>
                    <p className="text-[8.5px] text-slate-400">Scan this item barcode anywhere in Tailoring &amp; Garments</p>
                  </div>
                );
              })()}

              {selectedJobTicket.specialInstructions && !['Custom Fitting', 'Standard Service', 'Alteration', 'alteration'].includes(selectedJobTicket.specialInstructions) && (
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

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedJobTicket(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
              >
                Close (Esc)
              </button>
              <button
                type="button"
                onClick={() => handleDownloadJobTicketHTML(selectedJobTicket)}
                className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              <button
                type="button"
                onClick={() => handlePrintJobTicketHTML(selectedJobTicket)}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAuditModal(selectedJobTicket)}
                className="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                title="View Complete Audit Trail & Reasons for Changes"
              >
                <History className="w-3.5 h-3.5 text-amber-700" />
                <span>Audit Trail</span>
              </button>
              <button
                type="button"
                onClick={() => openWhatsAppModal(selectedJobTicket)}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── AUDIT TRAIL & LOGS MODAL ─── */}
      {auditModalData && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-up my-auto text-slate-800 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span>Audit Trail &amp; Change Logs</span>
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                      {auditModalData.title}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Software में हुए हर बदलाव का संपूर्ण Record (User Name, Date, Time &amp; Reason)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAuditModalData(null)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content List */}
            <div className="overflow-y-auto space-y-3 flex-1 pr-1" style={{ maxHeight: '55vh' }}>
              {loadingAuditModal ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-mono">Fetching complete audit history...</span>
                </div>
              ) : auditModalData.logs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl">
                    📜
                  </div>
                  <p className="text-xs font-bold text-slate-600">No specific change logs recorded yet for this item.</p>
                  <p className="text-[10px] text-slate-400">Changes to Delivery Date, Tailor, Vendor, Service, Customer Mobile, Status, and Manual Delivery will appear here automatically.</p>
                </div>
              ) : (
                auditModalData.logs.map((l, i) => (
                  <div key={l._id || i} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 hover:bg-amber-50/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md font-mono">
                          {(l.action || '').replace(/_/g, ' ')}
                        </span>
                        {l.fieldChanged && (
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {l.fieldChanged}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                        {l.date ? `${l.date} ${l.time || ''}` : new Date(l.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Diff */}
                    {l.oldValue !== null && l.oldValue !== undefined && l.newValue !== null && l.newValue !== undefined && (
                      <div className="flex items-center gap-2 font-mono text-xs bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-rose-600 line-through truncate max-w-[180px]">{String(l.oldValue)}</span>
                        <span className="text-indigo-600 font-bold">➔</span>
                        <span className="text-emerald-700 font-bold truncate max-w-[200px]">{String(l.newValue)}</span>
                      </div>
                    )}

                    {/* Reason */}
                    {l.reason && (
                      <div className="flex items-start gap-1.5 bg-amber-50/90 border border-amber-200/80 p-2 rounded-xl text-xs text-amber-900">
                        <span className="font-bold uppercase text-[9px] text-amber-700 tracking-wider bg-amber-100 px-1 py-0.2 rounded shrink-0">Reason</span>
                        <span className="italic font-medium">{l.reason}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                      <span>Changed by: <strong className="text-slate-800 font-sans">{l.employeeName || l.userName || 'System'}</strong></span>
                      {l.employeeEmail && <span>({l.employeeEmail})</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setAuditModalData(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Audit View
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
                  New Alteration / Tailoring Ticket
                </h3>
              </div>
              <button
                onClick={() => setShowCreateAltModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Mode Selection: Showroom Purchase vs Customer Own Garment */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setAltCreationMode("SHOWROOM_PURCHASE")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${altCreationMode === "SHOWROOM_PURCHASE"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <span>🏪 Showroom Purchase (Existing Bill)</span>
              </button>
              <button
                type="button"
                onClick={() => setAltCreationMode("CUSTOMER_OWN_GARMENT")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${altCreationMode === "CUSTOMER_OWN_GARMENT"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <span>🧵 Customer Own Garment / Fabric (Custom Tailoring)</span>
              </button>
            </div>

            {/* OPTION 1: CUSTOMER OWN GARMENT / FABRIC FORM - Multi-item */}
            {altCreationMode === "CUSTOMER_OWN_GARMENT" && (
              <form onSubmit={handleSaveAlterationTicket} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 font-sans">
                {/* Notice Banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
                  <span className="text-base">🧵</span>
                  <div>
                    <p className="font-extrabold">Custom Tailoring — Customer Own Garment / Fabric</p>
                    <p className="text-[11px] text-emerald-700">Customer brings their own garment or fabric. No showroom invoice needed. Add multiple garments below.</p>
                  </div>
                </div>

                {/* Customer Details Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={cogCustomerName}
                      onChange={(e) => setCogCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Customer Phone / Mobile *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      value={cogCustomerPhone}
                      onChange={(e) => setCogCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>

                {/* ─── GARMENT ITEMS LIST ─── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-slate-700 tracking-wide flex items-center gap-1.5">
                      <Shirt className="w-3.5 h-3.5 text-rose-600" />
                      Garment Items ({cogItems.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => setCogItems(prev => [...prev, COG_ITEM_DEFAULT()])}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <span>+ Add Garment</span>
                    </button>
                  </div>

                  {cogItems.map((item, idx) => {
                    const updateItem = (field, value) => {
                      setCogItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
                    };
                    const toggleDetail = (detail) => {
                      setCogItems(prev => prev.map((it, i) => {
                        if (i !== idx) return it;
                        const has = it.alterationDetails.includes(detail);
                        return { ...it, alterationDetails: has ? it.alterationDetails.filter(d => d !== detail) : [...it.alterationDetails, detail] };
                      }));
                    };

                    return (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 relative shadow-xs">
                        {/* Item Header */}
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</span>
                            Garment #{idx + 1}
                          </span>
                          {cogItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setCogItems(prev => prev.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:text-rose-700 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer hover:bg-rose-50 px-1.5 py-0.5 rounded-lg transition-colors"
                            >
                              <X className="w-3 h-3" /> Remove
                            </button>
                          )}
                        </div>

                        {/* Row 1: Garment Name + Size */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase">Garment / Fabric Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Linen Kurta, Sherwani"
                              value={item.garmentName}
                              onChange={(e) => updateItem('garmentName', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase">Size / Fit</label>
                            <input
                              type="text"
                              placeholder="e.g. 40, XL, Custom"
                              value={item.size}
                              onChange={(e) => updateItem('size', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Row 2: Fabric/Color + Gender toggle + Service Type + Charge */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase">Fabric / Color</label>
                            <input
                              type="text"
                              placeholder="e.g. Navy Blue Raw Silk"
                              value={item.fabricColor}
                              onChange={(e) => updateItem('fabricColor', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase">Gender *</label>
                            <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs gap-0.5">
                              <button type="button" onClick={() => updateItem('gender', 'Gents')}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${item.gender === 'Gents' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                                <span>👨 Gents</span>
                              </button>
                              <button type="button" onClick={() => updateItem('gender', 'Ladies')}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${item.gender === 'Ladies' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                                <span>👩 Ladies</span>
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase">Service Type</label>
                            <select
                              value={item.serviceType}
                              onChange={(e) => updateItem('serviceType', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                            >
                              <option value="Custom Tailoring">Custom Tailoring</option>
                              <option value="Alteration">Alteration</option>
                              <option value="Full Stitching">Full Stitching</option>
                              <option value="Fitting & Hemming">Fitting & Hemming</option>
                              <option value="Repairs / Redesign">Repairs / Redesign</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-emerald-700 uppercase">Tailoring Charges (₹)</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={item.charge}
                              onChange={(e) => updateItem('charge', Number(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-black text-emerald-700 focus:ring-2 focus:ring-emerald-400 outline-none"
                            />
                          </div>
                        </div>

                        {/* Row 3: Alteration Checkboxes */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-500 uppercase">Services / Alteration Details</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {["Custom Stitching", "Sleeve Shortening", "Sleeve Lengthening", "Waist Fitting", "Shoulder Fitting", "Bottom Hemming", "Length Shortening", "Chest Fitting", "Neck Alteration"].map((detail) => (
                              <label key={detail} className={`flex items-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold cursor-pointer transition-all ${item.alterationDetails.includes(detail) ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                <input type="checkbox" checked={item.alterationDetails.includes(detail)} onChange={() => toggleDetail(detail)} className="sr-only" />
                                {detail}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Row 4: Special Instructions */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-slate-500 uppercase">Special Instructions (for this garment)</label>
                          <textarea
                            placeholder="Specific requirements, fabric notes, stitching style..."
                            value={item.customText}
                            onChange={(e) => updateItem('customText', e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 outline-none transition-all text-xs resize-none"
                            rows="2"
                          />
                        </div>

                        <div className="space-y-1.5 border-t border-slate-200 pt-3">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase">Measurements to Enter (in inches)</label>
                            <p className="text-[10px] text-slate-500">Enter the standard measurements shown below for this garment, or use an existing customer measurement.</p>
                          </div>
                          <GarmentMeasurementSection
                            gender={item.gender}
                            onGenderChange={(gender) => updateItem('gender', gender)}
                            garmentType={item.garmentType || 'Shirt'}
                            onGarmentChange={(garmentType) => updateItem('garmentType', garmentType)}
                            measurements={item.measurements || {}}
                            onChange={(measurements) => updateItem('measurements', measurements)}
                            customerPhone={cogCustomerPhone}
                            customerName={cogCustomerName || 'Customer'}
                            saveAsMaster={cogSaveAsMaster}
                            onSaveAsMasterChange={setCogSaveAsMaster}
                            themeColor="rose"
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Charges Summary */}
                  {cogItems.length > 1 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800">Total Tailoring Charges ({cogItems.length} garments):</span>
                      <span className="text-base font-black text-emerald-800">₹{cogItems.reduce((s, it) => s + Number(it.charge || 0), 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {/* Shared: Tailor, Priority, Trial, Delivery */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
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
                    <label className="block text-xs font-bold text-slate-500 uppercase">Trial Required?</label>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                      <button type="button" onClick={() => setAltTrialRequired(false)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${!altTrialRequired ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>No</button>
                      <button type="button" onClick={() => setAltTrialRequired(true)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${altTrialRequired ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>Yes</button>
                    </div>
                  </div>

                  {altTrialRequired && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-purple-700 uppercase">Expected Trial Date *</label>
                      <input type="date" value={altTrialDate} onChange={(e) => setAltTrialDate(e.target.value)} required={altTrialRequired}
                        className="w-full border border-purple-300 bg-purple-50/50 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-semibold text-purple-900" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Expected Delivery Date</label>
                    <input type="date" value={altDeliveryDate} onChange={(e) => setAltDeliveryDate(e.target.value)} required
                      className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 outline-none text-xs font-semibold" />
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
                    <span>Save {cogItems.length > 1 ? `${cogItems.length} Tailoring Tickets` : 'Custom Tailoring Ticket'}</span>
                  </button>
                </div>
              </form>
            )}


            {/* OPTION 2: SHOWROOM PURCHASE (FROM BILLING) */}
            {altCreationMode === "SHOWROOM_PURCHASE" && (
              <>
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-slate-800">{item.name}</p>
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${(item.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(item.name || '') ? 'Ladies' : 'Gents')) === 'Ladies'
                                  ? 'bg-pink-100 text-pink-700 border-pink-300'
                                  : 'bg-blue-100 text-blue-700 border-blue-300'
                                  }`}>
                                  {item.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(item.name || '') ? 'Ladies' : 'Gents')}
                                </span>
                              </div>
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
                    <div className="flex justify-between items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-extrabold text-slate-800 text-sm">{selectedAltItem.productName || selectedAltItem.name}</p>

                          {/* Option of Gents / Ladies in front of product for Alteration / Garment */}
                          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 gap-1 shadow-2xs">
                            <span className="text-[10px] font-black uppercase text-slate-400 px-1">Gender:</span>
                            <button
                              type="button"
                              onClick={() => setSelectedAltItem(prev => ({ ...prev, gender: 'Gents' }))}
                              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${(selectedAltItem.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(selectedAltItem.name || selectedAltItem.productName || '') ? 'Ladies' : 'Gents')) === 'Gents'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                              <span>👨 Gents</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedAltItem(prev => ({ ...prev, gender: 'Ladies' }))}
                              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${(selectedAltItem.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(selectedAltItem.name || selectedAltItem.productName || '') ? 'Ladies' : 'Gents')) === 'Ladies'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                              <span>👩 Ladies</span>
                            </button>
                          </div>

                          {/* Service Type Badge with Gents / Ladies under Alteration */}
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase font-mono px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {selectedAltItem.serviceType || 'Alteration'}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-wider mt-0.5 px-1.5 py-0.2 rounded border ${(selectedAltItem.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(selectedAltItem.name || selectedAltItem.productName || '') ? 'Ladies' : 'Gents')) === 'Ladies'
                              ? 'bg-pink-50 text-pink-700 border-pink-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                              {selectedAltItem.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(selectedAltItem.name || selectedAltItem.productName || '') ? 'Ladies' : 'Gents')}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs font-mono font-bold text-indigo-700 mt-0.5">
                          Barcode: <span className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">{selectedAltItem.barcode || selectedAltItem.sku || 'N/A'}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Invoice: <span className="font-bold text-slate-800">{selectedAltInvoice.invoiceNo || selectedAltInvoice.invoiceNumber}</span> · Customer: <span className="font-bold text-slate-800">{selectedAltInvoice.customerName}</span> ({selectedAltInvoice.customerPhone || 'N/A'})
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Size: <span className="font-bold text-slate-600">{selectedAltItem.size || 'M'}</span> | Color: <span className="font-bold text-slate-600">{selectedAltItem.color || 'Standard'}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAltItem(null);
                          setSelectedAltInvoice(null);
                        }}
                        className="text-xs text-rose-600 font-bold hover:underline shrink-0"
                      >
                        Change Garment
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
                        <label className="block text-xs font-bold text-slate-500 uppercase">Tailoring Charges (₹)</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={altCharges}
                          onChange={(e) => setAltCharges(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Trial Required?</label>
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setAltTrialRequired(false)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${!altTrialRequired ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                              }`}
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => setAltTrialRequired(true)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${altTrialRequired ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                              }`}
                          >
                            Yes
                          </button>
                        </div>
                      </div>

                      {altTrialRequired ? (
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-purple-700 uppercase">Expected Trial Date *</label>
                          <input
                            type="date"
                            value={altTrialDate}
                            onChange={(e) => setAltTrialDate(e.target.value)}
                            required={altTrialRequired}
                            className="w-full border border-purple-300 bg-purple-50/50 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-semibold text-purple-900"
                          />
                        </div>
                      ) : null}

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

                    {/* Measurements Section */}
                    <div className="border-t border-slate-100 pt-3">
                      <GarmentMeasurementSection
                        gender={selectedAltItem?.gender || (/(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(selectedAltItem?.productName || selectedAltItem?.name || '') ? 'Ladies' : 'Gents')}
                        garmentType={showroomGarmentType}
                        onGarmentChange={setShowroomGarmentType}
                        measurements={altMeasurements}
                        onChange={setAltMeasurements}
                        customerPhone={selectedAltInvoice?.customerPhone}
                        customerId={selectedAltInvoice?.customerId?._id || selectedAltInvoice?.customerId}
                        customerName={selectedAltInvoice?.customerName || "Customer"}
                        saveAsMaster={showroomSaveAsMaster}
                        onSaveAsMasterChange={setShowroomSaveAsMaster}
                        onOpenHistory={() => handleOpenCustomerHistory(
                          selectedAltInvoice?.customerPhone,
                          selectedAltInvoice?.customerId?._id || selectedAltInvoice?.customerId,
                          selectedAltInvoice?.customerName || "Customer"
                        )}
                        allowGenderSwitch={true}
                        themeColor="rose"
                      />
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
              </>
            )}

          </div>
        </div>
      )}

      {/* ─── MODAL: BILL RECEIPT PREVIEW ─── */}
      {previewBillInvoice && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in font-sans overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-up my-auto flex flex-col max-h-[90vh] text-slate-800">

            <div className="flex justify-between items-center pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 text-indigo-600">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-black uppercase tracking-wide">
                  Bill Receipt Preview
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewBillInvoice(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Thermal Scroll Preview Frame */}
            <div className="flex-1 border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
              <iframe
                title="Invoice Print Preview"
                srcDoc={generateInvoiceReceiptHTML(previewBillInvoice)}
                className="w-full h-[58vh] border-none bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1 font-sans shrink-0">
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => handlePrintPreviewBill(previewBillInvoice)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Shortcut: F10"
                >
                  <Printer className="w-4 h-4" />
                  <span>PRINT</span>
                  <span className="bg-black/25 text-blue-100 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-white/20 normal-case ml-0.5">F10</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPreviewBill(previewBillInvoice)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Shortcut: F11"
                >
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD HTML</span>
                  <span className="bg-black/25 text-emerald-100 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-white/20 normal-case ml-0.5">F11</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleWhatsAppPreviewBill(previewBillInvoice)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:to-green-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40"
                title="Shortcut: F12"
              >
                <MessageSquare className="w-4 h-4" />
                <span>SEND BILL DIRECTLY TO WHATSAPP</span>
                <span className="bg-black/30 text-emerald-100 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-white/30 normal-case ml-1">F12</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewBillInvoice(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1 mt-1"
              >
                <span>Close (Esc)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: PSS BILL BARCODE COLLECTION & DELIVERY SCANNER */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-up text-slate-800">

            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-wide uppercase font-mono">
                    CUSTOMER PSS COLLECTION / DELIVERY SCANNER
                  </h3>
                  <p className="text-xs text-slate-400">
                    Scan Bill Barcode to view item-level status and deliver ready garments
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCollectionModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 shrink-0">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-2">
                Scan or Enter Bill Barcode / Bill Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Scan Bill Barcode (e.g. BILL-1058 or INV-xxxx)..."
                    value={collectionBarcodeQuery}
                    onChange={(e) => setCollectionBarcodeQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchBillCollection();
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold pl-10 pr-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchBillCollection()}
                  disabled={loadingCollection}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loadingCollection ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Find PSS Order</span>
                </button>
              </div>
            </div>

            {/* Results & Items Checklist */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 erp-hide-scrollbar">
              {!collectionData ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Shirt className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-500">
                    Scan or type a Bill Barcode above to check PSS ready items.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Bill Master Summary Header */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-white/20 text-white px-2.5 py-1 rounded-lg border border-white/20">
                          Bill: {collectionData.pssm?.billBarcode || collectionData.pssm?.billNo}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase font-mono px-2.5 py-1 rounded-lg border ${collectionData.pssm?.status === 'CLOSED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          collectionData.pssm?.status === 'READY_FOR_DELIVERY' ? 'bg-emerald-500 text-white border-emerald-600' :
                            collectionData.pssm?.status === 'PARTIALLY_READY' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                              'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          }`}>
                          {collectionData.pssm?.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Customer: <strong className="text-white">{collectionData.pssm?.customerName}</strong> ({collectionData.pssm?.customerPhone || 'N/A'})
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-slate-400 font-mono">
                        Items: {collectionData.items?.length || 0} Total
                      </p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      Item-by-Item Status & Collection Selection
                    </h4>

                    {collectionData.items?.map((item) => {
                      const isReady = item.status === 'READY';
                      const isCollected = item.status === 'COLLECTED';
                      const isChecked = selectedCollectionItemIds.includes(item._id);

                      return (
                        <div
                          key={item._id}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-wrap items-center justify-between gap-3 ${isCollected
                            ? 'bg-slate-100 border-slate-200 opacity-60'
                            : isReady
                              ? 'bg-emerald-50 border-emerald-400'
                              : 'bg-white border-slate-200'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            {!isCollected && isReady && (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCollectionItemIds(prev => [...prev, item._id]);
                                  } else {
                                    setSelectedCollectionItemIds(prev => prev.filter(id => id !== item._id));
                                  }
                                }}
                                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                              />
                            )}

                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-black text-slate-900">
                                  {item.productName || item.pieceName}
                                </h5>
                                <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                                  Unique Code: {item.uniqueCode || item.barcode || 'N/A'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">
                                Service: <strong className="text-slate-800">{item.serviceType}</strong> | Assigned: <strong className="text-slate-800">{item.assignedTo || 'Unassigned'}</strong>
                              </p>
                            </div>
                          </div>

                          <div>
                            <span className={`text-[10px] font-extrabold uppercase font-mono px-3 py-1.5 rounded-xl border ${isCollected ? 'bg-slate-200 text-slate-600 border-slate-300' :
                              isReady ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' :
                                item.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                  'bg-amber-100 text-amber-800 border-amber-200'
                              }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowCollectionModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>

              {collectionData && (
                <button
                  type="button"
                  onClick={handleConfirmCollection}
                  disabled={selectedCollectionItemIds.length === 0}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>MARK {selectedCollectionItemIds.length} ITEM(S) AS COLLECTED</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* ENTERPRISE MODAL: ADD / EDIT GARMENT MEASUREMENTS */}
      {/* ============================================================================== */}
      {showMeasurementModal && editingMeasurementAlt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl border border-amber-200">
                  <Ruler className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    {startWorkAfterMeasurement ? "Add Measurements to Start Work" : "Garment Tailoring Measurements"}
                  </h4>
                  <p className="text-xs text-amber-800 font-medium mt-0.5">
                    Ticket: <strong className="font-mono">{editingMeasurementAlt.alterationId}</strong> | Item: <strong>{editingMeasurementAlt.productName}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenCustomerHistory(
                    editingMeasurementAlt.customerPhone,
                    editingMeasurementAlt.customerId,
                    editingMeasurementAlt.customerName
                  )}
                  className="px-3 py-1.5 bg-amber-100/80 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                  title="View complete customer history"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Customer History</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMeasurementModal(false);
                    setEditingMeasurementAlt(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveMeasurements} className="p-6 overflow-y-auto space-y-4">

              {/* Item Summary Info Box */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">Customer:</span>
                  <span className="font-black text-slate-800">{editingMeasurementAlt.customerName}</span>
                  {editingMeasurementAlt.customerPhone && (
                    <span className="text-[10px] text-slate-500 font-mono block">{editingMeasurementAlt.customerPhone}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Invoice:</span>
                  <span className="font-mono font-black text-indigo-600">{editingMeasurementAlt.invoiceNumber || editingMeasurementAlt.invoiceId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Service Type:</span>
                  <span className="font-bold text-rose-700">{editingMeasurementAlt.serviceType || 'Alteration'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Master Tailor:</span>
                  <span className="font-bold text-slate-700">{editingMeasurementAlt.tailorName || 'Unassigned'}</span>
                </div>
              </div>

              {startWorkAfterMeasurement && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Work Requirement:</strong> Garment work cannot be marked <em>"In Progress"</em> without measurements. Saving measurements below will automatically update the job ticket status to <strong>In Progress</strong>.
                  </span>
                </div>
              )}

              {/* Enterprise Garment Measurement Section */}
              <GarmentMeasurementSection
                gender={modalMeasurementGender}
                onGenderChange={setModalMeasurementGender}
                garmentType={modalMeasurementGarment}
                onGarmentChange={setModalMeasurementGarment}
                measurements={measurementForm}
                onChange={setMeasurementForm}
                customerPhone={editingMeasurementAlt.customerPhone}
                customerId={editingMeasurementAlt.customerId}
                customerName={editingMeasurementAlt.customerName}
                saveAsMaster={modalSaveAsMaster}
                onSaveAsMasterChange={setModalSaveAsMaster}
                onOpenHistory={() => handleOpenCustomerHistory(
                  editingMeasurementAlt.customerPhone,
                  editingMeasurementAlt.customerId,
                  editingMeasurementAlt.customerName
                )}
                allowGenderSwitch={true}
                themeColor="amber"
              />

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowMeasurementModal(false);
                    setEditingMeasurementAlt(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMeasurements}
                  className="px-6 py-2.5 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{startWorkAfterMeasurement ? "Save & Start Work (In Progress)" : "Save Measurements"}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* ENTERPRISE MODAL: ASSIGN / CHANGE MASTER TAILOR */}
      {/* ============================================================================== */}
      {editingTailorAlt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 px-6 py-4 border-b border-violet-200/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-100 text-violet-800 rounded-xl border border-violet-200">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    Assign / Change Master Tailor
                  </h4>
                  <p className="text-xs text-violet-800 font-medium mt-0.5">
                    Ticket: <strong className="font-mono">{editingTailorAlt.alterationId || editingTailorAlt.alterationNo || 'Ticket'}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTailorAlt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveTailorChange} className="p-6 space-y-4">

              {/* Item Summary Info Box */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">Customer:</span>
                  <span className="font-black text-slate-800">{editingTailorAlt.customerName || 'Walk-in'} ({editingTailorAlt.customerPhone || 'N/A'})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Garment:</span>
                  <span className="font-bold text-slate-800">{editingTailorAlt.productName || 'Garment Item'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Current Tailor:</span>
                  <span className="font-black text-violet-700">{editingTailorAlt.tailorName || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Current Status:</span>
                  <span className="font-bold text-slate-700">{editingTailorAlt.status || 'Pending'}</span>
                </div>
              </div>

              {/* Master Tailor Selection */}
              <div>
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
                  Select Master Tailor
                </label>
                <select
                  value={selectedNewTailor}
                  onChange={(e) => setSelectedNewTailor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 cursor-pointer"
                  required
                >
                  <option value="">-- Choose Master Tailor --</option>
                  {tailorOptions.map((name, i) => (
                    <option key={i} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Audit Reason Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Reason for Assignment / Reassignment
                  </label>
                  <span className="text-[10px] text-amber-600 font-bold">Logged to Audit Trail</span>
                </div>
                <input
                  type="text"
                  value={tailorChangeReason}
                  onChange={(e) => setTailorChangeReason(e.target.value)}
                  placeholder="e.g. Workload balancing, tailor absent, rush request"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-violet-500"
                />
                {/* Quick chip suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["Workload balancing", "Tailor absent / leave", "Urgent priority handover", "Specialist stitching"].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setTailorChangeReason(chip)}
                      className="text-[10px] bg-slate-100 hover:bg-violet-100 text-slate-600 hover:text-violet-800 px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTailorAlt(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTailorChange}
                  className="px-6 py-2.5 text-xs font-black text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingTailorChange ? "Saving Assignment..." : "Save Tailor Assignment"}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* ENTERPRISE MODAL: CHANGE DELIVERY DATE & PRIORITY */}
      {/* ============================================================================== */}
      {editingDeliveryAlt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl border border-amber-200">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    Change Delivery Date & Priority
                  </h4>
                  <p className="text-xs text-amber-800 font-medium mt-0.5">
                    Ticket: <strong className="font-mono">{editingDeliveryAlt.alterationId || editingDeliveryAlt.alterationNo || 'Ticket'}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDeliveryAlt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveDeliveryDateChange} className="p-6 space-y-4">

              {/* Item Summary Info Box */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">Customer:</span>
                  <span className="font-black text-slate-800">{editingDeliveryAlt.customerName || 'Walk-in'} ({editingDeliveryAlt.customerPhone || 'N/A'})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Garment:</span>
                  <span className="font-bold text-slate-800">{editingDeliveryAlt.productName || 'Garment Item'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Current Delivery:</span>
                  <span className="font-mono font-black text-slate-800">{editingDeliveryAlt.deliveryDate || (editingDeliveryAlt.expectedDeliveryDate ? new Date(editingDeliveryAlt.expectedDeliveryDate).toISOString().split('T')[0] : 'N/A')}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Current Priority:</span>
                  <span className="font-black uppercase text-amber-700">{editingDeliveryAlt.priority || 'Normal'}</span>
                </div>
              </div>

              {/* Delivery Date & Quick Presets */}
              <div>
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
                  New Delivery Date
                </label>
                <input
                  type="date"
                  value={selectedNewDeliveryDate}
                  onChange={(e) => setSelectedNewDeliveryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer font-mono"
                  required
                />
                {/* Date Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: "Today", days: 0 },
                    { label: "Tomorrow", days: 1 },
                    { label: "+3 Days", days: 3 },
                    { label: "+7 Days", days: 7 }
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + p.days);
                        setSelectedNewDeliveryDate(d.toISOString().split('T')[0]);
                      }}
                      className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trial Date & Trial Required */}
              <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span>👔</span> Trial Required?
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="editDeliveryTrialReq"
                        checked={selectedNewTrialRequired}
                        onChange={() => setSelectedNewTrialRequired(true)}
                        className="accent-purple-600 cursor-pointer"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="editDeliveryTrialReq"
                        checked={!selectedNewTrialRequired}
                        onChange={() => setSelectedNewTrialRequired(false)}
                        className="accent-purple-600 cursor-pointer"
                      />
                      No
                    </label>
                  </div>
                </div>

                {selectedNewTrialRequired && (
                  <div>
                    <label className="text-[10px] font-bold text-purple-800 uppercase block mb-1">
                      Promised Trial Date
                    </label>
                    <input
                      type="date"
                      value={selectedNewTrialDate}
                      onChange={(e) => setSelectedNewTrialDate(e.target.value)}
                      className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-purple-950 outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Priority Selection */}
              <div>
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
                  Priority Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Normal", "Urgent", "Express"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedNewPriority(p)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${selectedNewPriority === p
                        ? p === 'Express'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : p === 'Urgent'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audit Reason Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Reason for Date Change
                  </label>
                  <span className="text-[10px] text-amber-600 font-bold">Logged to Audit Trail</span>
                </div>
                <input
                  type="text"
                  value={deliveryChangeReason}
                  onChange={(e) => setDeliveryChangeReason(e.target.value)}
                  placeholder="e.g. Customer requested earlier, fabric delay"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
                {/* Quick chip suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["Customer requested earlier", "Fabric / Material delayed", "Customer requested postponement", "Quality re-alteration required"].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setDeliveryChangeReason(chip)}
                      className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingDeliveryAlt(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDeliveryChange}
                  className="px-6 py-2.5 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingDeliveryChange ? "Updating Date..." : "Update Delivery Date"}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ─── TRIAL ASSESSMENT & FITTING RESULT MODAL ─── */}
      {trialModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col animate-scale-up">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 text-purple-300">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider font-mono text-white">
                    FITTING TRIAL ASSESSMENT
                  </h4>
                  <p className="text-xs text-purple-200 font-medium mt-0.5">
                    Ticket #{trialModalTicket.alterationId || trialModalTicket.alterationNo || 'TICKET'} · {trialModalTicket.customerName || 'Customer'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrialModalTicket(null)}
                className="p-1.5 text-purple-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveTrialAssessment} className="p-6 space-y-4">

              {/* Garment Summary Strip */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Garment Item:</span>
                  <span className="font-bold text-slate-900">{trialModalTicket.productName || 'Altered Garment'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Current Status:</span>
                  <span className="font-bold text-indigo-700 uppercase font-mono">{normalizeJobStatus(trialModalTicket.status)}</span>
                </div>
              </div>

              {/* After-Trial & Re-Alter Measurements */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📏</span>
                    <span>Trial / Re-Alter Measurements</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold font-mono">Adjust dimensions for Re-Alteration</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {["Length", "Waist", "Chest", "Hip", "Shoulder", "Sleeve"].map((k) => (
                    <div key={k} className="space-y-0.5">
                      <label className="text-[10px] font-bold text-slate-600 block uppercase truncate">{k}</label>
                      <input
                        type="text"
                        value={trialMeasurements[k] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTrialMeasurements(prev => ({ ...prev, [k]: val }));
                        }}
                        placeholder='e.g. 38"'
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500 text-center shadow-2xs"
                      />
                    </div>
                  ))}
                </div>
                {/* Additional / Custom Measurements if existing */}
                {Object.keys(trialMeasurements || {}).filter(k => !["Length", "Waist", "Chest", "Hip", "Shoulder", "Sleeve"].includes(k)).length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {Object.keys(trialMeasurements).filter(k => !["Length", "Waist", "Chest", "Hip", "Shoulder", "Sleeve"].includes(k)).map((k) => (
                      <div key={k} className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-600 block uppercase truncate">{k}</label>
                        <input
                          type="text"
                          value={trialMeasurements[k] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTrialMeasurements(prev => ({ ...prev, [k]: val }));
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500 text-center shadow-2xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 1. Fitting Result (Required) */}
              <div>
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                  <span>Fitting Result *</span>
                  <span className="text-[10px] text-purple-700 font-semibold font-mono">Enter details</span>
                </label>
                <textarea
                  value={trialFittingResult}
                  onChange={(e) => setTrialFittingResult(e.target.value)}
                  placeholder="Enter fitting trial assessment (e.g. Waist fits well, shoulders need 0.5 inch loose, trial passed smoothly...)"
                  rows={2}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all shadow-2xs resize-none"
                />
              </div>

              {/* 2. Required Changes (Optional) */}
              <div>
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                  <span>Required Changes</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={trialRequiredChanges}
                  onChange={(e) => setTrialRequiredChanges(e.target.value)}
                  placeholder="Enter any specific changes needed (e.g. shorten hem by 1 inch, adjust sleeve length)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              {/* 3. Re-Alter Remarks / Special Instructions */}
              <div>
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                  <span>Re-Alter Remarks / Tailor Instructions</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={trialRemarks}
                  onChange={(e) => setTrialRemarks(e.target.value)}
                  placeholder="Special instructions for re-alteration (e.g. prioritize waist loosening, keep original lining intact)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              {/* 3. Re-Alteration: Yes or No */}
              <div className="p-4 rounded-2xl border-2 transition-all space-y-2.5 bg-slate-50 border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Re-Alteration Required?
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {trialReAlteration
                        ? 'Selecting "Yes" moves ticket directly to Re-Alteration stage.'
                        : 'Selecting "No" marks fitting passed and moves directly to Quality Check.'}
                    </p>
                  </div>
                  <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs gap-1">
                    <button
                      type="button"
                      onClick={() => setTrialReAlteration(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${!trialReAlteration
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      No (QC)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrialReAlteration(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${trialReAlteration
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Yes (Re-Alt)
                    </button>
                  </div>
                </div>

                {/* Status Destination Preview Badge */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${trialReAlteration
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-teal-50 border-teal-200 text-teal-800'
                  }`}>
                  <span className="flex items-center gap-1.5">
                    {trialReAlteration ? <RefreshCw className="w-3.5 h-3.5 text-red-600 animate-spin-slow" /> : <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />}
                    <span>Next Stage:</span>
                  </span>
                  <span className={`uppercase font-black px-2 py-0.5 rounded font-mono ${trialReAlteration ? 'bg-red-600 text-white' : 'bg-teal-600 text-white'
                    }`}>
                    {trialReAlteration ? 'Re-Alteration' : 'Quality Check'}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTrialModalTicket(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTrialAssessment}
                  className={`px-5 py-2 font-bold text-white rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${trialReAlteration
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                    : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
                    }`}
                >
                  {savingTrialAssessment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Assessment...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {trialReAlteration
                          ? 'Confirm & Move to Re-Alteration'
                          : 'Mark directly to Quality Check'}
                      </span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─── GLOBAL CUSTOMER MEASUREMENT HISTORY TIMELINE MODAL ─── */}
      <MeasurementHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        customerPhone={historyModalCustomer.phone}
        customerId={historyModalCustomer.id}
        customerName={historyModalCustomer.name}
        onSelectMeasurements={(mObj, label) => {
          if (showMeasurementModal) {
            setMeasurementForm(prev => ({ ...prev, ...mObj }));
            if (onAddNotification) {
              onAddNotification("Measurements Loaded", `Loaded measurements from ${label}.`, "success");
            }
          } else if (showCreateAltModal) {
            setAltMeasurements(prev => ({ ...prev, ...mObj }));
            if (onAddNotification) {
              onAddNotification("Measurements Loaded", `Loaded measurements from ${label}.`, "success");
            }
          }
        }}
      />

    </div>
  );
};

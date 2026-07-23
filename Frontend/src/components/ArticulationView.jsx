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
} from "lucide-react";

export const ArticulationView = ({
  customers = [],
  employees = [],
  products = [],
  onAddCustomToCart,
  onAddNotification,
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

  // ─── LIVE ALTERATIONS MODULE STATE & BACKEND FETCH ───
  const [activeStudioTab, setActiveStudioTab] = useState("alterations"); // 'alterations' | 'studio'
  const [alterationRecords, setAlterationRecords] = useState([]);
  const [alterationsFilterStatus, setAlterationsFilterStatus] = useState("All");
  const [alterationSearchQuery, setAlterationSearchQuery] = useState("");
  const [selectedJobTicket, setSelectedJobTicket] = useState(null);

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
      const res = await fetch("http://localhost:5000/api/alterations", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const sorted = (data.data || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setAlterationRecords(sorted);
      }
    } catch (err) {
      console.error("Failed to fetch alterations:", err);
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
      const res = await fetch(`http://localhost:5000/api/alterations/${altId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
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

      await fetch("http://localhost:5000/api/inventory-movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
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
      
      {/* ─── LIVE ALTERATIONS LEDGER MODULE ─── */}
      <div className="flex-1 p-6 bg-slate-50 overflow-y-auto space-y-5 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-rose-600" />
                <h2 className="text-base font-black uppercase text-slate-800 tracking-wider">
                  Tailoring & Alteration Master Ledger
                </h2>
                {alterationRecords.length > 0 && (
                  <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black">
                    {alterationRecords.length} Tickets
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time MongoDB records linked to Billing POS invoices, customer measurements & master tailors.
              </p>
            </div>

            {/* LIVE CUSTOMER & INVOICE SEARCH BAR */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={alterationSearchQuery}
                  onChange={(e) => setAlterationSearchQuery(e.target.value)}
                  placeholder="Search customer name, phone, invoice #, ticket #..."
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

              <button
                onClick={fetchAlterations}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <span>Refresh Stream</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex gap-2 overflow-x-auto pb-1 font-sans shrink-0">
            {["All", "Pending", "In Progress", "Ready for Trial", "Ready for Delivery", "Delivered"].map((st) => {
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

          {/* Alterations Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                    <th className="p-3.5">Job Ticket Receipt</th>
                    <th className="p-3.5">Created Time</th>
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
                      return (
                        <tr key={alt._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-rose-600">
                            {alt.alterationId || `ALT-${alt._id.slice(-6)}`}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-indigo-600">
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
                          <td className="p-3.5">
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
                          <td className="p-3.5">
                            <button
                              onClick={() => setSelectedJobTicket(alt)}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>
                          </td>
                          <td className="p-3.5 text-[10px] font-mono text-slate-400">
                            {alt.createdAt ? new Date(alt.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                        </tr>
                      );
                    })}

                  {alterationRecords.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 text-xs font-medium">
                        No alteration records logged yet. Click "ALTERATION" in POS Billing to add job tickets.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* MODAL: JOB TICKET RECEIPT & ALTERATION SLIP */}
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
        </div>
    </div>
  );
};

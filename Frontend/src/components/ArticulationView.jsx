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
  Workflow
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
      { id: "c-101", _id: "c-101", name: "Amit Sharma", phone: "9876543210", email: "amit.sharma@example.com", code: "C-1001", loyaltyPoints: 240 },
      { id: "c-102", _id: "c-102", name: "Priya Patel", phone: "8765432109", email: "priya.patel@example.com", code: "C-1002", loyaltyPoints: 180 },
      { id: "c-103", _id: "c-103", name: "Rajesh Kumar", phone: "7654321098", email: "rajesh.kumar@example.com", code: "C-1003", loyaltyPoints: 50 },
      { id: "c-104", _id: "c-104", name: "Ananya Sen", phone: "6543210987", email: "ananya.sen@example.com", code: "C-1004", loyaltyPoints: 310 },
      { id: "c-105", _id: "c-105", name: "Vikram Malhotra", phone: "9988776655", email: "vikram.m@example.com", code: "C-1005", loyaltyPoints: 420 },
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

  const handleReserveFabric = () => {
    setIsFabricReserved(true);
    onAddNotification("Fabric Allocated", `${totalFabricRequired} meters of ${selectedFabric.name} reserved in stock.`, "success");
  };

  const handleGenerateJobCard = () => {
    setShowPrintPreview(true);
    onAddNotification("Job Card Built", "Garment job specifications compiled to job card.", "success");
  };

  const handleSendToProduction = () => {
    setOrderStatus("In Production");
    onAddNotification("Production Stage Loaded", `Garment sent to workflow line. Assigned: ${selectedTailor.name}.`, "success");
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
      
      {/* ─── HOTKEYS BAR / TOP STATUS ─── */}
      <div className="bg-slate-900 text-slate-300 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono shrink-0">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">Bespoke CAD Engine v2.8</span>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <span><kbd className="bg-slate-800 text-white px-1 rounded">Ctrl+F</kbd> Find Customer</span>
          <span><kbd className="bg-slate-800 text-white px-1 rounded">Ctrl+M</kbd> Grid Input</span>
          <span><kbd className="bg-slate-800 text-white px-1 rounded">Ctrl+B</kbd> Fabric</span>
          <span><kbd className="bg-slate-800 text-white px-1 rounded">Ctrl+T</kbd> Tailor</span>
          <span><kbd className="bg-slate-800 text-white px-1 rounded">Ctrl+S</kbd> Save Draft</span>
          <span><kbd className="bg-slate-800 text-white px-1 rounded">F8</kbd> Reserve Stock</span>
          <span><kbd className="bg-slate-800 text-white px-1 rounded">F9</kbd> POS checkout</span>
          <span><kbd className="bg-slate-800 text-white px-1 rounded">F4</kbd> Workflow Summary</span>
        </div>
      </div>

      {/* ─── MAIN WORKSPACE GRID ─── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* ─── LEFT PANEL (35%): CUSTOMER & ORDER ─── */}
        <div className="lg:col-span-4 border-r border-slate-200 bg-white flex flex-col overflow-y-auto p-4 space-y-4">
          
          {/* SECTION 1: CUSTOMER QUICK SELECT */}
          <div className={`p-3.5 rounded-xl border transition-all ${focusedSection === "customer_search" ? "border-indigo-600 bg-indigo-50/20 shadow-xs" : "border-slate-100 bg-slate-50/50"}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-600" />
                <span>1. Customer Select</span>
              </h3>
              <span className="text-[9px] text-slate-400 font-mono">[Ctrl + F]</span>
            </div>

            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                ref={customerSearchRef}
                type="text"
                placeholder="Search mobile, code or name..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setFocusedSection("customer_search");
                  setActiveCustomerIndex(0);
                }}
                onFocus={() => setFocusedSection("customer_search")}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Dropdown Customer Finder list (Inline) */}
            {customerSearch && filteredCustomers.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg mb-3 max-h-32 overflow-y-auto divide-y divide-slate-100">
                {filteredCustomers.map((cust, i) => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setCustomerSearch("");
                      setFocusedSection("garments");
                    }}
                    className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition-colors ${activeCustomerIndex === i ? "bg-indigo-50 text-indigo-700 font-bold" : "hover:bg-slate-50"}`}
                  >
                    <div>
                      <p>{cust.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{cust.phone}</p>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-500">{cust.code}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Customer Details Display */}
            {selectedCustomer && (
              <div className="bg-white border border-slate-150 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 shadow-2xs">
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans">CUSTOMER NAME</span>
                  <span className="font-bold text-slate-800">{selectedCustomer.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans">CUSTOMER ID</span>
                  <span className="font-mono text-slate-800">{selectedCustomer.code || selectedCustomer.id}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans">MOBILE NUMBER</span>
                  <span className="font-mono text-slate-800">{selectedCustomer.phone}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans">LOYALTY POINTS</span>
                  <span className="font-mono text-indigo-600 font-bold">{selectedCustomer.loyaltyPoints || 0} LP</span>
                </div>
              </div>
            )}

            {/* Recent Customers (Last 10) */}
            <div className="mt-3">
              <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1.5">Last 10 Customers</span>
              <div className="flex flex-wrap gap-1">
                {defaultCustomers.slice(0, 10).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setFocusedSection("garments");
                    }}
                    className={`px-2 py-1 border text-[10px] font-semibold rounded-md transition-all cursor-pointer ${selectedCustomer?.id === c.id ? "bg-indigo-600 border-indigo-600 text-white font-bold" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"}`}
                  >
                    {c.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: ORDER INFORMATION */}
          <div className={`p-3.5 rounded-xl border transition-all ${focusedSection === "order_info" ? "border-indigo-600 bg-indigo-50/20 shadow-xs" : "border-slate-100 bg-slate-50/50"}`}>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>2. Order Specifications</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Order ID</label>
                <input
                  type="text"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  onFocus={() => setFocusedSection("order_info")}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Salesperson</label>
                <select
                  value={salesperson}
                  onChange={(e) => setSalesperson(e.target.value)}
                  onFocus={() => setFocusedSection("order_info")}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
                >
                  <option value="Vijay Shekhar">Vijay Shekhar</option>
                  <option value="Aman Deep">Aman Deep</option>
                  <option value="Ramesh Kumar">Ramesh Kumar</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Delivery Date [Ctrl+D]</label>
                <input
                  ref={deliveryDateRef}
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  onFocus={() => setFocusedSection("order_info")}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Priority</label>
                <select
                  value={orderPriority}
                  onChange={(e) => setOrderPriority(e.target.value)}
                  onFocus={() => setFocusedSection("order_info")}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Boutique Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  onFocus={() => setFocusedSection("order_info")}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Ticket Status</label>
                <span className="w-full block bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 uppercase tracking-wide text-center">
                  {orderStatus}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 9: FABRIC CALCULATOR */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers2 className="w-4 h-4 text-indigo-600" />
              <span>9. Fabric Inventory Calculator</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono font-medium text-slate-700 bg-white p-3 rounded-lg border border-slate-150">
              <div className="flex justify-between col-span-2 border-b border-slate-100 pb-1 text-slate-500 font-sans font-bold">
                <span>Calculated Metrics</span>
                <span>Values</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Garment Base:</span>
                <span>{fabricRequiredBase} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Shrinkage (3%):</span>
                <span>{shrinkageLoss} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cutting Loss (5%):</span>
                <span>{cuttingLoss} m</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1 font-bold text-indigo-600">
                <span>Total Required:</span>
                <span>{totalFabricRequired} m</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1">
                <span className="text-slate-400">Current Stock:</span>
                <span>{selectedFabric.stock} m</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1 font-bold">
                <span className="text-slate-400">Reserved:</span>
                <span className={isFabricReserved ? "text-emerald-600" : "text-slate-400"}>{fabricReserved} m</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1 font-bold">
                <span className="text-slate-400">Remaining:</span>
                <span className={fabricRemaining < 0 ? "text-red-500" : "text-emerald-600"}>{fabricRemaining} m</span>
              </div>
            </div>
          </div>

        </div>

        {/* ─── CENTER PANEL (45%): MEASUREMENTS & CONFIG ─── */}
        <div className="lg:col-span-6 border-r border-slate-200 bg-white flex flex-col overflow-y-auto p-4 space-y-4">
          
          {/* SECTION 3: GARMENT QUICK SELECT */}
          <div className={`p-3 rounded-xl border transition-all ${focusedSection === "garments" ? "border-indigo-600 bg-indigo-50/20" : "border-slate-100 bg-slate-50/50"}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-indigo-600" />
                <span>3. Select Garment Pattern Type</span>
              </h3>
              <span className="text-[9px] text-slate-400 font-mono">[Use Arrows & Enter]</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {garmentsList.map((g, i) => {
                const isActive = activeGarmentIndex === i && focusedSection === "garments";
                const isSelected = selectedGarment === g;
                return (
                  <div
                    key={g}
                    onClick={() => {
                      setSelectedGarment(g);
                      setActiveGarmentIndex(i);
                      setFocusedSection("garments");
                    }}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${isActive ? "ring-2 ring-indigo-600" : ""} ${isSelected ? "bg-indigo-600 border-indigo-600 text-white font-bold shadow-xs" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-semibold"}`}
                  >
                    <p className="text-xs">{g}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: FABRIC SELECTION */}
          <div className={`p-3 rounded-xl border transition-all ${focusedSection === "fabrics" || focusedSection === "fabric_search" ? "border-indigo-600 bg-indigo-50/20" : "border-slate-100 bg-slate-50/50"}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>4. Fabric Stock & Dye Selection</span>
              </h3>
              <span className="text-[9px] text-slate-400 font-mono">[Ctrl + B]</span>
            </div>

            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                ref={fabricSearchRef}
                type="text"
                placeholder="Filter fabric list by mill or weave..."
                value={fabricSearch}
                onChange={(e) => {
                  setFabricSearch(e.target.value);
                  setFocusedSection("fabric_search");
                }}
                onFocus={() => setFocusedSection("fabric_search")}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1.5 shrink-0">
              {filteredFabrics.map((f, i) => {
                const isActive = activeFabricIndex === i && (focusedSection === "fabrics" || focusedSection === "fabric_search");
                const isSelected = selectedFabric.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      setSelectedFabric(f);
                      setActiveFabricIndex(i);
                      setFocusedSection("fabrics");
                    }}
                    className={`min-w-[140px] max-w-[160px] p-2.5 rounded-xl border cursor-pointer transition-all ${isActive ? "ring-2 ring-indigo-600" : ""} ${isSelected ? "bg-indigo-55 border-indigo-500 shadow-sm" : "bg-white hover:bg-slate-50 border-slate-200"}`}
                  >
                    <p className="font-bold text-slate-800 text-[11px] truncate">{f.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{f.brand}</p>
                    <div className="mt-1.5 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-500">₹{f.price}/m</span>
                      <span className={`font-bold ${f.stock < 10 ? "text-red-500" : "text-emerald-600"}`}>{f.stock}m left</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">Lot: {f.lotNo}</p>
                  </div>
                );
              })}
              {filteredFabrics.length === 0 && (
                <div className="py-4 text-center text-slate-400 w-full font-bold">No matching fabrics in inventory.</div>
              )}
            </div>
          </div>

          {/* SECTION 5: COLOR SELECTION */}
          <div className={`p-3 rounded-xl border transition-all ${focusedSection === "colors" ? "border-indigo-600 bg-indigo-50/20" : "border-slate-100 bg-slate-50/50"}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>5. Contrast Stitching Dye/Hue Swatches</span>
              </h3>
              <span className="text-[9px] text-slate-400 font-mono">[Enter Select]</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {colorsList.map((c, i) => {
                const isActive = activeColorIndex === i && focusedSection === "colors";
                const isSelected = selectedColor.name === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => {
                      setSelectedColor(c);
                      setActiveColorIndex(i);
                      setFocusedSection("colors");
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${isActive ? "ring-2 ring-indigo-600" : ""} ${isSelected ? "border-indigo-600 bg-indigo-50/40 text-indigo-900 shadow-2xs" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    <div className="w-3.5 h-3.5 rounded border border-slate-200 shadow-2xs" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 6: Excel-style MEASUREMENTS SPREADSHEET */}
          <div className={`p-3.5 rounded-xl border transition-all ${focusedSection === "measurements" ? "border-indigo-600 bg-indigo-50/20" : "border-slate-100 bg-slate-50/50"}`}>
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-indigo-600" />
                <span>6. Bespoke Measurements Grid (Inches)</span>
              </h3>
              <span className="text-[9px] text-slate-400 font-mono">[Ctrl + M] Enter (↓) Tab (→)</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {measurementLabels.map((lbl, i) => {
                return (
                  <div key={lbl} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-150 shadow-2xs">
                    <span className="font-mono font-bold text-slate-500 text-xs pl-1">{lbl}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={(el) => (measurementRefs.current[i] = el)}
                        type="number"
                        step="0.25"
                        value={measurements[lbl] || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setMeasurements(prev => ({ ...prev, [lbl]: val }));
                        }}
                        onFocus={() => setFocusedSection("measurements")}
                        onKeyDown={(e) => handleMeasurementKeyDown(i, e)}
                        className="w-20 text-center font-mono font-extrabold text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="text-slate-400 font-mono text-[10px]">in</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 7: DESIGN CUSTOMIZATION TILES */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>7. Design Styling Customizations</span>
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              {Object.keys(customizationOptions).map((key) => {
                const isSelected = activeCustomKey === key;
                return (
                  <div
                    key={key}
                    onClick={() => setActiveCustomKey(key)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-semibold ${isSelected ? "bg-indigo-600 border-indigo-600 text-white font-bold shadow-xs" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  >
                    <span className={`text-[9px] block uppercase ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>{key}</span>
                    <span className="truncate block font-bold mt-0.5">{customizations[key]}</span>
                  </div>
                );
              })}
            </div>

            {/* Inline Custom Options Selector Swatches */}
            <div className="mt-3 bg-white p-3 rounded-xl border border-slate-150">
              <span className="text-[10px] text-slate-400 font-bold block uppercase mb-2">Select Style for: {activeCustomKey}</span>
              <div className="flex flex-wrap gap-1.5">
                {customizationOptions[activeCustomKey].map((option) => {
                  const isOptSelected = customizations[activeCustomKey] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => setCustomizations(prev => ({ ...prev, [activeCustomKey]: option }))}
                      className={`px-3 py-1.5 border text-xs font-bold rounded-lg cursor-pointer transition-all ${isOptSelected ? "bg-slate-900 border-slate-900 text-white font-extrabold" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 8: TAILOR ASSIGNMENT */}
          <div className={`p-3 rounded-xl border transition-all ${focusedSection === "tailors" ? "border-indigo-600 bg-indigo-50/20" : "border-slate-100 bg-slate-50/50"}`}>
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-600" />
                <span>8. Tailor Line Assignment</span>
              </h3>
              <span className="text-[9px] text-slate-400 font-mono">[Ctrl + T] Arrow Select</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {defaultTailors.map((t, idx) => {
                const isSelected = selectedTailor.id === t.id;
                const isFocused = activeTailorIndex === idx && focusedSection === "tailors";
                const availabilityColor = t.availability === "Available" ? "bg-emerald-500" : t.availability === "Busy" ? "bg-amber-500" : "bg-red-500";
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTailor(t);
                      setActiveTailorIndex(idx);
                      setFocusedSection("tailors");
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${isFocused ? "ring-2 ring-indigo-600" : ""} ${isSelected ? "bg-indigo-50 border-indigo-500 shadow-2xs" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[10px] uppercase font-mono border border-slate-200">
                        {t.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Workload: {t.jobs} Active Jobs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${availabilityColor}`} />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{t.availability}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ─── RIGHT PANEL (20%): PREVIEW & COSTS ─── */}
        <div className="lg:col-span-2 bg-slate-900 border-l border-slate-800 text-white flex flex-col justify-between overflow-y-auto p-4 space-y-4 shrink-0">
          
          <div className="space-y-4">
            {/* SECTION 10: LIVE PREVIEW */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono tracking-widest text-indigo-400 uppercase font-bold block">10. Live CAD Preview</span>
              <div className="h-44 border border-slate-800 rounded-xl bg-slate-950/80 flex items-center justify-center p-3 relative shadow-inner">
                <div className="w-36 h-36 flex items-center justify-center">
                  {renderSVGBlueprint()}
                </div>
                <div className="absolute bottom-2 inset-x-2 flex justify-around text-[9px] font-mono bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-indigo-300">
                  <span>C:{measurements.Chest}</span>
                  <span>W:{measurements.Waist}</span>
                  <span>S:{measurements.Shoulder}</span>
                  <span>L:{measurements.Length}</span>
                </div>
              </div>
            </div>

            {/* SECTION 11: COST BREAKDOWN */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono tracking-widest text-indigo-400 uppercase font-bold block">11. Cost Ledger Breakdown</span>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2 text-[10px] font-mono font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fabric Cost:</span>
                  <span>₹{fabricCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Accessories:</span>
                  <span>₹{accessoriesCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Embroidery:</span>
                  <span>₹{embroideryCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tailoring Line:</span>
                  <span>₹{tailorCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SGST/CGST (5%):</span>
                  <span>₹{gstCost}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-sm text-indigo-400">
                  <span className="font-sans">Grand Total:</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* SECTION 12: PRODUCTION WORKFLOW PANEL */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono tracking-widest text-indigo-400 uppercase font-bold block">12. Active Production Spec</span>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2 text-[10px] font-mono">
                <div className="flex justify-between truncate">
                  <span className="text-slate-500">Tailor:</span>
                  <span className="font-bold">{selectedTailor.name.split(" ")[1]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Job Card:</span>
                  <span className="font-bold text-indigo-300">JC-{orderNo.split("-")[2]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stage:</span>
                  <span className="font-bold uppercase text-emerald-400">{orderStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Date:</span>
                  <span className="font-bold">{deliveryDate}</span>
                </div>
              </div>
            </div>

            {/* SECTION 14: CUSTOMER DOSSIER SIDEBAR */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono tracking-widest text-indigo-400 uppercase font-bold block">14. Selected Customer Dossier</span>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2 text-[10px]">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Loyalty Balance:</span>
                  <span className="font-bold text-indigo-400">{selectedCustomer?.loyaltyPoints || 0} LP</span>
                </div>
                <div className="border-t border-slate-800/80 pt-2 space-y-1">
                  <span className="text-slate-500 font-bold block uppercase text-[9px]">Last Measurements:</span>
                  <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-slate-400">
                    <div>Chest: 38"</div>
                    <div>Waist: 32"</div>
                    <div>Sleeve: 25"</div>
                    <div>Shoulder: 18"</div>
                  </div>
                  <button
                    onClick={handleLoadPreviousMeasurements}
                    className="w-full mt-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold rounded cursor-pointer transition-colors"
                  >
                    [Ctrl+L] Load Registry
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center text-slate-500 text-[9px] font-mono">
            CAD Terminal Sync Ok
          </div>

        </div>

      </div>

      {/* ─── SECTION 13: BOTTOM ACTION BAR (STICKY FOOTER) ─── */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-400">
            Active: <strong className="text-white">{selectedCustomer?.name}</strong> &bull; Garment: <strong className="text-indigo-400">{selectedGarment}</strong>
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold font-mono">
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
          >
            Save Draft [Ctrl+S]
          </button>
          
          <button
            onClick={handleReserveFabric}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
          >
            Reserve Fabric [F8]
          </button>

          <button
            onClick={handleGenerateJobCard}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
          >
            Job Card [Ctrl+J]
          </button>

          <button
            onClick={handleSendToProduction}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
          >
            Send to Production [Ctrl+P]
          </button>

          <button
            onClick={handlePushToPOS}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-900/30"
          >
            <span>Proceed to checkout [F9]</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── SECTION 16: POPUP / MODALS ─── */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-mono text-slate-800 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-150">
              <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-1">
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Job Card Print Preview</span>
              </h3>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-1 rounded-md text-xs cursor-pointer"
              >
                Close [Esc]
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-[11px] space-y-4">
              <div className="text-center border-b-2 border-dashed border-slate-300 pb-3">
                <h2 className="font-bold text-sm tracking-wider uppercase">VastraERP Production Card</h2>
                <p className="text-slate-400">Job Card No: JC-{orderNo.split("-")[2]}</p>
                <p className="text-slate-400">Date: {new Date().toLocaleDateString("en-IN")}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-slate-150 pb-3 font-semibold">
                <div>Customer: {selectedCustomer.name}</div>
                <div>Garment: {selectedGarment}</div>
                <div>Fabric: {selectedFabric.name}</div>
                <div>Color: {selectedColor.name}</div>
                <div>Tailor Line: {selectedTailor.name}</div>
                <div>Target Date: {deliveryDate}</div>
              </div>

              <div>
                <span className="font-bold block uppercase text-[10px] mb-1">Spreadsheet Spec:</span>
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 font-bold border-b border-slate-200">
                      <th className="p-2 border-r border-slate-250">Dimension</th>
                      <th className="p-2 text-center">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(measurements).map(([k, v]) => (
                      <tr key={k} className="border-b border-slate-200">
                        <td className="p-2 border-r border-slate-250 font-bold text-slate-500">{k}</td>
                        <td className="p-2 text-center font-extrabold">{v}"</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <span className="font-bold block uppercase text-[10px] mb-1">Styling Specifications:</span>
                <div className="grid grid-cols-2 gap-1 text-slate-500 font-semibold">
                  {Object.entries(customizations).map(([k, v]) => (
                    <div key={k}>{k}: <strong className="text-slate-800">{v}</strong></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex gap-2 justify-end">
              <button
                onClick={() => {
                  window.print();
                  setShowPrintPreview(false);
                }}
                className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print to Thermal Hanger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-mono text-slate-800 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-150">
              <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Bespoke Measurement History</span>
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-1 rounded-md text-xs cursor-pointer"
              >
                Close [Esc]
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-[11px] text-slate-400">Past logs verified in databases under: <strong>{selectedCustomer.name}</strong></p>
              
              <div className="space-y-2 text-[10px] font-medium divide-y divide-slate-100 max-h-64 overflow-y-auto">
                <div className="p-2 bg-indigo-50/20 border border-indigo-100 rounded-lg space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Active Ticket (Today)</span>
                    <span className="text-indigo-600">Saved Draft</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-500 font-mono">
                    <span>C: 38"</span>
                    <span>W: 32"</span>
                    <span>S: 18"</span>
                  </div>
                </div>

                <div className="p-2 space-y-1.5 pt-2">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Order No: SO-2026-8941</span>
                    <span className="text-slate-400">2026-06-25</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-400 font-mono">
                    <span>C: 39"</span>
                    <span>W: 33"</span>
                    <span>S: 18.5"</span>
                  </div>
                </div>

                <div className="p-2 space-y-1.5 pt-2">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Order No: SO-2026-3024</span>
                    <span className="text-slate-400">2026-04-12</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-400 font-mono">
                    <span>C: 38"</span>
                    <span>W: 32"</span>
                    <span>S: 18"</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  handleLoadPreviousMeasurements();
                  setShowHistoryModal(false);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer shadow-sm text-center"
              >
                Load Last Measurements [Ctrl+L]
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

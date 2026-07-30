import React, { useState, useMemo, useEffect } from "react";
import api from '../api/axios';

import {
  Sparkles,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  DollarSign,
  Users,
  Percent,
  Globe,
  ShoppingCart,
  Plus,
  Trash2,
  Download,
  AlertTriangle,
  Activity,
  Award,
} from "lucide-react";
import { StaffCommissionPanel } from "./StaffCommissionPanel";

// High fidelity types for Commission Module

export const CommissionView = ({
  employees,
  invoices = [],
  onAddNotification,
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState("staff");

  // Salesperson products sold tracking states
  const [selectedSalesperson, setSelectedSalesperson] = useState("");
  const [soldProductsSearchQuery, setSoldProductsSearchQuery] = useState("");

  // Dynamic Salesperson Names from both roster employees and invoices
  const salespeopleNames = useMemo(() => {
    const namesSet = new Set();
    // Add roster Salesperson employees
    employees
      .filter((e) => e.role === "Salesperson")
      .forEach((e) => namesSet.add(e.name));
    // Add any salesperson names that have been entered in invoices
    invoices.forEach((inv) => {
      if (inv.salespersonName && inv.salespersonName.trim()) {
        namesSet.add(inv.salespersonName.trim());
      }
    });
    return Array.from(namesSet);
  }, [employees, invoices]);

  const currentSalesperson = selectedSalesperson || salespeopleNames[0] || "";

  // Map products sold by each salesperson from invoices
  const salespersonSalesHistory = useMemo(() => {
    const history = {};

    // Initialize with all salespeople names
    salespeopleNames.forEach((name) => {
      history[name] = [];
    });

    invoices.forEach((inv) => {
      const spName = inv.salespersonName?.trim();
      if (spName) {
        // Find match in our list (case-insensitive or exact)
        const match =
          salespeopleNames.find(
            (n) => n.toLowerCase() === spName.toLowerCase(),
          ) || spName;
        if (!history[match]) {
          history[match] = [];
        }
        inv.items.forEach((item, idx) => {
          history[match].push({
            id: `${inv.id}-${idx}`,
            invoiceNo: inv.invoiceNo,
            date: inv.date,
            customerName: inv.customerName,
            productName: item.name,
            sku: item.sku,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice,
          });
        });
      }
    });

    return history;
  }, [salespeopleNames, invoices]);

  const [customCategories, setCustomCategories] = useState([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatType, setNewCatType] = useState("Percentage");
  const [newCatValue, setNewCatValue] = useState(10);

  // Dynamic category partner & record states
  const [categoryPartners, setCategoryPartners] = useState([
    {
      id: "cp-1",
      categoryId: "b2b-agents",
      name: "Elite Garments Agency",
      referenceNo: "B2B-ELITE",
      phone: "9822334455",
      email: "elite@agency.com",
      status: "Active",
      revenue: 150000,
      commissionEarned: 15000,
    },
    {
      id: "cp-2",
      categoryId: "b2b-agents",
      name: "Sovereign Exports",
      referenceNo: "B2B-SOV",
      phone: "9988776655",
      email: "sov@exports.com",
      status: "Active",
      revenue: 320000,
      commissionEarned: 32000,
    },
  ]);
  const [categoryRecords, setCategoryRecords] = useState([
    {
      id: "cr-1",
      categoryId: "b2b-agents",
      partnerId: "cp-1",
      partnerName: "Elite Garments Agency",
      referenceNo: "REF-8891",
      saleAmount: 85000,
      commissionAmount: 8500,
      status: "Settled",
      date: "2026-06-24",
    },
    {
      id: "cr-2",
      categoryId: "b2b-agents",
      partnerId: "cp-2",
      partnerName: "Sovereign Exports",
      referenceNo: "REF-9402",
      saleAmount: 120000,
      commissionAmount: 12000,
      status: "Pending",
      date: "2026-06-27",
    },
  ]);

  // Form states for dynamic categories
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");

  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [recordPartnerId, setRecordPartnerId] = useState("");
  const [recordRefNo, setRecordRefNo] = useState("");
  const [recordSaleAmt, setRecordSaleAmt] = useState(0);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [channelFilter, setChannelFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [showAddMarketplaceModal, setShowAddMarketplaceModal] = useState(false);
  const [showAddInfluencerModal, setShowAddInfluencerModal] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // FORM STATES
  // Marketplace form state
  const [mpMarketplace, setMpMarketplace] = useState("Amazon");
  const [mpOrderId, setMpOrderId] = useState("");
  const [mpInvoiceNo, setMpInvoiceNo] = useState("");
  const [mpCustomerName, setMpCustomerName] = useState("");
  const [mpProductName, setMpProductName] = useState("");
  const [mpSellingPrice, setMpSellingPrice] = useState(0);
  const [mpCommissionPercent, setMpCommissionPercent] = useState(15);
  const [mpShipping, setMpShipping] = useState(80);
  const [mpPackaging, setMpPackaging] = useState(30);
  const [mpTax, setMpTax] = useState(18);

  // Influencer form state
  const [infName, setInfName] = useState("");
  const [infPlatform, setInfPlatform] = useState("Instagram");
  const [infHandle, setInfHandle] = useState("");
  const [infPhone, setInfPhone] = useState("");
  const [infEmail, setInfEmail] = useState("");
  const [infReferralCode, setInfReferralCode] = useState("");
  const [infCommissionType, setInfCommissionType] = useState("Percentage");
  const [infCommissionValue, setInfCommissionValue] = useState(10);
  const [infFollowers, setInfFollowers] = useState(25000);

  // DEMO DATA STATE (Now Dynamic)
  const [marketplaceOrders, setMarketplaceOrders] = useState([]);

  const [influencers, setInfluencers] = useState([]);

  // Fetch staffList to get real monthly targets
  const [staffList, setStaffList] = useState([]);
  const [editingTargetId, setEditingTargetId] = useState(null);
  const [editingTargetValue, setEditingTargetValue] = useState("");
  const [localPayouts, setLocalPayouts] = useState({});

  const [settlementHistory, setSettlementHistory] = useState([]);

  const [auditLogs, setAuditLogs] = useState([]);

  const [commissionSettings, setCommissionSettings] = useState({
    isEnabled: true,
    salespersonPercentage: 1.5,
    workerPercentage: 0.5,
    calculationBasis: 'Selling Price'
  });

  // Fetch all commissions data dynamically
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [
          marketplacesRes, 
          influencersRes, 
          rulesRes, 
          settlementsRes, 
          auditRes,
          staffRes
        ] = await Promise.all([
          api.get(`/commissions/marketplace`),
          api.get(`/commissions/influencers`),
          api.get(`/commissions/staff/settings`),
          api.get(`/commissions/settlements`),
          api.get(`/commissions/audit`),
          api.get(`/staff`)
        ]);

        if (staffRes.ok) {
          const sData = staffRes.data;
          setStaffList(sData.data || []);
        }

        if (marketplacesRes.ok) {
          const mData = marketplacesRes.data;
          setMarketplaceOrders(mData.data || []);
        }
        if (influencersRes.ok) {
          const iData = influencersRes.data;
          setInfluencers(iData.data || []);
        }
        if (rulesRes.ok) {
          const sData = rulesRes.data;
          if (sData.data) setCommissionSettings(sData.data);
        }
        if (settlementsRes.ok) {
          const sData = settlementsRes.data;
          setSettlementHistory(sData.data || []);
        }
        if (auditRes.ok) {
          const aData = auditRes.data;
          setAuditLogs(aData.data || []);
        }
      } catch (err) {
        console.error("Error fetching commission data", err);
      }
    };
    fetchData();
  }, []);

  // Fetch Staff Stats
  const [staffStats, setStaffStats] = useState(null);
  useEffect(() => {
    const fetchStaffStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/commissions/staff/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setStaffStats(res.data.data.breakdown);
        }
      } catch (err) {
        console.error("Failed to fetch staff stats", err);
      }
    };
    fetchStaffStats();
  }, []);

  const salespersonIncentives = useMemo(() => {
    const combinedStaff = [...staffList];
    
    // Add roster Salesperson employees
    employees.forEach(emp => {
       if (!combinedStaff.find(s => (s._id === emp.id || s.name === emp.name))) {
          combinedStaff.push({ _id: emp.id, name: emp.name, designation: emp.role || 'Salesperson', monthlyTarget: 150000 });
       }
    });

    // Add any salesperson names that have been entered in invoices but are missing from staff lists
    invoices.forEach((inv) => {
      const spName = inv.salespersonName?.trim();
      if (spName && !combinedStaff.find(s => (s.name || '').toLowerCase() === spName.toLowerCase())) {
         combinedStaff.push({ _id: `temp-${spName}`, name: spName, designation: 'Salesperson', monthlyTarget: 150000 });
      }
    });

    return combinedStaff
      .filter(s => (s.designation || '').toLowerCase().includes('sales') || s.role === 'Salesperson' || (s.designation || '').toLowerCase().includes('tailor'))
      .map(emp => {
        const name = emp.name;
        const salesAchieved = invoices.reduce((sum, inv) => {
          if ((inv.salespersonName || '').toLowerCase() === name.toLowerCase()) {
            return sum + (inv.grandTotal || 0);
          }
          return sum;
        }, 0);
        
        const target = emp.monthlyTarget || 150000;
        const isTailor = (emp.designation || '').toLowerCase().includes('tailor');
        const basePct = isTailor ? 0.05 : 0.02; // 5% for tailors, 2% for sales
        const baseCommission = Math.round(salesAchieved * basePct);
        const isPaid = localPayouts[emp._id];

        return {
          employeeId: emp._id,
          employeeName: emp.name,
          department: emp.designation || 'Retail Sales Floor',
          role: isTailor ? 'TAILOR' : 'SALESPERSON',
          monthlyTarget: target,
          salesAchieved,
          commissionRules: [`${basePct * 100}% Floor Commission`],
          commissionPending: isPaid ? 0 : baseCommission,
          commissionPaid: isPaid ? baseCommission : (emp.commissionEarned || 0)
        };
      });
  }, [staffList, employees, invoices, localPayouts]);

  // Master stats counts
  const totalMarketplaceSales = useMemo(
    () => marketplaceOrders.reduce((sum, item) => sum + item.sellingPrice, 0),
    [marketplaceOrders],
  );
  const totalMarketplaceCommission = useMemo(
    () =>
      marketplaceOrders.reduce((sum, item) => sum + item.commissionAmount, 0),
    [marketplaceOrders],
  );
  const totalMarketplaceNetSettlement = useMemo(
    () => marketplaceOrders.reduce((sum, item) => sum + item.netSettlement, 0),
    [marketplaceOrders],
  );
  const pendingMarketplaceSettlement = useMemo(
    () =>
      marketplaceOrders
        .filter((m) => m.settlementStatus === "Pending")
        .reduce((sum, item) => sum + item.netSettlement, 0),
    [marketplaceOrders],
  );

  const totalInfluencerSales = useMemo(
    () => influencers.reduce((sum, item) => sum + item.revenueGenerated, 0),
    [influencers],
  );
  const totalInfluencerCommission = useMemo(
    () => influencers.reduce((sum, item) => sum + item.commissionEarned, 0),
    [influencers],
  );
  const pendingInfluencerCommission = useMemo(
    () => influencers.reduce((sum, item) => sum + item.commissionPending, 0),
    [influencers],
  );

  const totalSalespersonCommissions = useMemo(() => {
    if (Array.isArray(staffStats)) {
      const sp = staffStats.find(s => s._id === 'Salesperson');
      return sp ? sp.totalCommission : 0;
    }
    return 0;
  }, [staffStats]);

  const pendingSalespersonCommissions = useMemo(() => {
    if (Array.isArray(staffStats)) {
      const sp = staffStats.find(s => s._id === 'Salesperson');
      return sp ? sp.pendingCommission : 0;
    }
    return 0;
  }, [staffStats]);

  const totalWorkerCommissions = useMemo(() => {
    if (Array.isArray(staffStats)) {
      const w = staffStats.find(s => s._id === 'Worker');
      return w ? w.totalCommission : 0;
    }
    return 0;
  }, [staffStats]);

  const pendingWorkerCommissions = useMemo(() => {
    if (Array.isArray(staffStats)) {
      const w = staffStats.find(s => s._id === 'Worker');
      return w ? w.pendingCommission : 0;
    }
    return 0;
  }, [staffStats]);

  // Handle Sort
  const requestSort = (key) => {
    let direction = "asc";
    if (sortBy === key && sortOrder === "asc") {
      direction = "desc";
    }
    setSortBy(key);
    setSortOrder(direction);
  };

  // Marketplace filtered / sorted orders
  const sortedMarketplaceOrders = useMemo(() => {
    let res = [...marketplaceOrders];
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (item) =>
          item.orderId.toLowerCase().includes(q) ||
          item.invoiceNo.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q) ||
          item.marketplace.toLowerCase().includes(q),
      );
    }
    // Filter by Marketplace type
    if (channelFilter !== "All") {
      res = res.filter((item) => item.marketplace === channelFilter);
    }
    // Filter by Status
    if (statusFilter !== "All") {
      res = res.filter(
        (item) =>
          item.settlementStatus === statusFilter ||
          item.orderStatus === statusFilter,
      );
    }

    // Sort
    res.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
    });

    return res;
  }, [
    marketplaceOrders,
    searchQuery,
    channelFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  // Influencer campaign search / filters
  const filteredInfluencers = useMemo(() => {
    let res = [...influencers];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.handle.toLowerCase().includes(q) ||
          item.referralCode.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "All") {
      res = res.filter((item) => item.status === statusFilter);
    }
    return res;
  }, [influencers, searchQuery, statusFilter]);

  // Handle CRUD
  const handleAddMarketplaceOrder = (e) => {
    e.preventDefault();
    if (!mpOrderId || !mpCustomerName || !mpProductName || !mpSellingPrice) {
      onAddNotification(
        "Form Validation",
        "Please fill in all mandatory billing fields.",
        "warning",
      );
      return;
    }

    const calculatedCommission =
      Math.round(((mpSellingPrice * mpCommissionPercent) / 100) * 10) / 10;
    const gstAmt = Math.round(mpSellingPrice * (mpTax / 100) * 10) / 10;
    const settlement =
      mpSellingPrice - calculatedCommission - mpShipping - mpPackaging - gstAmt;

    const newOrder = {
      id: `mpo-${marketplaceOrders.length + 101}`,
      marketplace: mpMarketplace,
      orderId: mpOrderId,
      invoiceNo: mpInvoiceNo || `INV/2026/${1100 + marketplaceOrders.length}`,
      customerName: mpCustomerName,
      productName: mpProductName,
      sellingPrice: Number(mpSellingPrice),
      commissionPercent: Number(mpCommissionPercent),
      commissionAmount: calculatedCommission,
      shippingCharges: Number(mpShipping),
      packagingCharges: Number(mpPackaging),
      tax: gstAmt,
      netSettlement: Math.round(settlement * 10) / 10,
      orderStatus: "Pending",
      settlementStatus: "Pending",
      settlementDate: "-",
      profit: Math.round(mpSellingPrice * 0.4 * 10) / 10, // general estimate
    };

    setMarketplaceOrders([newOrder, ...marketplaceOrders]);
    setShowAddMarketplaceModal(false);
    onAddNotification(
      "Marketplace Order Recorded",
      `Added order ${mpOrderId} on ${mpMarketplace} successfully.`,
      "success",
    );

    // Add Audit Log
    const newAudit = {
      id: `al-${Date.now()}`,
      timestamp: "2026-06-28 23:14:02",
      user: "Current User",
      action: "ADDED_MARKETPLACE_ORDER",
      module: "Marketplace Reconciliation",
      details: `Created record for Order ${mpOrderId} sold on ${mpMarketplace}.`,
    };
    setAuditLogs([newAudit, ...auditLogs]);

    // Clear form
    setMpOrderId("");
    setMpInvoiceNo("");
    setMpCustomerName("");
    setMpProductName("");
    setMpSellingPrice(0);
  };

  const handleAddInfluencer = (e) => {
    e.preventDefault();
    if (!infName || !infHandle || !infReferralCode) {
      onAddNotification(
        "Form Validation",
        "Please specify Name, Social Handle, and Coupon Code.",
        "warning",
      );
      return;
    }

    const newInf = {
      id: `inf-${influencers.length + 101}`,
      name: infName,
      platform: infPlatform,
      handle: infHandle,
      phone: infPhone || "9876543211",
      email:
        infEmail || `${infName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
      referralCode: infReferralCode.toUpperCase(),
      commissionType: infCommissionType,
      commissionValue: Number(infCommissionValue),
      duration: "28 Jun - 28 Jul 2026",
      status: "Active",
      followers: Number(infFollowers),
      rating: 4.5,
      promoCodeUsage: 0,
      ordersGenerated: 0,
      revenueGenerated: 0,
      commissionEarned: 0,
      commissionPending: 0,
      commissionPaid: 0,
      conversionRate: 0.0,
    };

    setInfluencers([newInf, ...influencers]);
    setShowAddInfluencerModal(false);
    onAddNotification(
      "Campaign Activated",
      `Influencer ${infName} coupon ${newInf.referralCode} is now active.`,
      "success",
    );

    // Add Audit Log
    const newAudit = {
      id: `al-${Date.now()}`,
      timestamp: "2026-06-28 23:14:50",
      user: "Current User",
      action: "CREATED_INFLUENCER_CAMPAIGN",
      module: "Affiliate Campaign Manager",
      details: `Registered Campaign Coupon ${newInf.referralCode} for ${infName}.`,
    };
    setAuditLogs([newAudit, ...auditLogs]);

    // Reset
    setInfName("");
    setInfHandle("");
    setInfReferralCode("");
    setInfPhone("");
    setInfEmail("");
    setInfFollowers(25000);
  };

  const handleApproveSettlement = (type, id) => {
    if (type === "marketplace") {
      setMarketplaceOrders((prev) =>
        prev.map((o) => {
          if (o.id === id) {
            onAddNotification(
              "Settlement Cleared",
              `Order ${o.orderId} net settlement marked as PAID.`,
              "success",
            );
            // Record to Settlement history
            const hist = {
              id: `sh-${Date.now().toString().slice(-4)}`,
              date: "2026-06-28",
              type: "Marketplace",
              recipient: `${o.marketplace} Settlements`,
              referenceNo: `BANK-${Math.floor(Math.random() * 900000) + 100000}`,
              amount: o.netSettlement,
              paymentMethod: "Bank Transfer",
              status: "Completed",
              processedBy: "Current User",
            };
            setSettlementHistory([hist, ...settlementHistory]);

            return {
              ...o,
              settlementStatus: "Settled",
              settlementDate: "2026-06-28",
            };
          }
          return o;
        }),
      );
    } else {
      setInfluencers((prev) =>
        prev.map((inf) => {
          if (inf.id === id) {
            if (inf.commissionPending <= 0) {
              onAddNotification(
                "Commissions Zero",
                "No pending commission remains for approval.",
                "warning",
              );
              return inf;
            }
            const payoutAmount = inf.commissionPending;
            onAddNotification(
              "Influencer Commission Paid",
              `Issued ₹${payoutAmount.toLocaleString()} to ${inf.name}.`,
              "success",
            );

            // Record to Settlement history
            const hist = {
              id: `sh-${Date.now().toString().slice(-4)}`,
              date: "2026-06-28",
              type: "Influencer",
              recipient: `${inf.name} (${inf.referralCode})`,
              referenceNo: `UPI-${Math.floor(Math.random() * 90000000) + 10000000}`,
              amount: payoutAmount,
              paymentMethod: "UPI",
              status: "Completed",
              processedBy: "Current User",
            };
            setSettlementHistory([hist, ...settlementHistory]);

            return {
              ...inf,
              commissionPaid: inf.commissionPaid + payoutAmount,
              commissionPending: 0,
            };
          }
          return inf;
        }),
      );
    }
  };

  const handleApproveSalespersonPayout = (employeeId) => {
    setLocalPayouts(prev => ({ ...prev, [employeeId]: true }));
    onAddNotification("Payout Processed", "Funds disbursed to salesperson.", "success");
    
    const emp = salespersonIncentives.find(e => e.employeeId === employeeId);
    if (emp && emp.commissionPending > 0) {
      const hist = {
        id: `sh-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().slice(0, 10),
        type: "Salesperson",
        recipient: emp.employeeName,
        referenceNo: `EPAY-${Math.floor(Math.random() * 800000) + 200000}`,
        amount: emp.commissionPending,
        paymentMethod: "Bank Transfer",
        status: "Completed",
        processedBy: "Current User",
      };
      setSettlementHistory([hist, ...settlementHistory]);
    }
  };

  const handleCreateCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCatName) {
      onAddNotification(
        "Validation Error",
        "Category name is required.",
        "warning",
      );
      return;
    }
    const catId = newCatName.toLowerCase().replace(/\s+/g, "-");
    if (
      customCategories.some((c) => c.id === catId) ||
      ["salesperson", "rules", "history", "marketplace", "influencer"].includes(
        catId,
      )
    ) {
      onAddNotification(
        "Validation Error",
        "Category name already exists or is reserved.",
        "warning",
      );
      return;
    }
    const newCat = {
      id: catId,
      name: newCatName,
      description: newCatDesc || `Dynamic commissions ledger for ${newCatName}`,
      commissionType: newCatType,
      defaultValue: Number(newCatValue),
    };
    setCustomCategories([...customCategories, newCat]);
    setShowAddCategoryModal(false);
    setActiveTab(catId);
    setNewCatName("");
    setNewCatDesc("");
    setNewCatType("Percentage");
    setNewCatValue(10);
    onAddNotification(
      "Category Created",
      `Dynamic category "${newCatName}" was created successfully.`,
      "success",
    );
  };

  const handleAddDynamicPartner = (e) => {
    e.preventDefault();
    if (!partnerName || !partnerCode) {
      onAddNotification(
        "Validation Error",
        "Partner Name and Referral Code/Reference are mandatory.",
        "warning",
      );
      return;
    }
    const newPartner = {
      id: `cp-${Date.now()}`,
      categoryId: activeTab,
      name: partnerName,
      referenceNo: partnerCode.toUpperCase(),
      phone: partnerPhone || "9900112233",
      email:
        partnerEmail ||
        `${partnerName.toLowerCase().replace(/\s+/g, "")}@partner.com`,
      status: "Active",
      revenue: 0,
      commissionEarned: 0,
    };
    setCategoryPartners([...categoryPartners, newPartner]);
    setShowAddPartnerModal(false);
    setPartnerName("");
    setPartnerCode("");
    setPartnerPhone("");
    setPartnerEmail("");
    onAddNotification(
      "Partner Enrolled",
      `Enrolled partner "${partnerName}" under active category.`,
      "success",
    );
  };

  const handleAddDynamicRecord = (e) => {
    e.preventDefault();
    const partner = categoryPartners.find((p) => p.id === recordPartnerId);
    if (!partner || recordSaleAmt <= 0) {
      onAddNotification(
        "Validation Error",
        "Please select a valid partner and specify sale amount.",
        "warning",
      );
      return;
    }
    const activeCat = customCategories.find((c) => c.id === activeTab);
    const commRate = activeCat ? activeCat.defaultValue : 10;
    const commType = activeCat ? activeCat.commissionType : "Percentage";
    let commAmt = 0;
    if (commType === "Percentage") {
      commAmt = Math.round((recordSaleAmt * commRate) / 100);
    } else {
      commAmt = commRate;
    }

    const newRecord = {
      id: `cr-${Date.now()}`,
      categoryId: activeTab,
      partnerId: recordPartnerId,
      partnerName: partner.name,
      referenceNo:
        recordRefNo || `TXN-${Math.floor(Math.random() * 90000) + 10000}`,
      saleAmount: Number(recordSaleAmt),
      commissionAmount: commAmt,
      status: "Pending",
      date: new Date().toISOString().slice(0, 10),
    };

    setCategoryPartners((prev) =>
      prev.map((p) =>
        p.id === partner.id
          ? {
              ...p,
              revenue: p.revenue + Number(recordSaleAmt),
              commissionEarned: p.commissionEarned + commAmt,
            }
          : p,
      ),
    );

    setCategoryRecords([newRecord, ...categoryRecords]);
    setShowAddRecordModal(false);
    setRecordPartnerId("");
    setRecordRefNo("");
    setRecordSaleAmt(0);
    onAddNotification(
      "Record Created",
      `Created commission record of ₹${commAmt.toLocaleString()} for ${partner.name}.`,
      "success",
    );
  };

  const handleApproveDynamicSettlement = (recordId) => {
    setCategoryRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          onAddNotification(
            "Payout Disbursed",
            `Settlement of ₹${rec.commissionAmount.toLocaleString()} paid successfully to ${rec.partnerName}.`,
            "success",
          );
          const hist = {
            id: `sh-${Date.now().toString().slice(-4)}`,
            date: new Date().toISOString().slice(0, 10),
            type: "Influencer",
            recipient: rec.partnerName,
            referenceNo: `BANK-DYN-${Math.floor(Math.random() * 90000) + 10000}`,
            amount: rec.commissionAmount,
            paymentMethod: "Bank Transfer",
            status: "Completed",
            processedBy: "Current User",
          };
          setSettlementHistory((prevHist) => [hist, ...prevHist]);

          return { ...rec, status: "Settled" };
        }
        return rec;
      }),
    );
  };

  const handleDeleteItem = (type, id) => {
    if (type === "marketplace") {
      setMarketplaceOrders((prev) => prev.filter((o) => o.id !== id));
      onAddNotification(
        "Deleted Order",
        "Marketplace order removed from ledger.",
        "danger",
      );
    } else if (type === "influencer") {
      setInfluencers((prev) => prev.filter((i) => i.id !== id));
      onAddNotification(
        "Campaign Terminated",
        "Influencer campaign removed.",
        "danger",
      );
    }
    setShowDeleteConfirm(null);
  };

  const handleExportSimulated = (format, moduleName) => {
    onAddNotification(
      "Export In Progress",
      `Compiling detailed ${moduleName} ledger files into ${format}...`,
      "info",
    );
    setTimeout(() => {
      onAddNotification(
        "Export Successful",
        `Downloaded detailed ${moduleName} commission summary in ${format} layout.`,
        "success",
      );
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="commission-mgmt-root">
      {/* Module Tabs Selector */}
      <div className="flex flex-wrap border-b border-slate-100 pb-px items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 bg-slate-100/60 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab("staff");
              setSearchQuery("");
              setStatusFilter("All");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "staff" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Staff Performance
          </button>



          <button
            onClick={() => {
              setActiveTab("rules");
              setSearchQuery("");
              setStatusFilter("All");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "rules" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Commission Rules Configuration
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTER SEGMENT */}
      {activeTab !== "rules" && (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search across ${activeTab} records...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-medium border border-slate-100 focus:border-indigo-500 rounded-xl outline-none transition-all text-slate-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 pr-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Marketplace filters */}
            {activeTab === "marketplace" && (
              <>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1.5 border border-slate-100 rounded-lg outline-none cursor-pointer"
                >
                  <option value="All">All Channels</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Meesho">Meesho</option>
                  <option value="Flipkart">Flipkart</option>
                  <option value="Myntra">Myntra</option>
                  <option value="Ajio">Ajio</option>
                  <option value="Shopify Orders">Shopify</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1.5 border border-slate-100 rounded-lg outline-none cursor-pointer"
                >
                  <option value="All">All Settlements</option>
                  <option value="Settled">Settled</option>
                  <option value="Pending">Pending Approval</option>
                  <option value="Disputed">Disputed/Returns</option>
                </select>
              </>
            )}

            {/* Influencer filters */}
            {activeTab === "influencer" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1.5 border border-slate-100 rounded-lg outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Campaigns</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
              </select>
            )}

            {/* Clear filters trigger */}
            {(searchQuery ||
              statusFilter !== "All" ||
              channelFilter !== "All") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                  setChannelFilter("All");
                }}
                className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENTS */}

      {/* 1. MARKETPLACE COMMISSION */}
      {activeTab === "marketplace" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  <th
                    className="p-3.5 cursor-pointer select-none"
                    onClick={() => requestSort("marketplace")}
                  >
                    Marketplace{" "}
                    {sortBy === "marketplace" &&
                      (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="p-3.5">Order Info</th>
                  <th className="p-3.5">Customer & Product</th>
                  <th
                    className="p-3.5 text-right cursor-pointer select-none"
                    onClick={() => requestSort("sellingPrice")}
                  >
                    Selling Price{" "}
                    {sortBy === "sellingPrice" &&
                      (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="p-3.5 text-right">Commission Info</th>
                  <th className="p-3.5 text-right">Shipping/Pkg</th>
                  <th className="p-3.5 text-right font-bold text-indigo-600">
                    Net Settlement
                  </th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedMarketplaceOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold">
                        No marketplace order records found.
                      </p>
                      <p className="text-[10px]">
                        Try resetting filters or record a new channel sale.
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedMarketplaceOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              order.marketplace === "Amazon"
                                ? "bg-amber-500"
                                : order.marketplace === "Myntra"
                                  ? "bg-rose-500"
                                  : order.marketplace === "Meesho"
                                    ? "bg-purple-600"
                                    : order.marketplace === "Flipkart"
                                      ? "bg-blue-500"
                                      : "bg-emerald-500"
                            }`}
                          />
                          <div>
                            <p className="font-extrabold text-slate-700">
                              {order.marketplace}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              ID: {order.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <p className="font-mono font-bold text-slate-800">
                          {order.orderId}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Invoice: {order.invoiceNo}
                        </p>
                      </td>
                      <td className="p-3.5 max-w-[200px]">
                        <p className="font-bold text-slate-700 truncate">
                          {order.customerName}
                        </p>
                        <p
                          className="text-[10px] text-slate-400 truncate"
                          title={order.productName}
                        >
                          {order.productName}
                        </p>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                        ₹{order.sellingPrice.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <p className="font-semibold text-red-600 font-mono">
                          ₹{order.commissionAmount.toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-400">
                          {order.commissionPercent}% charge
                        </p>
                      </td>
                      <td className="p-3.5 text-right text-slate-500 font-mono">
                        <p>₹{order.shippingCharges}</p>
                        <p className="text-[9px]">
                          Pkg: ₹{order.packagingCharges}
                        </p>
                      </td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-indigo-700 bg-indigo-50/20">
                        ₹{order.netSettlement.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              order.orderStatus === "Delivered"
                                ? "bg-emerald-50 text-emerald-600"
                                : order.orderStatus === "Returned"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                              order.settlementStatus === "Settled"
                                ? "bg-indigo-50 text-indigo-600"
                                : order.settlementStatus === "Disputed"
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : "bg-amber-100 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {order.settlementStatus === "Settled"
                              ? `Paid (${order.settlementDate})`
                              : order.settlementStatus}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {order.settlementStatus !== "Settled" && (
                            <button
                              onClick={() =>
                                handleApproveSettlement("marketplace", order.id)
                              }
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-md font-bold uppercase text-[9px] transition-all cursor-pointer"
                              title="Reconcile and mark as PAID"
                            >
                              Settle
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setShowDeleteConfirm({
                                type: "marketplace",
                                id: order.id,
                              })
                            }
                            className="p-1 hover:text-red-600 text-slate-400 rounded transition-colors cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. INFLUENCER / AFFILIATE COMMISSION */}
      {activeTab === "influencer" && (
        <div className="space-y-6">
          {/* Top Performance Analytics for Influencers */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Affiliate Campaign Conversion Metrics</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-slate-800 bg-slate-950/40 p-3.5 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Total Promo Uses
                </p>
                <p className="text-xl font-bold mt-1 font-mono text-amber-400">
                  {influencers.reduce(
                    (sum, item) => sum + item.promoCodeUsage,
                    0,
                  )}{" "}
                  orders
                </p>
              </div>
              <div className="border border-slate-800 bg-slate-950/40 p-3.5 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Total Revenue Generated
                </p>
                <p className="text-xl font-bold mt-1 font-mono text-emerald-400">
                  ₹{totalInfluencerSales.toLocaleString()}
                </p>
              </div>
              <div className="border border-slate-800 bg-slate-950/40 p-3.5 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Average Campaign Yield
                </p>
                <p className="text-xl font-bold mt-1 font-mono text-indigo-400">
                  ₹
                  {Math.round(
                    totalInfluencerSales / influencers.length,
                  ).toLocaleString()}
                </p>
              </div>
              <div className="border border-slate-800 bg-slate-950/40 p-3.5 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Avg Conversion Rate
                </p>
                <p className="text-xl font-bold mt-1 font-mono text-cyan-400">
                  {(
                    influencers.reduce(
                      (sum, item) => sum + item.conversionRate,
                      0,
                    ) / influencers.length
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* List of Influencers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInfluencers.map((inf) => (
              <div
                key={inf.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold font-mono text-sm border border-slate-200">
                      {inf.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-tight">
                        {inf.name}
                      </h4>
                      <p className="text-indigo-600 font-semibold text-[11px] mt-0.5">
                        @{inf.handle} ({inf.platform})
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Followers: {(inf.followers / 1000).toFixed(0)}K •
                        Rating: ⭐ {inf.rating}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase">
                      Code: {inf.referralCode}
                    </span>
                    <p className="text-[9px] text-slate-400 font-semibold mt-1">
                      {inf.commissionType === "Percentage"
                        ? `${inf.commissionValue}% share`
                        : `₹${inf.commissionValue}/sale`}
                    </p>
                  </div>
                </div>

                {/* Campaign Progress ledger */}
                <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl text-center font-mono text-[11px]">
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-sans">
                      Orders
                    </span>
                    <span className="font-bold text-slate-800">
                      {inf.ordersGenerated}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-sans">
                      Sales Yield
                    </span>
                    <span className="font-bold text-emerald-600">
                      ₹{inf.revenueGenerated.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-sans">
                      Total Earned
                    </span>
                    <span className="font-bold text-red-600">
                      ₹{inf.commissionEarned.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payout reconciliation status bar */}
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <p className="text-emerald-600 font-bold">
                      Paid: ₹{inf.commissionPaid.toLocaleString()}
                    </p>
                    <p className="text-amber-600 font-extrabold">
                      Pending: ₹{inf.commissionPending.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-1.5">
                    {inf.commissionPending > 0 && (
                      <button
                        onClick={() =>
                          handleApproveSettlement("influencer", inf.id)
                        }
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer shadow-xs"
                      >
                        Approve Payout
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setShowDeleteConfirm({ type: "influencer", id: inf.id })
                      }
                      className="p-1 hover:text-red-600 text-slate-400 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. STAFF COMMISSION */}
      {activeTab === "staff" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 mb-4">Salesperson Performance</h3>
            <StaffCommissionPanel role="Salesperson" onAddNotification={onAddNotification} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 mb-4">Worker / Tailor Performance</h3>
            <StaffCommissionPanel role="Worker" onAddNotification={onAddNotification} />
          </div>
        </div>
      )}


      {/* RULES TAB */}
      {activeTab === "rules" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Staff Commission Engine Rules
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure the automated percentages for salesperson and worker commissions.
              </p>
            </div>

            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const token = localStorage.getItem("token");
                  const res = await api.put(`/commissions/staff/settings`, commissionSettings);
                  if (res.ok) {
                    onAddNotification("Settings Saved", "Commission rules updated successfully.", "success");
                  }
                } catch (err) {
                  console.error(err);
                  onAddNotification("Error", "Failed to save settings.", "error");
                }
              }}
            >
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                <div>
                  <p className="text-sm font-bold text-slate-700">Enable Automated Commissions</p>
                  <p className="text-xs text-slate-500">Calculate commissions during checkout automatically.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={commissionSettings.isEnabled}
                    onChange={(e) => setCommissionSettings({...commissionSettings, isEnabled: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Salesperson Commission (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  value={commissionSettings.salespersonPercentage}
                  onChange={(e) => setCommissionSettings({...commissionSettings, salespersonPercentage: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Worker/Tailor Commission (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  value={commissionSettings.workerPercentage}
                  onChange={(e) => setCommissionSettings({...commissionSettings, workerPercentage: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Calculation Basis</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  value={commissionSettings.calculationBasis}
                  onChange={(e) => setCommissionSettings({...commissionSettings, calculationBasis: e.target.value})}
                >
                  <option value="Selling Price">Selling Price</option>
                  <option value="Net Selling Price">Net Selling Price</option>
                  <option value="After Discount">After Discount</option>
                  <option value="Before GST">Before GST</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg"
              >
                Save Engine Configuration
              </button>
            </form>
          </div>
        </div>
      )}





      {/* 1. Record Marketplace Sale modal */}
      {showAddMarketplaceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full text-slate-700 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Record Marketplace Sale Transaction
              </h3>
              <button
                onClick={() => setShowAddMarketplaceModal(false)}
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddMarketplaceOrder}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Marketplace Platform *
                  </label>
                  <select
                    value={mpMarketplace}
                    onChange={(e) => setMpMarketplace(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 outline-none"
                  >
                    <option value="Amazon">Amazon</option>
                    <option value="Meesho">Meesho</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Myntra">Myntra</option>
                    <option value="Ajio">Ajio</option>
                    <option value="Shopify Orders">Shopify Orders</option>
                    <option value="Custom">Custom Marketplace</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Order Identifier *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AMZ-9801"
                    value={mpOrderId}
                    onChange={(e) => setMpOrderId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono font-bold text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Invoice Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV/2026/109"
                    value={mpInvoiceNo}
                    onChange={(e) => setMpInvoiceNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Buyer Name"
                    value={mpCustomerName}
                    onChange={(e) => setMpCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Apparel / Product Sold *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Raymond Men's Casual Shirt (M)"
                  value={mpProductName}
                  onChange={(e) => setMpProductName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-800 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Price Sold (₹) *
                  </label>
                  <input
                    type="number"
                    value={mpSellingPrice || ""}
                    onChange={(e) => setMpSellingPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 font-mono font-bold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Commission %
                  </label>
                  <input
                    type="number"
                    value={mpCommissionPercent}
                    onChange={(e) =>
                      setMpCommissionPercent(Number(e.target.value))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    GST/Tax %
                  </label>
                  <select
                    value={mpTax}
                    onChange={(e) => setMpTax(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 font-mono font-bold text-slate-800"
                  >
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Shipping Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={mpShipping}
                    onChange={(e) => setMpShipping(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Packaging Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={mpPackaging}
                    onChange={(e) => setMpPackaging(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Dynamic settlement preview */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-[11px] space-y-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                  Expected Net Payout
                </span>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Platform Commission:</span>
                  <span className="font-mono text-red-600">
                    -₹{Math.round((mpSellingPrice * mpCommissionPercent) / 100)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Tax deductions (GST):</span>
                  <span className="font-mono text-red-600">
                    -₹{Math.round(mpSellingPrice * (mpTax / 100))}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-indigo-100 pt-1 text-slate-800 font-bold text-xs">
                  <span>Net Cash Inflow:</span>
                  <span className="font-mono text-indigo-700 text-sm">
                    ₹
                    {Math.max(
                      0,
                      mpSellingPrice -
                        Math.round(
                          (mpSellingPrice * mpCommissionPercent) / 100,
                        ) -
                        mpShipping -
                        mpPackaging -
                        Math.round(mpSellingPrice * (mpTax / 100)),
                    )}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/10 cursor-pointer uppercase tracking-wider"
              >
                Save Channel Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Recruit Influencer Campaign Modal */}
      {showAddInfluencerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full text-slate-700 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Recruit Brand Influencer Partner
              </h3>
              <button
                onClick={() => setShowAddInfluencerModal(false)}
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddInfluencer}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Influencer / Affiliate Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shruti Kapoor"
                  value={infName}
                  onChange={(e) => setInfName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Social Platform *
                  </label>
                  <select
                    value={infPlatform}
                    onChange={(e) => setInfPlatform(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 outline-none"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Facebook">Facebook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Platform ID/Handle *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. shruti_dresses_style"
                    value={infHandle}
                    onChange={(e) => setInfHandle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Promo Referral Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SHRUTI10"
                    value={infReferralCode}
                    onChange={(e) => setInfReferralCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono font-bold text-indigo-600 focus:text-indigo-700 outline-none uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Followers Count
                  </label>
                  <input
                    type="number"
                    value={infFollowers}
                    onChange={(e) => setInfFollowers(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Commission Type
                  </label>
                  <select
                    value={infCommissionType}
                    onChange={(e) => setInfCommissionType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 outline-none"
                  >
                    <option value="Percentage">Percentage %</option>
                    <option value="Fixed">Fixed ₹ / Sale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Commission Rate Value *
                  </label>
                  <input
                    type="number"
                    value={infCommissionValue}
                    onChange={(e) =>
                      setInfCommissionValue(Number(e.target.value))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono font-bold text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Mobile Contact
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="\d{10}"
                    maxLength={10}
                    placeholder="99XXXXXXXX"
                    value={infPhone}
                    onChange={(e) => setInfPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@social.com"
                    value={infEmail}
                    onChange={(e) => setInfEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/10 cursor-pointer uppercase tracking-wider"
              >
                Launch Brand Campaign
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Confirm Record Deletion
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete this commission ledger
              entry? This operation is irreversible and will affect balance
              accounting metrics.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleDeleteItem(showDeleteConfirm.type, showDeleteConfirm.id)
                }
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

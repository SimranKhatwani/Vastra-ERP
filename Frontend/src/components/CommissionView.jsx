import React, { useState, useMemo } from "react";
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

// High fidelity types for Commission Module

export const CommissionView = ({
  employees,
  invoices = [],
  onAddNotification,
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState("salesperson");

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

  const [commissionRulesList, setCommissionRulesList] = useState([]);

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
          fetch('http://localhost:5000/api/commissions/marketplace', { headers }),
          fetch('http://localhost:5000/api/commissions/influencers', { headers }),
          fetch('http://localhost:5000/api/commissions/rules', { headers }),
          fetch('http://localhost:5000/api/commissions/settlements', { headers }),
          fetch('http://localhost:5000/api/commissions/audit', { headers }),
          fetch('http://localhost:5000/api/staff', { headers })
        ]);

        if (staffRes.ok) {
          const sData = await staffRes.json();
          setStaffList(sData.data || []);
        }

        if (marketplacesRes.ok) {
          const mData = await marketplacesRes.json();
          setMarketplaceOrders(mData.data || []);
        }
        if (influencersRes.ok) {
          const iData = await influencersRes.json();
          setInfluencers(iData.data || []);
        }
        if (rulesRes.ok) {
          const rData = await rulesRes.json();
          setCommissionRulesList(rData.data ? rData.data.map(r => r.ruleText) : []);
        }
        if (settlementsRes.ok) {
          const sData = await settlementsRes.json();
          setSettlementHistory(sData.data || []);
        }
        if (auditRes.ok) {
          const aData = await auditRes.json();
          setAuditLogs(aData.data || []);
        }
      } catch (err) {
        console.error("Error fetching commission data", err);
      }
    };
    fetchData();
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

  const totalSalespersonCommissions = useMemo(
    () =>
      salespersonIncentives.reduce(
        (sum, item) => sum + item.monthlyCommission,
        0,
      ),
    [salespersonIncentives],
  );
  const pendingSalespersonCommissions = useMemo(
    () =>
      salespersonIncentives.reduce(
        (sum, item) => sum + item.commissionPending,
        0,
      ),
    [salespersonIncentives],
  );

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
      {/* Title & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Percent className="w-5 h-5 text-indigo-600" />
            <span>Third-Party Commission & Channel Affiliate ERP</span>
          </h1>
          <p className="text-xs text-slate-400">
            Reconcile marketplace commissions, influencer referral campaigns,
            and salesperson performance bonuses.
          </p>
        </div>

        {/* Header Action Button */}
        <div className="flex items-center gap-2">
          {activeTab === "marketplace" && (
            <button
              onClick={() => setShowAddMarketplaceModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Record Marketplace Sale</span>
            </button>
          )}
          {activeTab === "influencer" && (
            <button
              onClick={() => setShowAddInfluencerModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Recruit Influencer Campaign</span>
            </button>
          )}
          <button
            onClick={() =>
              handleExportSimulated("Excel", activeTab.toUpperCase())
            }
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200/60 transition-all cursor-pointer"
            title="Export Excel Ledger"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Analytics Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
              Marketplace Net Sales
            </p>
            <h3 className="text-base font-extrabold text-slate-800 font-mono mt-0.5">
              ₹{totalMarketplaceSales.toLocaleString("en-IN")}
            </h3>
            <span className="text-[9px] text-red-500 font-bold font-mono">
              Commission: ₹{totalMarketplaceCommission.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
              Influencer Campaign Sales
            </p>
            <h3 className="text-base font-extrabold text-slate-800 font-mono mt-0.5">
              ₹{totalInfluencerSales.toLocaleString("en-IN")}
            </h3>
            <span className="text-[9px] text-emerald-600 font-bold font-mono">
              Disbursed: ₹
              {(
                totalInfluencerCommission - pendingInfluencerCommission
              ).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
              Salesperson Incentives
            </p>
            <h3 className="text-base font-extrabold text-slate-800 font-mono mt-0.5">
              ₹{totalSalespersonCommissions.toLocaleString("en-IN")}
            </h3>
            <span className="text-[9px] text-amber-600 font-bold font-mono">
              Pending payout: ₹{pendingSalespersonCommissions.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4.5">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
              Total Pending Settlements
            </p>
            <h3 className="text-base font-extrabold text-indigo-600 font-mono mt-0.5">
              ₹
              {(
                pendingMarketplaceSettlement +
                pendingInfluencerCommission +
                pendingSalespersonCommissions
              ).toLocaleString()}
            </h3>
            <span className="text-[9px] text-indigo-600 font-bold">
              Unreleased liabilities
            </span>
          </div>
        </div>
      </div>

      {/* Module Tabs Selector */}
      <div className="flex flex-wrap border-b border-slate-100 pb-px items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 bg-slate-100/60 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab("salesperson");
              setSearchQuery("");
              setStatusFilter("All");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "salesperson" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Salesperson Performance
          </button>

          {/* Dynamic categories */}
          {customCategories.map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveTab(cat.id);
                setSearchQuery("");
                setStatusFilter("All");
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === cat.id ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              {cat.name}
            </button>
          ))}

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
          <button
            onClick={() => {
              setActiveTab("history");
              setSearchQuery("");
              setStatusFilter("All");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "history" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Settlement & Audit Logs
          </button>
        </div>

        {/* Add Category Trigger */}
        <button
          onClick={() => setShowAddCategoryModal(true)}
          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs border border-emerald-200/60 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Commission Category</span>
        </button>
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

      {/* 3. SALESPERSON COMMISSION */}
      {activeTab === "salesperson" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Internal Employee Commission & Achievements
                </h3>
                <p className="text-[10px] text-slate-400">
                  Configured target thresholds vs actual sales recorded at
                  boutique counters.
                </p>
              </div>
              <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                Active staff: {salespersonIncentives.length}
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] text-slate-400 font-extrabold uppercase border-b border-slate-100">
                    <th className="p-3.5">Employee Info</th>
                    <th className="p-3.5">Department & Role</th>
                    <th className="p-3.5 text-right">Target set</th>
                    <th className="p-3.5 text-right">Sales achieved</th>
                    <th className="p-3.5">Target Achievement</th>
                    <th className="p-3.5">Active Commission Rules</th>
                    <th className="p-3.5 text-right">Pending Commission</th>
                    <th className="p-3.5 text-right">Paid Dues</th>
                    <th className="p-3.5 text-center">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salespersonIncentives.map((emp) => {
                    const achievementPct = Math.round(
                      (emp.salesAchieved / emp.monthlyTarget) * 100,
                    );
                    return (
                      <tr key={emp.employeeId} className="hover:bg-slate-50/40">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-800">
                            {emp.employeeName}
                          </p>
                          <p className="text-[9px] font-mono text-slate-400">
                            ID: {emp.employeeId}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-600">
                            {emp.department}
                          </p>
                          <p className="text-[9px] font-mono text-indigo-600 uppercase font-bold">
                            {emp.role}
                          </p>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                          {editingTargetId === emp.employeeId ? (
                            <div className="flex items-center justify-end gap-1">
                              <input 
                                type="number" 
                                className="w-20 text-[10px] p-1 border border-slate-300 rounded font-sans font-normal outline-none focus:border-indigo-500" 
                                value={editingTargetValue} 
                                onChange={e => setEditingTargetValue(e.target.value)} 
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleUpdateTarget(emp.employeeId);
                                  if (e.key === 'Escape') setEditingTargetId(null);
                                }}
                              />
                              <button onClick={() => handleUpdateTarget(emp.employeeId)} className="text-emerald-600 hover:text-emerald-800"><CheckCircle size={14}/></button>
                              <button onClick={() => setEditingTargetId(null)} className="text-slate-400 hover:text-slate-600"><XCircle size={14}/></button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center justify-end gap-2 group cursor-pointer" 
                              onClick={() => { setEditingTargetId(emp.employeeId); setEditingTargetValue(emp.monthlyTarget); }}
                              title="Click to edit target"
                            >
                              ₹{emp.monthlyTarget.toLocaleString()}
                              <span className="opacity-0 group-hover:opacity-100 text-indigo-400">✏️</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-mono font-extrabold text-slate-900">
                          ₹{emp.salesAchieved.toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-1 w-28">
                            <div className="flex justify-between text-[9px] font-bold font-mono">
                              <span
                                className={
                                  achievementPct >= 100
                                    ? "text-emerald-600 animate-pulse"
                                    : "text-amber-600"
                                }
                              >
                                {achievementPct}%
                              </span>
                              <span className="text-slate-400">of target</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${achievementPct >= 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                                style={{
                                  width: `${Math.min(100, achievementPct)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 max-w-[180px]">
                          <div className="flex flex-wrap gap-1">
                            {emp.commissionRules.map((rule, ri) => (
                              <span
                                key={ri}
                                className="bg-slate-50 text-[8px] text-slate-500 border border-slate-200/60 px-1 py-0.2 rounded truncate max-w-[170px]"
                                title={rule}
                              >
                                {rule}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 text-right font-mono font-extrabold text-amber-600">
                          ₹{emp.commissionPending.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right font-mono text-emerald-600 font-bold">
                          ₹{emp.commissionPaid.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center">
                          {emp.commissionPending > 0 ? (
                            <button
                              onClick={() =>
                                handleApproveSalespersonPayout(emp.employeeId)
                              }
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer shadow-xs"
                            >
                              Pay
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* REAL-TIME SALESPERSON PRODUCTS SOLD LEDGER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Left: Salespeople selector column */}
            <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full uppercase">
                  Staff Sales Ledger
                </span>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mt-1.5">
                  Choose Salesperson
                </h3>
                <p className="text-[10px] text-slate-400">
                  Select any sales representative to fetch their real-time
                  boutique checkout history.
                </p>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {salespeopleNames.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No active salesperson records found.
                  </div>
                ) : (
                  salespeopleNames.map((name) => {
                    const isSelected = currentSalesperson === name;
                    const historyList = salespersonSalesHistory[name] || [];
                    const qtySold = historyList.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    );
                    const rev = historyList.reduce(
                      (sum, item) => sum + item.totalPrice,
                      0,
                    );

                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedSalesperson(name)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer group ${
                          isSelected
                            ? "bg-indigo-50/50 border-indigo-200 text-indigo-850 shadow-xs"
                            : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700"
                            }`}
                          >
                            {name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase() || "SP"}
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-tight truncate max-w-[140px]">
                              {name}
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                              {qtySold} items sold till date
                            </p>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span
                            className={`text-[10px] font-extrabold block ${isSelected ? "text-indigo-700" : "text-slate-800"}`}
                          >
                            ₹{rev.toLocaleString()}
                          </span>
                          <span className="text-[8px] text-slate-400 block font-sans">
                            Revenue
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Products list */}
            <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              {(() => {
                const rawHistory = currentSalesperson
                  ? salespersonSalesHistory[currentSalesperson] || []
                  : [];
                const currentSalespersonStats = {
                  totalQty: rawHistory.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  ),
                  totalRevenue: rawHistory.reduce(
                    (sum, item) => sum + item.totalPrice,
                    0,
                  ),
                };

                const filteredSoldProducts = (() => {
                  if (!currentSalesperson) return [];
                  if (!soldProductsSearchQuery.trim()) return rawHistory;
                  const q = soldProductsSearchQuery.toLowerCase();
                  return rawHistory.filter(
                    (item) =>
                      item.productName.toLowerCase().includes(q) ||
                      item.sku.toLowerCase().includes(q) ||
                      item.invoiceNo.toLowerCase().includes(q) ||
                      item.customerName.toLowerCase().includes(q),
                  );
                })();

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Sales History: {currentSalesperson || "None selected"}
                        </h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-slate-650 font-bold">
                            Total Items Sold:{" "}
                            <span className="text-indigo-600 font-mono font-extrabold">
                              {currentSalespersonStats.totalQty} units
                            </span>
                          </span>
                          <span className="text-xs text-slate-655 font-bold">
                            Total Checkout Value:{" "}
                            <span className="text-emerald-600 font-mono font-extrabold">
                              ₹
                              {currentSalespersonStats.totalRevenue.toLocaleString()}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="relative w-full sm:w-56 shrink-0">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          placeholder="Search sold products..."
                          value={soldProductsSearchQuery}
                          onChange={(e) =>
                            setSoldProductsSearchQuery(e.target.value)
                          }
                          className="w-full bg-slate-50 pl-8 pr-3 py-1.5 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold border border-slate-100 text-slate-700"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto text-[11px] font-medium text-slate-600 flex-1 min-h-[220px]">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                            <th className="p-2.5">Date / Invoice</th>
                            <th className="p-2.5">Product Name</th>
                            <th className="p-2.5">Variant Specs</th>
                            <th className="p-2.5 text-center">Qty</th>
                            <th className="p-2.5 text-right">Unit Price</th>
                            <th className="p-2.5 text-right font-bold text-indigo-600">
                              Total Price
                            </th>
                            <th className="p-2.5">Customer</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredSoldProducts.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="p-12 text-center text-slate-400"
                              >
                                <ShoppingCart className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                                <p className="font-semibold text-xs">
                                  No checkout entries registered for this
                                  salesperson.
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-normal">
                                  Checkout items with this salesperson selected
                                  at POS billing to update automatically.
                                </p>
                              </td>
                            </tr>
                          ) : (
                            filteredSoldProducts.map((item) => (
                              <tr
                                key={item.id}
                                className="hover:bg-slate-50/45 transition-colors"
                              >
                                <td className="p-2.5">
                                  <p className="font-mono font-bold text-slate-800">
                                    {item.invoiceNo}
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                                    {item.date}
                                  </p>
                                </td>
                                <td
                                  className="p-2.5 font-bold text-slate-700 max-w-[160px] truncate animate-fade-in"
                                  title={item.productName}
                                >
                                  {item.productName}
                                </td>
                                <td className="p-2.5">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="bg-slate-100 px-1.5 py-0.2 rounded text-[8px] font-bold text-slate-500 uppercase">
                                      {item.size}
                                    </span>
                                    <span className="bg-indigo-50 px-1.5 py-0.2 rounded text-[8px] font-bold text-indigo-600 uppercase">
                                      {item.color}
                                    </span>
                                    <span
                                      className="text-[9px] text-slate-400 font-mono truncate max-w-[80px]"
                                      title={item.sku}
                                    >
                                      {item.sku}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                                  {item.quantity}
                                </td>
                                <td className="p-2.5 text-right font-mono text-slate-650">
                                  ₹{item.price.toLocaleString()}
                                </td>
                                <td className="p-2.5 text-right font-mono font-extrabold text-indigo-700 bg-indigo-50/10">
                                  ₹{item.totalPrice.toLocaleString()}
                                </td>
                                <td
                                  className="p-2.5 truncate max-w-[100px] font-bold text-slate-650"
                                  title={item.customerName}
                                >
                                  {item.customerName}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* RULES TAB */}
      {activeTab === "rules" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Compensation Rules Library
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Define automated rules that trigger bonuses and incentive
                disbursements at billing checkout.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {commissionRulesList.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex justify-between items-center hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{rule}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        System Code: COM-RULE-{100 + idx}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCommissionRulesList((prev) =>
                        prev.filter((_, ri) => ri !== idx),
                      );
                      onAddNotification(
                        "Rule Suspended",
                        "Commission rule revoked from calculation engine.",
                        "warning",
                      );
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Create Auto Commission Rule
            </h4>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const ruleInput = e.target.ruleName.value;
                if (!ruleInput) return;
                setCommissionRulesList([...commissionRulesList, ruleInput]);
                onAddNotification(
                  "Commission Rule Live",
                  "New bonus rule has been saved to checkout engine.",
                  "success",
                );
                e.target.reset();
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Incentive Description Rule *
                </label>
                <input
                  type="text"
                  name="ruleName"
                  placeholder="e.g. 5% on Shirt sales above ₹10,000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Trigger Event
                </label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700 outline-none cursor-pointer">
                  <option>Individual Counter Sale</option>
                  <option>Category Target Threshold</option>
                  <option>Brand-wise wholesale quota</option>
                  <option>Monthly aggregate sales</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Calculation Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="p-2 border border-slate-200 rounded-xl flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="calc" defaultChecked />
                    <span>Percentage %</span>
                  </label>
                  <label className="p-2 border border-slate-200 rounded-xl flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="calc" />
                    <span>Flat Cash ₹</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer uppercase tracking-wider"
              >
                Inject Rule Spec
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY & AUDIT LOGS TAB */}
      {activeTab === "history" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* History table */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs lg:col-span-8">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Settlement & Disbursement Ledger
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Reconciled payments issued outwards to partners and staff.
                </p>
              </div>
              <button
                onClick={() =>
                  handleExportSimulated("PDF", "Settlements Ledger")
                }
                className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              >
                Export History PDF
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] text-slate-400 font-extrabold uppercase border-b border-slate-100">
                    <th className="p-3.5">Disburse Date</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Recipient</th>
                    <th className="p-3.5 font-mono">Reference ID</th>
                    <th className="p-3.5 text-right">Amount</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settlementHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40">
                      <td className="p-3.5 font-mono text-slate-600">
                        {item.date}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            item.type === "Marketplace"
                              ? "bg-amber-50 text-amber-600"
                              : item.type === "Influencer"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {item.recipient}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500 font-bold">
                        {item.referenceNo}
                      </td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-slate-900">
                        ₹{item.amount.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-medium text-slate-600">
                        {item.paymentMethod}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="text-emerald-600 font-bold uppercase text-[9px] flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Paid</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Logs Timeline */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs lg:col-span-4 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                System Audit Timeline
              </h4>
            </div>

            <div className="space-y-4 relative pl-3 before:absolute before:left-0.5 before:top-1.5 before:bottom-1 before:w-0.5 before:bg-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="text-xs space-y-1 relative">
                  {/* Timeline point indicator */}
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white absolute -left-4.5 top-0.5 shadow-xs" />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 font-semibold">
                    <span>{log.timestamp}</span>
                    <span>{log.user.split(" ")[0]}</span>
                  </div>
                  <p className="font-extrabold text-slate-700 text-[11px] leading-tight">
                    {log.action}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {log.details}
                  </p>
                  <span className="text-[9px] font-bold text-indigo-600 block bg-slate-50 px-1.5 py-0.2 rounded w-fit">
                    {log.module}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. DYNAMIC CUSTOM COMMISSION CATEGORY VIEW */}
      {![
        "salesperson",
        "rules",
        "history",
        "marketplace",
        "influencer",
      ].includes(activeTab) && (
        <div className="space-y-6 animate-fade-in">
          {(() => {
            const currentCat = customCategories.find(
              (c) => c.id === activeTab,
            ) || {
              name: "Custom Category",
              description:
                "Manage specialized partner ledgers, commissions, and B2B distributions.",
              commissionType: "Percentage",
              defaultValue: 10,
            };

            const partners = categoryPartners.filter(
              (p) => p.categoryId === activeTab,
            );
            const records = categoryRecords.filter(
              (r) => r.categoryId === activeTab,
            );

            const totalRevenue = partners.reduce(
              (sum, p) => sum + p.revenue,
              0,
            );
            const totalCommission = partners.reduce(
              (sum, p) => sum + p.commissionEarned,
              0,
            );
            const pendingSettlement = records
              .filter((r) => r.status === "Pending")
              .reduce((sum, r) => sum + r.commissionAmount, 0);

            return (
              <div className="space-y-6">
                {/* Header overview banner */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white relative overflow-hidden shadow-md">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                          Dynamic Category Ledger
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold tracking-tight">
                        {currentCat.name}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-xl">
                        {currentCat.description}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddPartnerModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Enroll Partner</span>
                      </button>
                      <button
                        onClick={() => {
                          if (partners.length === 0) {
                            onAddNotification(
                              "Action Denied",
                              "Please enroll at least one partner first.",
                              "warning",
                            );
                            return;
                          }
                          setShowAddRecordModal(true);
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all border border-slate-700"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Log Sale</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 relative z-10">
                    <div className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Enrolled Partners
                      </p>
                      <p className="text-lg font-bold mt-1 font-mono text-white">
                        {partners.length} active
                      </p>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Total Volume Logged
                      </p>
                      <p className="text-lg font-bold mt-1 font-mono text-emerald-400">
                        ₹{totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Commission Incurred
                      </p>
                      <p className="text-lg font-bold mt-1 font-mono text-indigo-400">
                        ₹{totalCommission.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Pending Payouts
                      </p>
                      <p className="text-lg font-bold mt-1 font-mono text-amber-400">
                        ₹{pendingSettlement.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Partners List & Ledger */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Partners directory */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs space-y-4 p-5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Enrolled Partners Directory
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Category Basis:{" "}
                        <span className="font-bold text-slate-600">
                          {currentCat.defaultValue}
                          {currentCat.commissionType === "Percentage"
                            ? "%"
                            : " ₹"}
                        </span>
                      </span>
                    </div>

                    {partners.length === 0 ? (
                      <div className="py-16 text-center text-slate-400 space-y-2">
                        <Users className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                        <p className="text-xs font-bold">
                          No partners enrolled yet.
                        </p>
                        <p className="text-[10px]">
                          Enroll your first distributor, agent, or custom
                          channel partner to start tracking.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] text-slate-400 font-extrabold uppercase tracking-wide border-b border-slate-100">
                              <th className="p-3">Partner Name</th>
                              <th className="p-3">Reference/Code</th>
                              <th className="p-3">Contact</th>
                              <th className="p-3 text-right">Revenue Yield</th>
                              <th className="p-3 text-right">Commissions</th>
                              <th className="p-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {partners.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-slate-800">
                                  {p.name}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 font-mono font-bold bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px]">
                                    {p.referenceNo}
                                  </span>
                                </td>
                                <td className="p-3 text-[10px] text-slate-400">
                                  {p.phone}
                                  <br />
                                  {p.email}
                                </td>
                                <td className="p-3 text-right font-bold text-slate-700 font-mono">
                                  ₹{p.revenue.toLocaleString()}
                                </td>
                                <td className="p-3 text-right font-bold text-indigo-600 font-mono">
                                  ₹{p.commissionEarned.toLocaleString()}
                                </td>
                                <td className="p-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Dynamic transactions list */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Recent Commission Accruals
                    </h4>
                    {records.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        <p className="font-semibold">
                          No commission records yet.
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Click "Log Sale" to generate a dynamic commission
                          record.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {records.map((rec) => (
                          <div
                            key={rec.id}
                            className="border border-slate-100 bg-slate-50/40 rounded-xl p-3 space-y-2 hover:bg-slate-50 transition-all"
                          >
                            <div className="flex justify-between items-center border-b border-slate-100/60 pb-1.5">
                              <span className="font-extrabold text-slate-800 text-[11px]">
                                {rec.partnerName}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {rec.date}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-mono">
                              <div>
                                <span className="text-[10px] text-slate-400 block">
                                  Logged Sale
                                </span>
                                <span className="font-bold text-slate-700">
                                  ₹{rec.saleAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block">
                                  Commission Accrued
                                </span>
                                <span className="font-extrabold text-indigo-600">
                                  ₹{rec.commissionAmount.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-dashed border-slate-200/60 flex items-center justify-between">
                              <span className="text-[9px] font-mono bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
                                {rec.referenceNo}
                              </span>
                              {rec.status === "Pending" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleApproveDynamicSettlement(rec.id)
                                  }
                                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[9px] font-bold cursor-pointer transition-all"
                                >
                                  Settle Payout
                                </button>
                              ) : (
                                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                  Settled
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* MODALS DEFINITIONS */}

      {/* MODAL: ADD CUSTOM COMMISSION CATEGORY */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full text-slate-700 space-y-5 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Configure Commission Channel
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateCategorySubmit}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. B2B Franchise Agents"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-850 outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Description / Purpose
                </label>
                <textarea
                  placeholder="Define who can be enrolled in this channel and how settlements accrue."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-850 outline-none h-16 resize-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Calculation Type
                  </label>
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="Percentage">Percentage %</option>
                    <option value="Fixed">Fixed Amount ₹</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Default Rate *
                  </label>
                  <input
                    type="number"
                    value={newCatValue}
                    onChange={(e) => setNewCatValue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono font-bold text-slate-850"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer uppercase tracking-wider"
              >
                Instantiate Commission Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENROLL PARTNER */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full text-slate-700 space-y-5 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Enroll Channel Partner
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPartnerModal(false)}
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddDynamicPartner}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Partner/Agency Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Wholesales"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-850 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Referral / Promo Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. APEX10"
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono font-bold text-slate-850 outline-none"
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
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 outline-none font-mono text-slate-850"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="partner@domain.com"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-slate-850"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer uppercase tracking-wider"
              >
                Enroll & Activate Ledger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG SALE TRANSACTION */}
      {showAddRecordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full text-slate-700 space-y-5 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Log Channel Sale
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRecordModal(false)}
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddDynamicRecord}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Select Channel Partner *
                </label>
                <select
                  value={recordPartnerId}
                  onChange={(e) => setRecordPartnerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Choose Partner --</option>
                  {categoryPartners
                    .filter((p) => p.categoryId === activeTab)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.referenceNo})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Gross Sale Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={recordSaleAmt || ""}
                    onChange={(e) => setRecordSaleAmt(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono font-bold text-slate-850"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Transaction Invoice Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9902"
                    value={recordRefNo}
                    onChange={(e) => setRecordRefNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono font-bold text-slate-850 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer uppercase tracking-wider"
              >
                Log Transaction & Calculate Commission
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

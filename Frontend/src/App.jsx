import api from './api/axios';
import React, { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Scissors,
  Tags,
  Warehouse,
  FileText,
  Users,
  Users2,
  User,
  Receipt,
  TrendingUp,
  Globe,
  Terminal,
  Settings,
  Building2,
  Bell,
  ChevronsLeft,
  Clock,
  Percent,
  LogOut,
  TableProperties,
  ShieldAlert,
  ClipboardCheck,
  BarChart3,
  Wallet,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

// Import sub components
import { DashboardView } from "./components/DashboardView";
import { BillingPOSView } from "./components/BillingPOSView";
import { ArticulationView } from "./components/ArticulationView";
import { ProductManagementView } from "./components/ProductManagementView";
import { PermissionsView } from "./components/PermissionsView";
import { StaffActivityView } from "./components/StaffActivityView";

import { PurchaseView } from "./components/PurchaseView";
import { InventoryView } from "./components/InventoryView";
import { StockManagementView } from "./components/StockManagementView";
import { BillingSalesView } from "./components/BillingSalesView";
import DiscountManagementView from "./components/DiscountManagementView";
import { CustomersView } from "./components/CustomersView";
import { EmployeeView } from "./components/EmployeeView";
import { AccountingView } from "./components/AccountingView";
import { FinancialView } from "./components/FinancialView";
import { ReportsView } from "./components/ReportsView";
import { SaaSPanelView } from "./components/SaaSPanelView";
import { DeveloperPortalView } from "./components/DeveloperPortalView";
import VendorCommunicationCard from "./components/VendorCommunicationCard";
import { IntegrationsView } from "./components/IntegrationsView";
import { SettingsView } from "./components/SettingsView";
import { CommissionView } from "./components/CommissionView";
import { StaffManagementView } from "./components/StaffManagementView";
import AttendanceDashboardView from "./components/AttendanceDashboardView";
import AttendancePolicySettings from "./components/AttendancePolicySettings";
import ManagerReviewPanel from "./components/ManagerReviewPanel";
import { AdminLogin } from "./components/AdminLogin";
import { UserLogin } from "./components/UserLogin";
import ErrorBoundary from "./components/ErrorBoundary";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SuperAdminLayout } from "./components/superadmin/SuperAdminLayout";
import { useSocket } from "./contexts/SocketContext";
import { useSession } from "./contexts/SessionProvider";
import { setupFetchInterceptor } from "./utils/apiInterceptor";



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
  const custName = b.customerId?.name || b.customerName || b.customer?.name || "Walk-in Customer";
  const custPhone = b.customerId?.phone || b.customerPhone || b.customer?.phone || "9999999999";

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
      finalPrice: i.finalPrice || ((i.sellingPrice || i.price || 0) - (i.discountAmount || 0))
    })),
    subTotal: b.subTotal || b.grandTotal || 0,
    discount: b.discountAmount || b.discount || 0,
    grandTotal: b.grandTotal || b.totalAmount || 0,
    amountPaid: b.paidAmount ?? b.amountPaid ?? b.grandTotal,
    dueAmount: b.dueAmount || 0,
    advanceApplied: b.advanceApplied || 0,
    paymentMethod: b.paymentMethod || (b.dueAmount > 0 ? "Credit" : "Cash"),
    splitPayments: b.splitPayments || (b.paymentTransactions ? b.paymentTransactions.map(t => ({ method: t.mode, amount: t.amount })) : undefined),
    paymentTransactions: b.paymentTransactions,
    status: b.status || "Completed"
  };
};

export default function App() {
  const { socket, connected } = useSocket();
  const { logoutUser } = useSession();

  React.useEffect(() => {
    setupFetchInterceptor(logoutUser);
  }, [logoutUser]);

  // Master States - Single Source of Truth from Live MongoDB Backend
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);

  // Purchase Management States
  const [vendors, setVendors] = useState([]);
  const [grns, setGrns] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [vendorOutstanding, setVendorOutstanding] = useState([]);
  const [purchaseReports, setPurchaseReports] = useState(null);

  // Auth & Session States
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (e) {
      console.error("Failed to parse stored user", e);
    }
    return null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem("token");
  });

  React.useEffect(() => {
    if (!socket) return;

    const handleRealtimeEvent = (payload) => {
      if (payload?.event === 'inventory.low' && payload.product) {
        addToastNotification(
          "Low Stock Alert",
          `${payload.product.name} (SKU ${payload.product.sku}) has reached Low Stock. Remaining Quantity: ${payload.product.stock}`,
          "warning"
        );
      } else {
        const title = payload?.event || 'Realtime update';
        const message = payload?.notification?.message || payload?.product?.name || payload?.invoice?.invoiceNumber || 'New update received';
        addToastNotification(title, message, 'info');
      }

      if (payload?.notification) {
        setNotifications((prev) => [{
          id: payload.notification._id || payload.notification.id,
          timestamp: 'Just now',
          title: payload.notification.title || 'Notification',
          message: payload.notification.message,
          type: payload.notification.type || 'info',
          read: false,
        }, ...prev]);
      }

      if (payload?.event === 'inventory.updated' && payload.product) {
        setProducts((prev) => prev.map((p) => {
          const isMatch = (p.id && (p.id === payload.product._id || p.id === payload.product.id)) ||
            (p._id && (p._id === payload.product._id || p._id === payload.product.id));
          if (isMatch) {
            return { ...p, ...payload.product, id: payload.product._id || payload.product.id, _id: payload.product._id || payload.product.id };
          }
          return p;
        }));
      }

      if (payload?.event === 'invoice.created' && payload.invoice) {
        setInvoices((prev) => {
          if (prev.some(inv => inv._id === payload.invoice._id || inv.invoiceNo === payload.invoice.invoiceNo)) return prev;
          return [{ ...payload.invoice, id: payload.invoice._id }, ...prev];
        });
      }

      if (payload?.event === 'permissions.updated') {
        window.dispatchEvent(new Event("vastra-permissions-updated"));
      }
    };

    const events = ['notification.created', 'notification.updated', 'inventory.updated', 'inventory.low', 'invoice.created', 'invoice.updated', 'purchase.created', 'purchase.approved', 'employee.created', 'employee.updated', 'commission.updated', 'supplier.updated', 'payroll.updated', 'whatsapp.sent', 'whatsapp.failed', 'tenant.activity', 'dashboard.stats.updated', 'permissions.updated'];
    events.forEach((eventName) => socket.on(eventName, handleRealtimeEvent));

    return () => {
      events.forEach((eventName) => socket.off(eventName, handleRealtimeEvent));
    };
  }, [socket]);

  React.useEffect(() => {
    const fetchProducts = async () => {
      if (isLoggedIn && currentUser?.role !== "SuperAdmin") {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsLoadingProducts(false);
          setIsLoadingInvoices(false);
          return;
        }

        setIsLoadingProducts(true);
        setIsLoadingInvoices(true);

        // Fetch products independently
        try {
          const resProducts = await api.get(`/products`);
          const dataProducts = resProducts.data;
          if (dataProducts && dataProducts.success) {
            const rawList = Array.isArray(dataProducts.data) ? dataProducts.data : (dataProducts.data?.products || []);
            const arr = rawList.map(p => ({ ...p, id: p._id }));
            console.log('[App Trace] Loaded products count:', arr.length);
            setProducts(arr);
          }
        } catch (err) {
          console.error("Failed to fetch products:", err);
        } finally {
          setIsLoadingProducts(false);
        }

        // Fetch remaining resources independently
        try {
          const resCustomers = await api.get(`/customers`);
          if (resCustomers.data?.success) setCustomers(resCustomers.data.data.map(c => ({ ...c, id: c._id })));
        } catch (e) {}

        try {
          const resInvoices = await api.get(`/billing`);
          const fetchedInvoices = extractBillsArray(resInvoices.data);
          setInvoices(fetchedInvoices.map(i => normalizeInvoice(i)).filter(Boolean));
        } catch (e) {
          console.error("Failed to fetch invoices:", e);
        } finally {
          setIsLoadingInvoices(false);
        }

        try {
          const resSuppliers = await api.get(`/suppliers`);
          if (resSuppliers.data?.success) setSuppliers(resSuppliers.data.data.map(s => ({ ...s, id: s._id })));
        } catch (e) {}

        try {
          const resPurchaseOrders = await api.get(`/purchase-orders`);
          const dataOrBills = Array.isArray(resPurchaseOrders.data?.data)
            ? resPurchaseOrders.data.data
            : (Array.isArray(resPurchaseOrders.data?.data?.bills) ? resPurchaseOrders.data.data.bills : []);
          if (dataOrBills.length > 0) {
            setPurchaseOrders(dataOrBills.map(p => ({ ...p, id: p._id || p.id })));
          }
        } catch (e) {}

        try {
          const resEmployees = await api.get(`/employees`);
          if (resEmployees.data?.success) {
            const arr = resEmployees.data.data.map(e => ({ ...e, id: e._id || e.id }));
            setEmployees(arr);

            const storedUserStr = localStorage.getItem("user");
            if (storedUserStr) {
              try {
                const storedUser = JSON.parse(storedUserStr);
                const matchUser = arr.find(e =>
                  (e._id && String(e._id) === String(storedUser._id || storedUser.id)) ||
                  (e.id && String(e.id) === String(storedUser.id || storedUser._id)) ||
                  (storedUser.email && e.email && e.email.toLowerCase() === storedUser.email.toLowerCase()) ||
                  (storedUser.name && e.name && e.name.toLowerCase() === storedUser.name.toLowerCase())
                );
                if (matchUser) {
                  setCurrentUser(matchUser);
                  localStorage.setItem("user", JSON.stringify(matchUser));
                }
              } catch (err) {}
            }
          }
        } catch (e) {}

        // Fetch purchase management data (non-blocking, best-effort)
        try {
          const [resVendors, resGRNs, resInvoicesP, resReturns, resPending, resOutstanding] = await Promise.all([
            api.get(`/purchase/vendors`),
            api.get(`/purchase/grn`),
            api.get(`/purchase/invoice`),
            api.get(`/purchase/return`),
            api.get(`/purchase/pending-tracking`),
            api.get(`/purchase/outstanding`),
          ]);
          const [dV, dG, dI, dR, dP, dO] = await Promise.all([
            resVendors.data, resGRNs.data, resInvoicesP.data,
            resReturns.data, resPending.data, resOutstanding.data
          ]);
          if (dV.success) setVendors(dV.data.map(v => ({ ...v, id: v._id })));
          if (dG.success) setGrns(dG.data.map(g => ({ ...g, id: g._id })));
          if (dI.success) setPurchaseInvoices(dI.data.map(i => ({ ...i, id: i._id })));
          if (dR.success) setPurchaseReturns(dR.data.map(r => ({ ...r, id: r._id })));
          if (dP.success) setPendingPurchases(dP.data);
          if (dO.success) setVendorOutstanding(dO.data.map(o => ({ ...o, id: o._id })));
        } catch (purchaseErr) {
          console.warn("Purchase management data fetch failed:", purchaseErr.message);
        }
      }
    };
    fetchProducts();
    
    // Listen for global refresh events from downstream modules like PTImporter
    window.addEventListener("vastra-data-refresh", fetchProducts);
    return () => window.removeEventListener("vastra-data-refresh", fetchProducts);
  }, [isLoggedIn, currentUser?.id, currentUser?._id, currentUser?.email]);

  const [quickArticulateItem, setQuickArticulateItem] = useState(null);

  // Navigation
  const [activeModule, setActiveModule] = useState(() => {
    return localStorage.getItem("vastraActiveModule") || "dashboard";
  });

  const [articulationInitialTab, setArticulationInitialTab] = useState("dashboard");
  const [articulationInitialFilter, setArticulationInitialFilter] = useState("All");
  const [articulationStartAlteration, setArticulationStartAlteration] = useState(false);

  React.useEffect(() => {
    localStorage.setItem("vastraActiveModule", activeModule);
  }, [activeModule]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] =
    useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const notificationsRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotificationsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Dynamic RBAC Permission Matrix State (Fetched directly from MongoDB)
  const [permissionMatrix, setPermissionMatrix] = useState({});

  // Fetch dynamic permissions matrix directly from API on login / mount / socket event / interval
  React.useEffect(() => {
    const syncPermissions = async () => {
      if (!isLoggedIn) return;
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await api.get(`/permissions`);
        if (!res.ok) return;
        const data = res.data;
        if (data.success && data.data) {
          setPermissionMatrix(data.data);
        }
      } catch (err) {
        // Quietly ignore background network reconnect glitches
      }
    };

    syncPermissions();

    const handlePermEvent = () => {
      syncPermissions();
    };

    window.addEventListener("vastra-permissions-updated", handlePermEvent);
    const intervalId = setInterval(syncPermissions, 3000); // 3-second instant sync check for active staff

    return () => {
      window.removeEventListener("vastra-permissions-updated", handlePermEvent);
      clearInterval(intervalId);
    };
  }, [isLoggedIn, currentUser?.role]);

  // Helper to normalize role keys safely (e.g. "Sales Person" -> "salesperson")
  const normalizeRoleKey = (role) => {
    let r = (role || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (r.includes('admin') || r.includes('owner') || r === 'businessadmin' || r === 'tenantadmin' || r === 'tenantowner') return 'admin';
    if (r === 'salesperson' || r === 'sales' || r === 'salesexecutive' || r === 'salespersonnel' || r === 'salesman') return 'salesperson';
    if (r === 'worker' || r === 'floorworker' || r === 'productionworker') return 'worker';
    if (r === 'cashier' || r === 'poscashier') return 'cashier';
    if (r === 'tailor' || r === 'mastertailor' || r === 'alterationmaster') return 'tailor';
    if (r === 'accountant' || r === 'accounts') return 'accountant';
    return 'admin';
  };

  // Role-based sidebar module access helper
  const getAccessibleModules = (role) => {
    const roleKey = normalizeRoleKey(role);

    // Base fallback modules per role
    let baseModules = [];
    switch (roleKey) {
      case "superadmin":
        baseModules = [
          "saas",
          "developer",
          "integrations",
          "settings",
          "permissions",
          "staff-activity",
          "purchase",
          "vendor-communication",
          "financial-management",
          "accounts-treasury",
          "attendance-dashboard",
          "manager-review",
          "attendance-settings",
        ];
        break;
      case "businessadmin":
      case "admin":
        baseModules = [
          "dashboard",
          "billing",
          "articulation",
          "inventory_articulation",
          "commissions",
          "products",
          "inventory",
          "stock-management",
          "billing-sales",
          "discount-offers",
          "purchase",
          "vendor-communication",
          "financial-management",
          "accounts-treasury",
          "customers",
          "employees",
          "staff",
          "accounting",
          "reports",
          "permissions",
          "staff-activity",
          "integrations",
          "dev",
          "settings",
          "attendance-dashboard",
          "manager-review",
          "attendance-settings",
        ];
        break;
      case "manager":
        baseModules = [
          "dashboard",
          "billing",
          "articulation",
          "inventory_articulation",
          "commissions",
          "products",
          "inventory",
          "stock-management",
          "billing-sales",
          "discount-offers",
          "purchase",
          "vendor-communication",
          "financial-management",
          "accounts-treasury",
          "customers",
          "employees",
          "reports",
          "permissions",
          "settings",
          "attendance-dashboard",
          "manager-review",
        ];
        break;
      case "cashier":
        baseModules = [
          "dashboard",
          "billing",
          "billing-sales",
          "discount-offers",
          "articulation",
          "products",
          "purchase",
          "vendor-communication",
          "financial-management",
          "accounts-treasury",
          "customers",
          "accounting",
          "attendance-dashboard",
        ];
        break;
      case "salesperson":
        baseModules = [
          "dashboard",
          "billing",
          "products",
          "purchase",
          "vendor-communication",
          "attendance-dashboard",
        ];
        break;
      case "tailor":
        baseModules = ["dashboard", "articulation", "attendance-dashboard"];
        break;
      case "worker":
        baseModules = ["dashboard", "attendance-dashboard"];
        break;
      case "accountant":
        baseModules = [
          "dashboard",
          "financial-management",
          "accounts-treasury",
          "accounting",
          "reports",
          "purchase",
          "vendor-communication",
          "attendance-dashboard",
        ];
        break;
      default:
        baseModules = [
          "dashboard",
          "billing",
          "articulation",
          "inventory_articulation",
          "commissions",
          "products",
          "inventory",
          "stock-management",
          "billing-sales",
          "discount-offers",
          "purchase",
          "vendor-communication",
          "financial-management",
          "accounts-treasury",
          "customers",
          "employees",
          "staff",
          "accounting",
          "reports",
          "permissions",
          "staff-activity",
          "integrations",
          "dev",
          "settings",
          "attendance-dashboard",
          "manager-review",
          "attendance-settings",
        ];
        break;
    }

    // Apply custom RBAC rules if saved by Admin
    const config = permissionMatrix[roleKey] || permissionMatrix[roleKey.toLowerCase()] || permissionMatrix[role];
    if (config) {
      const levelsMap = config.moduleAccessLevels || {};
      const allowedArr = config.allowedModules || [];

      // Starting list: if Admin set allowedModules, start with allowedModules; otherwise start with baseModules
      let finalModules = Array.isArray(allowedArr) && allowedArr.length > 0 ? [...allowedArr] : [...baseModules];

      // Enforce 3-Level explicit overrides (NO_ACCESS vs FULL_CONTROL/VIEW_ONLY)
      Object.keys(levelsMap).forEach((modId) => {
        const lvl = levelsMap[modId];
        if (lvl === 'NO_ACCESS') {
          finalModules = finalModules.filter(m => m !== modId);
        } else if ((lvl === 'FULL_CONTROL' || lvl === 'VIEW_ONLY') && !finalModules.includes(modId)) {
          finalModules.push(modId);
        }
      });

      if (['admin', 'businessadmin', 'superadmin', 'manager', 'accountant'].includes(roleKey)) {
        if (!finalModules.includes('staff-activity')) finalModules.push('staff-activity');
        if (!finalModules.includes('vendor-communication') && levelsMap['vendor-communication'] !== 'NO_ACCESS') {
          finalModules.push('vendor-communication');
        }
      }

      return finalModules;
    }

    if (['admin', 'businessadmin', 'superadmin', 'manager', 'accountant'].includes(roleKey)) {
      if (!baseModules.includes('staff-activity')) baseModules.push('staff-activity');
      if (!baseModules.includes('vendor-communication')) baseModules.push('vendor-communication');
    }

    return baseModules;
  };

  // Ensure active module is always one the current user has access to
  React.useEffect(() => {
    const allowed = getAccessibleModules(currentUser?.role);
    if (!allowed.includes(activeModule)) {
      setActiveModule(allowed[0] || "billing");
    }
  }, [currentUser?.role, activeModule, JSON.stringify(permissionMatrix)]);

  // Global Toast System
  const [toasts, setToasts] = useState([]);

  const getUserInitials = (name) => {
    if (!name || typeof name !== "string") return "US";
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "US"
    );
  };

  const addToastNotification = React.useCallback((title, msg, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setToasts((prev) => [...prev, { id, title, msg, type, visible: true }]);

    // Auto-clear transition timeline
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, visible: false } : t));
    }, 4000);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);

    // Also inject into notifications log state
    const newNotif = {
      id: `not-${Date.now()}`,
      timestamp: "Just now",
      title,
      message: msg,
      type:
        type === "danger"
          ? "danger"
          : type === "success"
            ? "success"
            : type === "warning"
              ? "warning"
              : "info",
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const handleAddProduct = async (prod) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/products`, prod);
      const data = res.data;
      if (data.success) {
        setProducts((prev) => [{ ...data.data, id: data.data._id }, ...prev]);
      } else {
        addToastNotification("Error", data.message, "danger");
      }
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const handleUpdateProduct = async (updated) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/products/${updated.id}`, updated);
      const data = res.data;
      if (data.success) {
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...data.data, id: data.data._id } : p)));
      } else {
        addToastNotification("Error", data.message, "danger");
      }
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const handleDeleteProducts = async (ids) => {
    try {
      const token = localStorage.getItem("token");
      for (const id of ids) {
        await api.delete(`/products/${id}`);
      }
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const handleAdjustStock = async (productId, amount, activity = "ADJUSTMENT", referenceType = "Stock Adjustment", referenceNumber = "", remarks = "") => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/products/${productId}/adjust-stock`, { amount, activity, referenceType, referenceNumber, remarks });
      const data = res.data;
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...data.data, id: data.data._id } : p)),
        );
      } else {
        addToastNotification("Error", data.message, "danger");
      }
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const handleAddInvoice = React.useCallback(async (inv) => {
    // Helper for offline/fallback state update
    const performLocalStateUpdates = (invoiceToSave) => {
      setInvoices(prev => [invoiceToSave, ...prev]);

      // Deduct stock locally
      setProducts(prevProducts => {
        const newProducts = [...prevProducts];
        invoiceToSave.items?.forEach(item => {
          const pId = item.productId || item.id;
          const pIdx = newProducts.findIndex(p => (p.id || p._id) === pId);
          if (pIdx !== -1) {
            newProducts[pIdx] = {
              ...newProducts[pIdx],
              stock: Math.max(0, (newProducts[pIdx].stock || 0) - (item.quantity || 1))
            };
          }
        });
        return newProducts;
      });

      // Update customer balance/points locally if applicable
      if (invoiceToSave.customerId) {
        setCustomers(prev => prev.map(c => {
          if (c.id === invoiceToSave.customerId || c._id === invoiceToSave.customerId) {
            let balanceInc = 0;
            if (invoiceToSave.paymentMethod === 'Credit') balanceInc = invoiceToSave.grandTotal;
            else if ((invoiceToSave.amountPaid || 0) < invoiceToSave.grandTotal) balanceInc = invoiceToSave.grandTotal - (invoiceToSave.amountPaid || 0);
            const newAdv = Math.max(0, (c.walletAdvance || c.prepaidAdvance || 0) - (invoiceToSave.advanceApplied || 0));
            const newDue = (c.dueBalance || c.outstandingBalance || 0) + balanceInc;
            return {
              ...c,
              totalInvoices: (c.totalInvoices || 0) + 1,
              totalSpent: (c.totalSpent || 0) + invoiceToSave.grandTotal,
              walletAdvance: newAdv,
              prepaidAdvance: newAdv,
              loyaltyPoints: Math.max(0, (c.loyaltyPoints || 0) - (invoiceToSave.loyaltyPointsUsed || 0)),
              dueBalance: newDue,
              outstandingBalance: newDue
            };
          }
          return c;
        }));
      }
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing. Please log in again.");

      // Helper to ensure valid 24-hex ObjectId string
      const toValidObjectId = (idStr, fallbackHex = "65f000000000000000000001") => {
        if (typeof idStr === "string" && idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
          return idStr;
        }
        return fallbackHex;
      };

      const walkinCust = customers.find(c =>
        (c.phone === "9999999999") ||
        (c.name && c.name.toLowerCase().includes("walk-in"))
      );
      const defaultCustId = walkinCust ? (walkinCust._id || walkinCust.id) : null;
      const rawCustId = inv.customerId || inv.customer?._id;
      const validCustomerId = (typeof rawCustId === "string" && rawCustId.length === 24 && /^[0-9a-fA-F]{24}$/.test(rawCustId))
        ? rawCustId
        : (defaultCustId || null);
      const validFirmId = toValidObjectId(inv.firmId, "65f000000000000000000002");
      const validWarehouseId = toValidObjectId(inv.warehouseId, "65f000000000000000000003");
      const validSalesmanId = (inv.employeeId && inv.employeeId.length === 24 && /^[0-9a-fA-F]{24}$/.test(inv.employeeId)) ? inv.employeeId : null;

      const barcodesList = (inv.items || []).map((item, idx) => ({
        barcode: item.barcode || item.itemCode || `BC-${Date.now()}-${idx}`,
        productId: item.productId || item.id || item._id,
        itemCode: item.itemCode,
        uniqueCode: item.uniqueCode,
        sellingPrice: Number(item.price || item.sellingPrice || 0),
        discountAmount: Number(item.discountAmount || 0)
      }));

      const paymentTransactionsList = (() => {
        if (Array.isArray(inv.paymentTransactions) && inv.paymentTransactions.length > 0) {
          return inv.paymentTransactions.map(tx => ({
            mode: String(tx.mode || 'CASH').toUpperCase().replace(/\s+/g, '_'),
            amount: Number(tx.amount || 0),
            referenceNo: tx.referenceNo || null,
            notes: tx.notes || null
          })).filter(tx => tx.amount > 0);
        }
        if (Array.isArray(inv.splitPayments) && inv.splitPayments.length > 0) {
          return inv.splitPayments.map(sp => ({
            mode: String(sp.method || sp.mode || 'CASH').toUpperCase().replace(/\s+/g, '_'),
            amount: Number(sp.amount || 0),
            referenceNo: null,
            notes: null
          })).filter(tx => tx.amount > 0);
        }
        const pm = String(inv.paymentMethod || 'CASH').toUpperCase().replace(/\s+/g, '_');
        return [{
          mode: pm === 'SPLIT' ? 'CASH' : pm,
          amount: Number(inv.grandTotal || 0),
          referenceNo: null,
          notes: null
        }];
      })();

      const billingPayload = {
        billNo: inv.invoiceNo || inv.billNo || `BILL-${Date.now()}`,
        billDate: inv.date || new Date().toISOString(),
        customerId: validCustomerId,
        firmId: validFirmId,
        warehouseId: validWarehouseId,
        salesmanId: validSalesmanId,
        barcodes: barcodesList.length > 0 ? barcodesList : [{ barcode: `BC-${Date.now()}`, sellingPrice: Number(inv.grandTotal || 0), discountAmount: 0 }],
        paymentTransactions: paymentTransactionsList,
        paymentMethod: inv.paymentMethod || (paymentTransactionsList.length > 0 ? paymentTransactionsList.map(t => t.mode).join(' + ') : 'CASH'),
        advanceApplied: Number(inv.advanceApplied || 0),
        remarks: inv.remarks || null
      };

      const res = await api.post(`/billing`, billingPayload);
      const data = res.data;

      if (data.success && data.data) {
        const rawBill = data.data.saleBill || data.data;
        const savedInvoice = normalizeInvoice({
          ...inv,
          ...rawBill,
          id: rawBill._id || rawBill.id || inv.id,
          _id: rawBill._id || rawBill.id,
          invoiceNo: rawBill.billNo || inv.invoiceNo,
          billNo: rawBill.billNo || inv.invoiceNo,
          items: inv.items || []
        });

        // Refetch invoices, customer lists, and products catalog directly from backend DB
        try {
          const [resInvoices, resCustomers, resProducts] = await Promise.all([
            api.get(`/billing`),
            api.get(`/customers`),
            api.get(`/products`)
          ]);

          const fetchedInvoices = extractBillsArray(resInvoices.data);
          if (fetchedInvoices.length > 0) {
            setInvoices(fetchedInvoices.map(i => normalizeInvoice(i)).filter(Boolean));
          } else {
            setInvoices(prev => [savedInvoice, ...prev.filter(i => i.id !== savedInvoice.id)]);
          }

          if (resCustomers.data?.success) {
            setCustomers(resCustomers.data.data.map(c => ({ ...c, id: c._id })));
          }

          if (resProducts.data?.success) {
            const rawProds = Array.isArray(resProducts.data.data) ? resProducts.data.data : (resProducts.data.data?.products || []);
            setProducts(rawProds.map(p => ({ ...p, id: p._id })));
          }
        } catch (refetchErr) {
          console.error("[Post-checkout refetch error]", refetchErr);
        }

        addToastNotification("Success", `Bill ${savedInvoice.invoiceNo} saved to MongoDB`, "success");
        return savedInvoice;
      } else {
        throw new Error(data.message || "Failed to save bill to database");
      }
    } catch (error) {
      console.error("[handleAddInvoice Error]", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to save bill to database";
      addToastNotification("Billing Error", errorMsg, "danger");
      return null;
    }
  }, [customers, addToastNotification]);

  const handleRetryWhatsApp = async (invoiceId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/billing/${invoiceId}/send-whatsapp`);
      const data = res.data;
      if (data.success) {
        addToastNotification("WhatsApp", "Invoice dispatched to WhatsApp successfully.", "success");
        // Refresh invoices list so status updates reflect in history
        const resInvoices = await api.get(`/billing`);
        const fetchedInvoices = extractBillsArray(resInvoices.data);
        if (fetchedInvoices.length > 0) {
          setInvoices(fetchedInvoices.map(i => normalizeInvoice(i)).filter(Boolean));
        }
        return true;
      } else {
        addToastNotification("WhatsApp Failed", data.message || "Dispatch failed.", "danger");
        return false;
      }
    } catch (error) {
      console.error("[handleRetryWhatsApp]", error);
      addToastNotification("Error", "Failed to connect to API", "danger");
      return false;
    }
  };

  const handleAddPurchaseOrder = async (po) => {
    try {
      if (po?.skipApiPost) {
        try {
          const [resPOs, resProducts, resSuppliers] = await Promise.all([
            api.get(`/purchase-orders`),
            api.get(`/products`),
            api.get(`/suppliers`)
          ]);
          if (resProducts.data?.success) {
            const rawProds = Array.isArray(resProducts.data.data) ? resProducts.data.data : (resProducts.data.data?.products || []);
            setProducts(rawProds.map(p => ({ ...p, id: p._id || p.id })));
          }
          const dataOrBills = Array.isArray(resPOs.data?.data)
            ? resPOs.data.data
            : (Array.isArray(resPOs.data?.data?.bills) ? resPOs.data.data.bills : []);
          if (dataOrBills.length > 0) {
            setPurchaseOrders(dataOrBills.map(p => ({ ...p, id: p._id || p.id })));
          }
          if (resSuppliers.data?.success) {
            setSuppliers(resSuppliers.data.data.map(s => ({ ...s, id: s._id || s.id })));
          }
        } catch (refetchErr) {
          console.warn("Refetch after PT import error:", refetchErr);
        }
        return;
      }

      const token = localStorage.getItem("token");
      const res = await api.post(`/purchase-orders`, po);
      const data = res.data;

      if (data.success) {
        const savedPo = {
          ...data.data,
          id: data.data._id || data.data.id || po.id,
          items: (Array.isArray(data.data?.items) && data.data.items.length > 0)
            ? data.data.items
            : (po.items || po.billItems || po.products || [])
        };
        setPurchaseOrders((prev) => [savedPo, ...prev]);

        // Refetch purchase orders, products, and suppliers from MongoDB to guarantee persistence sync
        try {
          const [resPOs, resProducts, resSuppliers] = await Promise.all([
            api.get(`/purchase-orders`),
            api.get(`/products`),
            api.get(`/suppliers`)
          ]);

          const dataOrBills = Array.isArray(resPOs.data?.data)
            ? resPOs.data.data
            : (Array.isArray(resPOs.data?.data?.bills) ? resPOs.data.data.bills : []);
          if (dataOrBills.length > 0) {
            const fetchedList = dataOrBills.map(p => ({ ...p, id: p._id || p.id }));
            setPurchaseOrders((prev) => {
              const combined = [...fetchedList];
              if (!combined.some(p => p.id === savedPo.id || p.poNo === savedPo.poNo)) {
                combined.unshift(savedPo);
              }
              return combined;
            });
          }

          if (resProducts.data?.success) setProducts(resProducts.data.data.map(p => ({ ...p, id: p._id })));
          if (resSuppliers.data?.success) setSuppliers(resSuppliers.data.data.map(s => ({ ...s, id: s._id })));
        } catch (e) {}
        return true;
      } else {
        addToastNotification("Error", data.message || "Failed to save Purchase Order", "danger");
        return false;
      }
    } catch (error) {
      console.error("handleAddPurchaseOrder catch error:", error);
      addToastNotification("Error", error.response?.data?.message || error.message || "Failed to connect to API", "danger");
      return false;
    }
  };

  const handleUpdatePurchaseOrder = async (id, po) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/purchase-orders/${id}`, po);
      const data = res.data;

      if (data.success) {
        setPurchaseOrders((prev) => prev.map(p => p.id === id ? { ...data.data, id: data.data._id } : p));

        const [resProducts, resSuppliers] = await Promise.all([
          api.get(`/products`),
          api.get(`/suppliers`)
        ]);

        const dataProducts = resProducts.data;
        const dataSuppliers = resSuppliers.data;

        if (dataProducts.success) setProducts(dataProducts.data.map(p => ({ ...p, id: p._id })));
        if (dataSuppliers.success) setSuppliers(dataSuppliers.data.map(s => ({ ...s, id: s._id })));
        return true;
      } else {
        alert("Backend Error: " + (data.message || "Unknown error"));
        addToastNotification("Error", data.message, "danger");
        return false;
      }
    } catch (error) {
      alert("App.jsx catch error: " + error.message);
      addToastNotification("Error", "Failed to connect to API", "danger");
      return false;
    }
  };

  const handleDeletePurchaseOrder = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.delete(`/purchase-orders/${id}`);
      const data = res.data;

      if (data.success) {
        setPurchaseOrders((prev) => prev.filter(p => p.id !== id));

        const [resProducts, resSuppliers] = await Promise.all([
          api.get(`/products`),
          api.get(`/suppliers`)
        ]);

        const dataProducts = resProducts.data;
        const dataSuppliers = resSuppliers.data;

        if (dataProducts.success) setProducts(dataProducts.data.map(p => ({ ...p, id: p._id })));
        if (dataSuppliers.success) setSuppliers(dataSuppliers.data.map(s => ({ ...s, id: s._id })));
        return true;
      } else {
        alert("Backend Error: " + (data.message || "Unknown error"));
        addToastNotification("Error", data.message, "danger");
        return false;
      }
    } catch (error) {
      alert("App.jsx catch error: " + error.message);
      addToastNotification("Error", "Failed to connect to API", "danger");
      return false;
    }
  };

  const handleSettleSupplierBalance = async (supplierId, amount) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/suppliers/${supplierId}/settle`, { amount });
      const data = res.data;

      if (data.success) {
        setSuppliers((prev) => prev.map((s) => (s.id === supplierId ? { ...data.data, id: data.data._id } : s)));
        addToastNotification("Success", "Supplier balance settled", "success");
      } else {
        addToastNotification("Error", data.message, "danger");
      }
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const handleSettleCustomerBalance = async (customerId, amount) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/customers/${customerId}/settle`, { amount });
      const data = res.data;
      if (data.success) {
        setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...data.data, id: data.data._id } : c)));
        addToastNotification("Success", "Customer balance settled", "success");
      } else {
        addToastNotification("Error", data.message, "danger");
      }
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const handleDisburseCommission = async (employeeId, amount) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/employees/${employeeId}/disburse`, { amount });
      const data = res.data;

      if (data.success) {
        setEmployees((prev) => prev.map((e) => (e.id === employeeId ? { ...data.data, id: data.data._id } : e)));
        addToastNotification("Success", "Commission disbursed", "success");
      } else {
        addToastNotification("Error", data.message, "danger");
      }
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const handleAddExpense = async (exp) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/expenses`, exp);
      const data = res.data;
      if (data.success) {
        setExpenses((prev) => [{ ...data.data, id: data.data._id }, ...prev]);
        addToastNotification("Success", "Expense logged successfully", "success");
      } else {
        addToastNotification("Error", data.message, "danger");
      }
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/tickets/${ticketId}/resolve`);
      const data = res.data;
      if (data.success) {
        setSupportTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...data.data, id: data.data._id } : t)),
        );
        addToastNotification("Success", "Ticket resolved successfully", "success");
      } else {
        addToastNotification("Error", data.message, "danger");
      }
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications([]);
    try {
      await api.delete(`/notifications/clear`);
    } catch (error) {
      console.warn("Notification clear endpoint unavailable, cleared locally.");
    }
  };

  const handleMarkNotificationRead = async (id) => {
    // Optimistically update UI so it changes instantly hand-to-hand
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

    try {
      const token = localStorage.getItem("token");
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateCustomerBalance = async (customerId, amount) => {
    try {
      const token = localStorage.getItem("token");
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;
      const newBalance = Math.max(0, customer.outstandingBalance + amount);
      const res = await api.put(`/customers/${customerId}`, { outstandingBalance: newBalance });
      const data = res.data;
      if (data.success) {
        setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...data.data, id: data.data._id } : c)));
      } else {
        addToastNotification("Error", data.message, "danger");
      }
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const handleAddCustomer = async (newCust) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/customers`, newCust);
      const data = res.data;
      if (data.success) {
        setCustomers((prev) => [{ ...data.data, id: data.data._id }, ...prev]);
      } else {
        addToastNotification("Error", data.message, "danger");
      }
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const openArticulationWithDefaults = (options = {}) => {
    if (options && options.tab) {
      setArticulationInitialTab(options.tab);
    } else {
      setArticulationInitialTab("dashboard");
    }
    if (options && (options.filterStatus || options.filter)) {
      setArticulationInitialFilter(options.filterStatus || options.filter);
    } else {
      setArticulationInitialFilter("All");
    }
    setArticulationStartAlteration(options.startAlteration || false);
    setActiveModule("articulation");
  };

  const switchableEmployees = Array.isArray(employees) && employees.length > 0
    ? employees.filter(Boolean)
    : [];

  const isAdminOrDhruv = ["admin", "businessadmin", "superadmin"].includes((currentUser?.role || '').toLowerCase()) ||
    (currentUser?.name || '').toLowerCase().includes("dhruv");

  // Unread notifications tracker
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Sidebar item profiles
  const modulesList = [
    { id: "dashboard", label: "Overview Dashboard", icon: LayoutDashboard },
    { id: "billing", label: "Boutique POS Billing", icon: ShoppingCart },
    { id: "articulation", label: "Tailoring & Garments", icon: Scissors },
    { id: "commissions", label: "Channel & Staff Commissions", icon: Percent },
    { id: "products", label: "Products & Catalogs", icon: Tags },
    { id: "inventory", label: "Inventory Management Module", icon: Warehouse },
    { id: "stock-management", label: "Stock Management Module", icon: ClipboardCheck },
    { id: "billing-sales", label: "Billing & Sales Management", icon: ShoppingCart },
    { id: "discount-offers", label: "Discount & Offer Engine", icon: Percent },
    { id: "purchase", label: "Procurements & POs (Purchase Management)", icon: FileText },
    { id: "vendor-communication", label: "Vendor Communication Card", icon: Building2 },
    { id: "financial-management", label: "Financial Management", icon: BarChart3 },
    { id: "accounts-treasury", label: "Accounts & Treasury", icon: Wallet },
    { id: "customers", label: "CRM & Customer Loyalty", icon: Users },
    { id: "employees", label: currentUser?.role?.toLowerCase() === 'salesperson' ? "Employee Portal" : "HR Payroll & rosters", icon: Users2 },
    { id: "staff", label: "Staff Management", icon: User },
    { id: "accounting", label: "General Ledger Profit", icon: Receipt },
    { id: "reports", label: "Reports & Business Analytics", icon: TrendingUp },
    { id: "saas", label: "SaaS Multi-Tenants", icon: Building2 },
    { id: "developer", label: "Developer Gate APIs", icon: Terminal },
    { id: "integrations", label: "Channel connectors", icon: Globe },
    { id: "settings", label: "System Configurations", icon: Settings },
    { id: "permissions", label: "Permissions & Role Access", icon: ShieldCheck },
    { id: "staff-activity", label: "Staff Activity Audit", icon: ShieldAlert },
    { id: "attendance-dashboard", label: "Attendance Record", icon: Clock },
    { id: "manager-review", label: "Manager Review", icon: ShieldAlert },
    { id: "attendance-settings", label: "Attendance Policy", icon: Settings },
  ];

  // Toast Overlay Renderer - Smooth premium notifications
  const renderToasts = () => (
    <div className="fixed bottom-5 right-5 z-[9999] space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const isSuccess = t.type === "success";
        const isDanger = t.type === "danger";
        const isWarning = t.type === "warning";
        const accentColor = isSuccess
          ? "#10b981"
          : isDanger
            ? "#ef4444"
            : isWarning
              ? "#f59e0b"
              : "#6366f1";
        const icon = isSuccess ? "✅" : isDanger ? "❌" : isWarning ? "⚠️" : "ℹ️";
        return (
          <div
            key={t.id}
            style={{
              borderLeft: `4px solid ${accentColor}`,
              animation: t.visible !== false
                ? "slideInToast 0.35s cubic-bezier(0.34,1.56,0.64,1) both"
                : "slideOutToast 0.4s cubic-bezier(0.36,0.07,0.19,0.97) both",
            }}
            className="p-3.5 rounded-xl shadow-2xl border border-slate-200/70 flex items-start justify-between gap-3 bg-white/95 backdrop-blur-md pointer-events-auto"
          >
            <div className="flex items-start gap-3 min-w-0">
              <span className="text-base shrink-0 mt-0.5">{icon}</span>
              <div className="space-y-0.5 min-w-0">
                <p className="font-extrabold uppercase tracking-wider text-[10px] text-slate-700">
                  {t.title}
                </p>
                <p className="font-medium text-[11px] text-slate-500 leading-relaxed">
                  {t.msg}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // Set visible to false immediately to trigger exit animation
                setToasts((prev) => prev.map((toast) => toast.id === t.id ? { ...toast, visible: false } : toast));
                // Remove from state after animation completes
                setTimeout(() => {
                  setToasts((prev) => prev.filter((toast) => toast.id !== t.id));
                }, 400);
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 p-0.5 hover:bg-slate-100 rounded cursor-pointer self-start"
            >
              ✕
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideInToast {
          from { transform: translateX(110%) scale(0.92); opacity: 0; }
          to   { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes slideOutToast {
          from { transform: translateX(0) scale(1); opacity: 1; }
          to   { transform: translateX(120%) scale(0.92); opacity: 0; }
        }
      `}</style>
    </div>
  );

  const standardAppContent = (
    <div
      className="erp-page"
      id="threadflow-saas-root"
    >
      {/* Toast Overlay */}
      {renderToasts()}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`erp-sidebar justify-between duration-300 ${sidebarCollapsed ? "erp-sidebar--collapsed" : ""}`}
      >
        <div className="overflow-y-auto flex-1 py-4 px-3 space-y-6">
          {/* Brand header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm font-sans tracking-tight">
                  V
                </div>
                <div>
                  <h1 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase">
                    Vastra ERP
                  </h1>
                  <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest block">
                    v1.2 SaaS PRO
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="erp-icon-btn mx-auto border border-slate-200/60"
            >
              <ChevronsLeft
                className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {!sidebarCollapsed && (
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block pl-2 mb-2">
                OPERATIONS DIRECTORY
              </span>
            )}

            {modulesList
              .filter((mod) =>
                getAccessibleModules(currentUser?.role).includes(mod.id),
              )
              .map((mod) => {
                const Icon = mod.icon;
                const isActive = activeModule === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => {
                      setActiveModule(mod.id);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    title={mod.label}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
                    />
                    {!sidebarCollapsed && (
                      <span className="truncate">{mod.label}</span>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                {getUserInitials(currentUser?.name)}
              </div>
              {!sidebarCollapsed && (
                <div className="text-[10px] truncate">
                  <p className="font-bold text-slate-800 leading-tight truncate">
                    {currentUser?.name || "Guest User"}
                  </p>
                  <p className="text-indigo-600 font-semibold uppercase font-mono tracking-wider text-[8px] truncate">
                    {currentUser?.role || "Guest"} • Active
                  </p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={() => {
                  logoutUser("Manual Logout");
                }}
                className="p-1 hover:text-red-600 text-slate-400 hover:bg-red-50 rounded-lg cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Switch role picker directly in sidebar - ONLY FOR ADMIN / DHRUV */}
          {!sidebarCollapsed && isAdminOrDhruv && (
            <div className="mt-1">
              <label className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                Swap System Role
              </label>
              <select
                value={currentUser.id || currentUser._id}
                onChange={(e) => {
                  const selectedEmp = employees.find(
                    (emp) => (emp.id || emp._id) === e.target.value,
                  );
                  if (selectedEmp) {
                    setCurrentUser(selectedEmp);
                    localStorage.setItem("user", JSON.stringify(selectedEmp));
                    addToastNotification(
                      "Role Swapped",
                      `Session context switched to ${selectedEmp.name} (${selectedEmp.role})`,
                      "success",
                    );
                  }
                }}
                className="w-full text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {switchableEmployees.map((emp) => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN WORKSPACE AREA ── */}
      <div className="erp-container">
        {/* TOP NAVBAR */}
        <header className="erp-navbar">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-slate-800 capitalize">
              {modulesList.find((m) => m.id === activeModule)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick System Clock */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] font-mono text-slate-500 font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>June 28, 2026 | 22:15 UTC</span>
            </div>

            {/* Notifications Alert with unread badges */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  setShowProfileDropdown(false);
                }}
                className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 cursor-pointer relative"
              >
                <Bell className="w-5 h-5 text-indigo-600" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full animate-pulse border-2 border-white shadow-sm">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-1 z-[99999] text-xs space-y-1 animate-scale-up origin-top-right overflow-hidden">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl mb-2">
                    <span className="font-extrabold text-slate-800 uppercase tracking-widest text-[10px]">
                      Enterprise Alerts
                    </span>
                    <button
                      onClick={() => handleMarkAllNotificationsRead()}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto px-2 pb-2 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="text-center p-6 text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="font-semibold text-[11px]">No active alerts.</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        let PriorityIcon = Info;
                        let colorClass = "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100";
                        let iconColor = "text-slate-400";
                        let badgeClass = "bg-slate-100 text-slate-500";

                        if (n.priority === 'Critical') {
                          PriorityIcon = AlertCircle;
                          colorClass = n.read ? "bg-red-50/30 border-red-100/50 text-red-900/60" : "bg-red-50 border-red-200 text-red-900 shadow-sm hover:bg-red-100";
                          iconColor = "text-red-600";
                          badgeClass = "bg-red-100 text-red-700 border-red-200";
                        } else if (n.priority === 'High') {
                          PriorityIcon = AlertTriangle;
                          colorClass = n.read ? "bg-orange-50/30 border-orange-100/50 text-orange-900/60" : "bg-orange-50 border-orange-200 text-orange-900 shadow-sm hover:bg-orange-100";
                          iconColor = "text-orange-500";
                          badgeClass = "bg-orange-100 text-orange-700 border-orange-200";
                        } else if (n.priority === 'Normal') {
                          PriorityIcon = Info;
                          colorClass = n.read ? "bg-blue-50/30 border-blue-100/50 text-blue-900/60" : "bg-blue-50 border-blue-200 text-blue-900 shadow-sm hover:bg-blue-100";
                          iconColor = "text-blue-500";
                          badgeClass = "bg-blue-100 text-blue-700 border-blue-200";
                        }

                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.read) handleMarkNotificationRead(n.id);
                              setSelectedNotification(n);
                            }}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all ${colorClass} flex gap-3 relative overflow-hidden group`}
                          >
                            {!n.read && <div className={`absolute left-0 top-0 bottom-0 w-1 ${badgeClass.split(' ')[0]}`}></div>}
                            <div className={`mt-0.5 ${n.read ? 'opacity-40' : ''}`}>
                              <PriorityIcon className={`w-4 h-4 ${iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-0.5 gap-2">
                                <span className={`font-black truncate ${n.read ? 'opacity-60' : ''}`}>{n.title}</span>
                                <span className={`text-[9px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded-md border ${badgeClass} ${n.read ? 'opacity-50' : ''}`}>
                                  {n.priority || 'Info'}
                                </span>
                              </div>
                              <p className={`mt-1 leading-snug line-clamp-2 text-[10.5px] ${n.read ? 'opacity-60 font-medium' : 'font-bold'}`}>
                                {n.message}
                              </p>
                              <div className={`text-[8px] mt-1.5 font-mono uppercase tracking-wider ${n.read ? 'text-slate-400' : 'text-slate-500 font-bold'}`}>
                                {n.timestamp}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotificationsDropdown(false);
                }}
                className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 hover:ring-2 hover:ring-indigo-200 cursor-pointer flex items-center justify-center font-bold text-xs"
              >
                {getUserInitials(currentUser?.name)}
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 text-xs space-y-1 animate-scale-up">
                  <div className="p-2 border-b border-slate-100">
                    <p className="font-bold text-slate-800">
                      {currentUser?.name || "Guest User"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {currentUser?.email || "No email"}
                    </p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] bg-indigo-50 text-indigo-700 font-bold uppercase tracking-wider">
                      {currentUser?.role || "Guest"}
                    </span>
                  </div>

                  {/* Role Quick Switcher inside dropdown - ONLY FOR ADMIN / DHRUV */}
                  {isAdminOrDhruv && (
                    <div className="p-1.5 border-b border-slate-100 space-y-1">
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider px-1">
                        Quick Switch Context
                      </p>
                      {switchableEmployees.map((emp) => (
                        <button
                          key={emp.id || emp._id}
                          type="button"
                          onClick={() => {
                            setCurrentUser(emp);
                            localStorage.setItem("user", JSON.stringify(emp));
                            addToastNotification(
                              "Role Swapped",
                              `Session context switched to ${emp.name} (${emp.role})`,
                              "success",
                            );
                            setShowProfileDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between text-left p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-[10px] font-semibold ${(currentUser.id || currentUser._id) === (emp.id || emp._id) ? "bg-indigo-50/50 text-indigo-700 font-bold" : "text-slate-600"}`}
                        >
                          <span className="truncate">{emp.name}</span>
                          <span className="text-[8px] px-1 py-0.5 bg-slate-100 rounded text-slate-500 uppercase font-bold">
                            {emp.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setActiveModule("settings");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left p-2 hover:bg-slate-50 rounded-lg font-semibold cursor-pointer"
                  >
                    System Configuration
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      logoutUser("Manual Logout");
                    }}
                    className="w-full text-left p-2 text-red-600 hover:bg-red-50 rounded-lg font-bold cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* DYNAMIC VIEW CONTENT */}
        <main className="erp-main-content">
          <ErrorBoundary key={activeModule}>
          {activeModule === "dashboard" && (
            <DashboardView
              currentUser={currentUser}
              products={products}
              customers={customers}
              employees={employees}
              invoices={invoices}
              purchaseOrders={purchaseOrders}
              expenses={expenses}
              notifications={notifications}
              auditLogs={auditLogs}
              setActiveTab={setActiveModule}
              openArticulationWithDefaults={openArticulationWithDefaults}
              socket={socket}
              socketConnected={connected}
            />
          )}

          <div style={{ display: activeModule === "billing" ? "block" : "none", height: "100%" }}>
            <BillingPOSView
              activeModule={activeModule}
              currentUser={currentUser}
              products={products}
              customers={customers}
              employees={employees}
              invoices={invoices}
              isLoadingInvoices={isLoadingInvoices}
              isLoadingProducts={isLoadingProducts}
              onAddInvoice={handleAddInvoice}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomerBalance={handleUpdateCustomerBalance}
              onAddNotification={addToastNotification}
              onRetryWhatsApp={handleRetryWhatsApp}
              quickArticulateItem={quickArticulateItem}
              clearQuickArticulateItem={() => setQuickArticulateItem(null)}
            />
          </div>

          {activeModule === "articulation" && (
            <ArticulationView
              customers={customers}
              employees={employees}
              products={products}
              initialTab={articulationInitialTab}
              initialFilterStatus={articulationInitialFilter}
              autoStartAlteration={articulationStartAlteration}
              clearAutoStartAlteration={() => setArticulationStartAlteration(false)}
              onAddCustomToCart={(customItem) => {
                setQuickArticulateItem(customItem);
                setActiveModule("billing");
              }}
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === "commissions" && (
            <CommissionView
              employees={employees}
              invoices={invoices}
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === "products" && (
            <ProductManagementView
              currentUser={currentUser}
              products={products}
              isLoadingProducts={isLoadingProducts}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProducts={handleDeleteProducts}
              onAddNotification={addToastNotification}
              onNavigate={setActiveModule}
            />
          )}

          {activeModule === "inventory" && (
            <InventoryView
              products={products}
              onAdjustStock={handleAdjustStock}
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === "stock-management" && (
            <StockManagementView
              products={products}
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === "billing-sales" && (
            <BillingSalesView
              products={products}
              customers={customers}
              employees={employees}
              invoices={invoices}
              isLoadingInvoices={isLoadingInvoices}
              isLoadingProducts={isLoadingProducts}
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === "discount-offers" && (
            <DiscountManagementView
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === "purchase" && (
            <PurchaseView
              vendors={vendors}
              setVendors={setVendors}
              grns={grns}
              setGrns={setGrns}
              purchaseInvoices={purchaseInvoices}
              setPurchaseInvoices={setPurchaseInvoices}
              purchaseReturns={purchaseReturns}
              setPurchaseReturns={setPurchaseReturns}
              pendingPurchases={pendingPurchases}
              setPendingPurchases={setPendingPurchases}
              vendorOutstanding={vendorOutstanding}
              setVendorOutstanding={setVendorOutstanding}
              purchaseReports={purchaseReports}
              setPurchaseReports={setPurchaseReports}
              products={products}
              setProducts={setProducts}
              suppliers={suppliers}
              setSuppliers={setSuppliers}
              purchaseOrders={purchaseOrders}
              setPurchaseOrders={setPurchaseOrders}
              onAddPurchaseOrder={handleAddPurchaseOrder}
              onUpdatePurchaseOrder={handleUpdatePurchaseOrder}
              onDeletePurchaseOrder={handleDeletePurchaseOrder}
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === "vendor-communication" && (
            <VendorCommunicationCard currentUser={currentUser} />
          )}

          {activeModule === "financial-management" && (
            <FinancialView
              mode="financial"
              onAddNotification={addToastNotification}
              currentUser={currentUser}
            />
          )}

          {activeModule === "accounts-treasury" && (
            <FinancialView
              mode="accounts"
              onAddNotification={addToastNotification}
              currentUser={currentUser}
            />
          )}

          {activeModule === "customers" && (
            <CustomersView
              customers={customers}
              invoices={invoices}
              onSettleCustomerBalance={handleSettleCustomerBalance}
              onAddNotification={addToastNotification}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomerPrepaidAdvance={(updatedCustId, updatedCustData) => {
                setCustomers(prev => prev.map(c => ((c.id || c._id) === updatedCustId ? { ...c, ...updatedCustData, id: updatedCustData._id || updatedCustId } : c)));
              }}
            />
          )}

          {activeModule === "employees" && (
            <EmployeeView
              currentUser={currentUser}
              employees={employees}
              setEmployees={setEmployees}
              onDisburseCommission={handleDisburseCommission}
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === "staff" && (
            <StaffManagementView />
          )}

          {activeModule === "accounting" && (
            <AccountingView
              expenses={expenses}
              invoices={invoices}
              onAddExpense={handleAddExpense}
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === "reports" && (
            <ReportsView
              invoices={invoices}
              purchaseOrders={purchaseOrders}
              products={products}
              employees={employees}
              customers={customers}
              setActiveModule={setActiveModule}
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === "saas" && (
            <SaaSPanelView
              tenants={tenants}
              supportTickets={supportTickets}
              onResolveTicket={handleResolveTicket}
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === "developer" && (
            <DeveloperPortalView onAddNotification={addToastNotification} />
          )}

          {activeModule === "integrations" && (
            <IntegrationsView onAddNotification={addToastNotification} />
          )}

          {activeModule === "settings" && (
            <SettingsView onAddNotification={addToastNotification} currentUser={currentUser} />
          )}

          {activeModule === "permissions" && (
            <PermissionsView
              employees={employees}
              currentUser={currentUser}
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === "staff-activity" && (
            <StaffActivityView
              currentUser={currentUser}
              addToastNotification={addToastNotification}
            />
          )}

          {activeModule === "attendance-dashboard" && (
            <AttendanceDashboardView employees={employees} token={localStorage.getItem('token')} onAddNotification={addToastNotification} currentUser={currentUser} />
          )}

          {activeModule === "manager-review" && (
            <ManagerReviewPanel token={localStorage.getItem('token')} onAddNotification={addToastNotification} />
          )}

          {activeModule === "attendance-settings" && (
            <AttendancePolicySettings token={localStorage.getItem('token')} onAddNotification={addToastNotification} />
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* NOTIFICATION MODAL */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-scale-up border border-slate-100">
            <button
              onClick={() => setSelectedNotification(null)}
              className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedNotification.priority === 'Critical' ? 'bg-red-50 text-red-600' : selectedNotification.priority === 'High' ? 'bg-orange-50 text-orange-600' : selectedNotification.priority === 'Normal' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">
                  {selectedNotification.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${selectedNotification.priority === 'Critical' ? 'bg-red-100 text-red-700' : selectedNotification.priority === 'High' ? 'bg-orange-100 text-orange-700' : selectedNotification.priority === 'Normal' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {selectedNotification.priority || 'Info'}
                  </span>
                  <span className="text-xs font-medium text-slate-400 font-mono">
                    {selectedNotification.timestamp}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">
              <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedNotification.message}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors cursor-pointer text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {renderToasts()}
      <Routes>
        {/* Isolated Super Admin Routes */}
        <Route path="/ad/su" element={
          (isLoggedIn && currentUser?.role === "SuperAdmin") ? <Navigate to="/super-admin/dashboard" replace /> : (
            <AdminLogin
              onLogin={(user) => {
                setCurrentUser(user);
                setIsLoggedIn(true);
                localStorage.setItem("token", user.token);
                localStorage.setItem("user", JSON.stringify(user));
              }}
              addToastNotification={addToastNotification}
            />
          )
        } />

        <Route
          path="/super-admin/*"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} user={currentUser} requiredRole="SuperAdmin">
              <SuperAdminLayout
                currentUser={currentUser}
                onLogout={() => {
                  logoutUser("Manual Logout");
                }}
                tenants={tenants}
              />
            </ProtectedRoute>
          }
        />

        {/* Standard User App */}
        <Route path="/*" element={
          !isLoggedIn ? (
            <UserLogin
              onLogin={(user) => {
                setCurrentUser(user);
                setIsLoggedIn(true);
                localStorage.setItem("token", user.token);
                localStorage.setItem("user", JSON.stringify(user));
              }}
              addToastNotification={addToastNotification}
              switchableEmployees={switchableEmployees}
              getUserInitials={getUserInitials}
            />
          ) : (
            standardAppContent
          )
        } />
      </Routes>
    </>
  );
}

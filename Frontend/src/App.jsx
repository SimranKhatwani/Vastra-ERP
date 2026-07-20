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
} from "lucide-react";

// Import sub components
import { DashboardView } from "./components/DashboardView";
import { BillingPOSView } from "./components/BillingPOSView";
import { ArticulationView } from "./components/ArticulationView";
import { ProductManagementView } from "./components/ProductManagementView";

import { PurchaseView } from "./components/PurchaseView";
import { InventoryView } from "./components/InventoryView";
import { StockManagementView } from "./components/StockManagementView";
import { CustomersView } from "./components/CustomersView";
import { EmployeeView } from "./components/EmployeeView";
import { AccountingView } from "./components/AccountingView";
import { ReportsView } from "./components/ReportsView";
import { SaaSPanelView } from "./components/SaaSPanelView";
import { DeveloperPortalView } from "./components/DeveloperPortalView";
import { IntegrationsView } from "./components/IntegrationsView";
import { SettingsView } from "./components/SettingsView";
import { CommissionView } from "./components/CommissionView";
import { StaffManagementView } from "./components/StaffManagementView";
import AttendanceDashboardView from "./components/AttendanceDashboardView";
import AttendancePolicySettings from "./components/AttendancePolicySettings";
import ManagerReviewPanel from "./components/ManagerReviewPanel";
import { AdminLogin } from "./components/AdminLogin";
import { UserLogin } from "./components/UserLogin";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SuperAdminLayout } from "./components/superadmin/SuperAdminLayout";
import { useSocket } from "./contexts/SocketContext";

// Import mock data generators
import {
  generateDemoProducts,
  generateDemoCustomers,
  generateDemoSuppliers,
  generateDemoEmployees,
  generateDemoPurchaseOrders,
  generateDemoInvoices,
  generateExpenses,
  generateSaaSTenants,
  generateSupportTickets,
  generateNotifications,
  generateAuditLogs,
} from "./data/demoData";

const demoProductsData = generateDemoProducts();
const demoCustomersData = generateDemoCustomers();
const demoSuppliersData = generateDemoSuppliers();
const demoEmployeesData = generateDemoEmployees();
const demoInvoicesData = generateDemoInvoices(demoCustomersData, demoProductsData, demoEmployeesData);
const demoPurchaseOrdersData = generateDemoPurchaseOrders(demoSuppliersData, demoProductsData);
const demoExpensesData = generateExpenses();
const demoTenantsData = generateSaaSTenants();
const demoSupportTicketsData = generateSupportTickets();
const demoNotificationsData = generateNotifications();
const demoAuditLogsData = generateAuditLogs();

export default function App() {
  const { socket, connected } = useSocket();

  // Master States
  const [products, setProducts] = useState(demoProductsData);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState(demoSuppliersData);
  const [employees, setEmployees] = useState(demoEmployeesData);
  const [invoices, setInvoices] = useState(demoInvoicesData);
  const [purchaseOrders, setPurchaseOrders] = useState(demoPurchaseOrdersData);
  const [expenses, setExpenses] = useState(demoExpensesData);
  const [tenants, setTenants] = useState(demoTenantsData); 
  const [supportTickets, setSupportTickets] = useState(demoSupportTicketsData);
  const [notifications, setNotifications] = useState(demoNotificationsData);
  const [auditLogs, setAuditLogs] = useState(demoAuditLogsData);

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
    const emps = generateDemoEmployees();
    return (
      emps[0] || {
        id: "e-1",
        name: "Vijay Shekhar",
        email: "vijay.shekhar@garmentflow.com",
        phone: "7000000000",
        role: "Admin",
        status: "Active",
        attendanceRate: 98,
        salary: 85000,
        commissionEarned: 0,
        commissionRate: 0,
        monthlySales: 0,
        salesTarget: 0,
        leavesRemaining: 10,
      }
    );
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
        setProducts((prev) => prev.map((p) => (p.id === payload.product._id || p.id === payload.product.id ? { ...p, ...payload.product, id: payload.product._id || payload.product.id } : p)));
      }

      if (payload?.event === 'invoice.created' && payload.invoice) {
        setInvoices((prev) => [{ ...payload.invoice, id: payload.invoice._id }, ...prev]);
      }

      if (payload?.event === 'purchase.created' || payload?.event === 'purchase.approved') {
        setPurchaseOrders((prev) => [{ ...payload.purchaseOrder, id: payload.purchaseOrder._id }, ...prev]);
      }

      if (payload?.event === 'dashboard.stats.updated') {
        // no-op, dashboard will re-render from state changes
      }
    };

    const events = ['notification.created','notification.updated','inventory.updated','inventory.low','invoice.created','invoice.updated','purchase.created','purchase.approved','employee.created','employee.updated','commission.updated','supplier.updated','payroll.updated','whatsapp.sent','whatsapp.failed','tenant.activity','dashboard.stats.updated'];
    events.forEach((eventName) => socket.on(eventName, handleRealtimeEvent));

    return () => {
      events.forEach((eventName) => socket.off(eventName, handleRealtimeEvent));
    };
  }, [socket]);

  React.useEffect(() => {
    const fetchProducts = async () => {
      if (isLoggedIn) {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          const [resProducts, resCustomers, resInvoices, resSuppliers, resPurchaseOrders, resEmployees, resExpenses, resTickets, resNotifications] = await Promise.all([
            fetch("http://localhost:5000/api/products", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:5000/api/customers", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:5000/api/invoices", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:5000/api/suppliers", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:5000/api/purchase-orders", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:5000/api/employees", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:5000/api/expenses", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:5000/api/tickets", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:5000/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
          ]);
          
          if (resProducts.status === 401 || resCustomers.status === 401 || resInvoices.status === 401) {
            setIsLoggedIn(false);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            addToastNotification("Auth Service", "Session expired. Please log in again.", "warning");
            return;
          }

          const dataProducts = await resProducts.json();
          const dataCustomers = await resCustomers.json();
          const dataInvoices = await resInvoices.json();
          const dataSuppliers = await resSuppliers.json();
          const dataPurchaseOrders = await resPurchaseOrders.json();
          const dataEmployees = await resEmployees.json();
          const dataExpenses = await resExpenses.json();
          const dataTickets = await resTickets.json();
          const dataNotifications = await resNotifications.json();

          if (dataProducts.success) {
            const arr = dataProducts.data.map(p => ({...p, id: p._id}));
            setProducts(arr.length > 0 ? arr : demoProductsData);
          }
          if (dataCustomers.success) {
            const arr = dataCustomers.data.map(c => ({...c, id: c._id}));
            setCustomers(arr);
          }
          if (dataInvoices.success) {
            const arr = dataInvoices.data.map(i => ({...i, id: i._id}));
            setInvoices(arr.length > 0 ? arr : demoInvoicesData);
          }
          if (dataSuppliers.success) {
            const arr = dataSuppliers.data.map(s => ({...s, id: s._id}));
            setSuppliers(arr.length > 0 ? arr : demoSuppliersData);
          }
          if (dataPurchaseOrders.success) {
            const arr = dataPurchaseOrders.data.map(p => ({...p, id: p._id}));
            setPurchaseOrders(arr.length > 0 ? arr : demoPurchaseOrdersData);
          }
          if (dataEmployees.success) {
            const arr = dataEmployees.data.map(e => ({...e, id: e._id}));
            setEmployees(arr.length > 0 ? arr : demoEmployeesData);
          }
          if (dataExpenses.success) {
            const arr = dataExpenses.data.map(e => ({...e, id: e._id}));
            setExpenses(arr.length > 0 ? arr : demoExpensesData);
          }
          if (dataTickets.success) {
            const arr = dataTickets.data.map(t => ({...t, id: t._id}));
            setSupportTickets(arr.length > 0 ? arr : demoSupportTicketsData);
          }
          if (dataNotifications.success) {
            const arr = dataNotifications.data.map(n => ({...n, id: n._id}));
            setNotifications(arr.length > 0 ? arr : demoNotificationsData);
          }
        } catch (error) {
          console.error("Failed to fetch data", error);
        }
      }
    };
    fetchProducts();
  }, [isLoggedIn]);
  
  const [quickArticulateItem, setQuickArticulateItem] = useState(null);

  // Navigation
  const [activeModule, setActiveModule] = useState(() => {
    return localStorage.getItem("vastraActiveModule") || "dashboard";
  });

  React.useEffect(() => {
    localStorage.setItem("vastraActiveModule", activeModule);
  }, [activeModule]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] =
    useState(false);
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

  // Role-based sidebar module access helper
  const getAccessibleModules = (role) => {
    switch ((role || '').toLowerCase()) {
      case "superadmin":
        return [
          "saas",
          "developer",
          "integrations",
          "settings",
          "attendance-dashboard",
          "manager-review",
          "attendance-settings",
        ];
      case "businessadmin":
        return [
          "dashboard",
          "billing",
          "articulation",
          "inventory_articulation",
          "commissions",
          "products",
          "inventory",
          "stock-management",
          "purchase",
          "customers",
          "employees",
          "staff",
          "accounting",
          "reports",
          "integrations",
          "dev",
          "settings",
          "attendance-dashboard",
          "manager-review",
          "attendance-settings",
        ];
      case "manager":
        return [
          "dashboard",
          "billing",
          "articulation",
          "inventory_articulation",
          "commissions",
          "products",
          "inventory",
          "stock-management",
          "purchase",
          "customers",
          "employees",
          "reports",
          "settings",
          "attendance-dashboard",
          "manager-review",
        ];
      case "cashier":
        return [
          "dashboard",
          "billing",
          "articulation",
          "products",
          "purchase",
          "customers",
          "accounting",
          "attendance-dashboard",
        ];
      case "salesperson":
        return [
          "dashboard",
          "billing",
          "articulation",
          "products",
          "purchase",
          "attendance-dashboard",
        ];
      case "tailor":
        return ["articulation", "attendance-dashboard"];
      default:
        return ["billing"];
    }
  };

  // Ensure active module is always one the current user has access to
  React.useEffect(() => {
    const allowed = getAccessibleModules(currentUser.role);
    if (!allowed.includes(activeModule)) {
      setActiveModule(allowed[0] || "billing");
    }
  }, [currentUser.role, activeModule]);

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
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, msg, type }]);
    // Auto clear toast
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
      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(prod)
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => [{...data.data, id: data.data._id}, ...prev]);
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
      const res = await fetch(`http://localhost:5000/api/products/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? {...data.data, id: data.data._id} : p)));
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
        await fetch(`http://localhost:5000/api/products/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const handleAdjustStock = async (productId, amount, activity = "ADJUSTMENT", referenceType = "Stock Adjustment", referenceNumber = "", remarks = "") => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/products/${productId}/adjust-stock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, activity, referenceType, referenceNumber, remarks })
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? {...data.data, id: data.data._id} : p)),
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
          if (c.id === invoiceToSave.customerId) {
            let balanceInc = 0;
            if (invoiceToSave.paymentMethod === 'Credit') balanceInc = invoiceToSave.grandTotal;
            else if ((invoiceToSave.amountPaid || 0) < invoiceToSave.grandTotal) balanceInc = invoiceToSave.grandTotal - (invoiceToSave.amountPaid || 0);
            return {
              ...c,
              totalInvoices: (c.totalInvoices || 0) + 1,
              totalSpent: (c.totalSpent || 0) + invoiceToSave.grandTotal,
              loyaltyPoints: (c.loyaltyPoints || 0) + Math.floor(invoiceToSave.grandTotal * 0.05),
              outstandingBalance: (c.outstandingBalance || 0) + balanceInc
            };
          }
          return c;
        }));
      }
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Offline Mode");

      const res = await fetch("http://localhost:5000/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(inv)
      });
      const data = await res.json();
      
      if (data.success) {
        performLocalStateUpdates({...data.data, id: data.data._id});
        addToastNotification("Success", "Invoice saved to database", "success");
        return data.data;
      } else {
        throw new Error(data.message || "Failed to save invoice");
      }
    } catch (error) {
      console.warn("Falling back to local invoice state due to API error:", error.message);
      // Generate a mock ID if offline
      const mockInvoice = { ...inv, id: `inv-mock-${Date.now()}` };
      performLocalStateUpdates(mockInvoice);
      addToastNotification("Offline Mode", "Invoice saved locally. Stock deducted.", "info");
      return mockInvoice;
    }
  }, [addToastNotification]);

  const handleRetryWhatsApp = async (invoiceId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/send-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        addToastNotification("WhatsApp", "Invoice dispatched to WhatsApp successfully.", "success");
        // Refresh invoices list so status updates reflect in history
        const resInvoices = await fetch("http://localhost:5000/api/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataInvoices = await resInvoices.json();
        if (dataInvoices.success) {
          setInvoices(dataInvoices.data.map((i) => ({ ...i, id: i._id })));
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
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(po)
      });
      const data = await res.json();
      
      if (data.success) {
        setPurchaseOrders((prev) => [{...data.data, id: data.data._id}, ...prev]);
        
        // Backend handles stock addition and supplier balance updates, so refetch
        const [resProducts, resSuppliers] = await Promise.all([
          fetch("http://localhost:5000/api/products", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/suppliers", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const dataProducts = await resProducts.json();
        const dataSuppliers = await resSuppliers.json();
        
        if (dataProducts.success) setProducts(dataProducts.data.map(p => ({...p, id: p._id})));
        if (dataSuppliers.success) setSuppliers(dataSuppliers.data.map(s => ({...s, id: s._id})));
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

  const handleUpdatePurchaseOrder = async (id, po) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/purchase-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(po)
      });
      const data = await res.json();
      
      if (data.success) {
        setPurchaseOrders((prev) => prev.map(p => p.id === id ? {...data.data, id: data.data._id} : p));
        
        const [resProducts, resSuppliers] = await Promise.all([
          fetch("http://localhost:5000/api/products", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/suppliers", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const dataProducts = await resProducts.json();
        const dataSuppliers = await resSuppliers.json();
        
        if (dataProducts.success) setProducts(dataProducts.data.map(p => ({...p, id: p._id})));
        if (dataSuppliers.success) setSuppliers(dataSuppliers.data.map(s => ({...s, id: s._id})));
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
      const res = await fetch(`http://localhost:5000/api/purchase-orders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setPurchaseOrders((prev) => prev.filter(p => p.id !== id));
        
        const [resProducts, resSuppliers] = await Promise.all([
          fetch("http://localhost:5000/api/products", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/suppliers", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const dataProducts = await resProducts.json();
        const dataSuppliers = await resSuppliers.json();
        
        if (dataProducts.success) setProducts(dataProducts.data.map(p => ({...p, id: p._id})));
        if (dataSuppliers.success) setSuppliers(dataSuppliers.data.map(s => ({...s, id: s._id})));
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
      const res = await fetch(`http://localhost:5000/api/suppliers/${supplierId}/settle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuppliers((prev) => prev.map((s) => (s.id === supplierId ? {...data.data, id: data.data._id} : s)));
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
      const res = await fetch(`http://localhost:5000/api/customers/${customerId}/settle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) => prev.map((c) => (c.id === customerId ? {...data.data, id: data.data._id} : c)));
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
      const res = await fetch(`http://localhost:5000/api/employees/${employeeId}/disburse`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      
      if (data.success) {
        setEmployees((prev) => prev.map((e) => (e.id === employeeId ? {...data.data, id: data.data._id} : e)));
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
      const res = await fetch("http://localhost:5000/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(exp)
      });
      const data = await res.json();
      if (data.success) {
        setExpenses((prev) => [{...data.data, id: data.data._id}, ...prev]);
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
      const res = await fetch(`http://localhost:5000/api/tickets/${ticketId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
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
    // Basic implementation: mark them all via API or just locally and send multiple PUTs
    try {
      const token = localStorage.getItem("token");
      const unread = notifications.filter(n => !n.read);
      
      // In a real app we'd have a bulk endpoint, but for now we map over them
      await Promise.all(unread.map(n => 
        fetch(`http://localhost:5000/api/notifications/${n.id}/read`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        })
      ));

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true })),
      );
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const handleMarkNotificationRead = async (id) => {
    // Optimistically update UI so it changes instantly hand-to-hand
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
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
      const res = await fetch(`http://localhost:5000/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ outstandingBalance: newBalance })
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) => prev.map((c) => (c.id === customerId ? {...data.data, id: data.data._id} : c)));
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
      const res = await fetch("http://localhost:5000/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCust)
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) => [{...data.data, id: data.data._id}, ...prev]);
      } else {
        addToastNotification("Error", data.message, "danger");
      }
    } catch (error) {
      addToastNotification("Error", "Failed to connect to API", "danger");
    }
  };

  const openArticulationWithDefaults = () => {
    setActiveModule("articulation");
    addToastNotification(
      "Tailoring Studio",
      "Initialized standard blazer blueprint with default canvas dimensions.",
      "info",
    );
  };

  // Distinct employee profile per system role
  const switchableEmployees = [
    "Admin",
    "Manager",
    "Cashier",
    "Salesperson",
    "Tailor",
  ]
    .map((role) => (employees || []).find((e) => e.role === role))
    .filter(Boolean);

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
    { id: "purchase", label: "Procurements & POs", icon: FileText },
    { id: "customers", label: "CRM & Customer Loyalty", icon: Users },
    { id: "employees", label: currentUser?.role?.toLowerCase() === 'salesperson' ? "Employee Portal" : "HR Payroll & rosters", icon: Users2 },
    { id: "staff", label: "Staff Management", icon: User },
    { id: "accounting", label: "General Ledger Profit", icon: Receipt },
    { id: "reports", label: "Advanced Report Hub", icon: TrendingUp },
    { id: "saas", label: "SaaS Multi-Tenants", icon: Building2 },
    { id: "developer", label: "Developer Gate APIs", icon: Terminal },
    { id: "integrations", label: "Channel connectors", icon: Globe },
    { id: "settings", label: "System Configurations", icon: Settings },
    { id: "attendance-dashboard", label: "Attendance Record", icon: Clock },
    { id: "manager-review", label: "Manager Review", icon: ShieldAlert },
    { id: "attendance-settings", label: "Attendance Policy", icon: Settings },
  ];

  // Toast Overlay Renderer
  const renderToasts = () => (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`p-4 rounded-xl shadow-xl border flex items-start gap-2.5 animate-scale-up text-xs font-semibold bg-white pointer-events-auto ${t.type === "success"
            ? "border-emerald-200 text-emerald-800"
            : t.type === "danger"
              ? "border-red-200 text-red-800"
              : t.type === "warning"
                ? "border-amber-200 text-amber-800"
                : "border-slate-200 text-slate-700"
            }`}
        >
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wide text-[10px]">
              {t.title}
            </p>
            <p className="font-medium text-slate-500 leading-relaxed">
              {t.msg}
            </p>
          </div>
        </div>
      ))}
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
                getAccessibleModules(currentUser.role).includes(mod.id),
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
                {getUserInitials(currentUser.name)}
              </div>
              {!sidebarCollapsed && (
                <div className="text-[10px] truncate">
                  <p className="font-bold text-slate-800 leading-tight truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-indigo-600 font-semibold uppercase font-mono tracking-wider text-[8px] truncate">
                    {currentUser.role} • Active
                  </p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  addToastNotification(
                    "Auth Service",
                    "Multi-tenant session terminated.",
                    "warning",
                  );
                }}
                className="p-1 hover:text-red-600 text-slate-400 hover:bg-red-50 rounded-lg cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Switch role picker directly in sidebar */}
          {!sidebarCollapsed && (
            <div className="mt-1">
              <label className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                Swap System Role
              </label>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const selectedEmp = employees.find(
                    (emp) => emp.id === e.target.value,
                  );
                  if (selectedEmp) {
                    setCurrentUser(selectedEmp);
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
                  <option key={emp.id} value={emp.id}>
                    {emp.role}: {emp.name.split(" ")[0]}
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
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono font-bold text-[8px] px-1 rounded-full animate-bounce">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 text-xs space-y-2 animate-scale-up">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wide">
                      Live Stream Alerts
                    </span>
                    <button
                      onClick={() => handleMarkAllNotificationsRead()}
                      className="text-[9px] text-indigo-600 hover:underline font-bold"
                    >
                      Mark All Read
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onDoubleClick={() => { if (!n.read) handleMarkNotificationRead(n.id); }}
                        className={`p-2.5 rounded-lg border text-[11px] cursor-pointer transition-colors ${n.read ? "bg-slate-50 border-slate-100 text-slate-500" : "bg-indigo-50/50 border-indigo-100 text-black shadow-xs hover:bg-indigo-50"}`}
                      >
                        <div className={`flex justify-between text-[10px] ${n.read ? 'font-semibold' : 'font-extrabold'}`}>
                          <span>{n.title}</span>
                          <span className={`text-[8px] font-mono ${n.read ? 'text-slate-400 font-normal' : 'text-slate-500 font-bold'}`}>
                            {n.timestamp}
                          </span>
                        </div>
                        <p className={`mt-0.5 leading-relaxed ${n.read ? 'font-normal text-slate-500' : 'font-bold text-black'}`}>
                          {n.message}
                        </p>
                      </div>
                    ))}
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
                {getUserInitials(currentUser.name)}
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 text-xs space-y-1 animate-scale-up">
                  <div className="p-2 border-b border-slate-100">
                    <p className="font-bold text-slate-800">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {currentUser.email}
                    </p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] bg-indigo-50 text-indigo-700 font-bold uppercase tracking-wider">
                      {currentUser.role}
                    </span>
                  </div>

                  {/* Role Quick Switcher inside dropdown */}
                  <div className="p-1.5 border-b border-slate-100 space-y-1">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider px-1">
                      Quick Switch Context
                    </p>
                    {switchableEmployees.map((emp) => (
                      <button
                        key={emp.id}
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
                        className={`w-full flex items-center justify-between text-left p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-[10px] font-semibold ${currentUser.id === emp.id ? "bg-indigo-50/50 text-indigo-700 font-bold" : "text-slate-600"}`}
                      >
                        <span className="truncate">{emp.name}</span>
                        <span className="text-[8px] px-1 py-0.5 bg-slate-100 rounded text-slate-500 uppercase font-bold">
                          {emp.role}
                        </span>
                      </button>
                    ))}
                  </div>

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
                      setIsLoggedIn(false);
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      addToastNotification(
                        "Auth Service",
                        "Multi-tenant session terminated successfully.",
                        "warning",
                      );
                      setShowProfileDropdown(false);
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
            />
          )}

          {activeModule === "billing" && (
            <BillingPOSView
              currentUser={currentUser}
              products={products}
              customers={customers}
              employees={employees}
              invoices={invoices}
              onAddInvoice={handleAddInvoice}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomerBalance={handleUpdateCustomerBalance}
              onAddNotification={addToastNotification}
              onRetryWhatsApp={handleRetryWhatsApp}
              quickArticulateItem={quickArticulateItem}
              clearQuickArticulateItem={() => setQuickArticulateItem(null)}
            />
          )}

          {activeModule === "articulation" && (
            <ArticulationView
              customers={customers}
              employees={employees}
              products={products}
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

          {activeModule === "purchase" && (
            <PurchaseView
              purchaseOrders={purchaseOrders}
              suppliers={suppliers}
              setSuppliers={setSuppliers}
              products={products}
              setProducts={setProducts}
              onAddPurchaseOrder={handleAddPurchaseOrder}
              onUpdatePurchaseOrder={handleUpdatePurchaseOrder}
              onDeletePurchaseOrder={handleDeletePurchaseOrder}
              onSettleSupplierBalance={handleSettleSupplierBalance}
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === "customers" && (
            <CustomersView
              customers={customers}
              invoices={invoices}
              onSettleCustomerBalance={handleSettleCustomerBalance}
              onAddNotification={addToastNotification}
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

          {activeModule === "attendance-dashboard" && (
            <AttendanceDashboardView employees={employees} token={localStorage.getItem('token')} onAddNotification={addToastNotification} />
          )}

          {activeModule === "manager-review" && (
            <ManagerReviewPanel token={localStorage.getItem('token')} onAddNotification={addToastNotification} />
          )}

          {activeModule === "attendance-settings" && (
            <AttendancePolicySettings token={localStorage.getItem('token')} onAddNotification={addToastNotification} />
          )}
        </main>
      </div>
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
                  setIsLoggedIn(false);
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  addToastNotification("Auth Service", "Session terminated.", "warning");
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

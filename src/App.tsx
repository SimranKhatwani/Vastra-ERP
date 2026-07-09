import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Scissors, 
  Tags, 
  Warehouse, 
  FileText, 
  Users, 
  Users2, 
  Receipt, 
  TrendingUp, 
  Globe, 
  Terminal, 
  Settings, 
  Building2, 
  Bell, 
  Search, 
  ChevronsLeft, 
  Menu, 
  CheckCircle, 
  Plus, 
  TrendingDown, 
  HelpCircle,
  Clock,
  Sparkles,
  Percent,
  LogOut,
  TableProperties
} from 'lucide-react';

// Import sub components
import { DashboardView } from './components/DashboardView';
import { BillingPOSView } from './components/BillingPOSView';
import { ArticulationView } from './components/ArticulationView';
import { ProductManagementView } from './components/ProductManagementView';
import { InventoryView } from './components/InventoryView';
import { InventoryArticulationWindow } from './components/InventoryArticulationWindow';
import { PurchaseView } from './components/PurchaseView';
import { CustomersView } from './components/CustomersView';
import { EmployeeView } from './components/EmployeeView';
import { AccountingView } from './components/AccountingView';
import { ReportsView } from './components/ReportsView';
import { SaaSPanelView } from './components/SaaSPanelView';
import { DeveloperPortalView } from './components/DeveloperPortalView';
import { IntegrationsView } from './components/IntegrationsView';
import { SettingsView } from './components/SettingsView';
import { CommissionView } from './components/CommissionView';

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
  generateAuditLogs
} from './data/demoData';

import { Product, Customer, Supplier, Employee, Invoice, PurchaseOrder, Expense, Tenant, SupportTicket, Notification, AuditLog } from './types/erp';

export default function App() {
  // Master States
  const [products, setProducts] = useState<Product[]>(() => generateDemoProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => generateDemoCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => generateDemoSuppliers());
  const [employees, setEmployees] = useState<Employee[]>(() => generateDemoEmployees());
  
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const custs = generateDemoCustomers();
    const prds = generateDemoProducts();
    const emps = generateDemoEmployees();
    return generateDemoInvoices(custs, prds, emps);
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const sups = generateDemoSuppliers();
    const prds = generateDemoProducts();
    return generateDemoPurchaseOrders(sups, prds);
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => generateExpenses());
  const [tenants, setTenants] = useState<Tenant[]>(() => generateSaaSTenants());
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => generateSupportTickets());
  const [notifications, setNotifications] = useState<Notification[]>(() => generateNotifications());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => generateAuditLogs());

  // Auth & Session States
  const [currentUser, setCurrentUser] = useState<Employee>(() => {
    const emps = generateDemoEmployees();
    return emps[0] || {
      id: 'e-1',
      name: 'Vijay Shekhar',
      email: 'vijay.shekhar@garmentflow.com',
      phone: '7000000000',
      role: 'Admin',
      status: 'Active',
      attendanceRate: 98,
      salary: 85000,
      commissionEarned: 0,
      commissionRate: 0,
      monthlySales: 0,
      salesTarget: 0,
      leavesRemaining: 10
    };
  });
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [quickArticulateItem, setQuickArticulateItem] = useState<any>(null);

  // Navigation
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Role-based sidebar module access helper
  const getAccessibleModules = (role: string) => {
    switch (role) {
      case 'Admin':
        return ['dashboard', 'billing', 'articulation', 'inventory_articulation', 'commissions', 'products', 'inventory', 'purchase', 'customers', 'employees', 'accounting', 'reports', 'saas', 'developer', 'integrations', 'settings'];
      case 'Manager':
        return ['dashboard', 'billing', 'articulation', 'inventory_articulation', 'commissions', 'products', 'inventory', 'purchase', 'customers', 'employees', 'reports', 'settings'];
      case 'Cashier':
        return ['billing', 'customers', 'settings'];
      case 'Salesperson':
        return ['billing', 'articulation', 'inventory_articulation', 'products', 'inventory', 'customers'];
      case 'Tailor':
        return ['articulation', 'inventory_articulation', 'inventory'];
      default:
        return ['billing'];
    }
  };

  // Ensure active module is always one the current user has access to
  React.useEffect(() => {
    const allowed = getAccessibleModules(currentUser.role);
    if (!allowed.includes(activeModule)) {
      setActiveModule(allowed[0] || 'billing');
    }
  }, [currentUser.role, activeModule]);

  // Global Toast System
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; msg: string; type: 'info' | 'warning' | 'success' | 'danger' }>>([]);

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'US';
  };

  const addToastNotification = (title: string, msg: string, type: 'info' | 'warning' | 'success' | 'danger' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, msg, type }]);
    
    // Auto clear toast
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);

    // Also inject into notifications log state
    const newNotif: Notification = {
      id: `not-${Date.now()}`,
      timestamp: 'Just now',
      title,
      message: msg,
      type: type === 'danger' ? 'danger' : (type === 'success' ? 'success' : (type === 'warning' ? 'warning' : 'info')),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Global Handlers
  const handleAddProduct = (prod: Product) => {
    setProducts(prev => [prod, ...prev]);
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeleteProducts = (ids: string[]) => {
    setProducts(prev => prev.filter(p => !ids.includes(p.id)));
  };

  const handleAdjustStock = (productId: string, amount: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.stock + amount);
        let newStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
        if (newStock === 0) newStatus = 'Out of Stock';
        else if (newStock <= p.minStockAlert) newStatus = 'Low Stock';

        return { ...p, stock: newStock, status: newStatus };
      }
      return p;
    }));
  };

  const handleAddInvoice = (inv: Invoice) => {
    setInvoices(prev => [inv, ...prev]);

    // Decrease stocks for sold items
    inv.items.forEach(item => {
      setProducts(prevPrds => prevPrds.map(p => {
        if (p.id === item.productId) {
          const newStock = Math.max(0, p.stock - item.quantity);
          let newStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
          if (newStock === 0) newStatus = 'Out of Stock';
          else if (newStock <= p.minStockAlert) newStatus = 'Low Stock';
          return { ...p, stock: newStock, status: newStatus };
        }
        return p;
      }));
    });

    // Award loyalty points to customer
    setCustomers(prevCusts => prevCusts.map(c => {
      if (c.id === inv.customerId) {
        const earnedPoints = Math.floor(inv.grandTotal * 0.05); // 5% point back
        return { 
          ...c, 
          loyaltyPoints: c.loyaltyPoints + earnedPoints,
          totalSpent: c.totalSpent + inv.grandTotal,
          totalInvoices: c.totalInvoices + 1,
          outstandingBalance: inv.paymentMethod === 'Credit' ? c.outstandingBalance + inv.grandTotal : c.outstandingBalance
        };
      }
      return c;
    }));
  };

  const handleAddPurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => [po, ...prev]);

    // Add stock immediately if fulfilled
    if (po.status === 'Completed') {
      po.items.forEach(item => {
        handleAdjustStock(item.productId, item.quantity);
      });
    }

    // Accumulate supplier outstanding
    const outstandingDebt = po.grandTotal - po.outstandingPaid;
    if (outstandingDebt > 0) {
      setSuppliers(prev => prev.map(s => {
        if (s.id === po.supplierId) {
          return { ...s, outstandingBalance: s.outstandingBalance + outstandingDebt };
        }
        return s;
      }));
    }
  };

  const handleSettleSupplierBalance = (supplierId: string, amount: number) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        return { ...s, outstandingBalance: Math.max(0, s.outstandingBalance - amount) };
      }
      return s;
    }));
  };

  const handleSettleCustomerBalance = (customerId: string, amount: number) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return { ...c, outstandingBalance: Math.max(0, c.outstandingBalance - amount) };
      }
      return c;
    }));
  };

  const handleDisburseCommission = (employeeId: string, amount: number) => {
    setEmployees(prev => prev.map(e => {
      if (e.id === employeeId) {
        return { ...e, commissionEarned: Math.max(0, e.commissionEarned - amount) };
      }
      return e;
    }));
  };

  const handleAddExpense = (exp: Expense) => {
    setExpenses(prev => [exp, ...prev]);
  };

  const handleResolveTicket = (ticketId: string) => {
    setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'Resolved' } : t));
  };

  const handleUpdateCustomerBalance = (customerId: string, amount: number) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return { 
          ...c, 
          outstandingBalance: Math.max(0, c.outstandingBalance + amount) 
        };
      }
      return c;
    }));
  };

  const handleAddCustomer = (newCust: Customer) => {
    setCustomers(prev => [...prev, newCust]);
  };

  const openArticulationWithDefaults = () => {
    setActiveModule('articulation');
    addToastNotification('Tailoring Studio', 'Initialized standard blazer blueprint with default canvas dimensions.', 'info');
  };

  // Distinct employee profile per system role
  const switchableEmployees = ['Admin', 'Manager', 'Cashier', 'Salesperson', 'Tailor'].map(role => 
    (employees || []).find(e => e.role === role)
  ).filter(Boolean) as Employee[];

  // Unread notifications tracker
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Sidebar item profiles
  const modulesList = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'Boutique POS Billing', icon: ShoppingCart },
    { id: 'articulation', label: 'Tailoring & Garments', icon: Scissors },
    { id: 'commissions', label: 'Channel & Staff Commissions', icon: Percent },
    { id: 'products', label: 'Products & Catalogs', icon: Tags },
    { id: 'inventory', label: 'Inventories & Stocks', icon: Warehouse },
    { id: 'inventory_articulation', label: 'Articulation Window', icon: TableProperties },
    { id: 'purchase', label: 'Procurements & POs', icon: FileText },
    { id: 'customers', label: 'CRM & Customer Loyalty', icon: Users },
    { id: 'employees', label: 'HR Payroll & rosters', icon: Users2 },
    { id: 'accounting', label: 'General Ledger Profit', icon: Receipt },
    { id: 'reports', label: 'Advanced Report Hub', icon: TrendingUp },
    { id: 'saas', label: 'SaaS Multi-Tenants', icon: Building2 },
    { id: 'developer', label: 'Developer Gate APIs', icon: Terminal },
    { id: 'integrations', label: 'Channel connectors', icon: Globe },
    { id: 'settings', label: 'System Configurations', icon: Settings },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white" id="threadflow-login-root">
        {/* Background visual decorations */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 p-8 rounded-3xl shadow-2xl max-w-lg w-full relative overflow-hidden space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex w-11 h-11 rounded-2xl bg-indigo-600 items-center justify-center font-black text-white text-lg tracking-tighter mx-auto shadow-lg shadow-indigo-600/20">
              TF
            </div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase font-sans">Threadflow SaaS Portal</h1>
            <p className="text-xs text-slate-400 font-medium">Securely sign in or hot-swap operational employee profiles below.</p>
          </div>

          {/* Employee Directory Hot Swap */}
          <div className="space-y-3 p-4 rounded-2xl border border-slate-700/40 bg-slate-900/40">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Operational Staff Hot-Swap Profiles</span>
            <div className="grid grid-cols-1 gap-2">
              {switchableEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => {
                    setCurrentUser(emp);
                    setIsLoggedIn(true);
                    addToastNotification('Auth Success', `Authenticated securely as ${emp.name} (${emp.role})`, 'success');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-700/80 border border-slate-700/50 hover:border-indigo-500/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {getUserInitials(emp.name)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-100">{emp.name}</p>
                      <p className="text-[9px] text-slate-400 font-medium">{emp.email}</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-900 text-indigo-400 font-bold uppercase tracking-wider group-hover:bg-indigo-600/10 group-hover:text-indigo-300 transition-all font-mono">
                    {emp.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-700/40"></div>
            <span className="flex-shrink mx-3 text-[9px] text-slate-500 uppercase tracking-widest font-extrabold">or use credentials</span>
            <div className="flex-grow border-t border-slate-700/40"></div>
          </div>

          {/* Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setIsLoggedIn(true);
              addToastNotification('Session Initiated', 'Authenticated via standard user token.', 'success');
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Email address</label>
              <input 
                type="email" 
                defaultValue={currentUser.email} 
                required 
                className="w-full text-xs bg-slate-900 border border-slate-700/50 rounded-xl px-4.5 py-3 text-slate-100 focus:outline-none focus:border-indigo-500" 
                placeholder="name@garmentflow.com" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Secure Access PIN / Password</label>
              <input 
                type="password" 
                defaultValue="••••••••" 
                required 
                className="w-full text-xs bg-slate-900 border border-slate-700/50 rounded-xl px-4.5 py-3 text-slate-100 focus:outline-none focus:border-indigo-500" 
                placeholder="Enter password" 
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer text-center uppercase tracking-wider"
            >
              Authorise & Enter Portal
            </button>
          </form>

          {/* Footer branding */}
          <p className="text-[10px] text-slate-500 text-center font-mono font-medium">
            Threadflow Corp • Encryption AES-256 Enabled
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans" id="threadflow-saas-root">
      
      {/* Toast Overlay */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`p-4 rounded-xl shadow-xl border flex items-start gap-2.5 animate-scale-up text-xs font-semibold bg-white ${
              t.type === 'success' ? 'border-emerald-200 text-emerald-800' :
              t.type === 'danger' ? 'border-red-200 text-red-800' :
              t.type === 'warning' ? 'border-amber-200 text-amber-800' : 'border-slate-200 text-slate-700'
            }`}
          >
            <div className="space-y-1">
              <p className="font-bold uppercase tracking-wide text-[10px]">{t.title}</p>
              <p className="font-medium text-slate-500 leading-relaxed">{t.msg}</p>
            </div>
          </div>
        ))}
      </div>

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside 
        className={`bg-white text-slate-600 border-r border-slate-200 shrink-0 h-screen sticky top-0 flex flex-col justify-between transition-all duration-300 z-30 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="overflow-y-auto flex-1 py-4 px-3 space-y-6">
          {/* Brand header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm font-sans tracking-tight">
                  T
                </div>
                <div>
                  <h1 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase">Threadflow</h1>
                  <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest block">v1.2 SaaS PRO</span>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/60 cursor-pointer mx-auto"
            >
              <ChevronsLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {!sidebarCollapsed && (
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block pl-2 mb-2">OPERATIONS DIRECTORY</span>
            )}

            {modulesList.filter(mod => getAccessibleModules(currentUser.role).includes(mod.id)).map(mod => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    setActiveModule(mod.id);
                    addToastNotification('Scope Switcher', `Opened ${mod.label} sub-system portal.`, 'info');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={mod.label}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {!sidebarCollapsed && <span className="truncate">{mod.label}</span>}
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
                  <p className="font-bold text-slate-800 leading-tight truncate">{currentUser.name}</p>
                  <p className="text-indigo-600 font-semibold uppercase font-mono tracking-wider text-[8px] truncate">{currentUser.role} • Active</p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button 
                onClick={() => {
                  setIsLoggedIn(false);
                  addToastNotification('Auth Service', 'Multi-tenant session terminated.', 'warning');
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
              <label className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Swap System Role</label>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const selectedEmp = employees.find(emp => emp.id === e.target.value);
                  if (selectedEmp) {
                    setCurrentUser(selectedEmp);
                    addToastNotification('Role Swapped', `Session context switched to ${selectedEmp.name} (${selectedEmp.role})`, 'success');
                  }
                }}
                className="w-full text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {switchableEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.role}: {emp.name.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAVBAR */}
        <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-slate-800 capitalize">
              {modulesList.find(m => m.id === activeModule)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick System Clock */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] font-mono text-slate-500 font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>June 28, 2026 | 22:15 UTC</span>
            </div>

            {/* Notifications Alert with unread badges */}
            <div className="relative">
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
                    <span className="font-bold text-slate-700 uppercase tracking-wide">Live Stream Alerts</span>
                    <button 
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} 
                      className="text-[9px] text-indigo-600 hover:underline font-bold"
                    >
                      Mark All Read
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {notifications.slice(0, 5).map(n => (
                      <div key={n.id} className={`p-2.5 rounded-lg border text-[11px] ${n.read ? 'bg-slate-50/50 border-slate-100 text-slate-500' : 'bg-indigo-50/30 border-indigo-50 text-slate-700'}`}>
                        <div className="flex justify-between font-bold text-[10px]">
                          <span>{n.title}</span>
                          <span className="text-[8px] text-slate-400 font-mono font-normal">{n.timestamp}</span>
                        </div>
                        <p className="mt-0.5 leading-relaxed font-semibold">{n.message}</p>
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
                    <p className="font-bold text-slate-800">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] bg-indigo-50 text-indigo-700 font-bold uppercase tracking-wider">{currentUser.role}</span>
                  </div>
                  
                  {/* Role Quick Switcher inside dropdown */}
                  <div className="p-1.5 border-b border-slate-100 space-y-1">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider px-1">Quick Switch Context</p>
                    {switchableEmployees.map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setCurrentUser(emp);
                          addToastNotification('Role Swapped', `Session context switched to ${emp.name} (${emp.role})`, 'success');
                          setShowProfileDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between text-left p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-[10px] font-semibold ${currentUser.id === emp.id ? 'bg-indigo-50/50 text-indigo-700 font-bold' : 'text-slate-600'}`}
                      >
                        <span className="truncate">{emp.name}</span>
                        <span className="text-[8px] px-1 py-0.5 bg-slate-100 rounded text-slate-500 uppercase font-bold">{emp.role}</span>
                      </button>
                    ))}
                  </div>

                  <button onClick={() => { setActiveModule('settings'); setShowProfileDropdown(false); }} className="w-full text-left p-2 hover:bg-slate-50 rounded-lg font-semibold cursor-pointer">System Configuration</button>
                  <button onClick={() => { setIsLoggedIn(false); addToastNotification('Auth Service', 'Multi-tenant session terminated successfully.', 'warning'); setShowProfileDropdown(false); }} className="w-full text-left p-2 text-red-600 hover:bg-red-50 rounded-lg font-bold cursor-pointer">Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* SCROLLABLE VIEW PORT */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeModule === 'dashboard' && (
            <DashboardView 
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

          {activeModule === 'billing' && (
            <BillingPOSView 
              products={products} 
              customers={customers} 
              employees={employees}
              invoices={invoices}
              onAddInvoice={handleAddInvoice} 
              onAddCustomer={handleAddCustomer}
              onUpdateCustomerBalance={handleUpdateCustomerBalance}
              onAddNotification={addToastNotification} 
              quickArticulateItem={quickArticulateItem}
              clearQuickArticulateItem={() => setQuickArticulateItem(null)}
            />
          )}

          {activeModule === 'articulation' && (
            <ArticulationView 
              onAddCustomToCart={(customItem) => {
                setQuickArticulateItem(customItem);
                setActiveModule('billing');
              }}
              onAddNotification={addToastNotification} 
            />
          )}

          {activeModule === 'commissions' && (
            <CommissionView 
              employees={employees} 
              invoices={invoices}
              onAddNotification={addToastNotification} 
            />
          )}

          {activeModule === 'products' && (
            <ProductManagementView 
              products={products} 
              onAddProduct={handleAddProduct} 
              onUpdateProduct={handleUpdateProduct} 
              onDeleteProducts={handleDeleteProducts} 
              onAddNotification={addToastNotification} 
            />
          )}

          {activeModule === 'inventory' && (
            <InventoryView 
              products={products} 
              onAdjustStock={handleAdjustStock} 
              onAddNotification={addToastNotification} 
            />
          )}

          {activeModule === 'inventory_articulation' && (
            <InventoryArticulationWindow 
              products={products}
              setProducts={setProducts}
              suppliers={suppliers}
              setSuppliers={setSuppliers}
              purchaseOrders={purchaseOrders}
              setPurchaseOrders={setPurchaseOrders}
              invoices={invoices}
              setInvoices={setInvoices}
              onAdjustStock={handleAdjustStock}
              onAddNotification={addToastNotification}
            />
          )}

          {activeModule === 'purchase' && (
            <PurchaseView 
              purchaseOrders={purchaseOrders} 
              suppliers={suppliers} 
              setSuppliers={setSuppliers}
              products={products} 
              setProducts={setProducts}
              onAddPurchaseOrder={handleAddPurchaseOrder} 
              onSettleSupplierBalance={handleSettleSupplierBalance} 
              onAddNotification={addToastNotification} 
            />
          )}

          {activeModule === 'customers' && (
            <CustomersView 
              customers={customers} 
              onSettleCustomerBalance={handleSettleCustomerBalance} 
              onAddNotification={addToastNotification} 
            />
          )}

          {activeModule === 'employees' && (
            <EmployeeView 
              employees={employees} 
              setEmployees={setEmployees}
              onDisburseCommission={handleDisburseCommission} 
              onAddNotification={addToastNotification} 
            />
          )}

          {activeModule === 'accounting' && (
            <AccountingView 
              expenses={expenses} 
              invoices={invoices} 
              onAddExpense={handleAddExpense} 
              onAddNotification={addToastNotification} 
            />
          )}

          {activeModule === 'reports' && (
            <ReportsView 
              invoices={invoices} 
              purchaseOrders={purchaseOrders} 
              products={products} 
              onAddNotification={addToastNotification} 
            />
          )}

          {activeModule === 'saas' && (
            <SaaSPanelView 
              tenants={tenants} 
              supportTickets={supportTickets} 
              onResolveTicket={handleResolveTicket} 
              onAddNotification={addToastNotification} 
            />
          )}

          {activeModule === 'developer' && (
            <DeveloperPortalView 
              onAddNotification={addToastNotification} 
            />
          )}

          {activeModule === 'integrations' && (
            <IntegrationsView 
              onAddNotification={addToastNotification} 
            />
          )}

          {activeModule === 'settings' && (
            <SettingsView 
              onAddNotification={addToastNotification} 
            />
          )}
        </main>
      </div>
    </div>
  );
}

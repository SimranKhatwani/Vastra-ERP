import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import {
  LayoutDashboard,
  Layers,
  Clock,
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  PhoneCall,
  MessageSquare,
  Users,
  UserCheck,
  UserX,
  Scissors,
  Package,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  PieChart,
  ShieldAlert,
  Check,
  Truck,
  Timer,
  ChevronRight,
  Star,
  Download,
  Undo2,
  ExternalLink,
  ChevronDown,
  Phone,
  Send,
  Building2,
  Briefcase,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function SummaryDashboardView({ currentUser, onAddNotification }) {
  // Navigation View State: 'summary' | 'operations' | 'salesman' | 'customer' | 'management'
  const [currentView, setCurrentView] = useState('summary');

  // Timeframe and date filter state
  const [timeframe, setTimeframe] = useState('all'); // 'today' | 'week' | 'month' | 'custom' | 'all'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Overview Data State
  const [overviewData, setOverviewData] = useState(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState(null);

  // Operations View State
  const [operationsData, setOperationsData] = useState(null);
  const [isLoadingOperations, setIsLoadingOperations] = useState(false);
  const [opServiceFilter, setOpServiceFilter] = useState('ALL');
  const [opStatusFilter, setOpStatusFilter] = useState('ALL');
  const [opTailorFilter, setOpTailorFilter] = useState('ALL');
  const [opDelayFilter, setOpDelayFilter] = useState('ALL');
  const [opSearchTerm, setOpSearchTerm] = useState('');

  // Salesman View State
  const [salesmanData, setSalesmanData] = useState(null);
  const [isLoadingSalesman, setIsLoadingSalesman] = useState(false);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState('ALL');
  const [salesmanFollowUpTab, setSalesmanFollowUpTab] = useState('toCall'); // 'toCall' | 'ready' | 'overdue' | 'uncollected'
  const [salesmanSearchTerm, setSalesmanSearchTerm] = useState('');

  // Customer View State
  const [customerData, setCustomerData] = useState(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [customerViewTab, setCustomerViewTab] = useState('profile'); // 'profile' | 'directory'
  const [customerCommTypeFilter, setCustomerCommTypeFilter] = useState('ALL');
  const [customerCommStatusFilter, setCustomerCommStatusFilter] = useState('ALL');

  // Management View State
  const [managementData, setManagementData] = useState(null);
  const [isLoadingManagement, setIsLoadingManagement] = useState(false);
  const [specializedServiceFilter, setSpecializedServiceFilter] = useState('ALL');

  // ==================== API FETCHERS ====================

  // 1. Fetch Overview Data
  const fetchOverview = useCallback(async () => {
    setIsLoadingOverview(true);
    setOverviewError(null);
    try {
      const params = { timeframe };
      if (timeframe === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      const res = await api.get('/summary-dashboard/overview', { params });
      if (res.data && res.data.data) {
        setOverviewData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load summary dashboard overview:', err);
      setOverviewError(err.response?.data?.message || err.message || 'Failed to load dashboard overview data.');
    } finally {
      setIsLoadingOverview(false);
    }
  }, [timeframe, customStartDate, customEndDate]);

  // 2. Fetch Operations Data
  const fetchOperations = useCallback(async () => {
    setIsLoadingOperations(true);
    try {
      const params = {
        timeframe,
        serviceFilter: opServiceFilter,
        statusFilter: opStatusFilter,
        tailorFilter: opTailorFilter,
        delayFilter: opDelayFilter
      };
      if (timeframe === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      const res = await api.get('/summary-dashboard/operations', { params });
      if (res.data && res.data.data) {
        setOperationsData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load operations dashboard:', err);
      onAddNotification?.('Error', 'Failed to load operations data.', 'danger');
    } finally {
      setIsLoadingOperations(false);
    }
  }, [timeframe, customStartDate, customEndDate, opServiceFilter, opStatusFilter, opTailorFilter, opDelayFilter, onAddNotification]);

  // 3. Fetch Salesman Data
  const fetchSalesman = useCallback(async () => {
    setIsLoadingSalesman(true);
    try {
      const params = {
        salesmanId: selectedSalesmanId,
        timeframe
      };
      if (timeframe === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      const res = await api.get('/summary-dashboard/salesman', { params });
      if (res.data && res.data.data) {
        setSalesmanData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load salesman dashboard:', err);
      onAddNotification?.('Error', 'Failed to load salesman data.', 'danger');
    } finally {
      setIsLoadingSalesman(false);
    }
  }, [selectedSalesmanId, timeframe, customStartDate, customEndDate, onAddNotification]);

  // 4. Fetch Customer Data
  const fetchCustomer = useCallback(async (searchQuery = '', customerId = '') => {
    setIsLoadingCustomer(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (customerId) params.customerId = customerId;
      const res = await api.get('/summary-dashboard/customer', { params });
      if (res.data && res.data.data) {
        setCustomerData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load customer dashboard:', err);
      onAddNotification?.('Error', 'Failed to load customer service history.', 'danger');
    } finally {
      setIsLoadingCustomer(false);
    }
  }, [onAddNotification]);

  // 5. Fetch Management Data
  const fetchManagement = useCallback(async () => {
    setIsLoadingManagement(true);
    try {
      const params = { timeframe };
      if (timeframe === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      const res = await api.get('/summary-dashboard/management', { params });
      if (res.data && res.data.data) {
        setManagementData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load management dashboard:', err);
      onAddNotification?.('Error', 'Failed to load management analytics.', 'danger');
    } finally {
      setIsLoadingManagement(false);
    }
  }, [timeframe, customStartDate, customEndDate, onAddNotification]);

  // Initial and view-switch trigger
  useEffect(() => {
    if (currentView === 'summary') {
      fetchOverview();
    } else if (currentView === 'operations') {
      fetchOperations();
    } else if (currentView === 'salesman') {
      fetchSalesman();
    } else if (currentView === 'customer') {
      fetchCustomer(customerSearchInput);
    } else if (currentView === 'management') {
      fetchManagement();
    }
  }, [currentView, fetchOverview, fetchOperations, fetchSalesman, fetchCustomer, fetchManagement]);

  // Handle Absent Salesman Toggle
  const handleToggleAbsent = async (salesmanId, currentStatus, salesmanName) => {
    try {
      const nextStatus = !currentStatus;
      const res = await api.post('/summary-dashboard/salesman/absent-toggle', {
        salesmanId,
        isAbsent: nextStatus,
        delegatedRole: 'Counter Salesman'
      });
      if (res.data && res.data.success) {
        onAddNotification?.(
          nextStatus ? 'Salesman Absent' : 'Salesman Present',
          nextStatus
            ? `${salesmanName} marked absent. Pending jobs temporarily delegated to Counter Salesman.`
            : `${salesmanName} returned. Active ownership restored.`,
          'info'
        );
        fetchSalesman();
      }
    } catch (err) {
      onAddNotification?.('Update Failed', err.response?.data?.message || err.message, 'danger');
    }
  };

  // Reusable Timeframe Selector Component
  const renderTimeframeSelector = (onRefresh, isLoading, activeColorClass = 'text-indigo-600') => (
    <div className="flex flex-wrap items-center gap-2">
      <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 shadow-2xs">
        {['today', 'week', 'month', 'all'].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
              timeframe === tf ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tf === 'all' ? 'All Time' : tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'Today'}
          </button>
        ))}
        <button
          onClick={() => setTimeframe('custom')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
            timeframe === 'custom' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Custom Range
        </button>
      </div>

      {timeframe === 'custom' && (
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs animate-fade-in">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:outline-none"
          />
          <span className="text-slate-400 font-bold">to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:outline-none"
          />
        </div>
      )}

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? `animate-spin ${activeColorClass}` : ''}`} />
        </button>
      )}
    </div>
  );

  // ==================== SUB-VIEWS RENDERERS ====================

  // -------------------------------------------------------------
  // A. MAIN SUMMARY DASHBOARD HOMEPAGE
  // -------------------------------------------------------------
  const renderSummaryOverview = () => {
    const kpis = overviewData?.kpis || {
      totalPendingServices: 0,
      todayNewEntries: 0,
      readyForDelivery: 0,
      deliveredToday: 0,
      overdueServices: 0,
      urgentDeliveries: 0,
      reAlterPending: 0,
      partialCollectionPending: 0
    };

    const cards = overviewData?.cards;

    return (
      <div className="space-y-7 animate-fade-in">
        {/* Top Header & Date Filter Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Summary Dashboard</h2>
                  {isLoadingOverview && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Loading live metrics...
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-400">
                  Consolidated post-sales services, operations, salesperson ownership & management control hub
                </p>
              </div>
            </div>
          </div>

          {/* Timeframe selector controls */}
          {renderTimeframeSelector(fetchOverview, isLoadingOverview, 'text-indigo-600')}
        </div>

        {/* Loading State when no data yet */}
        {isLoadingOverview && !overviewData ? (
          <div className="space-y-6 animate-fade-in">
            {/* Animated Loading Header Banner */}
            <div className="bg-white rounded-2xl border border-indigo-100/80 p-8 shadow-xs flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Loading Summary Dashboard Data...</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Consolidating real-time post-sales services, alteration workload & control metrics
                </p>
              </div>
            </div>

            {/* Shimmering KPI Skeletons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: "Total Pending", color: "border-indigo-100" },
                { title: "Today's Inward", color: "border-teal-100" },
                { title: "Ready for Delivery", color: "border-emerald-100" },
                { title: "Delivered Today", color: "border-blue-100" },
                { title: "Overdue Alerts", color: "border-rose-100" },
                { title: "Urgent Deliveries", color: "border-amber-100" },
                { title: "Re-Alter Pending", color: "border-purple-100" },
                { title: "Partial Collections", color: "border-cyan-100" }
              ].map((item, n) => (
                <div key={n} className={`bg-white p-5 rounded-2xl border ${item.color} shadow-xs space-y-3 animate-pulse`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.title}</span>
                    <div className="w-7 h-7 bg-slate-100 rounded-xl"></div>
                  </div>
                  <div className="h-8 bg-slate-200/80 rounded-lg w-20"></div>
                  <div className="h-3 bg-slate-100 rounded w-32"></div>
                </div>
              ))}
            </div>

            {/* Skeletons for Control Center Cards */}
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-36"></div>
                        <div className="h-2.5 bg-slate-100 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-slate-100 rounded w-full"></div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {[1, 2, 3, 4].map((m) => (
                        <div key={m} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                          <div className="h-2.5 bg-slate-200 rounded w-16"></div>
                          <div className="h-5 bg-slate-200 rounded w-10"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {overviewError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 text-red-700 text-xs font-semibold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{overviewError}</span>
                </div>
                <button
                  onClick={fetchOverview}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Overall High-Level KPI Summary Grid (8 Metrics) */}
            <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 transition-opacity ${isLoadingOverview ? 'opacity-60' : 'opacity-100'}`}>
              {/* 1. Total Pending Services */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2 hover:border-indigo-200 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pending</span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Scissors className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{kpis.totalPendingServices}</p>
                <span className="text-[10px] text-slate-400 font-semibold block">Across all floor services</span>
              </div>

              {/* 2. Today's New Entries */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2 hover:border-teal-200 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Inward</span>
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-teal-700 tracking-tight">+{kpis.todayNewEntries}</p>
                <span className="text-[10px] text-teal-600 font-semibold block">New service bookings today</span>
              </div>

              {/* 3. Ready for Delivery */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2 hover:border-emerald-200 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ready for Delivery</span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-700 tracking-tight">{kpis.readyForDelivery}</p>
                <span className="text-[10px] text-emerald-600 font-semibold block">Awaiting customer collection</span>
              </div>

              {/* 4. Delivered Today */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2 hover:border-blue-200 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivered Today</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-blue-700 tracking-tight">{kpis.deliveredToday}</p>
                <span className="text-[10px] text-blue-600 font-semibold block">Completed handovers today</span>
              </div>

              {/* 5. Overdue Services */}
              <div className={`p-5 rounded-2xl border shadow-xs space-y-2 transition-all ${
                kpis.overdueServices > 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-100'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Overdue Alerts</span>
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-rose-700 tracking-tight">{kpis.overdueServices}</p>
                <span className="text-[10px] text-rose-600 font-semibold block">Past target delivery timeline</span>
              </div>

              {/* 6. Urgent Deliveries */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2 hover:border-amber-200 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Urgent Deliveries</span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Timer className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-amber-700 tracking-tight">{kpis.urgentDeliveries}</p>
                <span className="text-[10px] text-amber-600 font-semibold block">Store waiting / Express priority</span>
              </div>

              {/* 7. Re-Alter Pending */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2 hover:border-purple-200 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Re-Alter Pending</span>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-purple-700 tracking-tight">{kpis.reAlterPending}</p>
                <span className="text-[10px] text-purple-600 font-semibold block">Secondary fitting adjustments</span>
              </div>

              {/* 8. Partial Collection Pending */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2 hover:border-cyan-200 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider">Partial Collections</span>
                  <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-cyan-700 tracking-tight">{kpis.partialCollectionPending}</p>
                <span className="text-[10px] text-cyan-600 font-semibold block">Split item deliveries pending</span>
              </div>
            </div>

        {/* Operational Health Strip */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-indigo-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-200">Floor Operations Health</h4>
              <p className="text-xs text-slate-300 font-medium">
                {kpis.overdueServices === 0
                  ? 'All alteration and tailoring services are on schedule with zero delayed items.'
                  : `Attention required: ${kpis.overdueServices} jobs require immediate floor prioritization.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-indigo-500/30 text-indigo-200 px-3 py-1.5 rounded-xl border border-indigo-400/30 font-mono font-bold">
              {kpis.readyForDelivery} Ready Items
            </span>
            <button
              onClick={() => setCurrentView('operations')}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Quick Dispatch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* FOUR DETAILED DASHBOARD ENTRY CARDS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Control Center Dashboards
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">Select a specialized view below</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* CARD 1: OPERATIONS DASHBOARD */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all p-6 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform">
                      <Scissors className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-800">Operations Dashboard</h4>
                      <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">
                        Floor & Tailoring Workshop
                      </span>
                    </div>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-100">
                    Live Workshop
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Complete tracking of service-wise pending work, master tailor and vendor workloads, floor capacity alarms, and delivery timelines.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Pending Services</span>
                    <span className="text-lg font-black text-slate-800">{kpis.totalPendingServices}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Ready for Delivery</span>
                    <span className="text-lg font-black text-emerald-600">{kpis.readyForDelivery}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Urgent Jobs</span>
                    <span className="text-lg font-black text-amber-600">{kpis.urgentDeliveries}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Overdue Items</span>
                    <span className={`text-lg font-black ${kpis.overdueServices > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {kpis.overdueServices}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Service breakdown & workshop loads</span>
                <button
                  onClick={() => setCurrentView('operations')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>View Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CARD 2: SALESMAN DASHBOARD */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-teal-200 transition-all p-6 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-105 transition-transform">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-800">Salesman Dashboard</h4>
                      <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider block">
                        Ownership & Client Follow-up
                      </span>
                    </div>
                  </div>
                  <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-teal-100">
                    Staff Follow-ups
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Individual salesperson post-sales responsibility, daily customer call lists, absent salesman temporary delegation and handover workflows.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned Services</span>
                    <span className="text-lg font-black text-slate-800">{cards?.salesman?.kpi1?.value || kpis.totalPendingServices}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Customers to Call</span>
                    <span className="text-lg font-black text-teal-700">{kpis.readyForDelivery}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Re-Alter Cases</span>
                    <span className="text-lg font-black text-purple-600">{kpis.reAlterPending}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Absent Salesmen</span>
                    <span className="text-lg font-black text-slate-800">Active Handover</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Track daily client call reminders</span>
                <button
                  onClick={() => setCurrentView('salesman')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>View Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CARD 3: CUSTOMER DASHBOARD */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all p-6 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-800">Customer Dashboard</h4>
                      <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">
                        Customer Service & Communications
                      </span>
                    </div>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100">
                    WhatsApp & SMS
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Search customer service history, WhatsApp booking and ready notification timelines, collection audits, and lifetime alterations taken.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Active Clients</span>
                    <span className="text-lg font-black text-slate-800">{cards?.customer?.kpi1?.value || '24'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Ready for Pickup</span>
                    <span className="text-lg font-black text-emerald-600">{kpis.readyForDelivery}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Split Pickups</span>
                    <span className="text-lg font-black text-cyan-600">{kpis.partialCollectionPending}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Home Delivery</span>
                    <span className="text-lg font-black text-slate-800">{kpis.homeDeliveryPending || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Direct WhatsApp messaging hub</span>
                <button
                  onClick={() => setCurrentView('customer')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>View Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CARD 4: MANAGEMENT DASHBOARD */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-purple-200 transition-all p-6 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-105 transition-transform">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-800">Management Dashboard</h4>
                      <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block">
                        Executive BI & Performance
                      </span>
                    </div>
                  </div>
                  <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-purple-100">
                    Business Analytics
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Turnaround velocity, master tailor quality ratings, vendor cost & turnaround comparisons, and alteration-prone garment catalogs.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Completion Rate</span>
                    <span className="text-lg font-black text-emerald-600">{cards?.management?.kpi1?.value || '96%'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Avg Turnaround</span>
                    <span className="text-lg font-black text-slate-800">{cards?.management?.kpi2?.value || '1.6 Days'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Top Service</span>
                    <span className="text-sm font-black text-purple-700 truncate block">Alteration</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Rework Rate</span>
                    <span className="text-lg font-black text-slate-800">{cards?.management?.kpi4?.value || '2.8%'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Deep analysis of workshop efficiency</span>
                <button
                  onClick={() => setCurrentView('management')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>View Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
);
};

  // -------------------------------------------------------------
  // B. OPERATIONS DASHBOARD VIEW
  // -------------------------------------------------------------
  const renderOperationsDashboard = () => {
    const kpis = operationsData?.kpis || {
      totalPendingServices: 0,
      todayNewEntries: 0,
      readyForDelivery: 0,
      deliveredToday: 0,
      overdueServices: 0,
      urgentDeliveries: 0,
      reAlterPending: 0,
      partialCollectionPending: 0,
      homeDeliveryPending: 0,
      averageCompletionTime: '24.0 hrs'
    };

    const serviceWise = operationsData?.serviceWisePending || [];
    const workloads = operationsData?.tailorVendorWorkload || [];
    const deliveries = operationsData?.deliveryDashboard || {};
    const alerts = operationsData?.delayAlerts || {};
    const jobs = operationsData?.jobs || [];

    const filteredJobs = jobs.filter((j) => {
      if (!opSearchTerm) return true;
      const term = opSearchTerm.toLowerCase();
      return (
        j.pssmNo?.toLowerCase().includes(term) ||
        j.billNo?.toLowerCase().includes(term) ||
        j.customerName?.toLowerCase().includes(term) ||
        j.productName?.toLowerCase().includes(term) ||
        j.barcode?.toLowerCase().includes(term)
      );
    });

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Navigation Breadcrumb & Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => setCurrentView('summary')}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 font-bold text-xs transition-colors cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Back to Summary Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
                Operations & Workshop Dashboard
              </h3>
              <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-indigo-200">
                Floor Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {renderTimeframeSelector(fetchOperations, isLoadingOperations, 'text-indigo-600')}
          </div>
        </div>

        {/* Loading State when no data yet */}
        {isLoadingOperations && !operationsData ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl border border-indigo-100/80 p-8 shadow-xs flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Loading Operations & Workshop Data...</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Fetching live service queues, workshop loads, capacity metrics & floor jobs
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <div key={n} className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-2 animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-16"></div>
                  <div className="h-6 bg-slate-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Section A: Operations KPI Cards (10 Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Pending</span>
            <p className="text-xl font-black text-slate-800">{kpis.totalPendingServices}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-teal-600 uppercase">Today's Inward</span>
            <p className="text-xl font-black text-teal-700">+{kpis.todayNewEntries}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Ready for Pickup</span>
            <p className="text-xl font-black text-emerald-700">{kpis.readyForDelivery}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Delivered Today</span>
            <p className="text-xl font-black text-blue-700">{kpis.deliveredToday}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-rose-600 uppercase">Overdue Services</span>
            <p className="text-xl font-black text-rose-700">{kpis.overdueServices}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-amber-600 uppercase">Urgent Deliveries</span>
            <p className="text-xl font-black text-amber-700">{kpis.urgentDeliveries}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-purple-600 uppercase">Re-Alter Pending</span>
            <p className="text-xl font-black text-purple-700">{kpis.reAlterPending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-cyan-600 uppercase">Partial Collection</span>
            <p className="text-xl font-black text-cyan-700">{kpis.partialCollectionPending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase">Home Deliveries</span>
            <p className="text-xl font-black text-indigo-700">{kpis.homeDeliveryPending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Avg Turnaround</span>
            <p className="text-xl font-black text-slate-800">{kpis.averageCompletionTime}</p>
          </div>
        </div>

        {/* Section E: Delay Alerts Clickable Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Delay & Priority Alerts (Click badge to filter floor jobs)</span>
            </h4>
            {opDelayFilter !== 'ALL' && (
              <button
                onClick={() => setOpDelayFilter('ALL')}
                className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setOpDelayFilter(opDelayFilter === 'DATE_CROSSED' ? 'ALL' : 'DATE_CROSSED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                opDelayFilter === 'DATE_CROSSED'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span>Delivery Date Crossed</span>
              <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${
                opDelayFilter === 'DATE_CROSSED' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-800'
              }`}>
                {alerts.dateCrossed || 0}
              </span>
            </button>

            <button
              onClick={() => setOpDelayFilter(opDelayFilter === 'URGENT' ? 'ALL' : 'URGENT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                opDelayFilter === 'URGENT'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span>Urgent Store Waiting</span>
              <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${
                opDelayFilter === 'URGENT' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-800'
              }`}>
                {alerts.urgentItems || 0}
              </span>
            </button>

            <button
              onClick={() => setOpDelayFilter(opDelayFilter === 'VIP' ? 'ALL' : 'VIP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                opDelayFilter === 'VIP'
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <span>VIP Client Delay</span>
              <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${
                opDelayFilter === 'VIP' ? 'bg-white/20 text-white' : 'bg-purple-200 text-purple-800'
              }`}>
                {alerts.vipDelay || 0}
              </span>
            </button>

            <button
              onClick={() => setOpDelayFilter(opDelayFilter === 'VENDOR' ? 'ALL' : 'VENDOR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                opDelayFilter === 'VENDOR'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <span>Outsourced Vendor Delay</span>
              <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${
                opDelayFilter === 'VENDOR' ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-800'
              }`}>
                {alerts.vendorDelay || 0}
              </span>
            </button>
          </div>
        </div>

        {/* Section B & D: Two-Column Section: Service-Wise Pending & Delivery Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Section B: Service-Wise Pending */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Service-Wise Pending Breakdown
              </h4>
              <span className="text-[10px] text-slate-400 font-bold uppercase">8 Standard Categories</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-2">Service Type</th>
                    <th className="pb-2 text-center">Pending</th>
                    <th className="pb-2 text-center">In Progress</th>
                    <th className="pb-2 text-center">Ready</th>
                    <th className="pb-2 text-center">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                  {serviceWise.map((s) => (
                    <tr key={s.service} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span>{s.service}</span>
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold text-slate-700">{s.pending}</td>
                      <td className="py-2.5 text-center font-mono font-bold text-amber-600">{s.inProgress}</td>
                      <td className="py-2.5 text-center font-mono font-bold text-emerald-600">{s.ready}</td>
                      <td className={`py-2.5 text-center font-mono font-bold ${s.overdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {s.overdue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section D: Delivery Dashboard */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Delivery Schedule & Dispatch Dashboard
              </h4>
              <span className="text-[10px] text-emerald-600 font-bold uppercase">Counter Logistics</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Ready for Collection</span>
                <p className="text-xl font-black text-emerald-800">{deliveries.readyForCollection || 0}</p>
              </div>

              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Today's Delivery</span>
                <p className="text-xl font-black text-blue-800">{deliveries.todayDelivery || 0}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-600 uppercase">Tomorrow Delivery</span>
                <p className="text-xl font-black text-slate-800">{deliveries.tomorrowDelivery || 0}</p>
              </div>

              <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-100 space-y-1">
                <span className="text-[10px] font-bold text-rose-700 uppercase">Overdue Delivery</span>
                <p className="text-xl font-black text-rose-800">{deliveries.overdueDelivery || 0}</p>
              </div>

              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100 space-y-1">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Customer Waiting</span>
                <p className="text-xl font-black text-amber-800">{deliveries.customerWaitingInStore || 0}</p>
              </div>

              <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 space-y-1">
                <span className="text-[10px] font-bold text-indigo-700 uppercase">Home Delivery</span>
                <p className="text-xl font-black text-indigo-800">{deliveries.homeDeliveryPending || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section C: Tailor / Vendor Workload Table & Capacity Warnings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Tailor & Vendor Workload Balancing
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">
                Live capacity utilization rates (Alarms trigger if load exceeds 90%)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Workshop / Staff / Vendor</th>
                  <th className="pb-2 text-center">Assigned</th>
                  <th className="pb-2 text-center">In Progress</th>
                  <th className="pb-2 text-center">Ready</th>
                  <th className="pb-2 text-center">Delivered</th>
                  <th className="pb-2 text-center">Overdue</th>
                  <th className="pb-2 text-center">Today's New</th>
                  <th className="pb-2">Capacity Load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {workloads.map((w) => (
                  <tr key={w.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 font-bold text-slate-800">
                      <span>{w.name}</span>
                      {w.isOverCapacity && (
                        <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-extrabold rounded-full animate-pulse">
                          OVERLOAD &gt; 90%
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-center font-mono font-bold text-slate-700">{w.assigned}</td>
                    <td className="py-2.5 text-center font-mono font-bold text-amber-600">{w.inProgress}</td>
                    <td className="py-2.5 text-center font-mono font-bold text-emerald-600">{w.ready}</td>
                    <td className="py-2.5 text-center font-mono font-bold text-blue-600">{w.delivered}</td>
                    <td className={`py-2.5 text-center font-mono font-bold ${w.overdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {w.overdue}
                    </td>
                    <td className="py-2.5 text-center font-mono font-bold text-teal-600">+{w.todayNew}</td>
                    <td className="py-2.5 w-48">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className={w.isOverCapacity ? 'text-red-600' : 'text-slate-600'}>
                            {w.capacityUtilization}%
                          </span>
                          <span className="text-slate-400">{w.openWork} Active</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              w.isOverCapacity ? 'bg-red-500' : w.capacityUtilization > 70 ? 'bg-amber-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${w.capacityUtilization}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section F: Filterable Floor Service Jobs Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Live Floor Jobs Directory ({filteredJobs.length})
            </h4>

            {/* Table search & multi-filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Service Type Dropdown */}
              <select
                value={opServiceFilter}
                onChange={(e) => setOpServiceFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Services</option>
                {['Alteration', 'Fall & Pico', 'Dry Clean', 'Embroidery', 'Charak', 'Repair', 'Finishing', 'Others'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={opStatusFilter}
                onChange={(e) => setOpStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_ASSIGNMENT">Pending Assignment</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="READY">Ready for Delivery</option>
                <option value="COLLECTED">Collected / Delivered</option>
              </select>

              {/* Tailor / Workshop Dropdown */}
              <select
                value={opTailorFilter}
                onChange={(e) => setOpTailorFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Workshop Tailors</option>
                {workloads.map((w) => (
                  <option key={w.name} value={w.name}>{w.name}</option>
                ))}
              </select>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search PSSM #, Bill #, Customer..."
                  value={opSearchTerm}
                  onChange={(e) => setOpSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-52"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">PSSM # / Bill</th>
                  <th className="pb-2">Item / Garment</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Service Type</th>
                  <th className="pb-2">Assigned Workshop</th>
                  <th className="pb-2">Target Delivery</th>
                  <th className="pb-2">Priority</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      No matching jobs found on the floor.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5">
                        <span className="font-mono font-bold text-slate-800 block">{job.pssmNo}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Bill: {job.billNo}</span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-800">{job.productName}</td>
                      <td className="py-2.5">
                        <span className="font-bold text-slate-800 block">{job.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{job.customerPhone}</span>
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                          {job.serviceType}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-indigo-700">{job.assignedTo}</td>
                      <td className="py-2.5">
                        <span className={`font-mono text-[11px] font-bold ${job.isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                          {job.expectedDeliveryDate ? new Date(job.expectedDeliveryDate).toLocaleDateString() : 'N/A'}
                        </span>
                        {job.isOverdue && (
                          <span className="text-[9px] bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded font-bold ml-1">
                            OVERDUE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            job.priority === 'HIGH' || job.priority === 'URGENT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {job.priority}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            job.status === 'READY'
                              ? 'bg-emerald-100 text-emerald-800'
                              : job.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}
  </div>
);
};

  // -------------------------------------------------------------
  // C. SALESMAN DASHBOARD VIEW
  // -------------------------------------------------------------
  const renderSalesmanDashboard = () => {
    const summary = salesmanData?.summary || {
      totalAssignedServices: 0,
      pending: 0,
      ready: 0,
      delivered: 0,
      overdue: 0,
      reAlterCases: 0
    };

    const pendingList = salesmanData?.pendingList || [];
    const dailyFollowUp = salesmanData?.dailyFollowUp || {
      customersToCall: [],
      readyItems: [],
      overdueItems: [],
      uncollectedItems: []
    };
    const salesmen = salesmanData?.salesmen || [];

    const activeFollowUpList =
      salesmanFollowUpTab === 'toCall'
        ? dailyFollowUp.customersToCall
        : salesmanFollowUpTab === 'ready'
        ? dailyFollowUp.readyItems
        : salesmanFollowUpTab === 'overdue'
        ? dailyFollowUp.overdueItems
        : dailyFollowUp.uncollectedItems;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Navigation Breadcrumb & Salesman Selector Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => setCurrentView('summary')}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 font-bold text-xs transition-colors cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Back to Summary Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
                Salesman Service Ownership & Follow-up
              </h3>
              <span className="bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-teal-200">
                Staff Accountability
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe Selector */}
            {renderTimeframeSelector(fetchSalesman, isLoadingSalesman, 'text-teal-600')}

            {/* Salesman Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Staff:</span>
              <select
                value={selectedSalesmanId}
                onChange={(e) => setSelectedSalesmanId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Sales Representatives</option>
                <option value="COUNTER">Counter Salesman ({salesmanData?.counterDelegatedCount || 0} Delegated Jobs)</option>
                {salesmen.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isAbsent ? `(Absent → Delegated to ${s.delegatedTo || 'Counter Salesman'})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State when no data yet */}
        {isLoadingSalesman && !salesmanData ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl border border-teal-100/80 p-8 shadow-xs flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
              <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Loading Salesman Follow-up Data...</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Fetching salesperson service ownership, daily call lists & delegation status
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-2 animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-16"></div>
                  <div className="h-6 bg-slate-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Assigned</span>
            <p className="text-xl font-black text-slate-800">{summary.totalAssignedServices}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-amber-600 uppercase">Pending Action</span>
            <p className="text-xl font-black text-amber-700">{summary.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Ready to Collect</span>
            <p className="text-xl font-black text-emerald-700">{summary.ready}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Delivered</span>
            <p className="text-xl font-black text-blue-700">{summary.delivered}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-rose-600 uppercase">Overdue Cases</span>
            <p className="text-xl font-black text-rose-700">{summary.overdue}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-purple-600 uppercase">Re-Alter Cases</span>
            <p className="text-xl font-black text-purple-700">{summary.reAlterCases}</p>
          </div>
        </div>

        {/* Absent Salesman Reassignment Controls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-600" />
                <span>Sales Staff Attendance & Automatic Delegation Flow</span>
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">
                When a salesperson is marked <b>Absent</b>, their pending client jobs automatically route to <b>Counter Salesman / Manager</b>. When they return, original ownership is restored immediately.
              </p>
            </div>
            {salesmanData?.counterDelegatedCount > 0 && (
              <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-xl border border-amber-200 shrink-0">
                ⚠️ {salesmanData.counterDelegatedCount} Jobs Delegated to Counter
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {salesmen.length === 0 ? (
              <div className="col-span-full p-4 text-center text-slate-400 text-xs font-semibold">
                No salesperson records registered.
              </div>
            ) : (
              salesmen.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    s.isAbsent ? 'bg-amber-50/70 border-amber-200 shadow-2xs' : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 truncate">{s.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        s.isAbsent ? 'bg-amber-200 text-amber-900 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {s.isAbsent ? 'ABSENT' : 'PRESENT'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      {s.openServices} Open Services • {s.isAbsent ? `Delegated to ${s.delegatedTo || 'Counter Salesman'}` : 'Direct Ownership'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleAbsent(s.id, s.isAbsent, s.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                      s.isAbsent
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {s.isAbsent ? 'Mark Present' : 'Mark Absent'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Daily Follow-Up Action Checklist Tabs & Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-indigo-600" />
                <span>Daily Salesperson Action & Morning Follow-up Hub</span>
              </h4>
              <p className="text-[11px] text-slate-400 font-semibold">
                Actionable call triggers for today's pickup reminders, overdue alerts & uncollected garments
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setSalesmanFollowUpTab('toCall')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  salesmanFollowUpTab === 'toCall' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📞 आज Call करना है ({dailyFollowUp.customersToCall?.length || 0})
              </button>
              <button
                onClick={() => setSalesmanFollowUpTab('ready')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  salesmanFollowUpTab === 'ready' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ✨ कौन Ready है ({dailyFollowUp.readyItems?.length || 0})
              </button>
              <button
                onClick={() => setSalesmanFollowUpTab('overdue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  salesmanFollowUpTab === 'overdue' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ⚠️ कौन Overdue है ({dailyFollowUp.overdueItems?.length || 0})
              </button>
              <button
                onClick={() => setSalesmanFollowUpTab('uncollected')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  salesmanFollowUpTab === 'uncollected' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ⏳ कौन Delivery लेने नहीं आया ({dailyFollowUp.uncollectedItems?.length || 0})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Bill # / Ticket</th>
                  <th className="pb-2">Customer & Mobile</th>
                  <th className="pb-2">Garment Item</th>
                  <th className="pb-2">Service Type</th>
                  <th className="pb-2">Assigned Master</th>
                  <th className="pb-2">Target Date</th>
                  <th className="pb-2">Status & Delegation</th>
                  <th className="pb-2 text-right">Action (Call / WhatsApp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {activeFollowUpList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      No pending client follow-ups in this queue. All customer communications are up to date!
                    </td>
                  </tr>
                ) : (
                  activeFollowUpList.map((item) => {
                    const cleanPhone = (item.mobile || '').replace(/\D/g, '');
                    const readyMsg = encodeURIComponent(`नमस्ते ${item.customerName}, आपका गारमेंट "${item.itemName}" (Bill #${item.billNo}) तैयार हो चुका है। कृपया वस्त्र स्टोर से पिकअप कर लें। धन्यवाद!`);
                    const overdueMsg = encodeURIComponent(`नमस्ते ${item.customerName}, आपके गारमेंट "${item.itemName}" (Bill #${item.billNo}) पर हमारे मास्टर टेलर द्वारा अंतिम फिनिशिंग का कार्य किया जा रहा है। जल्द ही डिलीवरी का अपडेट दिया जाएगा।`);
                    const uncollectedMsg = encodeURIComponent(`नमस्ते ${item.customerName}, आपका गारमेंट "${item.itemName}" (Bill #${item.billNo}) स्टोर में पिकअप के लिए उपलब्ध है। कृपया अपनी सुविधानुसार कलेक्ट कर लें।`);

                    const selectedMsg = item.isReady
                      ? (salesmanFollowUpTab === 'uncollected' ? uncollectedMsg : readyMsg)
                      : overdueMsg;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 font-mono font-bold text-slate-800">{item.billNo}</td>
                        <td className="py-2.5">
                          <span className="font-bold text-slate-800 block">{item.customerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.mobile}</span>
                        </td>
                        <td className="py-2.5 font-bold text-slate-800">{item.itemName}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                            {item.serviceType}
                          </span>
                        </td>
                        <td className="py-2.5 text-indigo-700 font-bold">{item.assignedTailor}</td>
                        <td className="py-2.5 font-mono text-[11px] font-bold">
                          <span className={item.isOverdue ? 'text-rose-600' : 'text-slate-700'}>
                            {item.deliveryDate}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div className="space-y-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                                item.isReady
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.isOverdue
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {item.currentStatus}
                            </span>
                            {item.isDelegated && (
                              <span className="block px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-extrabold">
                                Delegated from {item.reassignedFromSalesmanName || 'Salesman'} (Absent)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.mobile && item.mobile !== 'N/A' && (
                              <a
                                href={`tel:${item.mobile}`}
                                className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-indigo-200"
                                title="Direct Call"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Call</span>
                              </a>
                            )}
                            <button
                              onClick={() => {
                                window.open(`https://wa.me/91${cleanPhone}?text=${selectedMsg}`, '_blank');
                              }}
                              className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-emerald-200 cursor-pointer"
                              title="Send WhatsApp Update"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}
  </div>
);
};

  // -------------------------------------------------------------
  // D. CUSTOMER DASHBOARD VIEW
  // -------------------------------------------------------------
  const handleSendWhatsApp = (phone, message) => {
    if (!phone || phone === 'N/A') return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const renderCustomerDashboard = () => {
    const customer = customerData?.searchedCustomer;
    const customerList = customerData?.customerDirectory || [];
    const stats = customerData?.stats || {};
    const collection = customerData?.collectionStatus || {
      readyForCollection: stats.readyItems || 0,
      partiallyCollected: stats.partialCollection || 0,
      fullyCollected: stats.deliveredItems || 0
    };
    const visitHistory = customerData?.visitHistory || {
      lastVisit: stats.lastVisit || 'N/A',
      totalAlterations: stats.totalAlterations || 0,
      totalReAlter: stats.totalReAlter || 0,
      totalServicesTaken: stats.totalServicesTaken || 0,
      lifetimeSpend: `₹${(stats.lifetimeValue || 0).toLocaleString('en-IN')}`
    };
    const services = customerData?.services || [];
    const comms = customerData?.communicationHistory || [];

    // Filter communication logs if user selected filters
    const filteredComms = comms.filter((item) => {
      if (customerCommTypeFilter !== 'ALL' && item.type !== customerCommTypeFilter) return false;
      if (customerCommStatusFilter !== 'ALL' && item.status !== customerCommStatusFilter) return false;
      return true;
    });

    const getCommStatusBadge = (status) => {
      switch (status) {
        case 'Read (WhatsApp API Supported)':
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Read (WhatsApp API Supported)</span>
            </span>
          );
        case 'Delivered':
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[10px]">
              <Check className="w-3 h-3 text-blue-600" />
              <span>Delivered</span>
            </span>
          );
        case 'Sent':
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full font-bold text-[10px]">
              <Send className="w-3 h-3 text-sky-600" />
              <span>Sent</span>
            </span>
          );
        case 'Failed':
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-[10px]">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span>Failed</span>
            </span>
          );
        case 'Retry Required':
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px]">
              <RefreshCw className="w-3 h-3 text-amber-600" />
              <span>Retry Required</span>
            </span>
          );
        default:
          return (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
              {status}
            </span>
          );
      }
    };

    const getCommTypeBadgeClass = (type) => {
      switch (type) {
        case 'Booking Confirmation':
          return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'Pending Item Message':
          return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'Ready Message':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'Delay Message':
          return 'bg-rose-50 text-rose-700 border-rose-200';
        case 'Delivery Reminder':
          return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Delivery Completed':
          return 'bg-teal-50 text-teal-700 border-teal-200';
        default:
          return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      }
    };

    return (
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Navigation Breadcrumb & Multi-Customer Controls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => setCurrentView('summary')}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 font-bold text-xs transition-colors cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Back to Summary Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <span>3. Customer Dashboard</span>
                <span className="text-xs text-slate-400 font-medium lowercase">/ CRM & Communication Hub</span>
              </h3>
              <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-200">
                Live Post-Sales
              </span>
            </div>
          </div>

          {/* Customer Selector Dropdown + Search + View Mode Switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Quick Customer Switcher Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold hidden sm:inline">Customer:</span>
              <select
                value={customer?.id || (customer?.phone ? customer.phone : '')}
                onChange={(e) => {
                  if (e.target.value === '__DIRECTORY__') {
                    setCustomerViewTab('directory');
                  } else {
                    setCustomerViewTab('profile');
                    fetchCustomer('', e.target.value);
                  }
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[220px]"
              >
                <option value="__DIRECTORY__">📋 All Customers Directory ({customerList.length})</option>
                {customerList.map((c) => (
                  <option key={c.id || c.phone} value={c.id || c.phone}>
                    {c.name} ({c.phone}) {c.pendingItems > 0 ? `• ${c.pendingItems} Pending` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle Button */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setCustomerViewTab('profile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  customerViewTab === 'profile'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Customer Profile
              </button>
              <button
                onClick={() => setCustomerViewTab('directory')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  customerViewTab === 'directory'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Customers ({customerList.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, phone, bill..."
                  value={customerSearchInput}
                  onChange={(e) => setCustomerSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setCustomerViewTab('profile');
                      fetchCustomer(customerSearchInput);
                    }
                  }}
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
                />
              </div>
              <button
                onClick={() => {
                  setCustomerViewTab('profile');
                  fetchCustomer(customerSearchInput);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {isLoadingCustomer ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: ALL CUSTOMERS DIRECTORY TABLE */}
        {customerViewTab === 'directory' ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Customer Directory & Service Matrix ({customerList.length})</span>
                </h4>
                <p className="text-xs text-slate-400 font-medium">Click on any customer to open their individual dashboard and communication timeline.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Customer Name & Contact</th>
                    <th className="py-3 px-3">Inseam Book</th>
                    <th className="py-3 px-3 text-center">Pending Items</th>
                    <th className="py-3 px-3 text-center">Ready Items</th>
                    <th className="py-3 px-3 text-center">Delivered</th>
                    <th className="py-3 px-3 text-center">Re-Alter</th>
                    <th className="py-3 px-3 text-center">Total Services</th>
                    <th className="py-3 px-3">Last Visit</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {customerList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                        No customer records found in the database.
                      </td>
                    </tr>
                  ) : (
                    customerList.map((c) => (
                      <tr
                        key={c.id || c.phone}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          customer?.id === c.id || customer?.phone === c.phone ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                              {c.name?.slice(0, 2)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800">{c.name}</p>
                              <span className="text-[10px] text-slate-400 font-medium">📱 {c.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-600 text-[11px]">
                          {c.inseamBookCode}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            c.pendingItems > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {c.pendingItems}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            c.readyItems > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {c.readyItems}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                          {c.deliveredItems}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            c.reAlterCount > 0 ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {c.reAlterCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-extrabold text-slate-800">
                          {c.totalServices}
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                          {c.lastVisit}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setCustomerViewTab('profile');
                                fetchCustomer('', c.id || c.phone);
                              }}
                              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Open Dashboard
                            </button>
                            {c.phone && c.phone !== 'N/A' && (
                              <button
                                onClick={() => handleSendWhatsApp(c.phone, `Hello ${c.name}, greeting from Vastra!`)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-all cursor-pointer"
                                title="Send WhatsApp Message"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* TAB 2: SELECTED CUSTOMER PROFILE & DETAIL VIEW */}
        {customerViewTab === 'profile' && (
          <>
            {/* Selected Customer Identity Header */}
            {customer ? (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-xs">
                    {customer.name?.slice(0, 2)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-800">{customer.name}</h4>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                        Active Customer
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">📱 {customer.phone}</span>
                      <span className="flex items-center gap-1">📍 {customer.address}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-200 shadow-2xs">
                    Inseam Book: <span className="font-mono">{customer.inseamBookCode}</span>
                  </span>
                  <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-200 shadow-2xs flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{customer.loyaltyPoints} Loyalty Pts</span>
                  </span>
                  <button
                    onClick={() => handleSendWhatsApp(customer.phone, `Hello ${customer.name}, greeting from Vastra Support Hub!`)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Chat</span>
                  </button>
                  <button
                    onClick={() => setCustomerViewTab('directory')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>View All Customers</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white border border-slate-100 rounded-2xl text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Search for a customer or select one from the directory to view their timeline</p>
                <p className="text-xs text-slate-400">Enter phone number, customer name, or select from the dropdown above.</p>
              </div>
            )}

            {/* SECTION 1: Customer Pending Items (Customer-wise Metrics) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Customer Pending Items (Customer-Wise Breakdown)
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  Active Service Breakdown
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* 1. Total Pending Items */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:border-amber-200 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Pending Items</span>
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-800">{stats.totalPendingItems || 0}</p>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 block">In-progress on floor</span>
                </div>

                {/* 2. Ready Items */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-200 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Ready Items</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-emerald-700">{stats.readyItems || 0}</p>
                  <span className="text-[10px] text-emerald-600/80 font-medium mt-1 block">Awaiting pickup</span>
                </div>

                {/* 3. Delivered Items */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Delivered Items</span>
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-black text-blue-700">{stats.deliveredItems || 0}</p>
                  <span className="text-[10px] text-blue-600/80 font-medium mt-1 block">Handed over</span>
                </div>

                {/* 4. Partial Collection */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:border-indigo-200 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Partial Collection</span>
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-black text-indigo-700">{stats.partialCollection || 0}</p>
                  <span className="text-[10px] text-indigo-600/80 font-medium mt-1 block">Split deliveries</span>
                </div>

                {/* 5. Re-Alter History */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:border-purple-200 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Re-Alter History</span>
                    <Scissors className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-black text-purple-700">{stats.reAlterHistory || 0}</p>
                  <span className="text-[10px] text-purple-600/80 font-medium mt-1 block">Rework requests</span>
                </div>
              </div>
            </div>

            {/* SECTION 2 & 3: Collection Status & Customer Visit History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Collection Status Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Collection Status
                    </h4>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Delivery Tracker
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Ready for Collection */}
                  <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase">Ready for Collection</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      </div>
                      <p className="text-xl font-black text-emerald-800 mt-2">{collection.readyForCollection}</p>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-2 block">
                      Ready garments at store counter
                    </span>
                  </div>

                  {/* Partially Collected */}
                  <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-800 uppercase">Partially Collected</span>
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      </div>
                      <p className="text-xl font-black text-indigo-800 mt-2">{collection.partiallyCollected}</p>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold mt-2 block">
                      Partial garments collected
                    </span>
                  </div>

                  {/* Fully Collected */}
                  <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-800 uppercase">Fully Collected</span>
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                      <p className="text-xl font-black text-blue-800 mt-2">{collection.fullyCollected}</p>
                    </div>
                    <span className="text-[10px] text-blue-600 font-semibold mt-2 block">
                      All garments delivered
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Visit History Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Customer Visit History
                    </h4>
                  </div>
                  <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                    Lifetime Profile
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Last Visit</span>
                    <p className="text-xs font-black text-slate-800 mt-1">{visitHistory.lastVisit || 'N/A'}</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Last store visit</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Alterations</span>
                    <p className="text-lg font-black text-slate-800 mt-1">{visitHistory.totalAlterations || 0}</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Lifetime alterations</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-purple-600 uppercase block">Total Re-Alter</span>
                    <p className="text-lg font-black text-purple-700 mt-1">{visitHistory.totalReAlter || 0}</p>
                    <span className="text-[9px] text-purple-500 block mt-0.5">Lifetime re-alterations</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase block">Total Services Taken</span>
                    <p className="text-lg font-black text-indigo-700 mt-1">{visitHistory.totalServicesTaken || 0}</p>
                    <span className="text-[9px] text-indigo-500 block mt-0.5">Total lifetime services</span>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lifetime Customer Spend / Billing:</span>
                  </span>
                  <span className="font-black text-amber-900 font-mono text-sm">{visitHistory.lifetimeSpend || '₹0'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: Customer Services Tickets & Customer Communication History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Active / Past Services List */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Customer Services & Fitting Tickets ({services.length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold">Live Status</span>
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {services.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium space-y-1">
                      <Scissors className="w-6 h-6 text-slate-300 mx-auto" />
                      <p>No service records linked to this customer.</p>
                    </div>
                  ) : (
                    services.map((srv) => (
                      <div key={srv.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{srv.productName}</span>
                            <span className="px-1.5 py-0.2 bg-white text-slate-700 border border-slate-200 rounded font-bold text-[10px]">
                              {srv.serviceType}
                            </span>
                            {srv.reAlterationRequired && (
                              <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded font-bold text-[9px]">
                                Re-Alter
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                            <span>Ticket: <strong className="text-slate-600">{srv.pssmNo}</strong></span>
                            <span>•</span>
                            <span>Bill: <strong className="text-slate-600">{srv.billNo}</strong></span>
                            <span>•</span>
                            <span>Target: {srv.deliveryDate}</span>
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold block ${
                              srv.status === 'READY' || srv.status === 'READY_FOR_DELIVERY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ['COLLECTED', 'CLOSED', 'DELIVERED'].includes(srv.status)
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {srv.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold block">
                            ₹{srv.charge}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Customer Communication History (Full Message Log) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Customer Communication History</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Full Message Log & WhatsApp API Updates</p>
                  </div>

                  {/* Message Filter Selector */}
                  <div className="flex items-center gap-2">
                    <select
                      value={customerCommTypeFilter}
                      onChange={(e) => setCustomerCommTypeFilter(e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="ALL">All Message Types</option>
                      <option value="Booking Confirmation">Booking Confirmation</option>
                      <option value="Pending Item Message">Pending Item Message</option>
                      <option value="Ready Message">Ready Message</option>
                      <option value="Delay Message">Delay Message</option>
                      <option value="Delivery Reminder">Delivery Reminder</option>
                      <option value="Delivery Completed">Delivery Completed</option>
                    </select>

                    <select
                      value={customerCommStatusFilter}
                      onChange={(e) => setCustomerCommStatusFilter(e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Read (WhatsApp API Supported)">Read (WhatsApp API)</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Sent">Sent</option>
                      <option value="Failed">Failed</option>
                      <option value="Retry Required">Retry Required</option>
                    </select>
                  </div>
                </div>

                {/* Communication Timeline List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredComms.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium space-y-1">
                      <MessageSquare className="w-6 h-6 text-slate-300 mx-auto" />
                      <p>No communication logs matching current filter.</p>
                    </div>
                  ) : (
                    filteredComms.map((comm) => (
                      <div key={comm.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 hover:border-slate-200 transition-colors">
                        {/* Header Row: Type Badge + Status Badge */}
                        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                          <span className={`px-2.5 py-0.5 rounded-lg font-black text-[10px] border ${getCommTypeBadgeClass(comm.type)}`}>
                            • {comm.type}
                          </span>
                          {getCommStatusBadge(comm.status)}
                        </div>

                        {/* Chat message content box */}
                        <div className="p-2.5 bg-white rounded-lg border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed">
                          💬 {comm.message}
                        </div>

                        {/* Footer Row: Channel, Timestamp, Resend WhatsApp Button */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span>Channel: <strong className="text-slate-600">{comm.channel}</strong></span>
                            <span>•</span>
                            <span>{comm.timestamp}</span>
                          </div>

                          {customer?.phone && (
                            <button
                              onClick={() => handleSendWhatsApp(customer.phone, comm.message)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>Resend WhatsApp</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------
  // E. MANAGEMENT DASHBOARD VIEW
  // -------------------------------------------------------------
  const renderManagementDashboard = () => {
    const biz = managementData?.businessAnalysis || {};
    const tailors = managementData?.tailorPerformance || [];
    const vendors = managementData?.vendorPerformance || [];

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Navigation Breadcrumb & Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => setCurrentView('summary')}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 font-bold text-xs transition-colors cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Back to Summary Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
                Management Analytics & Executive BI
              </h3>
              <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-purple-200">
                Turnaround & Cost Control
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {renderTimeframeSelector(fetchManagement, isLoadingManagement, 'text-purple-600')}
          </div>
        </div>

        {/* Loading State when no data yet */}
        {isLoadingManagement && !managementData ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl border border-purple-100/80 p-8 shadow-xs flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
              <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Loading Executive Management Analytics...</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Computing turnaround times, master tailor ratings & quality rework rates
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-2 animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-16"></div>
                  <div className="h-6 bg-slate-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Section A: Business Analysis Intelligence Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-purple-600 uppercase">Most Prone Item</span>
            <p className="text-sm font-black text-slate-800 truncate">{biz.mostAlterationProneItem || 'N/A'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase">Top Service</span>
            <p className="text-sm font-black text-slate-800 truncate">{biz.mostUsedService || 'N/A'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Avg Delivery Time</span>
            <p className="text-xl font-black text-slate-800">{biz.averageDeliveryTime || '0.0 Days'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-rose-600 uppercase">Re-Alter Rate</span>
            <p className="text-xl font-black text-rose-700">{biz.averageReAlterRate || '0.0%'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Completion Rate</span>
            <p className="text-xl font-black text-emerald-700">{biz.serviceCompletionRate || '0%'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Total Services</span>
            <p className="text-xl font-black text-blue-700">{biz.totalServicesHandled || 0}</p>
          </div>
        </div>

        {/* Section B: Tailor Performance Evaluation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Tailor Quality & Velocity Ranking
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">
                Turnaround hours and quality satisfaction ratings (1-5 scale)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Master Tailor</th>
                  <th className="pb-2 text-center">Total Assigned</th>
                  <th className="pb-2 text-center">Completed</th>
                  <th className="pb-2 text-center">Pending</th>
                  <th className="pb-2 text-center">Overdue</th>
                  <th className="pb-2 text-center">Re-Alter %</th>
                  <th className="pb-2 text-center">Avg Turnaround</th>
                  <th className="pb-2 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {tailors.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 font-semibold">
                      No tailor workshop records found in the database.
                    </td>
                  </tr>
                ) : (
                  tailors.map((t) => (
                    <tr key={t.name} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 font-bold text-slate-800">{t.name}</td>
                      <td className="py-2.5 text-center font-mono font-bold text-slate-700">{t.assigned}</td>
                      <td className="py-2.5 text-center font-mono font-bold text-emerald-600">{t.completed}</td>
                      <td className="py-2.5 text-center font-mono font-bold text-slate-600">{t.pending}</td>
                      <td className={`py-2.5 text-center font-mono font-bold ${t.overdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {t.overdue}
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold text-purple-600">{t.reAlterRate}</td>
                      <td className="py-2.5 text-center font-mono font-bold text-slate-700">{t.avgHours}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-amber-500">⭐ {t.rating}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section C: Non-Alteration Specialized Service & Vendor Performance */}
        {(() => {
          const filteredVendors = vendors.filter((v) => {
            if (specializedServiceFilter !== 'ALL' && v.service !== specializedServiceFilter) return false;
            return true;
          });

          const getServiceBadge = (srv) => {
            switch (srv) {
              case 'Dry Clean':
                return 'bg-sky-50 text-sky-700 border-sky-200';
              case 'Fall Pico':
                return 'bg-teal-50 text-teal-700 border-teal-200';
              case 'Embroidery':
                return 'bg-purple-50 text-purple-700 border-purple-200';
              case 'Charak':
                return 'bg-amber-50 text-amber-700 border-amber-200';
              default:
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            }
          };

          return (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Non-Alteration PSSM Service & Vendor Performance</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Performance of people and vendors assigned with Dry Clean, Fall Pico, Embroidery, and Charak
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['ALL', 'Dry Clean', 'Fall Pico', 'Embroidery', 'Charak'].map((srv) => (
                    <button
                      key={srv}
                      onClick={() => setSpecializedServiceFilter(srv)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        specializedServiceFilter === srv
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {srv === 'ALL' ? 'All 4 Services' : srv}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Specialized Service</th>
                      <th className="py-2.5 px-3">Assigned Person / Vendor</th>
                      <th className="py-2.5 px-3 text-center">Assigned</th>
                      <th className="py-2.5 px-3 text-center">Completed</th>
                      <th className="py-2.5 px-3 text-center">Pending</th>
                      <th className="py-2.5 px-3 text-center">Overdue</th>
                      <th className="py-2.5 px-3 text-center">Avg Turnaround</th>
                      <th className="py-2.5 px-3 text-right">Rework Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {filteredVendors.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">
                          No service records found for the selected specialized service filter.
                        </td>
                      </tr>
                    ) : (
                      filteredVendors.map((v) => (
                        <tr key={v.service + v.vendor} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ${getServiceBadge(v.service)}`}>
                              • {v.service}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-extrabold text-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black">
                                {v.vendor?.slice(0, 2)?.toUpperCase()}
                              </div>
                              <span>{v.vendor}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">{v.assigned}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">{v.completed}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                              v.pending > 0 ? 'bg-amber-50 text-amber-700 font-black' : 'text-slate-400'
                            }`}>
                              {v.pending}
                            </span>
                          </td>
                          <td className={`py-3 px-3 text-center font-mono font-bold ${v.overdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {v.overdue}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">{v.avgTurnaround}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">{v.reworkRate}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </>
    )}
  </div>
);
};

  // ==================== MAIN COMPONENT DISPATCHER ====================
  return (
    <div className="space-y-6 pb-12" id="summary-dashboard-root">
      {currentView === 'summary' && renderSummaryOverview()}
      {currentView === 'operations' && renderOperationsDashboard()}
      {currentView === 'salesman' && renderSalesmanDashboard()}
      {currentView === 'customer' && renderCustomerDashboard()}
      {currentView === 'management' && renderManagementDashboard()}
    </div>
  );
}

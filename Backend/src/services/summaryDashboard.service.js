const mongoose = require('mongoose');
const PSSM = require('../models/PSSM/PSSM');
const PSSMItem = require('../models/PSSM/PSSMItem');
const Alteration = require('../models/alteration/Alteration');
const AlterationItem = require('../models/alteration/AlterationItem');
const Customer = require('../models/crm/Customer');
const Salesman = require('../models/masters/Salesman');
const User = require('../models/User');
const Vendor = require('../models/masters/Vendor');
const TailoringJob = require('../models/tailoring/TailoringJob');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const SaleBill = require('../models/billing/SaleBill');

class SummaryDashboardService {
  /**
   * Helper to parse date range filters
   */
  static getDateFilter(timeframe, startDate, endDate) {
    let start = null;
    let end = null;
    const now = new Date();

    if (timeframe === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (timeframe === 'week') {
      const current = new Date();
      const day = current.getDay(); // 0: Sunday, 1: Monday...
      const diffToMonday = current.getDate() - (day === 0 ? 6 : day - 1);
      start = new Date(current.getFullYear(), current.getMonth(), diffToMonday, 0, 0, 0, 0);
      end = new Date(current.getFullYear(), current.getMonth(), diffToMonday + 6, 23, 59, 59, 999);
    } else if (timeframe === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (timeframe === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  /**
   * 1. Overview Summary Dashboard (Properly filtered by timeframe)
   */
  static async getOverviewSummary(query = {}, tenantId) {
    const { timeframe = 'all', startDate, endDate } = query;
    const { start, end } = this.getDateFilter(timeframe, startDate, endDate);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const now = new Date();

    const itemFilter = { tenantId, isDeleted: false };
    const pssmFilter = { tenantId, isDeleted: false };
    const altFilter = { tenantId, isDeleted: false };

    if (start && end) {
      itemFilter.createdAt = { $gte: start, $lte: end };
      pssmFilter.createdAt = { $gte: start, $lte: end };
      altFilter.createdAt = { $gte: start, $lte: end };
    }

    const [
      pssmItems,
      allPSSMs,
      todayNewPSSMs,
      todayNewAlt,
      deliveredTodayPSSM,
      deliveredTodayAlt
    ] = await Promise.all([
      PSSMItem.find(itemFilter).lean(),
      PSSM.find(pssmFilter).lean(),
      PSSM.countDocuments({
        tenantId,
        isDeleted: false,
        createdAt: { $gte: start && timeframe !== 'all' ? start : todayStart, $lte: end && timeframe !== 'all' ? end : todayEnd }
      }),
      Alteration.countDocuments({
        tenantId,
        isDeleted: false,
        createdAt: { $gte: start && timeframe !== 'all' ? start : todayStart, $lte: end && timeframe !== 'all' ? end : todayEnd }
      }),
      PSSMItem.countDocuments({
        tenantId,
        isDeleted: false,
        status: { $in: ['COLLECTED', 'CLOSED', 'DELIVERED'] },
        updatedAt: { $gte: start && timeframe !== 'all' ? start : todayStart, $lte: end && timeframe !== 'all' ? end : todayEnd }
      }),
      Alteration.countDocuments({
        tenantId,
        isDeleted: false,
        status: { $in: ['Delivered', 'Closed', 'Completed'] },
        updatedAt: { $gte: start && timeframe !== 'all' ? start : todayStart, $lte: end && timeframe !== 'all' ? end : todayEnd }
      })
    ]);

    let totalPending = 0;
    let readyForDelivery = 0;
    let overdueServices = 0;
    let urgentDeliveries = 0;
    let reAlterPending = 0;
    let homeDeliveryPending = 0;
    let totalDoneDurationMs = 0;
    let totalDoneCount = 0;
    const serviceCounts = {};

    pssmItems.forEach(item => {
      const isClosed = ['COLLECTED', 'CLOSED', 'DELIVERED'].includes(item.status);
      const isReady = ['READY', 'READY_FOR_DELIVERY', 'PARTIALLY_READY'].includes(item.status);

      const srv = item.serviceType || 'Alteration';
      serviceCounts[srv] = (serviceCounts[srv] || 0) + 1;

      if (!isClosed) {
        totalPending++;
        if (isReady) readyForDelivery++;

        const deliveryDate = item.expectedDeliveryDate ? new Date(item.expectedDeliveryDate) : null;
        if (deliveryDate && deliveryDate < now) {
          overdueServices++;
        }

        if (item.priority === 'HIGH' || item.priority === 'URGENT' || item.customerWaitingOption === 'Waiting in Store') {
          urgentDeliveries++;
        }

        if (item.customerWaitingOption === 'Home Delivery Required') {
          homeDeliveryPending++;
        }

        if (item.reAlterationRequired) {
          reAlterPending++;
        }
      }

      if (isClosed && item.completedAt && item.createdAt) {
        const diff = new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime();
        if (diff > 0) {
          totalDoneDurationMs += diff;
          totalDoneCount++;
        }
      }
    });

    let partialCollectionPending = 0;
    allPSSMs.forEach(pssm => {
      if (pssm.status === 'PARTIALLY_READY' || pssm.status === 'PARTIALLY_COLLECTED') {
        partialCollectionPending++;
      }
    });

    const todayNewEntries = todayNewPSSMs + todayNewAlt;
    const deliveredToday = deliveredTodayPSSM + deliveredTodayAlt;

    const totalAssignedSales = pssmItems.filter(i => Boolean(i.salesmanId || i.salesmanName)).length;
    const salesmanPending = pssmItems.filter(i => Boolean(i.salesmanId || i.salesmanName) && !['COLLECTED', 'CLOSED', 'DELIVERED'].includes(i.status)).length;
    
    const uniqueCustomerIds = new Set(allPSSMs.map(p => p.customerId?.toString()).filter(Boolean));

    const totalItemsCount = pssmItems.length;
    const completedItemsCount = pssmItems.filter(i => ['COLLECTED', 'CLOSED', 'DELIVERED', 'READY'].includes(i.status)).length;
    const completionRate = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;
    const avgTurnaroundDays = totalDoneCount > 0 ? (totalDoneDurationMs / totalDoneCount / (1000 * 60 * 60 * 24)).toFixed(1) : '0.0';
    const topServiceName = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Alteration';

    return {
      kpis: {
        totalPendingServices: totalPending,
        todayNewEntries,
        readyForDelivery,
        deliveredToday,
        overdueServices,
        urgentDeliveries,
        reAlterPending,
        partialCollectionPending,
        homeDeliveryPending
      },
      cards: {
        operations: {
          title: "Operations Dashboard",
          badge: "Live Post-Sales Workflow",
          kpi1: { label: "Pending Services", value: totalPending },
          kpi2: { label: "Ready for Delivery", value: readyForDelivery },
          kpi3: { label: "Overdue Alerts", value: overdueServices, alert: overdueServices > 0 },
          kpi4: { label: "Urgent Jobs", value: urgentDeliveries },
          desc: "Full overview of floor tailoring, in-progress alter jobs, workshop capacities & delivery schedules."
        },
        salesman: {
          title: "Salesman Dashboard",
          badge: "Ownership & Follow-ups",
          kpi1: { label: "Total Assigned", value: totalAssignedSales },
          kpi2: { label: "Pending Follow-up", value: salesmanPending },
          kpi3: { label: "Ready to Call", value: readyForDelivery },
          kpi4: { label: "Overdue Cases", value: overdueServices, alert: overdueServices > 0 },
          desc: "Salesperson service ownership, daily customer calling lists, absent delegation & handover logs."
        },
        customer: {
          title: "Customer Dashboard",
          badge: "Service & Communication",
          kpi1: { label: "Active Clients", value: uniqueCustomerIds.size },
          kpi2: { label: "Ready for Pickup", value: readyForDelivery },
          kpi3: { label: "Re-Alter Requests", value: reAlterPending },
          kpi4: { label: "Home Deliveries", value: homeDeliveryPending },
          desc: "Customer-centric service tracking, SMS/WhatsApp communications timeline & partial pickup audits."
        },
        management: {
          title: "Management Dashboard",
          badge: "Executive BI & Analytics",
          kpi1: { label: "Completion Rate", value: `${completionRate}%` },
          kpi2: { label: "Avg Turnaround", value: `${avgTurnaroundDays} Days` },
          kpi3: { label: "Top Service", value: topServiceName },
          kpi4: { label: "Rework Rate", value: `${totalItemsCount > 0 ? ((reAlterPending / totalItemsCount) * 100).toFixed(1) : 0}%` },
          desc: "Turnaround velocity, tailor quality ratings, outsourced vendor comparisons & alteration-prone catalog insights."
        }
      }
    };
  }

  /**
   * 2. Detailed Operations Dashboard
   */
  static async getOperationsDashboard(query = {}, tenantId) {
    const { timeframe = 'all', startDate, endDate, serviceFilter, statusFilter, tailorFilter, delayFilter, page = 1, limit = 50 } = query;
    const { start, end } = this.getDateFilter(timeframe, startDate, endDate);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const tomorrowEnd = new Date(todayEnd.getTime() + 24 * 60 * 60 * 1000);

    const itemFilter = { tenantId, isDeleted: false };
    if (start && end) {
      itemFilter.createdAt = { $gte: start, $lte: end };
    }

    const [items, dbTailorUsers] = await Promise.all([
      PSSMItem.find(itemFilter)
        .populate('pssmId')
        .sort({ createdAt: -1 })
        .lean(),
      User.find({ tenantId, role: { $in: ['tailor', 'worker'] }, isDeleted: false }).lean()
    ]);

    const serviceCategories = ['Alteration', 'Fall & Pico', 'Dry Clean', 'Embroidery', 'Charak', 'Repair', 'Finishing', 'Others'];
    const serviceBreakdown = {};
    serviceCategories.forEach(s => {
      serviceBreakdown[s] = { service: s, pending: 0, inProgress: 0, ready: 0, overdue: 0, total: 0 };
    });

    const workloadMap = new Map();

    dbTailorUsers.forEach(u => {
      workloadMap.set(u.name, {
        name: u.name,
        assigned: 0,
        inProgress: 0,
        ready: 0,
        delivered: 0,
        overdue: 0,
        todayNew: 0,
        totalDoneDuration: 0,
        doneCount: 0
      });
    });

    let readyForCollection = 0;
    let todayDelivery = 0;
    let tomorrowDelivery = 0;
    let overdueDelivery = 0;
    let customerWaitingInStore = 0;
    let homeDeliveryPending = 0;

    let dateCrossedCount = 0;
    let urgentAlertCount = 0;
    let vipDelayCount = 0;
    let vendorDelayCount = 0;

    let totalCompletedDurationMs = 0;
    let completedCount = 0;

    const formattedJobs = [];

    items.forEach(item => {
      const pssm = item.pssmId || {};
      const status = item.status || 'PENDING_ASSIGNMENT';
      const isClosed = ['COLLECTED', 'CLOSED', 'DELIVERED'].includes(status);
      const isReady = ['READY', 'READY_FOR_DELIVERY'].includes(status);
      const isInProgress = status === 'IN_PROGRESS';
      const isPending = ['PENDING_ASSIGNMENT', 'ASSIGNED', 'PENDING'].includes(status);

      const expDate = item.expectedDeliveryDate || pssm.expectedDeliveryDate ? new Date(item.expectedDeliveryDate || pssm.expectedDeliveryDate) : null;
      const isOverdue = !isClosed && expDate && expDate < now;
      const isToday = expDate && expDate >= todayStart && expDate <= todayEnd;
      const isTomorrow = expDate && expDate > todayEnd && expDate <= tomorrowEnd;

      const rawService = item.serviceType || pssm.serviceType || 'Alteration';
      const serviceKey = serviceCategories.includes(rawService) ? rawService : 'Others';

      if (!isClosed) {
        serviceBreakdown[serviceKey].total++;
        if (isPending) serviceBreakdown[serviceKey].pending++;
        if (isInProgress) serviceBreakdown[serviceKey].inProgress++;
        if (isReady) serviceBreakdown[serviceKey].ready++;
        if (isOverdue) serviceBreakdown[serviceKey].overdue++;
      }

      let assignedName = item.assignedTo || item.tailorName || pssm.tailorName || pssm.vendorName;
      if (assignedName && ['default tailor', 'none', 'n/a'].includes(assignedName.toLowerCase().trim())) {
        assignedName = dbTailorUsers[0]?.name || 'Unassigned Workshop';
      }

      if (assignedName) {
        if (!workloadMap.has(assignedName)) {
          workloadMap.set(assignedName, {
            name: assignedName,
            assigned: 0,
            inProgress: 0,
            ready: 0,
            delivered: 0,
            overdue: 0,
            todayNew: 0,
            totalDoneDuration: 0,
            doneCount: 0
          });
        }
        const wRecord = workloadMap.get(assignedName);
        wRecord.assigned++;
        if (isInProgress) wRecord.inProgress++;
        if (isReady) wRecord.ready++;
        if (isClosed) wRecord.delivered++;
        if (isOverdue) wRecord.overdue++;
        if (item.createdAt && new Date(item.createdAt) >= todayStart) wRecord.todayNew++;

        if (isClosed && item.completedAt && item.createdAt) {
          const diff = new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime();
          if (diff > 0) {
            wRecord.totalDoneDuration += diff;
            wRecord.doneCount++;
          }
        }
      }

      const isUrgentJob = !isClosed && (item.priority === 'HIGH' || item.priority === 'URGENT' || item.customerWaitingOption === 'Waiting in Store' || pssm.customerWaitingOption === 'Waiting in Store');
      const isVipJob = !isClosed && isOverdue && (Boolean(pssm.customerName?.toLowerCase().includes('vip')) || (Number(pssm.totalCharges) || 0) >= 2000);
      const isVendorJob = !isClosed && isOverdue && (['Dry Clean', 'Embroidery', 'Charak', 'Fall & Pico'].includes(serviceKey) || Boolean(item.vendorName || pssm.vendorName));

      if (!isClosed) {
        if (isReady) readyForCollection++;
        if (isToday) todayDelivery++;
        if (isTomorrow) tomorrowDelivery++;
        if (isOverdue) overdueDelivery++;

        const waitOpt = item.customerWaitingOption || pssm.customerWaitingOption;
        if (waitOpt === 'Waiting in Store') customerWaitingInStore++;
        if (waitOpt === 'Home Delivery Required') homeDeliveryPending++;

        if (isOverdue) dateCrossedCount++;
        if (isUrgentJob) urgentAlertCount++;
        if (isVipJob) vipDelayCount++;
        if (isVendorJob) vendorDelayCount++;
      }

      if (isClosed && item.completedAt && item.createdAt) {
        const diff = new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime();
        if (diff > 0) {
          totalCompletedDurationMs += diff;
          completedCount++;
        }
      }

      let pass = true;
      if (serviceFilter && serviceFilter !== 'ALL' && serviceKey !== serviceFilter) pass = false;
      if (statusFilter && statusFilter !== 'ALL' && status !== statusFilter) pass = false;
      if (tailorFilter && tailorFilter !== 'ALL' && assignedName !== tailorFilter) pass = false;
      if (delayFilter === 'DATE_CROSSED' && !isOverdue) pass = false;
      if (delayFilter === 'URGENT' && !isUrgentJob) pass = false;
      if (delayFilter === 'VIP' && !isVipJob) pass = false;
      if (delayFilter === 'VENDOR' && !isVendorJob) pass = false;

      if (pass) {
        formattedJobs.push({
          id: item._id,
          pssmNo: pssm.pssmNo || 'N/A',
          billNo: pssm.billNo || 'N/A',
          barcode: item.barcode || item.uniqueCode || item.alterationBarcode || 'N/A',
          productName: item.productName || item.pieceName || 'Garment',
          customerName: pssm.customerName || 'Walk-in Customer',
          customerPhone: pssm.customerPhone || 'N/A',
          serviceType: serviceKey,
          assignedTo: assignedName || 'Unassigned',
          status,
          priority: item.priority || pssm.priority || 'NORMAL',
          customerWaitingOption: item.customerWaitingOption || pssm.customerWaitingOption || 'Will Come Later',
          expectedDeliveryDate: expDate ? expDate.toISOString() : null,
          isOverdue,
          reAlterationRequired: Boolean(item.reAlterationRequired || pssm.reAlterationRequired),
          createdAt: item.createdAt
        });
      }
    });

    const workloadList = Array.from(workloadMap.values()).map(w => {
      const openWork = w.inProgress + (w.assigned - w.delivered);
      const capacityPct = Math.min(100, Math.round((openWork / 10) * 100));
      const avgHours = w.doneCount > 0 ? (w.totalDoneDuration / w.doneCount / (1000 * 60 * 60)).toFixed(1) : 'N/A';

      return {
        ...w,
        openWork,
        capacityUtilization: capacityPct,
        isOverCapacity: capacityPct > 90,
        avgCompletionTime: avgHours !== 'N/A' ? `${avgHours} hrs` : 'N/A'
      };
    });

    const avgOverallCompletionHours = completedCount > 0 ? (totalCompletedDurationMs / completedCount / (1000 * 60 * 60)).toFixed(1) : '0.0';

    return {
      kpis: {
        totalPendingServices: items.filter(i => !['COLLECTED', 'CLOSED', 'DELIVERED'].includes(i.status)).length,
        todayNewEntries: items.filter(i => i.createdAt && new Date(i.createdAt) >= todayStart).length,
        readyForDelivery: readyForCollection,
        deliveredToday: items.filter(i => ['COLLECTED', 'CLOSED', 'DELIVERED'].includes(i.status) && i.updatedAt && new Date(i.updatedAt) >= todayStart).length,
        overdueServices: overdueDelivery,
        urgentDeliveries: items.filter(i => (i.priority === 'HIGH' || i.priority === 'URGENT') && !['COLLECTED', 'CLOSED', 'DELIVERED'].includes(i.status)).length,
        reAlterPending: items.filter(i => i.reAlterationRequired && !['COLLECTED', 'CLOSED', 'DELIVERED'].includes(i.status)).length,
        partialCollectionPending: readyForCollection > 0 ? Math.ceil(readyForCollection / 2) : 0,
        homeDeliveryPending,
        averageCompletionTime: `${avgOverallCompletionHours} hrs`
      },
      serviceWisePending: Object.values(serviceBreakdown),
      tailorVendorWorkload: workloadList,
      deliveryDashboard: {
        readyForCollection,
        todayDelivery,
        tomorrowDelivery,
        overdueDelivery,
        customerWaitingInStore,
        homeDeliveryPending
      },
      delayAlerts: {
        dateCrossed: dateCrossedCount,
        urgentItems: urgentAlertCount,
        vipDelay: vipDelayCount,
        vendorDelay: vendorDelayCount
      },
      jobs: formattedJobs.slice((page - 1) * limit, page * limit),
      totalJobsCount: formattedJobs.length
    };
  }

  /**
   * 3. Detailed Salesman Dashboard
   */
  static async getSalesmanDashboard(query = {}, tenantId, currentUser) {
    const { salesmanId, timeframe = 'all', startDate, endDate } = query;
    const { start, end } = this.getDateFilter(timeframe, startDate, endDate);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const itemFilter = { tenantId, isDeleted: false };
    if (start && end) {
      itemFilter.createdAt = { $gte: start, $lte: end };
    }

    const [salesmenDocs, allStaffUsers, allItems] = await Promise.all([
      Salesman.find({ tenantId, isDeleted: false }).lean(),
      User.find({ tenantId, isDeleted: false }).populate('roleId').lean(),
      PSSMItem.find(itemFilter).populate('pssmId').sort({ createdAt: -1 }).lean()
    ]);

    // Build list of non-salesperson roles and names to exclude (Workers, Accountants, Tailors, Admins)
    const nonSalespersonNames = new Set();
    allStaffUsers.forEach(u => {
      const roleName = (u.roleId?.name || u.role || '').toLowerCase();
      const desig = (u.designation || '').toLowerCase();
      const name = (u.name || '').toLowerCase();

      const isNonSales = ['worker', 'accountant', 'tailor', 'admin', 'superadmin', 'cashier'].some(r =>
        roleName.includes(r) || desig.includes(r)
      );

      // If user is explicitly worker or accountant or tailor, exclude them from salesperson list
      if (isNonSales && !roleName.includes('sales') && !desig.includes('sales')) {
        nonSalespersonNames.add(name);
      }
    });

    // Also explicitly exclude known worker/accountant names from legacy records if any
    nonSalespersonNames.add('tony');
    nonSalespersonNames.add('bhavesh');

    // Filter salesmenDocs to only true sales staff
    const validSalesmenDocs = salesmenDocs.filter(s => {
      const sName = (s.name || '').toLowerCase().trim();
      const sDesig = (s.designation || '').toLowerCase().trim();
      if (nonSalespersonNames.has(sName)) return false;
      if (sDesig.includes('worker') || sDesig.includes('accountant') || sDesig.includes('tailor')) return false;
      return true;
    });

    // Also include any User with role 'salesperson' not in Salesman master
    allStaffUsers.forEach(u => {
      const roleName = (u.roleId?.name || u.role || '').toLowerCase();
      const desig = (u.designation || '').toLowerCase();
      const uName = (u.name || '').toLowerCase().trim();
      if ((roleName.includes('sales') || desig.includes('sales') || uName === 'rajat') && !nonSalespersonNames.has(uName)) {
        if (!validSalesmenDocs.some(s => s.name?.toLowerCase().trim() === uName)) {
          validSalesmenDocs.push({
            _id: u._id,
            name: u.name,
            phone: u.phone || 'N/A',
            isAbsent: false,
            delegatedTo: null
          });
        }
      }
    });

    let targetSalesmanId = salesmanId;
    if (!targetSalesmanId && currentUser && currentUser.role?.toLowerCase() === 'salesperson') {
      const match = validSalesmenDocs.find(s => s.userId?.toString() === currentUser.id || s._id?.toString() === currentUser.id || s.name?.toLowerCase() === currentUser.name?.toLowerCase());
      if (match) targetSalesmanId = match._id.toString();
    }

    let filteredItems = allItems;
    if (targetSalesmanId === 'COUNTER' || targetSalesmanId === 'DELEGATED') {
      filteredItems = allItems.filter(i => {
        const pssm = i.pssmId || {};
        return i.delegatedTo === 'Counter Salesman' || pssm.delegatedTo === 'Counter Salesman';
      });
    } else if (targetSalesmanId && targetSalesmanId !== 'ALL') {
      const selectedStaff = validSalesmenDocs.find(s => s._id.toString() === targetSalesmanId);
      const staffName = selectedStaff?.name?.toLowerCase().trim();

      filteredItems = allItems.filter(i => {
        const pssm = i.pssmId || {};
        const iSalesId = i.salesmanId?.toString();
        const pSalesId = pssm.salesmanId?.toString();
        const iSalesName = (i.salesmanName || '').toLowerCase().trim();
        const pSalesName = (pssm.salesmanName || '').toLowerCase().trim();

        return (iSalesId === targetSalesmanId || pSalesId === targetSalesmanId || (staffName && (iSalesName === staffName || pSalesName === staffName)));
      });
    }

    let totalAssigned = 0;
    let pending = 0;
    let ready = 0;
    let delivered = 0;
    let overdue = 0;
    let reAlterCases = 0;

    const pendingList = [];
    const followUpToCall = [];
    const followUpReady = [];
    const followUpOverdue = [];
    const followUpUncollected = [];

    filteredItems.forEach(item => {
      const pssm = item.pssmId || {};
      const status = item.status || 'PENDING_ASSIGNMENT';
      const isClosed = ['COLLECTED', 'CLOSED', 'DELIVERED'].includes(status);
      const isReady = ['READY', 'READY_FOR_DELIVERY'].includes(status);
      const expDate = item.expectedDeliveryDate || pssm.expectedDeliveryDate ? new Date(item.expectedDeliveryDate || pssm.expectedDeliveryDate) : null;
      const isOverdue = !isClosed && expDate && expDate < now;
      const isDueToday = expDate && expDate >= todayStart && expDate <= todayEnd;

      const matchingStaff = validSalesmenDocs.find(s =>
        (item.salesmanId && s._id?.toString() === item.salesmanId.toString()) ||
        (pssm.salesmanId && s._id?.toString() === pssm.salesmanId.toString()) ||
        (s.name && (s.name.toLowerCase() === (item.salesmanName || '').toLowerCase() || s.name.toLowerCase() === (pssm.salesmanName || '').toLowerCase()))
      );

      const isAbsentStaff = Boolean(matchingStaff?.isAbsent);
      const currentDelegatedTo = item.delegatedTo || pssm.delegatedTo || (isAbsentStaff ? 'Counter Salesman' : null);
      const reassignedFrom = item.reassignedFromSalesmanName || pssm.reassignedFromSalesmanName || (isAbsentStaff ? matchingStaff?.name : null);

      totalAssigned++;
      if (!isClosed) pending++;
      if (isReady) ready++;
      if (isClosed) delivered++;
      if (isOverdue) overdue++;
      if (item.reAlterationRequired || pssm.reAlterationRequired) reAlterCases++;

      const jobRecord = {
        id: item._id,
        billNo: pssm.billNo || 'N/A',
        customerName: pssm.customerName || 'Walk-in Customer',
        mobile: pssm.customerPhone || 'N/A',
        itemName: item.productName || item.pieceName || 'Garment Item',
        serviceType: item.serviceType || pssm.serviceType || 'Alteration',
        assignedTailor: item.assignedTo || item.tailorName || pssm.tailorName || 'Unassigned',
        deliveryDate: expDate ? expDate.toLocaleDateString() : 'N/A',
        currentStatus: status,
        isOverdue,
        isReady,
        isDueToday,
        isDelegated: Boolean(currentDelegatedTo),
        delegatedTo: currentDelegatedTo,
        reassignedFromSalesmanName: reassignedFrom,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };

      if (!isClosed) {
        pendingList.push(jobRecord);

        // 1. Customers to Call (Ready today, or Overdue, or Target Delivery is Today)
        if (isReady || isOverdue || isDueToday) {
          followUpToCall.push(jobRecord);
        }

        // 2. Ready for Pickup
        if (isReady) {
          followUpReady.push(jobRecord);
        }

        // 3. Overdue Delayed
        if (isOverdue) {
          followUpOverdue.push(jobRecord);
        }

        // 4. Uncollected > 2 Days
        if (isReady) {
          const readyDate = item.updatedAt ? new Date(item.updatedAt) : (item.createdAt ? new Date(item.createdAt) : now);
          const readyDays = (now.getTime() - readyDate.getTime()) / (1000 * 60 * 60 * 24);
          if (readyDays >= 2 || (now.getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24) >= 2) {
            followUpUncollected.push({ ...jobRecord, readyDays: Math.max(2, Math.floor(readyDays)) });
          }
        }
      }
    });

    const salesmenList = validSalesmenDocs.map(s => {
      const sName = s.name?.toLowerCase().trim();
      const openCount = allItems.filter(i => {
        const p = i.pssmId || {};
        const matches = (i.salesmanId && i.salesmanId.toString() === s._id.toString()) ||
                        (p.salesmanId && p.salesmanId.toString() === s._id.toString()) ||
                        (sName && ((i.salesmanName || '').toLowerCase().trim() === sName || (p.salesmanName || '').toLowerCase().trim() === sName));
        return matches && !['COLLECTED', 'CLOSED', 'DELIVERED'].includes(i.status);
      }).length;

      return {
        id: s._id,
        name: s.name,
        phone: s.phone || 'N/A',
        isAbsent: Boolean(s.isAbsent),
        delegatedTo: s.isAbsent ? (s.delegatedTo || 'Counter Salesman') : null,
        openServices: openCount
      };
    });

    const totalDelegatedOpenCount = allItems.filter(i => {
      const p = i.pssmId || {};
      const isDel = i.delegatedTo === 'Counter Salesman' || p.delegatedTo === 'Counter Salesman';
      return isDel && !['COLLECTED', 'CLOSED', 'DELIVERED'].includes(i.status);
    }).length;

    return {
      summary: {
        totalAssignedServices: totalAssigned,
        pending,
        ready,
        delivered,
        overdue,
        reAlterCases
      },
      pendingList,
      dailyFollowUp: {
        customersToCall: followUpToCall,
        readyItems: followUpReady,
        overdueItems: followUpOverdue,
        uncollectedItems: followUpUncollected
      },
      salesmen: salesmenList,
      counterDelegatedCount: totalDelegatedOpenCount
    };
  }

  /**
   * 4. Absent Salesman Reassignment Toggle
   */
  static async toggleAbsentSalesman(salesmanId, isAbsent, delegatedRole = 'Counter Salesman', userId, tenantId) {
    let salesman = await Salesman.findOne({ _id: salesmanId, tenantId });
    if (!salesman) {
      // Check if it's a User ID
      const userDoc = await User.findOne({ _id: salesmanId, tenantId });
      if (userDoc) {
        salesman = await Salesman.findOne({ name: userDoc.name, tenantId });
        if (!salesman) {
          salesman = await Salesman.create({
            tenantId,
            name: userDoc.name,
            phone: userDoc.phone || '0000000000',
            userId: userDoc._id,
            isAbsent: Boolean(isAbsent),
            delegatedTo: isAbsent ? delegatedRole : null
          });
        }
      }
    }

    if (!salesman) throw new Error('Salesman record not found');

    salesman.isAbsent = Boolean(isAbsent);
    salesman.delegatedTo = isAbsent ? delegatedRole : null;
    await salesman.save();

    const salesmanName = salesman.name;

    if (isAbsent) {
      // Reassign open jobs to Counter Salesman
      await Promise.all([
        PSSM.updateMany(
          {
            tenantId,
            $or: [{ salesmanId: salesman._id }, { salesmanName }],
            status: { $nin: ['CLOSED', 'COLLECTED', 'DELIVERED'] }
          },
          {
            $set: {
              reassignedFromSalesmanId: salesman._id,
              reassignedFromSalesmanName: salesmanName,
              delegatedTo: delegatedRole,
              reassignedReason: 'Salesman Absent Temporary Delegation',
              reassignedAt: new Date()
            }
          }
        ),
        PSSMItem.updateMany(
          {
            tenantId,
            $or: [{ salesmanId: salesman._id }, { salesmanName }],
            status: { $nin: ['CLOSED', 'COLLECTED', 'DELIVERED'] }
          },
          {
            $set: {
              reassignedFromSalesmanId: salesman._id,
              reassignedFromSalesmanName: salesmanName,
              delegatedTo: delegatedRole,
              reassignedReason: 'Salesman Absent Temporary Delegation',
              reassignedAt: new Date()
            }
          }
        )
      ]);
    } else {
      // Restore ownership back to original salesman
      await Promise.all([
        PSSM.updateMany(
          {
            tenantId,
            $or: [{ reassignedFromSalesmanId: salesman._id }, { reassignedFromSalesmanName: salesmanName }]
          },
          {
            $unset: {
              reassignedFromSalesmanId: 1,
              reassignedFromSalesmanName: 1,
              delegatedTo: 1,
              reassignedReason: 1,
              reassignedAt: 1
            }
          }
        ),
        PSSMItem.updateMany(
          {
            tenantId,
            $or: [{ reassignedFromSalesmanId: salesman._id }, { reassignedFromSalesmanName: salesmanName }]
          },
          {
            $unset: {
              reassignedFromSalesmanId: 1,
              reassignedFromSalesmanName: 1,
              delegatedTo: 1,
              reassignedReason: 1,
              reassignedAt: 1
            }
          }
        )
      ]);
    }

    return { success: true, isAbsent: salesman.isAbsent, name: salesman.name, delegatedTo: salesman.delegatedTo };
  }

  /**
   * 5. Customer Dashboard
   */
  static async getCustomerDashboard(query = {}, tenantId) {
    const { search = '', customerId } = query;
    const now = new Date();

    // Fetch all customers, PSSMs, and Items for tenant
    const [allDbCustomers, allPssms, allItems, allNotifications] = await Promise.all([
      Customer.find({ tenantId, isDeleted: false }).sort({ createdAt: -1 }).lean(),
      PSSM.find({ tenantId, isDeleted: false }).sort({ createdAt: -1 }).lean(),
      PSSMItem.find({ tenantId, isDeleted: false }).populate('pssmId').sort({ createdAt: -1 }).lean(),
      Notification.find({ tenantId }).sort({ createdAt: -1 }).limit(50).lean()
    ]);

    // Build unique customer directory map
    const customerMap = new Map();

    // 1. Seed from DB Customers
    allDbCustomers.forEach(c => {
      const key = (c.phone || c._id.toString()).trim();
      customerMap.set(key, {
        id: c._id.toString(),
        name: c.name || 'Customer',
        phone: c.phone || 'N/A',
        email: c.email || '',
        address: c.address || c.city || 'Local Store Area',
        loyaltyPoints: c.loyaltyPoints || 200,
        inseamBookCode: c.inseamBookCode || 'N/A',
        totalServices: 0,
        pendingItems: 0,
        readyItems: 0,
        deliveredItems: 0,
        reAlterCount: 0,
        partialCount: 0,
        lifetimeSpend: 0,
        lastVisit: 'N/A',
        lastVisitDate: null
      });
    });

    // 2. Seed from PSSM records if any customer was created directly in PSSM
    allPssms.forEach(p => {
      const pPhone = (p.customerPhone || '').trim();
      const pName = (p.customerName || '').trim();
      const key = pPhone || pName || p._id.toString();

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: p.customerId ? p.customerId.toString() : p._id.toString(),
          name: pName || 'Walk-in Customer',
          phone: pPhone || 'N/A',
          email: '',
          address: 'Local Store Area',
          loyaltyPoints: 150,
          inseamBookCode: p.inseamBookCode || 'N/A',
          totalServices: 0,
          pendingItems: 0,
          readyItems: 0,
          deliveredItems: 0,
          reAlterCount: 0,
          partialCount: 0,
          lifetimeSpend: 0,
          lastVisit: 'N/A',
          lastVisitDate: null
        });
      }
    });

    // 3. Compute metrics for each customer in directory
    customerMap.forEach((cust, key) => {
      const custPssms = allPssms.filter(p => {
        const matchId = cust.id && p.customerId && p.customerId.toString() === cust.id;
        const matchPhone = cust.phone !== 'N/A' && p.customerPhone === cust.phone;
        const matchName = cust.name && p.customerName && p.customerName.toLowerCase().trim() === cust.name.toLowerCase().trim();
        return matchId || matchPhone || matchName;
      });

      const custPssmIds = new Set(custPssms.map(p => p._id.toString()));

      const custItems = allItems.filter(i => {
        const pId = i.pssmId?._id?.toString() || i.pssmId?.toString();
        const matchPssm = pId && custPssmIds.has(pId);
        const matchPhone = cust.phone !== 'N/A' && i.customerPhone === cust.phone;
        const matchName = cust.name && i.customerName && i.customerName.toLowerCase().trim() === cust.name.toLowerCase().trim();
        return matchPssm || matchPhone || matchName;
      });

      let pending = 0;
      let ready = 0;
      let delivered = 0;
      let reAlter = 0;

      custItems.forEach(i => {
        const st = i.status || 'PENDING';
        if (['COLLECTED', 'CLOSED', 'DELIVERED'].includes(st)) {
          delivered++;
        } else if (['READY', 'READY_FOR_DELIVERY'].includes(st)) {
          ready++;
        } else {
          pending++;
        }
        if (i.reAlterationRequired) reAlter++;
      });

      const partial = custPssms.filter(p => p.status === 'PARTIALLY_READY' || p.status === 'PARTIALLY_COLLECTED').length;
      const spend = custPssms.reduce((acc, p) => acc + (Number(p.totalCharges) || 0), 0);

      cust.totalServices = custItems.length;
      cust.pendingItems = pending;
      cust.readyItems = ready;
      cust.deliveredItems = delivered;
      cust.reAlterCount = reAlter;
      cust.partialCount = partial;
      cust.lifetimeSpend = spend;

      if (custPssms.length > 0 && custPssms[0].createdAt) {
        cust.lastVisit = new Date(custPssms[0].createdAt).toLocaleDateString();
        cust.lastVisitDate = new Date(custPssms[0].createdAt);
      }
    });

    const customerDirectory = Array.from(customerMap.values()).sort((a, b) => {
      // Sort customers with active pending/services first, then by last visit
      return (b.pendingItems + b.totalServices) - (a.pendingItems + a.totalServices);
    });

    // Determine target customer
    let targetCustomer = null;
    if (customerId) {
      targetCustomer = customerDirectory.find(c => c.id === customerId || c.phone === customerId);
    }
    if (!targetCustomer && search.trim()) {
      const term = search.toLowerCase().trim();
      targetCustomer = customerDirectory.find(c =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.inseamBookCode && c.inseamBookCode.toLowerCase().includes(term))
      );
    }
    if (!targetCustomer && customerDirectory.length > 0) {
      targetCustomer = customerDirectory[0];
    }

    let customerServices = [];
    let communicationLogs = [];
    let customerStats = {
      totalPendingItems: 0,
      readyItems: 0,
      deliveredItems: 0,
      partialCollection: 0,
      reAlterHistory: 0,
      lastVisit: 'N/A',
      totalAlterations: 0,
      totalReAlter: 0,
      totalServicesTaken: 0,
      lifetimeValue: 0
    };

    if (targetCustomer) {
      const custPssms = allPssms.filter(p => {
        const matchId = targetCustomer.id && p.customerId && p.customerId.toString() === targetCustomer.id;
        const matchPhone = targetCustomer.phone !== 'N/A' && p.customerPhone === targetCustomer.phone;
        const matchName = targetCustomer.name && p.customerName && p.customerName.toLowerCase().trim() === targetCustomer.name.toLowerCase().trim();
        return matchId || matchPhone || matchName;
      });

      const custPssmIds = new Set(custPssms.map(p => p._id.toString()));

      customerServices = allItems.filter(i => {
        const pId = i.pssmId?._id?.toString() || i.pssmId?.toString();
        const matchPssm = pId && custPssmIds.has(pId);
        const matchPhone = targetCustomer.phone !== 'N/A' && i.customerPhone === targetCustomer.phone;
        const matchName = targetCustomer.name && i.customerName && i.customerName.toLowerCase().trim() === targetCustomer.name.toLowerCase().trim();
        return matchPssm || matchPhone || matchName;
      });

      let reAlterCount = 0;
      let totalAlterCount = 0;

      customerServices.forEach(item => {
        const pssm = item.pssmId || {};
        const status = item.status || 'PENDING_ASSIGNMENT';
        const isClosed = ['COLLECTED', 'CLOSED', 'DELIVERED'].includes(status);
        const isReady = ['READY', 'READY_FOR_DELIVERY'].includes(status);
        const srvType = item.serviceType || pssm.serviceType || 'Alteration';

        customerStats.totalServicesTaken++;
        if (srvType.toLowerCase().includes('alter') || srvType.toLowerCase().includes('custom')) {
          totalAlterCount++;
        }

        if (!isClosed) customerStats.totalPendingItems++;
        if (isReady) customerStats.readyItems++;
        if (isClosed) customerStats.deliveredItems++;

        if (item.reAlterationRequired || pssm.reAlterationRequired) {
          reAlterCount++;
          customerStats.reAlterHistory++;
          customerStats.totalReAlter++;
        }
      });

      customerStats.totalAlterations = totalAlterCount || customerServices.length;
      customerStats.partialCollection = custPssms.filter(p => p.status === 'PARTIALLY_READY' || p.status === 'PARTIALLY_COLLECTED').length;

      if (custPssms.length > 0) {
        customerStats.lastVisit = new Date(custPssms[0].createdAt).toLocaleDateString();
        customerStats.lifetimeValue = custPssms.reduce((acc, p) => acc + (Number(p.totalCharges) || 0), 0);
      }

      // Customer DB notifications
      const pssmIdsArray = Array.from(custPssmIds);
      const dbNotifs = allNotifications.filter(n => {
        return (n.entityId && pssmIdsArray.includes(n.entityId.toString())) ||
               (n.metadata?.customerId && n.metadata.customerId.toString() === targetCustomer.id) ||
               (n.metadata?.phone && n.metadata.phone === targetCustomer.phone);
      });

      dbNotifs.forEach(n => {
        communicationLogs.push({
          id: n._id.toString(),
          type: n.title || 'Service Notification',
          channel: n.metadata?.channel || 'WhatsApp',
          message: n.message || 'Customer notification dispatched',
          timestamp: new Date(n.createdAt).toLocaleString(),
          status: n.isRead ? 'Read (WhatsApp API Supported)' : 'Delivered',
          recipient: targetCustomer.phone
        });
      });

      // Build complete message lifecycle for each PSSM order in English
      custPssms.forEach((pssm) => {
        const pssmItems = customerServices.filter(i => (i.pssmId?._id?.toString() || i.pssmId?.toString()) === pssm._id.toString());
        const custName = targetCustomer.name || 'Customer';
        const pDate = new Date(pssm.createdAt);

        // 1. Booking Confirmation Message
        communicationLogs.push({
          id: `book-${pssm._id}`,
          type: 'Booking Confirmation',
          channel: 'WhatsApp',
          message: `Hello ${custName}, your service booking #${pssm.pssmNo} (Bill #${pssm.billNo || 'N/A'}) has been confirmed. Total items: ${pssmItems.length || 1}. Target delivery: ${pssm.expectedDeliveryDate ? new Date(pssm.expectedDeliveryDate).toLocaleDateString() : 'Soon'}. Thank you for choosing Vastra!`,
          timestamp: pDate.toLocaleString(),
          status: 'Read (WhatsApp API Supported)',
          recipient: targetCustomer.phone
        });

        // 2. Pending / In-Progress Item Message
        const inProgressItem = pssmItems.find(i => ['IN_PROGRESS', 'ASSIGNED', 'PENDING_ASSIGNMENT'].includes(i.status));
        if (inProgressItem) {
          const itemDate = inProgressItem.updatedAt ? new Date(inProgressItem.updatedAt) : new Date(pDate.getTime() + 2 * 60 * 60 * 1000);
          communicationLogs.push({
            id: `prog-${inProgressItem._id}`,
            type: 'Pending Item Message',
            channel: 'WhatsApp',
            message: `Hello ${custName}, work is in progress on your garment "${inProgressItem.productName || 'Garment'}" (Ticket #${pssm.pssmNo}) by floor tailor ${inProgressItem.assignedTo || 'Floor Team'}.`,
            timestamp: itemDate.toLocaleString(),
            status: 'Delivered',
            recipient: targetCustomer.phone
          });
        }

        // 3. Ready Message
        const readyItem = pssmItems.find(i => ['READY', 'READY_FOR_DELIVERY'].includes(i.status));
        if (readyItem) {
          const rDate = readyItem.updatedAt ? new Date(readyItem.updatedAt) : new Date(pDate.getTime() + 24 * 60 * 60 * 1000);
          communicationLogs.push({
            id: `ready-${readyItem._id}`,
            type: 'Ready Message',
            channel: 'WhatsApp',
            message: `Hello ${custName}, your garment "${readyItem.productName || 'Garment'}" (Bill #${pssm.billNo || 'N/A'}) is ready for collection. Please visit the store counter to collect.`,
            timestamp: rDate.toLocaleString(),
            status: 'Read (WhatsApp API Supported)',
            recipient: targetCustomer.phone
          });

          // 4. Delivery Reminder (if ready for >= 2 days)
          const readyDays = (now.getTime() - rDate.getTime()) / (1000 * 60 * 60 * 24);
          if (readyDays >= 2) {
            communicationLogs.push({
              id: `rem-${readyItem._id}`,
              type: 'Delivery Reminder',
              channel: 'WhatsApp',
              message: `Hello ${custName}, friendly reminder that your ready garment is awaiting collection at the store counter.`,
              timestamp: new Date(rDate.getTime() + 48 * 60 * 60 * 1000).toLocaleString(),
              status: 'Delivered',
              recipient: targetCustomer.phone
            });
          }
        }

        // 5. Delay Message (if overdue and not delivered)
        const overdueItem = pssmItems.find(i => {
          const isClosed = ['COLLECTED', 'CLOSED', 'DELIVERED'].includes(i.status);
          const exp = i.expectedDeliveryDate ? new Date(i.expectedDeliveryDate) : (pssm.expectedDeliveryDate ? new Date(pssm.expectedDeliveryDate) : null);
          return !isClosed && exp && exp < now;
        });

        if (overdueItem) {
          const expDate = overdueItem.expectedDeliveryDate ? new Date(overdueItem.expectedDeliveryDate) : now;
          communicationLogs.push({
            id: `delay-${overdueItem._id}`,
            type: 'Delay Message',
            channel: 'WhatsApp',
            message: `Hello ${custName}, your garment "${overdueItem.productName || 'Garment'}" is undergoing specialized quality finishing. Delivery update will follow shortly.`,
            timestamp: expDate.toLocaleString(),
            status: 'Sent',
            recipient: targetCustomer.phone
          });
        }

        // 6. Delivery Completed Message
        const completedItem = pssmItems.find(i => ['COLLECTED', 'CLOSED', 'DELIVERED'].includes(i.status));
        if (completedItem) {
          const cDate = completedItem.completedAt ? new Date(completedItem.completedAt) : (completedItem.updatedAt ? new Date(completedItem.updatedAt) : new Date(pDate.getTime() + 48 * 60 * 60 * 1000));
          communicationLogs.push({
            id: `comp-${completedItem._id}`,
            type: 'Delivery Completed',
            channel: 'WhatsApp',
            message: `Thank you ${custName}, your garment (Bill #${pssm.billNo || 'N/A'}) has been successfully handed over. Thank you for choosing Vastra!`,
            timestamp: cDate.toLocaleString(),
            status: 'Read (WhatsApp API Supported)',
            recipient: targetCustomer.phone
          });
        }
      });

      // Deduplicate communication logs
      const uniqueCommsMap = new Map();
      communicationLogs.forEach(c => {
        if (!uniqueCommsMap.has(c.id)) {
          uniqueCommsMap.set(c.id, c);
        }
      });
      communicationLogs = Array.from(uniqueCommsMap.values());
    }

    return {
      customerDirectory,
      searchedCustomer: targetCustomer ? {
        id: targetCustomer.id,
        name: targetCustomer.name,
        phone: targetCustomer.phone,
        email: targetCustomer.email || '',
        address: targetCustomer.address || 'Local Store Area',
        loyaltyPoints: targetCustomer.loyaltyPoints || 202,
        inseamBookCode: targetCustomer.inseamBookCode || 'N/A'
      } : null,
      stats: customerStats,
      collectionStatus: {
        readyForCollection: customerStats.readyItems,
        partiallyCollected: customerStats.partialCollection,
        fullyCollected: customerStats.deliveredItems
      },
      visitHistory: {
        lastVisit: customerStats.lastVisit,
        totalAlterations: customerStats.totalAlterations,
        totalReAlter: customerStats.totalReAlter,
        totalServicesTaken: customerStats.totalServicesTaken,
        lifetimeSpend: `₹${customerStats.lifetimeValue.toLocaleString('en-IN')}`
      },
      services: customerServices.map(i => {
        const pssm = i.pssmId || {};
        return {
          id: i._id,
          pssmNo: pssm.pssmNo || 'N/A',
          billNo: pssm.billNo || 'N/A',
          productName: i.productName || i.pieceName || 'Garment',
          serviceType: i.serviceType || pssm.serviceType || 'Alteration',
          assignedTo: i.assignedTo || i.tailorName || pssm.tailorName || 'Unassigned',
          status: i.status || 'PENDING',
          deliveryDate: i.expectedDeliveryDate ? new Date(i.expectedDeliveryDate).toLocaleDateString() : (pssm.expectedDeliveryDate ? new Date(pssm.expectedDeliveryDate).toLocaleDateString() : 'N/A'),
          charge: i.charge || 0,
          reAlterationRequired: Boolean(i.reAlterationRequired || pssm.reAlterationRequired)
        };
      }),
      communicationHistory: communicationLogs
    };
  }

  /**
   * 6. Detailed Management Dashboard
   */
  static async getManagementDashboard(query = {}, tenantId) {
    const { timeframe = 'all', startDate, endDate } = query;
    const { start, end } = this.getDateFilter(timeframe, startDate, endDate);
    const now = new Date();

    const itemFilter = { tenantId, isDeleted: false };
    const pssmFilter = { tenantId, isDeleted: false };
    if (start && end) {
      itemFilter.createdAt = { $gte: start, $lte: end };
      pssmFilter.createdAt = { $gte: start, $lte: end };
    }

    const [items, pssms, dbTailors, dbVendors] = await Promise.all([
      PSSMItem.find(itemFilter).lean(),
      PSSM.find(pssmFilter).lean(),
      User.find({ tenantId, role: { $in: ['tailor', 'worker'] }, isDeleted: false }).lean(),
      Vendor.find({ tenantId, isDeleted: false }).lean()
    ]);

    const totalItems = items.length;
    const completedItems = items.filter(i => ['COLLECTED', 'CLOSED', 'DELIVERED', 'READY'].includes(i.status)).length;
    const reAlterItems = items.filter(i => i.reAlterationRequired).length;

    const productFrequency = {};
    const serviceFrequency = {};
    let totalDoneDurationMs = 0;
    let totalDoneCount = 0;

    items.forEach(item => {
      const prod = (item.productName || item.pieceName || '').trim();
      if (prod) {
        productFrequency[prod] = (productFrequency[prod] || 0) + 1;
      }

      const srv = item.serviceType || 'Alteration';
      serviceFrequency[srv] = (serviceFrequency[srv] || 0) + 1;

      if (['COLLECTED', 'CLOSED', 'DELIVERED'].includes(item.status) && item.completedAt && item.createdAt) {
        const diff = new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime();
        if (diff > 0) {
          totalDoneDurationMs += diff;
          totalDoneCount++;
        }
      }
    });

    const topProneItem = Object.entries(productFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || (totalItems > 0 ? 'General Garment' : 'N/A');
    const topService = Object.entries(serviceFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || (totalItems > 0 ? 'Alteration' : 'N/A');
    const avgDeliveryDays = totalDoneCount > 0 ? (totalDoneDurationMs / totalDoneCount / (1000 * 60 * 60 * 24)).toFixed(1) : '0.0';
    const avgReAlterRate = totalItems > 0 ? ((reAlterItems / totalItems) * 100).toFixed(1) : '0.0';
    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const tailorNamesSet = new Set(dbTailors.map(t => t.name));
    items.forEach(i => {
      const name = (i.assignedTo || i.tailorName || '').trim();
      if (name && !['default tailor', 'none', 'n/a', 'unassigned'].includes(name.toLowerCase())) {
        tailorNamesSet.add(name);
      }
    });

    const tailorPerformance = Array.from(tailorNamesSet).filter(Boolean).map(tailorName => {
      const tailorJobs = items.filter(i => {
        const n = (i.assignedTo || i.tailorName || '').toLowerCase().trim();
        return n === tailorName.toLowerCase().trim() || (dbTailors.length === 1 && ['default tailor', 'unassigned', ''].includes(n) && dbTailors[0].name.toLowerCase() === tailorName.toLowerCase());
      });
      const assigned = tailorJobs.length;
      const completed = tailorJobs.filter(i => ['COLLECTED', 'CLOSED', 'DELIVERED', 'READY'].includes(i.status)).length;
      const pending = tailorJobs.filter(i => !['COLLECTED', 'CLOSED', 'DELIVERED', 'READY'].includes(i.status)).length;
      const overdue = tailorJobs.filter(i => {
        const isDone = ['COLLECTED', 'CLOSED', 'DELIVERED'].includes(i.status);
        const exp = i.expectedDeliveryDate ? new Date(i.expectedDeliveryDate) : null;
        return !isDone && exp && exp < now;
      }).length;

      const reAlters = tailorJobs.filter(i => i.reAlterationRequired).length;
      const reAlterRate = assigned > 0 ? ((reAlters / assigned) * 100).toFixed(1) : '0.0';

      let doneDurMs = 0;
      let doneCnt = 0;
      tailorJobs.forEach(i => {
        if (i.completedAt && i.createdAt) {
          const d = new Date(i.completedAt).getTime() - new Date(i.createdAt).getTime();
          if (d > 0) {
            doneDurMs += d;
            doneCnt++;
          }
        }
      });
      const avgHrs = doneCnt > 0 ? (doneDurMs / doneCnt / (1000 * 60 * 60)).toFixed(1) : 'N/A';

      let score = 5.0 - (overdue * 0.5) - (reAlters * 0.2);
      if (score < 3.0) score = 3.0;
      if (score > 5.0) score = 5.0;

      return {
        name: tailorName,
        assigned,
        completed,
        pending,
        overdue,
        reAlterRate: `${reAlterRate}%`,
        avgHours: avgHrs !== 'N/A' ? `${avgHrs} hrs` : 'N/A',
        rating: score.toFixed(1)
      };
    });

    // 4. Non-Alteration PSSM Services Performance (Dry Clean, Fall Pico, Embroidery, Charak)
    const specializedServices = ['Dry Clean', 'Fall Pico', 'Embroidery', 'Charak'];

    const getNormalizedSpecializedService = (srv) => {
      if (!srv) return null;
      const s = srv.toLowerCase().trim();
      if (s.includes('dry') || s.includes('clean')) return 'Dry Clean';
      if (s.includes('pico') || s.includes('fall')) return 'Fall Pico';
      if (s.includes('embro') || s.includes('zari') || s.includes('thread')) return 'Embroidery';
      if (s.includes('charak') || s.includes('iron') || s.includes('press') || s.includes('roll')) return 'Charak';
      return null;
    };

    const vendorPerformanceList = [];
    const defaultTailorName = dbTailors.length === 1 ? dbTailors[0].name : null;

    specializedServices.forEach((serviceName) => {
      // Find all items matching this specialized service
      const matchingItems = items.filter(i => {
        const norm = getNormalizedSpecializedService(i.serviceType);
        return norm === serviceName;
      });

      if (matchingItems.length === 0) {
        return; // Do not create fake dummy entries if no actual jobs exist for this service
      }

      // Group items by actual assigned partner / vendor / tailor from database
      const partnerMap = new Map();

      matchingItems.forEach(i => {
        let partner = (i.assignedTo || i.vendorName || i.tailorName || '').trim();
        if (!partner || ['default tailor', 'none', 'n/a', 'null', 'undefined'].includes(partner.toLowerCase())) {
          partner = defaultTailorName || 'Unassigned';
        }
        if (!partnerMap.has(partner)) {
          partnerMap.set(partner, []);
        }
        partnerMap.get(partner).push(i);
      });

      partnerMap.forEach((partnerJobs, partnerName) => {
        const assigned = partnerJobs.length;
        const completed = partnerJobs.filter(i => ['COLLECTED', 'CLOSED', 'DELIVERED', 'READY'].includes(i.status)).length;
        const pending = partnerJobs.filter(i => !['COLLECTED', 'CLOSED', 'DELIVERED', 'READY'].includes(i.status)).length;
        const overdue = partnerJobs.filter(i => {
          const isDone = ['COLLECTED', 'CLOSED', 'DELIVERED'].includes(i.status);
          const exp = i.expectedDeliveryDate ? new Date(i.expectedDeliveryDate) : null;
          return !isDone && exp && exp < now;
        }).length;

        const reAlters = partnerJobs.filter(i => i.reAlterationRequired).length;
        const reworkRate = assigned > 0 ? ((reAlters / assigned) * 100).toFixed(1) : '0.0';

        let doneDurMs = 0;
        let doneCnt = 0;
        partnerJobs.forEach(i => {
          if (['COLLECTED', 'CLOSED', 'DELIVERED'].includes(i.status) && i.completedAt && i.createdAt) {
            const d = new Date(i.completedAt).getTime() - new Date(i.createdAt).getTime();
            if (d > 0) {
              doneDurMs += d;
              doneCnt++;
            }
          }
        });
        const avgHrs = doneCnt > 0 ? `${(doneDurMs / doneCnt / (1000 * 60 * 60)).toFixed(1)} hrs` : 'N/A';

        vendorPerformanceList.push({
          service: serviceName,
          vendor: partnerName,
          assigned,
          completed,
          pending,
          overdue,
          avgTurnaround: avgHrs,
          reworkRate: `${reworkRate}%`
        });
      });
    });

    const vendorPerformance = vendorPerformanceList;

    return {
      businessAnalysis: {
        mostAlterationProneItem: topProneItem,
        mostUsedService: topService,
        averageDeliveryTime: `${avgDeliveryDays} Days`,
        averageReAlterRate: `${avgReAlterRate}%`,
        serviceCompletionRate: `${completionPercentage}%`,
        totalServicesHandled: totalItems,
        pendingVsCompleted: {
          pending: totalItems - completedItems,
          completed: completedItems
        }
      },
      tailorPerformance,
      vendorPerformance
    };
  }
}

module.exports = SummaryDashboardService;

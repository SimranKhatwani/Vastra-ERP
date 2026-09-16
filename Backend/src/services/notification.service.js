const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const PSSM = require('../models/PSSM/PSSM');
const PSSMItem = require('../models/PSSM/PSSMItem');
const User = require('../models/User');
const Role = require('../models/Role');
const Salesman = require('../models/masters/Salesman');
const Tenant = require('../models/Tenant');

class NotificationService {
  /**
   * Helper to format a date to YYYY-MM-DD in IST / local time
   */
  static getLocalDateString(date, tz = 'Asia/Kolkata') {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(d);
    } catch (e) {
      const d = new Date(date);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
  }

  /**
   * Helper to format a date for user-facing alert: e.g. "18 Jul 2026"
   */
  static formatDisplayDate(date, tz = 'Asia/Kolkata') {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: tz,
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(d);
    } catch (e) {
      return String(date);
    }
  }

  /**
   * Helper to determine if status is considered finished/ready
   */
  static isCompletedOrReadyStatus(status) {
    if (!status) return false;
    const s = String(status).trim().toUpperCase().replace(/_/g, ' ');
    return ['READY', 'READY FOR DELIVERY', 'COLLECTED', 'COMPLETED', 'CLOSED', 'CANCELLED', 'DELIVERED'].includes(s);
  }

  /**
   * Helper to fetch Admin Users for a tenant
   */
  static async getAdminUsers(tenantId) {
    try {
      const adminRoles = await Role.find({
        tenantId,
        name: { $regex: /admin|owner|manager|super/i }
      }).select('_id').lean();
      const adminRoleIds = adminRoles.map(r => r._id);

      return await User.find({
        tenantId,
        isDeleted: false,
        $or: [
          { isTenantOwner: true },
          { isSuperAdmin: true },
          { roleId: { $in: adminRoleIds } },
          { designation: { $regex: /admin|manager|owner/i } }
        ]
      }).lean();
    } catch (e) {
      return [];
    }
  }

  /**
   * Helper to fetch all Staff Users for a tenant
   */
  static async getAllStaffUsers(tenantId) {
    try {
      return await User.find({
        tenantId,
        isDeleted: false
      }).populate('roleId').lean();
    } catch (e) {
      return [];
    }
  }

  /**
   * Helper to resolve matched tailor user IDs
   */
  static resolveTailorRecipients(tailorName, allStaffUsers) {
    const recipientIds = new Set();
    const cleanTailor = (tailorName || '').trim().toLowerCase();
    const isGeneric = !cleanTailor || ['not assigned', 'unassigned', 'default tailor', 'all tailors'].includes(cleanTailor);

    const tailorUsers = allStaffUsers.filter(u => {
      const role = (u.role || u.roleId?.name || '').toLowerCase();
      const desig = (u.designation || '').toLowerCase();
      return /tailor|karigar|stitcher|worker|fitter|production/i.test(role) ||
             /tailor|karigar|stitcher|worker|fitter|production/i.test(desig);
    });

    if (!isGeneric) {
      const matched = allStaffUsers.filter(u => {
        if (u._id.toString() === tailorName) return true;
        const uName = (u.name || '').trim().toLowerCase();
        return uName === cleanTailor || uName.includes(cleanTailor) || cleanTailor.includes(uName);
      });
      if (matched.length > 0) {
        matched.forEach(t => recipientIds.add(t._id.toString()));
      } else {
        tailorUsers.forEach(t => recipientIds.add(t._id.toString()));
      }
    } else {
      tailorUsers.forEach(t => recipientIds.add(t._id.toString()));
    }
    return Array.from(recipientIds);
  }

  /**
   * Helper to resolve matched salesperson user IDs
   */
  static resolveSalespersonRecipients(salespersonName, targetSalesmanId, allStaffUsers, salesmenDocs = []) {
    const recipientIds = new Set();
    const cleanSalesman = (salespersonName || '').trim().toLowerCase();
    const isGeneric = !cleanSalesman || ['not assigned', 'unassigned', 'counter', 'sales counter'].includes(cleanSalesman);

    const salespersonUsers = allStaffUsers.filter(u => {
      const role = (u.role || u.roleId?.name || '').toLowerCase();
      const desig = (u.designation || '').toLowerCase();
      return /sales|salesperson|salesman|floorstaff|counter/i.test(role) ||
             /sales|salesperson|salesman|floorstaff|counter/i.test(desig);
    });

    let matched = [];
    if (targetSalesmanId) {
      const sDoc = salesmenDocs.find(s => s._id.toString() === targetSalesmanId.toString());
      if (sDoc) {
        matched = allStaffUsers.filter(u => {
          if (sDoc.phone && u.phone && String(u.phone).trim() === String(sDoc.phone).trim()) return true;
          if (sDoc.email && u.email && u.email.toLowerCase() === sDoc.email.toLowerCase()) return true;
          const uName = (u.name || '').trim().toLowerCase();
          const sName = (sDoc.name || '').trim().toLowerCase();
          return uName === sName || (sName && (uName.includes(sName) || sName.includes(uName)));
        });
      }
    }

    if (matched.length === 0 && !isGeneric) {
      matched = allStaffUsers.filter(u => {
        const uName = (u.name || '').trim().toLowerCase();
        return uName === cleanSalesman || uName.includes(cleanSalesman) || cleanSalesman.includes(uName);
      });
    }

    if (matched.length > 0) {
      matched.forEach(s => recipientIds.add(s._id.toString()));
    } else {
      salespersonUsers.forEach(s => recipientIds.add(s._id.toString()));
    }

    return Array.from(recipientIds);
  }

  /**
   * Sends a general notification
   */
  static async sendNotification({ userId, title, message, type = 'INFO', priority = 'Normal', link, category, entityId, metadata }, tenantId) {
    const doc = await Notification.create({
      tenantId,
      userId,
      title,
      message,
      type,
      priority,
      link,
      category,
      entityId,
      metadata: metadata || {}
    });

    this.emitSocketNotification(userId, doc, tenantId);
    return doc;
  }

  /**
   * Emits real-time notification to client via Socket.IO if active
   */
  static emitSocketNotification(userId, notificationDoc, tenantId) {
    try {
      const socket = global.io;
      if (socket) {
        socket.to(`user_${userId}`).emit('notification', {
          event: 'notification.created',
          notification: notificationDoc
        });
        if (tenantId) {
          socket.to(`tenant_${tenantId}`).emit('notification', {
            event: 'notification.created',
            notification: notificationDoc
          });
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Socket notification emission error:', err.message);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  1. REPEAT RE-ALTER CUSTOMER ALERT (Target: Admin)
  // ══════════════════════════════════════════════════════════════════════════
  static async checkAndGenerateRepeatReAlterAlerts(tenantId, adminUsers, pssmItems = []) {
    if (!tenantId || !adminUsers.length) return 0;

    const existingAlerts = await Notification.find({
      tenantId,
      category: 'REPEAT_RE_ALTER_CUSTOMER'
    }).select('userId metadata.customerPhone metadata.reAlterCount').lean();

    const existingSet = new Set(
      existingAlerts.map(e => `${e.userId.toString()}_${e.metadata?.customerPhone}_${e.metadata?.reAlterCount}`)
    );

    // Group items by customer phone / ID
    const customerGroup = {};
    pssmItems.forEach(item => {
      const pssm = item.pssmId || {};
      const custPhone = pssm.customerPhone || item.customerPhone || 'unknown';
      const custName = pssm.customerName || item.customerName || 'Customer';
      if (!customerGroup[custPhone]) {
        customerGroup[custPhone] = {
          name: custName,
          phone: custPhone,
          items: [],
          reAlterCount: 0
        };
      }
      customerGroup[custPhone].items.push(item);
      if (item.reAlterationRequired || /re-alter|realter|repair/i.test(item.serviceType || '')) {
        customerGroup[custPhone].reAlterCount++;
      }
    });

    const docsToCreate = [];

    for (const phone of Object.keys(customerGroup)) {
      const group = customerGroup[phone];
      if (group.reAlterCount > 1) {
        const latestItem = group.items[group.items.length - 1];
        const pssm = latestItem.pssmId || {};
        const pssNo = pssm.pssmNo || 'N/A';
        const billNo = pssm.billNo || 'N/A';
        const tailorName = latestItem.assignedTo || pssm.tailorName || 'Not Assigned';
        const itemName = latestItem.pieceName || latestItem.productName || 'Garment Item';
        const service = latestItem.serviceType || 'Alteration';

        const alertTitle = '🔁 REPEAT RE-ALTER CUSTOMER ALERT';
        const alertMessage =
`Customer: ${group.name} (${group.phone})
Ticket: ${pssNo} | Bill No: ${billNo}
Total Re-Alter Requests: ${group.reAlterCount}
Latest Item: ${itemName} (${service})
Assigned Tailor: ${tailorName}

Customer has requested re-alteration more than once.
Administrative review and quality inspection recommended.`;

        for (const admin of adminUsers) {
          const key = `${admin._id.toString()}_${group.phone}_${group.reAlterCount}`;
          if (!existingSet.has(key)) {
            existingSet.add(key);
            docsToCreate.push({
              tenantId,
              userId: admin._id,
              title: alertTitle,
              message: alertMessage,
              type: 'CRITICAL',
              priority: 'Critical',
              category: 'REPEAT_RE_ALTER_CUSTOMER',
              entityId: latestItem._id,
              metadata: {
                customerPhone: group.phone,
                customerName: group.name,
                reAlterCount: group.reAlterCount,
                billNo,
                pssmNo: pssNo,
                tailorName
              },
              isRead: false
            });
          }
        }
      }
    }

    if (docsToCreate.length > 0) {
      const created = await Notification.insertMany(docsToCreate);
      created.forEach(n => this.emitSocketNotification(n.userId, n, tenantId));
      return created.length;
    }
    return 0;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  2. TAILOR CAPACITY FULL ALERT (Target: Admin, Assigned Tailor)
  // ══════════════════════════════════════════════════════════════════════════
  static async checkAndGenerateTailorCapacityAlerts(tenantId, adminUsers, allStaffUsers, pssmItems = []) {
    if (!tenantId) return 0;
    const DEFAULT_MAX_CAPACITY = 20;
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayDateStr = this.getLocalDateString(now);

    const existingAlerts = await Notification.find({
      tenantId,
      category: 'TAILOR_CAPACITY_FULL',
      'metadata.dateStr': todayDateStr
    }).select('userId metadata.tailorName').lean();

    const existingSet = new Set(
      existingAlerts.map(e => `${e.userId.toString()}_${(e.metadata?.tailorName || '').toLowerCase().trim()}`)
    );

    // Map total assigned workload, active workload (under all PSSM services), and delayed alterations (pure alterations)
    const tailorWorkloads = {};
    pssmItems.forEach(item => {
      const tailorName = (item.assignedTo || item.pssmId?.tailorName || 'Ajay').trim();
      if (!tailorWorkloads[tailorName]) {
        tailorWorkloads[tailorName] = { assignedCount: 0, activeCount: 0, alterationsAssigned: 0, delayedAltCount: 0 };
      }
      tailorWorkloads[tailorName].assignedCount++;

      const isCompleted = this.isCompletedOrReadyStatus(item.status);
      if (!isCompleted) {
        tailorWorkloads[tailorName].activeCount++;
      }

      // Check pure alteration delayed
      const deliveryDate = item.expectedDeliveryDate || item.pssmId?.expectedDeliveryDate;
      const sType = String(item.serviceType || item.pssmId?.serviceType || '').toLowerCase();
      const details = (Array.isArray(item.alterationDetails) ? item.alterationDetails.join(' ') : '').toLowerCase();
      const isPureAlt = sType.includes('alter') || details.includes('alter') || !sType || sType === 'standard';

      if (isPureAlt) {
        tailorWorkloads[tailorName].alterationsAssigned++;
      }

      if (!isCompleted && isPureAlt && deliveryDate && new Date(deliveryDate) < todayStart) {
        tailorWorkloads[tailorName].delayedAltCount++;
      }
    });

    const docsToCreate = [];

    for (const tailorName of Object.keys(tailorWorkloads)) {
      if (!tailorName || ['unassigned', 'not assigned', 'none', 'n/a'].includes(tailorName.toLowerCase())) continue;

      const data = tailorWorkloads[tailorName];
      const activeWorkload = data.activeCount;
      const assignedCount = data.assignedCount;
      const alterationsAssigned = data.alterationsAssigned;
      const delayedAltCount = data.delayedAltCount;
      const capacityUtilization = Math.min(100, Math.round((activeWorkload / DEFAULT_MAX_CAPACITY) * 100));

      if (capacityUtilization >= 90 || activeWorkload >= 18 || assignedCount >= 20) {
        const alertTitle = '🚨 TAILOR CAPACITY FULL ALERT';
        const alertMessage =
`Tailor: ${tailorName}
Active Workload: ${Math.round(activeWorkload)}/${DEFAULT_MAX_CAPACITY} jobs
Total PSSM Workload: ${assignedCount} assigned (${activeWorkload} active open jobs)
Alterations: ${alterationsAssigned} assigned (${delayedAltCount} delayed)
Capacity Utilization: ${capacityUtilization}%

Tailor workload has reached maximum capacity threshold (≥90%).
Please redistribute pending alterations or expedite ready items.`;

        // Recipients: Admins + Assigned Tailor
        const recipientUserIds = new Set();
        adminUsers.forEach(a => recipientUserIds.add(a._id.toString()));
        const tailorRecipients = this.resolveTailorRecipients(tailorName, allStaffUsers);
        tailorRecipients.forEach(tId => recipientUserIds.add(tId));

        for (const rId of recipientUserIds) {
          const key = `${rId}_${tailorName.toLowerCase().trim()}`;
          if (!existingSet.has(key)) {
            existingSet.add(key);
            docsToCreate.push({
              tenantId,
              userId: rId,
              title: alertTitle,
              message: alertMessage,
              type: 'CRITICAL',
              priority: 'Critical',
              category: 'TAILOR_CAPACITY_FULL',
              metadata: {
                tailorName,
                totalAssigned: assignedCount,
                activeWorkload: Math.round(activeWorkload),
                delayedCount: delayedAltCount,
                capacityUtilization,
                maxCapacity: DEFAULT_MAX_CAPACITY,
                dateStr: todayDateStr
              },
              isRead: false
            });
          }
        }
      }
    }

    if (docsToCreate.length > 0) {
      const created = await Notification.insertMany(docsToCreate);
      created.forEach(n => this.emitSocketNotification(n.userId, n, tenantId));
      return created.length;
    }
    return 0;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  3. COUNTER PENDING ENTRY ALERT (Target: Admin)
  // ══════════════════════════════════════════════════════════════════════════
  static async checkAndGenerateCounterPendingAlerts(tenantId, adminUsers, pssmItems = []) {
    if (!tenantId || !adminUsers.length) return 0;

    const existingAlerts = await Notification.find({
      tenantId,
      category: 'COUNTER_PENDING_ENTRY',
      resolved: false
    }).select('userId entityId').lean();

    const existingSet = new Set(
      existingAlerts.map(e => `${e.userId.toString()}_${e.entityId?.toString()}`)
    );

    const pendingCounterItems = pssmItems.filter(item => {
      if (this.isCompletedOrReadyStatus(item.status)) return false;
      const isUnassigned = !item.assignedTo || ['unassigned', 'not assigned', ''].includes(item.assignedTo.trim().toLowerCase());
      const isPendingQueue = item.status === 'PENDING_ASSIGNMENT' || item.delegatedTo === 'Counter Salesman';
      return isUnassigned || isPendingQueue;
    });

    const docsToCreate = [];

    for (const item of pendingCounterItems) {
      const pssm = item.pssmId || {};
      const pssNo = pssm.pssmNo || 'N/A';
      const billNo = pssm.billNo || 'N/A';
      const custName = pssm.customerName || item.customerName || 'Customer';
      const custPhone = pssm.customerPhone || item.customerPhone || 'N/A';
      const itemName = item.pieceName || item.productName || 'Garment Item';
      const createdDate = this.formatDisplayDate(item.createdAt || pssm.createdAt);

      const alertTitle = '📋 COUNTER PENDING ENTRY ALERT';
      const alertMessage =
`Ticket: ${pssNo} | Bill No: ${billNo}
Customer: ${custName} (${custPhone})
Item: ${itemName}
Entry Date: ${createdDate}
Status: Pending Counter Assignment

Item is currently unassigned in the store counter queue.
Please assign to a designated tailor / salesperson.`;

      for (const admin of adminUsers) {
        const key = `${admin._id.toString()}_${item._id.toString()}`;
        if (!existingSet.has(key)) {
          existingSet.add(key);
          docsToCreate.push({
            tenantId,
            userId: admin._id,
            title: alertTitle,
            message: alertMessage,
            type: 'ALERT',
            priority: 'High',
            category: 'COUNTER_PENDING_ENTRY',
            entityId: item._id,
            metadata: {
              pssmItemId: item._id,
              billNo,
              pssmNo: pssNo,
              customerName: custName,
              customerPhone: custPhone,
              itemName
            },
            isRead: false,
            resolved: false
          });
        }
      }
    }

    if (docsToCreate.length > 0) {
      const created = await Notification.insertMany(docsToCreate);
      created.forEach(n => this.emitSocketNotification(n.userId, n, tenantId));
      return created.length;
    }
    return 0;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  4. RE-ALTER RATE INCREASED ALERT (Target: Admin, Tailors)
  // ══════════════════════════════════════════════════════════════════════════
  static async checkAndGenerateReAlterRateAlerts(tenantId, adminUsers, allStaffUsers, pssmItems = []) {
    if (!tenantId) return 0;
    const todayDateStr = this.getLocalDateString(new Date());

    const existingAlerts = await Notification.find({
      tenantId,
      category: 'RE_ALTER_RATE_INCREASED',
      'metadata.dateStr': todayDateStr
    }).select('userId').lean();

    const existingSet = new Set(
      existingAlerts.map(e => e.userId.toString())
    );

    const totalActive = pssmItems.length;
    const reAlterItems = pssmItems.filter(i => i.reAlterationRequired || /re-alter|realter|repair/i.test(i.serviceType || ''));
    const reAlterCount = reAlterItems.length;
    const reAlterRate = totalActive > 0 ? ((reAlterCount / totalActive) * 100).toFixed(1) : '0.0';

    if (reAlterCount >= 10 || Number(reAlterRate) >= 10.0) {
      const alertTitle = '📈 RE-ALTER RATE SURGE ALERT';
      const alertMessage =
`Active Re-Alter Cases: ${reAlterCount} items
Current Workshop Re-Alter Rate: ${reAlterRate}%
Status: Exceeds 10% Workmanship Threshold

Re-alteration volume has breached the tolerance threshold.
Immediate fitting audit and workmanship quality check required.`;

      const recipientUserIds = new Set();
      adminUsers.forEach(a => recipientUserIds.add(a._id.toString()));
      const allTailorRecipients = this.resolveTailorRecipients(null, allStaffUsers);
      allTailorRecipients.forEach(tId => recipientUserIds.add(tId));

      const docsToCreate = [];

      for (const rId of recipientUserIds) {
        if (!existingSet.has(rId)) {
          existingSet.add(rId);
          docsToCreate.push({
            tenantId,
            userId: rId,
            title: alertTitle,
            message: alertMessage,
            type: 'ALERT',
            priority: 'High',
            category: 'RE_ALTER_RATE_INCREASED',
            metadata: {
              reAlterCount,
              reAlterRate,
              dateStr: todayDateStr
            },
            isRead: false
          });
        }
      }

      if (docsToCreate.length > 0) {
        const created = await Notification.insertMany(docsToCreate);
        created.forEach(n => this.emitSocketNotification(n.userId, n, tenantId));
        return created.length;
      }
    }
    return 0;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  5. DELAY INCREASED ALERT (Target: Admin, Assigned Salesperson, Assigned Tailor)
  // ══════════════════════════════════════════════════════════════════════════
  static async checkAndGenerateDelayIncreasedAlerts(tenantId, adminUsers, allStaffUsers, salesmenDocs, pssmItems = []) {
    if (!tenantId) return 0;
    const now = new Date();
    const todayDateStr = this.getLocalDateString(now);

    const existingAlerts = await Notification.find({
      tenantId,
      category: 'DELAY_INCREASED',
      'metadata.dateStr': todayDateStr
    }).select('userId entityId').lean();

    const existingSet = new Set(
      existingAlerts.map(e => `${e.userId.toString()}_${e.entityId?.toString()}`)
    );

    const delayedItems = pssmItems.filter(item => {
      if (this.isCompletedOrReadyStatus(item.status)) return false;
      const deliveryDate = item.expectedDeliveryDate || item.pssmId?.expectedDeliveryDate;
      if (!deliveryDate) return false;
      return new Date(deliveryDate).getTime() < (now.getTime() - 2 * 60 * 60 * 1000); // Past due by > 2 hours
    });

    const docsToCreate = [];

    for (const item of delayedItems) {
      const pssm = item.pssmId || {};
      const pssNo = pssm.pssmNo || 'N/A';
      const billNo = pssm.billNo || 'N/A';
      const custName = pssm.customerName || item.customerName || 'Customer';
      const custPhone = pssm.customerPhone || item.customerPhone || 'N/A';
      const itemName = item.pieceName || item.productName || 'Garment Item';
      const service = item.serviceType || 'Alteration';
      const tailorName = item.assignedTo || pssm.tailorName || 'Not Assigned';
      const salespersonName = item.salesmanName || pssm.salesmanName || 'Not Assigned';
      const targetSalesmanId = item.salesmanId || pssm.salesmanId;
      const deliveryDate = item.expectedDeliveryDate || pssm.expectedDeliveryDate;
      const originalDate = this.formatDisplayDate(deliveryDate);
      const currentStatus = (item.status || 'PENDING').replace(/_/g, ' ').toUpperCase();
      const delayedDays = Math.max(1, Math.ceil((now.getTime() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24)));

      const alertTitle = '⏳ ALTERATION DELAY INCREASED ALERT';
      const alertMessage =
`Ticket: ${pssNo} | Bill No: ${billNo}
Customer: ${custName} (${custPhone})
Item: ${itemName} (${service})

Original Due Date: ${originalDate}
Current Status: ${currentStatus}
Delay Status: Overdue by ${delayedDays} day(s)

Assigned Tailor: ${tailorName}
Assigned Salesperson: ${salespersonName}

Urgent escalation required to complete and dispatch to customer.`;

      // Recipients: Admins + Assigned Salesperson + Assigned Tailor
      const recipientUserIds = new Set();
      adminUsers.forEach(a => recipientUserIds.add(a._id.toString()));
      this.resolveTailorRecipients(tailorName, allStaffUsers).forEach(tId => recipientUserIds.add(tId));
      this.resolveSalespersonRecipients(salespersonName, targetSalesmanId, allStaffUsers, salesmenDocs).forEach(sId => recipientUserIds.add(sId));

      for (const rId of recipientUserIds) {
        const key = `${rId}_${item._id.toString()}`;
        if (!existingSet.has(key)) {
          existingSet.add(key);
          docsToCreate.push({
            tenantId,
            userId: rId,
            title: alertTitle,
            message: alertMessage,
            type: 'CRITICAL',
            priority: 'Critical',
            category: 'DELAY_INCREASED',
            entityId: item._id,
            metadata: {
              pssmItemId: item._id,
              billNo,
              pssmNo: pssNo,
              customerName: custName,
              customerPhone: custPhone,
              tailorName,
              salespersonName,
              delayedDays,
              dateStr: todayDateStr
            },
            isRead: false
          });
        }
      }
    }

    if (docsToCreate.length > 0) {
      const created = await Notification.insertMany(docsToCreate);
      created.forEach(n => this.emitSocketNotification(n.userId, n, tenantId));
      return created.length;
    }
    return 0;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  6. MESSAGE FAILED ALERT (Target: Admin, Assigned Salesperson, Assigned Tailor)
  // ══════════════════════════════════════════════════════════════════════════
  static async checkAndGenerateMessageFailedAlerts(tenantId, adminUsers, allStaffUsers, salesmenDocs, pssmItems = []) {
    if (!tenantId) return 0;

    const existingAlerts = await Notification.find({
      tenantId,
      category: 'MESSAGE_FAILED'
    }).select('userId entityId metadata.phone').lean();

    const existingSet = new Set(
      existingAlerts.map(e => `${e.userId.toString()}_${e.entityId?.toString()}_${e.metadata?.phone}`)
    );

    const failedMessageItems = pssmItems.filter(item => {
      return item.metadata?.messageStatus === 'FAILED' || item.metadata?.whatsappFailed === true;
    });

    const docsToCreate = [];

    for (const item of failedMessageItems) {
      const pssm = item.pssmId || {};
      const pssNo = pssm.pssmNo || 'N/A';
      const billNo = pssm.billNo || 'N/A';
      const custName = pssm.customerName || item.customerName || 'Customer';
      const custPhone = pssm.customerPhone || item.customerPhone || 'N/A';
      const tailorName = item.assignedTo || pssm.tailorName || 'Not Assigned';
      const salespersonName = item.salesmanName || pssm.salesmanName || 'Not Assigned';
      const targetSalesmanId = item.salesmanId || pssm.salesmanId;
      const channel = item.metadata?.channel || 'WhatsApp / SMS';
      const reason = item.metadata?.failureReason || 'Delivery failure / Number invalid';

      const alertTitle = '❌ CUSTOMER MESSAGE DISPATCH FAILED';
      const alertMessage =
`Customer: ${custName} (${custPhone})
Ticket: ${pssNo} | Bill No: ${billNo}
Channel: ${channel}
Failure Reason: ${reason}

Assigned Salesperson: ${salespersonName}
Assigned Tailor: ${tailorName}

Customer did not receive automated status update.
Please reach out manually via phone call.`;

      const recipientUserIds = new Set();
      adminUsers.forEach(a => recipientUserIds.add(a._id.toString()));
      this.resolveTailorRecipients(tailorName, allStaffUsers).forEach(tId => recipientUserIds.add(tId));
      this.resolveSalespersonRecipients(salespersonName, targetSalesmanId, allStaffUsers, salesmenDocs).forEach(sId => recipientUserIds.add(sId));

      for (const rId of recipientUserIds) {
        const key = `${rId}_${item._id.toString()}_${custPhone}`;
        if (!existingSet.has(key)) {
          existingSet.add(key);
          docsToCreate.push({
            tenantId,
            userId: rId,
            title: alertTitle,
            message: alertMessage,
            type: 'CRITICAL',
            priority: 'Critical',
            category: 'MESSAGE_FAILED',
            entityId: item._id,
            metadata: {
              pssmItemId: item._id,
              billNo,
              pssmNo: pssNo,
              customerName: custName,
              phone: custPhone,
              channel,
              reason
            },
            isRead: false
          });
        }
      }
    }

    if (docsToCreate.length > 0) {
      const created = await Notification.insertMany(docsToCreate);
      created.forEach(n => this.emitSocketNotification(n.userId, n, tenantId));
      return created.length;
    }
    return 0;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  7. CUSTOMER COMPLAINT PENDING ALERT (Target: Admin, Assigned Salesperson, Assigned Tailor)
  // ══════════════════════════════════════════════════════════════════════════
  static async checkAndGenerateComplaintPendingAlerts(tenantId, adminUsers, allStaffUsers, salesmenDocs, pssmItems = []) {
    if (!tenantId) return 0;

    const existingAlerts = await Notification.find({
      tenantId,
      category: 'CUSTOMER_COMPLAINT_PENDING',
      resolved: false
    }).select('userId entityId').lean();

    const existingSet = new Set(
      existingAlerts.map(e => `${e.userId.toString()}_${e.entityId?.toString()}`)
    );

    const complaintItems = pssmItems.filter(item => {
      if (this.isCompletedOrReadyStatus(item.status)) return false;
      const hasDefect = item.fittingResult === 'Unsatisfied' || /defect|complaint|bad fit|issue/i.test(item.fittingResult || '');
      const hasChanges = Boolean(item.requiredChanges && item.requiredChanges.trim().length > 0);
      return hasDefect || hasChanges;
    });

    const docsToCreate = [];

    for (const item of complaintItems) {
      const pssm = item.pssmId || {};
      const pssNo = pssm.pssmNo || 'N/A';
      const billNo = pssm.billNo || 'N/A';
      const custName = pssm.customerName || item.customerName || 'Customer';
      const custPhone = pssm.customerPhone || item.customerPhone || 'N/A';
      const itemName = item.pieceName || item.productName || 'Garment Item';
      const service = item.serviceType || 'Alteration';
      const tailorName = item.assignedTo || pssm.tailorName || 'Not Assigned';
      const salespersonName = item.salesmanName || pssm.salesmanName || 'Not Assigned';
      const targetSalesmanId = item.salesmanId || pssm.salesmanId;
      const issue = item.requiredChanges || item.fittingResult || 'Fitting dissatisfaction / Alteration defect';

      const alertTitle = '⚠ CUSTOMER COMPLAINT PENDING';
      const alertMessage =
`Ticket: ${pssNo} | Bill No: ${billNo}
Customer: ${custName} (${custPhone})
Item: ${itemName} (${service})

Complaint / Issue: ${issue}
Status: Resolution Pending

Assigned Salesperson: ${salespersonName}
Assigned Tailor: ${tailorName}

Immediate customer handling and service recovery required.`;

      const recipientUserIds = new Set();
      adminUsers.forEach(a => recipientUserIds.add(a._id.toString()));
      this.resolveTailorRecipients(tailorName, allStaffUsers).forEach(tId => recipientUserIds.add(tId));
      this.resolveSalespersonRecipients(salespersonName, targetSalesmanId, allStaffUsers, salesmenDocs).forEach(sId => recipientUserIds.add(sId));

      for (const rId of recipientUserIds) {
        const key = `${rId}_${item._id.toString()}`;
        if (!existingSet.has(key)) {
          existingSet.add(key);
          docsToCreate.push({
            tenantId,
            userId: rId,
            title: alertTitle,
            message: alertMessage,
            type: 'ALERT',
            priority: 'High',
            category: 'CUSTOMER_COMPLAINT_PENDING',
            entityId: item._id,
            metadata: {
              pssmItemId: item._id,
              billNo,
              pssmNo: pssNo,
              customerName: custName,
              customerPhone: custPhone,
              issue
            },
            isRead: false,
            resolved: false
          });
        }
      }
    }

    if (docsToCreate.length > 0) {
      const created = await Notification.insertMany(docsToCreate);
      created.forEach(n => this.emitSocketNotification(n.userId, n, tenantId));
      return created.length;
    }
    return 0;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ORIGINAL: PSS DEADLINE TOMORROW ALERT (Target: Admin, Tailor, Salesperson)
  // ══════════════════════════════════════════════════════════════════════════
  static async checkAndGeneratePSSDeadlineAlerts(tenantId, adminUsers, allStaffUsers, salesmenDocs, pssmItems = []) {
    if (!tenantId) return 0;
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDateStr = this.getLocalDateString(tomorrow);

    const existingAlerts = await Notification.find({
      tenantId,
      category: 'PSS_DEADLINE_TOMORROW',
      'metadata.deliveryDateStr': tomorrowDateStr
    }).select('userId entityId').lean();

    const existingSet = new Set(
      existingAlerts.map(e => `${e.userId.toString()}_${e.entityId?.toString()}`)
    );

    const docsToCreate = [];

    for (const item of pssmItems) {
      if (this.isCompletedOrReadyStatus(item.status)) continue;
      const pssm = item.pssmId || {};
      const deliveryDate = item.expectedDeliveryDate || pssm.expectedDeliveryDate;
      if (!deliveryDate) continue;

      const itemDeliveryDateStr = this.getLocalDateString(deliveryDate);
      if (itemDeliveryDateStr !== tomorrowDateStr) continue;

      const billNo = pssm.billNo || pssm.billBarcode || 'N/A';
      const pssTicket = pssm.pssmNo || 'N/A';
      const customerName = pssm.customerName || 'Customer';
      const itemName = item.pieceName || item.productName || 'Garment Item';
      const service = item.serviceType || pssm.serviceType || 'Alteration';
      const tailorName = item.assignedTo || item.tailorName || pssm.tailorName || 'Not Assigned';
      const salespersonName = item.salesmanName || pssm.salesmanName || 'Not Assigned';
      const targetSalesmanId = item.salesmanId || pssm.salesmanId;
      const formattedDeliveryDate = this.formatDisplayDate(deliveryDate);
      const currentStatus = (item.status || 'PENDING').replace(/_/g, ' ').toUpperCase();

      const alertTitle = '⚠ PSS DELIVERY ALERT — CRITICAL';
      const alertMessage =
`Bill No: ${billNo}
PSS Ticket: ${pssTicket}

Customer: ${customerName}

Item: ${itemName}
Service: ${service}

Assigned Tailor: ${tailorName}
Salesperson: ${salespersonName}

Delivery Date: ${formattedDeliveryDate}
Current Status: ${currentStatus}

Delivery is tomorrow.
Please complete this item on priority.`;

      const recipientUserIds = new Set();
      adminUsers.forEach(a => recipientUserIds.add(a._id.toString()));
      this.resolveTailorRecipients(tailorName, allStaffUsers).forEach(tId => recipientUserIds.add(tId));
      this.resolveSalespersonRecipients(salespersonName, targetSalesmanId, allStaffUsers, salesmenDocs).forEach(sId => recipientUserIds.add(sId));

      const creatorUserId = (item.createdBy || pssm.createdBy)?.toString();
      if (creatorUserId) recipientUserIds.add(creatorUserId);

      for (const recipientId of recipientUserIds) {
        const key = `${recipientId}_${item._id.toString()}`;
        if (!existingSet.has(key)) {
          existingSet.add(key);
          docsToCreate.push({
            tenantId,
            userId: recipientId,
            title: alertTitle,
            message: alertMessage,
            type: 'CRITICAL',
            priority: 'Critical',
            category: 'PSS_DEADLINE_TOMORROW',
            entityId: item._id,
            metadata: {
              pssmItemId: item._id,
              pssmId: pssm._id,
              deliveryDateStr: tomorrowDateStr,
              billNo,
              pssmNo: pssTicket,
              customerName,
              itemName,
              service,
              tailorName,
              salespersonName,
              status: item.status
            },
            isRead: false,
            resolved: false
          });
        }
      }
    }

    if (docsToCreate.length > 0) {
      const created = await Notification.insertMany(docsToCreate);
      created.forEach(n => this.emitSocketNotification(n.userId, n, tenantId));
      return created.length;
    }
    return 0;
  }

  /**
   * Master Enterprise Alert Auditor: Runs all 7 business alert monitors + deadline check in a single coordinated pass
   */
  static async runEnterpriseAlertAudits(tenantId) {
    if (!tenantId) return { checked: 0, alertsCreated: 0 };

    try {
      // 1. Fetch active PSS items and legacy Alterations
      const [pssmItemsRaw, legacyAlterations] = await Promise.all([
        PSSMItem.find({ tenantId, isDeleted: { $ne: true } }).populate('pssmId').lean(),
        require('../models/alteration/Alteration').find({ tenantId, isDeleted: { $ne: true } }).lean().catch(() => [])
      ]);

      const activeItems = [...pssmItemsRaw];
      const pssmNumbers = new Set(pssmItemsRaw.map(p => p.pssmId?.pssmNo).filter(Boolean));

      legacyAlterations.forEach(alt => {
        if (pssmNumbers.has(alt.alterationNo)) return;
        activeItems.push({
          _id: alt._id,
          pssmId: {
            _id: alt._id,
            pssmNo: alt.alterationNo,
            billNo: alt.invoiceNumber || 'N/A',
            customerName: alt.customerName || 'Customer',
            customerPhone: alt.customerPhone || '',
            tailorName: alt.tailorName || 'Ajay',
            salesmanName: alt.salesmanName || ''
          },
          pieceName: alt.pieceName || 'Garment Item',
          productName: alt.productName || 'Garment Item',
          serviceType: alt.serviceType || 'Alteration',
          assignedTo: alt.tailorName || 'Ajay',
          status: alt.status,
          expectedDeliveryDate: alt.expectedDeliveryDate,
          createdAt: alt.createdAt,
          reAlterationRequired: Boolean(alt.reAlterationRequired)
        });
      });

      // 2. Fetch admin users & staff users
      const [adminUsers, allStaffUsers, salesmenDocs] = await Promise.all([
        this.getAdminUsers(tenantId),
        this.getAllStaffUsers(tenantId),
        Salesman.find({ tenantId, isDeleted: false }).lean().catch(() => [])
      ]);

      let totalAlertsCreated = 0;

      // Run all 7 alerts + deadline check concurrently
      const results = await Promise.allSettled([
        this.checkAndGenerateRepeatReAlterAlerts(tenantId, adminUsers, activeItems),
        this.checkAndGenerateTailorCapacityAlerts(tenantId, adminUsers, allStaffUsers, activeItems),
        this.checkAndGenerateCounterPendingAlerts(tenantId, adminUsers, activeItems),
        this.checkAndGenerateReAlterRateAlerts(tenantId, adminUsers, allStaffUsers, activeItems),
        this.checkAndGenerateDelayIncreasedAlerts(tenantId, adminUsers, allStaffUsers, salesmenDocs, activeItems),
        this.checkAndGenerateMessageFailedAlerts(tenantId, adminUsers, allStaffUsers, salesmenDocs, activeItems),
        this.checkAndGenerateComplaintPendingAlerts(tenantId, adminUsers, allStaffUsers, salesmenDocs, activeItems),
        this.checkAndGeneratePSSDeadlineAlerts(tenantId, adminUsers, allStaffUsers, salesmenDocs, activeItems)
      ]);

      results.forEach(r => {
        if (r.status === 'fulfilled' && typeof r.value === 'number') {
          totalAlertsCreated += r.value;
        }
      });

      return { checked: activeItems.length, alertsCreated: totalAlertsCreated };
    } catch (err) {
      console.error('[NotificationService] Error in runEnterpriseAlertAudits:', err.message);
      return { checked: 0, alertsCreated: 0 };
    }
  }

  /**
   * Real-time status update: Marks alerts as resolved when an item becomes ready/collected
   */
  static async resolveAlertsForPSSItem(pssmItemId, tenantId, newStatus) {
    if (!pssmItemId) return;
    try {
      await Notification.updateMany(
        {
          entityId: pssmItemId,
          category: { $in: ['PSS_DEADLINE_TOMORROW', 'COUNTER_PENDING_ENTRY', 'CUSTOMER_COMPLAINT_PENDING'] },
          resolved: false,
          ...(tenantId ? { tenantId } : {})
        },
        {
          $set: {
            resolved: true,
            isRead: true,
            'metadata.resolvedAt': new Date(),
            'metadata.resolvedStatus': newStatus
          }
        }
      );
    } catch (err) {
      console.error('[NotificationService] Failed to resolve alerts for PSS item:', err);
    }
  }

  /**
   * Runs the alert audit globally across all active tenants (e.g. background cron)
   */
  static async runGlobalPSSDeadlineCheck() {
    try {
      const distinctTenants = await PSSM.distinct('tenantId');
      for (const tenantId of distinctTenants) {
        if (tenantId) {
          await this.runEnterpriseAlertAudits(tenantId).catch(err => {
            console.error(`[NotificationService] Error running audits for tenant ${tenantId}:`, err.message);
          });
        }
      }
    } catch (err) {
      console.error('[NotificationService] Error in runGlobalPSSDeadlineCheck:', err.message);
    }
  }

  /**
   * Retrieves notifications for a given user, running the active audits first
   */
  static async getUserNotifications(userId, tenantId) {
    if (tenantId) {
      // Run passive check to ensure all 7 enterprise alert categories are fresh and deduplicated
      await this.runEnterpriseAlertAudits(tenantId).catch(() => {});
    }

    const notifications = await Notification.find({
      userId,
      tenantId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formatted = notifications.map(n => ({
      id: n._id.toString(),
      _id: n._id.toString(),
      title: n.title,
      message: n.message,
      type: (n.type || 'INFO').toLowerCase(),
      priority: n.priority || 'Normal',
      read: Boolean(n.isRead),
      resolved: Boolean(n.resolved),
      category: n.category,
      entityId: n.entityId,
      metadata: n.metadata,
      link: n.link,
      timestamp: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      createdAt: n.createdAt
    }));

    return formatted;
  }

  /**
   * Marks a notification as read
   */
  static async markAsRead(notificationId, userId, tenantId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId, tenantId },
      { isRead: true },
      { new: true }
    );
  }

  /**
   * Marks all notifications as read for a user
   */
  static async markAllAsRead(userId, tenantId) {
    return Notification.updateMany(
      { userId, tenantId, isRead: false },
      { $set: { isRead: true } }
    );
  }
}

module.exports = NotificationService;

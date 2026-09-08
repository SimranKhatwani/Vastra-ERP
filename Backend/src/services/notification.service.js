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
   * Helper to format a date for user-facing alert: e.g. "18 July" or "9 September"
   */
  static formatDisplayDate(date, tz = 'Asia/Kolkata') {
    if (!date) return 'Tomorrow';
    try {
      const d = new Date(date);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: tz,
        day: 'numeric',
        month: 'long'
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
    return ['READY', 'READY FOR DELIVERY', 'COLLECTED', 'COMPLETED', 'CLOSED', 'CANCELLED'].includes(s);
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

  /**
   * Automatically monitors all PSS items for a tenant whose delivery date is TOMORROW
   * and generates item-level alerts for Admin, assigned Tailor, and assigned Salesperson.
   */
  static async checkAndGeneratePSSDeadlineAlerts(tenantId) {
    if (!tenantId) return { checked: 0, alertsCreated: 0 };

    // Calculate tomorrow's date string in IST
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDateStr = this.getLocalDateString(tomorrow);
    const todayDateStr = this.getLocalDateString(now);

    // 1. Fetch active PSS items that are NOT ready/collected/closed
    const activeItems = await PSSMItem.find({
      tenantId,
      status: { $nin: ['READY', 'READY FOR DELIVERY', 'COLLECTED', 'COMPLETED', 'CLOSED', 'CANCELLED'] }
    })
      .populate('pssmId')
      .lean();

    if (!activeItems.length) {
      return { checked: 0, alertsCreated: 0 };
    }

    // 2. Pre-fetch potential Admin users in this tenant
    const adminRoles = await Role.find({
      tenantId,
      name: { $regex: /admin|owner|manager|super/i }
    }).select('_id').lean();
    const adminRoleIds = adminRoles.map(r => r._id);

    const adminUsers = await User.find({
      tenantId,
      isDeleted: false,
      $or: [
        { isTenantOwner: true },
        { isSuperAdmin: true },
        { roleId: { $in: adminRoleIds } },
        { designation: { $regex: /admin|manager|owner/i } }
      ]
    }).lean();

    // Pre-fetch all staff users for tailor/salesperson mapping
    const allStaffUsers = await User.find({
      tenantId,
      isDeleted: false
    }).lean();

    const tailorUsers = allStaffUsers.filter(u => {
      const role = (u.role || '').toLowerCase();
      const desig = (u.designation || '').toLowerCase();
      return /tailor|karigar|stitcher|worker|fitter|production/i.test(role) ||
             /tailor|karigar|stitcher|worker|fitter|production/i.test(desig);
    });

    const salespersonUsers = allStaffUsers.filter(u => {
      const role = (u.role || '').toLowerCase();
      const desig = (u.designation || '').toLowerCase();
      return /sales|salesperson|salesman|floorstaff|counter/i.test(role) ||
             /sales|salesperson|salesman|floorstaff|counter/i.test(desig);
    });

    let alertsCreated = 0;

    for (const item of activeItems) {
      const pssm = item.pssmId;
      if (!pssm) continue;

      // Determine effective delivery date (item level override or header level)
      const deliveryDate = item.expectedDeliveryDate || pssm.expectedDeliveryDate;
      if (!deliveryDate) continue;

      const itemDeliveryDateStr = this.getLocalDateString(deliveryDate);

      // Condition: Delivery Date must be TOMORROW
      if (itemDeliveryDateStr !== tomorrowDateStr) {
        continue;
      }

      // Condition: Status must still be pending/incomplete
      if (this.isCompletedOrReadyStatus(item.status)) {
        continue;
      }

      // Format alert fields
      const billNo = pssm.billNo || pssm.billBarcode || 'N/A';
      const pssTicket = pssm.pssmNo || 'N/A';
      const customerName = pssm.customerName || 'Customer';
      const itemName = item.pieceName || item.productName || 'Garment Item';
      const service = item.serviceType || pssm.serviceType || 'Alteration';
      const tailorName = item.assignedTo || item.tailorName || pssm.tailorName || 'Not Assigned';
      const salespersonName = item.salesmanName || pssm.salesmanName || 'Not Assigned';
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

      // 3. Identify Target Recipients
      const recipientUserIds = new Set();

      // (A) Admin receives alert
      adminUsers.forEach(admin => recipientUserIds.add(admin._id.toString()));

      // (B) Assigned Tailor / Service Person
      const cleanTailor = (tailorName || '').trim().toLowerCase();
      const isGenericTailor = !cleanTailor || cleanTailor === 'not assigned' || cleanTailor === 'unassigned' || cleanTailor === 'default tailor';

      if (!isGenericTailor) {
        const matchedTailors = allStaffUsers.filter(u => {
          if (u._id.toString() === tailorName) return true;
          const uName = (u.name || '').trim().toLowerCase();
          return uName === cleanTailor || uName.includes(cleanTailor) || cleanTailor.includes(uName);
        });

        if (matchedTailors.length > 0) {
          matchedTailors.forEach(t => recipientUserIds.add(t._id.toString()));
        } else {
          // If named tailor doesn't have an exact User match, notify all shop tailors
          tailorUsers.forEach(t => recipientUserIds.add(t._id.toString()));
        }
      } else {
        // If "Default Tailor" or "Not Assigned", notify ALL tailors so work gets assigned and started!
        tailorUsers.forEach(t => recipientUserIds.add(t._id.toString()));
      }

      // (C) Assigned Salesperson (Only the salesperson associated with this bill/item, or floor team)
      const targetSalesmanId = item.salesmanId || pssm.salesmanId;
      const cleanSalesman = (salespersonName || '').trim().toLowerCase();
      const isGenericSalesman = !cleanSalesman || cleanSalesman === 'not assigned' || cleanSalesman === 'unassigned';

      let matchedSalespeople = [];

      if (targetSalesmanId) {
        try {
          const Salesman = require('../models/masters/Salesman');
          const salesmanDoc = await Salesman.findById(targetSalesmanId).lean().catch(() => null);
          if (salesmanDoc) {
            matchedSalespeople = allStaffUsers.filter(u => {
              if (salesmanDoc.phone && u.phone && String(u.phone).trim() === String(salesmanDoc.phone).trim()) return true;
              if (salesmanDoc.email && u.email && u.email.toLowerCase() === salesmanDoc.email.toLowerCase()) return true;
              const uName = (u.name || '').trim().toLowerCase();
              const sName = (salesmanDoc.name || '').trim().toLowerCase();
              return uName === sName || (sName && (uName.includes(sName) || sName.includes(uName)));
            });
          }
        } catch (e) {
          // quiet fallback
        }
      }

      if (matchedSalespeople.length === 0 && !isGenericSalesman) {
        matchedSalespeople = allStaffUsers.filter(u => {
          const uName = (u.name || '').trim().toLowerCase();
          return uName === cleanSalesman || uName.includes(cleanSalesman) || cleanSalesman.includes(uName);
        });
      }

      // Also notify the user who booked this ticket / bill
      const creatorUserId = (item.createdBy || pssm.createdBy)?.toString();
      if (creatorUserId) {
        recipientUserIds.add(creatorUserId);
      }

      if (matchedSalespeople.length > 0) {
        matchedSalespeople.forEach(s => recipientUserIds.add(s._id.toString()));
      } else {
        // If unassigned or no specific salesperson matched, alert all salesperson users!
        salespersonUsers.forEach(s => recipientUserIds.add(s._id.toString()));
      }

      // 4. Duplicate Prevention & Creation
      for (const recipientId of recipientUserIds) {
        const existingAlert = await Notification.findOne({
          tenantId,
          userId: recipientId,
          entityId: item._id,
          category: 'PSS_DEADLINE_TOMORROW',
          'metadata.deliveryDateStr': tomorrowDateStr
        });

        if (existingAlert) {
          // Already created for this PSS item + Delivery Date + User. Skip duplicate!
          continue;
        }

        const newNotif = await Notification.create({
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

        this.emitSocketNotification(recipientId, newNotif, tenantId);
        alertsCreated++;
      }
    }

    // Also check active Alteration items
    try {
      const Alteration = require('../models/alteration/Alteration');
      const activeAlterations = await Alteration.find({
        tenantId,
        isDeleted: false,
        status: { $nin: ['Ready for Delivery', 'Delivered', 'Cancelled'] }
      }).populate('customerId saleBillId').lean();

      for (const alt of activeAlterations) {
        if (activeItems.some(pi => pi.pssmId?.pssmNo === alt.alterationNo)) continue;
        const deliveryDate = alt.expectedDeliveryDate;
        if (!deliveryDate) continue;

        const itemDeliveryDateStr = this.getLocalDateString(deliveryDate);
        if (itemDeliveryDateStr !== tomorrowDateStr) continue;
        if (this.isCompletedOrReadyStatus(alt.status)) continue;

        const billNo = alt.saleBillId?.billNo || alt.saleBillId?.invoiceNo || alt.invoiceNumber || 'N/A';
        const pssTicket = alt.alterationNo || 'N/A';
        const customerName = alt.customerName || alt.customerId?.name || 'Customer';
        const itemName = 'Altered Garment';
        const service = 'Alteration';
        const tailorName = alt.tailorName || 'Not Assigned';
        const salespersonName = alt.saleBillId?.salesmanName || 'Not Assigned';
        const formattedDeliveryDate = this.formatDisplayDate(deliveryDate);
        const currentStatus = (alt.status || 'PENDING').replace(/_/g, ' ').toUpperCase();

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
        adminUsers.forEach(admin => recipientUserIds.add(admin._id.toString()));

        const cleanTailor = (tailorName || '').trim().toLowerCase();
        const isGenericTailor = !cleanTailor || cleanTailor === 'not assigned' || cleanTailor === 'unassigned' || cleanTailor === 'default tailor';

        if (!isGenericTailor) {
          const matchedTailors = allStaffUsers.filter(u => {
            if (u._id.toString() === tailorName) return true;
            const uName = (u.name || '').trim().toLowerCase();
            return uName === cleanTailor || uName.includes(cleanTailor) || cleanTailor.includes(uName);
          });
          if (matchedTailors.length > 0) {
            matchedTailors.forEach(t => recipientUserIds.add(t._id.toString()));
          } else {
            tailorUsers.forEach(t => recipientUserIds.add(t._id.toString()));
          }
        } else {
          tailorUsers.forEach(t => recipientUserIds.add(t._id.toString()));
        }

        const altSalesmanId = alt.saleBillId?.salesmanId;
        const cleanSalesman = (salespersonName || '').trim().toLowerCase();
        const isGenericSalesman = !cleanSalesman || cleanSalesman === 'not assigned' || cleanSalesman === 'unassigned';

        let matchedSalespeople = [];
        if (altSalesmanId) {
          try {
            const Salesman = require('../models/masters/Salesman');
            const salesmanDoc = await Salesman.findById(altSalesmanId).lean().catch(() => null);
            if (salesmanDoc) {
              matchedSalespeople = allStaffUsers.filter(u => {
                if (salesmanDoc.phone && u.phone && String(u.phone).trim() === String(salesmanDoc.phone).trim()) return true;
                if (salesmanDoc.email && u.email && u.email.toLowerCase() === salesmanDoc.email.toLowerCase()) return true;
                const uName = (u.name || '').trim().toLowerCase();
                const sName = (salesmanDoc.name || '').trim().toLowerCase();
                return uName === sName || (sName && (uName.includes(sName) || sName.includes(uName)));
              });
            }
          } catch (e) {}
        }

        if (matchedSalespeople.length === 0 && !isGenericSalesman) {
          matchedSalespeople = allStaffUsers.filter(u => {
            const uName = (u.name || '').trim().toLowerCase();
            return uName === cleanSalesman || uName.includes(cleanSalesman) || cleanSalesman.includes(uName);
          });
        }

        const creatorUserId = alt.createdBy?.toString();
        if (creatorUserId) recipientUserIds.add(creatorUserId);

        if (matchedSalespeople.length > 0) {
          matchedSalespeople.forEach(s => recipientUserIds.add(s._id.toString()));
        } else {
          salespersonUsers.forEach(s => recipientUserIds.add(s._id.toString()));
        }

        for (const recipientId of recipientUserIds) {
          const existingAlert = await Notification.findOne({
            tenantId,
            userId: recipientId,
            entityId: alt._id,
            category: 'PSS_DEADLINE_TOMORROW',
            'metadata.deliveryDateStr': tomorrowDateStr
          });

          if (existingAlert) continue;

          const newNotif = await Notification.create({
            tenantId,
            userId: recipientId,
            title: alertTitle,
            message: alertMessage,
            type: 'CRITICAL',
            priority: 'Critical',
            category: 'PSS_DEADLINE_TOMORROW',
            entityId: alt._id,
            metadata: {
              alterationId: alt._id,
              deliveryDateStr: tomorrowDateStr,
              billNo,
              alterationNo: pssTicket,
              customerName,
              itemName,
              service,
              tailorName,
              salespersonName,
              status: alt.status
            },
            isRead: false,
            resolved: false
          });

          this.emitSocketNotification(recipientId, newNotif, tenantId);
          alertsCreated++;
        }
      }
    } catch (err) {
      console.error('[NotificationService] Error checking Alteration records for deadline:', err.message);
    }

    return { checked: activeItems.length, alertsCreated };
  }

  /**
   * Real-time status update: Marks deadline alert as resolved when an item becomes ready/collected
   */
  static async resolveAlertsForPSSItem(pssmItemId, tenantId, newStatus) {
    if (!pssmItemId) return;
    try {
      await Notification.updateMany(
        {
          entityId: pssmItemId,
          category: 'PSS_DEADLINE_TOMORROW',
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
   * Runs the deadline check globally across all active tenants (e.g. background cron)
   */
  static async runGlobalPSSDeadlineCheck() {
    try {
      const distinctTenants = await PSSM.distinct('tenantId');
      for (const tenantId of distinctTenants) {
        if (tenantId) {
          await this.checkAndGeneratePSSDeadlineAlerts(tenantId).catch(err => {
            console.error(`[NotificationService] Error checking deadline alerts for tenant ${tenantId}:`, err.message);
          });
        }
      }
    } catch (err) {
      console.error('[NotificationService] Error in runGlobalPSSDeadlineCheck:', err.message);
    }
  }

  /**
   * Retrieves notifications for a given user, optionally running the deadline check first
   */
  static async getUserNotifications(userId, tenantId) {
    if (tenantId) {
      // Run passive check to ensure tomorrow's alerts are fresh and deduplicated
      await this.checkAndGeneratePSSDeadlineAlerts(tenantId).catch(() => {});
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

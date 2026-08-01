const ActivityLog = require('../models/activityLogModel');
const mongoose = require('mongoose');

/**
 * GET /api/activity-feed
 * Returns recent activity for the tenant's live ACTIVITY FEED.
 * Exclusively uses the `activitylogs` collection as the single source of truth.
 */
exports.getActivityFeed = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const limit = parseInt(req.query.limit) || 30;

    // Fetch from dedicated ActivityLog collection
    const logs = await ActivityLog.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Map `ActivityLog` documents to the rich UI format expected by the frontend
    const allActivities = logs.map((log) => {
      // Determine UI styling based on action type
      let icon = '📝';
      let color = 'blue';
      
      const act = log.action.toUpperCase();
      
      if (act.includes('RETURN')) {
        icon = '🔴';
        color = 'red';
      } else if (act.includes('EXCHANGE')) {
        icon = '🔁';
        color = 'indigo';
      } else if (act.includes('INVOICE') || act.includes('BILL')) {
        icon = '🧾';
        color = 'emerald';
      } else if (act.includes('PAYMENT') || act.includes('INCOME')) {
        icon = '💰';
        color = 'green';
      } else if (act.includes('PRODUCT') || act.includes('INVENTORY')) {
        icon = '📦';
        color = 'orange';
      } else if (act.includes('CUSTOMER')) {
        icon = '👤';
        color = 'purple';
      } else if (act.includes('PURCHASE')) {
        icon = '🛒';
        color = 'teal';
      } else if (act.includes('EMPLOYEE')) {
        icon = '👔';
        color = 'blue';
      }

      let detailStr = `Module: ${log.module}`;
      if (log.newValue) {
        if (typeof log.newValue === 'object') {
          if (log.module.toLowerCase().includes('alteration')) {
            detailStr = `Alteration: ${log.newValue.productName || 'Garment'} (${log.newValue.size || 'M'}/${log.newValue.color || 'Std'}) - ${Array.isArray(log.newValue.alterationDetails) ? log.newValue.alterationDetails.join(', ') : 'Custom fit'}`;
          } else {
            detailStr = log.newValue.name || log.newValue.title || log.newValue.description || `Record ID: ${log.recordId || log._id}`;
          }
        } else {
          detailStr = String(log.newValue);
        }
      }

      return {
        id: log.activityId || log._id.toString(),
        type: log.module.toLowerCase(),
        action: log.action,
        icon,
        color,
        title: log.recordName || `${log.action} performed`,
        detail: detailStr,
        user: log.employeeName || 'System',
        timestamp: log.createdAt,
        meta: {
          recordId: log.recordId,
          oldValue: log.oldValue,
          status: log.status
        },
      };
    });

    res.json({ success: true, data: allActivities, total: allActivities.length });
  } catch (error) {
    console.error('Activity Feed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

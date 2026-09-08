const AuditLog = require('../models/AuditLog');

class AuditService {
  static async trackAuditLog(logData, io = null) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const preparedData = {
      date: logData.date || dateStr,
      time: logData.time || timeStr,
      ...logData
    };
    const audit = new AuditLog(preparedData);
    await audit.save();
    if (io) {
      try {
        io.emit('activity.feed', audit);
      } catch (err) {
        // non-fatal
      }
    }
    return audit;
  }

  static async getAuditLogs(query = {}, tenantId) {
    const filter = {};
    if (tenantId) filter.tenantId = tenantId;
    if (query.action && query.action !== 'All') filter.action = query.action;
    if (query.module && query.module !== 'All') filter.module = query.module;
    if (query.userId) filter.userId = query.userId;
    if (query.entityId) filter.entityId = query.entityId;
    if (query.entityType) filter.entityType = query.entityType;

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { userName: searchRegex },
        { userEmail: searchRegex },
        { action: searchRegex },
        { item: searchRegex },
        { displayName: searchRegex },
        { reason: searchRegex },
        { fieldChanged: searchRegex }
      ];
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filter);

    return {
      logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = AuditService;

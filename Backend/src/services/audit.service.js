const AuditLog = require('../models/AuditLog');

class AuditService {
  static async trackAuditLog(logData) {
    const audit = new AuditLog(logData);
    await audit.save();
    return audit;
  }

  static async getAuditLogs(query = {}, tenantId) {
    const filter = {};
    if (tenantId) filter.tenantId = tenantId;
    if (query.action) filter.action = query.action;
    if (query.userId) filter.userId = query.userId;

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

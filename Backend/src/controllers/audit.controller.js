const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const AuditService = require('../services/audit.service');

class AuditController {
  static trackAuditLog = asyncHandler(async (req, res) => {
    const { action, item, moduleName, details, entityType, entityId, displayName } = req.body;
    
    if (!action || !item) {
      return res.status(400).json(new ApiResponse(400, null, 'Action and item are required'));
    }

    const logData = {
      tenantId: req.tenantId || req.user?.tenantId,
      userId: req.user?.id,
      userName: req.user?.name || 'Unknown User',
      userEmail: req.user?.email,
      action,
      item,
      entityType: entityType || null,
      entityId: entityId || null,
      displayName: displayName || null,
      module: moduleName || 'Purchase',
      details: details || {},
      deviceInfo: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || req.connection?.remoteAddress,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };

    const result = await AuditService.trackAuditLog(logData);
    return res.status(201).json(new ApiResponse(201, result, 'Audit log tracked successfully.'));
  });

  static getAuditLogs = asyncHandler(async (req, res) => {
    const result = await AuditService.getAuditLogs(req.query, req.user.isSuperAdmin ? null : req.tenantId);
    return res.status(200).json(new ApiResponse(200, result.logs, 'Audit logs retrieved.', result.meta));
  });
}

module.exports = AuditController;

const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const AuditService = require('../services/audit.service');

class AuditController {
  static getAuditLogs = asyncHandler(async (req, res) => {
    const result = await AuditService.getAuditLogs(req.query, req.user.isSuperAdmin ? null : req.tenantId);
    return res.status(200).json(new ApiResponse(200, result.logs, 'Audit logs retrieved.', result.meta));
  });
}

module.exports = AuditController;

const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const auditLog = (action, moduleName) => {
  return async (req, res, next) => {
    // Perform next middleware first
    res.on('finish', async () => {
      if (res.statusCode < 400 && req.user) {
        try {
          const newAuditLog = await AuditLog.create({
            tenantId: req.tenantId || req.user?.tenantId || null,
            userId: req.user?.id || null,
            userName: req.user?.name || 'System',
            userEmail: req.user?.email || '',
            action: action || `${req.method}_${moduleName.toUpperCase()}`,
            module: moduleName,
            method: req.method,
            endpoint: req.originalUrl,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'] || '',
            details: {
              params: req.params,
              query: req.query,
              body: req.body ? { ...req.body, password: '[REDACTED]' } : {}
            }
          });

          const io = req.app.get('io');
          if (io) {
            io.emit('activity.feed', newAuditLog);
          }
        } catch (err) {
          logger.error(`Failed to record audit log: ${err.message}`);
        }
      }
    });
    next();
  };
};

module.exports = {
  auditLog
};

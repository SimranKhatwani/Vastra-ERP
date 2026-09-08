const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const auditLog = (action, moduleName) => {
  return async (req, res, next) => {
    // Perform next middleware first
    res.on('finish', async () => {
      if (res.statusCode < 400 && req.user) {
        try {
          const reason = req.body?.reason || req.body?.changeReason || req.body?.remarks || req.headers['x-audit-reason'] || null;
          const now = new Date();
          const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

          const newAuditLog = await AuditLog.create({
            tenantId: req.tenantId || req.user?.tenantId || null,
            userId: req.user?.id || null,
            userName: req.user?.name || 'System',
            userEmail: req.user?.email || '',
            action: action || `${req.method}_${moduleName.toUpperCase()}`,
            module: moduleName,
            entityId: req.params?.id || req.params?.itemId || req.body?.entityId || null,
            entityType: req.body?.entityType || moduleName.toUpperCase(),
            item: req.body?.item || req.body?.itemName || req.body?.pieceName || req.body?.billNo || (req.params?.id ? `ID: ${req.params.id}` : null),
            displayName: req.body?.displayName || req.body?.productName || req.body?.pieceName || null,
            fieldChanged: req.body?.fieldChanged || null,
            oldValue: req.body?.oldValue !== undefined ? req.body.oldValue : null,
            newValue: req.body?.newValue !== undefined ? req.body.newValue : null,
            reason: reason,
            date: dateStr,
            time: timeStr,
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

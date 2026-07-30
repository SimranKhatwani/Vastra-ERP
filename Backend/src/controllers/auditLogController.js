const PurchaseAuditLog = require('../models/purchaseAuditLogModel');

exports.logPurchaseView = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    // Extract info from request
    const { itemViewed, device, browser, ipAddress } = req.body;
    
    const auditEntry = new PurchaseAuditLog({
      tenantId,
      userName: req.user.name || req.user.email || 'Unknown User',
      employeeId: req.user.employeeId || req.user._id,
      role: req.user.role || 'Unknown Role',
      itemViewed: itemViewed || 'General Purchase View',
      action: 'View Purchase Details',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US'),
      device: device || req.headers['user-agent'] || 'Unknown Device',
      browser: browser || 'Unknown Browser',
      ipAddress: ipAddress || req.ip || req.connection.remoteAddress || 'Unknown IP',
      details: 'Accessed confidential purchase tab via Design Selection Popup'
    });

    await auditEntry.save();
    
    res.status(201).json({ success: true, message: 'Audit log recorded', data: auditEntry });
  } catch (error) {
    console.error('Failed to save purchase audit log:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

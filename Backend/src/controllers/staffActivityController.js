const ActivityLog = require('../models/activityLogModel');
const LoginHistory = require('../models/loginHistoryModel');
const User = require('../models/userModel');

// Helper to parse user agent
const parseUserAgent = (req) => {
  const ua = req.headers['user-agent'] || '';
  let browser = 'Chrome';
  let os = 'Windows';
  let device = 'Desktop';

  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) { os = 'Android'; device = 'Mobile'; }
  else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; device = 'Mobile'; }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  return { browser, os, device, ip: String(ip).replace('::ffff:', '') };
};

// Automatic Helper: Log Activity
exports.recordActivityLog = async (req, payload) => {
  try {
    if (!req.user || !req.user.tenantId) return;
    const { browser, device, ip } = parseUserAgent(req);
    const activityId = `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await ActivityLog.create({
      tenantId: req.user.tenantId,
      activityId,
      employeeId: req.user._id || req.user.id,
      employeeName: req.user.name || 'Staff User',
      role: req.user.role || 'Staff',
      department: payload.department || 'Retail Operations',
      branch: payload.branch || 'Main Outlet',
      module: payload.module || 'System',
      action: payload.action || 'Performed Action',
      recordId: payload.recordId || '',
      recordName: payload.recordName || '',
      oldValue: payload.oldValue || null,
      newValue: payload.newValue || null,
      status: payload.status || 'Success',
      ipAddress: ip,
      device,
      browser,
    });
  } catch (err) {
    console.error('Failed to auto-record ActivityLog:', err.message);
  }
};

// Automatic Helper: Log Login
exports.recordLoginHistory = async (req, user, status = 'Online') => {
  try {
    const tenantId = user.tenantId?._id || user.tenantId;
    if (!tenantId) return;

    const { browser, os, device, ip } = parseUserAgent(req);
    const loginId = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const record = await LoginHistory.create({
      tenantId,
      loginId,
      employeeId: user._id || user.id,
      employeeName: user.name || 'Staff Member',
      role: user.role || 'Staff',
      department: user.department || 'Retail Floor',
      branch: 'Main Branch',
      loginTime: new Date(),
      sessionDuration: 'Active Session',
      device,
      browser,
      operatingSystem: os,
      ipAddress: ip,
      status,
    });
    return record;
  } catch (err) {
    console.error('Failed to auto-record LoginHistory:', err.message);
  }
};

// Automatic Helper: Log Logout
exports.recordLogoutHistory = async (req, user) => {
  try {
    const tenantId = user.tenantId?._id || user.tenantId;
    if (!tenantId) return;

    const activeSession = await LoginHistory.findOne({
      tenantId,
      employeeId: user._id || user.id,
      status: 'Online',
    }).sort({ createdAt: -1 });

    if (activeSession) {
      const now = new Date();
      const diffMs = Math.abs(now - new Date(activeSession.loginTime));
      const mins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      const durationStr = hours > 0 ? `${hours}h ${remainingMins}m` : `${mins} mins`;

      activeSession.logoutTime = now;
      activeSession.sessionDuration = durationStr;
      activeSession.status = 'Logged Out';
      await activeSession.save();
    }
  } catch (err) {
    console.error('Failed to auto-record LogoutHistory:', err.message);
  }
};

// GET /api/staff-activity/activity-logs
exports.getActivityLogs = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate, employee, module: moduleFilter, action, status, search } = req.query;

    const query = { tenantId };

    if (moduleFilter && moduleFilter !== 'All') query.module = moduleFilter;
    if (status && status !== 'All') query.status = status;
    if (employee && employee !== 'All') query.employeeName = new RegExp(employee, 'i');
    if (action && action !== 'All') query.action = new RegExp(action, 'i');

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { activityId: searchRegex },
        { employeeName: searchRegex },
        { module: searchRegex },
        { action: searchRegex },
        { recordName: searchRegex },
      ];
    }

    let logs = await ActivityLog.find(query).sort({ createdAt: -1 }).lean();

    // Auto-seed sample activity logs if database is empty for demo/live initial display
    if (logs.length === 0 && !search && (!moduleFilter || moduleFilter === 'All')) {
      const sampleActivities = [
        {
          tenantId,
          activityId: `ACT-${Date.now()}-101`,
          employeeId: req.user._id,
          employeeName: req.user.name,
          role: req.user.role,
          department: 'Retail Operations',
          branch: 'Main Branch',
          module: 'billing',
          action: 'Generate Bill',
          recordId: 'INV-2026-001',
          recordName: 'POS Receipt #INV-2026-001',
          oldValue: null,
          newValue: 'Total: ₹1,450 (Cash)',
          status: 'Success',
          ipAddress: '192.168.1.45',
          device: 'Desktop Terminal',
          browser: 'Chrome 126.0',
          createdAt: new Date(),
        },
        {
          tenantId,
          activityId: `ACT-${Date.now()}-102`,
          employeeId: req.user._id,
          employeeName: req.user.name,
          role: req.user.role,
          department: 'Garment Studio',
          branch: 'Main Branch',
          module: 'articulation',
          action: 'Alteration Created',
          recordId: 'ALT-1092',
          recordName: 'Suit Jacket Sleeve Hemming',
          oldValue: null,
          newValue: 'Status: In Progress',
          status: 'Success',
          ipAddress: '192.168.1.45',
          device: 'Desktop Terminal',
          browser: 'Chrome 126.0',
          createdAt: new Date(Date.now() - 3600000),
        },
        {
          tenantId,
          activityId: `ACT-${Date.now()}-103`,
          employeeId: req.user._id,
          employeeName: req.user.name,
          role: req.user.role,
          department: 'Inventory Management',
          branch: 'Main Warehouse',
          module: 'products',
          action: 'Update Product',
          recordId: 'PROD-8821',
          recordName: 'Silk Sherwani Size 42',
          oldValue: 'Stock: 12',
          newValue: 'Stock: 18',
          status: 'Success',
          ipAddress: '192.168.1.88',
          device: 'Tablet POS',
          browser: 'Safari Mobile',
          createdAt: new Date(Date.now() - 7200000),
        },
      ];
      await ActivityLog.insertMany(sampleActivities);
      logs = await ActivityLog.find(query).sort({ createdAt: -1 }).lean();
    }

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/staff-activity/activity-logs/:id
exports.getActivityLogById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const log = await ActivityLog.findOne({ _id: req.params.id, tenantId }).lean();
    if (!log) {
      return res.status(404).json({ success: false, message: 'Activity log entry not found' });
    }
    res.status(200).json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/staff-activity/login-history
exports.getLoginHistory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate, employee, role, status, search } = req.query;

    const query = { tenantId };

    if (role && role !== 'All') query.role = new RegExp(role, 'i');
    if (status && status !== 'All') query.status = status;
    if (employee && employee !== 'All') query.employeeName = new RegExp(employee, 'i');

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { loginId: searchRegex },
        { employeeName: searchRegex },
        { role: searchRegex },
        { ipAddress: searchRegex },
        { browser: searchRegex },
      ];
    }

    let history = await LoginHistory.find(query).sort({ createdAt: -1 }).lean();

    // Auto-seed login history if empty for tenant
    if (history.length === 0 && !search && (!role || role === 'All')) {
      const sampleLogins = [
        {
          tenantId,
          loginId: `LOG-${Date.now()}-01`,
          employeeId: req.user._id,
          employeeName: req.user.name,
          role: req.user.role,
          department: 'Store Management',
          branch: 'Main Outlet',
          loginTime: new Date(Date.now() - 14400000),
          logoutTime: null,
          sessionDuration: 'Active Now',
          device: 'Desktop PC',
          browser: 'Chrome 126',
          operatingSystem: 'Windows 11',
          ipAddress: '192.168.1.10',
          status: 'Online',
          createdAt: new Date(),
        },
        {
          tenantId,
          loginId: `LOG-${Date.now()}-02`,
          employeeId: 'emp-hitesh',
          employeeName: 'Hitesh Kumar',
          role: 'Salesperson',
          department: 'Sales Floor',
          branch: 'Main Outlet',
          loginTime: new Date(Date.now() - 28800000),
          logoutTime: new Date(Date.now() - 7200000),
          sessionDuration: '6h 00m',
          device: 'POS Terminal 2',
          browser: 'Chrome 125',
          operatingSystem: 'Windows 10',
          ipAddress: '192.168.1.15',
          status: 'Logged Out',
          createdAt: new Date(Date.now() - 28800000),
        },
      ];
      await LoginHistory.insertMany(sampleLogins);
      history = await LoginHistory.find(query).sort({ createdAt: -1 }).lean();
    }

    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/staff-activity/login-history/:id
exports.getLoginHistoryById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const history = await LoginHistory.findOne({ _id: req.params.id, tenantId }).lean();
    if (!history) {
      return res.status(404).json({ success: false, message: 'Login history entry not found' });
    }
    res.status(200).json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/staff-activity/force-logout/:employeeId
exports.forceLogoutUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { employeeId } = req.params;

    const updated = await LoginHistory.updateMany(
      { tenantId, employeeId, status: 'Online' },
      { $set: { status: 'Force Logged Out', logoutTime: new Date(), sessionDuration: 'Terminated by Admin' } }
    );

    await exports.recordActivityLog(req, {
      module: 'permissions',
      action: 'Force Logout User',
      recordId: employeeId,
      recordName: `Employee Session ${employeeId}`,
      newValue: 'Status set to Force Logged Out',
    });

    res.status(200).json({
      success: true,
      message: `Active session for employee terminated successfully.`,
      modifiedCount: updated.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/staff-activity/toggle-lock/:employeeId
exports.toggleLockAccount = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const user = await User.findById(employeeId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await exports.recordActivityLog(req, {
      module: 'permissions',
      action: user.isActive ? 'Account Unlocked' : 'Account Locked',
      recordId: employeeId,
      recordName: user.name,
      oldValue: `isActive: ${!user.isActive}`,
      newValue: `isActive: ${user.isActive}`,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.name} account is now ${user.isActive ? 'Unlocked' : 'Locked'}.`,
      isActive: user.isActive,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

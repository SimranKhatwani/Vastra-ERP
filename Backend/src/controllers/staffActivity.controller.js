const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const AuditLog = require('../models/AuditLog');
const LoginHistory = require('../models/LoginHistory');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

class StaffActivityController {
  /**
   * GET /staff-activity/activity-logs
   * Returns audit logs formatted for the StaffActivityView frontend
   */
  static getActivityLogs = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;
    const { search, module, action, status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (tenantId) filter.tenantId = tenantId;

    if (module && module !== 'All') {
      filter.module = new RegExp(`^${module}$`, 'i');
    }
    if (action && action !== 'All' && action !== 'all') {
      filter.action = action;
    }
    if (status && status !== 'All') {
      // Map frontend status to query
      if (status === 'Success') {
        filter.action = { $not: /FAILED|DELETE/ };
      } else if (status === 'Failed') {
        filter.action = /FAILED/;
      } else if (status === 'Warning') {
        filter.action = /DELETE|SUSPEND/;
      }
    }
    if (startDate) {
      filter.createdAt = filter.createdAt || {};
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt = filter.createdAt || {};
      filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    if (search) {
      filter.$or = [
        { userName: new RegExp(search, 'i') },
        { userEmail: new RegExp(search, 'i') },
        { action: new RegExp(search, 'i') },
        { module: new RegExp(search, 'i') },
        { item: new RegExp(search, 'i') },
        { displayName: new RegExp(search, 'i') },
        { reason: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Transform to match frontend expected shape
    const data = logs.map((log) => {
      const dt = new Date(log.createdAt);
      let logStatus = 'Success';
      if (String(log.action).includes('DELETE') || String(log.action).includes('SUSPEND')) {
        logStatus = 'Warning';
      }
      if (String(log.action).includes('FAILED')) {
        logStatus = 'Failed';
      }

      return {
        _id: log._id,
        activityId: `ACT-${String(log._id).slice(-6).toUpperCase()}`,
        date: log.date || dt.toLocaleDateString('en-IN'),
        time: log.time || dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        employeeName: log.userName || 'System',
        employeeEmail: log.userEmail || '',
        role: log.module || 'N/A',
        module: log.module || 'General',
        action: log.action,
        record: log.displayName || log.item || log.endpoint || '-',
        reason: log.reason || null,
        fieldChanged: log.fieldChanged || null,
        oldValue: log.oldValue !== undefined ? log.oldValue : null,
        newValue: log.newValue !== undefined ? log.newValue : null,
        status: logStatus,
        ipAddress: log.ipAddress || '-',
        userAgent: log.userAgent || '-',
        details: log.details || {},
        createdAt: log.createdAt
      };
    });

    const total = await AuditLog.countDocuments(filter);

    return res.status(200).json(new ApiResponse(200, data, 'Activity logs retrieved.', {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }));
  });

  /**
   * GET /staff-activity/login-history
   * Returns login history formatted for the StaffActivityView frontend
   */
  static getLoginHistory = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;
    const { search, role, status, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (tenantId) filter.tenantId = tenantId;

    if (status && status !== 'All') {
      filter.status = status.toUpperCase();
    }
    if (search) {
      filter.$or = [
        { email: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await LoginHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email designation roleId')
      .lean();

    // Collect unique userIds to fetch roles
    const userIds = [...new Set(logs.filter(l => l.userId).map(l => l.userId._id || l.userId))];
    const users = await User.find({ _id: { $in: userIds } }).populate('roleId', 'name').select('name roleId isLocked').lean();
    const userMap = {};
    users.forEach(u => {
      userMap[String(u._id)] = {
        name: u.name,
        role: u.roleId?.name || 'Staff',
        isLocked: !!u.isLocked
      };
    });

    // Fetch active refresh tokens for these users to determine real Active status
    const activeTokens = await RefreshToken.find({
      userId: { $in: userIds },
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).select('userId').lean();

    const activeUserIds = new Set(activeTokens.map(t => String(t.userId)));
    const processedActiveUsers = new Set();

    const data = logs.map((log) => {
      const dt = new Date(log.createdAt);
      const userId = log.userId?._id || log.userId;
      const userInfo = userId ? userMap[String(userId)] : null;

      // Parse user agent for device/browser
      const ua = log.userAgent || '';
      let browser = 'Unknown';
      let device = 'Desktop';
      if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari')) browser = 'Safari';
      else if (ua.includes('Edge')) browser = 'Edge';
      if (ua.includes('Mobile')) device = 'Mobile';
      else if (ua.includes('Tablet')) device = 'Tablet';

      let status = 'Failed';
      if (log.status === 'SUCCESS') {
        const userIdStr = String(userId);
        if (activeUserIds.has(userIdStr) && !processedActiveUsers.has(userIdStr)) {
          status = 'Active';
          processedActiveUsers.add(userIdStr);
        } else {
          status = 'Logged Out';
        }
      }

      return {
        _id: log._id,
        employeeId: userId,
        sessionId: `SES-${String(log._id).slice(-6).toUpperCase()}`,
        employeeName: userInfo?.name || log.email || 'Unknown',
        employeeEmail: log.email,
        role: userInfo?.role || 'Staff',
        isLocked: userInfo?.isLocked || false,
        loginTime: dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        loginDate: dt.toLocaleDateString('en-IN'),
        logoutTime: status === 'Active' ? '-' : dt.toLocaleDateString('en-IN'), // placeholder for ended session
        duration: status === 'Active' ? 'Active Now' : 'Ended',
        ipAddress: log.ipAddress || '-',
        device: device,
        browser: browser,
        status: status,
        failureReason: log.failureReason || null,
        createdAt: log.createdAt
      };
    });

    const total = await LoginHistory.countDocuments(filter);

    return res.status(200).json(new ApiResponse(200, data, 'Login history retrieved.', {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }));
  });

  static forceLogout = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    
    let user = null;
    if (employeeId) {
      user = await User.findById(employeeId);
      if (!user) {
        const Salesman = require('../models/masters/Salesman');
        const salesman = await Salesman.findById(employeeId);
        if (salesman) {
          user = await User.findOne({
            tenantId: req.tenantId,
            $or: [
              { phone: salesman.phone },
              { email: salesman.email },
              { name: salesman.name }
            ],
            isDeleted: false
          });
        }
      }
    }

    const targetUserId = user ? user._id : employeeId;
    const userEmail = user?.email || '';

    if (user) {
      user.forceLoggedOutAt = new Date();
      await user.save();
    }

    await RefreshToken.deleteMany({ userId: { $in: [targetUserId, employeeId] } });
    await RefreshToken.updateMany(
      { userId: { $in: [targetUserId, employeeId] } },
      { isRevoked: true }
    );

    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('user.force_logout', { 
        userId: String(targetUserId),
        employeeId: String(employeeId),
        email: userEmail,
        name: user?.name || '',
        timestamp: Date.now()
      });
    }

    return res.status(200).json(new ApiResponse(200, null, 'User forcefully logged out across all devices.'));
  });

  static toggleLock = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    let user = await User.findById(employeeId);
    if (!user) {
      const Salesman = require('../models/masters/Salesman');
      const salesman = await Salesman.findById(employeeId);
      if (salesman) {
        user = await User.findOne({
          tenantId: req.tenantId,
          $or: [
            { phone: salesman.phone },
            { email: salesman.email },
            { name: salesman.name }
          ],
          isDeleted: false
        });
      }
    }

    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, 'User not found.'));
    }

    user.isLocked = !user.isLocked;

    if (user.isLocked) {
      user.forceLoggedOutAt = new Date();
      await RefreshToken.deleteMany({ userId: user._id });
      await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });

      const io = req.app.get('io') || global.io;
      if (io) {
        io.emit('user.force_logout', { 
          userId: String(user._id),
          employeeId: String(employeeId),
          email: user.email,
          name: user.name,
          timestamp: Date.now()
        });
      }
    }

    await user.save();
    return res.status(200).json(new ApiResponse(200, { isLocked: user.isLocked }, `User account ${user.isLocked ? 'locked' : 'unlocked'}.`));
  });
}

module.exports = StaffActivityController;

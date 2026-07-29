const User = require('../models/userModel');
const Permission = require('../models/permissionModel');
const Employee = require('../models/employeeModel');
const RefreshToken = require('../models/refreshTokenModel');
const SessionAudit = require('../models/sessionAuditModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const getTenantPermissions = async (tenantId) => {
  try {
    if (!tenantId) return {};
    const records = await Permission.find({ tenantId }).lean();
    const permissionMap = {};
    records.forEach((rec) => {
      const roleStr = rec.role ? String(rec.role).toLowerCase() : 'admin';
      const key = rec.employeeId ? `emp_${rec.employeeId}` : roleStr;
      permissionMap[key] = {
        allowedModules: rec.allowedModules || [],
        moduleAccessLevels: rec.moduleAccessLevels ? (rec.moduleAccessLevels instanceof Map ? Object.fromEntries(rec.moduleAccessLevels) : rec.moduleAccessLevels) : {},
        tabPermissions: rec.tabPermissions ? (rec.tabPermissions instanceof Map ? Object.fromEntries(rec.tabPermissions) : rec.tabPermissions) : {},
        actionPermissions: rec.actionPermissions ? (rec.actionPermissions instanceof Map ? Object.fromEntries(rec.actionPermissions) : rec.actionPermissions) : {},
        updatedBy: rec.updatedBy,
        updatedAt: rec.updatedAt,
      };
    });
    return permissionMap;
  } catch (err) {
    console.error('Failed to fetch permissions for tenant:', err);
    return {};
  }
};

const attachEmployeeDetails = async (userObj) => {
  try {
    if (!userObj || !userObj.tenantId) return userObj;
    const cleanTenantId = userObj.tenantId._id || userObj.tenantId;
    const cleanEmail = (userObj.email || '').toLowerCase().trim();
    const cleanName = (userObj.name || '').toLowerCase().trim();
    const firstName = cleanName.split(' ')[0];

    const searchConditions = [];
    if (userObj.employeeId) searchConditions.push({ _id: userObj.employeeId });
    if (userObj.id) searchConditions.push({ userId: userObj.id });
    if (cleanEmail) searchConditions.push({ email: cleanEmail });
    if (cleanName) searchConditions.push({ name: { $regex: new RegExp(`^${cleanName}$`, 'i') } });
    if (firstName) searchConditions.push({ name: { $regex: new RegExp(firstName, 'i') } });

    const emp = await Employee.findOne({
      tenantId: cleanTenantId,
      $or: searchConditions
    }).lean();

    if (emp) {
      return {
        ...userObj,
        employeeId: emp._id,
        commissionRate: emp.commissionRate ?? (emp.role?.toLowerCase()?.includes('worker') ? 0.5 : (emp.role?.toLowerCase()?.includes('tailor') ? 4 : 1.5)),
        monthlySales: emp.monthlySales ?? 0,
        commissionEarned: emp.commissionEarned ?? Math.round((emp.monthlySales || 0) * ((emp.commissionRate || 0) / 100)),
        salary: emp.salary ?? 0,
        salesTarget: emp.salesTarget ?? 0,
        attendanceRate: emp.attendanceRate ?? 95,
        role: emp.role || userObj.role
      };
    }
  } catch (err) {
    console.error('Failed to attach employee details:', err);
  }
  return userObj;
};

exports.login = async (req, res) => {
  try {
    const { businessId, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/username and password' });
    }

    const cleanEmail = String(email || '').trim();
    const cleanBusinessId = String(businessId || '').trim();
    const prefix = cleanEmail.split('@')[0].split('.')[0];

    const user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
        { email: { $regex: new RegExp(prefix, 'i') } },
        { phone: cleanEmail },
        { name: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
        { name: { $regex: new RegExp(prefix, 'i') } }
      ]
    }).select('+password +passwordHash').populate('tenantId');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found in database' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account is inactive. Please contact your administrator.' });
    }

    if (user.tenantId && user.tenantId.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your business account is suspended. Please contact SuperAdmin.' });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Wrong or invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshTokenString = generateRefreshToken();

    // Create Refresh Token in DB
    const refreshToken = await RefreshToken.create({
      token: refreshTokenString,
      userId: user._id,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: req.ip,
      browser: req.headers['user-agent'],
    });

    // Create Session Audit in DB
    const sessionAudit = await SessionAudit.create({
      userId: user._id,
      tenantId: user.tenantId?._id || user.tenantId,
      ipAddress: req.ip,
      browser: req.headers['user-agent'],
      os: req.headers['sec-ch-ua-platform'] || 'Unknown', // Basic OS detection
    });

    try {
      const staffActivityController = require('./staffActivityController');
      await staffActivityController.recordLoginHistory(req, user, 'Online');
    } catch (e) {
      console.error('Failed to log login history', e);
    }

    const permissions = await getTenantPermissions(user.tenantId?._id || user.tenantId);
    let baseUser = { 
      id: user._id, 
      employeeId: user.employeeId,
      name: user.name, 
      email: user.email, 
      role: user.role,
      tenantId: user.tenantId?._id || user.tenantId
    };

    baseUser = await attachEmployeeDetails(baseUser);

    // Set HTTP-Only Cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie('refreshToken', refreshTokenString, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('sessionId', sessionAudit._id.toString(), {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      token: accessToken, // Returning for backward compatibility if needed, but cookies are preferred
      user: baseUser,
      permissions
    });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken, sessionId } = req.cookies;

    if (refreshToken) {
      await RefreshToken.findOneAndDelete({ token: refreshToken });
    }

    if (sessionId) {
      const reason = req.body.reason || 'Manual Logout';
      await SessionAudit.findByIdAndUpdate(sessionId, {
        logoutTime: new Date(),
        logoutReason: reason,
      });
    } else if (req.user) {
      // Fallback if sessionId cookie missing
      await SessionAudit.findOneAndUpdate(
        { userId: req.user.id, logoutTime: { $exists: false } },
        { logoutTime: new Date(), logoutReason: req.body.reason || 'Manual Logout' },
        { sort: { createdAt: -1 } }
      );
    }

    // Clear Cookies with same options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.clearCookie('sessionId', cookieOptions);

    try {
      if (req.user) {
        const staffActivityController = require('./staffActivityController');
        await staffActivityController.recordLoginHistory(req, req.user, 'Offline');
      }
    } catch (e) {}

    res.status(200).json({ success: true, message: 'Successfully logged out' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('tenantId', 'businessName plan status');
    const tenantId = user?.tenantId?._id || user?.tenantId;
    const permissions = await getTenantPermissions(tenantId);
    let userObj = user.toObject();
    userObj = await attachEmployeeDetails(userObj);
    res.status(200).json({ success: true, data: userObj, permissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

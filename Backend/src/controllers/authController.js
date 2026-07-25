const User = require('../models/userModel');
const Permission = require('../models/permissionModel');
const Employee = require('../models/employeeModel');
const jwt = require('jsonwebtoken');

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

    const emp = await Employee.findOne({
      tenantId: cleanTenantId,
      $or: [
        { email: cleanEmail },
        { name: { $regex: new RegExp(`^${cleanName}$`, 'i') } },
        { name: { $regex: new RegExp(firstName, 'i') } }
      ]
    }).lean();

    if (emp) {
      return {
        ...userObj,
        employeeId: emp._id,
        commissionRate: emp.commissionRate ?? 0,
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

    if (!businessId || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide a Business ID, email, and password' });
    }

    const user = await User.findOne({ email }).select('+password +passwordHash').populate('tenantId');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Please contact SuperAdmin to register your business.' });
    }

    if (user.businessCode !== businessId && (!user.tenantId || user.tenantId._id.toString() !== businessId)) {
      return res.status(401).json({ success: false, message: 'Invalid Business ID.' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account is inactive. Please contact your administrator.' });
    }

    if (user.tenantId && user.tenantId.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your business account is suspended. Please contact SuperAdmin.' });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'wrong or invalid credential try another' });
    }

    const token = generateToken(user._id);

    try {
      const staffActivityController = require('./staffActivityController');
      await staffActivityController.recordLoginHistory(req, user, 'Online');
    } catch (e) {
      console.error('Failed to log login history', e);
    }

    const permissions = await getTenantPermissions(user.tenantId?._id || user.tenantId);
    let baseUser = { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      tenantId: user.tenantId?._id || user.tenantId
    };

    baseUser = await attachEmployeeDetails(baseUser);

    res.status(200).json({
      success: true,
      token,
      user: baseUser,
      permissions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

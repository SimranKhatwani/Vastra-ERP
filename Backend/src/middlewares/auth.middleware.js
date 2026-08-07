const ApiError = require('../helpers/ApiError');
const asyncHandler = require('../helpers/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');
const Role = require('../models/Role');

const authenticate = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.accessToken;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Authentication failed. Token not provided.');
  }

  try {
    const decoded = verifyAccessToken(token);

    if (decoded.isSuperAdmin) {
      const superAdmin = await SuperAdmin.findById(decoded.id);
      if (!superAdmin || !superAdmin.isActive) {
        throw new ApiError(401, 'Super Admin account is inactive or disabled.');
      }
      req.user = {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        isSuperAdmin: true,
        permissions: ['*'] // SuperAdmin has all permissions
      };
      return next();
    }

    const user = await User.findById(decoded.id).populate('roleId');

    if (!user || user.isDeleted || user.status !== 'ACTIVE') {
      throw new ApiError(401, 'User account is invalid or deactivated.');
    }

    const role = user.roleId;
    const permissions = role ? role.permissions : [];

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId?._id,
      roleName: user.roleId?.name,
      isTenantOwner: user.isTenantOwner,
      isSuperAdmin: false,
      permissions
    };

    req.tenantId = user.tenantId;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired. Please refresh your token.');
    }
    throw new ApiError(401, err.message || 'Invalid authentication token.');
  }
});

module.exports = {
  authenticate
};

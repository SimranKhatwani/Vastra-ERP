const ApiError = require('../helpers/ApiError');

/**
 * Permission-based Authorization Middleware
 * Usage: authorize("product.create") or authorize(["product.create", "product.update"])
 */
const authorize = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized request.');
    }

    // SuperAdmin or Tenant Owner bypass permission checks
    if (req.user.isSuperAdmin || req.user.isTenantOwner) {
      return next();
    }

    const userPermissions = req.user.permissions || [];

    // Wildcard permission check
    if (userPermissions.includes('*')) {
      return next();
    }

    const requiredList = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    const hasPermission = requiredList.some(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      throw new ApiError(
        403,
        `Access Denied. You lack required permission: [${requiredList.join(', ')}]`
      );
    }

    next();
  };
};

module.exports = {
  authorize
};

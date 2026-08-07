const ApiError = require('../helpers/ApiError');
const asyncHandler = require('../helpers/asyncHandler');
const Tenant = require('../models/Tenant');

const tenantContext = asyncHandler(async (req, res, next) => {
  const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

  // SuperAdmin endpoints don't require tenant context validation, but if a tenant ID is provided, load it
  if (req.user?.isSuperAdmin) {
    if (tenantId) {
      const tenant = await Tenant.findById(tenantId);
      if (tenant && !tenant.isDeleted) {
        req.tenant = tenant;
        req.tenantId = tenant._id;
      }
    }
    return next();
  }

  if (!tenantId) {
    throw new ApiError(400, 'Tenant context missing in request.');
  }

  const tenant = await Tenant.findById(tenantId);

  if (!tenant || tenant.isDeleted) {
    throw new ApiError(404, 'Tenant account not found.');
  }

  if (tenant.status !== 'ACTIVE') {
    throw new ApiError(403, `Tenant subscription is currently ${tenant.status}. Please contact SuperAdmin.`);
  }

  req.tenant = tenant;
  req.tenantId = tenant._id;
  next();
});

module.exports = {
  tenantContext
};

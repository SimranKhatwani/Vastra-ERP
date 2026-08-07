const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const SuperAdminService = require('../services/superAdmin.service');

class SuperAdminController {
  static createTenant = asyncHandler(async (req, res) => {
    const tenant = await SuperAdminService.createTenant(req.body);
    return res.status(201).json(new ApiResponse(201, tenant, 'Tenant created successfully.'));
  });

  static getAllTenants = asyncHandler(async (req, res) => {
    const { tenants, pagination } = await SuperAdminService.getAllTenants(req.query);
    return res.status(200).json(new ApiResponse(200, tenants, 'Tenants retrieved successfully.', pagination));
  });

  static getTenantById = asyncHandler(async (req, res) => {
    const tenant = await SuperAdminService.getTenantById(req.params.tenantId);
    return res.status(200).json(new ApiResponse(200, tenant, 'Tenant details fetched.'));
  });

  static updateTenant = asyncHandler(async (req, res) => {
    const tenant = await SuperAdminService.updateTenant(req.params.tenantId, req.body);
    return res.status(200).json(new ApiResponse(200, tenant, 'Tenant updated successfully.'));
  });

  static suspendTenant = asyncHandler(async (req, res) => {
    const tenant = await SuperAdminService.suspendTenant(req.params.tenantId);
    return res.status(200).json(new ApiResponse(200, tenant, 'Tenant suspended.'));
  });

  static activateTenant = asyncHandler(async (req, res) => {
    const tenant = await SuperAdminService.activateTenant(req.params.tenantId);
    return res.status(200).json(new ApiResponse(200, tenant, 'Tenant activated.'));
  });

  static updateSubscription = asyncHandler(async (req, res) => {
    const tenant = await SuperAdminService.updateSubscription(req.params.tenantId, req.body);
    return res.status(200).json(new ApiResponse(200, tenant, 'Tenant subscription updated successfully.'));
  });

  static deleteTenant = asyncHandler(async (req, res) => {
    await SuperAdminService.deleteTenant(req.params.tenantId, req.user.id);
    return res.status(200).json(new ApiResponse(200, null, 'Tenant deleted successfully.'));
  });

  static getDashboard = asyncHandler(async (req, res) => {
    const metrics = await SuperAdminService.getSuperAdminDashboard();
    return res.status(200).json(new ApiResponse(200, metrics, 'Super Admin Dashboard metrics fetched.'));
  });
}

module.exports = SuperAdminController;

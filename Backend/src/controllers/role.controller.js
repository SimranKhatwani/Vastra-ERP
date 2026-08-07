const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const RoleService = require('../services/role.service');

class RoleController {
  static createRole = asyncHandler(async (req, res) => {
    const role = await RoleService.createRole(req.body, req.tenantId);
    return res.status(201).json(new ApiResponse(201, role, 'Role created successfully.'));
  });

  static getRoles = asyncHandler(async (req, res) => {
    const { roles, pagination } = await RoleService.getRoles(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, roles, 'Roles retrieved successfully.', pagination));
  });

  static getRoleById = asyncHandler(async (req, res) => {
    const role = await RoleService.getRoleById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, role, 'Role details fetched.'));
  });

  static updateRole = asyncHandler(async (req, res) => {
    const role = await RoleService.updateRole(req.params.id, req.body, req.tenantId);
    return res.status(200).json(new ApiResponse(200, role, 'Role updated successfully.'));
  });

  static deleteRole = asyncHandler(async (req, res) => {
    await RoleService.deleteRole(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, null, 'Role deleted successfully.'));
  });

  static restoreRole = asyncHandler(async (req, res) => {
    const role = await RoleService.restoreRole(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, role, 'Role restored successfully.'));
  });

  static assignPermissions = asyncHandler(async (req, res) => {
    const role = await RoleService.assignPermissions(req.params.id, req.body.permissions, req.tenantId);
    return res.status(200).json(new ApiResponse(200, role, 'Permissions assigned to role.'));
  });

  static cloneRole = asyncHandler(async (req, res) => {
    const role = await RoleService.cloneRole(req.params.id, req.body.name, req.tenantId);
    return res.status(201).json(new ApiResponse(201, role, 'Role cloned successfully.'));
  });

  static getPermissionMatrix = asyncHandler(async (req, res) => {
    const matrix = await RoleService.getPermissionMatrix(req.tenantId);
    return res.status(200).json(new ApiResponse(200, matrix, 'Permission matrix fetched successfully.'));
  });
}

module.exports = RoleController;

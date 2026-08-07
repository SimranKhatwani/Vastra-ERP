const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const UserService = require('../services/user.service');

class UserController {
  static createUser = asyncHandler(async (req, res) => {
    const user = await UserService.createUser(req.body, req.tenantId);
    return res.status(201).json(new ApiResponse(201, user, 'User created successfully.'));
  });

  static getUsers = asyncHandler(async (req, res) => {
    const { users, pagination } = await UserService.getUsers(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, users, 'Users retrieved successfully.', pagination));
  });

  static getUserById = asyncHandler(async (req, res) => {
    const user = await UserService.getUserById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, user, 'User details fetched.'));
  });

  static updateUser = asyncHandler(async (req, res) => {
    const user = await UserService.updateUser(req.params.id, req.body, req.tenantId);
    return res.status(200).json(new ApiResponse(200, user, 'User updated successfully.'));
  });

  static deleteUser = asyncHandler(async (req, res) => {
    await UserService.deleteUser(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, null, 'User deleted successfully.'));
  });

  static restoreUser = asyncHandler(async (req, res) => {
    const user = await UserService.restoreUser(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, user, 'User restored successfully.'));
  });

  static assignRole = asyncHandler(async (req, res) => {
    const user = await UserService.assignRole(req.params.id, req.body.roleId, req.tenantId);
    return res.status(200).json(new ApiResponse(200, user, 'Role assigned successfully.'));
  });

  static resetUserPassword = asyncHandler(async (req, res) => {
    await UserService.resetUserPassword(req.params.id, req.body.password, req.tenantId);
    return res.status(200).json(new ApiResponse(200, null, 'User password reset successfully.'));
  });

  static changeUserStatus = asyncHandler(async (req, res) => {
    const user = await UserService.changeUserStatus(req.params.id, req.body.status, req.tenantId);
    return res.status(200).json(new ApiResponse(200, user, 'User status updated.'));
  });

  static bulkDeleteUsers = asyncHandler(async (req, res) => {
    const result = await UserService.bulkDeleteUsers(req.body.userIds, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Bulk user delete completed.'));
  });

  static bulkUpdateStatus = asyncHandler(async (req, res) => {
    const result = await UserService.bulkUpdateStatus(req.body.userIds, req.body.status, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Bulk status update completed.'));
  });

  static exportUsers = asyncHandler(async (req, res) => {
    const exportResult = await UserService.exportUsers(req.query, req.tenantId, req.query.format || 'csv');
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      return res.send(exportResult.content);
    }
    return res.status(200).json(new ApiResponse(200, exportResult.content, 'Users exported successfully.'));
  });
}

module.exports = UserController;

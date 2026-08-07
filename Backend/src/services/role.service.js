const ApiError = require('../helpers/ApiError');
const Role = require('../models/Role');
const BaseRepository = require('../repositories/BaseRepository');
const { ALL_PERMISSIONS, PERMISSIONS } = require('../constants/permissions');

const roleRepo = new BaseRepository(Role);

class RoleService {
  static async createRole(roleData, tenantId) {
    const existing = await roleRepo.findOne({ name: roleData.name }, tenantId);
    if (existing) {
      throw new ApiError(400, `Role '${roleData.name}' already exists.`);
    }

    return roleRepo.create({
      ...roleData,
      tenantId
    }, tenantId);
  }

  static async getRoles(query = {}, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (query.search) {
      filter.name = new RegExp(query.search, 'i');
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const roles = await Role.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Role.countDocuments(filter);

    return {
      roles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getRoleById(roleId, tenantId) {
    const role = await roleRepo.findById(roleId, tenantId);
    if (!role) throw new ApiError(404, 'Role not found.');
    return role;
  }

  static async updateRole(roleId, updateData, tenantId) {
    const role = await roleRepo.findById(roleId, tenantId);
    if (!role) throw new ApiError(404, 'Role not found.');

    if (role.isSystemRole && updateData.name && updateData.name !== role.name) {
      throw new ApiError(400, 'System default role names cannot be modified.');
    }

    return roleRepo.update(roleId, updateData, tenantId);
  }

  static async deleteRole(roleId, userId, tenantId) {
    const role = await roleRepo.findById(roleId, tenantId);
    if (!role) throw new ApiError(404, 'Role not found.');

    if (role.isSystemRole) {
      throw new ApiError(400, 'System default roles cannot be deleted.');
    }

    return roleRepo.softDelete(roleId, userId, tenantId);
  }

  static async restoreRole(roleId, tenantId) {
    const role = await Role.findOne({ _id: roleId, tenantId });
    if (!role) throw new ApiError(404, 'Role not found.');
    role.restore();
    return role;
  }

  static async assignPermissions(roleId, permissions = [], tenantId) {
    const role = await roleRepo.findById(roleId, tenantId);
    if (!role) throw new ApiError(404, 'Role not found.');

    role.permissions = permissions;
    await role.save();
    return role;
  }

  static async cloneRole(roleId, newRoleName, tenantId) {
    const sourceRole = await roleRepo.findById(roleId, tenantId);
    if (!sourceRole) throw new ApiError(404, 'Source role not found.');

    const existing = await roleRepo.findOne({ name: newRoleName }, tenantId);
    if (existing) throw new ApiError(400, `Role with name '${newRoleName}' already exists.`);

    const cloned = await roleRepo.create({
      tenantId,
      name: newRoleName,
      description: `Cloned from ${sourceRole.name}`,
      permissions: [...sourceRole.permissions],
      isSystemRole: false
    }, tenantId);

    return cloned;
  }

  static async getPermissionMatrix(tenantId) {
    const roles = await Role.find({ tenantId, isDeleted: false });
    const allPermissions = ALL_PERMISSIONS;

    const matrix = allPermissions.map(perm => {
      const assignedRoles = roles.filter(r => r.permissions.includes(perm) || r.permissions.includes('*')).map(r => ({
        id: r._id,
        name: r.name
      }));
      return {
        permission: perm,
        assignedRoles
      };
    });

    return {
      allPermissions,
      matrix
    };
  }
}

module.exports = RoleService;

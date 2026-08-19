const ApiError = require('../helpers/ApiError');
const { hashPassword } = require('../utils/hash');
const User = require('../models/User');
const Role = require('../models/Role');
const BaseRepository = require('../repositories/BaseRepository');
const { formatExportData } = require('../helpers/export.helper');

const userRepo = new BaseRepository(User);

class UserService {
  static async createUser(userData, tenantId) {
    let email = userData.email ? userData.email.trim().toLowerCase() : null;
    if (email) {
      const existing = await userRepo.findOne({ email }, tenantId);
      if (existing) {
        throw new ApiError(400, 'User with this email already exists in your company.');
      }
    } else {
      email = undefined;
    }

    // Auto-generate password if not provided
    let generatedPassword = null;
    if (!userData.password) {
      const crypto = require('crypto');
      generatedPassword = crypto.randomBytes(4).toString('hex'); // 8-char random password
      userData.password = generatedPassword;
    }

    // If no roleId provided, find or create a default 'Staff' role
    if (!userData.roleId) {
      let defaultRole = await Role.findOne({ name: 'Staff', tenantId });
      if (!defaultRole) {
        defaultRole = await Role.create({ name: 'Staff', description: 'Default staff role', permissions: [], tenantId, isSystemRole: true });
      }
      userData.roleId = defaultRole._id;
    } else {
      const role = await Role.findOne({ _id: userData.roleId, tenantId });
      if (!role) {
        throw new ApiError(404, 'Selected role does not exist.');
      }
    }

    const hashedPassword = await hashPassword(userData.password);

    const user = await userRepo.create({
      ...userData,
      email,
      password: hashedPassword,
      plainPassword: userData.password,
      tenantId
    }, tenantId);

    const createdUser = await User.findById(user._id).select('-password').populate('roleId');
    // Attach generated password so controller can return it
    if (generatedPassword) {
      createdUser._generatedPassword = generatedPassword;
    }
    return createdUser;
  }

  static async getUsers(query = {}, tenantId) {
    const filter = { tenantId };
    
    if (query.includeDeleted === 'true') {
      // include deleted
    } else {
      filter.isDeleted = false;
    }

    if (query.status) filter.status = query.status;
    if (query.roleId) filter.roleId = query.roleId;

    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { email: new RegExp(query.search, 'i') },
        { phone: new RegExp(query.search, 'i') }
      ];
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-password')
      .populate('roleId assignedWarehouses')
      .sort(query.sort ? { [query.sort]: query.order === 'desc' ? -1 : 1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getUserById(userId, tenantId) {
    const user = await userRepo.findById(userId, tenantId, {
      populate: 'roleId assignedWarehouses',
      select: '-password'
    });
    if (!user) throw new ApiError(404, 'User not found.');
    return user;
  }

  static async updateUser(userId, updateData, tenantId) {
    if (updateData.password) {
      updateData.plainPassword = updateData.password;
      updateData.password = await hashPassword(updateData.password);
    }
    if (updateData.email) {
      const email = updateData.email.trim().toLowerCase();
      const existing = await userRepo.findOne({ email, _id: { $ne: userId } }, tenantId);
      if (existing) {
        throw new ApiError(400, 'User with this email already exists in your company.');
      }
      updateData.email = email;
    } else if (updateData.email === "" || updateData.email === null || updateData.email === undefined) {
      updateData.email = undefined;
    }
    const updatedUser = await userRepo.update(userId, updateData, tenantId, { new: true });
    if (!updatedUser) throw new ApiError(404, 'User not found.');
    return User.findById(updatedUser._id).select('-password').populate('roleId');
  }

  static async deleteUser(userId, currentUserId, tenantId) {
    if (userId.toString() === currentUserId.toString()) {
      throw new ApiError(400, 'You cannot delete your own account.');
    }
    return userRepo.softDelete(userId, currentUserId, tenantId);
  }

  static async restoreUser(userId, tenantId) {
    const user = await User.findOne({ _id: userId, tenantId });
    if (!user) throw new ApiError(404, 'User not found.');
    user.restore();
    return user;
  }

  static async assignRole(userId, roleId, tenantId) {
    const role = await Role.findOne({ _id: roleId, tenantId });
    if (!role) throw new ApiError(404, 'Role not found.');

    const user = await userRepo.update(userId, { roleId }, tenantId);
    if (!user) throw new ApiError(404, 'User not found.');
    return User.findById(user._id).select('-password').populate('roleId');
  }

  static async resetUserPassword(userId, newPassword, tenantId) {
    const hashedPassword = await hashPassword(newPassword);
    const user = await userRepo.update(userId, { 
      password: hashedPassword,
      plainPassword: newPassword
    }, tenantId);
    if (!user) throw new ApiError(404, 'User not found.');
    return true;
  }

  static async changeUserStatus(userId, status, tenantId) {
    const user = await userRepo.update(userId, { status }, tenantId);
    if (!user) throw new ApiError(404, 'User not found.');
    return user;
  }

  static async bulkDeleteUsers(userIds = [], currentUserId, tenantId) {
    const validIds = userIds.filter(id => id.toString() !== currentUserId.toString());
    await User.updateMany(
      { _id: { $in: validIds }, tenantId },
      { isDeleted: true, deletedAt: new Date(), deletedBy: currentUserId }
    );
    return { count: validIds.length };
  }

  static async bulkUpdateStatus(userIds = [], status, tenantId) {
    const result = await User.updateMany(
      { _id: { $in: userIds }, tenantId },
      { status }
    );
    return { modifiedCount: result.modifiedCount };
  }

  static async exportUsers(query = {}, tenantId, format = 'csv') {
    const { users } = await this.getUsers({ ...query, limit: 10000 }, tenantId);
    const exportData = users.map(u => ({
      ID: u._id.toString(),
      Name: u.name,
      Email: u.email,
      Phone: u.phone || '',
      Role: u.roleId?.name || 'N/A',
      Status: u.status,
      CreatedAt: u.createdAt
    }));
    return formatExportData(exportData, format);
  }
}

module.exports = UserService;

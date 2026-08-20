const ApiError = require('../helpers/ApiError');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Role = require('../models/Role');
const SuperAdmin = require('../models/SuperAdmin');
const RefreshToken = require('../models/RefreshToken');
const LoginHistory = require('../models/LoginHistory');
const { ALL_PERMISSIONS } = require('../constants/permissions');
const { ROLES } = require('../constants/roles');
const crypto = require('crypto');

class AuthService {
  /**
   * Register a new Tenant along with Owner user and default Tenant Admin Role
   */
  static async registerTenant(tenantData) {
    const existingTenant = await Tenant.findOne({ code: tenantData.code.toUpperCase() });
    if (existingTenant) {
      throw new ApiError(400, 'Tenant code already registered.');
    }

    const existingUser = await User.findOne({ email: tenantData.ownerEmail.toLowerCase() });
    if (existingUser) {
      throw new ApiError(400, 'User email already exists in system.');
    }

    const addressObj = typeof tenantData.address === 'string'
      ? { street: tenantData.address }
      : (tenantData.address || {});

    // 1. Create Tenant
    const tenant = await Tenant.create({
      companyName: tenantData.companyName,
      code: tenantData.code.toUpperCase(),
      email: tenantData.email,
      phone: tenantData.phone,
      address: addressObj
    });

    // 2. Create Default Admin Role with ALL_PERMISSIONS
    const adminRole = await Role.create({
      tenantId: tenant._id,
      name: ROLES.TENANT_ADMIN,
      description: 'Full administrative access for tenant',
      permissions: ALL_PERMISSIONS,
      isSystemRole: true
    });

    // 3. Create Tenant Owner User
    const hashedPassword = await hashPassword(tenantData.ownerPassword);
    const ownerUser = await User.create({
      tenantId: tenant._id,
      name: tenantData.ownerName,
      email: tenantData.ownerEmail.toLowerCase(),
      password: hashedPassword,
      phone: tenantData.ownerPhone,
      roleId: adminRole._id,
      isTenantOwner: true
    });

    return {
      tenant: {
        id: tenant._id,
        companyName: tenant.companyName,
        code: tenant.code
      },
      owner: {
        id: ownerUser._id,
        name: ownerUser.name,
        email: ownerUser.email
      }
    };
  }

  /**
   * Universal Login (SuperAdmin or Tenant User)
   */
  static async login({ email, password, tenantCode, businessId }, reqInfo = {}) {
    let user = null;
    let isSuperAdmin = false;
    let tenant = null;

    const effectiveTenantCode = tenantCode || businessId;

    // Check if SuperAdmin attempt
    const superAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (superAdmin && !effectiveTenantCode) {
      const isMatch = await comparePassword(password, superAdmin.password);
      if (isMatch) {
        isSuperAdmin = true;
        user = superAdmin;
      }
    }

    if (!isSuperAdmin) {
      if (effectiveTenantCode) {
        tenant = await Tenant.findOne({ code: effectiveTenantCode.toUpperCase(), isDeleted: false });
        if (!tenant) {
          throw new ApiError(404, 'Invalid tenant code.');
        }
        if (tenant.status !== 'ACTIVE') {
          throw new ApiError(403, `Tenant subscription is currently ${tenant.status}.`);
        }
      }

      const userQuery = { email: email.toLowerCase(), isDeleted: false };
      if (tenant) userQuery.tenantId = tenant._id;

      user = await User.findOne(userQuery).populate('roleId');

      if (!user) {
        await LoginHistory.create({
          email,
          ipAddress: reqInfo.ip,
          userAgent: reqInfo.userAgent,
          status: 'FAILED',
          failureReason: 'User not found'
        });
        throw new ApiError(401, 'Invalid credentials.');
      }

      if (user.isLocked || user.status !== 'ACTIVE') {
        await LoginHistory.create({
          userId: user._id,
          tenantId: user.tenantId,
          email,
          ipAddress: reqInfo.ip,
          userAgent: reqInfo.userAgent,
          status: 'FAILED',
          failureReason: 'Account is locked or deactivated by administrator'
        });
        throw new ApiError(403, 'Your account has been locked or deactivated by an administrator. Please contact your manager.');
      }

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        await LoginHistory.create({
          userId: user._id,
          tenantId: user.tenantId,
          email,
          ipAddress: reqInfo.ip,
          userAgent: reqInfo.userAgent,
          status: 'FAILED',
          failureReason: 'Invalid password'
        });
        throw new ApiError(401, 'Invalid credentials.');
      }
    }

    // Token Generation
    const tokenPayload = isSuperAdmin ? {
      id: user._id,
      email: user.email,
      isSuperAdmin: true
    } : {
      id: user._id,
      tenantId: user.tenantId,
      email: user.email,
      roleId: user.roleId?._id,
      isSuperAdmin: false
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save RefreshToken
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      userId: user._id,
      tenantId: isSuperAdmin ? null : user.tenantId,
      token: refreshToken,
      expiresAt
    });

    // Reset forceLoggedOutAt on successful login
    if (!isSuperAdmin && user) {
      user.forceLoggedOutAt = null;
      user.lastLogin = new Date();
      await user.save();
    }

    // Record Login History
    await LoginHistory.create({
      userId: user._id,
      tenantId: isSuperAdmin ? null : user.tenantId,
      email: user.email,
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent,
      status: 'SUCCESS'
    });

    // Record login in Audit Log for activity feed
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      tenantId: isSuperAdmin ? null : user.tenantId,
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'LOGIN',
      module: 'auth',
      method: 'POST',
      endpoint: '/api/auth/login',
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent,
      details: { loginType: isSuperAdmin ? 'SuperAdmin' : 'User' }
    });

    if (!isSuperAdmin) {
      user.lastLogin = new Date();
      await user.save();
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        designation: user.designation || '',
        isSuperAdmin,
        tenantId: isSuperAdmin ? null : user.tenantId,
        role: isSuperAdmin ? 'SUPER_ADMIN' : (user.roleId?.name || user.role || 'Staff'),
        permissions: isSuperAdmin ? ['*'] : (user.roleId?.permissions || [])
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Verify supervisor credentials
   */
  static async verifySupervisor(email, password) {
    // Check SuperAdmin
    const superAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (superAdmin) {
      const isMatch = await comparePassword(password, superAdmin.password);
      if (isMatch) return true;
    }

    // Check normal User across any tenant
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (user) {
      const isMatch = await comparePassword(password, user.password);
      if (isMatch) return true;
    }
    
    return false;
  }

  /**
   * Refresh Access Token
   */
  static async refreshAccessToken(tokenStr) {
    if (!tokenStr) {
      throw new ApiError(400, 'Refresh token required.');
    }

    const storedToken = await RefreshToken.findOne({ token: tokenStr, isRevoked: false });
    if (!storedToken) {
      throw new ApiError(401, 'Invalid or revoked refresh token.');
    }

    try {
      const decoded = verifyRefreshToken(tokenStr);

      let payload = {};
      if (decoded.isSuperAdmin) {
        payload = { id: decoded.id, email: decoded.email, isSuperAdmin: true };
      } else {
        payload = {
          id: decoded.id,
          tenantId: decoded.tenantId,
          email: decoded.email,
          roleId: decoded.roleId,
          isSuperAdmin: false
        };
      }

      const newAccessToken = generateAccessToken(payload);
      return { accessToken: newAccessToken };
    } catch (err) {
      throw new ApiError(401, 'Expired or invalid refresh token.');
    }
  }

  /**
   * Logout User & Revoke Refresh Token
   */
  static async logout(tokenStr, reqUser = null, reqInfo = {}) {
    if (tokenStr) {
      await RefreshToken.findOneAndUpdate({ token: tokenStr }, { isRevoked: true });
    }
    // Record logout in Audit Log
    if (reqUser) {
      const AuditLog = require('../models/AuditLog');
      await AuditLog.create({
        tenantId: reqUser.tenantId || null,
        userId: reqUser.id,
        userName: reqUser.name || '',
        userEmail: reqUser.email || '',
        action: 'LOGOUT',
        module: 'auth',
        method: 'POST',
        endpoint: '/api/auth/logout',
        ipAddress: reqInfo.ip || '',
        userAgent: reqInfo.userAgent || '',
        details: {}
      });
    }
    return true;
  }

  /**
   * Change Password
   */
  static async changePassword(userId, { oldPassword, newPassword }, isSuperAdmin = false) {
    const Model = isSuperAdmin ? SuperAdmin : User;
    const user = await Model.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, 'Current password incorrect.');
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    return true;
  }

  /**
   * Forgot Password - generate reset token
   */
  static async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (!user) {
      // Return success to avoid email enumeration
      return { message: 'Password reset instructions sent if email exists.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    return { resetToken, message: 'Password reset token generated.' };
  }

  /**
   * Reset Password
   */
  static async resetPassword({ token, newPassword }) {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
      isDeleted: false
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired password reset token.');
    }

    user.password = await hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return true;
  }

  /**
   * Get Current User Profile
   */
  static async getCurrentUser(reqUser) {
    if (reqUser.isSuperAdmin) {
      const admin = await SuperAdmin.findById(reqUser.id).select('-password');
      return admin;
    }
    const user = await User.findById(reqUser.id).select('-password').populate('roleId tenantId');
    if (!user) throw new ApiError(404, 'User not found.');
    return user;
  }

  /**
   * Update Profile
   */
  static async updateProfile(userId, updateData, isSuperAdmin = false) {
    const fieldsToUpdate = {};
    if (updateData.name) fieldsToUpdate.name = updateData.name;
    if (updateData.phone) fieldsToUpdate.phone = updateData.phone;

    const Model = isSuperAdmin ? SuperAdmin : User;
    const updated = await Model.findByIdAndUpdate(userId, fieldsToUpdate, { new: true }).select('-password');
    return updated;
  }

  /**
   * Impersonate another user (Admin privilege)
   */
  static async impersonate(adminId, targetUserId) {
    const admin = await User.findById(adminId).populate('roleId');
    if (!admin || (!admin.isTenantOwner && admin.roleId?.name !== 'TENANT_ADMIN')) {
      throw new ApiError(403, 'Only administrators can swap user contexts.');
    }

    const targetUser = await User.findById(targetUserId).populate('roleId');
    if (!targetUser || String(targetUser.tenantId) !== String(admin.tenantId)) {
      throw new ApiError(404, 'Target user not found or belongs to a different business.');
    }

    // Token Generation for Target User
    const tokenPayload = {
      id: targetUser._id,
      tenantId: targetUser.tenantId,
      email: targetUser.email,
      roleId: targetUser.roleId?._id,
      isSuperAdmin: false,
      originalUserId: admin._id // Flag indicating impersonation
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save RefreshToken
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      userId: targetUser._id,
      tenantId: targetUser.tenantId,
      token: refreshToken,
      expiresAt
    });

    return {
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone || '',
        designation: targetUser.designation || '',
        isSuperAdmin: false,
        tenantId: targetUser.tenantId,
        role: targetUser.roleId?.name || targetUser.role || 'Staff',
        permissions: targetUser.roleId?.permissions || [],
        originalUserId: admin._id
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Stop impersonating and return to original admin session
   */
  static async stopImpersonating(originalUserId) {
    const admin = await User.findById(originalUserId).populate('roleId');
    if (!admin) {
      throw new ApiError(404, 'Original admin user not found.');
    }

    const tokenPayload = {
      id: admin._id,
      tenantId: admin.tenantId,
      email: admin.email,
      roleId: admin.roleId?._id,
      isSuperAdmin: false
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save RefreshToken
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      userId: admin._id,
      tenantId: admin.tenantId,
      token: refreshToken,
      expiresAt
    });

    return {
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone || '',
        designation: admin.designation || '',
        isSuperAdmin: false,
        tenantId: admin.tenantId,
        role: admin.roleId?.name || admin.role || 'TENANT_ADMIN',
        permissions: admin.roleId?.permissions || []
      },
      accessToken,
      refreshToken
    };
  }
}

module.exports = AuthService;

const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const AuthService = require('../services/auth.service');

class AuthController {
  static registerTenant = asyncHandler(async (req, res) => {
    const result = await AuthService.registerTenant(req.body);
    return res.status(201).json(new ApiResponse(201, result, 'Tenant registered successfully.'));
  });

  static login = asyncHandler(async (req, res) => {
    const reqInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    const result = await AuthService.login(req.body, reqInfo);

    // Set Refresh Token in HTTP-only Cookie (cross-site safe)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Set Access Token in HTTP-only Cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    return res.status(200).json(new ApiResponse(200, result, 'Login successful.'));
  });

  static verifySupervisor = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const isValid = await AuthService.verifySupervisor(email, password);
    if (!isValid) {
      throw new ApiError(401, 'Invalid supervisor credentials.');
    }
    return res.status(200).json(new ApiResponse(200, { verified: true }, 'Verified successfully.'));
  });

  static refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await AuthService.refreshAccessToken(refreshToken);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    return res.status(200).json(new ApiResponse(200, result, 'Token refreshed successfully.'));
  });

  static logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const reqInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };
    await AuthService.logout(refreshToken, req.user || null, reqInfo);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'));
  });

  static getProfile = asyncHandler(async (req, res) => {
    const profile = await AuthService.getCurrentUser(req.user);
    return res.status(200).json(new ApiResponse(200, profile, 'User profile fetched.'));
  });

  static updateProfile = asyncHandler(async (req, res) => {
    const updated = await AuthService.updateProfile(req.user.id, req.body, req.user.isSuperAdmin);
    return res.status(200).json(new ApiResponse(200, updated, 'Profile updated successfully.'));
  });

  static changePassword = asyncHandler(async (req, res) => {
    await AuthService.changePassword(req.user.id, req.body, req.user.isSuperAdmin);
    return res.status(200).json(new ApiResponse(200, null, 'Password changed successfully.'));
  });

  static forgotPassword = asyncHandler(async (req, res) => {
    const result = await AuthService.forgotPassword(req.body.email);
    return res.status(200).json(new ApiResponse(200, result, result.message));
  });

  static resetPassword = asyncHandler(async (req, res) => {
    await AuthService.resetPassword(req.body);
    return res.status(200).json(new ApiResponse(200, null, 'Password reset successfully.'));
  });

  static currentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, 'Current user context.'));
  });

  static impersonate = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await AuthService.impersonate(req.user.id, userId);

    // Set Access Token in HTTP-only Cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60 * 1000
    });

    // Set Refresh Token in HTTP-only Cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json(new ApiResponse(200, result, 'Swapped user context successfully.'));
  });

  static stopImpersonating = asyncHandler(async (req, res) => {
    // Check if current token payload contains originalUserId
    const ApiError = require('../helpers/ApiError');
    // Decode target originalUserId from token (it is in req.user as authenticated)
    // Wait! Let's check: does req.user have originalUserId?
    // Let's verify where req.user is populated: in auth.middleware.js:
    // req.user = { id: user._id, ... }
    // Wait! In auth.middleware.js, did we add originalUserId to req.user?
    // No! In auth.middleware.js:
    // req.user = { id: user._id, tenantId: user.tenantId, roleId: user.roleId?._id, roleName: user.roleId?.name, isTenantOwner: user.isTenantOwner, isSuperAdmin: false, permissions }
    // It does NOT copy decoded.originalUserId!
    // Let's check auth.middleware.js:
    // decoded = verifyAccessToken(token);
    // So decoded contains originalUserId. We should add it to req.user in auth.middleware.js!
    // Yes! Let's make sure req.user.originalUserId = decoded.originalUserId || null;
    const originalUserId = req.user.originalUserId;
    if (!originalUserId) {
      throw new ApiError(400, 'Not currently in an impersonated session.');
    }

    const result = await AuthService.stopImpersonating(originalUserId);

    // Set Access Token in HTTP-only Cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60 * 1000
    });

    // Set Refresh Token in HTTP-only Cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json(new ApiResponse(200, result, 'Returned to admin session.'));
  });
}

module.exports = AuthController;

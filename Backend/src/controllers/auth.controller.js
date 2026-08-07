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

    // Set Refresh Token in HTTP-only Cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 150 * 60 * 1000 // 150 minutes
    });

    return res.status(200).json(new ApiResponse(200, result, 'Login successful.'));
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
    await AuthService.logout(refreshToken);

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
}

module.exports = AuthController;

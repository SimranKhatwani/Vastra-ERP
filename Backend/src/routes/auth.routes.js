const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validator.middleware');
const { registerTenantSchema, loginSchema } = require('../validators/auth.validator');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');

const router = express.Router();

router.post('/register-tenant', authLimiter, validate(registerTenantSchema), AuthController.registerTenant);
router.post('/login', authLimiter, validate(loginSchema), auditLog('USER_LOGIN', 'Auth'), AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, AuthController.updateProfile);
router.post('/change-password', authenticate, AuthController.changePassword);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', authenticate, AuthController.currentUser);

module.exports = router;

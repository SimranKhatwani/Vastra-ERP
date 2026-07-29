// Backend/src/middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Protect routes – verifies HttpOnly accessToken cookie first, then Bearer header.
exports.protect = async (req, res, next) => {
  let token;

  // 1️⃣ Prefer cookie (HttpOnly, Secure, SameSite)
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // 2️⃣ Fallback to Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // No token – respond with clear message
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: token missing',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user || !req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    // Back‑Button Protection – prevent caching of authenticated responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    next();
  } catch (err) {
    // Specific handling for expired tokens
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired – please log in again',
      });
    }
    console.error('Auth Middleware Error:', err);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

// Grant access to specific roles (case‑insensitive check)
exports.authorize = (...roles) => {
  const allowedRoles = roles.map((r) => r.toLowerCase());
  return (req, res, next) => {
    const userRole = (req.user && req.user.role ? req.user.role : '').toLowerCase();
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // relaxed limit for real-time app
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    statusCode: 429,
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};

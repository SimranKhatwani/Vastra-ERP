/**
 * JWT Helper utilities for Access Token & Refresh Token generation/verification
 */
const jwt = require('jsonwebtoken');

const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'vastra_access_secret_super_secure_key_2026_!@#$',
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m' }
  );
};

const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'vastra_refresh_secret_super_secure_key_2026_%^&*',
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET || 'vastra_access_secret_super_secure_key_2026_!@#$'
  );
};

const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || 'vastra_refresh_secret_super_secure_key_2026_%^&*'
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};

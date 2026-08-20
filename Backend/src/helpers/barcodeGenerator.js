/**
 * Utility to generate unique barcodes & IPNs for Inventory Pieces
 */
const crypto = require('crypto');

const generateBarcode = (tenantId, prefix = 'VST') => {
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomInt(1000, 9999);
  return `${prefix}${timestamp}${random}`;
};

const generateUniqueCode = (designNo, size, index = 0) => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const timeHex = Date.now().toString(36).slice(-3).toUpperCase();
  const randBytes = crypto.randomBytes(3);
  let randPart = '';
  for (let i = 0; i < 3; i++) {
    randPart += chars[randBytes[i] % chars.length];
  }
  return `UC-${timeHex}${randPart}`;
};

module.exports = {
  generateBarcode,
  generateUniqueCode
};

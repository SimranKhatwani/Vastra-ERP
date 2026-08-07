/**
 * Utility to generate unique barcodes & IPNs for Inventory Pieces
 */
const crypto = require('crypto');

const generateBarcode = (tenantId, prefix = 'VST') => {
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomInt(1000, 9999);
  return `${prefix}${timestamp}${random}`;
};

const generateUniqueCode = (designNo, size, index) => {
  const cleanDesign = (designNo || 'GEN').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const cleanSize = (size || 'FREE').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const seq = String(index).padStart(4, '0');
  return `${cleanDesign}-${cleanSize}-${seq}`;
};

module.exports = {
  generateBarcode,
  generateUniqueCode
};

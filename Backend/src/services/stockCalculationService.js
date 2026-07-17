const Product = require('../models/productModel');

/**
 * Recalculates stock, threshold, stockPercentage, and status for a given product document.
 * @param {Object} product - Mongoose Product Document
 * @returns {Object} product - Modified product document (not saved yet)
 */
exports.calculateStockStatus = (product) => {
  // Base values
  const openingStock = product.openingStock || 0;
  const purchasedQuantity = product.purchasedQuantity || 0;
  const soldQuantity = product.soldQuantity || 0;
  const reservedQuantity = product.reservedQuantity || 0;

  // Calculate current stock
  const currentStock = openingStock + purchasedQuantity - soldQuantity - reservedQuantity;
  product.stock = currentStock > 0 ? currentStock : 0; // Prevent negative display if misaligned

  // Total available base (for threshold calculation)
  // According to logic: Low Stock Threshold = Total Purchased Quantity × 10%
  // If opening stock is considered part of "Purchased", we might use openingStock + purchasedQuantity.
  // We'll use total incoming stock:
  const totalIncoming = openingStock + purchasedQuantity;
  product.threshold = Math.floor(totalIncoming * 0.10);

  // Stock percentage calculation
  if (totalIncoming > 0) {
    product.stockPercentage = Number(((product.stock / totalIncoming) * 100).toFixed(1));
  } else {
    product.stockPercentage = 0;
  }

  // Determine status
  if (product.stock === 0) {
    product.status = 'Out of Stock';
  } else if (product.stock <= product.threshold) {
    product.status = 'Low Stock';
  } else {
    product.status = 'In Stock';
  }

  return product;
};

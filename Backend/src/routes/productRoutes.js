const express = require('express');
const { createProduct, getProducts, updateProduct, deleteProduct, adjustStock, scanProduct, getTaxConfig, updateTaxConfig, searchBilling } = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/search-billing', protect, searchBilling);
router.get('/scan/:barcode', protect, scanProduct);

router.route('/tax-config')
  .get(protect, getTaxConfig)
  .put(protect, updateTaxConfig);

router.route('/')
  .post(protect, createProduct)
  .get(protect, getProducts);

router.route('/:id')
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

router.route('/:id/adjust-stock')
  .put(protect, adjustStock);

module.exports = router;

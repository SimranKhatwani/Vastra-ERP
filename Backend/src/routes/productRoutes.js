const express = require('express');
const { createProduct, getProducts, updateProduct, deleteProduct, adjustStock } = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createProduct)
  .get(protect, getProducts);

router.route('/:id')
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

router.route('/:id/adjust-stock')
  .put(protect, adjustStock);

module.exports = router;

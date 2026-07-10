const express = require('express');
const { createPurchaseOrder, getPurchaseOrders, updatePurchaseOrder } = require('../controllers/purchaseOrderController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createPurchaseOrder)
  .get(protect, getPurchaseOrders);

router.route('/:id')
  .put(protect, updatePurchaseOrder);

module.exports = router;

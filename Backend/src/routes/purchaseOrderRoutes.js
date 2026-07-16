const express = require('express');
const { createPurchaseOrder, getPurchaseOrders, updatePurchaseOrder, deletePurchaseOrder } = require('../controllers/purchaseOrderController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createPurchaseOrder)
  .get(protect, getPurchaseOrders);

router.route('/:id')
  .put(protect, updatePurchaseOrder)
  .delete(protect, deletePurchaseOrder);

module.exports = router;

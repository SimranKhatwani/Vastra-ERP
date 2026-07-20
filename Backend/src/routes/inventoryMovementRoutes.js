const express = require('express');
const {
  createInventoryMovement,
  getInventoryMovements,
  getInventoryMovementById,
  filterMovements,
  getMovementsByProduct,
  getMovementsByWarehouse,
  getMovementsByBatch,
  getMovementsByDateRange
} = require('../controllers/inventoryMovementController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Define routes using protect middleware for auth and tenant checking
router.route('/')
  .post(protect, createInventoryMovement)
  .get(protect, getInventoryMovements);
router.get('/filter', protect, filterMovements);
router.get('/date-range', protect, getMovementsByDateRange);
router.get('/product/:productId', protect, getMovementsByProduct);
router.get('/warehouse/:warehouseId', protect, getMovementsByWarehouse);
router.get('/batch/:batchId', protect, getMovementsByBatch);
router.get('/:id', protect, getInventoryMovementById);

module.exports = router;

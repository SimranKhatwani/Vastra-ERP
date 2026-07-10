const express = require('express');
const { createSupplier, getSuppliers, updateSupplier, deleteSupplier, settleBalance } = require('../controllers/supplierController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createSupplier)
  .get(protect, getSuppliers);

router.route('/:id')
  .put(protect, updateSupplier)
  .delete(protect, deleteSupplier);

router.route('/:id/settle')
  .put(protect, settleBalance);

module.exports = router;

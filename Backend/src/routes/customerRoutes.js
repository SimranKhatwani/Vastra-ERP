const express = require('express');
const { createCustomer, getCustomers, updateCustomer, deleteCustomer, settleBalance } = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createCustomer)
  .get(protect, getCustomers);

router.route('/:id')
  .put(protect, updateCustomer)
  .delete(protect, deleteCustomer);

router.route('/:id/settle')
  .put(protect, settleBalance);

module.exports = router;

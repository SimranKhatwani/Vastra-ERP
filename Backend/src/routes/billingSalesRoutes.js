const express = require('express');
const { createSalesInvoice, getSalesReports } = require('../controllers/billingSalesController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/invoice')
  .post(protect, createSalesInvoice);

router.route('/reports')
  .get(protect, getSalesReports);

module.exports = router;

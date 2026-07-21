const express = require('express');
const {
  createSalesInvoice,
  getSalesReports,
  collectOutstandingPayment,
  sendPaymentReminder
} = require('../controllers/billingSalesController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/invoice')
  .post(protect, createSalesInvoice);

router.route('/reports')
  .get(protect, getSalesReports);

// Outstanding receivables payment and reminder routes
router.post('/collect-payment', protect, collectOutstandingPayment);
router.post('/send-reminder', protect, sendPaymentReminder);

module.exports = router;

const express = require('express');
const { createInvoice, getInvoices, getInvoiceById, sendWhatsApp } = require('../controllers/invoiceController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createInvoice)
  .get(protect, getInvoices);

router.route('/:id')
  .get(protect, getInvoiceById);

// WhatsApp dispatch/retry endpoint
router.route('/:id/send-whatsapp')
  .post(protect, sendWhatsApp);

module.exports = router;

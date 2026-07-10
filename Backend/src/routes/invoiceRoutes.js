const express = require('express');
const { createInvoice, getInvoices, getInvoiceById } = require('../controllers/invoiceController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createInvoice)
  .get(protect, getInvoices);

router.route('/:id')
  .get(protect, getInvoiceById);

module.exports = router;

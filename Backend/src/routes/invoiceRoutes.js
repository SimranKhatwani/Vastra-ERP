const express = require('express');
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  sendWhatsApp,
  scanInvoice,
  changeDeliveryDate,
  assignTailor,
  processSalesReturn,
  processSalesExchange
} = require('../controllers/invoiceController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/scan/:invoiceNo', protect, scanInvoice);
router.put('/:id/delivery-date', protect, changeDeliveryDate);
router.put('/:id/assign-tailor', protect, assignTailor);

router.post('/:id/return', protect, processSalesReturn);
router.post('/:id/exchange', protect, processSalesExchange);

router.route('/')
  .post(protect, createInvoice)
  .get(protect, getInvoices);

router.route('/:id')
  .get(protect, getInvoiceById);

// WhatsApp dispatch/retry endpoint
router.route('/:id/send-whatsapp')
  .post(protect, sendWhatsApp);

module.exports = router;

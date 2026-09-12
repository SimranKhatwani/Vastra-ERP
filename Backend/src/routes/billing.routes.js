const express = require('express');
const BillingController = require('../controllers/billing.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { validate } = require('../middlewares/validator.middleware');
const { createSaleBillSchema } = require('../validators/billing.validator');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

// Public routes for QR code scanning (mobile phone cameras, network detection, public tracking & PDF streaming)
router.get('/public/network-info', BillingController.getNetworkInfo);
router.get('/public/track/:billNo', BillingController.trackBillPublic);
router.get('/public/invoice-pdf/:billNo', BillingController.streamInvoicePDFPublic);
router.get('/public/pdf/:billNo', BillingController.streamInvoicePDFPublic);
router.get('/invoice-pdf/:billNo', BillingController.streamInvoicePDFPublic);

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.BILLING_CREATE), validate(createSaleBillSchema), auditLog('CREATE_SALE_BILL', 'billing'), BillingController.createSaleBill);
router.post('/hold', authorize(PERMISSIONS.BILLING_CREATE), auditLog('HOLD_BILL', 'billing'), BillingController.holdBill);
router.get('/hold', authorize(PERMISSIONS.BILLING_READ), BillingController.getHoldBills);
router.post('/hold/:id/retrieve', authorize(PERMISSIONS.BILLING_CREATE), auditLog('RETRIEVE_HOLD_BILL', 'billing'), BillingController.retrieveHoldBill);
router.get('/', authorize(PERMISSIONS.BILLING_READ), BillingController.getSaleBills);
router.get('/export', authorize(PERMISSIONS.BILLING_READ), BillingController.exportSaleBills);
router.get('/:id', authorize(PERMISSIONS.BILLING_READ), BillingController.getSaleBillById);
router.get('/:id/payments', authorize(PERMISSIONS.BILLING_READ), BillingController.getBillPayments);
router.post('/:id/payments', authorize(PERMISSIONS.BILLING_CREATE), auditLog('RECORD_BILL_PAYMENT', 'billing'), BillingController.recordBillPayment);
router.get('/:id/reprint', authorize(PERMISSIONS.BILLING_READ), BillingController.reprintBill);
router.post('/:id/cancel', authorize(PERMISSIONS.BILLING_CANCEL), auditLog('CANCEL_SALE_BILL', 'billing'), BillingController.cancelSaleBill);
router.patch('/:id/payment-method', authorize(PERMISSIONS.BILLING_CREATE), auditLog('UPDATE_PAYMENT_METHOD', 'billing'), BillingController.updatePaymentMethod);
router.delete('/:id', authorize(PERMISSIONS.BILLING_CANCEL), auditLog('DELETE_SALE_BILL', 'billing'), BillingController.deleteSaleBill);

module.exports = router;

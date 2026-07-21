const express = require('express');
const {
  createVendor,
  getVendors,
  updateVendor,
  deleteVendor,
  getVendorPurchaseHistory,
  getVendorPaymentHistory,
  getVendorLedger,
} = require('../controllers/vendorController');
const {
  createGRN,
  getGRNs,
  createPurchaseInvoice,
  getPurchaseInvoices,
  collectVendorOutstandingPayment,
  createPurchaseReturn,
  getPurchaseReturns,
  getPurchaseAuditLogs,
  getPendingPurchases,
  getPurchaseReports,
  getVendorOutstandingList,
  getVendorPaymentHistory: getAllPayments,
} = require('../controllers/purchaseController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// ── Vendor Routes ─────────────────────────────────────────────────────────────
router.route('/vendors')
  .get(protect, getVendors)
  .post(protect, createVendor);

router.route('/vendors/:id')
  .put(protect, updateVendor)
  .delete(protect, deleteVendor);

router.get('/vendors/:id/history', protect, getVendorPurchaseHistory);
router.get('/vendors/:id/payments', protect, getVendorPaymentHistory);
router.get('/vendors/:id/ledger', protect, getVendorLedger);

// ── Goods Receipt Entry (GRN) ─────────────────────────────────────────────────
router.route('/grn')
  .get(protect, getGRNs)
  .post(protect, createGRN);

// ── Purchase Invoice Management ───────────────────────────────────────────────
router.route('/invoice')
  .get(protect, getPurchaseInvoices)
  .post(protect, createPurchaseInvoice);

// ── Payment Settlement ─────────────────────────────────────────────────────────
router.post('/payment', protect, collectVendorOutstandingPayment);

// ── Purchase Returns ──────────────────────────────────────────────────────────
router.route('/return')
  .get(protect, getPurchaseReturns)
  .post(protect, createPurchaseReturn);

// ── Pending Purchase Tracking ─────────────────────────────────────────────────
router.get('/pending-tracking', protect, getPendingPurchases);

// ── Purchase Reports ──────────────────────────────────────────────────────────
router.get('/reports', protect, getPurchaseReports);

// ── Vendor Outstanding Reports ─────────────────────────────────────────────────
router.get('/outstanding', protect, getVendorOutstandingList);

// ── All Vendor Payments History ────────────────────────────────────────────────
router.get('/payments', protect, getAllPayments);

// ── Audit Logs ────────────────────────────────────────────────────────────────
router.get('/audit-logs', protect, getPurchaseAuditLogs);

module.exports = router;

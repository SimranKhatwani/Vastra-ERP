const express = require('express');
const PurchaseController = require('../controllers/purchase.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { validate } = require('../middlewares/validator.middleware');
const { createPurchaseBillSchema } = require('../validators/purchase.validator');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

const isValidObjectId = (req, res, next) => {
  if (req.params.id && !/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return next('route');
  }
  next();
};

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.PURCHASE_CREATE), validate(createPurchaseBillSchema), auditLog('CREATE_PURCHASE_BILL', 'purchase'), PurchaseController.createPurchaseBill);
router.get('/', authorize(PERMISSIONS.PURCHASE_READ), auditLog('PURCHASE_VIEW', 'purchase'), PurchaseController.getPurchaseBills);
router.get('/export', authorize(PERMISSIONS.PURCHASE_READ), PurchaseController.exportPurchaseBills);
router.get('/vendors', (req, res) => res.redirect(307, '/api/vendors'));

// UI stubs to prevent 404s in frontend App.jsx on load
router.get('/grn', (req, res) => res.status(200).json({ success: true, data: [], message: 'GRN mock data' }));
router.get('/invoice', (req, res) => res.status(200).json({ success: true, data: [], message: 'Invoice mock data' }));
router.get('/return', (req, res) => res.status(200).json({ success: true, data: [], message: 'Return mock data' }));
router.get('/pending-tracking', (req, res) => res.status(200).json({ success: true, data: [], message: 'Pending tracking mock data' }));
router.get('/outstanding', (req, res) => res.status(200).json({ success: true, data: [], message: 'Outstanding mock data' }));

router.get('/:id', isValidObjectId, authorize(PERMISSIONS.PURCHASE_READ), auditLog('PURCHASE_VIEW_DETAIL', 'purchase'), PurchaseController.getPurchaseBillById);
router.post('/:id/approve', isValidObjectId, authorize(PERMISSIONS.PURCHASE_APPROVE), auditLog('APPROVE_PURCHASE', 'purchase'), PurchaseController.approvePurchaseBill);
router.post('/:id/cancel', isValidObjectId, authorize(PERMISSIONS.PURCHASE_CANCEL), auditLog('CANCEL_PURCHASE', 'purchase'), PurchaseController.cancelPurchaseBill);


router.put('/:id', isValidObjectId, authorize(PERMISSIONS.PURCHASE_UPDATE), validate(createPurchaseBillSchema), auditLog('UPDATE_PURCHASE_BILL', 'purchase'), PurchaseController.updatePurchaseBill);
router.delete('/:id', isValidObjectId, authorize(PERMISSIONS.PURCHASE_DELETE), auditLog('DELETE_PURCHASE_BILL', 'purchase'), PurchaseController.deletePurchaseBill);
router.get('/:id/items', isValidObjectId, authorize(PERMISSIONS.PURCHASE_READ_ITEMS), PurchaseController.getPurchaseBillItems);

module.exports = router;

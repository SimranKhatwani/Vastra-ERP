const express = require('express');
const PSSMController = require('../controllers/pssm.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

// Public routes for PSSM Alteration Slip QR Code scanning (mobile phone cameras, public tracking & PDF streaming)
router.get('/public/track/:pssmNo', PSSMController.trackPSSMPublic);
router.get('/track/:pssmNo', PSSMController.trackPSSMPublic);
router.get('/public/pssm-pdf/:pssmNo', PSSMController.streamPSSMPDFPublic);
router.get('/public/pdf/:pssmNo', PSSMController.streamPSSMPDFPublic);
router.get('/pssm-pdf/:pssmNo', PSSMController.streamPSSMPDFPublic);

// Public routes for Item-Level Barcode Tracking & Completion
router.get('/public/item-track/:barcode', PSSMController.trackItemBarcodePublic);
router.get('/item-track/:barcode', PSSMController.trackItemBarcodePublic);
router.post('/public/item-complete/:barcode', PSSMController.updateItemStatusByBarcodePublic);
router.post('/item-complete/:barcode', PSSMController.updateItemStatusByBarcodePublic);

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.ALTERATION_CREATE), auditLog('CREATE_PSSM', 'pssm'), PSSMController.createPSSM);
router.get('/', authorize(PERMISSIONS.ALTERATION_READ), PSSMController.getAllPSSMRecords);
router.get('/pending-assignment', authorize(PERMISSIONS.ALTERATION_READ), PSSMController.getPendingAssignments);
router.get('/pending-assignments', authorize(PERMISSIONS.ALTERATION_READ), PSSMController.getPendingAssignments);
router.get('/salesman/pending', authorize(PERMISSIONS.ALTERATION_READ), PSSMController.getSalesmanPending);
router.get('/salesman/dashboard', PSSMController.getSalesmanDashboard);
router.get('/salesman-dashboard', PSSMController.getSalesmanDashboard);
router.post('/scan-complete', PSSMController.scanCompleteItem);
router.post('/absent-reassign', PSSMController.checkAbsentSalesmen);
router.get('/bill/:billBarcode', authorize(PERMISSIONS.ALTERATION_READ), PSSMController.getBillPSSMByBarcode);
router.get('/barcode/:billBarcode', authorize(PERMISSIONS.ALTERATION_READ), PSSMController.getBillPSSMByBarcode);
router.patch('/items/:itemId/assign', authorize(PERMISSIONS.ALTERATION_UPDATE), auditLog('ASSIGN_PSSM_ITEM', 'pssm'), PSSMController.assignTailorVendor);
router.patch('/items/:itemId/status', authorize(PERMISSIONS.ALTERATION_UPDATE), auditLog('UPDATE_PSSM_ITEM_STATUS', 'pssm'), PSSMController.updateItemStatus);
router.post('/collection', authorize(PERMISSIONS.ALTERATION_UPDATE), auditLog('PROCESS_PSSM_COLLECTION', 'pssm'), PSSMController.processCollection);

module.exports = router;

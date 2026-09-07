const express = require('express');
const PSSMController = require('../controllers/pssm.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.ALTERATION_CREATE), auditLog('CREATE_PSSM', 'pssm'), PSSMController.createPSSM);
router.get('/', authorize(PERMISSIONS.ALTERATION_READ), PSSMController.getAllPSSMRecords);
router.get('/pending-assignment', authorize(PERMISSIONS.ALTERATION_READ), PSSMController.getPendingAssignments);
router.get('/pending-assignments', authorize(PERMISSIONS.ALTERATION_READ), PSSMController.getPendingAssignments);
router.get('/salesman/pending', authorize(PERMISSIONS.ALTERATION_READ), PSSMController.getSalesmanPending);
router.post('/scan-complete', authorize(PERMISSIONS.ALTERATION_UPDATE), auditLog('SCAN_COMPLETE_PSSM', 'pssm'), PSSMController.scanCompleteItem);
router.post('/absent-reassign', authorize(PERMISSIONS.ALTERATION_UPDATE), auditLog('ABSENT_REASSIGN_PSSM', 'pssm'), PSSMController.checkAbsentSalesmen);
router.get('/bill/:billBarcode', authorize(PERMISSIONS.ALTERATION_READ), PSSMController.getBillPSSMByBarcode);
router.get('/barcode/:billBarcode', authorize(PERMISSIONS.ALTERATION_READ), PSSMController.getBillPSSMByBarcode);
router.patch('/items/:itemId/assign', authorize(PERMISSIONS.ALTERATION_UPDATE), auditLog('ASSIGN_PSSM_ITEM', 'pssm'), PSSMController.assignTailorVendor);
router.patch('/items/:itemId/status', authorize(PERMISSIONS.ALTERATION_UPDATE), auditLog('UPDATE_PSSM_ITEM_STATUS', 'pssm'), PSSMController.updateItemStatus);
router.post('/collection', authorize(PERMISSIONS.ALTERATION_UPDATE), auditLog('PROCESS_PSSM_COLLECTION', 'pssm'), PSSMController.processCollection);

module.exports = router;

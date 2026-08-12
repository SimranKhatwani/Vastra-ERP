const express = require('express');
const PTImportController = require('../controllers/ptImport.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const upload = require('../middlewares/upload.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);


router.post(
  '/',
  authorize(PERMISSIONS.PURCHASE_CREATE),
  upload.single('file'),
  auditLog('PT_EXCEL_IMPORT', 'pt_import'),
  PTImportController.importPTExcel
);

router.post('/validate', authorize(PERMISSIONS.PT_IMPORT_VALIDATE), PTImportController.validatePTExcel);
router.get('/template', authorize(PERMISSIONS.PT_IMPORT_READ), PTImportController.getTemplate);
router.get('/history', authorize(PERMISSIONS.PT_IMPORT_READ), PTImportController.getHistory);
router.get('/:id', authorize(PERMISSIONS.PT_IMPORT_READ), PTImportController.getById);
router.post('/:id/rollback', authorize(PERMISSIONS.PT_IMPORT_ROLLBACK), PTImportController.rollbackImport);
router.delete('/:id', authorize(PERMISSIONS.PT_IMPORT_ROLLBACK), PTImportController.deleteImport);
module.exports = router;

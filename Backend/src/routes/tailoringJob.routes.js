const express = require('express');
const TailoringJobController = require('../controllers/tailoringJob.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.get('/', authorize(PERMISSIONS.TAILORING_JOB_READ), TailoringJobController.getAllTailoringJobs);
router.get('/invoice/:invoiceNo', authorize(PERMISSIONS.TAILORING_JOB_READ), TailoringJobController.getByInvoiceNo);
router.get('/by-pssm/:pssmId', authorize(PERMISSIONS.TAILORING_JOB_READ), TailoringJobController.getByPSSM);
router.get('/by-bill/:saleBillId', authorize(PERMISSIONS.TAILORING_JOB_READ), TailoringJobController.getBySaleBill);
router.get('/:id/slip', authorize(PERMISSIONS.TAILORING_JOB_READ), TailoringJobController.getSlipData);
router.get('/:id', authorize(PERMISSIONS.TAILORING_JOB_READ), TailoringJobController.getTailoringJobById);

router.patch('/:id/status', authorize(PERMISSIONS.TAILORING_JOB_UPDATE), auditLog('UPDATE_TAILORING_STATUS', 'tailoring'), TailoringJobController.updateStatus);
router.patch('/:id', authorize(PERMISSIONS.TAILORING_JOB_UPDATE), auditLog('UPDATE_TAILORING_JOB', 'tailoring'), TailoringJobController.updateTailoringJob);

module.exports = router;

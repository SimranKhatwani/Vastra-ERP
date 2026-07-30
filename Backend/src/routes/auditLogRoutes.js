const express = require('express');
const { logPurchaseView } = require('../controllers/auditLogController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/purchase-view', protect, logPurchaseView);

module.exports = router;

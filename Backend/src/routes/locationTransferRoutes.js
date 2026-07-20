const express = require('express');
const { getTransfers, createTransfer, updateTransferStatus } = require('../controllers/locationTransferController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getTransfers)
  .post(protect, createTransfer);

router.route('/:id/status')
  .put(protect, updateTransferStatus);

module.exports = router;

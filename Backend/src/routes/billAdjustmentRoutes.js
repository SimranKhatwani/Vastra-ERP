const express = require('express');
const { createAdjustment, getAdjustments } = require('../controllers/billAdjustmentController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createAdjustment)
  .get(protect, getAdjustments);

module.exports = router;

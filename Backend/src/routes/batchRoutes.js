const express = require('express');
const { getBatches, getBatchById, createBatch, updateBatch, deleteBatch } = require('../controllers/batchController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getBatches)
  .post(protect, createBatch);

router.route('/:id')
  .get(protect, getBatchById)
  .put(protect, updateBatch)
  .delete(protect, deleteBatch);

module.exports = router;

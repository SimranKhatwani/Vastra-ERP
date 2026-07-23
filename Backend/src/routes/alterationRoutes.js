const express = require('express');
const {
  createAlteration,
  getAlterations,
  getAlterationById,
  updateAlteration,
  deleteAlteration,
} = require('../controllers/alterationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router
  .route('/')
  .post(protect, createAlteration)
  .get(protect, getAlterations);

router
  .route('/:id')
  .get(protect, getAlterationById)
  .patch(protect, updateAlteration)
  .put(protect, updateAlteration)
  .delete(protect, deleteAlteration);

module.exports = router;

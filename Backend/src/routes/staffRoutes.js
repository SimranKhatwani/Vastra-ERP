const express = require('express');
const router = express.Router();
const { getStaff, createStaff, updateStaff, deleteStaff } = require('../controllers/staffController');
const { protect } = require('../middlewares/authMiddleware');

// Admin staff routes
router.route('/').get(protect, getStaff).post(protect, createStaff);
router.route('/:id').put(protect, updateStaff).delete(protect, deleteStaff);

module.exports = router;

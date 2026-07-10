const express = require('express');
const router = express.Router();
const { getStaff, createStaff, updateStaff, deleteStaff } = require('../controllers/staffController');

// Admin staff routes
router.route('/').get(getStaff).post(createStaff);
router.route('/:id').put(updateStaff).delete(deleteStaff);

module.exports = router;

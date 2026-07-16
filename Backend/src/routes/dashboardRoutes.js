const express = require('express');
const router = express.Router();
const { getMorningActions } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/morning-actions', protect, getMorningActions);

module.exports = router;

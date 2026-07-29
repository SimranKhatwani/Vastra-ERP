const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getActivityFeed } = require('../controllers/activityFeedController');

router.get('/', protect, getActivityFeed);

module.exports = router;

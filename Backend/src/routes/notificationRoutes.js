const express = require('express');
const { createNotification, getNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createNotification)
  .get(protect, getNotifications);

router.route('/:id/read')
  .put(protect, markAsRead);

module.exports = router;

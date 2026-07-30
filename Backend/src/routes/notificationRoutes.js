const express = require('express');
const { createNotification, getNotifications, markAsRead, clearNotifications } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createNotification)
  .get(protect, getNotifications);

router.route('/clear')
  .delete(protect, clearNotifications);

router.route('/:id/read')
  .put(protect, markAsRead);

module.exports = router;

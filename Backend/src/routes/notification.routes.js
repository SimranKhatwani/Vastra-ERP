const express = require('express');
const NotificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');

const router = express.Router();

router.use(authenticate, tenantContext);

router.get('/', NotificationController.getNotifications);
router.put('/:id/read', NotificationController.markAsRead);
router.delete('/clear', NotificationController.clearAll);
router.post('/check-deadlines', NotificationController.triggerDeadlineCheck);

module.exports = router;

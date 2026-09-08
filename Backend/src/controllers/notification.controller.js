const NotificationService = require('../services/notification.service');
const ApiResponse = require('../helpers/ApiResponse');
const asyncHandler = require('../helpers/asyncHandler');

class NotificationController {
  static getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const tenantId = req.tenantId || req.user.tenantId;

    const notifications = await NotificationService.getUserNotifications(userId, tenantId);
    const unreadCount = notifications.filter(n => !n.read).length;

    return res.status(200).json(
      new ApiResponse(200, { notifications, unreadCount }, 'Notifications retrieved successfully')
    );
  });

  static markAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const tenantId = req.tenantId || req.user.tenantId;
    const { id } = req.params;

    const updated = await NotificationService.markAsRead(id, userId, tenantId);
    return res.status(200).json(
      new ApiResponse(200, updated, 'Notification marked as read')
    );
  });

  static clearAll = asyncHandler(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const tenantId = req.tenantId || req.user.tenantId;

    await NotificationService.markAllAsRead(userId, tenantId);
    return res.status(200).json(
      new ApiResponse(200, null, 'All notifications marked as read')
    );
  });

  static triggerDeadlineCheck = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user.tenantId;
    const result = await NotificationService.checkAndGeneratePSSDeadlineAlerts(tenantId);
    return res.status(200).json(
      new ApiResponse(200, result, 'PSS deadline check executed')
    );
  });
}

module.exports = NotificationController;

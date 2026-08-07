const Notification = require('../models/Notification');

class NotificationService {
  static async sendNotification({ userId, title, message, type = 'INFO', link }, tenantId) {
    return Notification.create({
      tenantId,
      userId,
      title,
      message,
      type,
      link
    });
  }

  static async getUserNotifications(userId, tenantId) {
    return Notification.find({ userId, tenantId, isDeleted: false }).sort({ createdAt: -1 });
  }

  static async markAsRead(notificationId, userId, tenantId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId, tenantId },
      { isRead: true },
      { new: true }
    );
  }
}

module.exports = NotificationService;

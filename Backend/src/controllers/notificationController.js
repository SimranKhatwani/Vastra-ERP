const Notification = require('../models/notificationModel');
const { emitToTenant, emitToRole, emitToUser } = require('../socket/socketServer');

exports.createNotification = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const notification = await Notification.create({
      ...req.body,
      tenantId
    });

    emitToTenant(tenantId, 'notification.created', {
      notification,
      tenantId,
      event: 'notification.created'
    });
    emitToRole('admin', 'notification.created', { notification, tenantId, event: 'notification.created' });

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const notifications = await Notification.find({ tenantId }).sort('-date');
      
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let notification = await Notification.findOne({ _id: req.params.id, tenantId });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    emitToTenant(tenantId, 'notification.updated', {
      notification,
      tenantId,
      event: 'notification.updated'
    });

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearNotifications = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    await Notification.deleteMany({ tenantId });
    res.status(200).json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

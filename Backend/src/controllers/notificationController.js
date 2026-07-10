const Notification = require('../models/notificationModel');

exports.createNotification = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const notification = await Notification.create({
      ...req.body,
      tenantId
    });

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

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

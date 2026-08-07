const mongoose = require('mongoose');
const baseSchemaPlugin = require('./plugins/baseSchema');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['INFO', 'WARNING', 'ALERT', 'SYSTEM'],
    default: 'INFO'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  link: String
});

notificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });
notificationSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Notification', notificationSchema);

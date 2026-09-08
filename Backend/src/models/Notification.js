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
    enum: ['INFO', 'WARNING', 'ALERT', 'SYSTEM', 'CRITICAL'],
    default: 'INFO'
  },
  priority: {
    type: String,
    enum: ['Normal', 'High', 'Critical'],
    default: 'Normal'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  link: String,
  category: {
    type: String,
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  resolved: {
    type: Boolean,
    default: false
  }
});

notificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });
notificationSchema.index({ tenantId: 1, entityId: 1, category: 1, userId: 1 });
notificationSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Notification', notificationSchema);

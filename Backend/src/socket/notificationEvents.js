const registerNotificationHandlers = (io, socket) => {
  socket.on('notification:mark_read', ({ notificationId }) => {
    if (!notificationId) return;
    socket.emit('notification:read_ack', { notificationId, success: true });
  });
};

module.exports = { registerNotificationHandlers };

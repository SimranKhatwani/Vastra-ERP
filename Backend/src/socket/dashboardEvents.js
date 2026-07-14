const registerDashboardHandlers = (io, socket) => {
  socket.on('dashboard:request_refresh', ({ tenantId }) => {
    if (!tenantId) return;
    socket.emit('dashboard:refresh_ack', { success: true, tenantId });
  });
};

module.exports = { registerDashboardHandlers };

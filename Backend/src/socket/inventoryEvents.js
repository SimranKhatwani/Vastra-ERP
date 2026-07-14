const registerInventoryHandlers = (io, socket) => {
  socket.on('inventory:request_sync', ({ tenantId }) => {
    if (!tenantId) return;
    socket.emit('inventory:sync_ack', { success: true, tenantId });
  });
};

module.exports = { registerInventoryHandlers };

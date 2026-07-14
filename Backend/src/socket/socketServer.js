const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { registerNotificationHandlers } = require('./notificationEvents');
const { registerInventoryHandlers } = require('./inventoryEvents');
const { registerDashboardHandlers } = require('./dashboardEvents');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split('Bearer ')[1];
      if (!token) {
        return next(new Error('Unauthorized socket connection'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name email role tenantId businessCode');
      if (!user || !user.isActive) {
        return next(new Error('Unauthorized socket connection'));
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId?.toString?.() || user.tenantId,
        businessCode: user.businessCode,
      };
      next();
    } catch (error) {
      next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    if (!user) return;

    socket.join(`tenant:${user.tenantId}`);
    socket.join(`role:${user.role?.toLowerCase()}`);
    socket.join(`user:${user.id}`);

    registerNotificationHandlers(io, socket);
    registerInventoryHandlers(io, socket);
    registerDashboardHandlers(io, socket);

    socket.on('disconnect', () => {
      // Cleanup is implicit with socket disconnect
    });
  });

  return io;
};

const getIO = () => io;

const emitToTenant = (tenantId, event, payload) => {
  if (!io || !tenantId) return;
  io.to(`tenant:${tenantId}`).emit(event, payload);
};

const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
};

const emitToRole = (role, event, payload) => {
  if (!io || !role) return;
  io.to(`role:${role.toLowerCase()}`).emit(event, payload);
};

module.exports = {
  initializeSocket,
  getIO,
  emitToTenant,
  emitToUser,
  emitToRole,
};

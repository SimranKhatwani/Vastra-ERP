require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
connectDB().then(() => {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.info(`[Socket.IO] Client Connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`[Socket.IO] Client Disconnected: ${socket.id}`);
    });
  });

  app.set('io', io);

  server.listen(PORT, () => {
    logger.info(`=======================================================`);
    logger.info(`  Vastra ERP Multi-tenant Backend Server Running       `);
    logger.info(`  Environment : ${process.env.NODE_ENV || 'development'}`);
    logger.info(`  Port        : ${PORT}`);
    logger.info(`  Socket.IO   : Connected & Ready                      `);
    logger.info(`  Health Check: http://localhost:${PORT}/health        `);
    logger.info(`=======================================================`);
  });

  // Handle Unhandled Rejections
  process.on('unhandledRejection', (err) => {
    logger.error(`UNHANDLED REJECTION! Shutting down... ${err.name}: ${err.message}`);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle Uncaught Exceptions
  process.on('uncaughtException', (err) => {
    logger.error(`UNCAUGHT EXCEPTION! Shutting down... ${err}`);
    process.exit(1);
  });

  // Graceful shutdown for nodemon restarts
  process.once('SIGUSR2', () => {
    logger.info('SIGUSR2 received. Shutting down gracefully for nodemon restart...');
    server.close(() => {
      process.kill(process.pid, 'SIGUSR2');
    });
  });

  // Graceful shutdown for Ctrl+C
  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    server.close(() => {
      process.exit(0);
    });
  });

  // Graceful shutdown for termination signals
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      process.exit(0);
    });
  });
});

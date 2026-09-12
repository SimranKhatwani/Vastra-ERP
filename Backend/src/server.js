const dns = require('dns');
require('dotenv').config();
try {
  const dnsServers = process.env.DNS_SERVER ? [process.env.DNS_SERVER, '1.1.1.1'] : ['8.8.8.8', '1.1.1.1'];
  dns.setServers(dnsServers);
} catch (e) {}
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5001;

// Connect to Database and start server
connectDB().then(async () => {
  // Sync plain passwords for existing seed users if missing
  try {
    const User = require('./models/User');
    const usersToUpdate = await User.find({
      $or: [
        { plainPassword: { $exists: false } },
        { plainPassword: null },
        { plainPassword: '' }
      ]
    });
    if (usersToUpdate.length > 0) {
      logger.info(`[Migration] Found ${usersToUpdate.length} users with missing plainPassword.`);
      for (let u of usersToUpdate) {
        if (u.email.toLowerCase().includes('rajat')) {
          u.plainPassword = 'password123';
        } else if (u.email.toLowerCase().includes('john')) {
          u.plainPassword = 'password123';
        } else {
          u.plainPassword = 'password123';
        }
        await u.save();
        logger.info(`[Migration] Updated plainPassword for ${u.email}`);
      }
    }
  } catch (err) {
    logger.error('Failed to run plainPassword database migration: ' + err.message);
  }

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
  global.io = io;

  server.listen(PORT, () => {
    logger.info(`=======================================================`);
    logger.info(`  Vastra ERP Multi-tenant Backend Server Running       `);
    logger.info(`  Environment : ${process.env.NODE_ENV || 'development'}`);
    logger.info(`  Port        : ${PORT}`);
    logger.info(`  Socket.IO   : Connected & Ready                      `);
    logger.info(`  Health Check: http://localhost:${PORT}/health        `);
    logger.info(`=======================================================`);

    // Periodic PSS Delivery Deadline Monitor (initial run in 5s, recurring every 15 mins)
    const NotificationService = require('./services/notification.service');
    setTimeout(() => {
      NotificationService.runGlobalPSSDeadlineCheck().catch(err => {
        logger.error(`[PSS Deadline Monitor Error]: ${err.message}`);
      });
    }, 5000);

    setInterval(() => {
      NotificationService.runGlobalPSSDeadlineCheck().catch(err => {
        logger.error(`[PSS Deadline Monitor Error]: ${err.message}`);
      });
    }, 15 * 60 * 1000);

    // Auto-launch secure Cloudflare public tunnel for mobile phone QR code scans (works on 4G/5G mobile data)
    if (process.env.NODE_ENV !== 'production' && !process.env.DISABLE_PUBLIC_TUNNEL) {
      setTimeout(() => {
        import('untun').then(m => m.startTunnel({ port: 3000 })).then(async tunnel => {
          const tunnelUrl = await tunnel.getURL();
          global.publicTrackingBaseUrl = tunnelUrl;
          logger.info(`[Public QR Tracking Tunnel] Ready at: ${tunnelUrl}`);
        }).catch(err => {
          logger.warn(`[Public QR Tracking Tunnel] Notice: ${err.message}`);
        });
      }, 1000);
    }
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

const mongoose = require('mongoose');
const dns = require('dns');
const logger = require('../utils/logger');

// Set public DNS servers to resolve MongoDB Atlas SRV records on Windows networks if local DNS blocks SRV queries
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore environment restrictions on custom DNS
}

const connectDB = async () => {
  const primaryURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vastra_erp';
  const localFallbackURI = 'mongodb://127.0.0.1:27017/vastra_erp';

  mongoose.set('strictQuery', false);

  try {
    const conn = await mongoose.connect(primaryURI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000 // 5 sec timeout to avoid hanging indefinitely
    });

    logger.info(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (primaryError) {
    logger.warn(`Primary MongoDB connection failed (${primaryError.message}). Attempting local MongoDB fallback...`);

    try {
      const conn = await mongoose.connect(localFallbackURI, {
        autoIndex: true,
        serverSelectionTimeoutMS: 5000
      });
      logger.info(`MongoDB Local Fallback Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    } catch (fallbackError) {
      logger.error(`Error connecting to MongoDB Atlas: ${primaryError.message}`);
      logger.error(`Error connecting to Local MongoDB: ${fallbackError.message}`);
      logger.error('Please check internet connection / DNS settings or start local MongoDB service on mongodb://127.0.0.1:27017.');
      process.exit(1);
    }
  }

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Retrying connection...');
  });
};

module.exports = connectDB;

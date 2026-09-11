const mongoose = require('mongoose');
const dns = require('dns');
const logger = require('../utils/logger');

try {
  const dnsServers = process.env.DNS_SERVER ? [process.env.DNS_SERVER, '1.1.1.1'] : ['8.8.8.8', '1.1.1.1'];
  dns.setServers(dnsServers);
} catch (e) {
  // Ignore
}

const directCloudURI = 'mongodb://vibhu:9t0NeSrKS9H9w2ZT@ac-wzmbjri-shard-00-00.5bvc54y.mongodb.net:27017,ac-wzmbjri-shard-00-01.5bvc54y.mongodb.net:27017,ac-wzmbjri-shard-00-02.5bvc54y.mongodb.net:27017/vastra_erp?ssl=true&replicaSet=atlas-dh2kzi-shard-0&authSource=admin';

const postConnectIndexSync = async (conn) => {
  try {
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    const colNames = collections.map(c => c.name);
    
    if (colNames.includes('inventorypieces')) {
      const indexes = await db.collection('inventorypieces').indexes();
      const barcodeIdx = indexes.find(i => i.name === 'tenantId_1_barcode_1' && i.unique);
      if (barcodeIdx) {
        await db.collection('inventorypieces').dropIndex('tenantId_1_barcode_1');
        logger.info('Dropped legacy unique tenantId_1_barcode_1 index from inventorypieces');
      }
    }

    if (colNames.includes('products')) {
      const prodIndexes = await db.collection('products').indexes();
      const itemCodeIdx = prodIndexes.find(i => i.name === 'tenantId_1_itemCode_1' && i.unique);
      if (itemCodeIdx) {
        await db.collection('products').dropIndex('tenantId_1_itemCode_1');
        logger.info('Dropped unique tenantId_1_itemCode_1 index from products');
      }
    }
  } catch (idxErr) {
    logger.warn(`Index sync warning: ${idxErr.message}`);
  }
};

const connectDB = async () => {
  const primaryDirectURI = process.env.MONGODB_DIRECT_URI || directCloudURI;
  const srvURI = process.env.MONGODB_URI || 'mongodb+srv://vibhu:9t0NeSrKS9H9w2ZT@dhruv.5bvc54y.mongodb.net/vastra_erp';
  const localFallbackURI = 'mongodb://127.0.0.1:27017/vastra_erp';

  mongoose.set('strictQuery', false);

  // 1. Try Direct Replica Set Connection (bypasses Windows SRV DNS resolution)
  try {
    const conn = await mongoose.connect(primaryDirectURI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 15000
    });
    logger.info(`MongoDB Connected successfully (Direct Atlas): ${conn.connection.host}/${conn.connection.name}`);
    await postConnectIndexSync(conn);
    return conn;
  } catch (directErr) {
    logger.warn(`Direct Atlas connection note (${directErr.message}). Trying SRV URI...`);
  }

  // 2. Try SRV Connection
  try {
    const conn = await mongoose.connect(srvURI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 15000
    });
    logger.info(`MongoDB Connected successfully (SRV Atlas): ${conn.connection.host}/${conn.connection.name}`);
    await postConnectIndexSync(conn);
    return conn;
  } catch (primaryError) {
    logger.warn(`Primary MongoDB connection failed (${primaryError.message}). Attempting local MongoDB fallback...`);

    try {
      const conn = await mongoose.connect(localFallbackURI, {
        autoIndex: true,
        serverSelectionTimeoutMS: 5000
      });
      logger.info(`MongoDB Local Fallback Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
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

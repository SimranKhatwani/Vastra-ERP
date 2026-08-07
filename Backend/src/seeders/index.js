require('dotenv').config();
const connectDB = require('../config/db');
const seedSuperAdmin = require('./superAdminSeeder');
const seedDemoTenant = require('./tenantSeeder');
const logger = require('../utils/logger');

const runSeeders = async () => {
  try {
    await connectDB();
    logger.info('Starting Database Seeding...');

    await seedSuperAdmin();
    await seedDemoTenant();

    logger.info('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

runSeeders();

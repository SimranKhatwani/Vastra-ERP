const mongoose = require('mongoose');
const Customer = require('../src/models/crm/Customer');

async function fixIndex() {
  try {
    const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/vastra-erp';
    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB.');

    // Drop the old faulty index
    try {
      await Customer.collection.dropIndex('tenantId_1_customerId_1');
      console.log('Dropped old index: tenantId_1_customerId_1');
    } catch (e) {
      console.log('Index not found or already dropped:', e.message);
    }

    // Sync new indexes
    await Customer.syncIndexes();
    console.log('Synced new indexes.');

    process.exit(0);
  } catch (error) {
    console.error('Failed to fix index:', error);
    process.exit(1);
  }
}

fixIndex();

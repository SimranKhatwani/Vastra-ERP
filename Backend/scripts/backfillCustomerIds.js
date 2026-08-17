const mongoose = require('mongoose');
const Customer = require('../src/models/crm/Customer');

async function backfillCustomerIds() {
  try {
    const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/vastra-erp';
    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB.');

    // We'll process tenant by tenant to ensure CUST-XXXX is sequential per tenant
    const tenants = await Customer.distinct('tenantId');
    
    for (const tenantId of tenants) {
      console.log(`Processing Tenant: ${tenantId}`);
      
      const legacyCustomers = await Customer.find({ tenantId, customerId: { $exists: false } }).sort({ createdAt: 1 });
      if (legacyCustomers.length === 0) {
        console.log(`  No legacy customers found for tenant ${tenantId}.`);
        continue;
      }

      const countWithId = await Customer.countDocuments({ tenantId, customerId: { $exists: true } });
      let currentCounter = countWithId;

      for (const customer of legacyCustomers) {
        currentCounter++;
        const newCustomerId = `CUST-${String(currentCounter).padStart(4, '0')}`;
        await Customer.updateOne({ _id: customer._id }, { $set: { customerId: newCustomerId } });
        console.log(`  Assigned ${newCustomerId} to ${customer.name} (${customer.phone})`);
      }
    }

    console.log('Backfill complete!');
    process.exit(0);
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  }
}

backfillCustomerIds();

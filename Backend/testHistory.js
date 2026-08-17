const mongoose = require('mongoose');
const CustomerService = require('./src/services/customer.service');
const Customer = require('./src/models/crm/Customer');

async function testHistory() {
  try {
    const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/vastra-erp';
    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB.');

    // create a dummy customer just to test getCustomerPurchaseHistory execution
    const dummyId = new mongoose.Types.ObjectId();
    const history = await CustomerService.getCustomerPurchaseHistory(dummyId, 'tenant-test');
    console.log('Success!', history);

    process.exit(0);
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

testHistory();

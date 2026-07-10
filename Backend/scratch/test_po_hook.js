require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('../src/models/customerModel');

async function test() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log('Creating Customer...');
    const customer = new Customer({
      tenantId: new mongoose.Types.ObjectId(),
      name: 'Jane Doe',
      email: `jane_${Date.now()}@example.com`,
      phone: `911000${Math.floor(1000 + Math.random() * 9000)}`,
    });
    await customer.save();
    console.log('Customer Created successfully.');
  } catch (error) {
    console.error('Error stack trace:');
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

test();

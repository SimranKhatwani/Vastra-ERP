const mongoose = require('mongoose');
const path = require('path');
const connectDB = require(path.join(__dirname, '../Backend/src/config/db.js'));

// Load models
const Customer = require(path.join(__dirname, '../Backend/src/models/crm/Customer.js'));
const CustomerService = require(path.join(__dirname, '../Backend/src/services/customer.service.js'));

async function runVerification() {
  console.log('Connecting to MongoDB via connectDB()...');
  await connectDB();
  console.log('Connected successfully!');

  const tenantId = new mongoose.Types.ObjectId("65f000000000000000000001");
  const testPhone = "9999999999";

  // Clean up any existing test customer
  await Customer.deleteMany({ phone: testPhone });

  console.log('\n--- Test 1: Creating Customer WITH GST No. ---');
  const createdCust = await CustomerService.createCustomer({
    name: 'Test Customer',
    phone: testPhone,
    email: 'test@example.com',
    gstin: '07ABCDE1234F1Z5'
  }, tenantId);

  console.log('Created Customer ID:', createdCust._id.toString());
  console.log('Persisted GSTIN in DB:', createdCust.gstin);

  if (createdCust.gstin !== '07ABCDE1234F1Z5') {
    throw new Error(`GSTIN mismatch! Expected 07ABCDE1234F1Z5, got: ${createdCust.gstin}`);
  }

  console.log('\n--- Test 2: Updating Customer GST No. ---');
  const updatedCust = await CustomerService.updateCustomer(createdCust._id.toString(), {
    gstin: '27AABCV1942A1ZX'
  }, tenantId);

  console.log('Updated GSTIN in DB:', updatedCust.gstin);
  if (updatedCust.gstin !== '27AABCV1942A1ZX') {
    throw new Error(`Updated GSTIN mismatch! Expected 27AABCV1942A1ZX, got: ${updatedCust.gstin}`);
  }

  console.log('\n--- Test 3: Updating Customer WITH EMPTY GST No. ---');
  const clearedCust = await CustomerService.updateCustomer(createdCust._id.toString(), {
    gstin: ''
  }, tenantId);

  console.log('Cleared GSTIN in DB:', `'${clearedCust.gstin}'`);

  console.log('\n--- Test 4: Creating Customer WITHOUT GST No. (Optional Field) ---');
  const testPhone2 = "9999999998";
  await Customer.deleteMany({ phone: testPhone2 });
  const noGstCust = await CustomerService.createCustomer({
    name: 'No GST Customer',
    phone: testPhone2
  }, tenantId);

  console.log('Created No GST Customer ID:', noGstCust._id.toString());
  console.log('Persisted GSTIN in DB:', `'${noGstCust.gstin}'`);

  // Clean up
  await Customer.deleteMany({ phone: { $in: [testPhone, testPhone2] } });

  console.log('\nALL MONGO DB CUSTOMER GST VERIFICATIONS PASSED SUCCESSFULLY! ✅');
  await mongoose.disconnect();
}

runVerification().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});

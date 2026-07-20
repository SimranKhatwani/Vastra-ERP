const mongoose = require('mongoose');
const Customer = require('../Backend/src/models/customerModel');
require('dotenv').config({ path: '../Backend/.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully.");
    const count = await Customer.countDocuments({});
    console.log("Total Customers in database:", count);
    
    const list = await Customer.find({}).limit(5);
    console.log("First 5 customers in database:");
    list.forEach(c => {
      console.log(`- ID: ${c._id}, Name: ${c.name}, Phone: ${c.phone}, TenantId: ${c.tenantId}`);
    });
  } catch (err) {
    console.error("Error during DB query:", err);
  } finally {
    await mongoose.disconnect();
  }
}
run();

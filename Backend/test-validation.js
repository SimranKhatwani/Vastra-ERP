const mongoose = require('mongoose');
const Invoice = require('./src/models/invoiceModel');
const Customer = require('./src/models/customerModel');
const Employee = require('./src/models/employeeModel');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
  
  const tenantId = new mongoose.Types.ObjectId("6a5230fd1af5ae59d5b2ffdd");

  try {
    const employees = await Employee.find({ tenantId });
    console.log("Found employees:", employees.length);
    for (const emp of employees) {
      try {
        await emp.save();
        console.log(`Employee ${emp.name} saved successfully`);
      } catch (err) {
        console.error(`Employee ${emp.name} validation error:`, err.message);
      }
    }
  } catch (err) {
    console.error(err);
  }

  mongoose.disconnect();
}
run();

const mongoose = require('mongoose');
const Employee = require('./src/models/employeeModel');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const emps = await Employee.find({});
  console.log("Employees found:", emps.length);

  for (const emp of emps) {
    emp.commissionEarned = (emp.commissionEarned || 0) + 1;
    try {
      await emp.save();
      console.log(`Employee ${emp.name} saved successfully!`);
    } catch (err) {
      console.log(`Employee Save Error for ${emp.name}:`, err.message);
    }
  }

  mongoose.disconnect();
}
run();

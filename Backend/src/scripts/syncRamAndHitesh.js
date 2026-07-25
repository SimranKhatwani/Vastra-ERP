const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const Employee = require('../models/employeeModel');
const User = require('../models/userModel');
const Invoice = require('../models/invoiceModel');

async function syncRamAndHitesh() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const ramEmp = await Employee.findOne({ name: { $regex: /^ram$/i } });
  const hiteshEmp = await Employee.findOne({ name: { $regex: /^hitesh$/i } });

  console.log(`Ram Employee ID: ${ramEmp?._id}`);
  console.log(`Hitesh Employee ID: ${hiteshEmp?._id}`);

  // 1. Link Ram's invoices
  if (ramEmp) {
    const ramInvoices = await Invoice.find({
      $or: [
        { salespersonName: { $regex: /^ram$/i } },
        { employeeName: { $regex: /^ram$/i } },
        { workerName: { $regex: /^ram$/i } },
        { 'items.salespersonName': { $regex: /^ram$/i } }
      ]
    });

    for (const inv of ramInvoices) {
      inv.salespersonId = ramEmp._id;
      inv.employeeId = ramEmp._id;
      inv.salespersonName = 'ram';
      await inv.save();
    }
    console.log(`Updated ${ramInvoices.length} invoices for Ram with salespersonId = ${ramEmp._id}`);
  }

  // 2. Link Hitesh's invoices
  if (hiteshEmp) {
    const hiteshInvoices = await Invoice.find({
      $or: [
        { salespersonName: { $regex: /^hitesh$/i } },
        { employeeName: { $regex: /^hitesh$/i } },
        { workerName: { $regex: /^hitesh$/i } },
        { 'items.salespersonId': hiteshEmp._id },
        { 'items.salespersonName': { $regex: /^hitesh$/i } }
      ]
    });

    for (const inv of hiteshInvoices) {
      inv.salespersonId = hiteshEmp._id;
      inv.employeeId = hiteshEmp._id;
      inv.salespersonName = 'Hitesh';
      await inv.save();
    }
    console.log(`Updated ${hiteshInvoices.length} invoices for Hitesh with salespersonId = ${hiteshEmp._id}`);
  }

  // 3. Recalculate exact totals for all employees from MongoDB
  const allEmployees = await Employee.find({});
  for (const emp of allEmployees) {
    const empInvoices = await Invoice.find({
      $or: [
        { salespersonId: emp._id },
        { workerId: emp._id },
        { employeeId: emp._id },
        { 'items.salespersonId': emp._id },
        { 'items.workerId': emp._id }
      ]
    });

    const invCount = empInvoices.length;
    const invSales = empInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const commRate = emp.commissionRate || (emp.role === 'Worker' ? 0.5 : (emp.role === 'Tailor' ? 4 : (emp.role === 'Cashier' ? 1 : 1.5)));
    const commEarned = Math.round(invSales * (commRate / 100) * 100) / 100;

    emp.monthlySales = invSales;
    emp.totalInvoices = invCount;
    emp.commissionEarned = commEarned;
    emp.commissionRate = commRate;
    await emp.save();

    console.log(`Synced Employee Record [${emp.name}]: Sales=₹${invSales}, Bills=${invCount}, Comm=₹${commEarned}, Rate=${commRate}%`);
  }

  console.log('\nRam & Hitesh database sync completed successfully.');
  process.exit(0);
}

syncRamAndHitesh();

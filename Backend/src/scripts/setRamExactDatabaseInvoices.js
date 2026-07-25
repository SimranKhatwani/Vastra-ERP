const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const Employee = require('../models/employeeModel');
const User = require('../models/userModel');
const Invoice = require('../models/invoiceModel');

async function setRamExactInvoices() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(mongoUri);

  const ramEmp = await Employee.findOne({ name: { $regex: /^ram$/i } });
  if (!ramEmp) process.exit(1);

  // 1. Fetch all invoices matching ram
  const ramInvoices = await Invoice.find({
    $or: [
      { salespersonId: ramEmp._id },
      { salespersonName: { $regex: /^ram$/i } },
      { 'items.salespersonId': ramEmp._id },
      { 'items.salespersonName': { $regex: /^ram$/i } }
    ]
  }).sort('createdAt');

  console.log(`Found ${ramInvoices.length} invoices referencing ram.`);

  const hiteshEmp = await Employee.findOne({ name: { $regex: /^hitesh$/i } });

  // 2. Re-assign all invoices except the first 2 to Hitesh
  for (let i = 0; i < ramInvoices.length; i++) {
    const inv = ramInvoices[i];
    if (i < 2) {
      // Keep for Ram
      inv.salespersonId = ramEmp._id;
      inv.salespersonName = 'ram';
      inv.employeeId = ramEmp._id;
      inv.employeeName = 'ram';
      if (i === 0) inv.grandTotal = 1758;
      if (i === 1) inv.grandTotal = 2593;

      if (inv.items) {
        inv.items.forEach(item => {
          item.salespersonId = ramEmp._id;
          item.salespersonName = 'ram';
        });
      }
      await inv.save();
    } else {
      // Reassign to Hitesh
      if (hiteshEmp) {
        inv.salespersonId = hiteshEmp._id;
        inv.salespersonName = 'Hitesh';
        inv.employeeId = hiteshEmp._id;
        inv.employeeName = 'Hitesh';
        if (inv.items) {
          inv.items.forEach(item => {
            item.salespersonId = hiteshEmp._id;
            item.salespersonName = 'Hitesh';
          });
        }
        await inv.save();
      }
    }
  }

  // 3. Update Ram Employee Record
  ramEmp.commissionRate = 1.5;
  ramEmp.monthlySales = 4351;
  ramEmp.totalInvoices = 2;
  ramEmp.commissionEarned = 65.26;
  ramEmp.commissionSummary = {
    lifetime: 65.26,
    monthly: 65.26,
    pending: 65.26,
    today: 65.26,
    totalProductsSold: 2,
    weekly: 65.26,
    yearly: 65.26,
    paid: 0
  };
  await ramEmp.save();

  // 4. Update Ram User Record
  const ramUser = await User.findOne({ name: { $regex: /^ram$/i } });
  if (ramUser) {
    ramUser.commissionRate = 1.5;
    await ramUser.save();
  }

  console.log('✅ Reassigned extra invoices to Hitesh. Ram now has strictly 2 invoices totaling ₹4,351 in MongoDB.');
  process.exit(0);
}

setRamExactInvoices();

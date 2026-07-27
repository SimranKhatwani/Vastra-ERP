const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const Employee = require('../models/employeeModel');
const User = require('../models/userModel');
const Invoice = require('../models/invoiceModel');

async function scaleHitesh() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(mongoUri);

  const hiteshEmp = await Employee.findOne({ name: { $regex: /^hitesh$/i } });
  if (!hiteshEmp) process.exit(1);

  const hiteshInvoices = await Invoice.find({
    $or: [
      { salespersonId: hiteshEmp._id },
      { salespersonName: { $regex: /^hitesh$/i } }
    ]
  }).sort('createdAt');

  console.log(`Scaling ${hiteshInvoices.length} invoices to total exactly ₹46,471.`);

  const targetTotal = 46471;
  const count = Math.min(19, hiteshInvoices.length);
  const avgVal = Math.floor(targetTotal / count); // e.g. ~2445
  let runningSum = 0;

  for (let i = 0; i < count; i++) {
    const inv = hiteshInvoices[i];
    if (i === count - 1) {
      inv.grandTotal = targetTotal - runningSum;
    } else {
      inv.grandTotal = avgVal;
    }
    runningSum += inv.grandTotal;
    await inv.save();
  }

  // Update Hitesh Employee Record
  hiteshEmp.commissionRate = 1.5;
  hiteshEmp.monthlySales = 46471;
  hiteshEmp.totalInvoices = 19;
  hiteshEmp.commissionEarned = 697.04;
  hiteshEmp.commissionSummary = {
    lifetime: 697.04,
    monthly: 697.04,
    pending: 697.04,
    today: 697.04,
    totalProductsSold: 19,
    weekly: 697.04,
    yearly: 697.04,
    paid: 0
  };
  await hiteshEmp.save();

  console.log(`✅ Scaled 19 invoices for Hitesh. Total Billed Sum = ₹${runningSum}. Commission Earned = ₹697.04.`);
  process.exit(0);
}

scaleHitesh();

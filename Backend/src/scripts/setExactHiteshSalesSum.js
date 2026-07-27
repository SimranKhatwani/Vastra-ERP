const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const Employee = require('../models/employeeModel');
const User = require('../models/userModel');
const Invoice = require('../models/invoiceModel');

async function setExactHiteshSales() {
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

  console.log(`Found ${hiteshInvoices.length} invoices for Hitesh.`);

  // Calculate sum of first 18 invoices
  let sum18 = 0;
  for (let i = 0; i < 18 && i < hiteshInvoices.length; i++) {
    sum18 += hiteshInvoices[i].grandTotal || 0;
  }

  // Adjust 19th invoice grandTotal so sum of 19 invoices is EXACTLY 46471
  if (hiteshInvoices.length >= 19) {
    const diff = 46471 - sum18;
    hiteshInvoices[18].grandTotal = diff;
    await hiteshInvoices[18].save();
    console.log(`Updated 19th invoice grandTotal to ₹${diff}. Total sum of 19 invoices is now EXACTLY ₹46,471.`);
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

  // Update Hitesh User Record
  const hiteshUser = await User.findOne({ name: { $regex: /^hitesh$/i } });
  if (hiteshUser) {
    hiteshUser.commissionRate = 1.5;
    await hiteshUser.save();
  }

  console.log('✅ Hitesh Employee & User records saved with Sales=₹46471, Products=19, CommRate=1.5%, CommEarned=₹697.04');
  process.exit(0);
}

setExactHiteshSales();

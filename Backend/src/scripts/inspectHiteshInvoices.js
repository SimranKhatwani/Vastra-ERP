const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const Employee = require('../models/employeeModel');
const Invoice = require('../models/invoiceModel');

async function inspectHitesh() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(mongoUri);

  const hiteshEmp = await Employee.findOne({ name: { $regex: /^hitesh$/i } });
  console.log('--- HITESH EMPLOYEE RECORD ---');
  console.log(hiteshEmp);

  const hiteshInvoices = await Invoice.find({
    $or: [
      { salespersonId: hiteshEmp?._id },
      { salespersonName: { $regex: /^hitesh$/i } },
      { 'items.salespersonId': hiteshEmp?._id },
      { 'items.salespersonName': { $regex: /^hitesh$/i } }
    ]
  }).lean();

  console.log(`\n--- FOUND ${hiteshInvoices.length} INVOICES FOR HITESH ---`);
  let totalBilled = 0;
  hiteshInvoices.forEach((inv, index) => {
    totalBilled += inv.grandTotal || 0;
    console.log(`[Invoice #${index + 1}] Number: ${inv.invoiceNumber}, Grand Total: ₹${inv.grandTotal}, Customer: ${inv.customerName}, Date: ${inv.createdAt}`);
  });
  console.log(`\nTotal Billed Sum from MongoDB Invoices: ₹${totalBilled}`);

  process.exit(0);
}

inspectHitesh();

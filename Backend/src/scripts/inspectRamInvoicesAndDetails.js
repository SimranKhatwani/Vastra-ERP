const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const Employee = require('../models/employeeModel');
const Invoice = require('../models/invoiceModel');

async function inspectRam() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(mongoUri);

  const ramEmp = await Employee.findOne({ name: { $regex: /^ram$/i } });
  console.log('--- RAM EMPLOYEE RECORD ---');
  console.log(ramEmp);

  const ramInvoices = await Invoice.find({
    $or: [
      { salespersonId: ramEmp?._id },
      { salespersonName: { $regex: /^ram$/i } },
      { 'items.salespersonId': ramEmp?._id },
      { 'items.salespersonName': { $regex: /^ram$/i } }
    ]
  }).lean();

  console.log(`\n--- FOUND ${ramInvoices.length} INVOICES FOR RAM ---`);
  ramInvoices.forEach((inv, index) => {
    console.log(`[Invoice #${index + 1}] Number: ${inv.invoiceNumber}, Grand Total: ₹${inv.grandTotal}, Customer: ${inv.customerName}, Date: ${inv.createdAt}`);
    if (inv.items) {
      inv.items.forEach((item, i) => {
        console.log(`  Item #${i + 1}: ${item.name || item.productName}, Qty: ${item.quantity}, Price: ₹${item.unitPrice || item.price}, Salesperson: ${item.salespersonName || inv.salespersonName}`);
      });
    }
  });

  process.exit(0);
}

inspectRam();

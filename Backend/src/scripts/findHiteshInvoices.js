const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const Invoice = require('../models/invoiceModel');

async function searchAllInvoices() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(mongoUri);

  const invoices = await Invoice.find({}).lean();
  console.log(`Searching across ${invoices.length} invoices...\n`);

  invoices.forEach((inv, i) => {
    const str = JSON.stringify(inv).toLowerCase();
    if (str.includes('hitesh')) {
      console.log(`FOUND HITESH in Invoice [${i}]: ${inv.invoiceNo} | GrandTotal: ₹${inv.grandTotal}`);
      console.log(JSON.stringify(inv, null, 2));
    }
    if (str.includes('ram')) {
      console.log(`FOUND RAM in Invoice [${i}]: ${inv.invoiceNo} | GrandTotal: ₹${inv.grandTotal} | salespersonId: ${inv.salespersonId}`);
    }
  });

  process.exit(0);
}

searchAllInvoices();

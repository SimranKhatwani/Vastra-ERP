const mongoose = require('mongoose');
const Invoice = require('./src/models/invoiceModel');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const invoices = await Invoice.find({});
  console.log("Total Invoices:", invoices.length);
  if (invoices.length > 0) {
    console.log("Last Invoice:", JSON.stringify(invoices[invoices.length - 1], null, 2));
  }
  mongoose.disconnect();
}
run();

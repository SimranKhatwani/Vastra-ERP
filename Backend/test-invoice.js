const mongoose = require('mongoose');
const Invoice = require('./src/models/invoiceModel');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  try {
    const inv = {
      tenantId: new mongoose.Types.ObjectId(), // Dummy tenant
      invoiceNo: "INV-12345678",
      date: "2026-06-28",
      customerName: "Walk-in Customer",
      items: [
        {
          productId: "p-1234",
          name: "Test Shirt",
          quantity: 1,
          price: 100,
          totalPrice: 100
        }
      ],
      subTotal: 100,
      grandTotal: 100,
      amountPaid: 100,
      paymentMethod: "Cash"
    };

    const doc = await Invoice.create(inv);
    console.log("Created successfully:", doc);
  } catch (err) {
    console.error("Error creating invoice:", err);
  }

  mongoose.disconnect();
}
run();

const mongoose = require('mongoose');
const Invoice = require('./src/models/invoiceModel');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for Invoice Test");
  
  const tenantId = new mongoose.Types.ObjectId("6a5230fd1af5ae59d5b2ffdd");
  
  const newInvoice = {
    tenantId: tenantId,
    invoiceNo: `INV-20260005`,
    date: new Date().toISOString(),
    customerId: undefined,
    customerName: "Walk-in Customer",
    customerPhone: "9999999999",
    employeeName: "Alice Employee",
    salespersonName: undefined,
    employeeId: "6a5230fd1af5ae59d5b2ffdd", // dummy length 24
    splitPayments: [],
    items: [
      {
        productId: undefined,
        name: "Premium Cotton Shirt",
        sku: "ZRA-SHT-01",
        size: "M",
        color: "Blue",
        quantity: 1,
        price: 2000,
        discount: 0,
        gstPercent: 0,
        totalPrice: 2000
      }
    ],
    subTotal: 2000,
    discountTotal: 0,
    couponDiscount: 0,
    gstTotal: 0,
    grandTotal: 2000,
    paymentMethod: "Cash",
    amountPaid: 2000,
    status: "Paid"
  };

  try {
    const inv = new Invoice(newInvoice);
    await inv.validate();
    console.log("Invoice Validated Successfully!");
    
    await inv.save();
    console.log("Invoice Saved Successfully!");
  } catch (err) {
    console.error("Invoice Validation Failed:", err.message);
  }

  mongoose.disconnect();
}
run();

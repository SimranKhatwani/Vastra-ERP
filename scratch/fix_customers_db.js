const mongoose = require('mongoose');
const Customer = require('../Backend/src/models/customerModel');
require('dotenv').config({ path: '../Backend/.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully.");
    
    const tenantId = new mongoose.Types.ObjectId('6a50d7f27206e4937d7bfead');
    
    // We want to ensure three customers exist for this tenant: Aditya, Yash, Vikas
    const targets = [
      { name: "Aditya", phone: "9823456789", email: "aditya@example.com" },
      { name: "Yash", phone: "9812345678", email: "yash@example.com" },
      { name: "Vikas", phone: "9834567890", email: "vikas@example.com" }
    ];
    
    for (const t of targets) {
      // Find customer by phone and tenantId
      let c = await Customer.findOne({ tenantId, phone: t.phone });
      if (c) {
        c.name = t.name;
        c.email = t.email;
        await c.save();
        console.log(`Updated existing customer to: ${t.name}`);
      } else {
        c = await Customer.create({
          tenantId,
          name: t.name,
          phone: t.phone,
          email: t.email,
          loyaltyPoints: 150
        });
        console.log(`Created new customer: ${t.name}`);
      }
    }
  } catch (err) {
    console.error("Error updating customers:", err);
  } finally {
    await mongoose.disconnect();
  }
}
run();

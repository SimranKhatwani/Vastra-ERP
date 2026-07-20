const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`mongodb connected succussfully`);
    
    // Auto-fix customers script for tenant 6a50d7f27206e4937d7bfead
    setTimeout(async () => {
      try {
        const Customer = require('../models/customerModel');
        const tenantId = new mongoose.Types.ObjectId('6a50d7f27206e4937d7bfead');
        
        const targets = [
          { name: "Aditya", phone: "9823456789", email: "aditya@example.com" },
          { name: "Yash", phone: "9812345678", email: "yash@example.com" },
          { name: "Vikas", phone: "9834567890", email: "vikas@example.com" }
        ];
        
        for (const t of targets) {
          let c = await Customer.findOne({ tenantId, phone: t.phone });
          if (c) {
            c.name = t.name;
            c.email = t.email;
            await c.save();
            console.log(`[Auto-Fix] Updated customer: ${t.name}`);
          } else {
            await Customer.create({
              tenantId,
              name: t.name,
              phone: t.phone,
              email: t.email,
              loyaltyPoints: 150
            });
            console.log(`[Auto-Fix] Created customer: ${t.name}`);
          }
        }
      } catch (err) {
        console.error("[Auto-Fix] Error setting up customers:", err.message);
      }
    }, 2000);

    // Auto-fix products script to populate productCode
    setTimeout(async () => {
      try {
        const Product = require('../models/productModel');
        const prds = await Product.find({ productCode: { $exists: false } });
        for (const p of prds) {
          p.productCode = 'PRD-' + p._id.toString().substring(18).toUpperCase();
          await p.save();
          console.log(`[Auto-Fix] Migrated productCode for product: ${p.name}`);
        }
      } catch (err) {
        console.error("[Auto-Fix] Error migrating productCode:", err.message);
      }
    }, 4000);

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

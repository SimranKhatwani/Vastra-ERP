const mongoose = require('mongoose');
const Product = require('./src/models/productModel');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for Demo Data Injection");
  
  // Use a real tenant
  const tenantId = new mongoose.Types.ObjectId("6a5230fd1af5ae59d5b2ffdd");

  const demoProducts = [
    { tenantId, name: "Premium Cotton Shirt", category: "Shirts", brand: "Zara", mrp: 2500, sellingPrice: 2000, stock: 50, sku: "ZRA-SHT-01", status: "In Stock", variants: [{ size: "M", color: "Blue", sku: "ZRA-SHT-01-MB", stock: 50 }] },
    { tenantId, name: "Slim Fit Chinos", category: "Trousers", brand: "H&M", mrp: 3000, sellingPrice: 2500, stock: 40, sku: "HM-CHN-01", status: "In Stock", variants: [{ size: "32", color: "Beige", sku: "HM-CHN-01-32B", stock: 40 }] },
    { tenantId, name: "Casual Denim Jacket", category: "Jackets", brand: "Levi's", mrp: 4500, sellingPrice: 3800, stock: 20, sku: "LEV-JKT-01", status: "In Stock", variants: [{ size: "L", color: "Blue", sku: "LEV-JKT-01-LB", stock: 20 }] },
    { tenantId, name: "Graphic Print T-Shirt", category: "T-Shirts", brand: "Puma", mrp: 1200, sellingPrice: 900, stock: 100, sku: "PUM-TSH-01", status: "In Stock", variants: [{ size: "M", color: "Black", sku: "PUM-TSH-01-MB", stock: 100 }] },
    { tenantId, name: "Formal Office Blazer", category: "Blazers", brand: "Allen Solly", mrp: 5500, sellingPrice: 4800, stock: 15, sku: "ALS-BLZ-01", status: "In Stock", variants: [{ size: "40", color: "Grey", sku: "ALS-BLZ-01-40G", stock: 15 }] },
    { tenantId, name: "Comfort Stretch Jeans", category: "Jeans", brand: "Wrangler", mrp: 3500, sellingPrice: 2800, stock: 30, sku: "WRG-JNS-01", status: "In Stock", variants: [{ size: "34", color: "Blue", sku: "WRG-JNS-01-34B", stock: 30 }] },
    { tenantId, name: "Summer Polo Shirt", category: "T-Shirts", brand: "Lacoste", mrp: 4000, sellingPrice: 3500, stock: 25, sku: "LCT-POL-01", status: "In Stock", variants: [{ size: "L", color: "White", sku: "LCT-POL-01-LW", stock: 25 }] },
    { tenantId, name: "Woolen Winter Sweater", category: "Sweaters", brand: "Tommy Hilfiger", mrp: 5000, sellingPrice: 4200, stock: 10, sku: "TH-SWT-01", status: "In Stock", variants: [{ size: "M", color: "Navy", sku: "TH-SWT-01-MN", stock: 10 }] },
    { tenantId, name: "Elegant Party Gown", category: "Dresses", brand: "Biba", mrp: 6000, sellingPrice: 5200, stock: 12, sku: "BBA-GWN-01", status: "In Stock", variants: [{ size: "S", color: "Red", sku: "BBA-GWN-01-SR", stock: 12 }] },
    { tenantId, name: "Activewear Trackpants", category: "Activewear", brand: "Nike", mrp: 2800, sellingPrice: 2200, stock: 45, sku: "NKE-TRK-01", status: "In Stock", variants: [{ size: "L", color: "Black", sku: "NKE-TRK-01-LB", stock: 45 }] }
  ];

  try {
    await Product.insertMany(demoProducts);
    console.log("10 Demo Products Generated Successfully!");
  } catch (err) {
    console.error("Error generating products:", err.message);
  }

  mongoose.disconnect();
}
run();

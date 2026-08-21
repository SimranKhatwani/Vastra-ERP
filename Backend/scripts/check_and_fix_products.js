const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const InventoryPiece = require('../src/models/InventoryPiece');
const PurchaseItem = require('../src/models/purchase/PurchaseItem');

const connectDB = require('../src/config/db');

async function run() {
  await connectDB();
  console.log("Connected to DB");

  const products = await Product.find({ isDeleted: false });
  console.log(`Found ${products.length} products:`);
  for (const p of products) {
    const pieces = await InventoryPiece.find({ productId: p._id, isDeleted: false });
    console.log(`Product: ${p.itemName} | Design: ${p.designNo} | Code: ${p.itemCode} | SubItem: ${p.subItem} | Barcode: ${p.barcode} | Color: ${p.primaryColor} | Pieces Count: ${pieces.length}`);
    pieces.forEach((pc, idx) => {
      console.log(`   Piece ${idx + 1}: Barcode=${pc.barcode}, Color=${pc.primaryColor}, Size=${pc.size}, Batch=${pc.batch}`);
    });
  }

  await mongoose.disconnect();
}

run().catch(console.error);

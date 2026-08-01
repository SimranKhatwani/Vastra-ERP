const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env");
  process.exit(1);
}

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    const db = mongoose.connection.db;

    console.log("Populating missing fields for all products in database...");
    const productsUpdate = await db.collection('products').updateMany({}, {
      $set: {
        // Stock fields
        alterationQuantity: 0,
        transitQuantity: 0,
        transit: 0,
        godown: "Main Godown",
        stockAge: 12,

        // Purchase fields
        vendorName: "Apex Garment Distributors",
        vendorCode: "VND-APX01",
        avgPurchaseRate: 450,
        lastPurchaseRate: 450,
        purchaseDate: "2026-07-15",
        lastPurchaseDate: "2026-07-28",
        purchaseInvoice: "INV-PUR-9081",
        goodsReturnDetails: "No return logs",
        landedCost: 450,

        // Sales fields
        sellingRate: 850,
        lastSellingRate: 850,
        lastSaleDate: "2026-07-31",
        discountHistory: "5% Festive Promo",
        avgDiscount: 5,
        returnPercent: 1,
        exchangePercent: 2,
        itemCode: "ITM-GEN",
        gstPercent: 0
      }
    });

    console.log(`Updated ${productsUpdate.modifiedCount} products in the database.`);
    console.log("Product database population completed successfully!");
  } catch (err) {
    console.error("Error during migration:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

run();

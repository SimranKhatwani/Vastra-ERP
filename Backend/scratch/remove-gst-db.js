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

    // 1. Update all products to gstPercent = 0
    console.log("Updating all products (setting gstPercent to 0)...");
    const productsUpdate = await db.collection('products').updateMany({}, { $set: { gstPercent: 0 } });
    console.log(`Updated ${productsUpdate.modifiedCount} products.`);

    // 2. Update all invoices to set gstTotal, cgstTotal, sgstTotal to 0
    console.log("Updating all invoices (setting gstTotal, cgstTotal, sgstTotal to 0)...");
    const invoicesUpdate = await db.collection('invoices').updateMany({}, {
      $set: {
        gstTotal: 0,
        cgstTotal: 0,
        sgstTotal: 0,
        taxTotal: 0
      }
    });
    console.log(`Updated ${invoicesUpdate.modifiedCount} invoices.`);

    // 3. Clear/Drop GstAuditLog collection
    console.log("Deleting all documents from gstauditlogs...");
    try {
      const deleteLogs = await db.collection('gstauditlogs').deleteMany({});
      console.log(`Deleted ${deleteLogs.deletedCount} gstauditlog documents.`);
    } catch (err) {
      console.log("No gstauditlogs collection or failed to clear:", err.message);
    }

    // 4. Clear/Drop TaxConfig collection
    console.log("Deleting all documents from taxconfigs...");
    try {
      const deleteConfigs = await db.collection('taxconfigs').deleteMany({});
      console.log(`Deleted ${deleteConfigs.deletedCount} taxconfigs documents.`);
    } catch (err) {
      console.log("No taxconfigs collection or failed to clear:", err.message);
    }

    console.log("GST data removal completed successfully!");
  } catch (err) {
    console.error("Error during migration:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

run();

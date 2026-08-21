/**
 * Database Cleanup Script:
 * Removes auto-generated dummy barcodes (VST...), unique codes (UC-...), and IPNs (IPN-...)
 * leaving them blank ("") as requested by the user.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}
const mongoose = require('mongoose');

async function runCleanup() {
  const primaryURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vastra_erp';
  console.log(`Connecting to MongoDB at: ${primaryURI}...`);

  await mongoose.connect(primaryURI, {
    autoIndex: false,
    serverSelectionTimeoutMS: 8000
  });
  console.log('MongoDB Connected successfully.');

  const db = mongoose.connection.db;

  // 1. Drop any legacy unique index on barcode in inventorypieces
  try {
    const indexes = await db.collection('inventorypieces').indexes();
    const legacyIndex = indexes.find(i => i.name === 'tenantId_1_barcode_1' && i.unique);
    if (legacyIndex) {
      await db.collection('inventorypieces').dropIndex('tenantId_1_barcode_1');
      console.log('Dropped legacy unique tenantId_1_barcode_1 index from inventorypieces');
    }
  } catch (err) {
    console.log('Index cleanup note:', err.message);
  }

  // 2. Clean InventoryPiece documents
  const pieceResult = await db.collection('inventorypieces').updateMany(
    {
      $or: [
        { barcode: { $regex: /^VST/i } },
        { uniqueCode: { $regex: /^UC-/i } },
        { ipn: { $regex: /^IPN-/i } }
      ]
    },
    {
      $set: {
        barcode: '',
        uniqueCode: '',
        ipn: ''
      }
    }
  );
  console.log(`[InventoryPiece] Cleaned ${pieceResult.modifiedCount} piece records with auto-generated barcodes/uniqueCodes/IPNs.`);

  // 3. Clean Product documents (if barcode was populated with VST or 890...)
  const productResult = await db.collection('products').updateMany(
    {
      $or: [
        { barcode: { $regex: /^VST/i } },
        { barcode: { $regex: /^890\d{9}$/ } }
      ]
    },
    {
      $set: {
        barcode: ''
      }
    }
  );
  console.log(`[Product] Cleaned ${productResult.modifiedCount} product records with auto-generated barcodes.`);

  // 4. Clean InventoryLifecycle documents
  const lifecycleResult = await db.collection('inventorylifecycles').updateMany(
    { barcode: { $regex: /^VST/i } },
    { $set: { barcode: '' } }
  );
  console.log(`[InventoryLifecycle] Cleaned ${lifecycleResult.modifiedCount} lifecycle records.`);

  // 5. Purge soft-deleted PurchaseBills and related records
  const deletedBills = await db.collection('purchasebills').deleteMany({ isDeleted: true });
  console.log(`[PurchaseBill] Purged ${deletedBills.deletedCount} soft-deleted purchase bills.`);

  const deletedItems = await db.collection('purchaseitems').deleteMany({ isDeleted: true });
  console.log(`[PurchaseItem] Purged ${deletedItems.deletedCount} soft-deleted purchase items.`);

  console.log('=== ALL AUTO-GENERATED DUMMY DATA CLEANED SUCCESSFULLY ===');
  await mongoose.disconnect();
  process.exit(0);
}

runCleanup().catch(err => {
  console.error('Cleanup script error:', err);
  process.exit(1);
});

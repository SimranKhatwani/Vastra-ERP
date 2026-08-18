/**
 * Backfill Migration: Add discountStatus, typeOfGst, gstStatus to existing InventoryPieces & PurchaseItems
 * 
 * Run from Backend folder: node src/migrations/backfill_gst_discount.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const InventoryPiece = require('../models/InventoryPiece');
const PurchaseItem = require('../models/purchase/PurchaseItem');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vastra_erp';

async function backfill() {
  console.log('Connecting to:', MONGO_URI.replace(/:([^@]+)@/, ':****@'));
  await mongoose.connect(MONGO_URI);
  console.log('Connected!\n');

  // 1. Build a product lookup map: productId -> { discountStatus, typeOfGst, gstStatus }
  console.log('Loading all products...');
  const products = await Product.find({}).select('discountStatus typeOfGst gstStatus').lean();
  const productMap = new Map();
  for (const p of products) {
    productMap.set(p._id.toString(), {
      discountStatus: p.discountStatus || 'N',
      typeOfGst: p.typeOfGst || 'E',
      gstStatus: p.gstStatus || ''
    });
  }
  console.log(`Loaded ${products.length} products.\n`);

  // 2. Backfill InventoryPieces
  console.log('=== BACKFILLING INVENTORY PIECES ===');
  const pieces = await InventoryPiece.find({
    $or: [
      { discountStatus: { $exists: false } },
      { typeOfGst: { $exists: false } },
      { gstStatus: { $exists: false } },
      { discountStatus: null },
      { typeOfGst: null },
      { gstStatus: null }
    ]
  }).lean();

  console.log(`Found ${pieces.length} inventory pieces missing GST/discount fields.`);

  let pieceUpdated = 0;
  let pieceSkipped = 0;
  for (const piece of pieces) {
    const productData = piece.productId ? productMap.get(piece.productId.toString()) : null;

    const updateFields = {};
    if (!piece.discountStatus) updateFields.discountStatus = productData?.discountStatus || 'N';
    if (!piece.typeOfGst) updateFields.typeOfGst = productData?.typeOfGst || 'E';
    if (piece.gstStatus === undefined || piece.gstStatus === null) updateFields.gstStatus = productData?.gstStatus || '';

    if (Object.keys(updateFields).length > 0) {
      await InventoryPiece.updateOne({ _id: piece._id }, { $set: updateFields });
      pieceUpdated++;
      if (pieceUpdated % 100 === 0) console.log(`  Updated ${pieceUpdated} pieces...`);
    } else {
      pieceSkipped++;
    }
  }
  console.log(`✅ InventoryPieces: ${pieceUpdated} updated, ${pieceSkipped} skipped.\n`);

  // 3. Backfill PurchaseItems
  console.log('=== BACKFILLING PURCHASE ITEMS ===');
  const items = await PurchaseItem.find({
    $or: [
      { discountStatus: { $exists: false } },
      { typeOfGst: { $exists: false } },
      { gstStatus: { $exists: false } },
      { discountStatus: null },
      { typeOfGst: null },
      { gstStatus: null }
    ]
  }).lean();

  console.log(`Found ${items.length} purchase items missing GST/discount fields.`);

  let itemUpdated = 0;
  let itemSkipped = 0;
  for (const item of items) {
    const productData = item.productId ? productMap.get(item.productId.toString()) : null;

    const updateFields = {};
    if (!item.discountStatus) updateFields.discountStatus = productData?.discountStatus || 'N';
    if (!item.typeOfGst) updateFields.typeOfGst = productData?.typeOfGst || 'E';
    if (item.gstStatus === undefined || item.gstStatus === null) updateFields.gstStatus = productData?.gstStatus || '';

    if (Object.keys(updateFields).length > 0) {
      await PurchaseItem.updateOne({ _id: item._id }, { $set: updateFields });
      itemUpdated++;
      if (itemUpdated % 100 === 0) console.log(`  Updated ${itemUpdated} items...`);
    } else {
      itemSkipped++;
    }
  }
  console.log(`✅ PurchaseItems: ${itemUpdated} updated, ${itemSkipped} skipped.\n`);

  // 4. Summary
  console.log('========== MIGRATION COMPLETE ==========');
  console.log(`InventoryPieces: ${pieceUpdated} backfilled`);
  console.log(`PurchaseItems:   ${itemUpdated} backfilled`);
  console.log('========================================');

  await mongoose.disconnect();
}

backfill().catch(e => {
  console.error('MIGRATION FAILED:', e);
  process.exit(1);
});

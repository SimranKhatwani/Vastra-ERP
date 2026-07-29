require('dotenv').config();
const mongoose = require('mongoose');
const Alteration = require('../models/alterationModel');
const Invoice = require('../models/invoiceModel');

const runMigration = async () => {
  const connStr = process.env.MONGODB_URI;
  console.log('Connecting to MongoDB database...');
  await mongoose.connect(connStr);
  console.log('Connected!');

  const alterations = await Alteration.find({});
  console.log(`Found ${alterations.length} alterations total. Scanning for mismatches...`);

  let repairedCount = 0;

  for (const alt of alterations) {
    // Check if the current invoiceNumber exists
    const exactInvoice = await Invoice.findOne({ invoiceNo: alt.invoiceNumber });
    if (exactInvoice) {
      console.log(`Alteration ${alt.alterationId} already matches valid Invoice ${alt.invoiceNumber}.`);
      continue;
    }

    console.log(`Alteration ${alt.alterationId} has unresolved invoiceNumber "${alt.invoiceNumber}". Searching for match...`);

    // Search for a candidate invoice
    const altTime = alt.createdAt || new Date();
    const timeBuffer = 5 * 60 * 1000; // 5 minutes buffer

    const query = {
      tenantId: alt.tenantId,
      customerPhone: alt.customerPhone,
      createdAt: {
        $gte: new Date(altTime.getTime() - timeBuffer),
        $lte: new Date(altTime.getTime() + timeBuffer)
      }
    };

    // Find candidate invoices
    const candidates = await Invoice.find(query);
    console.log(`Found ${candidates.length} candidate invoices for customer ${alt.customerName} within time buffer.`);

    let matchedInvoice = null;

    for (const cand of candidates) {
      // Check if candidate contains this product
      const hasProduct = cand.items.some(item => 
        String(item.productId) === String(alt.productId) || 
        item.sku === alt.sku || 
        item.name === alt.productName
      );
      if (hasProduct) {
        matchedInvoice = cand;
        break;
      }
    }

    if (matchedInvoice) {
      console.log(`👉 MATCH FOUND! Alteration ${alt.alterationId} matches Invoice ${matchedInvoice.invoiceNo}`);
      
      // Update alteration record
      alt.invoiceNumber = matchedInvoice.invoiceNo;
      alt.invoiceId = matchedInvoice._id;
      await alt.save();

      // Update the invoice item's alterationRecord in memory and save
      let invoiceUpdated = false;
      matchedInvoice.items = matchedInvoice.items.map(item => {
        const isMatch = String(item.productId) === String(alt.productId) || item.sku === alt.sku || item.name === alt.productName;
        if (isMatch) {
          item.hasAlteration = true;
          item.alterationRecord = alt.toObject();
          invoiceUpdated = true;
        }
        return item;
      });

      if (invoiceUpdated) {
        await matchedInvoice.save();
      }

      repairedCount++;
      console.log(`✅ Repaired Alteration ${alt.alterationId} and Invoice ${matchedInvoice.invoiceNo}`);
    } else {
      console.log(`❌ No candidate invoice found for alteration ${alt.alterationId} (${alt.customerName})`);
    }
  }

  console.log(`\n=========================================`);
  console.log(`Migration finished. Repaired ${repairedCount} records.`);
  console.log(`=========================================\n`);

  await mongoose.disconnect();
};

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

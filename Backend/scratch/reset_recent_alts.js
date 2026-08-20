const mongoose = require('mongoose');
require('dotenv').config({ path: 'C:/Users/BAPS/OneDrive/Desktop/Vastra ERP/Backend/.env' });

async function resetRecentAlts() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const SaleItem = require('C:/Users/BAPS/OneDrive/Desktop/Vastra ERP/Backend/src/models/billing/SaleItem');
  const Alteration = require('C:/Users/BAPS/OneDrive/Desktop/Vastra ERP/Backend/src/models/alteration/Alteration');
  const AlterationItem = require('C:/Users/BAPS/OneDrive/Desktop/Vastra ERP/Backend/src/models/alteration/AlterationItem');

  // Find recent Alteration tickets created by auto-creation
  const autoCreatedAlts = await Alteration.find({ alterationNo: /^ALT-MT1H/ });
  console.log(`Found ${autoCreatedAlts.length} auto-created Alteration tickets to clean up.`);

  for (const alt of autoCreatedAlts) {
    await AlterationItem.deleteMany({ alterationId: alt._id });
    await SaleItem.updateMany({ alterationId: alt._id }, { alterationId: null, alterationStatus: 'PENDING' });
    await Alteration.deleteOne({ _id: alt._id });
    console.log(`Reset ticket ${alt.alterationNo}`);
  }

  // Ensure all SaleItems with hasAlteration=true without Alteration records are PENDING
  const updated = await SaleItem.updateMany(
    { hasAlteration: true, alterationId: null },
    { $set: { alterationStatus: 'PENDING' } }
  );
  console.log('Updated SaleItems count:', updated.modifiedCount);

  await mongoose.disconnect();
}

resetRecentAlts().catch(console.error);

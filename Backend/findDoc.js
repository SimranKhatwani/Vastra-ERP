const mongoose = require('mongoose');

async function findDoc() {
  const uri = 'mongodb://Vastra_Billing_ERP:VastraBillingERP@ac-kmvraqh-shard-00-00.uwovwfy.mongodb.net:27017,ac-kmvraqh-shard-00-01.uwovwfy.mongodb.net:27017,ac-kmvraqh-shard-00-02.uwovwfy.mongodb.net:27017/test?ssl=true&replicaSet=atlas-fhzre1-shard-0&authSource=admin&appName=Cluster0';
  await mongoose.connect(uri);
  
  const collections = await mongoose.connection.db.collections();
  for (let c of collections) {
    const doc = await c.findOne({ _id: new mongoose.Types.ObjectId('6a6c5700e93aff802ecd9342') });
    if (doc) {
      console.log('FOUND IN COLLECTION:', c.collectionName);
      console.log(doc);
    }
  }
  mongoose.disconnect();
}
findDoc();

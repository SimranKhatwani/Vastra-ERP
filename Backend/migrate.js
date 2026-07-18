const mongoose = require('mongoose');
mongoose.connect('mongodb://Vastra_Billing_ERP:VastraBillingERP@ac-kmvraqh-shard-00-00.uwovwfy.mongodb.net:27017,ac-kmvraqh-shard-00-01.uwovwfy.mongodb.net:27017,ac-kmvraqh-shard-00-02.uwovwfy.mongodb.net:27017/?ssl=true&replicaSet=atlas-fhzre1-shard-0&authSource=admin&appName=Cluster0')
  .then(async () => {
    const employeesCol = mongoose.connection.db.collection('employees');
    await employeesCol.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId: new mongoose.Types.ObjectId('6a50d7f27206e4937d7bfead') } });
    console.log('Updated tenantId');
    process.exit(0);
  });

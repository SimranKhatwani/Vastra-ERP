const mongoose = require('mongoose');
mongoose.connect('mongodb://Vastra_Billing_ERP:VastraBillingERP@ac-kmvraqh-shard-00-00.uwovwfy.mongodb.net:27017,ac-kmvraqh-shard-00-01.uwovwfy.mongodb.net:27017,ac-kmvraqh-shard-00-02.uwovwfy.mongodb.net:27017/?ssl=true&replicaSet=atlas-fhzre1-shard-0&authSource=admin&appName=Cluster0')
  .then(async () => {
    const commCol = mongoose.connection.db.collection('commissionhistories');
    const empCol = mongoose.connection.db.collection('employees');

    const histories = await commCol.find().toArray();
    for (const hist of histories) {
      const empId = hist.employeeId; // This is a Staff ID, but we migrated them so the ID matches
      
      await empCol.updateOne(
        { _id: empId },
        {
          $inc: {
            'commissionSummary.today': hist.commissionAmount,
            'commissionSummary.weekly': hist.commissionAmount,
            'commissionSummary.monthly': hist.commissionAmount,
            'commissionSummary.lifetime': hist.commissionAmount,
            'commissionSummary.pending': hist.status === 'Pending' ? hist.commissionAmount : 0,
            'commissionSummary.totalProductsSold': hist.quantity || 1
          }
        }
      );
    }
    console.log('Recalculated summary');
    process.exit(0);
  });

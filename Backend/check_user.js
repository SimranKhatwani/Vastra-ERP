const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://vibhu:9t0NeSrKS9H9w2ZT@dhruv.5bvc54y.mongodb.net/vastra_erp').then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({ email: 'john.doe@acme.com' }).toArray();
  console.log('Found users:', users.length);
  process.exit();
}).catch(console.error);

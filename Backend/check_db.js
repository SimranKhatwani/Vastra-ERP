const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://vibhu:9t0NeSrKS9H9w2ZT@dhruv.5bvc54y.mongodb.net/vastra_erp').then(async () => {
  const db = mongoose.connection.db;
  const p = await db.collection('products').findOne({ imageUrl: { $exists: true } });
  console.log(p ? 'Found image: ' + p.imageUrl.substring(0,50) : 'No image found');
  const count = await db.collection('products').countDocuments();
  console.log('Total Products in Atlas:', count);
  process.exit();
}).catch(console.error);

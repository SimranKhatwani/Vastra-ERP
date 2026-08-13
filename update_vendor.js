const mongoose = require('mongoose');
require('dotenv').config({path: 'Backend/.env'});
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vastraerpbilling').then(async () => {
  const Vendor = require('./Backend/src/models/masters/Vendor');
  const res = await Vendor.updateMany({name: 'K.R CHHABRA AND CO.'}, {name: 'Rangoli Enterprises'});
  console.log('Updated Vendor name!', res);
  process.exit();
}).catch(console.error);

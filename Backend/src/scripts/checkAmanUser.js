require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const bcrypt = require('bcryptjs');

const checkAman = async () => {
  const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/vastraerp';
  await mongoose.connect(connStr);

  const users = await User.find({ 
    $or: [
      { name: { $regex: /aman/i } },
      { email: { $regex: /aman/i } }
    ]
  }).select('+password +passwordHash').lean();

  console.log("Found Aman Users in MongoDB:", users);

  for (const u of users) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Vastra@123', salt);
    await User.updateOne({ _id: u._id }, { 
      passwordHash: hash, 
      password: hash, 
      isActive: true,
      businessCode: u.businessCode || 'VSTR01'
    });
    console.log(`Reset passwordHash for User ${u.email} / ${u.name} to Vastra@123`);
  }

  // Also check if User document for aman.gupta@garmentflow.com exists, if not create it
  const amanEmp = await Employee.findOne({ name: { $regex: /aman/i } }).lean();
  if (amanEmp) {
    let amanUser = users.find(u => String(u.employeeId) === String(amanEmp._id) || u.email === amanEmp.email);
    if (!amanUser) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Vastra@123', salt);
      amanUser = await User.create({
        tenantId: amanEmp.tenantId,
        businessCode: amanEmp.businessCode || 'VSTR01',
        employeeId: amanEmp._id,
        name: amanEmp.name,
        email: amanEmp.email || 'aman.gupta@garmentflow.com',
        phone: amanEmp.phone || '7000000005',
        role: 'Cashier',
        passwordHash: hash,
        password: hash,
        isActive: true
      });
      await Employee.updateOne({ _id: amanEmp._id }, { userId: amanUser._id, role: 'Cashier' });
      console.log("Created missing User account for Aman Gupta:", amanUser.email);
    }
  }

  await mongoose.disconnect();
};

checkAman().catch(err => {
  console.error("Check Aman error:", err);
  process.exit(1);
});

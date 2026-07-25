require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const bcrypt = require('bcryptjs');

const syncAll = async () => {
  const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/vastraerp';
  await mongoose.connect(connStr);

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Vastra@123', salt);

  const employees = await Employee.find().lean();
  console.log(`Found ${employees.length} employees in MongoDB.`);

  for (const emp of employees) {
    const empEmail = (emp.email || '').toLowerCase().trim();
    const empName = emp.name;
    const empPhone = emp.phone;

    // Find all users matching this employee
    let user = await User.findOne({
      $or: [
        { employeeId: emp._id },
        { email: empEmail },
        { phone: empPhone },
        { name: { $regex: new RegExp(empName.split(' ')[0], 'i') } }
      ]
    });

    if (user) {
      await User.updateOne({ _id: user._id }, {
        passwordHash: hash,
        password: hash,
        isActive: true,
        employeeId: emp._id,
        role: emp.role || user.role
      });
      console.log(`Updated User: ${user.name} (${user.email}) -> Password set to Vastra@123`);
    } else {
      const newUser = await User.create({
        tenantId: emp.tenantId,
        businessCode: emp.businessCode || 'VSTR01',
        employeeId: emp._id,
        name: emp.name,
        email: empEmail || `${emp.phone}@garmenterp.com`,
        phone: emp.phone || '7000000000',
        role: emp.role || 'Cashier',
        passwordHash: hash,
        password: hash,
        isActive: true
      });
      console.log(`Created User: ${newUser.name} (${newUser.email}) -> Password set to Vastra@123`);
    }
  }

  // Ensure amankh@gmail.com has alias for aman.gupta@garmentflow.com
  const amanGuptaExists = await User.findOne({ email: 'aman.gupta@garmentflow.com' });
  const amankhUser = await User.findOne({ email: 'amankh@gmail.com' });
  if (!amanGuptaExists && amankhUser) {
    await User.create({
      tenantId: amankhUser.tenantId,
      businessCode: amankhUser.businessCode || 'VSTR01',
      employeeId: amankhUser.employeeId,
      name: 'Aman Gupta',
      email: 'aman.gupta@garmentflow.com',
      phone: amankhUser.phone || '7000000005',
      role: 'Cashier',
      passwordHash: hash,
      password: hash,
      isActive: true
    });
    console.log("Created alias user aman.gupta@garmentflow.com for Aman!");
  }

  console.log("All staff user credentials synchronized successfully!");
  await mongoose.disconnect();
};

syncAll().catch(err => {
  console.error("Sync error:", err);
  process.exit(1);
});

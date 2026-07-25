require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../models/employeeModel');
const User = require('../models/userModel');
const { decryptPassword, encryptPassword } = require('../utils/encryption');
const bcrypt = require('bcryptjs');

const printStaffPasswords = async () => {
  const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/vastraerp';
  await mongoose.connect(connStr);

  const employees = await Employee.find().lean();
  console.log("\n========================================================");
  console.log("       STAFF MANAGEMENT DISPLAYED PASSWORDS REPORT      ");
  console.log("========================================================\n");

  const results = [];

  for (const emp of employees) {
    let decrypted = "N/A";
    if (emp.encryptedPassword) {
      try {
        decrypted = decryptPassword(emp.encryptedPassword);
      } catch (e) {
        decrypted = emp.passwordHash || emp.password || "N/A";
      }
    } else {
      decrypted = emp.passwordHash || emp.password || "Vastra@123";
    }

    if (decrypted === "N/A" || decrypted === "Error Decrypting" || !decrypted) {
      decrypted = "Vastra@123";
    }

    // Hash this password and sync to both Employee & User collections
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(decrypted, salt);
    const enc = encryptPassword(decrypted);

    await Employee.updateOne({ _id: emp._id }, {
      passwordHash: decrypted,
      encryptedPassword: enc
    });

    await User.updateMany({ 
      $or: [
        { employeeId: emp._id },
        { email: (emp.email || '').toLowerCase().trim() },
        { name: { $regex: new RegExp(emp.name.split(' ')[0], 'i') } }
      ]
    }, {
      passwordHash: hash,
      password: hash,
      encryptedPassword: enc
    });

    results.push({
      name: emp.name,
      role: emp.role,
      email: emp.email,
      phone: emp.phone,
      staffManagementPassword: decrypted
    });
  }

  console.table(results);
  console.log("\n========================================================\n");
  await mongoose.disconnect();
};

printStaffPasswords().catch(err => {
  console.error("Print passwords error:", err);
  process.exit(1);
});

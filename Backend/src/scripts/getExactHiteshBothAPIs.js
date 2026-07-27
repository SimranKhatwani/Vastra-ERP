const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const User = require('../models/userModel');
const { getEmployees } = require('../controllers/employeeController');
const { getStaffDashboardStats } = require('../controllers/dashboardController');

async function checkHiteshAPIs() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(mongoUri);

  const hiteshUser = await User.findOne({ name: { $regex: /^hitesh$/i } }).lean();
  const adminUser = await User.findOne({ role: { $in: ['Admin', 'BusinessAdmin', 'SuperAdmin'] } }).lean();

  // 1. Admin API (/api/employees)
  let adminData = null;
  await getEmployees({ user: adminUser }, {
    status: () => ({
      json: (p) => { if (p.success) adminData = p.data.find(e => e.name.toLowerCase().includes('hitesh')); }
    })
  });

  // 2. Staff API (/api/dashboard/staff-summary)
  let staffData = null;
  await getStaffDashboardStats({ user: hiteshUser }, {
    status: () => ({
      json: (p) => { if (p.success) staffData = p.data; }
    })
  });

  console.log('--- ADMIN API FOR HITESH ---');
  console.log(adminData);

  console.log('\n--- STAFF DASHBOARD API FOR HITESH ---');
  console.log(staffData);

  process.exit(0);
}

checkHiteshAPIs();

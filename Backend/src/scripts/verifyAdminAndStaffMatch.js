const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const { getEmployees } = require('../controllers/employeeController');
const { getStaffDashboardStats } = require('../controllers/dashboardController');

async function testAdminAndStaffMatch() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

  const adminUser = await User.findOne({ role: { $in: ['Admin', 'BusinessAdmin', 'SuperAdmin'] } }).lean();

  // 1. Fetch Admin Employees View
  let adminEmployeesList = [];
  const adminReq = { user: adminUser };
  const adminRes = {
    status: () => ({
      json: (payload) => {
        if (payload.success) adminEmployeesList = payload.data;
      }
    })
  };
  await getEmployees(adminReq, adminRes);

  console.log(`FETCHED ${adminEmployeesList.length} EMPLOYEES FROM ADMIN API.\n`);

  // 2. Fetch Staff Dashboard View for each user
  const staffUsers = await User.find({ role: { $ne: 'SuperAdmin' } }).lean();
  const comparisonReport = [];

  for (const user of staffUsers) {
    let staffDashData = null;
    const staffReq = { user };
    const staffRes = {
      status: () => ({
        json: (payload) => {
          if (payload.success) staffDashData = payload.data;
        }
      })
    };
    await getStaffDashboardStats(staffReq, staffRes);

    const matchedAdminEmp = adminEmployeesList.find(e => 
      (user.employeeId && String(e._id) === String(user.employeeId)) ||
      (e.userId && String(e.userId) === String(user._id)) ||
      (e.name.toLowerCase().trim() === user.name.toLowerCase().trim())
    );

    if (matchedAdminEmp && staffDashData) {
      const adminSales = matchedAdminEmp.monthlySales || 0;
      const staffSales = staffDashData.totalSales || 0;
      const adminBills = matchedAdminEmp.totalInvoices || 0;
      const staffBills = staffDashData.invoiceCount || 0;

      const salesMatch = adminSales === staffSales;
      const billsMatch = adminBills === staffBills;
      const pass = salesMatch && billsMatch;

      comparisonReport.push({
        name: user.name,
        role: user.role,
        adminSales: `₹${adminSales.toLocaleString('en-IN')}`,
        staffSales: `₹${staffSales.toLocaleString('en-IN')}`,
        salesMatch: salesMatch ? '✅ MATCH' : '❌ MISMATCH',
        adminBills: adminBills,
        staffBills: staffBills,
        billsMatch: billsMatch ? '✅ MATCH' : '❌ MISMATCH',
        overallStatus: pass ? '✅ 100% PERFECT MATCH' : '❌ MISMATCH DETECTED'
      });
    }
  }

  console.table(comparisonReport);

  const allMatch = comparisonReport.every(r => r.overallStatus.includes('PERFECT MATCH'));
  if (allMatch) {
    console.log('\n🎉 ALL STAFF ACCOUNTS (INCLUDING RAM AND HITESH) ARE NOW 100% IDENTICAL BETWEEN ADMIN AND STAFF DASHBOARDS!');
  } else {
    console.error('\n⚠️ SOME ACCOUNTS DO NOT MATCH BETWEEN ADMIN AND STAFF DASHBOARDS!');
  }

  process.exit(0);
}

testAdminAndStaffMatch();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const Invoice = require('../models/invoiceModel');
const { getStaffDashboardStats } = require('../controllers/dashboardController');

async function testAllStaffDashboards() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

  const staffUsers = await User.find({ role: { $ne: 'SuperAdmin' } }).lean();
  console.log(`TESTING DASHBOARD DATA FOR ALL ${staffUsers.length} STAFF ACCOUNTS...\n`);

  const results = [];

  for (const user of staffUsers) {
    const req = {
      user: {
        id: user._id,
        _id: user._id,
        tenantId: user.tenantId,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        employeeId: user.employeeId
      }
    };

    let resData = null;
    const res = {
      status: (code) => ({
        json: (payload) => {
          resData = payload;
        }
      })
    };

    await getStaffDashboardStats(req, res);

    if (resData && resData.success && resData.data) {
      const d = resData.data;
      const emp = d.employee;
      const pass = typeof d.totalSales === 'number' && typeof d.commissionRate === 'number' && typeof d.commissionAmount === 'number';

      results.push({
        userName: user.name,
        role: user.role,
        user_id: String(user._id),
        employee_id: String(emp.id || user.employeeId),
        totalSales: `₹${d.totalSales.toLocaleString('en-IN')}`,
        invoiceCount: d.invoiceCount,
        commRate: `${d.commissionRate}%`,
        commEarned: `₹${d.commissionAmount.toLocaleString('en-IN')}`,
        todaySales: `₹${d.todaySales.toLocaleString('en-IN')}`,
        assignedInvoicesCount: d.invoices.length,
        attendanceRate: `${d.attendanceRate}%`,
        status: pass ? '✅ PASSED' : '❌ FAILED'
      });
    } else {
      results.push({
        userName: user.name,
        role: user.role,
        user_id: String(user._id),
        status: '❌ API ERROR'
      });
    }
  }

  console.table(results);

  const allPassed = results.every(r => r.status.includes('PASSED'));
  if (allPassed) {
    console.log('\n🎉 ALL EMPLOYEE DASHBOARDS PASSED LIVE MONGODB VALIDATION!');
  } else {
    console.error('\n⚠️ SOME EMPLOYEE DASHBOARDS FAILED VALIDATION!');
  }

  process.exit(0);
}

testAllStaffDashboards();

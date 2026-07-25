const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const User = require('../models/userModel');
const EmployeeResolver = require('../services/employeeResolver');
const UniversalDashboardService = require('../services/universalDashboardService');

async function testUniversalDashboardArchitecture() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

  const allUsers = await User.find({}).lean();
  console.log(`TESTING UNIVERSAL DASHBOARD ENGINE FOR ALL ${allUsers.length} USER ACCOUNTS...\n`);

  const auditReport = [];

  for (const user of allUsers) {
    try {
      // Step 1: Universal Employee Resolver
      const resolved = await EmployeeResolver.resolve(user);

      // Step 2: Universal Dashboard Service
      const dashboard = await UniversalDashboardService.getEmployeeDashboard(resolved);

      const pass = 
        resolved.employeeId &&
        typeof dashboard.totalSales === 'number' &&
        typeof dashboard.invoiceCount === 'number' &&
        typeof dashboard.commissionRate === 'number' &&
        typeof dashboard.commissionAmount === 'number' &&
        typeof dashboard.attendanceRate === 'number' &&
        Array.isArray(dashboard.invoices);

      auditReport.push({
        userName: user.name,
        userRole: user.role,
        resolvedRole: resolved.role,
        user_id: String(user._id),
        employee_id: String(resolved.employeeId),
        totalSales: `₹${dashboard.totalSales.toLocaleString('en-IN')}`,
        invoiceCount: dashboard.invoiceCount,
        commRate: `${dashboard.commissionRate}%`,
        commEarned: `₹${dashboard.commissionAmount.toLocaleString('en-IN')}`,
        assignedInvoicesCount: dashboard.invoices.length,
        attendanceRate: `${dashboard.attendanceRate}%`,
        universalEngineStatus: pass ? '✅ PASSED' : '❌ FAILED'
      });
    } catch (err) {
      auditReport.push({
        userName: user.name,
        userRole: user.role,
        user_id: String(user._id),
        universalEngineStatus: `❌ ERROR: ${err.message}`
      });
    }
  }

  console.table(auditReport);

  const allPassed = auditReport.every(r => r.universalEngineStatus.includes('PASSED'));
  if (allPassed) {
    console.log('\n🎉 UNIVERSAL DASHBOARD ARCHITECTURE VERIFIED 100% SUCCESSFUL FOR ALL ROLES!');
  } else {
    console.error('\n⚠️ UNIVERSAL DASHBOARD ARCHITECTURE AUDIT FAILED FOR SOME ROLES!');
  }

  process.exit(0);
}

testUniversalDashboardArchitecture();

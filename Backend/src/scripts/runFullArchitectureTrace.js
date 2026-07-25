const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const Invoice = require('../models/invoiceModel');

async function runTrace() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

  const users = await User.find({}).lean();
  const employees = await Employee.find({}).lean();
  const invoices = await Invoice.find({}).lean();

  console.log(`FOUND ${users.length} Users, ${employees.length} Employees, ${invoices.length} Invoices.\n`);

  const report = [];

  for (const emp of employees) {
    const matchingUser = users.find(u => 
      (u.employeeId && String(u.employeeId) === String(emp._id)) ||
      (emp.userId && String(emp.userId) === String(u._id)) ||
      (u.email && emp.email && u.email.toLowerCase() === emp.email.toLowerCase()) ||
      (u.name && emp.name && u.name.toLowerCase().trim() === emp.name.toLowerCase().trim())
    );

    const empIdStr = String(emp._id);
    const userIdStr = matchingUser ? String(matchingUser._id) : 'NONE';
    const userEmpIdStr = matchingUser?.employeeId ? String(matchingUser.employeeId) : 'NONE';
    const empUserIdStr = emp.userId ? String(emp.userId) : 'NONE';

    const isLinkedCorrectly = matchingUser && (userEmpIdStr === empIdStr) && (empUserIdStr === userIdStr);

    // Invoices assigned by ObjectId
    const assignedInvoicesById = invoices.filter(inv => {
      const spId = inv.salespersonId ? String(inv.salespersonId) : null;
      const wId = inv.workerId ? String(inv.workerId) : null;
      const eId = inv.employeeId ? String(inv.employeeId) : null;
      const uId = inv.userId ? String(inv.userId) : null;
      return spId === empIdStr || wId === empIdStr || eId === empIdStr || (userIdStr !== 'NONE' && uId === userIdStr);
    });

    // Invoices assigned by Name/String
    const empNameLower = (emp.name || '').toLowerCase().trim();
    const assignedInvoicesByName = invoices.filter(inv => {
      const names = [inv.salespersonName, inv.employeeName, inv.workerName, inv.createdBy, inv.cashierName].map(n => (n || '').toLowerCase().trim());
      return names.some(n => n && (n === empNameLower || n.includes(empNameLower) || empNameLower.includes(n)));
    });

    const totalInvoiceSalesById = assignedInvoicesById.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);

    report.push({
      employeeName: emp.name,
      role: emp.role,
      employeeId: empIdStr,
      userId: userIdStr,
      userEmployeeIdRef: userEmpIdStr,
      empUserIdRef: empUserIdStr,
      isLinkedCorrectly: isLinkedCorrectly ? 'YES' : 'NO (BROKEN LINK)',
      commissionRate: emp.commissionRate,
      monthlySalesInDB: emp.monthlySales,
      totalInvoicesInDB: emp.totalInvoices,
      commissionEarnedInDB: emp.commissionEarned,
      invoiceCountById: assignedInvoicesById.length,
      invoiceSalesById: totalInvoiceSalesById,
      invoiceCountByName: assignedInvoicesByName.length
    });
  }

  console.table(report);

  // Print Users without employeeId
  const unlinkedUsers = users.filter(u => !u.employeeId);
  if (unlinkedUsers.length > 0) {
    console.log('\n--- USERS MISSING employeeId ---');
    unlinkedUsers.forEach(u => {
      console.log(`User: ${u.name} (${u.email}) | Role: ${u.role} | ID: ${u._id} | employeeId: NULL`);
    });
  }

  process.exit(0);
}

runTrace();

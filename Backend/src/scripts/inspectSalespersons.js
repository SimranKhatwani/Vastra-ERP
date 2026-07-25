const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const Invoice = require('../models/invoiceModel');

async function inspectSalespersons() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

  const employees = await Employee.find({ name: { $regex: /ram|hitesh/i } }).lean();
  const users = await User.find({ name: { $regex: /ram|hitesh/i } }).lean();
  const allInvoices = await Invoice.find({}).lean();

  console.log('--- EMPLOYEES ---');
  employees.forEach(e => {
    console.log(`Employee: ${e.name} (${e.role}) | ID: ${e._id} | MonthlySales: ${e.monthlySales} | TotalInvoices: ${e.totalInvoices} | CommEarned: ${e.commissionEarned} | CommRate: ${e.commissionRate}%`);
  });

  console.log('\n--- USERS ---');
  users.forEach(u => {
    console.log(`User: ${u.name} (${u.role}) | ID: ${u._id} | EmployeeIdRef: ${u.employeeId} | Email: ${u.email}`);
  });

  console.log('\n--- INVOICES IN DB ---');
  for (const emp of employees) {
    const empIdStr = String(emp._id);
    const empNameLower = emp.name.toLowerCase().trim();

    const assignedById = allInvoices.filter(inv => {
      const spId = inv.salespersonId ? String(inv.salespersonId) : null;
      const wId = inv.workerId ? String(inv.workerId) : null;
      const eId = inv.employeeId ? String(inv.employeeId) : null;
      return spId === empIdStr || wId === empIdStr || eId === empIdStr;
    });

    const assignedByName = allInvoices.filter(inv => {
      const names = [inv.salespersonName, inv.employeeName, inv.workerName, inv.createdBy, inv.cashierName].map(n => (n || '').toLowerCase().trim());
      return names.some(n => n && (n === empNameLower || n.includes(empNameLower) || empNameLower.includes(n)));
    });

    console.log(`\nInvoices for ${emp.name} (ID: ${emp._id}):`);
    console.log(`  Matching by ObjectId: ${assignedById.length} invoices`);
    console.log(`  Matching by Name: ${assignedByName.length} invoices`);

    if (assignedByName.length > 0) {
      console.log(`  Detailed Invoices found:`);
      assignedByName.forEach(inv => {
        console.log(`    - InvoiceNo: ${inv.invoiceNo} | Total: ₹${inv.grandTotal} | salespersonId: ${inv.salespersonId} | salespersonName: "${inv.salespersonName}" | createdBy: "${inv.createdBy}"`);
      });
    }
  }

  process.exit(0);
}

inspectSalespersons();

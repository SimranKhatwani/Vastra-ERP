const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const Invoice = require('../models/invoiceModel');

async function repairDatabase() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  // 1. Consolidate duplicate Alice Employee documents
  const aliceEmps = await Employee.find({ name: /Alice Employee/i });
  if (aliceEmps.length > 1) {
    console.log(`Found ${aliceEmps.length} duplicate Alice Employee documents. Cleaning up...`);
    const canonicalAlice = aliceEmps.find(e => String(e._id) === '6a50f1298a12a2aef6acd859') || aliceEmps[0];
    for (const emp of aliceEmps) {
      if (String(emp._id) !== String(canonicalAlice._id)) {
        await Employee.deleteOne({ _id: emp._id });
        console.log(`Deleted stale Alice Employee document ${emp._id}`);
      }
    }
  }

  // 2. Ensure every Employee has matching User, and every User has matching Employee
  const employees = await Employee.find({});
  const users = await User.find({});

  for (const emp of employees) {
    let matchingUser = users.find(u => 
      (u.employeeId && String(u.employeeId) === String(emp._id)) ||
      (u.email && emp.email && u.email.toLowerCase() === emp.email.toLowerCase()) ||
      (u.name && emp.name && u.name.toLowerCase().trim() === emp.name.toLowerCase().trim())
    );

    if (!matchingUser) {
      console.log(`Creating missing User document for employee: ${emp.name}`);
      const cleanEmail = emp.email ? emp.email.toLowerCase() : `${emp.name.toLowerCase().replace(/\s+/g, '')}@garmentflow.com`;
      matchingUser = await User.create({
        tenantId: emp.tenantId,
        businessCode: 'VSTR01',
        employeeId: emp._id,
        name: emp.name,
        email: cleanEmail,
        password: 'Vastra@123',
        role: emp.role,
        isActive: true
      });
    }

    // Ensure bi-directional ObjectId links
    if (!matchingUser.employeeId || String(matchingUser.employeeId) !== String(emp._id)) {
      matchingUser.employeeId = emp._id;
      await matchingUser.save();
      console.log(`Linked User ${matchingUser.name} -> Employee ${emp._id}`);
    }

    if (!emp.userId || String(emp.userId) !== String(matchingUser._id)) {
      emp.userId = matchingUser._id;
      await emp.save();
      console.log(`Linked Employee ${emp.name} -> User ${matchingUser._id}`);
    }
  }

  // 3. Link all Invoice documents strictly to Employee ObjectId
  const allInvoices = await Invoice.find({});
  let invoicesRepaired = 0;

  for (const inv of allInvoices) {
    let matchedEmp = null;

    // Try matching by existing salespersonId / workerId / employeeId
    const existingId = inv.salespersonId || inv.workerId || inv.employeeId;
    if (existingId) {
      matchedEmp = employees.find(e => String(e._id) === String(existingId));
    }

    // Try matching by salespersonName / employeeName / createdBy / cashierName
    if (!matchedEmp) {
      const names = [inv.salespersonName, inv.employeeName, inv.workerName, inv.createdBy, inv.cashierName].filter(Boolean);
      for (const n of names) {
        const lowerN = n.toLowerCase().trim();
        matchedEmp = employees.find(e => {
          const lowerE = e.name.toLowerCase().trim();
          const firstE = lowerE.split(' ')[0];
          return lowerE === lowerN || lowerN.includes(lowerE) || lowerE.includes(lowerN) || (firstE.length > 2 && lowerN.includes(firstE));
        });
        if (matchedEmp) break;
      }
    }

    if (matchedEmp) {
      let updated = false;
      if (!inv.salespersonId || String(inv.salespersonId) !== String(matchedEmp._id)) {
        inv.salespersonId = matchedEmp._id;
        updated = true;
      }
      if (!inv.employeeId || String(inv.employeeId) !== String(matchedEmp._id)) {
        inv.employeeId = matchedEmp._id;
        updated = true;
      }
      if (!inv.salespersonName) {
        inv.salespersonName = matchedEmp.name;
        updated = true;
      }
      if (updated) {
        await inv.save();
        invoicesRepaired++;
      }
    }
  }

  console.log(`Repaired ${invoicesRepaired} invoice ObjectId linkages.`);

  // 4. Update Employee document totals (monthlySales, totalInvoices, commissionEarned) from real invoices
  for (const emp of employees) {
    const empInvoices = await Invoice.find({
      $or: [
        { salespersonId: emp._id },
        { workerId: emp._id },
        { employeeId: emp._id }
      ]
    });

    const invCount = empInvoices.length;
    const invSales = empInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const commRate = emp.commissionRate || (emp.role === 'Worker' ? 0.5 : (emp.role === 'Tailor' ? 4 : (emp.role === 'Cashier' ? 1 : 1.5)));
    const commEarned = Math.round(invSales * (commRate / 100) * 100) / 100;

    let modified = false;
    if (invCount > 0) {
      if (emp.monthlySales !== invSales) {
        emp.monthlySales = invSales;
        modified = true;
      }
      if (emp.totalInvoices !== invCount) {
        emp.totalInvoices = invCount;
        modified = true;
      }
      if (emp.commissionEarned !== commEarned) {
        emp.commissionEarned = commEarned;
        modified = true;
      }
    } else {
      // If invoice count is 0, preserve any pre-existing admin metrics or calculate commission
      if (emp.monthlySales > 0 && (!emp.commissionEarned || emp.commissionEarned === 0)) {
        emp.commissionEarned = Math.round(emp.monthlySales * (commRate / 100) * 100) / 100;
        modified = true;
      }
    }

    if (!emp.commissionRate || emp.commissionRate === 0) {
      emp.commissionRate = commRate;
      modified = true;
    }

    if (modified) {
      await emp.save();
      console.log(`Updated Employee DB record for ${emp.name}: Sales=₹${emp.monthlySales}, Invoices=${emp.totalInvoices}, Comm=₹${emp.commissionEarned}, Rate=${emp.commissionRate}%`);
    }
  }

  console.log('\nDatabase Linkage Repair & Aggregation Sync Completed.');
  process.exit(0);
}

repairDatabase();

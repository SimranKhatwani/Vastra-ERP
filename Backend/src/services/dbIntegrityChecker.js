const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const Invoice = require('../models/invoiceModel');
const AttendanceRecord = require('../models/attendanceRecordModel');

/**
 * Enterprise Database Integrity Checker & Auto-Repair Engine
 * 
 * Runs automatically on server startup.
 * Verifies and repairs bi-directional ObjectId links between User and Employee documents,
 * updates Invoice salespersonId/workerId/employeeId references, and syncs Employee metric totals
 * directly from live MongoDB records.
 */
class DbIntegrityChecker {
  static async runCheckAndRepair() {
    console.log('🔍 Running Database Integrity & ObjectId Linkage Check...');
    try {
      const users = await User.find({});
      const employees = await Employee.find({});
      const invoices = await Invoice.find({});

      let userEmpRepairs = 0;
      let invoiceRepairs = 0;
      let empMetricSyncs = 0;

      // 1. Verify and repair User <-> Employee ObjectId links
      for (const emp of employees) {
        let user = users.find(u => 
          (u.employeeId && String(u.employeeId) === String(emp._id)) ||
          (emp.userId && String(emp.userId) === String(u._id)) ||
          (u.email && emp.email && u.email.toLowerCase() === emp.email.toLowerCase()) ||
          (u.name && emp.name && u.name.toLowerCase().trim() === emp.name.toLowerCase().trim())
        );

        if (!user) {
          // Auto-create missing User document
          const cleanEmail = emp.email ? emp.email.toLowerCase() : `${emp.name.toLowerCase().replace(/\s+/g, '')}@garmentflow.com`;
          user = await User.create({
            tenantId: emp.tenantId,
            businessCode: 'VSTR01',
            employeeId: emp._id,
            name: emp.name,
            email: cleanEmail,
            password: 'Vastra@123',
            role: emp.role,
            isActive: true
          });
          userEmpRepairs++;
        }

        if (!user.employeeId || String(user.employeeId) !== String(emp._id)) {
          user.employeeId = emp._id;
          await user.save();
          userEmpRepairs++;
        }

        if (!emp.userId || String(emp.userId) !== String(user._id)) {
          emp.userId = user._id;
          await emp.save();
          userEmpRepairs++;
        }
      }

      // 2. Verify and repair Invoice ObjectIds
      for (const inv of invoices) {
        let matchedEmp = null;
        const existingId = inv.salespersonId || inv.workerId || inv.employeeId;

        if (existingId) {
          matchedEmp = employees.find(e => String(e._id) === String(existingId));
        }

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
            invoiceRepairs++;
          }
        }
      }

      // 3. Recalculate & Sync Employee Metric Totals directly from MongoDB Invoices
      for (const emp of employees) {
        const empInvoices = await Invoice.find({
          $or: [
            { salespersonId: emp._id },
            { workerId: emp._id },
            { employeeId: emp._id },
            { 'items.salespersonId': emp._id },
            { 'items.workerId': emp._id }
          ]
        });

        const invCount = empInvoices.length;
        const invSales = empInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const commRate = emp.commissionRate || 1.5;
        const commEarned = Math.round(invSales * (commRate / 100) * 100) / 100;

        let modified = false;
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
        if (!emp.commissionRate || emp.commissionRate === 0) {
          emp.commissionRate = commRate;
          modified = true;
        }

        if (modified) {
          await emp.save();
          empMetricSyncs++;
        }
      }

      console.log(`✅ Database Integrity Check Passed (${userEmpRepairs} User/Emp repairs, ${invoiceRepairs} Invoice linkage repairs, ${empMetricSyncs} Employee metric syncs).\n`);
    } catch (err) {
      console.error('⚠️ Database Integrity Checker Note:', err.message);
    }
  }
}

module.exports = DbIntegrityChecker;

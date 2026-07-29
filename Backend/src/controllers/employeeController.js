const Employee = require('../models/employeeModel');
const User = require('../models/userModel');
const Invoice = require('../models/invoiceModel');
const { generateSecurePassword } = require('../utils/passwordGenerator');
const { encryptPassword, decryptPassword } = require('../utils/encryption');
const { emitToTenant, emitToRole, emitToUser } = require('../socket/socketServer');

exports.createEmployee = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const existingEmployee = await Employee.findOne({ tenantId, phone: req.body.phone });
    if (existingEmployee) {
      return res.status(400).json({ success: false, message: 'An employee with this phone number already exists' });
    }

    const existingUser = await User.findOne({ email: req.body.email || `${req.body.phone}@garmenterp.com` });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists in the system' });
    }

    const plainPassword = generateSecurePassword();
    const encryptedPassword = encryptPassword(plainPassword);

    const employee = await Employee.create({
      ...req.body,
      tenantId,
      passwordHash: plainPassword,
      encryptedPassword: encryptedPassword,
      businessCode: req.user.businessCode,
    });

    const user = await User.create({
      tenantId,
      businessCode: req.user.businessCode,
      employeeId: employee._id,
      name: req.body.name,
      email: req.body.email || `${req.body.phone}@garmenterp.com`,
      phone: req.body.phone,
      role: req.body.role || 'Salesperson',
      passwordHash: plainPassword,
      encryptedPassword: encryptedPassword,
      isActive: true
    });

    employee.userId = user._id;
    await employee.save();

    emitToTenant(tenantId, 'employee.created', {
      employee,
      tenantId,
      event: 'employee.created'
    });
    emitToTenant(tenantId, 'activity.feed', {
      id: `emp-${employee._id}`,
      type: 'employee',
      action: 'EMPLOYEE_ADDED',
      icon: '👤',
      color: 'blue',
      title: `${employee.name} joined the team`,
      detail: `Role: ${employee.role || 'Staff'} · ${employee.department || 'General'}`,
      user: req.user?.name || 'HR Admin',
      timestamp: new Date().toISOString(),
      meta: { name: employee.name, role: employee.role },
    });
    emitToRole('admin', 'dashboard.stats.updated', { tenantId, event: 'dashboard.stats.updated' });

    res.status(201).json({ success: true, data: employee, generatedPassword: plainPassword });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const filter = tenantId ? { tenantId } : {};
    const employees = await Employee.find(filter).sort('-createdAt').lean();

    // Dynamically calculate live MongoDB invoice totals for every single employee
    for (const emp of employees) {
      const empInvoices = await Invoice.find({
        tenantId,
        $or: [
          { salespersonId: emp._id },
          { workerId: emp._id },
          { employeeId: emp._id },
          { 'items.salespersonId': emp._id },
          { 'items.workerId': emp._id },
          { 'items.employeeId': emp._id }
        ]
      }).lean();

      const liveSales = empInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      const liveCount = empInvoices.length;
      const commRate = emp.commissionRate || 1.5;
      const liveComm = Math.round(liveSales * (commRate / 100) * 100) / 100;

      // Always return live DB figures if invoices exist, otherwise fallback to document fields
      emp.monthlySales = liveCount > 0 ? liveSales : (emp.monthlySales || 0);
      emp.totalInvoices = liveCount > 0 ? liveCount : (emp.totalInvoices || 0);
      emp.commissionEarned = liveCount > 0 ? liveComm : (emp.commissionEarned || 0);
      emp.commissionRate = commRate;

      // Decrypt passwords if user is Admin or SuperAdmin
      if (req.user && (req.user.role === 'Admin' || req.user.role === 'BusinessAdmin' || req.user.role === 'SuperAdmin')) {
        if (emp.encryptedPassword) {
          try {
            emp.password = decryptPassword(emp.encryptedPassword);
          } catch (e) {
            emp.password = "Error Decrypting";
          }
        } else {
          emp.password = "N/A";
        }
      }
    }

    res.status(200).json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let employee = await Employee.findOne({ _id: req.params.id, tenantId });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    emitToTenant(tenantId, 'employee.updated', {
      employee,
      tenantId,
      event: 'employee.updated'
    });

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const employee = await Employee.findOne({ _id: req.params.id, tenantId });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    await employee.remove();

    emitToTenant(tenantId, 'employee.deleted', {
      employeeId: req.params.id,
      tenantId,
      event: 'employee.deleted'
    });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.disburseCommission = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const employee = await Employee.findOne({ _id: req.params.id, tenantId });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const paidAmount = employee.commissionEarned || 0;
    employee.commissionEarned = 0;
    await employee.save();

    res.status(200).json({ success: true, message: `Disbursed ₹${paidAmount} commission`, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

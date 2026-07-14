const Employee = require('../models/employeeModel');
const User = require('../models/userModel');
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

    await User.create({
      tenantId,
      businessCode: req.user.businessCode,
      name: req.body.name,
      email: req.body.email || `${req.body.phone}@garmenterp.com`, // fallback email if not provided
      phone: req.body.phone,
      role: req.body.role || 'Cashier', // fallback role
      passwordHash: plainPassword,
      encryptedPassword: encryptedPassword,
      isActive: true
    });

    emitToTenant(tenantId, 'employee.created', {
      employee,
      tenantId,
      event: 'employee.created'
    });
    emitToRole('admin', 'dashboard.stats.updated', { tenantId, event: 'dashboard.stats.updated' });

    res.status(201).json({ success: true, data: employee, generatedPassword: plainPassword });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const employees = await Employee.find({ tenantId }).sort('-createdAt').lean();
      
    // Decrypt passwords if user is Admin or SuperAdmin
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'BusinessAdmin' || req.user.role === 'SuperAdmin')) {
      employees.forEach(s => {
        if (s.encryptedPassword) {
          try {
            s.password = decryptPassword(s.encryptedPassword);
          } catch (e) {
            s.password = "Error Decrypting";
          }
        } else {
          s.password = "N/A";
        }
      });
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

    await employee.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.disburseCommission = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { amount } = req.body;
    
    let employee = await Employee.findOne({ _id: req.params.id, tenantId });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    employee.commissionEarned = Math.max(0, employee.commissionEarned - amount);
    await employee.save();

    emitToTenant(tenantId, 'commission.updated', {
      employee,
      tenantId,
      event: 'commission.updated'
    });

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

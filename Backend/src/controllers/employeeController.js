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
    const tenantId = req.user?.tenantId;
    const filter = tenantId ? { tenantId } : {};
    let employees = await Employee.find(filter).sort('-createdAt').lean();

    if (employees.length === 0) {
      const initialStaff = [
        {
          name: "Vijay Shekhar",
          email: "vijay.shekhar@garmentflow.com",
          phone: "7000000000",
          role: "Admin",
          status: "Active",
          attendanceRate: 98,
          salary: 85000,
          commissionRate: 5,
          salesTarget: 500000,
          tenantId
        },
        {
          name: "Hitesh Kumar",
          email: "hitesh.kumar@garmentflow.com",
          phone: "7000000001",
          role: "Manager",
          status: "Active",
          attendanceRate: 95,
          salary: 55000,
          commissionRate: 3,
          salesTarget: 300000,
          tenantId
        },
        {
          name: "Rajat Sharma",
          email: "rajat.sharma@garmentflow.com",
          phone: "7000000002",
          role: "Salesperson",
          status: "Active",
          attendanceRate: 92,
          salary: 35000,
          commissionRate: 2.5,
          salesTarget: 200000,
          tenantId
        },
        {
          name: "Mahesh Verma",
          email: "mahesh.verma@garmentflow.com",
          phone: "7000000003",
          role: "Tailor",
          status: "Active",
          attendanceRate: 96,
          salary: 40000,
          commissionRate: 4,
          salesTarget: 150000,
          tenantId
        },
        {
          name: "Ram Singh",
          email: "ram.singh@garmentflow.com",
          phone: "7000000004",
          role: "Cashier",
          status: "Active",
          attendanceRate: 94,
          salary: 30000,
          commissionRate: 1,
          salesTarget: 100000,
          tenantId
        },
        {
          name: "Aman Gupta",
          email: "aman.gupta@garmentflow.com",
          phone: "7000000005",
          role: "Salesperson",
          status: "Active",
          attendanceRate: 90,
          salary: 32000,
          commissionRate: 2,
          salesTarget: 180000,
          tenantId
        }
      ];
      const created = await Employee.insertMany(initialStaff);
      employees = created.map(e => e.toObject());
    }
      
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

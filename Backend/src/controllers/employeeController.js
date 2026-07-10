const Employee = require('../models/employeeModel');

exports.createEmployee = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const existingEmployee = await Employee.findOne({ tenantId, phone: req.body.phone });
    if (existingEmployee) {
      return res.status(400).json({ success: false, message: 'An employee with this phone number already exists' });
    }

    const employee = await Employee.create({
      ...req.body,
      tenantId
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const employees = await Employee.find({ tenantId }).sort('-createdAt');
      
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

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

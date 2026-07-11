const Staff = require('../models/staffModel');

// @desc    Get all Admin staff
// @route   GET /api/staff
// @access  Private (Admin)
exports.getStaff = async (req, res) => {
  try {
    const staff = await Staff.find().sort({ createdAt: -1 }).lean();
    
    // Decrypt passwords if user is Admin or SuperAdmin
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'BusinessAdmin' || req.user.role === 'SuperAdmin')) {
      staff.forEach(s => {
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

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const User = require('../models/userModel');
const { generateSecurePassword } = require('../utils/passwordGenerator');
const { encryptPassword, decryptPassword } = require('../utils/encryption');

// @desc    Add a new Admin staff member
// @route   POST /api/staff
// @access  Private (Admin)
exports.createStaff = async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email || `${req.body.phone}@garmenterp.com` });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists in the system' });
    }

    const plainPassword = generateSecurePassword();
    const encryptedPassword = encryptPassword(plainPassword);

    const staffData = {
      ...req.body,
      passwordHash: plainPassword,
      encryptedPassword: encryptedPassword,
      businessCode: req.user.businessCode,
    };

    const staff = await Staff.create(staffData);

    await User.create({
      tenantId: req.user.tenantId, // attached by protect middleware
      businessCode: req.user.businessCode,
      name: req.body.name,
      email: req.body.email || `${req.body.phone}@garmenterp.com`,
      phone: req.body.phone,
      role: req.body.designation || 'Cashier',
      passwordHash: plainPassword,
      encryptedPassword: encryptedPassword,
      isActive: true
    });

    res.status(201).json({ success: true, data: staff, generatedPassword: plainPassword });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update staff member details
// @route   PUT /api/staff/:id
// @access  Private (Admin)
exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a staff member
// @route   DELETE /api/staff/:id
// @access  Private (Admin)
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

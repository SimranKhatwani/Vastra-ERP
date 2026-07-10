const jwt = require('jsonwebtoken');
const Tenant = require('../models/tenantModel');
const User = require('../models/userModel');

// Generate JWT specifically for SuperAdmin
const generateSuperAdminToken = () => {
  return jwt.sign({ role: 'SuperAdmin' }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

exports.superAdminLogin = async (req, res) => {
  try {
    const { email, secretKey } = req.body;

    if (!email || !secretKey) {
      return res.status(400).json({ success: false, message: 'Please provide email and secretKey' });
    }

    // Check credentials against .env
    if (
      email === process.env.SUPERADMIN_EMAIL &&
      secretKey === process.env.SUPERADMIN_SECRET_KEY
    ) {
      const token = generateSuperAdminToken();
      return res.status(200).json({
        success: true,
        token,
        user: { role: 'SuperAdmin', email: process.env.SUPERADMIN_EMAIL }
      });
    }

    return res.status(401).json({ success: false, message: 'wrong or invalid credential try another' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.registerBusiness = async (req, res) => {
  try {
    const { businessName, businessEmail, plan, adminName, adminEmail, adminPassword, adminPhone } = req.body;

    // 1. Create the Tenant (Business)
    const tenantExists = await Tenant.findOne({ email: businessEmail });
    if (tenantExists) {
      return res.status(400).json({ success: false, message: 'Business with this email already exists' });
    }

    const tenant = await Tenant.create({
      businessName,
      email: businessEmail,
      plan: plan || 'Trial'
    });

    // 2. Create the BusinessAdmin User for this Tenant
    const userExists = await User.findOne({ email: adminEmail });
    if (userExists) {
      // Rollback tenant creation if user exists
      await Tenant.findByIdAndDelete(tenant._id);
      return res.status(400).json({ success: false, message: 'Admin email already in use' });
    }

    const adminUser = await User.create({
      tenantId: tenant._id,
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      phone: adminPhone,
      role: 'BusinessAdmin'
    });

    res.status(201).json({
      success: true,
      message: 'Business and BusinessAdmin created successfully',
      data: {
        tenant,
        adminUser: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

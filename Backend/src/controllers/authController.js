const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

exports.login = async (req, res) => {
  try {
    const { businessId, email, password } = req.body;

    if (!businessId || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide a Business ID, email, and password' });
    }

    const user = await User.findOne({ email }).select('+password +passwordHash').populate('tenantId');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Please contact SuperAdmin to register your business.' });
    }

    if (user.businessCode !== businessId && (!user.tenantId || user.tenantId._id.toString() !== businessId)) {
      return res.status(401).json({ success: false, message: 'Invalid Business ID.' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account is inactive. Please contact your administrator.' });
    }

    if (user.tenantId && user.tenantId.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your business account is suspended. Please contact SuperAdmin.' });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'wrong or invalid credential try another' });
    }

    const token = generateToken(user._id);

    try {
      const staffActivityController = require('./staffActivityController');
      await staffActivityController.recordLoginHistory(req, user, 'Online');
    } catch (e) {
      console.error('Failed to log login history', e);
    }

    res.status(200).json({
      success: true,
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenantId._id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('tenantId', 'businessName plan status');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

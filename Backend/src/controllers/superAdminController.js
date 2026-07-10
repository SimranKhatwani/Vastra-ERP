const jwt = require('jsonwebtoken');
const Tenant = require('../models/tenantModel');
const User = require('../models/userModel');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const moment = require('moment-timezone');

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

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ success: false, message: "Amount is required" });

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount * 100, // Razorpay works in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyAndRegisterBusiness = async (req, res) => {
  try {
    const { 
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      businessName, email, plan, adminName, adminPassword, adminPhone, 
      aadhaarNumber, address 
    } = req.body;

    // Verify Signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // 1. Check if email already exists
    const tenantExists = await Tenant.findOne({ email });
    const userExists = await User.findOne({ email });

    if (tenantExists || userExists) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    // Determine expiry using IST
    let expiryDays = 14;
    if (plan === 'Starter') expiryDays = 30;
    if (plan === 'Professional') expiryDays = 180;
    if (plan === 'Enterprise') expiryDays = 365;

    const expiryDate = moment().tz('Asia/Kolkata').add(expiryDays, 'days').toDate();

    // 2. Create the Tenant (Business)
    const tenant = await Tenant.create({
      businessName,
      email,
      phone: adminPhone,
      aadhaarNumber,
      address,
      plan: plan || 'Trial',
      planExpiryDate: expiryDate
    });

    // 3. Create the BusinessAdmin User
    const adminUser = await User.create({
      tenantId: tenant._id,
      name: adminName,
      email,
      password: adminPassword,
      phone: adminPhone,
      role: 'BusinessAdmin'
    });

    res.status(201).json({
      success: true,
      message: 'Payment verified and Business created successfully',
      data: {
        tenant,
        adminUser: { id: adminUser._id, name: adminUser.name, email: adminUser.email }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({}).sort('-createdAt');
    const tenantsWithAdmin = await Promise.all(tenants.map(async (tenant) => {
      const admin = await User.findOne({ tenantId: tenant._id, role: 'BusinessAdmin' });
      return {
        ...tenant._doc,
        adminEmail: admin ? admin.email : tenant.email,
        adminName: admin ? admin.name : 'Unknown'
      };
    }));
    res.status(200).json({ success: true, data: tenantsWithAdmin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleTenantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findById(id);
    if (!tenant) return res.status(404).json({ success: false, message: "Tenant not found" });

    tenant.status = tenant.status === 'Active' ? 'Suspended' : 'Active';
    await tenant.save();

    res.status(200).json({ success: true, message: `Status updated to ${tenant.status}`, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTenantDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tenant = await Tenant.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!tenant) return res.status(404).json({ success: false, message: "Tenant not found" });

    res.status(200).json({ success: true, message: "Tenant updated successfully", data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

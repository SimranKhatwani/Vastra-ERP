const DiscountRule = require('../models/discountRuleModel');
const DiscountApproval = require('../models/discountApprovalModel');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

// 1. GET ALL RULES
exports.getRules = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const rules = await DiscountRule.find({ tenantId }).sort({ priority: 1, createdAt: -1 });
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. CREATE A NEW RULE
exports.createRule = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      offerName,
      offerType,
      minBillAmount,
      maxBillAmount,
      discountType,
      discountValue,
      maxDiscount,
      applicableProducts,
      applicableCategories,
      applicableBrands,
      customerType,
      startDate,
      endDate,
      priority,
      stackable,
      status
    } = req.body;

    const newRule = new DiscountRule({
      tenantId,
      offerName,
      offerType,
      minBillAmount,
      maxBillAmount,
      discountType,
      discountValue,
      maxDiscount,
      applicableProducts,
      applicableCategories,
      applicableBrands,
      customerType,
      startDate,
      endDate,
      priority,
      stackable,
      status
    });

    await newRule.save();
    res.status(201).json({ success: true, data: newRule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. UPDATE A RULE
exports.updateRule = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const updated = await DiscountRule.findOneAndUpdate(
      { _id: id, tenantId },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Discount rule not found' });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. DELETE A RULE
exports.deleteRule = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const deleted = await DiscountRule.findOneAndDelete({ _id: id, tenantId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Discount rule not found' });
    }

    res.json({ success: true, message: 'Discount rule deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. REQUEST DISCOUNT APPROVAL (CASHIER)
exports.requestApproval = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { originalBillAmount, requestedDiscount, discountType, reason } = req.body;

    const newApproval = new DiscountApproval({
      tenantId,
      originalBillAmount,
      requestedDiscount,
      discountType,
      requestedBy: req.user.name || req.user.username,
      reason,
      status: 'Pending'
    });

    await newApproval.save();
    res.status(201).json({ success: true, data: newApproval });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. APPROVE DISCOUNT REQUEST (SUPERVISOR PIN/PASSWORD)
exports.approveRequest = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { approvalId, supervisorUsername, supervisorPassword } = req.body;

    // Find supervisor account
    const supervisor = await User.findOne({ username: supervisorUsername, tenantId });
    if (!supervisor) {
      return res.status(401).json({ success: false, message: 'Supervisor user account not found.' });
    }

    // Role check: must be admin or manager
    const role = (supervisor.role || '').toLowerCase();
    if (role !== 'admin' && role !== 'manager' && role !== 'businessadmin') {
      return res.status(403).json({ success: false, message: 'Only Admins or Managers can authorize overrides.' });
    }

    // Password verification
    const isMatch = await bcrypt.compare(supervisorPassword, supervisor.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password credentials.' });
    }

    // Update approval state
    const approval = await DiscountApproval.findOneAndUpdate(
      { _id: approvalId, tenantId },
      { status: 'Approved', approvedBy: supervisor.name || supervisor.username },
      { new: true }
    );

    if (!approval) {
      return res.status(404).json({ success: false, message: 'Discount approval request not found.' });
    }

    res.json({ success: true, data: approval });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

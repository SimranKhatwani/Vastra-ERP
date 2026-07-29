const Customer = require('../models/customerModel');
const LoyaltySettings = require('../models/loyaltySettingsModel');
const { emitToTenant } = require('../socket/socketServer');

exports.createCustomer = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    // Check if customer with same phone exists for this tenant
    const existingCustomer = await Customer.findOne({ tenantId, phone: req.body.phone });
    if (existingCustomer) {
      return res.status(400).json({ success: false, message: 'A customer with this phone number already exists' });
    }

    const customer = await Customer.create({
      ...req.body,
      tenantId
    });

    emitToTenant(tenantId, 'activity.feed', {
      id: `cust-${customer._id}`,
      type: 'customer',
      action: 'CUSTOMER_ADDED',
      icon: '👥',
      color: 'indigo',
      title: `New customer "${customer.name}" registered`,
      detail: `Phone: ${customer.phone || '-'} · ${customer.tier || 'Bronze'} tier`,
      user: req.user?.name || 'Staff',
      timestamp: new Date().toISOString(),
      meta: { name: customer.name, phone: customer.phone, tier: customer.tier },
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { search } = req.query;
    let query = { tenantId };
    
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { phone: { $regex: safeSearch, $options: 'i' } }
      ];
    }
    
    const customers = await Customer.find(query).sort('-createdAt');
      
    res.status(200).json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let customer = await Customer.findOne({ _id: req.params.id, tenantId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Explicitly recalculate tier if totalSpent is manually updated
    if (req.body.totalSpent) {
      if (req.body.totalSpent > 50000) req.body.tier = 'Platinum';
      else if (req.body.totalSpent > 25000) req.body.tier = 'Gold';
      else if (req.body.totalSpent > 10000) req.body.tier = 'Silver';
      else req.body.tier = 'Bronze';
    }

    customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const customer = await Customer.findOne({ _id: req.params.id, tenantId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await customer.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.settleBalance = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { amount } = req.body;
    
    let customer = await Customer.findOne({ _id: req.params.id, tenantId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.outstandingBalance = Math.max(0, customer.outstandingBalance - amount);
    await customer.save();

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get loyalty settings
// @route   GET /api/customers/loyalty-settings
// @access  Private
exports.getLoyaltySettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let settings = await LoyaltySettings.findOne({ tenantId });

    if (!settings) {
      settings = await LoyaltySettings.create({ tenantId });
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update loyalty settings
// @route   PUT /api/customers/loyalty-settings
// @access  Private
exports.updateLoyaltySettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { enabled, rupeesPerPoint } = req.body;

    let settings = await LoyaltySettings.findOne({ tenantId });

    if (!settings) {
      settings = await LoyaltySettings.create({
        tenantId,
        enabled,
        rupeesPerPoint
      });
    } else {
      settings.enabled = enabled !== undefined ? enabled : settings.enabled;
      settings.rupeesPerPoint = rupeesPerPoint || settings.rupeesPerPoint;
      await settings.save();
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

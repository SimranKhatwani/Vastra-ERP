const Vendor = require('../models/vendorModel');
const { emitToTenant, emitToRole } = require('../socket/socketServer');

exports.createSupplier = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const existingSupplier = await Vendor.findOne({ tenantId, phone: req.body.phone });
    if (existingSupplier) {
      return res.status(400).json({ success: false, message: 'A vendor/supplier with this phone number already exists' });
    }

    const vendor = await Vendor.create({
      ...req.body,
      currentOutstanding: req.body.outstandingBalance || 0,
      tenantId
    });

    const data = {
      ...vendor.toObject(),
      outstandingBalance: vendor.currentOutstanding,
      id: vendor._id
    };

    emitToTenant(tenantId, 'supplier.updated', {
      supplier: data,
      tenantId,
      event: 'supplier.updated'
    });

    res.status(201).json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendors = await Vendor.find({ tenantId }).sort('-createdAt');
    const mapped = vendors.map(v => ({
      ...v.toObject(),
      outstandingBalance: v.currentOutstanding || 0,
      id: v._id
    }));
      
    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let vendor = await Vendor.findOne({ _id: req.params.id, tenantId });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (req.body.outstandingBalance !== undefined) {
      req.body.currentOutstanding = req.body.outstandingBalance;
    }

    vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    const data = {
      ...vendor.toObject(),
      outstandingBalance: vendor.currentOutstanding,
      id: vendor._id
    };

    emitToTenant(tenantId, 'supplier.updated', {
      supplier: data,
      tenantId,
      event: 'supplier.updated'
    });

    res.status(200).json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendor = await Vendor.findOne({ _id: req.params.id, tenantId });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    await vendor.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.settleBalance = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { amount } = req.body;
    
    let vendor = await Vendor.findOne({ _id: req.params.id, tenantId });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    vendor.currentOutstanding = Math.max(0, vendor.currentOutstanding - amount);
    await vendor.save();

    // Create a corresponding VendorPayment for this settlement
    const VendorPayment = require('../models/vendorPaymentModel');
    await VendorPayment.create({
      tenantId,
      vendorId: vendor._id,
      amount,
      paymentMode: 'Cash',
      remarks: 'Direct supplier balance settlement payout',
      paidBy: req.user ? req.user.name : 'System Admin'
    });

    const data = {
      ...vendor.toObject(),
      outstandingBalance: vendor.currentOutstanding,
      id: vendor._id
    };

    emitToTenant(tenantId, 'supplier.updated', {
      supplier: data,
      tenantId,
      event: 'supplier.updated'
    });

    res.status(200).json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

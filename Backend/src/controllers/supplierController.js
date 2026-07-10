const Supplier = require('../models/supplierModel');

exports.createSupplier = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const existingSupplier = await Supplier.findOne({ tenantId, phone: req.body.phone });
    if (existingSupplier) {
      return res.status(400).json({ success: false, message: 'A supplier with this phone number already exists' });
    }

    const supplier = await Supplier.create({
      ...req.body,
      tenantId
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const suppliers = await Supplier.find({ tenantId }).sort('-createdAt');
      
    res.status(200).json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let supplier = await Supplier.findOne({ _id: req.params.id, tenantId });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const supplier = await Supplier.findOne({ _id: req.params.id, tenantId });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    await supplier.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.settleBalance = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { amount } = req.body;
    
    let supplier = await Supplier.findOne({ _id: req.params.id, tenantId });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    supplier.outstandingBalance = Math.max(0, supplier.outstandingBalance - amount);
    await supplier.save();

    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

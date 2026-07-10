const Brand = require('../models/brandModel');

exports.createBrand = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const tenantId = req.user.tenantId;

    const existingBrand = await Brand.findOne({ tenantId, name });
    if (existingBrand) {
      return res.status(400).json({ success: false, message: 'Brand name already exists' });
    }

    const brand = await Brand.create({
      tenantId,
      name,
      description,
      isActive,
    });

    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBrands = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const brands = await Brand.find({ tenantId });
    res.status(200).json({ success: true, count: brands.length, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let brand = await Brand.findOne({ _id: req.params.id, tenantId });

    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const brand = await Brand.findOne({ _id: req.params.id, tenantId });

    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    await brand.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

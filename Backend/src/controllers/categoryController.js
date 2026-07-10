const Category = require('../models/categoryModel');

exports.createCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const tenantId = req.user.tenantId;

    const existingCategory = await Category.findOne({ tenantId, name });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Category name already exists' });
    }

    const category = await Category.create({
      tenantId,
      name,
      description,
      isActive,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const categories = await Category.find({ tenantId });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let category = await Category.findOne({ _id: req.params.id, tenantId });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const category = await Category.findOne({ _id: req.params.id, tenantId });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await category.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

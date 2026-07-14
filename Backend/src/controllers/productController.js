const Product = require('../models/productModel');
const { emitToTenant, emitToRole } = require('../socket/socketServer');

exports.createProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const existingProduct = await Product.findOne({ tenantId, name: req.body.name });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: 'Product name already exists' });
    }

    const product = await Product.create({
      ...req.body,
      tenantId
    });

    emitToTenant(tenantId, 'inventory.updated', {
      product,
      tenantId,
      event: 'inventory.updated'
    });
    emitToRole('manager', 'inventory.low', { product, tenantId, event: 'inventory.low' });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate SKU detected. Product variations must have unique SKUs.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const products = await Product.find({ tenantId });
      
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let product = await Product.findOne({ _id: req.params.id, tenantId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    emitToTenant(tenantId, 'inventory.updated', {
      product,
      tenantId,
      event: 'inventory.updated'
    });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate SKU detected. Product variations must have unique SKUs.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const product = await Product.findOne({ _id: req.params.id, tenantId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { amount } = req.body;
    
    let product = await Product.findOne({ _id: req.params.id, tenantId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.stock = Math.max(0, product.stock + amount);
    
    // Update status based on stock level
    if (product.stock === 0) {
      product.status = 'Out of Stock';
    } else if (product.stock <= product.minStockAlert) {
      product.status = 'Low Stock';
    } else {
      product.status = 'In Stock';
    }
    
    await product.save();

    emitToTenant(tenantId, 'inventory.updated', {
      product,
      tenantId,
      event: 'inventory.updated'
    });
    if (product.stock <= product.minStockAlert) {
      emitToTenant(tenantId, 'inventory.low', { product, tenantId, event: 'inventory.low' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

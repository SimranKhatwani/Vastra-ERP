const Product = require('../models/productModel');
const { emitToTenant, emitToRole } = require('../socket/socketServer');
const { calculateStockStatus } = require('../services/stockCalculationService');

exports.createProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const existingProduct = await Product.findOne({ tenantId, name: req.body.name });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: 'Product name already exists' });
    }

    const product = new Product({
      ...req.body,
      tenantId
    });
    calculateStockStatus(product);
    await product.save();

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

    Object.assign(product, req.body);
    calculateStockStatus(product);
    await product.save();

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
    const { amount, activity = 'ADJUSTMENT', referenceType = 'Stock Adjustment', referenceNumber, remarks } = req.body;
    
    let product = await Product.findOne({ _id: req.params.id, tenantId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.openingStock = Math.max(0, (product.openingStock || 0) + amount);
    calculateStockStatus(product);
    
    await product.save();

    // Log ADJUSTMENT movement
    try {
      const inventoryMovementService = require('../services/inventoryMovementService');
      await inventoryMovementService.createMovement(tenantId, {
        product,
        movementType: amount >= 0 ? 'INBOUND' : 'OUTBOUND',
        activity,
        quantity: Math.abs(amount),
        referenceType,
        referenceId: product._id.toString(),
        referenceNumber: referenceNumber || `ADJ-${Date.now().toString().slice(-6)}`,
        performedBy: req.user ? req.user.name : 'System Admin',
        remarks: remarks || 'Manual stock adjustment log entry'
      });
    } catch (moveErr) {
      console.error('Movement logging failed for adjustStock:', moveErr.message);
    }

    emitToTenant(tenantId, 'inventory.updated', {
      product,
      tenantId,
      event: 'inventory.updated'
    });
    if (product.status === 'Low Stock') {
      emitToTenant(tenantId, 'inventory.low', { product, tenantId, event: 'inventory.low' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.scanProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { barcode } = req.params;
    const product = await Product.findOne({ tenantId, $or: [{ sku: barcode }, { barcode: barcode }] });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

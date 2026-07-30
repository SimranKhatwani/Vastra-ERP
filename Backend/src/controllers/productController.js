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
    emitToTenant(tenantId, 'activity.feed', {
      id: product._id.toString(),
      type: 'product',
      action: 'PRODUCT_ADDED',
      icon: '📦',
      color: 'blue',
      title: `Product "${product.name}" added to catalog`,
      detail: `SKU: ${product.sku || '-'} · Stock: ${product.openingStock || 0} · ₹${(product.sellingPrice || 0).toLocaleString('en-IN')}`,
      user: req.user?.name || 'Admin',
      timestamp: new Date().toISOString(),
      meta: { sku: product.sku, stock: product.openingStock, price: product.sellingPrice },
    });

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
    emitToTenant(tenantId, 'activity.feed', {
      id: `adj-${product._id}-${Date.now()}`,
      type: 'stock',
      action: 'STOCK_ADJUSTED',
      icon: amount >= 0 ? '📥' : '📤',
      color: amount >= 0 ? 'teal' : 'orange',
      title: `Stock ${amount >= 0 ? 'added to' : 'removed from'} "${product.name}"`,
      detail: `Qty: ${amount > 0 ? '+' : ''}${amount} · New stock: ${product.openingStock || 0} · ${activity || 'Adjustment'}`,
      user: req.user?.name || 'Admin',
      timestamp: new Date().toISOString(),
      meta: { product: product.name, amount, newStock: product.openingStock },
    });

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

// Tax Configuration Endpoints
const TaxConfig = require('../models/taxConfigModel');

exports.getTaxConfig = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let config = await TaxConfig.findOne({ tenantId });
    if (!config) {
      config = await TaxConfig.create({ tenantId, cgstRate: 5, sgstRate: 5 });
    }
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTaxConfig = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { cgstRate, sgstRate } = req.body;
    let config = await TaxConfig.findOne({ tenantId });
    if (!config) {
      config = new TaxConfig({ tenantId, cgstRate, sgstRate });
    } else {
      config.cgstRate = cgstRate;
      config.sgstRate = sgstRate;
    }
    await config.save();
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.searchBilling = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { q, name } = req.query;

    if (!q && !name) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    let products = [];

    if (name) {
      // Fuzzy search on name
      products = await Product.find({
        tenantId,
        name: { $regex: name, $options: 'i' }
      }).limit(100);
    } else if (q) {
      // Attempt exact barcode match first
      products = await Product.find({ tenantId, barcode: q });

      // If no exact barcode match, search across sku (Design No) and productCode (Item Code)
      if (products.length === 0) {
        products = await Product.find({
          tenantId,
          $or: [
            { sku: q },
            { productCode: q }
          ]
        });
      }
    }

    // Format the response with the additional fields needed for the Information Panel
    const formattedProducts = products.map(p => ({
      _id: p._id,
      id: p._id,
      barcode: p.barcode,
      name: p.name,
      subItem: p.subItem || p.category || '',
      designNo: p.sku || '',
      itemCode: p.productCode || '',
      ipn: p.ipn || p.rackLocation || '',
      uniqueCode: p.uniqueCode || '',
      hsn: p.hsn || '',
      company: p.company || p.brand || '',
      remarks: p.remarks || '',
      color: p.color || '',
      size: p.size || '',
      mrp: p.mrp || p.sellingPrice || 0,
      sellingRate: p.sellingPrice || 0,
      availableStock: p.stock || 0,
      soldQuantity: p.soldQuantity || 0,
      basePrice: p.basePrice || 0, // Used for Purchase Tab
      purchasePrice: p.purchasePrice || 0 // Confidential
    }));

    res.status(200).json({ success: true, count: formattedProducts.length, data: formattedProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

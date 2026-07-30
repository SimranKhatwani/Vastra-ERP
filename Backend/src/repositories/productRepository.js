const Product = require('../models/productModel');
const { calculateStockStatus } = require('../services/stockCalculationService');

exports.upsertProduct = async (tenantId, productData) => {
  // Try to find the product by SKU or Barcode first
  let product = null;
  
  if (productData.barcode) {
    product = await Product.findOne({ tenantId, barcode: productData.barcode });
  }
  
  if (!product && productData.sku) {
    product = await Product.findOne({ tenantId, sku: productData.sku });
  }

  // Fallback: match by name so re-importing the same PT file updates instead of failing
  if (!product && productData.name) {
    product = await Product.findOne({
      tenantId,
      name: { $regex: new RegExp(`^${productData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
  }

  if (product) {
    // Update existing product's stock and details
    product.purchasedQuantity = (product.purchasedQuantity || 0) + (productData.stock || 0);
    if (productData.purchasePrice) product.purchasePrice = productData.purchasePrice;
    if (productData.sellingPrice) product.sellingPrice = productData.sellingPrice;
    if (productData.mrp) product.mrp = productData.mrp;
    if (productData.barcode && !product.barcode) product.barcode = productData.barcode;
    if (productData.sku && !product.sku) product.sku = productData.sku;
    
    // Check if new properties from Manual Entry exist and update them
    if (productData.fabricCode) product.fabricCode = productData.fabricCode;
    if (productData.gsm) product.gsm = productData.gsm;
    if (productData.width) product.width = productData.width;
    if (productData.uom) product.uom = productData.uom;
    
    calculateStockStatus(product);
    await product.save();
    return product;
  } else {
    // Create new product
    productData.purchasedQuantity = productData.stock || 0;
    delete productData.stock;
    const newProduct = new Product({
      tenantId,
      ...productData
    });
    calculateStockStatus(newProduct);
    await newProduct.save();
    return newProduct;
  }
};


exports.addStock = async (tenantId, productId, quantity) => {
  const product = await Product.findOne({ _id: productId, tenantId });
  if (product) {
    product.purchasedQuantity = (product.purchasedQuantity || 0) + quantity;
    calculateStockStatus(product);
    await product.save();
  }
  return product;
};

const Product = require('../models/productModel');

exports.upsertProduct = async (tenantId, productData) => {
  // Try to find the product by SKU or Barcode first
  let product = null;
  
  if (productData.barcode) {
    product = await Product.findOne({ tenantId, barcode: productData.barcode });
  } else if (productData.sku) {
    product = await Product.findOne({ tenantId, sku: productData.sku });
  }

  if (product) {
    // Update existing product's stock and details
    product.stock += (productData.stock || 0);
    if (productData.purchasePrice) product.purchasePrice = productData.purchasePrice;
    
    // Check if new properties from Manual Entry exist and update them
    if (productData.fabricCode) product.fabricCode = productData.fabricCode;
    if (productData.gsm) product.gsm = productData.gsm;
    if (productData.width) product.width = productData.width;
    if (productData.uom) product.uom = productData.uom;
    
    await product.save();
    return product;
  } else {
    // Create new product
    return await Product.create({
      tenantId,
      ...productData
    });
  }
};

exports.addStock = async (tenantId, productId, quantity) => {
  const product = await Product.findOne({ _id: productId, tenantId });
  if (product) {
    product.stock += quantity;
    await product.save();
  }
  return product;
};

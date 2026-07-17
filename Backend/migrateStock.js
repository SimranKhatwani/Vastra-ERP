const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Product = require('./src/models/productModel');
const { calculateStockStatus } = require('./src/services/stockCalculationService');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB. Migrating stock data...");
    const products = await Product.find({});
    
    for (let product of products) {
      // If the product has stock but no opening or purchased qty, assume it is opening stock
      if (!product.openingStock && !product.purchasedQuantity && product.stock > 0) {
        product.openingStock = product.stock;
      }
      
      calculateStockStatus(product);
      await product.save();
    }
    
    console.log(`Successfully migrated ${products.length} products to dynamic low stock system.`);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error("Migration failed", err);
    mongoose.connection.close();
  });

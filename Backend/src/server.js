require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initializeSocket } = require('./socket/socketServer');

// Connect to database first, then start server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);
  initializeSocket(server);
  
  server.listen(PORT, async () => {
    console.log(`backend running on localhost link: http://localhost:${PORT}`);
    
    // Auto-seed 50 products if none exist
    try {
      const Product = require('./models/productModel');
      const User = require('./models/userModel');
      
      const count = await Product.countDocuments();
      if (count < 50) {
        console.log("Seeding 50 demo products...");
        const user = await User.findOne();
        if (user && user.tenantId) {
          const tenantId = user.tenantId;
          const categories = ['Shirts', 'T-Shirts', 'Trousers', 'Jeans', 'Jackets', 'Suits', 'Ethnic Wear'];
          const colors = ['Red', 'Blue', 'Black', 'White', 'Grey', 'Navy', 'Olive', 'Maroon'];
          const sizes = ['S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', '38'];
          const brands = ['Raymond', 'Peter England', 'Levis', 'Allen Solly', 'Van Heusen', 'Arrow'];
          
          let products = [];
          for(let i = 1; i <= 50; i++) {
              const cat = categories[Math.floor(Math.random() * categories.length)];
              const color = colors[Math.floor(Math.random() * colors.length)];
              const size = sizes[Math.floor(Math.random() * sizes.length)];
              const brand = brands[Math.floor(Math.random() * brands.length)];
              
              products.push({
                  tenantId,
                  name: `Premium ${brand} ${color} ${cat}`,
                  sku: `SKU-${10000 + i}`,
                  barcode: `BCODE${1000000 + i}`,
                  category: cat,
                  brand: brand,
                  color: color,
                  size: size,
                  purchasePrice: Math.floor(Math.random() * 1000) + 500,
                  sellingPrice: Math.floor(Math.random() * 1500) + 1500,
                  mrp: Math.floor(Math.random() * 2000) + 2000,
                  stock: Math.floor(Math.random() * 50) + 10,
                  gstPercent: 12,
                  status: 'In Stock',
                  variants: [{
                    sku: `SKU-${10000 + i}-V1`,
                    color: color,
                    size: size,
                    stockQuantity: Math.floor(Math.random() * 50) + 10
                  }]
              });
          }
          await Product.insertMany(products);
          console.log("Successfully seeded 50 products!");
        }
      }
    } catch (err) {
      console.error("Auto-seed error:", err);
    }
  });
});

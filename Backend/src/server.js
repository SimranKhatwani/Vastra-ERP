require(
  'dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initializeSocket } = require('./socket/socketServer');
const { initializeNotificationCron } = require('./services/notificationCronService');

// Connect to database first, then start server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);
  initializeSocket(server);

  server.listen(PORT, async () => {
    console.log(`backend running on localhost link: http://localhost:${PORT}`);
    
    // Initialize Smart Business Notification Cron Job
    initializeNotificationCron();

    // Enterprise Startup Database Integrity Check & Auto-Repair
    try {
      const DbIntegrityChecker = require('./services/dbIntegrityChecker');
      await DbIntegrityChecker.runCheckAndRepair();
    } catch (integrityErr) {
      console.warn('Startup DbIntegrityChecker note:', integrityErr.message);
    }

    // Auto-seed 50 products if none exist
    try {
      const Product = require('./models/productModel');
      const User = require('./models/userModel');

      const count = await Product.countDocuments();
      if (count < 50) {
        const user = await User.findOne();
        if (user && user.tenantId) {
          const tenantId = user.tenantId;
          const categories = ['Shirts', 'T-Shirts', 'Trousers', 'Jeans', 'Jackets', 'Suits', 'Ethnic Wear'];
          const colors = ['Red', 'Blue', 'Black', 'White', 'Grey', 'Navy', 'Olive', 'Maroon'];
          const sizes = ['S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', '38'];
          const brands = ['Raymond', 'Peter England', 'Levis', 'Allen Solly', 'Van Heusen', 'Arrow'];

          let products = [];
          for (let i = 1; i <= 50; i++) {
            const cat = categories[Math.floor(Math.random() * categories.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = sizes[Math.floor(Math.random() * sizes.length)];
            const brand = brands[Math.floor(Math.random() * brands.length)];

            products.push({
              tenantId,
              name: `Premium ${brand} ${color} ${cat} ${i}`,
              sku: `SKU-${20000 + i}`,
              barcode: `BCODE${2000000 + i}`,
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
                sku: `SKU-${20000 + i}-V1`,
                color: color,
                size: size,
                stockQuantity: Math.floor(Math.random() * 50) + 10
              }]
            });
          }
          try {
            await Product.insertMany(products, { ordered: false });
          } catch (seedErr) {
            // Ignore duplicate key errors during optional background auto-seeding
          }
        }
      }
    } catch (err) {
      // Quietly ignore initialization warnings
    }
  });

  // Graceful shutdown handlers to prevent EADDRINUSE on Windows with nodemon
  const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down server gracefully...`);
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });

    // Force shutdown if it takes too long
    setTimeout(() => {
      console.error("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 5000);
  };

  process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart signal
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));     // Ctrl+C
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));   // Kill command
});
 

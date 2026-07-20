try {
  console.log("Checking productModel require...");
  const Product = require('../Backend/src/models/productModel');
  console.log("productModel parsed successfully.");

  console.log("Checking db connect script require...");
  const connectDB = require('../Backend/src/config/db');
  console.log("db connect script parsed successfully.");

  console.log("All backend code modifications are syntax-ok!");
} catch (err) {
  console.error("Syntax or Path Error during backend check:", err);
  process.exit(1);
}

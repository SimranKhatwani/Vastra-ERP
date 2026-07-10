require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Connect to database first, then start server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  
  app.listen(PORT, () => {
    console.log(`Backend running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`);
  });
});

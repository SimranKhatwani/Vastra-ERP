const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Route imports
const authRoutes = require('./routes/authRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
<<<<<<< HEAD
const staffRoutes = require('./routes/staffRoutes');
=======
const categoryRoutes = require('./routes/categoryRoutes');
const brandRoutes = require('./routes/brandRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
>>>>>>> 8e98001 (feat: add full CRUD for expenses, products and related logic)

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('VastraERP API is running...');
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superAdminRoutes);
<<<<<<< HEAD
app.use('/api/staff', staffRoutes);
=======
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/tickets', supportTicketRoutes);
app.use('/api/notifications', notificationRoutes);
>>>>>>> 8e98001 (feat: add full CRUD for expenses, products and related logic)

// Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

module.exports = app;

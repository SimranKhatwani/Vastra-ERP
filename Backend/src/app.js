const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow true origin for credentials
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

const authRoutes = require('./routes/authRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const staffRoutes = require('./routes/staffRoutes');
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
const commissionRoutes = require('./routes/commissionRoutes');
const whatsappConfigRoutes = require('./routes/whatsappConfigRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const inventoryMovementRoutes = require('./routes/inventoryMovementRoutes');
const batchRoutes = require('./routes/batchRoutes');
const locationTransferRoutes = require('./routes/locationTransferRoutes');
const stockManagementRoutes = require('./routes/stockManagementRoutes');
const billingSalesRoutes = require('./routes/billingSalesRoutes');
const discountRoutes = require('./routes/discountRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const financialRoutes = require('./routes/financialRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const alterationRoutes = require('./routes/alterationRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const staffActivityRoutes = require('./routes/staffActivityRoutes');
const activityFeedRoutes = require('./routes/activityFeedRoutes');

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('VastraERP API is running...');
});

const vendorCommunicationRoutes = require('./routes/vendorCommunicationRoutes');

// Mount Routes
app.use('/api/vendor-communication', vendorCommunicationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/staff', staffRoutes);
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
app.use('/api/commissions', commissionRoutes);
app.use('/api/whatsapp-config', whatsappConfigRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/inventory-movements', inventoryMovementRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/location-transfers', locationTransferRoutes);
app.use('/api/stock-management', stockManagementRoutes);
app.use('/api/billing-sales', billingSalesRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alterations', alterationRoutes);
app.use('/api/alteration', alterationRoutes);
app.use('/api/alteration-reports', (req, res, next) => {
  req.url = '/reports' + (req.url === '/' ? '' : req.url);
  alterationRoutes(req, res, next);
});
app.use('/api/employee-alteration-performance', (req, res, next) => {
  req.url = '/employee-performance' + (req.url === '/' ? '' : req.url);
  alterationRoutes(req, res, next);
});
app.use('/api/permissions', permissionRoutes);
app.use('/api/staff-activity', staffActivityRoutes);
app.use('/api/activity-feed', activityFeedRoutes);

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

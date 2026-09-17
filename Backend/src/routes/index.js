const express = require('express');
const authRoutes = require('./auth.routes');
const superAdminRoutes = require('./superAdmin.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const masterRoutes = require('./master.routes');
const productRoutes = require('./product.routes');
const ptImportRoutes = require('./ptImport.routes');
const inventoryRoutes = require('./inventory.routes');
const purchaseRoutes = require('./purchase.routes');
const billingRoutes = require('./billing.routes');
const customerRoutes = require('./customer.routes');
const ledgerRoutes = require('./ledger.routes');
const alterationRoutes = require('./alteration.routes');
const pssmRoutes = require('./pssm.routes');
const returnRoutes = require('./return.routes');
const exchangeRoutes = require('./exchange.routes');
const goodsReturnRoutes = require('./goodsReturn.routes');
const loyaltyRoutes = require('./loyalty.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportRoutes = require('./report.routes');
const auditRoutes = require('./audit.routes');
const barcodeRoutes = require('./barcode.routes');
const inventoryLifecycleRoutes = require('./inventoryLifecycle.routes');


const permissionRoutes = require('./permission.routes');
const commissionRoutes = require('./commission.routes');
const tailoringJobRoutes = require('./tailoringJob.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/superadmin', superAdminRoutes);
router.use('/users', userRoutes);
router.use('/employees', userRoutes); // Alias for frontend compatibility
router.use('/staff', userRoutes); // Alias for frontend POS view compatibility
router.use('/discounts', (req, res) => res.status(200).json({ success: true, data: [] })); // Mock discount rules
router.use('/commissions', commissionRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/masters', masterRoutes);
router.use('/products', productRoutes);
router.use('/pt-import', ptImportRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/purchase', purchaseRoutes);
router.use('/purchase-orders', purchaseRoutes);
router.use('/billing', billingRoutes);
router.use('/invoices', billingRoutes);
router.use('/customers', customerRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/financial', require('./financial.routes'));
router.use('/expenses', require('./expense.routes'));
router.use('/alterations', alterationRoutes);
router.use('/pssm', pssmRoutes);
router.use('/tailoring-jobs', tailoringJobRoutes);
router.use('/returns', returnRoutes);
router.use('/categories', require('./category.routes'));
router.use('/brands', require('./brand.routes'));
router.use('/vendors', require('./vendor.routes'));
router.use('/suppliers', require('./vendor.routes')); // Alias for frontend compatibility
router.use('/firms', require('./firm.routes'));
router.use('/warehouses', require('./warehouse.routes'));
router.use('/exchanges', exchangeRoutes);
router.use('/goods-return', goodsReturnRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/barcode', barcodeRoutes);
router.use('/inventory-lifecycle', inventoryLifecycleRoutes);
router.use('/inventory-movements', require('./inventoryMovement.routes'));
router.use('/batches', require('./batch.routes'));
router.use('/location-transfers', require('./locationTransfer.routes'));
router.use('/reports', reportRoutes);
router.use('/audit', auditRoutes);
router.use('/staff-activity', require('./staffActivity.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/summary-dashboard', require('./summaryDashboard.routes'));

// Mock routes to prevent 404 spam from Dashboard UI polling
router.use('/attendance/dashboard-stats', (req, res) => res.status(200).json({ success: true, data: {} }));
const AlterationController = require('../controllers/alteration.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
router.use('/alteration-reports', authenticate, tenantContext, AlterationController.getDashboard);
router.use('/employee-alteration-performance', authenticate, tenantContext, AlterationController.getDashboard);

module.exports = router;

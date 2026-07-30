const cron = require('node-cron');
const Product = require('../models/productModel');
const PurchaseOrder = require('../models/purchaseOrderModel');
const Notification = require('../models/notificationModel');
const Tenant = require('../models/tenantModel');
const { emitToTenant } = require('../socket/socketServer');

// Generates a smart notification for a tenant and emits it instantly
const generateSmartNotification = async (tenantId, title, message, priority, type = 'info') => {
  // Check if a similar unread notification already exists today to prevent spam
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const existing = await Notification.findOne({
    tenantId,
    title,
    read: false,
    date: { $gte: startOfDay }
  });

  if (!existing) {
    const notification = await Notification.create({
      tenantId,
      title,
      message,
      priority,
      type
    });

    emitToTenant(tenantId, 'notification.created', {
      notification,
      tenantId,
      event: 'notification.created'
    });
  }
};

const runSmartNotificationScan = async () => {
  try {
    const tenants = await Tenant.find({});
    
    for (const tenant of tenants) {
      const tenantId = tenant._id;

      // 1. Check Low Stock Alerts
      const lowStockProducts = await Product.find({ 
        tenantId, 
        stock: { $lte: 5 }, // Threshold for low stock
        status: { $in: ['In Stock', 'Low Stock'] } 
      });

      if (lowStockProducts.length > 0) {
        if (lowStockProducts.length === 1) {
          await generateSmartNotification(
            tenantId, 
            'Low Stock Alert', 
            `Product "${lowStockProducts[0].name}" is running low on stock (${lowStockProducts[0].stock} remaining).`, 
            'High', 
            'warning'
          );
        } else {
          await generateSmartNotification(
            tenantId, 
            'Multiple Low Stock Alerts', 
            `You have ${lowStockProducts.length} products running low on stock. Please review your inventory.`, 
            'High', 
            'warning'
          );
        }
      }

      // 2. Check Pending Purchase Orders
      const pendingPOs = await PurchaseOrder.find({
        tenantId,
        status: 'Pending'
      });

      if (pendingPOs.length > 0) {
        await generateSmartNotification(
          tenantId,
          'Pending Approvals',
          `You have ${pendingPOs.length} Purchase Order(s) waiting for approval.`,
          'High',
          'info'
        );
      }

      // Add more rules here based on the business requirements (Deliveries, Overdue Invoices, etc.)
    }
  } catch (error) {
    console.error('Error running smart notification scan:', error.message);
  }
};

const initializeNotificationCron = () => {
  // Run every hour on the hour
  cron.schedule('0 * * * *', () => {
    console.log('Running Smart Business Notifications Scan...');
    runSmartNotificationScan();
  });

  // For testing purposes during startup (optional):
  // setTimeout(runSmartNotificationScan, 10000); 
};

module.exports = {
  initializeNotificationCron,
  runSmartNotificationScan
};

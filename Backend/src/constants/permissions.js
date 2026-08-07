/**
 * Vastra ERP Permissions List
 * Format: module.action
 */

const PERMISSIONS = {
  // Tenant Management (SuperAdmin)
  TENANT_CREATE: 'tenant.create',
  TENANT_READ: 'tenant.read',
  TENANT_UPDATE: 'tenant.update',
  TENANT_DELETE: 'tenant.delete',
  TENANT_SUSPEND: 'tenant.suspend',

  // Users & Roles
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',

  ROLE_CREATE: 'role.create',
  ROLE_READ: 'role.read',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',

  // Master Data
  // No changes
  MASTER_CREATE: 'master.create',
  MASTER_READ: 'master.read',
  MASTER_UPDATE: 'master.update',
  MASTER_DELETE: 'master.delete',

  // Product Catalog
  PRODUCT_CREATE: 'product.create',
  PRODUCT_READ: 'product.read',
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',
  // Vendor CRUD
  VENDOR_CREATE: 'vendor.create',
  VENDOR_READ: 'vendor.read',
  VENDOR_UPDATE: 'vendor.update',
  VENDOR_DELETE: 'vendor.delete',
  // Brand CRUD
  BRAND_CREATE: 'brand.create',
  BRAND_READ: 'brand.read',
  BRAND_UPDATE: 'brand.update',
  BRAND_DELETE: 'brand.delete',
  // Category CRUD
  CATEGORY_CREATE: 'category.create',
  CATEGORY_READ: 'category.read',
  CATEGORY_UPDATE: 'category.update',
  CATEGORY_DELETE: 'category.delete',
  // Firm CRUD
  FIRM_CREATE: 'firm.create',
  FIRM_READ: 'firm.read',
  FIRM_UPDATE: 'firm.update',
  FIRM_DELETE: 'firm.delete',
  // Warehouse CRUD
  WAREHOUSE_CREATE: 'warehouse.create',
  WAREHOUSE_READ: 'warehouse.read',
  WAREHOUSE_UPDATE: 'warehouse.update',
  WAREHOUSE_DELETE: 'warehouse.delete',

  // Inventory
  INVENTORY_READ_ALL: 'inventory.read_all',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_READ: 'inventory.read',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_TRANSFER: 'inventory.transfer',

  // Purchase
  PURCHASE_UPDATE: 'purchase.update',
  PURCHASE_DELETE: 'purchase.delete',
  PURCHASE_READ_ITEMS: 'purchase.read_items',
  PURCHASE_CREATE: 'purchase.create',
  PURCHASE_READ: 'purchase.read',
  PURCHASE_UPDATE: 'purchase.update',
  PURCHASE_APPROVE: 'purchase.approve',
  PURCHASE_CANCEL: 'purchase.cancel',

  // Billing & Sales
  BILLING_CREATE: 'billing.create',
  BILLING_READ: 'billing.read',
  BILLING_CANCEL: 'billing.cancel',
  BILLING_DISCOUNT: 'billing.discount',

  // Payments & Ledger
  PAYMENT_COLLECT: 'payment.collect',
  PAYMENT_READ: 'payment.read',
  PAYMENT_REFUND: 'payment.refund',
  LEDGER_READ: 'ledger.read',
  LEDGER_ADJUST: 'ledger.adjust',

  // Customer / CRM
  CRM_CREATE: 'crm.create',
  CRM_READ: 'crm.read',
  CRM_UPDATE: 'crm.update',
  CRM_DELETE: 'crm.delete',

  // Alterations
  ALTERATION_CREATE: 'alteration.create',
  ALTERATION_READ: 'alteration.read',
  ALTERATION_UPDATE: 'alteration.update',
  ALTERATION_COMPLETE: 'alteration.complete',

  // Returns & Exchanges
  RETURN_CREATE: 'return.create',
  RETURN_READ: 'return.read',
  RETURN_APPROVE: 'return.approve',
  EXCHANGE_CREATE: 'exchange.create',
  EXCHANGE_READ: 'exchange.read',

  // Goods Return (Vendor Return)
  GOODS_RETURN_CREATE: 'goods_return.create',
  GOODS_RETURN_READ: 'goods_return.read',
  GOODS_RETURN_APPROVE: 'goods_return.approve',

  // Dashboard & Reports
  SEARCH_READ: 'search.read',
  INVENTORY_LIFECYCLE_MANAGE: 'inventory.lifecycle.manage',
  BARCODE_READ: 'barcode.read',
  BARCODE_CREATE: 'barcode.create',
  PT_IMPORT_VALIDATE: 'pt_import.validate',
  PT_IMPORT_READ: 'pt_import.read',
  PT_IMPORT_ROLLBACK: 'pt_import.rollback',
  OWNER_DASHBOARD: 'owner.dashboard',
  REPORTS_SALES: 'reports.sales',
  REPORTS_PURCHASE: 'reports.purchase',
  REPORTS_INVENTORY: 'reports.inventory',
  REPORTS_GST: 'reports.gst',

  // Settings & System
  SETTINGS_UPDATE: 'settings.update',
  AUDIT_READ: 'audit.read'
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS
};

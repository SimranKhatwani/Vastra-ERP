const ApiError = require('../helpers/ApiError');
const asyncHandler = require('../helpers/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');
const Role = require('../models/Role');

const normalizeRoleName = (role, designation) => {
  let r = String(role || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  let d = String(designation || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  if (r === 'staff' && d) {
    r = d;
  }

  if (r.includes('admin') || r.includes('owner') || r === 'businessadmin' || r === 'tenantadmin' || r === 'tenantowner') return 'admin';
  if (r.includes('manager')) return 'manager';
  if (r.includes('accountant') || r.includes('accounts')) return 'accountant';
  if (r.includes('cashier') || r.includes('poscashier')) return 'cashier';
  if (r.includes('tailor') || r.includes('darzi') || r.includes('karigar')) return 'tailor';
  if (r.includes('worker') || r.includes('stitcher') || r.includes('fitter')) return 'worker';
  if (r.includes('salesperson') || r.includes('sales') || r.includes('salesman')) return 'salesperson';

  if (d.includes('manager')) return 'manager';
  if (d.includes('tailor') || d.includes('darzi') || d.includes('karigar')) return 'tailor';
  if (d.includes('worker') || d.includes('stitcher') || d.includes('fitter') || d.includes('floor') || d.includes('production')) return 'worker';
  if (d.includes('cashier')) return 'cashier';
  if (d.includes('accountant') || d.includes('accounts')) return 'accountant';
  if (d.includes('sales') || d.includes('salesperson') || d.includes('salesman')) return 'salesperson';
  if (d.includes('admin') || d.includes('owner')) return 'admin';

  return 'salesperson';
};

const authenticate = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.accessToken;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Authentication failed. Token not provided.');
  }

  try {
    const decoded = verifyAccessToken(token);

    if (decoded.isSuperAdmin) {
      const superAdmin = await SuperAdmin.findById(decoded.id);
      if (!superAdmin || !superAdmin.isActive) {
        throw new ApiError(401, 'Super Admin account is inactive or disabled.');
      }
      req.user = {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        isSuperAdmin: true,
        permissions: ['*'] // SuperAdmin has all permissions
      };
      return next();
    }

    let user = await User.findById(decoded.id).populate('roleId');
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase(), isDeleted: false }).populate('roleId');
    }

    if (!user || user.isDeleted || user.status !== 'ACTIVE' || user.isLocked) {
      throw new ApiError(401, 'User account is invalid, locked, or deactivated.');
    }

    if (user.forceLoggedOutAt && decoded.iat) {
      const tokenIssuedAt = decoded.iat * 1000;
      if (tokenIssuedAt < user.forceLoggedOutAt.getTime()) {
        throw new ApiError(401, 'Your session has been terminated by an administrator. Please log in again.');
      }
    }

    const role = user.roleId;
    let permissions = role ? role.permissions : [];

    // Sync with custom matrix permissions if set for the tenant
    try {
      const PermissionMatrix = require('../models/PermissionMatrix');
      const normalizedRoleName = normalizeRoleName(role?.name, user.designation);
      const matrix = await PermissionMatrix.findOne({
        tenantId: user.tenantId,
        roleName: normalizedRoleName
      }).lean();

      if (matrix) {
        // Build dynamic permissions array based on the matrix settings
        const { allowedModules = [], moduleAccessLevels = {}, tabPermissions = {} } = matrix;
        const mappedPermissions = [];

        // Define mapping of module names to fine-grained permission tags
        const moduleToPermissions = {
          dashboard: ['owner.dashboard', 'search.read', 'barcode.read', 'alteration.read', 'billing.read', 'crm.read', 'ledger.read', 'payment.read'],
          'summary-dashboard': ['summary_dashboard.read', 'owner.dashboard', 'alteration.read', 'search.read'],
          billing: ['billing.create', 'billing.read', 'billing.cancel', 'billing.discount', 'payment.collect', 'payment.read', 'payment.refund', 'alteration.create', 'alteration.read', 'alteration.update', 'alteration.complete'],
          articulation: ['alteration.create', 'alteration.read', 'alteration.update', 'alteration.complete'],
          commissions: ['ledger.read', 'ledger.adjust'],
          products: ['product.create', 'product.read', 'product.update', 'product.delete', 'brand.create', 'brand.read', 'brand.update', 'brand.delete', 'category.create', 'category.read', 'category.update', 'category.delete', 'firm.create', 'firm.read', 'firm.update', 'firm.delete', 'warehouse.create', 'warehouse.read', 'warehouse.update', 'warehouse.delete', 'vendor.create', 'vendor.read', 'vendor.update', 'vendor.delete'],
          inventory: ['inventory.read_all', 'inventory.create', 'inventory.read', 'inventory.update', 'inventory.adjust', 'inventory.transfer', 'inventory.lifecycle.manage'],
          'stock-management': ['inventory.read_all', 'inventory.read', 'inventory.adjust', 'inventory.transfer'],
          'billing-sales': ['billing.read', 'payment.read', 'ledger.read'],
          'discount-offers': ['billing.discount'],
          purchase: ['purchase.create', 'purchase.read', 'purchase.update', 'purchase.approve', 'purchase.cancel', 'purchase.read_items'],
          'vendor-communication': ['vendor.read', 'vendor.update'],
          'financial-management': ['ledger.read', 'ledger.adjust', 'billing.read', 'payment.read', 'crm.read', 'purchase.read', 'reports.sales', 'reports.gst'],
          'accounts-treasury': ['payment.read', 'ledger.read', 'billing.read', 'crm.read'],
          customers: ['crm.create', 'crm.read', 'crm.update', 'crm.delete'],
          employees: ['user.read', 'user.create', 'user.update', 'user.delete'],
          staff: ['user.read', 'user.create', 'user.update', 'user.delete'],
          accounting: ['ledger.read', 'payment.read', 'billing.read', 'crm.read', 'purchase.read', 'reports.sales', 'reports.gst'],
          reports: ['reports.sales', 'reports.purchase', 'reports.inventory', 'reports.gst', 'billing.read', 'purchase.read', 'crm.read', 'ledger.read'],
          'goods-return': ['goods_return.read', 'goods_return.create', 'goods_return.update', 'goods_return.cancel'],
          permissions: ['role.create', 'role.read', 'role.update', 'role.delete'],
          'staff-activity': ['audit.read'],
          'audit-log': ['audit.read'],
          'attendance-dashboard': ['attendance.read', 'attendance.punch'],
          'manager-review': ['attendance.approve', 'attendance.review'],
          'attendance-settings': ['attendance.policy'],
          settings: ['settings.update']
        };

        // Combine base allowed modules and explicit levels
        const activeModules = new Set(allowedModules);
        Object.keys(moduleAccessLevels).forEach(mod => {
          if (moduleAccessLevels[mod] === 'NO_ACCESS') {
            activeModules.delete(mod);
          } else if (moduleAccessLevels[mod] === 'FULL_CONTROL' || moduleAccessLevels[mod] === 'VIEW_ONLY') {
            activeModules.add(mod);
          }
        });

        // Add matching permissions
        activeModules.forEach(mod => {
          const perms = moduleToPermissions[mod] || [];
          const access = moduleAccessLevels[mod] || 'FULL_CONTROL';

          if (access === 'VIEW_ONLY') {
            // Keep only read/view permissions
            const readOnlyPerms = perms.filter(p => 
              p.endsWith('.read') || 
              p.endsWith('.read_all') || 
              p.endsWith('.read_items') || 
              p.includes('report') || 
              p === 'owner.dashboard'
            );
            mappedPermissions.push(...readOnlyPerms);
          } else {
            // Full control
            mappedPermissions.push(...perms);
          }
        });

        // Handle tab specific overrides
        Object.keys(tabPermissions).forEach(tab => {
          const tabLvl = tabPermissions[tab];
          if (tabLvl === 'FULL_CONTROL' || tabLvl === true) {
            if (tab === 'whatsapp_send') mappedPermissions.push('alteration.update');
            if (tab === 'apply_discounts') mappedPermissions.push('billing.discount');
            if (tab === 'export_csv') mappedPermissions.push('reports.sales', 'reports.purchase', 'reports.inventory', 'reports.gst');
          }
        });

        if (mappedPermissions.length > 0) {
          permissions = [...new Set(mappedPermissions)];
        }
      }
    } catch (e) {
      // Fallback
    }

    const effectiveRole = user.isTenantOwner ? 'Admin' : (user.designation || user.roleId?.name || 'Staff');

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      designation: user.designation || '',
      tenantId: user.tenantId,
      roleId: user.roleId?._id,
      roleName: user.roleId?.name,
      role: effectiveRole,
      isTenantOwner: user.isTenantOwner,
      isSuperAdmin: false,
      originalUserId: decoded.originalUserId || null,
      permissions
    };

    req.tenantId = user.tenantId;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired. Please refresh your token.');
    }
    throw new ApiError(401, err.message || 'Invalid authentication token.');
  }
});

module.exports = {
  authenticate
};

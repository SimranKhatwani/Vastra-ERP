const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const PermissionMatrix = require('../models/PermissionMatrix');

// Default configurations matching frontend baseModules
const DEFAULT_ROLE_CONFIGS = {
  superadmin: {
    allowedModules: [
      "saas", "developer", "integrations", "settings", "permissions",
      "staff-activity", "audit-log", "purchase", "vendor-communication",
      "financial-management", "accounts-treasury", "attendance-dashboard",
      "manager-review", "attendance-settings"
    ],
    moduleAccessLevels: {},
    tabPermissions: {}
  },
  admin: {
    allowedModules: [
      "dashboard", "billing", "articulation", "inventory_articulation",
      "commissions", "products", "inventory", "stock-management",
      "billing-sales", "discount-offers", "purchase", "vendor-communication",
      "financial-management", "accounts-treasury", "customers", "employees",
      "staff", "accounting", "reports", "permissions", "staff-activity",
      "audit-log", "integrations", "dev", "settings", "attendance-dashboard",
      "manager-review", "attendance-settings"
    ],
    moduleAccessLevels: {},
    tabPermissions: {}
  },
  businessadmin: {
    allowedModules: [
      "dashboard", "billing", "articulation", "inventory_articulation",
      "commissions", "products", "inventory", "stock-management",
      "billing-sales", "discount-offers", "purchase", "vendor-communication",
      "financial-management", "accounts-treasury", "customers", "employees",
      "staff", "accounting", "reports", "permissions", "staff-activity",
      "audit-log", "integrations", "dev", "settings", "attendance-dashboard",
      "manager-review", "attendance-settings"
    ],
    moduleAccessLevels: {},
    tabPermissions: {}
  },
  manager: {
    allowedModules: [
      "dashboard", "billing", "articulation", "inventory_articulation",
      "commissions", "products", "inventory", "stock-management",
      "billing-sales", "discount-offers", "purchase", "vendor-communication",
      "financial-management", "accounts-treasury", "customers", "employees",
      "reports", "permissions", "settings", "attendance-dashboard", "manager-review"
    ],
    moduleAccessLevels: {},
    tabPermissions: {}
  },
  cashier: {
    allowedModules: [
      "dashboard", "billing", "billing-sales", "discount-offers", "articulation",
      "products", "purchase", "vendor-communication", "financial-management",
      "accounts-treasury", "customers", "accounting", "attendance-dashboard"
    ],
    moduleAccessLevels: {},
    tabPermissions: {}
  },
  salesperson: {
    allowedModules: [
      "dashboard", "billing", "products", "purchase", "vendor-communication",
      "attendance-dashboard"
    ],
    moduleAccessLevels: {},
    tabPermissions: {}
  },
  tailor: {
    allowedModules: ["dashboard", "articulation", "attendance-dashboard"],
    moduleAccessLevels: {},
    tabPermissions: {}
  },
  worker: {
    allowedModules: ["dashboard", "attendance-dashboard"],
    moduleAccessLevels: {},
    tabPermissions: {}
  },
  accountant: {
    allowedModules: [
      "dashboard", "financial-management", "accounts-treasury", "accounting",
      "reports", "purchase", "vendor-communication", "attendance-dashboard"
    ],
    moduleAccessLevels: {},
    tabPermissions: {}
  }
};

class PermissionController {
  /**
   * GET /permissions
   * Returns the entire permission matrix for the tenant
   */
  static getPermissions = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      // If superadmin has no tenant context, return full default config
      return res.status(200).json(new ApiResponse(200, DEFAULT_ROLE_CONFIGS, 'Permissions matrix retrieved.'));
    }

    const matrices = await PermissionMatrix.find({ tenantId }).lean();
    const matrixMap = { ...DEFAULT_ROLE_CONFIGS };

    // Overlay custom configurations from database
    matrices.forEach((m) => {
      const rKey = m.roleName.toLowerCase();
      matrixMap[rKey] = {
        allowedModules: m.allowedModules || [],
        moduleAccessLevels: m.moduleAccessLevels || {},
        tabPermissions: m.tabPermissions || {}
      };
    });

    return res.status(200).json(new ApiResponse(200, matrixMap, 'Permissions matrix retrieved.'));
  });

  /**
   * PUT /permissions
   * Updates permissions matrix for a role
   */
  static savePermissions = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;
    const { role, allowedModules, moduleAccessLevels, tabPermissions } = req.body;

    if (!tenantId) {
      return res.status(400).json(new ApiResponse(400, null, 'Tenant context required to edit permissions.'));
    }
    if (!role) {
      return res.status(400).json(new ApiResponse(400, null, 'Role name required.'));
    }

    const normalizedRole = role.toLowerCase();

    const updated = await PermissionMatrix.findOneAndUpdate(
      { tenantId, roleName: normalizedRole },
      {
        allowedModules: allowedModules || [],
        moduleAccessLevels: moduleAccessLevels || {},
        tabPermissions: tabPermissions || {}
      },
      { new: true, upsert: true }
    );

    return res.status(200).json(new ApiResponse(200, updated, `Permissions saved for role: ${role}.`));
  });

  /**
   * POST /permissions/reset
   * Reverts permissions for a role to defaults
   */
  static resetPermissions = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;
    const { role } = req.body;

    if (!tenantId) {
      return res.status(400).json(new ApiResponse(400, null, 'Tenant context required.'));
    }
    if (!role) {
      return res.status(400).json(new ApiResponse(400, null, 'Role name required.'));
    }

    const normalizedRole = role.toLowerCase();
    await PermissionMatrix.findOneAndDelete({ tenantId, roleName: normalizedRole });

    return res.status(200).json(new ApiResponse(200, null, `Permissions reset to default for role: ${role}.`));
  });
}

module.exports = PermissionController;
module.exports.DEFAULT_ROLE_CONFIGS = DEFAULT_ROLE_CONFIGS;

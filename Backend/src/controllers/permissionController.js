const Permission = require('../models/permissionModel');

// Standard default module permissions per role
const defaultRolePermissions = {
  admin: {
    allowedModules: [
      'dashboard', 'billing', 'articulation', 'inventory', 'products',
      'stock-management', 'billing-sales', 'discount-offers', 'purchase',
      'financial-management', 'accounts-treasury', 'customers', 'employees',
      'staff', 'commissions', 'accounting', 'reports', 'permissions', 'settings',
      'attendance-dashboard', 'manager-review', 'attendance-settings', 'saas'
    ],
    moduleAccessLevels: {
      'dashboard': 'FULL_CONTROL',
      'billing': 'FULL_CONTROL',
      'articulation': 'FULL_CONTROL',
      'inventory': 'FULL_CONTROL',
      'products': 'FULL_CONTROL',
      'purchase': 'FULL_CONTROL',
      'financial-management': 'FULL_CONTROL',
      'customers': 'FULL_CONTROL',
      'employees': 'FULL_CONTROL',
      'attendance-dashboard': 'FULL_CONTROL',
      'reports': 'FULL_CONTROL',
      'permissions': 'FULL_CONTROL',
      'settings': 'FULL_CONTROL',
    },
    tabPermissions: {
      'articulation_dashboard': 'FULL_CONTROL',
      'articulation_reports': 'FULL_CONTROL',
      'articulation_tracking': 'FULL_CONTROL',
      'billing_new_bill': 'FULL_CONTROL',
      'billing_prev_next': 'FULL_CONTROL',
      'billing_modify_bill': 'FULL_CONTROL',
      'whatsapp_send': 'FULL_CONTROL',
      'export_csv': 'FULL_CONTROL',
      'apply_discounts': 'FULL_CONTROL',
    }
  },
  businessadmin: {
    allowedModules: [
      'dashboard', 'billing', 'articulation', 'inventory', 'products',
      'stock-management', 'billing-sales', 'discount-offers', 'purchase',
      'financial-management', 'accounts-treasury', 'customers', 'employees',
      'staff', 'commissions', 'accounting', 'reports', 'permissions', 'settings',
      'attendance-dashboard', 'manager-review', 'attendance-settings'
    ],
    moduleAccessLevels: {
      'dashboard': 'FULL_CONTROL',
      'billing': 'FULL_CONTROL',
      'articulation': 'FULL_CONTROL',
      'inventory': 'FULL_CONTROL',
      'products': 'FULL_CONTROL',
      'purchase': 'FULL_CONTROL',
      'financial-management': 'FULL_CONTROL',
      'customers': 'FULL_CONTROL',
      'employees': 'FULL_CONTROL',
      'attendance-dashboard': 'FULL_CONTROL',
      'reports': 'FULL_CONTROL',
      'permissions': 'FULL_CONTROL',
      'settings': 'FULL_CONTROL',
    },
    tabPermissions: {
      'articulation_dashboard': 'FULL_CONTROL',
      'articulation_reports': 'FULL_CONTROL',
      'articulation_tracking': 'FULL_CONTROL',
      'billing_new_bill': 'FULL_CONTROL',
      'billing_prev_next': 'FULL_CONTROL',
      'billing_modify_bill': 'FULL_CONTROL',
      'whatsapp_send': 'FULL_CONTROL',
      'export_csv': 'FULL_CONTROL',
      'apply_discounts': 'FULL_CONTROL',
    }
  },
  worker: {
    allowedModules: [
      'dashboard', 'billing', 'articulation', 'inventory', 'products',
      'stock-management', 'billing-sales', 'discount-offers', 'purchase',
      'customers', 'attendance-dashboard'
    ],
    moduleAccessLevels: {
      'dashboard': 'VIEW_ONLY',
      'billing': 'FULL_CONTROL',
      'articulation': 'FULL_CONTROL',
      'inventory': 'FULL_CONTROL',
      'products': 'FULL_CONTROL',
      'purchase': 'VIEW_ONLY',
      'financial-management': 'NO_ACCESS',
      'customers': 'FULL_CONTROL',
      'employees': 'NO_ACCESS',
      'attendance-dashboard': 'FULL_CONTROL',
      'reports': 'NO_ACCESS',
      'permissions': 'NO_ACCESS',
      'settings': 'NO_ACCESS',
    },
    tabPermissions: {
      'articulation_dashboard': 'FULL_CONTROL',
      'articulation_reports': 'VIEW_ONLY',
      'articulation_tracking': 'FULL_CONTROL',
      'billing_new_bill': 'FULL_CONTROL',
      'billing_prev_next': 'FULL_CONTROL',
      'billing_modify_bill': 'NO_ACCESS',
      'whatsapp_send': 'FULL_CONTROL',
      'export_csv': 'VIEW_ONLY',
      'apply_discounts': 'NO_ACCESS',
    }
  },
  cashier: {
    allowedModules: [
      'dashboard', 'billing', 'billing-sales', 'discount-offers', 'articulation',
      'products', 'purchase', 'financial-management', 'customers', 'attendance-dashboard'
    ],
    moduleAccessLevels: {
      'dashboard': 'VIEW_ONLY',
      'billing': 'FULL_CONTROL',
      'articulation': 'VIEW_ONLY',
      'inventory': 'NO_ACCESS',
      'products': 'VIEW_ONLY',
      'purchase': 'NO_ACCESS',
      'financial-management': 'NO_ACCESS',
      'customers': 'FULL_CONTROL',
      'employees': 'NO_ACCESS',
      'attendance-dashboard': 'VIEW_ONLY',
      'reports': 'NO_ACCESS',
      'permissions': 'NO_ACCESS',
      'settings': 'NO_ACCESS',
    },
    tabPermissions: {
      'articulation_dashboard': 'VIEW_ONLY',
      'articulation_reports': 'NO_ACCESS',
      'articulation_tracking': 'NO_ACCESS',
      'billing_new_bill': 'FULL_CONTROL',
      'billing_prev_next': 'FULL_CONTROL',
      'billing_modify_bill': 'NO_ACCESS',
      'whatsapp_send': 'FULL_CONTROL',
      'export_csv': 'NO_ACCESS',
      'apply_discounts': 'NO_ACCESS',
    }
  },
  salesperson: {
    allowedModules: [
      'dashboard', 'billing', 'products', 'purchase', 'attendance-dashboard'
    ],
    moduleAccessLevels: {
      'dashboard': 'VIEW_ONLY',
      'billing': 'FULL_CONTROL',
      'articulation': 'NO_ACCESS',
      'inventory': 'NO_ACCESS',
      'products': 'VIEW_ONLY',
      'purchase': 'NO_ACCESS',
      'financial-management': 'NO_ACCESS',
      'customers': 'VIEW_ONLY',
      'employees': 'NO_ACCESS',
      'attendance-dashboard': 'VIEW_ONLY',
      'reports': 'NO_ACCESS',
      'permissions': 'NO_ACCESS',
      'settings': 'NO_ACCESS',
    },
    tabPermissions: {
      'articulation_dashboard': 'VIEW_ONLY',
      'articulation_reports': 'NO_ACCESS',
      'articulation_tracking': 'NO_ACCESS',
      'billing_new_bill': 'FULL_CONTROL',
      'billing_prev_next': 'FULL_CONTROL',
      'billing_modify_bill': 'NO_ACCESS',
      'whatsapp_send': 'FULL_CONTROL',
      'export_csv': 'NO_ACCESS',
      'apply_discounts': 'NO_ACCESS',
    }
  },
  tailor: {
    allowedModules: [
      'articulation', 'attendance-dashboard'
    ],
    moduleAccessLevels: {
      'dashboard': 'NO_ACCESS',
      'billing': 'NO_ACCESS',
      'articulation': 'FULL_CONTROL',
      'inventory': 'NO_ACCESS',
      'products': 'NO_ACCESS',
      'purchase': 'NO_ACCESS',
      'financial-management': 'NO_ACCESS',
      'customers': 'NO_ACCESS',
      'employees': 'NO_ACCESS',
      'attendance-dashboard': 'VIEW_ONLY',
      'reports': 'NO_ACCESS',
      'permissions': 'NO_ACCESS',
      'settings': 'NO_ACCESS',
    },
    tabPermissions: {
      'articulation_dashboard': 'FULL_CONTROL',
      'articulation_reports': 'VIEW_ONLY',
      'articulation_tracking': 'FULL_CONTROL',
      'billing_new_bill': 'NO_ACCESS',
      'billing_prev_next': 'NO_ACCESS',
      'billing_modify_bill': 'NO_ACCESS',
      'whatsapp_send': 'FULL_CONTROL',
      'export_csv': 'NO_ACCESS',
      'apply_discounts': 'NO_ACCESS',
    }
  },
  accountant: {
    allowedModules: [
      'dashboard', 'financial-management', 'accounts-treasury', 'accounting',
      'reports', 'purchase', 'attendance-dashboard'
    ],
    moduleAccessLevels: {
      'dashboard': 'VIEW_ONLY',
      'billing': 'VIEW_ONLY',
      'articulation': 'VIEW_ONLY',
      'inventory': 'VIEW_ONLY',
      'products': 'VIEW_ONLY',
      'purchase': 'FULL_CONTROL',
      'financial-management': 'FULL_CONTROL',
      'customers': 'VIEW_ONLY',
      'employees': 'VIEW_ONLY',
      'attendance-dashboard': 'VIEW_ONLY',
      'reports': 'FULL_CONTROL',
      'permissions': 'NO_ACCESS',
      'settings': 'NO_ACCESS',
    },
    tabPermissions: {
      'articulation_dashboard': 'VIEW_ONLY',
      'articulation_reports': 'FULL_CONTROL',
      'articulation_tracking': 'VIEW_ONLY',
      'billing_new_bill': 'NO_ACCESS',
      'billing_prev_next': 'VIEW_ONLY',
      'billing_modify_bill': 'NO_ACCESS',
      'whatsapp_send': 'NO_ACCESS',
      'export_csv': 'FULL_CONTROL',
      'apply_discounts': 'NO_ACCESS',
    }
  }
};

// @desc    Get permissions matrix for tenant (all roles and employee overrides)
// @route   GET /api/permissions
// @access  Private (Admin / All)
exports.getPermissions = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const filter = tenantId ? { tenantId } : {};

    let records = await Permission.find(filter).lean();

    // Auto-seed missing standard role documents into MongoDB collection for this tenant
    const existingRoles = new Set(records.map(r => r.role ? String(r.role).toLowerCase() : ''));
    const missingRoles = Object.keys(defaultRolePermissions).filter(r => !existingRoles.has(r));

    if (missingRoles.length > 0 && tenantId) {
      for (const role of missingRoles) {
        const def = defaultRolePermissions[role];
        await Permission.findOneAndUpdate(
          { tenantId, role: role.toLowerCase(), employeeId: null },
          {
            $setOnInsert: {
              tenantId,
              role: role.toLowerCase(),
              employeeId: null,
              allowedModules: def.allowedModules || [],
              moduleAccessLevels: def.moduleAccessLevels || {},
              tabPermissions: def.tabPermissions || {},
              actionPermissions: def.actionPermissions || {},
              updatedBy: 'System Auto-Seed'
            }
          },
          { upsert: true, new: true }
        );
      }
      records = await Permission.find(filter).lean();
    }

    // Convert stored records into map by role and employeeId
    const permissionMap = {};

    records.forEach((rec) => {
      const roleStr = rec.role ? String(rec.role).toLowerCase() : 'admin';
      const key = rec.employeeId ? `emp_${rec.employeeId}` : roleStr;
      permissionMap[key] = {
        allowedModules: rec.allowedModules || [],
        moduleAccessLevels: rec.moduleAccessLevels ? (rec.moduleAccessLevels instanceof Map ? Object.fromEntries(rec.moduleAccessLevels) : rec.moduleAccessLevels) : {},
        tabPermissions: rec.tabPermissions ? (rec.tabPermissions instanceof Map ? Object.fromEntries(rec.tabPermissions) : rec.tabPermissions) : {},
        actionPermissions: rec.actionPermissions ? (rec.actionPermissions instanceof Map ? Object.fromEntries(rec.actionPermissions) : rec.actionPermissions) : {},
        updatedBy: rec.updatedBy,
        updatedAt: rec.updatedAt,
      };
    });

    // Fill missing standard roles with defaults in output map
    Object.keys(defaultRolePermissions).forEach((role) => {
      if (!permissionMap[role]) {
        permissionMap[role] = defaultRolePermissions[role];
      }
    });

    res.status(200).json({
      success: true,
      data: permissionMap,
      defaults: defaultRolePermissions,
    });
  } catch (error) {
    console.error("GET /api/permissions error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update permissions for a role or specific employee
// @route   PUT /api/permissions
// @access  Private (Admin only)
exports.updatePermissions = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { role, employeeId, allowedModules, moduleAccessLevels, tabPermissions, actionPermissions } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }

    const query = {
      tenantId,
      role: role.toLowerCase(),
      employeeId: employeeId || null,
    };

    const updateData = {
      allowedModules: allowedModules || [],
      moduleAccessLevels: moduleAccessLevels || {},
      tabPermissions: tabPermissions || {},
      actionPermissions: actionPermissions || {},
      updatedBy: req.user?.name || 'Admin',
    };

    const permission = await Permission.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `Permissions updated successfully for ${employeeId ? 'Employee Override' : role.toUpperCase()}`,
      data: permission,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset role permissions to enterprise default
// @route   POST /api/permissions/reset
// @access  Private (Admin only)
exports.resetPermissions = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { role } = req.body;

    if (role && role !== 'All') {
      await Permission.deleteMany({ tenantId, role: role.toLowerCase() });
    } else {
      await Permission.deleteMany({ tenantId });
    }

    res.status(200).json({
      success: true,
      message: `Permissions reset to enterprise default for ${role || 'All Roles'}`,
      defaults: defaultRolePermissions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

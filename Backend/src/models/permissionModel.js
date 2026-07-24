const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    role: {
      type: String,
      required: true, // e.g. 'Admin', 'Manager', 'Cashier', 'Salesperson', 'Tailor', 'Accountant'
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null, // If set, this represents an employee-specific override
    },
    allowedModules: [
      {
        type: String,
      },
    ],
    // Store access level strings ('NO_ACCESS' | 'VIEW_ONLY' | 'FULL_CONTROL') for modules
    moduleAccessLevels: {
      type: Map,
      of: String,
      default: {},
    },
    // Store access level strings ('NO_ACCESS' | 'VIEW_ONLY' | 'FULL_CONTROL') for sub-tabs/actions
    tabPermissions: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    actionPermissions: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    updatedBy: {
      type: String,
      default: 'System Admin',
    },
  },
  { timestamps: true }
);

permissionSchema.index({ tenantId: 1, role: 1, employeeId: 1 }, { unique: true });

module.exports = mongoose.model('Permission', permissionSchema);

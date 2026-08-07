const ApiError = require('../helpers/ApiError');
const Tenant = require('../models/Tenant');
const User = require('../models/User');

class SuperAdminService {
  static async createTenant(tenantData) {
    const existing = await Tenant.findOne({ code: tenantData.code.toUpperCase() });
    if (existing) throw new ApiError(400, 'Tenant with this code already exists.');

    const tenant = await Tenant.create({
      ...tenantData,
      code: tenantData.code.toUpperCase()
    });
    return tenant;
  }

  static async getAllTenants(query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { companyName: new RegExp(query.search, 'i') },
        { code: new RegExp(query.search, 'i') },
        { email: new RegExp(query.search, 'i') }
      ];
    }

    const tenants = await Tenant.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Tenant.countDocuments(filter);

    return {
      tenants,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getTenantById(tenantId) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw new ApiError(404, 'Tenant not found.');
    return tenant;
  }

  static async updateTenant(tenantId, updateData) {
    const tenant = await Tenant.findByIdAndUpdate(tenantId, updateData, { new: true });
    if (!tenant) throw new ApiError(404, 'Tenant not found.');
    return tenant;
  }

  static async suspendTenant(tenantId) {
    return this.updateTenantStatus(tenantId, 'SUSPENDED');
  }

  static async activateTenant(tenantId) {
    return this.updateTenantStatus(tenantId, 'ACTIVE');
  }

  static async updateTenantStatus(tenantId, status) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'Tenant not found.');
    }
    tenant.status = status;
    await tenant.save();

    if (status === 'SUSPENDED') {
      await User.updateMany({ tenantId }, { status: 'SUSPENDED' });
    } else if (status === 'ACTIVE') {
      await User.updateMany({ tenantId }, { status: 'ACTIVE' });
    }
    return tenant;
  }

  static async updateSubscription(tenantId, subscriptionData) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'Tenant not found.');
    }
    tenant.subscription = {
      ...tenant.subscription,
      ...subscriptionData
    };
    await tenant.save();
    return tenant;
  }

  static async deleteTenant(tenantId, userId) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'Tenant not found.');
    }
    await tenant.softDelete(userId);
    await User.updateMany({ tenantId }, { status: 'INACTIVE', isDeleted: true });
    return true;
  }

  static async getSuperAdminDashboard() {
    const totalTenants = await Tenant.countDocuments({ isDeleted: false });
    const activeTenants = await Tenant.countDocuments({ isDeleted: false, status: 'ACTIVE' });
    const suspendedTenants = await Tenant.countDocuments({ isDeleted: false, status: 'SUSPENDED' });
    const totalUsers = await User.countDocuments({ isDeleted: false });

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalUsers
    };
  }
}

module.exports = SuperAdminService;

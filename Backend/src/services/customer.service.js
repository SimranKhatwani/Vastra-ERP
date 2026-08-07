const ApiError = require('../helpers/ApiError');
const Customer = require('../models/crm/Customer');
const CustomerAddress = require('../models/crm/CustomerAddress');
const CustomerBusiness = require('../models/crm/CustomerBusiness');
const SaleBill = require('../models/billing/SaleBill');
const BaseRepository = require('../repositories/BaseRepository');
const { formatExportData } = require('../helpers/export.helper');

const customerRepo = new BaseRepository(Customer);

class CustomerService {
  static async createCustomer(customerData, tenantId) {
    const existing = await Customer.findOne({ phone: customerData.phone, tenantId, isDeleted: false });
    if (existing) {
      throw new ApiError(400, `Customer with phone '${customerData.phone}' already exists.`);
    }

    const customer = await Customer.create({
      ...customerData,
      tenantId
    });

    if (customerData.address) {
      await CustomerAddress.create({
        tenantId,
        customerId: customer._id,
        ...customerData.address
      });
    }

    if (customerData.business) {
      await CustomerBusiness.create({
        tenantId,
        customerId: customer._id,
        ...customerData.business
      });
    }

    return customer;
  }

  static async getCustomers(query = {}, tenantId) {
    const filter = { tenantId };
    
    if (query.includeDeleted === 'true') {
      // include deleted
    } else {
      filter.isDeleted = false;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex }
      ];
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(filter);

    return {
      customers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getCustomerById(customerId, tenantId) {
    const customer = await Customer.findOne({ _id: customerId, tenantId, isDeleted: false });
    if (!customer) throw new ApiError(404, 'Customer not found.');

    const addresses = await CustomerAddress.find({ customerId, tenantId });
    const business = await CustomerBusiness.findOne({ customerId, tenantId });

    return { customer, addresses, business };
  }

  static async getCustomerPurchaseHistory(customerId, tenantId) {
    const bills = await SaleBill.find({ customerId, tenantId, isDeleted: false })
      .sort({ createdAt: -1 });
    return bills;
  }

  static async updateCustomer(customerId, updateData, tenantId) {
    const customer = await Customer.findOneAndUpdate({ _id: customerId, tenantId }, updateData, { new: true });
    if (!customer) throw new ApiError(404, 'Customer not found.');
    return customer;
  }

  static async deleteCustomer(customerId, userId, tenantId) {
    return customerRepo.softDelete(customerId, userId, tenantId);
  }

  static async restoreCustomer(customerId, tenantId) {
    const customer = await Customer.findOne({ _id: customerId, tenantId });
    if (!customer) throw new ApiError(404, 'Customer not found.');
    customer.restore();
    return customer;
  }

  static async bulkDeleteCustomers(customerIds = [], userId, tenantId) {
    const result = await Customer.updateMany(
      { _id: { $in: customerIds }, tenantId },
      { isDeleted: true, deletedAt: new Date(), deletedBy: userId }
    );
    return { count: result.modifiedCount };
  }

  static async exportCustomers(query = {}, tenantId, format = 'csv') {
    const { customers } = await this.getCustomers({ ...query, limit: 10000 }, tenantId);
    const exportData = customers.map(c => ({
      ID: c._id.toString(),
      Name: c.name,
      Phone: c.phone,
      Email: c.email || '',
      AdvanceBalance: c.advanceBalance,
      DueBalance: c.dueBalance,
      LoyaltyPoints: c.loyaltyPoints,
      CreatedAt: c.createdAt
    }));
    return formatExportData(exportData, format);
  }
}

module.exports = CustomerService;

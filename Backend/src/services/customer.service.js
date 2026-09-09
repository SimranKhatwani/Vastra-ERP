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

    // Auto-generate unique customerId
    const customerCount = await Customer.countDocuments({ tenantId });
    let nextNum = customerCount + 1;
    let generatedCustomerId = customerData.customerId || `CUST-${String(nextNum).padStart(4, '0')}`;
    let exists = await Customer.findOne({ tenantId, customerId: generatedCustomerId });
    while (exists) {
      nextNum++;
      generatedCustomerId = `CUST-${String(nextNum).padStart(4, '0')}`;
      exists = await Customer.findOne({ tenantId, customerId: generatedCustomerId });
    }

    const payload = {
      ...customerData,
      customerId: generatedCustomerId,
      gstin: customerData.gstin !== undefined ? customerData.gstin : (customerData.gstNo || ''),
      tenantId
    };

    const customer = await Customer.create(payload);

    if (customerData.address && typeof customerData.address === 'object') {
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
        { email: searchRegex },
        { gstin: searchRegex },
        { customerId: searchRegex }
      ];
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const enrichedCustomers = customers.map(c => {
      const cObj = c.toObject();
      return {
        ...cObj,
        customerId: cObj.customerId || (cObj.phone ? `CUST-${cObj.phone.slice(-4)}` : `CUST-${cObj._id.toString().slice(-4).toUpperCase()}`)
      };
    });

    const total = await Customer.countDocuments(filter);

    return {
      customers: enrichedCustomers,
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
    const SaleItem = require('../models/billing/SaleItem');
    const Alteration = require('../models/alteration/Alteration');
    require('../models/InventoryPiece'); // Ensure it's registered for populate

    // Fetch all sale bills
    const bills = await SaleBill.find({ customerId, tenantId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    // Attach sale items to each bill
    for (let bill of bills) {
      const items = await SaleItem.find({ saleBillId: bill._id }).populate('inventoryPieceId').lean();
      bill.items = items;
    }

    // Fetch alterations for this customer
    const alterations = await Alteration.find({ customerId, tenantId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    return { bills, alterations };
  }

  static async updateCustomer(customerId, updateData, tenantId, userId = null, userName = 'Staff Member', reason = null, io = null) {
    const mongoose = require('mongoose');
    const AuditService = require('./audit.service');
    let existingCustomer = null;

    if (mongoose.Types.ObjectId.isValid(customerId)) {
      existingCustomer = await Customer.findOne({ _id: customerId, tenantId });
    }
    if (!existingCustomer && (updateData.phone || customerId)) {
      const searchPhone = updateData.phone || customerId;
      existingCustomer = await Customer.findOne({ phone: searchPhone, tenantId });
    }

    const oldPhone = existingCustomer?.phone;
    const newPhone = updateData.phone;

    let customer = null;

    const finalPayload = {
      ...updateData,
    };
    if (updateData.gstNo !== undefined && updateData.gstin === undefined) {
      finalPayload.gstin = updateData.gstNo;
    }

    if (mongoose.Types.ObjectId.isValid(customerId)) {
      customer = await Customer.findOneAndUpdate({ _id: customerId, tenantId }, finalPayload, { new: true });
    }

    if (!customer && (updateData.phone || customerId)) {
      const searchPhone = updateData.phone || customerId;
      customer = await Customer.findOneAndUpdate(
        { phone: searchPhone, tenantId },
        finalPayload,
        { new: true }
      );
    }

    if (!customer && updateData.phone && updateData.name) {
      customer = await Customer.findOneAndUpdate(
        { phone: updateData.phone, tenantId },
        { ...finalPayload, tenantId },
        { new: true, upsert: true }
      );
    }

    if (!customer) throw new ApiError(404, 'Customer not found.');

    // Audit log for CUSTOMER_MOBILE_CHANGE
    if (newPhone && oldPhone && oldPhone !== newPhone) {
      await AuditService.trackAuditLog({
        tenantId,
        userId,
        userName: userName || 'Staff Member',
        action: 'CUSTOMER_MOBILE_CHANGE',
        module: 'crm',
        entityId: customer._id.toString(),
        entityType: 'CUSTOMER',
        displayName: customer.name || 'Customer',
        item: `Customer: ${customer.name || ''} - Mobile Updated`,
        fieldChanged: 'Customer Mobile',
        oldValue: oldPhone,
        newValue: newPhone,
        reason: reason || 'Customer mobile number updated in records',
        details: {
          customerName: customer.name,
          oldPhone,
          newPhone
        }
      }, io);
    }

    return customer;
  }

  static async deleteCustomer(customerId, userId, tenantId) {
    const customer = await Customer.findOneAndDelete({ _id: customerId, tenantId });
    if (!customer) throw new ApiError(404, 'Customer not found.');
    return customer;
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

  static async getCustomerMeasurements(customerIdOrPhone, tenantId) {
    const mongoose = require('mongoose');
    const Alteration = require('../models/alteration/Alteration');
    
    let customer = null;
    if (mongoose.Types.ObjectId.isValid(customerIdOrPhone)) {
      customer = await Customer.findOne({ _id: customerIdOrPhone, tenantId, isDeleted: false }).lean();
    }
    if (!customer && customerIdOrPhone) {
      customer = await Customer.findOne({ phone: customerIdOrPhone, tenantId, isDeleted: false }).lean();
    }

    const query = { tenantId, isDeleted: false };
    if (customer) {
      query.$or = [{ customerId: customer._id }, { customerPhone: customer.phone }];
    } else if (customerIdOrPhone) {
      query.customerPhone = customerIdOrPhone;
    }

    const pastAltTickets = await Alteration.find(query).sort({ createdAt: -1 }).lean();
    const history = [];

    for (const alt of pastAltTickets) {
      const m = alt.measurements || (alt.items && alt.items[0] && alt.items[0].measurements);
      if (m && typeof m === 'object' && Object.keys(m).length > 0 && Object.values(m).some(v => v !== null && v !== '' && v !== undefined)) {
        history.push({
          id: alt._id,
          ticketId: alt.alterationNo || alt.alterationId,
          invoiceNumber: alt.invoiceNumber,
          sourceType: alt.sourceType || 'SHOWROOM_PURCHASE',
          garmentType: alt.productName || 'Garment',
          gender: alt.gender || 'Gents',
          measurements: m,
          tailorName: alt.tailorName,
          notes: alt.instructions || alt.customAlterationText || '',
          date: alt.createdAt
        });
      }
    }

    if (customer && customer.measurementHistory && Array.isArray(customer.measurementHistory)) {
      for (const h of customer.measurementHistory) {
        history.push({
          id: h._id || `cust-m-${Math.random()}`,
          ticketId: h.ticketId || 'MASTER_PROFILE',
          garmentType: h.garmentType || 'Master Profile',
          measurements: h.measurements || {},
          tailorName: h.tailorName || 'Master Tailor',
          notes: h.notes || '',
          date: h.takenAt || new Date()
        });
      }
    }

    history.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    return {
      customer: customer ? {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        gender: customer.gender
      } : null,
      masterMeasurements: customer?.masterMeasurements || (history[0]?.measurements) || {},
      history
    };
  }

  static async updateMasterMeasurements(customerId, measurements, garmentType, tenantId, tailorName = '') {
    const mongoose = require('mongoose');
    let customer = null;
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      customer = await Customer.findOne({ _id: customerId, tenantId, isDeleted: false });
    }
    if (!customer && customerId) {
      customer = await Customer.findOne({ phone: customerId, tenantId, isDeleted: false });
    }
    if (!customer) throw new ApiError(404, 'Customer not found.');

    customer.masterMeasurements = measurements;
    if (!customer.measurementHistory) customer.measurementHistory = [];
    customer.measurementHistory.unshift({
      garmentType: garmentType || 'Garment',
      measurements,
      tailorName,
      notes: 'Master measurements updated',
      takenAt: new Date()
    });

    await customer.save();
    return customer;
  }
}

module.exports = CustomerService;

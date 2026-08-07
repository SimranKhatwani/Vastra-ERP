const ApiError = require('../helpers/ApiError');
const CustomerLedger = require('../models/ledger/CustomerLedger');
const Customer = require('../models/crm/Customer');
const { LEDGER_TYPE } = require('../constants/status');
const { formatExportData } = require('../helpers/export.helper');

class LedgerService {
  static async getCustomerLedger(customerId, query = {}, tenantId) {
    const customer = await Customer.findOne({ _id: customerId, tenantId });
    if (!customer) throw new ApiError(404, 'Customer not found.');

    const filter = { customerId, tenantId };
    if (query.type) filter.type = query.type;

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const ledgerEntries = await CustomerLedger.find(filter)
      .populate('referenceBillId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CustomerLedger.countDocuments(filter);

    return {
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        dueBalance: customer.dueBalance,
        advanceBalance: customer.advanceBalance,
        loyaltyPoints: customer.loyaltyPoints
      },
      ledgerEntries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async recordAdjustment({ customerId, type, amount, remarks }, userId, tenantId) {
    const customer = await Customer.findOne({ _id: customerId, tenantId });
    if (!customer) throw new ApiError(404, 'Customer not found.');

    let newBalance = customer.dueBalance;

    if (type === LEDGER_TYPE.PAYMENT || type === LEDGER_TYPE.REFUND) {
      customer.dueBalance = Math.max(0, customer.dueBalance - amount);
      newBalance = customer.dueBalance;
    } else if (type === LEDGER_TYPE.DUE) {
      customer.dueBalance += amount;
      newBalance = customer.dueBalance;
    } else if (type === LEDGER_TYPE.ADVANCE) {
      customer.advanceBalance += amount;
      newBalance = customer.advanceBalance;
    }

    await customer.save();

    const entry = await CustomerLedger.create({
      tenantId,
      customerId,
      type,
      amount,
      balanceAfter: newBalance,
      remarks,
      createdBy: userId
    });

    return entry;
  }

  static async exportLedger(customerId, tenantId, format = 'csv') {
    const { customer, ledgerEntries } = await this.getCustomerLedger(customerId, { limit: 10000 }, tenantId);
    const exportData = ledgerEntries.map(e => ({
      Customer: customer.name,
      Type: e.type,
      Amount: e.amount,
      BalanceAfter: e.balanceAfter,
      Remarks: e.remarks || '',
      Date: e.createdAt
    }));
    return formatExportData(exportData, format);
  }
}

module.exports = LedgerService;

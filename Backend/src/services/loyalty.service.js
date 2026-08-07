const ApiError = require('../helpers/ApiError');
const Customer = require('../models/crm/Customer');
const CustomerLedger = require('../models/ledger/CustomerLedger');
const { LEDGER_TYPE } = require('../constants/status');

class LoyaltyService {
  /**
   * Earn loyalty points on purchase
   */
  static async earnPoints(customerId, points, billId, userId, tenantId) {
    const customer = await Customer.findOne({ _id: customerId, tenantId });
    if (!customer) throw new ApiError(404, 'Customer not found.');

    customer.loyaltyPoints += Number(points);
    await customer.save();

    await CustomerLedger.create({
      tenantId,
      customerId: customer._id,
      type: LEDGER_TYPE.LOYALTY,
      amount: points,
      balanceAfter: customer.loyaltyPoints,
      referenceBillId: billId,
      remarks: `Earned ${points} loyalty points`,
      createdBy: userId
    });

    return { customerId, newPointsBalance: customer.loyaltyPoints };
  }

  /**
   * Redeem loyalty points on checkout
   */
  static async redeemPoints(customerId, points, billId, userId, tenantId) {
    const customer = await Customer.findOne({ _id: customerId, tenantId });
    if (!customer) throw new ApiError(404, 'Customer not found.');

    if (customer.loyaltyPoints < points) {
      throw new ApiError(400, `Insufficient loyalty points. Customer has ${customer.loyaltyPoints} points available.`);
    }

    customer.loyaltyPoints -= Number(points);
    await customer.save();

    await CustomerLedger.create({
      tenantId,
      customerId: customer._id,
      type: LEDGER_TYPE.LOYALTY,
      amount: -points,
      balanceAfter: customer.loyaltyPoints,
      referenceBillId: billId,
      remarks: `Redeemed ${points} loyalty points`,
      createdBy: userId
    });

    return { customerId, newPointsBalance: customer.loyaltyPoints };
  }

  /**
   * Get Loyalty transaction history
   */
  static async getLoyaltyHistory(customerId, tenantId) {
    return CustomerLedger.find({
      tenantId,
      customerId,
      type: LEDGER_TYPE.LOYALTY
    }).sort({ createdAt: -1 });
  }
}

module.exports = LoyaltyService;

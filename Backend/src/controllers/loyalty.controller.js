const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const LoyaltyService = require('../services/loyalty.service');

class LoyaltyController {
  static earnPoints = asyncHandler(async (req, res) => {
    const { customerId, points, billId } = req.body;
    const result = await LoyaltyService.earnPoints(customerId, points, billId, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Loyalty points added successfully.'));
  });

  static redeemPoints = asyncHandler(async (req, res) => {
    const { customerId, points, billId } = req.body;
    const result = await LoyaltyService.redeemPoints(customerId, points, billId, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Loyalty points redeemed successfully.'));
  });

  static getHistory = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const history = await LoyaltyService.getLoyaltyHistory(customerId, req.tenantId);
    return res.status(200).json(new ApiResponse(200, history, 'Loyalty history retrieved.'));
  });
}

module.exports = LoyaltyController;

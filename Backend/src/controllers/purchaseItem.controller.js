const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const PurchaseItemService = require('../services/purchaseItem.service');

class PurchaseItemController {
  static createPurchaseItem = asyncHandler(async (req, res) => {
    const item = await PurchaseItemService.createPurchaseItem(req.body, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, item, 'Purchase item created successfully.'));
  });

  static getPurchaseItemById = asyncHandler(async (req, res) => {
    const item = await PurchaseItemService.getPurchaseItemById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, item, 'Purchase item details fetched.'));
  });

  static updatePurchaseItem = asyncHandler(async (req, res) => {
    const item = await PurchaseItemService.updatePurchaseItem(req.params.id, req.body, req.tenantId);
    return res.status(200).json(new ApiResponse(200, item, 'Purchase item updated successfully.'));
  });

  static deletePurchaseItem = asyncHandler(async (req, res) => {
    await PurchaseItemService.deletePurchaseItem(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, null, 'Purchase item deleted successfully.'));
  });
}

module.exports = PurchaseItemController;

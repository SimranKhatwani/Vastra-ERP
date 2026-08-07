const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const InventoryLifecycleService = require('../services/inventoryLifecycle.service');

class InventoryLifecycleController {
  static getAllLifecycleEvents = asyncHandler(async (req, res) => {
    const { events, pagination } = await InventoryLifecycleService.getAllLifecycleEvents(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, events, 'Inventory lifecycle events retrieved.', pagination));
  });

  static getLifecycleByUniqueCode = asyncHandler(async (req, res) => {
    const result = await InventoryLifecycleService.getLifecycleByUniqueCode(req.params.code, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Lifecycle history by unique code retrieved.'));
  });
  static getLifecycleById = asyncHandler(async (req, res) => {
    const event = await InventoryLifecycleService.getLifecycleById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, event, 'Lifecycle event retrieved by ID.'));
  });
}

module.exports = InventoryLifecycleController;

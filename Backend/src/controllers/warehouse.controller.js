const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const WarehouseService = require('../services/warehouse.service');

class WarehouseController {
  static createWarehouse = asyncHandler(async (req, res) => {
    const warehouse = await WarehouseService.createWarehouse(req.body, req.tenantId);
    return res.status(201).json(new ApiResponse(201, warehouse, 'Warehouse created successfully.'));
  });

  static getWarehouses = asyncHandler(async (req, res) => {
    const result = await WarehouseService.getWarehouses(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result.items, 'Warehouses retrieved successfully.', result.pagination));
  });

  static getWarehouseById = asyncHandler(async (req, res) => {
    const warehouse = await WarehouseService.getWarehouseById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, warehouse, 'Warehouse retrieved successfully.'));
  });

  static updateWarehouse = asyncHandler(async (req, res) => {
    const warehouse = await WarehouseService.updateWarehouse(req.params.id, req.body, req.tenantId);
    return res.status(200).json(new ApiResponse(200, warehouse, 'Warehouse updated successfully.'));
  });

  static deleteWarehouse = asyncHandler(async (req, res) => {
    await WarehouseService.deleteWarehouse(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, null, 'Warehouse deleted successfully.'));
  });
}

module.exports = WarehouseController;

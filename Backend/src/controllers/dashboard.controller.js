const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const DashboardService = require('../services/dashboard.service');

class DashboardController {
  static getOwnerDashboard = asyncHandler(async (req, res) => {
    const metrics = await DashboardService.getOwnerDashboard(req.tenantId);
    return res.status(200).json(new ApiResponse(200, metrics, 'Owner dashboard metrics loaded.'));
  });
  static getInventorySummary = asyncHandler(async (req, res) => {
    const summary = await DashboardService.getInventorySummary(req.tenantId);
    return res.status(200).json(new ApiResponse(200, summary, 'Inventory summary loaded.'));
  });

  static getPurchaseSummary = asyncHandler(async (req, res) => {
    const summary = await DashboardService.getPurchaseSummary(req.tenantId);
    return res.status(200).json(new ApiResponse(200, summary, 'Purchase summary loaded.'));
  });

  static getStockByBrand = asyncHandler(async (req, res) => {
    const summary = await DashboardService.getStockByBrand(req.tenantId);
    return res.status(200).json(new ApiResponse(200, summary, 'Stock by brand loaded.'));
  });

  static getStockByCategory = asyncHandler(async (req, res) => {
    const summary = await DashboardService.getStockByCategory(req.tenantId);
    return res.status(200).json(new ApiResponse(200, summary, 'Stock by category loaded.'));
  });

  static getStockByFirm = asyncHandler(async (req, res) => {
    const summary = await DashboardService.getStockByFirm(req.tenantId);
    return res.status(200).json(new ApiResponse(200, summary, 'Stock by firm loaded.'));
  });

  static getLowStock = asyncHandler(async (req, res) => {
    const summary = await DashboardService.getLowStock(req.tenantId);
    return res.status(200).json(new ApiResponse(200, summary, 'Low stock summary loaded.'));
  });
}

module.exports = DashboardController;

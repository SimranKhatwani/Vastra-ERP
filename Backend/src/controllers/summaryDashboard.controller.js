const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const SummaryDashboardService = require('../services/summaryDashboard.service');

class SummaryDashboardController {
  static getOverviewSummary = asyncHandler(async (req, res) => {
    const data = await SummaryDashboardService.getOverviewSummary(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, data, 'Summary Dashboard overview metrics fetched.'));
  });

  static getOperationsDashboard = asyncHandler(async (req, res) => {
    const data = await SummaryDashboardService.getOperationsDashboard(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, data, 'Operations Dashboard metrics fetched.'));
  });

  static getSalesmanDashboard = asyncHandler(async (req, res) => {
    const data = await SummaryDashboardService.getSalesmanDashboard(req.query, req.tenantId, req.user);
    return res.status(200).json(new ApiResponse(200, data, 'Salesman Dashboard metrics fetched.'));
  });

  static toggleAbsentSalesman = asyncHandler(async (req, res) => {
    const { salesmanId, isAbsent, delegatedRole } = req.body;
    const result = await SummaryDashboardService.toggleAbsentSalesman(salesmanId, isAbsent, delegatedRole, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, `Salesman attendance status updated successfully.`));
  });

  static getCustomerDashboard = asyncHandler(async (req, res) => {
    const data = await SummaryDashboardService.getCustomerDashboard(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, data, 'Customer Dashboard metrics fetched.'));
  });

  static getManagementDashboard = asyncHandler(async (req, res) => {
    const data = await SummaryDashboardService.getManagementDashboard(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, data, 'Management Dashboard metrics fetched.'));
  });
}

module.exports = SummaryDashboardController;

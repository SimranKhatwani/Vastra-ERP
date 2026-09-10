const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const ReportService = require('../services/report.service');

class ReportController {
  static getSalesReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getSalesReport(startDate, endDate, req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Sales report generated.'));
  });

  static getPurchaseReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getPurchaseReport(startDate, endDate, req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Purchase report generated.'));
  });

  static getStockReport = asyncHandler(async (req, res) => {
    const report = await ReportService.getInventoryReport(req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Stock summary report generated.'));
  });

  static getGSTReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getGSTReport(startDate, endDate, req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'GST report generated.'));
  });

  static getCustomerReport = asyncHandler(async (req, res) => {
    const report = await ReportService.getCustomerReport(req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Customer report generated.'));
  });

  static getPaymentReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getPaymentReport(startDate, endDate, req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Payment report generated.'));
  });

  static getAlterationReport = asyncHandler(async (req, res) => {
    const report = await ReportService.getAlterationReport(req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Alteration report generated.'));
  });

  static getTailoringReport = asyncHandler(async (req, res) => {
    const { reportType, startDate, endDate } = req.query;
    const report = await ReportService.getTailoringReport(reportType, startDate, endDate, req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Tailoring report generated.'));
  });

  static getReturnReport = asyncHandler(async (req, res) => {
    const report = await ReportService.getReturnReport(req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Return report generated.'));
  });

  static getManualAdjustmentsReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getManualAdjustmentsReport(startDate, endDate, req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Manual adjustments report generated.'));
  });
}

module.exports = ReportController;

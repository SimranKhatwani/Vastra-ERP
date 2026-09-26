const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const ReportService = require('../services/report.service');

class ReportController {
  static getDashboardAnalytics = asyncHandler(async (req, res) => {
    const data = await ReportService.getDashboardAnalytics(req.tenantId);
    return res.status(200).json(new ApiResponse(200, data, 'Enterprise dashboard analytics generated.'));
  });

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

  static getVendorReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getVendorReport(startDate, endDate, req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Vendor report generated.'));
  });

  static getStockReport = asyncHandler(async (req, res) => {
    const type = req.query.type || req.query.reportType || req.params.type;
    const { startDate, endDate } = req.query;
    const report = await ReportService.getInventoryReport(type, req.tenantId, startDate, endDate);
    return res.status(200).json(new ApiResponse(200, report, 'Inventory report generated.'));
  });

  static getStockAgingReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getInventoryReport('stock_aging', req.tenantId, startDate, endDate);
    return res.status(200).json(new ApiResponse(200, report, 'Stock aging report generated.'));
  });

  static getFastMovingReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getInventoryReport('fast_moving', req.tenantId, startDate, endDate);
    return res.status(200).json(new ApiResponse(200, report, 'Fast moving products report generated.'));
  });

  static getSlowMovingReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getInventoryReport('slow_moving', req.tenantId, startDate, endDate);
    return res.status(200).json(new ApiResponse(200, report, 'Slow moving products report generated.'));
  });

  static getEmployeePerformanceReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getEmployeePerformanceReport(startDate, endDate, req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Employee performance report generated.'));
  });

  static getAttendanceReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getAttendanceReport(startDate, endDate, req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Attendance report generated.'));
  });

  static getFinancialSummaryReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getFinancialSummaryReport(startDate, endDate, req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Financial summary report generated.'));
  });

  static getExpensesReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getExpensesReport(startDate, endDate, req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'Expenses report generated.'));
  });

  static getGSTReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getGSTReport(startDate, endDate, req.tenantId);
    return res.status(200).json(new ApiResponse(200, report, 'GST report generated.'));
  });

  static getCustomerReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await ReportService.getCustomerReport(startDate, endDate, req.tenantId);
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

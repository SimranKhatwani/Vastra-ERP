const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const AlterationService = require('../services/alteration.service');

class AlterationController {
  static createAlteration = asyncHandler(async (req, res) => {
    const alteration = await AlterationService.createAlteration(req.body, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, alteration, 'Alteration record created successfully.'));
  });

  static updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, measurements, alterationDetails } = req.body;
    const alteration = await AlterationService.updateStatus(id, status, req.user.id, req.tenantId, measurements, alterationDetails);
    return res.status(200).json(new ApiResponse(200, alteration, `Alteration status updated to ${status}.`));
  });

  static updateMeasurements = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { measurements, alterationDetails, status } = req.body;
    const alteration = await AlterationService.updateStatus(id, status, req.user.id, req.tenantId, measurements, alterationDetails);
    return res.status(200).json(new ApiResponse(200, alteration, 'Alteration measurements updated successfully.'));
  });

  static getAlterations = asyncHandler(async (req, res) => {
    const { alterations, pagination } = await AlterationService.getAlterations(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, alterations, 'Alteration list retrieved.', pagination));
  });

  static getAlterationById = asyncHandler(async (req, res) => {
    const details = await AlterationService.getAlterationById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, details, 'Alteration details fetched.'));
  });

  static getPendingItems = asyncHandler(async (req, res) => {
    const pendingItems = await AlterationService.getPendingAlterationItems(req.tenantId);
    return res.status(200).json(new ApiResponse(200, pendingItems, 'Pending alteration items fetched.'));
  });

  static getDashboard = asyncHandler(async (req, res) => {
    const dashboard = await AlterationService.getAlterationDashboard(req.tenantId, req.query.dateRange);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: dashboard,
      summary: dashboard.summary,
      message: 'Alteration dashboard metrics fetched.'
    });
  });
}

module.exports = AlterationController;

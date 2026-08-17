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
    const { status } = req.body;
    const alteration = await AlterationService.updateStatus(id, status, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, alteration, `Alteration status updated to ${status}.`));
  });

  static getAlterations = asyncHandler(async (req, res) => {
    const { alterations, pagination } = await AlterationService.getAlterations(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, alterations, 'Alteration list retrieved.', pagination));
  });

  static getAlterationById = asyncHandler(async (req, res) => {
    const details = await AlterationService.getAlterationById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, details, 'Alteration details fetched.'));
  });

  static getDashboard = asyncHandler(async (req, res) => {
    const dashboard = await AlterationService.getAlterationDashboard(req.tenantId, req.query.dateRange);
    return res.status(200).json(new ApiResponse(200, dashboard, 'Alteration dashboard metrics fetched.'));
  });
}

module.exports = AlterationController;

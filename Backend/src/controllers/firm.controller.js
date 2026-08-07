const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const FirmService = require('../services/firm.service');

class FirmController {
  static createFirm = asyncHandler(async (req, res) => {
    const firm = await FirmService.createFirm(req.body, req.tenantId);
    return res.status(201).json(new ApiResponse(201, firm, 'Firm created successfully.'));
  });

  static getFirms = asyncHandler(async (req, res) => {
    const result = await FirmService.getFirms(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result.items, 'Firms retrieved successfully.', result.pagination));
  });

  static getFirmById = asyncHandler(async (req, res) => {
    const firm = await FirmService.getFirmById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, firm, 'Firm retrieved successfully.'));
  });

  static updateFirm = asyncHandler(async (req, res) => {
    const firm = await FirmService.updateFirm(req.params.id, req.body, req.tenantId);
    return res.status(200).json(new ApiResponse(200, firm, 'Firm updated successfully.'));
  });

  static deleteFirm = asyncHandler(async (req, res) => {
    await FirmService.deleteFirm(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, null, 'Firm deleted successfully.'));
  });
}

module.exports = FirmController;

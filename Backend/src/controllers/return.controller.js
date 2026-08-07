const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const ReturnService = require('../services/return.service');

class ReturnController {
  static validateReturn = asyncHandler(async (req, res) => {
    const { barcode, uniqueCode, saleBillNo } = req.body;
    const result = await ReturnService.validateReturn(barcode, uniqueCode, saleBillNo, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, result.valid ? 'Return validation successful.' : result.reason));
  });

  static createReturn = asyncHandler(async (req, res) => {
    const returnDoc = await ReturnService.createReturn(req.body, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, returnDoc, 'Return processed and credit note generated.'));
  });

  static getReturns = asyncHandler(async (req, res) => {
    const { returns, pagination } = await ReturnService.getReturns(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, returns, 'Returns retrieved.', pagination));
  });

  static getReturnById = asyncHandler(async (req, res) => {
    const details = await ReturnService.getReturnById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, details, 'Return details fetched.'));
  });

  static exportReturns = asyncHandler(async (req, res) => {
    const exportResult = await ReturnService.exportReturns(req.query, req.tenantId, req.query.format || 'csv');
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', 'attachment; filename=returns.csv');
      return res.send(exportResult.content);
    }
    return res.status(200).json(new ApiResponse(200, exportResult.content, 'Returns exported successfully.'));
  });
}

module.exports = ReturnController;

const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const LedgerService = require('../services/ledger.service');

class LedgerController {
  static getCustomerLedger = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const result = await LedgerService.getCustomerLedger(customerId, req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Customer ledger fetched.', result.pagination));
  });

  static recordAdjustment = asyncHandler(async (req, res) => {
    const entry = await LedgerService.recordAdjustment(req.body, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, entry, 'Ledger entry recorded successfully.'));
  });

  static exportLedger = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const exportResult = await LedgerService.exportLedger(customerId, req.tenantId, req.query.format || 'csv');
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', 'attachment; filename=customer_ledger.csv');
      return res.send(exportResult.content);
    }
    return res.status(200).json(new ApiResponse(200, exportResult.content, 'Ledger exported successfully.'));
  });
}

module.exports = LedgerController;

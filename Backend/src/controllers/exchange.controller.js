const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const ExchangeService = require('../services/exchange.service');

class ExchangeController {
  static createExchange = asyncHandler(async (req, res) => {
    const result = await ExchangeService.createExchange(req.body, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, result, 'Exchange transaction processed successfully.'));
  });

  static getExchanges = asyncHandler(async (req, res) => {
    const { exchanges, pagination } = await ExchangeService.getExchanges(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, exchanges, 'Exchanges list retrieved.', pagination));
  });

  static getExchangeById = asyncHandler(async (req, res) => {
    const exchange = await ExchangeService.getExchangeById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, exchange, 'Exchange details fetched.'));
  });

  static exportExchanges = asyncHandler(async (req, res) => {
    const exportResult = await ExchangeService.exportExchanges(req.query, req.tenantId, req.query.format || 'csv');
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', 'attachment; filename=exchanges.csv');
      return res.send(exportResult.content);
    }
    return res.status(200).json(new ApiResponse(200, exportResult.content, 'Exchanges exported successfully.'));
  });
}

module.exports = ExchangeController;

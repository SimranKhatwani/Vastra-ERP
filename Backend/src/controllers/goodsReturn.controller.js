const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const GoodsReturnService = require('../services/goodsReturn.service');

class GoodsReturnController {
  static createGoodsReturn = asyncHandler(async (req, res) => {
    const result = await GoodsReturnService.createGoodsReturn(req.body, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, result, 'Vendor goods return created successfully.'));
  });

  static getGoodsReturns = asyncHandler(async (req, res) => {
    const { goodsReturns, pagination } = await GoodsReturnService.getGoodsReturns(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, goodsReturns, 'Goods return list retrieved.', pagination));
  });

  static getGoodsReturnById = asyncHandler(async (req, res) => {
    const details = await GoodsReturnService.getGoodsReturnById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, details, 'Goods return details fetched.'));
  });

  static exportGoodsReturns = asyncHandler(async (req, res) => {
    const exportResult = await GoodsReturnService.exportGoodsReturns(req.query, req.tenantId, req.query.format || 'csv');
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', 'attachment; filename=goods_returns.csv');
      return res.send(exportResult.content);
    }
    return res.status(200).json(new ApiResponse(200, exportResult.content, 'Goods returns exported successfully.'));
  });
}

module.exports = GoodsReturnController;

const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const GoodsReturnService = require('../services/goodsReturn.service');

class GoodsReturnController {
  static createGoodsReturn = asyncHandler(async (req, res) => {
    const result = await GoodsReturnService.createGoodsReturn(req.body, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, result, 'Vendor goods return created successfully.'));
  });

  static dispatchGoodsReturn = asyncHandler(async (req, res) => {
    const result = await GoodsReturnService.dispatchGoodsReturn(req.params.id, req.body, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Goods return dispatched successfully.'));
  });

  static confirmVendorReceipt = asyncHandler(async (req, res) => {
    const result = await GoodsReturnService.confirmVendorReceipt(req.params.id, req.body, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Vendor receipt confirmed.'));
  });

  static verifyVendorGR = asyncHandler(async (req, res) => {
    const result = await GoodsReturnService.verifyVendorGR(req.params.id, req.body, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Vendor verification recorded.'));
  });

  static compareVendorDocument = asyncHandler(async (req, res) => {
    const result = await GoodsReturnService.compareVendorDocument(req.params.id, req.body, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Vendor document comparison completed.'));
  });

  static addCreditNoteSettlement = asyncHandler(async (req, res) => {
    const result = await GoodsReturnService.addCreditNoteSettlement(req.params.id, req.body, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Credit Note settlement recorded.'));
  });

  static addReplacementSettlement = asyncHandler(async (req, res) => {
    const result = await GoodsReturnService.addReplacementSettlement(req.params.id, req.body, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Replacement settlement logged.'));
  });

  static verifyPhysicalShowroomScan = asyncHandler(async (req, res) => {
    const result = await GoodsReturnService.verifyPhysicalShowroomScan(req.params.id, req.body, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Showroom barcode scan verified into stock.'));
  });

  static executeGoldenClosure = asyncHandler(async (req, res) => {
    const result = await GoodsReturnService.executeGoldenClosure(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Goods Return successfully closed under Golden Closure Rule.'));
  });

  static getDashboardData = asyncHandler(async (req, res) => {
    const result = await GoodsReturnService.getDashboardData(req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'GR Dashboard metrics retrieved.'));
  });

  static getRegisterData = asyncHandler(async (req, res) => {
    const { goodsReturns, pagination } = await GoodsReturnService.getRegisterData(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, goodsReturns, 'GR Register retrieved.', pagination));
  });

  static getGoodsReturnById = asyncHandler(async (req, res) => {
    const details = await GoodsReturnService.getGoodsReturnById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, details, 'Goods return 360 details fetched.'));
  });

  static addDocumentToVault = asyncHandler(async (req, res) => {
    const result = await GoodsReturnService.addDocumentToVault(req.params.id, req.body, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Document added to Digital GR Vault.'));
  });

  static getReportsData = asyncHandler(async (req, res) => {
    const result = await GoodsReturnService.getReportsData(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'GR Reports and Vendor Analytics fetched.'));
  });
}

module.exports = GoodsReturnController;

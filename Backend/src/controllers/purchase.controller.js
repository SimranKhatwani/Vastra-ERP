const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const PurchaseService = require('../services/purchase.service');

class PurchaseController {
  static createPurchaseBill = asyncHandler(async (req, res) => {
    const result = await PurchaseService.createPurchaseBill(req.body, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, result, 'Purchase bill created and stock barcodes generated successfully.'));
  });

  static getPurchaseBills = asyncHandler(async (req, res) => {
    const { bills, pagination } = await PurchaseService.getPurchaseBills(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, bills, 'Purchase bills retrieved.', pagination));
  });

  static getPurchaseBillById = asyncHandler(async (req, res) => {
    const details = await PurchaseService.getPurchaseBillById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, details, 'Purchase bill details fetched.'));
  });

  static approvePurchaseBill = asyncHandler(async (req, res) => {
    const bill = await PurchaseService.approvePurchaseBill(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, bill, 'Purchase bill approved.'));
  });

  static cancelPurchaseBill = asyncHandler(async (req, res) => {
    const bill = await PurchaseService.cancelPurchaseBill(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, bill, 'Purchase bill cancelled.'));
  });

  static exportPurchaseBills = asyncHandler(async (req, res) => {
    const exportResult = await PurchaseService.exportPurchaseBills(req.query, req.tenantId, req.query.format || 'csv');
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', 'attachment; filename=purchase_bills.csv');
      return res.send(exportResult.content);
    }
    return res.status(200).json(new ApiResponse(200, exportResult.content, 'Purchase bills exported successfully.'));
  });
  static updatePurchaseBill = asyncHandler(async (req, res) => {
    const updated = await PurchaseService.updatePurchaseBill(req.params.id, req.body, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, updated, 'Purchase bill updated.'));
  });

  static deletePurchaseBill = asyncHandler(async (req, res) => {
    const result = await PurchaseService.deletePurchaseBill(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Purchase bill deleted (soft).'));
  });

  static getPurchaseBillItems = asyncHandler(async (req, res) => {
    const items = await PurchaseService.getPurchaseBillItems(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, items, 'Purchase bill items retrieved.'));
  });

}

module.exports = PurchaseController;

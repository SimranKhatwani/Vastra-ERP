const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const PSSMService = require('../services/pssm.service');

class PSSMController {
  static createPSSM = asyncHandler(async (req, res) => {
    const result = await PSSMService.createPSSM(req.body, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, result, 'PSSM record created successfully.'));
  });

  static getPendingAssignments = asyncHandler(async (req, res) => {
    const items = await PSSMService.getPendingAssignments(req.tenantId);
    return res.status(200).json(new ApiResponse(200, items, 'Pending assignment queue retrieved.'));
  });

  static getSalesmanPending = asyncHandler(async (req, res) => {
    const items = await PSSMService.getSalesmanPendingList(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, items, 'Salesman pending PSS items retrieved.'));
  });

  static scanCompleteItem = asyncHandler(async (req, res) => {
    const { barcode } = req.body;
    const completedItem = await PSSMService.markItemCompleteByScan(barcode, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, completedItem, `Item ${barcode} marked READY & highlighted green.`));
  });

  static checkAbsentSalesmen = asyncHandler(async (req, res) => {
    const result = await PSSMService.checkAndReassignAbsentSalesmen(req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Absent salesman check & re-assignment completed.'));
  });

  static assignTailorVendor = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { tailorName } = req.body;
    const item = await PSSMService.assignTailorVendor(itemId, tailorName, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, item, `Assigned to ${tailorName}.`));
  });

  static updateItemStatus = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { status, measurements, alterationDetails } = req.body;
    const item = await PSSMService.updateItemStatus(itemId, status, measurements, alterationDetails, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, item, `Item status updated to ${status}.`));
  });

  static getBillPSSMByBarcode = asyncHandler(async (req, res) => {
    const { billBarcode } = req.params;
    const pssmData = await PSSMService.getBillPSSMByBarcode(billBarcode, req.tenantId);
    return res.status(200).json(new ApiResponse(200, pssmData, 'Bill PSSM data retrieved.'));
  });

  static processCollection = asyncHandler(async (req, res) => {
    const { billBarcode, itemIds } = req.body;
    const updated = await PSSMService.processCollection(billBarcode, itemIds, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, updated, 'Collection process completed.'));
  });

  static getAllPSSMRecords = asyncHandler(async (req, res) => {
    const { records, pagination } = await PSSMService.getAllPSSMRecords(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, records, 'PSSM list retrieved.', pagination));
  });
}

module.exports = PSSMController;

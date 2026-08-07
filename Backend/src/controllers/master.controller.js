const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const MasterService = require('../services/master.service');

class MasterController {
  static createMaster = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const item = await MasterService.createMaster(type, req.body, req.tenantId);
    return res.status(201).json(new ApiResponse(201, item, `${type} created successfully.`));
  });

  static getMasters = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { items, pagination } = await MasterService.getMasters(type, req.tenantId, req.query);
    return res.status(200).json(new ApiResponse(200, items, `${type} list retrieved.`, pagination));
  });

  static getMasterById = asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const item = await MasterService.getMasterById(type, id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, item, `${type} details fetched.`));
  });

  static updateMaster = asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const item = await MasterService.updateMaster(type, id, req.body, req.tenantId);
    return res.status(200).json(new ApiResponse(200, item, `${type} updated successfully.`));
  });

  static deleteMaster = asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    await MasterService.deleteMaster(type, id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, null, `${type} deleted successfully.`));
  });

  static restoreMaster = asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const item = await MasterService.restoreMaster(type, id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, item, `${type} restored successfully.`));
  });

  static bulkDeleteMasters = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const result = await MasterService.bulkDeleteMasters(type, req.body.ids, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, `Bulk delete for ${type} completed.`));
  });

  static bulkUpdateStatus = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const result = await MasterService.bulkUpdateStatus(type, req.body.ids, req.body.isActive, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, `Bulk status update for ${type} completed.`));
  });

  static exportMasters = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const exportResult = await MasterService.exportMasters(type, req.tenantId, req.query, req.query.format || 'csv');
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${type}.csv`);
      return res.send(exportResult.content);
    }
    return res.status(200).json(new ApiResponse(200, exportResult.content, `${type} exported successfully.`));
  });
}

module.exports = MasterController;

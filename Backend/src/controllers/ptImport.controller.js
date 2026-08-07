const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const ApiError = require('../helpers/ApiError');
const PTImportService = require('../services/ptImport.service');
const XLSX = require('xlsx');
const fs = require('fs');

class PTImportController {
  static importPTExcel = asyncHandler(async (req, res) => {
    let rows = req.body?.rows;

    // 1. If file uploaded via Multer (Excel .xlsx, .xls, .csv)
    if (req.file) {
      try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        // Clean up uploaded temp file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        if (fs.existsSync(req.file?.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw new ApiError(400, `Failed to parse uploaded Excel file: ${err.message}`);
      }
    }

    // 2. If body sent as JSON string in form-data
    if (typeof rows === 'string') {
      try {
        rows = JSON.parse(rows);
      } catch (e) {
        throw new ApiError(400, 'Invalid JSON format for rows.');
      }
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      throw new ApiError(400, 'No import data found. Upload a valid Excel file (.xlsx, .xls, .csv) under file field or pass JSON array in rows.');
    }

    const defaultWarehouseId = req.body?.warehouseId || req.query?.warehouseId;
    const defaultFirmId = req.body?.firmId || req.query?.firmId;

    const summary = await PTImportService.processImportRows(
      rows,
      defaultWarehouseId,
      defaultFirmId,
      req.user.id,
      req.tenantId
    );

    return res.status(200).json(new ApiResponse(200, summary, 'PT Excel import processed successfully.'));
  });

  static validatePTExcel = asyncHandler(async (req, res) => {
    // Read and parse file same as import
    let rows = req.body?.rows;
    if (req.file) {
      try {
        const workbook = XLSX.readFile(req.file.path);
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (err) {
        if (fs.existsSync(req.file?.path)) fs.unlinkSync(req.file.path);
        throw new ApiError(400, `Failed to parse file: ${err.message}`);
      }
    }
    if (typeof rows === 'string') rows = JSON.parse(rows);
    
    const summary = await PTImportService.validatePTExcel(rows, req.tenantId);
    return res.status(200).json(new ApiResponse(200, summary, 'PT Excel validation completed.'));
  });

  static getTemplate = asyncHandler(async (req, res) => {
    const template = await PTImportService.getTemplate();
    return res.status(200).json(new ApiResponse(200, template, 'PT Import template retrieved.'));
  });

  static getHistory = asyncHandler(async (req, res) => {
    const { items, pagination } = await PTImportService.getHistory(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, items, 'PT Import history retrieved.', pagination));
  });

  static getById = asyncHandler(async (req, res) => {
    const record = await PTImportService.getById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, record, 'PT Import record retrieved.'));
  });

  static rollbackImport = asyncHandler(async (req, res) => {
    const result = await PTImportService.rollbackImport(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'PT Import rolled back successfully.'));
  });
}

module.exports = PTImportController;

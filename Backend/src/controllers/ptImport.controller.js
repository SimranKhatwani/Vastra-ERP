const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const ApiError = require('../helpers/ApiError');
const PTImportService = require('../services/ptImport.service');
const XLSX = require('xlsx');
const fs = require('fs');

class PTImportController {
  static importPTExcel = asyncHandler(async (req, res) => {
    let workbookData = null;
    let rows = req.body?.rows;

    if (req.file) {
      try {
        const workbook = XLSX.readFile(req.file.path);
        workbookData = {};
        for (const sheetName of workbook.SheetNames) {
          workbookData[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
        }

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

    if (typeof rows === 'string') {
      try {
        rows = JSON.parse(rows);
      } catch (e) {
        throw new ApiError(400, 'Invalid JSON format for rows.');
      }
    }

    if (!workbookData && (!rows || !Array.isArray(rows) || rows.length === 0)) {
      throw new ApiError(400, 'No import data found. Upload a valid Excel file or pass JSON array in rows.');
    }

    const defaultWarehouseId = req.body?.warehouseId || req.query?.warehouseId;
    const defaultFirmId = req.body?.firmId || req.query?.firmId;

    let summary;
    try {
      const fallbackWorkbook = { Default: rows };
      if (req.body?.vendorDataRows) {
        fallbackWorkbook['Vendor Data'] = req.body.vendorDataRows;
      }
      
      summary = await PTImportService.processImportWorkbook(
        workbookData || fallbackWorkbook,
        defaultWarehouseId,
        defaultFirmId,
        req.user.id,
        req.tenantId
      );
    } catch (err) {
      require('fs').writeFileSync('C:\\Users\\BAPS\\OneDrive\\Desktop\\Vastra ERP\\Backend\\debug_error.log', (err.stack || err.message) + '\n\n' + JSON.stringify(err.keyValue || {}));
      throw err;
    }

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

  static deleteImport = asyncHandler(async (req, res) => {
    const result = await PTImportService.deleteImport(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'PT Import deleted atomically.'));
  });
}

module.exports = PTImportController;

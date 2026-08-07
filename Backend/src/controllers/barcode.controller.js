const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const BarcodeService = require('../services/barcode.service');

class BarcodeController {
  static getBarcodeData = asyncHandler(async (req, res) => {
    const data = await BarcodeService.getBarcodeData(req.params.barcode, req.tenantId);
    return res.status(200).json(new ApiResponse(200, data, 'Barcode data retrieved.'));
  });

  static printBarcode = asyncHandler(async (req, res) => {
    const label = await BarcodeService.printBarcode(req.params.barcode, req.tenantId);
    return res.status(200).json(new ApiResponse(200, label, 'Barcode label data generated.'));
  });

  static printBatchLabels = asyncHandler(async (req, res) => {
    const batch = await BarcodeService.printBatchLabels(req.params.billId, req.tenantId);
    return res.status(200).json(new ApiResponse(200, batch, 'Batch label data generated.'));
  });
}

module.exports = BarcodeController;

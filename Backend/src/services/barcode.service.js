const ApiError = require('../helpers/ApiError');
const InventoryPiece = require('../models/InventoryPiece');
const PurchaseItem = require('../models/purchase/PurchaseItem');

class BarcodeService {
  /**
   * Get barcode data (full piece details)
   */
  static async getBarcodeData(barcode, tenantId) {
    const piece = await InventoryPiece.findOne({ barcode, tenantId, isDeleted: false })
      .populate({
        path: 'productId',
        populate: { path: 'brandId categoryId gstId hsnId' }
      })
      .populate('warehouseId firmId');

    if (!piece) {
      throw new ApiError(404, `No inventory piece found for barcode '${barcode}'.`);
    }

    return piece;
  }

  /**
   * Generate print data for a single barcode label
   */
  static async printBarcode(barcode, tenantId) {
    const piece = await InventoryPiece.findOne({ barcode, tenantId, isDeleted: false })
      .populate({
        path: 'productId',
        populate: { path: 'brandId categoryId' }
      })
      .populate('firmId');

    if (!piece) {
      throw new ApiError(404, `No inventory piece found for barcode '${barcode}'.`);
    }

    return {
      barcode: piece.barcode,
      uniqueCode: piece.uniqueCode,
      ipn: piece.ipn,
      productName: piece.productId?.itemName || '',
      designNo: piece.productId?.designNo || '',
      itemCode: piece.productId?.itemCode || '',
      brand: piece.productId?.brandId?.name || '',
      category: piece.productId?.categoryId?.name || '',
      size: piece.size,
      mrp: piece.mrp,
      color: piece.primaryColor,
      firm: piece.firmId?.name || ''
    };
  }

  /**
   * Generate batch print data for all barcodes in a purchase bill
   */
  static async printBatchLabels(billId, tenantId) {
    const pieces = await InventoryPiece.find({
      purchaseBillId: billId,
      tenantId,
      isDeleted: false
    })
      .populate({
        path: 'productId',
        populate: { path: 'brandId categoryId' }
      })
      .populate('firmId')
      .sort({ createdAt: 1 });

    if (!pieces.length) {
      throw new ApiError(404, `No inventory pieces found for bill ID '${billId}'.`);
    }

    const labels = pieces.map(piece => ({
      barcode: piece.barcode,
      uniqueCode: piece.uniqueCode,
      ipn: piece.ipn,
      productName: piece.productId?.itemName || '',
      designNo: piece.productId?.designNo || '',
      itemCode: piece.productId?.itemCode || '',
      brand: piece.productId?.brandId?.name || '',
      category: piece.productId?.categoryId?.name || '',
      size: piece.size,
      mrp: piece.mrp,
      color: piece.primaryColor,
      firm: piece.firmId?.name || ''
    }));

    return {
      billId,
      totalLabels: labels.length,
      labels
    };
  }
}

module.exports = BarcodeService;

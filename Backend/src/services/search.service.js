const mongoose = require('mongoose');
const ApiError = require('../helpers/ApiError');
const InventoryPiece = require('../models/InventoryPiece');
const Product = require('../models/Product');
const PurchaseBill = require('../models/purchase/PurchaseBill');
const PurchaseItem = require('../models/purchase/PurchaseItem');
const Vendor = require('../models/masters/Vendor');

class SearchService {
  /**
   * Search by barcode — returns inventory piece with full product details
   */
  static async searchByBarcode(barcode, tenantId) {
    const cleanBarcode = String(barcode || '').trim();
    if (!cleanBarcode) {
      throw new ApiError(400, 'Barcode query parameter is required.');
    }

    const barcodeRegex = new RegExp('^' + cleanBarcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');

    let piece = await InventoryPiece.findOne({
      tenantId,
      isDeleted: false,
      $or: [
        { barcode: barcodeRegex },
        { uniqueCode: barcodeRegex },
        { ipn: barcodeRegex }
      ]
    })
      .populate({
        path: 'productId',
        populate: { path: 'brandId categoryId gstId hsnId firmId' }
      })
      .populate('warehouseId firmId purchaseBillId');

    if (!piece) {
      // Check partial barcode match on piece
      piece = await InventoryPiece.findOne({
        tenantId,
        isDeleted: false,
        barcode: new RegExp(cleanBarcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      })
      .populate({
        path: 'productId',
        populate: { path: 'brandId categoryId gstId hsnId firmId' }
      })
      .populate('warehouseId firmId purchaseBillId');
    }

    if (!piece) {
      // Check Product collection directly
      let product = null;
      if (mongoose.Types.ObjectId.isValid(cleanBarcode)) {
        product = await Product.findOne({ _id: cleanBarcode, tenantId, isDeleted: false })
          .populate('brandId categoryId gstId hsnId firmId');
      }

      if (!product) {
        product = await Product.findOne({
          tenantId,
          isDeleted: false,
          $or: [
            { barcode: barcodeRegex },
            { itemCode: barcodeRegex },
            { designNo: barcodeRegex },
            { barcode: new RegExp(cleanBarcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            { designNo: new RegExp(cleanBarcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            { itemName: new RegExp(cleanBarcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
          ]
        }).populate('brandId categoryId gstId hsnId firmId');
      }

      if (!product && (cleanBarcode.toLowerCase().startsWith('prd-') || cleanBarcode.toLowerCase().startsWith('prod-'))) {
        const hexSuffix = cleanBarcode.replace(/^prd-|^prod-/i, '').trim().toLowerCase();
        if (hexSuffix.length >= 4) {
          const allProducts = await Product.find({ tenantId, isDeleted: false })
            .populate('brandId categoryId gstId hsnId firmId');
          product = allProducts.find(p => p._id.toString().toLowerCase().endsWith(hexSuffix));
        }
      }

      if (product) {
        return { type: 'product', result: product };
      }

      throw new ApiError(404, `No results found for barcode '${cleanBarcode}'.`);
    }

    return { type: 'inventory_piece', result: piece };
  }

  /**
   * Search by design number — returns matching products and their inventory pieces
   */
  static async searchByDesignNo(designNo, tenantId) {
    const products = await Product.find({
      tenantId,
      designNo: new RegExp(designNo, 'i'),
      isDeleted: false
    }).populate('brandId categoryId');

    const productIds = products.map(p => p._id);

    const pieces = await InventoryPiece.find({
      tenantId,
      productId: { $in: productIds },
      isDeleted: false
    })
      .populate('warehouseId firmId')
      .sort({ createdAt: -1 })
      .limit(100);

    return {
      type: 'design_search',
      products,
      inventoryCount: pieces.length,
      pieces
    };
  }

  /**
   * Search by item code — returns matching products and inventory
   */
  static async searchByItemCode(itemCode, tenantId) {
    const products = await Product.find({
      tenantId,
      itemCode: new RegExp(itemCode, 'i'),
      isDeleted: false
    }).populate('brandId categoryId');

    const productIds = products.map(p => p._id);

    const pieces = await InventoryPiece.find({
      tenantId,
      productId: { $in: productIds },
      isDeleted: false
    })
      .populate('warehouseId firmId')
      .sort({ createdAt: -1 })
      .limit(100);

    return {
      type: 'item_code_search',
      products,
      inventoryCount: pieces.length,
      pieces
    };
  }

  /**
   * Search by IPN (Item Piece Number)
   */
  static async searchByIpn(ipn, tenantId) {
    const pieces = await InventoryPiece.find({
      tenantId,
      ipn: new RegExp(ipn, 'i'),
      isDeleted: false
    })
      .populate({
        path: 'productId',
        populate: { path: 'brandId categoryId' }
      })
      .populate('warehouseId firmId')
      .limit(50);

    return { type: 'ipn_search', count: pieces.length, pieces };
  }

  /**
   * Search by vendor — returns vendor details and their purchase bills
   */
  static async searchByVendor(vendorId, tenantId) {
    const vendor = await Vendor.findOne({ _id: vendorId, tenantId, isDeleted: false });
    if (!vendor) {
      throw new ApiError(404, `Vendor not found.`);
    }

    const bills = await PurchaseBill.find({
      tenantId,
      vendorId,
      isDeleted: false
    })
      .populate('firmId warehouseId')
      .sort({ billDate: -1 })
      .limit(50);

    const totalPurchaseAmount = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return {
      type: 'vendor_search',
      vendor,
      totalBills: bills.length,
      totalPurchaseAmount,
      bills
    };
  }

  /**
   * Search by bill number — returns purchase bill with items and pieces
   */
  static async searchByBillNo(billNo, tenantId) {
    const bill = await PurchaseBill.findOne({
      tenantId,
      billNo: new RegExp(billNo, 'i'),
      isDeleted: false
    }).populate('vendorId firmId warehouseId');

    if (!bill) {
      throw new ApiError(404, `No purchase bill found for bill number '${billNo}'.`);
    }

    const items = await PurchaseItem.find({
      purchaseBillId: bill._id,
      tenantId
    }).populate('productId');

    const pieces = await InventoryPiece.find({
      purchaseBillId: bill._id,
      tenantId,
      isDeleted: false
    }).select('barcode uniqueCode status mrp purchaseRate size primaryColor');

    return {
      type: 'bill_search',
      bill,
      items,
      pieces,
      totalPieces: pieces.length
    };
  }
}

module.exports = SearchService;

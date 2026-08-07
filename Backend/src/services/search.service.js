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
    const piece = await InventoryPiece.findOne({ barcode, tenantId, isDeleted: false })
      .populate({
        path: 'productId',
        populate: { path: 'brandId categoryId gstId hsnId' }
      })
      .populate('warehouseId firmId purchaseBillId');

    if (!piece) {
      throw new ApiError(404, `No results found for barcode '${barcode}'.`);
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

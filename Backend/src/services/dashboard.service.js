const mongoose = require('mongoose');
const SaleBill = require('../models/billing/SaleBill');
const PurchaseBill = require('../models/purchase/PurchaseBill');
const InventoryPiece = require('../models/InventoryPiece');
const Customer = require('../models/crm/Customer');
const Alteration = require('../models/alteration/Alteration');
const Return = require('../models/return/Return');
const { INVENTORY_STATUS, BILL_STATUS, ALTERATION_STATUS } = require('../constants/status');

class DashboardService {
  static async getOwnerDashboard(tenantId) {
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Today's Sales
    const todaySales = await SaleBill.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          billDate: { $gte: todayStart, $lte: todayEnd },
          status: { $ne: BILL_STATUS.CANCELLED },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$paidAmount' },
          totalDue: { $sum: '$dueAmount' },
          billsCount: { $sum: 1 }
        }
      }
    ]);

    // 2. Pending Alterations
    const pendingAlterations = await Alteration.countDocuments({
      tenantId: tenantObjectId,
      status: { $in: [ALTERATION_STATUS.RECEIVED, ALTERATION_STATUS.IN_PROGRESS] },
      isDeleted: false
    });

    // 3. Pending Returns / Returns Count
    const pendingReturns = await Return.countDocuments({
      tenantId: tenantObjectId,
      isDeleted: false
    });

    // 4. Low Stock Count (available pieces per product <= 5)
    const lowStockCount = await InventoryPiece.aggregate([
      { $match: { tenantId: tenantObjectId, status: INVENTORY_STATUS.AVAILABLE, isDeleted: false } },
      { $group: { _id: '$productId', count: { $sum: 1 } } },
      { $match: { count: { $lte: 5 } } },
      { $count: 'lowStockProducts' }
    ]);

    // 5. Outstanding Customer Dues
    const customerDues = await Customer.aggregate([
      { $match: { tenantId: tenantObjectId, isDeleted: false } },
      { $group: { _id: null, totalDue: { $sum: '$dueBalance' }, totalAdvance: { $sum: '$advanceBalance' } } }
    ]);

    // 6. Purchase Summary
    const purchaseSummary = await PurchaseBill.aggregate([
      { $match: { tenantId: tenantObjectId, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalPurchaseAmount: { $sum: '$totalAmount' },
          totalBills: { $sum: 1 }
        }
      }
    ]);

    // 7. Inventory Overview
    const stockStats = await InventoryPiece.aggregate([
      { $match: { tenantId: tenantObjectId, isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalMRPValue: { $sum: '$mrp' }
        }
      }
    ]);

    return {
      todaysSales: {
        revenue: todaySales[0]?.totalRevenue || 0,
        paid: todaySales[0]?.totalPaid || 0,
        due: todaySales[0]?.totalDue || 0,
        billsCount: todaySales[0]?.billsCount || 0
      },
      pendingAlterations,
      pendingReturns,
      lowStockProductsCount: lowStockCount[0]?.lowStockProducts || 0,
      outstandingDue: customerDues[0]?.totalDue || 0,
      customerAdvanceBalance: customerDues[0]?.totalAdvance || 0,
      purchaseSummary: {
        totalAmount: purchaseSummary[0]?.totalPurchaseAmount || 0,
        totalBills: purchaseSummary[0]?.totalBills || 0
      },
      inventoryOverview: stockStats
    };
  }
  static async getInventorySummary(tenantId) {
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    return InventoryPiece.aggregate([
      { $match: { tenantId: tenantObjectId, isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalMRPValue: { $sum: '$mrp' } } }
    ]);
  }

  static async getPurchaseSummary(tenantId) {
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    return PurchaseBill.aggregate([
      { $match: { tenantId: tenantObjectId, isDeleted: false } },
      { $group: { _id: '$status', totalAmount: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);
  }

  static async getStockByBrand(tenantId) {
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    return InventoryPiece.aggregate([
      { $match: { tenantId: tenantObjectId, isDeleted: false, status: INVENTORY_STATUS.AVAILABLE } },
      { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $lookup: { from: 'brands', localField: 'product.brandId', foreignField: '_id', as: 'brand' } },
      { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$brand.name', count: { $sum: 1 }, totalMRPValue: { $sum: '$mrp' } } }
    ]);
  }

  static async getStockByCategory(tenantId) {
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    return InventoryPiece.aggregate([
      { $match: { tenantId: tenantObjectId, isDeleted: false, status: INVENTORY_STATUS.AVAILABLE } },
      { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $lookup: { from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$category.name', count: { $sum: 1 }, totalMRPValue: { $sum: '$mrp' } } }
    ]);
  }

  static async getStockByFirm(tenantId) {
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    return InventoryPiece.aggregate([
      { $match: { tenantId: tenantObjectId, isDeleted: false, status: INVENTORY_STATUS.AVAILABLE } },
      { $lookup: { from: 'firms', localField: 'firmId', foreignField: '_id', as: 'firm' } },
      { $unwind: { path: '$firm', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$firm.name', count: { $sum: 1 }, totalMRPValue: { $sum: '$mrp' } } }
    ]);
  }

  static async getLowStock(tenantId) {
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    return InventoryPiece.aggregate([
      { $match: { tenantId: tenantObjectId, status: INVENTORY_STATUS.AVAILABLE, isDeleted: false } },
      { $group: { _id: '$productId', count: { $sum: 1 } } },
      { $match: { count: { $lte: 5 } } },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { _id: 1, count: 1, itemName: '$product.itemName', itemCode: '$product.itemCode' } }
    ]);
  }
}

module.exports = DashboardService;

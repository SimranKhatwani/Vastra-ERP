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

  static async getMorningActions(tenantId) {
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    const PSSMItem = require('../models/PSSM/PSSMItem');
    const Alteration = require('../models/alteration/Alteration');
    const Customer = require('../models/crm/Customer');
    const Attendance = require('../models/Attendance');
    const Notification = require('../models/Notification');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const deliveredStatuses = ['COLLECTED', 'CLOSED', 'DELIVERED', 'Delivered', 'Completed'];
    const readyStatuses = ['READY', 'READY_FOR_DELIVERY', 'Ready for Delivery', 'Ready for Trial'];

    // 1. 🔴 Overdue Deliveries
    const [overduePssm, overdueAlt] = await Promise.all([
      PSSMItem.find({
        tenantId: tenantObjectId,
        deliveryDate: { $lt: todayStart },
        status: { $nin: deliveredStatuses }
      }).lean().catch(() => []),
      Alteration.find({
        tenantId: tenantObjectId,
        deliveryDate: { $lt: todayStart },
        status: { $nin: deliveredStatuses },
        isDeleted: false
      }).lean().catch(() => [])
    ]);
    const overdueDeliveriesCount = (overduePssm?.length || 0) + (overdueAlt?.length || 0);

    // 2. 🟡 Deliveries Due Today
    const [todayDuePssm, todayDueAlt] = await Promise.all([
      PSSMItem.find({
        tenantId: tenantObjectId,
        deliveryDate: { $gte: todayStart, $lte: todayEnd },
        status: { $nin: deliveredStatuses }
      }).lean().catch(() => []),
      Alteration.find({
        tenantId: tenantObjectId,
        deliveryDate: { $gte: todayStart, $lte: todayEnd },
        status: { $nin: deliveredStatuses },
        isDeleted: false
      }).lean().catch(() => [])
    ]);
    const todayDueCount = (todayDuePssm?.length || 0) + (todayDueAlt?.length || 0);

    // 3. 🟠 VIP Customers Pending
    let vipPendingCount = 0;
    try {
      const vipCustomers = await Customer.find({
        tenantId: tenantObjectId,
        $or: [
          { isVIP: true },
          { vip: true },
          { membershipTier: { $regex: /vip|gold|platinum/i } },
          { loyaltyPoints: { $gte: 500 } },
          { totalSpent: { $gte: 25000 } }
        ]
      }).select('_id name phone').lean();

      if (vipCustomers && vipCustomers.length > 0) {
        const vipCustomerIds = vipCustomers.map(c => c._id);
        const vipCustomerPhones = vipCustomers.map(c => c.phone).filter(Boolean);

        const [vipPssm, vipAlt] = await Promise.all([
          PSSMItem.countDocuments({
            tenantId: tenantObjectId,
            status: { $nin: deliveredStatuses },
            $or: [
              { customerId: { $in: vipCustomerIds } },
              { customerPhone: { $in: vipCustomerPhones } }
            ]
          }).catch(() => 0),
          Alteration.countDocuments({
            tenantId: tenantObjectId,
            status: { $nin: deliveredStatuses },
            isDeleted: false,
            $or: [
              { customerId: { $in: vipCustomerIds } },
              { customerPhone: { $in: vipCustomerPhones } }
            ]
          }).catch(() => 0)
        ]);
        vipPendingCount = vipPssm + vipAlt;
      }
    } catch (e) {
      vipPendingCount = 0;
    }

    // 4. 🔵 Salesmen Absent (Work Reassigned)
    let salesmenAbsentCount = 0;
    let reassignedItemsCount = 0;
    try {
      const absentRecords = await Attendance.find({
        tenantId: tenantObjectId,
        date: { $gte: todayStart, $lte: todayEnd },
        status: 'ABSENT'
      }).lean();

      reassignedItemsCount = await PSSMItem.countDocuments({
        tenantId: tenantObjectId,
        reassignedFromSalesmanId: { $ne: null },
        status: { $nin: deliveredStatuses }
      }).catch(() => 0);

      salesmenAbsentCount = Math.max(absentRecords?.length || 0, reassignedItemsCount > 0 ? 1 : 0);
    } catch (e) {
      salesmenAbsentCount = 0;
    }

    // 5. 🟢 Customers Waiting for Collection
    let customersWaitingCollectionCount = 0;
    try {
      const [readyPssm, readyAlt] = await Promise.all([
        PSSMItem.countDocuments({
          tenantId: tenantObjectId,
          status: { $in: readyStatuses }
        }).catch(() => 0),
        Alteration.countDocuments({
          tenantId: tenantObjectId,
          status: { $in: readyStatuses },
          isDeleted: false
        }).catch(() => 0)
      ]);
      customersWaitingCollectionCount = readyPssm + readyAlt;
    } catch (e) {
      customersWaitingCollectionCount = 0;
    }

    // 6. ⚠️ Tailors at Full Capacity (Active jobs >= 8 or capacity >= 90%)
    let fullCapacityTailorsCount = 0;
    try {
      const tailorWorkloads = await Alteration.aggregate([
        {
          $match: {
            tenantId: tenantObjectId,
            status: { $nin: deliveredStatuses },
            isDeleted: false,
            tailorName: { $exists: true, $ne: '' }
          }
        },
        {
          $group: {
            _id: '$tailorName',
            activeJobs: { $sum: 1 }
          }
        }
      ]);
      fullCapacityTailorsCount = tailorWorkloads.filter(t => t.activeJobs >= 8).length;
    } catch (e) {
      fullCapacityTailorsCount = 0;
    }

    // 7. 📩 Customer Messages Failed
    let failedMessagesCount = 0;
    try {
      failedMessagesCount = await Notification.countDocuments({
        tenantId: tenantObjectId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        $or: [
          { status: 'FAILED' },
          { priority: 'Critical', category: { $regex: /failed|undelivered|error/i } },
          { message: { $regex: /failed|undelivered|error/i } }
        ]
      }).catch(() => 0);
    } catch (e) {
      failedMessagesCount = 0;
    }

    // 8. 🔁 Re-Alter Cases Registered Today
    let reAlterCasesTodayCount = 0;
    try {
      const [reAlterPssm, reAlterAlt] = await Promise.all([
        PSSMItem.countDocuments({
          tenantId: tenantObjectId,
          createdAt: { $gte: todayStart, $lte: todayEnd },
          $or: [
            { priority: 'URGENT' },
            { serviceType: { $regex: /re-alter|realter|repair|trial/i } }
          ]
        }).catch(() => 0),
        Alteration.countDocuments({
          tenantId: tenantObjectId,
          createdAt: { $gte: todayStart, $lte: todayEnd },
          isDeleted: false,
          $or: [
            { priority: { $regex: /urgent|high/i } },
            { alterationType: { $regex: /re-alter|realter|repair|trial/i } },
            { serviceType: { $regex: /re-alter|realter|repair|trial/i } }
          ]
        }).catch(() => 0)
      ]);
      reAlterCasesTodayCount = reAlterPssm + reAlterAlt;
    } catch (e) {
      reAlterCasesTodayCount = 0;
    }

    return {
      overdueDeliveries: overdueDeliveriesCount,
      deliveriesDueToday: todayDueCount,
      vipCustomersPending: vipPendingCount,
      salesmenAbsent: salesmenAbsentCount,
      reassignedWorkCount: reassignedItemsCount,
      customersWaitingCollection: customersWaitingCollectionCount,
      tailorsAtFullCapacity: fullCapacityTailorsCount,
      customerMessagesFailed: failedMessagesCount,
      reAlterCasesToday: reAlterCasesTodayCount
    };
  }
}

module.exports = DashboardService;

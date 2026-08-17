const mongoose = require('mongoose');
const SaleBill = require('../models/billing/SaleBill');
const PurchaseBill = require('../models/purchase/PurchaseBill');
const InventoryPiece = require('../models/InventoryPiece');
const PaymentTransaction = require('../models/payments/PaymentTransaction');
const Alteration = require('../models/alteration/Alteration');
const Return = require('../models/return/Return');
const Customer = require('../models/crm/Customer');

class ReportService {
  /**
   * Sales Report
   */
  static async getSalesReport(startDate, endDate, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (startDate || endDate) {
      filter.billDate = {};
      if (startDate) filter.billDate.$gte = new Date(startDate);
      if (endDate) filter.billDate.$lte = new Date(endDate);
    }

    const bills = await SaleBill.find(filter)
      .populate('customerId firmId salesmanId')
      .sort({ billDate: -1 });

    const totalSales = bills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const totalDiscount = bills.reduce((sum, b) => sum + (b.discountAmount || 0), 0);
    const totalPaid = bills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    const totalDue = bills.reduce((sum, b) => sum + (b.dueAmount || 0), 0);

    return {
      summary: {
        totalBills: bills.length,
        totalSales,
        totalDiscount,
        totalPaid,
        totalDue
      },
      bills
    };
  }

  /**
   * Purchase Report
   */
  static async getPurchaseReport(startDate, endDate, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (startDate || endDate) {
      filter.billDate = {};
      if (startDate) filter.billDate.$gte = new Date(startDate);
      if (endDate) filter.billDate.$lte = new Date(endDate);
    }

    const bills = await PurchaseBill.find(filter)
      .populate('vendorId firmId warehouseId')
      .sort({ billDate: -1 });

    const totalPurchaseAmount = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return {
      summary: {
        totalBills: bills.length,
        totalPurchaseAmount
      },
      bills
    };
  }

  /**
   * Inventory Report
   */
  static async getInventoryReport(tenantId) {
    const pieces = await InventoryPiece.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalMRPValue: { $sum: '$mrp' },
          totalPurchaseRateValue: { $sum: '$purchaseRate' }
        }
      }
    ]);
    return pieces;
  }

  /**
   * GST Report
   */
  static async getGSTReport(startDate, endDate, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (startDate || endDate) {
      filter.billDate = {};
      if (startDate) filter.billDate.$gte = new Date(startDate);
      if (endDate) filter.billDate.$lte = new Date(endDate);
    }

    const salesBills = await SaleBill.find(filter);
    const purchaseBills = await PurchaseBill.find(filter);

    const totalSalesGST = salesBills.reduce((sum, b) => sum + (b.taxAmount || 0), 0);
    const totalPurchaseGST = purchaseBills.reduce((sum, b) => sum + (b.gst || 0), 0);

    return {
      outputGST: totalSalesGST,
      inputGST: totalPurchaseGST,
      netGSTPayable: Math.max(0, totalSalesGST - totalPurchaseGST)
    };
  }

  /**
   * Customer CRM Report
   */
  static async getCustomerReport(tenantId) {
    const totalCustomers = await Customer.countDocuments({ tenantId, isDeleted: false });
    const topCustomers = await Customer.find({ tenantId, isDeleted: false })
      .sort({ dueBalance: -1 })
      .limit(20);

    return {
      totalCustomers,
      topCustomers
    };
  }

  /**
   * Payment Report
   */
  static async getPaymentReport(startDate, endDate, tenantId) {
    const filter = { tenantId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const transactions = await PaymentTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$mode',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    return transactions;
  }

  /**
   * Alteration Report
   */
  static async getAlterationReport(tenantId) {
    const alterations = await Alteration.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalCharges' }
        }
      }
    ]);
    return alterations;
  }

  /**
   * Return Report
   */
  static async getReturnReport(tenantId) {
    const returns = await Return.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), isDeleted: false } },
      {
        $group: {
          _id: '$refundMode',
          count: { $sum: 1 },
          totalRefundAmount: { $sum: '$refundAmount' }
        }
      }
    ]);
    return returns;
  }

  /**
   * Manual Adjustments Report
   */
  static async getManualAdjustmentsReport(startDate, endDate, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (startDate || endDate) {
      filter.billDate = {};
      if (startDate) filter.billDate.$gte = new Date(startDate);
      if (endDate) filter.billDate.$lte = new Date(endDate);
    }
    filter.$or = [
      { manualDiscountAmount: { $gt: 0 } },
      { manualChargeAmount: { $gt: 0 } }
    ];

    const bills = await SaleBill.find(filter)
      .populate('customerId')
      .sort({ billDate: -1 })
      .select('billNo billDate grandTotal manualDiscountAmount manualChargeAmount manualAdjustmentReason customerId');

    const totalManualDiscounts = bills.reduce((sum, b) => sum + (b.manualDiscountAmount || 0), 0);
    const totalManualCharges = bills.reduce((sum, b) => sum + (b.manualChargeAmount || 0), 0);

    return {
      summary: {
        totalAdjustedBills: bills.length,
        totalManualDiscounts,
        totalManualCharges
      },
      bills
    };
  }
}

module.exports = ReportService;

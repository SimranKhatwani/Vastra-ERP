const mongoose = require('mongoose');
const SaleBill = require('../models/billing/SaleBill');
const PurchaseBill = require('../models/purchase/PurchaseBill');
const InventoryPiece = require('../models/InventoryPiece');
const PaymentTransaction = require('../models/payments/PaymentTransaction');
const Alteration = require('../models/alteration/Alteration');
const TailoringJob = require('../models/tailoring/TailoringJob');
const PSSMItem = require('../models/PSSM/PSSMItem');
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
   * Tailoring reports share one normalized job source so every report includes
   * both showroom alterations and customer-owned custom tailoring tickets.
   */
  static async getTailoringReport(reportType, startDate, endDate, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (startDate || endDate) {
      filter.jobDate = {};
      if (startDate) filter.jobDate.$gte = new Date(startDate);
      if (endDate) {
        const inclusiveEnd = new Date(endDate);
        inclusiveEnd.setDate(inclusiveEnd.getDate() + 1);
        filter.jobDate.$lt = inclusiveEnd;
      }
    }

    const jobs = await TailoringJob.find(filter).sort({ jobDate: -1 }).lean();
    const jobItemIds = jobs.map(job => job.pssmItemId).filter(Boolean);
    const jobItems = await PSSMItem.find({ tenantId, _id: { $in: jobItemIds } }).populate('pssmId').lean();
    const itemByJobId = new Map(jobItems.map(item => [item._id.toString(), item]));
    const getTailorName = (job) => {
      const item = itemByJobId.get(job.pssmItemId?.toString());
      return job.tailorName || item?.assignedTo || item?.pssmId?.tailorName || 'Unassigned';
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const normalize = (value) => String(value || '').toLowerCase().replace(/[\s_-]/g, '');
    const isPending = (job) => !['ready', 'delivered', 'cancelled'].includes(normalize(job.currentStatus));
    const isCompleted = (job) => ['delivered', 'ready'].includes(normalize(job.currentStatus));
    const baseRow = (job) => ({
      _id: job._id,
      id: job._id,
      alterationId: job.tailorInvoiceNo || String(job._id),
      tailorInvoiceNo: job.tailorInvoiceNo,
      invoiceNumber: job.tailorInvoiceNo,
      jobDate: job.jobDate,
      customerName: job.customerName || 'Walk-in Customer',
      mobileNumber: job.mobileNumber || '',
      customerPhone: job.mobileNumber || '',
      tailorName: getTailorName(job),
      priority: itemByJobId.get(job.pssmItemId?.toString())?.priority || 'Normal',
      status: job.currentStatus,
      garmentService: job.garmentService || 'Tailoring',
      productName: job.garmentService || 'Tailoring',
      tailoringCharges: job.tailoringCharges || 0,
      charge: job.tailoringCharges || 0,
      advancePaid: job.advancePaid || 0,
      balance: job.balance || 0,
      expectedDeliveryDate: job.expectedDeliveryDate || '',
      deliveryDate: job.expectedDeliveryDate || '',
      pssmItemId: job.pssmItemId
    });

    let data;
    switch (reportType) {
      case 'daily_tailoring_jobs':
        data = jobs.map(baseRow);
        break;
      case 'pending_tailoring_jobs':
        data = jobs.filter(isPending).map(baseRow);
        break;
      case 'overdue_tailoring_jobs':
        data = jobs.filter(job => isPending(job) && job.expectedDeliveryDate && new Date(job.expectedDeliveryDate) < today).map(baseRow);
        break;
      case 'ready_not_collected':
        data = jobs.filter(job => normalize(job.currentStatus) === 'ready').map(baseRow);
        break;
      case 'tailor_workload': {
        const grouped = new Map();
        jobs.filter(isPending).forEach(job => {
          const name = getTailorName(job);
          const row = grouped.get(name) || { tailorName: name, pendingJobs: 0, totalCharges: 0 };
          row.pendingJobs += 1;
          row.totalCharges += Number(job.tailoringCharges || 0);
          grouped.set(name, row);
        });
        data = [...grouped.values()].sort((a, b) => b.pendingJobs - a.pendingJobs);
        break;
      }
      case 'tailor_completed_jobs': {
        const grouped = new Map();
        jobs.filter(isCompleted).forEach(job => {
          const name = getTailorName(job);
          const row = grouped.get(name) || { tailorName: name, completedJobs: 0, totalCharges: 0 };
          row.completedJobs += 1;
          row.totalCharges += Number(job.tailoringCharges || 0);
          grouped.set(name, row);
        });
        data = [...grouped.values()].sort((a, b) => b.completedJobs - a.completedJobs);
        break;
      }
      case 'realteration': {
        const items = await PSSMItem.find({ tenantId, isDeleted: false, status: { $in: ['RE_ALTERATION', 'Re-Alteration', 'REWORK'] } })
          .populate('pssmId').lean();
        data = items.map(item => ({
          pssmNo: item.pssmId?.pssmNo || '',
          tailorInvoiceNo: item.tailorInvoiceNo || '',
          customerName: item.pssmId?.customerName || 'Walk-in Customer',
          mobileNumber: item.pssmId?.customerPhone || '',
          garment: item.productName || item.pieceName || 'Garment Item',
          tailorName: item.assignedTo || item.pssmId?.tailorName || 'Unassigned',
          priority: item.priority || 'Normal',
          status: item.status,
          instructions: item.instructions || '',
          createdAt: item.createdAt
        }));
        break;
      }
      case 'tailoring_charges':
        data = jobs.map(job => ({
          tailorInvoiceNo: job.tailorInvoiceNo,
          jobDate: job.jobDate,
          customerName: job.customerName || 'Walk-in Customer',
          tailorName: getTailorName(job),
          status: job.currentStatus,
          tailoringCharges: job.tailoringCharges || 0,
          advancePaid: job.advancePaid || 0,
          balance: job.balance || 0
        }));
        break;
      case 'customer_tailoring_history': {
        const grouped = new Map();
        jobs.forEach(job => {
          const key = job.mobileNumber || job.customerName || 'Walk-in Customer';
          const row = grouped.get(key) || { customerName: job.customerName || 'Walk-in Customer', mobileNumber: job.mobileNumber || '', totalJobs: 0, completedJobs: 0, totalCharges: 0, lastJobDate: job.jobDate };
          row.totalJobs += 1;
          row.completedJobs += isCompleted(job) ? 1 : 0;
          row.totalCharges += Number(job.tailoringCharges || 0);
          if (new Date(job.jobDate || 0) > new Date(row.lastJobDate || 0)) row.lastJobDate = job.jobDate;
          grouped.set(key, row);
        });
        data = [...grouped.values()].sort((a, b) => new Date(b.lastJobDate || 0) - new Date(a.lastJobDate || 0));
        break;
      }
      default:
        data = jobs.map(baseRow);
    }

    return {
      summary: {
        totalRecords: data.length,
        totalCharges: data.reduce((sum, row) => sum + Number(row.tailoringCharges || row.totalCharges || 0), 0),
        pendingJobs: jobs.filter(isPending).length,
        readyNotCollected: jobs.filter(job => normalize(job.currentStatus) === 'ready').length
      },
      data
    };
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

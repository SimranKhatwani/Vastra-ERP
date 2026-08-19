const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const DashboardService = require('../services/dashboard.service');

class DashboardController {
  static getOwnerDashboard = asyncHandler(async (req, res) => {
    const metrics = await DashboardService.getOwnerDashboard(req.tenantId);
    return res.status(200).json(new ApiResponse(200, metrics, 'Owner dashboard metrics loaded.'));
  });
  static getInventorySummary = asyncHandler(async (req, res) => {
    const summary = await DashboardService.getInventorySummary(req.tenantId);
    return res.status(200).json(new ApiResponse(200, summary, 'Inventory summary loaded.'));
  });

  static getPurchaseSummary = asyncHandler(async (req, res) => {
    const summary = await DashboardService.getPurchaseSummary(req.tenantId);
    return res.status(200).json(new ApiResponse(200, summary, 'Purchase summary loaded.'));
  });

  static getStockByBrand = asyncHandler(async (req, res) => {
    const summary = await DashboardService.getStockByBrand(req.tenantId);
    return res.status(200).json(new ApiResponse(200, summary, 'Stock by brand loaded.'));
  });

  static getStockByCategory = asyncHandler(async (req, res) => {
    const summary = await DashboardService.getStockByCategory(req.tenantId);
    return res.status(200).json(new ApiResponse(200, summary, 'Stock by category loaded.'));
  });

  static getStockByFirm = asyncHandler(async (req, res) => {
    const summary = await DashboardService.getStockByFirm(req.tenantId);
    return res.status(200).json(new ApiResponse(200, summary, 'Stock by firm loaded.'));
  });

  static getLowStock = asyncHandler(async (req, res) => {
    const summary = await DashboardService.getLowStock(req.tenantId);
    return res.status(200).json(new ApiResponse(200, summary, 'Low stock summary loaded.'));
  });

  static getStaffSummary = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;
    const Salesman = require('../models/masters/Salesman');
    const SaleBill = require('../models/billing/SaleBill');
    const Tenant = require('../models/Tenant');
    const User = require('../models/User');

    const tenant = await Tenant.findById(tenantId).lean();
    const settings = tenant?.commissionSettings || {};

    // Find the logged-in user's full record to get designation
    const userRecord = await User.findById(req.user.id).populate('roleId').lean();
    const userDesignation = (userRecord?.designation || '').toLowerCase();
    const userRoleName = (userRecord?.roleId?.name || '').toLowerCase();

    const salesman = await Salesman.findOne({
      tenantId,
      $or: [
        { phone: req.user.phone },
        { email: req.user.email },
        { name: req.user.name }
      ]
    });

    if (!salesman) {
      return res.status(200).json(new ApiResponse(200, {
        commissionRate: 0,
        totalSales: 0,
        commissionAmount: 0,
        invoiceCount: 0,
        todaySales: 0,
        todayBillsCount: 0,
        attendanceRate: 100,
        invoices: [],
        designation: userDesignation || '',
        role: userRoleName || ''
      }, 'Staff summary loaded (No salesperson record found).'));
    }

    // Determine if this user is a worker based on designation
    const salesmanDesig = (salesman.designation || '').toLowerCase();
    const isWorker = ['worker', 'tailor', 'fitter', 'stitcher', 'floorworker', 'productionworker'].some(w =>
      userDesignation.includes(w) || salesmanDesig.includes(w) || userRoleName.includes(w)
    );

    const bills = await SaleBill.find({ tenantId, salesmanId: salesman._id, isDeleted: false })
      .populate('customerId')
      .sort({ createdAt: -1 })
      .lean();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let totalSales = 0;
    let todaySales = 0;
    let todayBillsCount = 0;

    bills.forEach(bill => {
      totalSales += bill.grandTotal || 0;
      const bDate = new Date(bill.billDate || bill.createdAt);
      if (bDate >= todayStart && bDate <= todayEnd) {
        todaySales += bill.grandTotal || 0;
        todayBillsCount++;
      }
    });

    // Use correct rate based on worker vs salesperson
    const commRate = isWorker
      ? (settings.workerPercentage !== undefined ? settings.workerPercentage : 0.5)
      : (settings.salespersonPercentage !== undefined ? settings.salespersonPercentage : (salesman.commissionPercentage || 1.5));
    const commAmt = totalSales * (commRate / 100);

    const data = {
      commissionRate: commRate,
      totalSales: totalSales,
      commissionAmount: commAmt,
      invoiceCount: bills.length,
      todaySales: todaySales,
      todayBillsCount: todayBillsCount,
      attendanceRate: 98,
      designation: userDesignation || salesmanDesig || '',
      role: userRoleName || '',
      invoices: bills.map(b => ({
        ...b,
        id: b._id.toString(),
        invoiceNo: b.billNo,
        customerName: b.customerId?.name || 'Walk-in'
      }))
    };

    return res.status(200).json(new ApiResponse(200, data, 'Staff summary dashboard loaded.'));
  });
}

module.exports = DashboardController;

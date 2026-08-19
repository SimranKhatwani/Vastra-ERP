const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const Commission = require('../models/Commission');
const CommissionService = require('../services/commission.service');
const Tenant = require('../models/Tenant');

class CommissionController {
  /**
   * GET /commissions/staff/history
   * Returns list of all commission records from the Commission collection (with auto-sync)
   */
  static getCommissionHistory = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;

    // Automatically ensure all bills and alterations are synced to the Commission collection
    await CommissionService.syncCommissionsForTenant(tenantId);

    const commissions = await Commission.find({ tenantId, isDeleted: false })
      .sort({ date: -1 })
      .lean();

    const historyList = commissions.map(c => ({
      _id: c._id.toString(),
      userId: c.userId ? c.userId.toString() : null,
      employeeId: c.employeeId,
      employeeName: c.employeeName,
      employeeRole: c.employeeRole,
      sourceType: c.sourceType,
      quantity: c.quantity || 1,
      netAmountBasis: c.netAmountBasis,
      commissionPercentage: c.commissionPercentage,
      commissionAmount: c.commissionAmount,
      commissionPaidAmount: c.commissionPaidAmount || 0,
      commissionPendingAmount: c.commissionPendingAmount !== undefined ? c.commissionPendingAmount : Math.max(0, c.commissionAmount - (c.commissionPaidAmount || 0)),
      status: c.status,
      invoiceId: c.sourceId ? c.sourceId.toString() : '',
      invoiceNo: c.invoiceNo || 'N/A',
      productName: c.productName || 'Garment Item',
      createdAt: c.date || c.createdAt
    }));

    return res.status(200).json(new ApiResponse(200, historyList, 'Staff commissions history retrieved.'));
  });

  /**
   * PUT /commissions/staff/pay/:employeeId
   * Marks pending commissions of the employee as paid
   */
  static payStaffCommissions = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;
    const { employeeId } = req.params;
    const { employeeRole } = req.body;
    const paidAmount = req.body.paidAmount !== undefined && req.body.paidAmount !== null ? Number(req.body.paidAmount) : null;

    const result = await CommissionService.payStaffCommissions(tenantId, employeeId, employeeRole, paidAmount);

    return res.status(200).json(new ApiResponse(200, result, `Commissions updated. Paid: ₹${result.paidAmount}`));
  });

  /**
   * GET /commissions/staff/stats
   * Returns aggregated commission stats by role from the Commission collection
   */
  static getStaffStats = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;

    // Ensure sync before computing stats
    await CommissionService.syncCommissionsForTenant(tenantId);

    const commissions = await Commission.find({ tenantId, isDeleted: false, status: { $ne: 'Cancelled' } }).lean();

    let salespersonTotal = 0;
    let salespersonPending = 0;
    let workerTotal = 0;
    let workerPending = 0;

    commissions.forEach(c => {
      if (c.employeeRole === 'Salesperson') {
        salespersonTotal += c.commissionAmount || 0;
        salespersonPending += c.commissionPendingAmount !== undefined ? c.commissionPendingAmount : (c.commissionAmount - (c.commissionPaidAmount || 0));
      } else {
        workerTotal += c.commissionAmount || 0;
        workerPending += c.commissionPendingAmount !== undefined ? c.commissionPendingAmount : (c.commissionAmount - (c.commissionPaidAmount || 0));
      }
    });

    const data = {
      breakdown: [
        {
          _id: 'Salesperson',
          totalCommission: Number(salespersonTotal.toFixed(2)),
          pendingCommission: Number(salespersonPending.toFixed(2))
        },
        {
          _id: 'Worker',
          totalCommission: Number(workerTotal.toFixed(2)),
          pendingCommission: Number(workerPending.toFixed(2))
        }
      ]
    };

    return res.status(200).json(new ApiResponse(200, data, 'Staff commission stats loaded.'));
  });

  /**
   * GET /commissions/staff/settings
   * Loads the automated commission settings from Tenant
   */
  static getCommissionSettings = asyncHandler(async (req, res) => {
    const tenant = await Tenant.findById(req.tenantId);

    const settings = tenant?.commissionSettings || {
      isEnabled: false,
      salespersonPercentage: 1.5,
      workerPercentage: 0.5,
      calculationBasis: 'Selling Price'
    };

    return res.status(200).json(new ApiResponse(200, settings, 'Commission settings retrieved.'));
  });

  /**
   * PUT /commissions/staff/settings
   * Saves the automated commission settings to Tenant and immediately re-syncs all pending commissions
   */
  static updateCommissionSettings = asyncHandler(async (req, res) => {
    const { isEnabled, salespersonPercentage, workerPercentage, calculationBasis } = req.body;

    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
      return res.status(404).json(new ApiResponse(404, null, 'Tenant not found.'));
    }

    tenant.commissionSettings = {
      isEnabled: !!isEnabled,
      salespersonPercentage: Number(salespersonPercentage || 0),
      workerPercentage: Number(workerPercentage || 0),
      calculationBasis: calculationBasis || 'Selling Price'
    };

    await tenant.save();

    // Re-sync all pending commissions to match the newly saved configuration!
    await CommissionService.syncCommissionsForTenant(req.tenantId);

    return res.status(200).json(new ApiResponse(200, tenant.commissionSettings, 'Commission settings updated and synced successfully.'));
  });
}

module.exports = CommissionController;

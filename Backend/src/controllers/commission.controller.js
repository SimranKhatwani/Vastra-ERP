const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const SaleBill = require('../models/billing/SaleBill');
const SaleItem = require('../models/billing/SaleItem');
const Salesman = require('../models/masters/Salesman');
const Alteration = require('../models/alteration/Alteration');

class CommissionController {
  /**
   * GET /commissions/staff/history
   * Calculates and returns the list of all commissions for salesperson and worker roles
   */
  static getCommissionHistory = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;
    const historyList = [];

    const Tenant = require('../models/Tenant');
    const User = require('../models/User');
    const tenant = await Tenant.findById(tenantId).lean();
    const settings = tenant?.commissionSettings || {};
    const isAutoEnabled = settings.isEnabled;
    const globalSalespersonRate = settings.salespersonPercentage !== undefined ? settings.salespersonPercentage : 1.5;
    const globalWorkerRate = settings.workerPercentage !== undefined ? settings.workerPercentage : 0.5;

    const allUsers = await User.find({ tenantId, isDeleted: false }).lean();
    const usersMap = {};
    allUsers.forEach(u => {
      if (u.name) usersMap[u.name.toLowerCase().trim()] = u;
      if (u.phone) usersMap[u.phone.trim()] = u;
      if (u.email) usersMap[u.email.toLowerCase().trim()] = u;
    });

    // 1. Fetch Salesperson Commissions from Sale Bills
    const saleBills = await SaleBill.find({ tenantId, isDeleted: false, salesmanId: { $ne: null } })
      .populate('salesmanId')
      .lean();

    if (saleBills.length > 0) {
      const billIds = saleBills.map(b => b._id);
      const saleItems = await SaleItem.find({ tenantId, saleBillId: { $in: billIds } })
        .populate({
          path: 'inventoryPieceId',
          populate: { path: 'productId' }
        })
        .lean();

      // Index sale items by bill ID
      const itemsMap = {};
      saleItems.forEach(item => {
        const bId = item.saleBillId.toString();
        if (!itemsMap[bId]) itemsMap[bId] = [];
        itemsMap[bId].push(item);
      });

      saleBills.forEach(bill => {
        const salesman = bill.salesmanId;
        if (!salesman) return;

        // Resolve user record to check designation
        const matchUser = usersMap[salesman.name.toLowerCase().trim()] || 
                            (salesman.phone ? usersMap[salesman.phone.trim()] : null) || 
                            (salesman.email ? usersMap[salesman.email.toLowerCase().trim()] : null);
                            
        const userDesig = (matchUser?.designation || salesman.designation || matchUser?.role || '').toLowerCase();
        const isWorker = userDesig.includes('worker') || userDesig.includes('tailor') || userDesig.includes('fitter') || userDesig.includes('stitcher') || userDesig === 'worker';
        const employeeRole = isWorker ? 'Worker' : 'Salesperson';

        const billItems = itemsMap[bill._id.toString()] || [];
        
        let remainingBillPaid = bill.commissionPaidAmount || 0;

        billItems.forEach(item => {
          const piece = item.inventoryPieceId || {};
          const product = piece.productId || {};
          const price = item.finalPrice || item.sellingPrice || 0;
          
          // Use saved percentage, fallback to global
          const fallbackRate = isWorker ? (settings.workerPercentage !== undefined ? settings.workerPercentage : 0.5) : (settings.salespersonPercentage !== undefined ? settings.salespersonPercentage : (salesman.commissionPercentage || 5));
          const commRate = (bill.commissionPercentage !== undefined && bill.commissionPercentage > 0) ? bill.commissionPercentage : fallbackRate;
          const itemCommAmt = price * (commRate / 100);

          let itemPaid = 0;
          if (remainingBillPaid >= itemCommAmt) {
            itemPaid = itemCommAmt;
            remainingBillPaid -= itemCommAmt;
          } else if (remainingBillPaid > 0) {
            itemPaid = remainingBillPaid;
            remainingBillPaid = 0;
          }

          const itemPending = itemCommAmt - itemPaid;
          const status = bill.status === 'Cancelled' ? 'Cancelled' : (itemPending === 0 ? 'Paid' : (itemPaid > 0 ? 'Partially Paid' : 'Pending'));

          historyList.push({
            _id: item._id.toString(),
            employeeId: salesman._id.toString(),
            employeeName: salesman.name,
            employeeRole,
            quantity: item.quantity || 1,
            netAmountBasis: price,
            commissionPercentage: commRate,
            commissionAmount: itemCommAmt,
            commissionPaidAmount: itemPaid,
            commissionPendingAmount: itemPending,
            status,
            invoiceId: bill._id.toString(),
            invoiceNo: bill.billNo,
            productName: product.itemName || product.name || item.barcode || 'Garment Item',
            createdAt: bill.billDate || bill.createdAt
          });
        });
      });
    }

    // 2. Fetch Worker (Tailor) Commissions from Alteration Tickets
    const alterations = await Alteration.find({ tenantId, isDeleted: false, tailorName: { $ne: null, $ne: '' } }).lean();
    
    const adminUsers = await User.find({ tenantId, isDeleted: false }).populate('roleId').lean();
    const adminNames = new Set(
      adminUsers
        .filter(u => ['admin', 'superadmin', 'businessadmin', 'tenant_admin'].includes(String(u.roleId?.name || '').toLowerCase()))
        .map(u => u.name.toLowerCase().trim())
    );

    alterations.forEach(alt => {
      const nameKey = String(alt.tailorName || '').toLowerCase().trim();
      if (adminNames.has(nameKey)) return; // Exclude admins!
      const charges = alt.totalCharges || 0;
      const commRate = (alt.commissionPercentage !== undefined && alt.commissionPercentage > 0) ? alt.commissionPercentage : (settings.workerPercentage !== undefined ? settings.workerPercentage : 10);
      const commAmt = (alt.commissionAmount !== undefined && alt.commissionAmount > 0) ? alt.commissionAmount : (charges * (commRate / 100));

      const paidAmt = alt.commissionPaidAmount || 0;
      const pendingAmt = commAmt - paidAmt;
      const status = alt.status === 'Cancelled' ? 'Cancelled' : (pendingAmt === 0 ? 'Paid' : (paidAmt > 0 ? 'Partially Paid' : 'Pending'));

      // Generate a mock ID based on alteration ID to avoid duplicate key issues
      const workerId = alt.tailorName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'tailor-1';

      historyList.push({
        _id: alt._id.toString(),
        employeeId: workerId,
        employeeName: alt.tailorName,
        employeeRole: 'Worker',
        quantity: 1,
        netAmountBasis: charges,
        commissionPercentage: commRate,
        commissionAmount: commAmt,
        commissionPaidAmount: paidAmt,
        commissionPendingAmount: pendingAmt,
        status,
        invoiceId: alt.saleBillId ? alt.saleBillId.toString() : alt._id.toString(),
        invoiceNo: alt.alterationNo,
        productName: 'Garment Alteration Work',
        createdAt: alt.createdAt
      });
    });

    return res.status(200).json(new ApiResponse(200, historyList, 'Staff commissions history retrieved.'));
  });

  /**
   * PUT /commissions/staff/pay/:employeeId
   * Marks all pending commissions of the employee as paid
   */
  static payStaffCommissions = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;
    const { employeeId } = req.params;
    const { employeeRole } = req.body;
    let paidAmount = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : null;

    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findById(tenantId).lean();
    const settings = tenant?.commissionSettings || {};

    const SaleBill = require('../models/billing/SaleBill');
    const Alteration = require('../models/alteration/Alteration');
    const Salesman = require('../models/masters/Salesman');

    // 1. Resolve role if not passed
    let resolvedRole = employeeRole;
    if (!resolvedRole) {
      const salesman = await Salesman.findOne({ tenantId, _id: employeeId });
      if (salesman) {
        resolvedRole = 'Salesperson';
      } else {
        resolvedRole = 'Worker';
      }
    }

    if (resolvedRole === 'Salesperson') {
      const bills = await SaleBill.find({ tenantId, salesmanId: employeeId, isDeleted: false })
        .populate('salesmanId')
        .sort({ createdAt: 1 });

      const commRate = settings.salespersonPercentage !== undefined ? settings.salespersonPercentage : 5;

      if (paidAmount === null) {
        paidAmount = 0;
        for (let bill of bills) {
          if (!bill.isCommissionPaid) {
            const User = require('../models/User');
            const matchUser = await User.findOne({ tenantId, $or: [ { phone: bill.salesmanId?.phone }, { email: bill.salesmanId?.email }, { name: bill.salesmanId?.name } ] }).lean();
            const userDesig = (matchUser?.designation || bill.salesmanId?.designation || matchUser?.role || '').toLowerCase();
            const isWorker = userDesig.includes('worker') || userDesig.includes('tailor') || userDesig.includes('fitter') || userDesig.includes('stitcher') || userDesig === 'worker';
            const fallbackRate = isWorker ? (settings.workerPercentage !== undefined ? settings.workerPercentage : 0.5) : (settings.salespersonPercentage !== undefined ? settings.salespersonPercentage : (bill.salesmanId?.commissionPercentage || 5));
            const billComm = (bill.commissionAmount !== undefined && bill.commissionAmount > 0) ? bill.commissionAmount : (bill.grandTotal * (((bill.commissionPercentage > 0 ? bill.commissionPercentage : fallbackRate)) / 100));
            paidAmount += (billComm - (bill.commissionPaidAmount || 0));
          }
        }
      }

      // Allocate paidAmount across bills sequentially (FIFO)
      let remainingPaid = paidAmount;
      for (let bill of bills) {
        const User = require('../models/User');
        const matchUser = await User.findOne({ tenantId, $or: [ { phone: bill.salesmanId?.phone }, { email: bill.salesmanId?.email }, { name: bill.salesmanId?.name } ] }).lean();
        const userDesig = (matchUser?.designation || bill.salesmanId?.designation || matchUser?.role || '').toLowerCase();
        const isWorker = userDesig.includes('worker') || userDesig.includes('tailor') || userDesig.includes('fitter') || userDesig.includes('stitcher') || userDesig === 'worker';
        const fallbackRate = isWorker ? (settings.workerPercentage !== undefined ? settings.workerPercentage : 0.5) : (settings.salespersonPercentage !== undefined ? settings.salespersonPercentage : (bill.salesmanId?.commissionPercentage || 5));
        const billComm = (bill.commissionAmount !== undefined && bill.commissionAmount > 0) ? bill.commissionAmount : (bill.grandTotal * (((bill.commissionPercentage > 0 ? bill.commissionPercentage : fallbackRate)) / 100));
        if (remainingPaid >= billComm) {
          bill.commissionPaidAmount = billComm;
          bill.isCommissionPaid = true;
          remainingPaid -= billComm;
        } else if (remainingPaid > 0) {
          bill.commissionPaidAmount = remainingPaid;
          bill.isCommissionPaid = false;
          remainingPaid = 0;
        } else {
          bill.commissionPaidAmount = 0;
          bill.isCommissionPaid = false;
        }
        await bill.save();
      }

      return res.status(200).json(new ApiResponse(200, null, `Commissions updated. Paid: ₹${paidAmount}`));
    } else {
      // Worker partial payment allocation
      const alterations = await Alteration.find({ tenantId, isDeleted: false });
      const matchingAlts = [];
      for (let alt of alterations) {
        const matchId = alt.tailorName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (matchId === employeeId) {
          matchingAlts.push(alt);
        }
      }
      // Sort matching alterations by creation date asc
      matchingAlts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const commRate = settings.workerPercentage !== undefined ? settings.workerPercentage : 10;

      if (paidAmount === null) {
        paidAmount = 0;
        matchingAlts.forEach(alt => {
          if (!alt.isCommissionPaid) {
            const altComm = (alt.commissionAmount !== undefined && alt.commissionAmount > 0) ? alt.commissionAmount : (alt.totalCharges * (((alt.commissionPercentage > 0 ? alt.commissionPercentage : commRate)) / 100));
            paidAmount += (altComm - (alt.commissionPaidAmount || 0));
          }
        });
      }

      let remainingPaid = paidAmount;
      for (let alt of matchingAlts) {
        const altComm = (alt.commissionAmount !== undefined && alt.commissionAmount > 0) ? alt.commissionAmount : (alt.totalCharges * (((alt.commissionPercentage > 0 ? alt.commissionPercentage : commRate)) / 100));
        if (remainingPaid >= altComm) {
          alt.commissionPaidAmount = altComm;
          alt.isCommissionPaid = true;
          alt.status = 'COMPLETED'; // Mark completed as paid
          remainingPaid -= altComm;
        } else if (remainingPaid > 0) {
          alt.commissionPaidAmount = remainingPaid;
          alt.isCommissionPaid = false;
          alt.status = 'COMPLETED';
          remainingPaid = 0;
        } else {
          alt.commissionPaidAmount = 0;
          alt.isCommissionPaid = false;
        }
        await alt.save();
      }

      return res.status(200).json(new ApiResponse(200, null, `Worker commissions updated. Paid: ₹${paidAmount}`));
    }
  });

  static getStaffStats = asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;

    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findById(tenantId).lean();
    const settings = tenant?.commissionSettings || {};
    const globalSalespersonRate = settings.salespersonPercentage !== undefined ? settings.salespersonPercentage : 1.5;
    const globalWorkerRate = settings.workerPercentage !== undefined ? settings.workerPercentage : 0.5;

    const SaleBill = require('../models/billing/SaleBill');
    const SaleItem = require('../models/billing/SaleItem');
    const Salesman = require('../models/masters/Salesman');
    const Alteration = require('../models/alteration/Alteration');

    let salespersonTotal = 0;
    let salespersonPending = 0;

    const saleBills = await SaleBill.find({ tenantId, isDeleted: false, salesmanId: { $ne: null } })
      .populate('salesmanId')
      .lean();

    if (saleBills.length > 0) {
      const billIds = saleBills.map(b => b._id);
      const saleItems = await SaleItem.find({ tenantId, saleBillId: { $in: billIds } }).lean();

      const itemsMap = {};
      saleItems.forEach(item => {
        const bId = item.saleBillId.toString();
        if (!itemsMap[bId]) itemsMap[bId] = [];
        itemsMap[bId].push(item);
      });

      const User = require('../models/User');
      for (const bill of saleBills) {
        const salesman = bill.salesmanId;
        if (!salesman) continue;

        const billItems = itemsMap[bill._id.toString()] || [];
        
        let billTotalComm = (bill.commissionAmount !== undefined && bill.commissionAmount > 0) ? bill.commissionAmount : 0;
        
        if (billTotalComm === 0) {
          const matchUser = await User.findOne({ tenantId, $or: [ { phone: salesman?.phone }, { email: salesman?.email }, { name: salesman?.name } ] }).lean();
          const userDesig = (matchUser?.designation || salesman?.designation || matchUser?.role || '').toLowerCase();
          const isWorker = userDesig.includes('worker') || userDesig.includes('tailor') || userDesig.includes('fitter') || userDesig.includes('stitcher') || userDesig === 'worker';
          const fallbackRate = isWorker ? (settings.workerPercentage !== undefined ? settings.workerPercentage : 0.5) : (settings.salespersonPercentage !== undefined ? settings.salespersonPercentage : (salesman?.commissionPercentage || 5));
          
          const commRate = (bill.commissionPercentage !== undefined && bill.commissionPercentage > 0) ? bill.commissionPercentage : fallbackRate;
          
          billItems.forEach(item => {
            const price = item.finalPrice || item.sellingPrice || 0;
            billTotalComm += price * (commRate / 100);
          });
        }

        salespersonTotal += billTotalComm;
        if (bill.status !== 'Cancelled') {
          salespersonPending += (billTotalComm - (bill.commissionPaidAmount || 0));
        }
      }
    }

    let workerTotal = 0;
    let workerPending = 0;

    const User = require('../models/User');
    const adminUsers = await User.find({ tenantId, isDeleted: false }).populate('roleId').lean();
    const adminNames = new Set(
      adminUsers
        .filter(u => ['admin', 'superadmin', 'businessadmin', 'tenant_admin'].includes(String(u.roleId?.name || '').toLowerCase()))
        .map(u => u.name.toLowerCase().trim())
    );

    const alterations = await Alteration.find({ tenantId, isDeleted: false, tailorName: { $ne: null, $ne: '' } }).lean();
    alterations.forEach(alt => {
      const nameKey = String(alt.tailorName || '').toLowerCase().trim();
      if (adminNames.has(nameKey)) return;

      const charges = alt.totalCharges || 0;
      const commRate = (alt.commissionPercentage !== undefined && alt.commissionPercentage > 0) ? alt.commissionPercentage : (settings.workerPercentage !== undefined ? settings.workerPercentage : 10);
      const commAmt = (alt.commissionAmount !== undefined && alt.commissionAmount > 0) ? alt.commissionAmount : (charges * (commRate / 100));

      workerTotal += commAmt;
      if (alt.status !== 'Cancelled') {
        workerPending += (commAmt - (alt.commissionPaidAmount || 0));
      }
    });

    const data = {
      breakdown: [
        {
          _id: 'Salesperson',
          totalCommission: salespersonTotal,
          pendingCommission: salespersonPending
        },
        {
          _id: 'Worker',
          totalCommission: workerTotal,
          pendingCommission: workerPending
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
    const Tenant = require('../models/Tenant');
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
   * Saves the automated commission settings to Tenant
   */
  static updateCommissionSettings = asyncHandler(async (req, res) => {
    const Tenant = require('../models/Tenant');
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
    return res.status(200).json(new ApiResponse(200, tenant.commissionSettings, 'Commission settings updated successfully.'));
  });
}

module.exports = CommissionController;

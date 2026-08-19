const Commission = require('../models/Commission');
const SaleBill = require('../models/billing/SaleBill');
const SaleItem = require('../models/billing/SaleItem');
const Alteration = require('../models/alteration/Alteration');
const Salesman = require('../models/masters/Salesman');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

class CommissionService {
  /**
   * Helper to determine worker vs salesperson role and commission rate
   */
  static resolveRoleAndRate(settings, userObj, salesmanObj, defaultRole = null) {
    const userDesig = (userObj?.designation || salesmanObj?.designation || userObj?.role || '').toLowerCase();
    const userRole = (userObj?.roleId?.name || userObj?.role || '').toLowerCase();
    
    const isWorker = ['worker', 'tailor', 'fitter', 'stitcher', 'floorworker', 'productionworker'].some(
      w => userDesig.includes(w) || userRole.includes(w)
    );

    const employeeRole = isWorker ? 'Worker' : (defaultRole || 'Salesperson');
    const workerRate = settings?.workerPercentage !== undefined ? Number(settings.workerPercentage) : 0.5;
    const salesRate = settings?.salespersonPercentage !== undefined ? Number(settings.salespersonPercentage) : 1.5;

    const commissionPercentage = isWorker ? workerRate : salesRate;
    return { employeeRole, commissionPercentage, isWorker };
  }

  /**
   * Record commissions when a SaleBill is created
   */
  static async recordSaleBillCommissions(saleBill, saleItems, tenantId, createdByUserId) {
    if (!saleBill || !saleBill.salesmanId) return [];

    const tenant = await Tenant.findById(tenantId).lean();
    const settings = tenant?.commissionSettings || {};

    const salesman = await Salesman.findById(saleBill.salesmanId).lean();
    if (!salesman) return [];

    const user = await User.findOne({
      tenantId,
      $or: [
        { phone: salesman.phone },
        { email: salesman.email },
        { name: salesman.name }
      ],
      isDeleted: false
    }).populate('roleId').lean();

    const { employeeRole, commissionPercentage } = this.resolveRoleAndRate(settings, user, salesman);
    const commRate = (saleBill.commissionPercentage !== undefined && saleBill.commissionPercentage > 0)
      ? saleBill.commissionPercentage
      : commissionPercentage;

    const createdCommissions = [];

    for (const item of saleItems) {
      const price = item.finalPrice || item.sellingPrice || 0;
      const commAmount = Number((price * (commRate / 100)).toFixed(2));

      const commDoc = await Commission.findOneAndUpdate(
        {
          tenantId,
          sourceId: saleBill._id,
          saleItemId: item._id
        },
        {
          tenantId,
          userId: user ? user._id : undefined,
          salesmanId: salesman._id,
          employeeId: salesman._id.toString(),
          employeeName: salesman.name,
          employeeRole,
          sourceType: 'SaleBill',
          sourceId: saleBill._id,
          saleItemId: item._id,
          invoiceNo: saleBill.billNo,
          productName: item.barcode || 'Garment Item',
          quantity: item.quantity || 1,
          netAmountBasis: price,
          commissionPercentage: commRate,
          commissionAmount: commAmount,
          commissionPaidAmount: 0,
          commissionPendingAmount: commAmount,
          status: saleBill.status === 'Cancelled' ? 'Cancelled' : 'Pending',
          date: saleBill.billDate || saleBill.createdAt || new Date(),
          createdBy: createdByUserId
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdCommissions.push(commDoc);
    }

    return createdCommissions;
  }

  /**
   * Record commission when an Alteration is created
   */
  static async recordAlterationCommission(alteration, tenantId, createdByUserId) {
    if (!alteration || !alteration.tailorName) return null;

    const tenant = await Tenant.findById(tenantId).lean();
    const settings = tenant?.commissionSettings || {};

    const adminUsers = await User.find({ tenantId, isDeleted: false }).populate('roleId').lean();
    const adminNames = new Set(
      adminUsers
        .filter(u => ['admin', 'superadmin', 'businessadmin', 'tenant_admin'].includes(String(u.roleId?.name || '').toLowerCase()))
        .map(u => u.name.toLowerCase().trim())
    );

    const tailorNameKey = alteration.tailorName.toLowerCase().trim();
    if (adminNames.has(tailorNameKey)) return null;

    const user = await User.findOne({
      tenantId,
      name: { $regex: new RegExp(`^${alteration.tailorName.trim()}$`, 'i') },
      isDeleted: false
    }).lean();

    const commRate = (alteration.commissionPercentage !== undefined && alteration.commissionPercentage > 0)
      ? alteration.commissionPercentage
      : (settings.workerPercentage !== undefined ? Number(settings.workerPercentage) : 0.5);

    const charges = alteration.totalCharges || 0;
    const commAmount = Number((charges * (commRate / 100)).toFixed(2));
    const workerId = user ? user._id.toString() : alteration.tailorName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'tailor-1';

    const commDoc = await Commission.findOneAndUpdate(
      {
        tenantId,
        sourceId: alteration._id,
        sourceType: 'Alteration'
      },
      {
        tenantId,
        userId: user ? user._id : undefined,
        employeeId: workerId,
        employeeName: alteration.tailorName,
        employeeRole: 'Worker',
        sourceType: 'Alteration',
        sourceId: alteration._id,
        invoiceNo: alteration.alterationNo,
        productName: 'Garment Alteration Work',
        quantity: 1,
        netAmountBasis: charges,
        commissionPercentage: commRate,
        commissionAmount: commAmount,
        commissionPaidAmount: alteration.commissionPaidAmount || 0,
        commissionPendingAmount: Math.max(0, commAmount - (alteration.commissionPaidAmount || 0)),
        status: alteration.status === 'Cancelled' ? 'Cancelled' : (alteration.commissionPaidAmount >= commAmount && commAmount > 0 ? 'Paid' : 'Pending'),
        date: alteration.createdAt || new Date(),
        createdBy: createdByUserId
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return commDoc;
  }

  /**
   * Sync and backfill all commissions for tenant from SaleBills and Alterations
   */
  static async syncCommissionsForTenant(tenantId) {
    if (!tenantId) return;

    const tenant = await Tenant.findById(tenantId).lean();
    const settings = tenant?.commissionSettings || {};

    const allUsers = await User.find({ tenantId, isDeleted: false }).populate('roleId').lean();
    const usersMap = {};
    allUsers.forEach(u => {
      if (u.name) usersMap[u.name.toLowerCase().trim()] = u;
      if (u.phone) usersMap[u.phone.trim()] = u;
      if (u.email) usersMap[u.email.toLowerCase().trim()] = u;
    });

    const adminNames = new Set(
      allUsers
        .filter(u => ['admin', 'superadmin', 'businessadmin', 'tenant_admin'].includes(String(u.roleId?.name || '').toLowerCase()))
        .map(u => u.name.toLowerCase().trim())
    );

    // 1. Sync Sale Bills
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

      const itemsMap = {};
      saleItems.forEach(item => {
        const bId = item.saleBillId.toString();
        if (!itemsMap[bId]) itemsMap[bId] = [];
        itemsMap[bId].push(item);
      });

      for (const bill of saleBills) {
        const salesman = bill.salesmanId;
        if (!salesman) continue;

        const matchUser = usersMap[salesman.name.toLowerCase().trim()] ||
          (salesman.phone ? usersMap[salesman.phone.trim()] : null) ||
          (salesman.email ? usersMap[salesman.email.toLowerCase().trim()] : null);

        const { employeeRole, commissionPercentage } = this.resolveRoleAndRate(settings, matchUser, salesman);
        const commRate = (bill.commissionPercentage !== undefined && bill.commissionPercentage > 0)
          ? bill.commissionPercentage
          : commissionPercentage;

        const billItems = itemsMap[bill._id.toString()] || [];
        let remainingBillPaid = bill.commissionPaidAmount || 0;

        for (const item of billItems) {
          const piece = item.inventoryPieceId || {};
          const product = piece.productId || {};
          const price = item.finalPrice || item.sellingPrice || 0;
          const itemCommAmt = Number((price * (commRate / 100)).toFixed(2));

          let itemPaid = 0;
          if (remainingBillPaid >= itemCommAmt) {
            itemPaid = itemCommAmt;
            remainingBillPaid -= itemCommAmt;
          } else if (remainingBillPaid > 0) {
            itemPaid = remainingBillPaid;
            remainingBillPaid = 0;
          }

          const itemPending = Math.max(0, Number((itemCommAmt - itemPaid).toFixed(2)));
          const status = bill.status === 'Cancelled'
            ? 'Cancelled'
            : (itemPending === 0 && itemCommAmt > 0 ? 'Paid' : (itemPaid > 0 ? 'Partially Paid' : 'Pending'));

          await Commission.findOneAndUpdate(
            {
              tenantId,
              sourceId: bill._id,
              saleItemId: item._id
            },
            {
              tenantId,
              userId: matchUser ? matchUser._id : undefined,
              salesmanId: salesman._id,
              employeeId: salesman._id.toString(),
              employeeName: salesman.name,
              employeeRole,
              sourceType: 'SaleBill',
              sourceId: bill._id,
              saleItemId: item._id,
              invoiceNo: bill.billNo,
              productName: product.itemName || product.name || item.barcode || 'Garment Item',
              quantity: item.quantity || 1,
              netAmountBasis: price,
              commissionPercentage: commRate,
              commissionAmount: itemCommAmt,
              commissionPaidAmount: itemPaid,
              commissionPendingAmount: itemPending,
              status,
              date: bill.billDate || bill.createdAt,
              isDeleted: false
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      }
    }

    // 2. Sync Alterations
    const alterations = await Alteration.find({ tenantId, isDeleted: false, tailorName: { $ne: null, $ne: '' } }).lean();

    for (const alt of alterations) {
      const nameKey = String(alt.tailorName || '').toLowerCase().trim();
      if (adminNames.has(nameKey)) continue;

      const matchUser = usersMap[nameKey];
      const charges = alt.totalCharges || 0;
      const commRate = (alt.commissionPercentage !== undefined && alt.commissionPercentage > 0)
        ? alt.commissionPercentage
        : (settings.workerPercentage !== undefined ? Number(settings.workerPercentage) : 0.5);

      const commAmt = Number((charges * (commRate / 100)).toFixed(2));
      const paidAmt = alt.commissionPaidAmount || 0;
      const pendingAmt = Math.max(0, Number((commAmt - paidAmt).toFixed(2)));
      const status = alt.status === 'Cancelled'
        ? 'Cancelled'
        : (pendingAmt === 0 && commAmt > 0 ? 'Paid' : (paidAmt > 0 ? 'Partially Paid' : 'Pending'));

      const workerId = matchUser ? matchUser._id.toString() : alt.tailorName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'tailor-1';

      await Commission.findOneAndUpdate(
        {
          tenantId,
          sourceId: alt._id,
          sourceType: 'Alteration'
        },
        {
          tenantId,
          userId: matchUser ? matchUser._id : undefined,
          employeeId: workerId,
          employeeName: alt.tailorName,
          employeeRole: 'Worker',
          sourceType: 'Alteration',
          sourceId: alt._id,
          invoiceNo: alt.alterationNo,
          productName: 'Garment Alteration Work',
          quantity: 1,
          netAmountBasis: charges,
          commissionPercentage: commRate,
          commissionAmount: commAmt,
          commissionPaidAmount: paidAmt,
          commissionPendingAmount: pendingAmt,
          status,
          date: alt.createdAt,
          isDeleted: false
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  /**
   * Pay staff commissions and sync across Commission collection, SaleBill, and Alteration
   */
  static async payStaffCommissions(tenantId, employeeId, employeeRole, paidAmount) {
    const tenant = await Tenant.findById(tenantId).lean();
    const settings = tenant?.commissionSettings || {};

    let resolvedRole = employeeRole;
    if (!resolvedRole) {
      const salesman = await Salesman.findOne({ tenantId, _id: employeeId });
      resolvedRole = salesman ? 'Salesperson' : 'Worker';
    }

    // Fetch unpaid/pending commissions from Commission collection
    const commissions = await Commission.find({
      tenantId,
      employeeId,
      status: { $in: ['Pending', 'Partially Paid'] },
      isDeleted: false
    }).sort({ date: 1 });

    let totalPending = commissions.reduce((sum, c) => sum + c.commissionPendingAmount, 0);
    let amountToAllocate = paidAmount !== null && paidAmount !== undefined ? Number(paidAmount) : totalPending;
    let actualPaid = amountToAllocate;

    for (const comm of commissions) {
      if (amountToAllocate <= 0) break;

      const needed = comm.commissionPendingAmount;
      if (amountToAllocate >= needed) {
        comm.commissionPaidAmount = comm.commissionAmount;
        comm.commissionPendingAmount = 0;
        comm.status = 'Paid';
        amountToAllocate -= needed;
      } else {
        comm.commissionPaidAmount += amountToAllocate;
        comm.commissionPendingAmount = Math.max(0, comm.commissionAmount - comm.commissionPaidAmount);
        comm.status = 'Partially Paid';
        amountToAllocate = 0;
      }
      await comm.save();

      // Update underlying source
      if (comm.sourceType === 'SaleBill') {
        const bill = await SaleBill.findById(comm.sourceId);
        if (bill) {
          const allBillComms = await Commission.find({ tenantId, sourceId: bill._id, isDeleted: false });
          const billTotalPaid = allBillComms.reduce((s, c) => s + c.commissionPaidAmount, 0);
          const billTotalComm = allBillComms.reduce((s, c) => s + c.commissionAmount, 0);
          bill.commissionPaidAmount = billTotalPaid;
          bill.isCommissionPaid = billTotalPaid >= billTotalComm && billTotalComm > 0;
          await bill.save();
        }
      } else if (comm.sourceType === 'Alteration') {
        const alt = await Alteration.findById(comm.sourceId);
        if (alt) {
          alt.commissionPaidAmount = comm.commissionPaidAmount;
          alt.isCommissionPaid = comm.commissionPaidAmount >= comm.commissionAmount;
          alt.status = 'COMPLETED';
          await alt.save();
        }
      }
    }

    return { paidAmount: actualPaid };
  }
}

module.exports = CommissionService;

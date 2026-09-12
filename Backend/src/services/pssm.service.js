const ApiError = require('../helpers/ApiError');
const PSSM = require('../models/PSSM/PSSM');
const PSSMItem = require('../models/PSSM/PSSMItem');
const Alteration = require('../models/alteration/Alteration');
const AlterationItem = require('../models/alteration/AlterationItem');
const InventoryPiece = require('../models/InventoryPiece');
const SaleBill = require('../models/billing/SaleBill');
const Customer = require('../models/crm/Customer');
const Salesman = require('../models/masters/Salesman');
const Attendance = require('../models/Attendance');
const NotificationService = require('./notification.service');
const AuditService = require('./audit.service');
const TailoringJobService = require('./tailoringJob.service');

class PSSMService {
  static async createPSSM(data, userId, tenantId) {
    if (data.sourceType === 'CUSTOMER_OWN_GARMENT' && !/^[6-9]\d{9}$/.test(String(data.customerPhone || '').trim())) {
      throw new ApiError(400, 'A valid 10-digit customer mobile number is required for custom tailoring.');
    }
    let rawItems = data.items || [];
    if (!rawItems.length) {
      throw new ApiError(400, 'PSSM request must contain at least one item.');
    }

    let totalCharges = 0;
    rawItems.forEach(item => {
      totalCharges += Number(item.charge || 0);
    });

    let resolvedSaleBillId = data.saleBillId || data.invoiceId;
    let foundBill = null;

    if (resolvedSaleBillId) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(resolvedSaleBillId) && resolvedSaleBillId.toString().length === 24) {
        foundBill = await SaleBill.findOne({ tenantId, _id: resolvedSaleBillId });
      }
      if (!foundBill) {
        foundBill = await SaleBill.findOne({ tenantId, billNo: resolvedSaleBillId });
      }
    }

    if (!foundBill && data.invoiceNumber) {
      foundBill = await SaleBill.findOne({ tenantId, billNo: data.invoiceNumber });
    }

    resolvedSaleBillId = foundBill ? foundBill._id : undefined;
    const billNo = data.invoiceNumber || (foundBill ? foundBill.billNo : '');
    const billBarcode = data.billBarcode || billNo;

    // 1. Customer Waiting Option & Automatic Priority Derivation
    const customerWaitingOption = data.customerWaitingOption || 'Will Come Later';
    let derivedPriority = 'NORMAL';
    if (customerWaitingOption === 'Waiting in Store') {
      derivedPriority = 'HIGH';
    } else if (customerWaitingOption === 'Home Delivery Required') {
      derivedPriority = 'DELIVERY';
    } else {
      derivedPriority = data.priority || 'NORMAL';
    }

    // 2. Salesman Ownership Inheritance / Resolution
    let resolvedSalesmanId = data.salesmanId;
    let resolvedSalesmanName = data.salesmanName || '';

    if (foundBill && foundBill.salesmanId) {
      resolvedSalesmanId = foundBill.salesmanId;
      if (!resolvedSalesmanName) {
        const sDoc = await Salesman.findById(foundBill.salesmanId).lean();
        if (sDoc) resolvedSalesmanName = sDoc.name;
      }
    }

    if (!resolvedSalesmanName && resolvedSalesmanId) {
      const sDoc = await Salesman.findById(resolvedSalesmanId).lean();
      if (sDoc) resolvedSalesmanName = sDoc.name;
    }

    // Check if master tailor / assigned staff is provided for all items
    const allAssigned = rawItems.every(i => Boolean(i.assignedTo || i.tailorName || data.tailorName));
    const initialMasterStatus = allAssigned ? 'ASSIGNED' : 'PENDING_ASSIGNMENT';

    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const pssmNo = data.pssmNo || data.alterationNo || `PSSM-${Date.now().toString(36).toUpperCase()}-${uniqueSuffix}`;
    const slipBarcode = data.slipBarcode || pssmNo;

    // Create Master PSSM document
    const pssmRecord = await PSSM.create({
      tenantId,
      pssmNo,
      slipBarcode,
      saleBillId: resolvedSaleBillId,
      billNo,
      billBarcode,
      customerId: data.customerId || (foundBill ? foundBill.customerId : undefined),
      customerName: data.customerName || (foundBill ? foundBill.customerName : ''),
      customerPhone: data.customerPhone || (foundBill ? foundBill.customerPhone : ''),
      alternatePhone: data.alternatePhone || data.customerAltPhone || '',
      whatsappNumber: data.whatsappNumber || data.customerWhatsapp || '',
      specialInstructions: data.specialInstructions || data.notes || data.remarks || '',
      inseamBookCode: data.inseamBookCode || '',
      salesmanId: resolvedSalesmanId,
      salesmanName: resolvedSalesmanName,
      customerWaitingOption,
      priority: derivedPriority,
      serviceType: data.serviceType || 'Alteration',
      gender: data.gender || rawItems[0]?.gender || 'Gents',
      expectedDeliveryDate: data.expectedDeliveryDate || data.deliveryDate,
      tailorName: data.tailorName || 'Default Tailor',
      vendorName: data.vendorName || data.tailorName || '',
      totalCharges,
      status: initialMasterStatus,
      allowWhatsApp: data.allowWhatsApp !== false,
      trialRequired: Boolean(data.trialRequired),
      trialDate: data.trialRequired && data.trialDate ? data.trialDate : undefined,
      remarks: data.remarks || data.specialInstructions || data.notes || '',
      createdBy: userId
    });

    // Update Customer inseam book code, alternatePhone, whatsappNumber if provided
    const targetCustomerId = data.customerId || (foundBill && foundBill.customerId);
    if (targetCustomerId) {
      const custUpdates = {};
      if (data.inseamBookCode) custUpdates.inseamBookCode = data.inseamBookCode;
      if (data.alternatePhone) custUpdates.alternatePhone = data.alternatePhone;
      if (data.whatsappNumber) custUpdates.whatsappNumber = data.whatsappNumber;
      if (Object.keys(custUpdates).length > 0) {
        await Customer.updateOne(
          { _id: targetCustomerId, tenantId },
          { $set: custUpdates }
        ).catch(console.error);
      }
    }

    const createdItems = [];
    const createdTailoringJobs = [];

    for (const item of rawItems) {
      let piece = null;
      if (item.inventoryPieceId) {
        piece = await InventoryPiece.findOne({ _id: item.inventoryPieceId, tenantId });
      }
      if (!piece && item.barcode) {
        piece = await InventoryPiece.findOne({
          tenantId,
          $or: [{ barcode: item.barcode }, { uniqueCode: item.barcode }]
        });
      }

      const itemBarcode = item.barcode || piece?.barcode || '';
      const itemUniqueCode = item.uniqueCode || piece?.uniqueCode || '';

      // 3. Duplicate Active PSS Prevention
      if (resolvedSaleBillId && itemBarcode) {
        const existingActive = await PSSMItem.findOne({
          tenantId,
          saleBillId: resolvedSaleBillId,
          barcode: itemBarcode,
          status: { $nin: ['COLLECTED', 'CLOSED'] }
        });
        if (existingActive) {
          console.warn(`[PSSMService] Active PSS record already exists for barcode ${itemBarcode}. Skipping duplicate creation.`);
          continue;
        }
      }

      const assignedTo = item.assignedTo || item.tailorName || data.tailorName || '';
      const itemStatus = assignedTo ? 'ASSIGNED' : 'PENDING_ASSIGNMENT';
      const pieceId = piece ? piece._id : undefined;
      const resolvedProductId = item.productId || piece?.productId;
      const itmTrialReq = item.trialRequired !== undefined ? Boolean(item.trialRequired) : Boolean(data.trialRequired);

      const pssmItemDoc = await PSSMItem.create({
        tenantId,
        pssmId: pssmRecord._id,
        saleBillId: resolvedSaleBillId,
        inventoryPieceId: pieceId,
        barcode: item.barcode || undefined,
        uniqueCode: item.uniqueCode || item.barcode || undefined,
        productId: resolvedProductId,
        productName: item.productName || item.name || 'Garment Item',
        size: item.size || 'FS',
        color: item.color || 'Standard',
        salesmanId: item.salesmanId || resolvedSalesmanId,
        salesmanName: item.salesmanName || resolvedSalesmanName,
        customerWaitingOption,
        priority: derivedPriority,
        serviceType: item.serviceType || data.serviceType || 'Alteration',
        gender: item.gender || data.gender || 'Gents',
        expectedDeliveryDate: item.expectedDeliveryDate || data.expectedDeliveryDate || data.deliveryDate,
        assignedTo,
        instructions: item.instructions || (Array.isArray(item.alterationDetails) ? item.alterationDetails.join(', ') : 'Standard Service'),
        charge: item.charge || 0,
        status: itemStatus,
        trialRequired: itmTrialReq,
        trialDate: itmTrialReq && (item.trialDate || data.trialDate) ? (item.trialDate || data.trialDate) : undefined,
        alterationDetails: item.alterationDetails || [],
        measurements: item.measurements || {},
        createdBy: userId
      });

      // Auto-create a tailoring job for every tailoring service, including customer-owned garments.
      const tailoringServiceTypes = ['Alteration', 'Custom Tailoring', 'Full Stitching', 'Fitting & Hemming', 'Repairs / Redesign'];
      if (tailoringServiceTypes.includes(item.serviceType || data.serviceType || 'Alteration')) {
        try {
          const job = await TailoringJobService.createFromPSSMItem(pssmRecord, pssmItemDoc, userId, tenantId);
          if (job) {
            pssmItemDoc.tailoringJob = job; // attach for downstream use
            pssmItemDoc.tailorInvoiceNo = job.tailorInvoiceNo;
            pssmItemDoc.alterationBarcode = job.tailorInvoiceNo;
            await pssmItemDoc.save();
            createdTailoringJobs.push(job);
          }
        } catch (tjErr) {
          console.error('[PSSMService] TailoringJob creation failed (non-fatal):', tjErr.message);
        }
      }

      if (!pssmItemDoc.alterationBarcode) {
        pssmItemDoc.alterationBarcode = pssmItemDoc.tailorInvoiceNo || `ALT-${pssmRecord.pssmNo}-${createdItems.length + 1}`;
        await pssmItemDoc.save();
      }

      createdItems.push(pssmItemDoc);
    }

    // NOTE: Legacy Alteration backwards-compatibility creation has been removed.
    // PSSM records are now the single source of truth for all post-sales service items.
    // The ArticulationView fetches /pssm/pending-assignments and /alterations separately
    // and deduplicates by barcode. Creating duplicate Alteration records caused extra
    // entries in the tailoring & garment tracking view.


    return {
      pssmRecord,
      items: createdItems,
      tailoringJobs: createdTailoringJobs
    };
  }

  static async getPendingAssignments(tenantId) {
    const items = await PSSMItem.find({ tenantId, status: 'PENDING_ASSIGNMENT' })
      .populate('pssmId')
      .sort({ createdAt: -1 })
      .lean();

    const TailoringJob = require('../models/tailoring/TailoringJob');
    const TailoringJobService = require('./tailoringJob.service');

    const itemIds = items.map(i => i._id);
    const existingJobs = await TailoringJob.find({ tenantId, pssmItemId: { $in: itemIds } }).lean();
    const jobsByItemId = new Map(existingJobs.map(j => [j.pssmItemId?.toString(), j]));

    return Promise.all(items.map(async (item) => {
      let tailorInvoiceNo = item.tailorInvoiceNo || jobsByItemId.get(item._id.toString())?.tailorInvoiceNo || '';

      if (!tailorInvoiceNo && (item.serviceType || 'Alteration') === 'Alteration') {
        try {
          const newJob = await TailoringJobService.createFromPSSMItem(item.pssmId, item, item.createdBy, tenantId);
          if (newJob) {
            tailorInvoiceNo = newJob.tailorInvoiceNo;
            await PSSMItem.updateOne({ _id: item._id }, { $set: { tailorInvoiceNo: newJob.tailorInvoiceNo } });
          }
        } catch (e) {
          console.warn('[getPendingAssignments] Auto-create TailoringJob failed:', e.message);
        }
      }

      return {
        _id: item._id,
        pssmId: item.pssmId?._id,
        pssmNo: item.pssmId?.pssmNo,
        billNo: item.pssmId?.billNo,
        billBarcode: item.pssmId?.billBarcode,
        customerId: item.pssmId?.customerId,
        customerName: item.pssmId?.customerName,
        customerPhone: item.pssmId?.customerPhone,
        salesmanId: item.salesmanId || item.pssmId?.salesmanId,
        salesmanName: item.salesmanName || item.pssmId?.salesmanName || 'N/A',
        customerWaitingOption: item.customerWaitingOption || item.pssmId?.customerWaitingOption,
        expectedDeliveryDate: item.pssmId?.expectedDeliveryDate,
        priority: item.priority || item.pssmId?.priority || 'NORMAL',
        trialRequired: item.trialRequired !== undefined ? item.trialRequired : item.pssmId?.trialRequired,
        trialDate: item.trialDate || item.pssmId?.trialDate,
        productName: item.productName,
        barcode: item.barcode,
        uniqueCode: item.uniqueCode,
        tailorInvoiceNo: tailorInvoiceNo || '',
        size: item.size,
        color: item.color,
        serviceType: item.serviceType,
        status: item.status,
        createdAt: item.createdAt
      };
    }));
  }

  static async getSalesmanPendingList(query = {}, tenantId) {
    const dash = await this.getSalesmanCompleteDashboard(query, null, tenantId);
    return dash.pendingList;
  }

  static async markItemCompleteByScan(barcode, userId, tenantId, extra = {}) {
    const cleanCode = barcode ? barcode.trim() : '';
    if (!cleanCode) throw new ApiError(400, 'Barcode or unique code is required.');

    // Try finding in PSSMItem
    let item = await PSSMItem.findOne({
      tenantId,
      $or: [
        { barcode: cleanCode },
        { uniqueCode: cleanCode },
        { sku: cleanCode }
      ],
      status: { $nin: ['COLLECTED', 'CLOSED'] }
    });

    // Also check if barcode matches pssm ticket no or bill barcode
    if (!item) {
      const pssm = await PSSM.findOne({
        tenantId,
        $or: [{ pssmNo: cleanCode }, { billBarcode: cleanCode }, { billNo: cleanCode }]
      });
      if (pssm) {
        item = await PSSMItem.findOne({
          tenantId,
          pssmId: pssm._id,
          status: { $nin: ['READY', 'COLLECTED', 'CLOSED'] }
        }) || await PSSMItem.findOne({
          tenantId,
          pssmId: pssm._id
        });
      }
    }

    // Also support checking legacy AlterationItem/Alteration
    if (!item) {
      const Alteration = require('../models/alteration/Alteration');
      const AlterationItem = require('../models/alteration/AlterationItem');
      const alt = await Alteration.findOne({
        tenantId,
        $or: [{ alterationNo: cleanCode }, { barcode: cleanCode }]
      });
      if (alt) {
        alt.status = 'Ready for Delivery';
        await alt.save();

        await AuditService.trackAuditLog({
          tenantId,
          userId,
          userName: extra.userName || 'Authorized Staff',
          action: 'MANUAL_STATUS_UPDATE',
          module: 'alterations',
          entityId: alt._id.toString(),
          entityType: 'ALTERATION',
          displayName: `Alteration #${alt.alterationNo}`,
          item: `Barcode: ${cleanCode} - Marked Ready for Delivery`,
          fieldChanged: 'Status',
          oldValue: 'Pending',
          newValue: 'Ready for Delivery',
          reason: extra.reason || 'Barcode scan verified - Garment marked ready',
          details: { barcode: cleanCode }
        }, extra.io);

        return {
          _id: alt._id,
          isGreenCompleted: true,
          billNo: alt.invoiceNumber || alt.alterationNo,
          customerName: alt.customerName,
          status: alt.status
        };
      }
    }

    if (!item) {
      throw new ApiError(404, `No active PSS or alteration item found matching '${cleanCode}'.`);
    }

    const oldStatus = item.status;
    item.status = 'READY';
    item.completedAt = new Date();
    item.completedBy = userId;
    await item.save();

    await NotificationService.resolveAlertsForPSSItem(item._id, tenantId, 'READY');

    await AuditService.trackAuditLog({
      tenantId,
      userId,
      userName: extra.userName || 'Authorized Staff',
      action: 'MANUAL_STATUS_UPDATE',
      module: 'pssm',
      entityId: item._id.toString(),
      entityType: 'PSSM',
      displayName: `${item.pieceName || 'Garment'} (${item.barcode || cleanCode})`,
      item: `Scanned Barcode: ${cleanCode} - Marked READY`,
      fieldChanged: 'Status',
      oldValue: oldStatus,
      newValue: 'READY',
      reason: extra.reason || 'Barcode scan verified - Garment marked READY',
      details: { barcode: cleanCode }
    }, extra.io);

    await this.recalculateMasterStatus(item.pssmId, tenantId);

    const populated = await PSSMItem.findById(item._id).populate('pssmId').lean();
    return {
      ...populated,
      isGreenCompleted: true,
      billNo: populated.pssmId?.billNo,
      billBarcode: populated.pssmId?.billBarcode,
      customerName: populated.pssmId?.customerName
    };
  }

  static async restoreReassignedItemsForPresentSalesmen(tenantId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find attendance records for today marked PRESENT
    const presentRecords = await Attendance.find({
      tenantId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: 'PRESENT'
    }).lean();

    const presentSalesmanIds = presentRecords.map(a => a.salesmanId).filter(Boolean);
    if (!presentSalesmanIds.length) return { restoredCount: 0 };

    let count = 0;
    for (const sId of presentSalesmanIds) {
      const itemsToRestore = await PSSMItem.find({
        tenantId,
        reassignedFromSalesmanId: sId,
        status: { $nin: ['COLLECTED', 'CLOSED'] }
      });

      for (const item of itemsToRestore) {
        item.salesmanId = item.reassignedFromSalesmanId;
        item.salesmanName = item.reassignedFromSalesmanName;
        item.reassignedFromSalesmanId = undefined;
        item.reassignedFromSalesmanName = undefined;
        item.reassignedReason = undefined;
        item.reassignedAt = undefined;
        await item.save();
        count++;
      }
    }
    return { restoredCount: count };
  }

  static async checkAndReassignAbsentSalesmen(tenantId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find absent records for today
    const absentRecords = await Attendance.find({
      tenantId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: 'ABSENT'
    }).lean();

    if (!absentRecords.length) {
      return { reassignedCount: 0, message: 'No absent salesmen detected today.' };
    }

    const absentSalesmanIds = absentRecords.map(a => a.salesmanId).filter(Boolean);

    // Find available present salesmen or default manager
    const presentSalesmen = await Salesman.find({
      tenantId,
      _id: { $nin: absentSalesmanIds }
    }).lean();

    const fallbackSalesman = presentSalesmen[0] || { _id: null, name: 'Floor Manager / Counter' };

    let count = 0;
    for (const absentId of absentSalesmanIds) {
      const absentSalesmanDoc = await Salesman.findById(absentId).lean();
      const absentName = absentSalesmanDoc ? absentSalesmanDoc.name : 'Absent Salesman';

      const pendingItems = await PSSMItem.find({
        tenantId,
        salesmanId: absentId,
        status: { $nin: ['READY', 'COLLECTED', 'CLOSED'] }
      });

      for (const pItem of pendingItems) {
        pItem.reassignedFromSalesmanId = absentId;
        pItem.reassignedFromSalesmanName = absentName;
        pItem.reassignedReason = 'Salesman Absent';
        pItem.reassignedAt = new Date();
        pItem.salesmanId = fallbackSalesman._id;
        pItem.salesmanName = fallbackSalesman.name;
        await pItem.save();
        count++;
      }
    }

    return {
      reassignedCount: count,
      reassignedTo: fallbackSalesman.name,
      message: `Reassigned ${count} PSS pending items from absent salesmen to ${fallbackSalesman.name}.`
    };
  }

  static async getSalesmanCompleteDashboard(query = {}, userId, tenantId) {
    // Automatically trigger absent checks and restoration so ownership is current
    await this.restoreReassignedItemsForPresentSalesmen(tenantId).catch(() => {});
    await this.checkAndReassignAbsentSalesmen(tenantId).catch(() => {});

    const User = require('../models/User');
    const Role = require('../models/Role');
    const userDoc = await User.findById(userId).lean().catch(() => null);

    let userRoleName = '';
    if (userDoc?.roleId) {
      const roleDoc = await Role.findById(userDoc.roleId).lean().catch(() => null);
      userRoleName = (roleDoc?.name || '').toLowerCase();
    }
    const userDesig = (userDoc?.designation || '').toLowerCase();

    let targetSalesmanDoc = null;
    if (query.salesmanId) {
      targetSalesmanDoc = await Salesman.findById(query.salesmanId).lean().catch(() => null);
    } else if (query.salesmanName) {
      targetSalesmanDoc = await Salesman.findOne({
        tenantId,
        name: new RegExp(query.salesmanName, 'i')
      }).lean().catch(() => null);
    } else if (userDoc) {
      targetSalesmanDoc = await Salesman.findOne({
        tenantId,
        $or: [
          ...(userDoc.phone ? [{ phone: userDoc.phone }] : []),
          ...(userDoc.email ? [{ email: userDoc.email }] : []),
          ...(userDoc.name ? [{ name: new RegExp(`^${userDoc.name}$`, 'i') }] : [])
        ]
      }).lean().catch(() => null);
    }

    const effectiveSalesmanName = query.salesmanName || targetSalesmanDoc?.name || userDoc?.name || '';
    const effectiveSalesmanId = targetSalesmanDoc?._id || query.salesmanId;

    const isAdminUser = Boolean(userDoc?.isTenantOwner || userDoc?.isSuperAdmin || ['admin', 'superadmin', 'businessadmin', 'tenantadmin', 'owner', 'tenantowner'].some(r => userRoleName.includes(r)));
    const isSalespersonScoped = Boolean(query.salesmanId || query.salesmanName || (!isAdminUser && (userRoleName.includes('sales') || userDesig.includes('sales') || Boolean(targetSalesmanDoc))));

    // Resolve all matching Salesman documents and aliases
    const matchedSalesmanDocs = await Salesman.find({
      tenantId,
      $or: [
        ...(effectiveSalesmanName ? [{ name: new RegExp(`^${effectiveSalesmanName.trim()}$`, 'i') }] : []),
        ...(userDoc?.phone ? [{ phone: userDoc.phone }] : []),
        ...(userDoc?.email ? [{ email: userDoc.email }] : [])
      ]
    }).lean().catch(() => []);

    const allowedSalesmanIds = new Set([
      ...(userId ? [userId.toString()] : []),
      ...(effectiveSalesmanId ? [effectiveSalesmanId.toString()] : []),
      ...matchedSalesmanDocs.map(s => s._id.toString())
    ]);

    const allowedSalesmanNames = new Set([
      ...(effectiveSalesmanName ? [effectiveSalesmanName.toLowerCase().trim()] : []),
      ...(userDoc?.name ? [userDoc.name.toLowerCase().trim()] : []),
      ...matchedSalesmanDocs.map(s => (s.name || '').toLowerCase().trim())
    ].filter(Boolean));

    // Fetch all PSSM Items with deep population of PSSM record and sale bills
    const pssmItems = await PSSMItem.find({ tenantId, isDeleted: { $ne: true } })
      .populate({
        path: 'pssmId',
        populate: [
          { path: 'customerId', select: 'name phone' },
          { path: 'saleBillId', select: 'billNo invoiceNo customerName customerPhone salesmanName salesmanId createdBy' }
        ]
      })
      .populate('saleBillId', 'billNo invoiceNo customerName customerPhone salesmanName salesmanId createdBy')
      .populate('inventoryPieceId', 'barcode uniqueCode pieceName productName size color primaryColor rack')
      .sort({ createdAt: -1 })
      .lean();

    const Alteration = require('../models/alteration/Alteration');
    const alterations = await Alteration.find({ tenantId, isDeleted: false })
      .populate('customerId', 'name phone')
      .populate('saleBillId', 'billNo invoiceNo customerName customerPhone salesmanName salesmanId createdBy items')
      .sort({ createdAt: -1 })
      .lean();

    const TailoringJob = require('../models/tailoring/TailoringJob');
    const tailoringJobs = await TailoringJob.find({ tenantId, isDeleted: false })
      .populate('customerId', 'name phone')
      .populate('saleBillId', 'billNo invoiceNo customerName customerPhone salesmanName salesmanId createdBy')
      .sort({ createdAt: -1 })
      .lean().catch(() => []);

    const existingItemKeys = new Set();
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const isDeliveredStatus = (s) => {
      if (!s) return false;
      const str = String(s).toUpperCase().trim();
      return ['COLLECTED', 'CLOSED', 'DELIVERED', 'COMPLETED', 'HANDED_OVER'].includes(str);
    };

    const isReadyStatus = (s) => {
      if (!s) return false;
      const str = String(s).toUpperCase().trim();
      return ['READY', 'READY_FOR_DELIVERY', 'READY_FOR_TRIAL', 'READY FOR DELIVERY', 'READY FOR TRIAL', 'TRIAL_READY'].includes(str);
    };

    const normalizeDisplayStatus = (s) => {
      if (!s) return 'Pending Assignment';
      const str = String(s).toUpperCase().trim();
      if (str === 'PENDING_ASSIGNMENT') return 'Pending Assignment';
      if (str === 'ASSIGNED') return 'Assigned to Tailor';
      if (str === 'IN_PROGRESS' || str === 'STITCHING' || str === 'CUTTING') return 'In Progress';
      if (str === 'ACTIVE' || str === 'PENDING') return 'Pending';
      if (str === 'RECEIVED') return 'Received';
      if (str === 'READY' || str === 'READY_FOR_DELIVERY' || str === 'READY FOR DELIVERY') return 'Ready for Delivery';
      if (str === 'READY_FOR_TRIAL' || str === 'READY FOR TRIAL') return 'Ready for Trial';
      if (str === 'COLLECTED' || str === 'CLOSED' || str === 'DELIVERED') return 'Delivered';
      return s;
    };

    const allUnifiedItems = [];

    // 1. Map PSSM Items
    for (const item of pssmItems) {
      const pssm = item.pssmId || {};
      const saleBill = item.saleBillId || pssm.saleBillId || {};
      const invPiece = item.inventoryPieceId || {};

      const expDate = item.expectedDeliveryDate || pssm.expectedDeliveryDate || pssm.deliveryDate
        ? new Date(item.expectedDeliveryDate || pssm.expectedDeliveryDate || pssm.deliveryDate)
        : null;

      const sId = item.salesmanId || pssm.salesmanId || saleBill.salesmanId;
      const sName = item.salesmanName || pssm.salesmanName || saleBill.salesmanName || '';
      const createdBy = (item.createdBy || pssm.createdBy || saleBill.createdBy)?.toString();

      const resolvedBillNo = pssm.billNo || pssm.billBarcode || saleBill.billNo || saleBill.invoiceNo || pssm.originalInvoiceNo || 'N/A';
      const resolvedCustomerName = pssm.customerName || pssm.customerId?.name || saleBill.customerName || item.customerName || 'Walk-in Customer';
      const resolvedCustomerPhone = pssm.customerPhone || pssm.customerId?.phone || pssm.whatsappNumber || pssm.alternatePhone || saleBill.customerPhone || item.customerPhone || '';
      const resolvedItemName = item.pieceName || item.productName || item.itemName || invPiece.pieceName || invPiece.productName || pssm.garmentName || item.serviceType || 'Garment Item';
      const resolvedBarcode = item.alterationBarcode || item.tailorInvoiceNo || item.barcode || item.uniqueCode || item.sku || invPiece.barcode || (pssm.pssmNo ? `${pssm.pssmNo}-${item._id.toString().slice(-4)}` : '');
      const resolvedTailor = item.assignedTo || pssm.tailorName || 'In-House Karigar';
      const rawStatus = item.status || pssm.status || 'PENDING_ASSIGNMENT';

      const key = `${resolvedBillNo}_${resolvedBarcode}_${item._id}`;
      existingItemKeys.add(key);
      if (pssm.pssmNo) existingItemKeys.add(pssm.pssmNo);
      if (resolvedBarcode) existingItemKeys.add(resolvedBarcode);

      allUnifiedItems.push({
        id: item._id,
        _id: item._id,
        source: 'PSSM',
        ticketNo: pssm.pssmNo || 'N/A',
        billNo: resolvedBillNo,
        customerName: resolvedCustomerName,
        customerPhone: resolvedCustomerPhone,
        salesmanId: sId,
        salesmanName: sName,
        createdBy,
        itemName: resolvedItemName,
        productName: resolvedItemName,
        name: resolvedItemName,
        serviceType: item.serviceType || pssm.serviceType || 'Alteration',
        alterationDetails: item.alterationDetails || (item.instructions ? [item.instructions] : []),
        assignedTailor: resolvedTailor,
        assignedTo: resolvedTailor,
        deliveryDate: expDate ? expDate.toISOString().split('T')[0] : '',
        deliveryDateObj: expDate,
        status: normalizeDisplayStatus(rawStatus),
        rawStatus: rawStatus,
        priority: item.priority || pssm.priority || 'NORMAL',
        barcode: resolvedBarcode,
        measurements: item.measurements || {},
        instructions: item.instructions || pssm.specialInstructions || '',
        createdAt: item.createdAt,
        reassignedFromSalesmanName: item.reassignedFromSalesmanName,
        reassignedFromSalesmanId: item.reassignedFromSalesmanId,
        reassignedReason: item.reassignedReason
      });
    }

    // 2. Map Alterations (Legacy / Direct)
    for (const alt of alterations) {
      if (existingItemKeys.has(alt.alterationNo)) continue;
      const saleBill = alt.saleBillId || {};
      const expDate = alt.expectedDeliveryDate ? new Date(alt.expectedDeliveryDate) : null;
      const sId = alt.salesmanId || saleBill.salesmanId;
      const sName = alt.salesmanName || saleBill.salesmanName || '';
      const createdBy = (alt.createdBy || saleBill.createdBy)?.toString();

      const resolvedBillNo = saleBill.billNo || alt.invoiceNumber || 'N/A';
      const resolvedCustomerName = alt.customerName || alt.customerId?.name || saleBill.customerName || 'Walk-in Customer';
      const resolvedCustomerPhone = alt.customerPhone || alt.customerId?.phone || saleBill.customerPhone || '';
      const resolvedItemName = alt.itemName || alt.productName || alt.garmentType || alt.serviceType || (alt.alterationDetails && alt.alterationDetails[0]) || 'Altered Garment';
      const resolvedBarcode = alt.alterationNo || alt.barcode || '';
      const resolvedTailor = alt.tailorName || 'In-House Karigar';
      const rawStatus = alt.status || 'Pending';

      allUnifiedItems.push({
        id: alt._id,
        _id: alt._id,
        source: 'ALTERATION',
        ticketNo: alt.alterationNo || 'N/A',
        billNo: resolvedBillNo,
        customerName: resolvedCustomerName,
        customerPhone: resolvedCustomerPhone,
        salesmanId: sId,
        salesmanName: sName,
        createdBy,
        itemName: resolvedItemName,
        productName: resolvedItemName,
        name: resolvedItemName,
        serviceType: alt.serviceType || 'Alteration',
        alterationDetails: alt.alterationDetails || [],
        assignedTailor: resolvedTailor,
        assignedTo: resolvedTailor,
        deliveryDate: expDate ? expDate.toISOString().split('T')[0] : '',
        deliveryDateObj: expDate,
        status: normalizeDisplayStatus(rawStatus),
        rawStatus: rawStatus,
        priority: alt.priority || 'NORMAL',
        barcode: resolvedBarcode,
        createdAt: alt.createdAt
      });
    }

    // 3. Map Tailoring Jobs
    for (const tj of tailoringJobs) {
      if (existingItemKeys.has(tj.tailorInvoiceNo)) continue;
      const saleBill = tj.saleBillId || {};
      const expDate = tj.expectedDeliveryDate ? new Date(tj.expectedDeliveryDate) : null;
      const sId = tj.salesmanId || saleBill.salesmanId;
      const sName = tj.salesmanName || saleBill.salesmanName || '';
      const createdBy = (tj.createdBy || saleBill.createdBy)?.toString();

      const resolvedBillNo = tj.billNo || saleBill.billNo || 'N/A';
      const resolvedCustomerName = tj.customerName || tj.customerId?.name || saleBill.customerName || 'Walk-in Customer';
      const resolvedCustomerPhone = tj.mobileNumber || tj.customerId?.phone || saleBill.customerPhone || '';
      const resolvedItemName = tj.garmentService || 'Tailoring Work';
      const rawStatus = tj.currentStatus || 'PENDING';

      allUnifiedItems.push({
        id: tj._id,
        _id: tj._id,
        source: 'TAILORING',
        ticketNo: tj.tailorInvoiceNo,
        billNo: resolvedBillNo,
        customerName: resolvedCustomerName,
        customerPhone: resolvedCustomerPhone,
        salesmanId: sId,
        salesmanName: sName,
        createdBy,
        itemName: resolvedItemName,
        productName: resolvedItemName,
        name: resolvedItemName,
        serviceType: tj.garmentService || 'Tailoring',
        alterationDetails: tj.specialInstructions ? [tj.specialInstructions] : [],
        assignedTailor: 'In-House Karigar',
        assignedTo: 'In-House Karigar',
        deliveryDate: expDate ? expDate.toISOString().split('T')[0] : '',
        deliveryDateObj: expDate,
        status: normalizeDisplayStatus(rawStatus),
        rawStatus: rawStatus,
        priority: 'NORMAL',
        barcode: tj.tailorInvoiceNo,
        measurements: tj.measurement || {},
        instructions: tj.specialInstructions || '',
        createdAt: tj.createdAt
      });
    }

    // Helper: Verify if item was assigned by, created by, sold by, or assigned to this salesperson
    const isItemOwnedBySalesperson = (item) => {
      if (!isSalespersonScoped) return true;

      // 1. Candidate ID matches
      const candidateIds = [
        item.salesmanId?.toString(),
        item.createdBy?.toString(),
        item.reassignedFromSalesmanId?.toString()
      ].filter(Boolean);

      if (candidateIds.some(id => allowedSalesmanIds.has(id))) return true;

      // 2. Candidate Name matches
      const candidateNames = [
        item.salesmanName,
        item.reassignedFromSalesmanName
      ].filter(Boolean).map(n => String(n).toLowerCase().trim());

      if (candidateNames.some(name => allowedSalesmanNames.has(name))) return true;

      return false;
    };

    // Filter active dataset strictly by salesperson ownership
    const activeDataset = isSalespersonScoped ? allUnifiedItems.filter(isItemOwnedBySalesperson) : allUnifiedItems;

    const totalAssignedServices = activeDataset.length;
    const pendingCount = activeDataset.filter(i => !isDeliveredStatus(i.rawStatus) && !isReadyStatus(i.rawStatus)).length;
    const readyCount = activeDataset.filter(i => isReadyStatus(i.rawStatus)).length;
    const deliveredCount = activeDataset.filter(i => isDeliveredStatus(i.rawStatus)).length;

    const overdueCount = activeDataset.filter(i => {
      if (!i.deliveryDateObj) return false;
      return !isDeliveredStatus(i.rawStatus) && i.deliveryDateObj < todayStart;
    }).length;

    const reAlterCount = activeDataset.filter(i => {
      const details = Array.isArray(i.alterationDetails) ? i.alterationDetails.join(' ').toLowerCase() : '';
      return /re-alter|realter|trial|repair|urgent|high/i.test((i.priority || '') + ' ' + (i.serviceType || '') + ' ' + details);
    }).length;

    // Filter Pending List: Stays in list UNTIL marked DELIVERED / COLLECTED
    const pendingList = activeDataset.filter(i => !isDeliveredStatus(i.rawStatus)).map(i => ({
      ...i,
      isOverdue: Boolean(i.deliveryDateObj && i.deliveryDateObj < todayStart),
      isDueToday: Boolean(i.deliveryDateObj && i.deliveryDateObj >= todayStart && i.deliveryDateObj <= todayEnd),
      isReady: isReadyStatus(i.rawStatus)
    }));

    // Follow-up Lists:
    const callTodayList = activeDataset.filter(i => {
      if (isDeliveredStatus(i.rawStatus)) return false;
      if (i.deliveryDateObj && i.deliveryDateObj >= todayStart && i.deliveryDateObj <= todayEnd) return true;
      return false;
    });

    const readyPickupList = activeDataset.filter(i => isReadyStatus(i.rawStatus));

    const overdueFollowupList = activeDataset.filter(i => {
      if (!i.deliveryDateObj) return false;
      return !isDeliveredStatus(i.rawStatus) && !isReadyStatus(i.rawStatus) && i.deliveryDateObj < todayStart;
    });

    const didNotPickUpList = activeDataset.filter(i => {
      if (!isReadyStatus(i.rawStatus)) return false;
      if (!i.deliveryDateObj) return false;
      return i.deliveryDateObj < todayStart;
    });

    return {
      summary: {
        totalAssignedServices,
        pending: pendingCount,
        ready: readyCount,
        delivered: deliveredCount,
        overdue: overdueCount,
        reAlterCases: reAlterCount
      },
      salesmanInfo: {
        id: effectiveSalesmanId || userId,
        name: effectiveSalesmanName || 'Sales Staff',
        isOwnItems: isSalespersonScoped
      },
      pendingList,
      followUp: {
        callToday: callTodayList,
        readyForPickup: readyPickupList,
        overdue: overdueFollowupList,
        didNotPickUp: didNotPickUpList
      }
    };
  }

  static async assignTailorVendor(pssmItemId, tailorName, userId, tenantId, extra = {}) {
    const item = await PSSMItem.findOne({ _id: pssmItemId, tenantId });
    if (!item) throw new ApiError(404, 'PSSM Item not found.');

    const pssm = await PSSM.findOne({ _id: item.pssmId, tenantId }).lean();
    const oldAssigned = item.assignedTo || 'Unassigned';
    const isVendor = extra.isVendor || (tailorName && tailorName.toLowerCase().includes('vendor')) || Boolean(extra.vendorName);
    const effectiveAssignee = tailorName || extra.vendorName || extra.tailorName;

    item.assignedTo = effectiveAssignee;
    item.status = 'ASSIGNED';
    await item.save();

    // Audit log if changed
    if (oldAssigned !== effectiveAssignee) {
      const actionType = isVendor ? 'VENDOR_CHANGE' : 'TAILOR_CHANGE';
      const fieldName = isVendor ? 'Vendor' : 'Tailor';
      const defaultReason = isVendor
        ? `Garment routed to vendor: ${effectiveAssignee}`
        : (oldAssigned === 'Unassigned' ? `Assigned to tailor: ${effectiveAssignee}` : `Tailor reassigned from ${oldAssigned} to ${effectiveAssignee}`);

      await AuditService.trackAuditLog({
        tenantId,
        userId,
        userName: extra.userName || 'Authorized Staff',
        action: actionType,
        module: 'pssm',
        entityId: item._id.toString(),
        entityType: 'PSSM',
        displayName: `${item.pieceName || 'Garment'} (${item.barcode || item.uniqueCode || item.sku || 'N/A'})`,
        item: `Bill #${pssm?.billNo || 'PSSM'} - ${item.pieceName || item.barcode || 'Item'}`,
        fieldChanged: fieldName,
        oldValue: oldAssigned,
        newValue: effectiveAssignee,
        reason: extra.reason || defaultReason,
        details: {
          pssmNo: pssm?.pssmNo,
          billNo: pssm?.billNo,
          customerName: pssm?.customerName,
          customerPhone: pssm?.customerPhone,
          oldAssigned,
          newAssigned: effectiveAssignee
        }
      }, extra.io);
    }

    await this.recalculateMasterStatus(item.pssmId, tenantId);

    return item;
  }

  static async updateItemStatus(pssmItemId, status, measurements, alterationDetails, userId, tenantId, extra = {}) {
    const item = await PSSMItem.findOne({ _id: pssmItemId, tenantId });
    if (!item) throw new ApiError(404, 'PSSM Item not found.');

    const pssm = await PSSM.findOne({ _id: item.pssmId, tenantId });
    const oldStatus = item.status;
    const normalizedOldStatus = String(oldStatus || '').toUpperCase().replace(/[\s-]+/g, '_');
    const normalizedNewStatus = String(status || '').toUpperCase().replace(/[\s-]+/g, '_');
    const isReadyForCollection = ['READY', 'READY_FOR_DELIVERY', 'READY_FOR_COLLECTION'].includes(normalizedOldStatus);
    if (['COLLECTED', 'DELIVERED'].includes(normalizedNewStatus) && !isReadyForCollection) {
      throw new ApiError(400, 'A tailoring job must be marked Ready before it can be Delivered. Please complete the workflow in sequence.');
    }
    const oldTailor = item.assignedTo;
    const oldServiceType = item.serviceType;
    const oldAltDetails = (item.alterationDetails || []).join(', ');
    const oldDelDate = item.expectedDeliveryDate ? new Date(item.expectedDeliveryDate).toLocaleDateString('en-IN') : null;

    // 1. DELIVERY DATE CHANGE
    const incomingDelDate = extra.deliveryDate || extra.expectedDeliveryDate;
    if (incomingDelDate) {
      const newDelDateObj = new Date(incomingDelDate);
      const newDelDateStr = newDelDateObj.toLocaleDateString('en-IN');
      if (oldDelDate !== newDelDateStr) {
        item.expectedDeliveryDate = newDelDateObj;
        await AuditService.trackAuditLog({
          tenantId,
          userId,
          userName: extra.userName || 'Authorized Staff',
          action: 'DELIVERY_DATE_CHANGE',
          module: 'pssm',
          entityId: item._id.toString(),
          entityType: 'PSSM',
          displayName: `${item.pieceName || 'Garment'} (${item.barcode || item.uniqueCode || 'N/A'})`,
          item: `Bill #${pssm?.billNo || 'PSSM'} - Delivery Date Rescheduled`,
          fieldChanged: 'Delivery Date',
          oldValue: oldDelDate || 'Not set',
          newValue: newDelDateStr,
          reason: extra.reason || 'Delivery deadline rescheduled',
          details: { pssmNo: pssm?.pssmNo, billNo: pssm?.billNo, oldDeliveryDate: oldDelDate, newDeliveryDate: newDelDateStr }
        }, extra.io);
      }
    }

    // 2. TAILOR / VENDOR CHANGE
    if (extra.tailorName && extra.tailorName !== oldTailor) {
      const isVendor = extra.isVendor || (extra.tailorName && extra.tailorName.toLowerCase().includes('vendor')) || Boolean(extra.vendorName);
      item.assignedTo = extra.tailorName;
      await AuditService.trackAuditLog({
        tenantId,
        userId,
        userName: extra.userName || 'Authorized Staff',
        action: isVendor ? 'VENDOR_CHANGE' : 'TAILOR_CHANGE',
        module: 'pssm',
        entityId: item._id.toString(),
        entityType: 'PSSM',
        displayName: `${item.pieceName || 'Garment'} (${item.barcode || item.uniqueCode || 'N/A'})`,
        item: `Bill #${pssm?.billNo || 'PSSM'} - ${isVendor ? 'Vendor' : 'Tailor'} Reassigned`,
        fieldChanged: isVendor ? 'Vendor' : 'Tailor',
        oldValue: oldTailor || 'Unassigned',
        newValue: extra.tailorName,
        reason: extra.reason || (isVendor ? `Vendor assigned: ${extra.tailorName}` : `Tailor changed to: ${extra.tailorName}`),
        details: { pssmNo: pssm?.pssmNo, billNo: pssm?.billNo, oldAssigned: oldTailor, newAssigned: extra.tailorName }
      }, extra.io);
    } else if (extra.vendorName && extra.vendorName !== oldTailor) {
      item.assignedTo = extra.vendorName;
      await AuditService.trackAuditLog({
        tenantId,
        userId,
        userName: extra.userName || 'Authorized Staff',
        action: 'VENDOR_CHANGE',
        module: 'pssm',
        entityId: item._id.toString(),
        entityType: 'PSSM',
        displayName: `${item.pieceName || 'Garment'} (${item.barcode || item.uniqueCode || 'N/A'})`,
        item: `Bill #${pssm?.billNo || 'PSSM'} - Vendor Reassigned`,
        fieldChanged: 'Vendor',
        oldValue: oldTailor || 'In-House',
        newValue: extra.vendorName,
        reason: extra.reason || `Vendor reassigned: ${extra.vendorName}`,
        details: { pssmNo: pssm?.pssmNo, billNo: pssm?.billNo, oldVendor: oldTailor, newVendor: extra.vendorName }
      }, extra.io);
    }

    // 3. SERVICE CHANGE
    const newServiceType = extra.serviceType;
    const newAltDetails = alterationDetails && Array.isArray(alterationDetails) ? alterationDetails.join(', ') : null;
    if (newServiceType && newServiceType !== oldServiceType) {
      item.serviceType = newServiceType;
      await AuditService.trackAuditLog({
        tenantId,
        userId,
        userName: extra.userName || 'Authorized Staff',
        action: 'SERVICE_CHANGE',
        module: 'pssm',
        entityId: item._id.toString(),
        entityType: 'PSSM',
        displayName: `${item.pieceName || 'Garment'} (${item.barcode || item.uniqueCode || 'N/A'})`,
        item: `Bill #${pssm?.billNo || 'PSSM'} - Service Type Modified`,
        fieldChanged: 'Service Type',
        oldValue: oldServiceType || 'Alteration',
        newValue: newServiceType,
        reason: extra.reason || 'Service type updated',
        details: { pssmNo: pssm?.pssmNo, billNo: pssm?.billNo }
      }, extra.io);
    }
    if (newAltDetails !== null && newAltDetails !== oldAltDetails) {
      item.alterationDetails = alterationDetails;
      await AuditService.trackAuditLog({
        tenantId,
        userId,
        userName: extra.userName || 'Authorized Staff',
        action: 'SERVICE_CHANGE',
        module: 'pssm',
        entityId: item._id.toString(),
        entityType: 'PSSM',
        displayName: `${item.pieceName || 'Garment'} (${item.barcode || item.uniqueCode || 'N/A'})`,
        item: `Bill #${pssm?.billNo || 'PSSM'} - Alteration Specifications Modified`,
        fieldChanged: 'Alteration Details',
        oldValue: oldAltDetails || 'Standard',
        newValue: newAltDetails || 'None',
        reason: extra.reason || 'Alteration specifications modified',
        details: { pssmNo: pssm?.pssmNo, billNo: pssm?.billNo }
      }, extra.io);
    }

    // 4. CUSTOMER MOBILE CHANGE
    const incomingPhone = extra.customerPhone || extra.customerMobile;
    if (incomingPhone && pssm && pssm.customerPhone !== incomingPhone) {
      const oldPhone = pssm.customerPhone;
      pssm.customerPhone = incomingPhone;
      await pssm.save();

      await AuditService.trackAuditLog({
        tenantId,
        userId,
        userName: extra.userName || 'Authorized Staff',
        action: 'CUSTOMER_MOBILE_CHANGE',
        module: 'pssm',
        entityId: pssm._id.toString(),
        entityType: 'PSSM',
        displayName: `${pssm.customerName || 'Customer'}`,
        item: `Bill #${pssm.billNo || ''} - Customer Mobile Updated`,
        fieldChanged: 'Customer Mobile',
        oldValue: oldPhone || 'None',
        newValue: incomingPhone,
        reason: extra.reason || 'Customer contact mobile updated',
        details: { pssmNo: pssm.pssmNo, billNo: pssm.billNo, oldPhone, newPhone: incomingPhone }
      }, extra.io);
    }

    // 5. STATUS UPDATE & MANUAL DELIVERY
    if (status && status !== oldStatus) {
      item.status = status;
      if (status === 'READY') {
        item.completedAt = new Date();
        item.completedBy = userId;
      } else if (status === 'COLLECTED' || status === 'DELIVERED') {
        item.collectedAt = new Date();
      }

      const isManualDelivery = (status === 'COLLECTED' || status === 'DELIVERED');
      await AuditService.trackAuditLog({
        tenantId,
        userId,
        userName: extra.userName || 'Authorized Staff',
        action: isManualDelivery ? 'MANUAL_DELIVERY' : 'MANUAL_STATUS_UPDATE',
        module: 'pssm',
        entityId: item._id.toString(),
        entityType: 'PSSM',
        displayName: `${item.pieceName || 'Garment'} (${item.barcode || item.uniqueCode || 'N/A'})`,
        item: `Bill #${pssm?.billNo || 'PSSM'} - ${isManualDelivery ? 'Garment Handed Over' : 'Status Changed'}`,
        fieldChanged: isManualDelivery ? 'Delivery Status' : 'Status',
        oldValue: oldStatus,
        newValue: status,
        reason: extra.reason || (isManualDelivery ? 'Garment handed over to customer / Collected' : `Status updated from ${oldStatus} to ${status}`),
        details: { pssmNo: pssm?.pssmNo, billNo: pssm?.billNo, oldStatus, newStatus: status }
      }, extra.io);
    }

    if (measurements) item.measurements = measurements;
    if (alterationDetails && !newAltDetails) item.alterationDetails = alterationDetails;
    if (extra.trialRequired !== undefined) {
      item.trialRequired = Boolean(extra.trialRequired);
      if (!item.trialRequired) item.trialDate = undefined;
      if (pssm) {
        pssm.trialRequired = item.trialRequired;
        if (!item.trialRequired) pssm.trialDate = undefined;
      }
    }
    if (extra.trialDate && item.trialRequired) {
      item.trialDate = new Date(extra.trialDate);
      if (pssm) pssm.trialDate = item.trialDate;
    }
    if (extra.fittingResult !== undefined) {
      item.fittingResult = extra.fittingResult;
      if (pssm) pssm.fittingResult = extra.fittingResult;
    }
    if (extra.requiredChanges !== undefined) {
      item.requiredChanges = extra.requiredChanges;
      if (pssm) pssm.requiredChanges = extra.requiredChanges;
    }
    if (extra.reAlterationRequired !== undefined) {
      item.reAlterationRequired = Boolean(extra.reAlterationRequired);
      if (pssm) pssm.reAlterationRequired = Boolean(extra.reAlterationRequired);
    }
    if (extra.remarks || extra.specialInstructions || extra.customAlterationText) {
      const rem = extra.remarks || extra.specialInstructions || extra.customAlterationText;
      item.instructions = rem;
      if (pssm) pssm.remarks = rem;
    }
    if (pssm) await pssm.save();

    if (status === 'COLLECTED') {
      try {
        let pId = item.inventoryPieceId;
        if (!pId && (item.barcode || item.uniqueCode)) {
          const piece = await InventoryPiece.findOne({
            tenantId,
            $or: [
              ...(item.barcode ? [{ barcode: item.barcode }] : []),
              ...(item.uniqueCode ? [{ uniqueCode: item.uniqueCode }] : [])
            ]
          });
          if (piece) pId = piece._id;
        }
        if (pId) {
          await InventoryPiece.updateOne(
            { _id: pId, tenantId },
            { $set: { currentLocation: 'DELIVERED_TO_CUSTOMER', sold: true } }
          );
        }
      } catch (e) {
        console.warn('[PSSMService] Non-fatal piece update on status change:', e.message);
      }
    }

    await item.save();

    if (['READY', 'COLLECTED', 'CLOSED', 'COMPLETED'].includes(status)) {
      await NotificationService.resolveAlertsForPSSItem(item._id, tenantId, status);
    }

    await this.recalculateMasterStatus(item.pssmId, tenantId);

    return item;
  }

  static async getBillPSSMByBarcode(billBarcode, tenantId) {
    const trimmed = String(billBarcode || '').trim();
    if (!trimmed) return null;

    const mongoose = require('mongoose');
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}$`, 'i');

    let pssm = await PSSM.findOne({
      tenantId,
      $or: [
        { slipBarcode: regex },
        { billBarcode: regex },
        { billNo: regex },
        { pssmNo: regex },
        ...(mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24 ? [{ _id: trimmed }, { saleBillId: trimmed }] : [])
      ]
    }).lean();

    let matchedItem = null;

    // Fallback: If not found on PSSM header, check if scanned value is a garment item barcode/uniqueCode/alterationBarcode/tailorInvoiceNo
    if (!pssm) {
      const pssmItem = await PSSMItem.findOne({
        tenantId,
        $or: [
          { alterationBarcode: regex },
          { tailorInvoiceNo: regex },
          { barcode: regex },
          { uniqueCode: regex }
        ]
      }).lean();

      if (pssmItem && pssmItem.pssmId) {
        matchedItem = pssmItem;
        pssm = await PSSM.findOne({ tenantId, _id: pssmItem.pssmId }).lean();
      }
    }

    if (!pssm) return null;

    const items = await PSSMItem.find({ tenantId, pssmId: pssm._id }).lean();

    return {
      pssm,
      items,
      matchedItemId: matchedItem ? matchedItem._id : null
    };
  }

  static async processCollection(billBarcode, itemIdsToCollect, userId, tenantId, extra = {}) {
    const pssmData = await this.getBillPSSMByBarcode(billBarcode, tenantId);
    if (!pssmData) throw new ApiError(404, 'No PSSM record found for this Bill Barcode.');

    const targetItemIds = itemIdsToCollect && itemIdsToCollect.length > 0
      ? itemIdsToCollect
      : pssmData.items.filter(i => i.status !== 'COLLECTED').map(i => i._id.toString());

    await PSSMItem.updateMany(
      { tenantId, _id: { $in: targetItemIds } },
      { $set: { status: 'COLLECTED', collectedAt: new Date() } }
    );

    for (const itmId of targetItemIds) {
      await NotificationService.resolveAlertsForPSSItem(itmId, tenantId, 'COLLECTED');
    }

    // Update inventory piece to reflect customer collection
    try {
      const InventoryPiece = require('../models/InventoryPiece');
      const InventoryLifecycle = require('../models/InventoryLifecycle');
      const { LIFECYCLE_EVENT, ALTERATION_STATUS } = require('../constants/status');
      const Alteration = require('../models/alteration/Alteration');
      const AlterationItem = require('../models/alteration/AlterationItem');

      const collectedDocs = await PSSMItem.find({ tenantId, _id: { $in: targetItemIds } });
      for (const itm of collectedDocs) {
        let pId = itm.inventoryPieceId;
        if (!pId && (itm.barcode || itm.uniqueCode)) {
          const piece = await InventoryPiece.findOne({
            tenantId,
            $or: [
              ...(itm.barcode ? [{ barcode: itm.barcode }] : []),
              ...(itm.uniqueCode ? [{ uniqueCode: itm.uniqueCode }] : [])
            ]
          });
          if (piece) pId = piece._id;
        }

        if (pId) {
          await InventoryPiece.updateOne(
            { _id: pId, tenantId },
            { $set: { currentLocation: 'DELIVERED_TO_CUSTOMER', sold: true } }
          );

          await InventoryLifecycle.create({
            tenantId,
            inventoryPieceId: pId,
            barcode: itm.barcode,
            eventType: LIFECYCLE_EVENT.SALE || 'SALE',
            fromLocation: 'SHOWROOM_SERVICE',
            toLocation: 'CUSTOMER',
            referenceId: pssmData.pssm._id,
            referenceModel: 'PSSM',
            performedBy: userId,
            notes: `Garment collected by customer: ${itm.pieceName || itm.productName}`
          }).catch(() => {});
        }

        // Audit Trail: MANUAL DELIVERY
        await AuditService.trackAuditLog({
          tenantId,
          userId,
          userName: extra.userName || 'Authorized Staff',
          action: 'MANUAL_DELIVERY',
          module: 'pssm',
          entityId: itm._id.toString(),
          entityType: 'PSSM',
          displayName: `${itm.pieceName || 'Garment'} (${itm.barcode || itm.uniqueCode || 'N/A'})`,
          item: `Bill #${pssmData.pssm?.billNo || 'PSSM'} - Item Collected / Delivered`,
          fieldChanged: 'Delivery Status',
          oldValue: itm.status || 'READY',
          newValue: 'COLLECTED / DELIVERED',
          reason: extra.reason || 'Garment handed over to customer / Collected',
          details: { billBarcode, billNo: pssmData.pssm?.billNo, pssmNo: pssmData.pssm?.pssmNo }
        }, extra.io);
      }

      // Sync matching Alteration / AlterationItem records if present
      const altMatch = await Alteration.findOne({
        tenantId,
        $or: [
          { alterationNo: pssmData.pssm.pssmNo },
          ...(pssmData.pssm.saleBillId ? [{ saleBillId: pssmData.pssm.saleBillId }] : [])
        ]
      });

      if (altMatch) {
        for (const itm of collectedDocs) {
          await AlterationItem.updateMany(
            {
              tenantId,
              alterationId: altMatch._id,
              $or: [
                ...(itm.barcode ? [{ barcode: itm.barcode }] : []),
                ...(itm.uniqueCode ? [{ uniqueCode: itm.uniqueCode }] : []),
                ...(itm.inventoryPieceId ? [{ inventoryPieceId: itm.inventoryPieceId }] : [])
              ]
            },
            { $set: { status: 'COLLECTED' } }
          );
        }

        const remainingAltItems = await AlterationItem.find({
          tenantId,
          alterationId: altMatch._id,
          status: { $ne: 'COLLECTED' }
        });

        if (remainingAltItems.length === 0) {
          await Alteration.updateOne(
            { _id: altMatch._id, tenantId },
            { $set: { status: ALTERATION_STATUS.DELIVERED, deliveredAt: new Date() } }
          );
        }
      }
    } catch (pieceErr) {
      console.warn('[PSSMService] Non-fatal sync on collection:', pieceErr.message);
    }

    await this.recalculateMasterStatus(pssmData.pssm._id, tenantId);

    return await this.getBillPSSMByBarcode(billBarcode, tenantId);
  }

  static async recalculateMasterStatus(pssmId, tenantId) {
    const items = await PSSMItem.find({ tenantId, pssmId }).lean();
    if (!items || !items.length) return;

    let masterStatus = 'PENDING_ASSIGNMENT';

    const allCollected = items.length > 0 && items.every(i => i.status === 'COLLECTED' || i.status === 'CLOSED');
    const someCollected = items.some(i => i.status === 'COLLECTED' || i.status === 'CLOSED');
    const allReady = items.every(i => i.status === 'READY' || i.status === 'COLLECTED' || i.status === 'CLOSED');
    const someReady = items.some(i => i.status === 'READY' || i.status === 'COLLECTED' || i.status === 'CLOSED');
    const allAssigned = items.every(i => i.status !== 'PENDING_ASSIGNMENT');
    const someInProgress = items.some(i => i.status === 'IN_PROGRESS');

    if (allCollected) {
      masterStatus = 'CLOSED';
    } else if (someCollected) {
      masterStatus = 'PARTIALLY_COLLECTED';
    } else if (allReady) {
      masterStatus = 'READY_FOR_DELIVERY';
    } else if (someReady) {
      masterStatus = 'PARTIALLY_READY';
    } else if (someInProgress) {
      masterStatus = 'IN_PROGRESS';
    } else if (allAssigned) {
      masterStatus = 'ASSIGNED';
    }

    await PSSM.updateOne({ _id: pssmId, tenantId }, { $set: { status: masterStatus } });
  }

  static async getAllPSSMRecords(query, tenantId) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { tenantId };
    if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }
    if (query.search) {
      filter.$or = [
        { pssmNo: { $regex: query.search, $options: 'i' } },
        { billNo: { $regex: query.search, $options: 'i' } },
        { billBarcode: { $regex: query.search, $options: 'i' } },
        { customerName: { $regex: query.search, $options: 'i' } },
        { customerPhone: { $regex: query.search, $options: 'i' } }
      ];
    }

    const total = await PSSM.countDocuments(filter);
    const pssmRecords = await PSSM.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const pssmIds = pssmRecords.map(r => r._id);
    const items = await PSSMItem.find({ tenantId, pssmId: { $in: pssmIds } }).lean();

    const result = pssmRecords.map(record => ({
      ...record,
      items: items.filter(i => i.pssmId.toString() === record._id.toString())
    }));

    return {
      records: result,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async trackPSSMPublic(pssmNo) {
    const trimmed = String(pssmNo || '').trim();
    if (!trimmed) throw new ApiError(400, 'PSSM number or barcode is required.');

    const mongoose = require('mongoose');
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}$`, 'i');

    const Alteration = require('../models/alteration/Alteration');
    const TailoringJob = require('../models/tailoring/TailoringJob');
    const SaleBill = require('../models/billing/SaleBill');

    // 1. Try finding PSSM by pssmNo, slipBarcode, billBarcode, billNo, or _id
    let pssm = await PSSM.findOne({
      $or: [
        { pssmNo: regex },
        { slipBarcode: regex },
        { billBarcode: regex },
        { billNo: regex },
        ...(mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24 ? [{ _id: trimmed }] : [])
      ]
    }).lean();

    // 2. If not found directly, check if it matches an item's tailorInvoiceNo or alterationBarcode
    let matchedItem = null;
    if (!pssm) {
      matchedItem = await PSSMItem.findOne({
        $or: [
          { alterationBarcode: regex },
          { tailorInvoiceNo: regex },
          { barcode: regex },
          { uniqueCode: regex }
        ]
      }).lean();

      if (matchedItem && matchedItem.pssmId) {
        pssm = await PSSM.findById(matchedItem.pssmId).lean();
      }
    }

    if (!pssm) {
      throw new ApiError(404, `No alteration records found matching "${trimmed}".`);
    }

    // Retrieve all PSSMItems for this PSSM
    const pssmItems = await PSSMItem.find({ pssmId: pssm._id }).lean();

    // Cross-reference Alteration and TailoringJob records
    const billFilter = [
      { pssmId: pssm._id }
    ];
    if (pssm.saleBillId) billFilter.push({ saleBillId: pssm.saleBillId });
    if (pssm.billNo) billFilter.push({ invoiceNumber: pssm.billNo });

    let alterations = [];
    let tailoringJobs = [];
    if (billFilter.length > 0) {
      alterations = await Alteration.find({ $or: billFilter }).lean();
      tailoringJobs = await TailoringJob.find({ $or: billFilter }).lean();
    }

    // Fetch SaleBill info if linked
    let bill = null;
    if (pssm.saleBillId) {
      bill = await SaleBill.findById(pssm.saleBillId).populate('firmId customerId').lean();
    } else if (pssm.billNo) {
      bill = await SaleBill.findOne({ billNo: pssm.billNo, isDeleted: false }).populate('firmId customerId').lean();
    }

    // Consolidate alteration items
    const consolidatedItems = [];
    const seenTIs = new Set();

    (pssmItems || []).forEach((pi, idx) => {
      const ti = pi.tailorInvoiceNo || (pi.alterationBarcode && String(pi.alterationBarcode).startsWith('TI-') ? pi.alterationBarcode : null) || `TI-${idx + 1}`;
      seenTIs.add(ti);
      const matchedAlt = alterations.find(a => a.tailorInvoiceNo === pi.tailorInvoiceNo || a.alterationBarcode === pi.alterationBarcode || String(a.pssmItemId) === String(pi._id));
      const matchedJob = tailoringJobs.find(tj => tj.tailorInvoiceNo === pi.tailorInvoiceNo || String(tj.pssmItemId) === String(pi._id));

      const rawStatus = pi.status || matchedAlt?.status || matchedJob?.status || 'PENDING';
      const formattedStatus = String(rawStatus).toUpperCase().replace(/-/g, '_');

      consolidatedItems.push({
        id: pi._id,
        itemIndex: idx + 1,
        garmentName: pi.productName || pi.pieceName || pi.name || 'Altered Garment',
        size: pi.size || 'Free',
        color: pi.color || 'Standard',
        gender: pi.gender || 'Gents',
        barcode: pi.barcode || pi.uniqueCode || '',
        tailorInvoiceNo: pi.tailorInvoiceNo || matchedAlt?.tailorInvoiceNo || matchedJob?.tailorInvoiceNo || ti,
        alterationBarcode: pi.alterationBarcode || matchedAlt?.alterationBarcode || pi.tailorInvoiceNo || `${pssm.pssmNo}-${idx + 1}`,
        tailorName: pi.assignedTo || matchedAlt?.tailorName || matchedJob?.assignedToTailorName || 'Master Tailor',
        status: formattedStatus,
        serviceType: pi.serviceType || matchedAlt?.serviceType || 'Alteration',
        alterationDetails: pi.alterationDetails || matchedAlt?.alterationDetails || [pi.serviceType || 'Alteration'],
        measurements: pi.measurements || matchedAlt?.measurements || {},
        fittingResult: pi.fittingResult || matchedAlt?.fittingResult || null,
        requiredChanges: pi.requiredChanges || matchedAlt?.requiredChanges || null,
        isReAlteration: Boolean(pi.isReAlteration || matchedAlt?.isReAlteration),
        trialRequired: pi.trialRequired !== undefined ? pi.trialRequired : pssm.trialRequired,
        trialDate: pi.trialDate || pssm.trialDate || matchedAlt?.trialDate || '',
        deliveryDate: pssm.expectedDeliveryDate || matchedAlt?.deliveryDate || '',
        specialInstructions: pi.instructions || pssm.specialInstructions || matchedAlt?.specialInstructions || ''
      });
    });

    const store = bill?.firmId ? {
      name: bill.firmId.name || 'NEW FASHION STYLE (NFS)',
      address: bill.firmId.address || 'Station Road, Near Bus Stand',
      phone: bill.firmId.phone || '9829000000',
      gstin: bill.firmId.gstin || '08AAAAA0000A1Z5'
    } : {
      name: 'NEW FASHION STYLE (NFS)',
      address: 'Ram Chowk, Sadh Nagar, Palam',
      phone: '9829000000',
      gstin: '08AAAAA0000A1Z5'
    };

    return {
      store,
      pssm: {
        pssmNo: pssm.pssmNo,
        slipBarcode: pssm.slipBarcode,
        originalInvoiceNo: pssm.originalInvoiceNo || pssm.billNo || bill?.billNo || 'N/A',
        customerName: pssm.customerName || bill?.customerId?.name || 'Valued Customer',
        customerPhone: pssm.customerPhone || bill?.customerId?.phone || '',
        priority: pssm.priority || 'NORMAL',
        overallStatus: pssm.status || 'IN_PROGRESS',
        expectedDeliveryDate: pssm.expectedDeliveryDate || '',
        trialDate: pssm.trialDate || '',
        trialRequired: pssm.trialRequired !== undefined ? pssm.trialRequired : false,
        totalCharges: pssm.totalCharges || 0,
        advancePaid: pssm.advancePaid || 0,
        balanceDue: pssm.balanceDue || 0,
        specialInstructions: pssm.specialInstructions || '',
        createdAt: pssm.createdAt
      },
      alterationItems: consolidatedItems
    };
  }

  /**
   * Item-Level Barcode Tracking
   * Identifies exact item, original bill, product, live status, and all sibling items under the same bill.
   */
  static async trackItemBarcodePublic(rawBarcode) {
    const cleanCode = String(rawBarcode || '').trim();
    if (!cleanCode) throw new ApiError(400, 'Item barcode or identifier is required.');

    const mongoose = require('mongoose');
    const escaped = cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}$`, 'i');

    const Alteration = require('../models/alteration/Alteration');
    const TailoringJob = require('../models/tailoring/TailoringJob');
    const SaleBill = require('../models/billing/SaleBill');

    // 1. Try finding in PSSMItem
    let targetPSSMItem = await PSSMItem.findOne({
      $or: [
        { alterationBarcode: regex },
        { tailorInvoiceNo: regex },
        { barcode: regex },
        { uniqueCode: regex },
        ...(mongoose.Types.ObjectId.isValid(cleanCode) && cleanCode.length === 24 ? [{ _id: cleanCode }] : [])
      ]
    }).populate('pssmId').lean();

    let targetAlteration = null;
    let targetJob = null;

    // 2. If not found in PSSMItem, check Alteration table
    if (!targetPSSMItem) {
      targetAlteration = await Alteration.findOne({
        $or: [
          { alterationBarcode: regex },
          { tailorInvoiceNo: regex },
          { alterationId: regex },
          { barcode: regex },
          ...(mongoose.Types.ObjectId.isValid(cleanCode) && cleanCode.length === 24 ? [{ _id: cleanCode }] : [])
        ]
      }).populate('customerId saleBillId').lean();

      if (targetAlteration && targetAlteration.pssmItemId) {
        targetPSSMItem = await PSSMItem.findById(targetAlteration.pssmItemId).populate('pssmId').lean();
      }
    }

    // 3. If not found, check TailoringJob
    if (!targetPSSMItem && !targetAlteration) {
      targetJob = await TailoringJob.findOne({
        $or: [
          { tailorInvoiceNo: regex },
          { barcode: regex },
          ...(mongoose.Types.ObjectId.isValid(cleanCode) && cleanCode.length === 24 ? [{ _id: cleanCode }] : [])
        ]
      }).lean();

      if (targetJob && targetJob.pssmItemId) {
        targetPSSMItem = await PSSMItem.findById(targetJob.pssmItemId).populate('pssmId').lean();
      }
    }

    // 4. Fallback: If cleanCode is a PSSM No or Bill No, pick first alteration item
    if (!targetPSSMItem && !targetAlteration && !targetJob) {
      const parentPSSM = await PSSM.findOne({
        $or: [{ pssmNo: regex }, { slipBarcode: regex }, { billBarcode: regex }, { billNo: regex }]
      }).lean();

      if (parentPSSM) {
        targetPSSMItem = await PSSMItem.findOne({ pssmId: parentPSSM._id }).populate('pssmId').lean();
      }
    }

    if (!targetPSSMItem && !targetAlteration && !targetJob) {
      throw new ApiError(404, `No alteration garment found matching barcode "${cleanCode}".`);
    }

    // Identify Parent PSSM & Original Bill
    const pssmId = targetPSSMItem?.pssmId?._id || targetPSSMItem?.pssmId || targetAlteration?.pssmId;
    let pssm = pssmId ? await PSSM.findById(pssmId).lean() : null;
    if (!pssm && targetPSSMItem?.pssmId && typeof targetPSSMItem.pssmId === 'object') {
      pssm = targetPSSMItem.pssmId;
    }

    const billId = pssm?.saleBillId || targetAlteration?.saleBillId?._id || targetAlteration?.saleBillId;
    let bill = null;
    if (billId) {
      bill = await SaleBill.findById(billId).populate('customerId firmId').lean();
    } else if (pssm?.billNo) {
      bill = await SaleBill.findOne({ billNo: pssm.billNo, isDeleted: false }).populate('customerId firmId').lean();
    } else if (targetAlteration?.invoiceNumber) {
      bill = await SaleBill.findOne({ billNo: targetAlteration.invoiceNumber, isDeleted: false }).populate('customerId firmId').lean();
    }

    // Fetch ALL sibling items under the same PSSM or Bill
    const siblingFilter = [];
    if (pssm?._id) siblingFilter.push({ pssmId: pssm._id });
    if (bill?._id) {
      const otherPssms = await PSSM.find({ saleBillId: bill._id }).lean();
      otherPssms.forEach(p => siblingFilter.push({ pssmId: p._id }));
    }

    const allPSSMItems = siblingFilter.length > 0 ? await PSSMItem.find({ $or: siblingFilter }).lean() : (targetPSSMItem ? [targetPSSMItem] : []);

    // Also fetch sibling alterations for cross-reference
    const altFilter = [];
    if (pssm?._id) altFilter.push({ pssmId: pssm._id });
    if (bill?._id) altFilter.push({ saleBillId: bill._id });
    if (bill?.billNo) altFilter.push({ invoiceNumber: bill.billNo });

    const allAlterations = altFilter.length > 0 ? await Alteration.find({ $or: altFilter }).lean() : [];
    const allTailorJobs = altFilter.length > 0 ? await TailoringJob.find({ $or: altFilter }).lean() : [];

    // Map and consolidate all sibling items
    const consolidatedSiblingItems = [];
    const isCompletedStatus = (st) => {
      const s = String(st || '').toUpperCase();
      return s === 'READY' || s === 'READY_FOR_DELIVERY' || s === 'COLLECTED' || s === 'CLOSED' || s === 'DELIVERED';
    };

    allPSSMItems.forEach((pi, idx) => {
      const ti = pi.tailorInvoiceNo || (pi.alterationBarcode && String(pi.alterationBarcode).startsWith('TI-') ? pi.alterationBarcode : null) || `TI-${idx + 1}`;
      const matchedAlt = allAlterations.find(a => a.tailorInvoiceNo === pi.tailorInvoiceNo || a.alterationBarcode === pi.alterationBarcode || String(a.pssmItemId) === String(pi._id));
      const matchedJob = allTailorJobs.find(tj => tj.tailorInvoiceNo === pi.tailorInvoiceNo || String(tj.pssmItemId) === String(pi._id));

      const rawStatus = pi.status || matchedAlt?.status || matchedJob?.status || 'PENDING';
      const formattedStatus = String(rawStatus).toUpperCase().replace(/-/g, '_');

      const isCurrent = (
        (targetPSSMItem && String(pi._id) === String(targetPSSMItem._id)) ||
        (cleanCode && (pi.alterationBarcode === cleanCode || pi.tailorInvoiceNo === cleanCode || pi.barcode === cleanCode || pi.uniqueCode === cleanCode))
      );

      consolidatedSiblingItems.push({
        id: pi._id,
        itemIndex: idx + 1,
        garmentName: pi.productName || pi.pieceName || pi.name || 'Altered Garment',
        size: pi.size || 'Free',
        color: pi.color || 'Standard',
        gender: pi.gender || 'Gents',
        barcode: pi.barcode || pi.uniqueCode || '',
        tailorInvoiceNo: pi.tailorInvoiceNo || matchedAlt?.tailorInvoiceNo || matchedJob?.tailorInvoiceNo || ti,
        alterationBarcode: pi.alterationBarcode || matchedAlt?.alterationBarcode || pi.tailorInvoiceNo || `${pssm?.pssmNo || 'PSSM'}-${idx + 1}`,
        tailorName: pi.assignedTo || matchedAlt?.tailorName || matchedJob?.assignedToTailorName || 'Master Tailor',
        status: formattedStatus,
        isCompleted: isCompletedStatus(formattedStatus),
        isCurrentScanned: Boolean(isCurrent),
        serviceType: pi.serviceType || matchedAlt?.serviceType || 'Alteration',
        alterationDetails: pi.alterationDetails || matchedAlt?.alterationDetails || [pi.serviceType || 'Alteration'],
        measurements: pi.measurements || matchedAlt?.measurements || {},
        specialInstructions: pi.instructions || pssm?.specialInstructions || matchedAlt?.specialInstructions || '',
        trialRequired: pi.trialRequired !== undefined ? pi.trialRequired : pssm?.trialRequired,
        trialDate: pi.trialDate || pssm?.trialDate || matchedAlt?.trialDate || '',
        deliveryDate: pssm?.expectedDeliveryDate || matchedAlt?.deliveryDate || '',
        completedAt: pi.completedAt || matchedAlt?.completedAt || null
      });
    });

    // Ensure at least one item is marked as currentScanned
    if (!consolidatedSiblingItems.some(i => i.isCurrentScanned) && consolidatedSiblingItems.length > 0) {
      consolidatedSiblingItems[0].isCurrentScanned = true;
    }

    const currentItem = consolidatedSiblingItems.find(i => i.isCurrentScanned) || consolidatedSiblingItems[0] || null;

    // Bill-Level Completion Calculation
    const totalCount = consolidatedSiblingItems.length;
    const completedCount = consolidatedSiblingItems.filter(i => i.isCompleted).length;
    const pendingCount = totalCount - completedCount;
    const isAllCompleted = totalCount > 0 && completedCount === totalCount;

    const store = bill?.firmId ? {
      name: bill.firmId.name || 'NEW FASHION STYLE (NFS)',
      address: bill.firmId.address || 'Ram Chowk, Sadh Nagar, Palam',
      phone: bill.firmId.phone || '9990397529',
      gstin: bill.firmId.gstin || '07AAAPL1234A1Z5'
    } : {
      name: 'NEW FASHION STYLE (NFS)',
      address: 'Ram Chowk, Sadh Nagar, Palam',
      phone: '9990397529',
      gstin: '07AAAPL1234A1Z5'
    };

    return {
      store,
      matchedItem: currentItem,
      bill: bill ? {
        id: bill._id,
        billNo: bill.billNo,
        date: bill.billDate || bill.createdAt,
        customerName: bill.customerId?.name || pssm?.customerName || 'Walk-in Customer',
        customerPhone: bill.customerId?.phone || pssm?.customerPhone || '',
        grandTotal: bill.grandTotal || 0,
        amountPaid: bill.paidAmount ?? bill.amountPaid ?? bill.grandTotal,
        balanceDue: bill.dueAmount ?? bill.balanceDue ?? 0,
        paymentMethod: bill.paymentMethod || 'Cash'
      } : {
        billNo: pssm?.billNo || pssm?.originalInvoiceNo || 'N/A',
        date: pssm?.createdAt,
        customerName: pssm?.customerName || 'Walk-in Customer',
        customerPhone: pssm?.customerPhone || '',
        grandTotal: pssm?.totalCharges || 0,
        amountPaid: pssm?.advancePaid || 0,
        balanceDue: pssm?.balanceDue || 0,
        paymentMethod: 'Cash'
      },
      pssm: pssm ? {
        id: pssm._id,
        pssmNo: pssm.pssmNo,
        slipBarcode: pssm.slipBarcode,
        priority: pssm.priority || 'NORMAL',
        overallStatus: pssm.status || 'IN_PROGRESS',
        trialRequired: pssm.trialRequired,
        trialDate: pssm.trialDate,
        expectedDeliveryDate: pssm.expectedDeliveryDate,
        createdAt: pssm.createdAt
      } : null,
      allItems: consolidatedSiblingItems,
      billStatusSummary: {
        totalItems: totalCount,
        completedCount,
        pendingCount,
        isAllCompleted,
        completionPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      }
    };
  }

  /**
   * Update Status / Record Completion for a Specific Item via Barcode
   */
  static async updateItemStatusByBarcodePublic(rawBarcode, newStatus = 'READY', extra = {}) {
    const cleanCode = String(rawBarcode || '').trim();
    if (!cleanCode) throw new ApiError(400, 'Barcode is required.');

    const mongoose = require('mongoose');
    const escaped = cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}$`, 'i');

    const formattedStatus = String(newStatus || 'READY').toUpperCase().replace(/-/g, '_');

    // 1. Update in PSSMItem
    let item = await PSSMItem.findOne({
      $or: [
        { alterationBarcode: regex },
        { tailorInvoiceNo: regex },
        { barcode: regex },
        { uniqueCode: regex },
        ...(mongoose.Types.ObjectId.isValid(cleanCode) && cleanCode.length === 24 ? [{ _id: cleanCode }] : [])
      ]
    });

    if (item) {
      item.status = formattedStatus;
      if (formattedStatus === 'READY' || formattedStatus === 'READY_FOR_DELIVERY' || formattedStatus === 'COLLECTED') {
        item.completedAt = new Date();
      }
      if (extra.tailorName) item.assignedTo = extra.tailorName;
      if (extra.specialInstructions) item.instructions = extra.specialInstructions;
      await item.save();

      // Check if all items under this PSSM are complete
      const allItems = await PSSMItem.find({ pssmId: item.pssmId });
      const allDone = allItems.every(i => ['READY', 'READY_FOR_DELIVERY', 'COLLECTED', 'CLOSED'].includes(i.status));
      if (allDone) {
        await PSSM.findByIdAndUpdate(item.pssmId, { status: formattedStatus === 'COLLECTED' ? 'COLLECTED' : 'READY_FOR_DELIVERY' });
      } else if (allItems.some(i => ['IN_STITCHING', 'IN_PROGRESS'].includes(i.status))) {
        await PSSM.findByIdAndUpdate(item.pssmId, { status: 'IN_PROGRESS' });
      }
    }

    // 2. Also update corresponding Alteration record if exists
    const Alteration = require('../models/alteration/Alteration');
    const alt = await Alteration.findOne({
      $or: [
        { alterationBarcode: regex },
        { tailorInvoiceNo: regex },
        { barcode: regex },
        ...(item ? [{ pssmItemId: item._id }] : [])
      ]
    });

    if (alt) {
      alt.status = formattedStatus === 'READY' ? 'Ready for Delivery' : (formattedStatus === 'COLLECTED' ? 'Collected' : 'In Progress');
      if (formattedStatus === 'READY' || formattedStatus === 'COLLECTED') {
        alt.completedAt = new Date();
      }
      await alt.save();
    }

    // 3. Return full refreshed tracking payload
    return await this.trackItemBarcodePublic(cleanCode);
  }
}

module.exports = PSSMService;

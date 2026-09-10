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

    const pssmNo = data.pssmNo || data.alterationNo || `PSSM-${Date.now().toString(36).toUpperCase()}`;

    // Create Master PSSM document
    const pssmRecord = await PSSM.create({
      tenantId,
      pssmNo,
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
            await pssmItemDoc.save();
            createdTailoringJobs.push(job);
          }
        } catch (tjErr) {
          console.error('[PSSMService] TailoringJob creation failed (non-fatal):', tjErr.message);
        }
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
    const filter = {
      tenantId,
      status: { $nin: ['COLLECTED', 'CLOSED'] }
    };

    if (query.salesmanId) {
      filter.salesmanId = query.salesmanId;
    }
    if (query.salesmanName) {
      filter.salesmanName = new RegExp(query.salesmanName, 'i');
    }

    const items = await PSSMItem.find(filter)
      .populate('pssmId')
      .sort({ createdAt: -1 })
      .lean();

    return items.map(item => ({
      _id: item._id,
      pssmId: item.pssmId?._id,
      pssmNo: item.pssmId?.pssmNo,
      billNo: item.pssmId?.billNo,
      billBarcode: item.pssmId?.billBarcode,
      customerName: item.pssmId?.customerName || 'Walk-in Customer',
      customerPhone: item.pssmId?.customerPhone || '',
      salesmanId: item.salesmanId || item.pssmId?.salesmanId,
      salesmanName: item.salesmanName || item.pssmId?.salesmanName || 'Sales Staff',
      customerWaitingOption: item.customerWaitingOption || item.pssmId?.customerWaitingOption || 'Will Come Later',
      productName: item.productName,
      barcode: item.barcode,
      uniqueCode: item.uniqueCode,
      size: item.size,
      color: item.color,
      serviceType: item.serviceType,
      assignedTo: item.assignedTo || 'Pending Assignment',
      priority: item.priority || item.pssmId?.priority || 'NORMAL',
      status: item.status,
      trialRequired: item.trialRequired !== undefined ? item.trialRequired : item.pssmId?.trialRequired,
      trialDate: item.trialDate || item.pssmId?.trialDate,
      expectedDeliveryDate: item.pssmId?.expectedDeliveryDate,
      createdAt: item.createdAt,
      reassignedFromSalesmanName: item.reassignedFromSalesmanName,
      reassignedReason: item.reassignedReason
    }));
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
    const userDoc = await User.findById(userId).lean();

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

    const pssmItems = await PSSMItem.find({ tenantId, isDeleted: { $ne: true } })
      .populate('pssmId')
      .sort({ createdAt: -1 })
      .lean();

    const Alteration = require('../models/alteration/Alteration');
    const alterations = await Alteration.find({ tenantId, isDeleted: false })
      .populate('customerId saleBillId')
      .sort({ createdAt: -1 })
      .lean();

    const existingPssmNos = new Set(pssmItems.map(pi => pi.pssmId?.pssmNo).filter(Boolean));

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const allUnifiedItems = [];

    // Map PSSM items
    for (const item of pssmItems) {
      const pssm = item.pssmId || {};
      const expDate = item.expectedDeliveryDate || pssm.expectedDeliveryDate ? new Date(item.expectedDeliveryDate || pssm.expectedDeliveryDate) : null;
      const sId = item.salesmanId || pssm.salesmanId;
      const sName = item.salesmanName || pssm.salesmanName || '';
      const createdBy = (item.createdBy || pssm.createdBy)?.toString();

      allUnifiedItems.push({
        _id: item._id,
        source: 'PSSM',
        ticketNo: pssm.pssmNo || 'N/A',
        billNo: pssm.billNo || pssm.billBarcode || 'N/A',
        customerName: pssm.customerName || 'Walk-in Customer',
        customerPhone: pssm.customerPhone || '',
        salesmanId: sId,
        salesmanName: sName,
        createdBy,
        productName: item.pieceName || item.productName || 'Garment Item',
        serviceType: item.serviceType || pssm.serviceType || 'Alteration',
        alterationDetails: item.alterationDetails || [],
        assignedTailor: item.assignedTo || pssm.tailorName || 'Pending Assignment',
        deliveryDate: expDate ? expDate.toISOString().split('T')[0] : '',
        deliveryDateObj: expDate,
        status: item.status || 'PENDING_ASSIGNMENT',
        priority: item.priority || pssm.priority || 'NORMAL',
        barcode: item.barcode || item.uniqueCode || item.sku || '',
        createdAt: item.createdAt,
        reassignedFromSalesmanName: item.reassignedFromSalesmanName,
        reassignedReason: item.reassignedReason
      });
    }

    // Map Alterations
    for (const alt of alterations) {
      if (existingPssmNos.has(alt.alterationNo)) continue;
      const expDate = alt.expectedDeliveryDate ? new Date(alt.expectedDeliveryDate) : null;
      const saleBill = alt.saleBillId || {};
      const sId = saleBill.salesmanId;
      const sName = saleBill.salesmanName || '';
      const createdBy = alt.createdBy?.toString();

      allUnifiedItems.push({
        _id: alt._id,
        source: 'ALTERATION',
        ticketNo: alt.alterationNo || 'N/A',
        billNo: saleBill.billNo || alt.invoiceNumber || 'N/A',
        customerName: alt.customerName || alt.customerId?.name || 'Walk-in Customer',
        customerPhone: alt.customerPhone || alt.customerId?.phone || '',
        salesmanId: sId,
        salesmanName: sName,
        createdBy,
        productName: 'Altered Garment',
        serviceType: 'Alteration',
        alterationDetails: alt.alterationDetails || [],
        assignedTailor: alt.tailorName || 'Pending Assignment',
        deliveryDate: expDate ? expDate.toISOString().split('T')[0] : '',
        deliveryDateObj: expDate,
        status: alt.status || 'Pending',
        priority: alt.priority || 'NORMAL',
        barcode: alt.alterationNo || '',
        createdAt: alt.createdAt
      });
    }

    const cleanEffectiveName = effectiveSalesmanName.trim().toLowerCase();
    const isSpecialOverview = cleanEffectiveName === 'all' || cleanEffectiveName === 'overview';

    const myItems = isSpecialOverview ? allUnifiedItems : allUnifiedItems.filter(item => {
      if (effectiveSalesmanId && item.salesmanId && String(item.salesmanId) === String(effectiveSalesmanId)) return true;
      if (cleanEffectiveName) {
        const iName = (item.salesmanName || '').trim().toLowerCase();
        if (iName === cleanEffectiveName || iName.includes(cleanEffectiveName) || cleanEffectiveName.includes(iName)) return true;
      }
      if (userId && item.createdBy && String(item.createdBy) === String(userId)) return true;
      return false;
    });

    const activeDataset = (myItems.length > 0) ? myItems : allUnifiedItems;

    const isDelivered = (s) => ['COLLECTED', 'CLOSED', 'DELIVERED', 'Delivered'].includes(s);
    const isReady = (s) => ['READY', 'READY_FOR_DELIVERY', 'Ready for Delivery', 'Ready for Trial'].includes(s);
    const isPending = (s) => !isDelivered(s) && !isReady(s);

    const totalAssignedServices = activeDataset.length;
    const pendingCount = activeDataset.filter(i => isPending(i.status)).length;
    const readyCount = activeDataset.filter(i => isReady(i.status)).length;
    const deliveredCount = activeDataset.filter(i => isDelivered(i.status)).length;

    const overdueCount = activeDataset.filter(i => {
      if (!i.deliveryDateObj) return false;
      return !isDelivered(i.status) && i.deliveryDateObj < todayStart;
    }).length;

    const reAlterCount = activeDataset.filter(i => {
      const details = Array.isArray(i.alterationDetails) ? i.alterationDetails.join(' ').toLowerCase() : '';
      return /re-alter|realter|trial|repair|urgent|high/i.test((i.priority || '') + ' ' + (i.serviceType || '') + ' ' + details);
    }).length;

    // Pending List: जब तक Item Complete Scan नहीं होगा, ये List हटेगी नहीं।
    const pendingList = activeDataset.filter(i => !isDelivered(i.status)).map(i => ({
      ...i,
      isOverdue: Boolean(i.deliveryDateObj && i.deliveryDateObj < todayStart),
      isDueToday: Boolean(i.deliveryDateObj && i.deliveryDateObj >= todayStart && i.deliveryDateObj <= todayEnd),
      isReady: isReady(i.status)
    }));

    // Daily Follow-up List:
    // 1. आज किस Customer को Call करना है (Scheduled for delivery today or became ready today)
    const callTodayList = activeDataset.filter(i => {
      if (isDelivered(i.status)) return false;
      if (i.deliveryDateObj && i.deliveryDateObj >= todayStart && i.deliveryDateObj <= todayEnd) return true;
      return false;
    });

    // 2. कौन Ready है (Ready for pickup)
    const readyPickupList = activeDataset.filter(i => isReady(i.status));

    // 3. कौन Overdue है (Overdue delivery date)
    const overdueFollowupList = activeDataset.filter(i => {
      if (!i.deliveryDateObj) return false;
      return !isDelivered(i.status) && !isReady(i.status) && i.deliveryDateObj < todayStart;
    });

    // 4. कौन Delivery लेने नहीं आया (Ready past delivery date)
    const didNotPickUpList = activeDataset.filter(i => {
      if (!isReady(i.status)) return false;
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
        isOwnItems: myItems.length > 0
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
        { billBarcode: regex },
        { billNo: regex },
        { pssmNo: regex },
        ...(mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24 ? [{ _id: trimmed }, { saleBillId: trimmed }] : [])
      ]
    }).lean();

    // Fallback: If not found on PSSM header, check if scanned value is a garment item barcode/uniqueCode
    if (!pssm) {
      const pssmItem = await PSSMItem.findOne({
        tenantId,
        $or: [{ barcode: regex }, { uniqueCode: regex }]
      }).lean();

      if (pssmItem && pssmItem.pssmId) {
        pssm = await PSSM.findOne({ tenantId, _id: pssmItem.pssmId }).lean();
      }
    }

    if (!pssm) return null;

    const items = await PSSMItem.find({ tenantId, pssmId: pssm._id }).lean();

    return {
      pssm,
      items
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
}

module.exports = PSSMService;

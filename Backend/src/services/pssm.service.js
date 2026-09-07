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

class PSSMService {
  static async createPSSM(data, userId, tenantId) {
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
      inseamBookCode: data.inseamBookCode || '',
      salesmanId: resolvedSalesmanId,
      salesmanName: resolvedSalesmanName,
      customerWaitingOption,
      priority: derivedPriority,
      serviceType: data.serviceType || 'Alteration',
      expectedDeliveryDate: data.expectedDeliveryDate || data.deliveryDate,
      tailorName: data.tailorName || 'Default Tailor',
      vendorName: data.vendorName || data.tailorName || '',
      totalCharges,
      status: initialMasterStatus,
      allowWhatsApp: data.allowWhatsApp !== false,
      remarks: data.remarks || '',
      createdBy: userId
    });

    // Update Customer inseam book code if provided
    if (data.inseamBookCode && (data.customerId || (foundBill && foundBill.customerId))) {
      const cId = data.customerId || foundBill.customerId;
      await Customer.updateOne(
        { _id: cId, tenantId },
        { $set: { inseamBookCode: data.inseamBookCode } }
      ).catch(console.error);
    }

    const createdItems = [];

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

      const pssmItemDoc = await PSSMItem.create({
        tenantId,
        pssmId: pssmRecord._id,
        saleBillId: resolvedSaleBillId,
        inventoryPieceId: piece ? piece._id : undefined,
        pieceName: item.pieceName || item.productName || piece?.productId?.name || 'Garment Item',
        productName: item.productName || item.pieceName || piece?.productId?.name || 'Garment Item',
        size: item.size || piece?.size || 'FS',
        color: item.color || piece?.primaryColor || 'Standard',
        barcode: itemBarcode,
        uniqueCode: itemUniqueCode,
        sku: item.sku || itemBarcode,
        salesmanId: item.salesmanId || resolvedSalesmanId,
        salesmanName: item.salesmanName || resolvedSalesmanName,
        customerWaitingOption,
        priority: derivedPriority,
        serviceType: item.serviceType || data.serviceType || 'Alteration',
        assignedTo,
        instructions: item.instructions || (Array.isArray(item.alterationDetails) ? item.alterationDetails.join(', ') : 'Standard Service'),
        charge: item.charge || 0,
        status: itemStatus,
        alterationDetails: item.alterationDetails || [],
        measurements: item.measurements || {},
        createdBy: userId
      });

      createdItems.push(pssmItemDoc);
    }

    // Backwards compatibility with legacy Alteration model
    try {
      const altNo = pssmNo.replace('PSSM-', 'ALT-');
      const altDoc = await Alteration.create({
        tenantId,
        alterationNo: altNo,
        saleBillId: resolvedSaleBillId,
        customerId: data.customerId || (foundBill ? foundBill.customerId : undefined),
        customerName: data.customerName || (foundBill ? foundBill.customerName : ''),
        customerPhone: data.customerPhone || (foundBill ? foundBill.customerPhone : ''),
        expectedDeliveryDate: data.expectedDeliveryDate || data.deliveryDate,
        tailorName: data.tailorName || 'Default Tailor',
        priority: derivedPriority,
        totalCharges,
        status: 'RECEIVED',
        remarks: data.remarks || '',
        createdBy: userId
      });

      for (const item of rawItems) {
        await AlterationItem.create({
          tenantId,
          alterationId: altDoc._id,
          pieceName: item.pieceName || item.productName || 'Garment Item',
          productName: item.productName || item.pieceName || 'Garment Item',
          size: item.size || 'FS',
          color: item.color || 'Standard',
          barcode: item.barcode || '',
          uniqueCode: item.uniqueCode || '',
          instructions: item.instructions || 'Standard Service',
          charge: item.charge || 0,
          status: 'PENDING',
          alterationDetails: item.alterationDetails || [],
          measurements: item.measurements || {},
          createdBy: userId
        });
      }
    } catch (e) {
      console.warn('[PSSMService] Backwards compatibility creation note:', e.message);
    }

    return {
      pssmRecord,
      items: createdItems
    };
  }

  static async getPendingAssignments(tenantId) {
    const items = await PSSMItem.find({ tenantId, status: 'PENDING_ASSIGNMENT' })
      .populate('pssmId')
      .sort({ createdAt: -1 })
      .lean();

    return items.map(item => ({
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
      productName: item.productName,
      barcode: item.barcode,
      uniqueCode: item.uniqueCode,
      size: item.size,
      color: item.color,
      serviceType: item.serviceType,
      status: item.status,
      createdAt: item.createdAt
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
      expectedDeliveryDate: item.pssmId?.expectedDeliveryDate,
      createdAt: item.createdAt,
      reassignedFromSalesmanName: item.reassignedFromSalesmanName,
      reassignedReason: item.reassignedReason
    }));
  }

  static async markItemCompleteByScan(barcode, userId, tenantId) {
    const cleanCode = barcode ? barcode.trim() : '';
    const item = await PSSMItem.findOne({
      tenantId,
      $or: [{ barcode: cleanCode }, { uniqueCode: cleanCode }, { sku: cleanCode }],
      status: { $nin: ['COLLECTED', 'CLOSED'] }
    });

    if (!item) {
      throw new ApiError(404, `No active PSS item found matching barcode '${cleanCode}'.`);
    }

    item.status = 'READY';
    item.completedAt = new Date();
    item.completedBy = userId;
    await item.save();

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

  static async assignTailorVendor(pssmItemId, tailorName, userId, tenantId) {
    const item = await PSSMItem.findOne({ _id: pssmItemId, tenantId });
    if (!item) throw new ApiError(404, 'PSSM Item not found.');

    item.assignedTo = tailorName;
    item.status = 'ASSIGNED';
    await item.save();

    await this.recalculateMasterStatus(item.pssmId, tenantId);

    return item;
  }

  static async updateItemStatus(pssmItemId, status, measurements, alterationDetails, userId, tenantId) {
    const item = await PSSMItem.findOne({ _id: pssmItemId, tenantId });
    if (!item) throw new ApiError(404, 'PSSM Item not found.');

    item.status = status;
    if (measurements) item.measurements = measurements;
    if (alterationDetails) item.alterationDetails = alterationDetails;

    if (status === 'READY') {
      item.completedAt = new Date();
      item.completedBy = userId;
    } else if (status === 'COLLECTED') {
      item.collectedAt = new Date();
    }

    await item.save();
    await this.recalculateMasterStatus(item.pssmId, tenantId);

    return item;
  }

  static async getBillPSSMByBarcode(billBarcode, tenantId) {
    const pssm = await PSSM.findOne({
      tenantId,
      $or: [{ billBarcode: billBarcode }, { billNo: billBarcode }, { pssmNo: billBarcode }]
    }).lean();

    if (!pssm) return null;

    const items = await PSSMItem.find({ tenantId, pssmId: pssm._id }).lean();

    return {
      pssm,
      items
    };
  }

  static async processCollection(billBarcode, itemIdsToCollect, userId, tenantId) {
    const pssmData = await this.getBillPSSMByBarcode(billBarcode, tenantId);
    if (!pssmData) throw new ApiError(404, 'No PSSM record found for this Bill Barcode.');

    const targetItemIds = itemIdsToCollect && itemIdsToCollect.length > 0
      ? itemIdsToCollect
      : pssmData.items.filter(i => i.status === 'READY').map(i => i._id.toString());

    await PSSMItem.updateMany(
      { tenantId, _id: { $in: targetItemIds } },
      { $set: { status: 'COLLECTED', collectedAt: new Date() } }
    );

    await this.recalculateMasterStatus(pssmData.pssm._id, tenantId);

    return await this.getBillPSSMByBarcode(billBarcode, tenantId);
  }

  static async recalculateMasterStatus(pssmId, tenantId) {
    const items = await PSSMItem.find({ tenantId, pssmId }).lean();
    if (!items || !items.length) return;

    let masterStatus = 'PENDING_ASSIGNMENT';

    const allCollected = items.every(i => i.status === 'COLLECTED');
    const allReady = items.every(i => i.status === 'READY' || i.status === 'COLLECTED');
    const someReady = items.some(i => i.status === 'READY' || i.status === 'COLLECTED');
    const allAssigned = items.every(i => i.status !== 'PENDING_ASSIGNMENT');
    const someInProgress = items.some(i => i.status === 'IN_PROGRESS');

    if (allCollected) {
      masterStatus = 'CLOSED';
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

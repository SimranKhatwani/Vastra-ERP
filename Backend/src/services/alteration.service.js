const ApiError = require('../helpers/ApiError');
const Alteration = require('../models/alteration/Alteration');
const AlterationItem = require('../models/alteration/AlterationItem');
const InventoryPiece = require('../models/InventoryPiece');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const { INVENTORY_STATUS, LIFECYCLE_EVENT, ALTERATION_STATUS } = require('../constants/status');
const { formatExportData } = require('../helpers/export.helper');

class AlterationService {
  static async createAlteration(data, userId, tenantId) {
    let totalCharges = 0;
    const SaleBill = require('../models/billing/SaleBill');
    const SaleItem = require('../models/billing/SaleItem');

    // Handle flexible item payload
    let rawItems = data.items;
    if (!rawItems || !rawItems.length) {
      if (data.productId || data.sku || data.barcode || data.productName) {
        rawItems = [{
          barcode: data.barcode || data.sku,
          inventoryPieceId: data.inventoryPieceId,
          pieceName: data.productName,
          instructions: Array.isArray(data.alterationDetails) ? data.alterationDetails.join(', ') : (data.instructions || data.customAlterationText || 'Standard Fit'),
          alterationDetails: data.alterationDetails || [],
          measurements: data.measurements || {},
          charge: data.charge || 0
        }];
      } else {
        throw new ApiError(400, 'Alteration request must contain at least one item.');
      }
    }

    rawItems.forEach(item => {
      totalCharges += Number(item.charge || 0);
    });

    let resolvedSaleBillId = data.saleBillId || data.invoiceId;
    if (resolvedSaleBillId && typeof resolvedSaleBillId === 'string' && resolvedSaleBillId.length !== 24) {
      const foundBill = await SaleBill.findOne({
        tenantId,
        $or: [{ billNo: resolvedSaleBillId }, { _id: resolvedSaleBillId }]
      }).lean();
      if (foundBill) resolvedSaleBillId = foundBill._id;
      else resolvedSaleBillId = undefined;
    }

    if (!resolvedSaleBillId && data.invoiceNumber) {
      const foundBill = await SaleBill.findOne({
        tenantId,
        billNo: data.invoiceNumber
      }).lean();
      if (foundBill) resolvedSaleBillId = foundBill._id;
    }

    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findById(tenantId).lean();
    const settings = tenant?.commissionSettings || {};
    const commRate = settings.workerPercentage !== undefined ? settings.workerPercentage : 10;
    const commAmount = totalCharges * (commRate / 100);

    const alteration = await Alteration.create({
      tenantId,
      alterationNo: data.alterationNo || `ALT-${Date.now().toString(36).toUpperCase()}`,
      saleBillId: resolvedSaleBillId,
      customerId: data.customerId || undefined,
      customerName: data.customerName || '',
      customerPhone: data.customerPhone || '',
      expectedDeliveryDate: data.expectedDeliveryDate || data.deliveryDate,
      tailorName: data.tailorName || 'Default Tailor',
      priority: data.priority || 'Normal',
      trialDate: data.trialDate,
      totalCharges,
      commissionPercentage: commRate,
      commissionAmount: commAmount,
      status: ALTERATION_STATUS.RECEIVED,
      remarks: data.remarks || data.customAlterationText || data.specialInstructions,
      createdBy: userId
    });

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

      const altItem = await AlterationItem.create({
        tenantId,
        alterationId: alteration._id,
        inventoryPieceId: piece ? piece._id : undefined,
        pieceName: item.pieceName || piece?.productId?.name || 'Altered Garment',
        instructions: item.instructions || 'Standard Fit',
        alterationDetails: item.alterationDetails || [],
        measurements: item.measurements || {},
        charge: item.charge || 0,
        createdBy: userId
      });

      if (piece) {
        piece.status = INVENTORY_STATUS.ALTERED;
        piece.altered = true;
        piece.currentLocation = 'TAILOR_SHOP';
        await piece.save();

        if (resolvedSaleBillId) {
          await SaleItem.updateMany(
            { saleBillId: resolvedSaleBillId, inventoryPieceId: piece._id, tenantId },
            { $set: { hasAlteration: true, alterationStatus: 'CONFIGURED', alterationId: alteration._id } }
          );
        }

        await InventoryLifecycle.create({
          tenantId,
          inventoryPieceId: piece._id,
          barcode: piece.barcode,
          eventType: LIFECYCLE_EVENT.ALTERATION,
          fromLocation: 'CUSTOMER',
          toLocation: 'TAILOR_SHOP',
          referenceId: alteration._id,
          referenceModel: 'Alteration',
          performedBy: userId,
          notes: `Received for alteration: ${item.instructions || 'Tailoring'}`
        });
      }

      createdItems.push(altItem);
    }

    // Synchronize worker commission to Commission collection
    try {
      const CommissionService = require('./commission.service');
      await CommissionService.recordAlterationCommission(alteration, tenantId, userId);
    } catch (commErr) {
      console.error('[AlterationService] Failed to record worker commission:', commErr);
    }

    return { alteration, items: createdItems };
  }

  static async getPendingAlterationItems(tenantId) {
    const SaleItem = require('../models/billing/SaleItem');
    const AlterationItem = require('../models/alteration/AlterationItem');

    // Find all SaleItems with hasAlteration = true that are PENDING or not yet in an Alteration record
    const pendingSaleItems = await SaleItem.find({
      tenantId,
      hasAlteration: true,
      $or: [
        { alterationStatus: 'PENDING' },
        { alterationStatus: { $exists: false } },
        { alterationId: null }
      ]
    })
      .populate('saleBillId')
      .populate({
        path: 'inventoryPieceId',
        populate: { path: 'productId' }
      })
      .sort({ createdAt: -1 });

    const existingAltItems = await AlterationItem.find({ tenantId }).select('inventoryPieceId alterationId').lean();
    const configuredPieceIds = new Set(existingAltItems.map(a => a.inventoryPieceId?.toString()));

    const result = pendingSaleItems
      .filter(si => si.saleBillId && (!si.alterationId || !configuredPieceIds.has(si.inventoryPieceId?._id?.toString())))
      .map(si => {
        const piece = si.inventoryPieceId || {};
        const product = piece.productId || {};
        const bill = si.saleBillId || {};

        return {
          saleItemId: si._id,
          saleBillId: bill._id,
          invoiceNo: bill.billNo || bill.invoiceNo || `BILL-${bill._id}`,
          billDate: bill.billDate || bill.createdAt,
          customerId: bill.customerId,
          customerName: bill.customerName || (bill.customerId?.name) || 'Walk-in Customer',
          customerPhone: bill.customerPhone || (bill.customerId?.phone) || '',
          inventoryPieceId: piece._id,
          productId: product._id,
          productName: product.name || product.itemName || piece.productName || 'Billed Garment',
          barcode: piece.barcode || si.barcode || piece.uniqueCode || si.uniqueCode || product.sku || 'N/A',
          uniqueCode: piece.uniqueCode || si.uniqueCode || '',
          sku: product.sku || product.itemCode || piece.barcode || 'N/A',
          size: piece.size || product.size || 'M',
          color: piece.primaryColor || product.color || 'Standard',
          price: si.finalPrice || si.sellingPrice || piece.mrp || 0,
          status: 'Pending Details'
        };
      });

    return result;
  }

  static async updateStatus(alterationId, status, userId, tenantId) {
    const alteration = await Alteration.findOne({ _id: alterationId, tenantId });
    if (!alteration) throw new ApiError(404, 'Alteration record not found.');

    alteration.status = status;
    alteration.updatedBy = userId;
    await alteration.save();

    if (status === ALTERATION_STATUS.DELIVERED) {
      const items = await AlterationItem.find({ alterationId, tenantId });
      for (const item of items) {
        const piece = await InventoryPiece.findById(item.inventoryPieceId);
        if (piece) {
          piece.currentLocation = 'DELIVERED_TO_CUSTOMER';
          await piece.save();
        }
      }
    }

    return alteration;
  }

  static async getAlterations(query = {}, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (query.status) filter.status = query.status;
    if (query.tailorName) filter.tailorName = new RegExp(query.tailorName, 'i');
    if (query.search) filter.alterationNo = new RegExp(query.search, 'i');

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const alterations = await Alteration.find(filter)
      .populate('customerId saleBillId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Alteration.countDocuments(filter);
    const altIds = alterations.map(a => a._id);

    // Batch fetch all items in ONE query
    const allItems = await AlterationItem.find({ alterationId: { $in: altIds } }).populate({
      path: 'inventoryPieceId',
      populate: { path: 'productId' }
    });

    const itemsByAltId = new Map();
    for (const item of allItems) {
      const key = item.alterationId?.toString();
      if (!itemsByAltId.has(key)) itemsByAltId.set(key, []);
      itemsByAltId.get(key).push(item);
    }

    // Flatten data for frontend ArticulationView
    const formattedAlterations = alterations.map((alt) => {
      const items = itemsByAltId.get(alt._id.toString()) || [];
      const firstItem = items[0] || {};
      const piece = firstItem.inventoryPieceId || {};
      const product = piece.productId || {};

      return {
        _id: alt._id,
        alterationId: alt.alterationNo,
        invoiceNumber: alt.saleBillId ? (alt.saleBillId.billNo || alt.saleBillId.invoiceNo) : (alt.invoiceNumber || ''),
        invoiceId: alt.saleBillId ? (alt.saleBillId.billNo || alt.saleBillId.invoiceNo || alt.saleBillId._id) : (alt.invoiceNumber || alt.invoiceId || ''),
        saleBillId: alt.saleBillId?._id || alt.saleBillId,
        saleBill: alt.saleBillId || null,
        customerName: alt.customerName || (alt.customerId ? alt.customerId.name : (alt.saleBillId ? (alt.saleBillId.customerName || alt.saleBillId.customerId?.name) : 'Walk-in')),
        customerPhone: alt.customerPhone || (alt.customerId ? alt.customerId.phone : (alt.saleBillId ? (alt.saleBillId.customerPhone || alt.saleBillId.customerId?.phone) : '')),
        productName: firstItem.pieceName || product.name || 'Altered Garment',
        barcode: piece.barcode || '',
        uniqueCode: piece.uniqueCode || '',
        sku: piece.barcode || piece.uniqueCode || product.sku || '',
        size: piece.size || product.size || 'N/A',
        color: piece.primaryColor || product.color || 'N/A',
        tailorName: alt.tailorName,
        priority: alt.priority || 'Normal',
        status: alt.status,
        deliveryDate: alt.expectedDeliveryDate ? alt.expectedDeliveryDate.toISOString().split('T')[0] : '',
        trialDate: alt.trialDate ? alt.trialDate.toISOString().split('T')[0] : '',
        alterationDetails: firstItem.alterationDetails || (firstItem.instructions ? firstItem.instructions.split(',') : []),
        measurements: firstItem.measurements || {},
        specialInstructions: alt.remarks || '',
        customAlterationText: alt.remarks || '',
        totalCharges: alt.totalCharges || 0,
        createdAt: alt.createdAt,
        createdBy: alt.createdBy
      };
    });

    return {
      alterations: formattedAlterations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getAlterationById(alterationId, tenantId) {
    const alteration = await Alteration.findOne({ _id: alterationId, tenantId, isDeleted: false })
      .populate('customerId saleBillId');
    if (!alteration) throw new ApiError(404, 'Alteration record not found.');

    const items = await AlterationItem.find({ alterationId, tenantId })
      .populate('inventoryPieceId');

    return { alteration, items };
  }

  static async getAlterationDashboard(tenantId, dateRange) {
    const filter = { tenantId, isDeleted: false };
    
    if (dateRange && dateRange !== 'All Time' && dateRange !== 'All') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let startDate = new Date(today);
      let endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);

      if (dateRange === 'Today') {
        filter.createdAt = { $gte: startDate, $lte: endDate };
      } else if (dateRange === 'Yesterday') {
        startDate.setDate(startDate.getDate() - 1);
        endDate.setDate(endDate.getDate() - 1);
        filter.createdAt = { $gte: startDate, $lte: endDate };
      } else if (dateRange === 'Last 7 Days') {
        startDate.setDate(startDate.getDate() - 6);
        filter.createdAt = { $gte: startDate, $lte: endDate };
      } else if (dateRange === 'Last 30 Days') {
        startDate.setDate(startDate.getDate() - 29);
        filter.createdAt = { $gte: startDate, $lte: endDate };
      } else if (dateRange === 'This Month') {
        startDate.setDate(1);
        filter.createdAt = { $gte: startDate, $lte: endDate };
      }
    }

    const totalPending = await Alteration.countDocuments({
      ...filter,
      status: { $in: [ALTERATION_STATUS.RECEIVED, ALTERATION_STATUS.IN_PROGRESS] }
    });
    const totalCompleted = await Alteration.countDocuments({
      ...filter,
      status: ALTERATION_STATUS.COMPLETED
    });
    const totalDelivered = await Alteration.countDocuments({
      ...filter,
      status: ALTERATION_STATUS.DELIVERED
    });

    const alterations = await Alteration.find(filter).select('_id');
    const alterationIds = alterations.map(a => a._id);
    
    const items = await AlterationItem.find({ alterationId: { $in: alterationIds }, tenantId });
    
    const typesCount = {
      Sleeve: 0,
      Length: 0,
      Waist: 0,
      Bottom: 0,
      Shoulder: 0,
      Neck: 0,
      Others: 0
    };
    let totalTypeCount = 0;

    items.forEach(item => {
      const instr = item.instructions || "";
      const parts = instr.split(/[,|]/).map(s => s.trim());
      let hasStandard = false;

      let added = { Sleeve: false, Length: false, Waist: false, Bottom: false, Shoulder: false, Neck: false, Others: false };

      parts.forEach(part => {
        const lower = part.toLowerCase();
        if (lower.includes("sleeve")) { added.Sleeve = true; hasStandard = true; }
        else if (lower.includes("length shortening")) { added.Length = true; hasStandard = true; } 
        else if (lower.includes("waist")) { added.Waist = true; hasStandard = true; }
        else if (lower.includes("bottom")) { added.Bottom = true; hasStandard = true; }
        else if (lower.includes("shoulder")) { added.Shoulder = true; hasStandard = true; }
        else if (lower.includes("neck")) { added.Neck = true; hasStandard = true; }
      });
      
      if (instr.toLowerCase().includes("chest") || (!hasStandard && instr.trim().length > 0)) { 
        added.Others = true; 
      }
      
      if (added.Sleeve) typesCount.Sleeve++;
      if (added.Length) typesCount.Length++;
      if (added.Waist) typesCount.Waist++;
      if (added.Bottom) typesCount.Bottom++;
      if (added.Shoulder) typesCount.Shoulder++;
      if (added.Neck) typesCount.Neck++;
      if (added.Others) typesCount.Others++;
    });

    totalTypeCount = Object.values(typesCount).reduce((a, b) => a + b, 0);

    return {
      pending: totalPending,
      completed: totalCompleted,
      delivered: totalDelivered,
      typeSummary: {
        totalAlterations: totalTypeCount,
        alterationTypes: typesCount
      }
    };
  }
}

module.exports = AlterationService;

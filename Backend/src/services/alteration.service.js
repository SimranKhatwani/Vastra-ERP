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

    if (!data.items || !data.items.length) {
      throw new ApiError(400, 'Alteration request must contain at least one item.');
    }

    data.items.forEach(item => {
      totalCharges += Number(item.charge || 0);
    });

    const alteration = await Alteration.create({
      tenantId,
      alterationNo: data.alterationNo || `ALT-${Date.now()}`,
      saleBillId: data.saleBillId,
      customerId: data.customerId,
      expectedDeliveryDate: data.expectedDeliveryDate,
      tailorName: data.tailorName || 'Default Tailor',
      totalCharges,
      status: ALTERATION_STATUS.RECEIVED,
      remarks: data.remarks,
      createdBy: userId
    });

    const createdItems = [];

    for (const item of data.items) {
      const piece = await InventoryPiece.findOne({ barcode: item.barcode, tenantId });
      if (!piece) {
        throw new ApiError(404, `Item with barcode '${item.barcode}' not found.`);
      }

      const altItem = await AlterationItem.create({
        tenantId,
        alterationId: alteration._id,
        inventoryPieceId: piece._id,
        instructions: item.instructions,
        charge: item.charge || 0,
        createdBy: userId
      });

      piece.status = INVENTORY_STATUS.ALTERED;
      piece.altered = true;
      piece.currentLocation = 'TAILOR_SHOP';
      await piece.save();

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
        notes: `Received for alteration: ${item.instructions}`
      });

      createdItems.push(altItem);
    }

    return { alteration, items: createdItems };
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
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const alterations = await Alteration.find(filter)
      .populate('customerId saleBillId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Alteration.countDocuments(filter);

    // Flatten data for frontend ArticulationView
    const formattedAlterations = await Promise.all(alterations.map(async (alt) => {
      const items = await AlterationItem.find({ alterationId: alt._id }).populate({
        path: 'inventoryPieceId',
        populate: { path: 'productId' }
      });

      const firstItem = items[0] || {};
      const piece = firstItem.inventoryPieceId || {};
      const product = piece.productId || {};

      return {
        _id: alt._id,
        alterationId: alt.alterationNo,
        invoiceNumber: alt.saleBillId ? alt.saleBillId.billNo : '',
        customerName: alt.customerId ? alt.customerId.name : 'Walk-in',
        customerPhone: alt.customerId ? alt.customerId.phone : '',
        productName: firstItem.pieceName || product.name || 'Altered Garment',
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
        createdBy: alt.createdBy
      };
    }));

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

  static async getAlterationDashboard(tenantId) {
    const totalPending = await Alteration.countDocuments({
      tenantId,
      status: { $in: [ALTERATION_STATUS.RECEIVED, ALTERATION_STATUS.IN_PROGRESS] },
      isDeleted: false
    });
    const totalCompleted = await Alteration.countDocuments({
      tenantId,
      status: ALTERATION_STATUS.COMPLETED,
      isDeleted: false
    });
    const totalDelivered = await Alteration.countDocuments({
      tenantId,
      status: ALTERATION_STATUS.DELIVERED,
      isDeleted: false
    });

    return {
      pending: totalPending,
      completed: totalCompleted,
      delivered: totalDelivered
    };
  }
}

module.exports = AlterationService;

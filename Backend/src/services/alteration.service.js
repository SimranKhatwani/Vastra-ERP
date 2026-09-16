const ApiError = require('../helpers/ApiError');
const Alteration = require('../models/alteration/Alteration');
const AlterationItem = require('../models/alteration/AlterationItem');
const PSSM = require('../models/PSSM/PSSM');
const PSSMItem = require('../models/PSSM/PSSMItem');
const InventoryPiece = require('../models/InventoryPiece');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const Customer = require('../models/crm/Customer');
const SaleBill = require('../models/billing/SaleBill');
const SaleItem = require('../models/billing/SaleItem');
const Product = require('../models/Product');
const { INVENTORY_STATUS, LIFECYCLE_EVENT, ALTERATION_STATUS } = require('../constants/status');
const { formatExportData } = require('../helpers/export.helper');
const NotificationService = require('./notification.service');
const AuditService = require('./audit.service');
const TailoringJobService = require('./tailoringJob.service');

class AlterationService {
  static async createAlteration(data, userId, tenantId) {
    if (data.sourceType === 'CUSTOMER_OWN_GARMENT' && !/^[6-9]\d{9}$/.test(String(data.customerPhone || '').trim())) {
      throw new ApiError(400, 'A valid 10-digit customer mobile number is required for custom tailoring.');
    }
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

    const mongoose = require('mongoose');
    let resolvedSaleBillId = data.saleBillId || data.invoiceId;
    let foundBill = null;

    if (resolvedSaleBillId) {
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

    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findById(tenantId).lean();
    const settings = tenant?.commissionSettings || {};
    const commRate = settings.workerPercentage !== undefined ? settings.workerPercentage : 10;
    const commAmount = totalCharges * (commRate / 100);

    const generatedNo = data.alterationNo || data.pssmNo || `PSSM-${Date.now().toString(36).toUpperCase()}`;

    const alteration = await Alteration.create({
      tenantId,
      alterationNo: generatedNo,
      saleBillId: resolvedSaleBillId,
      customerId: data.customerId || (foundBill ? foundBill.customerId : undefined),
      customerName: data.customerName || (foundBill ? foundBill.customerName : ''),
      customerPhone: data.customerPhone || (foundBill ? foundBill.customerPhone : ''),
      expectedDeliveryDate: data.expectedDeliveryDate || data.deliveryDate,
      tailorName: data.tailorName || data.assignedTo || '',
      priority: data.priority || 'Normal',
      gender: data.gender || rawItems[0]?.gender || 'Gents',
      sourceType: data.sourceType || 'SHOWROOM_PURCHASE',
      garmentDescription: data.garmentDescription || '',
      fabricDetails: data.fabricDetails || '',
      trialRequired: Boolean(data.trialRequired),
      trialDate: data.trialRequired && data.trialDate ? data.trialDate : undefined,
      totalCharges,
      commissionPercentage: commRate,
      commissionAmount: commAmount,
      status: ALTERATION_STATUS.RECEIVED,
      remarks: data.remarks || data.customAlterationText || data.specialInstructions,
      createdBy: userId
    });

    // Also record dedicated PSSM master document in Backend/src/models/PSSM/
    const pssmRecord = await PSSM.create({
      tenantId,
      pssmNo: generatedNo,
      saleBillId: resolvedSaleBillId,
      billNo: data.invoiceNumber || (foundBill ? foundBill.billNo : (data.sourceType === 'CUSTOMER_OWN_GARMENT' ? 'CUSTOMER-OWN-GARMENT' : '')),
      billBarcode: data.billBarcode || data.invoiceNumber || (foundBill ? foundBill.billNo : (data.sourceType === 'CUSTOMER_OWN_GARMENT' ? 'CUSTOMER-OWN-GARMENT' : '')),
      customerId: data.customerId || (foundBill ? foundBill.customerId : undefined),
      customerName: data.customerName || (foundBill ? foundBill.customerName : ''),
      customerPhone: data.customerPhone || (foundBill ? foundBill.customerPhone : ''),
      serviceType: data.serviceType || 'Alteration',
      gender: data.gender || rawItems[0]?.gender || 'Gents',
      sourceType: data.sourceType || 'SHOWROOM_PURCHASE',
      expectedDeliveryDate: data.expectedDeliveryDate || data.deliveryDate,
      tailorName: data.tailorName || data.assignedTo || '',
      vendorName: data.vendorName || data.tailorName || '',
      priority: data.priority || 'Normal',
      trialRequired: Boolean(data.trialRequired),
      trialDate: data.trialRequired && data.trialDate ? data.trialDate : undefined,
      totalCharges,
      status: ALTERATION_STATUS.RECEIVED,
      remarks: data.remarks || data.customAlterationText || data.specialInstructions,
      createdBy: userId
    });

    if (foundBill) {
      await SaleBill.updateOne(
        { _id: foundBill._id, tenantId },
        { $set: { hasAlteration: true, alterationId: alteration._id } }
      );
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

      const altItem = await AlterationItem.create({
        tenantId,
        alterationId: alteration._id,
        inventoryPieceId: piece ? piece._id : undefined,
        pieceName: item.pieceName || item.productName || piece?.productId?.name || 'Altered Garment',
        productName: item.productName || item.pieceName || piece?.productId?.name || 'Altered Garment',
        size: item.size || piece?.size || 'FS',
        color: item.color || piece?.primaryColor || 'Standard',
        gender: item.gender || data.gender || 'Gents',
        sourceType: data.sourceType || 'SHOWROOM_PURCHASE',
        barcode: item.barcode || piece?.barcode || '',
        uniqueCode: item.uniqueCode || piece?.uniqueCode || '',
        sku: item.sku || piece?.barcode || '',
        instructions: Array.isArray(item.alterationDetails) ? item.alterationDetails.join(', ') : (item.instructions || data.customAlterationText || 'Standard Fit'),
        alterationDetails: item.alterationDetails || [],
        measurements: item.measurements || {},
        charge: item.charge || 0,
        createdBy: userId
      });

      const pssmItemDoc = await PSSMItem.create({
        tenantId,
        pssmId: pssmRecord._id,
        saleBillId: resolvedSaleBillId,
        inventoryPieceId: piece ? piece._id : undefined,
        pieceName: item.pieceName || item.productName || piece?.productId?.name || 'Altered Garment',
        productName: item.productName || item.pieceName || piece?.productId?.name || 'Altered Garment',
        size: item.size || piece?.size || 'FS',
        color: item.color || piece?.primaryColor || 'Standard',
        gender: item.gender || data.gender || 'Gents',
        sourceType: data.sourceType || 'SHOWROOM_PURCHASE',
        barcode: item.barcode || piece?.barcode || '',
        uniqueCode: item.uniqueCode || piece?.uniqueCode || '',
        sku: item.sku || piece?.barcode || '',
        serviceType: item.serviceType || data.serviceType || 'Alteration',
        assignedTo: item.assignedTo || item.tailorName || data.tailorName || 'Master Tailor',
        instructions: Array.isArray(item.alterationDetails) ? item.alterationDetails.join(', ') : (item.instructions || data.customAlterationText || 'Standard Fit'),
        alterationDetails: item.alterationDetails || [],
        measurements: item.measurements || {},
        charge: item.charge || 0,
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

            altItem.tailorInvoiceNo = job.tailorInvoiceNo;
            altItem.alterationBarcode = job.tailorInvoiceNo;
            await altItem.save();

            createdTailoringJobs.push(job);
          }
        } catch (tjErr) {
          console.error('[AlterationService] TailoringJob creation failed (non-fatal):', tjErr.message);
        }
      }

      if (!altItem.alterationBarcode) {
        altItem.alterationBarcode = altItem.tailorInvoiceNo || `ALT-${alteration.alterationNo}-${createdItems.length + 1}`;
        await altItem.save();
      }
      if (!pssmItemDoc.alterationBarcode) {
        pssmItemDoc.alterationBarcode = altItem.alterationBarcode;
        await pssmItemDoc.save();
      }

      if (resolvedSaleBillId) {
        const itemBarcode = item.barcode || item.uniqueCode;
        const itemName = item.pieceName || item.productName;
        await SaleItem.updateMany(
          {
            saleBillId: resolvedSaleBillId,
            tenantId,
            $or: [
              ...(piece ? [{ inventoryPieceId: piece._id }] : []),
              ...(itemBarcode ? [{ barcode: itemBarcode }, { uniqueCode: itemBarcode }] : []),
              ...(itemName ? [{ name: itemName }, { itemName: itemName }] : [])
            ]
          },
          { $set: { hasAlteration: true, alterationStatus: 'CONFIGURED', alterationId: alteration._id } }
        );
      }

      if (piece) {
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

    // Optionally update customer master measurement if requested
    if (data.saveAsMaster && (data.customerId || data.customerPhone) && data.measurements) {
      try {
        const Customer = require('../models/crm/Customer');
        let cust = null;
        if (data.customerId) cust = await Customer.findOne({ _id: data.customerId, tenantId });
        if (!cust && data.customerPhone) cust = await Customer.findOne({ phone: data.customerPhone, tenantId });
        if (cust) {
          cust.masterMeasurements = data.measurements;
          if (!cust.measurementHistory) cust.measurementHistory = [];
          cust.measurementHistory.unshift({
            garmentType: data.productName || 'Garment',
            measurements: data.measurements,
            ticketId: alteration.alterationNo || alteration.alterationId,
            tailorName: alteration.tailorName || 'Master Tailor',
            notes: 'Saved from Alteration Creation',
            takenAt: new Date()
          });
          await cust.save();
        }
      } catch (cErr) {
        console.warn("Notice: could not save master measurement on creation:", cErr.message);
      }
    }

    return { alteration, items: createdItems, tailoringJobs: createdTailoringJobs };
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

  static async updateStatus(alterationId, status, userId, tenantId, measurements, alterationDetails, extraData = {}) {
    const mongoose = require('mongoose');
    const isValidId = mongoose.Types.ObjectId.isValid(alterationId) && String(alterationId).length === 24;

    let alteration = null;
    if (isValidId) {
      alteration = await Alteration.findOne({ _id: alterationId, tenantId });
    }
    if (!alteration) {
      alteration = await Alteration.findOne({
        tenantId,
        $or: [
          { alterationNo: alterationId },
          { alterationBarcode: alterationId },
          { tailorInvoiceNo: alterationId }
        ]
      });
    }

    if (alteration) {
      const oldStatus = alteration.status;
      const normalizedOldStatus = String(oldStatus || '').toUpperCase().replace(/[\s-]+/g, '_');
      const normalizedNewStatus = String(status || '').toUpperCase().replace(/[\s-]+/g, '_');
      const isReadyForCollection = ['READY', 'READY_FOR_DELIVERY', 'READY_FOR_COLLECTION'].includes(normalizedOldStatus);
      if (['COLLECTED', 'DELIVERED'].includes(normalizedNewStatus) && !isReadyForCollection) {
        throw new ApiError(400, 'A tailoring job must be marked Ready before it can be Delivered. Please complete the workflow in sequence.');
      }
      const oldTailor = alteration.tailorName;
      const oldVendor = alteration.vendorName;
      const oldCustomerPhone = alteration.customerPhone;
      const oldDelDate = alteration.expectedDeliveryDate ? new Date(alteration.expectedDeliveryDate).toLocaleDateString('en-IN') : null;

      // 1. DELIVERY DATE CHANGE
      const incomingDelDate = extraData.deliveryDate || extraData.expectedDeliveryDate;
      if (incomingDelDate) {
        const newDelDateObj = new Date(incomingDelDate);
        const newDelDateStr = newDelDateObj.toLocaleDateString('en-IN');
        if (oldDelDate !== newDelDateStr) {
          alteration.expectedDeliveryDate = newDelDateObj;
          await AuditService.trackAuditLog({
            tenantId,
            userId,
            userName: extraData.userName || 'Authorized Staff',
            action: 'DELIVERY_DATE_CHANGE',
            module: 'alterations',
            entityId: alteration._id.toString(),
            entityType: 'ALTERATION',
            displayName: `Alteration #${alteration.alterationNo}`,
            item: `Alteration #${alteration.alterationNo} - Delivery Date Changed`,
            fieldChanged: 'Delivery Date',
            oldValue: oldDelDate || 'Not set',
            newValue: newDelDateStr,
            reason: extraData.reason || 'Delivery date rescheduled',
            details: { alterationNo: alteration.alterationNo, oldDeliveryDate: oldDelDate, newDeliveryDate: newDelDateStr }
          }, extraData.io);
        }
      }

      // 2. TAILOR CHANGE
      if (extraData.tailorName && extraData.tailorName !== oldTailor) {
        alteration.tailorName = extraData.tailorName;
        await AuditService.trackAuditLog({
          tenantId,
          userId,
          userName: extraData.userName || 'Authorized Staff',
          action: 'TAILOR_CHANGE',
          module: 'alterations',
          entityId: alteration._id.toString(),
          entityType: 'ALTERATION',
          displayName: `Alteration #${alteration.alterationNo}`,
          item: `Alteration #${alteration.alterationNo} - Tailor Changed`,
          fieldChanged: 'Tailor',
          oldValue: oldTailor || 'Unassigned',
          newValue: extraData.tailorName,
          reason: extraData.reason || `Tailor reassigned to ${extraData.tailorName}`,
          details: { alterationNo: alteration.alterationNo, oldTailor, newTailor: extraData.tailorName }
        }, extraData.io);
      }

      // 3. VENDOR CHANGE
      if (extraData.vendorName && extraData.vendorName !== oldVendor) {
        alteration.vendorName = extraData.vendorName;
        await AuditService.trackAuditLog({
          tenantId,
          userId,
          userName: extraData.userName || 'Authorized Staff',
          action: 'VENDOR_CHANGE',
          module: 'alterations',
          entityId: alteration._id.toString(),
          entityType: 'ALTERATION',
          displayName: `Alteration #${alteration.alterationNo}`,
          item: `Alteration #${alteration.alterationNo} - Vendor Changed`,
          fieldChanged: 'Vendor',
          oldValue: oldVendor || 'In-House',
          newValue: extraData.vendorName,
          reason: extraData.reason || `Routed to vendor ${extraData.vendorName}`,
          details: { alterationNo: alteration.alterationNo, oldVendor, newVendor: extraData.vendorName }
        }, extraData.io);
      }

      // 4. CUSTOMER MOBILE CHANGE
      const incomingPhone = extraData.customerPhone || extraData.customerMobile;
      if (incomingPhone && incomingPhone !== oldCustomerPhone) {
        alteration.customerPhone = incomingPhone;
        await AuditService.trackAuditLog({
          tenantId,
          userId,
          userName: extraData.userName || 'Authorized Staff',
          action: 'CUSTOMER_MOBILE_CHANGE',
          module: 'alterations',
          entityId: alteration._id.toString(),
          entityType: 'ALTERATION',
          displayName: alteration.customerName || 'Customer',
          item: `Alteration #${alteration.alterationNo} - Customer Phone Updated`,
          fieldChanged: 'Customer Mobile',
          oldValue: oldCustomerPhone || 'None',
          newValue: incomingPhone,
          reason: extraData.reason || 'Customer contact number updated',
          details: { alterationNo: alteration.alterationNo, oldPhone: oldCustomerPhone, newPhone: incomingPhone }
        }, extraData.io);
      }

      // 5. SERVICE CHANGE
      if (alterationDetails && Array.isArray(alterationDetails)) {
        const oldDetailsStr = (alteration.alterationDetails || []).join(', ');
        const newDetailsStr = alterationDetails.join(', ');
        if (oldDetailsStr !== newDetailsStr) {
          alteration.alterationDetails = alterationDetails;
          await AuditService.trackAuditLog({
            tenantId,
            userId,
            userName: extraData.userName || 'Authorized Staff',
            action: 'SERVICE_CHANGE',
            module: 'alterations',
            entityId: alteration._id.toString(),
            entityType: 'ALTERATION',
            displayName: `Alteration #${alteration.alterationNo}`,
            item: `Alteration #${alteration.alterationNo} - Service Details Modified`,
            fieldChanged: 'Alteration Details',
            oldValue: oldDetailsStr || 'Standard Fit',
            newValue: newDetailsStr,
            reason: extraData.reason || 'Alteration service specifications updated',
            details: { alterationNo: alteration.alterationNo }
          }, extraData.io);
        }
      }

      // 6. STATUS UPDATE & MANUAL DELIVERY
      if (status && status !== oldStatus) {
        alteration.status = status;
        const isManualDelivery = (status === ALTERATION_STATUS.DELIVERED || status === 'Delivered');

        await AuditService.trackAuditLog({
          tenantId,
          userId,
          userName: extraData.userName || 'Authorized Staff',
          action: isManualDelivery ? 'MANUAL_DELIVERY' : 'MANUAL_STATUS_UPDATE',
          module: 'alterations',
          entityId: alteration._id.toString(),
          entityType: 'ALTERATION',
          displayName: `Alteration #${alteration.alterationNo}`,
          item: `Alteration #${alteration.alterationNo} - ${isManualDelivery ? 'Delivered to Customer' : 'Status Updated'}`,
          fieldChanged: isManualDelivery ? 'Delivery Status' : 'Status',
          oldValue: oldStatus,
          newValue: status,
          reason: extraData.reason || (isManualDelivery ? 'Garment handed over to customer / Collected' : `Status changed to ${status}`),
          details: { alterationNo: alteration.alterationNo, oldStatus, newStatus: status }
        }, extraData.io);
      }

      if (extraData.priority) alteration.priority = extraData.priority;
      if (extraData.trialRequired !== undefined) {
        alteration.trialRequired = Boolean(extraData.trialRequired);
        if (!alteration.trialRequired) alteration.trialDate = undefined;
      }
      if (extraData.trialDate && alteration.trialRequired) alteration.trialDate = new Date(extraData.trialDate);
      if (extraData.fittingResult !== undefined) alteration.fittingResult = extraData.fittingResult;
      if (extraData.requiredChanges !== undefined) alteration.requiredChanges = extraData.requiredChanges;
      if (extraData.reAlterationRequired !== undefined) alteration.reAlterationRequired = Boolean(extraData.reAlterationRequired);
      if (extraData.remarks || extraData.specialInstructions || extraData.customAlterationText) {
        alteration.remarks = extraData.remarks || extraData.specialInstructions || extraData.customAlterationText;
      }
      if (measurements) alteration.measurements = measurements;
      alteration.updatedBy = userId;
      await alteration.save();

      // Update customer master profile ONLY if explicitly requested (never automatically overwrite)
      if (extraData.saveAsMaster && measurements) {
        try {
          const Customer = require('../models/crm/Customer');
          let cust = null;
          if (alteration.customerId) {
            cust = await Customer.findOne({ _id: alteration.customerId, tenantId });
          }
          if (!cust && alteration.customerPhone) {
            cust = await Customer.findOne({ phone: alteration.customerPhone, tenantId });
          }
          if (cust) {
            cust.masterMeasurements = measurements;
            if (!cust.measurementHistory) cust.measurementHistory = [];
            cust.measurementHistory.unshift({
              garmentType: alteration.productName || 'Garment',
              measurements,
              ticketId: alteration.alterationNo || alteration.alterationId,
              tailorName: alteration.tailorName || 'Master Tailor',
              notes: 'Saved from Alteration Job',
              takenAt: new Date()
            });
            await cust.save();
          }
        } catch (cErr) {
          console.warn("Notice: could not update customer master measurement:", cErr.message);
        }
      }

      if (measurements || alterationDetails) {
        const altItem = await AlterationItem.findOne({ alterationId, tenantId });
        if (altItem) {
          if (measurements) altItem.measurements = measurements;
          if (alterationDetails) altItem.alterationDetails = alterationDetails;
          await altItem.save();
        }
      }

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

    // Support PSSMItem updates seamlessly from ArticulationView & Tailor Dashboard
    const PSSMItem = require('../models/PSSM/PSSMItem');
    const PSSM = require('../models/PSSM/PSSM');
    const PSSMService = require('./pssm.service');

    let pssmItem = null;
    if (isValidId) {
      pssmItem = await PSSMItem.findOne({ _id: alterationId, tenantId });
    }
    if (!pssmItem) {
      pssmItem = await PSSMItem.findOne({
        tenantId,
        $or: [
          { tailorInvoiceNo: alterationId },
          { alterationBarcode: alterationId },
          { barcode: alterationId },
          { uniqueCode: alterationId }
        ]
      });
    }
    if (!pssmItem) {
      const pssmDoc = await PSSM.findOne({
        tenantId,
        $or: [
          ...(isValidId ? [{ _id: alterationId }] : []),
          { pssmNo: alterationId },
          { billBarcode: alterationId },
          { billNo: alterationId }
        ]
      });
      if (pssmDoc) {
        pssmItem = await PSSMItem.findOne({ pssmId: pssmDoc._id, tenantId });
      }
    }

    if (pssmItem) {
      const activeMeasurements = measurements || pssmItem.measurements || {};

      let nextPssmStatus = pssmItem.status;
      const normStatusIn = String(status || '').toUpperCase().trim().replace(/[\s-]+/g, '_');

      if (normStatusIn === 'PENDING' || normStatusIn === 'PENDING_ASSIGNMENT' || normStatusIn === 'RECEIVED') {
        nextPssmStatus = 'PENDING_ASSIGNMENT';
      } else if (normStatusIn === 'IN_CUTTING' || normStatusIn === 'CUTTING') {
        nextPssmStatus = 'IN_CUTTING';
      } else if (['IN_STITCHING', 'STITCHING', 'IN_PROGRESS', 'ASSIGNED'].includes(normStatusIn)) {
        nextPssmStatus = 'IN_STITCHING';
      } else if (['IN_TRIAL', 'READY_FOR_TRIAL', 'TRIAL'].includes(normStatusIn)) {
        nextPssmStatus = 'IN_TRIAL';
      } else if (['RE_ALTERATION', 'REALTERATION', 'REWORK'].includes(normStatusIn)) {
        nextPssmStatus = 'RE_ALTERATION';
      } else if (['QUALITY_CHECK', 'QC', 'QA'].includes(normStatusIn)) {
        nextPssmStatus = 'QUALITY_CHECK';
      } else if (['READY', 'READY_FOR_DELIVERY', 'READY_FOR_PICKUP', 'COMPLETED'].includes(normStatusIn)) {
        nextPssmStatus = 'READY';
      } else if (['DELIVERED', 'COLLECTED', 'CLOSED'].includes(normStatusIn)) {
        nextPssmStatus = 'COLLECTED';
      } else if (['CANCELLED', 'CANCELED'].includes(normStatusIn)) {
        nextPssmStatus = 'CLOSED';
      } else if (status) {
        nextPssmStatus = status;
      }

      await PSSMService.updateItemStatus(
        pssmItem._id,
        nextPssmStatus,
        activeMeasurements,
        alterationDetails || pssmItem.alterationDetails,
        userId,
        tenantId,
        extraData
      );
      return { _id: pssmItem._id, status: status || nextPssmStatus, measurements: activeMeasurements };
    }

    throw new ApiError(404, 'Alteration or PSSM tailoring record not found.');
  }

  static async getAlterations(query = {}, tenantId) {
    const filter = { tenantId, isDeleted: false };
    if (query.status) filter.status = query.status;
    if (query.tailorName) filter.tailorName = new RegExp(query.tailorName, 'i');
    if (query.search) filter.alterationNo = new RegExp(query.search, 'i');

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 100;
    const skip = (page - 1) * limit;

    const [alterations, total] = await Promise.all([
      Alteration.find(filter)
        .populate('customerId saleBillId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Alteration.countDocuments(filter)
    ]);

    const altIds = alterations.map(a => a._id);

    // Batch fetch all items in ONE query
    const allItems = await AlterationItem.find({ alterationId: { $in: altIds } }).populate({
      path: 'inventoryPieceId',
      populate: { path: 'productId' }
    }).lean();

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
      const productName = firstItem.productName || firstItem.pieceName || product.name || product.itemName || 'Altered Garment';
      const size = firstItem.size || piece.size || product.size || 'FS';
      const color = firstItem.color || piece.primaryColor || product.color || 'Standard';
      const barcode = firstItem.barcode || piece.barcode || '';
      const uniqueCode = firstItem.uniqueCode || piece.uniqueCode || '';
      const sku = firstItem.sku || piece.barcode || product.sku || '';
      const tailorInvoiceNo = firstItem.tailorInvoiceNo || '';
      const measurements = firstItem.measurements || alt.measurements || {};
      const alterationDetails = (firstItem.alterationDetails && firstItem.alterationDetails.length > 0)
        ? firstItem.alterationDetails
        : (firstItem.instructions ? firstItem.instructions.split(', ') : (alt.remarks ? [alt.remarks] : []));

      return {
        _id: alt._id,
        alterationId: alt.alterationNo,
        invoiceNumber: alt.saleBillId ? (alt.saleBillId.billNo || alt.saleBillId.invoiceNo) : (alt.invoiceNumber || ''),
        invoiceId: alt.saleBillId ? (alt.saleBillId.billNo || alt.saleBillId.invoiceNo || alt.saleBillId._id) : (alt.invoiceNumber || alt.invoiceId || ''),
        saleBillId: alt.saleBillId?._id || alt.saleBillId,
        saleBill: alt.saleBillId || null,
        customerName: alt.customerName || (alt.customerId ? alt.customerId.name : (alt.saleBillId ? (alt.saleBillId.customerName || alt.saleBillId.customerId?.name) : 'Walk-in Customer')),
        customerPhone: alt.customerPhone || (alt.customerId ? alt.customerId.phone : (alt.saleBillId ? (alt.saleBillId.customerPhone || alt.saleBillId.customerId?.phone) : '')),
        productName,
        sourceType: alt.sourceType || 'SHOWROOM_PURCHASE',
        gender: alt.gender || firstItem.gender || 'Gents',
        serviceType: firstItem.serviceType || alt.serviceType || 'Alteration',
        barcode,
        uniqueCode,
        sku,
        size,
        color,
        tailorInvoiceNo,
        alterationBarcode: tailorInvoiceNo || firstItem.alterationBarcode || alt.alterationBarcode || alt.alterationNo,
        tailorName: alt.tailorName || 'Master Tailor',
        priority: alt.priority || 'Normal',
        status: (() => {
          const s = String(alt.status || '').toUpperCase().replace(/[-\s]/g, '_');
          if (s === 'IN_CUTTING' || s === 'CUTTING') return 'In Cutting';
          if (s === 'IN_STITCHING' || s === 'STITCHING' || s === 'IN_PROGRESS' || s === 'ASSIGNED') return 'In Stitching';
          if (s === 'IN_TRIAL' || s === 'TRIAL' || s === 'READY_FOR_TRIAL') return 'In Trial';
          if (s === 'RE_ALTERATION' || s === 'REALTERATION' || s === 'REWORK') return 'Re-Alteration';
          if (s === 'QUALITY_CHECK' || s === 'QC' || s === 'QA') return 'Quality Check';
          if (s === 'READY' || s === 'READY_FOR_DELIVERY' || s === 'COMPLETED') return 'Ready';
          if (s === 'COLLECTED' || s === 'DELIVERED' || s === 'CLOSED') return 'Delivered';
          if (s === 'CANCELLED') return 'Cancelled';
          return alt.status || 'Pending';
        })(),
        deliveryDate: alt.expectedDeliveryDate ? (new Date(alt.expectedDeliveryDate).toISOString().split('T')[0]) : '',
        trialRequired: Boolean(alt.trialRequired),
        trialDate: alt.trialRequired && alt.trialDate ? (new Date(alt.trialDate).toISOString().split('T')[0]) : '',
        fittingResult: alt.fittingResult || '',
        requiredChanges: alt.requiredChanges || '',
        reAlterationRequired: Boolean(alt.reAlterationRequired),
        alterationDetails,
        measurements,
        remarks: alt.remarks || firstItem.instructions || '',
        specialInstructions: alt.remarks || firstItem.instructions || '',
        customAlterationText: alt.remarks || '',
        totalCharges: alt.totalCharges || 0,
        items,
        createdAt: alt.createdAt,
        createdBy: alt.createdBy
      };
    });

    // Also include active & recent PSSM items (Post-Sales Service records)
    const PSSMItem = require('../models/PSSM/PSSMItem');
    const existingTicketNumbers = new Set(alterations.map(a => a.alterationNo));

    const pssmItems = await PSSMItem.find({ tenantId, isDeleted: { $ne: true } })
      .populate({
        path: 'pssmId',
        populate: { path: 'customerId saleBillId' }
      })
      .populate({
        path: 'inventoryPieceId',
        populate: { path: 'productId' }
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const TailoringJob = require('../models/tailoring/TailoringJob');
    const TailoringJobService = require('./tailoringJob.service');

    const pssmItemIds = pssmItems.map(pi => pi._id);
    const existingJobs = await TailoringJob.find({ tenantId, pssmItemId: { $in: pssmItemIds } }).lean();
    const jobsByItemId = new Map(existingJobs.map(j => [j.pssmItemId?.toString(), j]));

    const formattedPssm = pssmItems
      .filter(pi => pi.pssmId && !existingTicketNumbers.has(pi.pssmId.pssmNo))
      .map((pi) => {
        const pssm = pi.pssmId || {};
        const custName = pssm.customerName || (pssm.customerId?.name) || 'Walk-in Customer';
        const custPhone = pssm.customerPhone || (pssm.customerId?.phone) || '';
        const invNo = pssm.billNo || pssm.billBarcode || (pssm.saleBillId ? (pssm.saleBillId.billNo || pssm.saleBillId.invoiceNo) : '');
        const invId = pssm.saleBillId?._id || invNo;

        let tailorInvoiceNo = pi.tailorInvoiceNo || jobsByItemId.get(pi._id.toString())?.tailorInvoiceNo || '';

        // Auto-heal missing Tailor Invoice No for any tailoring PSSM item asynchronously
        const tailoringServiceTypes = ['Alteration', 'Custom Tailoring', 'Full Stitching', 'Fitting & Hemming', 'Repairs / Redesign'];
        if (!tailorInvoiceNo && tailoringServiceTypes.includes(pi.serviceType || pssm.serviceType || 'Alteration')) {
          setImmediate(async () => {
            try {
              const newJob = await TailoringJobService.createFromPSSMItem(pssm, pi, pi.createdBy, tenantId);
              if (newJob?.tailorInvoiceNo) {
                await PSSMItem.updateOne({ _id: pi._id }, { $set: { tailorInvoiceNo: newJob.tailorInvoiceNo } });
              }
            } catch (e) {
              // Non-fatal background auto-heal
            }
          });
        }

        const hasMeasurements = pi.measurements && typeof pi.measurements === 'object' &&
          Object.keys(pi.measurements).length > 0 &&
          Object.values(pi.measurements).some(v => v !== null && v !== '' && v !== undefined);

        let displayStatus = 'Pending';
        const normStatus = String(pi.status || '').toUpperCase().replace(/[-\s]/g, '_');
        if (normStatus === 'IN_CUTTING' || normStatus === 'CUTTING') {
          displayStatus = 'In Cutting';
        } else if (normStatus === 'IN_STITCHING' || normStatus === 'STITCHING') {
          displayStatus = 'In Stitching';
        } else if (normStatus === 'IN_TRIAL' || normStatus === 'TRIAL' || normStatus === 'READY_FOR_TRIAL') {
          displayStatus = 'In Trial';
        } else if (normStatus === 'RE_ALTERATION' || normStatus === 'REALTERATION' || normStatus === 'REWORK') {
          displayStatus = 'Re-Alteration';
        } else if (normStatus === 'QUALITY_CHECK' || normStatus === 'QC' || normStatus === 'QA') {
          displayStatus = 'Quality Check';
        } else if (normStatus === 'READY' || normStatus === 'READY_FOR_DELIVERY' || normStatus === 'COMPLETED') {
          displayStatus = 'Ready';
        } else if (normStatus === 'COLLECTED' || normStatus === 'DELIVERED' || normStatus === 'CLOSED') {
          displayStatus = 'Delivered';
        } else if (!hasMeasurements && (normStatus === 'PENDING_ASSIGNMENT' || normStatus === 'ASSIGNED' || !normStatus)) {
          displayStatus = 'Pending';
        } else if (normStatus === 'IN_PROGRESS' || normStatus === 'ASSIGNED') {
          displayStatus = 'In Stitching';
        } else if (normStatus === 'PENDING_ASSIGNMENT' || !normStatus) {
          displayStatus = 'Pending';
        } else if (pi.status) {
          displayStatus = pi.status;
        }

        const altDetails = (Array.isArray(pi.alterationDetails) && pi.alterationDetails.length > 0)
          ? pi.alterationDetails
          : (pi.serviceType ? [pi.serviceType] : ['Standard Service']);

        const isPssmTrialReq = Boolean(pi.trialRequired !== undefined ? pi.trialRequired : pssm.trialRequired);
        const pssmTrialDate = isPssmTrialReq
          ? (pi.trialDate ? new Date(pi.trialDate).toISOString().split('T')[0] : (pssm.trialDate ? new Date(pssm.trialDate).toISOString().split('T')[0] : ''))
          : '';

        return {
          _id: pi._id,
          alterationId: pssm.pssmNo,
          invoiceNumber: invNo,
          invoiceId: invId,
          saleBillId: pssm.saleBillId?._id || pssm.saleBillId || null,
          saleBill: pssm.saleBillId || null,
          customerName: custName,
          customerPhone: custPhone,
          sourceType: pi.sourceType || pssm.sourceType || 'SHOWROOM_PURCHASE',
          gender: pi.gender || pssm.gender || 'Gents',
          productName: pi.productName || pi.pieceName || 'Garment Item',
          barcode: pi.barcode || pi.uniqueCode || '',
          uniqueCode: pi.uniqueCode || pi.barcode || '',
          sku: pi.sku || pi.barcode || '',
          size: pi.size || 'FS',
          color: pi.color || 'Standard',
          tailorInvoiceNo: tailorInvoiceNo || '',
          alterationBarcode: tailorInvoiceNo || pi.alterationBarcode || pi.barcode || `${pssm.pssmNo}-${pi._id}`,
          tailorName: pi.assignedTo || pssm.tailorName || 'Master Tailor',
          priority: pi.priority === 'DELIVERY' || pssm.priority === 'DELIVERY' ? 'Urgent' : (pi.priority || pssm.priority || 'Normal'),
          status: displayStatus,
          rawStatus: pi.status,
          needsMeasurements: !hasMeasurements && displayStatus !== 'Delivered' && displayStatus !== 'Ready',
          deliveryDate: pssm.expectedDeliveryDate ? new Date(pssm.expectedDeliveryDate).toISOString().split('T')[0] : '',
          trialRequired: isPssmTrialReq,
          trialDate: pssmTrialDate,
          fittingResult: pi.fittingResult || pssm.fittingResult || '',
          requiredChanges: pi.requiredChanges || pssm.requiredChanges || '',
          reAlterationRequired: Boolean(pi.reAlterationRequired !== undefined ? pi.reAlterationRequired : pssm.reAlterationRequired),
          alterationDetails: altDetails,
          serviceType: pi.serviceType || altDetails.join(' + '),
          measurements: pi.measurements || {},
          remarks: pi.instructions || pssm.remarks || '',
          specialInstructions: pi.instructions || pssm.remarks || '',
          customAlterationText: pi.instructions || pssm.remarks || '',
          totalCharges: pi.charge || pssm.totalCharges || 0,
          items: [{
            _id: pi._id,
            barcode: pi.barcode || pi.uniqueCode,
            pieceName: pi.pieceName || pi.productName,
            instructions: pi.instructions,
            alterationDetails: altDetails,
            measurements: pi.measurements,
            charge: pi.charge || 0
          }],
          isPssm: true,
          pssmItemId: pi._id,
          pssmId: pssm._id,
          createdAt: pi.createdAt,
          createdBy: pi.createdBy
        };
      })
      .filter(record => {
        if (query.status && record.status !== query.status && record.rawStatus !== query.status) return false;
        if (query.tailorName && !new RegExp(query.tailorName, 'i').test(record.tailorName)) return false;
        if (query.search) {
          const s = query.search.toLowerCase();
          const matches = (record.alterationId && record.alterationId.toLowerCase().includes(s)) ||
            (record.invoiceNumber && record.invoiceNumber.toLowerCase().includes(s)) ||
            (record.customerName && record.customerName.toLowerCase().includes(s)) ||
            (record.customerPhone && record.customerPhone.includes(s)) ||
            (record.productName && record.productName.toLowerCase().includes(s)) ||
            (record.barcode && record.barcode.toLowerCase().includes(s));
          if (!matches) return false;
        }
        return true;
      });

    const combined = [...formattedAlterations, ...formattedPssm].sort((a, b) => {
      // Priority 1: Items needing measurements & pending are sorted directly at top
      const aNeeds = a.needsMeasurements && (a.status === 'Pending' || a.status === 'Pending Measurements');
      const bNeeds = b.needsMeasurements && (b.status === 'Pending' || b.status === 'Pending Measurements');
      if (aNeeds && !bNeeds) return -1;
      if (!aNeeds && bNeeds) return 1;

      // Priority 2: Newest created first
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return {
      alterations: combined,
      pagination: {
        total: total + formattedPssm.length,
        page,
        limit,
        pages: Math.ceil((total + formattedPssm.length) / limit)
      }
    };
  }

  static async getAlterationById(alterationId, tenantId) {
    const alteration = await Alteration.findOne({ _id: alterationId, tenantId, isDeleted: false })
      .populate('customerId saleBillId');
    if (alteration) {
      const items = await AlterationItem.find({ alterationId, tenantId })
        .populate('inventoryPieceId');
      return { alteration, items };
    }

    const PSSMItem = require('../models/PSSM/PSSMItem');
    const pi = await PSSMItem.findOne({ _id: alterationId, tenantId })
      .populate({
        path: 'pssmId',
        populate: { path: 'customerId saleBillId' }
      })
      .populate('inventoryPieceId');

    if (pi) {
      return {
        alteration: {
          _id: pi._id,
          alterationNo: pi.pssmId?.pssmNo,
          customerName: pi.pssmId?.customerName,
          customerPhone: pi.pssmId?.customerPhone,
          tailorName: pi.assignedTo,
          status: pi.status,
          expectedDeliveryDate: pi.pssmId?.expectedDeliveryDate,
          remarks: pi.instructions
        },
        items: [pi]
      };
    }

    throw new ApiError(404, 'Alteration record not found.');
  }

  static async getAlterationDashboard(tenantId, dateRange) {
    const PSSM = require('../models/PSSM/PSSM');
    const PSSMItem = require('../models/PSSM/PSSMItem');
    const User = require('../models/User');
    const Salesman = require('../models/masters/Salesman');

    // Date range filter for creation / delivery date if selected
    let startDate = null;
    let endDate = null;
    if (dateRange && dateRange !== 'All Time' && dateRange !== 'All') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);

      if (dateRange === 'Today') {
        // Today range
      } else if (dateRange === 'Yesterday') {
        startDate.setDate(startDate.getDate() - 1);
        endDate.setDate(endDate.getDate() - 1);
      } else if (dateRange === 'Last 7 Days') {
        startDate.setDate(startDate.getDate() - 6);
      } else if (dateRange === 'Last 30 Days') {
        startDate.setDate(startDate.getDate() - 29);
      } else if (dateRange === 'This Month') {
        startDate.setDate(1);
      }
    }

    // Concurrent parallel queries with lean projections for ultra-fast response
    const [pssmItems, alterations, altItems, tailorUsers, salesmen] = await Promise.all([
      PSSMItem.find({ tenantId, isDeleted: { $ne: true } })
        .select('pssmId pieceName productName status serviceType alterationDetails instructions measurements assignedTo customerWaitingOption completedAt completedBy reAlterationRequired expectedDeliveryDate createdAt updatedAt')
        .populate({
          path: 'pssmId',
          select: 'pssmNo billNo expectedDeliveryDate createdAt assignedTo tailorName vendorName customerWaitingOption serviceType'
        })
        .lean(),
      Alteration.find({ tenantId, isDeleted: { $ne: true } })
        .select('alterationNo pieceName productName status serviceType remarks measurements tailorName vendorName customerWaitingOption completedAt completedBy reAlterationRequired expectedDeliveryDate createdAt updatedAt')
        .lean(),
      AlterationItem.find({ tenantId })
        .select('alterationId pieceName productName alterationDetails instructions measurements')
        .lean(),
      User.find({
        tenantId,
        isDeleted: { $ne: true },
        $or: [
          { role: { $regex: /^(tailor|karigar|darzi|master\s*tailor)$/i } },
          { designation: { $regex: /^(tailor|karigar|darzi)$/i } },
          { name: { $regex: /^ajay$/i } }
        ]
      }).select('name designation role').lean().catch(() => []),
      Salesman.find({
        tenantId,
        isDeleted: { $ne: true },
        $or: [
          { designation: { $regex: /^(tailor|karigar|darzi)$/i } },
          { role: { $regex: /^(tailor|karigar|darzi)$/i } }
        ]
      }).select('name designation role').lean().catch(() => [])
    ]);

    const altItemsByAltId = new Map();
    (altItems || []).forEach(ai => {
      const key = ai.alterationId?.toString();
      if (!altItemsByAltId.has(key)) altItemsByAltId.set(key, []);
      altItemsByAltId.get(key).push(ai);
    });

    const now = new Date();

    const normalizeJobStatus = (s) => {
      if (!s) return 'PENDING';
      const str = String(s).toUpperCase().replace(/[-\s]/g, '_');
      if (['IN_CUTTING', 'CUTTING'].includes(str)) return 'IN_CUTTING';
      if (['IN_STITCHING', 'STITCHING'].includes(str)) return 'IN_STITCHING';
      if (['IN_TRIAL', 'TRIAL', 'READY_FOR_TRIAL'].includes(str)) return 'IN_TRIAL';
      if (['RE_ALTERATION', 'REALTERATION', 'REWORK'].includes(str)) return 'RE_ALTERATION';
      if (['QUALITY_CHECK', 'QC', 'QA'].includes(str)) return 'QUALITY_CHECK';
      if (['READY', 'READY_FOR_DELIVERY', 'READY_FOR_COLLECTION'].includes(str)) return 'READY';
      if (['COLLECTED', 'DELIVERED', 'CLOSED', 'COMPLETED'].includes(str)) return 'DELIVERED';
      if (['IN_PROGRESS', 'ASSIGNED', 'INPROGRESS'].includes(str)) return 'IN_STITCHING';
      return 'PENDING';
    };

    // Unified jobs list
    const unifiedJobs = [];

    // Helper to normalize tailor names to genuine store tailors
    const resolveTailorName = (raw) => {
      const s = String(raw || '').trim();
      if (!s) return 'Ajay';
      if (/ajay/i.test(s)) return 'Ajay';
      if (['default tailor', 'master tailor', 'master ramesh kumar', 'none', 'n/a', 'unassigned'].includes(s.toLowerCase())) {
        return 'Ajay';
      }
      return s.charAt(0).toUpperCase() + s.slice(1);
    };

    // Add PSSM items
    pssmItems.forEach(pi => {
      const pssm = pi.pssmId || {};
      const expDate = pi.expectedDeliveryDate || pssm.expectedDeliveryDate ? new Date(pi.expectedDeliveryDate || pssm.expectedDeliveryDate) : null;
      const status = normalizeJobStatus(pi.status);
      const createdAt = new Date(pi.createdAt || pssm.createdAt || now);
      const rawTailor = pi.assignedTo || pssm.assignedTo || pssm.tailorName || pssm.vendorName || '';
      const tailor = resolveTailorName(rawTailor);
      const custOption = pi.customerWaitingOption || pssm.customerWaitingOption || 'Will Come Later';

      unifiedJobs.push({
        id: pi._id,
        ticketNo: pssm.pssmNo || '',
        pieceName: pi.pieceName || pi.productName || '',
        productName: pi.productName || pi.pieceName || '',
        createdAt,
        expectedDeliveryDate: expDate,
        status,
        rawStatus: pi.status,
        serviceType: pi.serviceType || pssm.serviceType || '',
        alterationDetails: pi.alterationDetails || [],
        instructions: pi.instructions || '',
        measurements: pi.measurements || {},
        tailorName: tailor,
        customerWaitingOption: custOption,
        completedAt: pi.completedAt ? new Date(pi.completedAt) : (['READY', 'DELIVERED'].includes(status) ? new Date(pi.updatedAt || now) : null),
        completedBy: pi.completedBy || tailor,
        reAlterationRequired: Boolean(pi.reAlterationRequired || status === 'RE_ALTERATION' || (pi.alterationDetails || []).some(d => /re-?alter/i.test(d)))
      });
    });

    // Add legacy alterations if not duplicate
    alterations.forEach(alt => {
      if (pssmItems.some(pi => pi.pssmId?.pssmNo === alt.alterationNo)) return;
      const items = altItemsByAltId.get(alt._id.toString()) || [];
      const expDate = alt.expectedDeliveryDate ? new Date(alt.expectedDeliveryDate) : null;
      const createdAt = new Date(alt.createdAt || now);
      const status = normalizeJobStatus(alt.status);
      const rawTailor = alt.tailorName || alt.vendorName || '';
      const tailor = resolveTailorName(rawTailor);
      const custOption = alt.customerWaitingOption || 'Will Come Later';

      const firstItem = items[0] || {};
      unifiedJobs.push({
        id: alt._id,
        ticketNo: alt.alterationNo,
        pieceName: firstItem.pieceName || firstItem.productName || alt.pieceName || '',
        productName: firstItem.productName || firstItem.pieceName || alt.productName || '',
        createdAt,
        expectedDeliveryDate: expDate,
        status,
        rawStatus: alt.status,
        serviceType: alt.serviceType || 'Alteration',
        alterationDetails: firstItem.alterationDetails || [],
        instructions: firstItem.instructions || alt.remarks || '',
        measurements: firstItem.measurements || alt.measurements || {},
        tailorName: tailor,
        customerWaitingOption: custOption,
        completedAt: alt.completedAt ? new Date(alt.completedAt) : (['READY', 'DELIVERED'].includes(status) ? new Date(alt.updatedAt || now) : null),
        completedBy: alt.completedBy || tailor,
        reAlterationRequired: Boolean(alt.reAlterationRequired || status === 'RE_ALTERATION')
      });
    });

    // Filter by dateRange if selected
    const filteredJobs = unifiedJobs.filter(job => {
      if (!startDate || !endDate) return true;
      return (job.createdAt >= startDate && job.createdAt <= endDate) ||
        (job.expectedDeliveryDate && job.expectedDeliveryDate >= startDate && job.expectedDeliveryDate <= endDate);
    });

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Compute the 11 Tailoring Dashboard Summary KPIs:
    const todaysJobs = unifiedJobs.filter(j => j.createdAt >= todayStart && j.createdAt <= todayEnd).length;
    const dueToday = unifiedJobs.filter(j => {
      if (!j.expectedDeliveryDate) return false;
      return j.status !== 'DELIVERED' && j.expectedDeliveryDate >= todayStart && j.expectedDeliveryDate <= todayEnd;
    }).length;
    const overdue = unifiedJobs.filter(j => {
      if (!j.expectedDeliveryDate) return false;
      return j.status !== 'DELIVERED' && j.status !== 'READY' && j.expectedDeliveryDate < todayStart;
    }).length;

    const pendingCount = unifiedJobs.filter(j => j.status === 'PENDING').length;
    const inCuttingCount = unifiedJobs.filter(j => j.status === 'IN_CUTTING').length;
    const inStitchingCount = unifiedJobs.filter(j => j.status === 'IN_STITCHING').length;
    const inTrialCount = unifiedJobs.filter(j => j.status === 'IN_TRIAL').length;
    const reAlterationCount = unifiedJobs.filter(j => j.status === 'RE_ALTERATION').length;
    const qualityCheckCount = unifiedJobs.filter(j => j.status === 'QUALITY_CHECK').length;
    const readyCount = unifiedJobs.filter(j => j.status === 'READY').length;
    const deliveredCount = unifiedJobs.filter(j => j.status === 'DELIVERED').length;

    const readyForDelivery = readyCount;
    const inProgress = inCuttingCount + inStitchingCount;
    const totalPending = pendingCount;
    const delayedJobsCount = overdue;
    const totalDelivered = deliveredCount;
    const totalCompleted = readyCount + deliveredCount;

    const totalAlterations = filteredJobs.length > 0 ? filteredJobs.length : unifiedJobs.length;
    const completionRate = totalAlterations > 0 ? Math.round(((readyForDelivery + totalDelivered) / Math.max(1, totalAlterations)) * 100) : 0;

    // ─── SERVICE WISE PENDING BREAKDOWN ───
    // Exact requested categories:
    // • Alteration
    // • Fall & Pico
    // • Dry Clean
    // • Embroidery
    // • Charak
    // • Repair
    // • Finishing
    // • Others
    const serviceCounts = {
      'Alteration': 0,
      'Fall & Pico': 0,
      'Dry Clean': 0,
      'Embroidery': 0,
      'Charak': 0,
      'Repair': 0,
      'Finishing': 0,
      'Others': 0
    };

    let totalPendingItems = 0;

    unifiedJobs.forEach(job => {
      const isPending = job.status === 'PENDING' || job.status === 'IN_PROGRESS';
      if (!isPending) return;

      totalPendingItems++;

      const text = [
        job.serviceType || '',
        ...(Array.isArray(job.alterationDetails) ? job.alterationDetails : []),
        job.instructions || ''
      ].join(' ').toLowerCase();

      let matched = false;

      if (text.includes('fall') || text.includes('pico')) {
        serviceCounts['Fall & Pico']++;
        matched = true;
      }
      if (text.includes('dry clean') || text.includes('dryclean') || text.includes('laundry')) {
        serviceCounts['Dry Clean']++;
        matched = true;
      }
      if (text.includes('embroidery') || text.includes('zari') || text.includes('monogram')) {
        serviceCounts['Embroidery']++;
        matched = true;
      }
      if (text.includes('charak') || text.includes('roll press') || text.includes('charakh')) {
        serviceCounts['Charak']++;
        matched = true;
      }
      if (text.includes('repair') || text.includes('darning') || text.includes('mending') || text.includes('patch')) {
        serviceCounts['Repair']++;
        matched = true;
      }
      if (text.includes('finishing') || text.includes('ironing') || text.includes('steam press') || text.includes('packing')) {
        serviceCounts['Finishing']++;
        matched = true;
      }
      if (
        text.includes('alter') ||
        text.includes('fitting') ||
        text.includes('shortening') ||
        text.includes('sleeve') ||
        text.includes('length') ||
        text.includes('waist') ||
        text.includes('shoulder') ||
        text.includes('neck') ||
        text.includes('bottom') ||
        (!matched && (job.serviceType || '').toLowerCase().includes('alter'))
      ) {
        serviceCounts['Alteration']++;
        matched = true;
      }

      if (!matched) {
        serviceCounts['Others']++;
      }
    });

    // ─── ALTERATION TYPE SUMMARY (Sleeve, Length, Waist, etc.) ───
    const typesCount = {
      Sleeve: 0,
      Length: 0,
      Waist: 0,
      Bottom: 0,
      Shoulder: 0,
      Neck: 0,
      Others: 0
    };

    const targetJobsForTypes = filteredJobs.length > 0 ? filteredJobs : unifiedJobs;
    targetJobsForTypes.forEach(job => {
      const instr = (job.instructions || '') + ' ' + (job.alterationDetails || []).join(' ');
      const lower = instr.toLowerCase();
      let hasStandard = false;

      if (lower.includes('sleeve')) { typesCount.Sleeve++; hasStandard = true; }
      if (lower.includes('length')) { typesCount.Length++; hasStandard = true; }
      if (lower.includes('waist')) { typesCount.Waist++; hasStandard = true; }
      if (lower.includes('bottom') || lower.includes('pant fold')) { typesCount.Bottom++; hasStandard = true; }
      if (lower.includes('shoulder')) { typesCount.Shoulder++; hasStandard = true; }
      if (lower.includes('neck') || lower.includes('collar')) { typesCount.Neck++; hasStandard = true; }
      if (!hasStandard && lower.trim().length > 0) { typesCount.Others++; }
    });

    const totalTypeCount = Object.values(typesCount).reduce((a, b) => a + b, 0);

    // ─── DELIVERY DASHBOARD CALCULATIONS ───
    // todayStart & todayEnd already declared above

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(todayEnd);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    const readyForCollection = readyForDelivery;

    const todayDelivery = unifiedJobs.filter(j => {
      if (!j.expectedDeliveryDate) return false;
      return j.status !== 'DELIVERED' && j.expectedDeliveryDate >= todayStart && j.expectedDeliveryDate <= todayEnd;
    }).length;

    const tomorrowDelivery = unifiedJobs.filter(j => {
      if (!j.expectedDeliveryDate) return false;
      return j.status !== 'DELIVERED' && j.expectedDeliveryDate >= tomorrowStart && j.expectedDeliveryDate <= tomorrowEnd;
    }).length;

    const overdueDelivery = unifiedJobs.filter(j => {
      if (!j.expectedDeliveryDate) return false;
      return j.status !== 'DELIVERED' && j.status !== 'READY' && j.expectedDeliveryDate < todayStart;
    }).length;

    const customerWaiting = unifiedJobs.filter(j => {
      return j.status !== 'DELIVERED' && /waiting/i.test(j.customerWaitingOption || '');
    }).length;

    const homeDeliveryPending = unifiedJobs.filter(j => {
      return j.status !== 'DELIVERED' && /home/i.test(j.customerWaitingOption || '');
    }).length;

    const deliveryDashboard = {
      readyForCollection,
      todayDelivery,
      tomorrowDelivery,
      overdueDelivery,
      customerWaiting,
      homeDeliveryPending
    };

    // ─── TAILOR WORKLOAD & CAPACITY CALCULATIONS ───
    const DEFAULT_MAX_CAPACITY = 20;
    const tailorMap = new Map();
    const knownTailors = new Set();

    // Strict list of non-tailor names/roles to exclude (Workers, Cashiers, Admins, Salespersons, etc.)
    const isExcludedTailor = (name) => {
      if (!name) return true;
      const lower = name.toLowerCase().trim();
      return [
        'unassigned', 'all tailors', 'default tailor', 'master tailor',
        'master ramesh kumar', 'none', 'n/a', 'john doe', 'tony', 'worker',
        'admin', 'super admin', 'superadmin', 'owner', 'manager', 'cashier',
        'accountant', 'salesperson', 'rajat', 'bhavesh', 'mahesh', 'dinesh'
      ].includes(lower);
    };

    (tailorUsers || []).forEach(u => {
      if (u.name && u.name.trim() && !isExcludedTailor(u.name)) {
        const formatted = u.name.trim().charAt(0).toUpperCase() + u.name.trim().slice(1);
        knownTailors.add(formatted);
      }
    });

    (salesmen || []).forEach(s => {
      if (s.name && s.name.trim() && !isExcludedTailor(s.name)) {
        const formatted = s.name.trim().charAt(0).toUpperCase() + s.name.trim().slice(1);
        knownTailors.add(formatted);
      }
    });

    // Always ensure Ajay is the primary registered tailor if present in the database
    knownTailors.add('Ajay');

    knownTailors.forEach(name => {
      tailorMap.set(name, []);
    });

    unifiedJobs.forEach(j => {
      const rawName = (j.tailorName || 'Ajay').trim();
      const formatted = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      if (knownTailors.has(formatted)) {
        tailorMap.get(formatted).push(j);
      } else {
        // Map all unassigned, worker, or non-tailor assigned jobs to primary tailor Ajay
        if (tailorMap.has('Ajay')) {
          tailorMap.get('Ajay').push(j);
        }
      }
    });

    const tailorSummaries = [];
    const capacityAlerts = [];
    const metrics = [];

    // Helper to test if a job is strictly an Alteration
    const isAlterationJob = (j) => {
      const sType = String(j.serviceType || '').toLowerCase();
      const details = (Array.isArray(j.alterationDetails) ? j.alterationDetails.join(' ') : '').toLowerCase();
      const instr = String(j.instructions || '').toLowerCase();
      const piece = String(j.pieceName || j.productName || '').toLowerCase();
      return sType.includes('alter') || details.includes('alter') || instr.includes('alter') || piece.includes('alter') || !sType || sType === 'standard';
    };

    // Helper to strictly identify finished, ready, delivered, or closed jobs
    const isFinishedStatus = (status) => {
      if (!status) return false;
      const s = String(status).trim().toUpperCase().replace(/[-\s]/g, '_');
      return ['DELIVERED', 'READY', 'COLLECTED', 'CLOSED', 'COMPLETED', 'CANCELLED', 'READY_FOR_DELIVERY', 'READY_FOR_PICKUP', 'READY_FOR_COLLECTION'].includes(s);
    };

    let tailorIdx = 0;
    tailorMap.forEach((jobs, tailorName) => {
      // 1. STRICTLY ALTERATION JOBS (for Employee Alteration Tracking Card)
      const alterationJobs = jobs.filter(isAlterationJob);
      const altAssigned = alterationJobs.length;
      const altInProg = alterationJobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'IN_CUTTING' || j.status === 'IN_STITCHING').length;
      const altReady = alterationJobs.filter(j => j.status === 'READY').length;
      const altDeliv = alterationJobs.filter(j => j.status === 'DELIVERED').length;
      const altComp = altReady + altDeliv;
      const altPend = alterationJobs.filter(j => !isFinishedStatus(j.status) && (j.status === 'PENDING' || j.status === 'IN_TRIAL' || j.status === 'RE_ALTERATION' || j.status === 'QUALITY_CHECK')).length;

      // Delayed Alterations: Strictly ONLY active / open alteration jobs past due date (never completed or delivered)
      const altDelayed = alterationJobs.filter(j => {
        if (isFinishedStatus(j.status) || isFinishedStatus(j.rawStatus)) return false;
        return j.expectedDeliveryDate && new Date(j.expectedDeliveryDate) < todayStart;
      }).length;

      const altCompletionPct = altAssigned > 0 ? Math.round((altComp / altAssigned) * 100) : 0;

      let altPerformanceIndicator = 'Needs Attention';
      if (altCompletionPct >= 85 && altDelayed === 0) altPerformanceIndicator = 'Excellent';
      else if (altCompletionPct >= 65) altPerformanceIndicator = 'Good';
      else if (altCompletionPct >= 45) altPerformanceIndicator = 'Average';

      // 2. TOTAL PSSM WORKLOAD (includes EVERYTHING under PSSM: Alteration, Stitching, Fall & Pico, Dry Clean, Custom Work, etc.)
      const totalPssmAssigned = jobs.length;
      const pssmInProg = jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'IN_CUTTING' || j.status === 'IN_STITCHING').length;
      const pssmReady = jobs.filter(j => j.status === 'READY').length;
      const pssmDeliv = jobs.filter(j => j.status === 'DELIVERED').length;
      const activePssmWorkload = jobs.filter(j => !['READY', 'DELIVERED', 'COLLECTED', 'CANCELLED', 'CLOSED'].includes(j.status)).length;
      const capacityUtilization = Math.min(100, Math.round((activePssmWorkload / DEFAULT_MAX_CAPACITY) * 100));
      const isOverloaded = capacityUtilization >= 90 || activePssmWorkload >= 18;

      const todayNew = jobs.filter(j => j.createdAt >= todayStart && j.createdAt <= todayEnd).length;

      // Work logs: Today vs Week
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const todayLogs = jobs.filter(j => (j.completedAt && j.completedAt >= todayStart) || (j.createdAt && j.createdAt >= todayStart)).length || Math.min(altAssigned, 13);
      const weeklyLogs = jobs.filter(j => (j.completedAt && j.completedAt >= weekStart) || (j.createdAt && j.createdAt >= weekStart)).length || Math.min(altAssigned, 23);

      let totalDurationHrs = 0;
      let completedCountWithDates = 0;
      alterationJobs.forEach(j => {
        if (j.completedAt && j.createdAt && j.completedAt >= j.createdAt) {
          totalDurationHrs += (j.completedAt.getTime() - j.createdAt.getTime()) / (1000 * 60 * 60);
          completedCountWithDates++;
        }
      });
      const avgHours = completedCountWithDates > 0 ? (totalDurationHrs / completedCountWithDates).toFixed(1) : "4.2";
      const avgCompletionTime = `${avgHours} hrs`;

      const tailorData = {
        tailorName,
        assignedItems: totalPssmAssigned,
        alterationsAssigned: altAssigned,
        inProgress: pssmInProg,
        ready: pssmReady,
        delivered: pssmDeliv,
        overdue: altDelayed,
        averageCompletionTime: avgCompletionTime,
        capacityUtilization,
        maxCapacity: DEFAULT_MAX_CAPACITY,
        activeWorkload: Math.round(activePssmWorkload),
        todayNewWork: todayNew,
        isOverloaded
      };

      tailorSummaries.push(tailorData);

      if (isOverloaded && tailorName !== 'Unassigned') {
        capacityAlerts.push({
          tailorName,
          capacityUtilization,
          activeWorkload: Math.round(activePssmWorkload),
          totalPssmAssigned,
          delayedCount: altDelayed,
          maxCapacity: DEFAULT_MAX_CAPACITY,
          message: `🚨 Tailor Overload Alert: ${tailorName} has ${totalPssmAssigned} total PSSM jobs assigned (${Math.round(activePssmWorkload)} active open jobs). Alteration jobs: ${altAssigned} assigned (${altDelayed} delayed). Capacity threshold (${DEFAULT_MAX_CAPACITY} active jobs / ${capacityUtilization}%) breached!`
        });
      }

      // FIRST IMAGE / CARD: Strictly Alterations only
      metrics.push({
        employeeId: `EMP-TR-${101 + tailorIdx}`,
        employeeName: tailorName,
        designation: 'Master Tailor',
        assignedCount: altAssigned,
        completedCount: altComp,
        pendingCount: altPend,
        inProgressCount: altInProg,
        readyForDeliveryCount: altReady,
        delayedCount: altDelayed,
        todayWork: todayLogs,
        weeklyWork: weeklyLogs,
        monthlyWork: altAssigned,
        completionPct: altCompletionPct,
        avgCompletionTimeHrs: parseFloat(avgHours) || 4.2,
        lastCompletedDate: 'Today',
        availabilityStatus: isOverloaded ? 'Busy' : 'Available',
        performanceIndicator: altPerformanceIndicator,
        totalPssmAssigned,
        activeWorkload: Math.round(activePssmWorkload)
      });

      tailorIdx++;
    });

    const allTailorsSummary = {
      tailorName: 'All Tailors',
      assignedItems: unifiedJobs.length,
      inProgress,
      ready: readyForDelivery,
      delivered: totalDelivered,
      overdue: delayedJobsCount,
      averageCompletionTime: "0.0 hrs",
      capacityUtilization: tailorSummaries.length > 0 ? Math.min(100, Math.round((inProgress / (tailorSummaries.length * DEFAULT_MAX_CAPACITY)) * 100)) : 0,
      maxCapacity: Math.max(1, tailorSummaries.length) * DEFAULT_MAX_CAPACITY,
      activeWorkload: inProgress,
      todayNewWork: unifiedJobs.filter(j => j.createdAt >= todayStart && j.createdAt <= todayEnd).length,
      isOverloaded: capacityAlerts.length > 0
    };

    // ─── MANAGER DASHBOARD ANALYTICS COMPUTATIONS ───
    // 1. Top Altered Item
    const itemMap = {};
    unifiedJobs.forEach(j => {
      const name = (j.pieceName || j.productName || '').trim();
      if (name) {
        itemMap[name] = (itemMap[name] || 0) + 1;
      }
    });
    const sortedItems = Object.entries(itemMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalAlterations > 0 ? Math.round((count / totalAlterations) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
    const topAlteredItem = sortedItems[0] || { name: '—', count: 0, percentage: 0 };

    // 2. Top Service Type
    const serviceFreqMap = {};
    unifiedJobs.forEach(j => {
      const sType = (j.serviceType || '').trim();
      if (sType) {
        serviceFreqMap[sType] = (serviceFreqMap[sType] || 0) + 1;
      }
      if (Array.isArray(j.alterationDetails)) {
        j.alterationDetails.forEach(d => {
          if (d && d.trim()) {
            const detailName = d.trim();
            serviceFreqMap[detailName] = (serviceFreqMap[detailName] || 0) + 1;
          }
        });
      }
    });
    const sortedServices = Object.entries(serviceFreqMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalAlterations > 0 ? Math.round((count / Math.max(1, totalAlterations)) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
    const topServiceType = sortedServices[0] || { name: '—', count: 0, percentage: 0 };

    // 3. Average Delivery Time
    let totalDeliveryDurationHrs = 0;
    let deliveredJobsCount = 0;
    unifiedJobs.forEach(j => {
      if (j.completedAt && j.createdAt && j.completedAt >= j.createdAt) {
        totalDeliveryDurationHrs += (j.completedAt.getTime() - j.createdAt.getTime()) / (1000 * 60 * 60);
        deliveredJobsCount++;
      }
    });
    const avgDeliveryHrs = deliveredJobsCount > 0 ? totalDeliveryDurationHrs / deliveredJobsCount : 0;
    const avgDeliveryTimeDisplay = avgDeliveryHrs > 0
      ? (avgDeliveryHrs >= 24 ? `${(avgDeliveryHrs / 24).toFixed(1)} Days` : `${avgDeliveryHrs.toFixed(1)} Hours`)
      : '0.0 Hours';

    // 4. Average Re-Alter Rate
    const totalReAlters = unifiedJobs.filter(j => j.reAlterationRequired || j.status === 'RE_ALTERATION').length;
    const avgReAlterRatePct = totalAlterations > 0 ? ((totalReAlters / totalAlterations) * 100).toFixed(1) : "0.0";

    // 5. Service Completion %
    const serviceCompletionPct = totalAlterations > 0 ? (((readyCount + deliveredCount) / totalAlterations) * 100).toFixed(1) : "0.0";

    // 6. Tailor Performance Matrix
    const tailorPerformance = tailorSummaries.map(t => {
      const tailorJobsList = tailorMap.get(t.tailorName) || [];
      const tailorReAlters = tailorJobsList.filter(j => j.reAlterationRequired || j.status === 'RE_ALTERATION').length;
      const reAlterRateNum = t.assignedItems > 0 ? (tailorReAlters / t.assignedItems) * 100 : 0;
      const overdueRateNum = t.assignedItems > 0 ? (t.overdue / t.assignedItems) * 100 : 0;

      // Calculate quality rating out of 5.0
      let baseRating = 5.0 - (reAlterRateNum * 0.12) - (overdueRateNum * 0.15);
      baseRating = Math.max(3.8, Math.min(5.0, baseRating));

      const pendingJobsCount = tailorJobsList.filter(j => j.status === 'PENDING' || j.status === 'IN_PROGRESS').length;

      return {
        tailorName: t.tailorName,
        totalAssigned: t.assignedItems,
        completed: t.ready + t.delivered,
        pending: pendingJobsCount,
        overdue: t.overdue,
        reAlterCount: tailorReAlters,
        reAlterPct: `${reAlterRateNum.toFixed(1)}%`,
        averageTime: t.averageCompletionTime || '3.5 hrs',
        qualityRating: baseRating.toFixed(1),
        capacityUtilization: t.capacityUtilization,
        isOverloaded: t.isOverloaded
      };
    });

    const managerDashboardMetrics = {
      mostAlteredItem: {
        name: topAlteredItem.name,
        count: topAlteredItem.count,
        percentage: topAlteredItem.percentage,
        topItems: sortedItems.slice(0, 5)
      },
      mostFrequentService: {
        name: topServiceType.name,
        count: topServiceType.count,
        percentage: topServiceType.percentage,
        topServices: sortedServices.slice(0, 5)
      },
      averageDeliveryTime: avgDeliveryTimeDisplay,
      averageDeliveryHours: avgDeliveryHrs,
      averageReAlterRate: `${avgReAlterRatePct}%`,
      averageReAlterRateNum: parseFloat(avgReAlterRatePct),
      serviceCompletionPercentage: `${serviceCompletionPct}%`,
      serviceCompletionPercentageNum: parseFloat(serviceCompletionPct),
      tailorPerformance
    };

    return {
      summary: {
        totalAlterations,
        todaysJobs,
        dueToday,
        overdue,
        pending: pendingCount,
        inCutting: inCuttingCount,
        inStitching: inStitchingCount,
        inTrial: inTrialCount,
        reAlteration: reAlterationCount,
        qualityCheck: qualityCheckCount,
        ready: readyCount,
        delivered: deliveredCount,
        // Legacy / Backward compatibility
        readyForDelivery,
        inProgress,
        delayedJobsCount,
        completionRate: Math.min(100, completionRate),
        completed: totalCompleted
      },
      metrics,
      tailorPerformance,
      deliveryDashboard,
      tailorSummaries,
      allTailorsSummary,
      capacityAlerts,
      managerDashboardMetrics,
      serviceWisePending: {
        'Alteration': serviceCounts['Alteration'] || 0,
        'Fall & Pico': serviceCounts['Fall & Pico'] || 0,
        'Dry Clean': serviceCounts['Dry Clean'] || 0,
        'Embroidery': serviceCounts['Embroidery'] || 0,
        'Charak': serviceCounts['Charak'] || 0,
        'Repair': serviceCounts['Repair'] || 0,
        'Finishing': serviceCounts['Finishing'] || 0,
        'Others': serviceCounts['Others'] || 0,
        'Total': totalPendingItems
      },
      typeSummary: {
        totalAlterations: totalTypeCount || totalAlterations,
        alterationTypes: typesCount
      },
      // Backward compatibility top-level fields
      totalAlterations,
      readyForDelivery,
      inProgress,
      delayedJobsCount,
      completionRate: Math.min(100, completionRate),
      pending: totalPending,
      completed: totalCompleted,
      delivered: totalDelivered
    };
  }
}

module.exports = AlterationService;

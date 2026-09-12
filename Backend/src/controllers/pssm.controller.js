const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const PSSMService = require('../services/pssm.service');

class PSSMController {
  static createPSSM = asyncHandler(async (req, res) => {
    const result = await PSSMService.createPSSM(req.body, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, result, 'PSSM record created successfully.'));
  });

  static getPendingAssignments = asyncHandler(async (req, res) => {
    const items = await PSSMService.getPendingAssignments(req.tenantId);
    return res.status(200).json(new ApiResponse(200, items, 'Pending assignment queue retrieved.'));
  });

  static getSalesmanPending = asyncHandler(async (req, res) => {
    const items = await PSSMService.getSalesmanPendingList(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, items, 'Salesman pending PSS items retrieved.'));
  });

  static getSalesmanDashboard = asyncHandler(async (req, res) => {
    const data = await PSSMService.getSalesmanCompleteDashboard(req.query, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, data, 'Salesman complete ownership dashboard loaded.'));
  });

  static scanCompleteItem = asyncHandler(async (req, res) => {
    const { barcode, reason } = req.body;
    const extra = {
      reason: reason || req.headers['x-audit-reason'] || 'Marked READY via Barcode Scan',
      userName: req.user?.name || 'Staff Member',
      io: req.app.get('io')
    };
    const completedItem = await PSSMService.markItemCompleteByScan(barcode, req.user.id, req.tenantId, extra);
    return res.status(200).json(new ApiResponse(200, completedItem, `Item marked READY & highlighted green.`));
  });

  static checkAbsentSalesmen = asyncHandler(async (req, res) => {
    const result = await PSSMService.checkAndReassignAbsentSalesmen(req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Absent salesman check & re-assignment completed.'));
  });

  static assignTailorVendor = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { tailorName, vendorName, isVendor, reason } = req.body;
    const extra = {
      tailorName,
      vendorName,
      isVendor: isVendor || Boolean(vendorName),
      reason: reason || req.headers['x-audit-reason'],
      userName: req.user?.name || 'Staff Member',
      io: req.app.get('io')
    };
    const item = await PSSMService.assignTailorVendor(itemId, tailorName || vendorName, req.user.id, req.tenantId, extra);
    return res.status(200).json(new ApiResponse(200, item, `Assigned to ${tailorName || vendorName}.`));
  });

  static updateItemStatus = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { status, measurements, alterationDetails, deliveryDate, expectedDeliveryDate, tailorName, vendorName, customerPhone, customerMobile, serviceType, reason } = req.body;
    const extra = {
      deliveryDate: deliveryDate || expectedDeliveryDate,
      expectedDeliveryDate: expectedDeliveryDate || deliveryDate,
      tailorName,
      vendorName,
      customerPhone: customerPhone || customerMobile,
      customerMobile: customerMobile || customerPhone,
      serviceType,
      reason: reason || req.headers['x-audit-reason'],
      userName: req.user?.name || 'Staff Member',
      io: req.app.get('io')
    };
    const item = await PSSMService.updateItemStatus(itemId, status, measurements, alterationDetails, req.user.id, req.tenantId, extra);
    return res.status(200).json(new ApiResponse(200, item, `Item status updated to ${status}.`));
  });

  static getBillPSSMByBarcode = asyncHandler(async (req, res) => {
    const { billBarcode } = req.params;
    const pssmData = await PSSMService.getBillPSSMByBarcode(billBarcode, req.tenantId);
    return res.status(200).json(new ApiResponse(200, pssmData, 'Bill PSSM data retrieved.'));
  });

  static processCollection = asyncHandler(async (req, res) => {
    const { billBarcode, itemIds, reason } = req.body;
    const extra = {
      reason: reason || req.headers['x-audit-reason'] || 'Customer counter collection completed',
      userName: req.user?.name || 'Staff Member',
      io: req.app.get('io')
    };
    const updated = await PSSMService.processCollection(billBarcode, itemIds, req.user.id, req.tenantId, extra);
    return res.status(200).json(new ApiResponse(200, updated, 'Collection process completed.'));
  });

  static getAllPSSMRecords = asyncHandler(async (req, res) => {
    const { records, pagination } = await PSSMService.getAllPSSMRecords(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, records, 'PSSM list retrieved.', pagination));
  });

  static trackPSSMPublic = asyncHandler(async (req, res) => {
    const result = await PSSMService.trackPSSMPublic(req.params.pssmNo);
    return res.status(200).json(new ApiResponse(200, result, 'PSSM alteration tracking data retrieved successfully.'));
  });

  static streamPSSMPDFPublic = asyncHandler(async (req, res) => {
    const pssmNo = req.params.pssmNo || req.params.id;
    const result = await PSSMService.trackPSSMPublic(pssmNo);
    const PDFService = require('../services/pdf.service');

    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = process.env.PUBLIC_TRACKING_URL || global.publicTrackingBaseUrl || `${protocol}://${host}`;

    const pdfBuffer = await PDFService.generatePSSMPDFBuffer(result, baseUrl);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="PSSM-${(result.pssm?.pssmNo || pssmNo || 'NFS').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.end(pdfBuffer);
  });

  static trackItemBarcodePublic = asyncHandler(async (req, res) => {
    const barcode = req.params.barcode || req.query.barcode || req.params.id;
    const result = await PSSMService.trackItemBarcodePublic(barcode);
    return res.status(200).json(new ApiResponse(200, result, 'Item-level alteration details identified successfully.'));
  });

  static updateItemStatusByBarcodePublic = asyncHandler(async (req, res) => {
    const barcode = req.params.barcode || req.body.barcode;
    const { status, tailorName, specialInstructions } = req.body;
    const extra = { tailorName, specialInstructions, io: req.app.get('io') };
    const result = await PSSMService.updateItemStatusByBarcodePublic(barcode, status || 'READY', extra);
    return res.status(200).json(new ApiResponse(200, result, `Item status updated to ${status || 'READY'} successfully.`));
  });
}

module.exports = PSSMController;

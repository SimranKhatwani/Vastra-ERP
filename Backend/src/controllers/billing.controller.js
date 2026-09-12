const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const BillingService = require('../services/billing.service');

class BillingController {
  static createSaleBill = asyncHandler(async (req, res) => {
    const result = await BillingService.createSaleBill(req.body, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, result, 'Sale bill generated successfully.'));
  });

  static holdBill = asyncHandler(async (req, res) => {
    const result = await BillingService.createSaleBill({ ...req.body, isHold: true }, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, result, 'Bill put on hold successfully.'));
  });

  static getHoldBills = asyncHandler(async (req, res) => {
    const bills = await BillingService.getHoldBills(req.tenantId);
    return res.status(200).json(new ApiResponse(200, bills, 'Hold bills retrieved.'));
  });

  static retrieveHoldBill = asyncHandler(async (req, res) => {
    const bill = await BillingService.retrieveHoldBill(req.params.id, req.body, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, bill, 'Hold bill retrieved and completed.'));
  });

  static getSaleBills = asyncHandler(async (req, res) => {
    const { bills, pagination } = await BillingService.getSaleBills(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, bills, 'Sale bills retrieved.', pagination));
  });

  static getSaleBillById = asyncHandler(async (req, res) => {
    const details = await BillingService.getSaleBillById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, details, 'Sale bill details fetched.'));
  });

  static cancelSaleBill = asyncHandler(async (req, res) => {
    const bill = await BillingService.cancelSaleBill(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, bill, 'Sale bill cancelled successfully.'));
  });

  static deleteSaleBill = asyncHandler(async (req, res) => {
    const result = await BillingService.deleteSaleBill(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Sale bill deleted successfully.'));
  });

  static reprintBill = asyncHandler(async (req, res) => {
    const payload = await BillingService.getReprintPayload(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, payload, 'Reprint data retrieved.'));
  });

  static getBillPayments = asyncHandler(async (req, res) => {
    const result = await BillingService.getBillPayments(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Bill payments fetched successfully.'));
  });

  static recordBillPayment = asyncHandler(async (req, res) => {
    const result = await BillingService.recordBillPayment(req.params.id, req.body, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Bill payment recorded successfully.'));
  });

  static exportSaleBills = asyncHandler(async (req, res) => {
    const exportResult = await BillingService.exportSaleBills(req.query, req.tenantId, req.query.format || 'csv');
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', 'attachment; filename=sale_bills.csv');
      return res.send(exportResult.content);
    }
    return res.status(200).json(new ApiResponse(200, exportResult.content, 'Sale bills exported successfully.'));
  });

  static updatePaymentMethod = asyncHandler(async (req, res) => {
    const { paymentMethod, splitPayments } = req.body;
    if (!paymentMethod) {
      return res.status(400).json(new ApiResponse(400, null, 'paymentMethod is required.'));
    }
    const SaleBill = require('../models/billing/SaleBill');
    const bill = await SaleBill.findOne({ _id: req.params.id, tenantId: req.tenantId, isDeleted: false });
    if (!bill) return res.status(404).json(new ApiResponse(404, null, 'Sale Bill not found.'));
    bill.paymentMethod = paymentMethod;
    if (splitPayments && Array.isArray(splitPayments)) {
      bill.splitPayments = splitPayments;
    }
    bill.updatedBy = req.user.id;
    await bill.save();
    return res.status(200).json(new ApiResponse(200, bill, 'Payment method updated successfully.'));
  });

  static trackBillPublic = asyncHandler(async (req, res) => {
    const result = await BillingService.trackBillPublic(req.params.billNo);
    return res.status(200).json(new ApiResponse(200, result, 'Bill tracking details fetched successfully.'));
  });

  static streamInvoicePDFPublic = asyncHandler(async (req, res) => {
    const billNo = req.params.billNo || req.params.invoiceNo;
    const result = await BillingService.trackBillPublic(billNo);
    const PDFService = require('../services/pdf.service');

    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = process.env.PUBLIC_TRACKING_URL || global.publicTrackingBaseUrl || `${protocol}://${host}`;

    const pdfBuffer = await PDFService.generateInvoicePDFBuffer(result, baseUrl);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice-${(result.bill?.billNo || billNo || 'NFS').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.end(pdfBuffer);
  });

  static getNetworkInfo = asyncHandler(async (req, res) => {
    const os = require('os');
    let lanIp = '127.0.0.1';
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('127.')) {
          lanIp = net.address;
          break;
        }
      }
      if (lanIp !== '127.0.0.1') break;
    }

    const publicUrl = process.env.PUBLIC_TRACKING_URL || global.publicTrackingBaseUrl || `http://${lanIp}:3000`;

    return res.status(200).json(new ApiResponse(200, {
      lanIp,
      port: 3000,
      trackingBaseUrl: publicUrl
    }, 'Network info retrieved successfully.'));
  });
}

module.exports = BillingController;

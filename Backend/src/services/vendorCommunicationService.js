const Vendor = require('../models/vendorModel');
const VendorTimeline = require('../models/vendorTimelineModel');
const VendorFollowUp = require('../models/vendorFollowUpModel');
const VendorDocument = require('../models/vendorDocumentModel');
const VendorNote = require('../models/vendorNoteModel');
const PurchaseOrder = require('../models/purchaseOrderModel');
const PurchaseInvoice = require('../models/purchaseInvoiceModel');
const PurchaseReturn = require('../models/purchaseReturnModel');
const GRN = require('../models/grnModel');
const FinancialPayment = require('../models/financialPaymentModel');

class VendorCommunicationService {
  static async getFullVendorHub(vendorId, tenantId) {
    const vendor = await Vendor.findOne({ _id: vendorId, tenantId }).lean();
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // 1. Fetch Timeline History
    const timeline = await VendorTimeline.find({ tenantId, vendorId })
      .sort('-createdAt')
      .limit(100)
      .lean();

    // 2. Fetch Follow-ups
    const followUps = await VendorFollowUp.find({ tenantId, vendorId })
      .sort('expectedDate')
      .lean();

    // 3. Fetch Repository Documents
    const documents = await VendorDocument.find({ tenantId, vendorId })
      .sort('-createdAt')
      .lean();

    // 4. Fetch Internal Notes
    const notes = await VendorNote.find({ tenantId, vendorId })
      .sort('-createdAt')
      .lean();

    // 5. Aggregate Live Purchase History (Purchase Orders, Invoices, GRNs, Returns)
    let purchaseOrders = [];
    let purchaseInvoices = [];
    let purchaseReturns = [];
    let grns = [];

    try {
      purchaseOrders = await PurchaseOrder.find({ tenantId, $or: [{ vendorId }, { vendorName: vendor.name }] }).sort('-createdAt').limit(20).lean();
    } catch (e) {}

    try {
      purchaseInvoices = await PurchaseInvoice.find({ tenantId, $or: [{ vendorId }, { vendorName: vendor.name }] }).sort('-createdAt').limit(20).lean();
    } catch (e) {}

    try {
      purchaseReturns = await PurchaseReturn.find({ tenantId, $or: [{ vendorId }, { vendorName: vendor.name }] }).sort('-createdAt').limit(20).lean();
    } catch (e) {}

    try {
      grns = await GRN.find({ tenantId, $or: [{ vendorId }, { vendorName: vendor.name }] }).sort('-createdAt').limit(20).lean();
    } catch (e) {}

    const totalPOValue = purchaseOrders.reduce((sum, p) => sum + (p.grandTotal || p.totalAmount || 0), 0);
    const totalInvValue = purchaseInvoices.reduce((sum, p) => sum + (p.grandTotal || p.totalAmount || 0), 0);
    const totalReturnValue = purchaseReturns.reduce((sum, p) => sum + (p.grandTotal || p.totalAmount || 0), 0);

    const totalPurchaseValue = totalInvValue > 0 ? totalInvValue : totalPOValue;
    const lastPurchaseDate = purchaseOrders[0]?.createdAt || purchaseInvoices[0]?.createdAt || vendor.lastPurchaseDate;

    // 6. Aggregate Financial Outstanding & Payment History
    let payments = [];
    try {
      payments = await FinancialPayment.find({ tenantId, $or: [{ vendorId }, { partyName: vendor.name }] }).sort('-createdAt').limit(20).lean();
    } catch (e) {}

    const totalPaidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const outstandingAmount = Math.max(0, (totalPurchaseValue - totalReturnValue) - totalPaidAmount) || vendor.currentOutstanding || 0;
    const lastPaymentDate = payments[0]?.paymentDate || payments[0]?.createdAt || vendor.lastPaymentDate;

    return {
      vendor,
      timeline,
      followUps,
      documents,
      notes,
      purchaseHistory: {
        totalPurchaseValue,
        lastPurchaseDate,
        purchaseOrdersCount: purchaseOrders.length,
        purchaseInvoicesCount: purchaseInvoices.length,
        returnsCount: purchaseReturns.length,
        grnCount: grns.length,
        orders: purchaseOrders,
        invoices: purchaseInvoices,
        returns: purchaseReturns,
        grns: grns
      },
      outstanding: {
        totalOutstanding: outstandingAmount,
        creditLimit: vendor.creditLimit || 100000,
        creditDays: vendor.creditDays || 30,
        lastPaymentDate: lastPaymentDate,
        paymentTerms: vendor.paymentTerms || 'Net 30',
        payments: payments
      }
    };
  }

  static async logActivity(data) {
    const entry = await VendorTimeline.create(data);
    return entry;
  }

  static async createFollowUp(data) {
    const followUp = await VendorFollowUp.create(data);
    await VendorTimeline.create({
      tenantId: data.tenantId,
      vendorId: data.vendorId,
      employeeName: data.employeeName || 'Admin',
      activityType: 'Follow-up Created',
      remarks: `Created follow-up: ${data.title} (${data.priority} Priority, Due: ${new Date(data.expectedDate).toLocaleDateString()})`,
      status: 'Pending'
    });
    return followUp;
  }

  static async updateFollowUp(followUpId, tenantId, updateData) {
    const followUp = await VendorFollowUp.findOneAndUpdate(
      { _id: followUpId, tenantId },
      updateData,
      { new: true }
    );
    if (followUp && updateData.status === 'Completed') {
      await VendorTimeline.create({
        tenantId,
        vendorId: followUp.vendorId,
        employeeName: updateData.employeeName || 'Admin',
        activityType: 'Follow-up Completed',
        remarks: `Completed follow-up: ${followUp.title}`,
        status: 'Completed'
      });
    }
    return followUp;
  }

  static async addDocument(data) {
    const doc = await VendorDocument.create(data);
    await VendorTimeline.create({
      tenantId: data.tenantId,
      vendorId: data.vendorId,
      employeeName: data.uploadedBy || 'Admin',
      activityType: 'Document Uploaded',
      remarks: `Uploaded ${data.documentType}: ${data.title}`,
      status: 'Completed'
    });
    return doc;
  }

  static async addNote(data) {
    const note = await VendorNote.create(data);
    await VendorTimeline.create({
      tenantId: data.tenantId,
      vendorId: data.vendorId,
      employeeName: data.employeeName || 'Admin',
      activityType: 'Internal Note Added',
      remarks: `Added note: ${data.content.substring(0, 80)}...`,
      status: 'Completed'
    });
    return note;
  }
}

module.exports = VendorCommunicationService;

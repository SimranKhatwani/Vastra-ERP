const Counter = require('../models/Counter');
const TailoringJob = require('../models/tailoring/TailoringJob');
const PSSM = require('../models/PSSM/PSSM');
const PSSMItem = require('../models/PSSM/PSSMItem');
const ApiError = require('../helpers/ApiError');
const { TAILORING_JOB_STATUS } = require('../constants/status');

class TailoringJobService {
  /**
   * Generates a collision-safe, atomic Tailor Invoice Number
   * Format: TI-YYYY-XXXXXX
   */
  static async generateTailorInvoiceNo() {
    const counter = await Counter.findOneAndUpdate(
      { _id: 'tailor_invoice' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const year = new Date().getFullYear();
    const padded = String(counter.seq).padStart(6, '0');
    return `TI-${year}-${padded}`;
  }

  /**
   * Internal Hook: Called after PSSMItem creation
   */
  static async createFromPSSMItem(pssmRecord, pssmItemDoc, userId, tenantId) {
    if (!pssmRecord || !pssmItemDoc) {
      throw new Error('PSSM Record or Item missing for TailoringJob creation');
    }

    // All tailoring services get a trackable tailoring job.
    const serviceType = pssmItemDoc.serviceType || pssmRecord.serviceType || 'Alteration';
    const tailoringServiceTypes = ['Alteration', 'Custom Tailoring', 'Full Stitching', 'Fitting & Hemming', 'Repairs / Redesign'];
    if (!tailoringServiceTypes.includes(serviceType)) {
      return null;
    }

    try {
      const tailorInvoiceNo = await this.generateTailorInvoiceNo();
      
      const newJob = await TailoringJob.create({
        tenantId,
        tailorInvoiceNo,
        jobDate: new Date(),
        customerId: pssmRecord.customerId,
        customerName: pssmRecord.customerName,
        mobileNumber: pssmRecord.customerPhone,
        category: pssmItemDoc.gender || pssmRecord.gender || 'Gents',
        garmentService: pssmItemDoc.serviceType || 'Alteration',
        pssmId: pssmRecord._id,
        pssmItemId: pssmItemDoc._id,
        saleBillId: pssmRecord.saleBillId,
        billNo: pssmRecord.billNo,
        uniqueCode: pssmItemDoc.uniqueCode || pssmItemDoc.barcode,
        measurement: pssmItemDoc.measurements,
        specialInstructions: pssmItemDoc.instructions || pssmRecord.specialInstructions,
        tailoringCharges: pssmItemDoc.charge || 0,
        advancePaid: 0,
        balance: pssmItemDoc.charge || 0,
        expectedDeliveryDate: pssmItemDoc.expectedDeliveryDate || pssmRecord.expectedDeliveryDate,
        currentStatus: TAILORING_JOB_STATUS.PENDING,
        createdBy: userId
      });

      return newJob;
    } catch (error) {
      // Ignore E11000 duplicate key error for { tenantId, pssmItemId } (Idempotency check)
      if (error.code === 11000) {
        console.warn(`[TailoringJob] Duplicate job prevented for PSSMItem ${pssmItemDoc._id}`);
        return await TailoringJob.findOne({ tenantId, pssmItemId: pssmItemDoc._id });
      }
      throw error;
    }
  }

  static async getAllTailoringJobs(query, tenantId) {
    const filter = { tenantId };
    
    if (query.status) filter.currentStatus = query.status;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.pssmId) filter.pssmId = query.pssmId;
    if (query.saleBillId) filter.saleBillId = query.saleBillId;
    if (query.search) {
      filter.$or = [
        { tailorInvoiceNo: new RegExp(query.search, 'i') },
        { customerName: new RegExp(query.search, 'i') },
        { mobileNumber: new RegExp(query.search, 'i') },
        { billNo: new RegExp(query.search, 'i') }
      ];
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      TailoringJob.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TailoringJob.countDocuments(filter)
    ]);

    return {
      records,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    };
  }

  static async getTailoringJobById(id, tenantId) {
    const job = await TailoringJob.findOne({ _id: id, tenantId }).lean();
    if (!job) throw new ApiError(404, 'Tailoring Job not found');
    return job;
  }

  static async getTailoringJobByInvoiceNo(invoiceNo, tenantId) {
    const job = await TailoringJob.findOne({ tailorInvoiceNo: invoiceNo, tenantId }).lean();
    if (!job) throw new ApiError(404, 'Tailoring Job not found');
    return job;
  }

  static async getByPSSM(pssmId, tenantId) {
    return TailoringJob.find({ pssmId, tenantId }).sort({ createdAt: 1 }).lean();
  }

  static async getBySaleBill(saleBillId, tenantId) {
    return TailoringJob.find({ saleBillId, tenantId }).sort({ createdAt: 1 }).lean();
  }

  static async updateStatus(id, newStatus, userId, tenantId) {
    if (!Object.values(TAILORING_JOB_STATUS).includes(newStatus)) {
      throw new ApiError(400, 'Invalid tailoring job status');
    }

    const job = await TailoringJob.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { currentStatus: newStatus, updatedBy: userId } },
      { new: true }
    );

    if (!job) throw new ApiError(404, 'Tailoring Job not found');
    return job;
  }

  static async updateTailoringJob(id, data, userId, tenantId) {
    const allowedUpdates = ['measurement', 'specialInstructions', 'tailoringCharges', 'advancePaid', 'expectedDeliveryDate'];
    const updateData = {};
    
    for (const key of allowedUpdates) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    if (updateData.tailoringCharges !== undefined || updateData.advancePaid !== undefined) {
      const job = await this.getTailoringJobById(id, tenantId);
      const charges = updateData.tailoringCharges !== undefined ? updateData.tailoringCharges : job.tailoringCharges;
      const advance = updateData.advancePaid !== undefined ? updateData.advancePaid : job.advancePaid;
      updateData.balance = charges - advance;
    }

    updateData.updatedBy = userId;

    const updatedJob = await TailoringJob.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedJob) throw new ApiError(404, 'Tailoring Job not found');
    return updatedJob;
  }

  static async getSlipData(id, tenantId) {
    const job = await TailoringJob.findOne({ _id: id, tenantId })
      .populate('customerId', 'name phone email address')
      .lean();
      
    if (!job) throw new ApiError(404, 'Tailoring Job not found');
    return job;
  }
}

module.exports = TailoringJobService;

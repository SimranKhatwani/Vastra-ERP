const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const TailoringJobService = require('../services/tailoringJob.service');

class TailoringJobController {
  static getAllTailoringJobs = asyncHandler(async (req, res) => {
    const result = await TailoringJobService.getAllTailoringJobs(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result.records, 'Tailoring jobs retrieved', result.pagination));
  });

  static getTailoringJobById = asyncHandler(async (req, res) => {
    const job = await TailoringJobService.getTailoringJobById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, job, 'Tailoring job retrieved'));
  });

  static getByInvoiceNo = asyncHandler(async (req, res) => {
    const job = await TailoringJobService.getTailoringJobByInvoiceNo(req.params.invoiceNo, req.tenantId);
    return res.status(200).json(new ApiResponse(200, job, 'Tailoring job retrieved'));
  });

  static getByPSSM = asyncHandler(async (req, res) => {
    const jobs = await TailoringJobService.getByPSSM(req.params.pssmId, req.tenantId);
    return res.status(200).json(new ApiResponse(200, jobs, 'Tailoring jobs for PSSM retrieved'));
  });

  static getBySaleBill = asyncHandler(async (req, res) => {
    const jobs = await TailoringJobService.getBySaleBill(req.params.saleBillId, req.tenantId);
    return res.status(200).json(new ApiResponse(200, jobs, 'Tailoring jobs for SaleBill retrieved'));
  });

  static updateStatus = asyncHandler(async (req, res) => {
    const updatedJob = await TailoringJobService.updateStatus(req.params.id, req.body.status, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, updatedJob, 'Status updated successfully'));
  });

  static updateTailoringJob = asyncHandler(async (req, res) => {
    const updatedJob = await TailoringJobService.updateTailoringJob(req.params.id, req.body, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, updatedJob, 'Tailoring job updated successfully'));
  });

  static getSlipData = asyncHandler(async (req, res) => {
    const slipData = await TailoringJobService.getSlipData(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, slipData, 'Slip data retrieved'));
  });
}

module.exports = TailoringJobController;

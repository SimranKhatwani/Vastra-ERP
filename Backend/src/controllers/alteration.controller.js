const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const AlterationService = require('../services/alteration.service');

class AlterationController {
  static createAlteration = asyncHandler(async (req, res) => {
    const alteration = await AlterationService.createAlteration(req.body, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, alteration, 'Alteration record created successfully.'));
  });

  static updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      status,
      measurements,
      alterationDetails,
      deliveryDate,
      expectedDeliveryDate,
      tailorName,
      vendorName,
      customerPhone,
      customerMobile,
      serviceType,
      priority,
      reason,
      trialRequired,
      trialDate,
      fittingResult,
      requiredChanges,
      reAlterationRequired,
      remarks,
      specialInstructions,
      customAlterationText
    } = req.body;
    const extraData = {
      deliveryDate: deliveryDate || expectedDeliveryDate,
      expectedDeliveryDate: expectedDeliveryDate || deliveryDate,
      tailorName,
      vendorName,
      customerPhone: customerPhone || customerMobile,
      serviceType,
      priority,
      reason: reason || req.headers['x-audit-reason'],
      userName: req.user?.name || 'Staff Member',
      trialRequired,
      trialDate,
      fittingResult,
      requiredChanges,
      reAlterationRequired,
      remarks: remarks || specialInstructions || customAlterationText,
      specialInstructions: specialInstructions || remarks || customAlterationText,
      customAlterationText: customAlterationText || remarks || specialInstructions,
      io: req.app.get('io')
    };
    const alteration = await AlterationService.updateStatus(id, status, req.user.id, req.tenantId, measurements, alterationDetails, extraData);
    return res.status(200).json(new ApiResponse(200, alteration, `Alteration status updated to ${status || 'updated'}.`));
  });

  static updateMeasurements = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      measurements,
      alterationDetails,
      status,
      deliveryDate,
      expectedDeliveryDate,
      tailorName,
      vendorName,
      customerPhone,
      customerMobile,
      serviceType,
      priority,
      reason,
      saveAsMaster,
      garmentType,
      trialRequired,
      trialDate,
      fittingResult,
      requiredChanges,
      reAlterationRequired
    } = req.body;
    const extraData = {
      deliveryDate: deliveryDate || expectedDeliveryDate,
      expectedDeliveryDate: expectedDeliveryDate || deliveryDate,
      tailorName,
      vendorName,
      customerPhone: customerPhone || customerMobile,
      serviceType,
      priority,
      reason: reason || req.headers['x-audit-reason'],
      userName: req.user?.name || 'Staff Member',
      saveAsMaster,
      garmentType,
      trialRequired,
      trialDate,
      fittingResult,
      requiredChanges,
      reAlterationRequired,
      io: req.app.get('io')
    };
    const alteration = await AlterationService.updateStatus(id, status, req.user.id, req.tenantId, measurements, alterationDetails, extraData);
    return res.status(200).json(new ApiResponse(200, alteration, 'Alteration measurements updated successfully.'));
  });

  static getAlterations = asyncHandler(async (req, res) => {
    const { alterations, pagination } = await AlterationService.getAlterations(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, alterations, 'Alteration list retrieved.', pagination));
  });

  static getAlterationById = asyncHandler(async (req, res) => {
    const details = await AlterationService.getAlterationById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, details, 'Alteration details fetched.'));
  });

  static getPendingItems = asyncHandler(async (req, res) => {
    const pendingItems = await AlterationService.getPendingAlterationItems(req.tenantId);
    return res.status(200).json(new ApiResponse(200, pendingItems, 'Pending alteration items fetched.'));
  });

  static getDashboard = asyncHandler(async (req, res) => {
    const dashboard = await AlterationService.getAlterationDashboard(req.tenantId, req.query.dateRange);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: dashboard,
      summary: dashboard.summary,
      message: 'Alteration dashboard metrics fetched.'
    });
  });
}

module.exports = AlterationController;

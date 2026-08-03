const BillAdjustment = require('../models/billAdjustmentModel');
const AuditLog = require('../models/auditLogModel');

exports.createAdjustment = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      billNumber,
      invoiceId,
      originalAmount,
      adjustmentType,
      operation,
      adjustmentValue,
      calculatedAdjustmentAmount,
      finalAmount,
      reason,
      ownerApprovalStatus
    } = req.body;

    const adjustment = await BillAdjustment.create({
      tenantId,
      billNumber,
      invoiceId,
      originalAmount,
      adjustmentType,
      operation,
      adjustmentValue,
      calculatedAdjustmentAmount,
      finalAmount,
      reason,
      employeeId: req.user.employeeId || req.user._id || 'Unknown',
      employeeName: req.user.name || 'Store Employee',
      ownerApprovalStatus: ownerApprovalStatus || 'None'
    });

    // Create Audit Log entry
    await AuditLog.create({
      tenantId,
      timestamp: new Date().toISOString(),
      user: req.user.name || 'Store Employee',
      action: 'BILL_ADJUSTMENT_APPLIED',
      module: 'Billing POS',
      details: `Bill adjustment applied for Invoice No: ${billNumber}. Type: ${adjustmentType}, Operation: ${operation}, Value: ${adjustmentValue}, Calc Amount: ${calculatedAdjustmentAmount}, Final Amount: ${finalAmount}, Reason: ${reason || 'N/A'}`
    });

    res.status(201).json({
      success: true,
      message: 'Bill adjustment saved successfully',
      data: adjustment
    });
  } catch (error) {
    console.error('Failed to save bill adjustment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdjustments = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const adjustments = await BillAdjustment.find({ tenantId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: adjustments
    });
  } catch (error) {
    console.error('Failed to get adjustments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

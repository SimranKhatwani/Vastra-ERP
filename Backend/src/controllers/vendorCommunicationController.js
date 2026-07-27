const Vendor = require('../models/vendorModel');
const VendorCommunicationService = require('../services/vendorCommunicationService');
const VendorDocument = require('../models/vendorDocumentModel');
const VendorFollowUp = require('../models/vendorFollowUpModel');
const VendorNote = require('../models/vendorNoteModel');

// @desc    Get All Vendors for Header Selector / Search
// @route   GET /api/vendor-communication/list
// @access  Private
exports.getVendorList = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendors = await Vendor.find({ tenantId }).sort('name').lean();
    res.status(200).json({ success: true, count: vendors.length, data: vendors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get Full Vendor Communication Hub Profile
// @route   GET /api/vendor-communication/:vendorId
// @access  Private
exports.getVendorHub = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { vendorId } = req.params;
    const hubData = await VendorCommunicationService.getFullVendorHub(vendorId, tenantId);
    res.status(200).json({ success: true, data: hubData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Log Communication Action (Call, WhatsApp, Email, Shared Doc)
// @route   POST /api/vendor-communication/:vendorId/log-activity
// @access  Private
exports.logActivity = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { vendorId } = req.params;
    const activity = await VendorCommunicationService.logActivity({
      ...req.body,
      tenantId,
      vendorId,
      employeeName: req.user.name || 'Admin'
    });
    res.status(201).json({ success: true, data: activity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create Vendor Follow-Up
// @route   POST /api/vendor-communication/:vendorId/followups
// @access  Private
exports.createFollowUp = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { vendorId } = req.params;
    const followUp = await VendorCommunicationService.createFollowUp({
      ...req.body,
      tenantId,
      vendorId,
      employeeName: req.user.name || 'Admin'
    });
    res.status(201).json({ success: true, data: followUp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update Vendor Follow-Up Status/Details
// @route   PUT /api/vendor-communication/followups/:followUpId
// @access  Private
exports.updateFollowUp = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { followUpId } = req.params;
    const followUp = await VendorCommunicationService.updateFollowUp(followUpId, tenantId, {
      ...req.body,
      employeeName: req.user.name || 'Admin'
    });
    res.status(200).json({ success: true, data: followUp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Upload / Link Vendor Document
// @route   POST /api/vendor-communication/:vendorId/documents
// @access  Private
exports.addDocument = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { vendorId } = req.params;
    const doc = await VendorCommunicationService.addDocument({
      ...req.body,
      tenantId,
      vendorId,
      uploadedBy: req.user.name || 'Admin'
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete Vendor Document
// @route   DELETE /api/vendor-communication/documents/:docId
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { docId } = req.params;
    await VendorDocument.findOneAndDelete({ _id: docId, tenantId });
    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Add Internal Note
// @route   POST /api/vendor-communication/:vendorId/notes
// @access  Private
exports.addNote = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { vendorId } = req.params;
    const note = await VendorCommunicationService.addNote({
      ...req.body,
      tenantId,
      vendorId,
      employeeName: req.user.name || 'Admin'
    });
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update Vendor Details directly from Communication Card
// @route   PUT /api/vendor-communication/:vendorId
// @access  Private
exports.updateVendor = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { vendorId } = req.params;
    const updated = await Vendor.findOneAndUpdate(
      { _id: vendorId, tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

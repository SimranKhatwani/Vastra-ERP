const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const VendorService = require('../services/vendor.service');

class VendorController {
  static createVendor = asyncHandler(async (req, res) => {
    const vendor = await VendorService.createVendor(req.body, req.tenantId);
    return res.status(201).json(new ApiResponse(201, vendor, 'Vendor created successfully.'));
  });

  static getVendors = asyncHandler(async (req, res) => {
    const { items, pagination } = await VendorService.getVendors(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, items, 'Vendors retrieved.', pagination));
  });

  static getVendorById = asyncHandler(async (req, res) => {
    const vendor = await VendorService.getVendorById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, vendor, 'Vendor details fetched.'));
  });

  static updateVendor = asyncHandler(async (req, res) => {
    const vendor = await VendorService.updateVendor(req.params.id, req.body, req.tenantId);
    return res.status(200).json(new ApiResponse(200, vendor, 'Vendor updated successfully.'));
  });

  static deleteVendor = asyncHandler(async (req, res) => {
    const result = await VendorService.deleteVendor(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Vendor deleted (soft).'));
  });
}

module.exports = VendorController;

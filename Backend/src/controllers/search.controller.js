const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const SearchService = require('../services/search.service');

class SearchController {
  static searchByBarcode = asyncHandler(async (req, res) => {
    const result = await SearchService.searchByBarcode(req.params.barcode, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Barcode search result.'));
  });

  static searchByDesignNo = asyncHandler(async (req, res) => {
    const result = await SearchService.searchByDesignNo(req.params.designNo, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Design number search results.'));
  });

  static searchByItemCode = asyncHandler(async (req, res) => {
    const result = await SearchService.searchByItemCode(req.params.itemCode, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Item code search results.'));
  });

  static searchByIpn = asyncHandler(async (req, res) => {
    const result = await SearchService.searchByIpn(req.params.ipn, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'IPN search results.'));
  });

  static searchByVendor = asyncHandler(async (req, res) => {
    const result = await SearchService.searchByVendor(req.params.vendorId, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Vendor search results.'));
  });

  static searchByBillNo = asyncHandler(async (req, res) => {
    const result = await SearchService.searchByBillNo(req.params.billNo, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Bill number search result.'));
  });
}

module.exports = SearchController;

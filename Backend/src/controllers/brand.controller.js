const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const BrandService = require('../services/brand.service');

class BrandController {
  static createBrand = asyncHandler(async (req, res) => {
    const brand = await BrandService.createBrand(req.body, req.tenantId);
    return res.status(201).json(new ApiResponse(201, brand, 'Brand created successfully.'));
  });

  static getBrands = asyncHandler(async (req, res) => {
    const result = await BrandService.getBrands(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result.items, 'Brands retrieved successfully.', result.pagination));
  });

  static getBrandById = asyncHandler(async (req, res) => {
    const brand = await BrandService.getBrandById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, brand, 'Brand retrieved successfully.'));
  });

  static updateBrand = asyncHandler(async (req, res) => {
    const brand = await BrandService.updateBrand(req.params.id, req.body, req.tenantId);
    return res.status(200).json(new ApiResponse(200, brand, 'Brand updated successfully.'));
  });

  static deleteBrand = asyncHandler(async (req, res) => {
    await BrandService.deleteBrand(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, null, 'Brand deleted successfully.'));
  });
}

module.exports = BrandController;

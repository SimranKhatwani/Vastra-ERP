const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const CategoryService = require('../services/category.service');

class CategoryController {
  static createCategory = asyncHandler(async (req, res) => {
    const category = await CategoryService.createCategory(req.body, req.tenantId);
    return res.status(201).json(new ApiResponse(201, category, 'Category created successfully.'));
  });

  static getCategories = asyncHandler(async (req, res) => {
    const result = await CategoryService.getCategories(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result.items, 'Categories retrieved successfully.', result.pagination));
  });

  static getCategoryById = asyncHandler(async (req, res) => {
    const category = await CategoryService.getCategoryById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, category, 'Category retrieved successfully.'));
  });

  static updateCategory = asyncHandler(async (req, res) => {
    const category = await CategoryService.updateCategory(req.params.id, req.body, req.tenantId);
    return res.status(200).json(new ApiResponse(200, category, 'Category updated successfully.'));
  });

  static deleteCategory = asyncHandler(async (req, res) => {
    await CategoryService.deleteCategory(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, null, 'Category deleted successfully.'));
  });
}

module.exports = CategoryController;

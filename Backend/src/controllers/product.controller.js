const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const ProductService = require('../services/product.service');

class ProductController {
  static createProduct = asyncHandler(async (req, res) => {
    const product = await ProductService.createProduct(req.body, req.tenantId);
    return res.status(201).json(new ApiResponse(201, product, 'Product created successfully.'));
  });

  static getProducts = asyncHandler(async (req, res) => {
    const { products, pagination } = await ProductService.getProducts(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, products, 'Products retrieved successfully.', pagination));
  });

  static getProductById = asyncHandler(async (req, res) => {
    const product = await ProductService.getProductById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, product, 'Product details fetched.'));
  });

  static updateProduct = asyncHandler(async (req, res) => {
    const product = await ProductService.updateProduct(req.params.id, req.body, req.tenantId);
    return res.status(200).json(new ApiResponse(200, product, 'Product updated successfully.'));
  });

  static deleteProduct = asyncHandler(async (req, res) => {
    await ProductService.deleteProduct(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, null, 'Product deleted successfully.'));
  });

  static restoreProduct = asyncHandler(async (req, res) => {
    const product = await ProductService.restoreProduct(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, product, 'Product restored successfully.'));
  });

  static bulkDeleteProducts = asyncHandler(async (req, res) => {
    const result = await ProductService.bulkDeleteProducts(req.body.ids, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Bulk delete products completed.'));
  });

  static bulkUpdateStatus = asyncHandler(async (req, res) => {
    const result = await ProductService.bulkUpdateStatus(req.body.ids, req.body.isActive, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Bulk status update completed.'));
  });

  static getByDesignNo = asyncHandler(async (req, res) => {
    const product = await ProductService.getByDesignNo(req.params.designNo, req.tenantId);
    return res.status(200).json(new ApiResponse(200, product, 'Product fetched by design number.'));
  });

  static getByItemCode = asyncHandler(async (req, res) => {
    const product = await ProductService.getByItemCode(req.params.itemCode, req.tenantId);
    return res.status(200).json(new ApiResponse(200, product, 'Product fetched by item code.'));
  });

  static exportProducts = asyncHandler(async (req, res) => {
    const exportResult = await ProductService.exportProducts(req.query, req.tenantId, req.query.format || 'csv');
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    }
    return res.status(200).json(new ApiResponse(200, exportResult.content, 'Products exported successfully.'));
  });

  static searchBilling = asyncHandler(async (req, res) => {
    const q = req.query.q || req.query.name || req.query.barcode || '';
    const products = await ProductService.searchBilling(q, req.tenantId);
    return res.status(200).json(new ApiResponse(200, products, 'Billing search completed.'));
  });
}

module.exports = ProductController;

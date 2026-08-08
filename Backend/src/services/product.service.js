const ApiError = require('../helpers/ApiError');
const Product = require('../models/Product');
const Brand = require('../models/masters/Brand');
const Category = require('../models/masters/Category');
const Firm = require('../models/masters/Firm');
const Warehouse = require('../models/masters/Warehouse');
const InventoryPiece = require('../models/InventoryPiece');
const BaseRepository = require('../repositories/BaseRepository');
const { formatExportData } = require('../helpers/export.helper');

const productRepo = new BaseRepository(Product);

class ProductService {
  static async createProduct(productData, tenantId) {
    const existing = await productRepo.findOne({ itemCode: productData.itemCode }, tenantId);
    if (existing) {
      throw new ApiError(400, `Product with itemCode '${productData.itemCode}' already exists.`);
    }

    return productRepo.create({
      ...productData,
      tenantId
    }, tenantId);
  }

  static async searchBilling(queryStr, tenantId) {
    const { products } = await this.getProducts({ limit: 100 }, tenantId);
    if (!queryStr) return products;
    const q = queryStr.toLowerCase().trim();
    return products.filter(p =>
      (p.itemName && p.itemName.toLowerCase().includes(q)) ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.itemCode && p.itemCode.toLowerCase().includes(q)) ||
      (p.designNo && p.designNo.toLowerCase().includes(q)) ||
      (p.barcode && String(p.barcode).toLowerCase().includes(q)) ||
      (p.uniqueCode && String(p.uniqueCode).toLowerCase().includes(q)) ||
      (p.ipn && String(p.ipn).toLowerCase().includes(q))
    );
  }

  static async getProducts(query = {}, tenantId) {
    const filter = { tenantId };
    
    if (query.includeDeleted === 'true') {
      // include deleted
    } else {
      filter.isDeleted = false;
    }

    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.brandId) filter.brandId = query.brandId;
    if (query.designNo) filter.designNo = new RegExp(query.designNo, 'i');
    if (query.itemCode) filter.itemCode = new RegExp(query.itemCode, 'i');
    if (query.gender) filter.gender = query.gender;

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { itemName: searchRegex },
        { itemCode: searchRegex },
        { designNo: searchRegex },
        { subItem: searchRegex }
      ];
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .populate('brandId categoryId subCategoryId hsnId gstId')
      .sort(query.sort ? { [query.sort]: query.order === 'desc' ? -1 : 1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    // Enrich products with live InventoryPiece records (stock, barcode, size, color, purchaseRate, rack, firm)
    const productIds = products.map(p => p._id);
    const InventoryPiece = require('../models/InventoryPiece');
    const pieces = await InventoryPiece.find({ productId: { $in: productIds }, tenantId, isDeleted: false })
      .populate('firmId warehouseId');

    const piecesByProduct = new Map();
    pieces.forEach(piece => {
      const pId = piece.productId.toString();
      if (!piecesByProduct.has(pId)) piecesByProduct.set(pId, []);
      piecesByProduct.get(pId).push(piece);
    });

    const enrichedProducts = products.map(p => {
      const pObj = p.toObject();
      const pPieces = piecesByProduct.get(p._id.toString()) || [];
      const availablePieces = pPieces.filter(pc => pc.status === 'AVAILABLE');
      
      const sizes = Array.from(new Set(pPieces.map(pc => pc.size).filter(Boolean))).join(', ');
      const colors = Array.from(new Set(pPieces.map(pc => pc.primaryColor).filter(Boolean))).join(', ');
      const secondaryColors = Array.from(new Set(pPieces.map(pc => pc.secondaryColor).filter(Boolean))).join(', ');
      
      const calculatedStock = pPieces.length > 0 
        ? availablePieces.length 
        : Math.max(0, Number(pObj.availableStock ?? pObj.stock ?? 0));

      return {
        ...pObj,
        stock: calculatedStock,
        availableStock: calculatedStock,
        soldQuantity: pPieces.filter(pc => pc.status === 'SOLD').length || Number(pObj.soldQuantity || 0),
        totalPieces: pPieces.length,
        barcode: pPieces[0]?.barcode || '',
        uniqueCode: pPieces[0]?.uniqueCode || '',
        ipn: pPieces[0]?.ipn || '',
        size: sizes || 'FREE',
        color: colors || '-',
        primaryColor: colors || '-',
        secondaryColor: secondaryColors || '-',
        purchaseRate: pPieces[0]?.purchaseRate || 0,
        purchasePrice: pPieces[0]?.purchaseRate || 0,
        sellingPrice: pPieces[0]?.wspAfterGST || p.defaultMRP,
        company: pPieces[0]?.firmId?.name || 'Primary Store Firm',
        firmName: pPieces[0]?.firmId?.name || 'Primary Store Firm',
        rackLocation: pPieces[0]?.rack || 'Shelf A1',
        pieces: pPieces
      };
    });

    return {
      products: enrichedProducts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getProductById(productId, tenantId) {
    const product = await productRepo.findById(productId, tenantId, {
      populate: 'brandId categoryId subCategoryId hsnId gstId'
    });
    if (!product) throw new ApiError(404, 'Product not found.');
    return product;
  }

  static async updateProduct(productId, updateData, tenantId) {
    const updated = await productRepo.update(productId, updateData, tenantId);
    if (!updated) throw new ApiError(404, 'Product not found.');
    return updated;
  }

  static async deleteProduct(productId, userId, tenantId) {
    return productRepo.softDelete(productId, userId, tenantId);
  }

  static async restoreProduct(productId, tenantId) {
    const product = await Product.findOne({ _id: productId, tenantId });
    if (!product) throw new ApiError(404, 'Product not found.');
    product.restore();
    return product;
  }

  static async bulkDeleteProducts(productIds = [], userId, tenantId) {
    const result = await Product.updateMany(
      { _id: { $in: productIds }, tenantId },
      { isDeleted: true, deletedAt: new Date(), deletedBy: userId }
    );
    return { count: result.modifiedCount };
  }

  static async bulkUpdateStatus(productIds = [], isActive, tenantId) {
    const result = await Product.updateMany(
      { _id: { $in: productIds }, tenantId },
      { isActive }
    );
    return { modifiedCount: result.modifiedCount };
  }

  static async getByDesignNo(designNo, tenantId) {
    const product = await Product.findOne({ designNo, tenantId, isDeleted: false })
      .populate('brandId categoryId subCategoryId hsnId gstId');
    if (!product) throw new ApiError(404, 'Product with this design number not found.');
    return product;
  }

  static async getByItemCode(itemCode, tenantId) {
    const product = await Product.findOne({ itemCode, tenantId, isDeleted: false })
      .populate('brandId categoryId subCategoryId hsnId gstId');
    if (!product) throw new ApiError(404, 'Product with this item code not found.');
    return product;
  }

  static async exportProducts(query = {}, tenantId, format = 'csv') {
    const { products } = await this.getProducts({ ...query, limit: 10000 }, tenantId);
    const exportData = products.map(p => ({
      ID: p._id.toString(),
      DesignNo: p.designNo,
      ItemCode: p.itemCode,
      ItemName: p.itemName,
      Brand: p.brandId?.name || '',
      Category: p.categoryId?.name || '',
      Gender: p.gender,
      MRP: p.defaultMRP,
      Status: p.isActive ? 'Active' : 'Inactive'
    }));
    return formatExportData(exportData, format);
  }
}

module.exports = ProductService;

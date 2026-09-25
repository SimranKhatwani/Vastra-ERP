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
    if (!queryStr) {
      const { products } = await this.getProducts({ limit: 1000 }, tenantId);
      return products;
    }
    const q = queryStr.trim();
    const { products } = await this.getProducts({ search: q, limit: 1000 }, tenantId);

    // In addition, if no direct products found, search pieces directly
    if (!products || products.length === 0) {
      const InventoryPiece = require('../models/InventoryPiece');
      const pieces = await InventoryPiece.find({
        tenantId,
        isDeleted: false,
        $or: [
          { barcode: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          { uniqueCode: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          { ipn: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
        ]
      }).populate('productId');

      const pieceProductIds = pieces.map(pc => pc.productId?._id || pc.productId).filter(Boolean);
      if (pieceProductIds.length > 0) {
        const { products: extraProducts } = await this.getProducts({ limit: 1000 }, tenantId);
        return extraProducts.filter(p => pieceProductIds.some(id => id.toString() === (p._id || p.id).toString()));
      }
    }

    const qLower = q.toLowerCase();
    return products.filter(p =>
      (p.itemName && p.itemName.toLowerCase().includes(qLower)) ||
      (p.name && p.name.toLowerCase().includes(qLower)) ||
      (p.itemCode && p.itemCode.toLowerCase().includes(qLower)) ||
      (p.designNo && p.designNo.toLowerCase().includes(qLower)) ||
      (p.sku && p.sku.toLowerCase().includes(qLower)) ||
      (p.barcode && String(p.barcode).toLowerCase().includes(qLower)) ||
      (p.uniqueCode && String(p.uniqueCode).toLowerCase().includes(qLower)) ||
      (p.ipn && String(p.ipn).toLowerCase().includes(qLower)) ||
      (p.batch && String(p.batch).toLowerCase().includes(qLower)) ||
      (p.counter && String(p.counter).toLowerCase().includes(qLower)) ||
      (p.pieces && p.pieces.some(pc => 
        String(pc.barcode || '').toLowerCase().includes(qLower) || 
        String(pc.uniqueCode || '').toLowerCase().includes(qLower)
      ))
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
      const searchTrimmed = String(query.search).trim();
      const searchRegex = new RegExp(searchTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      // Also find piece-level matches (barcode, uniqueCode, ipn, batch, counter, designNo)
      const InventoryPiece = require('../models/InventoryPiece');
      const pieceProductIds = await InventoryPiece.find({
        tenantId,
        isDeleted: false,
        $or: [
          { barcode: searchRegex },
          { uniqueCode: searchRegex },
          { ipn: searchRegex },
          { batch: searchRegex },
          { counter: searchRegex },
          { designNo: searchRegex },
          { primaryColor: searchRegex },
          { size: searchRegex }
        ]
      }).distinct('productId');

      filter.$or = [
        { itemName: searchRegex },
        { itemCode: searchRegex },
        { designNo: searchRegex },
        { subItem: searchRegex },
        { barcode: searchRegex },
        { sku: searchRegex },
        { color: searchRegex },
        { primaryColor: searchRegex },
        { batch: searchRegex },
        { counter: searchRegex },
        { _id: { $in: pieceProductIds } }
      ];
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 2000;
    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .populate('brandId categoryId subCategoryId hsnId gstId firmId')
      .sort(query.sort ? { [query.sort]: query.order === 'desc' ? -1 : 1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    // Enrich products with live InventoryPiece records (stock, barcode, size, color, purchaseRate, rack, firm)
    const productIds = products.map(p => p._id);
    const InventoryPiece = require('../models/InventoryPiece');
    const GoodsReturn = require('../models/goodsReturn/GoodsReturn');
    const GoodsReturnItem = require('../models/goodsReturn/GoodsReturnItem');

    const pieces = await InventoryPiece.find({ productId: { $in: productIds }, tenantId, isDeleted: false })
      .sort({ createdAt: -1 })  // newest first so latest import prices are at [0]
      .populate('firmId warehouseId')
      .populate({
        path: 'purchaseBillId',
        populate: { path: 'vendorId' }
      });

    // Query active Goods Returns & items to sum exact return quantities
    const activeGRs = await GoodsReturn.find({
      tenantId,
      overallStatus: { $nin: ['COMPLETED', 'CANCELLED'] },
      isDeleted: false
    }).select('_id');
    const activeGRIds = activeGRs.map(g => g._id);

    const activeGRItems = activeGRIds.length > 0 ? await GoodsReturnItem.find({
      tenantId,
      goodsReturnId: { $in: activeGRIds },
      isDeleted: false
    }) : [];

    const piecesByProduct = new Map();
    pieces.forEach(piece => {
      const pId = piece.productId.toString();
      if (!piecesByProduct.has(pId)) piecesByProduct.set(pId, []);
      piecesByProduct.get(pId).push(piece);
    });

    const enrichedProducts = products.map(p => {
      const pObj = p.toObject();
      const pStr = p._id.toString();
      const pPieces = piecesByProduct.get(pStr) || [];
      const availablePieces = pPieces.filter(pc => pc.status === 'AVAILABLE');
      
      const sizes = Array.from(new Set(pPieces.map(pc => pc.size).filter(Boolean))).join(', ');
      const colors = Array.from(new Set(pPieces.map(pc => pc.primaryColor).filter(Boolean))).join(', ');
      const secondaryColors = Array.from(new Set(pPieces.map(pc => pc.secondaryColor).filter(Boolean))).join(', ');
      
      const calculatedStock = pPieces.length > 0 
        ? availablePieces.length 
        : Math.max(0, Number(pObj.availableStock ?? pObj.stock ?? 0));

      const resolvedFirmName = pObj.firmName || pPieces[0]?.firmId?.name || pObj.firmId?.name || 'New Fashion Style';

      // Find best piece for price data: prefer piece with non-zero wspAfterGST (newest import)
      const pricePiece = pPieces.find(pc => pc.wspAfterGST > 0) || pPieces[0];

      // Calculate total return quantity from both active GoodsReturnItems & InventoryPieces
      const pBarcodes = new Set([pObj.barcode, ...pPieces.map(pc => pc.barcode)].filter(Boolean));
      const pDesignNos = new Set([pObj.designNo, ...pPieces.map(pc => pc.designNo)].filter(Boolean));

      const matchedGRItems = activeGRItems.filter(gi => {
        if (gi.productId && gi.productId.toString() === pStr) return true;
        if (gi.barcode && pBarcodes.has(gi.barcode)) return true;
        if (gi.designNo && pDesignNos.has(gi.designNo)) return true;
        return false;
      });

      const sumGRItemsQty = matchedGRItems.reduce((acc, gi) => acc + Number(gi.returnQuantity || 1), 0);
      const pieceGRQty = pPieces.filter(pc => pc.status === 'GOODS_RETURNED' || pc.returned === true).length;
      const inGRQty = Math.max(sumGRItemsQty, pieceGRQty);
      
      const resolvedStock = pPieces.length > 0 
        ? calculatedStock 
        : Math.max(1, Number(pObj.availableStock ?? pObj.stock ?? 100));

      const computedStatus = inGRQty > 0 
        ? `IN GR (${inGRQty} Pcs)` 
        : (resolvedStock > 0 ? 'In Stock' : 'Out of Stock');

      // Auto-assign persistent barcode if missing
      const resolvedBarcode = (pObj.barcode && pObj.barcode.trim()) 
        || (pPieces[0]?.barcode && pPieces[0].barcode.trim()) 
        || (pObj.itemCode && pObj.itemCode.trim()) 
        || `VST${pStr.slice(-6).toUpperCase()}`;

      if (!pObj.barcode && resolvedBarcode) {
        Product.updateOne({ _id: p._id, barcode: { $in: ['', null] } }, { $set: { barcode: resolvedBarcode } }).exec().catch(() => {});
      }

      return {
        ...pObj,
        name: pObj.itemName || '-',
        sku: pObj.itemCode || '-',
        category: pObj.categoryId?.name || '-',
        brand: pObj.brandId?.name || '-',
        hsn: pObj.hsnId?.hsnCode || 'N/A',
        gst: pObj.gstId?.rate || 0,
        imageUrl: pObj.imageUrl || '',
        stock: resolvedStock,
        availableStock: resolvedStock,
        inGRQty,
        goodsReturnedQuantity: inGRQty,
        status: computedStatus,
        soldQuantity: pPieces.filter(pc => pc.status === 'SOLD').length || Number(pObj.soldQuantity || 0),
        totalPieces: pPieces.length,
        barcode: resolvedBarcode,
        uniqueCode: pPieces[0]?.uniqueCode || resolvedBarcode,
        ipn: pPieces[0]?.ipn || '',
        batch: pPieces[0]?.batch || pObj.batch || '',
        counter: pPieces[0]?.counter || pObj.counter || '',
        description: pObj.description || (pPieces[0]?.batch || pObj.batch ? `Batch: ${pPieces[0]?.batch || pObj.batch}` : ''),
        size: pObj.size || sizes || 'FREE',
        color: pObj.color || pObj.primaryColor || colors || '-',
        primaryColor: pObj.primaryColor || pObj.color || colors || '-',
        secondaryColor: pObj.secondaryColor || secondaryColors || '-',
        purchaseRate: pObj.purchaseRate || pricePiece?.purchaseRate || pObj.purchasePrice || 0,
        purchasePrice: pObj.purchaseRate || pricePiece?.purchaseRate || pObj.purchasePrice || 0,
        mrp: pObj.defaultMRP || pricePiece?.mrp || pObj.mrp || 0,
        sellingPrice: pObj.defaultMRP || pricePiece?.mrp || pObj.mrp || 0,
        gstOnSalePrice: pObj.gstOnSalePrice ?? pricePiece?.gstOnSalePrice ?? 5,
        gstPercent: pObj.gstOnSalePrice ?? pricePiece?.gstOnSalePrice ?? 5,
        wspAfterGST: (pricePiece?.wspAfterGST > pricePiece?.purchaseRate ? pricePiece.wspAfterGST : null) || (pObj.wspAfterGST > pObj.purchaseRate ? pObj.wspAfterGST : null) || pObj.wspAfterGST || pricePiece?.wspAfterGST || pObj.purchaseRate || pricePiece?.purchaseRate || 0,
        afterGST: (pricePiece?.wspAfterGST > pricePiece?.purchaseRate ? pricePiece.wspAfterGST : null) || (pObj.wspAfterGST > pObj.purchaseRate ? pObj.wspAfterGST : null) || pObj.wspAfterGST || pricePiece?.wspAfterGST || pObj.purchaseRate || pricePiece?.purchaseRate || 0,
        vendorName: pPieces[0]?.purchaseBillId?.vendorId?.name || 'N/A',
        vendorCode: pPieces[0]?.purchaseBillId?.vendorId?.vendorCode || 'N/A',
        purchaseDate: pPieces[0]?.purchaseBillId?.billDate 
          ? new Date(pPieces[0].purchaseBillId.billDate).toLocaleDateString() 
          : 'N/A',
        lastPurchaseDate: pPieces[0]?.purchaseBillId?.billDate 
          ? new Date(pPieces[0].purchaseBillId.billDate).toLocaleDateString() 
          : 'N/A',
        purchaseInvoice: pPieces[0]?.purchaseBillId?.billNo || 'N/A',
        landedCost: pricePiece?.purchaseRate || 0,
        company: resolvedFirmName,
        firmName: resolvedFirmName,
        rackLocation: pPieces[0]?.rack || 'SHOWROOM',
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
    const cleanDesign = String(designNo || '').trim();
    const product = await Product.findOne({
      designNo: new RegExp('^' + cleanDesign.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
      tenantId,
      isDeleted: false
    }).populate('brandId categoryId subCategoryId hsnId gstId firmId');
    if (!product) throw new ApiError(404, 'Product with this design number not found.');
    return product;
  }

  static async getByItemCode(itemCode, tenantId) {
    const cleanCode = String(itemCode || '').trim();
    const product = await Product.findOne({
      itemCode: new RegExp('^' + cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
      tenantId,
      isDeleted: false
    }).populate('brandId categoryId subCategoryId hsnId gstId firmId');
    if (!product) throw new ApiError(404, 'Product with this item code not found.');
    return product;
  }

  static async getProductInfoPublic(rawCode) {
    if (!rawCode) throw new ApiError(400, 'Product code or barcode is required.');
    const code = String(rawCode).trim();
    const mongoose = require('mongoose');
    const InventoryPiece = require('../models/InventoryPiece');

    // 1. Try to find an InventoryPiece matching barcode, uniqueCode, ipn, or _id
    let piece = null;
    if (mongoose.Types.ObjectId.isValid(code)) {
      piece = await InventoryPiece.findOne({ _id: code, isDeleted: false })
        .populate('firmId warehouseId')
        .populate({ path: 'purchaseBillId', populate: { path: 'vendorId' } });
    }
    if (!piece) {
      piece = await InventoryPiece.findOne({
        $or: [
          { barcode: code },
          { uniqueCode: code },
          { ipn: code }
        ],
        isDeleted: false
      })
        .populate('firmId warehouseId')
        .populate({ path: 'purchaseBillId', populate: { path: 'vendorId' } });
    }

    // 2. Find Product matching _id, itemCode, designNo, barcode, or piece.productId
    let product = null;
    if (piece && piece.productId) {
      product = await Product.findOne({ _id: piece.productId, isDeleted: false })
        .populate('brandId categoryId subCategoryId hsnId gstId firmId');
    }

    if (!product && mongoose.Types.ObjectId.isValid(code)) {
      product = await Product.findOne({ _id: code, isDeleted: false })
        .populate('brandId categoryId subCategoryId hsnId gstId firmId');
    }

    if (!product) {
      const codeRegex = new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      product = await Product.findOne({
        $or: [
          { barcode: code },
          { itemCode: codeRegex },
          { designNo: codeRegex },
          { itemName: codeRegex }
        ],
        isDeleted: false
      }).populate('brandId categoryId subCategoryId hsnId gstId firmId');
    }

    if (!product && !piece) {
      // Partial search fallback
      const partialRegex = new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      product = await Product.findOne({
        $or: [
          { barcode: partialRegex },
          { itemCode: partialRegex },
          { designNo: partialRegex },
          { itemName: partialRegex }
        ],
        isDeleted: false
      }).populate('brandId categoryId subCategoryId hsnId gstId firmId');
    }

    if (!product && !piece) {
      throw new ApiError(404, `No garment product or inventory piece found for barcode/code '${code}'.`);
    }

    // If product exists, fetch all associated pieces to calculate real stock
    let allPieces = [];
    if (product) {
      allPieces = await InventoryPiece.find({ productId: product._id, isDeleted: false })
        .sort({ createdAt: -1 })
        .populate('firmId warehouseId')
        .populate({ path: 'purchaseBillId', populate: { path: 'vendorId' } });
    } else if (piece) {
      allPieces = [piece];
    }

    const availablePieces = allPieces.filter(pc => pc.status === 'AVAILABLE');
    const sizes = Array.from(new Set(allPieces.map(pc => pc.size).filter(Boolean))).join(', ');
    const colors = Array.from(new Set(allPieces.map(pc => pc.primaryColor).filter(Boolean))).join(', ');
    const secondaryColors = Array.from(new Set(allPieces.map(pc => pc.secondaryColor).filter(Boolean))).join(', ');

    const pObj = product ? product.toObject() : {};
    const pricePiece = allPieces.find(pc => pc.wspAfterGST > 0) || piece || allPieces[0];

    const calculatedStock = allPieces.length > 0
      ? availablePieces.length
      : Math.max(0, Number(pObj.availableStock ?? pObj.stock ?? 0));

    const resolvedFirmName = pObj.firmName || piece?.firmId?.name || allPieces[0]?.firmId?.name || pObj.firmId?.name || 'New Fashion Style';

    const pName = pObj.itemName || (piece?.primaryColor ? `${pObj.itemName || 'Garment'} (${piece.primaryColor})` : 'Garment Style');
    const barcodeVal = piece?.barcode || pObj.barcode || '';
    const uniqueCodeVal = piece?.uniqueCode || allPieces[0]?.uniqueCode || '';
    const ipnVal = piece?.ipn || allPieces[0]?.ipn || '';
    const batchVal = piece?.batch || allPieces[0]?.batch || pObj.batch || '';
    const counterVal = piece?.counter || allPieces[0]?.counter || pObj.counter || '';

    return {
      id: pObj._id || piece?._id,
      _id: pObj._id || piece?._id,
      name: pName,
      itemName: pObj.itemName || 'Garment Style',
      designNo: pObj.designNo || 'N/A',
      itemCode: pObj.itemCode || piece?.barcode || 'N/A',
      sku: pObj.itemCode || piece?.barcode || 'N/A',
      subItem: pObj.subItem || '',
      company: resolvedFirmName,
      firmName: resolvedFirmName,
      uniqueCode: uniqueCodeVal,
      ipn: ipnVal,
      batch: batchVal,
      counter: counterVal,
      category: pObj.categoryId?.name || pObj.category || 'FABRIC SUIT',
      brand: pObj.brandId?.name || pObj.brand || 'Generic',
      barcode: barcodeVal,
      primaryColor: piece?.primaryColor || pObj.primaryColor || pObj.color || colors || '-',
      color: piece?.primaryColor || pObj.primaryColor || pObj.color || colors || '-',
      secondaryColor: piece?.secondaryColor || pObj.secondaryColor || secondaryColors || '-',
      rackLocation: piece?.rack || allPieces[0]?.rack || 'SHOWROOM',
      hsn: pObj.hsnId?.hsnCode || pObj.hsn || '520851',
      size: piece?.size || pObj.size || (sizes || 'FREE'),
      description: pObj.description || (batchVal ? `Batch: ${batchVal}` : ''),
      purchaseRate: piece?.purchaseRate || pObj.purchaseRate || pricePiece?.purchaseRate || 0,
      purchasePrice: piece?.purchaseRate || pObj.purchaseRate || pricePiece?.purchaseRate || 0,
      wspAfterGST: piece?.wspAfterGST || pricePiece?.wspAfterGST || pObj.wspAfterGST || piece?.purchaseRate || pObj.purchaseRate || 0,
      mrp: piece?.mrp || pObj.defaultMRP || pricePiece?.mrp || 0,
      defaultMRP: piece?.mrp || pObj.defaultMRP || pricePiece?.mrp || 0,
      sellingPrice: piece?.mrp || pObj.defaultMRP || pricePiece?.mrp || 0,
      gstOnSalePrice: piece?.gstOnSalePrice ?? pObj.gstOnSalePrice ?? pricePiece?.gstOnSalePrice ?? 5,
      gstPercent: piece?.gstOnSalePrice ?? pObj.gstOnSalePrice ?? pricePiece?.gstOnSalePrice ?? 5,
      stock: calculatedStock,
      availableStock: calculatedStock,
      minStockAlert: pObj.minStockAlert || 5,
      totalPieces: allPieces.length,
      pieceDetails: piece ? {
        id: piece._id,
        barcode: piece.barcode,
        uniqueCode: piece.uniqueCode,
        ipn: piece.ipn,
        batch: piece.batch,
        counter: piece.counter,
        size: piece.size,
        color: piece.primaryColor,
        status: piece.status,
        rack: piece.rack
      } : null
    };
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

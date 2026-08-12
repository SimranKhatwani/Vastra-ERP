const ApiError = require('../helpers/ApiError');
const PurchaseBill = require('../models/purchase/PurchaseBill');
const PurchaseItem = require('../models/purchase/PurchaseItem');
const Product = require('../models/Product');
const InventoryPiece = require('../models/InventoryPiece');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const { generateBarcode, generateUniqueCode } = require('../helpers/barcodeGenerator');
const { INVENTORY_STATUS, LIFECYCLE_EVENT } = require('../constants/status');
const { formatExportData } = require('../helpers/export.helper');

class PurchaseService {
  /**
   * Create Purchase Bill and auto-generate InventoryPiece items (One Barcode = One Document)
   */
  static async createPurchaseBill(billData, userId, tenantId) {
    const rawItems = billData.items || billData.billItems || billData.products || billData.rows || [];
    const billNo = billData.billNo || billData.poNo || billData.invoiceNo || `PB-${Date.now()}`;
    
    let vendorId = billData.vendorId || billData.supplierId;
    if (!vendorId || typeof vendorId !== 'string' || vendorId.length !== 24) {
      vendorId = null;
    }

    let firmId = billData.firmId;
    if (!firmId || typeof firmId !== 'string' || firmId.length !== 24) {
      firmId = null;
    }

    let warehouseId = billData.warehouseId;
    if (!warehouseId || typeof warehouseId !== 'string' || warehouseId.length !== 24) {
      warehouseId = null;
    }

    let calculatedTotal = 0;
    const itemsToCreate = [];

    for (const item of rawItems) {
      let product = null;
      if (item.productId && typeof item.productId === 'string' && item.productId.length === 24) {
        product = await Product.findOne({ _id: item.productId, tenantId });
      }

      if (!product) {
        const Brand = require('../models/masters/Brand');
        const Category = require('../models/masters/Category');
        const brandName = item.brand || 'GENERIC BRAND';
        const categoryName = item.category || item.itemName || 'GENERAL';

        let brand = await Brand.findOne({ tenantId, name: new RegExp(`^${brandName}$`, 'i') });
        if (!brand) {
          brand = await Brand.create({ tenantId, name: brandName, code: brandName.substring(0, 4).toUpperCase() });
        }

        let category = await Category.findOne({ tenantId, name: new RegExp(`^${categoryName}$`, 'i') });
        if (!category) {
          category = await Category.create({ tenantId, name: categoryName, code: categoryName.substring(0, 4).toUpperCase() });
        }

        const barcode = item.barcode || `BC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const designNo = String(item.designNo || 'DSG-001').trim();
        const itemCode = String(item.itemCode || `ITEM-${designNo}-${Date.now()}`).trim();
        const itemName = String(item.itemName || item.name || `${brandName} ${designNo}`).trim();
        const mrp = Number(item.mrp || item.sellingPrice || item.purchasePrice || 100);

        product = await Product.create({
          tenantId,
          designNo,
          itemCode,
          itemName,
          subItem: item.subItem || '',
          brandId: brand._id,
          categoryId: category._id,
          gender: 'UNISEX',
          topBottomSet: 'TOP',
          defaultMRP: mrp,
          createdBy: userId
        });
      }

      const qty = Number(item.quantity || item.qty || 1);
      const purchaseRate = Number(item.purchaseRate || item.purchasePrice || item.rate || 0);
      const mrp = Number(item.mrp || product.mrp || purchaseRate);
      const discount = Number(item.discount || item.discountOnPurchase || 0);
      const taxRate = Number(item.taxRate || item.gstOnPurchase || 0);
      const size = item.size || product.size || "FS";
      const color = item.color || item.colorPrimary || product.color || "Standard";

      const lineTotal = item.calculatedTaxable ?? item.totalPrice ?? (qty * purchaseRate - discount);
      calculatedTotal += lineTotal;

      itemsToCreate.push({
        productId: product._id,
        product,
        qty,
        purchaseRate,
        mrp,
        discount,
        taxRate,
        size,
        primaryColor: color,
        rack: item.rack || "A1",
        lineTotal
      });
    }

    const grandTotal = Number(billData.grandTotal ?? billData.totalAmount ?? (calculatedTotal - (billData.discount || 0) + (billData.gst || 0)));

    // 1. Create Purchase Bill
    const purchaseBill = await PurchaseBill.create({
      tenantId,
      billNo,
      billDate: billData.billDate || billData.date || new Date(),
      vendorId,
      firmId,
      warehouseId,
      discount: billData.discount || 0,
      gst: billData.gst || billData.gstTotal || 0,
      totalAmount: grandTotal,
      status: 'APPROVED',
      createdBy: userId
    });

    // 2. Create Purchase Items & Generate InventoryPieces per unit quantity
    const createdInventoryPieces = [];

    for (const item of itemsToCreate) {
      const purchaseItem = await PurchaseItem.create({
        tenantId,
        purchaseBillId: purchaseBill._id,
        productId: item.productId,
        qty: item.qty,
        purchaseRate: item.purchaseRate,
        mrp: item.mrp,
        discount: item.discount || 0,
        taxRate: item.taxRate || 0,
        size: item.size,
        color: item.primaryColor,
        rack: item.rack,
        lineTotal: item.lineTotal,
        createdBy: userId
      });

      // Generate 1 Barcode / 1 Document for each quantity unit!
      for (let i = 1; i <= item.qty; i++) {
        const barcode = item.product.barcode || generateBarcode(tenantId, 'VST');
        const uniqueCode = generateUniqueCode(item.product.designNo || 'DES', item.size, i);

        const piece = await InventoryPiece.create({
          tenantId,
          productId: item.productId,
          purchaseBillId: purchaseBill._id,
          purchaseItemId: purchaseItem._id,
          warehouseId,
          firmId,
          barcode,
          uniqueCode,
          ipn: `${item.product.itemCode || 'ITM'}-${item.size}-${barcode.slice(-4)}`,
          primaryColor: item.primaryColor,
          secondaryColor: item.secondaryColor,
          size: item.size,
          purchaseRate: item.purchaseRate,
          wspAfterGST: item.purchaseRate * (1 + (item.taxRate || 0) / 100),
          mrp: item.mrp,
          rack: item.rack,
          status: INVENTORY_STATUS.AVAILABLE,
          currentLocation: 'WAREHOUSE',
          createdBy: userId
        });

        // 3. Record Inventory Lifecycle event
        await InventoryLifecycle.create({
          tenantId,
          inventoryPieceId: piece._id,
          barcode: piece.barcode,
          eventType: LIFECYCLE_EVENT.PURCHASE,
          toLocation: 'WAREHOUSE',
          referenceId: purchaseBill._id,
          referenceModel: 'PurchaseBill',
          performedBy: userId,
          notes: `Purchase Bill Received: ${purchaseBill.billNo}`
        });

        createdInventoryPieces.push(piece);
      }
    }

    const fetchedBill = await PurchaseBill.findById(purchaseBill._id).populate('vendorId firmId warehouseId');
    const enriched = await this.enrichPurchaseBill(fetchedBill, tenantId);
    return {
      ...enriched,
      totalInventoryPiecesCreated: createdInventoryPieces.length,
      sampleBarcodes: createdInventoryPieces.slice(0, 5).map(p => p.barcode)
    };
  }

  static async enrichPurchaseBill(billDoc, tenantId) {
    if (!billDoc) return null;
    const billObj = typeof billDoc.toObject === 'function' ? billDoc.toObject() : { ...billDoc };
    const billId = billObj._id || billObj.id;

    // Fetch associated PurchaseItems & InventoryPieces
    const [items, pieces] = await Promise.all([
      PurchaseItem.find({ purchaseBillId: billId }).populate('productId'),
      InventoryPiece.find({ purchaseBillId: billId }).select('barcode uniqueCode status mrp purchaseRate size ipn primaryColor secondaryColor')
    ]);

    // Deduplication check removed: We must return all legitimate PurchaseItems to the UI, 
    // even if they share the same product, size, color, and rate (they represent separate variants).
    const uniqueItems = items;

    const enrichedItems = uniqueItems.map(item => {
      const prd = item.productId || {};
      const piece = pieces.find(p => p.size === item.size) || pieces[0] || {};
      const qty = item.qty || 1;
      const rate = item.purchaseRate || prd.purchasePrice || 0;
      const lineTotal = item.lineTotal || (qty * rate);

      return {
        _id: item._id,
        id: item._id,
        productId: prd._id || item.productId,
        name: prd.name || prd.itemName || "Garment Item",
        productName: prd.name || prd.itemName || "Garment Item",
        itemName: prd.itemName || prd.name || "Garment Item",
        subItem: prd.subItem || prd.category || "General",
        designNo: prd.designNo || "N/A",
        itemCode: prd.itemCode || "N/A",
        ipn: piece.ipn || prd.ipn || `${prd.itemCode || 'ITM'}-${item.size}`,
        uniqueCode: piece.uniqueCode || prd.uniqueCode || "N/A",
        barcode: piece.barcode || prd.barcode || "N/A",
        brand: prd.brand || "N/A",
        company: prd.company || prd.brand || "N/A",
        category: prd.category || "N/A",
        size: item.size || "FS",
        color: item.color || piece.primaryColor || prd.color || "Standard",
        hsnCode: prd.hsnCode || prd.hsn || "5208",
        purchaseRate: rate,
        mrp: item.mrp || prd.mrp || 0,
        quantity: qty,
        qty: qty,
        totalPrice: lineTotal,
        calculatedTaxable: lineTotal,
        amount: lineTotal
      };
    });

    billObj.id = billObj._id;
    billObj.items = enrichedItems;
    billObj.billItems = enrichedItems;
    billObj.products = enrichedItems;
    billObj.supplierName = billObj.vendorId?.name || billObj.vendorId?.businessName || "Wholesaler";
    billObj.vendorName = billObj.supplierName;
    billObj.poNo = billObj.billNo;
    billObj.invoiceNo = billObj.billNo;
    billObj.grandTotal = billObj.totalAmount;
    billObj.subTotal = billObj.totalAmount;
    billObj.date = billObj.billDate || billObj.createdAt;

    return billObj;
  }

  static async getPurchaseBills(query = {}, tenantId) {
    const filter = {
      $or: [{ tenantId }, { tenantId: { $exists: false } }, { tenantId: null }],
      isDeleted: false
    };
    if (query.vendorId) filter.vendorId = query.vendorId;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.billNo = new RegExp(query.search, 'i');
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const bills = await PurchaseBill.find(filter)
      .populate('vendorId firmId warehouseId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PurchaseBill.countDocuments(filter);

    const enrichedBills = await Promise.all(bills.map(b => this.enrichPurchaseBill(b, tenantId)));

    return {
      bills: enrichedBills,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getPurchaseBillById(id, tenantId) {
    const bill = await PurchaseBill.findOne({ _id: id, tenantId, isDeleted: false })
      .populate('vendorId firmId warehouseId');
    if (!bill) throw new ApiError(404, 'Purchase Bill not found.');

    return await this.enrichPurchaseBill(bill, tenantId);
  }

  static async approvePurchaseBill(id, userId, tenantId) {
    const bill = await PurchaseBill.findOne({ _id: id, tenantId });
    if (!bill) throw new ApiError(404, 'Purchase Bill not found.');

    bill.status = 'APPROVED';
    await bill.save();
    return bill;
  }

  static async cancelPurchaseBill(id, userId, tenantId) {
    const bill = await PurchaseBill.findOne({ _id: id, tenantId });
    if (!bill) throw new ApiError(404, 'Purchase Bill not found.');

    bill.status = 'CANCELLED';
    await bill.save();

    // Soft delete associated inventory pieces that are not sold
    await InventoryPiece.updateMany(
      { purchaseBillId: id, tenantId, sold: false },
      { isDeleted: true, status: 'DAMAGED', deletedBy: userId, deletedAt: new Date() }
    );

    return bill;
  }

  static async exportPurchaseBills(query = {}, tenantId, format = 'csv') {
    const { bills } = await this.getPurchaseBills({ ...query, limit: 10000 }, tenantId);
    const exportData = bills.map(b => ({
      BillNo: b.billNo,
      BillDate: b.billDate,
      Vendor: b.vendorId?.name || '',
      TotalAmount: b.totalAmount,
      Status: b.status,
      CreatedAt: b.createdAt
    }));
    return formatExportData(exportData, format);
  }
}

module.exports = PurchaseService;

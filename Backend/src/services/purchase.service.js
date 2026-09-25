const mongoose = require('mongoose');
const ApiError = require('../helpers/ApiError');
const PurchaseBill = require('../models/purchase/PurchaseBill');
const PurchaseItem = require('../models/purchase/PurchaseItem');
const Product = require('../models/Product');
const InventoryPiece = require('../models/InventoryPiece');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const Vendor = require('../models/masters/Vendor');
const Brand = require('../models/masters/Brand');
const Category = require('../models/masters/Category');
const Firm = require('../models/masters/Firm');
const Warehouse = require('../models/masters/Warehouse');
const HSN = require('../models/masters/HSN');
const { generateBarcode, generateUniqueCode } = require('../helpers/barcodeGenerator');
const { INVENTORY_STATUS, LIFECYCLE_EVENT } = require('../constants/status');
const { formatExportData } = require('../helpers/export.helper');

const escapeRegExp = (string) => {
  return String(string || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const normalizeGender = (g) => {
  const s = String(g || '').toUpperCase().trim();
  return ['MEN', 'WOMEN', 'KIDS', 'UNISEX'].includes(s) ? s : 'UNISEX';
};

const normalizeTopBottomSet = (t) => {
  const s = String(t || '').toUpperCase().trim();
  return ['TOP', 'BOTTOM', 'SET', 'ACCESSORY', 'OTHER'].includes(s) ? s : 'TOP';
};

const normalizeTypeOfGst = (t) => {
  const s = String(t || '').toUpperCase().trim();
  return ['I', 'E'].includes(s) ? s : 'E';
};

const normalizeDiscountStatus = (d) => {
  const s = String(d || '').toUpperCase().trim();
  if (s.startsWith('B')) return 'B';
  if (s.startsWith('A')) return 'A';
  return 'N';
};

class PurchaseService {
  /**
   * Helper to ensure default warehouse exists and is active
   */
  static async resolveWarehouse(warehouseId, warehouseName, tenantId, session = null) {
    let warehouse = null;
    const opts = session ? { session } : {};
    const rawWhId = (warehouseId && typeof warehouseId === 'object') ? (warehouseId._id || warehouseId.id) : warehouseId;
    const rawWhName = (warehouseName && typeof warehouseName === 'object') ? (warehouseName.name) : (warehouseName || (warehouseId && typeof warehouseId === 'object' ? warehouseId.name : ''));

    if (rawWhId && /^[0-9a-fA-F]{24}$/.test(String(rawWhId))) {
      warehouse = await Warehouse.findOne({ _id: rawWhId, tenantId, includeDeleted: true }, null, opts);
    }
    if (!warehouse && rawWhName) {
      const escaped = escapeRegExp(String(rawWhName).trim());
      warehouse = await Warehouse.findOne({ tenantId, name: new RegExp(`^${escaped}$`, 'i'), includeDeleted: true }, null, opts);
    }
    if (!warehouse) {
      warehouse = await Warehouse.findOne({ tenantId, name: 'Main Warehouse', includeDeleted: true }, null, opts);
    }
    if (!warehouse) {
      warehouse = await Warehouse.findOne({ tenantId, includeDeleted: true }, null, opts);
    }
    if (!warehouse) {
      const created = await Warehouse.create([{
        tenantId,
        name: 'Main Warehouse',
        code: 'WH-MAIN',
        address: 'Headquarters'
      }], opts);
      warehouse = created[0] || created;
    } else if (warehouse.isDeleted) {
      warehouse.isDeleted = false;
      warehouse.status = 'ACTIVE';
      await warehouse.save(opts);
    }
    return warehouse;
  }

  /**
   * Helper to ensure default firm exists and is active
   */
  static async resolveFirm(firmId, firmName, tenantId, session = null) {
    let firm = null;
    const opts = session ? { session } : {};
    const rawFirmId = (firmId && typeof firmId === 'object') ? (firmId._id || firmId.id) : firmId;
    const rawFirmName = (firmName && typeof firmName === 'object') ? (firmName.name) : (firmName || (firmId && typeof firmId === 'object' ? firmId.name : ''));

    if (rawFirmId && /^[0-9a-fA-F]{24}$/.test(String(rawFirmId))) {
      firm = await Firm.findOne({ _id: rawFirmId, tenantId, includeDeleted: true }, null, opts);
    }
    if (!firm && rawFirmName) {
      const escaped = escapeRegExp(String(rawFirmName).trim());
      firm = await Firm.findOne({ tenantId, name: new RegExp(`^${escaped}$`, 'i'), includeDeleted: true }, null, opts);
    }
    if (!firm) {
      firm = await Firm.findOne({ tenantId, name: 'Primary Store Firm', includeDeleted: true }, null, opts);
    }
    if (!firm) {
      firm = await Firm.findOne({ tenantId, includeDeleted: true }, null, opts);
    }
    if (!firm) {
      const fName = String(rawFirmName || 'Primary Store Firm').trim();
      const created = await Firm.create([{
        tenantId,
        name: fName,
        code: fName.substring(0, 6).toUpperCase()
      }], opts);
      firm = created[0] || created;
    } else if (firm.isDeleted) {
      firm.isDeleted = false;
      firm.status = 'ACTIVE';
      await firm.save(opts);
    }
    return firm;
  }

  /**
   * Helper to ensure vendor exists and is active
   */
  static async resolveVendor(vendorId, vendorName, vendorGst, tenantId, session = null) {
    let vendor = null;
    const opts = session ? { session } : {};
    const rawVendorId = (vendorId && typeof vendorId === 'object') ? (vendorId._id || vendorId.id) : vendorId;
    const rawVendorName = (vendorName && typeof vendorName === 'object') ? (vendorName.name) : (vendorName || (vendorId && typeof vendorId === 'object' ? vendorId.name : ''));
    const rawGst = (vendorGst && typeof vendorGst === 'object') ? (vendorGst.gstin || vendorGst.gst) : vendorGst;

    if (rawVendorId && /^[0-9a-fA-F]{24}$/.test(String(rawVendorId))) {
      vendor = await Vendor.findOne({ _id: rawVendorId, tenantId, includeDeleted: true }, null, opts);
    }
    if (!vendor && rawGst) {
      const escaped = escapeRegExp(String(rawGst).trim());
      vendor = await Vendor.findOne({ tenantId, gstin: new RegExp(`^${escaped}$`, 'i'), includeDeleted: true }, null, opts);
    }
    if (!vendor && rawVendorName) {
      const escaped = escapeRegExp(String(rawVendorName).trim());
      vendor = await Vendor.findOne({ tenantId, name: new RegExp(`^${escaped}$`, 'i'), includeDeleted: true }, null, opts);
    }
    if (!vendor) {
      const vName = String(rawVendorName || 'Wholesaler / Vendor').trim();
      const vCode = vName.substring(0, 8).toUpperCase();
      const created = await Vendor.create([{
        tenantId,
        name: vName,
        vendorCode: vCode,
        gstin: rawGst || ''
      }], opts);
      vendor = created[0] || created;
    } else if (vendor.isDeleted) {
      vendor.isDeleted = false;
      vendor.status = 'ACTIVE';
      await vendor.save(opts);
    }
    return vendor;
  }

  /**
   * Create Purchase Bill and auto-generate InventoryPiece items (One Barcode = One Document)
   */
  static async createPurchaseBill(billData, userId, tenantId) {
    const rawItems = billData.items || billData.billItems || billData.products || billData.rows || [];
    const billNo = String(billData.billNo || billData.poNo || billData.invoiceNo || `PB-${Date.now()}`).trim();
    
    const warehouse = await this.resolveWarehouse(billData.warehouseId, billData.warehouse, tenantId);
    const firm = await this.resolveFirm(billData.firmId, billData.firmName || billData.firm, tenantId);
    const vendor = await this.resolveVendor(billData.vendorId || billData.supplierId, billData.vendorName || billData.supplierName, billData.vendorGst, tenantId);

    const brandCache = new Map();
    const categoryCache = new Map();
    const hsnCache = new Map();
    const productCache = new Map();
    const productsToSave = new Map();

    const purchaseBillId = new mongoose.Types.ObjectId();
    let calculatedTotal = 0;

    const purchaseItemsToCreate = [];
    const piecesToCreate = [];
    const lifecycleEventsToCreate = [];

    for (const item of rawItems) {
      const typeOfGstNormalized = normalizeTypeOfGst(item.typeOfGst);
      const gstStatus = String(item.gstStatus || '').trim();
      const discountStatusNormalized = normalizeDiscountStatus(item.discountStatus);
      const genderNormalized = normalizeGender(item.gender);
      const topBottomSetNormalized = normalizeTopBottomSet(item.topBottomSet);

      const brandName = String(item.brand || item.brandName || 'GENERIC BRAND').trim();
      const categoryName = String(item.category || item.itemName || item.subItem || 'FABRIC SUIT').trim();
      const designNo = String(item.designNo || 'DSG-001').trim();
      const subItem = String(item.subItem || item.subCategory || '').trim();
      const hsnCode = String(item.hsnCode || item.hsn || '').trim();

      let brand = brandCache.get(brandName.toUpperCase());
      if (!brand) {
        brand = await Brand.findOne({ tenantId, name: new RegExp(`^${escapeRegExp(brandName)}$`, 'i'), includeDeleted: true });
        if (!brand) {
          brand = await Brand.create({ tenantId, name: brandName, code: brandName.substring(0, 4).toUpperCase() });
        } else if (brand.isDeleted) {
          brand.isDeleted = false;
          brand.status = 'ACTIVE';
          await brand.save();
        }
        brandCache.set(brandName.toUpperCase(), brand);
      }

      let category = categoryCache.get(categoryName.toUpperCase());
      if (!category) {
        category = await Category.findOne({ tenantId, name: new RegExp(`^${escapeRegExp(categoryName)}$`, 'i'), includeDeleted: true });
        if (!category) {
          category = await Category.create({ tenantId, name: categoryName, code: categoryName.substring(0, 4).toUpperCase() });
        } else if (category.isDeleted) {
          category.isDeleted = false;
          category.status = 'ACTIVE';
          await category.save();
        }
        categoryCache.set(categoryName.toUpperCase(), category);
      }

      let hsn = null;
      if (hsnCode) {
        hsn = hsnCache.get(hsnCode.toUpperCase());
        if (!hsn) {
          hsn = await HSN.findOne({ tenantId, hsnCode: new RegExp(`^${escapeRegExp(hsnCode)}$`, 'i') });
          if (!hsn) {
            hsn = await HSN.create({ tenantId, hsnCode, description: 'HSN code' });
          }
          hsnCache.set(hsnCode.toUpperCase(), hsn);
        }
      }

      const qty = Number(item.quantity || item.qty || 1) || 1;
      const purchaseRate = Number(item.purchaseRate || item.purchasePrice || item.rate || 0) || 0;
      const mrp = Number(item.mrp || item.sellingPrice || item.purchasePrice || purchaseRate || 0);
      const discount = Number(item.discount || item.discountOnPurchase || 0) || 0;
      const taxRate = Number(item.taxRate || item.gstOnPurchase || 0) || 0;
      const size = String(item.size || "FS").trim() || "FS";
      const color = String(item.color || item.colorPrimary || "Standard").trim() || "Standard";
      const batch = String(item.batch || "").trim();
      const counter = String(item.counter || "").trim();
      const rawBarcode = String(item.barcode || "").trim();

      const productKey = rawBarcode 
        ? `BC_${rawBarcode.toUpperCase()}` 
        : `${designNo}_${subItem}_${color}_${brand._id}_${category._id}`.toUpperCase();

      let product = productCache.get(productKey);
      if (!product) {
        if (item.productId && /^[0-9a-fA-F]{24}$/.test(String(item.productId))) {
          product = await Product.findOne({ _id: item.productId, tenantId, includeDeleted: true });
        }
        if (!product && rawBarcode) {
          product = await Product.findOne({ tenantId, barcode: rawBarcode, includeDeleted: true });
        }
        if (!product) {
          product = await Product.findOne({
            tenantId,
            designNo: new RegExp(`^${escapeRegExp(designNo)}$`, 'i'),
            brandId: brand._id,
            includeDeleted: true
          });
        }

        if (product) {
          let updated = false;
          if (product.isDeleted) {
            product.isDeleted = false;
            product.status = 'ACTIVE';
            updated = true;
          }
          if (product.typeOfGst !== typeOfGstNormalized) { product.typeOfGst = typeOfGstNormalized; updated = true; }
          if (product.gstStatus !== gstStatus) { product.gstStatus = gstStatus; updated = true; }
          if (product.discountStatus !== discountStatusNormalized) { product.discountStatus = discountStatusNormalized; updated = true; }
          if (mrp > 0 && product.defaultMRP !== mrp) { product.defaultMRP = mrp; updated = true; }
          if (purchaseRate > 0 && product.purchaseRate !== purchaseRate) { product.purchaseRate = purchaseRate; updated = true; }
          if (rawBarcode && !product.barcode) { product.barcode = rawBarcode; updated = true; }
          if (updated) {
            productsToSave.set(product._id.toString(), product);
          }
        } else {
          const itemCode = String(item.itemCode || `ITEM-${designNo}-${Date.now()}`).trim();
          const itemName = String(item.itemName || item.name || `${brandName} ${designNo}`).trim();

          product = await Product.create({
            tenantId,
            designNo,
            itemCode,
            itemName,
            subItem,
            brandId: brand._id,
            categoryId: category._id,
            hsnId: hsn ? hsn._id : undefined,
            firmId: firm._id,
            firmName: firm.name,
            barcode: rawBarcode || generateBarcode(tenantId, 'VST'),
            uniqueCode: String(item.uniqueCode || '').trim() || generateUniqueCode(designNo, size, 1),
            gender: genderNormalized,
            topBottomSet: topBottomSetNormalized,
            batch,
            counter,
            defaultMRP: mrp,
            purchaseRate,
            wspAfterGST: typeOfGstNormalized === 'E' ? purchaseRate * (1 + taxRate / 100) : purchaseRate,
            typeOfGst: typeOfGstNormalized,
            gstStatus: gstStatus,
            discountStatus: discountStatusNormalized,
            createdBy: userId
          });
        }
        productCache.set(productKey, product);
      }

      const barcode = rawBarcode || product.barcode || generateBarcode(tenantId, 'VST');
      const uniqueCode = String(item.uniqueCode || "").trim() || product.uniqueCode || generateUniqueCode(designNo, size, 1);
      const lineTotal = Math.max(0, (qty * purchaseRate) - discount);
      calculatedTotal += lineTotal;

      const purchaseItemId = new mongoose.Types.ObjectId();
      purchaseItemsToCreate.push({
        _id: purchaseItemId,
        tenantId,
        purchaseBillId,
        productId: product._id,
        qty,
        purchaseRate,
        mrp,
        discount,
        taxRate,
        size,
        color,
        rack: item.rack || "A1",
        typeOfGst: typeOfGstNormalized,
        gstStatus,
        discountStatus: discountStatusNormalized,
        lineTotal,
        createdBy: userId
      });

      for (let i = 1; i <= qty; i++) {
        const pieceBarcode = (i === 1 && barcode) ? barcode : generateBarcode(tenantId, 'VST');
        const pieceUniqueCode = (i === 1 && uniqueCode) ? uniqueCode : generateUniqueCode(designNo, size, i);
        const ipn = item.ipn || `${product.itemCode}-${size}`;
        const pieceId = new mongoose.Types.ObjectId();

        piecesToCreate.push({
          _id: pieceId,
          tenantId,
          productId: product._id,
          purchaseBillId,
          purchaseItemId,
          warehouseId: warehouse._id,
          firmId: firm._id,
          barcode: pieceBarcode,
          uniqueCode: pieceUniqueCode,
          ipn,
          primaryColor: color,
          secondaryColor: String(item.colorSecondary || '').trim(),
          size,
          batch,
          counter,
          purchaseRate,
          wspAfterGST: typeOfGstNormalized === 'E' ? purchaseRate * (1 + (taxRate / 100)) : purchaseRate,
          mrp,
          rack: item.rack || "A1",
          typeOfGst: typeOfGstNormalized,
          gstStatus,
          discountStatus: discountStatusNormalized,
          status: INVENTORY_STATUS.AVAILABLE,
          currentLocation: 'WAREHOUSE',
          createdBy: userId
        });

        lifecycleEventsToCreate.push({
          tenantId,
          inventoryPieceId: pieceId,
          barcode: pieceBarcode,
          eventType: LIFECYCLE_EVENT.PURCHASE,
          toLocation: 'WAREHOUSE',
          referenceId: purchaseBillId,
          referenceModel: 'PurchaseBill',
          performedBy: userId,
          notes: `Purchase Bill Received: ${billNo}`
        });
      }
    }

    if (productsToSave.size > 0) {
      await Promise.all(Array.from(productsToSave.values()).map(p => p.save()));
    }

    const billDiscount = Number(billData.discount ?? billData.grandDisc ?? 0) || 0;
    const grandTotal = calculatedTotal > 0 ? (calculatedTotal - billDiscount) : Number(billData.grandTotal ?? billData.totalAmount ?? 0);

    // Create Purchase Bill and batch insert items in parallel
    const [purchaseBill] = await Promise.all([
      PurchaseBill.create({
        _id: purchaseBillId,
        tenantId,
        billNo,
        billDate: billData.billDate || billData.date || new Date(),
        vendorId: vendor._id,
        firmId: firm._id,
        warehouseId: warehouse._id,
        discount: billDiscount,
        gst: Number(billData.gst ?? billData.gstTotal ?? 0),
        totalAmount: grandTotal,
        status: 'APPROVED',
        remarks: billData.remarks || '',
        createdBy: userId
      }),
      purchaseItemsToCreate.length > 0 ? PurchaseItem.insertMany(purchaseItemsToCreate, { ordered: false }) : Promise.resolve(),
      piecesToCreate.length > 0 ? InventoryPiece.insertMany(piecesToCreate, { ordered: false }) : Promise.resolve(),
      lifecycleEventsToCreate.length > 0 ? InventoryLifecycle.insertMany(lifecycleEventsToCreate, { ordered: false }) : Promise.resolve()
    ]);

    const fetchedBill = await PurchaseBill.findById(purchaseBill._id).populate('vendorId firmId warehouseId');
    const enriched = await this.enrichPurchaseBill(fetchedBill, tenantId);
    return {
      ...enriched,
      totalInventoryPiecesCreated: piecesToCreate.length,
      sampleBarcodes: piecesToCreate.slice(0, 5).map(p => p.barcode)
    };
  }

  static async enrichPurchaseBill(billDoc, tenantId) {
    if (!billDoc) return null;
    const billObj = typeof billDoc.toObject === 'function' ? billDoc.toObject() : { ...billDoc };
    const billId = billObj._id || billObj.id;

    // Fetch associated PurchaseItems & InventoryPieces in parallel
    const [items, pieces] = await Promise.all([
      PurchaseItem.find({ purchaseBillId: billId }).populate({
        path: 'productId',
        populate: { path: 'brandId categoryId hsnId firmId' }
      }),
      InventoryPiece.find({ purchaseBillId: billId }).select('barcode uniqueCode status mrp purchaseRate size ipn primaryColor secondaryColor batch counter typeOfGst gstStatus discountStatus purchaseItemId productId')
    ]);

    // Build O(1) lookup Maps
    const pieceByPurchaseItemId = new Map();
    const pieceByProductAndSize = new Map();
    for (const p of pieces) {
      if (p.purchaseItemId && !pieceByPurchaseItemId.has(String(p.purchaseItemId))) {
        pieceByPurchaseItemId.set(String(p.purchaseItemId), p);
      }
      const pKey = `${p.productId}_${p.size}`;
      if (!pieceByProductAndSize.has(pKey)) {
        pieceByProductAndSize.set(pKey, p);
      }
    }

    const enrichedItems = items.map(item => {
      const prd = item.productId || {};
      const piece = pieceByPurchaseItemId.get(String(item._id)) ||
                    pieceByProductAndSize.get(`${prd._id}_${item.size}`) ||
                    pieces[0] || {};

      const qty = Number(item.qty || 1);
      const rate = Number(item.purchaseRate ?? prd.purchaseRate ?? prd.purchasePrice ?? 0);
      const taxRate = Number(item.taxRate ?? prd.gstRate ?? 5);
      const typeOfGst = String(item.typeOfGst || prd.typeOfGst || "E").toUpperCase();
      const discount = Number(item.discount || 0);

      let taxable = qty * rate;
      let gstAmt = 0;
      let lineTotal = Math.max(0, (qty * rate) - discount);
      if (typeOfGst === "I") {
        taxable = (qty * rate) / (1 + (taxRate / 100));
        gstAmt = (qty * rate) - taxable;
      } else {
        gstAmt = (taxable - discount) * (taxRate / 100);
      }
      const wspAfterGst = (typeOfGst === "E") ? rate * (1 + taxRate / 100) : rate;

      const brandName = prd.brandId?.name || prd.brand || "GENERIC BRAND";
      const categoryName = prd.categoryId?.name || prd.category || prd.itemName || "Garment Item";
      const hsnCode = prd.hsnId?.hsnCode || prd.hsnId?.code || prd.hsnCode || prd.hsn || "5208";

      return {
        _id: item._id,
        id: item._id,
        purchaseItemId: item._id,
        productId: prd._id || item.productId,
        name: prd.itemName || prd.name || categoryName,
        productName: prd.itemName || prd.name || categoryName,
        itemName: prd.itemName || prd.name || categoryName,
        subItem: prd.subItem || "Finished Goods",
        subCategory: prd.subItem || "Finished Goods",
        brand: brandName,
        brandName: brandName,
        company: billObj.firmId?.name || billObj.firmName || prd.firmName || brandName,
        firm: billObj.firmId?.name || billObj.firmName || prd.firmName || "RANGOLI ENTERPRISES",
        category: categoryName,
        designNo: prd.designNo || "DSG-001",
        itemCode: prd.itemCode || `ITEM-${prd.designNo || '001'}`,
        barcode: piece.barcode || prd.barcode || "",
        ipn: piece.ipn || prd.ipn || `${prd.itemCode || 'ITM'}-${item.size || 'FS'}`,
        uniqueCode: piece.uniqueCode || prd.uniqueCode || "",
        quantity: qty,
        qty: qty,
        batch: piece.batch || prd.batch || "",
        counter: piece.counter || prd.counter || "",
        topBottomSet: prd.topBottomSet || "TOP",
        gender: prd.gender || "UNISEX",
        colorPrimary: item.color || prd.primaryColor || prd.color || "Standard",
        colorSecondary: prd.secondaryColor || "",
        color: item.color || prd.color || prd.primaryColor || "Standard",
        size: item.size || prd.size || "FS",
        purchaseRate: rate,
        pRate: rate,
        purchasePrice: rate,
        gstOnPurchase: taxRate,
        taxRate: taxRate,
        typeOfGst: typeOfGst,
        gstStatus: item.gstStatus || prd.gstStatus || "",
        wspAfterGst: Number(wspAfterGst.toFixed(2)),
        mrp: item.mrp || prd.defaultMRP || prd.mrp || rate,
        gstOnSalePrice: prd.gstOnSalePrice || 5,
        discountStatus: item.discountStatus || prd.discountStatus || "N",
        discountOnPurchase: discount,
        discount: discount,
        hsnCode: hsnCode,
        totalPrice: lineTotal,
        calculatedTaxable: taxable,
        calculatedGst: gstAmt,
        calculatedTotal: lineTotal,
        amount: lineTotal
      };
    });

    const itemsSum = enrichedItems.reduce((sum, it) => sum + (Number(it.amount || it.totalPrice || it.calculatedTotal || 0)), 0);
    const billDiscount = Number(billObj.discount || 0);
    const effectiveTotal = itemsSum > 0 ? (itemsSum - billDiscount) : Number(billObj.totalAmount || 0);

    billObj.id = billObj._id;
    billObj.items = enrichedItems;
    billObj.billItems = enrichedItems;
    billObj.products = enrichedItems;
    billObj.supplierName = billObj.vendorId?.name || billObj.vendorId?.businessName || billObj.vendorName || "Wholesaler";
    billObj.vendorName = billObj.supplierName;
    billObj.poNo = billObj.billNo;
    billObj.invoiceNo = billObj.billNo;
    billObj.grandTotal = effectiveTotal;
    billObj.subTotal = effectiveTotal;
    billObj.totalAmount = effectiveTotal;
    billObj.date = billObj.billDate || billObj.createdAt;
    billObj.firm = billObj.firmId?.name || billObj.firmName || (enrichedItems[0]?.firm) || "RANGOLI ENTERPRISES";
    billObj.firmName = billObj.firm;

    return billObj;
  }

  static async updatePurchaseBill(id, billData, userId, tenantId) {
    let purchaseBill = null;
    if (id && /^[0-9a-fA-F]{24}$/.test(String(id))) {
      purchaseBill = await PurchaseBill.findOne({ _id: id, tenantId, includeDeleted: true });
    }
    const candidateBillNo = billData.billNo || billData.poNo || billData.invoiceNo || id;
    if (!purchaseBill && candidateBillNo) {
      const escaped = escapeRegExp(String(candidateBillNo).trim());
      purchaseBill = await PurchaseBill.findOne({
        tenantId,
        billNo: new RegExp(`^${escaped}$`, 'i'),
        includeDeleted: true
      });
    }

    if (!purchaseBill) {
      // Fallback: If not found, create new purchase bill seamlessly
      return await this.createPurchaseBill(billData, userId, tenantId);
    }

    if (purchaseBill.isDeleted) {
      purchaseBill.isDeleted = false;
      purchaseBill.status = 'APPROVED';
    }

    const rawItems = billData.items || billData.billItems || billData.products || billData.rows || [];
    const billNo = String(billData.billNo || billData.poNo || billData.invoiceNo || purchaseBill.billNo).trim();

    const [warehouse, firm, vendor] = await Promise.all([
      this.resolveWarehouse(billData.warehouseId || purchaseBill.warehouseId, billData.warehouse, tenantId),
      this.resolveFirm(billData.firmId || purchaseBill.firmId, billData.firmName || billData.firm, tenantId),
      this.resolveVendor(billData.vendorId || billData.supplierId || purchaseBill.vendorId, billData.vendorName || billData.supplierName, billData.vendorGst, tenantId)
    ]);

    purchaseBill.billNo = billNo;
    if (billData.billDate || billData.date) {
      const rawDate = billData.billDate || billData.date;
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        purchaseBill.billDate = parsedDate;
      }
    }
    purchaseBill.vendorId = vendor._id;
    purchaseBill.firmId = firm._id;
    purchaseBill.warehouseId = warehouse._id;
    purchaseBill.discount = Number(billData.discount ?? billData.grandDisc ?? purchaseBill.discount ?? 0);
    purchaseBill.gst = Number(billData.gst ?? billData.gstTotal ?? purchaseBill.gst ?? 0);
    if (billData.remarks) purchaseBill.remarks = billData.remarks;
    if (billData.status) {
      const s = String(billData.status).toUpperCase().trim();
      purchaseBill.status = ['DRAFT', 'APPROVED', 'RECEIVED', 'CANCELLED', 'COMPLETED', 'PENDING', 'COMPILED'].includes(s) ? s : 'APPROVED';
    }

    const brandCache = new Map();
    const categoryCache = new Map();
    const hsnCache = new Map();
    const productCache = new Map();
    const productsToSave = new Map();

    let calculatedTotal = 0;
    const purchaseItemsToCreate = [];
    const piecesToCreate = [];
    const lifecycleEventsToCreate = [];

    if (rawItems && rawItems.length > 0) {
      // Parallel delete of old records
      await Promise.all([
        InventoryLifecycle.deleteMany({
          $or: [{ referenceId: purchaseBill._id }, { referenceId: id }],
          tenantId
        }),
        InventoryPiece.deleteMany({
          purchaseBillId: purchaseBill._id,
          tenantId
        }),
        PurchaseItem.deleteMany({
          purchaseBillId: purchaseBill._id,
          tenantId
        })
      ]);

      for (const item of rawItems) {
        const typeOfGstNormalized = normalizeTypeOfGst(item.typeOfGst);
        const gstStatus = String(item.gstStatus || '').trim();
        const discountStatusNormalized = normalizeDiscountStatus(item.discountStatus);
        const genderNormalized = normalizeGender(item.gender);
        const topBottomSetNormalized = normalizeTopBottomSet(item.topBottomSet);

        const brandName = String(item.brand || item.brandName || 'GENERIC BRAND').trim();
        const categoryName = String(item.category || item.itemName || item.subItem || 'FABRIC SUIT').trim();
        const designNo = String(item.designNo || 'DSG-001').trim();
        const subItem = String(item.subItem || item.subCategory || '').trim();
        const hsnCode = String(item.hsnCode || item.hsn || '').trim();

        let brand = brandCache.get(brandName.toUpperCase());
        if (!brand) {
          brand = await Brand.findOne({ tenantId, name: new RegExp(`^${escapeRegExp(brandName)}$`, 'i'), includeDeleted: true });
          if (!brand) {
            brand = await Brand.create({ tenantId, name: brandName, code: brandName.substring(0, 4).toUpperCase() });
          } else if (brand.isDeleted) {
            brand.isDeleted = false;
            brand.status = 'ACTIVE';
            await brand.save();
          }
          brandCache.set(brandName.toUpperCase(), brand);
        }

        let category = categoryCache.get(categoryName.toUpperCase());
        if (!category) {
          category = await Category.findOne({ tenantId, name: new RegExp(`^${escapeRegExp(categoryName)}$`, 'i'), includeDeleted: true });
          if (!category) {
            category = await Category.create({ tenantId, name: categoryName, code: categoryName.substring(0, 4).toUpperCase() });
          } else if (category.isDeleted) {
            category.isDeleted = false;
            category.status = 'ACTIVE';
            await category.save();
          }
          categoryCache.set(categoryName.toUpperCase(), category);
        }

        let hsn = null;
        if (hsnCode) {
          hsn = hsnCache.get(hsnCode.toUpperCase());
          if (!hsn) {
            hsn = await HSN.findOne({ tenantId, hsnCode: new RegExp(`^${escapeRegExp(hsnCode)}$`, 'i') });
            if (!hsn) {
              hsn = await HSN.create({ tenantId, hsnCode, description: 'HSN code' });
            }
            hsnCache.set(hsnCode.toUpperCase(), hsn);
          }
        }

        const qty = Number(item.quantity || item.qty || 1) || 1;
        const purchaseRate = Number(item.purchaseRate || item.purchasePrice || item.rate || 0) || 0;
        const mrp = Number(item.mrp || item.sellingPrice || purchaseRate || 0);
        const discount = Number(item.discount || item.discountOnPurchase || 0) || 0;
        const taxRate = Number(item.taxRate || item.gstOnPurchase || 0) || 0;
        const size = String(item.size || "FS").trim() || "FS";
        const color = String(item.color || item.colorPrimary || "Standard").trim() || "Standard";
        const batch = String(item.batch || "").trim();
        const counter = String(item.counter || "").trim();
        const rawBarcode = String(item.barcode || "").trim();

        const productKey = rawBarcode 
          ? `BC_${rawBarcode.toUpperCase()}` 
          : `${designNo}_${subItem}_${color}_${brand._id}_${category._id}`.toUpperCase();

        const itemName = String(item.itemName || item.name || `${brandName} ${designNo}`).trim();

        let product = productCache.get(productKey);
        if (!product) {
          if (item.productId && /^[0-9a-fA-F]{24}$/.test(String(item.productId))) {
            product = await Product.findOne({ _id: item.productId, tenantId, includeDeleted: true });
          }
          if (!product && rawBarcode) {
            product = await Product.findOne({ tenantId, barcode: rawBarcode, includeDeleted: true });
          }
          if (!product) {
            product = await Product.findOne({
              tenantId,
              designNo: new RegExp(`^${escapeRegExp(designNo)}$`, 'i'),
              brandId: brand._id,
              includeDeleted: true
            });
          }

          if (product) {
            let updated = false;
            if (product.isDeleted) {
              product.isDeleted = false;
              product.status = 'ACTIVE';
              updated = true;
            }
            if (product.itemName !== itemName) { product.itemName = itemName; updated = true; }
            if (product.subItem !== subItem) { product.subItem = subItem; updated = true; }
            if (product.brandId?.toString() !== brand._id.toString()) { product.brandId = brand._id; updated = true; }
            if (product.categoryId?.toString() !== category._id.toString()) { product.categoryId = category._id; updated = true; }
            if (hsn && product.hsnId?.toString() !== hsn._id.toString()) { product.hsnId = hsn._id; updated = true; }
            if (batch && product.batch !== batch) { product.batch = batch; updated = true; }
            if (counter && product.counter !== counter) { product.counter = counter; updated = true; }
            if (mrp > 0 && product.defaultMRP !== mrp) { product.defaultMRP = mrp; updated = true; }
            if (purchaseRate > 0 && product.purchaseRate !== purchaseRate) { product.purchaseRate = purchaseRate; updated = true; }
            if (product.typeOfGst !== typeOfGstNormalized) { product.typeOfGst = typeOfGstNormalized; updated = true; }
            if (product.gstStatus !== gstStatus) { product.gstStatus = gstStatus; updated = true; }
            if (product.discountStatus !== discountStatusNormalized) { product.discountStatus = discountStatusNormalized; updated = true; }
            if (rawBarcode && !product.barcode) { product.barcode = rawBarcode; updated = true; }
            if (updated) {
              productsToSave.set(product._id.toString(), product);
            }
          } else {
            const itemCode = String(item.itemCode || `ITEM-${designNo}`).trim();

            product = await Product.create({
              tenantId,
              designNo,
              itemCode,
              itemName,
              subItem,
              brandId: brand._id,
              categoryId: category._id,
              hsnId: hsn ? hsn._id : undefined,
              firmId: firm._id,
              firmName: firm.name,
              barcode: rawBarcode || generateBarcode(tenantId, 'VST'),
              uniqueCode: String(item.uniqueCode || '').trim() || generateUniqueCode(designNo, size, 1),
              gender: genderNormalized,
              topBottomSet: topBottomSetNormalized,
              batch,
              counter,
              defaultMRP: mrp,
              purchaseRate,
              wspAfterGST: typeOfGstNormalized === 'E' ? purchaseRate * (1 + taxRate / 100) : purchaseRate,
              typeOfGst: typeOfGstNormalized,
              gstStatus: gstStatus,
              discountStatus: discountStatusNormalized,
              createdBy: userId
            });
          }
          productCache.set(productKey, product);
        }

        const barcode = rawBarcode || product.barcode || generateBarcode(tenantId, 'VST');
        const uniqueCode = String(item.uniqueCode || "").trim() || product.uniqueCode || generateUniqueCode(designNo, size, 1);
        const lineTotal = Math.max(0, (qty * purchaseRate) - discount);
        calculatedTotal += lineTotal;

        const purchaseItemId = new mongoose.Types.ObjectId();
        purchaseItemsToCreate.push({
          _id: purchaseItemId,
          tenantId,
          purchaseBillId: purchaseBill._id,
          productId: product._id,
          qty,
          purchaseRate,
          mrp,
          discount,
          taxRate,
          size,
          color,
          rack: item.rack || "A1",
          typeOfGst: typeOfGstNormalized,
          gstStatus,
          discountStatus: discountStatusNormalized,
          lineTotal,
          createdBy: userId
        });

        for (let i = 1; i <= qty; i++) {
          const pieceBarcode = (i === 1 && barcode) ? barcode : generateBarcode(tenantId, 'VST');
          const pieceUniqueCode = (i === 1 && uniqueCode) ? uniqueCode : generateUniqueCode(designNo, size, i);
          const ipn = item.ipn || `${product.itemCode}-${size}`;
          const pieceId = new mongoose.Types.ObjectId();

          piecesToCreate.push({
            _id: pieceId,
            tenantId,
            productId: product._id,
            purchaseBillId: purchaseBill._id,
            purchaseItemId,
            warehouseId: warehouse._id,
            firmId: firm._id,
            barcode: pieceBarcode,
            uniqueCode: pieceUniqueCode,
            ipn,
            primaryColor: color,
            secondaryColor: item.colorSecondary || '',
            size,
            batch,
            counter,
            purchaseRate,
            wspAfterGST: typeOfGstNormalized === 'E' ? purchaseRate * (1 + taxRate / 100) : purchaseRate,
            mrp,
            rack: item.rack || "A1",
            typeOfGst: typeOfGstNormalized,
            gstStatus,
            discountStatus: discountStatusNormalized,
            status: INVENTORY_STATUS.AVAILABLE,
            currentLocation: 'WAREHOUSE',
            createdBy: userId
          });

          lifecycleEventsToCreate.push({
            tenantId,
            inventoryPieceId: pieceId,
            barcode: pieceBarcode,
            eventType: LIFECYCLE_EVENT.PURCHASE,
            toLocation: 'WAREHOUSE',
            referenceId: purchaseBill._id,
            referenceModel: 'PurchaseBill',
            performedBy: userId,
            notes: `Purchase Bill Updated: ${purchaseBill.billNo}`
          });
        }
      }

      if (productsToSave.size > 0) {
        await Promise.all(Array.from(productsToSave.values()).map(p => p.save()));
      }

      // Parallel batch insert of items, pieces, and lifecycles
      await Promise.all([
        purchaseItemsToCreate.length > 0 ? PurchaseItem.insertMany(purchaseItemsToCreate, { ordered: false }) : Promise.resolve(),
        piecesToCreate.length > 0 ? InventoryPiece.insertMany(piecesToCreate, { ordered: false }) : Promise.resolve(),
        lifecycleEventsToCreate.length > 0 ? InventoryLifecycle.insertMany(lifecycleEventsToCreate, { ordered: false }) : Promise.resolve()
      ]);
    }

    purchaseBill.totalAmount = calculatedTotal > 0 ? (calculatedTotal - purchaseBill.discount) : Number(billData.grandTotal ?? billData.totalAmount ?? purchaseBill.totalAmount ?? 0);
    await purchaseBill.save();

    const fetchedBill = await PurchaseBill.findById(purchaseBill._id).populate('vendorId firmId warehouseId');
    return await this.enrichPurchaseBill(fetchedBill, tenantId);
  }

  static async getPurchaseBillItems(id, tenantId) {
    const items = await PurchaseItem.find({ purchaseBillId: id, tenantId })
      .populate({
        path: 'productId',
        populate: { path: 'brandId categoryId hsnId firmId' }
      });
    return items;
  }

  static async getPurchaseBills(query = {}, tenantId) {
    const isObjectId = tenantId && /^[0-9a-fA-F]{24}$/.test(String(tenantId));
    const filter = {
      isDeleted: false
    };
    if (isObjectId) {
      filter.$or = [{ tenantId }, { tenantId: { $exists: false } }, { tenantId: null }];
    }
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
      .sort({ updatedAt: -1, createdAt: -1 })
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
    const isObjectId = tenantId && /^[0-9a-fA-F]{24}$/.test(String(tenantId));
    const query = { _id: id, isDeleted: false };
    if (isObjectId) query.tenantId = tenantId;
    const bill = await PurchaseBill.findOne(query)
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

  static async deletePurchaseBill(id, userId, tenantId) {
    const bill = await PurchaseBill.findOne({ _id: id, tenantId, includeDeleted: true });
    if (!bill) throw new ApiError(404, 'Purchase Bill not found.');

    // 1. Delete associated inventory lifecycles
    const InventoryLifecycle = require('../models/InventoryLifecycle');
    await InventoryLifecycle.deleteMany({
      $or: [{ referenceId: id }, { referenceId: bill._id }],
      tenantId
    });

    // 2. Delete associated inventory pieces
    await InventoryPiece.deleteMany({
      $or: [{ purchaseBillId: id }, { purchaseBillId: bill._id }],
      tenantId
    });

    // 3. Delete purchase items
    await PurchaseItem.deleteMany({
      $or: [{ purchaseBillId: id }, { purchaseBillId: bill._id }],
      tenantId
    });

    // 4. Delete Purchase Bill record
    await PurchaseBill.deleteOne({ _id: id, tenantId });

    return { success: true, message: 'Purchase bill deleted successfully.' };
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

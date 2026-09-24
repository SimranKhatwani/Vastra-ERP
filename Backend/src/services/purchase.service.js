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
      const typeOfGst = String(item.typeOfGst || 'E').toUpperCase().trim();
      const typeOfGstNormalized = ['I', 'E'].includes(typeOfGst) ? typeOfGst : 'E';

      const gstStatus = String(item.gstStatus || '').trim();

      const discountStatus = String(item.discountStatus || 'N').toUpperCase().trim();
      const discountStatusNormalized = ['B', 'A', 'N'].includes(discountStatus) ? discountStatus : 'N';

      let product = null;
      if (item.productId && typeof item.productId === 'string' && item.productId.length === 24) {
        product = await Product.findOne({ _id: item.productId, tenantId });
      }

      if (product) {
        let updated = false;
        if (product.typeOfGst !== typeOfGstNormalized) {
          product.typeOfGst = typeOfGstNormalized;
          updated = true;
        }
        if (gstStatus && product.gstStatus !== gstStatus) {
          product.gstStatus = gstStatus;
          updated = true;
        }
        if (product.discountStatus !== discountStatusNormalized) {
          product.discountStatus = discountStatusNormalized;
          updated = true;
        }
        if (updated) {
          await product.save();
        }
      }

      if (!product) {
        const Brand = require('../models/masters/Brand');
        const Category = require('../models/masters/Category');
        const brandName = item.brand || 'GENERIC BRAND';
        const categoryName = item.category || item.itemName || item.subItem || 'FABRIC SUIT';

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
          typeOfGst: typeOfGstNormalized,
          gstStatus: gstStatus,
          discountStatus: discountStatusNormalized,
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
        lineTotal,
        typeOfGst: typeOfGstNormalized,
        gstStatus: gstStatus,
        discountStatus: discountStatusNormalized
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
        typeOfGst: item.typeOfGst,
        gstStatus: item.gstStatus,
        discountStatus: item.discountStatus,
        lineTotal: item.lineTotal,
        createdBy: userId
      });

      // Generate 1 Document for each quantity unit
      for (let i = 1; i <= item.qty; i++) {
        const barcode = item.product?.barcode || item.barcode || '';
        const uniqueCode = item.product?.uniqueCode || item.uniqueCode || '';
        const ipn = item.ipn || '';

        const piece = await InventoryPiece.create({
          tenantId,
          productId: item.productId,
          purchaseBillId: purchaseBill._id,
          purchaseItemId: purchaseItem._id,
          warehouseId,
          firmId,
          barcode,
          uniqueCode,
          ipn,
          primaryColor: item.primaryColor,
          secondaryColor: item.secondaryColor,
          size: item.size,
          purchaseRate: item.purchaseRate,
          wspAfterGST: item.purchaseRate * (1 + (item.taxRate || 0) / 100),
          mrp: item.mrp,
          rack: item.rack,
          typeOfGst: item.typeOfGst,
          gstStatus: item.gstStatus,
          discountStatus: item.discountStatus,
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
      PurchaseItem.find({ purchaseBillId: billId }).populate({
        path: 'productId',
        populate: { path: 'brandId categoryId hsnId firmId' }
      }),
      InventoryPiece.find({ purchaseBillId: billId }).select('barcode uniqueCode status mrp purchaseRate size ipn primaryColor secondaryColor batch counter typeOfGst gstStatus discountStatus purchaseItemId productId')
    ]);

    const enrichedItems = items.map(item => {
      const prd = item.productId || {};
      const piece = pieces.find(p => String(p.purchaseItemId) === String(item._id)) ||
                    pieces.find(p => String(p.productId) === String(prd._id) && p.size === item.size) ||
                    pieces[0] || {};

      const qty = item.qty || 1;
      const rate = item.purchaseRate ?? prd.purchaseRate ?? prd.purchasePrice ?? 0;
      const taxRate = item.taxRate ?? prd.gstRate ?? 5;
      const typeOfGst = item.typeOfGst || prd.typeOfGst || "E";
      const lineTotal = item.lineTotal || (qty * rate);
      const wspAfterGst = (typeOfGst === "E") ? rate * (1 + taxRate / 100) : rate;

      const brandName = prd.brandId?.name || prd.brand || "GENERIC BRAND";
      const categoryName = prd.categoryId?.name || prd.category || prd.itemName || "Garment Item";
      const hsnCode = prd.hsnId?.hsnCode || prd.hsnId?.code || prd.hsnCode || prd.hsn || "5208";
      const discount = item.discount || 0;

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
        calculatedTaxable: lineTotal,
        amount: lineTotal
      };
    });

    billObj.id = billObj._id;
    billObj.items = enrichedItems;
    billObj.billItems = enrichedItems;
    billObj.products = enrichedItems;
    billObj.supplierName = billObj.vendorId?.name || billObj.vendorId?.businessName || billObj.vendorName || "Wholesaler";
    billObj.vendorName = billObj.supplierName;
    billObj.poNo = billObj.billNo;
    billObj.invoiceNo = billObj.billNo;
    billObj.grandTotal = billObj.totalAmount;
    billObj.subTotal = billObj.totalAmount;
    billObj.date = billObj.billDate || billObj.createdAt;
    billObj.firm = billObj.firmId?.name || billObj.firmName || (enrichedItems[0]?.firm) || "RANGOLI ENTERPRISES";
    billObj.firmName = billObj.firm;

    return billObj;
  }

  static async updatePurchaseBill(id, billData, userId, tenantId) {
    const purchaseBill = await PurchaseBill.findOne({ _id: id, tenantId, isDeleted: false });
    if (!purchaseBill) throw new ApiError(404, 'Purchase Bill not found.');

    const rawItems = billData.items || billData.billItems || billData.products || billData.rows || [];
    const billNo = billData.billNo || billData.poNo || billData.invoiceNo || purchaseBill.billNo;

    let vendorId = billData.vendorId || billData.supplierId || purchaseBill.vendorId;
    const vendorName = billData.vendorName || billData.supplierName;
    if (vendorName) {
      const Vendor = require('../models/masters/Vendor');
      let vendor = await Vendor.findOne({ tenantId, name: new RegExp(`^${String(vendorName).trim()}$`, 'i') });
      if (!vendor) {
        vendor = await Vendor.create({ tenantId, name: String(vendorName).trim(), vendorCode: String(vendorName).trim().substring(0, 8).toUpperCase() });
      }
      vendorId = vendor._id;
    }

    let firmId = billData.firmId || purchaseBill.firmId;
    const firmName = billData.firmName || billData.firm;
    if (firmName) {
      const Firm = require('../models/masters/Firm');
      let firm = await Firm.findOne({ tenantId, name: new RegExp(`^${String(firmName).trim()}$`, 'i') });
      if (!firm) {
        firm = await Firm.create({ tenantId, name: String(firmName).trim() });
      }
      firmId = firm._id;
    }

    purchaseBill.billNo = billNo;
    purchaseBill.billDate = billData.billDate || billData.date || purchaseBill.billDate;
    purchaseBill.vendorId = vendorId;
    purchaseBill.firmId = firmId;
    purchaseBill.discount = Number(billData.discount ?? billData.gstTotal ?? purchaseBill.discount ?? 0);
    purchaseBill.gst = Number(billData.gst ?? billData.gstTotal ?? purchaseBill.gst ?? 0);
    purchaseBill.totalAmount = Number(billData.grandTotal ?? billData.totalAmount ?? purchaseBill.totalAmount ?? 0);
    if (billData.remarks) purchaseBill.remarks = billData.remarks;
    if (billData.status) purchaseBill.status = billData.status;

    await purchaseBill.save();

    if (rawItems && rawItems.length > 0) {
      const Brand = require('../models/masters/Brand');
      const Category = require('../models/masters/Category');
      const HSN = require('../models/masters/HSN');

      await InventoryLifecycle.deleteMany({
        $or: [{ referenceId: purchaseBill._id }, { referenceId: id }],
        tenantId
      });
      await InventoryPiece.deleteMany({
        purchaseBillId: purchaseBill._id,
        tenantId
      });
      await PurchaseItem.deleteMany({
        purchaseBillId: purchaseBill._id,
        tenantId
      });

      for (const item of rawItems) {
        const typeOfGst = String(item.typeOfGst || 'E').toUpperCase().trim();
        const typeOfGstNormalized = ['I', 'E'].includes(typeOfGst) ? typeOfGst : 'E';
        const gstStatus = String(item.gstStatus || '').trim();
        const discountStatus = String(item.discountStatus || 'N').toUpperCase().trim();
        const discountStatusNormalized = ['B', 'A', 'N'].includes(discountStatus) ? discountStatus : 'N';

        const brandName = item.brand || 'GENERIC BRAND';
        const categoryName = item.category || item.itemName || item.subItem || 'FABRIC SUIT';
        const designNo = String(item.designNo || 'DSG-001').trim();
        const itemCode = String(item.itemCode || `ITEM-${designNo}`).trim();
        const itemName = String(item.itemName || item.name || `${brandName} ${designNo}`).trim();
        const subItem = String(item.subItem || item.subCategory || '').trim();
        const hsnCode = String(item.hsnCode || item.hsn || '').trim();

        let brand = await Brand.findOne({ tenantId, name: new RegExp(`^${brandName}$`, 'i') });
        if (!brand) {
          brand = await Brand.create({ tenantId, name: brandName, code: brandName.substring(0, 4).toUpperCase() });
        }

        let category = await Category.findOne({ tenantId, name: new RegExp(`^${categoryName}$`, 'i') });
        if (!category) {
          category = await Category.create({ tenantId, name: categoryName, code: categoryName.substring(0, 4).toUpperCase() });
        }

        let hsn = null;
        if (hsnCode) {
          hsn = await HSN.findOne({ tenantId, hsnCode: new RegExp(`^${hsnCode}$`, 'i') });
          if (!hsn) {
            hsn = await HSN.create({ tenantId, hsnCode, description: 'HSN code' });
          }
        }

        let product = null;
        if (item.productId && typeof item.productId === 'string' && item.productId.length === 24) {
          product = await Product.findOne({ _id: item.productId, tenantId });
        }
        if (!product) {
          product = await Product.findOne({ tenantId, designNo, brandId: brand._id });
        }

        const qty = Number(item.quantity || item.qty || 1);
        const purchaseRate = Number(item.purchaseRate || item.purchasePrice || item.rate || 0);
        const mrp = Number(item.mrp || item.sellingPrice || purchaseRate);
        const discount = Number(item.discount || item.discountOnPurchase || 0);
        const taxRate = Number(item.taxRate || item.gstOnPurchase || 0);
        const size = item.size || "FS";
        const color = item.color || item.colorPrimary || "Standard";
        const batch = item.batch || "";
        const counter = item.counter || "";
        const barcode = item.barcode || (product?.barcode) || generateBarcode(tenantId, 'VST');
        const uniqueCode = item.uniqueCode || (product?.uniqueCode) || generateUniqueCode(designNo, size, 1);
        const lineTotal = item.calculatedTaxable ?? item.totalPrice ?? (qty * purchaseRate - discount);

        if (product) {
          product.itemName = itemName;
          product.subItem = subItem;
          product.brandId = brand._id;
          product.categoryId = category._id;
          if (hsn) product.hsnId = hsn._id;
          product.batch = batch || product.batch;
          product.counter = counter || product.counter;
          product.defaultMRP = mrp;
          product.purchaseRate = purchaseRate;
          product.typeOfGst = typeOfGstNormalized;
          product.gstStatus = gstStatus;
          product.discountStatus = discountStatusNormalized;
          product.barcode = barcode;
          await product.save();
        } else {
          product = await Product.create({
            tenantId,
            designNo,
            itemCode,
            itemName,
            subItem,
            brandId: brand._id,
            categoryId: category._id,
            hsnId: hsn ? hsn._id : undefined,
            firmId,
            firmName: firmName || 'RANGOLI ENTERPRISES',
            barcode,
            uniqueCode,
            gender: item.gender || 'UNISEX',
            topBottomSet: item.topBottomSet || 'TOP',
            batch,
            counter,
            defaultMRP: mrp,
            purchaseRate,
            typeOfGst: typeOfGstNormalized,
            gstStatus: gstStatus,
            discountStatus: discountStatusNormalized,
            createdBy: userId
          });
        }

        const purchaseItem = await PurchaseItem.create({
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
          gstStatus: gstStatus,
          discountStatus: discountStatusNormalized,
          lineTotal,
          createdBy: userId
        });

        for (let i = 1; i <= qty; i++) {
          const piece = await InventoryPiece.create({
            tenantId,
            productId: product._id,
            purchaseBillId: purchaseBill._id,
            purchaseItemId: purchaseItem._id,
            warehouseId: purchaseBill.warehouseId,
            firmId,
            barcode: (i === 1 && barcode) ? barcode : generateBarcode(tenantId, 'VST'),
            uniqueCode: (i === 1 && uniqueCode) ? uniqueCode : generateUniqueCode(designNo, size, i),
            ipn: item.ipn || `${product.itemCode}-${size}`,
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
            gstStatus: gstStatus,
            discountStatus: discountStatusNormalized,
            status: INVENTORY_STATUS.AVAILABLE,
            currentLocation: 'WAREHOUSE',
            createdBy: userId
          });

          await InventoryLifecycle.create({
            tenantId,
            inventoryPieceId: piece._id,
            barcode: piece.barcode,
            eventType: LIFECYCLE_EVENT.PURCHASE,
            toLocation: 'WAREHOUSE',
            referenceId: purchaseBill._id,
            referenceModel: 'PurchaseBill',
            performedBy: userId,
            notes: `Purchase Bill Updated: ${purchaseBill.billNo}`
          });
        }
      }
    }

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

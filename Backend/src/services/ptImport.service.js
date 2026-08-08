const mongoose = require('mongoose');
const ApiError = require('../helpers/ApiError');
const Vendor = require('../models/masters/Vendor');
const Brand = require('../models/masters/Brand');
const Category = require('../models/masters/Category');
const Firm = require('../models/masters/Firm');
const Warehouse = require('../models/masters/Warehouse');
const Product = require('../models/Product');
const PurchaseBill = require('../models/purchase/PurchaseBill');
const PurchaseItem = require('../models/purchase/PurchaseItem');
const InventoryPiece = require('../models/InventoryPiece');
const InventoryLifecycle = require('../models/InventoryLifecycle');
const PTImportHistory = require('../models/PTImportHistory');
const { generateBarcode, generateUniqueCode } = require('../helpers/barcodeGenerator');
const { INVENTORY_STATUS, LIFECYCLE_EVENT } = require('../constants/status');

/**
 * Flexible column key resolver matching exact or case-insensitive column names from client PT Excel sheets
 */
const getVal = (row, ...keys) => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return row[k];
    }
  }
  // Case-insensitive & trimmed key lookup
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const target = k.trim().toLowerCase();
    const matchedKey = rowKeys.find(rk => rk.trim().toLowerCase() === target);
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== '') {
      return row[matchedKey];
    }
  }
  return '';
};

class PTImportService {
  /**
   * PT Excel Import Engine
   * Each row represents ONE physical inventory piece.
   */
  static async processImportRows(rows = [], defaultWarehouseId, defaultFirmId, userId, tenantId) {
    if (!rows || !rows.length) {
      throw new ApiError(400, 'Import file contains no data rows.');
    }

    // Enable Mongoose query debugging for full visibility
    mongoose.set('debug', true);

    const session = await mongoose.startSession();

    const summary = {
      total: rows.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    const purchaseBillIds = [];
    const inventoryPieceIds = [];
    const purchaseItemIds = [];

    // Track row context for debugging
    let currentRowCtx = { rowNum: 0, barcode: '', itemCode: '', billNo: '', ipn: '' };

    try {
      session.startTransaction();
      console.log(`[TRANSACTION START] Starting PT Import Session. inTransaction: ${session.inTransaction()}`);

      // 1. Ensure default warehouse exists INSIDE session
      console.log('BEFORE Default Warehouse Lookup');
      let warehouse = null;
      try {
        if (defaultWarehouseId) {
          warehouse = await Warehouse.findOne({ _id: defaultWarehouseId, tenantId }).session(session);
        }
        if (!warehouse) {
          warehouse = await Warehouse.findOne({ tenantId, isDeleted: false }).session(session);
        }
        if (!warehouse) {
          console.log('BEFORE Default Warehouse Creation');
          const createdWh = await Warehouse.create([{
            tenantId,
            name: 'Main Warehouse',
            code: 'WH-MAIN',
            address: 'Headquarters'
          }], { session });
          warehouse = createdWh[0];
          console.log('AFTER Default Warehouse Creation');
        }
        console.log(`AFTER Default Warehouse Lookup. inTransaction: ${session.inTransaction()}`);
      } catch (err) {
        console.error('FAILED AT STEP: Default Warehouse Lookup/Creation');
        console.error(err);
        throw err;
      }

      // 2. Ensure default firm exists INSIDE session
      console.log('BEFORE Default Firm Lookup');
      let defaultFirm = null;
      try {
        if (defaultFirmId) {
          defaultFirm = await Firm.findOne({ _id: defaultFirmId, tenantId }).session(session);
        }
        if (!defaultFirm) {
          defaultFirm = await Firm.findOne({ tenantId, isDeleted: false }).session(session);
        }
        if (!defaultFirm) {
          console.log('BEFORE Default Firm Creation');
          const createdFirm = await Firm.create([{
            tenantId,
            name: 'Primary Store Firm',
            code: 'FIRM-MAIN'
          }], { session });
          defaultFirm = createdFirm[0];
          console.log('AFTER Default Firm Creation');
        }
        console.log(`AFTER Default Firm Lookup. inTransaction: ${session.inTransaction()}`);
      } catch (err) {
        console.error('FAILED AT STEP: Default Firm Lookup/Creation');
        console.error(err);
        throw err;
      }

      // Cache lookup maps for high performance inside transaction session
      const vendorCache = new Map();
      const brandCache = new Map();
      const categoryCache = new Map();
      const productCache = new Map();
      const billCache = new Map();
      const firmCache = new Map();
      const processedBarcodesSet = new Set();

      let rowIndex = 0;
      for (const row of rows) {
        rowIndex++;
        const rowNum = rowIndex + 1; // 1-indexed header

        // Extract fields using flexible key mapping
        const billNo = String(getVal(row, 'Bill number', 'Bill No', 'billNo', 'Bill Number') || `BILL-${Date.now()}`).trim();
        const rawBillDate = getVal(row, 'Bill date', 'Bill Date', 'billDate');
        const billDate = rawBillDate ? new Date(rawBillDate) : new Date();

        const vendorName = String(getVal(row, 'vendor name', 'Vendor', 'vendor', 'Vendor Name') || 'K.R CHHABRA AND CO.').trim();
        const vendorCode = String(getVal(row, 'Vendor Code', 'vendorCode', 'Vendor code') || vendorName.substring(0, 8).toUpperCase()).trim();
        const vendorGst = String(getVal(row, 'Vendor GST', 'vendorGst', 'Vendor GSTIN') || '').trim();

        const brandName = String(getVal(row, 'Brand', 'brand', 'Brand Name') || 'GENERIC BRAND').trim();
        const categoryName = String(getVal(row, 'Category', 'category', 'Item name', 'ITEM NAME') || 'GENERAL').trim();

        const designNo = String(getVal(row, 'DesignNo', 'Design No', 'designNo', 'Design') || 'DSG-001').trim();
        const itemCode = String(getVal(row, 'ITEM CODE', 'Item Code', 'itemCode') || `ITEM-${designNo}`).trim();
        const itemName = String(getVal(row, 'Item name', 'Item Name', 'itemName') || `${brandName} ${designNo}`).trim();
        const subItem = String(getVal(row, 'SUB ITEM NAME', 'Sub Item', 'subItem', 'Sub Item Name') || '').trim();

        const size = String(getVal(row, 'Size', 'size') || 'FREE').trim();
        const mrp = parseFloat(getVal(row, 'MRP', 'mrp') || 0);
        const purchaseRate = parseFloat(getVal(row, 'P. RATE', 'P.Rate', 'Purchase Rate', 'purchaseRate') || 0);
        const wspAfterGST = parseFloat(getVal(row, 'WSP AFTER GST', 'wspAfterGST', 'WSP After GST') || purchaseRate);
        const discount = parseFloat(getVal(row, 'dis. On purchase', 'Discount', 'discount', 'Dis. On purchase') || 0);
        const rawGst = String(getVal(row, 'GST ON PURCHASE', 'GST On Purchase', 'gstOnPurchase') || '').replace(/[^0-9.]/g, '');
        const taxRate = parseFloat(rawGst) || 0;

        // Auto-calculate qty (default 1 per PT row) and lineTotal
        const qty = parseInt(getVal(row, 'Total Qty.', 'Total Qty', 'totalQty', 'qty'), 10) || 1;
        const lineTotal = (purchaseRate * qty) - discount > 0 ? (purchaseRate * qty) - discount : (purchaseRate * qty);

        const inputBarcode = String(getVal(row, 'Barcode No', 'Barcode', 'barcode', 'BarcodeNo') || '').trim();
        const inputUniqueCode = String(getVal(row, 'UNIQUE CODE', 'Unique Code', 'uniqueCode') || '').trim();
        const ipn = String(getVal(row, 'IPN', 'ipn') || inputBarcode).trim();
        const batch = String(getVal(row, 'BATCH', 'Batch', 'batch') || '').trim();
        const primaryColor = String(getVal(row, 'Color(P)', 'Primary Color', 'primaryColor', 'Color P') || '').trim();
        const secondaryColor = String(getVal(row, 'COLOR(S)', 'Secondary Color', 'secondaryColor', 'Color S') || '').trim();
        const gender = String(getVal(row, 'GROUP 3 (GENDER)', 'Gender', 'gender') || 'FEMALE').trim().toUpperCase();
        const topBottomSet = String(getVal(row, 'Group 1(Top/Bottom/SET)', 'Top Bottom Set', 'topBottomSet') || 'TOP').trim().toUpperCase();
        const firmName = String(getVal(row, 'firm', 'Firm', 'firmName') || '').trim();

        const barcode = inputBarcode || generateBarcode(tenantId);
        const uniqueCode = inputUniqueCode || generateUniqueCode(designNo, size, rowIndex);

        currentRowCtx = { rowNum, barcode, itemCode, billNo, ipn };

        // Validate Row Data
        if (!mrp || mrp <= 0) {
          summary.failed++;
          summary.errors.push({ row: rowNum, error: `Invalid or missing MRP on row ${rowNum}` });
          continue;
        }

        if (processedBarcodesSet.has(barcode)) {
          summary.skipped++;
          summary.errors.push({ row: rowNum, error: `Duplicate barcode '${barcode}' in batch skipped.` });
          continue;
        }

        // Firm Management
        let firm = defaultFirm;
        if (firmName) {
          try {
            console.log(`BEFORE Firm lookup/creation: ${firmName}`);
            let cachedFirm = firmCache.get(firmName.toUpperCase());
            if (!cachedFirm) {
              cachedFirm = await Firm.findOne({ tenantId, name: new RegExp(`^${firmName}$`, 'i') }).session(session);
              if (!cachedFirm) {
                const created = await Firm.create([{
                  tenantId,
                  name: firmName,
                  code: firmName.substring(0, 6).toUpperCase()
                }], { session });
                cachedFirm = created[0];
              }
              firmCache.set(firmName.toUpperCase(), cachedFirm);
            }
            firm = cachedFirm;
            console.log(`AFTER Firm lookup/creation: ${firm._id}. inTransaction: ${session.inTransaction()}`);
          } catch (err) {
            console.error('FAILED AT STEP: Firm Management');
            console.error(err);
            throw err;
          }
        }

        // Vendor Management
        let vendor = vendorCache.get(vendorName.toUpperCase());
        if (!vendor) {
          try {
            console.log(`BEFORE Vendor lookup/creation: ${vendorName}`);
            vendor = await Vendor.findOne({ tenantId, name: new RegExp(`^${vendorName}$`, 'i') }).session(session);
            if (!vendor) {
              const created = await Vendor.create([{
                tenantId,
                name: vendorName,
                code: vendorCode,
                phone: 'N/A',
                gstin: vendorGst
              }], { session });
              vendor = created[0];
            }
            vendorCache.set(vendorName.toUpperCase(), vendor);
            console.log(`AFTER Vendor lookup/creation: ${vendor._id}. inTransaction: ${session.inTransaction()}`);
          } catch (err) {
            console.error('FAILED AT STEP: Vendor Management');
            console.error(err);
            throw err;
          }
        }

        // Brand Management
        let brand = brandCache.get(brandName.toUpperCase());
        if (!brand) {
          try {
            console.log(`BEFORE Brand lookup/creation: ${brandName}`);
            brand = await Brand.findOne({ tenantId, name: new RegExp(`^${brandName}$`, 'i') }).session(session);
            if (!brand) {
              const created = await Brand.create([{ tenantId, name: brandName, code: brandName.substring(0, 4).toUpperCase() }], { session });
              brand = created[0];
            }
            brandCache.set(brandName.toUpperCase(), brand);
            console.log(`AFTER Brand lookup/creation: ${brand._id}. inTransaction: ${session.inTransaction()}`);
          } catch (err) {
            console.error('FAILED AT STEP: Brand Management');
            console.error(err);
            throw err;
          }
        }

        // Category Management
        let category = categoryCache.get(categoryName.toUpperCase());
        if (!category) {
          try {
            console.log(`BEFORE Category lookup/creation: ${categoryName}`);
            category = await Category.findOne({ tenantId, name: new RegExp(`^${categoryName}$`, 'i') }).session(session);
            if (!category) {
              const created = await Category.create([{ tenantId, name: categoryName, code: categoryName.substring(0, 4).toUpperCase() }], { session });
              category = created[0];
            }
            categoryCache.set(categoryName.toUpperCase(), category);
            console.log(`AFTER Category lookup/creation: ${category._id}. inTransaction: ${session.inTransaction()}`);
          } catch (err) {
            console.error('FAILED AT STEP: Category Management');
            console.error(err);
            throw err;
          }
        }

        // Product Catalog Management (Keyed by unique itemCode constraint)
        const productKey = itemCode.toUpperCase();
        let product = productCache.get(productKey);
        if (!product) {
          try {
            console.log(`BEFORE Product lookup/creation: ${itemCode}`);
            product = await Product.findOne({ tenantId, itemCode: new RegExp(`^${itemCode}$`, 'i') }).session(session);
            if (!product) {
              const created = await Product.create([{
                tenantId,
                designNo,
                itemCode,
                itemName,
                subItem,
                brandId: brand._id,
                categoryId: category._id,
                gender: ['MEN', 'WOMEN', 'KIDS', 'UNISEX'].includes(gender) ? gender : 'UNISEX',
                topBottomSet: ['TOP', 'BOTTOM', 'SET', 'ACCESSORY', 'OTHER'].includes(topBottomSet) ? topBottomSet : 'TOP',
                defaultMRP: mrp
              }], { session });
              product = created[0];
            }
            productCache.set(productKey, product);
            console.log(`AFTER Product lookup/creation: ${product._id}. inTransaction: ${session.inTransaction()}`);
          } catch (err) {
            console.error('FAILED AT STEP: Product Management');
            console.error(err);
            throw err;
          }
        }

        // Purchase Bill Management - Each import upload session creates a distinct PurchaseBill
        let purchaseBill = billCache.get(billNo.toUpperCase());
        if (!purchaseBill) {
          try {
            console.log(`BEFORE PurchaseBill creation: ${billNo}`);
            const existingBill = await PurchaseBill.findOne({ tenantId, billNo: new RegExp(`^${billNo}$`, 'i') }).session(session);
            let targetBillNo = billNo;
            if (existingBill) {
              targetBillNo = `${billNo}-${Date.now().toString().slice(-4)}`;
            }
            const created = await PurchaseBill.create([{
              tenantId,
              billNo: targetBillNo,
              vendorId: vendor._id,
              firmId: firm._id,
              warehouseId: warehouse._id,
              billDate,
              totalAmount: 0,
              status: 'APPROVED'
            }], { session });
            purchaseBill = created[0];
            billCache.set(billNo.toUpperCase(), purchaseBill);
            console.log(`AFTER PurchaseBill creation: ${purchaseBill._id}. inTransaction: ${session.inTransaction()}`);
          } catch (err) {
            console.error('FAILED AT STEP: PurchaseBill Management');
            console.error(err);
            throw err;
          }
        }

        if (purchaseBill && !purchaseBillIds.some(id => id.toString() === purchaseBill._id.toString())) {
          purchaseBillIds.push(purchaseBill._id);
        }

        // Barcode Check in DB
        try {
          console.log(`BEFORE InventoryPiece barcode check: ${barcode}`);
          const existingBarcode = await InventoryPiece.findOne({ tenantId, barcode }).session(session);
          console.log(`AFTER InventoryPiece barcode check: ${barcode}. inTransaction: ${session.inTransaction()}`);
          if (existingBarcode) {
            summary.skipped++;
            summary.errors.push({ row: rowNum, error: `Duplicate barcode '${barcode}' in DB skipped.` });
            continue;
          }
        } catch (err) {
          console.error('FAILED AT STEP: InventoryPiece barcode check');
          console.error(err);
          throw err;
        }

        // Create Purchase Item
        let purchaseItem;
        try {
          console.log(`BEFORE PurchaseItem.create: Barcode: ${barcode}, Product: ${product._id}`);
          const created = await PurchaseItem.create([{
            tenantId,
            purchaseBillId: purchaseBill._id,
            productId: product._id,
            size,
            qty,
            purchaseRate,
            mrp,
            discount,
            taxRate,
            color: primaryColor,
            lineTotal
          }], { session });
          purchaseItem = created[0];
          purchaseItemIds.push(purchaseItem._id);
          console.log(`AFTER PurchaseItem.create: ${purchaseItem._id}. inTransaction: ${session.inTransaction()}`);
        } catch (err) {
          console.error('FAILED AT STEP: PurchaseItem.create');
          console.error(err);
          throw err;
        }

        // Create Inventory Piece
        let inventoryPiece;
        try {
          console.log(`BEFORE InventoryPiece.create: Barcode: ${barcode}`);
          const created = await InventoryPiece.create([{
            tenantId,
            productId: product._id,
            purchaseBillId: purchaseBill._id,
            purchaseItemId: purchaseItem._id,
            warehouseId: warehouse._id,
            firmId: firm._id,
            barcode,
            uniqueCode,
            batch,
            ipn,
            primaryColor,
            secondaryColor,
            size,
            purchaseRate,
            wspAfterGST,
            mrp,
            status: INVENTORY_STATUS.AVAILABLE,
            sold: false
          }], { session });
          inventoryPiece = created[0];
          inventoryPieceIds.push(inventoryPiece._id);
          console.log(`AFTER InventoryPiece.create: ${inventoryPiece._id}. inTransaction: ${session.inTransaction()}`);
        } catch (err) {
          console.error('FAILED AT STEP: InventoryPiece.create');
          console.error(err);
          throw err;
        }

        // Record Inventory Lifecycle Event
        try {
          console.log(`BEFORE InventoryLifecycle.create: Barcode: ${barcode}`);
          await InventoryLifecycle.create([{
            tenantId,
            inventoryPieceId: inventoryPiece._id,
            barcode,
            eventType: LIFECYCLE_EVENT.PURCHASE,
            fromLocation: `Vendor:${vendor.name}`,
            toLocation: `Warehouse:${warehouse.name}`,
            referenceId: purchaseBill._id,
            referenceModel: 'PurchaseBill',
            performedBy: userId,
            notes: `PT Excel Import row ${rowNum}`
          }], { session });
          console.log(`AFTER InventoryLifecycle.create: Barcode: ${barcode}. inTransaction: ${session.inTransaction()}`);
        } catch (err) {
          console.error('FAILED AT STEP: InventoryLifecycle.create');
          console.error(err);
          throw err;
        }

        // Update Purchase Bill Total using atomic $inc operator
        try {
          console.log(`BEFORE PurchaseBill.updateOne: BillNo: ${billNo}, incTotal: ${lineTotal}`);
          await PurchaseBill.updateOne(
            { _id: purchaseBill._id },
            { $inc: { totalAmount: lineTotal } },
            { session }
          );
          console.log(`AFTER PurchaseBill.updateOne: BillNo: ${billNo}. inTransaction: ${session.inTransaction()}`);
        } catch (err) {
          console.error('FAILED AT STEP: PurchaseBill.updateOne');
          console.error(err);
          throw err;
        }

        processedBarcodesSet.add(barcode);
        summary.inserted++;
      }

      // Create PTImportHistory log
      const importHistory = await PTImportHistory.create([{
        tenantId,
        fileName: 'manual-import',
        totalRows: rows.length,
        inserted: summary.inserted,
        updated: summary.updated,
        skipped: summary.skipped,
        failed: summary.failed,
        errors: summary.errors,
        importStatus: 'COMPLETED',
        importedBy: userId,
        purchaseBillIds,
        inventoryPieceIds,
        purchaseItemIds,
        importedRows: rows
      }], { session });

      summary.importId = importHistory[0]._id;

      console.log('BEFORE commitTransaction');
      await session.commitTransaction();
      console.log('AFTER commitTransaction - PT Import Completed Successfully!');
      return summary;
    } catch (err) {
      console.error('===== ROOT ERROR =====');
      console.error(`Failing Row Context -> Row: ${currentRowCtx.rowNum}, Barcode: ${currentRowCtx.barcode}, ItemCode: ${currentRowCtx.itemCode}, BillNo: ${currentRowCtx.billNo}, IPN: ${currentRowCtx.ipn}`);
      console.error(err);
      console.error(err.message);
      console.error(err.stack);
      if (err.errors) console.error(err.errors);
      console.error('======================');

      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (!session.hasEnded) {
        await session.endSession();
      }
    }
  }

  static async validatePTExcel(rows, tenantId) {
    if (!rows || !rows.length) throw new ApiError(400, 'No rows to validate');
    return { valid: true, message: 'Structure looks valid', rowCount: rows.length };
  }

  static async getTemplate() {
    return {
      headers: ['S.No', 'Date', 'Type of Purchase', 'Vendor Code', 'ItemCode', 'Barcode', 'IPN', 'Qty', 'Pcs', 'Rate', 'Value', 'Discount', 'Tax', 'Net Amount', 'Sales Price', 'Warehouse', 'Firm', 'Brand', 'Category'],
      sampleRow: [1, '2023-10-01', 'B2B', 'V-001', 'ITEM-123', 'BC-999', 'IPN-555', 1, 1, 100, 100, 0, 5, 105, 150, 'WH-MAIN', 'FIRM-001', 'BRAND-A', 'CAT-A']
    };
  }

  static async getHistory(query, tenantId) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = {
      $or: [{ tenantId }, { tenantId: { $exists: false } }, { tenantId: null }]
    };
    const history = await PTImportHistory.find(filter)
      .populate('importedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await PTImportHistory.countDocuments(filter);
    return { items: history, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  static async getById(id, tenantId) {
    const record = await PTImportHistory.findOne({ _id: id, tenantId }).populate('importedBy', 'name email');
    if (!record) throw new ApiError(404, 'Import record not found');
    return record;
  }

  static async rollbackImport(id, userId, tenantId) {
    const record = await PTImportHistory.findOne({ _id: id, tenantId });
    if (!record) throw new ApiError(404, 'Import record not found');
    if (record.status === 'ROLLED_BACK') throw new ApiError(400, 'Already rolled back');

    await InventoryPiece.updateMany({ _id: { $in: record.inventoryPieceIds }, tenantId }, { $set: { isDeleted: true } });
    
    record.status = 'ROLLED_BACK';
    record.rolledBackAt = new Date();
    record.rolledBackBy = userId;
    await record.save();
    
    return { message: 'Rollback successful' };
  }
}

module.exports = PTImportService;

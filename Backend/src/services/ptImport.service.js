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

const escapeRegExp = (string) => {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

class PTImportService {
  /**
   * PT Excel Import Engine
   * Each row represents ONE physical inventory piece.
   */
  static async processImportWorkbook(workbookData, defaultWarehouseId, defaultFirmId, userId, tenantId) {
    let rows = [];
    let vendorDataRows = [];
    if (workbookData) {
      rows = workbookData['RE_350'] || workbookData['Default'] || Object.values(workbookData)[0] || [];
      if (workbookData['Vendor Data']) {
         vendorDataRows = workbookData['Vendor Data'];
      }
    }

    if (!rows || !rows.length) {
      throw new ApiError(400, 'Import file contains no data rows.');
    }

    // Always start a session; transaction will be started only if replica set supports it
    const isTxnSupported = mongoose.connection?.client?.topology?.description?.type === 'ReplicaSet';
    const session = await mongoose.startSession();
    if (isTxnSupported) {
      await session.startTransaction();
    }

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
// Removed redundant transaction start; already started above if supported
      console.log(`[TRANSACTION START] Starting PT Import Session. inTransaction: ${session.inTransaction()}`);

      // 1. Ensure default warehouse exists INSIDE session
      console.log('BEFORE Default Warehouse Lookup');
      let warehouse = null;
      try {
        if (defaultWarehouseId) {
          warehouse = await Warehouse.findOne({ _id: defaultWarehouseId, tenantId }).session(session);
        }
        if (!warehouse) {
          warehouse = await Warehouse.findOne({ tenantId, name: 'Main Warehouse', includeDeleted: true }).session(session);
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
        } else if (warehouse.isDeleted) {
          warehouse.isDeleted = false;
          warehouse.status = 'ACTIVE';
          await warehouse.save({ session });
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
          defaultFirm = await Firm.findOne({ tenantId, name: 'Primary Store Firm', includeDeleted: true }).session(session);
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
        } else if (defaultFirm.isDeleted) {
          defaultFirm.isDeleted = false;
          defaultFirm.status = 'ACTIVE';
          await defaultFirm.save({ session });
        }
        console.log(`AFTER Default Firm Lookup. inTransaction: ${session.inTransaction()}`);
      } catch (err) {
        console.error('FAILED AT STEP: Default Firm Lookup/Creation');
        console.error(err);
        throw err;
      }
      
      // 1. Initialize PTImportHistory First for batch tracking
      const importHistory = await PTImportHistory.create([{
        tenantId,
        fileName: 'Inline_Mapping_Import',
        fileHash: `manual-import-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        importStatus: 'IN_PROGRESS',
        importedBy: userId
      }], { session });
      const historyId = importHistory[0]._id;

      // Cache lookup maps for high performance inside transaction session
      const vendorCache = new Map();
      const brandCache = new Map();
      const categoryCache = new Map();
      const productCache = new Map();
      const billCache = new Map();
      const firmCache = new Map();
      const processedBarcodesSet = new Set();

      // Phase 1: Pre-process Vendors from Sheet 2/3 (vendorDataRows)
      if (vendorDataRows && vendorDataRows.length > 0) {
        for (const vRow of vendorDataRows) {
          const vName = String(getVal(vRow, 'VENDOR NAME', 'Vendor Name', 'Vendor') || '').trim();
          if (!vName) continue;
          
          const vCode = String(getVal(vRow, 'VENDOR CODE', 'Vendor Code') || vName.substring(0, 8).toUpperCase()).trim();
          const vGst = String(getVal(vRow, 'GST NUMBER', 'GSTIN', 'Vendor GST') || '').trim();
          const vCompany = String(getVal(vRow, 'COMPANY NAME', 'Company Name', 'Firm') || '').trim();
          const vPhone = [getVal(vRow, 'SALES/GENERAL CONTACT', 'Phone', 'Contact'), getVal(vRow, 'LANDLINE CONTACT', 'Landline')].filter(Boolean).join(' / ');
          const vEmail = String(getVal(vRow, 'PRIMARY EMAIL', 'Email') || '').trim();
          const vAddress = String(getVal(vRow, 'OFFICE ADDRESS', 'Address') || '').trim();
          const vCity = String(getVal(vRow, 'CITY', 'City') || '').trim();
          const vState = String(getVal(vRow, 'STATE', 'State') || '').trim();
          const vPincode = String(getVal(vRow, 'PINCODE', 'Pincode') || '').trim();
          const vPan = String(getVal(vRow, 'PAN NUMBER', 'PAN') || '').trim();

          // Try to find by GST first, then Code, then Name
          let vendor = null;
          if (vGst) {
            vendor = await Vendor.findOne({ tenantId, gstin: new RegExp('^' + escapeRegExp(vGst) + '$', 'i'), includeDeleted: true }).session(session);
          }
          if (!vendor && vCode) {
            vendor = await Vendor.findOne({ tenantId, vendorCode: new RegExp('^' + escapeRegExp(vCode) + '$', 'i'), includeDeleted: true }).session(session);
          }
          if (!vendor) {
            vendor = await Vendor.findOne({ tenantId, name: new RegExp('^' + escapeRegExp(vName) + '$', 'i'), includeDeleted: true }).session(session);
          }

          if (!vendor) {
            const created = await Vendor.create([{
              tenantId,
              name: vName,
              vendorCode: vCode,
              gstin: vGst,
              companyName: vCompany,
              phone: vPhone || 'N/A',
              email: vEmail,
              address: vAddress,
              city: vCity,
              state: vState,
              pincode: vPincode,
              panNumber: vPan,
              importBatchId: historyId
            }], { session });
            vendor = created[0];
          } else {
            if (vendor.isDeleted) {
              vendor.isDeleted = false;
              vendor.status = 'ACTIVE';
            }
            // Update existing vendor with rich data
            vendor.name = vName || vendor.name;
            vendor.vendorCode = vCode || vendor.vendorCode;
            vendor.gstin = vGst || vendor.gstin;
            vendor.companyName = vCompany || vendor.companyName;
            if (vPhone) vendor.phone = vPhone;
            vendor.email = vEmail || vendor.email;
            vendor.address = vAddress || vendor.address;
            vendor.city = vCity || vendor.city;
            vendor.state = vState || vendor.state;
            vendor.pincode = vPincode || vendor.pincode;
            vendor.panNumber = vPan || vendor.panNumber;
            await vendor.save({ session });
          }
          
          vendorCache.set(vName.toUpperCase(), vendor);
          if (vGst) vendorCache.set(vGst.toUpperCase(), vendor);
          if (vCode) vendorCache.set(vCode.toUpperCase(), vendor);
        }
      }

      let rowIndex = 0;
      for (const row of rows) {
        rowIndex++;
        const rowNum = rowIndex + 1; // 1-indexed header

        // Extract fields using flexible key mapping
        const billNo = String(getVal(row, 'Bill number', 'Bill No', 'billNo', 'Bill Number') || `BILL-${Date.now()}`).trim();
        const rawBillDate = getVal(row, 'Bill date', 'Bill Date', 'billDate');
        const billDate = rawBillDate ? new Date(rawBillDate) : new Date();

        const vendorName = String(getVal(row, 'vendor name', 'Vendor', 'vendor', 'Vendor Name', 'Supplier') || 'K.R CHHABRA AND CO.').trim();
        const vendorCode = String(getVal(row, 'Vendor Code', 'vendorCode', 'Vendor code') || vendorName.substring(0, 8).toUpperCase()).trim();
        const vendorGst = String(getVal(row, 'Vendor GST', 'vendorGst', 'Vendor GSTIN') || '').trim();

        const firmName = String(getVal(row, 'Firm', 'firm', 'Firm Name', 'Company') || '').trim();
        const brandName = String(getVal(row, 'Brand', 'brand', 'Brand Name') || 'GENERIC BRAND').trim();
        const categoryName = String(getVal(row, 'Category', 'category', 'Item name', 'ITEM NAME') || 'GENERAL').trim();

        const designNo = String(getVal(row, 'DesignNo', 'Design No', 'designNo', 'Design') || 'DSG-001').trim();
        const itemCode = String(getVal(row, 'ITEM CODE', 'Item Code', 'itemCode') || `ITEM-${designNo}`).trim();
        const itemName = String(getVal(row, 'Item name', 'Item Name', 'itemName') || `${brandName} ${designNo}`).trim();
        const subItem = String(getVal(row, 'SUB ITEM NAME', 'Sub Item', 'subItem', 'Sub Item Name') || '').trim();

        const size = String(getVal(row, 'Size', 'size') || 'FREE').trim();
        const primaryColor = String(getVal(row, 'COLOR', 'Color', 'color', 'Primary Color') || '-').trim();
        const secondaryColor = String(getVal(row, 'Secondary Color', 'secondaryColor') || '').trim();

        let mrp = parseFloat(getVal(row, 'MRP', 'mrp', 'Selling Price', 'sellingPrice', 'Sales Price') || 0);
        const purchaseRate = parseFloat(getVal(row, 'P. RATE', 'P.Rate', 'Purchase Rate', 'purchaseRate', 'Rate') || 0);
        if (!mrp || mrp <= 0) {
          mrp = purchaseRate > 0 ? Math.round(purchaseRate * 1.5) : 500;
        }
        const wspAfterGST = parseFloat(getVal(row, 'WSP', 'wsp', 'WSP After GST') || purchaseRate);

        let barcode = String(getVal(row, 'Barcode', 'barcode', 'BARCODE') || '').trim();
        if (!barcode) {
          barcode = generateBarcode();
        }
        let uniqueCode = String(getVal(row, 'Unique Code', 'uniqueCode', 'UNIQUE CODE') || '').trim();
        if (!uniqueCode) {
          uniqueCode = generateUniqueCode();
        }
        let ipn = String(getVal(row, 'IPN', 'ipn', 'IPN No') || '').trim();
        if (!ipn) {
          ipn = `IPN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
        }
        const batch = String(getVal(row, 'Batch', 'batch') || 'DEFAULT').trim();

        const qty = parseInt(getVal(row, 'Qty', 'qty', 'Pcs', 'pcs') || 1);
        const discount = parseFloat(getVal(row, 'Discount', 'discount') || 0);
        const taxRate = parseFloat(getVal(row, 'Tax', 'tax', 'Tax Rate', 'GST') || 0);
        const lineTotal = parseFloat(getVal(row, 'Net Amount', 'netAmount', 'Value', 'lineTotal') || (qty * purchaseRate));

        const gender = String(getVal(row, 'Gender', 'gender') || 'UNISEX').toUpperCase().trim();
        const topBottomSet = String(getVal(row, 'Type', 'topBottomSet', 'Type of Purchase') || 'TOP').toUpperCase().trim();

        currentRowCtx = { rowNum, barcode, itemCode, billNo, ipn };

        if (processedBarcodesSet.has(barcode)) {
          summary.errors.push({ row: rowNum, error: `Duplicate barcode '${barcode}' in batch. A new unique barcode was auto-generated.` });
          barcode = generateBarcode();
          while (processedBarcodesSet.has(barcode)) {
             barcode = generateBarcode();
          }
        }

        // Firm Management
        let firm = defaultFirm;
        if (firmName) {
          try {
            let cachedFirm = firmCache.get(firmName.toUpperCase());
            if (!cachedFirm) {
              cachedFirm = await Firm.findOne({ tenantId, name: new RegExp('^' + escapeRegExp(firmName) + '$', 'i'), includeDeleted: true }).session(session);
              if (!cachedFirm) {
                const created = await Firm.create([{
                  tenantId,
                  name: firmName,
                  code: firmName.substring(0, 6).toUpperCase(),
                  importBatchId: historyId
                }], { session });
                cachedFirm = created[0];
              } else if (cachedFirm.isDeleted) {
                cachedFirm.isDeleted = false;
                cachedFirm.status = 'ACTIVE';
                await cachedFirm.save({ session });
              }
              firmCache.set(firmName.toUpperCase(), cachedFirm);
            }
            firm = cachedFirm;
          } catch (err) {
            console.error('FAILED AT STEP: Firm Management');
            throw err;
          }
        }

        // Vendor Management (Phase 2)
        // vendorGst, vendorCode, vendorName are extracted from the bill row (Sheet 1)
        let vendor = null;
        if (vendorGst) vendor = vendorCache.get(vendorGst.toUpperCase());
        if (!vendor && vendorCode) vendor = vendorCache.get(vendorCode.toUpperCase());
        if (!vendor) vendor = vendorCache.get(vendorName.toUpperCase());

        if (!vendor) {
          try {
            // Check DB directly in case it wasn't cached
            if (vendorGst) {
              vendor = await Vendor.findOne({ tenantId, gstin: new RegExp('^' + escapeRegExp(vendorGst) + '$', 'i'), includeDeleted: true }).session(session);
            }
            if (!vendor && vendorCode) {
              vendor = await Vendor.findOne({ tenantId, vendorCode: new RegExp('^' + escapeRegExp(vendorCode) + '$', 'i'), includeDeleted: true }).session(session);
            }
            if (!vendor) {
              vendor = await Vendor.findOne({ tenantId, name: new RegExp('^' + escapeRegExp(vendorName) + '$', 'i'), includeDeleted: true }).session(session);
            }

            if (!vendor) {
              const created = await Vendor.create([{
                tenantId,
                name: vendorName,
                vendorCode,
                gstin: vendorGst,
                importBatchId: historyId
              }], { session });
              vendor = created[0];
            } else if (vendor.isDeleted) {
              vendor.isDeleted = false;
              vendor.status = 'ACTIVE';
              await vendor.save({ session });
            }
            
            // Cache it so we don't look it up again
            vendorCache.set(vendorName.toUpperCase(), vendor);
            if (vendorGst) vendorCache.set(vendorGst.toUpperCase(), vendor);
            if (vendorCode) vendorCache.set(vendorCode.toUpperCase(), vendor);
          } catch (err) {
            console.error('FAILED AT STEP: Vendor Management');
            throw err;
          }
        }

        // Brand Management
        let brand = brandCache.get(brandName.toUpperCase());
        if (!brand) {
          try {
            brand = await Brand.findOne({ tenantId, name: new RegExp('^' + escapeRegExp(brandName) + '$', 'i'), includeDeleted: true }).session(session);
            if (!brand) {
              const created = await Brand.create([{ tenantId, name: brandName, code: brandName.substring(0, 4).toUpperCase(), importBatchId: historyId }], { session });
              brand = created[0];
            } else if (brand.isDeleted) {
              brand.isDeleted = false;
              brand.status = 'ACTIVE';
              await brand.save({ session });
            }
            brandCache.set(brandName.toUpperCase(), brand);
          } catch (err) {
            console.error('FAILED AT STEP: Brand Management');
            throw err;
          }
        }

        // Category Management
        let category = categoryCache.get(categoryName.toUpperCase());
        if (!category) {
          try {
            category = await Category.findOne({ tenantId, name: new RegExp('^' + escapeRegExp(categoryName) + '$', 'i'), includeDeleted: true }).session(session);
            if (!category) {
              const created = await Category.create([{ tenantId, name: categoryName, code: categoryName.substring(0, 4).toUpperCase(), importBatchId: historyId }], { session });
              category = created[0];
            } else if (category.isDeleted) {
              category.isDeleted = false;
              category.status = 'ACTIVE';
              await category.save({ session });
            }
            categoryCache.set(categoryName.toUpperCase(), category);
          } catch (err) {
            console.error('FAILED AT STEP: Category Management');
            throw err;
          }
        }

        // Product Catalog Management
        const productKey = itemCode.toUpperCase();
        let product = productCache.get(productKey);
        if (!product) {
          try {
            product = await Product.findOne({ tenantId, itemCode: new RegExp('^' + escapeRegExp(itemCode) + '$', 'i'), includeDeleted: true }).session(session);
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
                defaultMRP: mrp,
                importBatchId: historyId
              }], { session });
              product = created[0];
            } else if (product.isDeleted) {
              product.isDeleted = false;
              product.status = 'ACTIVE';
              await product.save({ session });
            }
            productCache.set(productKey, product);
          } catch (err) {
            console.error('FAILED AT STEP: Product Management');
            throw err;
          }
        }

        // Purchase Bill Management
        let purchaseBill = billCache.get(billNo.toUpperCase());
        if (!purchaseBill) {
          try {
            const existingBill = await PurchaseBill.findOne({ tenantId, billNo: new RegExp('^' + escapeRegExp(billNo) + '$', 'i') }).session(session);
            if (existingBill) {
              existingBill.vendorId = vendor._id;
              existingBill.firmId = firm._id;
              existingBill.warehouseId = warehouse._id;
              existingBill.importBatchId = historyId;
              await existingBill.save({ session });
              purchaseBill = existingBill;
            } else {
              const created = await PurchaseBill.create([{
                tenantId,
                billNo: billNo,
                vendorId: vendor._id,
                firmId: firm._id,
                warehouseId: warehouse._id,
                billDate,
                totalAmount: 0,
                status: 'APPROVED',
                importBatchId: historyId
              }], { session });
              purchaseBill = created[0];
            }
            billCache.set(billNo.toUpperCase(), purchaseBill);
          } catch (err) {
            console.error('FAILED AT STEP: PurchaseBill Management');
            throw err;
          }
        }

        if (purchaseBill && !purchaseBillIds.some(id => id.toString() === purchaseBill._id.toString())) {
          purchaseBillIds.push(purchaseBill._id);
        }

        // Create Purchase Item
        let purchaseItem;
        try {
          const createdItem = await PurchaseItem.create([{
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
            lineTotal,
            importBatchId: historyId
          }], { session });
          purchaseItem = createdItem[0];
          purchaseItemIds.push(purchaseItem._id);
        } catch (err) {
          console.error('FAILED AT STEP: PurchaseItem.create');
          throw err;
        }

        // Create Inventory Pieces
        try {
          const piecesToCreate = [];
          for (let i = 0; i < qty; i++) {
            let pieceBarcode = (i === 0) ? barcode : generateBarcode();
            
            let isUnique = false;
            while (!isUnique) {
              if (processedBarcodesSet.has(pieceBarcode)) {
                pieceBarcode = generateBarcode();
                continue;
              }
              const existingBarcode = await InventoryPiece.findOne({ tenantId, barcode: pieceBarcode }).session(session);
              if (existingBarcode) {
                pieceBarcode = generateBarcode();
              } else {
                isUnique = true;
              }
            }
            
            processedBarcodesSet.add(pieceBarcode);
            
            piecesToCreate.push({
              tenantId,
              productId: product._id,
              purchaseBillId: purchaseBill._id,
              purchaseItemId: purchaseItem._id,
              warehouseId: warehouse._id,
              firmId: firm._id,
              barcode: pieceBarcode,
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
              currentLocation: 'WAREHOUSE',
              importBatchId: historyId
            });
          }

          const createdPieces = await InventoryPiece.insertMany(piecesToCreate, { session });
          for (const p of createdPieces) {
            inventoryPieceIds.push(p._id);
          }

          const lifecycleEvents = createdPieces.map(p => ({
            tenantId,
            inventoryPieceId: p._id,
            barcode: p.barcode,
            eventType: LIFECYCLE_EVENT.PURCHASE,
            fromLocation: `Vendor:${vendor.name}`,
            toLocation: `Warehouse:${warehouse.name}`,
            referenceId: purchaseBill._id,
            referenceModel: 'PurchaseBill',
            performedBy: userId,
            notes: `PT Excel Import row ${rowNum}`,
            importBatchId: historyId
          }));
          await InventoryLifecycle.insertMany(lifecycleEvents, { session });
          console.log(`AFTER InventoryPiece and Lifecycle creation loop. inTransaction: ${session.inTransaction()}`);
        } catch (err) {
          console.error('FAILED AT STEP: InventoryPiece.create loop');
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

      // 5. Finalize & Save History
      await PTImportHistory.updateOne({ _id: historyId }, {
        $set: {
          totalRows: summary.total,
          inserted: summary.inserted,
          updated: summary.updated,
          skipped: summary.skipped,
          failed: summary.failed,
          errors: summary.errors,
          importStatus: summary.failed > 0 ? (summary.inserted + summary.updated > 0 ? 'PARTIAL' : 'FAILED') : 'COMPLETED',
          purchaseBillIds,
          inventoryPieceIds,
          purchaseItemIds,
          importedRows: rows
        }
      }, { session });

      summary.importId = historyId;

      // Commit transaction if supported
      if (isTxnSupported && session && session.inTransaction()) {
        console.log('BEFORE commitTransaction');
        await session.commitTransaction();
        console.log('AFTER commitTransaction - PT Import Completed Successfully!');
      }
      return summary;
    } catch (err) {
      console.error('===== ROOT ERROR =====');
      console.error(`Failing Row Context -> Row: ${currentRowCtx.rowNum}, Barcode: ${currentRowCtx.barcode}, ItemCode: ${currentRowCtx.itemCode}, BillNo: ${currentRowCtx.billNo}, IPN: ${currentRowCtx.ipn}`);
      console.error(err);
      console.error(err.message);
      console.error(err.stack);
      if (err.errors) console.error(err.errors);
      console.error('======================');

      // Abort transaction if active and supported
      if (isTxnSupported && session && session.inTransaction()) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      // End session if it was started
      if (session) {
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

  static async deleteImport(id, userId, tenantId) {
    const isTxnSupported = await isTransactionSupported();
    let session = null;

    if (isTxnSupported) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    try {
      const history = await PTImportHistory.findOne({ _id: id, tenantId }).session(session);
      if (!history) throw new ApiError(404, 'PT Import History record not found.');

      // 1. Delete InventoryLifecycle
      const InventoryLifecycle = require('../models/InventoryLifecycle');
      await InventoryLifecycle.deleteMany({ importBatchId: id, tenantId }).session(session);

      // 2. Delete InventoryPieces
      const InventoryPiece = require('../models/InventoryPiece');
      await InventoryPiece.deleteMany({ importBatchId: id, tenantId }).session(session);

      // 3. Delete PurchaseItems
      const PurchaseItem = require('../models/purchase/PurchaseItem');
      await PurchaseItem.deleteMany({ importBatchId: id, tenantId }).session(session);

      // 4. Delete PurchaseBills
      const PurchaseBill = require('../models/purchase/PurchaseBill');
      await PurchaseBill.deleteMany({ importBatchId: id, tenantId }).session(session);

      // 5. Safe Delete Products (only if no pieces exist for it anymore)
      const Product = require('../models/Product');
      const productsFromBatch = await Product.find({ importBatchId: id, tenantId }).session(session);
      for (const p of productsFromBatch) {
        const remainingPieces = await InventoryPiece.countDocuments({ productId: p._id }).session(session);
        if (remainingPieces === 0) {
          await Product.deleteOne({ _id: p._id }).session(session);
        }
      }

      // 6. Safe Delete Vendors
      const Vendor = require('../models/masters/Vendor');
      const vendorsFromBatch = await Vendor.find({ importBatchId: id, tenantId }).session(session);
      for (const v of vendorsFromBatch) {
        const remainingBills = await PurchaseBill.countDocuments({ vendorId: v._id }).session(session);
        if (remainingBills === 0) {
          await Vendor.deleteOne({ _id: v._id }).session(session);
        }
      }

      // 7. Delete PT Import History
      await PTImportHistory.deleteOne({ _id: id }).session(session);

      if (isTxnSupported && session && session.inTransaction()) {
        await session.commitTransaction();
      }
      return { success: true, message: 'PT Import fully rolled back and deleted.' };
    } catch (err) {
      if (isTxnSupported && session && session.inTransaction()) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }
}

module.exports = PTImportService;

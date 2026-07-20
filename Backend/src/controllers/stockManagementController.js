const Product = require('../models/productModel');
const Inventory = require('../models/inventoryModel');
const InventoryMovement = require('../models/inventoryMovementModel');
const Batch = require('../models/batchModel');
const Invoice = require('../models/invoiceModel');
const { calculateStockStatus } = require('../services/stockCalculationService');
const inventoryMovementService = require('../services/inventoryMovementService');
const mongoose = require('mongoose');

// ==========================================
// 1. OPENING STOCK MANAGEMENT
// ==========================================

// GET /api/stock-management/opening
exports.getOpeningStockList = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = { tenantId, openingStock: { $gt: 0 } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
    };

    const skip = (options.page - 1) * options.limit;
    const total = await Product.countDocuments(query);
    const productsList = await Product.find(query)
      .sort(options.sort)
      .skip(skip)
      .limit(options.limit);

    // Dynamic stats
    const allOpeningProducts = await Product.find({ tenantId, openingStock: { $gt: 0 } });
    const stats = {
      totalProducts: allOpeningProducts.length,
      totalQty: allOpeningProducts.reduce((sum, p) => sum + (p.openingStock || 0), 0),
      stockValue: allOpeningProducts.reduce((sum, p) => sum + ((p.openingStock || 0) * (p.sellingPrice || 0)), 0),
      totalCost: allOpeningProducts.reduce((sum, p) => sum + ((p.openingStock || 0) * (p.purchasePrice || 0)), 0),
    };

    res.status(200).json({
      success: true,
      stats,
      data: productsList,
      pagination: {
        total,
        page: options.page,
        pages: Math.ceil(total / options.limit) || 1,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/stock-management/opening
exports.saveOpeningStock = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { productId, quantity, warehouseId, warehouseName, batchNo, remarks } = req.body;

    const product = await Product.findOne({ _id: productId, tenantId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const previousStockVal = product.stock || 0;

    // Set opening stock
    product.openingStock = quantity;
    calculateStockStatus(product);
    await product.save();

    // Create or update warehouse inventory split
    let inv = await Inventory.findOne({ tenantId, productId, warehouseId });
    if (!inv) {
      inv = new Inventory({
        tenantId,
        productId,
        warehouseId,
        warehouseName: warehouseName || 'Main Warehouse',
        availableQty: quantity,
      });
    } else {
      inv.availableQty = quantity;
    }
    await inv.save();

    // Log movement log
    await inventoryMovementService.createMovement(tenantId, {
      product,
      movementType: 'INBOUND',
      activity: 'OPENING_STOCK',
      quantity,
      previousStock: previousStockVal,
      newStock: product.stock,
      warehouseId,
      warehouseName: warehouseName || 'Main Warehouse',
      performedBy: req.user.name || 'Admin',
      remarks: remarks || 'Initial opening stock setup'
    });

    // Create batch if specified
    if (batchNo) {
      await Batch.create({
        tenantId,
        batchNo,
        productId,
        warehouseId,
        purchaseQty: quantity,
        availableQty: quantity,
        costPrice: product.purchasePrice || 0,
        sellingPrice: product.sellingPrice || 0,
        status: 'Available',
        remarks: 'Opening stock batch lot'
      });
    }

    res.status(200).json({ success: true, message: 'Opening stock registered successfully', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/stock-management/opening/:productId
exports.editOpeningStock = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { productId } = req.params;
    const { quantity, warehouseId, warehouseName, remarks } = req.body;

    const product = await Product.findOne({ _id: productId, tenantId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Business rule: Opening Stock can only be edited before first transaction
    const otherMovements = await InventoryMovement.countDocuments({
      tenantId,
      productId,
      activity: { $ne: 'OPENING_STOCK' }
    });

    if (otherMovements > 0 || (product.purchasedQuantity > 0 && product.purchasedQuantity !== product.openingStock) || product.soldQuantity > 0 || product.reservedQuantity > 0) {
      return res.status(400).json({
        success: false,
        message: 'Opening stock cannot be edited after other stock transactions have occurred.'
      });
    }

    const previousStockVal = product.stock || 0;

    // Update opening stock
    product.openingStock = quantity;
    calculateStockStatus(product);
    await product.save();

    // Re-adjust inventory partition
    let inv = await Inventory.findOne({ tenantId, productId, warehouseId });
    if (inv) {
      inv.availableQty = quantity;
      await inv.save();
    }

    // Log audit movement update
    await inventoryMovementService.createMovement(tenantId, {
      product,
      movementType: 'INBOUND',
      activity: 'OPENING_STOCK',
      quantity,
      previousStock: previousStockVal,
      newStock: product.stock,
      warehouseId,
      warehouseName: warehouseName || 'Main Warehouse',
      performedBy: req.user.name || 'Admin',
      remarks: remarks || 'Opening stock corrected (Manual Adjustment)'
    });

    res.status(200).json({ success: true, message: 'Opening stock modified successfully', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================================
// 2. PURCHASE STOCK ENTRY
// ==========================================

// POST /api/stock-management/purchase-entry
exports.savePurchaseEntry = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      supplierId,
      supplierName,
      poNo,
      invoiceNo,
      date,
      warehouseId,
      warehouseName,
      productId,
      quantity,
      purchasePrice,
      mrp,
      sellingPrice,
      gst,
      discount,
      batchNo
    } = req.body;

    const product = await Product.findOne({ _id: productId, tenantId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const previousStockVal = product.stock || 0;

    // Increase product purchased counter
    product.purchasedQuantity = (product.purchasedQuantity || 0) + quantity;
    if (purchasePrice) product.purchasePrice = purchasePrice;
    if (sellingPrice) product.sellingPrice = sellingPrice;
    if (mrp) product.mrp = mrp;
    calculateStockStatus(product);
    await product.save();

    // Update warehouse inventory split
    let inv = await Inventory.findOne({ tenantId, productId, warehouseId });
    if (!inv) {
      inv = new Inventory({
        tenantId,
        productId,
        warehouseId,
        warehouseName: warehouseName || 'Main Warehouse',
        availableQty: quantity,
      });
    } else {
      inv.availableQty = (inv.availableQty || 0) + quantity;
    }
    await inv.save();

    // Log INBOUND movement
    await inventoryMovementService.createMovement(tenantId, {
      product,
      movementType: 'INBOUND',
      activity: 'PURCHASE_RECEIVED',
      quantity,
      previousStock: previousStockVal,
      newStock: product.stock,
      warehouseId,
      warehouseName: warehouseName || 'Main Warehouse',
      referenceType: 'Purchase Invoice',
      referenceNumber: invoiceNo || poNo || 'N/A',
      performedBy: req.user.name || 'Admin',
      remarks: `Purchase stock entry. Supplier: ${supplierName || 'Global Suppliers'}`
    });

    // Create Batch
    const finalBatchNo = batchNo || `BAT-${Date.now().toString().slice(-4)}`;
    await Batch.create({
      tenantId,
      batchNo: finalBatchNo,
      productId,
      supplierId: mongoose.Types.ObjectId.isValid(supplierId) ? supplierId : undefined,
      warehouseId,
      purchaseQty: quantity,
      availableQty: quantity,
      costPrice: purchasePrice || product.purchasePrice || 0,
      sellingPrice: sellingPrice || product.sellingPrice || 0,
      mrp: mrp || product.mrp || 0,
      discount: discount || 0,
      gst: gst || 0,
      status: 'Available',
      remarks: 'Manual purchase entry batch lot'
    });

    res.status(200).json({ success: true, message: 'Purchase stock entry registered successfully', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================================
// 3. SALES STOCK DEDUCTION
// ==========================================

// GET /api/stock-management/sales-deductions
exports.getSalesDeductions = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { search, page = 1, limit = 10 } = req.query;

    const query = { tenantId, status: 'Completed' };
    if (search) {
      query.$or = [
        { invoiceNo: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('items.productId')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    // Format output like required table
    const deductions = [];
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        deductions.push({
          _id: `${inv._id}-${item._id}`,
          invoiceNo: inv.invoiceNo,
          customer: inv.customerName || 'Walk-In Customer',
          productName: item.name || (item.productId ? item.productId.name : 'Unknown Product'),
          sku: item.sku || (item.productId ? item.productId.sku : 'N/A'),
          qtySold: item.quantity,
          warehouse: 'Main Warehouse (w-1)',
          salesperson: inv.salesperson || 'POS Terminal',
          date: inv.date || inv.createdAt,
          amount: item.totalPrice || (item.rate * item.quantity),
        });
      });
    });

    res.status(200).json({
      success: true,
      data: deductions.slice(0, parseInt(limit)), // Pagination slice match
      pagination: {
        total: deductions.length,
        page: parseInt(page),
        pages: Math.ceil(deductions.length / parseInt(limit)) || 1,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================================
// 4. STOCK ADJUSTMENT
// ==========================================

// POST /api/stock-management/adjustments
exports.saveAdjustment = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { productId, warehouseId, warehouseName, type, physicalStock, difference, reason, remarks, approvedBy } = req.body;

    const product = await Product.findOne({ _id: productId, tenantId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Business rule: Stock Adjustment requires manager approval
    if (!approvedBy) {
      return res.status(400).json({ success: false, message: 'Manager authorization/approval is required to save adjustments.' });
    }

    const previousStockVal = product.stock || 0;

    // Type checking
    if (['Decrease', 'Damage', 'Expired', 'Lost'].includes(type)) {
      // Stock goes down
      // Check negative boundary
      if (previousStockVal - difference < 0) {
        return res.status(400).json({ success: false, message: 'Adjustment rejected. Stock level cannot become negative.' });
      }
      product.soldQuantity = (product.soldQuantity || 0) + difference;
    } else {
      // Stock goes up
      product.purchasedQuantity = (product.purchasedQuantity || 0) + difference;
    }

    calculateStockStatus(product);
    await product.save();

    // Adjust location inventory
    let inv = await Inventory.findOne({ tenantId, productId, warehouseId });
    if (inv) {
      if (['Decrease', 'Damage', 'Expired', 'Lost'].includes(type)) {
        inv.availableQty = Math.max(0, (inv.availableQty || 0) - difference);
      } else {
        inv.availableQty = (inv.availableQty || 0) + difference;
      }
      await inv.save();
    }

    // Log ADJUSTMENT movement
    await inventoryMovementService.createMovement(tenantId, {
      product,
      movementType: ['Decrease', 'Damage', 'Expired', 'Lost'].includes(type) ? 'OUTBOUND' : 'INBOUND',
      activity: 'ADJUSTMENT',
      quantity: difference,
      previousStock: previousStockVal,
      newStock: product.stock,
      warehouseId,
      warehouseName: warehouseName || 'Main Warehouse',
      performedBy: approvedBy,
      remarks: `${type} adjustment: ${reason || ''}. ${remarks || ''}`
    });

    res.status(200).json({ success: true, message: 'Stock adjustment saved successfully', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================================
// 5. STOCK RETURN MANAGEMENT
// ==========================================

// GET /api/stock-management/returns
exports.getReturns = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    // Query return movements
    const movements = await InventoryMovement.find({
      tenantId,
      activity: 'RETURN'
    }).populate('productId').sort('-createdAt');

    const formattedReturns = movements.map(m => ({
      _id: m._id,
      returnNo: m.referenceNumber || `RET-${m._id.toString().slice(-6).toUpperCase()}`,
      refInvoice: m.referenceId || 'N/A',
      type: m.movementType === 'INBOUND' ? 'Customer Return' : 'Supplier Return',
      supplier: m.movementType === 'OUTBOUND' ? (m.remarks?.split(': ')[1] || 'Supplier partner') : 'N/A',
      customer: m.movementType === 'INBOUND' ? (m.remarks?.split(': ')[1] || 'Retail customer') : 'N/A',
      productName: m.productName,
      sku: m.sku || 'N/A',
      quantity: m.quantity,
      warehouse: m.warehouseName || 'Main Warehouse',
      reason: m.remarks || 'Stock return registered',
      status: 'Completed'
    }));

    res.status(200).json({ success: true, data: formattedReturns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/stock-management/returns
exports.saveReturn = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { returnType, refInvoice, partnerName, productId, quantity, warehouseId, warehouseName, reason } = req.body;

    const product = await Product.findOne({ _id: productId, tenantId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const previousStockVal = product.stock || 0;
    const returnNo = `RET-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    if (returnType === 'Customer Return') {
      // Customer return: increases stock by decreasing sold quantity
      product.soldQuantity = Math.max(0, (product.soldQuantity || 0) - quantity);
      calculateStockStatus(product);
      await product.save();

      // Adjust location inventory
      let inv = await Inventory.findOne({ tenantId, productId, warehouseId });
      if (inv) {
        inv.availableQty = (inv.availableQty || 0) + quantity;
        await inv.save();
      }

      // Log INBOUND movement
      await inventoryMovementService.createMovement(tenantId, {
        product,
        movementType: 'INBOUND',
        activity: 'RETURN',
        quantity,
        previousStock: previousStockVal,
        newStock: product.stock,
        warehouseId,
        warehouseName: warehouseName || 'Main Warehouse',
        referenceType: 'Return Order',
        referenceNumber: returnNo,
        referenceId: refInvoice,
        performedBy: req.user.name || 'POS Staff',
        remarks: `Customer Return: ${partnerName || 'Retail Client'}. Reason: ${reason}`
      });
    } else {
      // Supplier return: decreases stock by increasing sold (or decreasing purchase)
      // Check negative boundary
      if (previousStockVal - quantity < 0) {
        return res.status(400).json({ success: false, message: 'Return rejected. Supplier return quantity exceeds current stock.' });
      }

      product.soldQuantity = (product.soldQuantity || 0) + quantity;
      calculateStockStatus(product);
      await product.save();

      // Adjust location inventory
      let inv = await Inventory.findOne({ tenantId, productId, warehouseId });
      if (inv) {
        inv.availableQty = Math.max(0, (inv.availableQty || 0) - quantity);
        await inv.save();
      }

      // Log OUTBOUND movement
      await inventoryMovementService.createMovement(tenantId, {
        product,
        movementType: 'OUTBOUND',
        activity: 'RETURN',
        quantity,
        previousStock: previousStockVal,
        newStock: product.stock,
        warehouseId,
        warehouseName: warehouseName || 'Main Warehouse',
        referenceType: 'Return Voucher',
        referenceNumber: returnNo,
        referenceId: refInvoice,
        performedBy: req.user.name || 'Store Manager',
        remarks: `Supplier Return: ${partnerName || 'Vendor'}. Reason: ${reason}`
      });
    }

    res.status(200).json({ success: true, message: 'Stock return registered successfully', returnNo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================================
// 6. INVENTORY AUDIT REPORTS
// ==========================================

// GET /api/stock-management/reports/:reportType
exports.getAuditReport = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { reportType } = req.params;

    const productsList = await Product.find({ tenantId });

    let reportData = [];

    switch (reportType) {
      case 'summary':
        reportData = productsList.map(p => ({
          productName: p.name,
          sku: p.sku || 'N/A',
          category: p.category,
          brand: p.brand,
          openingStock: p.openingStock || 0,
          purchased: p.purchasedQuantity || 0,
          sold: p.soldQuantity || 0,
          reserved: p.reservedQuantity || 0,
          currentStock: p.stock || 0,
          status: p.status
        }));
        break;

      case 'valuation':
        reportData = productsList.map(p => ({
          productName: p.name,
          sku: p.sku || 'N/A',
          currentStock: p.stock || 0,
          costPrice: p.purchasePrice || 0,
          sellingPrice: p.sellingPrice || 0,
          totalCostValue: (p.stock || 0) * (p.purchasePrice || 0),
          totalRetailValue: (p.stock || 0) * (p.sellingPrice || 0),
        }));
        break;

      case 'opening-vs-current':
        reportData = productsList.map(p => ({
          productName: p.name,
          sku: p.sku || 'N/A',
          openingStock: p.openingStock || 0,
          currentStock: p.stock || 0,
          variance: (p.stock || 0) - (p.openingStock || 0),
        }));
        break;

      case 'fast-moving':
        // Sort by sold quantity descending
        reportData = [...productsList]
          .sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0))
          .slice(0, 10)
          .map(p => ({
            productName: p.name,
            sku: p.sku || 'N/A',
            soldQuantity: p.soldQuantity || 0,
            currentStock: p.stock || 0,
            revenueGenerated: (p.soldQuantity || 0) * (p.sellingPrice || 0),
          }));
        break;

      case 'slow-moving':
        // Products with sold units but low velocity (sold quantity > 0 and <= 5)
        reportData = productsList
          .filter(p => (p.soldQuantity || 0) > 0 && (p.soldQuantity || 0) <= 5)
          .map(p => ({
            productName: p.name,
            sku: p.sku || 'N/A',
            soldQuantity: p.soldQuantity || 0,
            currentStock: p.stock || 0,
          }));
        break;

      case 'dead-stock':
        // Products with zero sales
        reportData = productsList
          .filter(p => (p.soldQuantity || 0) === 0)
          .map(p => ({
            productName: p.name,
            sku: p.sku || 'N/A',
            currentStock: p.stock || 0,
            createdDate: p.createdAt,
          }));
        break;

      case 'negative-stock':
        // Raw check, theoretically stock is capped at 0, so check raw equation:
        reportData = productsList
          .filter(p => {
            const raw = (p.openingStock || 0) + (p.purchasedQuantity || 0) - (p.soldQuantity || 0) - (p.reservedQuantity || 0);
            return raw < 0;
          })
          .map(p => ({
            productName: p.name,
            sku: p.sku || 'N/A',
            calculatedStock: (p.openingStock || 0) + (p.purchasedQuantity || 0) - (p.soldQuantity || 0) - (p.reservedQuantity || 0),
          }));
        break;

      case 'low-stock':
        reportData = productsList
          .filter(p => p.status === 'Low Stock' || p.stock <= p.threshold)
          .map(p => ({
            productName: p.name,
            sku: p.sku || 'N/A',
            currentStock: p.stock || 0,
            threshold: p.threshold || 0,
            status: p.status
          }));
        break;

      case 'movement-summary':
        const movements = await InventoryMovement.find({ tenantId });
        reportData = productsList.map(p => {
          const prodMovs = movements.filter(m => m.productId.toString() === p._id.toString());
          return {
            productName: p.name,
            sku: p.sku || 'N/A',
            inboundTransactions: prodMovs.filter(m => m.movementType === 'INBOUND').length,
            outboundTransactions: prodMovs.filter(m => m.movementType === 'OUTBOUND').length,
            transfersCount: prodMovs.filter(m => m.movementType === 'TRANSFER').length,
            totalMovements: prodMovs.length
          };
        });
        break;

      case 'warehouse-wise':
        const inventories = await Inventory.find({ tenantId });
        reportData = inventories.map(inv => ({
          warehouseName: inv.warehouseName,
          productId: inv.productId,
          availableStock: inv.availableQty || 0,
          reservedStock: inv.reservedQty || 0,
        }));
        break;

      case 'category-wise':
        const catMap = {};
        productsList.forEach(p => {
          if (!catMap[p.category]) {
            catMap[p.category] = { category: p.category, totalProducts: 0, totalStock: 0, valuation: 0 };
          }
          catMap[p.category].totalProducts++;
          catMap[p.category].totalStock += (p.stock || 0);
          catMap[p.category].valuation += (p.stock || 0) * (p.purchasePrice || 0);
        });
        reportData = Object.values(catMap);
        break;

      case 'brand-wise':
        const brandMap = {};
        productsList.forEach(p => {
          if (!brandMap[p.brand]) {
            brandMap[p.brand] = { brand: p.brand, totalProducts: 0, totalStock: 0, valuation: 0 };
          }
          brandMap[p.brand].totalProducts++;
          brandMap[p.brand].totalStock += (p.stock || 0);
          brandMap[p.brand].valuation += (p.stock || 0) * (p.purchasePrice || 0);
        });
        reportData = Object.values(brandMap);
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    res.status(200).json({ success: true, reportType, count: reportData.length, data: reportData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

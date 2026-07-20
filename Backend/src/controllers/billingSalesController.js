const Invoice = require('../models/invoiceModel');
const Product = require('../models/productModel');
const Customer = require('../models/customerModel');
const Inventory = require('../models/inventoryModel');
const Employee = require('../models/employeeModel');
const CommissionHistory = require('../models/commissionHistoryModel');
const CommissionSettings = require('../models/commissionSettingsModel');
const GstAuditLog = require('../models/gstAuditLogModel');
const LoyaltySettings = require('../models/loyaltySettingsModel');
const inventoryMovementService = require('../services/inventoryMovementService');
const { calculateStockStatus } = require('../services/stockCalculationService');
const mongoose = require('mongoose');

// Helper to check valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==========================================
// 1. INVOICE CREATION (RETAIL / WHOLESALE / B2B)
// ==========================================
exports.createSalesInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tenantId = req.user.tenantId;
    const {
      invoiceType, // 'Retail', 'Wholesale', 'B2B'
      items,
      customerId,
      customerName,
      customerPhone,
      gstin,
      companyName,
      billingAddress,
      shippingAddress,
      stateCode,
      lrNumber,
      ewayBillNo,
      paymentMethod,
      amountPaid,
      subTotal,
      discountTotal,
      couponCode,
      couponDiscount,
      gstTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      roundOff,
      grandTotal,
      paymentTerms,
      salespersonId,
      salespersonName,
      gstModifications // Array of { productId, originalGst, modifiedGst, reason }
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Voucher must contain at least one item' });
    }

    // A. Audit Manual GST changes if any
    if (gstModifications && gstModifications.length > 0) {
      // Security Check: Only Admin and Manager can modify GST
      const role = (req.user.role || '').toLowerCase();
      if (role !== 'admin' && role !== 'manager' && role !== 'businessadmin') {
        return res.status(403).json({ success: false, message: 'Unauthorized. Only Admins and Managers can manually alter GST.' });
      }

      for (const mod of gstModifications) {
        await GstAuditLog.create([{
          tenantId,
          invoiceNo: req.body.invoiceNo || 'PENDING',
          productId: mod.productId,
          originalGst: mod.originalGst,
          modifiedGst: mod.modifiedGst,
          reason: mod.reason || 'Manual override',
          performedBy: req.user.name || 'Admin override'
        }], { session });
      }
    }

    // B. Build Invoice Document
    const invoiceNo = `INV-${invoiceType === 'Wholesale' ? 'WHS' : invoiceType === 'B2B' ? 'B2B' : 'RET'}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const newInvoice = new Invoice({
      tenantId,
      invoiceNo,
      date: new Date(),
      customerId: isValidObjectId(customerId) ? customerId : undefined,
      customerName: companyName || customerName || 'Walk-in Customer',
      customerPhone,
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        gstPercent: item.gstPercent || 0,
        totalPrice: item.totalPrice,
        isCustom: item.isCustom || false,
        salespersonId: item.salespersonId || salespersonId,
        salespersonName: item.salespersonName || salespersonName
      })),
      subTotal,
      discountTotal,
      couponCode,
      couponDiscount,
      gstTotal,
      grandTotal,
      paymentMethod,
      amountPaid,
      status: amountPaid >= grandTotal ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid'
    });

    // Add extra B2B / Wholesale properties (stored in schema dynamically or nested)
    newInvoice.set('invoiceType', invoiceType);
    newInvoice.set('gstin', gstin);
    newInvoice.set('companyName', companyName);
    newInvoice.set('billingAddress', billingAddress);
    newInvoice.set('shippingAddress', shippingAddress);
    newInvoice.set('stateCode', stateCode);
    newInvoice.set('lrNumber', lrNumber);
    newInvoice.set('ewayBillNo', ewayBillNo);
    newInvoice.set('cgstTotal', cgstTotal);
    newInvoice.set('sgstTotal', sgstTotal);
    newInvoice.set('igstTotal', igstTotal);
    newInvoice.set('roundOff', roundOff);
    newInvoice.set('paymentTerms', paymentTerms);

    await newInvoice.save({ session });

    // C. Update Inventory Stocks and log Telemetry Movements
    for (const item of items) {
      if (item.productId && isValidObjectId(item.productId)) {
        const product = await Product.findOne({ _id: item.productId, tenantId }).session(session);
        if (product) {
          // Stock level validation: stock cannot be negative
          const availableStock = (product.stock || 0);
          if (availableStock - item.quantity < 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for product ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`
            });
          }

          // Deduct global stock
          product.soldQuantity = (product.soldQuantity || 0) + item.quantity;
          calculateStockStatus(product);
          await product.save({ session });

          // Deduct specific warehouse partition
          const warehouseId = item.warehouseId || 'w-1';
          let inv = await Inventory.findOne({ tenantId, productId: product._id, warehouseId }).session(session);
          if (inv) {
            inv.availableQty = Math.max(0, (inv.availableQty || 0) - item.quantity);
            await inv.save({ session });
          }

          // Log OUTBOUND movement ledger
          await inventoryMovementService.createMovement(tenantId, {
            product,
            movementType: 'OUTBOUND',
            activity: invoiceType === 'Wholesale' ? 'WHOLESALE_SALE' : invoiceType === 'B2B' ? 'B2B_SALE' : 'POS_SALE',
            quantity: item.quantity,
            referenceType: 'Invoice',
            referenceId: newInvoice._id,
            referenceNumber: newInvoice.invoiceNo,
            performedBy: req.user.name || 'POS Staff',
            remarks: `Billing checkout: ${invoiceType} invoice generated`
          });
        }
      }
    }

    // D. Update Customer Ledger & loyalty Points
    if (isValidObjectId(customerId)) {
      const customer = await Customer.findOne({ _id: customerId, tenantId }).session(session);
      if (customer) {
        customer.totalInvoices += 1;
        customer.totalSpent += grandTotal;

        // Earn loyalty points
        let loyalty = await LoyaltySettings.findOne({ tenantId }).session(session);
        if (!loyalty) {
          loyalty = { enabled: true, rupeesPerPoint: 20 };
        }
        if (loyalty.enabled && loyalty.rupeesPerPoint > 0) {
          const pointsEarned = Math.floor(grandTotal / loyalty.rupeesPerPoint);
          customer.loyaltyPoints = (customer.loyaltyPoints || 0) + pointsEarned;
        }

        // Wholesale credit tracking
        const outstanding = grandTotal - amountPaid;
        if (outstanding > 0) {
          customer.outstandingBalance = (customer.outstandingBalance || 0) + outstanding;
        }

        await customer.save({ session });
      }
    }

    // E. Calculate Staff Commission
    let settings = await CommissionSettings.findOne({ tenantId }).session(session);
    if (!settings) {
      settings = { isEnabled: true, salespersonPercentage: 1.5, workerPercentage: 0.5 };
    }

    if (settings.isEnabled) {
      for (const item of items) {
        if (!item.productId || !isValidObjectId(item.productId)) continue;

        const netAmount = item.totalPrice || 0;

        // Salesperson Commission
        const sId = item.salespersonId || salespersonId;
        const sName = item.salespersonName || salespersonName;
        if (isValidObjectId(sId)) {
          const sComm = Number((netAmount * (settings.salespersonPercentage / 100)).toFixed(2));
          if (sComm > 0) {
            await CommissionHistory.create([{
              tenantId,
              invoiceId: newInvoice._id,
              invoiceNo: newInvoice.invoiceNo,
              productId: item.productId,
              productName: item.name,
              employeeId: sId,
              employeeName: sName,
              employeeRole: 'Salesperson',
              sellingPrice: item.price,
              quantity: item.quantity,
              netAmountBasis: netAmount,
              commissionPercentage: settings.salespersonPercentage,
              commissionAmount: sComm,
              status: 'Pending'
            }], { session });

            await Employee.updateOne(
              { _id: sId, tenantId },
              { $inc: { commissionEarned: sComm, 'commissionSummary.pending': sComm, 'commissionSummary.totalProductsSold': item.quantity } },
              { session }
            );
          }
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, message: 'Invoice finalized successfully', invoice: newInvoice });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. RETRIEVE INVOICES / REPORTS
// ==========================================
exports.getSalesReports = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { reportType } = req.query;

    const invoices = await Invoice.find({ tenantId }).sort('-createdAt');

    let reportData = [];

    switch (reportType) {
      case 'summary':
        // Calculate Retail vs Wholesale splits
        const stats = {
          retailSales: 0,
          wholesaleSales: 0,
          b2bSales: 0,
          totalRevenue: 0
        };
        invoices.forEach(inv => {
          const type = inv.get('invoiceType') || 'Retail';
          if (type === 'Wholesale') {
            stats.wholesaleSales += inv.grandTotal;
          } else if (type === 'B2B') {
            stats.b2bSales += inv.grandTotal;
          } else {
            stats.retailSales += inv.grandTotal;
          }
          stats.totalRevenue += inv.grandTotal;
        });
        reportData = [stats];
        break;

      case 'gst':
        // HSN Summary & GST splits
        const gstMap = {};
        invoices.forEach(inv => {
          inv.items.forEach(item => {
            const hsn = item.sku?.split('-')[0] || '9963'; // Default garment HSN fallback
            const rate = item.gstPercent || 0;
            const taxable = item.totalPrice / (1 + rate / 100);
            const taxAmt = item.totalPrice - taxable;

            if (!gstMap[hsn]) {
              gstMap[hsn] = { hsn, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, gstAmount: 0, total: 0 };
            }
            gstMap[hsn].taxableValue += taxable;
            gstMap[hsn].cgst += taxAmt / 2;
            gstMap[hsn].sgst += taxAmt / 2;
            gstMap[hsn].gstAmount += taxAmt;
            gstMap[hsn].total += item.totalPrice;
          });
        });
        reportData = Object.values(gstMap);
        break;

      case 'outstanding':
        // List customers with pending credit limits/outstanding balance
        const customers = await Customer.find({ tenantId, outstandingBalance: { $gt: 0 } });
        reportData = customers.map(c => ({
          name: c.name,
          phone: c.phone,
          outstandingBalance: c.outstandingBalance || 0,
          creditLimit: c.creditLimit || 50000,
          paymentTerms: 'Net 30'
        }));
        break;

      default:
        // Default list of sales
        reportData = invoices.map(inv => ({
          invoiceNo: inv.invoiceNo,
          type: inv.get('invoiceType') || 'Retail',
          customer: inv.customerName,
          date: inv.date,
          subTotal: inv.subTotal,
          discount: inv.discountTotal,
          gst: inv.gstTotal,
          total: inv.grandTotal,
          paymentMethod: inv.paymentMethod,
          status: inv.status
        }));
        break;
    }

    res.status(200).json({ success: true, data: reportData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

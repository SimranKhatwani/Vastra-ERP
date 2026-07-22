const GRN = require('../models/grnModel');
const PurchaseInvoice = require('../models/purchaseInvoiceModel');
const PurchaseReturn = require('../models/purchaseReturnModel');
const Vendor = require('../models/vendorModel');
const Product = require('../models/productModel');
const Inventory = require('../models/inventoryModel');
const PurchaseAuditLog = require('../models/purchaseAuditLogModel');
const Batch = require('../models/batchModel');
const VendorOutstanding = require('../models/vendorOutstandingModel');
const VendorPayment = require('../models/vendorPaymentModel');
const inventoryMovementService = require('../services/inventoryMovementService');
const { calculateStockStatus } = require('../services/stockCalculationService');
const mongoose = require('mongoose');

// Helper to log audit actions
const logAudit = async (tenantId, action, details, user) => {
  try {
    await PurchaseAuditLog.create({ tenantId, action, details, user });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
};

// ==========================================
// 1. GOODS RECEIPT NOTE (GRN) CREATION
// ==========================================
exports.createGRN = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tenantId = req.user.tenantId;
    const { vendorId, referenceNo, receiveDate, warehouseId, rackLocation, items, remarks } = req.body;

    const vendor = await Vendor.findOne({ _id: vendorId, tenantId }).session(session);
    if (!vendor) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const grn = new GRN({
      tenantId,
      vendorId,
      vendorName: vendor.name,
      referenceNo,
      receiveDate,
      warehouseId,
      rackLocation,
      items,
      remarks,
      receivedBy: req.user.name || 'Purchase Manager'
    });

    await grn.save({ session });

    // Update global products, partition inventory stocks, and create batches
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, tenantId }).session(session);
      if (product) {
        // Fix: Update purchasedQuantity so calculateStockStatus does not overwrite it on next calculations
        product.purchasedQuantity = (product.purchasedQuantity || 0) + Number(item.acceptedQty);
        calculateStockStatus(product);
        await product.save({ session });

        // Update warehouse partition inventory
        const whId = warehouseId || 'w-1';
        let inv = await Inventory.findOne({ tenantId, productId: product._id, warehouseId: whId }).session(session);
        if (!inv) {
          inv = new Inventory({
            tenantId,
            productId: product._id,
            warehouseId: whId,
            availableQty: 0
          });
        }
        inv.availableQty = (inv.availableQty || 0) + Number(item.acceptedQty);
        await inv.save({ session });

        // Create Batch lot for the inventory received
        const lotNo = item.batchNo || `BAT-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;
        await Batch.create([{
          tenantId,
          batchNo: lotNo,
          productId: product._id,
          supplierId: vendor._id, // Set supplierId for backwards compatibility
          purchaseInvoiceNo: grn.referenceNo || '',
          warehouseId: whId,
          purchaseDate: receiveDate || new Date(),
          receivedDate: new Date(),
          createdBy: req.user.name || 'Purchase Manager',
          purchaseQty: Number(item.receivedQty),
          availableQty: Number(item.acceptedQty),
          costPrice: product.purchasePrice || 0,
          sellingPrice: product.sellingPrice || 0,
          mrp: product.mrp || 0,
          status: (Number(item.rejectedQty) > 0 || Number(item.damagedQty) > 0) ? 'QC' : 'Available',
          remarks: item.remarks || `GRN: ${grn.grnNo} received`
        }], { session });

        // Log INBOUND stock movement
        await inventoryMovementService.createMovement(tenantId, {
          product,
          movementType: 'INBOUND',
          activity: 'PURCHASE_RECEIPT',
          quantity: Number(item.acceptedQty),
          referenceType: 'GRN',
          referenceId: grn._id,
          referenceNumber: grn.grnNo,
          performedBy: req.user.name || 'System Auto',
          remarks: `GRN entry recorded from vendor: ${vendor.name}`
        });
      }
    }

    await logAudit(tenantId, 'GRN Created', `Goods Receipt Note ${grn.grnNo} saved.`, req.user.name || 'System');
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, data: grn });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGRNs = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const grns = await GRN.find({ tenantId }).sort('-createdAt');
    res.status(200).json({ success: true, data: grns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. PURCHASE INVOICE CREATION
// ==========================================
exports.createPurchaseInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tenantId = req.user.tenantId;
    const { vendorId, vendorName, invoiceNo, invoiceDate, dueDate, referenceNo, items, subTotal, cgst, sgst, igst, discount, freight, otherCharges, grandTotal, paymentTerms, amountPaid, remarks } = req.body;

    let finalVendorId = null;
    let finalVendorName = vendorName || '';

    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      const vendor = await Vendor.findOne({ _id: vendorId, tenantId }).session(session);
      if (vendor) {
        finalVendorId = vendor._id;
        finalVendorName = vendor.name;

        // Update registered vendor outstanding balance
        const outstanding = Math.max(0, grandTotal - (Number(amountPaid) || 0));
        vendor.currentOutstanding = (vendor.currentOutstanding || 0) + outstanding;
        if (invoiceDate) {
          vendor.lastPurchaseDate = invoiceDate;
        }
        await vendor.save({ session });
      }
    }

    if (!finalVendorName) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Vendor name is required' });
    }

    const payAmt = Number(amountPaid) || 0;
    const invoice = new PurchaseInvoice({
      tenantId,
      invoiceNo,
      vendorId: finalVendorId,
      vendorName: finalVendorName,
      invoiceDate,
      dueDate,
      referenceNo,
      items,
      subTotal,
      cgst,
      sgst,
      igst,
      discount,
      freight,
      otherCharges,
      grandTotal,
      paymentTerms,
      amountPaid: payAmt,
      remarks
    });

    await invoice.save({ session });

    // Create VendorOutstanding document if registered vendor exists
    if (finalVendorId) {
      const outstanding = Math.max(0, grandTotal - payAmt);
      await VendorOutstanding.create([{
        tenantId,
        vendorId: finalVendorId,
        purchaseInvoiceId: invoice._id,
        invoiceNo: invoice.invoiceNo,
        invoiceDate: invoice.invoiceDate || new Date(),
        billAmount: invoice.grandTotal,
        amountPaid: payAmt,
        outstandingAmount: outstanding,
        dueDate: invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentStatus: outstanding === 0 ? 'Paid' : (payAmt > 0 ? 'Partial' : 'Unpaid'),
        remarks: invoice.remarks
      }], { session });
    }

    await logAudit(tenantId, 'Invoice Saved', `Purchase invoice ${invoice.invoiceNo} registered for ₹${grandTotal}.`, req.user.name || 'System');
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPurchaseInvoices = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const invoices = await PurchaseInvoice.find({ tenantId }).sort('-createdAt');
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. COLLECT OUTSTANDING VENDOR PAYOUT
// ==========================================
exports.collectVendorOutstandingPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tenantId = req.user.tenantId;
    const { invoiceId, amount, paymentMode, remarks, referenceNo } = req.body;

    const invoice = await PurchaseInvoice.findOne({ _id: invoiceId, tenantId }).session(session);
    if (!invoice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Purchase Invoice not found' });
    }

    const payAmt = Number(amount) || 0;
    if (payAmt <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
    }

    invoice.amountPaid = (invoice.amountPaid || 0) + payAmt;
    invoice.outstandingAmount = Math.max(0, invoice.grandTotal - invoice.amountPaid);
    invoice.paymentStatus = invoice.outstandingAmount === 0 ? 'Paid' : 'Partial';
    await invoice.save({ session });

    // Deduct vendor account balance
    const vendor = await Vendor.findOne({ _id: invoice.vendorId, tenantId }).session(session);
    if (vendor) {
      vendor.currentOutstanding = Math.max(0, (vendor.currentOutstanding || 0) - payAmt);
      await vendor.save({ session });
    }

    // Create a VendorPayment record
    const payment = await VendorPayment.create([{
      tenantId,
      vendorId: invoice.vendorId,
      purchaseInvoiceId: invoice._id,
      amount: payAmt,
      paymentMode: paymentMode || 'Cash',
      referenceNo: referenceNo || '',
      remarks: remarks || `Settled against purchase invoice: ${invoice.invoiceNo}`,
      paidBy: req.user ? req.user.name : 'System Admin'
    }], { session });

    // Find and update VendorOutstanding document
    let outstanding = await VendorOutstanding.findOne({ tenantId, purchaseInvoiceId: invoice._id }).session(session);
    if (!outstanding) {
      outstanding = new VendorOutstanding({
        tenantId,
        vendorId: invoice.vendorId,
        purchaseInvoiceId: invoice._id,
        invoiceNo: invoice.invoiceNo,
        invoiceDate: invoice.invoiceDate || new Date(),
        billAmount: invoice.grandTotal,
        amountPaid: 0,
        outstandingAmount: invoice.grandTotal,
        dueDate: invoice.dueDate || new Date(),
      });
    }

    outstanding.amountPaid += payAmt;
    outstanding.outstandingAmount = Math.max(0, outstanding.billAmount - outstanding.amountPaid);
    outstanding.paymentStatus = outstanding.outstandingAmount === 0 ? 'Paid' : 'Partial';
    outstanding.paymentHistory.push({
      paymentId: payment[0]._id,
      date: new Date(),
      amount: payAmt,
      paymentMode: paymentMode || 'Cash',
      referenceNo: referenceNo || '',
      remarks: remarks || ''
    });

    await outstanding.save({ session });

    await logAudit(tenantId, 'Payment Collected', `Settled ₹${payAmt} against purchase invoice: ${invoice.invoiceNo}`, req.user.name || 'System');
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Payout applied successfully', invoice });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. PURCHASE RETURN
// ==========================================
exports.createPurchaseReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tenantId = req.user.tenantId;
    const { vendorId, vendorName, invoiceRef, productId, productName, sku, quantity, reason, actionRequired } = req.body;

    let finalVendorId = null;
    let finalVendorName = vendorName || '';
    let vendor = null;

    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      vendor = await Vendor.findOne({ _id: vendorId, tenantId }).session(session);
      if (vendor) {
        finalVendorId = vendor._id;
        finalVendorName = vendor.name;
      }
    }

    if (!finalVendorName) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Vendor name is required' });
    }

    const prReturn = new PurchaseReturn({
      tenantId,
      vendorId: finalVendorId,
      vendorName: finalVendorName,
      invoiceRef,
      productId,
      productName,
      sku,
      quantity,
      reason,
      actionRequired,
      status: 'Approved'
    });

    await prReturn.save({ session });

    // Reduce inventory counts
    const product = await Product.findOne({ _id: productId, tenantId }).session(session);
    if (product) {
      // Decrement purchasedQuantity so recalculation behaves correctly
      product.purchasedQuantity = Math.max(0, (product.purchasedQuantity || 0) - Number(quantity));
      calculateStockStatus(product);
      await product.save({ session });

      // Deduct warehouse partition
      let inv = await Inventory.findOne({ tenantId, productId: product._id, warehouseId: 'w-1' }).session(session);
      if (inv) {
        inv.availableQty = Math.max(0, (inv.availableQty || 0) - Number(quantity));
        await inv.save({ session });
      }

      // Log OUTBOUND movement
      await inventoryMovementService.createMovement(tenantId, {
        product,
        movementType: 'OUTBOUND',
        activity: 'PURCHASE_RETURN',
        quantity: Number(quantity),
        referenceType: 'PurchaseReturn',
        referenceId: prReturn._id,
        referenceNumber: prReturn.returnNo,
        performedBy: req.user.name || 'System Auto',
        remarks: `Returned items to vendor: ${finalVendorName}. Reason: ${reason}`
      });
    }

    // Reduce vendor outstanding if refund requested and vendor exists
    if (actionRequired === 'Refund' && vendor) {
      const refundAmt = Math.round((product?.purchasePrice || product?.price || 0) * Number(quantity));
      vendor.currentOutstanding = Math.max(0, (vendor.currentOutstanding || 0) - refundAmt);
      await vendor.save({ session });

      // Apply refund as credit to outstanding invoices, oldest first
      let remainingRefund = refundAmt;
      const outstandings = await VendorOutstanding.find({ 
        tenantId, 
        vendorId: vendor._id, 
        paymentStatus: { $ne: 'Paid' } 
      }).sort('invoiceDate').session(session);

      for (const out of outstandings) {
        if (remainingRefund <= 0) break;
        const deduct = Math.min(out.outstandingAmount, remainingRefund);
        out.amountPaid += deduct;
        out.outstandingAmount = Math.max(0, out.billAmount - out.amountPaid);
        out.paymentStatus = out.outstandingAmount === 0 ? 'Paid' : 'Partial';
        out.paymentHistory.push({
          date: new Date(),
          amount: deduct,
          paymentMode: 'Other',
          remarks: `Deduction from purchase return: ${prReturn.returnNo}`
        });
        await out.save({ session });
        remainingRefund -= deduct;
      }
    }

    await logAudit(tenantId, 'Return Dispatched', `Purchase Return ${prReturn.returnNo} approved for vendor: ${finalVendorName}`, req.user.name || 'System');
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, data: prReturn });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPurchaseReturns = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const returns = await PurchaseReturn.find({ tenantId }).sort('-createdAt');
    res.status(200).json({ success: true, data: returns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. AUDIT LOGS
// ==========================================
exports.getPurchaseAuditLogs = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const logs = await PurchaseAuditLog.find({ tenantId }).sort('-createdAt');
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. PENDING PURCHASE TRACKING
exports.getPendingPurchases = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const PurchaseOrder = require('../models/purchaseOrderModel');
    
    const pendingPOs = await PurchaseOrder.find({ tenantId, status: 'Pending' }).sort('-date');
    
    const trackingData = [];
    for (const po of pendingPOs) {
      // Find GRNs matching this PO
      const grns = await GRN.find({ tenantId, referenceNo: po.poNo });
      
      // Aggregate received quantities by product ID
      const receivedMap = {};
      grns.forEach(grn => {
        grn.items.forEach(item => {
          const pid = item.productId.toString();
          receivedMap[pid] = (receivedMap[pid] || 0) + (item.acceptedQty || 0);
        });
      });
      
      // Build tracking record for each item in PO
      po.items.forEach(item => {
        const ordered = item.quantity || 0;
        const received = receivedMap[item.productId.toString()] || 0;
        const pending = Math.max(0, ordered - received);
        
        if (pending > 0) {
          const expectedDeliveryDate = new Date(po.date);
          expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7); // Default 7 days delivery window
          
          const delayDays = Math.max(0, Math.floor((Date.now() - expectedDeliveryDate.getTime()) / (1000 * 60 * 60 * 24)));
          
          trackingData.push({
            id: `${po._id}-${item.productId}`,
            vendorName: po.supplierName,
            productName: item.name,
            sku: item.sku || 'N/A',
            referenceNo: po.poNo,
            orderedQty: ordered,
            receivedQty: received,
            pendingQty: pending,
            warehouse: 'Main Warehouse',
            expectedDeliveryDate,
            delayDays,
            status: delayDays > 0 ? 'Delayed' : 'On Time',
            priority: delayDays > 5 ? 'High' : (delayDays > 0 ? 'Medium' : 'Low')
          });
        }
      });
    }
    
    res.status(200).json({ success: true, data: trackingData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. PURCHASE REPORTS AGGREGATION
exports.getPurchaseReports = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate } = req.query;
    
    let filter = { tenantId };
    if (startDate && endDate) {
      filter.invoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const invoices = await PurchaseInvoice.find(filter).sort('-invoiceDate');
    const returns = await PurchaseReturn.find({ tenantId }).sort('-createdAt');
    const Product = require('../models/productModel');
    
    // 1. Daily Summary
    const dailyMap = {};
    invoices.forEach(inv => {
      const d = new Date(inv.invoiceDate || inv.createdAt).toISOString().split('T')[0];
      dailyMap[d] = (dailyMap[d] || 0) + inv.grandTotal;
    });
    const dailyReport = Object.keys(dailyMap).map(date => ({ date, amount: dailyMap[date] })).sort((a,b) => b.date.localeCompare(a.date));
    
    // 2. Monthly Summary
    const monthlyMap = {};
    invoices.forEach(inv => {
      const date = new Date(inv.invoiceDate || inv.createdAt);
      const m = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[m] = (monthlyMap[m] || 0) + inv.grandTotal;
    });
    const monthlyReport = Object.keys(monthlyMap).map(month => ({ month, amount: monthlyMap[month] })).sort((a,b) => b.month.localeCompare(a.month));
    
    // 3. Vendor-wise Summary
    const vendorMap = {};
    invoices.forEach(inv => {
      vendorMap[inv.vendorName] = (vendorMap[inv.vendorName] || 0) + inv.grandTotal;
    });
    const vendorReport = Object.keys(vendorMap).map(vendor => ({ vendor, amount: vendorMap[vendor] })).sort((a,b) => b.amount - a.amount);
    
    // 4. Product-wise Summary
    const productMap = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        productMap[item.name] = (productMap[item.name] || 0) + item.total;
      });
    });
    const productReport = Object.keys(productMap).map(product => ({ product, amount: productMap[product] })).sort((a,b) => b.amount - a.amount);
    
    // 5. GST Purchase Register
    const gstRegister = invoices.map(inv => ({
      invoiceNo: inv.invoiceNo,
      invoiceDate: inv.invoiceDate,
      vendorName: inv.vendorName,
      taxableAmount: inv.subTotal,
      cgst: inv.cgst || 0,
      sgst: inv.sgst || 0,
      igst: inv.igst || 0,
      totalGst: (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0),
      grandTotal: inv.grandTotal
    }));
    
    // 6. Return Report
    const returnReport = [];
    for (const ret of returns) {
      const prod = await Product.findOne({ _id: ret.productId, tenantId });
      const refundAmt = Math.round((prod?.purchasePrice || prod?.price || 0) * Number(ret.quantity));
      returnReport.push({
        returnNo: ret.returnNo,
        date: ret.createdAt,
        vendorName: ret.vendorName,
        productName: ret.productName,
        quantity: ret.quantity,
        action: ret.actionRequired,
        status: ret.status,
        refundAmount: ret.actionRequired === 'Refund' ? refundAmt : 0
      });
    }
    
    // Summary stats
    const totalPurchaseVal = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalTaxVal = invoices.reduce((sum, inv) => sum + (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0), 0);
    
    let totalReturnValue = 0;
    for (const ret of returns) {
      if (ret.actionRequired === 'Refund') {
        const prod = await Product.findOne({ _id: ret.productId, tenantId });
        totalReturnValue += Math.round((prod?.purchasePrice || prod?.price || 0) * Number(ret.quantity));
      }
    }
    
    res.status(200).json({
      success: true,
      summary: {
        totalPurchase: totalPurchaseVal,
        totalTax: totalTaxVal,
        totalReturns: totalReturnValue,
        invoiceCount: invoices.length
      },
      daily: dailyReport,
      monthly: monthlyReport,
      vendorWise: vendorReport,
      productWise: productReport,
      gstRegister,
      returns: returnReport
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. VENDOR OUTSTANDING REPORTS LIST
exports.getVendorOutstandingList = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const outstandings = await VendorOutstanding.find({ tenantId }).sort('-dueDate');
    
    const mapped = outstandings.map(out => {
      const daysOutstanding = Math.max(0, Math.floor((Date.now() - new Date(out.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)));
      const overdueDays = Math.max(0, Math.floor((Date.now() - new Date(out.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
      
      return {
        ...out.toObject(),
        daysOutstanding,
        overdueDays
      };
    });
    
    res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. VENDOR DISBURSEMENT PAYMENT HISTORY
exports.getVendorPaymentHistory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const payments = await VendorPayment.find({ tenantId }).sort('-paymentDate');
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

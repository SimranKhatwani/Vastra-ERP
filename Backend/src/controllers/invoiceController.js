const Invoice = require('../models/invoiceModel');
const { recordActivityLog } = require('./staffActivityController');
const Product = require('../models/productModel');
const Customer = require('../models/customerModel');
const Alteration = require('../models/alterationModel');
const mongoose = require('mongoose');
const { emitToTenant, emitToRole, emitToUser } = require('../socket/socketServer');
const { processWhatsAppDispatch } = require('../services/invoiceService');
const { calculateStockStatus } = require('../services/stockCalculationService');

// Helper: check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;

exports.createInvoice = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { items, customerId, paymentMethod, amountPaid, grandTotal } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invoice must contain at least one item' });
    }

    // Strip the frontend-generated `id` field so Mongoose auto-generates _id
    const invoiceData = { ...req.body };
    delete invoiceData.id;

    // 1. Create the Invoice
    const invoice = await Invoice.create({
      ...invoiceData,
      tenantId
    });

    // Update any pre-created alteration tickets with the final invoice number and ID
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.alterationRecord && (item.alterationRecord._id || item.alterationRecord.id)) {
          try {
            const altId = item.alterationRecord._id || item.alterationRecord.id;
            await Alteration.findByIdAndUpdate(altId, {
              invoiceNumber: invoice.invoiceNo,
              invoiceId: invoice._id.toString()
            });
          } catch (altErr) {
            console.error('Failed to update alteration record invoice number:', altErr.message);
          }
        }
      }
    }

    // 2. Deduct Stock for each product (skip custom/non-catalog items)
    for (const item of items) {
      if (item.productId && isValidObjectId(item.productId)) {
        try {
          const product = await Product.findOne({ _id: item.productId, tenantId });
          if (product) {
            product.soldQuantity = (product.soldQuantity || 0) + item.quantity;
            calculateStockStatus(product);
            await product.save();

            // Log OUTBOUND movement for sale
            try {
              const inventoryMovementService = require('../services/inventoryMovementService');
              await inventoryMovementService.createMovement(tenantId, {
                product,
                movementType: 'OUTBOUND',
                activity: 'POS_SALE',
                quantity: item.quantity,
                referenceType: 'Invoice',
                referenceId: invoice._id,
                referenceNumber: invoice.invoiceNo || '',
                performedBy: req.user ? req.user.name : 'Billing POS',
                remarks: 'Billing checkout stock issue'
              });
            } catch (moveErr) {
              console.error('Movement logging failed for sale:', moveErr.message);
            }

            emitToTenant(tenantId, 'inventory.updated', { product, tenantId, event: 'inventory.updated' });
            if (product.status === 'Low Stock') {
              emitToTenant(tenantId, 'inventory.low', { product, tenantId, event: 'inventory.low' });
            }
          }
        } catch (stockErr) {
          console.warn('Stock deduction skipped for item:', item.productId, stockErr.message);
        }
      }
    }

    // 3. Update Customer Financials (if a valid customer is attached)
    if (customerId && isValidObjectId(customerId)) {
      try {
        const LoyaltySettings = require('../models/loyaltySettingsModel');
        const customer = await Customer.findOne({ _id: customerId, tenantId });
        if (customer) {
          customer.totalInvoices += 1;
          customer.totalSpent += grandTotal;
          
          // Loyalty Points Calculation
          let loyaltySettings = await LoyaltySettings.findOne({ tenantId });
          if (!loyaltySettings) {
            loyaltySettings = { enabled: true, rupeesPerPoint: 20 };
          }
          
          if (loyaltySettings.enabled && loyaltySettings.rupeesPerPoint > 0) {
            const pointsEarned = Math.floor(grandTotal / loyaltySettings.rupeesPerPoint);
            customer.loyaltyPoints += pointsEarned;
          }

          if (paymentMethod === 'Credit') {
            customer.outstandingBalance += grandTotal;
          } else if (amountPaid < grandTotal) {
            customer.outstandingBalance += (grandTotal - amountPaid);
          }

          await customer.save();
        }
      } catch (custErr) {
        console.warn('Customer update skipped:', custErr.message);
      }
    }

    // 4. Update Employee Commission (Product-wise)
    try {
      const CommissionSettings = require('../models/commissionSettingsModel');
      const CommissionHistory = require('../models/commissionHistoryModel');
      const Employee = require('../models/employeeModel');

      let settings = await CommissionSettings.findOne({ tenantId });
      if (!settings) {
        settings = {
          isEnabled: true,
          salespersonPercentage: 1.5,
          workerPercentage: 0.5,
          calculationBasis: 'Net Selling Price'
        };
      }

      if (settings.isEnabled) {
        for (let i = 0; i < invoice.items.length; i++) {
          const item = invoice.items[i];
          const netAmount = item.totalPrice; // This is (price - discount) * quantity
          
          let totalCommissionForThisItem = 0;

          // Helper to process commission for a role
          const processCommission = async (empId, empName, role, percentage) => {
            if (!empId || !isValidObjectId(empId)) return 0;
            
            const commAmount = Number((netAmount * (percentage / 100)).toFixed(2));
            if (commAmount <= 0) return 0;

            await CommissionHistory.create({
              tenantId,
              invoiceId: invoice._id,
              invoiceNo: invoice.invoiceNo,
              productId: item.productId,
              productName: item.name,
              employeeId: empId,
              employeeName: empName,
              employeeRole: role,
              sellingPrice: item.price,
              quantity: item.quantity,
              netAmountBasis: netAmount,
              commissionPercentage: percentage,
              commissionAmount: commAmount,
              status: 'Pending'
            });

            await Employee.updateOne(
              { _id: empId, tenantId },
              { 
                $inc: {
                  'commissionEarned': commAmount,
                  'commissionSummary.pending': commAmount,
                  'commissionSummary.today': commAmount,
                  'commissionSummary.weekly': commAmount,
                  'commissionSummary.monthly': commAmount,
                  'commissionSummary.yearly': commAmount,
                  'commissionSummary.lifetime': commAmount,
                  'commissionSummary.totalProductsSold': item.quantity
                }
              }
            );

            return commAmount;
          };

          const spComm = await processCommission(item.salespersonId, item.salespersonName, 'Salesperson', settings.salespersonPercentage);
          const wComm = await processCommission(item.workerId, item.workerName, 'Worker', settings.workerPercentage);

          // Update the invoice item itself with commission details
          if (spComm > 0 || wComm > 0) {
            item.commissionPercentageSalesperson = settings.salespersonPercentage;
            item.commissionPercentageWorker = settings.workerPercentage;
            item.commissionAmountSalesperson = spComm;
            item.commissionAmountWorker = wComm;
            item.totalCommission = spComm + wComm;
            item.commissionStatus = 'Pending';
          }
        }
        await invoice.save(); // save the updated item commissions
        emitToTenant(tenantId, 'commission.updated', { event: 'commission.updated' });
      }
    } catch (commErr) {
      console.warn('Product-wise commission update skipped or failed:', commErr.message);
    }

    emitToTenant(tenantId, 'invoice.created', {
      invoice,
      tenantId,
      event: 'invoice.created'
    });
    emitToTenant(tenantId, 'activity.feed', {
      id: invoice._id.toString(),
      type: 'invoice',
      action: 'INVOICE_CREATED',
      icon: '🧾',
      color: 'emerald',
      title: `Invoice ${invoice.invoiceNo || '#' + invoice._id.toString().slice(-6)} generated`,
      detail: `${invoice.customerName || 'Walk-in Customer'} · ₹${(invoice.grandTotal || 0).toLocaleString('en-IN')} · ${invoice.paymentMethod || 'Cash'}`,
      user: req.user?.name || 'Staff',
      timestamp: new Date().toISOString(),
      meta: {
        amount: invoice.grandTotal,
        invoiceNo: invoice.invoiceNo,
        customer: invoice.customerName,
        paymentMethod: invoice.paymentMethod,
        itemCount: invoice.items?.length || 0,
      },
    });
    emitToRole('admin', 'dashboard.stats.updated', { tenantId, event: 'dashboard.stats.updated' });
    emitToRole('manager', 'dashboard.stats.updated', { tenantId, event: 'dashboard.stats.updated' });

          // Log Activity
      await recordActivityLog(req, {
        module: 'Billing',
        action: 'BILL_CREATED',
        recordId: invoice.invoiceNo,
        recordName: `Invoice ${invoice.invoiceNo} generated`,
        newValue: `${invoice.customerName || 'Walk-in'} - ₹${(invoice.grandTotal || 0).toLocaleString('en-IN')}`,
        status: 'Success'
      });

      res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { search, fulfillmentStatus } = req.query;
    let query = { tenantId };

    if (fulfillmentStatus) {
      query.fulfillmentStatus = fulfillmentStatus;
    }

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { invoiceNo: { $regex: safeSearch, $options: 'i' } },
        { customerName: { $regex: safeSearch, $options: 'i' } },
        { customerPhone: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(query).sort('-date');

    // Fetch and dynamically attach alterations
    const invoiceNos = invoices.map(inv => inv.invoiceNo).filter(Boolean);
    const alterations = await Alteration.find({ invoiceNumber: { $in: invoiceNos }, tenantId });

    const plainInvoices = invoices.map(inv => {
      const plainInv = inv.toObject();
      plainInv.items = plainInv.items.map(item => {
        const matchedAlt = alterations.find(alt => 
          alt.invoiceNumber === plainInv.invoiceNo &&
          (alt.productId === item.productId || alt.productName === item.name) &&
          (!alt.size || alt.size === item.size) &&
          (!alt.color || alt.color === item.color)
        );
        if (matchedAlt) {
          item.hasAlteration = true;
          item.alterationRecord = matchedAlt;
        }
        return item;
      });
      return plainInv;
    });
      
    res.status(200).json({ success: true, count: plainInvoices.length, data: plainInvoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Getting a specific invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId })
      .populate('customerId', 'name phone email whatsappNumber');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const plainInvoice = invoice.toObject();
    const alterations = await Alteration.find({ invoiceNumber: plainInvoice.invoiceNo, tenantId });
    plainInvoice.items = plainInvoice.items.map(item => {
      const matchedAlt = alterations.find(alt => 
        (alt.productId === item.productId || alt.productName === item.name) &&
        (!alt.size || alt.size === item.size) &&
        (!alt.color || alt.color === item.color)
      );
      if (matchedAlt) {
        item.hasAlteration = true;
        item.alterationRecord = matchedAlt;
      }
      return item;
    });

    emitToTenant(tenantId, 'invoice.updated', {
      invoice: plainInvoice,
      tenantId,
      event: 'invoice.updated'
    });

    res.status(200).json({ success: true, data: plainInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Manually trigger or retry WhatsApp dispatch for an invoice
exports.sendWhatsApp = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const result = await processWhatsAppDispatch(invoice._id.toString(), tenantId.toString());

    if (result.success) {
      emitToTenant(tenantId, 'whatsapp.sent', {
        invoice,
        tenantId,
        event: 'whatsapp.sent'
      });
      return res.status(200).json({
        success: true,
        message: 'Invoice dispatched via WhatsApp successfully.',
        messageId: result.messageId,
      });
    }

    emitToTenant(tenantId, 'whatsapp.failed', {
      invoice,
      tenantId,
      event: 'whatsapp.failed',
      reason: result.reason
    });

    return res.status(200).json({
      success: false,
      message: result.reason || 'WhatsApp dispatch failed.',
    });
  } catch (error) {
    console.error('[invoiceController.sendWhatsApp]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.scanInvoice = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { invoiceNo } = req.params;
    const invoice = await Invoice.findOne({ tenantId, invoiceNo }).populate('customerId', 'name phone email whatsappNumber').populate('assignedTailor', 'name');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changeDeliveryDate = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { expectedDeliveryDate } = req.body;
    const invoice = await Invoice.findOneAndUpdate({ _id: req.params.id, tenantId }, { expectedDeliveryDate }, { new: true });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignTailor = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { tailorId } = req.body;
    const invoice = await Invoice.findOneAndUpdate({ _id: req.params.id, tenantId }, { assignedTailor: tailorId }, { new: true });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const Employee = require('../models/employeeModel');
    if (tailorId) {
      await Employee.findByIdAndUpdate(tailorId, { $inc: { currentWorkload: 1 } });
    }
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// PROCESS SALES RETURN
// ==========================================
exports.processSalesReturn = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { returnedItemIds, returnReason, refundMethod } = req.body;

    const query = isValidObjectId(id)
      ? { _id: id, tenantId }
      : { invoiceNo: id, tenantId };

    const invoice = await Invoice.findOne(query);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    let refundAmt = 0;
    const targetItemIds = returnedItemIds || [];
    const returnedItemsArray = [];

    for (let item of invoice.items) {
      const matchKey = item.productId || item._id?.toString() || item.sku;
      if (targetItemIds.includes(matchKey) || targetItemIds.includes(item.name) || targetItemIds.includes(item.productId)) {
        if (!item.isReturned) {
          item.isReturned = true;
          item.returnReason = returnReason || 'Defective / Customer Choice';
          item.returnedAt = new Date();

          const lineVal = item.totalPrice || (item.price * item.quantity);
          refundAmt += lineVal;
            
          returnedItemsArray.push({
             productId: item.productId,
             name: item.name,
             sku: item.sku,
             quantity: item.quantity,
             price: item.price,
             total: lineVal
          });

          // Restock product stock in inventory
          if (item.productId && isValidObjectId(item.productId)) {
            try {
              const product = await Product.findOne({ _id: item.productId, tenantId });
              if (product) {
                product.stock = (product.stock || 0) + item.quantity;
                product.soldQuantity = Math.max(0, (product.soldQuantity || 0) - item.quantity);
                calculateStockStatus(product);
                await product.save();

                try {
                  const inventoryMovementService = require('../services/inventoryMovementService');
                  await inventoryMovementService.createMovement(tenantId, {
                    product,
                    movementType: 'INBOUND',
                    activity: 'SALES_RETURN',
                    quantity: item.quantity,
                    referenceType: 'Invoice',
                    referenceId: invoice._id,
                    referenceNumber: invoice.invoiceNo || '',
                    performedBy: req.user ? req.user.name : 'Returns POS',
                    remarks: `Sales Return: ${returnReason || 'Customer return'}`
                  });
                } catch (moveErr) {
                  console.error('Movement logging failed for return:', moveErr.message);
                }
              }
            } catch (stockErr) {
              console.warn('Stock restock skipped for returned item:', item.productId, stockErr.message);
            }
          }
        }
      }
    }

    if (returnedItemsArray.length > 0) {
      try {
        const SalesReturn = require('../models/salesReturnModel');
        await SalesReturn.create({
          tenantId,
          invoiceNo: invoice.invoiceNo,
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          items: returnedItemsArray,
          totalReturnAmount: refundAmt,
          reason: returnReason || 'Defective / Customer Choice',
          refundMethod: refundMethod || 'Cash'
        });
        } catch(srErr) {
          console.warn('SalesReturn creation skipped:', srErr.message);
          require('fs').appendFileSync('sales_return_error.log', new Date().toISOString() + ' - ' + srErr.message + '\n' + srErr.stack + '\n');
        }
    }

          // Log Activity
      await recordActivityLog(req, {
        module: 'Billing',
        action: 'PRODUCT_RETURNED',
        recordId: invoice.invoiceNo,
        recordName: `Return processed for Invoice #${invoice.invoiceNo}`,
        newValue: `Amount: ₹${refundAmt.toLocaleString('en-IN')} - ${returnReason || 'Customer Choice'}`,
        status: 'Success'
      });

      invoice.hasReturn = true;
    invoice.returnedAmount = (invoice.returnedAmount || 0) + refundAmt;
    
    // Refresh activity feed in realtime
    emitToTenant(tenantId, 'activity.feed', { tenantId, event: 'activity.feed.updated' });

    const allReturned = invoice.items.every(i => i.isReturned);
    invoice.status = allReturned ? 'Returned' : 'Partially Returned';

    await invoice.save();

    // Deduct Customer totalSpent / balance
    if (invoice.customerId && isValidObjectId(invoice.customerId)) {
      try {
        const customer = await Customer.findOne({ _id: invoice.customerId, tenantId });
        if (customer) {
          customer.totalSpent = Math.max(0, (customer.totalSpent || 0) - refundAmt);
          if (refundMethod === 'Credit' || invoice.paymentMethod === 'Credit') {
            customer.outstandingBalance = Math.max(0, (customer.outstandingBalance || 0) - refundAmt);
          }
          await customer.save();
        }
      } catch (custErr) {
        console.warn('Customer ledger update skipped on return:', custErr.message);
      }
    }

    emitToTenant(tenantId, 'invoice.updated', { invoice, tenantId, event: 'invoice.updated' });
    emitToTenant(tenantId, 'inventory.updated', { tenantId, event: 'inventory.updated' });
    emitToRole('admin', 'dashboard.stats.updated', { tenantId, event: 'dashboard.stats.updated' });

    res.status(200).json({ success: true, message: 'Sales return processed successfully', data: invoice, refundAmount: refundAmt });
  } catch (error) {
    console.error('Process return error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// PROCESS SALES EXCHANGE
// ==========================================
exports.processSalesExchange = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { oldItemIdx, exchangeReason, newItem } = req.body;

    const query = isValidObjectId(id)
      ? { _id: id, tenantId }
      : { invoiceNo: id, tenantId };

    const invoice = await Invoice.findOne(query);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const idx = Number(oldItemIdx) || 0;
    const oldItem = invoice.items[idx] || invoice.items[0];
    if (!oldItem) {
      return res.status(400).json({ success: false, message: 'Original item for exchange not found in invoice' });
    }

    oldItem.isExchanged = true;
    oldItem.exchangedFor = newItem ? newItem.name : 'Exchanged Garment';
    oldItem.exchangeReason = exchangeReason || 'Size / Fit Swap';

    // (Removed per-item exchange return.create)

    // Restock old item
    if (oldItem.productId && isValidObjectId(oldItem.productId)) {
      try {
        const oldProduct = await Product.findOne({ _id: oldItem.productId, tenantId });
        if (oldProduct) {
          oldProduct.stock = (oldProduct.stock || 0) + (oldItem.quantity || 1);
          oldProduct.soldQuantity = Math.max(0, (oldProduct.soldQuantity || 0) - (oldItem.quantity || 1));
          calculateStockStatus(oldProduct);
          await oldProduct.save();
        }
      } catch (e) {
        console.warn('Old product restock skipped:', e.message);
      }
    }

    // Deduct stock for new item
    let newPrice = 0;
    if (newItem) {
      newPrice = Number(newItem.price || newItem.sellingPrice) || 0;
      if (newItem.id || newItem._id) {
        const newProdId = newItem.id || newItem._id;
        if (isValidObjectId(newProdId)) {
          try {
            const newProduct = await Product.findOne({ _id: newProdId, tenantId });
            if (newProduct) {
              newProduct.stock = Math.max(0, (newProduct.stock || 0) - 1);
              newProduct.soldQuantity = (newProduct.soldQuantity || 0) + 1;
              calculateStockStatus(newProduct);
              await newProduct.save();
            }
          } catch (e) {
            console.warn('New product stock deduction skipped:', e.message);
          }
        }
      }
    }

    const oldPrice = oldItem.totalPrice || (oldItem.price * oldItem.quantity);
    const priceDiff = newPrice - oldPrice;

    const docket = {
      docketNo: `EXCH-${Date.now().toString().slice(-6)}`,
      originalInvoiceNo: invoice.invoiceNo,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      reason: exchangeReason,
      oldItem: {
        name: oldItem.name,
        size: oldItem.size || 'M',
        color: oldItem.color || 'Std',
        price: oldPrice
      },
      newItem: {
        name: newItem ? newItem.name : 'New Item',
        sku: newItem ? (newItem.sku || newItem.barcode || newItem.id) : 'SKU-NEW',
        size: newItem ? (newItem.size || 'M') : 'M',
        color: newItem ? (newItem.color || 'Std') : 'Std',
        price: newPrice
      },
      priceDiff,
      cashierName: req.user ? req.user.name : 'Store Cashier',
      createdAt: new Date().toISOString()
    };

          // Log Activity
      await recordActivityLog(req, {
        module: 'Billing',
        action: 'PRODUCT_EXCHANGED',
        recordId: invoice.invoiceNo,
        recordName: `Exchange processed for Invoice #${invoice.invoiceNo}`,
        newValue: `Amount: ₹${(oldItem.totalPrice || oldItem.price).toLocaleString('en-IN')} - ${exchangeReason || 'Size / Fit Swap'}`,
        status: 'Success'
      });

      invoice.hasExchange = true;
    invoice.exchangeSlip = docket;
    
    const allExchanged = invoice.items.every(i => i.isExchanged);
    invoice.status = allExchanged ? 'Exchanged' : 'Partially Exchanged';

    await invoice.save();

    emitToTenant(tenantId, 'invoice.updated', { invoice, tenantId, event: 'invoice.updated' });
    emitToTenant(tenantId, 'inventory.updated', { tenantId, event: 'inventory.updated' });
    emitToRole('admin', 'dashboard.stats.updated', { tenantId, event: 'dashboard.stats.updated' });

    res.status(200).json({ success: true, message: 'Exchange processed successfully', data: invoice, docket });
  } catch (error) {
    console.error('Process exchange error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


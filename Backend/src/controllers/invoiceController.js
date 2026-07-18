const Invoice = require('../models/invoiceModel');
const Product = require('../models/productModel');
const Customer = require('../models/customerModel');
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

    // 2. Deduct Stock for each product (skip custom/non-catalog items)
    for (const item of items) {
      if (item.productId && isValidObjectId(item.productId)) {
        try {
          const product = await Product.findOne({ _id: item.productId, tenantId });
          if (product) {
            product.soldQuantity = (product.soldQuantity || 0) + item.quantity;
            calculateStockStatus(product);
            await product.save();

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
        const customer = await Customer.findOne({ _id: customerId, tenantId });
        if (customer) {
          customer.totalInvoices += 1;
          customer.totalSpent += grandTotal;
          customer.loyaltyPoints += Math.floor(grandTotal * 0.05);

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
    emitToRole('admin', 'dashboard.stats.updated', { tenantId, event: 'dashboard.stats.updated' });
    emitToRole('manager', 'dashboard.stats.updated', { tenantId, event: 'dashboard.stats.updated' });

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
      
    res.status(200).json({ success: true, count: invoices.length, data: invoices });
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

    emitToTenant(tenantId, 'invoice.updated', {
      invoice,
      tenantId,
      event: 'invoice.updated'
    });

    res.status(200).json({ success: true, data: invoice });
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

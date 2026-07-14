const Invoice = require('../models/invoiceModel');
const Product = require('../models/productModel');
const Customer = require('../models/customerModel');
const mongoose = require('mongoose');
const { processWhatsAppDispatch } = require('../services/invoiceService');

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
            product.stock = Math.max(0, product.stock - item.quantity);
            await product.save();
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

    // 4. Update Employee Commission (if an employee is attached)
    const { employeeId } = req.body;
    if (employeeId && isValidObjectId(employeeId)) {
      try {
        const Employee = require('../models/employeeModel');
        const employee = await Employee.findOne({ _id: employeeId, tenantId });
        if (employee) {
          employee.commissionEarned += Math.floor(grandTotal * 0.02);
          await employee.save();
        }
      } catch (empErr) {
        console.warn('Employee commission update skipped:', empErr.message);
      }
    }

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const invoices = await Invoice.find({ tenantId }).sort('-date');
      
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
      return res.status(200).json({
        success: true,
        message: 'Invoice dispatched via WhatsApp successfully.',
        messageId: result.messageId,
      });
    }

    return res.status(200).json({
      success: false,
      message: result.reason || 'WhatsApp dispatch failed.',
    });
  } catch (error) {
    console.error('[invoiceController.sendWhatsApp]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

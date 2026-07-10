const Invoice = require('../models/invoiceModel');
const Product = require('../models/productModel');
const Customer = require('../models/customerModel');

exports.createInvoice = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { items, customerId, paymentMethod, amountPaid, grandTotal } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invoice must contain at least one item' });
    }

    // 1. Create the Invoice
    const invoice = await Invoice.create({
      ...req.body,
      tenantId
    });

    // 2. Deduct Stock for each product
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, tenantId });
      if (product) {
        // Prevent negative stock
        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save();
      }
    }

    // 3. Update Customer Financials (if a customer is attached)
    if (customerId) {
      const customer = await Customer.findOne({ _id: customerId, tenantId });
      if (customer) {
        customer.totalInvoices += 1;
        customer.totalSpent += grandTotal;
        
        // Add 5% loyalty points of grandTotal
        customer.loyaltyPoints += Math.floor(grandTotal * 0.05);

        // If Credit, increase outstanding balance
        if (paymentMethod === 'Credit') {
          customer.outstandingBalance += grandTotal;
        } else if (amountPaid < grandTotal) {
          // If Partial Payment, add the remainder to outstanding balance
          customer.outstandingBalance += (grandTotal - amountPaid);
        }

        await customer.save();
      }
    }

    // 4. Update Employee Commission (if an employee is attached)
    const { employeeId } = req.body;
    if (employeeId) {
      const Employee = require('../models/employeeModel');
      const employee = await Employee.findOne({ _id: employeeId, tenantId });
      if (employee) {
        // Award 2% commission
        employee.commissionEarned += Math.floor(grandTotal * 0.02);
        await employee.save();
      }
    }

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
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
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId }).populate('customerId', 'name phone email');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

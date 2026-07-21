const Vendor = require('../models/vendorModel');

// 1. CREATE VENDOR
exports.createVendor = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendor = new Vendor({
      ...req.body,
      tenantId
    });
    await vendor.save();
    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. GET VENDORS
exports.getVendors = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendors = await Vendor.find({ tenantId }).sort('-createdAt');
    res.status(200).json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. UPDATE VENDOR
exports.updateVendor = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. DELETE VENDOR
exports.deleteVendor = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendor = await Vendor.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    res.status(200).json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. GET VENDOR PURCHASE HISTORY
exports.getVendorPurchaseHistory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendorId = req.params.id;
    const PurchaseInvoice = require('../models/purchaseInvoiceModel');
    const PurchaseReturn = require('../models/purchaseReturnModel');
    
    const invoices = await PurchaseInvoice.find({ tenantId, vendorId }).sort('-createdAt');
    const returns = await PurchaseReturn.find({ tenantId, vendorId }).sort('-createdAt');
    
    res.status(200).json({ success: true, invoices, returns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. GET VENDOR PAYMENT HISTORY
exports.getVendorPaymentHistory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendorId = req.params.id;
    const VendorPayment = require('../models/vendorPaymentModel');
    
    const payments = await VendorPayment.find({ tenantId, vendorId }).sort('-paymentDate');
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. GET VENDOR LEDGER
exports.getVendorLedger = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendorId = req.params.id;
    const PurchaseInvoice = require('../models/purchaseInvoiceModel');
    const VendorPayment = require('../models/vendorPaymentModel');
    const PurchaseReturn = require('../models/purchaseReturnModel');
    const Product = require('../models/productModel');

    const invoices = await PurchaseInvoice.find({ tenantId, vendorId });
    const payments = await VendorPayment.find({ tenantId, vendorId });
    const returns = await PurchaseReturn.find({ tenantId, vendorId });

    let ledger = [];

    invoices.forEach(inv => {
      ledger.push({
        date: inv.invoiceDate || inv.createdAt,
        type: 'Invoice',
        refNo: inv.invoiceNo,
        description: `Purchase Invoice: ${inv.referenceNo || 'No Ref'}`,
        debit: inv.grandTotal, // We owe them
        credit: 0,
        balanceEffect: inv.grandTotal,
      });
    });

    payments.forEach(pay => {
      ledger.push({
        date: pay.paymentDate || pay.createdAt,
        type: 'Payment',
        refNo: pay.paymentNo,
        description: `Payout via ${pay.paymentMode} - Ref: ${pay.referenceNo || 'None'}`,
        debit: 0,
        credit: pay.amount, // We paid them
        balanceEffect: -pay.amount,
      });
    });

    for (const ret of returns) {
      let refundAmt = 0;
      if (ret.actionRequired === 'Refund') {
        const prod = await Product.findOne({ _id: ret.productId, tenantId });
        refundAmt = Math.round((prod?.purchasePrice || prod?.price || 0) * Number(ret.quantity));
      }
      ledger.push({
        date: ret.createdAt,
        type: 'Return',
        refNo: ret.returnNo,
        description: `Purchase Return: ${ret.invoiceRef || 'No Ref'} (Reason: ${ret.reason || 'None'})`,
        debit: 0,
        credit: refundAmt, // Refund decreases outstanding
        balanceEffect: -refundAmt,
      });
    }

    // Sort by date ascending
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    ledger = ledger.map(entry => {
      runningBalance += entry.balanceEffect;
      return {
        ...entry,
        runningBalance,
      };
    });

    // Reverse to show latest first
    ledger.reverse();

    res.status(200).json({ success: true, data: ledger });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


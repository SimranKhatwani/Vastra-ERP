const PurchaseOrder = require('../models/purchaseOrderModel');
const Product = require('../models/productModel');
const Supplier = require('../models/supplierModel');
const purchaseService = require('../services/purchaseService');
const { calculateStockStatus } = require('../services/stockCalculationService');
const { emitToTenant, emitToRole } = require('../socket/socketServer');

exports.createPurchaseOrder = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const voucherData = req.body;

    if (!voucherData.items || voucherData.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Purchase Order must contain at least one item' });
    }

    const { purchaseOrder, supplier } = await purchaseService.processPurchaseVoucher(tenantId, voucherData);

    emitToTenant(tenantId, 'purchase.created', {
      purchaseOrder,
      tenantId,
      event: 'purchase.created'
    });
    emitToRole('manager', 'purchase.created', { purchaseOrder, tenantId, event: 'purchase.created' });

    res.status(201).json({ success: true, data: purchaseOrder });
  } catch (error) {
    console.error("PO Creation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPurchaseOrders = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const pos = await PurchaseOrder.find({ tenantId }).sort('-date');
      
    res.status(200).json({ success: true, count: pos.length, data: pos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Updating a PO (Editing a voucher)
exports.updatePurchaseOrder = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let po = await PurchaseOrder.findOne({ _id: req.params.id, tenantId });

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }
    
    // Revert old PO effects if it was Completed
    if (po.status === 'Completed') {
      for (const item of po.items) {
        const product = await Product.findOne({ _id: item.productId, tenantId });
        if (product) {
          product.purchasedQuantity = Math.max(0, (product.purchasedQuantity || 0) - item.quantity);
          calculateStockStatus(product);
          await product.save();
        }
      }
      const oldSupplier = await Supplier.findOne({ _id: po.supplierId, tenantId });
      if (oldSupplier) {
        const outstandingDebt = po.grandTotal - (po.outstandingPaid || 0);
        if (outstandingDebt > 0) {
          oldSupplier.outstandingBalance -= outstandingDebt;
          await oldSupplier.save();
        }
      }
    }

    // Delete the old record
    await PurchaseOrder.findByIdAndDelete(req.params.id);

    // Generate new PO using the existing robust service logic
    const voucherData = req.body;
    if (!voucherData.poNo) voucherData.poNo = po.poNo;

    const { purchaseOrder, supplier } = await purchaseService.processPurchaseVoucher(tenantId, voucherData);

    emitToTenant(tenantId, 'purchase.approved', {
      purchaseOrder: purchaseOrder,
      tenantId,
      event: 'purchase.approved'
    });

    res.status(200).json({ success: true, data: purchaseOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a PO
exports.deletePurchaseOrder = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const po = await PurchaseOrder.findOne({ _id: req.params.id, tenantId });

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }

    // Revert old PO effects if it was Completed
    if (po.status === 'Completed') {
      for (const item of po.items) {
        const product = await Product.findOne({ _id: item.productId, tenantId });
        if (product) {
          product.purchasedQuantity = Math.max(0, (product.purchasedQuantity || 0) - item.quantity);
          calculateStockStatus(product);
          await product.save();
        }
      }
      const supplier = await Supplier.findOne({ _id: po.supplierId, tenantId });
      if (supplier) {
        const outstandingDebt = po.grandTotal - (po.outstandingPaid || 0);
        if (outstandingDebt > 0) {
          supplier.outstandingBalance -= outstandingDebt;
          await supplier.save();
        }
      }
    }

    await PurchaseOrder.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Purchase Order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

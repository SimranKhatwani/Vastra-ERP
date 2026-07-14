const PurchaseOrder = require('../models/purchaseOrderModel');
const Product = require('../models/productModel');
const Supplier = require('../models/supplierModel');
const { emitToTenant, emitToRole } = require('../socket/socketServer');

exports.createPurchaseOrder = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { items, supplierId, status, outstandingPaid, grandTotal } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Purchase Order must contain at least one item' });
    }

    const po = await PurchaseOrder.create({
      ...req.body,
      tenantId
    });

    // If PO is created as Completed, or if we want to handle stock additions right away for completed POs:
    if (status === 'Completed') {
      // 1. Add Stock
      for (const item of items) {
        const product = await Product.findOne({ _id: item.productId, tenantId });
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    // Accumulate supplier outstanding debt
    const outstandingDebt = grandTotal - (outstandingPaid || 0);
    if (outstandingDebt > 0 && supplierId) {
      const supplier = await Supplier.findOne({ _id: supplierId, tenantId });
      if (supplier) {
        supplier.outstandingBalance += outstandingDebt;
        await supplier.save();
      }
    }

    emitToTenant(tenantId, 'purchase.created', {
      purchaseOrder: po,
      tenantId,
      event: 'purchase.created'
    });
    emitToRole('manager', 'purchase.created', { purchaseOrder: po, tenantId, event: 'purchase.created' });

    res.status(201).json({ success: true, data: po });
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

// Updating a PO (e.g. from Pending to Completed)
exports.updatePurchaseOrder = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let po = await PurchaseOrder.findOne({ _id: req.params.id, tenantId });

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }
    
    if (po.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Completed Purchase Orders cannot be modified.'});
    }

    // Check if status is changing to Completed
    const isCompleting = req.body.status === 'Completed' && po.status !== 'Completed';

    po = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (isCompleting) {
      // 1. Add Stock
      for (const item of po.items) {
        const product = await Product.findOne({ _id: item.productId, tenantId });
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    emitToTenant(tenantId, 'purchase.approved', {
      purchaseOrder: po,
      tenantId,
      event: 'purchase.approved'
    });
    emitToRole('admin', 'dashboard.stats.updated', { tenantId, event: 'dashboard.stats.updated' });

    res.status(200).json({ success: true, data: po });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

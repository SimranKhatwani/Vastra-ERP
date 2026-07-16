const PurchaseOrder = require('../models/purchaseOrderModel');

exports.createPurchaseOrder = async (tenantId, poData) => {
  return await PurchaseOrder.create({
    tenantId,
    ...poData
  });
};

exports.updatePurchaseOrder = async (tenantId, poId, updateData) => {
  return await PurchaseOrder.findByIdAndUpdate(poId, updateData, {
    new: true,
    runValidators: true,
  });
};

exports.getPurchaseOrders = async (tenantId) => {
  return await PurchaseOrder.find({ tenantId }).sort('-date');
};

exports.getPurchaseOrderById = async (tenantId, poId) => {
  return await PurchaseOrder.findOne({ _id: poId, tenantId });
};

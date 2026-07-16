const purchaseRepo = require('../repositories/purchaseRepository');
const productRepo = require('../repositories/productRepository');
const Supplier = require('../models/supplierModel');
const mongoose = require('mongoose');

exports.processPurchaseVoucher = async (tenantId, voucherData) => {
  try {
    // 1. Find or create the Supplier
    let supplierId = voucherData.supplierId;
    let supplier = null;
    
    // Check if it's a valid object ID. The frontend might send generated IDs.
    const isValidId = mongoose.Types.ObjectId.isValid(supplierId);
    
    if (isValidId) {
      supplier = await Supplier.findOne({ _id: supplierId, tenantId });
    }
    
    if (!supplier && voucherData.supplierName) {
      // Find by name
      supplier = await Supplier.findOne({ 
        tenantId, 
        name: { $regex: new RegExp(`^${voucherData.supplierName}$`, 'i') } 
      });
      
      if (!supplier) {
        supplier = await Supplier.create({
          tenantId,
          name: voucherData.supplierName,
          phone: `N/A-${Date.now().toString().slice(-6)}`,
          status: 'Active',
          outstandingBalance: 0,
        });
      }
    }
    
    if (!supplier) {
      throw new Error("Supplier information is required.");
    }
    
    supplierId = supplier._id;
    
    // 2. Process Items (Products & Stock)
    const processedItems = [];
    for (const item of voucherData.items) {
      // Create or update the product based on barcode/sku
      const productObj = await productRepo.upsertProduct(tenantId, {
        name: item.itemName || item.name || 'Unnamed Product',
        category: item.subCategory || item.category || 'Uncategorized',
        brand: item.brand || 'No Brand',
        sku: item.sku || `${item.designNo || 'NA'}-${item.barcode || Math.floor(Math.random() * 90000)}`,
        barcode: item.barcode,
        purchasePrice: item.purchasePrice || item.purchaseRate || item.rate || 0,
        sellingPrice: item.sellingPrice || item.mrp || 0,
        mrp: item.mrp || 0,
        stock: item.quantity || item.qty || 1,
        color: item.colorPrimary || item.color,
        size: item.size,
        fabricCode: item.fabricCode,
        gsm: item.gsm,
        width: item.width,
        uom: item.uom,
      });
      
      processedItems.push({
        productId: productObj._id,
        name: productObj.name,
        quantity: item.quantity || item.qty || 1,
        purchasePrice: productObj.purchasePrice,
        totalPrice: item.totalPrice || item.amount || (productObj.purchasePrice * (item.quantity || 1)),
      });
    }

    // 3. Create the Purchase Order
    const outstandingPaid = voucherData.outstandingPaid || 0;
    const outstandingDebt = (voucherData.grandTotal || 0) - outstandingPaid;
    
    const newPO = await purchaseRepo.createPurchaseOrder(tenantId, {
      poNo: voucherData.poNo || `PO-${Date.now()}`,
      invoiceNo: voucherData.invoiceNo || `INV-${Date.now()}`,
      date: voucherData.date || new Date(),
      supplierId: supplierId,
      supplierName: supplier.name,
      items: processedItems,
      subTotal: voucherData.subTotal || 0,
      gstTotal: voucherData.gstTotal || 0,
      grandTotal: voucherData.grandTotal || 0,
      status: voucherData.status || 'Completed',
      outstandingPaid: outstandingPaid,
    });
    
    // 4. Update Supplier Balance
    if (outstandingDebt > 0) {
      supplier.outstandingBalance += outstandingDebt;
      await supplier.save();
    }
    
    return {
      purchaseOrder: newPO,
      supplier
    };
  } catch (error) {
    throw error;
  }
};

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
    const productsMap = {};
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
      productsMap[productObj._id.toString()] = productObj;
    }

    // 3. Create the Purchase Order
    const outstandingPaid = voucherData.outstandingPaid || 0;
    const outstandingDebt = (voucherData.grandTotal || 0) - outstandingPaid;
    
    const newPO = await purchaseRepo.createPurchaseOrder(tenantId, {
      // Append timestamp so re-imports of the same bill always get a unique poNo
      poNo: voucherData.poNo ? `${voucherData.poNo}-${Date.now().toString().slice(-6)}` : `PO-${Date.now()}`,
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

    // Log INBOUND movement for purchase order receipt
    try {
      const inventoryMovementService = require('./inventoryMovementService');
      for (const item of processedItems) {
        const product = productsMap[item.productId.toString()];
        if (product) {
          await inventoryMovementService.createMovement(tenantId, {
            product,
            movementType: 'INBOUND',
            activity: 'PURCHASE_RECEIVED',
            quantity: item.quantity,
            referenceType: 'Purchase Order',
            referenceId: newPO._id,
            referenceNumber: newPO.poNo || '',
            performedBy: voucherData.performedBy || 'Procurement Manager',
            remarks: `Procurement entry from supplier: ${supplier.name}`
          });

          // Create dynamic batch for purchase item
          try {
            const Batch = require('../models/batchModel');
            const batchNo = `BAT-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;
            await Batch.create({
              tenantId,
              batchNo,
              productId: product._id,
              supplierId: supplierId,
              purchaseOrderId: newPO._id,
              purchaseInvoiceNo: newPO.invoiceNo || `PINV-${newPO.poNo.slice(-5)}`,
              warehouseId: 'w-1',
              rack: 'RCK-A',
              shelf: 'SHLF-1',
              purchaseDate: newPO.date,
              receivedDate: new Date(),
              createdBy: voucherData.performedBy || 'Procurement Manager',
              purchaseQty: item.quantity,
              availableQty: item.quantity,
              costPrice: product.purchasePrice || 0,
              sellingPrice: product.sellingPrice || 0,
              mrp: product.mrp || 0,
              status: 'Available',
              remarks: `Auto-generated batch for purchase: ${newPO.poNo}`
            });
          } catch (batchErr) {
            console.error('Batch creation failed for purchase item:', batchErr.message);
          }
        }
      }
    } catch (moveErr) {
      console.error('Movement logging failed for purchase received:', moveErr.message);
    }
    
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

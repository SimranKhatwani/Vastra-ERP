const Batch = require('../models/batchModel');

// GET /api/batches
exports.getBatches = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { search = '', status } = req.query;
    
    const query = { tenantId };

    if (search) {
      query.$or = [
        { batchNo: { $regex: search, $options: 'i' } },
        { purchaseInvoiceNo: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    let batches = await Batch.find(query)
      .populate('productId')
      .populate('supplierId')
      .populate('purchaseOrderId')
      .sort('-createdAt');

    // Auto-seed if empty
    if (batches.length === 0 && !search && !status) {
      const Product = require('../models/productModel');
      const Supplier = require('../models/supplierModel');
      const dbProducts = await Product.find({ tenantId });
      const dbSuppliers = await Supplier.find({ tenantId });

      if (dbProducts.length > 0) {
        const sampleBatches = [
          {
            tenantId,
            batchNo: 'BAT-2026-001',
            productId: dbProducts[0]._id,
            supplierId: dbSuppliers[0] ? dbSuppliers[0]._id : undefined,
            purchaseInvoiceNo: 'PINV-90812',
            warehouseId: 'w-1',
            rack: 'RCK-A',
            shelf: 'SHLF-2',
            purchaseQty: 150,
            availableQty: 120,
            reservedQty: 20,
            soldQty: 10,
            costPrice: dbProducts[0].purchasePrice || 450,
            sellingPrice: dbProducts[0].sellingPrice || 899,
            mrp: dbProducts[0].mrp || 999,
            status: 'Available',
            remarks: 'Imported cotton textile lot'
          },
          {
            tenantId,
            batchNo: 'BAT-2026-002',
            productId: dbProducts[1] ? dbProducts[1]._id : dbProducts[0]._id,
            supplierId: dbSuppliers[1] ? dbSuppliers[1]._id : (dbSuppliers[0] ? dbSuppliers[0]._id : undefined),
            purchaseInvoiceNo: 'PINV-44102',
            warehouseId: 'w-2',
            rack: 'RCK-D',
            shelf: 'SHLF-1',
            purchaseQty: 80,
            availableQty: 0,
            reservedQty: 0,
            soldQty: 80,
            costPrice: (dbProducts[1] || dbProducts[0]).purchasePrice || 600,
            sellingPrice: (dbProducts[1] || dbProducts[0]).sellingPrice || 1200,
            mrp: (dbProducts[1] || dbProducts[0]).mrp || 1400,
            status: 'Closed',
            remarks: 'Linen custom weave batch'
          },
          {
            tenantId,
            batchNo: 'BAT-2026-003',
            productId: dbProducts[2] ? dbProducts[2]._id : dbProducts[0]._id,
            supplierId: dbSuppliers[0] ? dbSuppliers[0]._id : undefined,
            purchaseInvoiceNo: 'PINV-11894',
            warehouseId: 'w-3',
            rack: 'RCK-C',
            shelf: 'SHLF-3',
            purchaseQty: 250,
            availableQty: 210,
            reservedQty: 40,
            soldQty: 0,
            costPrice: (dbProducts[2] || dbProducts[0]).purchasePrice || 350,
            sellingPrice: (dbProducts[2] || dbProducts[0]).sellingPrice || 650,
            mrp: (dbProducts[2] || dbProducts[0]).mrp || 799,
            status: 'Reserved',
            remarks: 'Super 120s Wool lot'
          }
        ];
        await Batch.insertMany(sampleBatches);
        // Re-fetch
        batches = await Batch.find(query)
          .populate('productId')
          .populate('supplierId')
          .populate('purchaseOrderId')
          .sort('-createdAt');
      }
    }

    res.status(200).json({ success: true, count: batches.length, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/batches/:id
exports.getBatchById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const batch = await Batch.findOne({ _id: req.params.id, tenantId })
      .populate('productId')
      .populate('supplierId')
      .populate('purchaseOrderId');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    res.status(200).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/batches
exports.createBatch = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const batch = new Batch({
      ...req.body,
      tenantId
    });

    await batch.save();
    
    const populated = await Batch.findById(batch._id)
      .populate('productId')
      .populate('supplierId');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/batches/:id
exports.updateBatch = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let batch = await Batch.findOne({ _id: req.params.id, tenantId });

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    Object.assign(batch, req.body);
    await batch.save();

    const populated = await Batch.findById(batch._id)
      .populate('productId')
      .populate('supplierId')
      .populate('purchaseOrderId');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/batches/:id
exports.deleteBatch = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const batch = await Batch.findOneAndDelete({ _id: req.params.id, tenantId });

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

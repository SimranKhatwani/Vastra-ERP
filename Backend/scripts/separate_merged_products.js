const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Product = require('../src/models/Product');
const InventoryPiece = require('../src/models/InventoryPiece');
const PurchaseItem = require('../src/models/purchase/PurchaseItem');

const uri = process.env.MONGODB_URI || "mongodb+srv://vibhu:9t0NeSrKS9H9w2ZT@dhruv.5bvc54y.mongodb.net/vastra_erp";

async function separateProducts() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log("Connected to MongoDB Atlas:", uri.replace(/:[^:@]+@/, ':***@'));

  const products = await Product.find({ isDeleted: false });

  for (const product of products) {
    const pieces = await InventoryPiece.find({ productId: product._id, isDeleted: false });
    if (pieces.length <= 1) {
      if (pieces.length === 1) {
        const pc = pieces[0];
        if (pc.barcode && !product.barcode) product.barcode = pc.barcode;
        if (pc.primaryColor && !product.primaryColor) {
          product.primaryColor = pc.primaryColor;
          product.color = pc.primaryColor;
        }
        await product.save();
      }
      continue;
    }

    // Group pieces by barcode and color
    const groups = new Map();
    pieces.forEach(pc => {
      const key = `${pc.barcode || ''}_${pc.primaryColor || ''}_${pc.size || ''}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(pc);
    });

    if (groups.size <= 1) {
      // All pieces share the same barcode & color
      const pc = pieces[0];
      if (pc.barcode) product.barcode = pc.barcode;
      if (pc.primaryColor) {
        product.primaryColor = pc.primaryColor;
        product.color = pc.primaryColor;
      }
      await product.save();
      continue;
    }

    console.log(`Splitting Product ${product.itemName} (${product.designNo}) which has ${groups.size} distinct variants...`);
    let isFirst = true;

    for (const [key, groupPieces] of groups.entries()) {
      const samplePiece = groupPieces[0];
      const pColor = samplePiece.primaryColor || '';
      const pBarcode = samplePiece.barcode || '';
      const pSize = samplePiece.size || '';

      if (isFirst) {
        // Update first product to represent group 1
        product.barcode = pBarcode;
        product.primaryColor = pColor;
        product.color = pColor;
        if (pBarcode) product.itemCode = product.itemCode || `ITEM-${pBarcode}`;
        await product.save();
        isFirst = false;
        console.log(`   Updated original product to Variant: Barcode=${pBarcode}, Color=${pColor}`);
      } else {
        // Create new Product record for the other variant
        const newProd = new Product({
          tenantId: product.tenantId,
          designNo: product.designNo,
          itemCode: pBarcode ? (product.itemCode === `ITEM-${product.designNo}` ? `ITEM-${pBarcode}` : `${product.itemCode}-${pBarcode}`) : `ITEM-${Date.now()}`,
          itemName: product.itemName,
          subItem: pColor.toLowerCase().includes('yellow') ? 'SILK' : product.subItem,
          barcode: pBarcode,
          primaryColor: pColor,
          color: pColor,
          secondaryColor: samplePiece.secondaryColor || product.secondaryColor,
          size: pSize,
          brandId: product.brandId,
          categoryId: product.categoryId,
          firmId: product.firmId,
          firmName: product.firmName,
          hsnId: product.hsnId,
          gender: product.gender,
          topBottomSet: product.topBottomSet,
          defaultMRP: samplePiece.mrp || product.defaultMRP,
          imageUrl: product.imageUrl,
          typeOfGst: product.typeOfGst,
          gstStatus: product.gstStatus,
          discountStatus: product.discountStatus,
          importBatchId: product.importBatchId
        });

        await newProd.save();
        console.log(`   Created new Product ID ${newProd._id} for Variant: Barcode=${pBarcode}, Color=${pColor}`);

        // Re-assign pieces of this group to the new product
        const pieceIds = groupPieces.map(pc => pc._id);
        await InventoryPiece.updateMany({ _id: { $in: pieceIds } }, { productId: newProd._id });
        await PurchaseItem.updateMany({ productId: product._id, color: pColor }, { productId: newProd._id });
        console.log(`   Re-assigned ${groupPieces.length} pieces to new Product ID ${newProd._id}`);
      }
    }
  }

  console.log("Product separation completed!");
  await mongoose.disconnect();
}

separateProducts().catch(console.error);

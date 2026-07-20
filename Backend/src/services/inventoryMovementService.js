const InventoryMovement = require('../models/inventoryMovementModel');

/**
 * Reusable service to create inventory movement logs.
 */
exports.createMovement = async (tenantId, data) => {
  try {
    const {
      product,
      movementType,
      activity,
      quantity,
      warehouseId,
      warehouseName,
      sourceLocation,
      destinationLocation,
      batchId,
      referenceType,
      referenceId,
      referenceNumber,
      performedBy,
      remarks
    } = data;

    if (!product) {
      console.warn('InventoryMovementService: product is required for logging');
      return null;
    }

    const newStock = product.stock || 0;
    let previousStock = newStock;

    if (movementType === 'INBOUND') {
      previousStock = Math.max(0, newStock - quantity);
    } else if (movementType === 'OUTBOUND') {
      previousStock = newStock + quantity;
    }

    const movement = new InventoryMovement({
      tenantId,
      movementType,
      activity,
      productId: product._id,
      productName: product.name,
      productCode: product.productCode || `PRD-${product._id.toString().substring(Math.max(0, product._id.toString().length - 6)).toUpperCase()}`,
      sku: product.sku || 'N/A',
      barcode: product.barcode || '',
      batchId: batchId || '',
      warehouseId: warehouseId || '',
      warehouseName: warehouseName || '',
      sourceLocation: sourceLocation || '',
      destinationLocation: destinationLocation || '',
      quantity,
      previousStock,
      newStock,
      referenceType,
      referenceId: referenceId ? referenceId.toString() : '',
      referenceNumber: referenceNumber || '',
      performedBy: performedBy || 'System Admin',
      remarks: remarks || '',
    });

    await movement.save();
    return movement;
  } catch (error) {
    console.error('Failed to save inventory movement:', error.message);
    return null;
  }
};

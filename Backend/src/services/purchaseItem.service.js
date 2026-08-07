const ApiError = require('../helpers/ApiError');
const PurchaseItem = require('../models/purchase/PurchaseItem');
const InventoryPiece = require('../models/InventoryPiece');

class PurchaseItemService {
  /**
   * Create standalone purchase item
   */
  static async createPurchaseItem(data, userId, tenantId) {
    const item = await PurchaseItem.create({
      ...data,
      tenantId,
      createdBy: userId
    });
    return item;
  }

  /**
   * Get purchase item by ID
   */
  static async getPurchaseItemById(id, tenantId) {
    const item = await PurchaseItem.findOne({ _id: id, tenantId, isDeleted: false })
      .populate('productId purchaseBillId');
    if (!item) throw new ApiError(404, 'Purchase item not found.');
    return item;
  }

  /**
   * Update purchase item
   */
  static async updatePurchaseItem(id, data, tenantId) {
    const item = await PurchaseItem.findOneAndUpdate(
      { _id: id, tenantId, isDeleted: false },
      data,
      { new: true, runValidators: true }
    ).populate('productId');
    if (!item) throw new ApiError(404, 'Purchase item not found.');
    return item;
  }

  /**
   * Soft delete purchase item
   */
  static async deletePurchaseItem(id, userId, tenantId) {
    const item = await PurchaseItem.findOne({ _id: id, tenantId, isDeleted: false });
    if (!item) throw new ApiError(404, 'Purchase item not found.');

    // Check if any sold inventory pieces reference this item
    const soldPieces = await InventoryPiece.countDocuments({
      purchaseItemId: id,
      tenantId,
      sold: true,
      isDeleted: false
    });
    if (soldPieces > 0) {
      throw new ApiError(400, 'Cannot delete purchase item with sold inventory pieces.');
    }

    item.isDeleted = true;
    item.deletedBy = userId;
    item.deletedAt = new Date();
    await item.save();
    return item;
  }
}

module.exports = PurchaseItemService;

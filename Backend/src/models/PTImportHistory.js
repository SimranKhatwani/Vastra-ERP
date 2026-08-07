const mongoose = require('mongoose');
const baseSchemaPlugin = require('./plugins/baseSchema');

/**
 * PTImportHistory - Tracks each PT Excel import session for history & rollback
 */
const ptImportHistorySchema = new mongoose.Schema({
  fileName: { type: String, trim: true, default: 'manual-import' },
  totalRows: { type: Number, default: 0 },
  inserted: { type: Number, default: 0 },
  updated: { type: Number, default: 0 },
  skipped: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  errors: [{ row: Number, error: String }],
  importStatus: {
    type: String,
    enum: ['COMPLETED', 'FAILED', 'ROLLED_BACK'],
    default: 'COMPLETED'
  },
  importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  purchaseBillIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill' }],
  inventoryPieceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InventoryPiece' }],
  purchaseItemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseItem' }],
  rollbackAt: Date,
  rollbackBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

ptImportHistorySchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('PTImportHistory', ptImportHistorySchema);

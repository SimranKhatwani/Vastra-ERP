
const mongoose = require('mongoose');
const Alteration = require('./Backend/src/models/alteration/Alteration');
const AlterationItem = require('./Backend/src/models/alteration/AlterationItem');
const InventoryPiece = require('./Backend/src/models/InventoryPiece');
require('dotenv').config({ path: './Backend/.env' });
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const alts = await Alteration.find({}).sort({ createdAt: -1 }).limit(10);
    const altIds = alts.map(a => a._id);
    const items = await AlterationItem.find({ alterationId: { $in: altIds } }).populate('inventoryPieceId');
    for (const item of items) {
      console.log('AltID:', item.alterationId, 'Item:', item.pieceName, 'ItemUniqueCode:', item.uniqueCode, 'PieceUniqueCode:', item.inventoryPieceId ? item.inventoryPieceId.uniqueCode : 'NO_PIECE');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
});


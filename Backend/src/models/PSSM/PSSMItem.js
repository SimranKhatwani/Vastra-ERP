const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const pssmItemSchema = new mongoose.Schema({
  pssmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PSSM',
    required: true
  },
  saleBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleBill'
  },
  inventoryPieceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryPiece',
    required: false
  },
  pieceName: String,
  productName: String,
  barcode: String,
  uniqueCode: String,
  sku: String,
  size: String,
  color: String,
  salesmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salesman'
  },
  salesmanName: String,
  customerWaitingOption: {
    type: String,
    enum: ['Waiting in Store', 'Will Come Later', 'Home Delivery Required'],
    default: 'Will Come Later'
  },
  priority: {
    type: String,
    default: 'NORMAL' // 'HIGH' | 'NORMAL' | 'DELIVERY'
  },
  serviceType: {
    type: String,
    default: 'Alteration'
  },
  assignedTo: String,
  instructions: {
    type: String,
    default: 'Standard Service'
  },
  charge: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: 'PENDING_ASSIGNMENT' // 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'IN_PROGRESS' | 'READY' | 'COLLECTED'
  },
  alterationDetails: [String],
  measurements: mongoose.Schema.Types.Mixed,
  completedBy: String,
  completedAt: Date,
  collectedAt: Date,
  reassignedFromSalesmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salesman'
  },
  reassignedFromSalesmanName: String,
  reassignedReason: String,
  reassignedAt: Date
});

pssmItemSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('PSSMItem', pssmItemSchema);

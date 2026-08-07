const express = require('express');
const InventoryController = require('../controllers/inventory.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { tenantContext } = require('../middlewares/tenantContext.middleware');
const { auditLog } = require('../middlewares/auditLogger.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.use(authenticate, tenantContext);

router.post('/', authorize(PERMISSIONS.INVENTORY_CREATE), auditLog('CREATE_INVENTORY_PIECE', 'inventory'), InventoryController.createPiece);
router.get('/', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getInventoryPieces);
router.get('/search', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.searchInventory);
router.get('/stock-status', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getStockStatus);
router.get('/low-stock', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getLowStock);
router.get('/barcode/:barcode', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getPieceByBarcode);
router.get('/available', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getAvailable);
router.get('/ipn/:ipn', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getByIpn);
router.get('/unique-code/:code', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getByUniqueCode);
router.get('/design/:designNo', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getByDesign);
router.get('/item-code/:itemCode', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getByItemCode);
router.get('/status/:status', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getByStatus);
router.get('/warehouse/:warehouseId', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getByWarehouse);
router.get('/firm/:firmId', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getByFirm);
router.get('/lifecycle/:barcode', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getPieceLifecycle);
router.get('/:id', authorize(PERMISSIONS.INVENTORY_READ), InventoryController.getById);
router.post('/transfer', authorize(PERMISSIONS.INVENTORY_TRANSFER), auditLog('STOCK_TRANSFER', 'inventory'), InventoryController.transferStock);
router.patch('/adjust', authorize(PERMISSIONS.INVENTORY_ADJUST), auditLog('MANUAL_STOCK_ADJUSTMENT', 'inventory'), InventoryController.adjustStock);
router.post('/reserve/:barcode', authorize(PERMISSIONS.INVENTORY_UPDATE), auditLog('RESERVE_INVENTORY', 'inventory'), InventoryController.reservePiece);
router.post('/release/:barcode', authorize(PERMISSIONS.INVENTORY_UPDATE), auditLog('RELEASE_RESERVATION', 'inventory'), InventoryController.releaseReservation);

module.exports = router;

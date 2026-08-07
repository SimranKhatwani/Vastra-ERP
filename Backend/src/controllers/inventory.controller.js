const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const InventoryService = require('../services/inventory.service');

class InventoryController {
  static createPiece = asyncHandler(async (req, res) => {
    const piece = await InventoryService.createPiece(req.body, req.user.id, req.tenantId);
    return res.status(201).json(new ApiResponse(201, piece, 'Inventory piece created manually.'));
  });

  static getPieceByBarcode = asyncHandler(async (req, res) => {
    const { barcode } = req.params;
    const piece = await InventoryService.getPieceByBarcode(barcode, req.tenantId);
    return res.status(200).json(new ApiResponse(200, piece, 'Inventory piece retrieved.'));
  });

  // New query methods
  static getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const piece = await InventoryService.getPieceById(id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, piece, 'Inventory piece fetched by ID.'));
  });

  static getByIpn = asyncHandler(async (req, res) => {
    const { ipn } = req.params;
    const piece = await InventoryService.getPieceByIpn(ipn, req.tenantId);
    return res.status(200).json(new ApiResponse(200, piece, 'Inventory piece fetched by IPN.'));
  });

  static getByUniqueCode = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const piece = await InventoryService.getPieceByUniqueCode(code, req.tenantId);
    return res.status(200).json(new ApiResponse(200, piece, 'Inventory piece fetched by unique code.'));
  });

  static getByDesign = asyncHandler(async (req, res) => {
    const { designNo } = req.params;
    const pieces = await InventoryService.getPiecesByDesign(designNo, req.tenantId);
    return res.status(200).json(new ApiResponse(200, pieces, 'Inventory pieces fetched by design number.'));
  });

  static getByItemCode = asyncHandler(async (req, res) => {
    const { itemCode } = req.params;
    const pieces = await InventoryService.getPiecesByItemCode(itemCode, req.tenantId);
    return res.status(200).json(new ApiResponse(200, pieces, 'Inventory pieces fetched by item code.'));
  });

  static getByStatus = asyncHandler(async (req, res) => {
    const { status } = req.params;
    const pieces = await InventoryService.getPiecesByStatus(status, req.tenantId);
    return res.status(200).json(new ApiResponse(200, pieces, 'Inventory pieces fetched by status.'));
  });

  static getByWarehouse = asyncHandler(async (req, res) => {
    const { warehouseId } = req.params;
    const pieces = await InventoryService.getPiecesByWarehouse(warehouseId, req.tenantId);
    return res.status(200).json(new ApiResponse(200, pieces, 'Inventory pieces fetched by warehouse.'));
  });

  static getByFirm = asyncHandler(async (req, res) => {
    const { firmId } = req.params;
    const pieces = await InventoryService.getPiecesByFirm(firmId, req.tenantId);
    return res.status(200).json(new ApiResponse(200, pieces, 'Inventory pieces fetched by firm.'));
  });

  static getAvailable = asyncHandler(async (req, res) => {
    const pieces = await InventoryService.getAvailablePieces(req.tenantId);
    return res.status(200).json(new ApiResponse(200, pieces, 'Available inventory pieces fetched.'));
  });

  static searchInventory = asyncHandler(async (req, res) => {
    const { pieces, pagination } = await InventoryService.searchInventory(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, pieces, 'Inventory search results retrieved.', pagination));
  });

  static getInventoryPieces = asyncHandler(async (req, res) => {
    const { pieces, pagination } = await InventoryService.getInventoryPieces(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, pieces, 'Inventory pieces list retrieved.', pagination));
  });

  static reservePiece = asyncHandler(async (req, res) => {
    const { barcode } = req.params;
    const piece = await InventoryService.reservePiece(barcode, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, piece, 'Inventory piece reserved.'));
  });

  static releaseReservation = asyncHandler(async (req, res) => {
    const { barcode } = req.params;
    const piece = await InventoryService.releaseReservation(barcode, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, piece, 'Reservation released.'));
  });

  static transferStock = asyncHandler(async (req, res) => {
    const { barcodes, warehouseId } = req.body;
    const result = await InventoryService.transferStock(barcodes, warehouseId, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Stock transferred successfully.'));
  });

  static adjustStock = asyncHandler(async (req, res) => {
    const { barcode, status, reason } = req.body;
    const piece = await InventoryService.adjustStock(barcode, status, reason, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, piece, 'Stock adjusted successfully.'));
  });

  static getStockStatus = asyncHandler(async (req, res) => {
    const summary = await InventoryService.getStockSummary(req.tenantId, req.query.type || 'warehouse');
    return res.status(200).json(new ApiResponse(200, summary, 'Stock status summary retrieved.'));
  });

  static getLowStock = asyncHandler(async (req, res) => {
    const lowStock = await InventoryService.getLowStockProducts(req.tenantId, req.query.threshold || 5);
    return res.status(200).json(new ApiResponse(200, lowStock, 'Low stock items fetched.'));
  });

  static getPieceLifecycle = asyncHandler(async (req, res) => {
    const { barcode } = req.params;
    const history = await InventoryService.getPieceLifecycle(barcode, req.tenantId);
    return res.status(200).json(new ApiResponse(200, history, 'Piece lifecycle history retrieved.'));
  });
}

module.exports = InventoryController;

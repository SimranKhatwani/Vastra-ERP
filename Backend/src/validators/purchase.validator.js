const Joi = require('joi');

const stringOrObject = Joi.alternatives().try(Joi.string().allow('', null), Joi.object().unknown(true), Joi.number()).optional();

const createPurchaseBillSchema = Joi.object({
  id: stringOrObject,
  _id: stringOrObject,
  billNo: Joi.string().allow('', null).optional(),
  poNo: Joi.string().allow('', null).optional(),
  invoiceNo: Joi.string().allow('', null).optional(),
  billDate: Joi.alternatives().try(Joi.date(), Joi.string().allow('', null), Joi.number()).optional(),
  date: Joi.alternatives().try(Joi.date(), Joi.string().allow('', null), Joi.number()).optional(),
  vendorId: stringOrObject,
  supplierId: stringOrObject,
  supplierName: Joi.string().allow('', null).optional(),
  vendorName: Joi.string().allow('', null).optional(),
  vendorGst: Joi.string().allow('', null).optional(),
  vendorDetails: Joi.object().unknown(true).optional(),
  vendor: stringOrObject,
  firmId: stringOrObject,
  firm: stringOrObject,
  firmName: Joi.string().allow('', null).optional(),
  warehouseId: stringOrObject,
  warehouse: stringOrObject,
  discount: Joi.number().allow(null, '').optional().default(0),
  grandDisc: Joi.number().allow(null, '').optional().default(0),
  gst: Joi.number().allow(null, '').optional().default(0),
  subTotal: Joi.number().allow(null, '').optional(),
  gstTotal: Joi.number().allow(null, '').optional(),
  grandTotal: Joi.number().allow(null, '').optional(),
  totalAmount: Joi.number().allow(null, '').optional(),
  status: Joi.string().allow('', null).optional(),
  items: Joi.array().items(Joi.any()).optional(),
  billItems: Joi.array().items(Joi.any()).optional(),
  products: Joi.array().items(Joi.any()).optional(),
  rows: Joi.array().items(Joi.any()).optional(),
  remarks: Joi.string().allow('', null).optional(),
  transport: Joi.string().allow('', null).optional(),
  irnNo: Joi.string().allow('', null).optional(),
  skipApiPost: Joi.boolean().optional()
}).unknown(true);

module.exports = {
  createPurchaseBillSchema
};

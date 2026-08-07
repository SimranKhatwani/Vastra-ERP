const Joi = require('joi');

const createPurchaseBillSchema = Joi.object({
  billNo: Joi.string().allow('', null).optional(),
  poNo: Joi.string().allow('', null).optional(),
  invoiceNo: Joi.string().allow('', null).optional(),
  billDate: Joi.date().optional(),
  date: Joi.date().optional(),
  vendorId: Joi.string().allow('', null).optional(),
  supplierId: Joi.string().allow('', null).optional(),
  supplierName: Joi.string().allow('', null).optional(),
  vendorName: Joi.string().allow('', null).optional(),
  firmId: Joi.string().allow('', null).optional(),
  warehouseId: Joi.string().allow('', null).optional(),
  discount: Joi.number().min(0).default(0),
  gst: Joi.number().min(0).default(0),
  subTotal: Joi.number().optional(),
  gstTotal: Joi.number().optional(),
  grandTotal: Joi.number().optional(),
  totalAmount: Joi.number().optional(),
  status: Joi.string().optional(),
  items: Joi.array().items(Joi.object().unknown(true)).optional(),
  billItems: Joi.array().items(Joi.object().unknown(true)).optional(),
  products: Joi.array().items(Joi.object().unknown(true)).optional(),
  rows: Joi.array().items(Joi.object().unknown(true)).optional(),
  remarks: Joi.string().allow('', null).optional()
}).unknown(true);

module.exports = {
  createPurchaseBillSchema
};

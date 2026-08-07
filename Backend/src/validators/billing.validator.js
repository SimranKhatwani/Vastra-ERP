const Joi = require('joi');
const { PAYMENT_MODE } = require('../constants/status');

const createSaleBillSchema = Joi.object({
  billNo: Joi.string().allow('', null),
  billDate: Joi.date().default(Date.now),
  customerId: Joi.string().allow('', null),
  customerPhone: Joi.string().allow('', null),
  customerName: Joi.string().allow('', null),
  firmId: Joi.string().allow('', null),
  warehouseId: Joi.string().allow('', null),
  salesmanId: Joi.string().allow('', null),
  items: Joi.array().items(Joi.object().unknown(true)).optional(),
  barcodes: Joi.array().items(
    Joi.object({
      barcode: Joi.string().allow('', null),
      sellingPrice: Joi.number().min(0).default(0),
      discountAmount: Joi.number().min(0).default(0)
    }).unknown(true)
  ).optional(),
  paymentTransactions: Joi.array().items(
    Joi.object({
      mode: Joi.string().allow('', null).default('CASH'),
      amount: Joi.number().min(0).default(0),
      referenceNo: Joi.string().allow('', null),
      notes: Joi.string().allow('', null)
    }).unknown(true)
  ).optional(),
  remarks: Joi.string().allow('', null)
}).unknown(true);

module.exports = {
  createSaleBillSchema
};

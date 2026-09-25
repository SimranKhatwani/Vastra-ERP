const Joi = require('joi');

const createProductSchema = Joi.object({
  itemCode: Joi.string().required().trim(),
  designNo: Joi.string().required().trim(),
  itemName: Joi.string().required().trim(),
  subItem: Joi.string().allow('', null),
  brandId: Joi.string().hex().length(24).required(),
  categoryId: Joi.string().hex().length(24).required(),
  subCategoryId: Joi.string().hex().length(24).allow(null, ''),
  gender: Joi.string().valid('MEN', 'WOMEN', 'KIDS', 'UNISEX').default('UNISEX'),
  topBottomSet: Joi.string().valid('TOP', 'BOTTOM', 'SET', 'ACCESSORY', 'OTHER').default('TOP'),
  description: Joi.string().allow('', null),
  hsnId: Joi.string().hex().length(24).allow(null, ''),
  gstId: Joi.string().hex().length(24).allow(null, ''),
  gstOnSalePrice: Joi.number().min(0).allow(null),
  defaultMRP: Joi.number().min(0).required()
});

module.exports = {
  createProductSchema
};

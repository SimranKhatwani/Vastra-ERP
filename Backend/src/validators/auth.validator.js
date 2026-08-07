const Joi = require('joi');

const registerTenantSchema = Joi.object({
  companyName: Joi.string().required().trim(),
  code: Joi.string().required().uppercase().trim(),
  email: Joi.string().email().required().lowercase().trim(),
  phone: Joi.string().required().trim(),
  address: Joi.alternatives().try(
    Joi.string().allow('', null),
    Joi.object({
      street: Joi.string().allow('', null),
      city: Joi.string().allow('', null),
      state: Joi.string().allow('', null),
      pincode: Joi.string().allow('', null),
      country: Joi.string().allow('', null)
    })
  ).optional(),
  ownerName: Joi.string().required().trim(),
  ownerEmail: Joi.string().email().required().lowercase().trim(),
  ownerPassword: Joi.string().min(6).required(),
  ownerPhone: Joi.string().required().trim()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required(),
  tenantCode: Joi.string().optional().uppercase().trim(),
  businessId: Joi.string().optional().uppercase().trim()
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

module.exports = {
  registerTenantSchema,
  loginSchema,
  changePasswordSchema
};

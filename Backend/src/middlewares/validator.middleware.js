const ApiError = require('../helpers/ApiError');

const validate = (schema) => {
  return (req, res, next) => {
    if (!schema) return next();

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      throw new ApiError(400, 'Validation Error', errorMessages);
    }

    req.body = value;
    next();
  };
};

module.exports = {
  validate
};

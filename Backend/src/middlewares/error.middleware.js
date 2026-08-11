const ApiError = require('../helpers/ApiError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.name === 'ValidationError' ? 400 : 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue).join(', ');
    require('fs').writeFileSync('duplicate_key_error.log', JSON.stringify(err.keyValue));
    error = new ApiError(400, `Duplicate value entered for: ${fields}. Must be unique.`);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    error = new ApiError(400, `Invalid ID format for field: ${err.path}`);
  }

  const response = {
    success: false,
    message: error.message,
    data: null,
    pagination: null,
    errors: error.errors || [error.message],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  logger.error(`[API ERROR] ${req.method} ${req.originalUrl} - ${error.statusCode} - ${error.message}`);

  return res.status(error.statusCode).json(response);
};

module.exports = errorHandler;

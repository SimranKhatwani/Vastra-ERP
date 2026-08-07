/**
 * Standardized API Response Wrapper
 */

class ApiResponse {
  constructor(statusCode, data, message = "Success", pagination = null, errors = []) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data !== undefined ? data : null;
    this.pagination = pagination || null;
    this.errors = errors || [];
  }
}

module.exports = ApiResponse;

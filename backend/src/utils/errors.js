/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'APIError';
  }
}

/**
 * Custom error class for validation errors
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
    this.name = 'ValidationError';
  }
}

module.exports = {
  APIError,
  ValidationError
};

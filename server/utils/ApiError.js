/**
 * Operational error with an attached HTTP status code. Throw this from
 * controllers for predictable, client-facing failures.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    if (errors) this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;

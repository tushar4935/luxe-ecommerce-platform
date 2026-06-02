/**
 * 404 handler — forwards unknown routes to the global error handler.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handler. Normalizes Mongoose / JWT / generic errors into a
 * consistent JSON envelope: { success, message, errors?, stack? }.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found. Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose validation error → field-level messages
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = 'Validation failed';
  }

  // Duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for "${field}". Please use another value.`;
    errors = [{ field, message }];
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  if (process.env.NODE_ENV === 'development') payload.stack = err.stack;

  res.status(statusCode).json(payload);
};

module.exports = { notFound, errorHandler };

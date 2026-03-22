const { errorResponse } = require('../utils/response');

/**
 * Centralized error handling middleware
 */
const errorHandler = (err, _req, res, _next) => {
  console.error('Error:', err);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json(
      errorResponse('DUPLICATE_KEY', `${field} already exists`, {
        field,
      })
    );
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json(errorResponse('VALIDATION_ERROR', messages));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse('INVALID_TOKEN', 'Invalid token'));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(errorResponse('TOKEN_EXPIRED', 'Token has expired'));
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json(errorResponse(code, message));
};

module.exports = errorHandler;

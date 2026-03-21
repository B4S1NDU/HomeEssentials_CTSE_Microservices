const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

/**
 * Error handling middleware
 */
const errorHandler = (error, req, res, next) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errors.array()[0].msg,
        details: errors.array(),
      },
    });
  }

  // Handle custom errors
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  const message = error.message || 'An unexpected error occurred';

  console.error(`[${code}] ${message}`);

  res.status(statusCode).json(
    errorResponse(
      {
        code,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
      message,
      statusCode
    )
  );
};

module.exports = errorHandler;
